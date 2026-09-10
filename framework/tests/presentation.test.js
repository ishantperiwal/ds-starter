'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../workbench/model'),V=require('../workbench/views');
const ROOT=path.resolve(__dirname,'../..');
const catalog=M.normalize(JSON.parse(fs.readFileSync(path.join(ROOT,'framework/examples/registry.json'),'utf8')));
const empty=M.normalize(JSON.parse(fs.readFileSync(path.join(ROOT,'project/design-system/registry.json'),'utf8')));
const tokens=catalog.tokenFiles.flatMap(file=>M.parseTokens(fs.readFileSync(path.join(ROOT,'framework/examples',file),'utf8'),file));
const state={catalog,tokens,base:'http://localhost/demo/design-system/',theme:'',tab:'overview'};
test('sidebar has the same eight sections with registry-derived counts, not Titan totals',()=>{
  const nav=V.navigation(catalog,tokens,'components'),counts=M.counts(catalog,tokens);
  assert.equal(V.tabs.length,8);
  assert.equal((nav.match(/aria-current="page"/g)||[]).length,1);
  assert.equal(counts.components,catalog.components.length+catalog.compositions.length);
  assert.equal(counts.icons,catalog.icons.length);
  assert.equal(counts.foundations,new Set(tokens.map(row=>row.name)).size);
  assert(!nav.includes('28%'));
  assert(nav.includes('Mood board'));
});
test('all sections render populated and empty app catalogs without changing their content',()=>{
  const before=JSON.stringify(catalog);
  for(const [tab] of V.tabs){
    const full=V.render({...state,tab});
    const blank=V.render({...state,catalog:empty,tokens:[],tab});
    assert(full.title && full.html,tab);
    assert(blank.title && blank.html,tab+' empty');
    assert(!/undefined|NaN/.test(blank.html),tab+' empty');
  }
  assert.equal(JSON.stringify(catalog),before);
});
test('overview keeps catalog totals and screens without the removed adoption sheet',()=>{
  const result=V.render(state);
  assert(!result.html.includes('wb-ledger'));
  assert(!result.html.includes('Not measured'));
  assert(!result.html.includes('product adoption'));
  assert(!result.html.includes('Filter building blocks'));
  assert(result.html.includes('foundation-count'));
  assert(!result.html.includes('registration is not usage'));
  assert.equal(result.intro,'');

  assert(!result.html.includes('28%'));
});
test('components expose real previews, width controls, source links and readable anatomy',()=>{
  const html=V.render({...state,tab:'components',theme:'soft'}).html;
  assert.equal((html.match(/<iframe /g)||[]).length,M.blocks(catalog).length);
  assert(html.includes('theme=soft'));
  assert(!html.includes('Spacing ownership'));
  assert(html.includes('aria-haspopup="dialog"'));
  const details=V.componentDetails(catalog.components[0],state);
  assert(!details.includes('data-width="320px"'));
  assert(!details.includes('>Fluid<'));
  assert(details.indexOf('class="wb-spec-head"')<details.indexOf('class="wb-spec-body"'));
  assert(details.indexOf('class="cg-view-toggle"')<details.indexOf('</header>'));
  assert(details.includes('Spacing relationships'));
  assert(details.includes('Spacing ownership'));
  assert(html.includes('id="entry-'+catalog.components[0].id+'"'));
});
test('patterns show live examples and structure/behavior contracts instead of raw JSON alone',()=>{
  const html=V.render({...state,tab:'patterns'}).html;
  assert(html.includes('wb-pattern-body'));
  assert(html.includes('Use when'));
  assert(html.includes('Requirements'));
  assert(html.includes('Structure'));
  assert.equal((html.match(/<iframe /g)||[]).length,catalog.patterns.length);
});
test('foundation index preserves scope, resolves only simple root aliases and handles cycles',()=>{
  const rows=M.parseTokens('/* --fake: 5px; */ :root {--space:12px;--gap:var(--space);--quoted:"a;b";--cycle:var(--cycle)} .local {--space:24px;} @media (width > 700px) { :root {--space:32px;} }','tokens.css');
  assert.equal(rows.length,6);
  assert.equal(M.resolveLiteral(rows[1],rows),'12px');
  assert.equal(M.resolveLiteral(rows[3],rows),null);
  assert.equal(M.resolveLiteral(rows[4],rows),null);
  assert.equal(M.resolveLiteral(rows[5],rows),null);
  assert.equal(rows[5].scope,'@media (width > 700px) / :root');
  assert.equal(rows[2].value,'"a;b"');
  assert.equal(M.counts(catalog,rows).foundations,4);
  const html=V.render({...state,tab:'foundations',tokens:rows}).html;
  assert(html.includes('Token')||html.includes('token'));
  assert(html.includes('.local'));
  assert(html.includes('tokens.css'));
});
test('all app themes stay in preview URLs; the shell imports only studio styles',()=>{
  const html=fs.readFileSync(path.join(ROOT,'framework/workbench/index.html'),'utf8');
  const sheets=[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(sheets,['/framework/workbench/presentation.css','/framework/workbench/studio.css']);
  const directions=V.render({...state,tab:'directions'}).html;
  for(const theme of catalog.themes)assert(directions.includes('theme='+theme.id));
  assert.equal((directions.match(/<iframe /g)||[]).length,catalog.themes.length);
});
test('app content is escaped, cross-origin previews fail and deep links round-trip',()=>{
  const altered=structuredClone(catalog);
  altered.components[0].name='<img src=x onerror=alert(1)>';
  const html=V.render({...state,catalog:altered,tab:'components'}).html;
  assert(!html.includes('<img src=x'));
  assert(html.includes('&lt;img'));
  assert.throws(()=>M.previewURL({preview:'https://example.invalid'},state.base),/same-origin/);
  assert.throws(()=>M.previewURL({preview:'javascript:alert(1)'},state.base));
  assert.deepEqual(M.route('#components/my%20component'),{tab:'components',entry:'my component'});
  assert.deepEqual(M.route('#components/%'),{tab:'components',entry:null});
});

test('foundation roles use appropriate visual families without changing declarations',()=>{
  const rows=M.parseTokens(':root{--blue:#2170f4;--action:var(--blue);--type-body-size:14px;--card-spacing:12px;--card-radius:4px}','app.css');
  assert.equal(M.family(rows[1],rows),'Color');assert.equal(M.family(rows[2],rows),'Typography');assert.equal(M.family(rows[3],rows),'Spacing');assert.equal(M.family(rows[4],rows),'Shape & elevation');
  const cat={...catalog,foundationPresentation:{tokens:{'--type-body-size':{label:'Body',sample:'A readable sentence.',weight:400}}}};
  const before=JSON.stringify(rows);
  const types=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'typography'}).html;
  assert(!types.includes('fd-details'));assert(types.includes('A readable sentence.'));assert(types.includes('fd-type-row'));assert(!types.includes('wb-token-sample'));
  const publicCopy=types.replace(/<details class="fd-details">[\s\S]*?<\/details>/g,'').replace(/<[^>]+>/g,'');
  assert(!publicCopy.includes('app.css'));assert(!publicCopy.includes(':root'));assert(publicCopy.includes('--type-body-size'));
  const colors=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'colors'}).html.replace(/<details class="fd-details">[\s\S]*?<\/details>/g,'').replace(/<[^>]+>/g,'');
  assert(colors.includes('--blue'));assert(colors.includes('--action'));assert(!colors.includes('app.css'));
  const spacing=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'spacing'}).html;assert(spacing.includes('fd-space-distance'));
  const radius=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'roundness'}).html;assert(radius.includes('fd-radius-object'));assert(!radius.includes('fd-corner-curve'));assert(!radius.includes('fd-status'));
  assert.equal(JSON.stringify(rows),before);
});

