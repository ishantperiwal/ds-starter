window.dsInspectorConfig={registryUrl:'/demo/design-system/registry.json',workbenchUrl:'/?profile=demo#components'};
const theme=new URLSearchParams(location.search).get('theme');
if(theme==='soft'){
  document.documentElement.dataset.theme='soft';
  const link=document.createElement('link');link.rel='stylesheet';link.href='/demo/design-system/themes/soft.css';document.head.append(link);
}
