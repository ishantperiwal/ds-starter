#!/usr/bin/env node
// Local reference persistence, scoped to one studio instance.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const layout = require('./layout');
function createBoardHandler({store}) {
const STORE = path.resolve(store);
fs.mkdirSync(path.join(STORE, 'images'), { recursive: true });
const stateFile = path.join(STORE, 'board.json');
const uid = () => crypto.randomUUID();
const undoRecords = new Map();
let board = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {
  revision: 0,
  buckets: ['Layouts & structure', 'Typography & voice', 'Colour & atmosphere', 'Components & details', 'Interactions & flows', 'North star'].map((name, i) => ({ id: uid(), name, x: (i % 3) * 580, y: Math.floor(i / 3) * 540 })),
  images: []
};
function save(next) { next.revision = board.revision + 1; fs.writeFileSync(stateFile + '.tmp', JSON.stringify(next, null, 2)); fs.renameSync(stateFile + '.tmp', stateFile); board = next; }
for(const i of board.images){if(!i.aspect){try{const png=fs.readFileSync(path.join(STORE,'images',i.id+'.png'));i.aspect=png.readUInt32BE(20)/png.readUInt32BE(16);}catch{i.aspect=.75;}}}
layout(board);
if (!fs.existsSync(stateFile)) save(board);
function json(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
const clean = (v, max = 200) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const handler = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/board' && req.method === 'GET') return json(res, 200, board);
    if (url.pathname === '/api/board' && req.method === 'POST') {
      // Require same-origin JSON; cross-origin browser writes are rejected.
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Use this board’s own page to make changes.' });
      if (!String(req.headers['content-type']).startsWith('application/json')) return json(res, 415, { error: 'Expected JSON.' });
      let bytes = 0, chunks = [];
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 3 * 1024 * 1024) { json(res, 413, { error: 'Image is too large. Choose an image up to 2 MB.' }); return; } chunks.push(chunk); }
      const op = JSON.parse(Buffer.concat(chunks).toString());
      // Read current state after body arrival, then synchronously commit one narrow mutation.
      const next = structuredClone(board);
      const bucket = next.buckets.find(b => b.id === op.bucketId);
      const item = next.images.find(i => i.id === op.id);
      if (op.type === 'undo') {
        const changes = undoRecords.get(op.token);
        if (!changes) return json(res, 409, { error: 'This undo has expired.' });
        for (const c of changes) {
          const current = next[c.collection].find(v => v.id === c.id);
          if (JSON.stringify(current) !== JSON.stringify(c.after)) return json(res, 409, { error: 'This item changed since your edit. Undo was skipped to preserve newer changes.' });
        }
        for (const c of changes) {
          next[c.collection] = next[c.collection].filter(v => v.id !== c.id);
          if (c.before) next[c.collection].splice(Math.min(c.index, next[c.collection].length), 0, c.before);
        }
        if (next.images.some(i => i.bucketId && !next.buckets.some(b => b.id === i.bucketId))) return json(res, 409, { error: 'The section has newer references. Move them before undoing its creation.' });
        layout(next); save(next); undoRecords.delete(op.token); return json(res, 200, board);
      } else if (op.type === 'addBucket') {
        const n = next.buckets.length;
        next.buckets.push({ id: uid(), name: clean(op.name) || 'Untitled bucket', x: Number.isFinite(op.x) ? op.x : n % 3 * 580, y: Number.isFinite(op.y) ? op.y : Math.floor(n / 3) * 540 });
      } else if (op.type === 'editBucket' && bucket) {
        if (typeof op.name === 'string') bucket.name = clean(op.name) || 'Untitled bucket';
        for (const k of ['x', 'y', 'width', 'height']) if (Number.isFinite(op[k])) bucket[k] = Math.max(-100000, Math.min(100000, op[k]));
      } else if (op.type === 'deleteBucket' && bucket) {
        if (!op.includeImages && next.images.some(i => i.bucketId === bucket.id)) return json(res, 409, { error: 'Move or remove the references before deleting this bucket.' });
        next.buckets = next.buckets.filter(b => b.id !== bucket.id);
        if (op.includeImages) next.images = next.images.filter(i => i.bucketId !== bucket.id);
      } else if (op.type === 'addImage' && (bucket || op.bucketId === null)) {
        if (typeof op.data !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(op.data)) throw Error('Use a PNG image.');
        const buffer = Buffer.from(op.data.split(',')[1], 'base64');
        if (buffer.length > 2 * 1024 * 1024 || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error('Image must be a valid PNG of 2 MB or less.');
        const id = uid();
        fs.writeFileSync(path.join(STORE, 'images', id + '.png'), buffer);
        next.images.push({ id, bucketId: bucket?.id || null, title: clean(op.title) || 'Untitled reference', note: '', source: '', x: Number.isFinite(op.x) ? op.x : 24, y: Number.isFinite(op.y) ? op.y : 60, width: 260, row: bucket ? Math.max(0,...next.images.filter(i=>i.bucketId===bucket.id).map(i=>i.row||0)) : 0, order: next.images.length, aspect: buffer.length>=24 ? Math.max(.05,Math.min(20,buffer.readUInt32BE(20)/buffer.readUInt32BE(16))) : .75, url: '/images/' + id + '.png' });
      } else if (op.type === 'editImage' && item) {
        for (const k of ['x','y','width','row','order']) if (Number.isFinite(op[k])) item[k] = op[k];
        for (const k of ['title', 'note', 'source']) if (typeof op[k] === 'string') item[k] = clean(op[k], k === 'note' ? 5000 : 1000);
        if ('bucketId' in op) { if (op.bucketId !== null && !bucket) throw Error('Bucket no longer exists.'); item.bucketId = bucket?.id || null; }
      } else if (op.type === 'deleteImage' && item) {
        next.images = next.images.filter(i => i.id !== item.id);
        // Retain original image on disk to allow recovery from accidental removals.
      } else throw Error('That item no longer exists, or the action is invalid.');
      layout(next);
      const changes = [];
      for (const collection of ['buckets','images']) {
        const ids = new Set([...board[collection], ...next[collection]].map(v => v.id));
        for (const id of ids) {
          const before = board[collection].find(v => v.id === id), after = next[collection].find(v => v.id === id);
          if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({collection,id,before,after,index:board[collection].findIndex(v=>v.id===id)});
        }
      }
      save(next);
      const undoToken = uid(); undoRecords.set(undoToken, changes);
      if (undoRecords.size > 200) undoRecords.delete(undoRecords.keys().next().value);
      return json(res, 200, {...board, undoToken});
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
    let file;
    if (url.pathname === '/' || url.pathname === '/moodboard') file = path.join(__dirname, 'index.html');
    else if (['/moodboard/app.js', '/moodboard/style.css', '/moodboard/layout.js'].includes(url.pathname)) file = path.join(__dirname, path.basename(url.pathname));
    else if (['/app.js', '/style.css'].includes(url.pathname)) file = path.join(__dirname, url.pathname.slice(1));
    else if (/^\/images\/[a-f0-9-]+\.png$/.test(url.pathname)) file = path.join(STORE, url.pathname.slice(1));
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  } catch (e) { json(res, 400, { error: e.message || 'Could not save. Please try again.' }); }
};
return handler;
}
module.exports = {createBoardHandler};
// One supported launch path: use the studio's localhost server and asset mounts.
if (require.main === module) require('../server').start();
