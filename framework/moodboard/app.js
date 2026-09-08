'use strict';
const $ = s => document.querySelector(s);
const viewport = $('#viewport'), world = $('#world');
const undoStack = [];
let selectedImage = null;
let board, selected, editing, editingBucket, busy = 0, tx = 45, ty = 45, scale = .7, drag, toastTimer;
const escapeHTML = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4500); }
function transform() { world.style.setProperty('--mb-title-scale', Math.max(1, 1 / scale)); world.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; $('#zoom-label').textContent = Math.round(scale * 100) + '%'; }
function zoom(next, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) { next = Math.max(.15, Math.min(8, next)); tx = x - (x - tx) * next / scale; ty = y - (y - ty) * next / scale; scale = next; transform(); }
function fit(){
 const boxes=[...board.buckets.map(b=>({x:b.x,y:b.y,w:b.width||540,h:b.height||440})),...board.images.filter(i=>!i.bucketId).map(i=>({x:i.x,y:i.y,w:i.width||260,h:world.querySelector(`[data-move-image="${i.id}"]`)?.offsetHeight||240}))];
 if(!boxes.length)return;
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),right=Math.max(...boxes.map(b=>b.x+b.w)),bottom=Math.max(...boxes.map(b=>b.y+b.h));
 scale=Math.max(.15,Math.min(1,(viewport.clientWidth-80)/(right-x),(viewport.clientHeight-120)/(bottom-y)));tx=(viewport.clientWidth-(right-x)*scale)/2-x*scale;ty=40-y*scale;transform();
}
function select(id, center = false) { selected = id; selectedImage = null; document.querySelectorAll('.mb-image-selected').forEach(el=>el.classList.remove('mb-image-selected')); document.querySelectorAll('[data-bucket]').forEach(el => { el.classList.toggle('is-selected', el.dataset.bucket === id); }); document.querySelectorAll('[data-nav]').forEach(el => el.setAttribute('aria-current', String(el.dataset.nav === id))); const bucket = board.buckets.find(b => b.id === id);  if (center && bucket) { tx = viewport.clientWidth / 2 - (bucket.x + 270) * scale; ty = 50 - bucket.y * scale; transform(); } }
function render() {
  moodboardLayout(board);
  if (!board.buckets.some(b => b.id === selected)) selected = board.buckets[0]?.id;
  $('#loading').hidden = true;
  renderSectionPicker();
  $('#bucket-list').innerHTML = board.buckets.map(b => `<button class="ds-btn ds-btn--ghost" data-nav="${b.id}"><span>${escapeHTML(b.name)}</span><span>${board.images.filter(i => i.bucketId === b.id).length}</span></button>`).join('');
  world.innerHTML = board.buckets.map((b, n) => {
    const images = board.images.filter(i => i.bucketId === b.id);
    return `<section class="mb-bucket" data-bucket="${b.id}" data-y="${b.y}" style="left:${b.x}px;top:${b.y}px;width:${b.width||540}px;height:${b.height||440}px" aria-label="${escapeHTML(b.name)}"><header class="mb-bucket-head"><h2>${escapeHTML(b.name)}</h2><div class="mb-section-actions"><button class="ds-btn ds-btn--ghost" data-rename="${b.id}" aria-label="Rename section">Rename</button><button class="ds-btn ds-btn--ghost" data-copy-section="${b.id}">Copy reference</button></div></header>${images.map((i,k)=>imageMarkup(i,k)).join('')}${!images.length?'<span class="mb-section-hint">Paste or drop images here</span>':''}<button class="mb-resize" data-resize="${b.id}" aria-label="Resize section. Use arrow keys." title="Drag to resize">↘</button></section>`;
  }).join('') + board.images.filter(i=>!i.bucketId).map((i,k)=>imageMarkup(i,k)).join(''); select(selected); transform();
}
async function mutate(op) { busy++; toast('Saving…'); $('#save-status').textContent = 'Saving…'; try { const r = await fetch('/api/board', {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify(op)}); const data = await r.json(); if (!r.ok) throw Error(data.error); if(op.type !== 'undo' && data.undoToken){undoStack.push(data.undoToken);if(undoStack.length>20)undoStack.shift();} delete data.undoToken; board = data; render(); $('#save-status').textContent = 'Saved to this server'; toast('Saved'); return data; } catch(e) { $('#save-status').textContent = 'Could not save'; toast(e.message); throw e; } finally { busy--; } }
function safe(task) { Promise.resolve().then(task).catch(() => {}); }
function modal(dialog) { dialog.showModal(); }
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
$('#new-bucket').onclick = () => { editingBucket = null; $('#bucket-dialog-title').textContent = 'New section'; $('#bucket-name').value = ''; $('#bucket-form button[type="submit"], #bucket-form button:not([type])').textContent = 'Create section'; modal($('#bucket-dialog')); };
$('#bucket-form').onsubmit = e => { e.preventDefault(); safe(async () => { const name = $('#bucket-name').value; if (editingBucket) await mutate({type:'editBucket',bucketId:editingBucket,name}); else { const data = await mutate({type:'addBucket',name,x:(80-tx)/scale,y:(80-ty)/scale}); selected = data.buckets.at(-1).id; select(selected, true); } $('#bucket-dialog').close(); }); };
$('#bucket-list').onclick = e => { const b = e.target.closest('[data-nav]'); if(b) select(b.dataset.nav,true); };
world.onclick = e => {
  const bucket = e.target.closest('[data-bucket]'); if(bucket && !e.target.closest('[data-move-image]')) select(bucket.dataset.bucket);
  const add = e.target.closest('[data-add]'); if(add) { select(add.dataset.add); $('#files').click(); }
  const copySection=e.target.closest('[data-copy-section]'); if(copySection) copySectionReference(copySection.dataset.copySection);
  const copyPNG=e.target.closest('[data-copy-png]'); if(copyPNG) copyImage(copyPNG.dataset.copyPng);
  const copyRef=e.target.closest('[data-copy-ref]'); if(copyRef) copyReference(copyRef.dataset.copyRef);
  const ref = e.target.closest('[data-image]'); if(ref) openReference(ref.dataset.image);
  const rename = e.target.closest('[data-rename]'); if(rename) { editingBucket = rename.dataset.rename; $('#bucket-name').value = board.buckets.find(b => b.id === editingBucket).name; $('#bucket-dialog-title').textContent = 'Rename section'; $('#bucket-form button:not([type])').textContent = 'Save name'; modal($('#bucket-dialog')); }
  const del = e.target.closest('[data-delete-bucket]'); if(del) safe(() => mutate({type:'deleteBucket',bucketId:del.dataset.deleteBucket}));
  const exp = e.target.closest('[data-export]'); if(exp) safe(() => exportBucket(exp.dataset.export));
};

