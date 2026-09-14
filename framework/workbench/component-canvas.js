(function(root){
 const geometry={
  previewConfigurations(entry){return entry.previewConfigurations?.length?entry.previewConfigurations:[{id:'default',name:'Default'}];},
  isolatePreview(container,selector){
   if(!selector)return;
   const matches=container.querySelectorAll(selector);
   if(matches.length!==1)throw Error('Preview configuration must match exactly one source: '+selector);
   const source=matches[0];
   for(let node=source;node&&node!==container;node=node.parentElement){for(const sibling of node.parentElement.children)if(sibling!==node&&!sibling.matches('script,style,link'))sibling.setAttribute('data-preview-excluded','');}
   source.querySelectorAll(':scope > .caption, :scope > .launcher-caption').forEach(caption=>caption.setAttribute('data-preview-excluded',''));
   return source;
  },
  layout(sizes){const gap=48,limit=Math.max(1000,Math.sqrt(sizes.reduce((sum,s)=>sum+(s.width+gap)*(s.height+gap),0))*1.25);let x=0,y=0,rowHeight=0,w=1;const positions=sizes.map(({width,height})=>{if(x&&x+width>limit){x=0;y+=rowHeight+gap;rowHeight=0;}const p={x,y,width,height};x+=width+gap;rowHeight=Math.max(rowHeight,height);w=Math.max(w,x-gap);return p;});return {positions,w,h:Math.max(1,y+rowHeight)};},
  zoom(camera,factor,x,y){const z=Math.max(.05,Math.min(2,camera.z*factor));return {x:x-(x-camera.x)*z/camera.z,y:y-(y-camera.y)*z/camera.z,z};},
  trail(path,id){const i=path.indexOf(id);return i<0?[...path,id]:path.slice(0,i+1);}
 };
 if(typeof module==='object'&&module.exports)module.exports=geometry;else root.StudioCanvasGeometry=geometry;
})(typeof window!=='undefined'?window:globalThis);
/* Spatial catalog navigation. App previews and inspection remain owned by the
   existing workbench adapters; no app component markup is recreated here. */
