// Reproduce the focused, read-only Quill analysis. Keep the original evidence.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const quill=path.join(root,'analysis-tools/node_modules/quill');
const rea=path.join(root,'analysis-tools/node_modules/rea-agents/scripts/rea.mjs');
if(!fs.existsSync(rea))throw Error('Zuerst npm --prefix analysis-tools ci ausführen.');
const reference=path.join(root,'analysis-tools/.reference');
const out=path.join(root,'docs/analysis/reproduced');
fs.mkdirSync(out,{recursive:true});
for(const file of ['package.json','LICENSE','formats/bold.js','formats/bold.js.map','blots/inline.js','blots/inline.js.map']){
 const target=path.join(reference,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(quill,file),target);
}
const log=[];
function run(args,name){
 const stdout=fs.openSync(path.join(out,name),'w'),stderr=fs.openSync(path.join(out,name+'.stderr'),'w');
 let result;try{result=spawnSync(process.execPath,[rea,...args],{cwd:root,stdio:['ignore',stdout,stderr]});}finally{fs.closeSync(stdout);fs.closeSync(stderr);}
 log.push({command:[process.execPath,rea,...args],exit:result.status,error:result.error?.message,output:name});
 fs.writeFileSync(path.join(out,'run-log.json'),JSON.stringify(log,null,2));
 if(result.status!==0)throw Error('REA-Aufruf fehlgeschlagen: '+name+'; siehe stderr und run-log.json');
}
run(['--version'],'version.txt');
run(['analyze-javascript-application',reference,'--json'],'focused-analysis.json');
const application=JSON.parse(fs.readFileSync(path.join(out,'focused-analysis.json'),'utf8'));
const input=path.join(out,'trace-input.json');
fs.writeFileSync(input,JSON.stringify({application,seed:{kind:'module',value:'formats/bold.js'},direction:'outgoing'}));
run(['trace-application-feature',input,'--json'],'focused-trace.json');
console.log('REA-Analyse und Feature-Trace erfolgreich. Ergebnisse: docs/analysis/reproduced');
