const test=require('node:test');
const assert=require('node:assert/strict');
const canvas=require('../workbench/component-canvas.js');
test('canvas packs arbitrary catalogs without overlapping cards',()=>{
 for(const count of [0,1,4,30,101]){
 const sizes=Array.from({length:count},(_,i)=>({width:280+(i%5)*137,height:120+(i%7)*113}));
 const {positions,w,h}=canvas.layout(sizes);assert.equal(positions.length,count);assert.ok(w>0&&h>0);
 positions.forEach((a,i)=>positions.slice(i+1).forEach(b=>assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y)));
 }
});
test('zoom preserves the world point under the pointer and clamps limits',()=>{
 const camera={x:-130,y:47,z:.65},x=321,y=222;
 for(const factor of [.001,.8,1.5,100]){const next=canvas.zoom(camera,factor,x,y);assert.ok(next.z>=.05&&next.z<=2);assert.ok(Math.abs((x-next.x)/next.z-(x-camera.x)/camera.z)<1e-8);assert.ok(Math.abs((y-next.y)/next.z-(y-camera.y)/camera.z)<1e-8);}
});
test('dependency navigation truncates cycles without mutating ancestry',()=>{
 const trail=['parent','child'];assert.deepEqual(canvas.trail(trail,'parent'),['parent']);assert.deepEqual(canvas.trail(trail,'leaf'),['parent','child','leaf']);assert.deepEqual(trail,['parent','child']);
});

test('modal preview configurations never fall back to interaction fixtures',()=>{
 const entry={preview:'gallery.html',interactions:{preview:'states.html',targets:[{id:'state-target',name:'State fixture'}]}};
 assert.deepEqual(canvas.previewConfigurations(entry),[{id:'default',name:'Default'}]);
 const configs=[{id:'rich',name:'With header',selector:'#rich',interactionTarget:'state-target'}];
 assert.equal(canvas.previewConfigurations({...entry,previewConfigurations:configs}),configs);
});
test('isolating a source keeps its nodes and ancestors while hiding other examples',()=>{
 const node=(parent,tag='section')=>{const n={parentElement:parent,children:[],excluded:false,matches:s=>['script','style','link'].includes(tag),setAttribute(){this.excluded=true;},querySelectorAll(){return [];}};parent?.children.push(n);return n;};
 const main=node(null,'main'),group=node(main,'div'),first=node(group),second=node(group),script=node(main,'script');
 main.querySelectorAll=selector=>selector==='#first'?[first]:[];
 assert.equal(canvas.isolatePreview(main,'#first'),first);
 assert.equal(first.parentElement,group);assert.equal(group.parentElement,main);
 assert.equal(first.excluded,false);assert.equal(second.excluded,true);assert.equal(script.excluded,false);
 assert.throws(()=>canvas.isolatePreview(main,'#missing'),/exactly one/);
 main.querySelectorAll=()=>[first,second];assert.throws(()=>canvas.isolatePreview(main,'section'),/exactly one/);
});
