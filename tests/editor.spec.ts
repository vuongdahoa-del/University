import {test,expect,_electron as electron,type ElectronApplication,type Page} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=process.cwd();
async function boot(){
 const app=await electron.launch({args:['--no-sandbox',root],env:{...Object.fromEntries(Object.entries(process.env).filter((v):v is [string,string]=>v[1]!==undefined)),DISPLAY:':99',XDG_CONFIG_HOME:'/workspace/.bd-test-config',XDG_CACHE_HOME:'/workspace/.cache'}});
 const page=await app.firstWindow();await expect(page.locator('.splash')).toBeVisible();await page.locator('.splash').waitFor({state:'detached'});return {app,page};
}
async function saveDialog(app:ElectronApplication,file:string,canceled=false){await app.evaluate(({dialog},{file,canceled})=>{dialog.showSaveDialog=async()=>({canceled,filePath:canceled?'':file});},{file,canceled});}
async function openDialog(app:ElectronApplication,file:string){await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);}
async function selectAll(page:Page){await page.getByRole('textbox',{name:'Dokumentinhalt'}).click();await page.keyboard.press('Control+a');}

test('Browser: Kernformatierung, Historie, Listen, Tabellen und Suche',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.locator('.splash').waitFor({state:'detached'});
 const content=page.getByRole('textbox',{name:'Dokumentinhalt'});
 await content.fill('Dieses Programm wurde mithilfe von KI entwickelt.');await selectAll(page);
 await page.keyboard.press('Control+b');await expect(content.locator('strong')).toHaveText('Dieses Programm wurde mithilfe von KI entwickelt.');
 await page.keyboard.press('Control+z');await expect(content.locator('strong')).toHaveCount(0);await page.keyboard.press('Control+Shift+z');await expect(content.locator('strong')).toHaveCount(1);
 await page.getByRole('button',{name:'Kursiv (Strg+I)',exact:true}).click();await page.getByRole('button',{name:'Unterstrichen (Strg+U)',exact:true}).click();
 await expect(content.locator('em')).toHaveCount(1);await expect(content.locator('u')).toHaveCount(1);
 await page.getByRole('button',{name:'Zentriert',exact:true}).click();await expect(content.locator('p')).toHaveAttribute('style',/text-align: center/);
 await page.getByRole('button',{name:'Aufzählung',exact:true}).click();await expect(content.locator('ul li')).toHaveCount(1);
 await page.keyboard.press('ArrowLeft');await page.getByRole('button',{name:'Aufzählung',exact:true}).click();await page.getByRole('button',{name:'Nummerierung',exact:true}).click();await expect(content.locator('ol li')).toHaveCount(1);
 await page.getByRole('button',{name:'Nummerierung',exact:true}).click();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Einfügen',exact:true}).first().click();await page.getByRole('button',{name:'Tabelle 3 × 3',exact:true}).click();await expect(content.locator('table tr')).toHaveCount(3);
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>r())));await content.locator('td').first().click();await page.keyboard.type('Testzelle');await expect(content.locator('td').first()).toHaveText('Testzelle');await page.getByRole('button',{name:'Zeile hinzufügen'}).click();await expect(content.locator('table tr')).toHaveCount(4);
 await page.getByRole('button',{name:'Tabelle entfernen'}).click();await expect(content.locator('table')).toHaveCount(0);
 await page.getByRole('button',{name:'Im Dokument suchen'}).click();await page.getByRole('textbox',{name:'Suchtext'}).fill('KI');await page.getByRole('button',{name:'Nächster Treffer'}).click();
 await expect.poll(()=>page.evaluate(()=>window.getSelection()?.toString())).toBe('KI');
 await expect(page.locator('.statusbar')).toContainText('7 Wörter');expect(errors).toEqual([]);
});

