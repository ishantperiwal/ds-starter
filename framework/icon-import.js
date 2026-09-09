'use strict';
const fs=require('node:fs'),path=require('node:path');
const tags=new Set('svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath mask title desc'.split(' '));
const attrs=new Set('xmlns viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity transform id clip-path clip-rule mask offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod preserveAspectRatio'.split(' '));
function validateSVG(svg){
 if(typeof svg!=='string'||svg.length>200000||!/^<svg\s/.test(svg)||/<!|<\?|\bon\w+\s*=|(?:javascript|data|https?):/i.test(svg.replace('http://www.w3.org/2000/svg','')))throw Error('Paste a standalone SVG containing vector shapes only.');
 const stack=[];let end=0;
 for(const m of svg.matchAll(/<([^<>]+)>/g)){
  if(svg.slice(end,m.index).includes('<'))throw Error('Invalid SVG');end=m.index+m[0].length;
  const match=m[1].match(/^(\/)?([A-Za-z]+)([\s\S]*?)(\/)?$/);if(!match||!tags.has(match[2]))throw Error('Unsupported SVG element');
  const [,close,name,body,self]=match;
  if(close){if(body.trim()||stack.pop()!==name)throw Error('Invalid SVG nesting');continue;}
  let remaining=body;const seen=new Set();
  while(remaining.trim()){
   const a=remaining.match(/^\s+([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/);if(!a||!attrs.has(a[1])||seen.has(a[1]))throw Error('Unsupported SVG attribute');seen.add(a[1]);const value=a[2].slice(1,-1);if(/[<>]/.test(value)||/url\(/i.test(value)&&!/^url\(#[\w-]+\)$/.test(value))throw Error('External SVG references are not supported');remaining=remaining.slice(a[0].length);
  }
  if(!self)stack.push(name);
 }
 if(stack.length||svg.slice(end).trim()||!/^<svg\b[^>]*viewBox="0 0 24 24"/.test(svg))throw Error('SVG must use a normalized 24 × 24 canvas');
 return svg;
}
async function handle(req,res,content){
 const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 if(req.method!=='POST')return send(405,{error:'POST required'});
 if(!req.headers.origin||!['http://localhost:','http://127.0.0.1:'].some(p=>req.headers.origin.startsWith(p))||new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Same-origin request required'});
 try{
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>220000)throw Error('SVG is too large');}
  const {name,category,svg}=JSON.parse(raw);if(typeof name!=='string'||!name.trim()||name.length>80||typeof category!=='string'||category.length>50)throw Error('Name and category are required');validateSVG(svg);
  const dir=path.join(content,'icons'),manifest=path.join(dir,'catalog.json'),assets=path.join(dir,'assets');
  for(const p of [dir,manifest,assets])if(fs.lstatSync(p).isSymbolicLink())throw Error('Symbolic icon paths are not supported');
  const rows=JSON.parse(fs.readFileSync(manifest,'utf8'));const id=name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!id)throw Error('Use a name containing letters or numbers');if(rows.some(i=>i.id===id))return send(409,{error:'An icon with this name already exists. Choose a unique name.'});
  const file=path.join(assets,id+'.svg');fs.writeFileSync(file,svg,{flag:'wx'});
  const entry={id,name:name.trim(),category,src:'assets/'+id+'.svg',kind:'interface-icon',background:'light',rotation:0,aspectRatio:1};
  try{fs.writeFileSync(manifest,JSON.stringify([...rows,entry],null,2)+'\n');}catch(e){fs.unlinkSync(file);throw e;}
  send(201,entry);
 }catch(e){send(400,{error:e.message});}
}
module.exports={handle,validateSVG};
