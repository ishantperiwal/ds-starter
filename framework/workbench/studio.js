(() => {
  'use strict';
  const M=window.StudioModel,V=window.StudioViews,$=id=>document.getElementById(id);
  const state={catalog:null,tokens:null,tokenError:'',base:'',theme:'',tab:'overview',profile:'demo'};
  let config;
  async function fetchData(url,format='json'){
    const response=await fetch(url);
    if(!response.ok)throw Error('Could not load '+url+' (HTTP '+response.status+')');
    return response[format]();
  }
  function sidebar(){
    let toggle=$('studio-theme-toggle');
    if(!toggle){toggle=document.createElement('button');toggle.id='studio-theme-toggle';toggle.type='button';document.querySelector('.wb-rail').append(toggle);}
    const dark=state.catalog.themes.find(theme=>theme.id==='dark'),light=state.catalog.themes.find(theme=>theme.id==='light');
    toggle.hidden=!(dark&&light);
    const isDark=state.theme==='dark';
    toggle.setAttribute('aria-label',isDark?'Switch to light theme':'Switch to dark theme');toggle.title=toggle.getAttribute('aria-label');
    toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(isDark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>':'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>')+'</svg>';
    toggle.onclick=async()=>{
      toggle.disabled=true;state.theme=isDark?'light':'dark';
      const url=new URL(location.href);url.searchParams.set('theme',state.theme);history.replaceState(null,'',url);
      try{localStorage.setItem('studio-theme:'+state.base,state.theme);}catch{}
      try{await loadThemeTokens();render();}catch(error){showError(error);}finally{toggle.disabled=false;}
    };
    $('navigation').innerHTML=V.navigation(state.catalog,state.tokens,state.tab);
  }
  function paintSamples(){
    const fontRow=state.tokens?.find(row=>state.catalog.foundationPresentation?.tokens?.[row.name]?.kind==='family')||state.tokens?.find(row=>/font.*(?:family|system)/.test(row.name));
    const font=fontRow?M.resolveLiteral(fontRow,state.tokens):null;
    document.querySelectorAll('[data-visual-value]').forEach(sample=>{
      const {visualValue:value,visualKind:kind,visualWeight:weight,visualLeading:leading}=sample.dataset;
      if(['family','size','weight','leading','tracking','style','decoration','transform'].includes(kind)&&font&&CSS.supports('font-family',font))sample.style.fontFamily=font;
      if(kind==='color'&&CSS.supports('background-color',value)){sample.style.backgroundImage='none';sample.style.backgroundColor=value;}
      else if(kind==='spacing'&&/^\d+(\.\d+)?(px|rem|em)$/.test(value)){
        sample.style.setProperty('--sample-space',value);
      }else if(kind==='radius'&&CSS.supports('border-radius',value)){
        sample.querySelector('.fd-radius-object').style.borderRadius=value;
      }else if(kind==='family'&&CSS.supports('font-family',value))sample.style.fontFamily=value;
      else if(kind==='weight'&&CSS.supports('font-weight',value))sample.style.fontWeight=value;
      else if(kind==='leading'&&CSS.supports('line-height',value))sample.style.lineHeight=value;
      else if(kind==='size'&&CSS.supports('font-size',value))sample.style.fontSize=value;
      const typeProperty={tracking:'letter-spacing',style:'font-style',decoration:'text-decoration',transform:'text-transform'}[kind];
      if(typeProperty&&CSS.supports(typeProperty,value))sample.style.setProperty(typeProperty,value);
      if(weight&&CSS.supports('font-weight',weight))sample.style.fontWeight=weight;
      if(leading&&CSS.supports('line-height',leading))sample.style.lineHeight=leading;
    });
  }
  let mapObservers=[],mapEvents;
  function bindTextStyles(){
    mapObservers.forEach(observer=>observer.disconnect());mapObservers=[];
    mapEvents?.abort();mapEvents=new AbortController();
    document.querySelectorAll('.ts-map').forEach(map=>{
    const nodes=[...map.querySelectorAll('.ts-node')],svg=map.querySelector('svg');
    let pinned=null,active=null;
    const refs=node=>JSON.parse(node.dataset.refs||'[]');
    const expand=()=>{if(!map.classList.contains('spacing-map'))return;
      map.querySelectorAll('.sm-role').forEach(role=>{const open=!!pinned&&(role===pinned||refs(role).includes(pinned.dataset.token));role.setAttribute('aria-expanded',String(open));});
      requestAnimationFrame(draw);
    };
    const highlight=node=>{
      active=node;
      nodes.forEach(n=>{
        const related=node&&(n===node||(node.dataset.token?refs(n).includes(node.dataset.token):refs(node).includes(n.dataset.token)));
        n.classList.toggle('is-linked',!!related);n.classList.toggle('is-muted',!!node&&!related);
        n.setAttribute('aria-pressed',String(n===pinned));
      });
      svg.querySelectorAll('path').forEach(path=>path.classList.toggle('is-linked',!!node&&(node.dataset.token===path.dataset.token||node.dataset.style===path.dataset.style)));
    };
    const draw=()=>{
      const bounds=map.getBoundingClientRect();if(!bounds.width)return;
      svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);svg.replaceChildren();
      map.querySelectorAll('[data-style]').forEach(style=>refs(style).forEach(token=>{
        const primitive=nodes.find(n=>n.dataset.token===token);if(!primitive)return;
        const a=primitive.getBoundingClientRect(),b=style.getBoundingClientRect();
        const target=style.closest('.sm-value-group')?.getBoundingClientRect()||b;
        const startOffset=map.classList.contains('stroke-map')?Math.min(24,Math.max(0,(target.left-a.right)/3)):0;
        const x=a.right-bounds.left+startOffset,y=a.top+a.height/2-bounds.top,xx=target.left-bounds.left,yy=b.top+b.height/2-bounds.top;
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        const mid=(x+xx)/2;
        path.setAttribute('d',`M ${x} ${y} C ${mid} ${y}, ${mid} ${yy}, ${xx} ${yy} M ${xx-5} ${yy-3} L ${xx} ${yy} L ${xx-5} ${yy+3}`);
        path.dataset.token=token;path.dataset.style=style.dataset.style;svg.append(path);
      }));highlight(active);
    };
    const properties={family:'font-family',size:'font-size',weight:'font-weight',leading:'line-height'};
    map.querySelectorAll('[data-style]').forEach(node=>{
      const style=state.catalog.foundationPresentation.textStyles?.find(s=>s.id===node.dataset.style);
      if(!style)return;
      Object.entries(properties).forEach(([key,property])=>{
        const row=state.tokens.find(r=>r.name===(style.semanticTokens?.[key]||style[key])),value=row&&M.resolveLiteral(row,state.tokens);
        if(value&&CSS.supports(property,value))node.querySelector('.ts-specimen').style.setProperty(property,value);
      });
    });
    nodes.forEach(node=>{
      node.addEventListener('mouseenter',()=>highlight(node));node.addEventListener('mouseleave',()=>highlight(pinned));
      node.addEventListener('focus',()=>highlight(node));node.addEventListener('blur',()=>highlight(pinned));
      node.addEventListener('click',()=>{pinned=pinned===node?null:node;expand();highlight(pinned);});
      node.addEventListener('keydown',event=>{if(event.key==='Escape'){pinned=null;expand();highlight(null);}});
    });
    if(map.classList.contains('spacing-map')){
      document.addEventListener('click',event=>{if(!nodes.some(node=>node.contains(event.target))){pinned=null;expand();highlight(null);}},{signal:mapEvents.signal});
      document.addEventListener('keydown',event=>{if(event.key==='Escape'){pinned=null;expand();highlight(null);}},{signal:mapEvents.signal});
      window.addEventListener('scroll',draw,{capture:true,passive:true,signal:mapEvents.signal});
    }
    const observer=new ResizeObserver(draw);observer.observe(map);mapObservers.push(observer);draw();
    });
  }
  function bindElevationOverview(){
    document.querySelectorAll('[data-elevation-jump]').forEach(link=>{
      link.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));}});
      link.addEventListener('click',event=>{
        event.preventDefault();
        const workspace=link.closest('.elevation-workspace');
        const target=workspace?.querySelector('#elevation-level-'+link.dataset.elevationJump);
        if(!target)return;
        // Search can hide the requested level. Clear it through its normal handler.
        const search=document.getElementById('catalog-filter');
        if(search?.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
        requestAnimationFrame(()=>{
          target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
          target.focus({preventScroll:true});
          if(target.getAttribute('aria-pressed')!=='true')target.click();
          workspace.querySelectorAll('[data-elevation-jump]').forEach(item=>{
            if(item===link)item.setAttribute('aria-current','true');else item.removeAttribute('aria-current');
          });
        });
      });
    });
  }
  function bindColorBrowser(){
    document.querySelectorAll('[data-color-family]').forEach(button=>{
      const select=()=>{state.colorFamily=state.colorFamily===button.dataset.colorFamily?'All':button.dataset.colorFamily;document.querySelectorAll('[data-color-family]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.colorFamily===state.colorFamily)));$('catalog-filter')?.dispatchEvent(new Event('input',{bubbles:true}));};
      button.addEventListener('click',select);
      if(button.tagName.toLowerCase()!=='button')button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}});
    });
  }
  function bindComponentSpacing(preview,entry,controls){
    let disposed=false,statusObserver,statusNode,componentInspector;
    const apply=()=>{
      const mode=controls?.querySelector('[aria-pressed="true"]')?.dataset.previewMode||'preview';
      const card=preview.closest?.('.cg-card'),surface=preview.closest?.('.cg-preview');
      if(card)card.dataset.previewMode=mode;
      if(surface)surface.inert=!['spacing','component'].includes(mode);
      componentInspector?.setActive(mode==='component');
      const main=preview.contentDocument?.querySelector('main');
      if(main)preview.contentWindow?.wbAnatomy?.setMode?.(main,mode);
    };
    const listeners=[];
    controls?.querySelectorAll('[data-preview-mode]').forEach(button=>{
      const click=()=>{controls.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));apply();};
      button.addEventListener('click',click);button.addEventListener('reset-preview',click);listeners.push(()=>{button.removeEventListener('click',click);button.removeEventListener('reset-preview',click);});
    });
    const connect=()=>{
      if(disposed)return;
      try{
        const doc=preview.contentDocument,win=preview.contentWindow,main=doc?.querySelector('main');
        if(!main||main.dataset.spacingMounted||main.querySelector('.wb-component-toggle'))return;
        if(preview.closest?.('.cg-preview-stage'))doc.body.dataset.gallery='true';
        if(preview.closest?.('.cc-variant'))doc.body.dataset.studioVariant='true';
        main.dataset.spacingMounted='true';
        const sheet=doc.createElement('link');sheet.rel='stylesheet';sheet.href='/framework/workbench/component-spacing.css';doc.head.append(sheet);
        const body=doc.createElement('div');body.className='wb-component-content';
        while(main.firstChild)body.append(main.firstChild);main.append(body);
        componentInspector?.destroy();
        if(controls?.querySelector('[data-preview-mode=component]'))componentInspector=globalThis.wbComponentInspector?.mount(preview,entry,M.blocks(state.catalog),()=>{controls?.querySelector('[data-preview-mode=preview]')?.dispatchEvent(new CustomEvent('reset-preview'));},{sidebar:false});
        const mount=()=>{if(disposed||!preview.isConnected)return;win.wbAnatomy.mount(main,{...entry,anatomy:{...entry.anatomy,specimen:entry.anatomy?.specimen||'.'+entry.class}},'.wb-component-content');if(controls)apply();
          const stage=preview.closest?.('.cg-preview-stage'),readout=main.querySelector('.wb-inline-readout');
          if(stage&&readout){
            statusObserver?.disconnect();statusNode?.remove();
            statusNode=document.createElement('output');statusNode.className='cg-preview-status';statusNode.setAttribute('aria-live','polite');stage.append(statusNode);
            const sync=()=>{statusNode.textContent=readout.textContent;statusNode.hidden=!readout.textContent;statusNode.title=readout.textContent;};
            statusObserver=new MutationObserver(sync);statusObserver.observe(readout,{childList:true,subtree:true,characterData:true});sync();
          }
        };
        if(win.wbAnatomy)mount();else{const script=doc.createElement('script');script.src='/framework/anatomy.js';script.onload=mount;doc.head.append(script);}
      }catch{}
    };
    preview.addEventListener('load',connect);connect();
    return ()=>{disposed=true;componentInspector?.destroy();statusObserver?.disconnect();statusNode?.remove();listeners.forEach(cleanup=>cleanup());preview.removeEventListener('load',connect);};
  }
  let galleryPreviewCleanups=[];
  function fitComponentPreview(preview){
    let observer,disposed=false;
    const connect=()=>{
      observer?.disconnect();
      if(disposed||!preview.isConnected)return;
      try{
        const doc=preview.contentDocument,main=doc?.querySelector('main');if(!main)return;
        const fit=()=>{
          if(!preview.isConnected)return;
          const css=preview.contentWindow.getComputedStyle(doc.body);
          const top=parseFloat(css.paddingTop)||0,bottom=parseFloat(css.paddingBottom)||0;
          const stage=preview.closest('.cg-preview-stage');
          if(stage){const toolbarHeight=parseFloat(getComputedStyle(stage).getPropertyValue('--cg-toolbar-height'))||64;stage.style.paddingTop=Math.max(0,24-top)+'px';stage.style.paddingBottom=(toolbarHeight+Math.max(0,24-bottom))+'px';}
          const height=Math.ceil(main.getBoundingClientRect().height+top+bottom);
          preview.style.height=(stage?height:preview.closest('.cc-variant')?height+4:Math.max(120,height+4))+'px';
        };
        observer=new ResizeObserver(fit);observer.observe(main);fit();
      }catch{}
    };
    preview.addEventListener('load',connect);connect();
    return ()=>{disposed=true;observer?.disconnect();preview.removeEventListener('load',connect);};
  }
  let interactionEvents,canvasCleanup;
  function bindInteractions(){
    interactionEvents?.abort();interactionEvents=new AbortController();
    const panel=document.getElementById('component-interactions');if(!panel)return;
    let trigger,cleanups=[];
    const close=(restore=true)=>{panel.hidden=true;cleanups.forEach(fn=>fn());cleanups=[];panel.replaceChildren();document.querySelectorAll('[data-interactions]').forEach(button=>button.setAttribute('aria-expanded','false'));if(restore)trigger?.focus();};
    const escapePreview=event=>{if(event.key!=='Escape'||event.defaultPrevented||document.querySelector('dialog[open],:popover-open'))return;const preview=document.querySelector('.cc-explorer.is-focused [data-preview-mode=preview]');event.preventDefault();if(preview)preview.click();else close();};
    const open=(entry,button,focusPanel=true,targetId)=>{
      close(false);if(!entry)return;
      trigger=button;
      panel.dataset.composed=String((entry.dependencies||[]).length>0&&!(entry.interactions?.targets||[]).length);
      let requiredWidth=Math.max(280,Number(entry.interactions?.width)||Number(entry.galleryWidth)||320);
      const setWidth=()=>{panel.style.setProperty('--interaction-width',(requiredWidth+24)+'px');document.getElementById('content').style.setProperty('--active-interaction-width',(requiredWidth+24)+'px');};setWidth();
      document.querySelectorAll('[data-interactions]').forEach(control=>control.setAttribute('aria-expanded',String(control.dataset.interactions===entry.id)));
      panel.innerHTML='<header><div><span class="ci-kicker">Interactions</span><h2>'+V.esc(entry.name)+'</h2></div><button type="button" class="ci-close" aria-label="Close interactions">×</button></header><div class="ci-body"></div>';
      panel.hidden=false;
      const body=panel.querySelector('.ci-body');
      const targets=entry.interactions?.targets||[];
      const dependencies=(entry.dependencies||[]).map(id=>M.blocks(state.catalog).find(item=>item.id===id)).filter(Boolean);
      if(!targets.length&&!dependencies.length){const empty=document.createElement('p');empty.className='ci-empty';empty.textContent='No interactions defined.';body.append(empty);}
      const labels={live:'Live',collapsed:'Collapsed',expanded:'Expanded',default:'Default',hover:'Hover',active:'Pressing',pressed:'Pressed',checked:'Checked',focus:'Focus',disabled:'Disabled',selected:'Selected',muted:'Muted','read-only':'Read only'};
      const stateList=document.createElement('div');stateList.className='ci-state-list';
      const addPreview=(mode,target)=>{
        const section=document.createElement('section');section.className='ci-state-preview'+(mode==='live'?' ci-live-preview':'');
        const heading=document.createElement('h3');heading.textContent=mode==='live'?(target.name?.trim()||'Default'):(labels[mode]||mode);
        if(mode==='live'){const glyph=document.createElementNS('http://www.w3.org/2000/svg','svg');glyph.classList.add('cc-chip-icon');glyph.setAttribute('viewBox','0 0 16 16');glyph.setAttribute('fill','none');glyph.setAttribute('stroke','currentColor');glyph.setAttribute('stroke-width','1.25');glyph.setAttribute('stroke-linecap','round');glyph.setAttribute('stroke-linejoin','round');glyph.setAttribute('aria-hidden','true');glyph.innerHTML='<path d="m8 2 6 3.5L8 9 2 5.5 8 2Zm-6 8.5L8 14l6-3.5M2 8l6 3.5L14 8"/>';heading.prepend(glyph);}
        const frame=document.createElement('iframe');frame.title=entry.name+' — '+heading.textContent;frame.style.width=requiredWidth+'px';frame.style.minWidth=requiredWidth+'px';
        const url=new URL(M.previewURL({...entry,preview:entry.interactions?.preview||entry.preview},state.base,state.theme));url.searchParams.set('state',mode);url.searchParams.set('target',target.id);
        section.append(heading,frame);if(mode==='live')body.insertBefore(section,stateList);else stateList.append(section);
        frame.addEventListener('load',()=>{try{
          if(!frame.isConnected)return;
          const doc=frame.contentDocument;
          const fit=()=>{frame.style.height=Math.max(48,Math.ceil(doc.body.getBoundingClientRect().height))+'px';const needed=doc.documentElement.scrollWidth;if(needed>frame.clientWidth+2){requiredWidth=Math.max(requiredWidth,needed);setWidth();}frame.style.width=requiredWidth+'px';frame.style.minWidth=requiredWidth+'px';};
          const observer=new ResizeObserver(fit);observer.observe(doc.body);fit();cleanups.push(()=>observer.disconnect());
          doc.addEventListener('keydown',escapePreview);
        }catch{}});
        frame.src=url.href;
      };
      {
        body.append(stateList);
        const target=targets.find(t=>t.id===targetId)||targets[0];
        if(target){
          addPreview('live',target);
          if(target.states.length)target.states.filter(mode=>mode!=='live').forEach(mode=>addPreview(mode,target));
          else{const note=document.createElement('p');note.className='ci-empty';note.textContent='No interaction states defined for this variant.';stateList.append(note);}
        }else addPreview('live',{id:'main'});
      }
      if(dependencies.length){
        const section=document.createElement('section');section.className='ci-dependencies';
        const label=document.createElement('p');label.textContent='Uses component interactions';section.append(label);
        dependencies.forEach(child=>{const link=document.createElement('button');link.type='button';link.textContent=child.name+' →';
          link.addEventListener('click',()=>{
            if(document.querySelector('.cc-explorer')){document.dispatchEvent(new CustomEvent('studio-explore-component',{detail:child.id}));return;}
            const filter=document.getElementById('catalog-filter');if(filter){filter.value='';filter.dispatchEvent(new Event('input',{bubbles:true}));}
            document.querySelector('[data-component-category="All"]')?.click();
            const card=document.getElementById('entry-'+child.id),control=card?.querySelector('[data-interactions]');
            if(control){card.scrollIntoView({block:'center',behavior:'smooth'});open(child,control);}
          });section.append(link);
        });stateList.append(section);
      }
      panel.querySelector('.ci-close').addEventListener('click',()=>close());
      if(focusPanel)panel.focus();
    };
    document.addEventListener('click',event=>{
      if(event.target.closest('.cc-explorer'))return;
      if(!event.target.closest('.cg-card,.cg-dialog'))document.querySelectorAll('.cg-card[data-preview-mode="spacing"] [data-preview-mode="preview"]').forEach(button=>button.dispatchEvent(new CustomEvent('reset-preview')));
      if(event.target.closest('[data-copy-component], button[data-preview-mode], .ce-panel'))return;
      const button=event.target.closest('[data-interactions]');
      const card=event.target.closest('.cg-card');
      const previewButton=card?.querySelector('[data-interactions]');
      const selection=button||(!event.target.closest('[data-component]')&&previewButton);
      if(selection){open(M.blocks(state.catalog).find(item=>item.id===selection.dataset.interactions),selection);return;}
      if(event.target.classList.contains('ci-live-preview')||!event.target.closest('.cg-card,.cg-dialog,.ci-panel,.ce-panel,button,input,select,textarea,a')){
        document.querySelectorAll('.ci-live-preview iframe').forEach(frame=>frame.contentWindow?.postMessage({type:'titan-clear-preview-selection'},location.origin));
      }
      if(!panel.hidden&&!panel.contains(event.target)&&!event.target.closest('.cg-dialog'))close(false);
    },{capture:true,signal:interactionEvents.signal});
    document.addEventListener('keydown',event=>{if(!panel.hidden)escapePreview(event);},{signal:interactionEvents.signal});
    return {open,close};
  }
  function bindComponentGallery(){
    const interactions=bindInteractions();
    galleryPreviewCleanups.forEach(cleanup=>cleanup());galleryPreviewCleanups=[];
    document.querySelectorAll('.wb-pattern-preview iframe[data-auto-height], .wb-icon-gallery iframe[data-auto-height]').forEach(preview=>galleryPreviewCleanups.push(fitComponentPreview(preview)));
    const dialog=document.querySelector('.cg-dialog');if(!dialog)return;
    canvasCleanup=StudioComponentCanvas.mount({state,interactions,fit:fitComponentPreview,spacing:bindComponentSpacing});return;
  }

  function bind(){
    document.querySelectorAll('.wb-component-group > h2').forEach(heading=>{
      const category=heading.textContent.trim();StudioGroupReference.mount(heading,()=>StudioGroupReference.reference(category,'components',M.blocks(state.catalog).filter(e=>(e.category||'Components')===category),state.base));
    });
    document.querySelectorAll('.fd-category > h2,.ts-group > h3,.ts-column > h2,.wb-section > h2,.wb-spec-head h2').forEach(heading=>{
      const label=heading.textContent.trim(),section=heading.closest('section,article,.ts-group,.ts-column')||heading.parentElement;
      StudioGroupReference.mount(heading,()=>{
        const ids=[...new Set([...section.querySelectorAll('[data-token]')].map(e=>e.dataset.token))];
        return ['Design-system section reference','Section: '+label,'Tab: '+state.tab,'Catalog: '+state.base,'Location: '+location.href,...ids.map(id=>'Token: '+id)].join('\n');
      });
    });
    document.querySelectorAll('[data-copy-component], [data-copy-pattern]').forEach(button=>button.addEventListener('click',async()=>{
      const isPattern=!!button.dataset.copyPattern;const entry=isPattern?state.catalog.patterns.find(item=>item.id===button.dataset.copyPattern):M.blocks(state.catalog).find(item=>item.id===button.dataset.copyComponent);if(!entry)return;
      const text=isPattern?['Pattern reference','Pattern: '+entry.name,'ID: '+entry.id,'Type: '+entry.category,entry.css?'Shared CSS: '+entry.css:'Implementation: documented guidance; inspect the registry for its requirements.','Catalog: '+location.origin+location.pathname+'#patterns/'+encodeURIComponent(entry.id),'Preview: '+M.previewURL(entry,state.base,state.theme)].join('\n'):['Component reference',
        'Component: '+entry.name,'ID: '+entry.id,'Class: .'+entry.class,'CSS: '+entry.css,entry.module?'Renderer: '+entry.module:'',
        'Catalog: '+location.origin+location.pathname+'#components/'+encodeURIComponent(entry.id),
        'Preview: '+M.previewURL(entry,state.base,state.theme)].filter(Boolean).join('\n');
      let copied=false;try{await navigator.clipboard.writeText(text);copied=true;}catch{const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;opacity:0';document.body.append(input);input.select();try{copied=document.execCommand('copy');}catch{}input.remove();button.focus();}
      StudioToast.show(copied?'Copied '+entry.name+' reference':'Could not copy '+entry.name+' reference');
    }));

    document.querySelectorAll('[data-pattern-category]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-pattern-category]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.querySelectorAll('[data-pattern-kind]').forEach(item=>item.hidden=item.dataset.patternKind!==button.dataset.patternCategory);document.getElementById('catalog-filter')?.dispatchEvent(new Event('input'));}));
    document.querySelectorAll('.wb-pattern').forEach(card=>{
      const entry=state.catalog.patterns.find(e=>'entry-'+e.id===card.id);if(!entry)return;
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Search tags';details.className='wb-search-tags';details.append(summary);card.append(details);
      StudioTagEditor.mount(details,entry,'patterns',()=>{card.dataset.search=M.searchMetadata(entry);});
    });
    const filter=$('catalog-filter');
    if(filter){
      const applyFilter=()=>{
        const keepFocus=document.activeElement===filter,start=filter.selectionStart,end=filter.selectionEnd;
        const query=filter.value.toLowerCase().trim();
        const globalFoundations=state.tab==='foundations';
        if(globalFoundations)state.foundationQuery=filter.value;
        let visible=0,total=0;
        document.querySelectorAll('.wb-filterable').forEach(item=>{
          const panel=item.closest('.fd-panel');
          const active=!panel||!!query||panel.dataset.selected==='true';
          const categoryMatch=state.tab==='patterns'?item.dataset.patternKind===document.querySelector('[data-pattern-category][aria-pressed=true]')?.dataset.patternCategory:state.tab!=='components'||!state.componentCategory||state.componentCategory==='All'||item.dataset.category===state.componentCategory;
          const familyMatch=!item.dataset.colorFamilyRow||!state.colorFamily||state.colorFamily==='All'||item.dataset.colorFamilyRow===state.colorFamily;
          item.hidden=!active||!categoryMatch||!familyMatch||!M.searchScore(item.dataset.search,query);item.dataset.searchScore=M.searchScore(item.dataset.search,query);total++;if(!item.hidden)visible++;
        });
        const parents=new Set([...document.querySelectorAll('.wb-filterable')].map(item=>item.parentElement));
        parents.forEach(parent=>{
          const items=[...parent.children].filter(item=>item.classList.contains('wb-filterable'));
          if(!items.length)return;
          const anchor=items[0];
          items.forEach((item,index)=>{if(!item.dataset.searchOrder)item.dataset.searchOrder=String(index+1);});
          items.sort((a,b)=>query?Number(b.dataset.searchScore)-Number(a.dataset.searchScore)||Number(a.dataset.searchOrder)-Number(b.dataset.searchOrder):Number(a.dataset.searchOrder)-Number(b.dataset.searchOrder));
          const marker=document.createComment('search-sort');
          anchor.before(marker);
          items.forEach(item=>parent.insertBefore(item,marker));
          marker.remove();
        });
        document.querySelectorAll('.wb-token-group,.wb-component-group,.fd-category').forEach(group=>{
          group.hidden=![...group.querySelectorAll('.wb-filterable')].some(item=>!item.hidden);
        });
        document.querySelectorAll('.fd-panel').forEach(panel=>{
          const map=panel.querySelector('.ts-map');
          const mapMatch=map&&map.textContent.toLowerCase().includes(query);
          if(query&&mapMatch)visible++;
          panel.hidden=query?!(mapMatch||panel.querySelector('.wb-filterable:not([hidden])')):panel.dataset.selected!=='true';
          panel.querySelector('.fd-search-heading').hidden=!query;
        });
        $('filter-status').textContent=query?(visible?visible+' matches':'No matches'):'';
        document.querySelectorAll('.fd-more').forEach(details=>{if(query)details.open=!!details.querySelector('.wb-filterable:not([hidden])');});
        if(keepFocus&&filter.isConnected){filter.focus({preventScroll:true});filter.setSelectionRange(start,end);}
      };
      let searchTimer;filter.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(applyFilter,120);});
      document.querySelectorAll('[data-component-category]').forEach(button=>button.addEventListener('click',()=>{state.componentCategory=button.dataset.componentCategory;document.querySelectorAll('[data-component-category]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));applyFilter();}));
      if(state.tab==='components')applyFilter();
      if(state.tab==='foundations'){filter.value=state.foundationQuery||'';applyFilter();}
    }
    document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>{
      const tools=button.closest('.wb-width-tools'),parent=tools.closest('.wb-spec-body,.wb-pattern-preview')||tools.parentElement;
      parent.querySelector('iframe').style.width=button.dataset.width;
      tools.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    }));
    paintSamples();
    document.querySelectorAll('[data-foreground]').forEach(sample=>{
      if(CSS.supports('color',sample.dataset.foreground))sample.style.color=sample.dataset.foreground;
      if(CSS.supports('background-color',sample.dataset.background))sample.style.backgroundColor=sample.dataset.background;
    });
    document.querySelectorAll('[data-spacing-value]').forEach(sample=>{
      const value=sample.dataset.spacingValue;
      if(/^\d+(\.\d+)?(px|rem|em)$/.test(value))sample.style.setProperty('--measured-space',value);
      if(sample.dataset.textGap&&CSS.supports('gap',sample.dataset.textGap))sample.style.setProperty('--text-gap',sample.dataset.textGap);
      if(sample.dataset.spacingKind==='radius'&&CSS.supports('border-radius',value))sample.querySelector('.rm-example').style.borderRadius=value;
    });
    bindTextStyles();
    bindElevationOverview();
    bindColorBrowser();
    bindComponentGallery();
  }
  async function loadThemeTokens(){
    const files=[...new Set([...state.catalog.tokenFiles,...state.catalog.themes.map(theme=>theme.file).filter(Boolean)])];
    const sources=await Promise.all(files.map(async file=>({file,text:await fetchData(new URL(file,state.base),'text')})));
    const parsed=new Map(sources.map(({file,text})=>[file,M.parseTokens(text,file)]));
    const themeFiles=new Set(state.catalog.themes.map(theme=>theme.file));
    const base=state.catalog.tokenFiles.filter(file=>!themeFiles.has(file)).flatMap(file=>parsed.get(file)||[]);
    const merge=rows=>rows.filter((row,index)=>!row.isRoot||!rows.slice(index+1).some(next=>next.isRoot&&next.name===row.name));
    state.baseTokens=merge(base);
    state.themeTokens=Object.fromEntries(state.catalog.themes.map(theme=>[theme.id,merge([...base,...(parsed.get(theme.file)||[])])]));
    state.tokens=state.themeTokens[state.theme]||state.baseTokens;
  }
  function render(){
    if(!state.catalog)return;
    canvasCleanup?.();canvasCleanup=null;
    const current=M.route(location.hash);
    state.tab=V.tabs.some(tab=>tab[0]===current.tab)?current.tab:'overview';
    state.foundationSection=current.entry;
    document.body.dataset.view=state.tab;
    document.body.dataset.previewColorScheme=state.catalog.themes.find(theme=>theme.id===state.theme)?.colorScheme||'light';
    const result=V.render(state);
    $('title').textContent=result.title;$('intro').textContent=result.intro;
    $('content').innerHTML=result.html;$('content').setAttribute('aria-busy','false');
    sidebar();bind();
    if(current.entry&&state.tab!=='components'){
      const entry=document.getElementById('entry-'+current.entry);
      if(state.tab==='patterns'&&entry){document.querySelector('[data-pattern-category="'+entry.dataset.patternKind+'"]')?.click();}
      entry?.scrollIntoView({block:'start'});
    }
  }
  function showError(error){
    $('content').innerHTML='<div class="wb-error" role="alert">'+V.esc(error.message)+'</div>';
    $('content').setAttribute('aria-busy','false');
  }
  async function load(){
    try{
      config=await fetchData('/api/studio');
      const params=new URLSearchParams(location.search);
      state.profile=params.get('profile')||config.defaultProfile;
      if(!['demo','project'].includes(state.profile))state.profile='project';
      state.base=new URL(state.profile==='demo'?'/demo/design-system/':'/design-system/',location.origin).href;
      state.catalog=M.normalize(await fetchData(new URL('registry.json',state.base)));
      let savedTheme='';try{savedTheme=localStorage.getItem('studio-theme:'+state.base)||'';}catch{}
      const requestedTheme=params.get('theme')||savedTheme;
      state.theme=state.catalog.themes.some(theme=>theme.id===requestedTheme)?requestedTheme:(state.catalog.themes[0]?.id||'');
      $('brand-name').textContent=state.profile==='demo'?'Studio':config.name;
      document.title=state.catalog.name+' · Design system';
      render();
      try {
        await loadThemeTokens();
      }catch(error){state.tokenError=error.message;}
      // Do not destroy live previews/forms when delayed token indexing completes.
      if(state.tab==='foundations')render();
      else {
        sidebar();
        if($('foundation-count'))$('foundation-count').textContent=M.counts(state.catalog,state.tokens).foundations??'—';
      }
    }catch(error){showError(error);}
  }
  addEventListener('hashchange',()=>{try{render();}catch(error){showError(error);}});
  load();
})();
