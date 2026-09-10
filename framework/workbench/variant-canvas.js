(function(root){
 const geometry={
  clamp(camera,bounds,width,height){const margin=64;return {...camera,x:Math.max(margin-bounds.width*camera.z,Math.min(width-margin,camera.x)),y:Math.max(margin-bounds.height*camera.z,Math.min(height-margin,camera.y))};},
  fit(bounds,width,height){const z=Math.min(1,(width-48)/bounds.width,(height-48)/bounds.height);return {z:Math.max(.01,z),x:(width-bounds.width*z)/2,y:(height-bounds.height*z)/2};}
 };
 if(typeof module==='object'&&module.exports){module.exports=geometry;return;}
 root.StudioVariantCanvas={mount(grid,controls){
  const tiles=[...grid.children],abort=new AbortController(),on=(node,event,fn,options={})=>node.addEventListener(event,fn,{...options,signal:abort.signal});
  const host=document.createElement('div');host.className='vc-canvas';host.tabIndex=0;host.setAttribute('aria-label','Variant canvas');grid.replaceWith(host);host.append(grid);grid.classList.add('vc-world');
  const dock=document.createElement('div');dock.className='vc-dock';dock.innerHTML='<button type="button" data-vc-zoom="out" aria-label="Zoom variants out">−</button><output></output><button type="button" data-vc-zoom="in" aria-label="Zoom variants in">+</button><button type="button" data-vc-center>Recenter</button>';host.append(dock);
  let camera={x:0,y:0,z:1},bounds={width:1,height:1},fitted=false,focusedVariant=tiles[0]?.dataset.variant,drag=null,moved=false,raf=0;
  const paint=()=>{camera=geometry.clamp(camera,bounds,host.clientWidth,host.clientHeight-52);grid.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;dock.querySelector('output').textContent=Math.round(camera.z*100)+'%';};
  const recenter=()=>{focusedVariant=null;fitted=true;camera=geometry.fit(bounds,host.clientWidth,host.clientHeight-52);paint();};
  const layout=()=>{
   const width=Math.max(280,...tiles.map(tile=>Number(tile.dataset.requiredWidth)||320));
   const height=Math.max(96,...tiles.map(tile=>tile.querySelector('iframe').offsetHeight+tile.querySelector('header').offsetHeight+16));
   const cols=Math.max(1,Math.ceil(Math.sqrt(tiles.length))),gap=24;
   tiles.forEach((tile,i)=>{Object.assign(tile.style,{width:width+32+'px',height:height+'px',left:(i%cols)*(width+32+gap)+'px',top:Math.floor(i/cols)*(height+gap)+'px'});});
   bounds={width:cols*(width+32+gap)-gap,height:Math.ceil(tiles.length/cols)*(height+gap)-gap};
   grid.style.width=bounds.width+'px';grid.style.height=bounds.height+'px';if(focusedVariant)focusTile(focusedVariant);else if(fitted)recenter();else paint();
  };
  const focusTile=id=>{const tile=tiles.find(tile=>tile.dataset.variant===id);if(!tile)return;focusedVariant=id;fitted=false;const z=Math.max(.01,Math.min(1,(host.clientWidth-48)/tile.offsetWidth,(host.clientHeight-100)/tile.offsetHeight));camera={z,x:host.clientWidth/2-(parseFloat(tile.style.left)+tile.offsetWidth/2)*z,y:(host.clientHeight-52)/2-(parseFloat(tile.style.top)+tile.offsetHeight/2)*z};paint();};
  on(grid,'focus-variant',event=>focusTile(event.detail));
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(layout);};
  const frameCleanups=[];
  tiles.forEach(tile=>{
   const frame=tile.querySelector('iframe');tile.dataset.requiredWidth=parseFloat(tile.style.getPropertyValue('--variant-preview-width'))||320;
   const select=document.createElement('button');select.type='button';select.className='vc-select';select.setAttribute('aria-label','Select '+tile.querySelector('.cc-variant-select').textContent+' variant');tile.append(select);
   const connect=()=>{try{const doc=frame.contentDocument;const measure=()=>{const required=Math.max(Number(tile.dataset.requiredWidth),doc.documentElement.scrollWidth);tile.dataset.requiredWidth=required;frame.style.width=required+'px';schedule();};const ro=new ResizeObserver(measure);ro.observe(doc.body);frameCleanups.push(()=>ro.disconnect());measure();}catch{}};on(frame,'load',connect);if(frame.contentDocument?.readyState==='complete')connect();
  });
  const ro=new ResizeObserver(schedule);ro.observe(host);tiles.forEach(tile=>ro.observe(tile.querySelector('iframe')));
  const syncMode=()=>{host.classList.toggle('vc-inspecting',['spacing','component'].includes(controls?.querySelector('[aria-pressed=true]')?.dataset.previewMode));};
  if(controls)on(controls,'click',syncMode);
  const zoom=(factor,x=host.clientWidth/2,y=(host.clientHeight-52)/2)=>{focusedVariant=null;fitted=false;const z=Math.max(.05,Math.min(2,camera.z*factor));camera={x:x-(x-camera.x)*z/camera.z,y:y-(y-camera.y)*z/camera.z,z};paint();};
  on(dock,'click',event=>{event.stopPropagation();if(event.target.closest('[data-vc-center]'))recenter();const button=event.target.closest('[data-vc-zoom]');if(button)zoom(button.dataset.vcZoom==='in'?1.2:1/1.2);});
  on(host,'wheel',event=>{if(host.classList.contains('vc-inspecting'))return;event.preventDefault();event.stopPropagation();if(event.ctrlKey||event.metaKey){const r=host.getBoundingClientRect();zoom(Math.exp(-event.deltaY*.005),event.clientX-r.left,event.clientY-r.top);}else{focusedVariant=null;fitted=false;camera.x-=event.deltaX;camera.y-=event.deltaY;paint();}},{passive:false});
  on(host,'pointerdown',event=>{if(event.button!==0||event.target.closest('.vc-dock,.cc-variant-copy,.cc-variant-select')||host.classList.contains('vc-inspecting'))return;drag={x:event.clientX,y:event.clientY,cx:camera.x,cy:camera.y};moved=false;});
  on(host,'pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>4){moved=true;focusedVariant=null;fitted=false;host.setPointerCapture(event.pointerId);camera.x=drag.cx+dx;camera.y=drag.cy+dy;paint();}});
  on(host,'pointerup',()=>{drag=null;setTimeout(()=>{moved=false;},0);});on(host,'pointercancel',()=>{drag=null;moved=false;});
  on(host,'click',event=>{if(moved){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  on(host,'keydown',event=>{if(event.target!==host)return;const delta={ArrowLeft:[64,0],ArrowRight:[-64,0],ArrowUp:[0,64],ArrowDown:[0,-64]}[event.key];if(delta){event.preventDefault();focusedVariant=null;fitted=false;camera.x+=delta[0];camera.y+=delta[1];paint();}else if(event.key==='+'||event.key==='=')zoom(1.2);else if(event.key==='-')zoom(1/1.2);else if(event.key==='Home'){event.preventDefault();recenter();}});
  schedule();return ()=>{abort.abort();ro.disconnect();frameCleanups.forEach(fn=>fn());cancelAnimationFrame(raf);};
 }};
})(typeof window!=='undefined'?window:globalThis);