test('Electron: vollständige Live-Demo mit echtem Speichern, PDF und Wiederöffnen',async({},testInfo)=>{
 const {app,page}=await boot();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 const image=testInfo.outputPath('demo.png'),document=testInfo.outputPath('Live-Demo.bdword'),pdf=testInfo.outputPath('Live-Demo.pdf');
 await fs.mkdir(path.dirname(image),{recursive:true});await sharp('assets/demo-bild.png').resize(480).png().toFile(image);
 const content=page.getByRole('textbox',{name:'Dokumentinhalt'});
 await content.fill('Dieses Programm wurde mithilfe von KI entwickelt.');await selectAll(page);await page.getByRole('button',{name:'AaBbCc Titel',exact:true}).click();
 await page.getByLabel('Schriftgröße',{exact:true}).selectOption('24');await page.getByLabel('Textfarbe',{exact:true}).fill('#21736a');
 await expect(content.locator('h1')).toHaveText('Dieses Programm wurde mithilfe von KI entwickelt.');await expect(content.locator('h1 span')).toHaveAttribute('style',/font-size: 24pt/);
 await content.click();await page.keyboard.press('Control+End');await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Einfügen',exact:true}).first().click();await openDialog(app,image);await page.getByRole('button',{name:'Bild',exact:true}).click();await expect(content.locator('img')).toHaveCount(1);
 await saveDialog(app,document);await page.keyboard.press('Control+s');await expect(page.getByRole('status')).toContainText('Dokument gespeichert');
 const saved=JSON.parse(await fs.readFile(document,'utf8'));expect(saved.format).toBe('bdword');expect(JSON.stringify(saved)).toContain('data:image/png;base64');
 await page.getByRole('button',{name:'Datei',exact:true}).click();await saveDialog(app,pdf);await page.getByRole('button',{name:'Als PDF',exact:true}).click();await expect(page.getByRole('status')).toContainText('PDF exportiert');
 const bytes=await fs.readFile(pdf);expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'}).replace(/\s+/g,' ').trim()).toContain('Dieses Programm wurde mithilfe von KI entwickelt.');
 const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});expect(info).toMatch(/Pages:\s+1/);expect(info).toMatch(/Page size:.*\(A4\)/);
 await page.getByRole('button',{name:'Neu',exact:true}).click();await expect(content).toHaveText('');
 await page.getByRole('button',{name:'Datei',exact:true}).click();await openDialog(app,document);await page.getByRole('button',{name:'Öffnen',exact:true}).click();
 await expect(content.locator('h1')).toContainText('Dieses Programm wurde mithilfe von KI entwickelt.');await expect(content.locator('img')).toHaveCount(1);await expect(content.locator('h1 span')).toHaveAttribute('style',/color: rgb\(33, 115, 106\)/);
 await page.locator('.workspace').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'docs/B_D_WORD_SCREENSHOT.png'});
 // A real DOCX is written and then read again through Mammoth.
 const docx=testInfo.outputPath('Live-Demo.docx');await page.getByRole('button',{name:'Datei',exact:true}).click();await saveDialog(app,docx);await page.getByRole('button',{name:'Als DOCX',exact:true}).click();await expect(page.getByRole('status')).toContainText('DOCX exportiert');expect((await fs.readFile(docx)).subarray(0,2).toString()).toBe('PK');
 await openDialog(app,docx);await page.getByRole('button',{name:'Öffnen',exact:true}).click();await expect(page.getByRole('status')).toContainText('DOCX importiert');await expect(content).toContainText('Dieses Programm wurde mithilfe von KI entwickelt.');await expect(content.locator('img')).toHaveCount(1);
 expect(errors).toEqual([]);
 }finally{await app.close();}
});

test('Electron: ungültige Dokumente, Abbruch und Schutz ungespeicherter Änderungen',async({},testInfo)=>{
 const {app,page}=await boot();try{
 const bad=testInfo.outputPath('kaputt.bdword');await fs.mkdir(path.dirname(bad),{recursive:true});await fs.writeFile(bad,'{"format":"bdword","version":1,"document":{"type":"doc","content":[{"type":"erfunden"}]}}');
 const content=page.getByRole('textbox',{name:'Dokumentinhalt'});await content.fill('Ungespeicherter Text');
 await page.getByRole('button',{name:'Datei',exact:true}).click();await page.getByRole('button',{name:'Neu',exact:true}).click();await expect(page.getByRole('heading',{name:'Änderungen speichern?'})).toBeVisible();await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await expect(content).toHaveText('Ungespeicherter Text');
 await saveDialog(app,testInfo.outputPath('no.bdword'),true);await page.keyboard.press('Control+s');await expect(page.locator('.document-title')).toContainText('•');
 await openDialog(app,bad);await page.getByRole('button',{name:'Öffnen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await expect(page.locator('.notice.error')).toBeVisible();await expect(content).toHaveText('Ungespeicherter Text');
 // Close cancellation keeps the original unsaved document alive.
 await page.getByRole('button',{name:'Schließen',exact:true}).click();await expect(page.getByRole('heading',{name:'Änderungen speichern?'})).toBeVisible();await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await expect(content).toHaveText('Ungespeicherter Text');
 }finally{await app.evaluate(()=>process.exit(0));}
});

test('Electron: bereinigter HTML-Import, Links und zwei echte PDF-Seiten',async({},testInfo)=>{
 const {app,page}=await boot();try{
 const html=testInfo.outputPath('import.html');await fs.mkdir(path.dirname(html),{recursive:true});await fs.writeFile(html,'<p><b>Prüftext</b> <a href="https://example.org">Quelle</a></p><script>document.title="GEHACKT"</script><img src="x" onerror="document.title=\'GEHACKT\'">');
 await openDialog(app,html);await page.getByRole('button',{name:'Datei',exact:true}).click();await page.getByRole('button',{name:'Öffnen',exact:true}).click();
 const content=page.getByRole('textbox',{name:'Dokumentinhalt'});await expect(content.locator('strong')).toHaveText('Prüftext');await expect(content.locator('a')).toHaveAttribute('href','https://example.org');await expect(page).toHaveTitle('B&D Word');await expect(content.locator('script')).toHaveCount(0);expect(await content.innerHTML()).not.toContain('onerror');await expect(content.locator('img')).toHaveCount(0);
 await content.click();await page.keyboard.press('Control+End');await page.getByRole('button',{name:'Einfügen',exact:true}).first().click();await page.getByRole('button',{name:'Seitenumbruch',exact:true}).click();await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>r())));await page.keyboard.type('Zweite Seite');await expect(content.locator('hr[data-page-break]')).toHaveCount(1);
 const pdf=testInfo.outputPath('zwei-seiten.pdf');await saveDialog(app,pdf);await page.getByRole('button',{name:'Datei',exact:true}).click();await page.getByRole('button',{name:'Als PDF',exact:true}).click();await expect(page.getByRole('status')).toContainText('PDF exportiert');expect(execFileSync('pdfinfo',[pdf],{encoding:'utf8'})).toMatch(/Pages:\s+2/);expect(execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'})).toContain('Zweite Seite');
 }finally{await app.evaluate(()=>process.exit(0));}
});
