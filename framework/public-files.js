'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {inside, within} = require('./configuration');
const WEB = new Set(['.html','.htm','.css','.js','.mjs','.svg','.png','.jpg','.jpeg','.gif','.webp','.avif','.ico','.woff','.woff2','.ttf','.otf','.mp4','.webm','.map']);
// Source maps can embed arbitrary source; only serve normal browser resources by default.
WEB.delete('.map');
function publicFile(paths, pathname) {
  let base, rel, appFile = false;
  if (pathname.startsWith('/demo/design-system/')) {
    base = paths.examples; rel = pathname.slice('/demo/design-system/'.length);
  } else if (pathname.startsWith('/demo/screens/')) {
    base = paths.examples; rel = 'screens/' + pathname.slice('/demo/screens/'.length);
  } else if (pathname.startsWith('/design-system/')) {
    base = paths.content; rel = pathname.slice('/design-system/'.length);
  } else if (pathname.startsWith('/screens/') && paths.screens) {
    base = paths.screens; rel = pathname.slice('/screens/'.length);
  } else if (pathname.startsWith('/app/') && paths.app) {
    base = paths.app; rel = pathname.slice('/app/'.length); appFile = true;
  } else return null;
  if (rel.split('/').some(part => part.startsWith('.'))) throw Error('Hidden files are not served');
  let file = inside(base, rel);
  if (!fs.existsSync(file)) return null;
  file = fs.realpathSync(file);
  if (!within(fs.realpathSync(base), file)) throw Error('Symlink outside mount');
  if (fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return null;
    file = fs.realpathSync(file);
    if (!within(fs.realpathSync(base), file)) throw Error('Symlink outside mount');
  }
  if (!fs.statSync(file).isFile()) return null;
  if (appFile) {
    if (!WEB.has(path.extname(file).toLowerCase())) return null;
    const parts = path.relative(base, file).split(path.sep);
    if (parts.some(part => part.startsWith('.') || ['node_modules','vendor'].includes(part))) return null;
    if (within(paths.root, file) || within(paths.content, file)) return null;
  }
  return file;
}
function catalogFile(paths, relative, profile = 'project') {
  if (typeof relative !== 'string' || /^(?:[a-z]+:|\/|\\)/i.test(relative)) return null;
  const url = new URL(relative, 'http://studio.local/' + (profile === 'demo' ? 'demo/' : '') + 'design-system/');
  if (profile === 'demo' && !url.pathname.startsWith('/demo/')) return null;
  if (profile !== 'demo' && !/^\/(?:design-system|app|screens)\//.test(url.pathname)) return null;
  return publicFile(paths, decodeURIComponent(url.pathname));
}
module.exports = {publicFile, catalogFile};
