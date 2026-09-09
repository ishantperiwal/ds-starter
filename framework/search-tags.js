const fs=require('node:fs'),path=require('node:path');
function save(content,{collection,id,searchTags}){
 if(!['components','compositions','patterns','visualizations','screens','icons','icon-assets'].includes(collection))throw Error('Unknown collection');
 if(typeof id!=='string'||!Array.isArray(searchTags)||searchTags.length>40||searchTags.some(t=>typeof t!=='string'||t.length>80))throw Error('Use at most 40 tags, each up to 80 characters');
 const file=path.join(content,collection==='icon-assets'?'icons/catalog.json':'registry.json');
 if(!fs.realpathSync(file).startsWith(fs.realpathSync(content)+path.sep))throw Error('Invalid catalog path');
 const data=JSON.parse(fs.readFileSync(file,'utf8')),rows=collection==='icon-assets'?data:data[collection];
 const entry=rows?.find(e=>e.id===id);if(!entry)throw Error('Item not found');
 entry.searchTags=[...new Set(searchTags.map(t=>t.trim()).filter(Boolean))];
 const tmp=file+'.tags-tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n',{flag:'wx'});try{fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
 return entry.searchTags;
}
async function handle(req,res,content){
 const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 if(req.method!=='POST')return send(405,{error:'POST required'});
 try{const origin=new URL(req.headers.origin);if(!['localhost','127.0.0.1'].includes(origin.hostname)||origin.host!==req.headers.host)throw Error('Same-origin request required');}catch{return send(403,{error:'Same-origin request required'});}
 try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000)throw Error('Request too large');}send(200,{searchTags:save(content,JSON.parse(raw))});}catch(e){send(400,{error:e.message});}
}
module.exports={save,handle};
