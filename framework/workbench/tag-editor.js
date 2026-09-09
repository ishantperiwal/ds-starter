(()=>{
window.StudioTagEditor={mount(host,entry,collection,onSave){
 const form=document.createElement('form');form.style.cssText='padding:16px 0;display:grid;gap:8px';
 const label=document.createElement('label');label.textContent='Search tags';label.style.cssText='display:grid;gap:8px;font-weight:600';
 const input=document.createElement('textarea');input.rows=3;input.value=(entry.searchTags||[]).join(', ');input.placeholder='Add tags, separated by commas';input.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #ccc;border-radius:6px;font:inherit';label.append(input);
 const button=document.createElement('button');button.type='submit';button.textContent='Save tags';button.style.cssText='justify-self:start;padding:8px 12px';
 const status=document.createElement('span');status.setAttribute('role','status');
 form.append(label,button,status);host.append(form);
 form.onsubmit=async event=>{event.preventDefault();button.disabled=true;status.textContent='Saving…';try{
 const response=await fetch('/api/search-tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collection,id:entry.id,searchTags:input.value.split(/[,\n]/).map(t=>t.trim()).filter(Boolean)})});
 let result;try{result=await response.json();}catch{throw Error('Restart the studio server to enable saving tags');}if(!response.ok)throw Error(result.error||'Unable to save');
 entry.searchTags=result.searchTags;input.value=result.searchTags.join(', ');onSave?.();status.textContent='Tags saved';
 }catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
}};
})();