$('#files').onchange = e => { safe(() => upload(e.target.files,selected)); };
async function upload(files, bucketId) {
  const images = [...files].filter(f => f.type.startsWith('image/'));
  if(bucketId===undefined)bucketId=nearestVisibleSection()?.id||null;
  if(!images.length) return toast('Paste or choose an image file.');
  for (const file of images) {
    if(file.size > 2 * 1024 * 1024) { toast(`${file.name}: maximum image size is 2 MB.`); continue; }
    try {
      const bitmap = await createImageBitmap(file); if(bitmap.width * bitmap.height > 40000000) { bitmap.close(); throw Error('Image exceeds 40 megapixels. Please use a smaller screenshot.'); }
      const bucket = board.buckets.find(b=>b.id===bucketId); const count=board.images.filter(i=>i.bucketId===bucketId).length;
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.getContext('2d').drawImage(bitmap,0,0); bitmap.close();
      const pngData = canvas.toDataURL('image/png');
      if (Math.floor((pngData.length-pngData.indexOf(',')-1)*3/4)>2*1024*1024) throw Error('Converted image exceeds 2 MB. Resize the screenshot before pasting.');
      const saved=await mutate({type:'addImage', bucketId, x:bucket?24+(count%3)*32:(viewport.clientWidth/2-tx)/scale-130,y:bucket?60+(count%5)*32:(viewport.clientHeight/2-ty)/scale-100, title:(file.name || 'Screenshot').replace(/\.[^.]+$/,''), data:pngData});
      const added=saved.images.at(-1);tx=viewport.clientWidth/2-((bucket?.x||0)+added.x+130)*scale;ty=viewport.clientHeight/2-((bucket?.y||0)+added.y+100)*scale;transform();
    } catch(e) { toast('Could not add image: ' + e.message); }
  }
  $('#files').value = '';
}
document.addEventListener('paste', e => { if(document.querySelector('dialog[open]')) return; const files = [...e.clipboardData.items].filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()); if(files.length) {e.preventDefault();safe(() => upload(files));} });
viewport.addEventListener('dragover', e => { e.preventDefault(); document.querySelectorAll('.is-over').forEach(el => el.classList.remove('is-over')); e.target.closest('[data-bucket]')?.classList.add('is-over'); });
viewport.addEventListener('drop', e => {e.preventDefault(); document.querySelectorAll('.is-over').forEach(el => el.classList.remove('is-over')); const rect=viewport.getBoundingClientRect(); const id = sectionAt((e.clientX-rect.left-tx)/scale,(e.clientY-rect.top-ty)/scale)?.id || null; select(id); safe(() => upload(e.dataTransfer.files,id));});
viewport.addEventListener('pointerdown', e => {
  if(e.button!==0)return;
  const resize=e.target.closest('[data-resize]'), image=e.target.closest('[data-move-image]'), head=e.target.closest('.mb-bucket-head');
  if(!resize && e.target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
  // Let title clicks retain their native target so the browser can emit dblclick.
  // Capturing the pointer on the canvas retargeted those clicks away from the title.
  if(head && e.target.closest('h2')){
    select(head.closest('[data-bucket]').dataset.bucket);
    return;
  }
  const section=e.target.closest('[data-bucket]');
  if(section)select(section.dataset.bucket); else select(null);
  const b=section&&board.buckets.find(b=>b.id===section.dataset.bucket);
  const item=image&&board.images.find(i=>i.id===image.dataset.moveImage);
  if(item){selectedImage=item.id;image.classList.add('mb-image-selected');}
  drag={openImage:e.target.matches('.mb-free-image > img'),pointer:e.pointerId,startX:e.clientX,startY:e.clientY,b,el:section,image,item,resize,mode:resize?'resize':image?'image':section?'section':'pan',x:item?(item.x??24):b?b.x:tx,y:item?(item.y??60):b?b.y:ty,w:b?.width||540,h:b?.height||440};
  viewport.focus({preventScroll:true});
  viewport.setPointerCapture(e.pointerId);e.preventDefault();
});
viewport.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;const d=drag,dx=(e.clientX-d.startX)/scale,dy=(e.clientY-d.startY)/scale;
  if(!d.moved && Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<4)return;
  d.moved=true;
  if(d.mode==='resize'){d.el.style.width=Math.max(d.b.minWidth||200,d.w+dx)+'px';d.el.style.height=Math.max(d.b.minHeight||160,d.h+dy)+'px';}
  else if(d.mode==='image'){const pos=d.b?{x:d.x+dx,y:d.y+dy}:snapImage(d,d.x+dx,d.y+dy,e.altKey);d.image.style.left=pos.x+'px';d.image.style.top=pos.y+'px';}
  else if(d.mode==='section'){const pos=snapSection(d,d.x+dx,d.y+dy,e.altKey);d.el.style.left=pos.x+'px';d.el.style.top=pos.y+'px';}
  else{tx=d.x+dx*scale;ty=d.y+dy*scale;transform();}
});
function endDrag(e){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;clearGuides();
  if(!d.moved){if(d.item && d.openImage)openReference(d.item.id);return;}
  if(d.mode==='resize')safe(()=>mutate({type:'editBucket',bucketId:d.b.id,width:parseFloat(d.el.style.width),height:parseFloat(d.el.style.height)}));
  if(d.mode==='section')safe(()=>mutate({type:'editBucket',bucketId:d.b.id,x:parseFloat(d.el.style.left),y:parseFloat(d.el.style.top)}));
  if(d.mode==='image'){
    const x=(d.b?.x||0)+parseFloat(d.image.style.left),y=(d.b?.y||0)+parseFloat(d.image.style.top);
    const target=imageDropSection(x,y,d.image.offsetWidth,d.image.offsetHeight,d.b);
    const placement=target?rowPlacement(target,d.item.id,x+130-target.x,y+d.image.offsetHeight/2-target.y):{};
    safe(()=>mutate({type:'editImage',id:d.item.id,bucketId:target?.id||null,x:x-(target?.x||0),y:y-(target?.y||0),...placement}));
  }
}
viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
world.addEventListener('keydown',e=>{const el=e.target.closest('[data-resize]');if(!el||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const b=board.buckets.find(b=>b.id===el.dataset.resize);safe(()=>mutate({type:'editBucket',bucketId:b.id,width:Math.max(200,(b.width||540)+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0)),height:Math.max(160,(b.height||440)+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0))}));});
viewport.addEventListener('wheel', e => {e.preventDefault();if(e.ctrlKey || e.metaKey) {const r=viewport.getBoundingClientRect();zoom(scale*Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top);} else {tx-=e.deltaX;ty-=e.deltaY;transform();}}, {passive:false});
viewport.onkeydown = e => {if(e.target !== viewport) return; const moves={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};if(moves[e.key]) {e.preventDefault();tx+=moves[e.key][0];ty+=moves[e.key][1];transform();}};
$('#zoom-in').onclick=()=>zoom(scale*1.2);$('#zoom-out').onclick=()=>zoom(scale/1.2);$('#fit').onclick=fit;
function openReference(id) { resetRegionTool();const item=board.images.find(i=>i.id===id);if(!item)return;editing=id;$('#reference-heading').textContent='Image · '+item.id;$('#detail-image').src=item.url;$('#detail-image').alt=item.title;$('#original').href=item.url;$('#ref-note').value=item.note;$('#download-image').href=item.url;$('#download-image').download=item.title+'.png';modal($('#detail'));}
let referenceSaveTimer;
function saveReferenceFields(){
 clearTimeout(referenceSaveTimer);
 const item=board.images.find(i=>i.id===editing);if(!item)return;
 const note=$('#ref-note').value;
 if(note===item.note)return;
 safe(()=>mutate({type:'editImage',id:item.id,note}));
}
$('#reference-form').onsubmit=e=>{e.preventDefault();saveReferenceFields();};
for(const selector of ['#ref-note']) $(selector).addEventListener('input',()=>{
 clearTimeout(referenceSaveTimer);referenceSaveTimer=setTimeout(saveReferenceFields,600);
});
$('#detail').addEventListener('close',saveReferenceFields);

