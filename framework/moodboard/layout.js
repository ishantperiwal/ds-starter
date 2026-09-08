// Shared deterministic row layout, used by the server and canvas.
(function(root){
 function layout(board){
  for(const section of board.buckets){
   const images=board.images.filter(i=>i.bucketId===section.id);
   const rows=[...new Set(images.map(i=>Number.isInteger(i.row)?i.row:0))].sort((a,b)=>a-b);
   let y=24,minWidth=200;
   rows.forEach((row,index)=>{
    const items=images.filter(i=>(Number.isInteger(i.row)?i.row:0)===row).sort((a,b)=>(a.order??a.x??0)-(b.order??b.x??0));
    let x=24,height=0;
    items.forEach((i,n)=>{i.row=index;i.order=n;i.x=x;i.y=y;const w=i.width||260;const h=w*(i.aspect||.75)+120;i.layoutHeight=h;x+=w+24;height=Math.max(height,h);});
    minWidth=Math.max(minWidth,x);y+=height+24;
   });
   section.minWidth=minWidth;section.minHeight=Math.max(160,y);
   section.width=Math.max(section.width||540,minWidth);section.height=Math.max(section.height||440,section.minHeight);
  }
  return board;
 }
 if(typeof module!=='undefined')module.exports=layout;else root.moodboardLayout=layout;
})(typeof window!=='undefined'?window:globalThis);
