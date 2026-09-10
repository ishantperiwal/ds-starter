const test=require('node:test'),assert=require('node:assert/strict');
const {place}=require('../label-placement');
test('labels choose available outside edges with an eight pixel gap',()=>{
 const r={left:20,top:10,right:950,bottom:50};assert.deepEqual(place(r,150,24,1000,700),{left:20,top:58});
 const center={left:100,top:100,right:300,bottom:200};assert.equal(place(center,150,24,1000,700).top,68);
 const tall={left:20,top:0,right:100,bottom:700};assert.equal(place(tall,150,24,1000,700).left,108);
 const right={left:800,top:0,right:1000,bottom:700};assert.equal(place(right,150,24,1000,700).left,642);
});
test('a full viewport selection hides its label instead of covering content',()=>{assert.equal(place({left:0,top:0,right:1000,bottom:700},150,24,1000,700),null);});
