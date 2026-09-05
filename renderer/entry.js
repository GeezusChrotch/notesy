import {exportToCanvas,restoreElements} from '@excalidraw/excalidraw';
window.renderDrawing=async function(scene){
 try{
  const canvas=await exportToCanvas({elements:restoreElements(scene.elements,null),appState:{...scene.appState,exportBackground:true,viewBackgroundColor:scene.appState?.viewBackgroundColor||'#ffffff',exportWithDarkMode:false},files:scene.files||{},maxWidthOrHeight:1200});
  window.webkit.messageHandlers.result.postMessage({data:canvas.toDataURL('image/png').split(',')[1]});
 }catch(e){window.webkit.messageHandlers.result.postMessage({error:'Drawing could not be rendered.'});}
};
window.renderSVG=function(data){const img=new Image();img.onload=function(){const scale=Math.min(1,1200/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,img.width*scale);canvas.height=Math.max(1,img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);window.webkit.messageHandlers.result.postMessage({data:canvas.toDataURL('image/png').split(',')[1]});};img.onerror=function(){window.webkit.messageHandlers.result.postMessage({error:'SVG could not be rendered.'});};img.src='data:image/svg+xml;base64,'+data;};
