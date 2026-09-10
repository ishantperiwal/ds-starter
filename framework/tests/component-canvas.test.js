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
