const {test}=require('node:test'),assert=require('node:assert/strict');
const {reference}=require('../workbench/group-reference');
test('group references include stable identities and complete scope',()=>{
 const text=reference('Controls','icons',[{id:'close',name:'Close',src:'assets/close.svg'},{id:'expand',name:'Expand',src:'assets/expand.svg'}],'icons/catalog.json');
 assert.match(text,/Group: Controls/);assert.match(text,/all 2 items/);assert.match(text,/ID: close/);assert.match(text,/ID: expand/);assert.match(text,/Asset: assets\/close.svg/);
});