test('explicit semantic layers stay out of Foundations while primitives remain visible',()=>{
  const rows=M.parseTokens(':root{--font-size-14:14px;--body-size:var(--font-size-14)}','tokens.css');
  const cat={...catalog,foundationPresentation:{tokens:{'--font-size-14':{layer:'primitive'},'--body-size':{layer:'semantic'}}}};
  const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'typography'}).html;
  assert(html.includes('--font-size-14'));assert(!html.includes('--body-size'));
  assert.equal(M.resolveLiteral(rows[1],rows),'14px');
});

test('text styles expose shared primitive references and draft specimens',()=>{
  const rows=M.parseTokens(':root{--font-size-14:14px;--font-weight-regular:400}','tokens.css');
  const cat={...catalog,foundationPresentation:{textStyles:[{id:'body',name:'Body',sample:'Reading text',size:'--font-size-14',weight:'--font-weight-regular'},{id:'label',name:'Label',sample:'Short label',size:'--font-size-14'}]}};
  const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'text-styles'}).html;
  assert(html.includes('data-foundation-panel="text-styles" data-selected="true"'));
  assert.equal((html.match(/data-token="--font-size-14"/g)||[]).length,1);
  assert(html.includes('Reading text'));assert(!html.includes('Draft'));assert(html.includes('class="ts-links"'));
});

