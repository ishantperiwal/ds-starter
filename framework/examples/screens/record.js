document.getElementById('add-note').onclick=()=>{
  const input=document.getElementById('note-draft');if(!input.value.trim()){input.focus();return;}
  document.getElementById('latest-note').textContent=input.value.trim();input.value='';
  document.getElementById('record-output').textContent='Mock note updated. Refresh restores the fixture.';
};
document.querySelectorAll('[data-mock-action]').forEach(button=>button.onclick=()=>{document.getElementById('record-output').textContent=button.dataset.mockAction;});