$('#remove-image').onclick=()=>{safe(async()=>{await mutate({type:'deleteImage',id:editing});$('#detail').close();});};
$('#copy-image').onclick=()=>copyImage(editing);
$('#copy-note').onclick=()=>safe(async()=>{const text=`Design reference: ${editing}\n\nDirection: ${$('#ref-note').value || 'No direction note yet.'}\n\nSource: ${board.images.find(i=>i.id===editing)?.source || 'Not recorded'}`;try{await navigator.clipboard.writeText(text);toast('Direction text copied.');}catch{const input=document.createElement('textarea');input.value=text;$('#detail').append(input);input.select();const copied=document.execCommand('copy');input.remove();toast(copied?'Direction text copied.':'Select and copy the direction note manually.');}});
async function exportBucket(id) {
  toast('Preparing your reference sheet…');
  try {
    const bucket=board.buckets.find(b=>b.id===id), items=board.images.filter(i=>i.bucketId===id);
    if(items.length>30) return toast('Export supports up to 30 references per bucket. Split this collection into smaller buckets.');
    const c=document.createElement('canvas');c.width=1600;c.height=160+Math.ceil(items.length/2)*660;
    const ctx=c.getContext('2d'), styles=getComputedStyle(document.body);ctx.fillStyle=styles.getPropertyValue('--surface-primary').trim();ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=styles.getPropertyValue('--text-heading').trim();ctx.font='bold 38px sans-serif';ctx.fillText(bucket.name,48,70,1500);ctx.font='20px sans-serif';ctx.fillText('DIRECTION ROOM / TITAN',48,110);
    for(let n=0;n<items.length;n++){const item=items[n],img=new Image();img.src=item.url;await img.decode();const x=48+n%2*776,y=160+Math.floor(n/2)*660;const ratio=Math.min(728/img.width,440/img.height);ctx.drawImage(img,x,y,img.width*ratio,img.height*ratio);ctx.font='bold 24px sans-serif';ctx.fillText(item.title,x,y+482,720);ctx.font='20px sans-serif';let line='',row=0;for(const word of (item.note||'').split(/\s+/)){if(ctx.measureText(line+word).width>710){ctx.fillText(line,x,y+516+row*27);line='';row++;if(row===3)break;}line+=word+' ';}if(row<3)ctx.fillText(line,x,y+516+row*27);}
    c.toBlob(blob=>{if(!blob)return toast('Could not export this collection.');const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=bucket.name+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Reference sheet downloaded.');},'image/png');
  } catch(e) {toast('Export failed: '+e.message);}
}
async function refresh(first=false) {try{const r=await fetch('/api/board');if(!r.ok)throw Error();const data=await r.json();if(!busy&&!drag&&!document.activeElement?.matches('[data-inline-label],[contenteditable="true"]')&&!document.querySelector('dialog[open]')&&(!board||data.revision!==board.revision)){board=data;render();if(first)fit();}$('#save-status').textContent='Saved to this server';}catch{$('#save-status').textContent='Server disconnected';if(first){$('#loading').textContent='Cannot reach the server. Reconnecting…';}}}
refresh(true);setInterval(()=>{if(!busy)refresh();},3000);

// Delete only canvas selections; text editing and open dialogs retain normal keys.
document.addEventListener('keydown', e => {
  if(!['Delete','Backspace'].includes(e.key) || e.repeat || e.target.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open]')) return;
  if(!selectedImage && !selected)return;
  e.preventDefault();
  const image=board.images.find(i=>i.id===selectedImage);
  const section=board.buckets.find(b=>b.id===selected);
  if(image){
    safe(async()=>{await mutate({type:'deleteImage',id:image.id});selectedImage=null;});
  }else if(section){
    const count=board.images.filter(i=>i.bucketId===section.id).length;
    $('#delete-section-dialog').dataset.sectionId=section.id;
    $('#delete-section-message').textContent='Are you sure you want to delete “'+section.name+'”?'+(count?' This also removes its '+count+' image'+(count===1?'':'s')+'.':'')+' You can undo this with Cmd/Ctrl+Z.';
    modal($('#delete-section-dialog'));
  }
});

async function undoLastEdit(){
  if(busy || !undoStack.length)return;
  const token=undoStack[undoStack.length-1];
  try{await mutate({type:'undo',token});undoStack.pop();toast('Last edit undone.');}catch(e){ /* Preserve history when the server cannot apply it. */ }
}
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&!e.target.closest('input,textarea,select,[contenteditable="true"]')&&!document.querySelector('dialog[open]')){
    e.preventDefault();safe(undoLastEdit);
  }
});

