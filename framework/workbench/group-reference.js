(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudioGroupReference=api;})(globalThis,()=>{
function reference(label,kind,entries,source){return ['Design-system group reference','Group: '+label,'Type: '+kind,'Scope: all '+entries.length+' items in this group (including search-hidden items)','Catalog: '+source,...entries.map(e=>e.name+' · ID: '+e.id+(e.class?' · .'+e.class:'')+(e.src?' · Asset: '+e.src:'')+(e.css?' · CSS: '+e.css:''))].join('\n');}
function mount(heading,getText){
 if(heading.querySelector('[data-copy-group]'))return;
 const label=heading.textContent.trim(),button=document.createElement('button');button.type='button';button.dataset.copyGroup='';button.title='Copy '+label+' reference';button.setAttribute('aria-label',button.title);button.style.cssText='display:inline-flex;align-items:center;vertical-align:middle;margin-left:8px;padding:4px;border:0;background:transparent;color:inherit;opacity:.65;cursor:pointer';
 button.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3 11H2V2h9v1"/></svg>';
 heading.append(button);
 button.onclick=async event=>{event.preventDefault();event.stopPropagation();let ok=false;const text=getText();try{await navigator.clipboard.writeText(text);ok=true;}catch{const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:-9999px';document.body.append(input);input.select();try{ok=document.execCommand('copy');}catch{}input.remove();button.focus();}
 import('/framework/workbench/toast.js').then(()=>StudioToast.show(ok?'Copied '+label+' group reference':'Could not copy '+label+' group reference'));
 };
}
return {reference,mount};
});
