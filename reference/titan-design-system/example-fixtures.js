/* Workbench iframe only: deterministic examples; never loaded by CRM pages. */
(function () {
  const cards = [
    {id:1,company:'Northstar Studio',contact:'Alex Morgan',initials:'AM',deal:'Team subscription',value:12000,stage:'qualified',contactEmail:'alex@example.com'},
    {id:2,company:'Harbor Design',contact:'Sam Taylor',initials:'ST',deal:'Annual subscription',value:8000,stage:'proposal',contactEmail:'sam@example.com'},
    {id:3,company:'Cedar Labs',contact:'Jordan Lee',initials:'JL',deal:'Pilot project',value:4000,stage:'lead',contactEmail:'jordan@example.com'}
  ].map(card => ({...card,lastActivity:'Today',activityType:'Note added',overdue:false,website:'',currency:'USD'}));
  const data = {currentPipelineId:'neo',pipelineSeq:1,pipelines:{neo:{id:'neo',name:'Example partnerships',entity:'Opportunity',plural:'opportunities',type:'sales',color:'#7a6ba3',stages:[{key:'lead',label:'Lead'},{key:'qualified',label:'Qualified'},{key:'proposal',label:'Proposal'},{key:'closed',label:'Closed'}],cards,hiddenFields:[],customFieldDefs:[],contactsEnabled:true}}};
  if(window.__DS_EXAMPLE_KEY==='--layout-section-gap') {
    data.pipelines.harbor={...data.pipelines.neo,id:'harbor',name:'Example renewals',color:'#25a9a1',cards:[{...cards[0],id:4,value:6000,company:'Pine Studio'}]};
  }
  // Keep page preferences and draft state isolated from the user's CRM session.
  ['localStorage','sessionStorage'].forEach(name=>{
    const values=new Map();
    Object.defineProperty(window,name,{value:{getItem:key=>values.has(String(key))?values.get(String(key)):null,setItem:(key,value)=>values.set(String(key),String(value)),removeItem:key=>values.delete(String(key)),clear:()=>values.clear(),key:index=>Array.from(values.keys())[index] || null,get length(){return values.size;}}});
  });
  window.fetch = async function (input,init) {
    const url=new URL(typeof input==='string'?input:input.url,document.baseURI);
    const method=(init && init.method || input.method || 'GET').toUpperCase();
    if(method!=='GET' && method!=='HEAD') return new Response(JSON.stringify({error:'Read-only design example'}),{status:403});
    if(url.pathname==='/api/data') return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
    if(url.pathname==='/api/sequences') return new Response(JSON.stringify({sequences:[]}),{headers:{'Content-Type':'application/json'}});
    return new Response(JSON.stringify({error:'Not available in design example'}),{status:404,headers:{'Content-Type':'application/json'}});
  };
  navigator.sendBeacon=()=>false;
  window.XMLHttpRequest=function(){throw new Error('Network disabled in design example');};
  window.WebSocket=function(){throw new Error('Network disabled in design example');};
})();