function renderSectionPicker(){
  $('#sections-options').innerHTML = board.buckets.length ? board.buckets.map(b=>`<button class="ds-btn ds-btn--ghost" data-jump-section="${b.id}">${escapeHTML(b.name)}</button>`).join('') : '<p>No sections yet</p>';
}
function closeSectionPicker(){ $('#sections-popup').hidden=true;$('#sections-toggle').setAttribute('aria-expanded','false'); }
$('#sections-toggle').onclick=()=>{
  const open=$('#sections-popup').hidden;
  $('#sections-popup').hidden=!open;$('#sections-toggle').setAttribute('aria-expanded',String(open));
  if(open)$('#sections-options button')?.focus();
};
$('#sections-options').onclick=e=>{
  const button=e.target.closest('[data-jump-section]');if(!button)return;
  const b=board.buckets.find(b=>b.id===button.dataset.jumpSection);if(!b)return;
  closeSectionPicker();select(b.id);
  const width=b.width||540,height=b.height||440;
  scale=Math.max(.15,Math.min(1.25,(viewport.clientWidth-100)/width,(viewport.clientHeight-160)/height));
  tx=(viewport.clientWidth-width*scale)/2-b.x*scale;
  ty=(viewport.clientHeight-60-height*scale)/2-b.y*scale;
  transform();$('#sections-toggle').focus();
};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.mb-section-picker'))closeSectionPicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sections-popup').hidden){closeSectionPicker();$('#sections-toggle').focus();}});

