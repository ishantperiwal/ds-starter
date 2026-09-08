/* Opt-in CRM spacing inspection. No DOM/style work without ?ds=true.
   Intentionally conservative: unsupported cascade/geometry is unknown, not hardcoded. */
(() => {
  'use strict';
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
      .tip{position:fixed;width:max-content;max-width:min(380px,calc(100vw - 24px));overflow-wrap:anywhere}
      .tip p{margin:0 0 7px}.tip code{white-space:normal}.tip button{margin-right:6px}.tip[hidden]{display:none}
      .swatch{display:inline-block;width:10px;height:10px;background:#ffc96b;margin-right:4px}.swatch.red{background:#efaaaa}.swatch.gray{background:#aeb3ba}
      .component-outline{position:fixed;border:2px solid #246bff;background:#246bff08;pointer-events:none}
      .component-name{position:absolute;top:0;left:0;background:#246bff;color:white;padding:3px 7px;white-space:nowrap}
      .component-panel{right:16px;top:16px;max-height:calc(100vh - 110px);overflow:auto;width:380px}
      .component-panel button,.component-panel a{margin:3px}.component-panel a{color:#185ac5;display:inline-block}
      .component-panel summary{cursor:pointer;margin:8px 0}.component-panel h3{margin:0 0 8px}
      .type-verdict{padding:10px;border-radius:7px;background:#fff3dc;margin:12px 0 6px;font-weight:650}
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
      try{await navigator.clipboard.writeText(prompt);copyChanges.textContent='Copied changes';}catch{copyChanges.textContent='Copy unavailable';}
    };
    resetChanges.onclick=()=>{
      for(const edit of Array.from(edits.values()).reverse())edit.style.cssText=edit.before;
      edits.clear();updatePending();dismiss();render();
    };
    function spacingEditor(item){
      const owning=owner(item),box=document.createElement('div');box.style.cssText='margin:12px 0;display:grid;gap:8px';
      const scope=document.createElement('select');scope.setAttribute('aria-label','Spacing change scope');
      scope.add(new Option('This instance only','instance'));
      if(owning){scope.add(new Option(owning.property.startsWith('--')?'Shared token owner (all consumers)':'Same CSS rule and property','owner'));scope.value='owner';}
      const scale=document.createElement('select');scale.setAttribute('aria-label','New spacing value');
      scale.add(new Option('Choose spacing…',''));
      for(const name of [...known].filter(t=>/^--space-/.test(t))){
        const value=getComputedStyle(item.element).getPropertyValue(name).trim();
        if(value)scale.add(new Option(value+' · '+name,'var('+name+')'));
      }
      const status=document.createElement('p');
      status.textContent=owning?'Owner: '+owning.selector+' · '+owning.source:'Owner unresolved or compound value: only an explicit instance override is available.';
      const toggle=document.createElement('div');toggle.setAttribute('role','group');toggle.setAttribute('aria-label','Spacing scope');
      const sharedButton=document.createElement('button'),localButton=document.createElement('button');
      sharedButton.textContent='Shared';localButton.textContent='Local';sharedButton.disabled=!owning;
      sharedButton.title=owning?'Change this shared owner':'Shared ownership could not be resolved';
      toggle.append(sharedButton,localButton);
      const stepper=document.createElement('div');stepper.style.cssText='display:flex;align-items:center;gap:12px';
      const less=document.createElement('button'),more=document.createElement('button'),valueLabel=document.createElement('output');
      less.textContent='−';more.textContent='+';less.setAttribute('aria-label','Less spacing');more.setAttribute('aria-label','More spacing');
      valueLabel.setAttribute('aria-live','polite');valueLabel.style.cssText='flex:1;text-align:center';
      stepper.append(less,valueLabel,more);
      const steps=Array.from(scale.options).slice(1).map(option=>({value:option.value,px:parseFloat(option.textContent),label:option.textContent})).filter(step=>Number.isFinite(step.px)).sort((a,b)=>a.px-b.px);
      let current=parseFloat(getComputedStyle(item.element).getPropertyValue(item.prop))||item.px,busy=false;
      function syncControls(){
        sharedButton.setAttribute('aria-pressed',String(scope.value==='owner'));localButton.setAttribute('aria-pressed',String(scope.value==='instance'));
        for(const button of [sharedButton,localButton])button.style.background=button.getAttribute('aria-pressed')==='true'?'#e7efff':'';
        valueLabel.textContent=current+'px';
        less.disabled=busy||!steps.some(step=>step.px<current);more.disabled=busy||!steps.some(step=>step.px>current);
      }
      function chooseScope(value){
        scope.value=value;
        current=parseFloat(getComputedStyle(item.element).getPropertyValue(item.prop))||0;
        status.textContent=value==='owner'?'Shared: all consumers of this owner. Existing local overrides remain.':'Local: only this element. Previous previews remain in the changes list.';
        syncControls();
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
        const edit=previous||{style,property,before:style.cssText,original:style.getPropertyValue(property),context:contextText(item),scope:shared?'Shared owner; other pages using this source may also change':'This instance only',label:shared?property+' at '+target.selector+' · '+target.source:elementPath(item.element)+' · '+property};
        edit.next=scale.value;edit.count=count;edits.set(key,edit);
        style.setProperty(property,scale.value,shared?style.getPropertyPriority(property):'important');
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
      box.append(toggle,stepper,status);tip.append(box);
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
      const line=text=>{const p=document.createElement('p');p.textContent=text;tip.append(p);};
      line(`${item.prop}: ${item.px}px · ${item.kind==='token'?'Design-system token':item.kind==='hard'?'Hardcoded spacing':'Unresolved ownership'}`);
      line(item.tokens?.length?item.tokens.join(', '):item.value);
      line(`${item.selector||''} · ${item.source}`);
      if(item.declaration)line(`${item.declaration}: ${item.value}`);
      if(item.kind==='unknown')line('Cascade, token alias or browser-default ownership could not be proven.');
      if(item.kind==='hard')line('Page-specific spacing can be intentional.');
      spacingEditor(item);
      if(item.tokens?.length){
        const variable=document.createElement('button');
        variable.textContent=item.tokens.length===1?'Copy variable':'Copy variables';
        variable.onclick=async()=>{try{await navigator.clipboard.writeText(item.tokens.join('\n'));variable.textContent='Copied';}catch{variable.textContent='Copy unavailable';}};
        tip.append(variable);
      }
      const copy=document.createElement('button');copy.textContent='Copy spacing context';
      copy.onclick=async()=>{try{await navigator.clipboard.writeText(contextText(item));copy.textContent='Copied';}catch{copy.textContent='Copy unavailable';}};tip.append(copy);
      const close=document.createElement('button');close.textContent='Close';close.onclick=dismiss;tip.append(close);
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
    function contextText(item) {
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
        const response=await fetch('/design-system/registry.json');if(!response.ok)throw new Error('Registry unavailable');
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
      name.textContent=item.entry?.name||'Page-owned · '+item.el.localName;outline.append(name);
      if(r.top>28)name.style.top='-25px';
    }
    function closeComponent(){componentSelection=null;hovered=null;componentPanel.hidden=true;outline.hidden=true;}
    function inspectComponent(item){
      componentSelection=item;drawComponent(item);collect();componentPanel.replaceChildren();componentPanel.hidden=false;
      const {el,entry}=item;
      const add=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;componentPanel.append(node);return node;};
      const path=elementPath(el),classes=Array.from(el.classList),cs=getComputedStyle(el);
      const label=(el.getAttribute('aria-label')||el.labels?.[0]?.textContent||el.querySelector('.ds-field-label')?.textContent||'').trim();
      const variants=entry?classes.filter(name=>name.startsWith(entry.class+'--')):[];
      const state=['disabled','checked','open'].filter(key=>el[key]===true);
      for(const key of ['aria-expanded','aria-selected','aria-checked','aria-disabled','aria-busy','data-state','data-size'])if(el.hasAttribute(key))state.push(key+'='+el.getAttribute(key));
      if(el===document.activeElement)state.push('focused');
      if(classes.some(name=>/loading/.test(name)))state.push('loading class');
      const local=[],shared=new Set();
      const matched=rules.filter(rule=>{try{return el.matches(rule.selector);}catch{return false;}});
      const typographyProps=['font-family','font-size','font-weight','line-height','letter-spacing','color'];
      const typography=typographyProps.map(prop=>{
        const result=trace(el,prop,cs);
        return {prop,resolved:cs.getPropertyValue(prop),declaration:result.value,tokens:result.tokens||[],selector:result.selector||'',source:result.source||'',kind:result.kind};
      });
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
      add('h3',entry?.name||'Page-owned UI');
      add('p',entry?'Shared class: .'+entry.class:'No registered component matches this element. Use the hierarchy to inspect a containing component.');
      if(label)add('p','Label: '+label);
      add('p',path);add('p','Variant classes: '+(variants.join(' ')||'default / none'));
      add('p','State: '+(state.join(', ')||'default'));
      add('p','Resolved: font '+cs.fontSize+'; radius '+cs.borderRadius+'; padding '+cs.padding+'; gap '+cs.gap);
      const counts={token:0,hard:0,unknown:0};typography.forEach(item=>counts[item.kind]++);
      const verdict=counts.token===typography.length?'Typography: fully tokenized':counts.token?'Typography: partly tokenized':counts.hard?'Typography: no DS tokens detected':'Typography: ownership unresolved';
      add('div',verdict).className='type-verdict';
      add('p',`${counts.token} tokenized · ${counts.hard} hardcoded · ${counts.unknown} unresolved`);
      const table=add('table','');table.className='type-table';table.setAttribute('aria-label','Typography token status');
      const head=document.createElement('thead');head.innerHTML='<tr><th>Property</th><th>Value</th><th>Status</th></tr>';table.append(head);
      const body=document.createElement('tbody');table.append(body);
      const names={'font-family':'Font','font-size':'Size','font-weight':'Weight','line-height':'Line height','letter-spacing':'Letter spacing',color:'Color'};
      typography.forEach(item=>{
        const row=document.createElement('tr');
        for(const text of [names[item.prop],item.resolved]){const cell=document.createElement('td');cell.textContent=text;cell.title=text;row.append(cell);}
        const cell=document.createElement('td'),badge=document.createElement('span');badge.className='type-status '+item.kind;
        badge.textContent={token:'Tokenized',hard:'Hardcoded',unknown:'Unresolved'}[item.kind];cell.append(badge);row.append(cell);body.append(row);
      });
      if(counts.unknown)add('p','Unresolved includes inherited values. It does not mean hardcoded.');
      const typeDetails=add('details','');const typeSummary=document.createElement('summary');typeSummary.textContent='Typography source details';typeDetails.append(typeSummary);
      typography.forEach(item=>{const p= document.createElement('p');p.textContent=`${item.prop}: ${item.resolved} ← ${item.declaration}${item.tokens.length?' · token '+item.tokens.join(', '):''}${item.selector?' · '+item.selector+' · '+item.source:''}`;typeDetails.append(p);});
      const chain=componentChain(el).reverse();
      add('p','Containing components');
      chain.forEach(parent=>{const button=add('button',parent.entry.name);button.onclick=()=>inspectComponent(parent);});
      if(entry){
        for(const source of [entry.css,entry.module].filter(Boolean)){
          const link=add('a',source);link.href=new URL(source,location.origin+'/design-system/').href;link.target='_blank';link.rel='noopener';
        }
        const link=add('a','Open workbench');link.href='/design-system/#components';link.target='_blank';link.rel='noopener';
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
        'Typography ownership:\n'+typography.map(item=>`${item.prop}: ${item.resolved} ← ${item.declaration}${item.tokens.length?' · token '+item.tokens.join(', '):''}${item.selector?' · '+item.selector+' · '+item.source:''}`).join('\n'),
        'Viewport: '+innerWidth+' × '+innerHeight,'Local override candidates:\n'+(local.join('\n')||'None detected'),
        'Evaluate shared component, variant or instance scope before changing. Candidate overrides are not verified cascade winners.'
      ].join('\n');
      const copy=(label,value)=>{const button=add('button',label);button.onclick=async()=>{try{await navigator.clipboard.writeText(value);button.textContent='Copied';}catch{button.textContent='Copy unavailable';}};};
      if(entry)copy('Copy component',entry.name+' (.'+entry.class+')');copy('Copy instance context',context);
      add('button','Close').onclick=closeComponent;
    }
    root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
      mode=button.dataset.mode;dismiss();closeComponent();bands.replaceChildren();
      root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
      root.querySelectorAll('label').forEach(label=>label.hidden=mode==='components');
      if(mode==='components')loadCatalog();render();
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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
