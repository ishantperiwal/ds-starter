'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
function fileMap(directory){
  const map={};
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Release contains a symlink: '+file);
    if(entry.isDirectory())walk(file);else if(entry.isFile())map[path.relative(directory,file).split(path.sep).join('/')]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }}walk(directory);return map;
}
function writeLock(root=ROOT){const version=JSON.parse(fs.readFileSync(path.join(root,'framework/version.json'),'utf8'));const lock={...version,files:fileMap(path.join(root,'framework'))};fs.writeFileSync(path.join(root,'framework.lock.json'),JSON.stringify(lock,null,2)+'\n');return lock;}
function check(root=ROOT){const lock=JSON.parse(fs.readFileSync(path.join(root,'framework.lock.json'),'utf8')),actual=fileMap(path.join(root,'framework'));return [...new Set([...Object.keys(lock.files),...Object.keys(actual)])].filter(key=>lock.files[key]!==actual[key]);}
function release(output,root=ROOT){
  output=path.resolve(output);if(fs.existsSync(output))throw Error('Release destination must not exist');
  if(output===root||output.startsWith(path.resolve(root)+path.sep))throw Error('Build releases outside the source tree');
  const dirty=check(root);if(dirty.length)throw Error('Framework lock is stale; maintainer must review changes and run --write-lock first.');
  fs.mkdirSync(output,{recursive:true});fs.cpSync(path.join(root,'framework'),path.join(output,'framework'),{recursive:true,errorOnExist:true});fs.copyFileSync(path.join(root,'framework.lock.json'),path.join(output,'manifest.json'));return output;
}
module.exports={fileMap,writeLock,check,release};
if(require.main===module){try{
  const args=process.argv.slice(2);
  if(args[0]==='--write-lock'){writeLock();console.log('Framework lock recorded. Review and commit it with the release.');}
  else if(args[0]==='--output'&&args[1])console.log('Release: '+release(args[1]));
  else if(args[0]==='--check'){const dirty=check();console.log(dirty.length?'Changed framework files:\n'+dirty.join('\n'):'Framework matches lock');if(dirty.length)process.exitCode=1;}
  else throw Error('Usage: node framework/release.js --check | --write-lock | --output <new-directory>');
}catch(error){console.error(error.message);process.exitCode=1;}}