$('#delete-section-form').onsubmit=e=>{
  e.preventDefault();
  const dialog=$('#delete-section-dialog'),button=e.submitter;
  if(button)button.disabled=true;
  safe(async()=>{try{
    await mutate({type:'deleteBucket',bucketId:dialog.dataset.sectionId,includeImages:true});
    selectedImage=null;select(null);dialog.close();viewport.focus({preventScroll:true});
  }finally{if(button)button.disabled=false;}});
};

function referenceText(item){
 const section=board.buckets.find(b=>b.id===item.bucketId);
 return `${section?.name || 'Unsectioned'} → ${item.id}\nImage ID: ${item.id}\nImage: ${location.origin}${item.url}\n${item.note ? 'Direction: '+item.note+'\n' : ''}${item.source ? 'Source: '+item.source : ''}`.trim();
}
async function copyReference(id){
 const item=board.images.find(i=>i.id===id);if(!item)return;
 try{await navigator.clipboard.writeText(referenceText(item));toast('Section → image reference copied.');}
 catch{toast('Clipboard unavailable. Open the reference and copy its label and notes.');}
}
async function copyImage(id){
 const item=board.images.find(i=>i.id===id);if(!item)return;
 try{if(!navigator.clipboard?.write)throw Error();await navigator.clipboard.write([new ClipboardItem({'image/png':fetch(item.url).then(r=>{if(!r.ok)throw Error();return r.blob();})})]);toast('Image copied. Paste it into your conversation.');}
 catch{toast('Copy needs localhost or HTTPS and clipboard permission. Open the reference to download the image.');}
}
function clearGuides(){document.querySelectorAll('.mb-snap-guide').forEach(el=>el.remove());}
function snapImage(d,x,y,disabled){
 clearGuides();if(disabled||!d.b)return {x,y};
 const w=d.image.offsetWidth,h=d.image.querySelector('img').offsetHeight;
 const targetsX=[0,(d.b.width||540)/2,d.b.width||540],targetsY=[0,(d.b.height||440)/2,d.b.height||440];
 d.el.querySelectorAll('[data-move-image]').forEach(el=>{
  if(el===d.image)return;
  const left=parseFloat(el.style.left),top=parseFloat(el.style.top),width=el.offsetWidth,height=el.querySelector('img').offsetHeight;
  targetsX.push(left,left+width/2,left+width);targetsY.push(top,top+height/2,top+height);
 });
 function axis(pos,size,targets){let delta=7/scale,answer=pos,guide=null;
  for(const target of targets)for(const offset of [0,size/2,size]){const diff=target-(pos+offset);if(Math.abs(diff)<delta){delta=Math.abs(diff);answer=pos+diff;guide=target;}}
  return {value:answer,guide};
 }
 const sx=axis(x,w,targetsX),sy=axis(y,h,targetsY);
 for(const [direction,result] of [['x',sx],['y',sy]])if(result.guide!==null){const el=document.createElement('div');el.className='mb-snap-guide mb-snap-'+direction;el.style[direction==='x'?'left':'top']=result.guide+'px';d.el.append(el);}
 return {x:sx.value,y:sy.value};
}

