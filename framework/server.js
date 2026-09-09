'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {ROOT, configuration, runtimePaths, inside, within} = require('./configuration');
const {publicFile} = require('./public-files');
const TYPES = {'.html':'text/html; charset=utf-8','.htm':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.avif':'image/avif','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.webm':'video/webm','.md':'text/plain; charset=utf-8'};
function createServer(options = {}) {
  const paths = runtimePaths(options.root || ROOT, options.configFile);
  const {root, config} = paths, framework = path.join(root, 'framework');
  let board;
  const json = (res, status, value) => {
    res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify(value));
  };
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname === '/api/board' || /^\/images\/[a-f0-9-]+\.png$/.test(pathname)) {
        if (!board) board = require('./moodboard/server').createBoardHandler({store: paths.board});
        return await board(req, res);
      }
      if (pathname === '/api/search-tags') return await require('./search-tags').handle(req,res,paths.content);
      if (pathname === '/api/icons') return await require('./icon-import').handle(req,res,paths.content);
      if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'Read-only endpoint'});
      if (pathname === '/api/studio') return json(res,200,{
        name: config.name, defaultProfile: config.defaultProfile,
        version: JSON.parse(fs.readFileSync(path.join(framework,'version.json'),'utf8')),
        attachment: paths.external ? {
          content: paths.content, appRoot: paths.app,
          instructions: '/framework/AGENT-WORKFLOW.md', configFile: paths.file
        } : null
      });
      let file, rel;
      if (['/','/design-system/','/design-system/index.html'].includes(pathname)) rel = 'workbench/index.html';
      else if (['/moodboard','/moodboard/'].includes(pathname)) rel = 'moodboard/index.html';
      else if (pathname.startsWith('/moodboard/')) rel = pathname.slice(1);
      else if (pathname.startsWith('/framework/')) rel = pathname.slice('/framework/'.length);
      else if (pathname === '/design-system/spacing-inspector.js') rel = 'spacing-inspector.js';
      if (rel !== undefined) {
        if (rel.split('/').some(part=>part.startsWith('.'))) return json(res,403,{error:'Hidden files are not served'});
        file = inside(framework, rel);
        if (!fs.existsSync(file)) return json(res,404,{error:'File not found'});
        file = fs.realpathSync(file);
        if (!within(fs.realpathSync(framework), file)) return json(res,403,{error:'Symlink outside mount'});
      } else {
        file = publicFile(paths, pathname);
        // Support root-relative static assets in existing HTML without moving/re-writing them.
        // Tool/API routes remain reserved; data/config files are not exposed by this fallback.
        if (!file && paths.app && !/^\/(?:api|framework|demo|design-system|moodboard|images|app)(?:\/|$)/.test(pathname)) {
          file = publicFile(paths, '/app' + pathname);
        }
      }
      if (!file || !fs.statSync(file).isFile()) return json(res,404,{error:'No public file at this URL'});
      res.writeHead(200,{'Content-Type':TYPES[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      if (req.method === 'HEAD') res.end();
      else fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    } catch(error) {if (!res.headersSent) json(res,400,{error:error.message}); else res.end();}
  });
}
function start(options = {}) {
  const paths = runtimePaths(options.root || ROOT, options.configFile);
  const port = Number(options.port || paths.config.port || 8020);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Port must be between 1 and 65535');
  const server = createServer(options);
  server.listen(port,'127.0.0.1',()=>console.log([
    'Design System Studio',
    'Workbench: http://localhost:' + port + '/',
    'DS content: ' + paths.content,
    paths.app ? 'Existing screens: http://localhost:' + port + '/app/ (read from ' + paths.app + ')' : 'Mode: tool-development sandbox'
  ].join('\n')));
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  return server;
}
module.exports = {createServer, configuration, inside, start};
if (require.main === module) start({port: process.argv[2]});
