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
test('overview is a real catalog ledger and never invents adoption measurements',()=>{
  const result=V.render(state);
  assert(result.html.includes('wb-ledger'));
  assert(result.html.includes('Not measured'));
  assert(result.html.includes('registration is not usage'));
  for(const entry of M.blocks(catalog))assert(result.html.includes('#components/'+encodeURIComponent(entry.id)));
  assert(!result.html.includes('28%'));
});
test('components expose real previews, width controls, source links and readable anatomy',()=>{
  const html=V.render({...state,tab:'components',theme:'soft'}).html;
  assert.equal((html.match(/<iframe /g)||[]).length,M.blocks(catalog).length);
  assert(html.includes('theme=soft'));
  assert(html.includes('data-width="320px"'));
  assert(html.includes('Spacing relationships'));
  assert(html.includes('Spacing ownership'));
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
