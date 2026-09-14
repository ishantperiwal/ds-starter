/* Workbench-only inspection. Sheets measure existing specimens; they never clone controls,
   change product styles, or persist edits. Registry selectors are the anatomy contract. */
(function () {
  'use strict';

  // A registered class may identify an inner control. Include only ancestors
  // explicitly owned by its anatomy, bounded by the current preview container.
  function inspectionRoots(container, anatomy) {
    const selectors=[...(anatomy.parts||[]),...(anatomy.spacing||[]),...(anatomy.geometry||[])]
      .map(part=>part.selector).filter(Boolean);
    const roots=Array.from(container.querySelectorAll(anatomy.specimen)).map(seed=>{
      let root=seed;
      for(let node=seed.parentElement;node&&node!==container;node=node.parentElement){
        if(selectors.some(selector=>node.matches(selector)))root=node;
      }
      return root;
    });
    return [...new Set(roots)].filter(root=>!roots.some(other=>other!==root&&other.contains(root)));
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={inspectionRoots};return;}

  const copyNotice=message=>import('/framework/workbench/toast.js').then(()=>globalThis.StudioToast.show(message));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const instances = new Map();
  let roles = null;
  let queued = false;
  const round = n => Math.round(n * 10) / 10;
  const number = value => parseFloat(value) || 0;
  const visible = el => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  function matches(root, selector) {
    return (root.matches(selector) ? [root] : []).concat(Array.from(root.querySelectorAll(selector))).filter(visible);
  }
  function render() { return ''; } // Metadata remains in the registry, not a second specimen.
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      instances.forEach((state,host) => {
        if (!host.isConnected) { state.observer.disconnect(); instances.delete(host); return; }
        if (visible(host)) { discover(state); state.groups.forEach(group => { if(state.spacing) draw(group,state.spec); }); }
      });
      paintRoles();
    });
  }
  function mount(host,spec,bodySelector) {
    if (!spec.anatomy) return;
    const body=host.querySelector(bodySelector);
    if (!body) return;
    const old=instances.get(host);
    if(old) old.observer.disconnect();
    const state={host,body,spec,spacing:false,groups:[],observer:new ResizeObserver(schedule)};
    instances.set(host,state);
    state.observer.observe(body);
    host.addEventListener('change',schedule);
    ['input','change','transitionend','scroll'].forEach(event=>body.addEventListener(event,schedule,true));
    const toolbar=document.createElement('div');
    toolbar.className='wb-inline-tools wb-component-toggle';
    toolbar.innerHTML='<div class="wb-inline-toggle" role="group" aria-label="'+esc(spec.name)+' view"><button type="button" aria-pressed="true">Preview</button><button type="button" aria-pressed="false">Spacing</button></div><output class="wb-inline-readout" aria-live="polite"></output>';
    const heading=host.querySelector('.wb-spec-head, .wb-pattern-head, .wb-viz-head');
    if(heading) {
      heading.append(toolbar);
      // Keep DOM reading order consistent with the visual-first presentation.
      let preview=body;
      while(preview.parentElement!==host) preview=preview.parentElement;
      preview.after(heading);
      host.classList.add('wb-visual-first');
    } else body.before(toolbar);
    state.toolbar=toolbar;
    toolbar.querySelectorAll('.wb-inline-toggle button').forEach((button,index)=>button.addEventListener('click',()=>setMode(host,index===1?'spacing':'preview')));
    discover(state);
    schedule();
  }
  function popoverDocument(){try{if(window.top.document.querySelector('.cc-focus'))return window.top.document;}catch{}return document;}
  function setMode(host,mode){
    const state=instances.get(host);if(!state)return false;
    state.spacing=mode==='spacing';
    popoverDocument().querySelector('.wb-spacing-popover')?.remove();
    state.groups.forEach(group=>{group.selectedToken=null;});
    state.toolbar.querySelectorAll('.wb-inline-toggle button').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===(state.spacing?1:0))));
    state.toolbar.querySelector('output').textContent='';
    discover(state);
    if(state.spacing)state.groups.forEach(group=>draw(group,state.spec));
    schedule();return true;
  }
  function discover(state) {
    state.groups=state.groups.filter(g=>g.host.isConnected);
    const outer=inspectionRoots(state.body,state.spec.anatomy);
    const hosts=new Set(outer.map(root=>root.closest('.wb-composition-example, .wb-row, .wb-viz-variant-list > div') || state.body));
    hosts.forEach(host=> {
      if(state.groups.some(g=>g.host===host)) return;
      const group={host};
      host.classList.add('wb-inline-specimen');
      const overlay=document.createElement('div');overlay.className='wb-inline-overlay';overlay.hidden=true;
      host.append(overlay);
      const toolbar=state.toolbar;
      group.overlay=overlay;group.toolbar=toolbar;
      overlay.addEventListener('click',event=>{
        const hit=event.target.closest('[data-measure]');
        if(hit) {
          state.groups.forEach(item=>{
            item.selectedToken=hit.dataset.token;
            item.overlay.querySelectorAll('[data-token]').forEach(el=>el.classList.toggle('is-selected',el.dataset.token===hit.dataset.token));
          });
          popoverDocument().querySelector('.wb-spacing-popover')?.remove();
          const output=document.createElement('div');output.className='wb-spacing-popover';output.setAttribute('role','dialog');output.setAttribute('aria-label','Spacing measurement');
          output.innerHTML='<button type="button" class="wb-spacing-close" aria-label="Close measurement">×</button><div>'+esc(hit.dataset.measure)+'</div><code>'+esc(hit.dataset.token)+'</code><button type="button" class="wb-copy-token">Copy reference</button>';
          const destination=popoverDocument();
          const dark=destination.body.dataset.previewColorScheme==='dark'||document.documentElement.dataset.theme==='dark';
          output.style.cssText='position:fixed;z-index:10000;box-sizing:border-box;width:260px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;padding:14px;border:1px solid '+(dark?'#50535e':'#dedee5')+';border-radius:10px;background:'+(dark?'#30323a':'#fff')+';color:'+(dark?'#e0e3ea':'#333')+';font:12px/1.5 system-ui;box-shadow:0 6px 24px #0003;overflow-wrap:anywhere;right:24px;bottom:24px;';
          output.querySelector('code').style.cssText='display:block;margin:8px 0;font-size:11px';
          output.querySelector('.wb-spacing-close').style.cssText='float:right;border:0;background:transparent;color:inherit;font-size:18px;cursor:pointer';
          output.querySelector('.wb-copy-token').style.cssText='padding:7px 12px;border:1px solid '+(dark?'#50535e':'#d5d9e0')+';border-radius:5px;background:'+(dark?'#454852':'#f5f5f2')+';color:inherit;font:inherit;cursor:pointer';
          destination.body.append(output);
          // Map the specimen rectangle through scaled iframe viewports into Studio.
          const mapRect=node=>{let r=node.getBoundingClientRect(),rect={left:r.left,top:r.top,right:r.right,bottom:r.bottom};let view=window;while(view.document!==destination&&view.frameElement){const frame=view.frameElement,f=frame.getBoundingClientRect(),sx=f.width/frame.offsetWidth,sy=f.height/frame.offsetHeight;rect={left:f.left+(frame.clientLeft+rect.left)*sx,right:f.left+(frame.clientLeft+rect.right)*sx,top:f.top+(frame.clientTop+rect.top)*sy,bottom:f.top+(frame.clientTop+rect.bottom)*sy};view=view.parent;}return rect;};
          const anchor=mapRect(hit),subject=mapRect(group.host),box=output.getBoundingClientRect(),viewport=destination.documentElement,gap=12,pad=12;
          const clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
          const candidates=[{x:subject.right+gap,y:anchor.top},{x:subject.left-box.width-gap,y:anchor.top},{x:anchor.left,y:subject.bottom+gap},{x:anchor.left,y:subject.top-box.height-gap}].map(p=>({x:clamp(p.x,pad,viewport.clientWidth-box.width-pad),y:clamp(p.y,pad,viewport.clientHeight-box.height-pad)}));
          const overlap=p=>Math.max(0,Math.min(p.x+box.width,subject.right)-Math.max(p.x,subject.left))*Math.max(0,Math.min(p.y+box.height,subject.bottom)-Math.max(p.y,subject.top));
          candidates.sort((a,b)=>overlap(a)-overlap(b)||Math.hypot(a.x-anchor.left,a.y-anchor.top)-Math.hypot(b.x-anchor.left,b.y-anchor.top));
          output.style.right='auto';output.style.bottom='auto';output.style.left=candidates[0].x+'px';output.style.top=candidates[0].y+'px';

          if(destination!==document){const owner=window.frameElement;const observer=new MutationObserver(()=>{if(!owner?.isConnected||!output.isConnected){output.remove();observer.disconnect();}});observer.observe(destination.body,{childList:true,subtree:true});window.addEventListener('pagehide',()=>{output.remove();observer.disconnect();},{once:true});}
          output.querySelector('.wb-spacing-close').addEventListener('click',()=>output.remove());
          output.querySelector('.wb-copy-token').addEventListener('click',async event=>{
            const button=event.currentTarget;
            const text=[
              'DS spacing reference — inspect the shared owner before editing.',
              '',
              'Component: '+state.spec.name+' ('+(state.spec.id||state.spec.class)+')',
              'Class: .'+state.spec.class,
              'Measurement: '+hit.dataset.measure,
              'Token: '+hit.dataset.token,
              'Selector: '+hit.dataset.selector,
              'Property / geometry: '+hit.dataset.property,
              state.spec.css?'CSS: '+state.spec.css:'',
              'Preview: '+location.href
            ].filter(Boolean).join('\n');
            let copied=false;
            try{await navigator.clipboard.writeText(text);copied=true;}catch{
              const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(input);input.select();
              try{copied=document.execCommand('copy');}catch{}input.remove();button.focus();
            }
            copyNotice(copied?'Copied '+state.spec.name+' reference':'Could not copy reference');
          });

        }
      });
      overlay.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' ') {event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
      });
      state.groups.push(group);state.observer.observe(host);
    });
    state.groups.forEach(group=>{group.overlay.hidden=!state.spacing;});
  }
  function rectangle(el, origin) {
    const r = el.getBoundingClientRect();
    return { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height };
  }
  function partRectangle(el, part, origin) {
    if (!part.pseudo) return rectangle(el, origin);
    const r = rectangle(el, origin), s = getComputedStyle(el), pseudo = getComputedStyle(el, part.pseudo);
    const width = number(pseudo.width), height = number(pseudo.height);
    return {x:r.x+number(s.borderLeftWidth)+number(s.paddingLeft), y:r.y+(r.height-height)/2, width, height};
  }
  function box(r, cls, extra = '') {
    return '<rect class="' + cls + '" x="' + round(r.x) + '" y="' + round(r.y) + '" width="' + round(Math.max(0,r.width)) + '" height="' + round(Math.max(0,r.height)) + '" ' + extra + '/>';
  }
  function spacingBands(el, origin, property) {
    const r = rectangle(el, origin), s = getComputedStyle(el);
    const value = number(s.getPropertyValue(property));
    if (!value) return [];
    const paddingBox = {x:r.x+number(s.borderLeftWidth), y:r.y+number(s.borderTopWidth), width:r.width-number(s.borderLeftWidth)-number(s.borderRightWidth), height:r.height-number(s.borderTopWidth)-number(s.borderBottomWidth)};
    if (property === 'padding-top') return [{...paddingBox, height:value}];
    if (property === 'padding-bottom') return [{...paddingBox, y:paddingBox.y+paddingBox.height-value, height:value}];
    if (property === 'padding-left') return [{...paddingBox, width:value}];
    if (property === 'padding-right') return [{...paddingBox, x:paddingBox.x+paddingBox.width-value, width:value}];
    if (property === 'margin-top') return [{...r, y:r.y-value, height:Math.abs(value)}];
    if (property === 'margin-bottom') return [{...r, y:r.y+r.height, height:Math.abs(value)}];
    if (property === 'margin-left') return [{...r, x:r.x-Math.max(0,value), width:Math.abs(value)}];
    if (property === 'margin-right') return [{...r, x:r.x+r.width+Math.min(0,value), width:Math.abs(value)}];
    const children = Array.from(el.children).filter(visible).map(child => rectangle(child, origin));
    const before = getComputedStyle(el,'::before');
    if (before.content !== 'none' && before.content !== 'normal' && number(before.width)) {
      children.unshift(partRectangle(el,{pseudo:'::before'},origin));
      Array.from(el.childNodes).filter(node=>node.nodeType===3 && node.textContent.trim()).forEach(node=>{
        const range=document.createRange(); range.selectNodeContents(node); const b=range.getBoundingClientRect();
        children.push({x:b.left-origin.left,y:b.top-origin.top,width:b.width,height:b.height});
      });
    }
    const bands = [];
    children.forEach((child,i) => children.slice(i+1).forEach(next => {
      const overlapX = Math.min(child.x+child.width,next.x+next.width)-Math.max(child.x,next.x);
      const overlapY = Math.min(child.y+child.height,next.y+next.height)-Math.max(child.y,next.y);
      // Only adjacent tracks: avoid painting a region spanning intermediate children.
      if (property !== 'column-gap' && overlapX > 0 && Math.abs(next.y-child.y-child.height-value) < 1)
        bands.push({x:Math.max(child.x,next.x),y:child.y+child.height,width:overlapX,height:value});
      if (property !== 'row-gap' && overlapY > 0 && Math.abs(next.x-child.x-child.width-value) < 1)
        bands.push({x:child.x+child.width,y:Math.max(child.y,next.y),width:value,height:overlapY});
    }));
    return bands;
  }
  function activeToken(space, element) {
    let token = space.token;
    const viz = element && element.closest('.ds-viz');
    const size = viz && (viz.classList.contains('ds-viz--sm') ? 'sm' : viz.classList.contains('ds-viz--lg') ? 'lg' : 'md');
    if (size && token === '--ds-viz-row-gap') token = '--viz-row-gap-' + size;
    if (size && token === '--ds-viz-gap') token = '--viz-layout-gap-' + size;
    // Container query overrides must report the token actually applied at this width.
    if (space.narrowToken && viz && viz.getBoundingClientRect().width <= 23.75 * number(getComputedStyle(document.documentElement).fontSize)) token = space.narrowToken;
    return token;
  }
  function draw(group,spec) {
    // Absolute overlays use the padding box, not the host border box.
    // Measure their own viewport to keep SVG units aligned with CSS pixels.
    const origin=group.overlay.getBoundingClientRect();
    if (!origin.width || !origin.height) return;
    const outer=inspectionRoots(group.host,spec.anatomy).filter(visible);
    let drawing='';const measurements=new Set(), labelledTokens=new Set();
    outer.forEach(root=>{
      spec.anatomy.parts.forEach(part=>matches(root,part.selector).forEach(el=>{
        drawing+=box(partRectangle(el,part,origin),'wb-inline-outline');
      }));
      (spec.anatomy.geometry||[]).forEach(geometry=>matches(root,geometry.selector).forEach(el=>{
        const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
        const label=geometry.label,token=geometry.token;
        let rects=[];
        if(geometry.kind==='fluid')rects=[{x:r.left-origin.left,y:r.top-origin.top,width:r.width,height:r.height}];
        else {
          const parent=matches(root,geometry.container).find(item=>item.contains(el));if(!parent)return;
          const p=parent.getBoundingClientRect(),css=getComputedStyle(parent);
          const left=p.left+parseFloat(css.borderLeftWidth||0),right=p.right-parseFloat(css.borderRightWidth||0),top=p.top+parseFloat(css.borderTopWidth||0),bottom=p.bottom-parseFloat(css.borderBottomWidth||0);
          if(geometry.axis!=='vertical')rects.push({x:left-origin.left,y:r.top-origin.top,width:r.left-left,height:r.height},{x:r.right-origin.left,y:r.top-origin.top,width:right-r.right,height:r.height});
          if(geometry.axis!=='horizontal')rects.push({x:r.left-origin.left,y:top-origin.top,width:r.width,height:r.top-top},{x:r.left-origin.left,y:r.bottom-origin.top,width:r.width,height:bottom-r.bottom});
        }
        rects.filter(r=>r.width>0&&r.height>0).forEach(rect=>{
          const info=label+': '+round(rect.width)+' × '+round(rect.height)+'px · '+(geometry.kind==='fluid'?'available width':'alignment space, not margin');
          drawing+='<g tabindex="0" role="button" data-selector="'+esc(geometry.selector)+'" data-property="'+esc(geometry.kind==='fluid'?'fluid width':'centering ('+geometry.axis+')')+'" data-measure="'+esc(info)+'" data-token="'+esc(token)+'" aria-label="'+esc(info)+'">'+box(rect,geometry.kind==='fluid'?'wb-inline-fluid':'wb-inline-alignment')+'<title>'+esc(info)+'</title></g>';
          measurements.add(info);
        });
      }));
      spec.anatomy.spacing.forEach(space=>matches(root,space.selector).forEach(el=>{
        const value=getComputedStyle(el).getPropertyValue(space.property),token=activeToken(space,el);
        spacingBands(el,origin,space.property).forEach(rect=>{
          const key=[rect.x,rect.y,rect.width,rect.height,token].join(':');
          if(measurements.has(key)) return;measurements.add(key);
          const label=space.label+': '+value+' · '+token;
          drawing+='<g class="'+(group.selectedToken===token?'is-selected':'')+'" tabindex="0" role="button" aria-label="'+esc(label)+'" data-selector="'+esc(space.selector)+'" data-property="'+esc(space.property)+'" data-measure="'+esc(label)+'" data-token="'+esc(token)+'">'+box(rect,'wb-inline-band')+'<title>'+esc(label)+'</title>';
          // Repeated geometry is not a new control. Preserve distinct resolved values
          // for size/theme exceptions, even when they share the same token name.
          const labelKey=token+'|'+value;
          if(!labelledTokens.has(labelKey) && rect.width>=18 && rect.height>=8) {
            labelledTokens.add(labelKey);
            drawing+='<text class="wb-inline-value" x="'+round(rect.x+rect.width/2)+'" y="'+round(rect.y+rect.height/2)+'">'+esc(value.replace('px',''))+'</text>';
          }
          drawing+='</g>';
        });
      }));
    });
    group.overlay.innerHTML='<svg preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 '+origin.width+' '+origin.height+'" aria-label="Measured spacing for '+esc(spec.name)+'">'+drawing+'</svg>';
    if(!measurements.size) group.toolbar.querySelector('output').textContent=spec.anatomy.implementation==='workbench-svg'?'SVG geometry · no CSS spacing tokens':'No declared spacing in this specimen';
  }
  // Route references, not copied markup: examples follow their CRM implementation.
  const sourceExamples={
    'Modal dialog':{title:'Create a pipeline',url:'/crm?intent=new-pipeline',file:'/crm.html'},
    'Full-page settings':{title:'Pipeline settings',url:'/crm/pipeline/neo/setting',file:'/pipeline-settings.html'},
    'Two-pane workspace':{title:'Form editor and preview',url:'/crm/pipeline/neo/form',file:'/form-settings.html'},
    '--layout-related-gap':{title:'Dashboard stat tiles',url:'/crm/dashboard',file:'/dashboard.html'},
    '--layout-item-gap':{title:'Dashboard pipeline breakdown',url:'/crm/dashboard',file:'/dashboard.html'},
    '--layout-section-gap':{title:'Chart and legend sections',url:'/crm/dashboard',file:'/dashboard.html'},
    '--layout-container-inset':{title:'Dashboard cards',url:'/crm/dashboard',file:'/dashboard.html'}
  };
  const exampleFocus={
    'Modal dialog':{selector:'#np-overlay.open .np-modal',label:'Create pipeline dialog'},
    'Full-page settings':{selector:'.ps-panes',label:'Settings content'},
    'Two-pane workspace':{selector:'.fb-preview',label:'Form preview beside the editor'},
    '--layout-related-gap':{selector:'.ds-stat__head',property:'margin-bottom',token:'--stat-label-value-gap',label:'between the stat label and value'},
    '--layout-item-gap':{selector:'.ds-viz-legend',property:'column-gap',token:'--viz-legend-item-gap',label:'between legend items'},
    '--layout-section-gap':{selector:'.ds-viz-part-to-whole',property:'gap',token:'--viz-layout-gap-md',label:'between the chart and legend sections'},
    '--layout-container-inset':{selector:'.ds-card:not(.ds-stat)',property:'padding-left',token:'--card-pad',label:'inside the chart card'}
  };
  function exampleCode(key) {
    const example=sourceExamples[key];
    return example ? '<button type="button" class="wb-example-launch" data-open-example="'+esc(key)+'"><span><b>'+esc(example.title)+'</b><small>Preview CRM example</small></span><span aria-hidden="true">⤢</span><span class="wb-sr-only">Opens a preview dialog</span></button>' : '';
  }
  const exampleLessons={
    '--layout-related-gap':{title:'Related content',description:'Keep closely related information together. Here, the stat label and its value are separated by the related-content gap.'},
    '--layout-item-gap':{title:'Items within a region',description:'Give distinct items room within one group. Here, the highlighted space separates legend items.'},
    '--layout-section-gap':{title:'Separate sections',description:'Use a larger gap between distinct content regions. Here, the chart and legend form two sections.'},
    '--layout-container-inset':{title:'Container inset',description:'Keep content away from its container’s edges. Here, the highlight shows padding inside a dashboard card.'}
  };
  async function openExample(key) {
    const example=sourceExamples[key] && {...sourceExamples[key]};if(!example) return;
    const lesson=exampleLessons[key] || {title:key,description:'See this layout pattern in the CRM with fixed sample data.'};
    const dialog=document.createElement('dialog');dialog.className='wb-example-modal';
    dialog.setAttribute('aria-labelledby','wb-example-title');
    dialog.innerHTML='<div class="wb-example-heading"><div><h2 id="wb-example-title">'+esc(lesson.title)+'</h2><p class="wb-example-lesson">'+esc(lesson.description)+'</p><p><strong>Example: '+esc(example.title)+'</strong> · mock data</p></div><button type="button" class="ds-btn ds-btn--ghost" data-close-example>Close</button></div><div class="wb-live-example"><iframe title="'+esc(example.title)+'" tabindex="-1" inert></iframe></div><p class="wb-note">This preview follows the current CRM implementation and available data. It requires the CRM app server.</p>';
    document.body.append(dialog);
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const frame=dialog.querySelector('iframe'),stage=dialog.querySelector('.wb-live-example');
    const focus=exampleFocus[key];let focused=true,scrolledTarget=null;
    const controls=document.createElement('div');controls.className='wb-example-focus-controls';
    controls.innerHTML='<div class="wb-inline-toggle" role="group" aria-label="Example focus"><button type="button" aria-pressed="true">Focused</button><button type="button" aria-pressed="false">Full screen</button></div><button type="button" class="wb-focus-caption" hidden></button>';
    stage.before(controls);
    const overlay=document.createElement('div');overlay.className='wb-example-spotlight';stage.append(overlay);
    const caption=controls.querySelector('.wb-focus-caption');
    caption.addEventListener('click',async()=>{
      if(!focus.token)return;
      try {await navigator.clipboard.writeText(focus.token);copyNotice('Copied '+focus.token);} catch(error){copyNotice('Could not copy token');}
    });
    function paintFocus() {
      if(!dialog.isConnected)return;
      overlay.hidden=!focused;caption.hidden=!focused;
      if(!focused)return;
      let doc;try{doc=frame.contentDocument;}catch(error){return;}
      const target=doc && Array.from(doc.querySelectorAll(focus.selector)).find(el=>el.getBoundingClientRect().width && el.getBoundingClientRect().height);
      if(!target){overlay.innerHTML='';caption.textContent='Example unavailable in the current screen or data';caption.disabled=true;return;}
      if(target!==scrolledTarget){target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});scrolledTarget=target;}
      const r=(target.closest('.ds-stat') || target).getBoundingClientRect();
      const x=Math.max(0,r.left),y=Math.max(0,r.top),right=Math.min(1280,r.right),bottom=Math.min(800,r.bottom);
      let drawing='<path fill="rgba(15,23,42,.58)" fill-rule="evenodd" d="M0 0H1280V800H0Z M'+x+' '+y+'H'+right+'V'+bottom+'H'+x+'Z"/>'+box({x:r.left,y:r.top,width:r.width,height:r.height},'wb-focus-outline');
      let bands=[];
      if(focus.property) bands=spacingBands(target,{left:0,top:0},focus.property);
      bands.forEach(b=>{drawing+=box(b,'wb-inline-band');});
      overlay.innerHTML='<svg width="100%" height="100%" viewBox="0 0 1280 800">'+drawing+'</svg>';
      caption.disabled=!focus.token;
      const value=focus.property ? doc.defaultView.getComputedStyle(target).getPropertyValue(focus.property) : '';
      caption.textContent=(value?value+' ':'')+focus.label+(focus.token?' · click to copy token':'');
    }
    controls.querySelectorAll('.wb-inline-toggle button').forEach((button,index)=>button.addEventListener('click',()=>{
      focused=index===0;controls.querySelectorAll('.wb-inline-toggle button').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));paintFocus();
    }));
    const focusTimer=setInterval(paintFocus,500);

    const resize=new ResizeObserver(()=>{
      const scale=stage.clientWidth/1280;
      frame.style.transform='scale('+scale+')';stage.style.height=(800*scale)+'px';
    });resize.observe(stage);
    frame.addEventListener('load',()=>{
      // Expose the actual modal without invoking a creation or save operation.
      if(key==='Modal dialog') {
        const modal=frame.contentDocument && frame.contentDocument.getElementById('np-overlay');
        if(modal) modal.classList.add('open');
      }
    });
    dialog.addEventListener('close',()=>{clearInterval(focusTimer);resize.disconnect();document.body.style.overflow=previousOverflow;dialog.remove();},{once:true});
    dialog.querySelector('[data-close-example]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.showModal();
    const note=dialog.querySelector('.wb-note');
    note.textContent='Loading CRM example…';
    try {

      const response=await fetch(example.file);
      if(!response.ok) throw new Error('Source unavailable');
      let html=await response.text();
      if(!/<html[\s>]/i.test(html)) throw new Error('Invalid source');
      const path=new URL(example.url,location.href).pathname;
      html=html.replaceAll('location.pathname',JSON.stringify(path));
      html=html.replaceAll('location.search',JSON.stringify(''));
      const bootstrap='<base href="'+esc(location.origin+'/')+'"><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'; img-src \'self\' data:; frame-src \'none\';"><script>window.__DS_EXAMPLE_KEY='+JSON.stringify(key)+';</'+'script><script src="/design-system/example-fixtures.js"></'+'script>';
      html=html.replace(/<head([^>]*)>/i,'<head$1>'+bootstrap);
      if(!dialog.isConnected) return;
      frame.srcdoc=html;
      note.textContent='Fixed sample data · actual CRM renderer and styles · no live data or saves';
    } catch(error) {
      frame.hidden=true;stage.style.height='auto';
      note.textContent='Could not load this CRM example. Start node dev-server.js from the project root and try again.';
    }
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-example]');
    if(button) openExample(button.dataset.openExample).catch(()=>{button.textContent='Could not load example — try again';});
  });
  function compositions(specs) {
    const host = document.getElementById('wb-compositions');
    host.innerHTML = specs.map(spec => '<article class="wb-spec" data-anatomy-composition="'+esc(spec.class)+'">' +
      '<div class="wb-spec-head"><b>'+esc(spec.name)+'</b><code>.'+esc(spec.class)+'</code></div>' +
      '<div class="wb-spec-body">'+spec.examples.map(example =>
        '<div class="wb-composition-example"><div class="wb-composition-label">'+esc(example.label)+'</div>'+example.markup+'</div>').join('')+'</div><details class="wb-guidance wb-guidance--panel"><summary>Usage &amp; guidelines</summary><p>'+esc(spec.usage)+'</p></details>'+render(spec)+
      '</article>').join('');
    host.querySelectorAll('[data-anatomy-composition]').forEach(node => attach(node,specs.find(spec=>spec.class===node.dataset.anatomyComposition),'.wb-spec-body'));
  }
  function foundations(spacing) {
    roles = spacing;
    const host = document.getElementById('wb-spacing-rules');
    if (!host || !spacing) return;
    host.innerHTML = '<div class="wb-spacing-roles">'+spacing.roles.map((role,index)=>{
      const examples=[['Title + description','Record overview','A short summary'],['Items in a group','Name','Email address'],['Larger sections','Contact details','Recent activity'],['Space inside a container','Card content','']];
      const example=examples[index] || examples[0];
      const actualExamples=[
        ['dashboard.html','Dashboard stat tiles','The label-to-value gap uses --stat-label-value-gap, linked to this role.'],
        ['dashboard.html','Dashboard pipeline breakdown','The single-pipeline stacked chart legend uses --viz-legend-item-gap between items.'],
        ['dashboard.html','Chart and legend sections','The gap between the chart and its legend uses --viz-layout-gap-md, linked to --layout-section-gap.'],
        ['dashboard.html','Dashboard chart cards','Standard ds-card shells use --card-pad for their inset. Stat tiles have their own padding overrides.']
      ];
      const actual=actualExamples[index];
      const exampleAccordion=exampleCode(role.token);

      const inset=role.token==='--layout-container-inset';
      const interaction=' role="button" tabindex="0" data-role-token="'+esc(role.token)+'" aria-label="Inspect '+esc(role.name)+' spacing"';
      const demo=inset
        ? '<div class="wb-role-inset"'+interaction+' style="padding:var('+esc(role.token)+')"><div>'+example[1]+'</div></div>'
        : '<div class="wb-role-stack '+(index===0?'wb-role-stack--related':'')+'"><div>'+example[1]+'</div><div class="wb-role-gap"'+interaction+' style="height:var('+esc(role.token)+')"></div><div>'+example[2]+'</div></div>';
      return '<article><div class="wb-role-demo">'+demo+'</div><h3>'+esc(role.name)+' <output data-spacing-role="'+esc(role.token)+'"></output></h3><div class="wb-role-caption">'+example[0]+'</div><details class="wb-guidance wb-role-details"><summary>Token &amp; guidance</summary><code>'+esc(role.token)+'</code><p>'+esc(role.description)+'</p></details>'+exampleAccordion+'</article>';
    }).join('')+'</div>'+ 
      '<div class="wb-spacing-ownership"><div class="wb-spacing-parent"><span>Parent owns the gap between containers</span><div class="wb-spacing-containers"><div>Component owns its inset<div>Related content</div></div><div>Component owns its inset<div>Related content</div></div></div></div></div>'+
      '<details class="wb-guidance"><summary>Spacing principles &amp; ownership</summary><ul>'+spacing.principles.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul><p>'+esc(spacing.note)+'</p></details><details class="wb-guidance"><summary>How to ask for a spacing change</summary><ul>'+spacing.examples.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></details>';
    host.querySelectorAll('[data-role-token]').forEach(hit=>{
      const show=()=>{
        document.querySelectorAll('.wb-role-tooltip').forEach(el=>el.remove());
        const token=hit.dataset.roleToken;
        const value=getComputedStyle(hit).getPropertyValue(token).trim();
        const tooltip=document.createElement('div');tooltip.className='wb-inline-readout wb-role-tooltip';
        tooltip.setAttribute('role','status');
        tooltip.innerHTML='<span>'+esc(value+' · '+token)+'</span><button type="button" class="wb-copy-token">Copy variable</button>';
        hit.closest('.wb-role-demo').append(tooltip);
        tooltip.querySelector('button').addEventListener('click',async event=>{
          try { await navigator.clipboard.writeText(token);copyNotice('Copied '+token); }
          catch(error) {copyNotice('Could not copy token');}
        });
      };
      hit.addEventListener('click',show);
      hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show();}});
    });
    paintRoles();
  }
  function paintRoles() {
    if (!roles) return;
    const s = getComputedStyle(document.documentElement);
    document.querySelectorAll('[data-spacing-role]').forEach(el=> {el.textContent=s.getPropertyValue(el.dataset.spacingRole).trim();});
  }
  function attach(host,spec,bodySelector) { mount(host,spec,bodySelector); }
  function dismissMeasurements(event) {
    if(event.type==='keydown' && event.key!=='Escape') return;
    if(event.type==='pointerdown' && event.target.closest('[data-measure], [data-role-token], .wb-inline-readout')) return;
    document.querySelectorAll('.wb-role-tooltip').forEach(el=>el.remove());
    instances.forEach(state=>{
      const output=state.toolbar.querySelector('output');
      if(output) output.textContent='';
      state.groups.forEach(group=>{group.selectedToken=null;group.overlay.querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected'));});
    });
  }
  // Make token references actionable, including dynamically rendered guidance/tooltips.
  function linkTokens() {
    tokenObserver.disconnect();
    const walker=document.createTreeWalker(document.querySelector('.wb-main')||document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(node.parentElement.closest('script,style,svg,button,textarea,pre,[data-copy-token]')) return;
      const text=node.textContent, regex=/--[a-zA-Z][\w-]*/g;
      if(!regex.test(text)) return;regex.lastIndex=0;
      const fragment=document.createDocumentFragment();let offset=0;
      for(const match of text.matchAll(regex)) {
        fragment.append(text.slice(offset,match.index));
        const span=document.createElement('span');span.dataset.copyToken=match[0];span.textContent=match[0];fragment.append(span);
        offset=match.index+match[0].length;
      }
      fragment.append(text.slice(offset));node.replaceWith(fragment);
    });
    document.querySelectorAll('[data-copy-token]').forEach(el=>{
      el.setAttribute('role','button');el.tabIndex=0;el.title='Copy '+el.dataset.copyToken;
    });
    tokenObserver.observe(document.querySelector('.wb-main')||document.body,{childList:true,subtree:true});
  }
  let tokenQueued=false;
  const tokenObserver=new MutationObserver(()=>{
    if(tokenQueued) return;tokenQueued=true;
    requestAnimationFrame(()=>{tokenQueued=false;linkTokens();});
  });
  linkTokens();
  let toastTimer;
  async function copyToken(event) {
    const target=event.target.closest('[data-copy-token]');if(!target) return;
    if(event.type==='keydown' && !['Enter',' '].includes(event.key)) return;
    event.preventDefault();event.stopPropagation();
    try {await navigator.clipboard.writeText(target.dataset.copyToken);copyNotice('Copied '+target.dataset.copyToken);}
    catch(error){copyNotice('Could not copy token');}
  }
  document.addEventListener('click',copyToken);
  document.addEventListener('keydown',copyToken);
  document.addEventListener('pointerdown',dismissMeasurements);
  document.addEventListener('keydown',dismissMeasurements);
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',schedule);
  document.fonts?.ready.then(schedule);
  document.getElementById('theme-link')?.addEventListener('load',schedule);
  window.wbAnatomy = {render, mount:attach, setMode, foundations, compositions, exampleCode, refresh:schedule};
}());
