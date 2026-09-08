(() => {
  'use strict';
  const tabs=[['overview','Overview','A place to define your design language, inspect real screens, and evolve the tools that keep them connected.'],['foundations','Foundations','Scales, semantic roles and component controls, read directly from the token source.'],['icons','Icons','Discover symbols through the project’s icon provider.'],['components','Components','Real implementations, anatomy, optional parts and states.'],['patterns','Patterns','Contracts for how tasks occupy a screen.'],['visualizations','Data visualization','Chart language, reading order and renderer examples.'],['directions','Directions','The same examples rendered with different semantic themes.'],['moodboard','Moodboard','Collect references and capture the decisions they inform.']];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let registry,profile,base,renderId=0;
  const source=relative=>new URL(relative,new URL(base,location.origin)).href;
  function safeURL(relative){const url=new URL(source(relative));if(url.origin!==location.origin)throw Error('Catalog URLs must be same-origin');return url;}
  function previewURL(entry,theme,inspect=false){const url=safeURL(entry.preview);if(theme)url.searchParams.set('theme',theme);if(inspect)url.searchParams.set('ds','true');return url.href;}
  const frame=(url,name,cls='preview')=>`<iframe class="${cls}" title="${esc(name)}" src="${esc(url)}" loading="lazy"></iframe>`;
  function card(entry,theme){
    const url=previewURL(entry,theme);
    return `<article class="card"><div class="card-head"><div><h2>${esc(entry.name)}</h2>${entry.class?`<code>${esc(entry.class)}</code>`:''}</div><span class="tag">${esc(entry.category||'CONTRACT')}</span></div>${entry.usage?`<p>${esc(entry.usage)}</p>`:''}<div class="width-tools" role="group" aria-label="Preview width"><button data-width="100%">Fluid</button><button data-width="320px">320px</button></div>${frame(url,entry.name)}<div class="actions"><a href="${esc(previewURL(entry,theme,true))}" target="_blank" rel="noopener">Inspect example ↗</a>${entry.css?`<a href="${esc(source(entry.css))}" target="_blank" rel="noopener">CSS source</a>`:''}${entry.module?`<a href="${esc(source(entry.module))}" target="_blank" rel="noopener">Renderer</a>`:''}</div><details><summary>Contract &amp; anatomy</summary><pre>${esc(JSON.stringify(entry,null,2))}</pre></details></article>`;
  }
  function empty(title){return `<div class="empty"><h2>${esc(title)}</h2><p>Your project catalog starts empty. Put source screens in <code>project/inbox/</code>, complete <code>project/BRIEF.md</code>, and ask your agent to build the DS from those screens. Register each approved implementation and its preview here.</p><a href="?profile=demo#overview">Explore the populated sandbox ↗</a></div>`;}
  async function render(){
    if(!registry)return;
    const id=++renderId,tab=tabs.find(t=>t[0]===location.hash.slice(1))||tabs[0];
    $('title').textContent=tab[1];$('intro').textContent=tab[2];$('eyebrow').textContent=(profile==='demo'?'TOOL DEVELOPMENT':'PROJECT DESIGN SYSTEM')+' / '+tab[1].toUpperCase();
    document.querySelector('nav').innerHTML=tabs.map((t,i)=>`<a href="#${t[0]}" ${tab===t?'aria-current="page"':''}><span class="nav-num">0${i+1}</span>${t[1]}</a>`).join('');
    let html='';
    if(tab[0]==='overview'){
      html=`<div class="notice">${profile==='demo'?'Sandbox data is fictional. This catalog is for developing the framework; it never populates your project automatically.':'Project files belong to you. Framework releases update the tooling independently.'}</div><div class="metric-row">${[['components','Components'],['compositions','Compositions'],['patterns','Patterns'],['screens','Screens']].map(([key,label])=>`<div class="metric"><strong>${registry[key].length}</strong><span>${label}</span></div>`).join('')}</div><div class="grid">${registry.screens.map(entry=>card(entry)).join('')||empty('Ready for your first screens')}</div>`;
      if(registry.knownGaps?.length)html+=`<article class="card section-space"><h2>Known gaps</h2><ul>${registry.knownGaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></article>`;
    }else if(tab[0]==='foundations'){
      const files=await Promise.all(registry.tokenFiles.map(async file=>({file,text:await (await fetch(source(file))).text()})));
      if(id!==renderId)return;
      const rows=files.flatMap(({file,text})=>Array.from(text.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g),m=>({name:m[1],value:m[2],file})));
      html=rows.length?`<input type="search" aria-label="Filter tokens" placeholder="Find a token, value or role…" id="token-filter"><div class="card"><table class="token-table"><thead><tr><th>Token</th><th>Definition</th><th>Source</th></tr></thead><tbody>${rows.map(r=>`<tr><td><code>${esc(r.name)}</code></td><td>${esc(r.value)}</td><td><a href="${esc(source(r.file))}">${esc(r.file)}</a></td></tr>`).join('')}</tbody></table></div>`:empty('No foundations extracted yet');
    }else if(tab[0]==='moodboard'){
      html='<div class="notice">References are stored in .moodboard-data/, outside framework updates. This board is shared by the profiles in this local starter.</div>'+frame('/moodboard/','Reference moodboard','full-frame');
    }else if(tab[0]==='directions'){
      const entry=registry.screens[0]||registry.components[0];
      html=entry&&registry.themes.length?`<div class="grid">${registry.themes.map(theme=>`<article class="card"><h2>${esc(theme.name)}</h2><p>${esc(theme.description||'Semantic overrides')}</p>${frame(previewURL(entry,theme.id),theme.name,'preview tall')}<a class="source-link" href="${esc(source(theme.file))}">Theme source</a></article>`).join('')}</div>`:empty('No theme comparisons registered');
    }else{
      const entries=tab[0]==='components'?[...registry.compositions,...registry.components]:registry[tab[0]]||[];
      html=entries.length?`<div class="grid">${entries.map(entry=>card(entry)).join('')}</div>`:empty('No '+tab[1].toLowerCase()+' registered yet');
    }
    if(id!==renderId)return;$('content').innerHTML=html;
    $('token-filter')?.addEventListener('input',event=>document.querySelectorAll('.token-table tbody tr').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(event.target.value.toLowerCase())));
    document.querySelectorAll('[data-width]').forEach(button=>button.onclick=()=>{const iframe=button.closest('.card').querySelector('iframe');iframe.style.width=button.dataset.width;iframe.style.maxWidth='100%';});
  }
  async function load(){
    try{
      const config=await (await fetch('/api/studio')).json();
      profile=new URLSearchParams(location.search).get('profile')||config.defaultProfile;
      if(!['demo','project'].includes(profile))profile='project';
      base=profile==='demo'?'/demo/design-system/':'/design-system/';
      registry=await (await fetch(source('registry.json'))).json();
      $('profile').value=profile;$('catalog-name').textContent=registry.name;$('version').textContent='Framework '+config.version.version;
      $('profile').onchange=()=>{const url=new URL(location.href);url.searchParams.set('profile',$('profile').value);location.href=url.href;};
      await render();
    }catch(error){$('content').innerHTML='<div class="error">Could not load the catalog: '+esc(error.message)+'</div>';}
  }
  addEventListener('hashchange',()=>render().catch(error=>{$('content').textContent=error.message;}));load();
})();
