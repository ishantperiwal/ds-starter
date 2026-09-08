'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {validate,validateSchema}=require('../validate');
const {fileMap,writeLock,release}=require('../release');
const {plan,apply}=require('../update');
const {createServer}=require('../server');
const ROOT=path.resolve(__dirname,'../..');
const vm=require('node:vm');
test('catalogs, references, tokens and scripts validate',()=>assert.deepEqual(validate(ROOT).errors,[]));
test('schema rejects malformed component contracts',()=>{
  const schema=JSON.parse(fs.readFileSync(path.join(ROOT,'framework/catalog.schema.json'),'utf8'));
  const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'project/design-system/registry.json'),'utf8'));
  catalog.components=[{name:'Unregistered styling'}];
  const errors=validateSchema(catalog,schema);assert(errors.some(e=>e.includes('missing anatomy')));assert(errors.some(e=>e.includes('missing class')));
});
test('portable anatomy bootstraps without Titan workbench DOM',()=>{
  const body={};
  const context={window:{addEventListener(){}},document:{body,querySelector(){return null;},querySelectorAll(){return [];},createTreeWalker(){return {nextNode(){return false;}};},getElementById(){return null;},addEventListener(){}},MutationObserver:class{disconnect(){}observe(target){assert(target);}},NodeFilter:{SHOW_TEXT:4},requestAnimationFrame(){},setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'framework/anatomy.js'),'utf8'),context);
  assert.equal(typeof context.window.wbAnatomy.mount,'function');
});
test('sandbox specimens use real renderers and every registered preview part exists',async()=>{
  const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'framework/examples/registry.json'),'utf8'));
  const doc={readyState:'loading',addEventListener(){},querySelectorAll(){return [];}};
  const libraries={document:doc};libraries.window=libraries;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'framework/examples/components/icon.js'),'utf8'),libraries);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'framework/examples/components/visualization.js'),'utf8'),libraries);
  assert(libraries.dsIcon.builtins().length>10);
  for(const entry of [...registry.components,...registry.compositions]){
    const body={innerHTML:''};const host={querySelector(){return body;}};
    const context={...libraries,URLSearchParams,location:{search:new URL(entry.preview,'http://localhost/').search},document:{getElementById(){return host;}},fetch:async()=>({json:async()=>registry}),wbAnatomy:{mount(){}}};
    vm.runInNewContext(fs.readFileSync(path.join(ROOT,'framework/examples/screens/specimen.js'),'utf8'),context);await Promise.resolve();
    assert(!body.innerHTML.includes('No specimen provider'),entry.id);assert(body.innerHTML.includes(entry.class),entry.class);
  }
  for(const entry of registry.visualizations){
    const target={innerHTML:''},size={value:'md'};
    const context={...libraries,URLSearchParams,location:{search:'?part='+entry.id},document:{getElementById(id){return id==='chart'?target:size;}}};
    vm.runInNewContext(fs.readFileSync(path.join(ROOT,'framework/examples/screens/charts.js'),'utf8'),context);assert(target.innerHTML.includes('ds-viz'),entry.id);
    size.value='sm';size.onchange();assert(target.innerHTML.includes('ds-viz--sm'));
  }
});
test('update preserves project files, backs up old tools, refuses local edits and corrupt releases',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ds-studio-update-'));
  try{
    const consumer=path.join(temp,'consumer'),upstream=path.join(temp,'upstream'),bundle=path.join(temp,'release');
    for(const dir of [consumer,upstream]){fs.mkdirSync(path.join(dir,'framework'),{recursive:true});fs.writeFileSync(path.join(dir,'framework/version.json'),JSON.stringify({version:'0.1.0',contractVersion:1}));fs.writeFileSync(path.join(dir,'framework/tool.js'),'original');writeLock(dir);}
    fs.mkdirSync(path.join(consumer,'project'));fs.writeFileSync(path.join(consumer,'project/tokens.css'),'project-owned');const projectBefore=fileMap(path.join(consumer,'project'));
    fs.writeFileSync(path.join(upstream,'framework/tool.js'),'updated');fs.writeFileSync(path.join(upstream,'framework/version.json'),JSON.stringify({version:'0.1.1',contractVersion:1}));writeLock(upstream);release(bundle,upstream);
    assert.equal(plan(bundle,consumer).manifest.version,'0.1.1');assert.equal(fs.readFileSync(path.join(consumer,'framework/tool.js'),'utf8'),'original');
    const result=apply(bundle,consumer);assert.equal(fs.readFileSync(path.join(consumer,'framework/tool.js'),'utf8'),'updated');assert.equal(fs.readFileSync(path.join(result.backup,'framework/tool.js'),'utf8'),'original');assert.deepEqual(fileMap(path.join(consumer,'project')),projectBefore);
    fs.writeFileSync(path.join(consumer,'framework/tool.js'),'local edit');assert.throws(()=>plan(bundle,consumer),/Local framework edits/);
    fs.writeFileSync(path.join(bundle,'framework/tool.js'),'tampered');assert.throws(()=>plan(bundle,consumer),/hash verification/);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('moodboard stores are isolated, persistent, undoable and reject cross-origin writes',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ds-studio-board-')),servers=[];
  try{
    const urls=[];
    for(const name of ['first','second']){
      const root=path.join(temp,name);fs.mkdirSync(root);
      fs.copyFileSync(path.join(ROOT,'studio.config.json'),path.join(root,'studio.config.json'));
      fs.mkdirSync(path.join(root,'framework'));
      fs.copyFileSync(path.join(ROOT,'framework/version.json'),path.join(root,'framework/version.json'));
      const server=createServer({root});servers.push(server);
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      urls.push('http://127.0.0.1:'+server.address().port+'/api/board');
    }
    const original=await (await fetch(urls[0])).json(),other=await (await fetch(urls[1])).json();
    assert.notEqual(original.buckets[0].id,other.buckets[0].id);
    const post=(url,body,headers={})=>fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
    const edit={type:'addBucket',name:'Disposable test section'};
    assert.equal((await post(urls[0],edit,{origin:'https://example.invalid'})).status,403);
    assert.equal((await post(urls[0],edit,{'content-type':'text/plain'})).status,415);
    const response=await post(urls[0],edit);assert.equal(response.status,200);const changed=await response.json();
    assert.equal(changed.buckets.length,original.buckets.length+1);
    assert.deepEqual(await (await fetch(urls[1])).json(),other);
    const persisted=JSON.parse(fs.readFileSync(path.join(temp,'first/.moodboard-data/board.json'),'utf8'));
    assert.equal(persisted.buckets.length,changed.buckets.length);
    const undo=await post(urls[0],{type:'undo',token:changed.undoToken});assert.equal(undo.status,200);
    assert.deepEqual((await undo.json()).buckets,original.buckets);
  }finally{
    await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
test('server is standalone and keeps project/demo mounts isolated',async()=>{
  const server=createServer({root:ROOT});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const route of ['/','/api/studio','/design-system/registry.json','/demo/design-system/registry.json','/demo/screens/record.html','/framework/spacing-inspector.js','/demo/design-system/components/note.css','/moodboard/'])assert.equal((await fetch(base+route)).status,200,route);
    const config=JSON.parse(fs.readFileSync(path.join(ROOT,'studio.config.json'),'utf8'));
    const project=await (await fetch(base+'/design-system/registry.json')).json();
    assert.deepEqual(project,JSON.parse(fs.readFileSync(path.join(ROOT,config.project,'design-system/registry.json'),'utf8')));
    for(const route of ['/studio.config.json','/.git/config','/api/data','/framework/%2e%2e%2fproject/BRIEF.md'])assert.notEqual((await fetch(base+route)).status,200,route);
    assert.equal((await fetch(base+'/design-system/registry.json',{method:'POST'})).status,405);
    const demo=await (await fetch(base+'/demo/design-system/registry.json')).json();
    for(const entry of [...demo.components,...demo.compositions,...demo.patterns,...demo.visualizations,...demo.icons,...demo.screens])assert.equal((await fetch(new URL(entry.preview,base+'/demo/design-system/'))).status,200,entry.preview);
    // Follow local HTML/CSS assets so a copied page cannot silently depend on CRM files.
    const visited=new Set();
    async function assets(url){
      const clean=new URL(url);clean.hash='';clean.search='';if(visited.has(clean.href))return;visited.add(clean.href);
      const response=await fetch(clean);assert.equal(response.status,200,clean.href);
      const type=response.headers.get('content-type');if(!/text\/html|text\/css/.test(type))return;
      const text=(await response.text()).replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g,'');const matches=[...text.matchAll(/(?:src|href)=["']([^"']+)["']/g),...text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)/g)];
      for(const match of matches){if(!/\.(?:css|js|html)(?:[?#]|$)/.test(match[1])||match[1].startsWith('#'))continue;const next=new URL(match[1],clean);if(next.origin===base)await assets(next.href);}
    }
    await assets(base+'/');await assets(base+'/moodboard/');
    for(const entry of [...demo.screens,...demo.components,...demo.patterns,...demo.visualizations,...demo.icons])await assets(new URL(entry.preview,base+'/demo/design-system/').href);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