function snapSection(d,x,y,disabled){
 clearGuides();if(disabled)return {x,y};
 const w=d.b.width||540,h=d.b.height||440;
 const others=board.buckets.filter(b=>b.id!==d.b.id);
 function axis(pos,size,key,dimension){
  let distance=7/scale,answer=pos,match=null;
  for(const b of others){const origin=b[key],extent=b[dimension]||(dimension==='width'?540:440);
   for(const target of [origin,origin+extent/2,origin+extent])for(const offset of [0,size/2,size]){
    const delta=target-pos-offset;
    if(Math.abs(delta)<distance){distance=Math.abs(delta);answer=pos+delta;match={target,b};}
   }
  }
  return {value:answer,match};
 }
 const sx=axis(x,w,'x','width'),sy=axis(y,h,'y','height');
 for(const [direction,result] of [['x',sx],['y',sy]]){
  if(!result.match)continue;
  const {target,b}=result.match,guide=document.createElement('div');
  guide.className='mb-snap-guide';
  if(direction==='x'){
   const top=Math.min(sy.value,b.y)-16,bottom=Math.max(sy.value+h,b.y+(b.height||440))+16;
   Object.assign(guide.style,{left:target+'px',top:top+'px',width:1/scale+'px',height:bottom-top+'px'});
  }else{
   const left=Math.min(sx.value,b.x)-16,right=Math.max(sx.value+w,b.x+(b.width||540))+16;
   Object.assign(guide.style,{left:left+'px',top:target+'px',height:1/scale+'px',width:right-left+'px'});
  }
  world.append(guide);
 }
 return {x:sx.value,y:sy.value};
}

function imageMarkup(i,k=0){return `<div class="mb-free-image" data-move-image="${i.id}" style="left:${i.x??24+k*32}px;top:${i.y??60+k*32}px;width:${i.width||260}px"><img src="${i.url}" alt="${escapeHTML(i.title)}" draggable="false"><button class="ds-btn ds-btn--secondary mb-expand-image" data-image="${i.id}" aria-label="Expand image" title="Expand image">⤢</button><div class="mb-image-caption"><textarea rows="1" class="ds-input ds-input--inline mb-image-label" data-inline-label="${i.id}" aria-label="What to take from this image" placeholder="What to take from this image…" title="${escapeHTML(i.note || "Click to add a direction note")}" maxlength="5000">${escapeHTML(i.note || "")}</textarea><div class="mb-image-tools"><button class="ds-btn ds-btn--secondary" data-copy-ref="${i.id}">Copy reference</button><button class="ds-btn ds-btn--secondary" data-copy-png="${i.id}">Copy image</button></div></div></div>`;}

function sectionAt(x,y){return [...board.buckets].reverse().find(b=>x>=b.x&&x<=b.x+(b.width||540)&&y>=b.y&&y<=b.y+(b.height||440));}
function nearestVisibleSection(){
 const left=-tx/scale,top=-ty/scale,right=left+viewport.clientWidth/scale,bottom=top+viewport.clientHeight/scale;
 const cx=(left+right)/2,cy=(top+bottom)/2;
 return board.buckets.filter(b=>b.x<right&&b.x+(b.width||540)>left&&b.y<bottom&&b.y+(b.height||440)>top).sort((a,b)=>Math.hypot(a.x+(a.width||540)/2-cx,a.y+(a.height||440)/2-cy)-Math.hypot(b.x+(b.width||540)/2-cx,b.y+(b.height||440)/2-cy))[0];
}

world.addEventListener('change',e=>{
 const input=e.target.closest('[data-inline-label]');if(!input)return;
 const item=board.images.find(i=>i.id===input.dataset.inlineLabel);if(!item)return;
 const note=input.value.trim();
 if(note!==item.note)safe(()=>mutate({type:'editImage',id:item.id,note}));
});
world.addEventListener('keydown',e=>{
 const input=e.target.closest('[data-inline-label]');if(!input)return;
 if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();input.blur();viewport.focus({preventScroll:true});}
 if(e.key==='Escape'){e.preventDefault();input.value=board.images.find(i=>i.id===input.dataset.inlineLabel)?.note||'';input.blur();viewport.focus({preventScroll:true});}
});

