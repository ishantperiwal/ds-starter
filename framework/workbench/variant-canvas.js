(function(root){
 const geometry={
  clamp(camera,bounds,width,height){const margin=64;return {...camera,x:Math.max(margin-bounds.width*camera.z,Math.min(width-margin,camera.x)),y:Math.max(margin-bounds.height*camera.z,Math.min(height-margin,camera.y))};},
  fit(bounds,width,height){const z=Math.min(1,(width-48)/bounds.width,(height-48)/bounds.height);return {z:Math.max(.01,z),x:(width-bounds.width*z)/2,y:(height-bounds.height*z)/2};}
 };
 if(typeof module==='object'&&module.exports){module.exports=geometry;return;}
 root.StudioVariantCanvas={mount(grid,controls){
  const tiles=[...grid.children],abort=new AbortController(),on=(node,event,fn,options={})=>node.addEventListener(event,fn,{...options,signal:abort.signal});
  const host=document.createElement('div');host.className='vc-canvas';host.tabIndex=0;host.setAttribute('aria-label','Variant canvas');grid.replaceWith(host);host.append(grid);grid.classList.add('vc-world');
  const edge=document.createElement('div');edge.className='vc-edge-right';edge.setAttribute('aria-hidden','true');host.append(edge);
  const leftEdge=edge.cloneNode();leftEdge.className='vc-edge-left';host.append(leftEdge);
  const dock=document.createElement('div');dock.className='vc-dock';dock.innerHTML='<button type="button" data-vc-zoom="out" aria-label="Zoom variants out">−</button><output></output><button type="button" data-vc-zoom="in" aria-label="Zoom variants in">+</button><button type="button" data-vc-center>Recenter</button>';host.append(dock);
  let camera={x:0,y:0,z:1},bounds={width:1,height:1},fitted=false,focusedVariant=tiles[0]?.dataset.variant,drag=null,moved=false,raf=0,motion=0;
  const paint=()=>{camera=geometry.clamp(camera,bounds,host.clientWidth,host.clientHeight-52);grid.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;dock.querySelector('output').textContent=Math.round(camera.z*100)+'%';};
  const stopMotion=()=>{cancelAnimationFrame(motion);motion=0;};
  const moveTo=(next,animate=false)=>{
   stopMotion();next=geometry.clamp(next,bounds,host.clientWidth,host.clientHeight-52);
   if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){camera=next;paint();return;}
   const start={...camera},time=performance.now();
   const step=now=>{const progress=Math.min(1,(now-time)/320),ease=1-Math.pow(1-progress,3);camera={x:start.x+(next.x-start.x)*ease,y:start.y+(next.y-start.y)*ease,z:start.z+(next.z-start.z)*ease};paint();motion=progress<1?requestAnimationFrame(step):0;};
   motion=requestAnimationFrame(step);
  };
  const recenter=()=>{focusedVariant=null;fitted=true;moveTo(geometry.fit(bounds,host.clientWidth,host.clientHeight-52));};
  const layout=()=>{
   const width=Math.max(280,...tiles.map(tile=>Number(tile.dataset.requiredWidth)||320));
   const height=Math.max(96,...tiles.map(tile=>tile.querySelector('iframe').offsetHeight+tile.querySelector('header').offsetHeight+16));
   const cols=Math.max(1,Math.min(tiles.length,Number(grid.dataset.columns)||Math.ceil(Math.sqrt(tiles.length)))),gap=24;
   tiles.forEach((tile,i)=>{Object.assign(tile.style,{width:width+32+'px',height:height+'px',left:(i%cols)*(width+32+gap)+'px',top:Math.floor(i/cols)*(height+gap)+'px'});});
   bounds={width:cols*(width+32+gap)-gap,height:Math.ceil(tiles.length/cols)*(height+gap)-gap};
   grid.style.width=bounds.width+'px';grid.style.height=bounds.height+'px';if(focusedVariant)focusTile(focusedVariant,!!motion);else if(fitted)recenter();else paint();
  };
  const focusTile=(id,animate=false)=>{const tile=tiles.find(tile=>tile.dataset.variant===id);if(!tile)return;focusedVariant=id;fitted=false;const z=Math.max(.01,Math.min(1,(host.clientWidth-48)/tile.offsetWidth,(host.clientHeight-100)/tile.offsetHeight));moveTo({z,x:host.clientWidth/2-(parseFloat(tile.style.left)+tile.offsetWidth/2)*z,y:(host.clientHeight-52)/2-(parseFloat(tile.style.top)+tile.offsetHeight/2)*z},animate);};
  on(grid,'focus-variant',event=>focusTile(event.detail,true));
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(layout);};
  function switchMode(event){
   if(event.defaultPrevented||event.isComposing||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
   const target=event.target;
   if(target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="searchbox"],dialog,[popover]'))return;
   const mode={escape:'preview',p:'preview',s:'spacing',c:'component'}[event.key.toLowerCase()];
   const button=mode&&controls?.querySelector('[data-preview-mode="'+mode+'"]');if(!button)return;
   event.preventDefault();event.stopPropagation();button.click();
  }
  const card=host.closest('.cc-detail');if(card)on(card,'keydown',switchMode);
  controls?.querySelectorAll('[data-preview-mode]').forEach(button=>{const key={preview:'P',spacing:'S',component:'C'}[button.dataset.previewMode];button.setAttribute('aria-keyshortcuts',key==='P'?'Escape P':key);button.title=button.textContent+' ('+(key==='P'?'Esc / P':key)+')';const badge=document.createElement('kbd');badge.className='cc-shortcut-key';badge.textContent=key==='P'?'Esc':key;badge.setAttribute('aria-hidden','true');button.append(badge);});
  const frameCleanups=[];
  tiles.forEach(tile=>{
   const frame=tile.querySelector('iframe');tile.dataset.requiredWidth=parseFloat(tile.style.getPropertyValue('--variant-preview-width'))||320;
   const connect=()=>{try{const doc=frame.contentDocument;[doc.documentElement,doc.body].forEach(node=>{const previous=node.style.overscrollBehavior;node.style.overscrollBehavior='none';frameCleanups.push(()=>{node.style.overscrollBehavior=previous;});});doc.addEventListener('keydown',switchMode,true);frameCleanups.push(()=>doc.removeEventListener('keydown',switchMode,true));const frameWheel=event=>handleWheel(event,frame);doc.addEventListener('wheel',frameWheel,{passive:false,capture:true});frameCleanups.push(()=>doc.removeEventListener('wheel',frameWheel,true));const measure=()=>{const required=Math.max(Number(tile.dataset.requiredWidth),doc.documentElement.scrollWidth);tile.dataset.requiredWidth=required;frame.style.width=required+'px';schedule();};const ro=new ResizeObserver(measure);ro.observe(doc.body);frameCleanups.push(()=>ro.disconnect());measure();}catch{}};on(frame,'load',connect);if(frame.contentDocument?.readyState==='complete')connect();
  });
  const ro=new ResizeObserver(schedule);ro.observe(host);tiles.forEach(tile=>ro.observe(tile.querySelector('iframe')));
  const syncMode=()=>{host.classList.toggle('vc-inspecting',['spacing','component'].includes(controls?.querySelector('[aria-pressed=true]')?.dataset.previewMode));};
  if(controls)on(controls,'click',syncMode);
  const zoom=(factor,x=host.clientWidth/2,y=(host.clientHeight-52)/2)=>{stopMotion();focusedVariant=null;fitted=false;const z=Math.max(.05,Math.min(2,camera.z*factor));camera={x:x-(x-camera.x)*z/camera.z,y:y-(y-camera.y)*z/camera.z,z};paint();};
  on(dock,'click',event=>{event.stopPropagation();if(event.target.closest('[data-vc-center]'))recenter();const button=event.target.closest('[data-vc-zoom]');if(button)zoom(button.dataset.vcZoom==='in'?1.2:1/1.2);});
  function handleWheel(event,frame){
   event.preventDefault();event.stopPropagation();stopMotion();
   const unit=event.deltaMode===1?16:event.deltaMode===2?host.clientHeight:1,dx=event.deltaX*unit,dy=event.deltaY*unit;
   if(event.ctrlKey||event.metaKey){const r=host.getBoundingClientRect(),f=frame?.getBoundingClientRect();const x=f?f.left+event.clientX*camera.z:event.clientX,y=f?f.top+event.clientY*camera.z:event.clientY;zoom(Math.exp(-dy*.005),x-r.left,y-r.top);}
   else{focusedVariant=null;fitted=false;camera.x-=event.shiftKey&&!dx?dy:dx;camera.y-=event.shiftKey&&!dx?0:dy;paint();}
  }
  on(host,'wheel',event=>handleWheel(event),{passive:false,capture:true});
  on(host,'pointerdown',event=>{if(event.button!==0||event.target.closest('.vc-dock,.cc-preview-dock,.cg-view-toggle,.cc-variant-copy,.cc-variant-select')||host.classList.contains('vc-inspecting'))return;stopMotion();drag={x:event.clientX,y:event.clientY,cx:camera.x,cy:camera.y};moved=false;});
  on(host,'pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>4){moved=true;focusedVariant=null;fitted=false;host.setPointerCapture(event.pointerId);camera.x=drag.cx+dx;camera.y=drag.cy+dy;paint();}});
  on(host,'pointerup',()=>{drag=null;setTimeout(()=>{moved=false;},0);});on(host,'pointercancel',()=>{drag=null;moved=false;});
  on(host,'click',event=>{if(moved){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  on(host,'keydown',event=>{if(event.target!==host)return;const delta={ArrowLeft:[64,0],ArrowRight:[-64,0],ArrowUp:[0,64],ArrowDown:[0,-64]}[event.key];if(delta){event.preventDefault();stopMotion();focusedVariant=null;fitted=false;camera.x+=delta[0];camera.y+=delta[1];paint();}else if(event.key==='+'||event.key==='=')zoom(1.2);else if(event.key==='-')zoom(1/1.2);else if(event.key==='Home'){event.preventDefault();recenter();}});
  schedule();return ()=>{abort.abort();ro.disconnect();frameCleanups.forEach(fn=>fn());cancelAnimationFrame(raf);stopMotion();};
 }};
})(typeof window!=='undefined'?window:globalThis);
