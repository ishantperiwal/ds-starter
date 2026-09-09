/* Read-only typography provenance. Does not edit or probe the live DOM cascade. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DSTypography=api;})(globalThis,()=>{
 const properties=['font-family','font-size','font-weight','line-height','letter-spacing','color'];
 const names={'font-family':'Font','font-size':'Size','font-weight':'Weight','line-height':'Line height','letter-spacing':'Letter spacing',color:'Color'};
 function resolveVars(value,cs,seen=new Set()){
  let tokens=[],fallback=false,error=false;
  function resolve(text,stack){
   return scan(text,stack);
  }
  function scan(text,stack){
   let out='',i=0;
   while(i<text.length){
    const start=text.indexOf('var(',i);if(start<0){out+=text.slice(i);break;}
    out+=text.slice(i,start);let depth=1,j=start+4,comma=-1;
    for(;j<text.length&&depth;j++){if(text[j]==='(')depth++;else if(text[j]===')')depth--;else if(text[j]===','&&depth===1&&comma<0)comma=j;}
    if(depth){error=true;return text;}
    const token=text.slice(start+4,comma<0?j-1:comma).trim(),raw=cs.getPropertyValue(token).trim();
    if(stack.has(token)){error=true;return text;}
    if(raw){tokens.push(token);out+=scan(raw,new Set([...stack,token]));}
    else if(comma>=0){fallback=true;out+=scan(text.slice(comma+1,j-1),stack);}
    else {error=true;out+='';}
    i=j;
   }
   return out;
  }
  return {value:resolve(value,seen),tokens:[...new Set(tokens)],fallback,error};
 }
 function create(env){
  const {rules,known,opaque,getStyle,specificity,split,compare,makeStyle}=env;
  function declarations(style,prop,cs){
   const list=[];
   // Iterate CSSOM declaration order: same-rule shorthand/longhand order matters.
   for(const entry of (style.cssText.match(/(?:[^;()'"]|\([^)]*\)|"[^"]*"|'[^']*')+/g)||[])){
    const name=entry.slice(0,entry.indexOf(':')).trim();
    if(name!==prop&&name!=='all'&&!(name==='font'&&prop!=='color'&&prop!=='letter-spacing'))continue;
    const raw=style.getPropertyValue(name),important=style.getPropertyPriority(name)==='important';
    if(!raw)continue;
    let resolved=resolveVars(raw,cs),value=resolved.value,tokens=resolved.tokens;
    if(name==='font'&&!/^(inherit|initial|unset|revert|revert-layer)$/.test(value)){
     const scratch=makeStyle();scratch.setProperty('font',value);
     value=scratch.getPropertyValue(prop);
     if(!value){list.push({value:raw,raw,tokens:[],important,uncertain:true,reason:'Font shorthand could not be expanded'});continue;}
     // A token in a shorthand must influence THIS longhand, not merely another part.
     tokens=tokens.filter(token=>{
      const original=cs.getPropertyValue(token).trim();
      return ['900','99px','monospace','italic 900 99px/3 monospace'].some(alternate=>{
       const altered=resolveVars(raw,{getPropertyValue:t=>t===token?alternate:cs.getPropertyValue(t)});
       const probe=makeStyle();probe.setProperty('font',altered.value);
       const next=probe.getPropertyValue(prop);return next&&next!==value&&original!==alternate;
      });
     });
    }
    list.push({value,raw,tokens,important,uncertain:resolved.error,reason:resolved.error?'Unresolved custom property':resolved.fallback?'Literal fallback used where a custom property was unavailable':'',declaration:name});
   }
   return list;
  }
  function trace(el,prop,visited=new Set()){
   const cs=getStyle(el),computed=cs.getPropertyValue(prop);
   const unknown=reason=>({kind:'unknown',resolved:computed,tokens:[],reason});
   if(visited.has(el))return unknown('Inheritance cycle');visited.add(el);
   if(opaque)return unknown('A stylesheet is inaccessible; winning declaration cannot be proven');
   if(el.getAnimations?.().some(animation=>animation.playState==='running') || (cs.animationName&&cs.animationName!=='none'))return unknown('Animated styles require a separate cascade trace');
   let candidates=[],uncertain=false;
   rules.forEach((r,order)=>{
    const found=declarations(r.style,prop,cs);if(!found.length)return;
    let best=null,matched=false;
    for(const selector of split(r.selector))try{if(el.matches(selector.trim())){matched=true;const score=selector.includes('\\')?null:specificity(selector.replace(/\[[^\]]*\]/g,'[attribute]'));if(!score)uncertain=true;else if(!best||compare(score,best)>0)best=score;}}catch{uncertain=true;}
    if(!matched)return;if(r.uncertain)uncertain=true;
    found.forEach((d,index)=>candidates.push({...d,order,index,specificity:best||[0,0,0,0],source:r.source,selector:r.selector}));
   });
   declarations(el.style,prop,cs).forEach((d,index)=>candidates.push({...d,order:rules.length,index,specificity:[1,0,0,0],source:'Inline style',selector:el.localName}));
   candidates.sort((a,b)=>Number(a.important)-Number(b.important)||compare(a.specificity,b.specificity)||a.order-b.order||a.index-b.index);
   const winner=candidates.at(-1);
   if(uncertain)return unknown('Matching complex selector, cascade layer or scope cannot be ranked reliably');
   const inherit=()=>{
    if(!el.parentElement)return {kind:'default',resolved:computed,tokens:[],reason:'No author declaration; browser default'};
    // Native controls and special HTML elements can have their own UA typography.
    const parent=trace(el.parentElement,prop,visited);
    if(/^(button|input|textarea|select|h[1-6]|b|strong|i|em|small|big|code|pre|a|th)$/.test(el.localName)&&!winner){
     if(parent.kind==='default')return {kind:'default',resolved:computed,tokens:[],reason:'Browser-controlled property; no author declaration on this element or its ancestors'};
     return unknown('Browser-specific styling may override the ancestor declaration');
    }
    if(!winner&&prop==='font-size'&&parent.resolved!==computed)return unknown('Computed size differs from inherited value');
    return {...parent,resolved:computed,inherited:true,inheritedFrom:parent.inheritedFrom||el.parentElement.localName};
   };
   if(!winner||winner.value==='inherit'||winner.value==='unset')return inherit();
   if(winner.value==='initial')return {...winner,kind:'default',resolved:computed,reason:'Explicit initial value'};
   if(winner.uncertain||/\b(revert|revert-layer|env)\b/.test(winner.value))return {...winner,kind:'unknown',resolved:computed,reason:winner.reason||'Cascade rollback or environment-dependent value'};
   if(winner.tokens.length&&winner.tokens.some(t=>!known.has(t)))return {...winner,kind:'unknown',resolved:computed,reason:'Custom property is not declared in the indexed design system'};
   return {...winner,kind:winner.tokens.length?'token':'hard',resolved:computed};
  }
  function parts(el){
   return [el,...el.querySelectorAll('*')].filter(node=>{
    const cs=getStyle(node);if(!node.getClientRects().length||cs.visibility==='hidden')return false;
    return node.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]')||[...node.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   }).map(node=>({element:node,name:node.getAttribute('data-typography-part')||node.classList[0]||node.getAttribute('aria-label')||node.localName,rows:properties.map(prop=>({prop,...trace(node,prop)}))}));
  }
  return {trace,parts};
 }
 return {create,resolveVars,properties,names};
});
