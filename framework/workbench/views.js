(function(root,factory){
  const model=typeof module==='object'&&module.exports?require('./model'):root.StudioModel;
  const api=factory(model);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioViews=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=[
    ['overview','Overview','list'],['foundations','Foundations','tag'],['icons','Icons','shapes'],
    ['components','Components','box'],['patterns','Patterns','layout'],['visualizations','Data viz','chart'],
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
    return tabs.map(([key,label,glyph])=>'<a href="#'+key+'"'+(key===current?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'</span><i'+(key==='icons'?' title="Registered icon providers"':'')+'>'+(counts[key]===null?'':counts[key])+'</i></a>').join('');
  }
  const empty=(title,note='Point your agent at existing screens and the app-owned AGENTS.md. Register the resulting implementations here; no inbox or screen copying is required.')=>'<div class="wb-empty"><h2>'+esc(title)+'</h2><p>'+esc(note)+'</p></div>';
  function source(file,state){
    const url=new URL(file,state.base);
    if(url.origin!==new URL(state.base).origin || !/^https?:$/.test(url.protocol))throw Error('Sources must be same-origin');
    return url.href;
  }
  function frame(entry,state,size=''){
    return '<iframe class="wb-preview '+size+'" loading="lazy" title="'+esc(entry.name)+' — live preview" src="'+esc(M.previewURL(entry,state.base,state.theme))+'"></iframe>';
  }
  function sourceLinks(entry,state){
    return '<div class="wb-source-links"><a href="'+esc(M.previewURL(entry,state.base,state.theme,true))+'" target="_blank" rel="noopener">Inspect example ↗</a>'+
      (entry.css?'<a href="'+esc(source(entry.css,state))+'" target="_blank" rel="noopener">CSS source</a>':'')+
      (entry.module?'<a href="'+esc(source(entry.module,state))+'" target="_blank" rel="noopener">Renderer</a>':'')+'</div>';
  }
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
    return '<article class="wb-spec wb-filterable" id="entry-'+esc(entry.id)+'" data-search="'+esc((entry.name+' '+(entry.class||'')+' '+(entry.category||'')).toLowerCase())+'">'+
      '<header class="wb-spec-head"><h2>'+esc(entry.name)+'</h2>'+(entry.class?'<code>.'+esc(entry.class)+'</code>':'')+
      '<span>'+esc(entry.category||kind)+'</span></header>'+
      '<div class="wb-spec-body">'+((entry.usage||entry.summary)?'<p class="wb-description">'+esc(entry.usage||entry.summary)+'</p>':'')+
      widthTools()+frame(entry,state,kind==='icon provider'?'wb-preview--icons':kind==='screen'?'wb-preview--screen':'')+sourceLinks(entry,state)+'</div>'+
      contract(entry)+'</article>';
  }
  const search=(label,placeholder)=>'<div class="wb-toolbar"><input class="wb-search" type="search" id="catalog-filter" aria-label="'+esc(label)+'" placeholder="'+esc(placeholder)+'"><span id="filter-status" role="status"></span></div>';
  function overview(state){
    const {catalog,tokens}=state,blocks=M.blocks(catalog),count=M.counts(catalog,tokens);
    const html='<div class="wb-stats"><div class="wb-stat"><b>'+blocks.length+'</b><span>registered components and compositions</span></div>'+
      '<div class="wb-stat"><b id="foundation-count">'+(count.foundations===null?'—':count.foundations)+'</b><span>unique foundation token names</span></div>'+
      '<div class="wb-stat"><b class="wb-stat-unmeasured">Not measured</b><span>product adoption · registration is not usage</span></div></div>'+
      (blocks.length?search('Filter building blocks','Find a building block…')+
      '<div class="wb-ledger"><div class="wb-ledger-head"><span>Block</span><span>Implementation</span><span>Adoption</span><span>States</span></div>'+
      blocks.map(entry=>'<details class="wb-ledger-item wb-filterable" data-search="'+esc((entry.name+' '+entry.class+' '+entry.category).toLowerCase())+'"><summary>'+
        '<span class="wb-block-name"><i class="wb-dot" aria-hidden="true"></i><span><b>'+esc(entry.name)+'</b><small>'+esc(entry.category||'registered block')+'</small></span></span>'+
        '<code>'+esc(entry.class)+'</code><span class="wb-unmeasured">Not measured</span><span class="wb-number">'+entry.states.length+'</span></summary>'+
        '<div class="wb-ledger-detail"><p>'+esc(entry.usage||entry.anatomy?.ownership||'Registered shared implementation.')+'</p>'+
        '<a href="#components/'+encodeURIComponent(entry.id)+'">View component &amp; anatomy →</a></div></details>').join('')+'</div>'+
      '<p class="wb-legend"><i class="wb-dot" aria-hidden="true"></i> Registered implementation <span>Adoption and duplication require app-specific measurement; no estimates are shown.</span></p>':empty('Ready for your first building blocks'))+
      (catalog.screens.length?'<section class="wb-section"><h2>Registered screens <span>'+catalog.screens.length+'</span></h2>'+
       catalog.screens.map(entry=>specimen(entry,state,'screen')).join('')+'</section>':'')+
      (catalog.knownGaps?.length?'<section class="wb-section"><h2>Known gaps</h2>'+list(catalog.knownGaps)+'</section>':'');
    return {title:blocks.length?blocks.length+' reusable building blocks.':'Your app’s design system starts here.',
      intro:'A ledger of the shared language: what is defined, how it is implemented, and what still needs evidence. The content belongs to this app; the workbench stays consistent.',html};
  }
  function foundations(state){
    if(state.tokens===null)return {title:'Foundations',intro:'Scales, semantic roles and component controls, read from the app’s CSS.',html:state.tokenError?empty('Token sources could not be loaded',state.tokenError):'<p role="status">Reading token sources…</p>'};
    const rows=state.tokens;
    return {title:'Foundations',intro:'The values behind the interface. Each definition retains its source and scope; matching values do not imply shared ownership.',
      html:rows.length?search('Filter foundation tokens','Find a token, value, source or scope…')+
      '<p class="wb-note">'+new Set(rows.map(row=>row.name)).size+' unique names · '+rows.length+' declarations. Samples resolve simple, unconditional root aliases only—not the full CSS cascade or selected preview theme.</p>'+
      M.groups(rows,M.family).map(([family,group])=>'<section class="wb-section wb-token-group"><h2>'+esc(family)+' <span>'+group.length+'</span></h2><div class="wb-token-grid">'+group.map(row=>{
        const resolved=M.resolveLiteral(row,rows);
        return '<article class="wb-token wb-filterable" data-search="'+esc((row.name+' '+row.value+' '+row.scope+' '+row.file).toLowerCase())+'">'+
        '<div class="wb-token-sample" data-sample-family="'+esc(family)+'" data-sample-name="'+esc(row.name)+'"'+(resolved!==null?' data-sample-value="'+esc(resolved)+'"':'')+' aria-hidden="true"><span>—</span></div>'+
        '<div class="wb-token-definition"><code>'+esc(row.name)+'</code><small>'+esc(row.value)+'</small><a href="'+esc(source(row.file,state))+'" target="_blank" rel="noopener">'+esc(row.file)+'</a><span class="wb-token-scope">'+esc(row.scope)+'</span></div></article>';
      }).join('')+'</div></section>').join(''):empty('No foundations registered yet')};
  }
  function components(state){
    const entries=M.blocks(state.catalog);
    return {title:'Components',intro:'Real shared implementations, not pictures of them. Inspect the example, compare a narrow width, and read each component’s anatomy and spacing ownership.',
      html:entries.length?search('Filter components','Find a component or composition…')+
        '<nav class="wb-jump-list" aria-label="Component index">'+entries.map(entry=>'<a href="#components/'+encodeURIComponent(entry.id)+'">'+esc(entry.name)+'</a>').join('')+'</nav>'+
        M.groups(entries,entry=>entry.category||'Shared components').map(([category,group])=>'<section class="wb-section wb-component-group"><h2>'+esc(category)+' <span>'+group.length+'</span></h2>'+group.map(entry=>specimen(entry,state)).join('')+'</section>').join(''):
        empty('No components registered yet')};
  }
  function patterns(state){
    return {title:'Patterns',intro:'How a task occupies a screen. Structure, routing, interaction and resizing are part of the pattern—not just the controls inside it.',
      html:state.catalog.patterns.length?state.catalog.patterns.map(entry=>'<article class="wb-pattern" id="entry-'+esc(entry.id)+'"><header class="wb-pattern-head"><span class="wb-kicker">'+esc(entry.category||'Interaction & layout')+'</span>'+
        '<h2>'+esc(entry.name)+'</h2><p>'+esc(entry.summary||entry.usage||'')+'</p></header><div class="wb-pattern-preview">'+widthTools()+frame(entry,state,'wb-preview--pattern')+sourceLinks(entry,state)+'</div>'+
        '<div class="wb-pattern-body"><div>'+(entry.route?'<code class="wb-pattern-route">'+esc(entry.route)+'</code>':'')+detail('Use when',entry.useWhen)+detail('Structure',entry.structure)+'</div>'+
        '<div>'+detail('Requirements',entry.requirements)+detail('Avoid',entry.avoid)+'</div></div>'+contract(entry)+'</article>').join(''):empty('No patterns registered yet')};
  }
  function render(state){
    const tab=state.tab;
    if(tab==='overview')return overview(state);
    if(tab==='foundations')return foundations(state);
    if(tab==='components')return components(state);
    if(tab==='patterns')return patterns(state);
    if(tab==='icons')return {title:'Icons',intro:'The app’s icon language, through its registered providers. Search, supported weights and copying remain part of each live provider.',
      html:state.catalog.icons.length?state.catalog.icons.map(entry=>specimen(entry,state,'icon provider')).join(''):empty('No icon providers registered yet')};
    if(tab==='visualizations')return {title:'Data visualization',intro:'Shared chart language with real renderer-backed examples. Data and labels belong to the app; the presentation follows the registered contract.',
      html:state.catalog.visualizations.length?'<div class="wb-viz-grid">'+state.catalog.visualizations.map(entry=>specimen(entry,state,'visualization')).join('')+'</div>':empty('No visualizations registered yet')};
    if(tab==='directions'){
      const entry=state.catalog.screens[0]||state.catalog.components[0];
      return {title:'Directions',intro:'The same implementation, viewed through different app themes. Only the previews change—the studio’s visual language stays consistent.',
        html:entry&&state.catalog.themes.length?'<div class="wb-direction-grid">'+state.catalog.themes.map(theme=>'<article class="wb-spec"><header class="wb-spec-head"><h2>'+esc(theme.name)+'</h2><code>'+esc(theme.id)+'</code></header>'+
          '<div class="wb-spec-body"><p class="wb-description">'+esc(theme.description||'Semantic theme overrides')+'</p>'+frame(entry,{...state,theme:theme.id},'wb-preview--direction')+
          '<div class="wb-source-links"><a href="'+esc(source(theme.file,state))+'" target="_blank" rel="noopener">Theme source</a><a href="'+esc(M.previewURL(entry,state.base,theme.id,true))+'" target="_blank" rel="noopener">Inspect direction ↗</a></div></div></article>').join('')+'</div>':
          empty('No theme comparison available','Register a theme and at least one component or screen preview to compare directions.')};
    }
    return {title:'Mood board',intro:'A reference room for this app. Collect images, record decisions, and explore directions; saved board content stays outside studio updates.',
      html:'<iframe class="wb-moodboard" title="App reference moodboard" src="/moodboard/"></iframe>'};
  }
  return {esc,tabs,navigation,render};
});