if(typeof window!=='undefined')window.StudioComponentCanvas={mount({state,interactions,fit,spacing}){
 const M=StudioModel,V=StudioViews,entries=M.blocks(state.catalog),cards=[...document.querySelectorAll('.cg-card')];
 const root=document.createElement('section');root.className='cc-explorer';
 root.innerHTML='<div class="cc-tools"><button data-back hidden>← Back to All</button><nav class="cc-crumbs" aria-label="Component ancestry"></nav></div><div class="cc-zoom"><button data-zoom="out" aria-label="Zoom out">−</button><output>100%</output><button data-zoom="in" aria-label="Zoom in">+</button><button data-fit>Fit all</button></div><div class="cc-viewport" tabindex="0" aria-label="Component canvas. Arrow keys pan; plus and minus zoom."><div class="cc-world"></div></div><div class="cc-focus" hidden></div>';
 const toolbar=document.querySelector('.fd-toolbar');toolbar.after(root);
 const viewport=root.querySelector('.cc-viewport'),world=root.querySelector('.cc-world'),focus=root.querySelector('.cc-focus'),back=root.querySelector('[data-back]'),crumbs=root.querySelector('.cc-crumbs');
 cards.forEach(card=>{world.append(card);const open=card.querySelector('[data-component]');open?.removeAttribute('aria-haspopup');open?.setAttribute('aria-label','Explore '+entries.find(e=>'entry-'+e.id===card.id)?.name);const select=card.querySelector('[data-interactions]');select?.setAttribute('aria-label',open?.getAttribute('aria-label')||'Explore component');select?.removeAttribute('aria-expanded');});document.querySelectorAll('.wb-component-group').forEach(group=>group.remove());
 document.querySelector('.cg-dialog')?.remove();
 const abort=new AbortController(),on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:abort.signal});
 let camera={x:32,y:32,z:.65},bounds={w:1,h:1},trail=[],cleanups=[],selected=null,drag=null,suppressClick=false;
 const paint=()=>{world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;root.querySelector('output').textContent=Math.round(camera.z*100)+'%';};
 const layout=()=>{const visible=[...world.children].filter(c=>!c.hidden);bounds=StudioCanvasGeometry.layout(visible.map(card=>({width:card.offsetWidth,height:card.offsetHeight})));visible.forEach((card,i)=>{const p=bounds.positions[i];Object.assign(card.style,{left:p.x+'px',top:p.y+'px'});});};
 const fitAll=()=>{layout();camera.z=Math.max(.05,Math.min(1,(viewport.clientWidth-64)/bounds.w,(viewport.clientHeight-64)/bounds.h));camera.x=(viewport.clientWidth-bounds.w*camera.z)/2;camera.y=(viewport.clientHeight-bounds.h*camera.z)/2;paint();};
 const zoom=(factor,x=viewport.clientWidth/2,y=viewport.clientHeight/2)=>{camera=StudioCanvasGeometry.zoom(camera,factor,x,y);paint();};
 const clear=()=>{const navigation=root.querySelector('.cc-tools');if(navigation&&focus.contains(navigation))root.prepend(navigation);cleanups.forEach(fn=>fn());cleanups=[];focus.replaceChildren();};
 const show=(id,push=true)=>{
 const entry=entries.find(e=>e.id===id);if(!entry)return;
 if(push){trail=StudioCanvasGeometry.trail(trail,id);}selected=id;clear();
 root.classList.add('is-focused');viewport.inert=true;focus.hidden=false;back.hidden=false;
 crumbs.replaceChildren();trail.forEach((key,i)=>{const button=document.createElement('button');button.textContent=entries.find(e=>e.id===key)?.name||key;button.setAttribute('aria-current',i===trail.length-1?'page':'false');button.onclick=()=>{trail=trail.slice(0,i+1);show(key,false);};crumbs.append(button);});
 let activeInteraction=id;const chosenVariants=new Map();
 const activate=(item,card)=>{if(!card.isConnected||!root.classList.contains('is-focused'))return;if(activeInteraction===item.id&&!document.querySelector('#component-interactions')?.hidden)return;activeInteraction=item.id;focus.querySelectorAll('.cc-detail').forEach(c=>c.classList.toggle('is-active',c===card));interactions?.open(item,card,false,chosenVariants.get(item.id));};
 const render=(item,child=false)=>{
   const card=document.createElement('article');card.className='cc-detail'+(child?' cc-detail-child':' is-active');card.tabIndex=0;card.setAttribute('aria-label',item.name+' component card');card.innerHTML=V.componentDetails(item,state);
   const sourceCopy=cards.find(c=>c.id==='entry-'+item.id)?.querySelector('[data-copy-component]');
   if(sourceCopy){const copy=sourceCopy.cloneNode(true);copy.addEventListener('click',event=>{event.stopPropagation();sourceCopy.click();});card.querySelector('.wb-spec-head h2')?.after(copy);}
   card.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));card.querySelectorAll('.wb-filterable').forEach(el=>el.classList.remove('wb-filterable'));focus.append(card);
   card.addEventListener('click',()=>activate(item,card));card.addEventListener('keydown',event=>{if(event.target===card&&['Enter',' '].includes(event.key)){event.preventDefault();activate(item,card);}});
   const targets=StudioCanvasGeometry.previewConfigurations(item),original=card.querySelector('iframe'),controls=card.querySelector('.cg-view-toggle');
   const bindFrame=(frame,target)=>{
     const prepare=()=>{const doc=frame.contentDocument,main=doc?.querySelector('main');if(!main)return;
       const style=doc.createElement('style');style.textContent='[data-preview-excluded]{display:none!important}';doc.head.append(style);
       try{
         const source=StudioCanvasGeometry.isolatePreview(main,target?.selector);
         const galleryFrame=cards.find(c=>c.id==='entry-'+item.id)?.querySelector('iframe');
         const syncDimensions=()=>{
           const gallery=galleryFrame?.contentDocument;
           if(!source||!gallery)return;
           const cells=[...gallery.querySelectorAll('.specimen-gallery-cell')];
           const matches=cells.filter(cell=>cell.querySelector('.specimen-gallery-caption')?.textContent.trim()===target.name);
           const example=matches.length===1?matches[0].querySelector('.specimen-gallery-source'):null;
           if(!example)return;
           // Measure CSS layout pixels, not canvas zoom. Only constrain the
           // specimen wrapper; component internals and live height stay intact.
           const width=example.getBoundingClientRect().width;
           if(width>0){source.style.setProperty('width',width+'px','important');source.style.setProperty('min-width',width+'px','important');source.style.setProperty('max-width',width+'px','important');source.style.setProperty('margin-inline','auto','important');}
         };
         syncDimensions();
         if(galleryFrame){galleryFrame.addEventListener('load',syncDimensions);cleanups.push(()=>galleryFrame.removeEventListener('load',syncDimensions));const observer=new ResizeObserver(syncDimensions);observer.observe(galleryFrame);cleanups.push(()=>observer.disconnect());}
       }catch(error){console.error(error);const message=doc.createElement('p');message.textContent='Preview configuration unavailable';main.replaceChildren(message);}
     };
     frame.addEventListener('load',prepare);cleanups.push(()=>frame.removeEventListener('load',prepare));
     if(frame.contentDocument?.readyState==='complete')prepare();
     cleanups.push(fit(frame),spacing(frame,item,controls));
     let removeFrameClick=()=>{};const connect=()=>{removeFrameClick();try{const doc=frame.contentDocument,click=()=>{if(target)selectVariant(target);else activate(item,card);};doc.addEventListener('click',click,true);removeFrameClick=()=>doc.removeEventListener('click',click,true);}catch{}};
     frame.addEventListener('load',connect);connect();cleanups.push(()=>{frame.removeEventListener('load',connect);removeFrameClick();});
   };
   const selectVariant=target=>{
     card.querySelector('.vc-world')?.dispatchEvent(new CustomEvent('focus-variant',{detail:target.id}));
     card.querySelectorAll('[data-variant-chip]').forEach(chip=>chip.setAttribute('aria-pressed',String(chip.dataset.variantChip===target.id)));
     card.querySelectorAll('.cc-variant').forEach(tile=>{const active=tile.dataset.variant===target.id;tile.classList.toggle('is-selected',active);tile.querySelector('.cc-variant-select').setAttribute('aria-pressed',String(active));});
     if(chosenVariants.get(item.id)===(target.interactionTarget||target.id)&&activeInteraction===item.id&&!document.querySelector('#component-interactions')?.hidden)return;
     chosenVariants.set(item.id,target.interactionTarget||target.id);activeInteraction=item.id;
     focus.querySelectorAll('.cc-detail').forEach(c=>c.classList.toggle('is-active',c===card));
     interactions?.open(item,card,false,target.interactionTarget||target.id);
   };
   if(targets.length&&original){
     const grid=document.createElement('div');grid.className='cc-variants';grid.dataset.columns=String(item.previewLayout?.columns||Math.ceil(Math.sqrt(targets.length)));original.replaceWith(grid);chosenVariants.set(item.id,targets[0].interactionTarget||targets[0].id);
     targets.forEach((target,index)=>{
       const tile=document.createElement('section');tile.className='cc-variant'+(index===0?' is-selected':'');tile.dataset.variant=target.id;tile.style.setProperty('--variant-preview-width',Math.max(280,Number(item.galleryWidth)||Number(item.interactions?.width)||320)+'px');
       const header=document.createElement('header'),select=document.createElement('button');select.type='button';select.className='cc-variant-select';select.textContent=target.name;select.setAttribute('aria-pressed',String(index===0));
       const copy=document.createElement('button');copy.type='button';copy.className='cc-variant-copy';copy.setAttribute('aria-label','Copy '+target.name+' variant reference');copy.title='Copy variant reference';copy.innerHTML='<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor"/><path d="M10 3V2H2v8h1" stroke="currentColor" stroke-linejoin="round"/></svg>';
       const url=new URL(M.previewURL(item,state.base,state.theme));
       copy.addEventListener('click',async event=>{event.stopPropagation();const text=['Component variant reference','Component: '+item.name,'ID: '+item.id,'Variant / target: '+target.name,'Variant / target ID: '+target.id,'Class: .'+item.class,'CSS: '+item.css,item.module?'Renderer: '+item.module:'','Catalog: '+location.origin+location.pathname+'#components/'+encodeURIComponent(item.id),'Preview source: '+url.href,target.selector?'Preview example selector: '+target.selector:''].filter(Boolean).join('\n');let ok=false;try{await navigator.clipboard.writeText(text);ok=true;}catch{const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;opacity:0';document.body.append(input);input.select();try{ok=document.execCommand('copy');}catch{}input.remove();copy.focus();}StudioToast.show(ok?'Copied '+item.name+' — '+target.name+' variant reference':'Could not copy '+target.name+' reference');});
       header.append(select,copy);const frame=document.createElement('iframe');frame.className='wb-preview';frame.title=item.name+' — '+target.name;frame.src=url.href;
       tile.append(header,frame);grid.append(tile);tile.addEventListener('click',()=>selectVariant(target));bindFrame(frame,target);
     });
     cleanups.push(StudioVariantCanvas.mount(grid,controls));
     const chips=document.createElement('nav');chips.className='cc-variant-chips';chips.setAttribute('aria-label',item.name+' variants');
     targets.forEach((target,index)=>{const chip=document.createElement('button');chip.type='button';chip.dataset.variantChip=target.id;const glyph=document.createElementNS('http://www.w3.org/2000/svg','svg');glyph.classList.add('cc-chip-icon');glyph.setAttribute('viewBox','0 0 16 16');glyph.setAttribute('fill','none');glyph.setAttribute('stroke','currentColor');glyph.setAttribute('stroke-width','1.25');glyph.setAttribute('stroke-linecap','round');glyph.setAttribute('stroke-linejoin','round');glyph.setAttribute('aria-hidden','true');glyph.innerHTML='<path d="m8 2 6 3.5L8 9 2 5.5 8 2Zm-6 8.5L8 14l6-3.5M2 8l6 3.5L14 8"/>';const label=document.createElement('span');label.textContent=target.name;chip.append(glyph,label);chip.setAttribute('aria-pressed',String(index===0));chip.addEventListener('click',event=>{event.stopPropagation();selectVariant(target);});chips.append(chip);});
     const contract=card.querySelector('.wb-contract');if(contract)contract.before(chips);else grid.closest('.wb-spec-body').after(chips);

   }else if(original)bindFrame(original);

   const contract=card.querySelector('.wb-contract');
   let chips=card.querySelector('.cc-variant-chips');
   if(!chips){chips=document.createElement('nav');chips.className='cc-variant-chips';card.append(chips);}
   const row=document.createElement('div');row.className='cc-variant-row';chips.replaceWith(row);row.append(chips);const previewBody=card.querySelector('.wb-spec-body');if(previewBody)previewBody.before(row);
   const expand=document.createElement('button');expand.type='button';expand.className='cc-more cc-preview-expand';expand.setAttribute('aria-label','Expand '+item.name+' preview');expand.title='Expand preview';expand.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 2h4v4M14 2 9 7M6 14H2v-4M2 14l5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';row.append(expand);
   expand.addEventListener('click',async event=>{event.stopPropagation();try{if(document.fullscreenElement===card)await document.exitFullscreen();else await card.requestFullscreen();}catch{StudioToast.show('Could not expand preview');}});
   const syncFullscreen=()=>{const expanded=document.fullscreenElement===card;expand.setAttribute('aria-label',(expanded?'Exit expanded ':'Expand ')+item.name+' preview');expand.title=expanded?'Exit expanded preview':'Expand preview';expand.setAttribute('aria-pressed',String(expanded));};document.addEventListener('fullscreenchange',syncFullscreen);cleanups.push(()=>document.removeEventListener('fullscreenchange',syncFullscreen));
    const more=document.createElement('button');more.type='button';more.className='cc-more';more.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>';more.setAttribute('aria-label',item.name+' details');more.setAttribute('aria-expanded','false');more.setAttribute('aria-haspopup','true');row.append(more);
   const menu=document.createElement('div');menu.className='cc-more-menu';menu.setAttribute('popover','auto');card.append(menu);
   const dialog=document.createElement('dialog');dialog.className='cc-info-dialog';dialog.setAttribute('aria-label',item.name+' details');
   const heading=document.createElement('h2'),close=document.createElement('button');close.type='button';close.className='cc-info-close';close.textContent='×';close.setAttribute('aria-label','Close component details');
   const head=document.createElement('header');head.append(heading,close);const body=document.createElement('div');body.className='cc-info-body';dialog.append(head,body);card.append(dialog);
   const tags=document.createElement('section');StudioTagEditor.mount(tags,item,state.catalog.components.includes(item)?'components':'compositions',()=>{const source=cards.find(c=>c.id==='entry-'+item.id);if(source)source.dataset.search=M.searchMetadata(item);});
   const sections=[['Contract & anatomy',contract],['Search tags',tags]].filter(([,section])=>section);
   sections.forEach(([label,section])=>{body.append(section);section.hidden=true;if(section.tagName==='DETAILS')section.open=true;const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',event=>{event.stopPropagation();menu.hidePopover();heading.textContent=label;sections.forEach(([,part])=>part.hidden=part!==section);dialog.showModal();});menu.append(button);});
   more.addEventListener('click',event=>{event.stopPropagation();if(menu.matches(':popover-open')){menu.hidePopover();return;}const rect=more.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-220,rect.right-208))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-100,rect.bottom+6))+'px';menu.showPopover();});
   menu.addEventListener('toggle',()=>more.setAttribute('aria-expanded',String(menu.matches(':popover-open'))));
   close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>more.focus({preventScroll:true}));dialog.addEventListener('click',event=>{event.stopPropagation();if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
   const headerActions=document.createElement('div');headerActions.className='cc-header-actions';headerActions.append(expand,more);card.querySelector('.wb-spec-head')?.append(headerActions);
   const canvas=card.querySelector('.vc-canvas');if(canvas&&controls){controls.classList.add('cc-bottom-modes');canvas.append(controls);}
   return card;
 };
 const main=render(entry);
 const navigation=root.querySelector('.cc-tools');navigation.classList.add('cc-inner-navigation');back.textContent='←';back.setAttribute('aria-label','Back to all components');back.title='Back to all components';main.prepend(navigation);
 const dependencies=[...new Set(entry.dependencies||[])];
 const modes=main.querySelector('.cc-bottom-modes');
 if(modes){
   const dock=document.createElement('div');dock.className='cc-preview-dock';modes.replaceWith(dock);dock.append(modes);
   const trigger=document.createElement('button');trigger.type='button';trigger.className='cc-dependency-count';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','true');trigger.disabled=!dependencies.length;trigger.hidden=!dependencies.length;
   trigger.innerHTML='<span>Uses '+dependencies.length+' component'+(dependencies.length===1?'':'s')+'</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 10 4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';dock.append(trigger);
   const list=document.createElement('nav');list.className='cc-dependency-popover';list.setAttribute('popover','auto');list.setAttribute('aria-label',entry.name+' subcomponents');main.append(list);
   dependencies.forEach(id=>{const child=entries.find(e=>e.id===id);const button=document.createElement('button');button.type='button';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('width','16');icon.setAttribute('height','16');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','1.25');icon.setAttribute('stroke-linejoin','round');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="m8 1.5 6 3.25v6.5L8 14.5l-6-3.25v-6.5L8 1.5Zm-6 3.25L8 8l6-3.25M8 8v6.5"/>';const label=document.createElement('span');label.textContent=child?child.name:'Unavailable: '+id;button.append(icon,label);button.disabled=!child;if(child)button.addEventListener('click',event=>{event.stopPropagation();list.hidePopover();show(id);});list.append(button);});
   trigger.addEventListener('click',event=>{event.stopPropagation();if(list.matches(':popover-open')){list.hidePopover();return;}const r=trigger.getBoundingClientRect();list.style.left=Math.max(8,Math.min(innerWidth-248,r.left))+'px';list.style.bottom=Math.max(8,innerHeight-r.top+8)+'px';list.style.maxHeight=Math.max(80,r.top-16)+'px';list.showPopover();});
   list.addEventListener('toggle',()=>trigger.setAttribute('aria-expanded',String(list.matches(':popover-open'))));
 }
 history.replaceState(null,'','#components/'+encodeURIComponent(id));focus.scrollTop=0;interactions?.open(entry,back,false,chosenVariants.get(entry.id));back.focus({preventScroll:true});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){focus.getAnimations().forEach(animation=>animation.cancel());focus.animate([{transform:'scale(.96)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});}
 };
 const all=(restoreFocus=true)=>{clear();root.classList.remove('is-focused');viewport.inert=false;focus.hidden=true;back.hidden=true;crumbs.replaceChildren();trail=[];interactions?.close(false);history.replaceState(null,'','#components');const card=cards.find(c=>c.id==='entry-'+selected);if(restoreFocus)card?.querySelector('[data-component]')?.focus({preventScroll:true});selected=null;};
 on(document.querySelector('#catalog-filter'),'input',event=>{if(selected){const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;all(false);input.focus({preventScroll:true});input.setSelectionRange(start,end);}});document.querySelectorAll('[data-component-category]').forEach(b=>on(b,'click',()=>{if(selected)all(false);}));
 on(back,'click',event=>{event.stopPropagation();all();});on(root.querySelector('[data-fit]'),'click',()=>{if(selected)all();fitAll();});
 root.querySelectorAll('[data-zoom]').forEach(b=>on(b,'click',()=>zoom(b.dataset.zoom==='in'?1.2:1/1.2)));
 on(world,'click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;return;}if(e.target.closest('[data-copy-component]'))return;const card=e.target.closest('.cg-card');if(card)show(card.id.slice(6));});
 on(world,'focusin',e=>{if(selected)return;const card=e.target.closest('.cg-card');if(!card)return;const r=card.getBoundingClientRect(),v=viewport.getBoundingClientRect();if(r.left<v.left||r.right>v.right||r.top<v.top||r.bottom>v.bottom){camera.x=viewport.clientWidth/2-(parseFloat(card.style.left)+card.offsetWidth/2)*camera.z;camera.y=viewport.clientHeight/2-(parseFloat(card.style.top)+card.offsetHeight/2)*camera.z;paint();}});
 on(viewport,'pointerdown',e=>{if(e.button!==0||e.target.closest('[data-copy-component]'))return;drag={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,moved:false};});
 on(window,'pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5){drag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');}if(drag.moved){camera.x=drag.cx+dx;camera.y=drag.cy+dy;paint();}});
 const end=()=>{if(drag?.moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);}drag=null;viewport.classList.remove('is-dragging');};on(window,'pointerup',end);on(window,'pointercancel',end);
 on(viewport,'wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const r=viewport.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.005),e.clientX-r.left,e.clientY-r.top);}else{camera.x-=e.deltaX;camera.y-=e.deltaY;paint();}},{passive:false});
 on(viewport,'keydown',e=>{if(e.target!==viewport)return;const d={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]}[e.key];if(d){e.preventDefault();camera.x+=d[0];camera.y+=d[1];paint();}if(e.key==='+'||e.key==='=')zoom(1.2);if(e.key==='-')zoom(1/1.2);});
 on(document,'keydown',e=>{if(e.key!=='Escape'||!selected||e.defaultPrevented||document.querySelector('dialog[open],:popover-open'))return;e.preventDefault();focus.querySelector('[data-preview-mode=preview]')?.click();});
 on(document,'studio-explore-component',e=>show(e.detail));
 on(focus,'click',e=>{const b=e.target.closest('[data-width]');if(b){const card=b.closest('.cc-detail');card.querySelector('iframe').style.width=b.dataset.width;card.querySelectorAll('[data-width]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));}});
 let filterTimer;const observer=new MutationObserver(()=>{clearTimeout(filterTimer);filterTimer=setTimeout(()=>{layout();if(!selected)fitAll();},130);});cards.forEach(c=>observer.observe(c,{attributes:true,attributeFilter:['hidden']}));
 const overviewCleanups=[];
 cards.forEach(card=>{
   const entry=entries.find(e=>'entry-'+e.id===card.id),frame=card.querySelector('iframe');
   card.style.width=Math.max(280,Number(entry.galleryWidth)||Number(entry.interactions?.width)||480)+'px';
   if(!frame)return;frame.loading='eager';
   const connect=()=>{try{const doc=frame.contentDocument;if(!doc?.body)return;
     const measure=()=>{if(!frame.isConnected)return;const body=doc.body,style=frame.contentWindow.getComputedStyle(body);const margin=(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0);frame.style.height=Math.ceil(body.getBoundingClientRect().height+margin)+'px';const needed=doc.documentElement.scrollWidth;if(needed>frame.clientWidth+2)card.style.width=(needed+2)+'px';};
     const observer=new ResizeObserver(measure);observer.observe(doc.body);measure();overviewCleanups.push(()=>observer.disconnect());
   }catch{}};
   on(frame,'load',connect);connect();
 });
 const sizeObserver=new ResizeObserver(()=>layout());cards.forEach(card=>sizeObserver.observe(card));
 layout();paint();const initial=M.route(location.hash).entry;if(initial)show(initial);
 return ()=>{abort.abort();sizeObserver.disconnect();overviewCleanups.forEach(fn=>fn());observer.disconnect();clearTimeout(filterTimer);clear();interactions?.close(false);};
}};
