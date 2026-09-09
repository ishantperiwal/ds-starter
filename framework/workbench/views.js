(function(root,factory){
  const model=typeof module==='object'&&module.exports?require('./model'):root.StudioModel;
  const api=factory(model);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioViews=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=[
    ['overview','Overview','list'],['foundations','Foundations','tag'],['icons','Iconography','shapes'],
    ['components','Components','box'],['patterns','Layouts & patterns','layout'],['visualizations','Data viz','chart'],
    ['directions','Directions','flask'],['moodboard','Mood board','grid']
  ];
  // Icons belong to the studio UI, independently of an app's icon provider.
  const paths={
    list:'M8 6h12M8 12h12M8 18h12M3 6h1M3 12h1M3 18h1',
    tag:'M3 3h8l10 10-8 8L3 11Z M7 7h.01',
    shapes:'M3 3h7v7H3ZM17 3l4 7h-8ZM7 15a4 4 0 1 0 0 8 4 4 0 0 0 0-8M15 15h6v6h-6Z',
    box:'M4 5h16v16H4ZM8 5V3h8v2M8 11h8M12 8v6',
    layout:'M3 4h18v16H3ZM3 9h18M9 9v11',
    chart:'M3 3v18h18M6 15l5-5 4 3 5-7',
    flask:'M9 3h6M10 3v7l-6 10h16l-6-10V3M8 14h8',
    grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'
  };
  const icon=name=>'<svg class="wb-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
  function navigation(catalog,tokens,current){
    const counts=M.counts(catalog,tokens);
    return tabs.filter(([key])=>!catalog.presentation?.hiddenSections?.includes(key)).map(([key,label,glyph])=>'<a href="#'+key+'"'+(key===current?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'</span><i'+(key==='icons'?' title="Registered icon providers"':'')+'>'+(counts[key]===null?'':counts[key])+'</i></a>').join('');
  }
  const empty=(title,note='')=>'<div class="wb-empty"><h2>'+esc(title)+'</h2>'+(note?'<p>'+esc(note)+'</p>':'')+'</div>';
  function source(file,state){
    const url=new URL(file,state.base);
    if(url.origin!==new URL(state.base).origin || !/^https?:$/.test(url.protocol))throw Error('Sources must be same-origin');
    return url.href;
  }
  function frame(entry,state,size=''){
    const height=Number.isFinite(entry.previewHeight)?Math.max(160,Math.min(800,entry.previewHeight)):null;
    return '<iframe class="wb-preview '+size+'"'+(height?' style="height:'+height+'px"':'')+(entry.previewAutoHeight?' data-auto-height="true"':'')+' loading="lazy" title="'+esc(entry.name)+' — live preview" src="'+esc(M.previewURL(entry,state.base,state.theme))+'"></iframe>';
  }
  const componentTools=()=>'<div class="cg-view-toggle" role="group" aria-label="Component view"><button type="button" data-preview-mode="preview" aria-pressed="true">Preview</button><button type="button" data-preview-mode="spacing" aria-pressed="false">Spacing</button><button type="button" data-preview-mode="component" aria-pressed="false">Component</button></div>';
  const widthTools=()=>'<div class="wb-width-tools" role="group" aria-label="Preview width"><span>Preview</span><button type="button" data-width="100%" aria-pressed="true">Fluid</button><button type="button" data-width="320px" aria-pressed="false">320px</button></div>';
  const list=value=>Array.isArray(value)?'<ul>'+value.map(item=>'<li>'+esc(typeof item==='string'?item:JSON.stringify(item))+'</li>').join('')+'</ul>':'<p>'+esc(value)+'</p>';
  function detail(label,value){return value && (!Array.isArray(value)||value.length)?'<section><h3>'+esc(label)+'</h3>'+list(value)+'</section>':'';}
  function contract(entry){
    return '<details class="wb-contract"><summary>Contract &amp; anatomy</summary><div class="wb-contract-body">'+
      '<div class="wb-contract-grid">'+detail('States',entry.states)+detail('Spacing ownership',entry.anatomy?.ownership)+detail('Behavior',entry.anatomy?.behavior)+
      detail('Parts',entry.anatomy?.parts?.map(part=>part.name+' · '+part.selector))+'</div>'+
      (entry.anatomy?.spacing?.length?'<div class="wb-table-wrap"><table><caption>Spacing relationships</caption><thead><tr><th>Relationship</th><th>Owner token</th><th>Property</th></tr></thead><tbody>'+
        entry.anatomy.spacing.map(row=>'<tr><td>'+esc(row.label)+'</td><td><code>'+esc(row.token)+'</code></td><td><code>'+esc(row.property)+'</code></td></tr>').join('')+'</tbody></table></div>':'')+
      '<details><summary>Registry source</summary><pre>'+esc(JSON.stringify(entry,null,2))+'</pre></details></div></details>';
  }
  function specimen(entry,state,kind='component'){
    const heading='<header class="wb-spec-head"><div><h2>'+esc(entry.name)+'</h2>'+((entry.usage||entry.summary)?'<p class="wb-description">'+esc(entry.usage||entry.summary)+'</p>':'')+'</div></header>';
    const visual='<div class="wb-spec-body">'+(kind==='component'?componentTools():kind==='screen'?'<div class="wb-screen-tools">'+widthTools()+'<a class="wb-screen-open" href="'+esc(M.previewURL(entry,state.base,state.theme))+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+esc(entry.name)+' full page in a new tab">Open full page ↗</a></div>':widthTools())+frame(entry,state,kind==='icon provider'?'wb-preview--icons':kind==='screen'?'wb-preview--screen':'')+'</div>';
    return '<article class="wb-spec wb-filterable" id="entry-'+esc(entry.id)+'" data-search="'+esc(M.searchMetadata(entry))+'">'+(kind==='component'?visual+heading:heading+visual)+contract(entry)+'</article>';
  }
  const search=(label,placeholder)=>'<div class="wb-toolbar"><input class="wb-search" type="search" id="catalog-filter" aria-label="'+esc(label)+'" placeholder="'+esc(placeholder)+'"><span id="filter-status" role="status"></span></div>';
  function overview(state){
    const {catalog,tokens}=state,blocks=M.blocks(catalog),count=M.counts(catalog,tokens);
    const html='<div class="wb-stats"><div class="wb-stat"><b>'+blocks.length+'</b><span>components &amp; compositions</span></div>'+
      '<div class="wb-stat"><b id="foundation-count">'+(count.foundations===null?'—':count.foundations)+'</b><span>foundation tokens</span></div>'+
      '</div>'+
      (catalog.screens.length?'<section class="wb-section"><h2>Registered screens <span>'+catalog.screens.length+'</span></h2>'+
       catalog.screens.map(entry=>specimen(entry,state,'screen')).join('')+'</section>':'');
    return {title:'Overview',
      intro:'',html};
  }
  function foundationLabel(row,state){
    const custom=state.catalog.foundationPresentation?.tokens?.[row.name]?.label;
    if(custom)return custom;
    let name=row.name.slice(2),prefix=state.catalog.name.split(' ')[0].toLowerCase()+'-';
    if(name.toLowerCase().startsWith(prefix))name=name.slice(prefix.length);
    return name.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
  }
  function typographyKind(row,state){
    return state.catalog.foundationPresentation?.tokens?.[row.name]?.kind||
      (/family|font-system/.test(row.name)?'family':/weight/.test(row.name)?'weight':
      /line-height|leading/.test(row.name)?'leading':/letter-spacing|tracking/.test(row.name)?'tracking':
      /decoration/.test(row.name)?'decoration':/font-style/.test(row.name)?'style':
      /text-transform/.test(row.name)?'transform':'size');
  }
  function fontStack(value){
    return String(value||'Unresolved').split(',').map(name=>name.trim().replace(/^['"]|['"]$/g,'')).join(' → ');
  }
  function weightLabel(value){
    const names={'100':'Thin','200':'Extra light','300':'Light','400':'Regular','500':'Medium','600':'Semibold','700':'Bold','800':'Extra bold','900':'Black'};
    return names[value]?names[value]+' · '+value:value;
  }
  function foundationItem(row,state,category){
    const options=state.catalog.foundationPresentation?.tokens?.[row.name]||{},value=M.resolveLiteral(row,state.tokens),label=foundationLabel(row,state);
    const attrs=' data-search="'+esc((label+' '+row.name+' '+row.value+' '+row.scope+' '+row.file).toLowerCase())+'"';
    const tokenName='<code class="fd-token-name">'+esc(row.name)+'</code>';
    const data=value!==null?' data-visual-value="'+esc(value)+'" data-visual-name="'+esc(row.name)+'"':'';
    const meta='<div class="fd-label"><h3>'+esc(category==='spacing'&&/space-\d+$/.test(row.name)?value:label)+'</h3>'+(category==='spacing'&&/space-\d+$/.test(row.name)?'':'<span>'+esc(value??'Contextual')+'</span>')+'</div>';
    let visual='';
    if(category==='typography'){
      const kind=typographyKind(row,state);
      const sample=options.sample||(kind==='family'?'The art of keeping things simple.':kind==='weight'?'Good design feels effortless.':'A little clarity goes a long way.');
      const metrics=kind==='family'?fontStack(value):kind==='weight'?weightLabel(value):(value??'Contextual');
      visual='<div class="fd-type-info">'+tokenName+'<span>'+esc(metrics)+'</span></div><div class="fd-type-content"><p class="fd-type-sample" data-visual-kind="'+kind+'"'+data+(options.weight?' data-visual-weight="'+esc(options.weight)+'"':'')+(options.lineHeight?' data-visual-leading="'+esc(options.lineHeight)+'"':'')+'>'+esc(sample)+(kind==='leading'?'<br>'+esc(sample):'')+'</p>'+'</div>';
      return '<article class="fd-type-row fd-type-row--'+kind+' wb-filterable"'+attrs+'>'+visual+'</article>';
    }
    if(category==='colors')visual='<div class="fd-color-sample" data-visual-kind="color"'+data+' aria-hidden="true"></div>'+'<div class="fd-color-info">'+tokenName+'<span class="fd-color-value">'+esc(value??'Contextual')+'</span></div>';
    else if(category==='spacing')visual=tokenName+'<div class="fd-spacing-sample" data-visual-kind="spacing"'+data+' aria-hidden="true"><span class="fd-space-distance"></span></div><span class="fd-value">'+esc(value??'Contextual')+'</span>';
    else if(category==='strokes')visual='<span class="fd-stroke-value">'+esc(value??'Contextual')+'</span><div class="fd-stroke-sample" aria-hidden="true"><span style="border-top-width:'+esc(value)+'"></span></div>'+tokenName;
    else if(category==='roundness')visual=tokenName+'<div class="fd-radius-sample" data-visual-kind="radius"'+data+' aria-hidden="true"><div class="fd-radius-object"></div></div><span class="fd-value">'+esc(value??'Contextual')+'</span>';
    else visual=meta+tokenName;
    return '<article class="fd-item fd-item--'+category+' wb-filterable"'+attrs+'>'+visual+'</article>';
  }
  function textStyleMap(state){
    const styles=state.catalog.foundationPresentation.textStyles||[];
    const fields=[['family','Font family'],['size','Font sizes'],['weight','Font weights'],['leading','Line heights'],['tracking','Letter spacing'],['style','Font styles'],['decoration','Text decoration'],['transform','Text case']];
    const value=name=>{const row=state.tokens.find(row=>row.name===name);return row?M.resolveLiteral(row,state.tokens):null;};
    const primitives=fields.map(([field,title])=>{
      const all=state.tokens.filter(row=>M.family(row,state.tokens)==='Typography'&&typographyKind(row,state)===field&&(!state.catalog.foundationPresentation?.tokens?.[row.name]?.layer||state.catalog.foundationPresentation.tokens[row.name].layer==='primitive'));
      if(['size','weight','leading','tracking'].includes(field))all.sort((a,b)=>(parseFloat(M.resolveLiteral(a,state.tokens))-parseFloat(M.resolveLiteral(b,state.tokens)))*(field==='size'?-1:1));
      const names=[...new Set([...all.map(row=>row.name),...styles.map(style=>style[field]).filter(Boolean)])];
      return names.length?'<section class="ts-group"><h3>'+title+'</h3>'+names.map(name=>'<button type="button" class="ts-node ts-primitive" data-token="'+esc(name)+'" aria-pressed="false"><code>'+esc(name)+'</code><span>'+esc(field==='family'?fontStack(value(name)):field==='weight'?weightLabel(value(name)):value(name)||'Unresolved')+'</span></button>').join('')+'</section>':'';
    }).join('');
    const semanticRows=style=>fields.filter(([field])=>style.semanticTokens?.[field]).map(([field])=>{
      const name=style.semanticTokens[field],resolved=value(name);
      const display=field==='family'?fontStack(resolved):field==='weight'?weightLabel(resolved):resolved||'Unresolved';
      return '<span class="ts-token-value"><code>'+esc(name)+'</code><span class="ts-value-arrow" aria-hidden="true">→</span><span class="ts-resolved-value">'+esc(display)+'</span></span>';
    }).join('');
    return '<div class="ts-map"><svg class="ts-links" aria-hidden="true"></svg><div class="ts-column"><h2>Primitives</h2>'+primitives+'</div><div class="ts-column ts-styles"><h2>Semantic tokens</h2>'+styles.map(style=>'<button type="button" class="ts-node ts-style" data-style="'+esc(style.id)+'" data-refs="'+esc(JSON.stringify(fields.map(([field])=>style[field]).filter(Boolean)))+'" aria-pressed="false"><span class="ts-style-name">'+esc(style.name)+'</span><span class="ts-specimen">'+esc(style.sample)+'</span><span class="ts-semantic-tokens">'+semanticRows(style)+'</span></button>').join('')+'</div></div>';
  }
  function colorMap(state){
    const roles=state.catalog.foundationPresentation.colorRoles;
    const row=name=>state.tokens.find(token=>token.name===name);
    const value=name=>row(name)?M.resolveLiteral(row(name),state.tokens):null;
    const primitive=name=>{
      const seen=new Set();
      while(row(name)&&!seen.has(name)){seen.add(name);const alias=row(name).value.match(/^var\(\s*(--[\w-]+)\s*\)$/);if(!alias)return name;name=alias[1];}
      return null;
    };
    const names=[...new Set([...state.tokens.filter(token=>M.family(token,state.tokens)==='Color'&&state.catalog.foundationPresentation?.tokens?.[token.name]?.layer==='primitive').map(token=>token.name),...roles.map(role=>primitive(role.token)).filter(Boolean)])];
    return '<div class="color-browser"><div class="cb-head"><span>Primitive</span><span>Semantic uses</span></div>'+names.map((name,index)=>{
      const uses=roles.filter(role=>primitive(role.token)===name);
      return '<div class="cb-row wb-filterable" data-search="'+esc([name,value(name),...uses.flatMap(role=>[role.label,role.token])].join(' ').toLowerCase())+'" data-token="'+esc(name)+'" data-color-group="'+index+'"><span class="cb-primitive"><span class="cm-swatch" data-visual-kind="color" data-visual-value="'+esc(value(name))+'"></span><span><code>'+esc(name)+'</code><small>'+esc(value(name))+'</small></span></span><span class="cb-uses">'+(uses.length?uses.map(role=>'<code>'+esc(role.token)+'</code>').join(''):'<span class="cb-unused">No semantic uses</span>')+'</span></div>';
    }).join('')+'</div>';
  }

  function spacingExample(role){
    const icon='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor"/><path d="m2 4 6 5 6-5" fill="none" stroke="currentColor"/></svg>';
    if(role.preview==='text-stack')return '<span class="sm-copy"><strong>Alex Morgan</strong><span class="sm-text-gap"></span><small>To you · 10:30 AM</small></span>';
    if(role.preview==='icon-label')return '<span class="sm-inline-example">'+icon+'<span class="sm-gap-marker"></span><span>Inbox</span></span>';
    if(role.preview==='actions')return '<span class="sm-actions-example"><span>↶</span><span>↪</span><span>⋯</span></span>';
    if(role.preview==='inline-text')return '<strong class="sm-inline-sender">Alex Morgan</strong><span class="sm-gap-marker"></span><span class="sm-inline-excerpt">Here are the updated notes…</span>';
    return '';
  }
  function spacingMap(state,radius=false){
    const roles=state.catalog.foundationPresentation[radius?'radiusRoles':'spacingRoles'];
    const resolve=name=>{const row=state.tokens.find(row=>row.name===name);return row?M.resolveLiteral(row,state.tokens):null;};
    const primitives=state.tokens.filter(row=>(radius?/--(?:[\w]+-)*radius-\d+$/:/--(?:[\w]+-)*space-\d+$/).test(row.name)).sort((a,b)=>parseFloat(resolve(a.name))-parseFloat(resolve(b.name)));
    return '<div class="ts-map spacing-map'+(radius?' radius-map':'')+'"><svg class="ts-links" aria-hidden="true"></svg><div class="ts-column"><h2>Primitives</h2>'+primitives.map(row=>'<button type="button" class="ts-node sm-primitive" data-token="'+esc(row.name)+'" aria-pressed="false"><code>'+esc(row.name)+'</code><span>'+esc(resolve(row.name))+'</span><span class="'+(radius?'rm-primitive-sample':'fd-spacing-sample')+'" data-visual-kind="'+(radius?'radius':'spacing')+'" data-visual-value="'+esc(resolve(row.name))+'"><span class="'+(radius?'fd-radius-object':'fd-space-distance')+'"></span></span></button>').join('')+'</div><div class="ts-column"><h2>'+(radius?'Roundness roles':'Spacing roles')+'</h2>'+[...new Set(roles.map(role=>resolve(role.token)))].sort((a,b)=>parseFloat(a)-parseFloat(b)).map(groupValue=>'<fieldset class="sm-value-group"><legend>'+esc(groupValue)+'</legend>'+roles.filter(role=>resolve(role.token)===groupValue).map(role=>{
      const value=resolve(role.token),kind=role.kind,title={gap:'Gap',inline:'Horizontal inset',block:'Vertical inset',radius:'Corner radius',stack:'Text gap'}[kind];
      return '<button type="button" class="ts-node ts-style sm-role" data-style="'+esc(role.token)+'" data-refs="'+esc(JSON.stringify([role.primitive]))+'" aria-pressed="false" aria-expanded="false"><span class="sm-preview"><span class="sm-diagram sm-'+kind+'" data-spacing-kind="'+kind+'" data-spacing-value="'+esc(value)+'" aria-label="'+esc(title+' '+value)+'"'+(role.textGap?' data-text-gap="'+esc(resolve(role.textGap))+'"':'')+'>'+(!radius&&role.preview?spacingExample(role):radius?'<span class="rm-example">'+(role.token.includes('search')?'<span class="rm-search-icon" aria-hidden="true">⌕</span><span>Search messages</span>':role.token.includes('compose')?'<strong>New message</strong><span>To: Jamie</span><span>Hi Jamie,</span>':'<strong>Design review</strong><span>Notes and next steps</span>')+'</span>':kind==='gap'?'<span class="sm-avatar">AM</span><span class="sm-gap-marker"></span><span class="sm-copy"><strong>Alex Morgan</strong><small>To you · 10:30 AM</small></span>':role.token.includes('mail-row')?'<span class="sm-copy sm-inset-content"><strong>Alex Morgan</strong><span>Design review notes</span><small>Here’s the updated version for review.</small></span>':role.token.includes('reading-pane')?'<span class="sm-copy sm-inset-content"><strong>Design review notes</strong><small>Alex Morgan · Today</small></span>':'<span class="sm-copy sm-inset-content"><span>Hi Jamie,</span><span>I’ve shared the updated notes. Let me know what you think.</span></span>')+'</span></span><span class="ts-semantic-tokens"><span class="ts-token-value"><code>'+esc(role.token)+'</code><span class="ts-value-arrow">→</span><span class="ts-resolved-value">'+esc(value)+'</span></span></span></button>';
    }).join('')+'</fieldset>').join('')+'</div></div>';
  }
  function strokeMap(state){
    const roles=state.catalog.foundationPresentation.strokeRoles;
    const resolve=name=>{const row=state.tokens.find(row=>row.name===name);return row?M.resolveLiteral(row,state.tokens):null;};
    const primitives=[...new Set(roles.map(role=>role.primitive))].sort((a,b)=>parseFloat(resolve(a))-parseFloat(resolve(b)));
    const sample=value=>'<span class="fd-stroke-sample" aria-hidden="true"><span style="border-top-width:'+esc(value)+'"></span></span>';
    return '<div class="ts-map stroke-map"><svg class="ts-links" aria-hidden="true"></svg><div class="ts-column"><h2>Primitives</h2>'+primitives.map(name=>'<button type="button" class="ts-node sm-primitive" data-token="'+esc(name)+'" aria-pressed="false"><code>'+esc(name)+'</code><span>'+esc(resolve(name))+'</span>'+sample(resolve(name))+'</button>').join('')+'</div><div class="ts-column"><h2>Border &amp; divider roles</h2>'+roles.map(role=>'<button type="button" class="ts-node ts-style sm-role stroke-role" data-style="'+esc(role.token)+'" data-refs="'+esc(JSON.stringify([role.primitive]))+'" aria-pressed="false" aria-expanded="false"><strong>'+esc(role.label)+'</strong>'+sample(resolve(role.token))+'<span class="ts-token-value"><code>'+esc(role.token)+'</code><span> → '+esc(resolve(role.token))+'</span></span></button>').join('')+'</div></div>';
  }
  function foundations(state){
    if(state.tokens===null)return {title:'Foundations',intro:'',html:state.tokenError?empty('Unable to load foundations',state.tokenError):'<p role="status">Loading…</p>'};
    if(!state.tokens.length)return {title:'Foundations',intro:'',html:empty('No foundations yet')};
    const foundationTokens=state.tokens.filter(row=>{const layer=state.catalog.foundationPresentation?.tokens?.[row.name]?.layer;return !layer||layer==='primitive';});
    if(!foundationTokens.length)return {title:'Foundations',intro:'',html:empty('No foundations yet')};
    const sections=[['typography','Typography','Typography'],['colors','Colors','Color'],['spacing','Spacing','Spacing'],['strokes','Borders & dividers','Strokes'],['roundness','Roundness','Shape & elevation'],['other','Other','Component controls']];
    const groupOf=row=>M.family(row,state.tokens);
    const available=sections.filter(s=>!(s[0]==='colors'&&state.catalog.foundationPresentation?.colorRoles?.length)&&!(s[0]==='typography'&&state.catalog.foundationPresentation?.textStyles?.length)&&foundationTokens.some(row=>s[0]==='other'?['Component controls','Motion'].includes(groupOf(row)):groupOf(row)===s[2]));
    if(state.catalog.foundationPresentation?.colorRoles?.length)available.push(['color-roles','Color roles','Color roles']);
    if(state.catalog.foundationPresentation?.textStyles?.length)available.unshift(['text-styles','Text styles','Text styles']);
    const otherIndex=available.findIndex(section=>section[0]==='other');
    if(otherIndex!==-1)available.push(...available.splice(otherIndex,1));
    const requested=state.foundationSection==='typography'&&state.catalog.foundationPresentation?.textStyles?.length?'text-styles':state.foundationSection==='colors'&&state.catalog.foundationPresentation?.colorRoles?.length?'color-roles':state.foundationSection;
    const selected=available.find(s=>s[0]===requested)||(state.catalog.foundationPresentation?.textStyles?.length?available.find(s=>s[0]==='text-styles'):available[0]);
    const panels=available.map(current=>{
    const category=current[0];
    const rows=foundationTokens.filter(row=>category==='other'?['Component controls','Motion'].includes(groupOf(row)):groupOf(row)===current[2]);
    const section=(items,extra=false)=>'<div class="fd-'+(category==='typography'?'type-list':category==='spacing'?'spacing-list':'grid')+' wb-token-group'+(extra?' fd-additional':'')+'">'+items.map(row=>foundationItem(row,state,category)).join('')+'</div>';
    let content;
    if(category==='text-styles')content=textStyleMap(state);
    else if(category==='color-roles')content=colorMap(state);
    else if(category==='spacing'&&state.catalog.foundationPresentation?.spacingRoles?.length)content=spacingMap(state);
    else if(category==='strokes'&&state.catalog.foundationPresentation?.strokeRoles?.length)content=strokeMap(state);
    else if(category==='roundness'&&state.catalog.foundationPresentation?.radiusRoles?.length)content=spacingMap(state,true);
    else if(category==='typography'){
      const groups=[['family','Font family'],['size','Font sizes'],['weight','Font weights'],['leading','Line heights'],['tracking','Letter spacing'],['style','Font styles'],['decoration','Text decoration'],['transform','Text case']];
      content=groups.map(([kind,title])=>{
        const items=rows.filter(row=>typographyKind(row,state)===kind);
        if(!items.length)return '';
        if(['size','weight','leading','tracking'].includes(kind))items.sort((a,b)=>{
          const delta=parseFloat(M.resolveLiteral(a,state.tokens))-parseFloat(M.resolveLiteral(b,state.tokens));
          return kind==='size'?-delta:delta;
        });
        return '<section class="fd-category"><h2>'+title+'</h2>'+section(items)+'</section>';
      }).join('');
    }else{
      if(category==='spacing')rows.sort((a,b)=>parseFloat(M.resolveLiteral(a,state.tokens))-parseFloat(M.resolveLiteral(b,state.tokens)));
      content=section(rows);
    }
    return '<section class="fd-panel" data-foundation-panel="'+category+'" data-selected="'+(current===selected)+'"'+(current===selected?'':' hidden')+'><h2 class="fd-search-heading" hidden>'+current[1]+'</h2>'+content+'</section>';
    }).join('');
    return {title:'Foundations',intro:'',html:'<div class="fd-toolbar"><nav class="fd-tabs" aria-label="Foundations">'+available.map(s=>'<a href="#foundations/'+s[0]+'"'+(s===selected?' aria-current="page"':'')+'>'+s[1]+'</a>').join('')+'</nav>'+search('Search all foundations','Search foundations…')+'</div>'+panels};
  }

  function components(state){
    const entries=M.blocks(state.catalog),categories=['All',...new Set(entries.map(entry=>entry.category||'Components'))];
    return {title:'Components',intro:'',html:entries.length?'<div class="fd-toolbar"><nav class="fd-tabs cg-tabs" aria-label="Component categories">'+categories.map(category=>'<button type="button" data-component-category="'+esc(category)+'" aria-pressed="'+(category===(state.componentCategory||'All'))+'">'+esc(category)+'</button>').join('')+'</nav>'+search('Filter components','Search components…')+'</div>'+
      M.groups(entries,entry=>entry.category||'Components').map(([category,group])=>'<section class="wb-component-group cg-category"><h2>'+esc(category)+'</h2><div class="cg-grid">'+group.map(entry=>{
        const preview={...entry,preview:entry.preview+(entry.preview.includes('?')?'&':'?')+'gallery=1',previewHeight:200};
        return '<article class="cg-card wb-filterable" style="--gallery-width:'+(Number.isFinite(entry.galleryWidth)?Math.max(280,Math.min(960,entry.galleryWidth)):360)+'px" id="entry-'+esc(entry.id)+'" data-category="'+esc(category)+'" data-search="'+esc(M.searchMetadata(entry))+'"><div class="cg-preview-stage">'+('<button type="button" class="cg-select-preview" data-interactions="'+esc(entry.id)+'" aria-label="Show '+esc(entry.name)+' interactions" aria-controls="component-interactions" aria-expanded="false"></button>')+componentTools()+'<button type="button" class="cg-expand" data-component="'+esc(entry.id)+'" aria-haspopup="dialog" aria-label="Expand '+esc(entry.name)+'" title="Expand '+esc(entry.name)+'"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 2h4v4M14 2 9 7M6 14H2v-4M2 14l5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="cg-preview" inert>'+frame(preview,state)+'</div></div><footer class="cg-card-footer"><div class="cg-card-identity"><div class="cg-name-row"><h3>'+esc(entry.name)+'</h3><button type="button" class="cg-copy-reference" data-copy-component="'+esc(entry.id)+'" aria-label="Copy '+esc(entry.name)+' reference" title="Copy component reference"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor"/><path d="M10 3V2H2v8h1" stroke="currentColor" stroke-linejoin="round"/></svg></button></div>'+(entry.class?'<code>'+esc('.'+entry.class)+'</code>':'')+'</div>'+'</footer></article>';
      }).join('')+'</div></section>').join('')+'<aside id="component-interactions" class="ci-panel" aria-label="Component interactions" tabindex="-1" hidden></aside><dialog class="cg-dialog" aria-label="Component details"><button type="button" class="cg-close" aria-label="Close component details">×</button><div class="cg-detail"></div></dialog>':empty('No components registered yet')};
  }
  function patterns(state){
    return {title:'Layouts & patterns',intro:'',
      html:state.catalog.patterns.length?search('Search patterns','Search patterns…')+'<div class="fd-tabs pattern-tabs">'+['Layouts','Interaction Patterns'].map((name,i)=>'<button type="button" data-pattern-category="'+name+'" aria-pressed="'+(i===0)+'">'+name+'</button>').join('')+'</div>'+ state.catalog.patterns.map(entry=>'<article class="wb-pattern wb-filterable" data-search="'+esc(M.searchMetadata(entry))+'" data-pattern-kind="'+esc(entry.category==='Layouts'?'Layouts':'Interaction Patterns')+'"'+(entry.category==='Layouts'?'':' hidden')+' id="entry-'+esc(entry.id)+'"><header class="wb-pattern-head"><span class="wb-kicker">'+esc(entry.category||'Interaction & layout')+'</span>'+
        '<h2>'+esc(entry.name)+' <button type="button" class="cg-copy-reference" data-copy-pattern="'+esc(entry.id)+'" title="Copy pattern reference" aria-label="Copy '+esc(entry.name)+' reference"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3 11H2V2h9v1"/></svg></button></h2><p>'+esc(entry.summary||entry.usage||'')+'</p></header><div class="wb-pattern-preview">'+frame(entry,state,'wb-preview--pattern')+'</div>'+
        '<div class="wb-pattern-body"><div>'+(entry.route?'<code class="wb-pattern-route">'+esc(entry.route)+'</code>':'')+detail('Use when',entry.useWhen)+detail('Structure',entry.structure)+'</div>'+
        '<div>'+detail('Requirements',entry.requirements)+detail('Avoid',entry.avoid)+'</div></div>'+contract(entry)+'</article>').join(''):empty('No patterns registered yet')};
  }
  function render(state){
    const tab=state.tab;
    if(tab==='overview')return overview(state);
    if(tab==='foundations')return foundations(state);
    if(tab==='components')return components(state);
    if(tab==='patterns')return patterns(state);
    if(tab==='icons')return {title:'Icons',intro:'',
      html:state.catalog.icons.length?state.catalog.icons.map(entry=>'<section class="wb-icon-gallery">'+frame(entry,state,'wb-preview--icons')+'</section>').join(''):empty('No icon providers registered yet')};
    if(tab==='visualizations')return {title:'Data visualization',intro:'',
      html:state.catalog.visualizations.length?'<div class="wb-viz-grid">'+state.catalog.visualizations.map(entry=>specimen(entry,state,'visualization')).join('')+'</div>':empty('No visualizations registered yet')};
    if(tab==='directions'){
      const entry=state.catalog.screens[0]||state.catalog.components[0];
      return {title:'Directions',intro:'',
        html:entry&&state.catalog.themes.length?'<div class="wb-direction-grid">'+state.catalog.themes.map(theme=>'<article class="wb-spec"><header class="wb-spec-head"><h2>'+esc(theme.name)+'</h2><code>'+esc(theme.id)+'</code></header>'+
          '<div class="wb-spec-body"><p class="wb-description">'+esc(theme.description||'Semantic theme overrides')+'</p>'+frame(entry,{...state,theme:theme.id},'wb-preview--direction')+
          '<div class="wb-source-links"><a href="'+esc(source(theme.file,state))+'" target="_blank" rel="noopener">Theme source</a><a href="'+esc(M.previewURL(entry,state.base,theme.id,true))+'" target="_blank" rel="noopener">Inspect direction ↗</a></div></div></article>').join('')+'</div>':
          empty('No themes yet')};
    }
    return {title:'Mood board',intro:'',
      html:'<iframe class="wb-moodboard" title="App reference moodboard" src="/moodboard/"></iframe>'};
  }
  return {esc,tabs,navigation,render,componentDetails:specimen};
});
