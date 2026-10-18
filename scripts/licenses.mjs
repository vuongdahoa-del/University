import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const paths=execFileSync(process.platform==='win32'?'npm.cmd':'npm',['ls','--omit=dev','--all','--parseable'],{encoding:'utf8'}).trim().split(/\r?\n/).slice(1);
let result='B&D Word – Hinweise zu eingebundener Fremdsoftware\n\nElectron und Chromium liefern eigene Lizenzdateien im Anwendungspaket.\nQuill dient ausschließlich der Analyse; seine BSD-3-Clause-Lizenz liegt unter docs/analysis/reference/LICENSE.\nREA ist ein separates Entwicklungswerkzeug unter MIT.\nDie folgenden Texte gehören zu den installierten Produktionsabhängigkeiten.\n\n';
for(const folder of [...new Set(paths)].sort()){
 const pkg=JSON.parse(fs.readFileSync(path.join(folder,'package.json'),'utf8'));
 result+='\n'+'='.repeat(72)+'\n'+pkg.name+' '+pkg.version+' | '+JSON.stringify(pkg.license||'siehe Paket')+'\n';
 const licenses=fs.readdirSync(folder).filter(n=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(n)&&fs.statSync(path.join(folder,n)).isFile());
 for(const name of licenses)result+='\n--- '+name+' ---\n'+fs.readFileSync(path.join(folder,name),'utf8')+'\n';
 if(!licenses.length)result+='Lizenzinformation: '+JSON.stringify(pkg.license)+'; siehe ursprüngliches npm-Paket.\n';
}
fs.writeFileSync('docs/THIRD_PARTY_NOTICES.txt',result);
