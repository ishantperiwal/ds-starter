const test=require('node:test'),assert=require('node:assert/strict');
const camera=require('../workbench/variant-canvas.js');
test('fit contains a full-width multi-variant arrangement',()=>{
 const bounds={width:2400,height:1500};const fit=camera.fit(bounds,600,400);
 assert.ok(bounds.width*fit.z<=552);assert.ok(bounds.height*fit.z<=352);assert.ok(fit.x>=24&&fit.y>=24);
});
test('pan bounds keep the arrangement reachable on every edge',()=>{
 const bounds={width:1200,height:900};
 for(const x of [-1e6,1e6])for(const y of [-1e6,1e6]){const result=camera.clamp({x,y,z:.5},bounds,500,300);assert.ok(result.x<=436&&result.x+600>=64);assert.ok(result.y<=236&&result.y+450>=64);}
});
