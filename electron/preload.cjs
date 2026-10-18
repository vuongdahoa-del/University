const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  open:()=>ipcRenderer.invoke('open-document'),
  save:data=>ipcRenderer.invoke('save-document',data),
  image:()=>ipcRenderer.invoke('open-image'),
  pdf:html=>ipcRenderer.invoke('export-pdf',html),
  print:html=>ipcRenderer.invoke('print-document',html),
  docx:base64=>ipcRenderer.invoke('export-docx',base64),
  dirty:value=>ipcRenderer.invoke('dirty',value),
  window:action=>ipcRenderer.invoke('window',action),
  onClose:callback=>{const listener=()=>callback();ipcRenderer.on('request-close',listener);return()=>ipcRenderer.removeListener('request-close',listener);}
});
