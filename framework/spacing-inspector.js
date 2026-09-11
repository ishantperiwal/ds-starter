/* Opt-in CRM spacing inspection. No DOM/style work without ?ds=true.
   Intentionally conservative: unsupported cascade/geometry is unknown, not hardcoded. */
(() => {
  'use strict';

  // Screens can load the inspector from a nested studio on another server root.
  const toastURL=new URL('workbench/toast.js',document.currentScript.src).href;
  const copyNotice=message=>import(toastURL).then(()=>globalThis.StudioToast.show(message));
  const config=window.dsInspectorConfig||{};
  const registryURL=config.registryUrl||'/design-system/registry.json';
  const sourceBase=new URL('.',new URL(registryURL,location.href)).href;
  const workbenchURL=config.workbenchUrl||'/design-system/#components';
  if (new URLSearchParams(location.search).get('ds') !== 'true' || window.__DS_EXAMPLE_KEY || window.dsSpacingInspector) return;
  window.dsSpacingInspector = true;
  const start = () => {
    const host = document.createElement('div');
    host.id = 'ds-spacing-inspector';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    document.body.append(host);
    const root = host.attachShadow({mode:'open'});
    root.innerHTML = `<style>
      :host{font:13px/1.4 system-ui,sans-serif;color:#242424}*{box-sizing:border-box}
      .bar,.tip{pointer-events:auto;background:#fff;border:1px solid #d9d9df;border-radius:10px;box-shadow:0 4px 20px #0002;padding:12px}
      .bar{position:fixed;bottom:16px;right:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 32px)}
      button{font:inherit;cursor:pointer;border:1px solid #d9d9df;border-radius:6px;background:#f6f6f8;padding:5px 9px;color:inherit}
      button:focus-visible{outline:2px solid #246bff;outline-offset:2px}label{white-space:nowrap}
      .band{position:fixed;pointer-events:auto;padding:0;border:1px solid #bd852c70;border-radius:0;background:#ffc96b55;min-width:0;min-height:0}
      .band.hard{background:#ef85854a;border-color:#c5595966}.band.unknown{background:#969ba533;border:1px dashed #69717c}
      .band.selected{outline:2px solid #246bff;outline-offset:-2px}.band:hover{filter:brightness(.93)}
      .tip{position:fixed;width:320px;max-width:min(340px,calc(100vw - 24px));padding:0;overflow:hidden;overflow-wrap:anywhere}
      .tip[hidden]{display:none}
      .tip button{margin:0}
      .tip-head{display:grid;gap:6px;padding:10px 12px;border-bottom:1px solid #ececf0}
      .tip-head-top{display:flex;align-items:center;gap:8px}
      .tip-title{display:flex;align-items:baseline;gap:8px;margin:0;min-width:0}
      .tip-title strong{font-weight:650;white-space:nowrap}
      .tip-px{font-weight:650;color:#185ac5}
      .tip-kind{font-size:10px;font-weight:650;letter-spacing:.03em;text-transform:uppercase;border-radius:999px;padding:2px 7px;white-space:nowrap;background:#ffc96b66;color:#7a5612}
      .tip-kind.hard{background:#ef85854a;color:#963b3b}.tip-kind.unknown{background:#969ba533;color:#595962}
      .tip .tip-close{margin-left:auto;border:0;background:transparent;font-size:16px;line-height:1;padding:2px 7px;border-radius:6px;color:#686873}
      .tip .tip-close:hover{background:#f1f1f4;color:#242424}
      .tip-body{display:grid;gap:8px;padding:10px 12px}
      .seg{display:flex;border-radius:9px;background:#ececf0;padding:3px;gap:2px}
      .seg button{flex:1;border:0;border-radius:6px;background:transparent;padding:5px 10px;font-weight:550;color:#5b5b66}
      .seg button[aria-pressed=true]{background:#fff;color:#185ac5;box-shadow:0 1px 3px #0000001f}
      .seg button:disabled{opacity:.45}
      .stepper{display:flex;align-items:center;justify-content:space-between;gap:6px;border:1px solid #d9d9df;border-radius:8px;background:#fbfbfc;padding:2px}
      .stepper button{border:0;background:transparent;padding:3px 11px;font-size:15px;line-height:1.2;border-radius:6px}
      .stepper button:hover:not(:disabled){background:#f1f1f4}
      .stepper output{flex:1;text-align:center;font-weight:650}
      .tip-status{margin:0;font-size:11.5px;line-height:1.45;color:#686873}
      .tip-actions{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px}
      .tip-actions button{font-size:12px;padding:4px 9px}
      .tip-ref{border-top:1px solid #ececf0;padding:0 12px 6px}
      .tip-ref summary{cursor:pointer;padding:8px 0;font-size:11.5px;color:#686873}
      .tip-row{display:grid;grid-template-columns:62px 1fr;gap:8px;margin:0 0 6px}
      .tip-row>span{color:#8a8a95;font-size:11px}
      .tip-row code{font-size:11px;color:#3c3c46;overflow-wrap:anywhere}
      .tip code{white-space:normal}
      .swatch{display:inline-block;width:10px;height:10px;background:#ffc96b;margin-right:4px}.swatch.red{background:#efaaaa}.swatch.gray{background:#aeb3ba}
      .component-outline{position:fixed;border:2px solid #246bff;background:#246bff08;pointer-events:none}
      .component-name{position:fixed;max-width:calc(100vw - 8px);overflow:hidden;text-overflow:ellipsis;top:0;left:0;background:#246bff;color:white;padding:3px 7px;white-space:nowrap}
      .component-panel{right:16px;top:16px;max-height:calc(100vh - 110px);overflow:auto;width:460px;max-width:calc(100vw - 32px);padding:12px}
      .component-panel button,.component-panel a{margin:3px}.component-panel a{color:#185ac5;display:inline-block}
      .component-panel summary{cursor:pointer;margin:8px 0}.component-panel h3{margin:0 0 8px}
      .panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-heading h3{margin:0}.panel-caption{color:#686873;font-size:12px}.panel-actions{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.component-panel .panel-actions button,.component-panel .panel-actions a{margin:0;padding:8px 11px;border:1px solid #d9d9df;border-radius:8px;text-decoration:none;font-weight:550}.panel-actions button:first-child{background:#edf3ff;color:#185ac5;border-color:#cfddfb}.panel-preview iframe{width:100%;border:1px solid #e8e8ec;border-radius:6px;background:#fff}.component-panel details{border-top:1px solid #eeeef2;padding-top:4px;margin-top:10px}.component-panel .type-verdict{border:0;padding:12px}.type-verdict>summary{margin:0;font-weight:650}.type-verdict .type-table{font-weight:400}.type-verdict.is-clear{background:#e5f4ec;color:#246143}.type-verdict{padding:10px;border-radius:7px;background:#fff3dc;margin:12px 0 6px;font-weight:650}
      .type-table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;table-layout:fixed}
      .type-table th,.type-table td{text-align:left;padding:8px 4px;border-bottom:1px solid #e8e8ec;vertical-align:top}
      .type-table th{font-weight:600;color:#62626b}.type-table td:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .type-status{display:inline-block;padding:2px 5px;border-radius:4px;font-weight:600;white-space:nowrap}
      .type-status.token{background:#e5f4ec;color:#246143}.type-status.hard{background:#fdeaea;color:#963b3b}.type-status.unknown{background:#ededf1;color:#595962}
      [data-mode][aria-pressed="true"]{background:#e7efff;border-color:#246bff}
    </style><div class="bands"></div><div class="bar" role="region" aria-label="Design system spacing inspector">
      <button data-mode="spacing" aria-pressed="true">Spacing</button><button data-mode="components" aria-pressed="false">Components</button><label><input type="checkbox" data-kind="token" checked><i class="swatch"></i>DS tokens</label>
      <label><input type="checkbox" data-kind="hard" checked><i class="swatch red"></i>Hardcoded</label>
      <label><input type="checkbox" data-kind="unknown" checked><i class="swatch gray"></i>Unresolved</label>
      <button data-toggle aria-keyshortcuts="H" title="Toggle spacing highlights (H)">Pause · H</button><span class="count" aria-live="polite"></span></div>
      <div class="tip" role="dialog" aria-label="Spacing details" hidden></div>`;
    const bands = root.querySelector('.bands'), tip = root.querySelector('.tip');
    let enabled = true, timer, selected, refreshPending = false, rules = [], known = new Set(), opaque = false;
    let mode='spacing', catalog=[], catalogStatus='idle', componentSelection=null, hovered=null;
    const outline=document.createElement('div');outline.className='component-outline';outline.hidden=true;root.append(outline);
    const componentPanel=document.createElement('div');componentPanel.className='tip component-panel';componentPanel.hidden=true;
    componentPanel.setAttribute('role','dialog');componentPanel.setAttribute('aria-label','Component inspection');root.append(componentPanel);
    const filters = {token:true, hard:true, unknown:true};
    const properties = ['padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','row-gap','column-gap'];
    let declarationCache=new WeakMap(), traceCache=new WeakMap(), ownerCache=new WeakMap();
    let visibleOwners=new Map();
    const split = text => {
      let depth=0, current='', result=[];
      for(const c of text){if(c==='('||c==='[')depth++;if(c===')'||c===']')depth--;if(c===','&&!depth){result.push(current);current='';}else current+=c;}
      return result.concat(current);
    };
    // Complex functional selectors/layers are deliberately not guessed.
    function specificity(selector) {
      if(/:(?:is|not|has|nth-child|nth-last-child)\(/.test(selector)) return null;
      const s=selector.replace(/:where\([^)]*\)/g,'');
      const ids=(s.match(/#[\w-]+/g)||[]).length;
      const classes=(s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+(?:\([^)]*\))?/g)||[]).length;
      const types=(s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+(?:\([^)]*\))?/g,'').match(/(^|[\s>+~])(?:[a-zA-Z][\w-]*)|::[\w-]+/g)||[]).length;
      return [0,ids,classes,types];
    }
    function collect() {
      declarationCache=new WeakMap();traceCache=new WeakMap();ownerCache=new WeakMap();
      rules=[]; known=new Set(); opaque=false;
      function walk(list,source,uncertain=false) {
        for(const rule of list){
          if(rule.type===3){try{if(!rule.media.length||matchMedia(rule.media.mediaText).matches)walk(rule.styleSheet.cssRules,new URL(rule.href,source).href,uncertain);}catch{opaque=true;}continue;}
          if(rule.type===4 && !matchMedia(rule.conditionText).matches)continue;
          if(rule.type===12 && !CSS.supports(rule.conditionText))continue;
          if(rule.selectorText && rule.style){
            if(source.includes('/design-system/'))for(const name of rule.style)if(name.startsWith('--'))known.add(name);
            rules.push({selector:rule.selectorText,style:rule.style,source,uncertain});
          } else if(rule.cssRules) walk(rule.cssRules,source,uncertain || ![4,12].includes(rule.type));
        }
      }
      for(const sheet of document.styleSheets){if(sheet.disabled)continue;try{if(!sheet.media.length||matchMedia(sheet.media.mediaText).matches)walk(sheet.cssRules,sheet.href||location.pathname+' (style)');}catch{opaque=true;}}
    }
    function declarations(style,prop,cs) {
      let cache=declarationCache.get(style);
      if(!cache){cache=new Map();declarationCache.set(style,cache);}
      const cacheKey=prop+'|'+cs.writingMode+'|'+cs.direction;
      if(cache.has(cacheKey))return cache.get(cacheKey);
      const vertical=cs.writingMode!=='horizontal-tb', rtl=cs.direction==='rtl';
      const map=vertical?{}:{'block-start':'top','block-end':'bottom','inline-start':rtl?'right':'left','inline-end':rtl?'left':'right'};
      const values=[];
      // CSSOM expands var() shorthands into empty longhands. Read serialized declarations.
      const entries=style.cssText.match(/(?:[^;()'"]|\([^)]*\)|"[^"]*"|'[^']*')+/g)||[];
      for(const entry of entries){
        const colon=entry.indexOf(':');if(colon<0)continue;
        const name=entry.slice(0,colon).trim();
        let value=entry.slice(colon+1).trim(),important=/!important\s*$/.test(value);
        value=value.replace(/\s*!important\s*$/,'');
        let match=name===prop || (prop.endsWith('-gap') && name==='gap');
        for(const prefix of ['padding','margin']){
          if(prop.startsWith(prefix+'-')){
            const side=prop.slice(prefix.length+1);
            if(name===prefix)match=true;
            for(const [axis,physical] of Object.entries(map))if(physical===side && (name===prefix+'-'+axis || name===prefix+'-'+axis.split('-')[0]))match=true;
          }
        }
        if(match){
          let depth=0, part='', parts=[];
          for(const c of value){if(c==='(')depth++;if(c===')')depth--;if(/\s/.test(c)&&depth===0){if(part)parts.push(part);part='';}else part+=c;}
          if(part)parts.push(part);
          if(parts.length>1){
            if(name==='padding'||name==='margin'){
              const index=['top','right','bottom','left'].indexOf(prop.split('-')[1]);
              value=[parts[0],parts[1],parts[2]||parts[0],parts[3]||parts[1]][index];
            } else if(name==='gap')value=parts[prop==='row-gap'?0:1]||parts[0];
            else if(/-(block|inline)$/.test(name)){
              const end=name.endsWith('block')?'bottom':rtl?'left':'right';
              value=parts[prop.endsWith('-'+end)?1:0]||parts[0];
            }
          }
          values.push({value,important,declaration:name});
        }
      }
      cache.set(cacheKey,values);return values;
    }
    function trace(el,prop,cs) {
      let cache=traceCache.get(el);
      if(!cache){cache=new Map();traceCache.set(el,cache);}
      if(cache.has(prop))return cache.get(prop);
      let candidates=[],uncertain=opaque;
      rules.forEach((r,order)=>{
        const found=declarations(r.style,prop,cs);if(!found.length)return;
        let best=null, matched=false;
        for(const selector of split(r.selector))try{if(el.matches(selector.trim())){matched=true;const score=specificity(selector);if(!score){uncertain=true;continue;}if(!best||compare(score,best)>0)best=score;}}catch{uncertain=true;}
        if(!matched)return;
        if(r.uncertain)uncertain=true;
        for(const d of found)candidates.push({...d,targetStyle:r.style,specificity:best||[0,0,0,0],order,source:r.source,selector:r.selector});
      });
      for(const d of declarations(el.style,prop,cs))candidates.push({...d,targetStyle:el.style,specificity:[1,0,0,0],order:rules.length,source:location.pathname+' (inline)',selector:el.tagName.toLowerCase()});
      candidates.sort((a,b)=>Number(a.important)-Number(b.important)||compare(a.specificity,b.specificity)||a.order-b.order);
      const winner=candidates.at(-1);
      if(!winner){const result={kind:'unknown',value:cs.getPropertyValue(prop),source:'No inspectable declaration (browser default or stylesheet unavailable)'};cache.set(prop,result);return result;}
      const tokens=[...winner.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(x=>x[1]);
      const globals=/\b(?:inherit|revert|unset|initial|env)\b/.test(winner.value);
      const result={...winner,tokens,kind:uncertain||globals?'unknown':tokens.length?(tokens.every(t=>known.has(t)&&cs.getPropertyValue(t).trim())?'token':'unknown'):'hard'};
      cache.set(prop,result);return result;
    }
    function compare(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]-b[i];}return 0;}
    const edits=new Map(), styleIds=new WeakMap();let nextStyleId=0;
    const styleId=style=>{if(!styleIds.has(style))styleIds.set(style,++nextStyleId);return styleIds.get(style);};
    function tokenOwner(el,token){
      if(!el)return null;
      let cache=ownerCache.get(el);if(!cache){cache=new Map();ownerCache.set(el,cache);}
      if(cache.has(token))return cache.get(token);
      const found=trace(el,token,getComputedStyle(el));
      const result=found.targetStyle?(found.kind==='unknown'?null:{...found,property:token,key:styleId(found.targetStyle)+'|'+token}):tokenOwner(el.parentElement,token);
      cache.set(token,result);return result;
    }
    function owner(item){
      const token=item.tokens?.length===1 && /^var\(\s*--[\w-]+\s*\)$/.test(item.value)?item.tokens[0]:null;
      if(token && !token.startsWith('--space-') && item.kind==='token'){
        return tokenOwner(item.element,token);
      }
      if((item.kind==='hard'||(token?.startsWith('--space-')&&item.kind==='token'))&&item.targetStyle)return {...item,property:item.prop,key:styleId(item.targetStyle)+'|'+item.prop};
      return null;
    }
    function groupKey(item){return owner(item)?.key||'instance|'+elementPath(item.element)+'|'+item.prop;}
    const pending=document.createElement('details');
    pending.innerHTML='<summary>Preview changes: 0</summary><div></div>';
    root.querySelector('.bar').append(pending);
    const copyChanges=document.createElement('button');copyChanges.textContent='Copy changes prompt';
    const resetChanges=document.createElement('button');resetChanges.textContent='Reset previews';
    root.querySelector('.bar').append(copyChanges,resetChanges);
    function updatePending(){
      pending.querySelector('summary').textContent='Preview changes: '+edits.size;
      const list=pending.querySelector('div');list.replaceChildren();
      for(const edit of edits.values()){
        const row=document.createElement('p');row.textContent=edit.label+' → '+edit.next;list.append(row);
      }
      copyChanges.disabled=resetChanges.disabled=!edits.size;
    }
    copyChanges.onclick=async()=>{
      const prompt='Apply these spacing changes in source code. These are temporary browser previews only. Preserve the specified owner/scope and unrelated local/theme overrides. Do not change spacing primitives. Verify the original source before editing.\n\n'+Array.from(edits.values(),edit=>edit.context+'\nChosen scope: '+edit.scope+'\nOwner: '+edit.label+'\nOriginal owner declaration: '+(edit.original||'(no inline declaration)')+'\nRequested declaration: '+edit.property+': '+edit.next+'\nAffected elements on this page at preview: '+edit.count).join('\n\n---\n\n');
      try{await navigator.clipboard.writeText(prompt);copyNotice('Copied spacing changes');}catch{copyNotice('Could not copy spacing changes');}
    };
    resetChanges.onclick=()=>{
      for(const edit of Array.from(edits.values()).reverse())edit.style.cssText=edit.before;
      edits.clear();updatePending();dismiss();render();
    };
    function spacingEditor(item,owning,body){
      const scope=document.createElement('select');scope.setAttribute('aria-label','Spacing change scope');
      scope.add(new Option('This instance only','instance'));
      if(owning)scope.add(new Option(owning.property.startsWith('--')?'Shared token owner (all consumers)':'Same CSS rule and property','owner'));
      const scale=document.createElement('select');scale.setAttribute('aria-label','New spacing value');
      scale.add(new Option('Choose spacing…',''));
      for(const name of [...known].filter(t=>/^--(?:[a-z0-9]+-)*space-\d+(?:-\d+)?$/.test(t))){
        const value=getComputedStyle(item.element).getPropertyValue(name).trim();
        if(value)scale.add(new Option(value+' · '+name,'var('+name+')'));
      }
      const status=document.createElement('p');status.className='tip-status';
      status.textContent=owning?'Shared owner resolved; previewing a shared change affects every consumer.':'Owner unresolved; only a local instance preview is available.';
      const toggle=document.createElement('div');toggle.className='seg';toggle.setAttribute('role','group');toggle.setAttribute('aria-label','Spacing scope');
      const sharedButton=document.createElement('button'),localButton=document.createElement('button');
      sharedButton.textContent='Shared';localButton.textContent='Local';sharedButton.disabled=!owning;
      sharedButton.title=owning?'Change this shared owner':'Shared ownership could not be resolved';
      toggle.append(sharedButton,localButton);
      const stepper=document.createElement('div');stepper.className='stepper';
      const less=document.createElement('button'),more=document.createElement('button'),valueLabel=document.createElement('output');
      less.textContent='−';more.textContent='+';less.setAttribute('aria-label','Less spacing');more.setAttribute('aria-label','More spacing');
      valueLabel.setAttribute('aria-live','polite');
      stepper.append(less,valueLabel,more);
      const steps=Array.from(scale.options).slice(1).map(option=>({value:option.value,px:parseFloat(option.textContent),label:option.textContent})).filter(step=>Number.isFinite(step.px)).sort((a,b)=>a.px-b.px);
      let current=parseFloat(getComputedStyle(item.element).getPropertyValue(item.prop))||item.px,busy=false;
      function syncControls(){
        sharedButton.setAttribute('aria-pressed',String(scope.value==='owner'));localButton.setAttribute('aria-pressed',String(scope.value==='instance'));
        valueLabel.textContent=current+'px';
        less.disabled=busy||!steps.some(step=>step.px<current);more.disabled=busy||!steps.some(step=>step.px>current);
      }
      function discardScope(dropShared){
        for(const [key,edit] of Array.from(edits)){
          if(!!edit.shared!==dropShared || edit.item!==item)continue;
          if(edit.original)edit.style.setProperty(edit.property,edit.original,edit.priority);
          else edit.style.removeProperty(edit.property);
          edits.delete(key);
        }
        updatePending();
      }
      function chooseScope(value){
        if(scope.value!==value)discardScope(value!=='owner');
        scope.value=value;
        current=parseFloat(getComputedStyle(item.element).getPropertyValue(item.prop))||0;
        status.textContent=value==='owner'?'Shared: all consumers of this owner. Switching back to Local discards it.':'Local: only this element. Any shared preview for it has been discarded.';
        render();syncControls();
      }
      sharedButton.onclick=()=>chooseScope('owner');localButton.onclick=()=>chooseScope('instance');
      const apply=document.createElement('button');apply.textContent='Preview spacing';apply.disabled=true;
      scale.onchange=()=>{apply.disabled=!scale.value;};
      apply.onclick=()=>{
        if(!scale.value)return;
        const shared=scope.value==='owner',target=shared?owning:null;
        const style=target?.targetStyle||item.element.style,property=target?.property||item.prop;
        const key=styleId(style)+'|'+property;
        const count=shared?(visibleOwners.get(owning.key)?.size||0):1;
        const previous=edits.get(key);
        const edit=previous||{style,property,before:style.cssText,original:style.getPropertyValue(property),priority:style.getPropertyPriority(property),context:contextText(item),scope:shared?'Shared owner; other pages using this source may also change':'This instance only',label:shared?property+' at '+target.selector+' · '+target.source:elementPath(item.element)+' · '+property};
        // A primitive scale owner must remain a literal, not reference itself or
        // another primitive that may alias back to it.
        const primitive=shared&&/^--(?:[a-z0-9]+-)*space-\d+(?:-\d+)?$/.test(property);
        const nextValue=primitive?(steps.find(step=>step.value===scale.value)?.px+'px'):scale.value;
        edit.next=nextValue;edit.count=count;edit.shared=shared;edit.item=item;edits.set(key,edit);
        style.setProperty(property,nextValue,shared?style.getPropertyPriority(property):'important');
        updatePending();copyChanges.textContent='Copy changes prompt';
        current=parseFloat(getComputedStyle(item.element).getPropertyValue(item.prop))||0;
        status.textContent='Preview applied; refreshing highlights…';apply.disabled=true;busy=true;syncControls();
        // Allow the browser to paint the spacing change before measuring overlays.
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const chosen=selected;selected=null;render();selected=chosen;
          if(chosen===item)tip.hidden=false;
          const key=shared?owning.key:groupKey({...trace(item.element,item.prop,getComputedStyle(item.element)),element:item.element,prop:item.prop});
          bands.querySelectorAll('.band').forEach(b=>b.classList.toggle('selected',b.dataset.group===key));
          status.textContent='Preview applied. '+count+' matching visible element(s) were highlighted. Other pages, offscreen and hidden elements are not counted.';
          apply.disabled=false;busy=false;syncControls();
        }));
      };
      function step(direction){
        if(busy)return;
        const next=direction>0?steps.find(step=>step.px>current):steps.filter(step=>step.px<current).at(-1);
        if(next){scale.value=next.value;apply.onclick();}
      }
      less.onclick=()=>step(-1);more.onclick=()=>step(1);syncControls();
      body.append(toggle,stepper,status);
    }
    updatePending();
    function dismiss(){
      tip.hidden=true;selected=null;
      bands.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));
      if(refreshPending){refreshPending=false;schedule();}
    }
    function show(item,button){
      dismiss();selected=item;
      const group=button.dataset.group;bands.querySelectorAll('.band').forEach(b=>{if(b===button || (group && b.dataset.group===group))b.classList.add('selected');});tip.replaceChildren();tip.hidden=false;
      const kindLabel=item.kind==='token'?'Token':item.kind==='hard'?'Hardcoded':'Unresolved';
      const head=document.createElement('div');head.className='tip-head';
      const top=document.createElement('div');top.className='tip-head-top';
      const badge=document.createElement('span');badge.className='tip-kind '+item.kind;badge.textContent=kindLabel;
      const close=document.createElement('button');close.className='tip-close';close.setAttribute('aria-label','Close spacing details');close.textContent='×';close.onclick=dismiss;
      top.append(badge,close);
      const title=document.createElement('p');title.className='tip-title';
      const prop=document.createElement('strong');prop.textContent=item.prop;
      const px=document.createElement('span');px.className='tip-px';px.textContent=item.px+'px';
      title.append(prop,px);
      head.append(top,title);tip.append(head);
      const body=document.createElement('div');body.className='tip-body';
      const owning=owner(item);
      spacingEditor(item,owning,body);
      tip.append(body);
      const actions=document.createElement('div');actions.className='tip-actions';
      if(item.tokens?.length){
        const variable=document.createElement('button');
        variable.textContent=item.tokens.length===1?'Copy variable':'Copy variables';
        variable.onclick=async()=>{try{await navigator.clipboard.writeText(item.tokens.join('\n'));copyNotice('Copied '+item.tokens.join(', '));}catch{copyNotice('Could not copy tokens');}};
        actions.append(variable);
      }
      const copy=document.createElement('button');copy.textContent='Copy spacing context';
      copy.onclick=async()=>{try{await navigator.clipboard.writeText(contextText(item));copyNotice('Copied spacing context');}catch{copyNotice('Could not copy spacing context');}};actions.append(copy);
      const detailedCopy=document.createElement('button');detailedCopy.textContent='Copy detailed context';detailedCopy.onclick=async()=>{try{await navigator.clipboard.writeText(contextText(item,true));copyNotice('Copied detailed element context');}catch{copyNotice('Could not copy detailed element context');}};actions.append(detailedCopy);
      tip.append(actions);
      const ref=document.createElement('details');ref.className='tip-ref';
      const summary=document.createElement('summary');summary.textContent='Reference';ref.append(summary);
      const rows=[];
      if(item.tokens?.length)rows.push(['Token',item.tokens.join(', ')]);else rows.push(['Value',item.value]);
      if(item.declaration)rows.push(['Declaration',item.declaration+': '+item.value]);
      if(item.selector)rows.push(['Selector',item.selector]);
      if(item.source)rows.push(['Source',item.source]);
      rows.push(['Owner',owning?owning.selector+' · '+owning.source:item.kind==='unknown'?'Unresolved; cascade, token alias or browser default could not be proven.':item.kind==='hard'?'Page-specific spacing; may be intentional.':'This instance only.']);
      for(const [name,value] of rows){const row=document.createElement('p');row.className='tip-row';const key=document.createElement('span');key.textContent=name;const val=document.createElement('code');val.textContent=value;row.append(key,val);ref.append(row);}
      tip.append(ref);
      const rect=button.getBoundingClientRect();const size=tip.getBoundingClientRect();
      tip.style.left=Math.max(12,Math.min(rect.left,innerWidth-size.width-12))+'px';tip.style.top=Math.max(12,Math.min(rect.bottom+6,innerHeight-size.height-12))+'px';
    }
    function elementPath(el) {
      const parts=[];
      for(let node=el;node && node!==document.documentElement;node=node.parentElement){
        if(node.id){parts.unshift('#'+CSS.escape(node.id));break;}
        const tag=node.localName;
        const siblings=node.parentElement?Array.from(node.parentElement.children).filter(x=>x.localName===tag):[];
        parts.unshift(tag+(siblings.length>1?`:nth-of-type(${siblings.indexOf(node)+1})`:''));
      }
      return parts.join(' > ');
    }
    function contextText(item, detailed=false) {
      const el=item.element;
      const short=text=>(text||'').replace(/\s+/g,' ').trim().slice(0,140);
      const label=node=>{
        const labelled=node.getAttribute('aria-labelledby');
        if(labelled)return short(labelled.split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' '));
        return short(node.getAttribute('aria-label')||node.labels?.[0]?.textContent||node.querySelector('.ds-field-label,h1,h2,h3,h4')?.textContent||(!node.matches('input,textarea,select')?node.textContent:''));
      };
      const states=[];
      for(let node=el;node && node!==document.body;node=node.parentElement){
        const attrs=['aria-expanded','aria-selected','aria-checked','aria-disabled','data-state','data-pane','data-theme','data-size'].filter(a=>node.hasAttribute(a)).map(a=>a+'='+node.getAttribute(a));
        for(const key of ['disabled','checked','open'])if(node[key]===true)attrs.push(key);
        if(node===document.activeElement)attrs.push('focused');
        if(attrs.length)states.push(elementPath(node)+': '+attrs.join(', '));
      }
      const section=el.closest('.ds-card,section,[role="dialog"],.ps-pane');
      const heading=section?.querySelector('h1,h2,h3,h4,.ps-card-title,.ds-card-title');
      const url=new URL(location.href);url.searchParams.delete('ds');
      if(!detailed)return [
        'Spacing reference', 'Page: '+document.title+' — '+url.href,
        'Element: '+elementPath(el), 'Property: '+item.prop+'; computed: '+item.px+'px',
        'Token: '+(item.tokens?.join(', ')||'(none)'),
        'Declaration: '+(item.declaration||item.prop)+': '+item.value,
        'Source: '+item.source+'; selector: '+(item.selector||'(unresolved)'),
        states.length?'State: '+states.join(' | '):'',
        'Viewport: '+innerWidth+' × '+innerHeight+'; theme: '+(document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'default'),
        item.between?'Between: '+item.between.map(elementPath).join(' → '):''
      ].filter(Boolean).join('\n');
      return [
        'Spacing adjustment context',
        'Page: '+document.title+' — '+url.href,
        'Element: '+elementPath(el),
        'Classes: '+(el.getAttribute('class')||'(none)'),
        'Label: '+(label(el)||'(unlabelled)'),
        heading?'Section: '+short(heading.textContent):'',
        item.between?'Gap between: '+item.between.map(node=>elementPath(node)+' ['+(label(node)||node.localName)+']').join(' → '):'',
        'Property: '+item.prop+'; measured: '+item.px+'px',
        'Token(s): '+(item.tokens?.join(', ')||'(none; '+item.kind+')'),
        'Declaration: '+(item.declaration||item.prop)+': '+item.value,
        'CSS source: '+item.source+'; selector: '+(item.selector||'(unresolved)'),
        'State: '+(states.join(' | ')||'No explicit state attributes'),
        'Viewport: '+innerWidth+' × '+innerHeight+'; theme: '+(document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'default'),
        'Review this instance first; decide whether the fix belongs locally, to a variant, or to the shared token. Do not assume a global change.'
      ].filter(Boolean).join('\n');
    }
    function render() {
      if(!enabled)return;
      if(mode==='components'){
        root.querySelector('.count').textContent=catalogStatus==='ready'?'Hover and click to inspect':catalogStatus==='error'?'Registry unavailable — switch modes to retry':'Loading registry…';
        if(componentSelection && (!componentSelection.el.isConnected||!componentSelection.el.getClientRects().length))closeComponent();
        else if(componentSelection)drawComponent(componentSelection);
        return;
      }
      // Hover transitions and unrelated DOM updates must not destroy an open copy
      // popup. Refresh after dismissal; removed/hidden targets may close immediately.
      if(selected?.element.isConnected && selected.element.getClientRects().length){
        refreshPending=true;return;
      }
      refreshPending=false;
      dismiss();collect();bands.replaceChildren();visibleOwners=new Map();let count=0;
      const add=(el,prop,rect,px,cs,between)=>{
        if(px<.5||rect.w<1||rect.h<1||rect.x>=innerWidth||rect.y>=innerHeight||rect.x+rect.w<=0||rect.y+rect.h<=0)return;
        const info=trace(el,prop,cs);if(!filters[info.kind])return;
        let left=0,top=0,right=innerWidth,bottom=innerHeight;
        for(let parent=el.parentElement;parent;parent=parent.parentElement){
          const style=getComputedStyle(parent),bounds=parent.getBoundingClientRect();
          if(/hidden|clip|auto|scroll/.test(style.overflowX)){left=Math.max(left,bounds.left);right=Math.min(right,bounds.right);}
          if(/hidden|clip|auto|scroll/.test(style.overflowY)){top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom);}
        }
        const x=Math.max(left,rect.x),y=Math.max(top,rect.y),w=Math.min(right,rect.x+rect.w)-x,h=Math.min(bottom,rect.y+rect.h)-y;
        if(w<1||h<1)return;
        const button=document.createElement('button');button.className='band '+info.kind;button.tabIndex=-1;
        button.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
        button.dataset.group=groupKey({...info,prop,element:el});
        if(!visibleOwners.has(button.dataset.group))visibleOwners.set(button.dataset.group,new Set());
        visibleOwners.get(button.dataset.group).add(el);
        button.setAttribute('aria-label',`${prop} ${px}px ${info.tokens?.join(', ')||info.kind}`);
        button.onclick=e=>{e.stopPropagation();show({...info,prop,px,element:el,between},button);};bands.append(button);count++;
      };
      for(const el of document.body.querySelectorAll('*')){
        if(el===host||el.closest('script,style,svg,iframe')||!el.getClientRects().length)continue;
        const r=el.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
        const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='contents')continue;
        // Transforms and fragmented inline boxes cannot be measured as simple CSS boxes.
        if((cs.transform!=='none' && !/^matrix\(1, 0, 0, 1, [^,]+, [^)]+\)$/.test(cs.transform))||el.getClientRects().length>1)continue;
        const bt=parseFloat(cs.borderTopWidth)||0,br=parseFloat(cs.borderRightWidth)||0,bb=parseFloat(cs.borderBottomWidth)||0,bl=parseFloat(cs.borderLeftWidth)||0;
        for(const prop of properties.slice(0,8)){
          const px=parseFloat(cs.getPropertyValue(prop));if(!Number.isFinite(px)||px<=0)continue;
          const side=prop.split('-')[1],padding=prop.startsWith('padding');let rect;
          if(padding){const x=r.left+bl,y=r.top+bt,w=r.width-bl-br,h=r.height-bt-bb;rect=side==='top'?{x,y,w,h:px}:side==='bottom'?{x,y:y+h-px,w,h:px}:side==='left'?{x,y,w:px,h}:{x:x+w-px,y,w:px,h};}
          else {
            // Ordinary sibling margins are measurable when only one sibling owns the
            // space and the actual distance matches it. Keep ambiguous collapse hidden.
            if((side==='top'||side==='bottom')&&!/flex|grid/.test(getComputedStyle(el.parentElement).display)){
              const next=side==='bottom';
              let sibling=next?el.nextElementSibling:el.previousElementSibling;
              while(sibling && !sibling.getClientRects().length)sibling=next?sibling.nextElementSibling:sibling.previousElementSibling;
              if(!sibling)continue;
              const siblingStyle=getComputedStyle(sibling),other=sibling.getBoundingClientRect();
              const distance=next?other.top-r.bottom:r.top-other.bottom;
              const opposite=parseFloat(siblingStyle.getPropertyValue(next?'margin-top':'margin-bottom'))||0;
              if(cs.position==='absolute'||cs.position==='fixed'||cs.float!=='none'||siblingStyle.position==='absolute'||siblingStyle.position==='fixed'||siblingStyle.float!=='none'||Math.abs(opposite)>.1||Math.abs(distance-px)>.75||Math.min(r.right,other.right)<=Math.max(r.left,other.left))continue;
            }
            rect=side==='top'?{x:r.left,y:r.top-px,w:r.width,h:px}:side==='bottom'?{x:r.left,y:r.bottom,w:r.width,h:px}:side==='left'?{x:r.left-px,y:r.top,w:px,h:r.height}:{x:r.right,y:r.top,w:px,h:r.height};
          }
          add(el,prop,rect,px,cs);
        }
        if(/flex|grid/.test(cs.display)){
          const children=Array.from(el.children).filter(c=>{const s=getComputedStyle(c);return c.getClientRects().length&&s.position!=='absolute'&&s.position!=='fixed';}).map(c=>Object.assign(c.getBoundingClientRect(),{element:c}));
          for(const prop of ['row-gap','column-gap']){
            const px=parseFloat(cs.getPropertyValue(prop));if(!px)continue;
            const row=prop==='row-gap';const ordered=children.slice().sort((a,b)=>row?a.top-b.top:a.left-b.left);
            const seen=new Set();
            for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
              const a=ordered[i],b=ordered[j],distance=row?b.top-a.bottom:b.left-a.right;
              const from=row?Math.max(a.left,b.left):Math.max(a.top,b.top),to=row?Math.min(a.right,b.right):Math.min(a.bottom,b.bottom);
              if(to<=from||Math.abs(distance-px)>.75)continue;
              const rect=row?{x:from,y:a.bottom,w:to-from,h:px}:{x:a.right,y:from,w:px,h:to-from};
              const key=JSON.stringify(rect);if(seen.has(key))continue;seen.add(key);add(el,prop,rect,px,cs,[a.element,b.element]);
            }
          }
        }
      }
      root.querySelector('.count').textContent=count+' regions';
    }
    function schedule(){clearTimeout(timer);timer=setTimeout(render,160);}
    async function loadCatalog(){
      if(catalogStatus==='ready'||catalogStatus==='loading')return;
      catalogStatus='loading';
      try{
        const response=await fetch(registryURL);if(!response.ok)throw new Error('Registry unavailable');
        const registry=await response.json();
        catalog=[...(registry.components||[]),...(registry.compositions||[])].filter(entry=>entry.class);
        // Field is an explicitly documented part of Input, not a new registered component.
        const input=catalog.find(entry=>entry.class==='ds-input');
        if(input)catalog.push({...input,name:'Field (Input composition)',class:'ds-field'});
        catalogStatus='ready';
      }catch{catalogStatus='error';}
      render();
    }
    function matchesComponent(el){return catalog.filter(entry=>el.classList.contains(entry.class));}
    function componentChain(el){
      const chain=[];
      for(let node=el;node&&node!==document.body;node=node.parentElement){
        for(const entry of matchesComponent(node).reverse())chain.push({el:node,entry});
      }
      return chain;
    }
    function pickComponent(target,exact=false){
      if(!(target instanceof Element))return null;
      if(exact)return {el:target,entry:matchesComponent(target).at(-1)||null};
      const chain=componentChain(target);
      return chain[0]||{el:target,entry:null};
    }
    function drawComponent(item){
      const r=item.el.getBoundingClientRect();outline.hidden=false;
      outline.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      outline.replaceChildren();const name=document.createElement('span');name.className='component-name';
      const variant=window.wbComponentInspector?.variantName(item.el,item.entry);
      name.textContent=item.entry?item.entry.name+(variant?' · '+variant:''):'Page-owned · '+item.el.localName;outline.append(name);
      const box=name.getBoundingClientRect();const position=window.DSLabelPlacement?.place(r,box.width,box.height,innerWidth,innerHeight);
      if(position){name.style.left=position.left+'px';name.style.top=position.top+'px';}else name.hidden=true;
    }
    function closeComponent(){componentSelection=null;hovered=null;componentPanel.hidden=true;outline.hidden=true;}
    function inspectComponent(item){
      componentSelection=item;drawComponent(item);collect();componentPanel.replaceChildren();componentPanel.hidden=false;
      const {el,entry}=item;
      let contentTarget=componentPanel;
      const add=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;contentTarget.append(node);return node;};
      const path=elementPath(el),classes=Array.from(el.classList),cs=getComputedStyle(el);
      const label=(el.getAttribute('aria-label')||el.labels?.[0]?.textContent||el.querySelector('.ds-field-label')?.textContent||'').trim();
      const variants=entry?classes.filter(name=>name.startsWith(entry.class+'--')):[];
      const state=['disabled','checked','open'].filter(key=>el[key]===true);
      for(const key of ['aria-expanded','aria-selected','aria-checked','aria-disabled','aria-busy','data-state','data-size'])if(el.hasAttribute(key))state.push(key+'='+el.getAttribute(key));
      if(el===document.activeElement)state.push('focused');
      if(classes.some(name=>/loading/.test(name)))state.push('loading class');
      const local=[],shared=new Set();
      const matched=rules.filter(rule=>{try{return el.matches(rule.selector);}catch{return false;}});
      const textAudit=window.DSTypography?.create({rules,known,opaque,getStyle:getComputedStyle,specificity,split,compare,makeStyle:()=>document.createElement('span').style});
      const textParts=textAudit?textAudit.parts(el):[];
      for(const part of textParts){
        const owner=componentChain(part.element)[0]?.entry;
        const definition=owner?.anatomy?.parts?.find(def=>{try{return part.element.matches(def.selector);}catch{return false;}});
        part.name=(owner&&owner!==entry?owner.name+' / ':'')+(definition?.name||part.name);
      }
      const typography=textParts.flatMap(part=>part.rows.map(row=>({...row,part:part.name,declaration:row.raw||row.reason||'',tokens:row.tokens||[]})));
      matched.filter(rule=>rule.source.includes('/design-system/')).forEach(rule=>Array.from(rule.style).forEach(prop=>shared.add(prop)));
      for(const rule of matched.filter(rule=>!rule.source.includes('/design-system/'))){
        for(const prop of rule.style){
          if(shared.has(prop)||prop.startsWith('--'))local.push(`${prop}: ${rule.style.getPropertyValue(prop)||'(shorthand — '+rule.style.cssText+')'} · ${rule.selector} · ${rule.source}`);
        }
      }
      if(el.style.cssText)local.push('Inline: '+el.style.cssText);
      for(let parent=el.parentElement;parent&&parent!==document.documentElement;parent=parent.parentElement){
        const tokens=Array.from(parent.style).filter(prop=>prop.startsWith('--'));
        if(tokens.length)local.push('Ancestor token overrides at '+elementPath(parent)+': '+tokens.map(prop=>prop+': '+parent.style.getPropertyValue(prop)).join('; '));
      }
      const heading=add('div','');heading.className='panel-heading';
      const title=document.createElement('h3');title.textContent=entry?.name||'Page-owned UI';heading.append(title);
      const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close component panel');close.onclick=closeComponent;heading.append(close);
      add('p',(label||el.textContent.trim().replace(/\s+/g,' ').slice(0,70)||el.localName)+(variants.length?' · '+variants.map(v=>v.slice(entry.class.length+2)).join(', '):'')).className='panel-caption';
      const actions=add('div','');actions.className='panel-actions';
      if(entry){
        const link=document.createElement('a');link.textContent='View in design system ↗';
        const target=new URL(workbenchURL,location.href);target.hash='components/'+encodeURIComponent(entry.id);
        link.href=target.href;link.target='_blank';link.rel='noopener';actions.append(link);
      }
      const copyActions=add('div','');copyActions.className='panel-actions';
      if(entry?.preview){
        const preview=add('details','');preview.className='panel-preview';preview.open=true;componentPanel.insertBefore(preview,actions);
        const summary=document.createElement('summary');summary.textContent='Registered preview';preview.append(summary);
        const frame=document.createElement('iframe');frame.title=entry.name+' registered preview';
        frame.height=Math.min(Math.max(entry.previewHeight||320,320),600);
        frame.addEventListener('load',()=>{
          const fit=()=>{try{const doc=frame.contentDocument;if(!doc?.body)return;frame.style.height='1px';frame.style.height=Math.min(Math.max(doc.documentElement.scrollHeight,doc.body.scrollHeight,160),600)+'px';}catch{/* Cross-origin previews retain their registered height and native scrolling. */}};
          fit();frame.contentDocument?.fonts?.ready.then(fit);
        });
        frame.src=new URL(entry.preview,sourceBase).href;preview.append(frame);
      }
      const unresolved=typography.filter(row=>row.kind==='unknown').length;
      const literals=typography.filter(row=>row.kind==='hard').length;
      const statusBox=add('details','');statusBox.className='type-verdict';const status=document.createElement('summary');statusBox.append(status);
      if(!entry)status.textContent='Not registered in the design system';
      else if(!textAudit)status.textContent='Typography check unavailable';
      else if(unresolved||literals)status.textContent='Typography: '+[unresolved?unresolved+' unresolved':null,literals?literals+' literal values':null].filter(Boolean).join(' · ');
      else {status.textContent=textParts.length?'Typography: no issues detected':'Registered component · no text to check';statusBox.classList.add('is-clear');}
      contentTarget=statusBox;
      const names=window.DSTypography?.names||{};
      for(const part of textParts){
        add('h4',part.name);
        const table=add('table','');table.className='type-table';table.setAttribute('aria-label','Typography: '+part.name);
        const head=document.createElement('thead');head.innerHTML='<tr><th>Property</th><th>Value</th><th>Status</th></tr>';table.append(head);
        const body=document.createElement('tbody');table.append(body);
        for(const item of part.rows){
          const row=document.createElement('tr');
          for(const text of [names[item.prop],item.resolved]){const cell=document.createElement('td');cell.textContent=text;cell.title=text;row.append(cell);}
          const cell=document.createElement('td'),badge=document.createElement('span');badge.className='type-status '+item.kind;
          badge.textContent={token:'Tokenized',hard:'Literal',default:'Browser default',unknown:'Unable to trace'}[item.kind];
          cell.append(badge);if(item.inherited){const note=document.createElement('small');note.textContent=' · inherited';cell.append(note);}
          cell.title=[item.raw,item.tokens?.join(', '),item.selector,item.source,item.reason].filter(Boolean).join(' · ');
          row.append(cell);body.append(row);
        }
      }
      const typeDetails=add('details','');const typeSummary=document.createElement('summary');typeSummary.textContent='Typography source details';typeDetails.append(typeSummary);
      typography.forEach(item=>{const p=document.createElement('p');p.textContent=`${item.part} / ${item.prop}: ${item.resolved} ← ${item.declaration}${item.tokens.length?' · token '+item.tokens.join(', '):''}${item.selector?' · '+item.selector+' · '+item.source:''}${item.inherited?' · inherited':''}`;typeDetails.append(p);});
      contentTarget=componentPanel;
      const diagnostics=add('details','');const diagnosticSummary=document.createElement('summary');diagnosticSummary.textContent='Token and source details';diagnostics.append(diagnosticSummary);
      contentTarget=diagnostics;
      add('p','Typography source tracing only. Page override candidates are not confirmed issues.');
      add('p',path);add('p','State: '+(state.join(', ')||'default'));
      add('p','Container: radius '+cs.borderRadius+'; padding '+cs.padding+'; gap '+cs.gap);
      const chain=componentChain(el).reverse();
      add('p','Containing components');
      chain.forEach(parent=>{const button=add('button',parent.entry.name);button.onclick=()=>inspectComponent(parent);});
      if(entry){
        for(const source of [entry.css,entry.module].filter(Boolean)){
          const link=add('a',source);link.href=new URL(source,sourceBase).href;link.target='_blank';link.rel='noopener';
        }
        
      }
      const details=add('details','');const summary=document.createElement('summary');summary.textContent='Local override candidates ('+local.length+')';details.append(summary);
      const note=document.createElement('p');note.textContent='Matching page declarations can override shared styles. These are candidates, not proven cascade winners; inherited and complex rules may be incomplete.';details.append(note);
      local.forEach(text=>{const p=document.createElement('p');p.textContent=text;details.append(p);});
      const url=new URL(location.href);url.searchParams.delete('ds');
      const context=[
        'Component adjustment context', 'Page: '+document.title+' — '+url.href,
        'Component: '+(entry?.name||'Page-owned UI'), 'Element: '+path,'Label: '+label,'Classes: '+classes.join(' '),
        'Hierarchy: '+chain.map(x=>x.entry.name).join(' → '),'Variants: '+(variants.join(' ')||'default'),
        'State: '+(state.join(', ')||'default'),'Source: '+[entry?.css,entry?.module].filter(Boolean).join(', '),
        'Typography ownership:\n'+typography.map(item=>`${item.part} / ${item.prop}: ${item.resolved} ← ${item.declaration}${item.tokens.length?' · token '+item.tokens.join(', '):''}${item.selector?' · '+item.selector+' · '+item.source:''}`).join('\n'),
        'Viewport: '+innerWidth+' × '+innerHeight,'Local override candidates:\n'+(local.join('\n')||'None detected'),
        'Evaluate shared component, variant or instance scope before changing. Candidate overrides are not verified cascade winners.'
      ].join('\n');
      const copy=(label,value)=>{const button=document.createElement('button');button.textContent=label;copyActions.append(button);button.onclick=async()=>{try{await navigator.clipboard.writeText(value);copyNotice('Copied '+label.replace(/^Copy\s+/i,''));}catch{copyNotice('Could not copy '+label.replace(/^Copy\s+/i,''));}};};
      const concise=['Component reference','Page: '+document.title+' — '+url.href,
        'Component: '+(entry?entry.name+' ('+entry.id+')':'Page-owned UI'),
        'Element: '+path,classes.length?'Classes: '+classes.join(' '):'',
        label?'Label: '+label.slice(0,120):'',
        'Variant/state: '+(variants.join(' ')||'default')+' / '+(state.join(', ')||'default'),
        entry?'Source: '+[entry.css,entry.module].filter(Boolean).join(', '):'',
        'Viewport: '+innerWidth+' × '+innerHeight+'; theme: '+(document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'default')].filter(Boolean).join('\n');
      if(entry)copy('Copy component',['Component: '+entry.name+' ('+entry.id+')','Class: .'+entry.class,'Source: '+[entry.css,entry.module].filter(Boolean).join(', '),'Page: '+url.href].join('\n'));
      copy('Copy instance context',concise);copy('Copy detailed context',context);
      const detailedButton=copyActions.lastElementChild;diagnostics.append(detailedButton);
    }
    root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
      mode=button.dataset.mode;dismiss();closeComponent();bands.replaceChildren();
      root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
      root.querySelectorAll('label').forEach(label=>label.hidden=mode==='components');
      if(mode==='components')loadCatalog();render();
    });
    const shortcuts = {s: 'spacing', c: 'components'};
    for (const [key, mode] of Object.entries(shortcuts)) {
      const button = root.querySelector(`[data-mode="${mode}"]`);
      button.textContent = `${mode === 'spacing' ? 'Spacing' : 'Components'} · ${key.toUpperCase()}`;
      button.setAttribute('aria-keyshortcuts', key.toUpperCase());
      button.title = `Switch to ${mode} (${key.toUpperCase()})`;
    }
    document.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.composedPath().some(node => node instanceof Element &&
        (node.matches('input, textarea, select, [role="textbox"]') || node.isContentEditable))) return;
      const mode = shortcuts[event.key.toLowerCase()];
      if (!mode) return;
      event.preventDefault();
      root.querySelector(`[data-mode="${mode}"]`).click();
    });
    let lastComponentTarget=null;
    document.addEventListener('pointermove',event=>{
      if(event.composedPath().includes(host)){lastComponentTarget=null;return;}
      lastComponentTarget=event.target;
      if(mode!=='components'||!enabled||catalogStatus!=='ready')return;
      const exact=event.ctrlKey||event.metaKey;
      if(componentSelection&&!exact)return;
      hovered=pickComponent(event.target,exact);if(hovered)drawComponent(hovered);
    },true);
    document.addEventListener('click',event=>{
      if(mode!=='components'||!enabled||event.composedPath().includes(host)||catalogStatus!=='ready')return;
      event.preventDefault();event.stopImmediatePropagation();
      const item=pickComponent(event.target,event.ctrlKey||event.metaKey);if(item)inspectComponent(item);
    },true);
    function refreshModifierTarget(event){
      if(!['Control','Meta'].includes(event.key)||mode!=='components'||!enabled||catalogStatus!=='ready')return;
      if(event.composedPath().some(node=>node instanceof Element&&(node.matches('input,textarea,select')||node.isContentEditable)))return;
      const exact=event.ctrlKey||event.metaKey;
      if(!exact&&componentSelection){drawComponent(componentSelection);return;}
      if(lastComponentTarget?.isConnected){hovered=pickComponent(lastComponentTarget,exact);if(hovered)drawComponent(hovered);}
    }
    document.addEventListener('keydown',refreshModifierTarget,true);
    document.addEventListener('keyup',refreshModifierTarget,true);
    document.addEventListener('pointerdown',event=>{
      if(mode==='components'&&enabled&&!event.composedPath().includes(host)&&catalogStatus==='ready'){
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
    function toggleHighlights(){
      enabled=!enabled;
      root.querySelector('[data-toggle]').textContent=enabled?'Pause · H':'Resume · H';
      dismiss();closeComponent();bands.replaceChildren();
      root.querySelector('.count').textContent=enabled?'':'Paused';
      if(enabled)render();
    }
    root.querySelector('[data-toggle]').onclick=toggleHighlights;
    root.querySelectorAll('input').forEach(input=>input.onchange=()=>{filters[input.dataset.kind]=input.checked;render();});
    document.addEventListener('pointerdown',event=>{if(!event.composedPath().includes(host))dismiss();},true);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){dismiss();closeComponent();}
      if(event.key.toLowerCase()!=='h'||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.defaultPrevented)return;
      const typing=event.composedPath().some(node=>node instanceof Element && (node.matches('input,textarea,select,[role="textbox"],[role="combobox"]')||node.isContentEditable));
      if(typing)return;
      event.preventDefault();toggleHighlights();
    });
    addEventListener('resize',schedule);document.addEventListener('scroll',()=>{dismiss();bands.replaceChildren();schedule();},true);
    new MutationObserver(records=>{if(records.some(r=>r.target!==host&&!host.contains(r.target)))schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open']});
    new MutationObserver(schedule).observe(document.head,{subtree:true,childList:true,attributes:true});
    document.addEventListener('animationend',schedule,true);
    document.addEventListener('transitionend',schedule,true);
    document.fonts?.ready.then(schedule);render();
  };
  const helperURL=new URL('typography-trace.js',document.currentScript.src).href;
  const placementURL=new URL('label-placement.js',document.currentScript.src).href;
  const variantURL=new URL('workbench/component-inspector.js',document.currentScript.src).href;
  const launch=()=>{if(!window.wbComponentInspector){const script=document.createElement('script');script.src=variantURL;script.onload=launch;script.onerror=()=>console.error('Inspector variant resolver unavailable');document.head.append(script);return;}if(!window.DSLabelPlacement){const script=document.createElement('script');script.src=placementURL;script.onload=launch;script.onerror=()=>console.error('Inspector label placement unavailable');document.head.append(script);return;}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();};
  if(window.DSTypography)launch();else {
    const helper=document.createElement('script');helper.src=helperURL;helper.onload=launch;
    helper.onerror=()=>{console.error('Typography tracing unavailable');launch();};document.head.append(helper);
  }
})();
