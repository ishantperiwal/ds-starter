const test=require('node:test');
const assert=require('node:assert/strict');
const {inspectionRoots}=require('../anatomy.js');
function node(parent,selector){
 const item={parentElement:parent,matches:s=>s===selector,contains(other){for(let n=other;n;n=n.parentElement)if(n===this)return true;return false;}};
 return item;
}
test('inspection includes declared outer spacing and sibling action without an explicit wrapper specimen',()=>{
 const canvas=node(null,'.canvas'),card=node(canvas,'.card'),row=node(card,'.row'),button=node(row,'.button'),action=node(row,'.action');
 canvas.querySelectorAll=()=>[button];
 const anatomy={specimen:'.button',spacing:[{selector:'.row',property:'padding-right'}]};
 assert.deepEqual(inspectionRoots(canvas,anatomy),[row]);
 assert.equal(inspectionRoots(canvas,anatomy)[0].contains(action),true);
 assert.deepEqual(inspectionRoots(canvas,{specimen:'.button'}),[button]);
});
test('multiple variants stay separate and nested matches do not duplicate overlays',()=>{
 const canvas=node(null,'.canvas'),row=node(canvas,'.row'),button=node(row,'.button'),standalone=node(canvas,'.button');
 canvas.querySelectorAll=()=>[row,button,standalone];
 assert.deepEqual(inspectionRoots(canvas,{specimen:'.row,.button',parts:[{selector:'.row'},{selector:'.canvas'}]}),[row,standalone]);
});