// Dismiss only when the gesture starts and ends on the backdrop, not while
// selecting text or dragging from the preview onto the backdrop.
let detailBackdropDown=false;
function outsideDetail(e){const r=$('#detail').getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;}
$('#detail').addEventListener('pointerdown',e=>{detailBackdropDown=e.target===$('#detail')&&outsideDetail(e);});
$('#detail').addEventListener('click',e=>{if(detailBackdropDown&&e.target===$('#detail')&&outsideDetail(e))$('#detail').close();detailBackdropDown=false;});

world.addEventListener('dblclick',e=>{
 const title=e.target.closest('.mb-bucket-head h2');if(!title)return;
 const section=board.buckets.find(b=>b.id===title.closest('[data-bucket]').dataset.bucket);if(!section)return;
 e.preventDefault();
 title.contentEditable='true';title.setAttribute('role','textbox');title.setAttribute('aria-label','Section title');
 title.focus({preventScroll:true});
 const range=document.createRange();range.selectNodeContents(title);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
 let finished=false;
 const finish=cancel=>{
  if(finished)return;finished=true;
  const name=title.textContent.trim()||section.name;
  title.contentEditable='false';title.removeAttribute('role');title.removeAttribute('aria-label');title.textContent=cancel?section.name:name;
  if(!cancel&&name!==section.name)safe(()=>mutate({type:'editBucket',bucketId:section.id,name}));
 };
 title.addEventListener('blur',()=>finish(false),{once:true});
 title.onkeydown=event=>{
  event.stopPropagation();
  if(event.key==='Enter'||event.key==='Escape'){event.preventDefault();finish(event.key==='Escape');title.blur();viewport.focus({preventScroll:true});}
 };
 title.onpaste=event=>{
  event.preventDefault();event.stopPropagation();
  document.execCommand('insertText',false,event.clipboardData.getData('text/plain').replace(/\r?\n/g,' ').slice(0,200));
 };
});

function expandInlineNote(input){
 input.style.height='auto';input.style.height=input.scrollHeight+'px';
}
world.addEventListener('focusin',e=>{const input=e.target.closest('[data-inline-label]');if(input)expandInlineNote(input);});
world.addEventListener('input',e=>{const input=e.target.closest('[data-inline-label]');if(input)expandInlineNote(input);});
world.addEventListener('focusout',e=>{const input=e.target.closest('[data-inline-label]');if(input)input.style.height='';});

function rowPlacement(section,id,x,y){
 const images=board.images.filter(i=>i.bucketId===section.id&&i.id!==id);
 if(!images.length)return {row:0,order:0};
 const rows=[...new Set(images.map(i=>i.row||0))].sort((a,b)=>a-b);
 const last=rows.at(-1),lastImages=images.filter(i=>(i.row||0)===last);
 const bottom=Math.max(...lastImages.map(i=>i.y+(i.layoutHeight||320)));
 if(y>bottom+8)return {row:last+1,order:0};
 const row=rows.reduce((best,r)=>{
  const center=n=>{const items=images.filter(i=>(i.row||0)===n);return items[0].y+Math.max(...items.map(i=>i.layoutHeight||320))/2;};
  return Math.abs(center(r)-y)<Math.abs(center(best)-y)?r:best;
 },rows[0]);
 const items=images.filter(i=>(i.row||0)===row).sort((a,b)=>a.order-b.order);
 const before=items.find(i=>x<i.x+(i.width||260)/2);
 return {row,order:before?before.order-.5:items.at(-1).order+.5};
}

// A mostly-overlapping card still belongs to the section when its lower half
// extends into the space for a new row. Row layout expands the saved bounds.
function imageDropSection(x,y,width,height,source){
 const cx=x+width/2,cy=y+height/2;
 const direct=sectionAt(cx,cy);if(direct)return direct;
 let best=null,bestOverlap=0;
 for(const b of board.buckets){
  const overlapX=Math.max(0,Math.min(x+width,b.x+(b.width||540))-Math.max(x,b.x));
  const overlapY=Math.max(0,Math.min(y+height,b.y+(b.height||440))-Math.max(y,b.y));
  const overlap=overlapX*overlapY/(width*height);
  if(overlap>=.35&&overlap>bestOverlap){best=b;bestOverlap=overlap;}
 }
 if(best)return best;
 // Continue a row gesture just below its source section without forcing users
 // to enlarge the section before they can create that row.
 if(source&&cx>=source.x&&cx<=source.x+(source.width||540)&&y>=source.y&&y<=source.y+(source.height||440)+48)return source;
 return null;
}

