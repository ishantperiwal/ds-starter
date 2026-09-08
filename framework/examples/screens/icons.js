(() => {
  function render(){
    const query=document.getElementById('search').value.toLowerCase(),grid=document.getElementById('icons');grid.replaceChildren();
    for(const name of dsIcon.builtins().filter(name=>name.includes(query))){
      const button=document.createElement('button');button.className='ds-btn ds-btn--secondary';button.innerHTML=dsIcon(name,{size:24});
      const label=document.createElement('span');label.textContent=name;button.append(label);
      button.onclick=async()=>{try{await navigator.clipboard.writeText("dsIcon('"+name+"', { size: 24 })");document.getElementById('icon-status').textContent='Copied '+name;}catch{document.getElementById('icon-status').textContent='Clipboard unavailable';}};
      grid.append(button);
    }
  }
  document.getElementById('search').oninput=render;document.getElementById('weight').onchange=e=>{dsIcon.setWeight(e.target.value);render();};render();
})();
