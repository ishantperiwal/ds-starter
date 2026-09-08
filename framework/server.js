'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.md':'text/plain; charset=utf-8'};
function inside(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) throw Error('Path outside mount');
  return target;
}
function configuration(root = ROOT) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'studio.config.json'), 'utf8'));
  if (config.contractVersion !== 1) throw Error('Unsupported project contractVersion');
  return config;
}
function createServer(options = {}) {
  const root = options.root || ROOT, config = configuration(root);
  const project = inside(root, config.project), examples = inside(root, config.examples);
  const framework = path.join(root, 'framework');
  let board;
  const json = (res, status, value) => {res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      // No general filesystem/API access. Board writes are the sole persistence endpoint.
      if (pathname === '/api/board' || /^\/images\/[a-f0-9-]+\.png$/.test(pathname)) {
        if (!board) {
          board = require('./moodboard/server.js').createBoardHandler({store:path.join(root,'.moodboard-data')});
        }
        return await board(req, res);
      }
      if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'Read-only endpoint'});
      if (pathname === '/api/studio') return json(res,200,{name:config.name,defaultProfile:config.defaultProfile,version:JSON.parse(fs.readFileSync(path.join(framework,'version.json'),'utf8'))});
      let base, rel;
      if (pathname === '/' || pathname === '/design-system/' || pathname === '/design-system/index.html') {base=framework;rel='workbench/index.html';}
      else if (pathname === '/moodboard' || pathname === '/moodboard/') {base=framework;rel='moodboard/index.html';}
      else if (pathname.startsWith('/moodboard/')) {base=framework;rel=pathname.slice(1);}
      else if (pathname.startsWith('/framework/')) {base=framework;rel=pathname.slice('/framework/'.length);}
      else if (pathname.startsWith('/demo/design-system/')) {base=examples;rel=pathname.slice('/demo/design-system/'.length);}
      else if (pathname.startsWith('/demo/screens/')) {base=examples;rel='screens/'+pathname.slice('/demo/screens/'.length);}
      else if (pathname === '/design-system/spacing-inspector.js') {base=framework;rel='spacing-inspector.js';}
      else if (pathname.startsWith('/design-system/')) {base=path.join(project,'design-system');rel=pathname.slice('/design-system/'.length);}
      else if (pathname.startsWith('/screens/')) {base=path.join(project,'screens');rel=pathname.slice('/screens/'.length);}
      else return json(res,404,{error:'No registered mount for this URL'});
      if (rel.split('/').some(segment=>segment.startsWith('.'))) return json(res,403,{error:'Hidden files are not served'});
      let file=inside(base,rel);
      if (!fs.existsSync(file)) return json(res,404,{error:'File not found'});
      // Prevent symlinks from escaping a public mount.
      file=fs.realpathSync(file);
      const realBase=fs.realpathSync(base);
      if(file!==realBase&&!file.startsWith(realBase+path.sep))return json(res,403,{error:'Symlink outside mount'});
      if (!fs.statSync(file).isFile()) return json(res,404,{error:'Not a file'});
      res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
    } catch(error) { if(!res.headersSent)json(res,400,{error:error.message});else res.end(); }
  });
}
function start() {
  const config=configuration();
  const port=Number(process.argv[2]||config.port||8020);
  const server=createServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Design System Studio ${port}\nWorkbench: http://localhost:${port}/\nInspector sandbox: http://localhost:${port}/demo/screens/record.html?ds=true\nProject sources: ${path.join(ROOT,config.project)}`));
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  return server;
}
module.exports={createServer,configuration,inside,start};
if(require.main===module)start();
