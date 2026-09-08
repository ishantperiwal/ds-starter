(() => {
  const part=new URLSearchParams(location.search).get('part')||'partToWhole';
  const render=()=>{
    const size=document.getElementById('chart-size').value;
    const samples={
      partToWhole:{parts:[{label:'Design',value:42},{label:'Engineering',value:35},{label:'Research',value:23}],centerLabel:'WORK ITEMS',idPrefix:'demo'},
      rankedBars:{rows:[{label:'Design',value:42,width:100},{label:'Engineering',value:35,width:83},{label:'Research',value:23,width:55}]},
      conversionSteps:{rows:[{label:'Started',value:100,percentage:'100%',width:100},{label:'Reviewed',value:72,percentage:'72%',width:72},{label:'Approved',value:48,percentage:'48%',width:48}]},
      binnedDistribution:{bins:[{label:'0–2',value:8},{label:'3–5',value:15},{label:'6–8',value:11},{label:'9+',value:4}],axisLabel:'Days to review'},
      stackedComposition:{groups:[{label:'Week 1',values:[12,8]},{label:'Week 2',values:[15,11]},{label:'Week 3',values:[18,9]}],series:[{label:'Done'},{label:'In progress'}]}
    };
    document.getElementById('chart').innerHTML=dsVisualization[part]?.({...samples[part],size})||'Unknown chart provider';
  };
  document.getElementById('chart-size').onchange=render;render();
})();