test('color relationships resolve existing aliases without displaying contrast ratios',()=>{
  const rows=M.parseTokens(':root{--black:#000;--white:#fff;--text:var(--black);--surface:var(--white)}','colors.css');
  const cat={...catalog,foundationPresentation:{colorRoles:[{token:'--text',label:'Primary text',kind:'text',background:'--surface'}]}};
  const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'color-roles'}).html;
  assert(html.includes('data-foundation-panel="color-roles" data-selected="true"'));
  assert(html.includes('data-token="--black"'));assert(!html.includes('21.00:1'));assert(!html.includes('cm-pair'));
  assert(html.includes('--text'));assert(!html.includes('class="cb-detail"'));
});

test('spacing relationships show measured gaps and insets with explicit references',()=>{
 const rows=M.parseTokens(':root{--space-16:16px;--header-gap:var(--space-16);--panel-inset:var(--space-16)}','spacing.css');
 const cat={...catalog,foundationPresentation:{spacingRoles:[{token:'--header-gap',primitive:'--space-16',kind:'gap',label:'Header gap'},{token:'--panel-inset',primitive:'--space-16',kind:'block',label:'Panel inset'}]}};
 const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'spacing'}).html;
 assert(html.includes('data-spacing-kind="gap" data-spacing-value="16px"'));
 assert(html.includes('data-spacing-kind="block" data-spacing-value="16px"'));
 assert(html.includes('data-token="--space-16"'));assert(html.includes('Vertical inset'));
 assert.equal((html.match(/class="sm-value-group"/g)||[]).length,1);
 assert.equal((html.match(/aria-expanded="false"/g)||[]).length,2);
});

test('elevation roles render in their own Foundations panel without exposing semantic tokens as primitives',()=>{
 const rows=M.parseTokens(':root{--elevation-card:0 1px 2px rgba(0,0,0,.02);--elevation-flyout:0 3px 8px #0001}','elevation.css');
 const cat={...catalog,foundationPresentation:{tokens:{'--elevation-card':{layer:'semantic'},'--elevation-flyout':{layer:'semantic'}},elevationRoles:[{token:'--elevation-card',label:'Card',kind:'box-shadow'},{token:'--elevation-flyout',label:'Flyout',kind:'drop-shadow'}]}};
 const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'elevation'}).html;
 assert(html.includes('href="#foundations/elevation"'));
 assert(html.includes('data-foundation-panel="elevation" data-selected="true"'));
 assert(html.includes('--elevation-card'));assert(html.includes('box-shadow:0 1px 2px rgba(0,0,0,.02)'));
 assert(html.includes('filter:drop-shadow(0 3px 8px #0001)'));
});

