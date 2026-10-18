const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
let win, dirty = false, allowedClose = false;
const MAX = 40 * 1024 * 1024;
const filters = [{name:'B&D Word',extensions:['bdword']},{name:'Word-Dokument',extensions:['docx']},{name:'Text / HTML',extensions:['txt','html','htm']}];
function handle(name, fn) {
  ipcMain.handle(name, async (event, ...args) => {
    if (event.sender !== win.webContents) return {error:'Unzulässiger Aufruf'};
    try { return await fn(...args); } catch (e) { return {error: e.message || 'Vorgang fehlgeschlagen'}; }
  });
}
function text(value, max=MAX) { if(typeof value !== 'string' || Buffer.byteLength(value)>max) throw Error('Ungültige oder zu große Daten (max. 40 MB).'); return value; }
function validDocument(raw) { const data=JSON.parse(raw); if(data.format!=='bdword' || data.version!==1 || data.document?.type!=='doc') throw Error('Kein gültiges B&D-Word-Dokument.'); return data; }
async function printable(html) {
  text(html);
  const p=new BrowserWindow({show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  p.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  const markup=`<!doctype html><html><head><title>B&amp;D Word – Dokument</title><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>@page{size:A4;margin:20mm}body{font:11pt Arial;color:#172033;line-height:1.5;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%;break-inside:auto}td,th{border:1px solid #aaa;padding:6px}p{margin:.5em 0}h1,h2,h3{break-after:avoid}h1{font-size:26pt}h2{font-size:20pt}hr[data-page-break]{break-after:page;border:0;height:0}a{color:#1762ad}</style></head><body>${html}</body></html>`;
  try { await p.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(markup)); await p.webContents.executeJavaScript('Promise.all([...document.images].map(i => i.decode().catch(()=>{}))).then(()=>document.fonts.ready).then(()=>true)'); return p; } catch(e) {p.destroy();throw e;}
}
app.whenReady().then(()=>{
  win=new BrowserWindow({width:1440,height:1000,minWidth:1060,minHeight:720,frame:false,backgroundColor:'#f2f4f7',icon:path.join(__dirname,'../assets/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  if(process.platform==='darwin'){
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {role:'appMenu'},
      {label:'Bearbeiten',submenu:[{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]}
    ]));
  }else{win.setMenu(null);}
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.on('close',e=>{if(dirty && !allowedClose){e.preventDefault();win.webContents.send('request-close');}});
  win.loadFile(path.join(__dirname,'../dist/index.html'));
  handle('open-document',async()=>{
    const r=await dialog.showOpenDialog(win,{filters,properties:['openFile']}); if(r.canceled)return {canceled:true};
    const file=r.filePaths[0]; if((await fs.stat(file)).size>MAX)throw Error('Datei ist größer als 40 MB.');
    const ext=path.extname(file).toLowerCase();
    if(!['.bdword','.docx','.txt','.html','.htm'].includes(ext))throw Error('Dieses Dateiformat wird nicht unterstützt.');
    const bytes=await fs.readFile(file);
    if(ext==='.bdword')validDocument(bytes.toString('utf8'));
    return {file,name:path.basename(file),ext,content:ext==='.docx'?bytes.toString('base64'):bytes.toString('utf8')};
  });
  handle('save-document',async(data)=>{
    if(!data||typeof data!=='object')throw Error('Ungültiges Dokument.');
    const content=text(data.content);validDocument(content);
    let file=data.file;
    if(file && (typeof file!=='string'||path.extname(file).toLowerCase()!=='.bdword'))throw Error('Ungültiger Speicherpfad.');
    if(!file||data.saveAs){const r=await dialog.showSaveDialog(win,{defaultPath:data.name||'Dokument.bdword',filters:[filters[0]]});if(r.canceled)return {canceled:true};file=r.filePath;}
    if(path.extname(file).toLowerCase()!=='.bdword')file+='.bdword';
    // Replace only after the complete temporary file has been written.
    const temp=file+'.'+process.pid+'.tmp';
    try {await fs.writeFile(temp,content,'utf8');await fs.rename(temp,file);}catch(e){await fs.rm(temp,{force:true}).catch(()=>{});throw e;}
    return {file,name:path.basename(file)};
  });
  handle('open-image',async()=>{
    const r=await dialog.showOpenDialog(win,{filters:[{name:'Bilder',extensions:['png','jpg','jpeg','gif','webp']}],properties:['openFile']});if(r.canceled)return {canceled:true};
    const file=r.filePaths[0], ext=path.extname(file).slice(1).toLowerCase();
    if(!['png','jpg','jpeg','gif','webp'].includes(ext))throw Error('Nicht unterstütztes Bildformat.');
    if((await fs.stat(file)).size>10*1024*1024)throw Error('Bild ist größer als 10 MB.');
    return {src:`data:image/${ext==='jpg'?'jpeg':ext};base64,${(await fs.readFile(file)).toString('base64')}`,name:path.basename(file)};
  });
  handle('export-pdf',async(html)=>{
    const r=await dialog.showSaveDialog(win,{defaultPath:'Dokument.pdf',filters:[{name:'PDF',extensions:['pdf']}]});if(r.canceled)return {canceled:true};
    const p=await printable(html);try{await fs.writeFile(r.filePath,await p.webContents.printToPDF({printBackground:true,pageSize:'A4',preferCSSPageSize:true}));return {name:path.basename(r.filePath)};}finally{p.destroy();}
  });
  handle('print-document',async(html)=>{
    const p=await printable(html);
    return new Promise(resolve=>p.webContents.print({printBackground:true},(success,reason)=>{p.destroy();resolve(success?{ok:true}:{error:reason||'Druck abgebrochen'});}));
  });
  handle('export-docx',async(base64)=>{
    text(base64,MAX*2); const r=await dialog.showSaveDialog(win,{defaultPath:'Dokument.docx',filters:[filters[1]]});if(r.canceled)return {canceled:true};
    await fs.writeFile(r.filePath,Buffer.from(base64,'base64'));return {name:path.basename(r.filePath)};
  });
  handle('dirty',value=>{dirty=value===true;return {ok:true};});
  handle('window',action=>{if(action==='minimize')win.minimize();if(action==='maximize'){win.isMaximized()?win.unmaximize():win.maximize();}if(action==='close')win.close();if(action==='confirm-close'){allowedClose=true;win.close();}return {ok:true};});
});
app.on('window-all-closed',()=>app.quit());
