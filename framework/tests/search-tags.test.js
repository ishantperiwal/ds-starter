const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {save}=require('../search-tags');
test('tag edits persist only the selected entry and validate input',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ds-tags-'));
 try{const catalog={components:[{id:'button',name:'Button'},{id:'other',searchTags:['keep']}]};fs.writeFileSync(path.join(dir,'registry.json'),JSON.stringify(catalog));
 assert.deepEqual(save(dir,{collection:'components',id:'button',searchTags:[' action ','action','']}),['action']);
 const stored=JSON.parse(fs.readFileSync(path.join(dir,'registry.json')));assert.deepEqual(stored.components[1],catalog.components[1]);assert.equal(stored.components[0].name,'Button');
 assert.throws(()=>save(dir,{collection:'../bad',id:'button',searchTags:[]}));assert.throws(()=>save(dir,{collection:'components',id:'missing',searchTags:[]}));
 save(dir,{collection:'components',id:'button',searchTags:[]});assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'registry.json'))).components[0].searchTags,[]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