test('text-stack spacing specimens measure the assigned gap',()=>{
 const rows=M.parseTokens(':root{--space-3:3px;--text-gap:var(--space-3)}','spacing.css');
 const cat={...catalog,foundationPresentation:{spacingRoles:[{token:'--text-gap',primitive:'--space-3',kind:'stack',preview:'text-stack',label:'Tight text'}]}};
 const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'spacing'}).html;
 assert(html.includes('data-spacing-kind="stack" data-spacing-value="3px"'));
 assert(html.includes('sm-text-gap'));assert(html.includes('To you · 10:30 AM'));
});
test('component category controls include All and preserve categories on searchable cards',()=>{
 const app=structuredClone(catalog);app.components=app.components.slice(0,2);app.compositions=[];
 app.components[0].category='Buttons';app.components[1].category='Messages';
 const html=V.render({...state,catalog:app,tab:'components',componentCategory:'Messages'}).html;
 assert(html.includes('class="fd-tabs cg-tabs"'));
 assert(html.includes('data-component-category="All"'));
 assert(html.includes('data-component-category="Messages" aria-pressed="true"'));
 assert(html.includes('data-category="Buttons"'));
 assert.equal((html.match(/class="cg-card wb-filterable"/g)||[]).length,2);
});
test('detail spacing adapter mounts the reference inspector with a default root and cleans its load listener',()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync(path.join(ROOT,'framework/workbench/studio.js'),'utf8');
 const code=source.slice(source.indexOf('  function bindComponentSpacing('),source.indexOf('  let galleryPreviewCleanups='));
 const events={},mounted=[],sheets=[];
 const main={dataset:{},querySelector:()=>null,firstChild:null,append:()=>{}};
 const doc={querySelector:()=>main,head:{append:el=>sheets.push(el)},createElement:()=>({append:()=>{}})};
 const preview={isConnected:true,contentDocument:doc,contentWindow:{wbAnatomy:{mount:(...args)=>mounted.push(args)}},addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};
 const bind=vm.runInNewContext(code+';bindComponentSpacing');
 const cleanup=bind(preview,{name:'Button',class:'sample-button',anatomy:{parts:[],spacing:[]}});
 assert.equal(mounted.length,1);assert.equal(mounted[0][1].anatomy.specimen,'.sample-button');
 assert.equal(sheets[0].href,'/framework/workbench/component-spacing.css');
 events.load();assert.equal(mounted.length,1);cleanup();assert(!events.load);
});
test('spacing geometry includes right margins at the correct edge',()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync(path.join(ROOT,'framework/anatomy.js'),'utf8');
 const code=source.slice(source.indexOf('  function spacingBands('),source.indexOf('  function activeToken('));
 const bands=vm.runInNewContext(code+';spacingBands',{
  rectangle:()=>({x:10,y:20,width:100,height:30}),
  number:value=>parseFloat(value)||0,
  getComputedStyle:()=>({getPropertyValue:()=> '10px'})
 });
 const r=bands({}, {},'margin-right')[0];
 assert.deepEqual(JSON.parse(JSON.stringify(r)),{x:110,y:20,width:10,height:30});
});
test('external spacing controls set iframe inspector state directly, including a selection before load',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(ROOT,'framework/workbench/studio.js'),'utf8');
 const code=source.slice(source.indexOf('  function bindComponentSpacing('),source.indexOf('  let galleryPreviewCleanups='));
 const events={},modes=[],buttons=['preview','spacing','component'].map((mode,i)=>({dataset:{previewMode:mode},pressed:i===0,setAttribute(k,v){this.pressed=v==='true';},addEventListener(k,fn){this.click=fn;},removeEventListener(){}}));
 const controls={querySelector:()=>buttons.find(b=>b.pressed),querySelectorAll:()=>buttons};
 const main={dataset:{},querySelector:()=>null,firstChild:null,append:()=>{}};
 let loaded=false;
 const preview={isConnected:true,contentDocument:{querySelector:()=>loaded?main:null,head:{append:()=>{}},createElement:()=>({append:()=>{}})},contentWindow:{wbAnatomy:{mount:()=>{},setMode:(host,mode)=>modes.push(mode)}},addEventListener:(k,fn)=>events[k]=fn,removeEventListener:k=>delete events[k]};
 const bind=vm.runInNewContext(code+';bindComponentSpacing'),cleanup=bind(preview,{class:'button',anatomy:{}},controls);
 buttons[1].click();assert.equal(modes.length,0);
 loaded=true;events.load();assert.deepEqual(modes,['spacing']);
 buttons[2].click();assert.deepEqual(modes,['spacing','component']);
 buttons[0].click();assert.deepEqual(modes,['spacing','component','preview']);cleanup();
});

