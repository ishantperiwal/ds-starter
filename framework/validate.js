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
function files(root){if(!fs.existsSync(root))return [];return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(root,entry.name)):entry.isFile()?[path.join(root,entry.name)]:[]);}
function validate(root=ROOT){
  const errors=[],warnings=[],counts={};
  const schema=JSON.parse(fs.readFileSync(path.join(root,'framework/catalog.schema.json'),'utf8'));
  const config=JSON.parse(fs.readFileSync(path.join(root,'studio.config.json'),'utf8'));
  const profiles=[['project',path.join(root,config.project,'design-system')],['demo',path.join(root,config.examples)]];
  for(const [profile,base] of profiles){
    const registry=JSON.parse(fs.readFileSync(path.join(base,'registry.json'),'utf8'));
    errors.push(...validateSchema(registry,schema).map(error=>profile+' '+error));
    const ids=new Set(),entries=['components','compositions','patterns','visualizations','screens','icons'].flatMap(key=>registry[key]||[]);
    for(const entry of entries){
      if(ids.has(entry.id))errors.push(profile+': duplicate entry ID '+entry.id);ids.add(entry.id);
      for(const field of ['preview','css','module'])if(entry[field]){
        const relative=entry[field].split(/[?#]/)[0],target=path.resolve(base,relative);
        const allowed=profile==='demo'?path.join(root,config.examples):path.join(root,config.project);
        if(/^(?:[a-z]+:|\/)/i.test(relative)||!target.startsWith(allowed+path.sep)||!fs.existsSync(target))errors.push(profile+': missing/unsafe '+field+' '+entry[field]);
      }
    }
    for(const file of [...registry.tokenFiles,...registry.themes.map(t=>t.file)])if(!fs.existsSync(path.join(base,file)))errors.push(profile+': missing token/theme file '+file);
    const css=files(base).filter(file=>file.endsWith('.css'));
    const text=css.map(file=>fs.readFileSync(file,'utf8')).join('\n');
    const definitions=new Set(Array.from(text.matchAll(/(--[\w-]+)\s*:/g),match=>match[1]));
    for(const entry of entries)for(const spacing of entry.anatomy?.spacing||[])if(!definitions.has(spacing.token))errors.push(profile+': missing anatomy token '+spacing.token);
    for(const file of css){
      const source=fs.readFileSync(file,'utf8');
      for(const match of source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)/g))if(!fs.existsSync(path.resolve(path.dirname(file),match[1])))errors.push('Missing CSS import '+path.relative(root,file)+' → '+match[1]);
    }
    const screens=files(profile==='demo'?path.join(base,'screens'):path.join(root,config.project,'screens')).filter(file=>file.endsWith('.html'));
    const callsites=screens.map(file=>fs.readFileSync(file,'utf8')).join('\n');
    counts[profile]={components:registry.components.length,compositions:registry.compositions.length,patterns:registry.patterns.length,screens:registry.screens.length,registeredClassesSeen:registry.components.filter(entry=>new RegExp('\\b'+entry.class+'\\b').test(callsites)).length};
    if(registry.components.length)warnings.push(profile+': class counts are static heuristics; dynamic renderers and computed cascade require browser verification.');
  }
  for(const file of [...files(path.join(root,'framework')),...files(path.join(root,config.project))]){
    try{
      if(file.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
      if(file.endsWith('.html'))for(const match of fs.readFileSync(file,'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:file});
    }catch(error){errors.push(error.message);}
  }
  return {errors,warnings,counts};
}
module.exports={validate,validateSchema,files};
if(require.main===module){const result=validate();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
