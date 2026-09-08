'use strict';
const fs=require('node:fs'),path=require('node:path');
const {fileMap,check}=require('./release');
const ROOT=path.resolve(__dirname,'..');
function plan(from,root=ROOT){
  from=path.resolve(from);
  const manifest=JSON.parse(fs.readFileSync(path.join(from,'manifest.json'),'utf8'));
  const current=JSON.parse(fs.readFileSync(path.join(root,'framework.lock.json'),'utf8'));
  if(manifest.contractVersion!==current.contractVersion)throw Error('Contract migration required; automatic replacement is disabled.');
  if(!/^\d+\.\d+\.\d+$/.test(manifest.version))throw Error('Invalid release version');
  const actual=fileMap(path.join(from,'framework'));
  if(JSON.stringify(Object.entries(actual).sort())!==JSON.stringify(Object.entries(manifest.files).sort()))throw Error('Release hash verification failed');
  const version=JSON.parse(fs.readFileSync(path.join(from,'framework/version.json'),'utf8'));
  if(version.version!==manifest.version||version.contractVersion!==manifest.contractVersion)throw Error('Version metadata mismatch');
  const dirty=check(root);if(dirty.length)throw Error('Local framework edits would be overwritten: '+dirty.join(', '));
  const changed=[...new Set([...Object.keys(current.files),...Object.keys(manifest.files)])].filter(key=>current.files[key]!==manifest.files[key]);
  return {from,root,current,manifest,changed};
}
function apply(from,root=ROOT){
  const result=plan(from,root);if(!result.changed.length)return {...result,backup:null};
  const backups=path.join(root,'.framework-backups');fs.mkdirSync(backups,{recursive:true});
  const backup=fs.mkdtempSync(path.join(backups,'release-'));
  const staged=path.join(backup,'incoming');fs.cpSync(path.join(result.from,'framework'),staged,{recursive:true});
  if(JSON.stringify(Object.entries(fileMap(staged)).sort())!==JSON.stringify(Object.entries(result.manifest.files).sort()))throw Error('Release changed while staging; installed framework was not touched');
  fs.copyFileSync(path.join(root,'framework.lock.json'),path.join(backup,'framework.lock.json'));
  fs.renameSync(path.join(root,'framework'),path.join(backup,'framework'));
  try{
    fs.renameSync(staged,path.join(root,'framework'));
    fs.writeFileSync(path.join(root,'framework.lock.json'),JSON.stringify(result.manifest,null,2)+'\n');
  }catch(error){
    if(fs.existsSync(path.join(root,'framework')))fs.renameSync(path.join(root,'framework'),path.join(backup,'failed-incoming'));
    fs.renameSync(path.join(backup,'framework'),path.join(root,'framework'));
    fs.copyFileSync(path.join(backup,'framework.lock.json'),path.join(root,'framework.lock.json'));throw error;
  }
  return {...result,backup};
}
module.exports={plan,apply};
if(require.main===module){try{
  const args=process.argv.slice(2),index=args.indexOf('--from');if(index<0||!args[index+1])throw Error('Usage: node framework/update.js --from <release-directory> [--apply]');
  const result=args.includes('--apply')?apply(args[index+1]):plan(args[index+1]);
  console.log(JSON.stringify({fromVersion:result.current.version,toVersion:result.manifest.version,changed:result.changed,applied:args.includes('--apply'),backup:result.backup||null,project:'untouched'},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}}
