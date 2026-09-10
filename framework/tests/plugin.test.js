'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {initialize} = require('../initialize');
const {runtimePaths, ROOT} = require('../configuration');
const {createServer} = require('../server');
const {validate} = require('../validate');
const {fileMap, writeLock} = require('../release');
const {update} = require('../git-update');
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ds-plugin-test-'));
function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, value);
}
const json = (file, value) => write(file, JSON.stringify(value,null,2)+'\n');
const git = (cwd, ...args) => execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
function fixture(base, name) {
  const app = path.join(base,name);
  write(path.join(app,'pages/nested/record.html'),'<h1>Existing app screen</h1><link rel="stylesheet" href="/assets/app.css"><script src="../../assets/app.js"></script>');
  write(path.join(app,'assets/app.css'),'body{color:navy}');
  write(path.join(app,'assets/app.js'),'window.appFixture=true;');
  write(path.join(app,'AGENTS.md'),'Existing app instructions must remain unchanged.');
  return app;
}
test('initialization attaches in place, is repeat-safe, and preserves existing folders/instructions', () => {
  const base=temp();
  try {
    const app=fixture(base,'app with spaces');
    const original=fileMap(app), result=initialize({app});
    assert.equal(result.content,path.join(fs.realpathSync(app),'app-design-system'));
    for(const [file,hash] of Object.entries(original))assert.equal(fileMap(app)[file],hash,file);
    assert.equal(initialize({app}).created,false);
    assert.equal(fs.existsSync(path.join(result.content,'inbox')),false);
    const instructions=fs.readFileSync(path.join(result.content,'AGENTS.md'),'utf8');
    assert(instructions.includes('<studioRoot>/framework/AGENT-WORKFLOW.md'));
    const entry=path.join(result.content,'run-ds.md');
    assert(fs.readFileSync(entry,'utf8').includes('No extra “follow the DS” instruction'));
    assert(!fs.readFileSync(entry,'utf8').includes('Titan'));
    write(entry,'App-owned customized entry point');
    assert.equal(initialize({app}).created,false);
    assert.equal(fs.readFileSync(entry,'utf8'),'App-owned customized entry point');
    assert.equal(runtimePaths(ROOT,result.configFile).content,result.content);
    assert.deepEqual(validate(ROOT,result.configFile).errors,[]);
    const occupied=path.join(app,'existing-ds');
    write(path.join(occupied,'tokens.css'),'do not replace');
    assert.throws(()=>initialize({app,content:occupied}),/already exists/);
    assert.equal(fs.readFileSync(path.join(occupied,'tokens.css'),'utf8'),'do not replace');
    assert.throws(()=>initialize({app,content:path.join(ROOT,'unsafe-content')}),/separate/);
    fs.symlinkSync(ROOT,path.join(base,'studio-alias'));
    assert.throws(()=>initialize({app,content:path.join(base,'studio-alias/unsafe')}),/separate/);
    const config=JSON.parse(fs.readFileSync(result.configFile,'utf8'));
    json(result.configFile,{...config,contractVersion:999});
    assert.throws(()=>runtimePaths(ROOT,result.configFile),/migration/);
  } finally {fs.rmSync(base,{recursive:true,force:true});}
});
test('CLI works from an app directory and initialization supports a nested studio checkout', () => {
  const base=temp();
  try {
    const app=fixture(base,'cli-app');
    const cli=(...args)=>execFileSync(process.execPath,[path.join(ROOT,'studio.js'),...args],{cwd:app,encoding:'utf8'});
    assert(cli('init','--app','.').includes('run-ds.md'));
    const report=JSON.parse(cli('check','--config','app-design-system/studio.config.json'));
    assert.deepEqual(report.errors,[]);
    assert(cli('init','--app','.').includes('"created": false'));
    const nestedApp=fixture(base,'nested-app'),studio=path.join(nestedApp,'ds-studio');
    json(path.join(studio,'framework/version.json'),{version:'0.2.0',contractVersion:1});
    const result=initialize({app:nestedApp,root:studio});
    const config=JSON.parse(fs.readFileSync(result.configFile,'utf8'));
    assert.equal(config.studioRoot,'../ds-studio');
    assert.equal(runtimePaths(studio,result.configFile).app,fs.realpathSync(nestedApp));
  } finally {fs.rmSync(base,{recursive:true,force:true});}
});
test('two apps load their own catalogs, existing screens and board stores without exposing private files', async () => {
  const base=temp(),servers=[];
  try {
    const attachments=[];
    for(const name of ['alpha','beta']) {
      const app=fixture(base,name), attachment=initialize({app});
      const registry=JSON.parse(fs.readFileSync(path.join(attachment.content,'registry.json'),'utf8'));
      registry.screens=[{id:'existing-record',name:'Existing record',preview:'../app/pages/nested/record.html'}];
      json(path.join(attachment.content,'registry.json'),registry);
      write(path.join(app,'.env'),'PRIVATE TEST FIXTURE');
      write(path.join(app,'data.json'),'{"private":true}');
      write(path.join(app,'.private/hidden.js'),'PRIVATE TEST FIXTURE');
      fs.symlinkSync(path.join(app,'.private/hidden.js'),path.join(app,'assets/alias.js'));
      write(path.join(attachment.content,'specimens/example.html'),'<h1>App-owned specimen</h1>');
      assert.deepEqual(validate(ROOT,attachment.configFile).errors,[]);
      const server=createServer({configFile:attachment.configFile});servers.push(server);
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      attachments.push({...attachment,url:'http://127.0.0.1:'+server.address().port});
    }
    for(const attachment of attachments) {
      const {url,content}=attachment;
      const catalog=await (await fetch(url+'/design-system/registry.json')).json();
      assert.equal(catalog.name,path.basename(attachment.app)+' design system');
      for(const route of ['/','/app/pages/nested/record.html','/assets/app.css','/app/assets/app.js','/design-system/specimens/example.html','/framework/AGENT-WORKFLOW.md']) {
        assert.equal((await fetch(url+route)).status,200,route);
      }
      const info=await (await fetch(url+'/api/studio')).json();
      assert.equal(info.attachment.content,content);
      for(const route of ['/app/.env','/app/data.json','/app/assets/alias.js','/app/.private/hidden.js','/app/app-design-system/registry.json','/design-system/.moodboard-data/board.json','/api/data']) {
        assert.notEqual((await fetch(url+route)).status,200,route);
      }
      const board=await (await fetch(url+'/api/board')).json();
      assert(board.buckets.length>0);
      assert(fs.existsSync(path.join(content,'.moodboard-data/board.json')));
    }
    const a=JSON.parse(fs.readFileSync(path.join(attachments[0].content,'.moodboard-data/board.json'),'utf8'));
    const b=JSON.parse(fs.readFileSync(path.join(attachments[1].content,'.moodboard-data/board.json'),'utf8'));
    assert.notEqual(a.buckets[0].id,b.buckets[0].id);
  } finally {
    await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
    fs.rmSync(base,{recursive:true,force:true});
  }
});
test('Git software update refreshes instructions/UI, preserves app bytes and stops incompatible or dirty updates', () => {
  const base=temp();
  try {
    const upstream=path.join(base,'upstream'),remote=path.join(base,'remote.git'),consumer=path.join(base,'studio');
    fs.mkdirSync(upstream);
    fs.cpSync(path.join(ROOT,'framework'),path.join(upstream,'framework'),{recursive:true});
    fs.copyFileSync(path.join(ROOT,'studio.config.json'),path.join(upstream,'studio.config.json'));
    writeLock(upstream);
    git(upstream,'init','-b','main');
    git(upstream,'config','user.name','Studio Test');
    git(upstream,'config','user.email','studio-test@example.invalid');
    git(upstream,'add','.');
    git(upstream,'commit','-m','Initial test tooling');
    git(base,'clone','--bare',upstream,remote);
    git(upstream,'remote','add','origin',remote);
    git(base,'clone',remote,consumer);
    const app=fixture(base,'existing-app'),attachment=initialize({app,root:consumer});
    write(path.join(attachment.content,'.moodboard-data/board.json'),'{"user":"saved reference"}');
    const appBefore=fileMap(app), oldHead=git(consumer,'rev-parse','HEAD');
    write(path.join(upstream,'framework/AGENT-WORKFLOW.md'),'Updated shared instructions for fixture');
    write(path.join(upstream,'framework/workbench/studio.css'),'/* updated presentation */');
    json(path.join(upstream,'framework/version.json'),{version:'0.2.1',contractVersion:1});
    writeLock(upstream);
    git(upstream,'add','.');
    git(upstream,'commit','-m','Improve studio presentation and workflow');
    git(upstream,'push','origin','main');
    const planned=update({root:consumer,configFile:attachment.configFile,checkOnly:true});
    assert.equal(planned.applied,false);
    assert.equal(git(consumer,'rev-parse','HEAD'),oldHead);
    const installed=update({root:consumer,configFile:attachment.configFile});
    assert.equal(installed.applied,true);
    assert.equal(fs.readFileSync(path.join(consumer,'framework/AGENT-WORKFLOW.md'),'utf8'),'Updated shared instructions for fixture');
    assert.deepEqual(fileMap(app),appBefore);
    assert.equal(update({root:consumer,configFile:attachment.configFile}).applied,false);
    write(path.join(consumer,'local-untracked.txt'),'preserve');
    assert.throws(()=>update({root:consumer,configFile:attachment.configFile}),/Local studio edits/);
    fs.unlinkSync(path.join(consumer,'local-untracked.txt'));
    const installedHead=git(consumer,'rev-parse','HEAD');
    json(path.join(upstream,'framework/version.json'),{version:'1.0.0',contractVersion:2});
    writeLock(upstream);git(upstream,'add','.');git(upstream,'commit','-m','Incompatible fixture');
    git(upstream,'push','origin','main');
    assert.throws(()=>update({root:consumer,configFile:attachment.configFile}),/migration required/);
    assert.equal(git(consumer,'rev-parse','HEAD'),installedHead);
    assert.deepEqual(fileMap(app),appBefore);
  } finally {fs.rmSync(base,{recursive:true,force:true});}
});
