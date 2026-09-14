/* Pure catalog/presentation helpers; shared by the browser and regression tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudioModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const collections = ['components','compositions','patterns','visualizations','icons','screens','themes'];
  function normalize(input) {
    if (!input || input.contractVersion !== 1) throw Error('Unsupported catalog contract');
    const catalog = {...input};
    for (const key of [...collections,'tokenFiles']) {
      if (!Array.isArray(input[key])) throw Error('Catalog needs an array: ' + key);
      catalog[key] = input[key];
    }
    return catalog;
  }
  const blocks = catalog => [...catalog.components,...catalog.compositions];
  function counts(catalog, tokens) {
    return {
      overview: blocks(catalog).length,
      foundations: tokens === null ? null : new Set(tokens.map(token=>token.name)).size,
      components: blocks(catalog).length,
      patterns: catalog.patterns.length,
      visualizations: catalog.visualizations.length,
      icons: catalog.icons.length, // providers, not an invented glyph total
      directions: catalog.themes.length,
      moodboard: null
    };
  }
  // Index declared CSS values with their scope. This is not computed cascade analysis.
  function parseTokens(css, file) {
    const rows=[], stack=[];
    let segment='', quote='', escaped=false, comment=false, parens=0;
    const flush=()=>{
      const match=segment.trim().match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
      if(match && stack.length) rows.push({
        name:match[1], value:match[2].trim(), file,
        scope:stack.join(' / '),
        isRoot:stack.length===1 && [':root',':root:root','html'].includes(stack[0])
      });
      segment='';
    };
    for(let i=0;i<css.length;i++) {
      const c=css[i],next=css[i+1];
      if(comment){if(c==='*'&&next==='/'){comment=false;i++;}continue;}
      if(quote){segment+=c;if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue;}
      if(c==='/'&&next==='*'){comment=true;i++;continue;}
      if(c==='"'||c==="'"){quote=c;segment+=c;continue;}
      if(c==='(')parens++;if(c===')')parens--;
      if(!parens && c==='{'){stack.push(segment.trim());segment='';}
      else if(!parens && c==='}'){flush();stack.pop();}
      else if(!parens && c===';'){flush();}
      else segment+=c;
    }
    return rows;
  }
  function mixColor(value) {
    const match=value.match(/^color-mix\(\s*in\s+srgb\s*,([\s\S]+)\)$/i);
    if(!match)return value;
    const parts=match[1].split(',').map(part=>part.trim()).filter(Boolean);
    if(parts.length!==2)return value;
    const parse=part=>{
      const parsed=part.match(/^(.*?)(?:\s+([\d.]+)%)?$/),color=parsed[1].trim();
      const hex=color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
      if(!hex)return null;
      let h=hex[1];if(h.length===3)h=h.split('').map(c=>c+c).join('');
      return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),pct:parsed[2]===undefined?null:parseFloat(parsed[2])};
    };
    const a=parse(parts[0]),b=parse(parts[1]);
    if(!a||!b)return value;
    let pa=a.pct,pb=b.pct;
    if(pa===null&&pb===null){pa=50;pb=50;}
    else if(pa===null)pa=100-pb;
    else if(pb===null)pb=100-pa;
    if(pa+pb===0)return value;
    const mix=(x,y)=>Math.round((x*pa+y*pb)/(pa+pb));
    return '#'+[mix(a.r,b.r),mix(a.g,b.g),mix(a.b,b.b)].map(channel=>channel.toString(16).padStart(2,'0')).join('');
  }
  function resolveLiteral(row, rows, seen=new Set()) {
    if(!row.isRoot || seen.has(row.name) || /!important/.test(row.value))return null;
    seen=new Set(seen);seen.add(row.name);
    let unresolved=false;
    const result=row.value.replace(/var\(\s*(--[\w-]+)\s*\)/g,(_,name)=>{
      const candidates=rows.filter(token=>token.isRoot&&token.name===name);
      const value=candidates.length ? resolveLiteral(candidates[candidates.length-1],rows,seen) : null;
      if(value===null){unresolved=true;return '';}return value;
    });
    if(unresolved || /var\(/.test(result))return null;
    return mixColor(result.trim());
  }
  function family(row, rows=[]) {
    const name=row.name;
    const literal=rows.length?resolveLiteral(row,rows):row.value;
    if(literal && /^(?:#[\da-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|transparent$)/i.test(literal))return 'Color';
    if(/font|type-|weight|leading|tracking|line-height|letter-spacing|text-decoration|text-transform/.test(name))return 'Typography';
    if(/stroke|border-width|divider-width|focus-ring-width/.test(name))return 'Strokes';
    if(/radius|shadow|elevation/.test(name))return 'Shape & elevation';
    if(/color|surface|accent|text-(?:primary|secondary|muted|heading|disabled|inverse)|border-(?:subtle|default|focus)|gray|blue|green|red|yellow|purple|pink|orange|white|black/.test(name))return 'Color';
    if(/space|spacing|gap|pad|inset|margin/.test(name))return 'Spacing';
    if(/font|text|weight|leading|tracking|line-height/.test(name))return 'Typography';
    if(/stroke|border-width|divider-width|focus-ring-width/.test(name))return 'Strokes';
    if(/radius|shadow|elevation/.test(name))return 'Shape & elevation';
    if(/dur-|duration|ease|motion|transition/.test(name))return 'Motion';
    return 'Component controls';
  }
  function groups(entries, key) {
    const groups=new Map();
    for(const entry of entries){const name=key(entry);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(entry);}
    return [...groups];
  }
  function route(hash) {
    const [tab,entry]=hash.replace(/^#/,'').split('/');
    const aliases={dataviz:'visualizations','data-viz':'visualizations',mood:'moodboard'};
    let id;
    try{id=entry?decodeURIComponent(entry):null;}catch{id=null;}
    if(id==='app-switcher'&&(aliases[tab]||tab)==='patterns')id='anchored-popover';
    return {tab:aliases[tab]||tab||'overview',entry:id};
  }
  function previewURL(entry, base, theme='', inspect=false) {
    const url=new URL(entry.preview,base);
    if(url.origin!==new URL(base).origin)throw Error('Catalog previews must be same-origin');
    if(!['http:','https:'].includes(url.protocol))throw Error('Invalid preview URL');
    if(theme)url.searchParams.set('theme',theme);
    if(inspect)url.searchParams.set('ds','true');
    return url.href;
  }
  function searchText(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function searchMetadata(entry){return [entry.name,entry.id,entry.class,entry.category,entry.summary,entry.usage,...(entry.searchTags||[])].filter(Boolean).join(' ');}
  function searchScore(text,query){
    const hay=searchText(text),needle=searchText(query);
    if(!needle)return 1;
    if(hay===needle)return 10000;
    if(hay.includes(needle))return 8000;
    const words=[...new Set(needle.split(' '))],available=hay.split(' ');
    const matched=words.map(word=>available.includes(word)?3:available.some(candidate=>candidate.startsWith(word))?2:available.some(candidate=>candidate.includes(word))?1:0);
    const count=matched.filter(Boolean).length;
    return count?(count===words.length?4000:1000)+count/words.length*100+matched.reduce((a,b)=>a+b,0):0;
  }
  return {searchText,searchMetadata,searchScore,normalize,blocks,counts,parseTokens,resolveLiteral,family,groups,route,previewURL};
});
