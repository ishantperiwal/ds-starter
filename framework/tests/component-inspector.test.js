const test=require('node:test');
const assert=require('node:assert/strict');
const {registered,reference}=require('../workbench/component-inspector.js');
test('component inspection requires a real catalog class match',()=>{
 const catalog=[{id:'button',name:'Button',class:'ds-button'}];
 const element=classes=>({classList:{contains:cls=>classes.includes(cls)}});
 assert.equal(registered(element(['button-shaped-container']),catalog),null);
 assert.equal(registered(element(['ds-button','ds-button--compact']),catalog).id,'button');
});
test('basic element references preserve their selector and actual enclosing owner',()=>{
 const value=reference({name:'Row',kind:'Row',selector:'.panel > div:nth-of-type(2)',hierarchy:'App switcher → Row',owner:'App switcher (launcher)',css:'components/launcher.css',preview:'http://localhost/specimen.html'});
 assert.match(value,/Basic element within the composition/);assert.doesNotMatch(value,/unregistered/i);assert.match(value,/Selector: \.panel > div:nth-of-type\(2\)/);assert.match(value,/Owning component: App switcher \(launcher\)/);assert.doesNotMatch(value,/Component ID:/);
});
test('registered references include stable catalog identity and sources',()=>{
 const value=reference({name:'Button',kind:'Registered component',id:'button',selector:'.ds-button',hierarchy:'Row → Button',owner:'Button (button)',css:'button.css',module:'button.js',preview:'http://localhost/example'});
 assert.match(value,/Component ID: button/);assert.match(value,/Module: button.js/);assert.doesNotMatch(value,/Unregistered/);
});

 test('inspection excludes gallery wrappers while keeping nested component anatomy',()=>{
  const {componentLayers}=require('../workbench/component-inspector.js');
  const node=(parent,classes=[])=>({parentElement:parent,classList:{contains:c=>classes.includes(c)},closest:()=>null,getClientRects:()=>[{}]});
  const body=node(null),grid=node(body),cell=node(grid),caption=node(cell),component=node(cell,['panel']),container=node(component),child=node(container,['button']),text=node(child);
  const catalog=[{class:'panel'},{class:'button'}];
  assert.deepEqual(componentLayers(caption,body,catalog),[]);
  assert.deepEqual(componentLayers(cell,body,catalog),[]);
  assert.deepEqual(componentLayers(text,body,catalog),[text,child,container,component]);
  assert.deepEqual(componentLayers(component,body,catalog),[component]);
 });

test('variant labels resolve registered names without guessing from content or state',()=>{
 const {variantName}=require('../workbench/component-inspector.js');
 const entry={id:'item',class:'item',variants:['Default'],interactions:{targets:[{id:'default',name:'Default'},{id:'trailing',name:'With trailing action',inspectorSelector:'.row > .item'},{id:'child',name:'Child variant',owner:'child'}]}};
 const el=(value,selectors=[],classes=[])=>({getAttribute:()=>value,matches:s=>selectors.includes(s),classList:{contains:c=>classes.includes(c)}});
 assert.equal(variantName(el('trailing'),entry),'With trailing action');
 assert.equal(variantName(el(null,['.row > .item']),entry),'With trailing action');
 assert.equal(variantName(el(null,[],['item--trailing']),entry),'');
 assert.equal(variantName(el('unknown'),entry),'');
 assert.equal(variantName(el('child'),entry),'');
 assert.equal(variantName(el(null,[],['selected']),entry),'');
 assert.equal(variantName(el(null),entry),'');
 assert.equal(variantName(el(null),null),'');
 const ambiguous={...entry,interactions:{targets:[{name:'A',inspectorSelector:'.a'},{name:'B',inspectorSelector:'.b'}]}};
 assert.equal(variantName(el(null,['.a','.b']),ambiguous),'');
});