async function copySectionReference(id){
 const section=board.buckets.find(b=>b.id===id);if(!section)return;
 const images=board.images.filter(i=>i.bucketId===id).sort((a,b)=>(a.row||0)-(b.row||0)||(a.order||0)-(b.order||0));
 const text=[`Moodboard section: ${section.name}`,`Section ID: ${section.id}`,
  `Refer to all ${images.length} image${images.length===1?'':'s'} in this section as design inspiration.`,
  'Workspace lookup: .moodboard-data/board.json → buckets[].id; images[].bucketId matches this section ID. Open each original at .moodboard-data/images/<image-id>.png.',
  '',images.length?images.map((item,index)=>`${index+1}. ${referenceText(item)}`).join('\n\n'):'This section currently has no images.'
 ].join('\n');
 try{await navigator.clipboard.writeText(text);toast('Section reference copied, including all image references and notes.');}
 catch{toast('Clipboard unavailable. Use localhost or allow clipboard access.');}
}

let regionActive=false,regionDrag=null,regionClickSuppressed=false;
function resetRegionTool(){regionActive=false;regionDrag=null;$('#region-tool').setAttribute('aria-pressed','false');$('#detail-image').classList.remove('mb-region-active');document.querySelector('.mb-region-box')?.remove();}
$('#region-tool').onclick=()=>{regionActive=!regionActive;$('#region-tool').setAttribute('aria-pressed',String(regionActive));$('#detail-image').classList.toggle('mb-region-active',regionActive);};
$('#original').addEventListener('click',e=>{if(regionActive||regionClickSuppressed){e.preventDefault();regionClickSuppressed=false;}});
$('#detail').addEventListener('close',resetRegionTool);
function regionPoint(e,r){return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};}
$('#detail-image').addEventListener('pointerdown',e=>{
 if(!regionActive||e.button!==0)return;e.preventDefault();e.stopPropagation();
 const img=e.currentTarget,r=img.getBoundingClientRect();
 if(!img.naturalWidth||!r.width)return;
 document.querySelector('.mb-region-box')?.remove();
 const box=document.createElement('div');box.className='mb-region-box';$('#original').append(box);
 regionDrag={rect:r,start:regionPoint(e,r),box,pointer:e.pointerId};img.setPointerCapture(e.pointerId);
});
$('#detail-image').addEventListener('pointermove',e=>{
 if(!regionDrag||regionDrag.pointer!==e.pointerId)return;
 const d=regionDrag,p=regionPoint(e,d.rect);Object.assign(d.box.style,{left:Math.min(d.start.x,p.x)+'px',top:Math.min(d.start.y,p.y)+'px',width:Math.abs(p.x-d.start.x)+'px',height:Math.abs(p.y-d.start.y)+'px'});
});
$('#detail-image').addEventListener('pointerup',e=>{
 if(!regionDrag||regionDrag.pointer!==e.pointerId)return;e.preventDefault();
 const d=regionDrag;regionDrag=null;const p=regionPoint(e,d.rect),img=e.currentTarget;
 const left=Math.min(d.start.x,p.x),top=Math.min(d.start.y,p.y),width=Math.abs(p.x-d.start.x),height=Math.abs(p.y-d.start.y);
 if(width<5||height<5){d.box.remove();toast('Draw a slightly larger rectangle.');return;}
 const x=Math.floor(left/d.rect.width*img.naturalWidth),y=Math.floor(top/d.rect.height*img.naturalHeight);
 const right=Math.min(img.naturalWidth,Math.ceil((left+width)/d.rect.width*img.naturalWidth)),bottom=Math.min(img.naturalHeight,Math.ceil((top+height)/d.rect.height*img.naturalHeight));
 const item=board.images.find(i=>i.id===editing);if(!item)return;
 const text=referenceText(item)+'\n\nSelected image region (original image pixels, origin at top-left):\n'+JSON.stringify({imageId:item.id,imageWidth:img.naturalWidth,imageHeight:img.naturalHeight,region:{x,y,width:right-x,height:bottom-y}})+'\nInspect this rectangle within .moodboard-data/images/'+item.id+'.png as the specific visual reference. The original image is unchanged.';
 regionActive=false;regionClickSuppressed=true;
 $('#region-tool').setAttribute('aria-pressed','false');$('#detail-image').classList.remove('mb-region-active');
 d.box.style.transition='opacity 2s ease';requestAnimationFrame(()=>{d.box.style.opacity='0';});setTimeout(()=>d.box.remove(),2000);
 navigator.clipboard.writeText(text).then(()=>toast('Region reference copied. Paste it into your LLM conversation.')).catch(()=>{toast('Clipboard blocked. Select and copy the region reference below.');const field=document.createElement('textarea');field.className='ds-input';field.value=text;$('#reference-form').append(field);field.focus();field.select();});
});
$('#detail-image').addEventListener('pointercancel',()=>{regionDrag?.box.remove();regionDrag=null;});

$('#detail').addEventListener('cancel',e=>{
 if(regionActive||regionDrag){e.preventDefault();resetRegionTool();}
});
