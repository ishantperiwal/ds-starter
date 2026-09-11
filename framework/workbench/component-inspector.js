/* Inspect real rendered elements. Unregistered layout nodes remain containers, not catalog entries. */
(function(root){
'use strict';
let active=null;
const ignored='.wb-inline-overlay,.wb-component-toggle,[data-component-inspector]';
function registered(el,catalog){return catalog.find(entry=>entry.class&&el.classList.contains(entry.class))||null;}
function variantName(el,entry){
 if(!entry)return '';
 const targets=(entry.interactions?.targets||[]).filter(t=>!t.owner||t.owner===entry.id);
 const value=el.getAttribute('data-inspector-variant');
 if(value){const target=targets.find(t=>t.id===value||t.name===value);return target?.name||(entry.variants||[]).find(v=>v===value)||'';}
 const selected=targets.filter(t=>t.inspectorSelector&&el.matches(t.inspectorSelector));
 if(selected.length===1)return selected[0].name;
 if(selected.length>1)return '';
 return '';
}
function componentLayers(target,body,entries){
  const result=[];let node=target?.closest('svg')||target;
  // Stop at the outer registered component instance. Specimen captions, mounts
  // and variant grids are presentation scaffolding, not inspectable app anatomy.
  let boundary=null;
  for(let parent=node;parent&&parent!==body;parent=parent.parentElement){
   if(registered(parent,entries))boundary=parent;
  }
  if(!boundary)return result;
  for(;node&&node!==body;node=node.parentElement){
   if(!node.closest(ignored)&&node.getClientRects().length)result.push(node);
   if(node===boundary)break;
  }
  return result;
 }

function generic(el,win){
 if(['IMG','SVG','USE','PATH'].includes(el.tagName.toUpperCase()))return 'Icon';
 if(el.matches('button,[role=button]'))return 'Button';
 if(el.matches('a'))return 'Link';
 if(el.matches('input,textarea,select'))return 'Input';
 const css=win.getComputedStyle(el);
 if(css.display.includes('flex'))return css.flexDirection.startsWith('column')?'Vertical layout':'Horizontal layout';
 if(css.display.includes('grid'))return 'Grid layout';
 return el.children.length?'Container':'Text';
}
function selector(el,body){
 const steps=[];
 for(let node=el;node&&node!==body;node=node.parentElement){
  if(node.id){steps.unshift('#'+CSS.escape(node.id));break;}
  let part=node.localName;
  const classes=[...node.classList].filter(c=>!c.startsWith('wb-')&&!c.startsWith('is-'));
  if(classes.length)part+=classes.map(c=>'.'+CSS.escape(c)).join('');
  const peers=node.parentElement?[...node.parentElement.children].filter(n=>n.localName===node.localName):[];
  if(peers.length>1)part+=':nth-of-type('+(peers.indexOf(node)+1)+')';
  steps.unshift(part);
 }
 return steps.join(' > ');
}
function reference(info){return ['Design-system element reference', 'Selected: '+info.name,'Kind: '+info.kind,info.variant?'Variant: '+info.variant:'',info.id?'Component ID: '+info.id:'Basic element within the composition', 'Selector: '+info.selector,'Hierarchy: '+info.hierarchy,'Owning component: '+info.owner,info.css?'CSS: '+info.css:'',info.module?'Module: '+info.module:'','Preview: '+info.preview].filter(Boolean).join('\n');}
function mount(frame,entry,catalog,onClose,options={}){
 const doc=frame.contentDocument,win=frame.contentWindow,body=doc?.querySelector('.wb-component-content')||doc?.querySelector('main');
 if(!body)return {setActive(){},destroy(){}};
 let enabled=false,pinned=null,hover=null,chain=[],index=0,panel=null,outline=null,tip=null,raf=0;
 const listeners=[];
 const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 const entries=[...catalog].sort((a,b)=>(a.id===entry.id?1:0)-(b.id===entry.id?1:0));
 const isLayout=el=>!registered(el,entries)&&['Vertical layout','Horizontal layout','Grid layout','Container'].includes(generic(el,win));
 const variant=el=>variantName(el,registered(el,entries));
 const label=el=>{const reg=registered(el,entries);return reg?reg.name+(variant(el)?' · '+variant(el):''):generic(el,win);};
 const layers=target=>componentLayers(target,body,entries);
 function info(el){const reg=registered(el,entries),parents=layers(el),owner=parents.map(e=>registered(e,entries)).find(Boolean);return {name:label(el),kind:reg?'Component':isLayout(el)?'Layout container':'Basic element',variant:variant(el),id:reg?.id,selector:selector(el,body),hierarchy:parents.slice().reverse().map(label).join(' → '),owner:owner?owner.name+' ('+owner.id+')':'Specimen layout for '+entry.name,css:owner?.css,module:owner?.module,preview:frame.src};}
 function paint(){
  raf=0;const el=hover||pinned;
  if(!enabled||!el?.isConnected){if(outline)outline.hidden=true;if(tip)tip.hidden=true;return;}
  const r=el.getBoundingClientRect();outline.hidden=false;tip.hidden=false;
  Object.assign(outline.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  tip.textContent=label(el)+(registered(el,entries)?' · Component':'');
  const color=registered(el,entries)?'#2170f4':'#67717d';tip.style.background=color;outline.style.borderColor=color;outline.style.borderStyle=isLayout(el)?'dashed':'solid';
  const box=tip.getBoundingClientRect();const position=root.DSLabelPlacement?.place(r,box.width,box.height,win.innerWidth,win.innerHeight);
  if(position)Object.assign(tip.style,{left:position.left+'px',top:position.top+'px'});else tip.hidden=true;
 }
 function schedule(){if(!raf)raf=win.requestAnimationFrame(paint);}
 function show(el){
  pinned=el;hover=null;paint();if(!panel)return;const data=info(el),content=panel.querySelector('.ce-content');content.replaceChildren();
  const crumb=document.createElement('nav');crumb.className='ce-breadcrumb';crumb.setAttribute('aria-label','Selected element hierarchy');
  const layouts=document.createElement('details');layouts.className='ce-layout-layers';const summary=document.createElement('summary');summary.textContent='Show layout layers';layouts.append(summary);
  layers(el).reverse().forEach(node=>{const b=document.createElement('button');b.type='button';b.className=registered(node,entries)?'ce-component-node':'ce-basic-node';b.textContent=label(node);if(registered(node,entries)){const badge=document.createElement('small');badge.textContent='Component';b.append(badge);}b.setAttribute('aria-current',String(node===el));b.onclick=()=>{chain=layers(el);index=chain.indexOf(node);show(node);};if(isLayout(node)){layouts.append(b);if(node===el)layouts.open=true;}else crumb.append(b);});
  const title=document.createElement('h3');title.textContent=data.name;
  const kind=document.createElement('p');kind.className=data.id?'ce-component-badge':'ce-element-kind';kind.textContent=data.kind;
  const code=document.createElement('code');code.textContent=data.selector;
  const owner=document.createElement('p');owner.textContent='Owner: '+data.owner;
  const cycle=document.createElement('button');cycle.type='button';cycle.textContent='Cycle layer';cycle.onclick=()=>{if(chain.length){index=(index+1)%chain.length;show(chain[index]);}};
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copy reference';copy.onclick=async()=>{let ok=false;const text=reference(data);try{await navigator.clipboard.writeText(text);ok=true;}catch{const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;opacity:0';document.body.append(input);input.select();try{ok=document.execCommand('copy');}catch{}input.remove();copy.focus();}import('/framework/workbench/toast.js').then(()=>StudioToast.show(ok?'Copied '+data.name+' reference':'Could not copy '+data.name+' reference'));};
  const actions=document.createElement('div');actions.className='ce-actions';actions.append(cycle,copy);content.append(crumb);if(layouts.children.length>1)content.append(layouts);content.append(title,kind,code,owner,actions);
 }
 function setActive(value){
  if(value===enabled)return;enabled=value;
  if(!value){panel?.remove();outline?.remove();tip?.remove();panel=outline=tip=null;pinned=hover=null;chain=[];if(active===api)active=null;return;}
  if(options.sidebar!==false){
  if(active&&active!==api)active.exit();active=api;
  document.querySelector('#component-interactions:not([hidden]) .ci-close')?.click();
  panel=document.createElement('aside');panel.className='ce-panel';panel.setAttribute('aria-label','Component inspector');
  panel.innerHTML='<header><h2>Component</h2><button type="button" aria-label="Close component inspector">×</button></header><p class="ce-help">Hover to inspect. Click to select. Control-click cycles through nested layers. Escape closes.</p><div class="ce-content"><p>Select an element, or start with the outer component.</p></div>';
  panel.querySelector('header button').onclick=()=>api.exit();(frame.closest('dialog')||document.body).append(panel);
  const start=document.createElement('button');start.type='button';start.textContent='Select outer component';start.onclick=()=>{const el=body.querySelector('.'+CSS.escape(entry.class));if(el){chain=layers(el);index=0;show(el);}};panel.querySelector('.ce-content').append(start);
  }
  outline=doc.createElement('div');outline.dataset.componentInspector='';outline.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;border:2px solid #2170f4;background:#2170f40c;box-sizing:border-box';outline.hidden=true;
  tip=doc.createElement('div');tip.dataset.componentInspector='';tip.style.cssText='position:fixed;z-index:2147483647;pointer-events:none;background:#2170f4;color:white;padding:4px 7px;border-radius:3px;font:11px/16px system-ui;white-space:nowrap';tip.hidden=true;doc.body.append(outline,tip);
 }
 function pick(e){if(!enabled||!body.contains(e.target)||e.target.closest(ignored))return;e.preventDefault();e.stopImmediatePropagation();const next=layers(e.target);if(!next.length)return;if(e.ctrlKey&&chain.length&&next[0]===chain[0])index=(index+1)%chain.length;else{chain=next;index=0;}show(chain[index]);}
 listen(doc,'pointermove',e=>{if(enabled&&!pinned&&body.contains(e.target)){hover=layers(e.target)[0];schedule();}},true);
 listen(doc,'pointerdown',pick,true);
 listen(doc,'click',e=>{if(enabled&&body.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
 for(const type of ['pointerup','dblclick','auxclick'])listen(doc,type,e=>{if(enabled&&body.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
 listen(doc,'contextmenu',e=>{if(enabled&&body.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);
 const key=e=>{if(!enabled)return;if(e.key==='Escape'){e.preventDefault();api.exit();}else if(e.ctrlKey&&e.key==='ArrowUp'&&chain.length){e.preventDefault();index=(index+1)%chain.length;show(chain[index]);}else if(e.target.closest?.('.wb-component-content')&&['Enter',' '].includes(e.key)){pick(e);}};
 listen(doc,'keydown',key,true);listen(document,'keydown',key,true);listen(win,'resize',schedule);listen(doc,'scroll',schedule,true);listen(window,'scroll',schedule,true);
 const observer=new win.ResizeObserver(schedule);observer.observe(body);
 const api={setActive,exit(){setActive(false);onClose?.();},destroy(){setActive(false);listeners.forEach(fn=>fn());observer.disconnect();if(raf)win.cancelAnimationFrame(raf);}};
 return api;
}
const api={mount,registered,reference,componentLayers,variantName};if(typeof module==='object'&&module.exports)module.exports=api;else root.wbComponentInspector=api;
})(globalThis);
