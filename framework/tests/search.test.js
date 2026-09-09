const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../workbench/model');
test('search ranks phrases, all words, then individual words',()=>{
 const q='new mail';
 assert(M.searchScore('new mail composer',q)>M.searchScore('mail create new',q));
 assert(M.searchScore('mail create new',q)>M.searchScore('mail inbox',q));
 assert.equal(M.searchScore('calendar',q),0);
});
test('search supports hidden aliases, partial words and punctuation',()=>{
 const text=M.searchMetadata({id:'search',name:'Search',searchTags:['magnifying glass','lookup']});
 assert(M.searchScore(text,'magnify gla')>0);
 assert(M.searchScore(text,'lookup')>0);
 assert.equal(M.searchScore('Icon-button','ICON button'),10000);
 assert.equal(M.searchScore(text,''),1);
});
