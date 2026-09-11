'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
// Small, explicit validator for the schema vocabulary used by catalog.schema.json.
// This is not a general JSON Schema engine; extend both together or use Ajv externally.
function validateSchema(value,schema,root=schema,location='$'){
  const errors=[];
  if(schema.$ref){const ref=schema.$ref.slice(2).split('/').reduce((v,k)=>v[k],root);return validateSchema(value,ref,root,location);}
  for(const branch of schema.allOf||[])errors.push(...validateSchema(value,branch,root,location));
  if(schema.const!==undefined&&value!==schema.const)errors.push(location+': unexpected contract version');
  const type=Array.isArray(value)?'array':value===null?'null':typeof value;
  if(schema.type&&type!==schema.type)return errors.concat(location+': expected '+schema.type);
  if(typeof value==='string'){
    if(schema.minLength&&value.length<schema.minLength)errors.push(location+': empty value');
    if(schema.pattern&&!new RegExp(schema.pattern).test(value))errors.push(location+': invalid format');
  }
  if(Array.isArray(value)){
    if(schema.minItems&&value.length<schema.minItems)errors.push(location+': requires entries');
    if(schema.items)value.forEach((entry,i)=>errors.push(...validateSchema(entry,schema.items,root,location+'['+i+']')));
  }else if(value&&typeof value==='object'){
    for(const key of schema.required||[])if(!(key in value))errors.push(location+': missing '+key);
    for(const [key,child] of Object.entries(schema.properties||{}))if(key in value)errors.push(...validateSchema(value[key],child,root,location+'.'+key));
  }
  return errors;
}
function files(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root,{withFileTypes:true}).filter(entry=>!entry.name.startsWith('.') && entry.name!=='node_modules').flatMap(entry=>
    entry.isDirectory()?files(path.join(root,entry.name)):entry.isFile()?[path.join(root,entry.name)]:[]);
}
function validate(root=ROOT, configFile) {
  const errors=[],warnings=[],counts={};
  const {runtimePaths}=require('./configuration');
  const {catalogFile}=require('./public-files');
  let paths;
  try {paths=runtimePaths(root,configFile);} catch(error) {return {errors:[error.message],warnings,counts};}
  const schema=JSON.parse(fs.readFileSync(path.join(root,'framework/catalog.schema.json'),'utf8'));
  const profiles=[['project',paths.content],['demo',paths.examples]];
  const inspected=new Set(files(path.join(root,'framework')));
  for(const [profile,base] of profiles) {
    let registry;
    try {registry=JSON.parse(fs.readFileSync(path.join(base,'registry.json'),'utf8'));}
    catch(error) {errors.push(profile+': '+error.message);continue;}
    const schemaErrors=validateSchema(registry,schema);
    errors.push(...schemaErrors.map(error=>profile+' '+error));
    if(schemaErrors.length) continue;
    const resolve=relative=>{
      try {return catalogFile(paths,relative,profile);} catch {return null;}
    };
    const ids=new Set(),entries=['components','compositions','patterns','visualizations','screens','icons'].flatMap(key=>registry[key]);
    const screenFiles=new Set();
    for(const entry of entries) {
      if(ids.has(entry.id)) errors.push(profile+': duplicate entry ID '+entry.id);
      ids.add(entry.id);
      if(entry.previewConfigurations!==undefined){
        if(!Array.isArray(entry.previewConfigurations)||!entry.previewConfigurations.length)errors.push(profile+': '+entry.id+' requires nonempty previewConfigurations');
        else {const configs=new Set();for(const config of entry.previewConfigurations){
          if(!config.id||!config.name||configs.has(config.id))errors.push(profile+': '+entry.id+' has an unnamed or duplicate preview configuration');
          configs.add(config.id);
          if(entry.previewConfigurations.length>1&&!config.selector)errors.push(profile+': '+entry.id+' configuration '+config.id+' requires a source selector');
          if(config.preview||config.url)errors.push(profile+': '+entry.id+' configurations must use the shared entry.preview source');
          if(config.interactionTarget&&entry.interactions?.targets?.length&&!entry.interactions.targets.some(t=>t.id===config.interactionTarget))errors.push(profile+': '+entry.id+' has unknown interaction target '+config.interactionTarget);
        }}
      }
      for(const field of ['preview','css','module']) if(entry[field]) {
        const file=resolve(entry[field]);
        if(!file) errors.push(profile+': missing/unsafe '+field+' '+entry[field]);
        else {inspected.add(file);if(field==='preview')screenFiles.add(file);}
      }
    }
    for(const file of [...registry.tokenFiles,...registry.themes.map(t=>t.file)]) {
      // Foundation and theme files must be app-owned, not borrowed from another mount.
      const target=resolve(file);
      if(!target || !target.startsWith(fs.realpathSync(base)+path.sep)) errors.push(profile+': missing/unsafe token/theme file '+file);
    }
    const owned=files(base);owned.forEach(file=>inspected.add(file));
    const css=owned.filter(file=>file.endsWith('.css'));
    const uncommented=file=>fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    const text=css.map(uncommented).join('\n');
    const definitions=new Set(Array.from(text.matchAll(/(--[\w-]+)\s*:/g),match=>match[1]));
    for(const entry of entries) for(const spacing of entry.anatomy?.spacing||[]) {
      if(!definitions.has(spacing.token))errors.push(profile+': missing anatomy token '+spacing.token);
    }
    for(const file of css) {
      for(const match of uncommented(file).matchAll(/@import\s+(?:url\()?['"]([^'"]+)/g)) {
        const relative=path.relative(base,file).split(path.sep).join('/');
        const url=new URL(match[1],new URL(relative,'http://studio.local/'+(profile==='demo'?'demo/':'')+'design-system/'));
        const imported=resolve(path.posix.relative('/'+(profile==='demo'?'demo/':'')+'design-system',url.pathname));
        if(url.origin!=='http://studio.local'||!imported) errors.push('Missing/unsafe CSS import '+file+' → '+match[1]);
      }
    }
    if(profile==='demo')files(path.join(base,'screens')).filter(file=>file.endsWith('.html')).forEach(file=>screenFiles.add(file));
    else if(paths.screens)files(paths.screens).filter(file=>file.endsWith('.html')).forEach(file=>screenFiles.add(file));
    const callsites=[...screenFiles].map(file=>fs.readFileSync(file,'utf8')).join('\n');
    counts[profile]={components:registry.components.length,compositions:registry.compositions.length,patterns:registry.patterns.length,screens:registry.screens.length,registeredClassesSeen:registry.components.filter(entry=>new RegExp('\\b'+entry.class+'\\b').test(callsites)).length};
    if(registry.components.length)warnings.push(profile+': class counts are static heuristics; dynamic renderers and computed cascade require browser verification.');
  }
  for(const file of inspected) {
    try {
      const source=fs.readFileSync(file,'utf8');
      if(file.endsWith('.mjs') || (file.endsWith('.js') && /^\s*(?:import|export)\s/m.test(source))) {
        warnings.push('Use the app module/build checker for '+file);
      } else if(file.endsWith('.js'))new vm.Script(source,{filename:file});
      if(file.endsWith('.html')) for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        if(/\btype\s*=\s*['"](?:module|application\/(?:ld\+)?json)['"]/i.test(match[1]))continue;
        new vm.Script(match[2],{filename:file});
      }
    } catch(error) {errors.push(error.message);}
  }
  return {errors,warnings,counts};
}
module.exports={validate,validateSchema,files};
if(require.main===module) {
  const i=process.argv.indexOf('--config');
  const result=validate(ROOT,i<0?undefined:process.argv[i+1]);
  console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;
}
