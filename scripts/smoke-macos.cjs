// Exercise the packaged application on a real macOS CI runner.
const {_electron:electron}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
(async()=>{
  assert.equal(process.platform,'darwin','This check must run on macOS.');
  const binary=path.resolve('release/mac-universal/B&D Word.app/Contents/MacOS/B&D Word');
  const output=path.resolve('mac-smoke-results');await fs.mkdir(output,{recursive:true});
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'bd-word-smoke-'));
  const app=await electron.launch({executablePath:binary,timeout:60000});
  const errors=[];
  try{
    const page=await app.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
    await page.locator('.splash').waitFor({state:'detached'});
    const editor=page.getByRole('textbox',{name:'Dokumentinhalt'});
    await editor.fill('Dieses Programm läuft auch auf dem Mac.');
    await page.keyboard.press('Meta+a');await page.keyboard.press('Meta+b');
    await page.locator('.tiptap strong').waitFor({state:'visible'});
    assert.equal(await page.locator('.tiptap strong').innerText(),'Dieses Programm läuft auch auf dem Mac.');
    await page.getByRole('button',{name:'AaBbCc Titel',exact:true}).click();
    await page.locator('.tiptap h1').waitFor({state:'visible'});
    await page.getByLabel('Schriftgröße',{exact:true}).selectOption('24');
    await page.getByLabel('Textfarbe',{exact:true}).fill('#21736a');
    await editor.click();await page.keyboard.press('Meta+End');
    // On macOS Cmd+ArrowDown reliably moves to the end of the document.
    await page.keyboard.press('Meta+ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
    const image=path.resolve('assets/demo-bild.png');
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},image);
    await page.getByRole('button',{name:'Einfügen',exact:true}).first().click();
    await page.getByRole('button',{name:'Bild',exact:true}).click();await page.locator('.tiptap img').waitFor({state:'visible'});
    const document=path.join(temporary,'Mac-Demo.bdword');
    await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},document);
    await page.keyboard.press('Meta+s');
    await page.waitForFunction(()=>document.querySelector('.notice')?.textContent?.includes('Dokument gespeichert.'));
    const saved=JSON.parse(await fs.readFile(document,'utf8'));assert.equal(saved.format,'bdword');
    assert.ok(JSON.stringify(saved.document).includes('Dieses Programm läuft auch auf dem Mac.'));
    assert.ok(JSON.stringify(saved.document).includes('data:image/png;base64'));
    const pdf=path.join(temporary,'Mac-Demo.pdf');
    await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},pdf);
    await page.getByRole('button',{name:'Datei',exact:true}).click();await page.getByRole('button',{name:'Als PDF',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.notice')?.textContent?.includes('PDF exportiert.'));
    const bytes=await fs.readFile(pdf);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);
    await page.getByRole('button',{name:'Neu',exact:true}).click();
    assert.equal((await editor.innerText()).trim(),'');
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},document);
    await page.getByRole('button',{name:'Datei',exact:true}).click();await page.getByRole('button',{name:'Öffnen',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.notice')?.textContent?.includes('Dokument geöffnet.'));
    assert.ok((await page.locator('.tiptap h1').innerText()).includes('Dieses Programm läuft auch auf dem Mac.'));
    assert.equal(await page.locator('.tiptap img').count(),1);assert.deepEqual(errors,[]);
    await page.locator('.workspace').evaluate(el=>el.scrollTop=0);await page.screenshot({path:path.join(output,'editor.png')});
    await fs.copyFile(pdf,path.join(output,'Mac-Demo.pdf'));
    await fs.writeFile(path.join(output,'result.json'),JSON.stringify({platform:process.platform,runnerArchitecture:process.arch,app:'universal',checks:['packaged app start','Cmd+B','heading, size and colour','local embedded image','Cmd+S writes document','PDF output','reopen document with heading and image'],passed:true,limitations:['File dialog choices are supplied by the test.','PDF header and nonempty payload checked; no PDF text extraction on macOS.','Not notarized by Apple.','Only the CI host architecture is launched; both slices are checked with lipo.']},null,2));
    console.log('Packaged macOS application smoke check passed.');
  }finally{
    await app.evaluate(({BrowserWindow})=>{for(const win of BrowserWindow.getAllWindows())win.destroy();}).catch(()=>{});
    await app.close().catch(()=>{});
    await fs.rm(temporary,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