test('gallery exposes the class reference and only the dedicated expand control opens details',()=>{
 const html=V.render({...state,tab:'components'}).html;
 assert(html.includes('class="cg-expand" data-component='));
 assert(html.includes('class="cg-card-footer"'));
 assert(html.includes('data-preview-mode="component"'));
 assert(html.includes('data-preview-mode="spacing"'));
 assert(html.includes('<code>.'+catalog.components[0].class+'</code>'));
 assert(!html.includes('class="cg-open"'));
});

test('registered screens offer full-page links to the same themed URL as their preview',()=>{
 const themed={...state,theme:'soft'},html=V.render(themed).html;
 for(const screen of catalog.screens){
  const url=V.esc(M.previewURL(screen,state.base,'soft'));
  assert(html.includes('class="wb-screen-open" href="'+url+'" target="_blank" rel="noopener noreferrer"'));
 }
});
test('gallery widths are component-specific and bounded rather than interpolated as arbitrary CSS',()=>{
 const app=structuredClone(catalog);app.components[0].galleryWidth=608;
 let html=V.render({...state,catalog:app,tab:'components'}).html;
 assert(html.includes('--gallery-width:608px'));
 app.components[0].galleryWidth=2000;
 assert(V.render({...state,catalog:app,tab:'components'}).html.includes('--gallery-width:960px'));
 app.components[0].galleryWidth='1px;display:none';
 html=V.render({...state,catalog:app,tab:'components'}).html;
 assert(!html.includes('1px;display:none'));
});
test('interaction sidebar is optional and starts closed without loading its iframe',()=>{
 const app=structuredClone(catalog);app.components[0].interactions={preview:app.components[0].preview,targets:[{id:'main',name:'Main',states:['default','hover']}]};
 const html=V.render({...state,catalog:app,tab:'components'}).html;
 assert(html.includes('data-interactions="'+app.components[0].id+'"'));
 assert(html.includes('aria-controls="component-interactions" aria-expanded="false"'));
 assert(html.includes('tabindex="-1" hidden></aside>'));
 assert.equal((html.match(/<iframe /g)||[]).length,M.blocks(app).length);
});

test('elevation aliases share a primitive and preserve resolved samples',()=>{
 const rows=M.parseTokens(':root{--shadow-soft:0 1px 2px #0001;--elevation-card:var(--shadow-soft);--elevation-menu:var(--shadow-soft)}','elevation.css');
 const cat={...catalog,foundationPresentation:{elevationRoles:[{token:'--elevation-card',primitive:'--shadow-soft',label:'Card'},{token:'--elevation-menu',primitive:'--shadow-soft',label:'Menu',placement:'right'}]}};
 const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'elevation'}).html;
 assert.equal((html.match(/data-token="--shadow-soft"/g)||[]).length,1);
 assert.equal((html.match(/data-refs="\[&quot;--shadow-soft&quot;\]"/g)||[]).length,2);
 assert(html.includes('data-placement="right"'));
 assert(html.includes('box-shadow:0 1px 2px #0001'));
});

test('numbered elevation levels render borders and connect roles to level tokens',()=>{
 const rows=M.parseTokens(':root{--shadow:0 2px 4px #0001;--border:1px solid #ddd;--level-2:var(--shadow);--role:var(--level-2)}','elevation.css');
 const cat={...catalog,foundationPresentation:{elevationLevels:[{token:'--level-2',label:'Level 2',primitive:'--shadow',border:'--border'}],elevationRoles:[{token:'--role',label:'Raised',level:'--level-2',border:'--border'}]}};
 const html=V.render({...state,catalog:cat,tokens:rows,tab:'foundations',foundationSection:'elevation'}).html;
 assert(html.includes('Elevation levels'));
 assert(html.includes('data-token="--level-2"'));
 assert(html.includes('data-refs="[&quot;--level-2&quot;]"'));
 assert(html.includes('box-shadow:0 2px 4px #0001;border:1px solid #ddd'));
 assert(html.includes('→ Level 2'));
 assert(!html.includes('Level -1'));
 assert(html.includes('data-elevation-jump="0"'));
 assert(html.includes('id="elevation-level-0"'));
 assert(html.includes('aria-label="Go to Level 2"'));
 assert(html.includes('role="link" tabindex="0"'));
});
