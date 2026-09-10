(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DSLabelPlacement=api;})(globalThis,function(){
function place(r,w,h,vw,vh){
 const gap=8,edge=4,clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
 const x=clamp(r.left,edge,vw-w-edge),y=clamp(r.top,edge,vh-h-edge);
 const candidates=[{left:x,top:r.top-h-gap},{left:x,top:r.bottom+gap},{left:r.right+gap,top:y},{left:r.left-w-gap,top:y}];
 return candidates.find(p=>p.left>=edge&&p.top>=edge&&p.left+w<=vw-edge&&p.top+h<=vh-edge)||null;
}
return {place};
});
