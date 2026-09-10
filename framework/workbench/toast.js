/* Shared copy feedback, outside document flow. Same-origin previews delegate
   to their studio parent so notices appear at the top of the whole window. */
(()=>{
 if(globalThis.StudioToast)return;
 let node,timer;
 globalThis.StudioToast={show(message){
  try{if(parent!==window&&parent.StudioToast){parent.StudioToast.show(message);return;}}catch{}
  if(!node){node=document.createElement('div');node.className='studio-copy-toast';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:calc(100vw - 40px);box-sizing:border-box;padding:12px 20px;border:1px solid #ffffff30;border-radius:999px;background:#252730;box-shadow:0 8px 32px #0003;color:white;font:500 13px/1.5 system-ui,sans-serif;pointer-events:none;text-align:center;overflow-wrap:anywhere';document.body.append(node);}
  clearTimeout(timer);node.hidden=false;node.textContent=message;timer=setTimeout(()=>{node.hidden=true;},2600);
 }};
})();
