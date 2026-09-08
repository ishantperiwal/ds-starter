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
    $('navigation').innerHTML=V.navigation(state.catalog,state.tokens,state.tab);
    $('catalog-summary').innerHTML='<p><b>'+state.catalog.components.length+'</b> components · <b>'+state.catalog.patterns.length+'</b> patterns</p><p><b>'+
      state.catalog.compositions.length+'</b> compositions · <b>'+state.catalog.icons.length+'</b> icon providers</p>';
  }
  function paintSamples(){
    document.querySelectorAll('[data-sample-value]').forEach(sample=>{
      const {sampleValue:value,sampleName:name,sampleFamily:family}=sample.dataset;
      const child=sample.firstElementChild;
      if(CSS.supports('color',value)){
        sample.style.backgroundColor=value;child.textContent='';sample.title='Root literal: '+value;
      }else if(family==='Spacing' && /^-?\d+(\.\d+)?(px|rem|em)$/.test(value)){
        const px=parseFloat(value)*(value.endsWith('px')?1:16);
        child.textContent='';child.style.cssText='display:block;height:6px;background:var(--studio-accent)';
        child.style.width=Math.max(0,Math.min(46,px))+'px';
        sample.title=value+' · scale sample capped to fit';
      }else if(/radius/.test(name)&&CSS.supports('border-radius',value)){
        sample.style.borderRadius=value;sample.style.backgroundColor='var(--studio-hover)';child.textContent='Aa';
      }else if(/font|text|weight/.test(name)){
        child.textContent='Aa';
        if(/weight/.test(name)&&CSS.supports('font-weight',value))child.style.fontWeight=value;
        else if(/^(\d+(\.\d+)?)(px|rem|em)$/.test(value)){
          const px=parseFloat(value)*(value.endsWith('px')?1:16);child.style.fontSize=Math.min(px,32)+'px';
        }else if(/font/.test(name)&&CSS.supports('font-family',value))child.style.fontFamily=value;
      }
    });
  }
  function bind(){
    const filter=$('catalog-filter');
    if(filter){
      filter.addEventListener('input',()=>{
        const query=filter.value.toLowerCase().trim();
        let visible=0,total=0;
        document.querySelectorAll('.wb-filterable').forEach(item=>{
          item.hidden=!item.dataset.search.includes(query);total++;if(!item.hidden)visible++;
        });
        document.querySelectorAll('.wb-token-group,.wb-component-group').forEach(group=>{
          group.hidden=![...group.querySelectorAll('.wb-filterable')].some(item=>!item.hidden);
        });
        $('filter-status').textContent=visible+' of '+total+' shown';
      });
    }
    document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>{
      const tools=button.closest('.wb-width-tools'),parent=tools.parentElement;
      parent.querySelector('iframe').style.width=button.dataset.width;
      tools.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    }));
    paintSamples();
  }
  function render(){
    if(!state.catalog)return;
    const current=M.route(location.hash);
    state.tab=V.tabs.some(tab=>tab[0]===current.tab)?current.tab:'overview';
    document.body.dataset.view=state.tab;
    const result=V.render(state);
    $('title').textContent=result.title;$('intro').textContent=result.intro;
    $('content').innerHTML=result.html;$('content').setAttribute('aria-busy','false');
    $('theme').disabled=!state.catalog.themes.length||['foundations','directions','moodboard'].includes(state.tab);
    sidebar();bind();
    if(current.entry){
      const entry=document.getElementById('entry-'+current.entry);
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
      state.theme=state.catalog.themes.some(theme=>theme.id===params.get('theme'))?params.get('theme'):'';
      $('brand-name').textContent=state.profile==='demo'?'Studio':config.name;
      $('catalog-name').textContent=state.catalog.name;
      document.title=state.catalog.name+' · Design system';
      $('version').textContent='v'+config.version.version;
      $('profile').value=state.profile;
      $('theme').innerHTML='<option value="">Base</option>'+state.catalog.themes.map(theme=>'<option value="'+V.esc(theme.id)+'">'+V.esc(theme.name)+'</option>').join('');
      $('theme').value=state.theme;
      $('profile').addEventListener('change',()=>{
        const url=new URL(location.href);url.searchParams.set('profile',$('profile').value);
        url.searchParams.delete('theme');url.hash='overview';location.href=url.href;
      });
      $('theme').addEventListener('change',()=>{
        state.theme=$('theme').value;
        const url=new URL(location.href);if(state.theme)url.searchParams.set('theme',state.theme);else url.searchParams.delete('theme');
        history.replaceState(null,'',url);render();
      });
      if(config.attachment){
        $('attachment-info').hidden=false;
        $('attachment-text').textContent='App content: '+config.attachment.content+' · Existing screens: '+config.attachment.appRoot;
      }
      render();
      try {
        const sources=await Promise.all(state.catalog.tokenFiles.map(async file=>({file,text:await fetchData(new URL(file,state.base),'text')})));
        state.tokens=sources.flatMap(({file,text})=>M.parseTokens(text,file));
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
