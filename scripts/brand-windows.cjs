// Edit only our generated application executable. No Wine or signing key is needed.
const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async function(context){
 if(context.electronPlatformName!=='win32')return;
 const PE=await import('pe-library');
 const RE=await import('resedit');
 const target=path.join(context.appOutDir,'B&D Word.exe');
 const exe=PE.NtExecutable.from(await fs.readFile(target),{ignoreCert:true});
 const resources=PE.NtExecutableResource.from(exe);
 const icon=RE.Data.IconFile.from(await fs.readFile(path.join(context.packager.projectDir,'assets/icon.ico')));
 const groups=RE.Resource.IconGroupEntry.fromEntries(resources.entries);
 RE.Resource.IconGroupEntry.replaceIconsForResource(resources.entries,groups[0]?.id||1,groups[0]?.lang||1033,icon.icons.map(i=>i.data));
 const versions=RE.Resource.VersionInfo.fromEntries(resources.entries);
 for(const info of versions){
  info.setFileVersion(1,0,0,0,1033);info.setProductVersion(1,0,0,0,1033);
  for(const language of info.getAllLanguagesForStringValues())info.setStringValues(language,{FileDescription:'B&D Word',ProductName:'B&D Word',OriginalFilename:'B&D Word.exe',InternalName:'bd-word'});
  info.outputToResourceEntries(resources.entries);
 }
 resources.outputResource(exe);
 await fs.writeFile(target,Buffer.from(exe.generate()));
 const files=[], dirs=[];
 async function inventory(folder,relative=''){
  for(const entry of await fs.readdir(folder,{withFileTypes:true})){
   const rel=path.join(relative,entry.name);
   if(entry.isDirectory()){dirs.push(rel);await inventory(path.join(folder,entry.name),rel);}
   else if(entry.isFile())files.push(rel);
   else throw Error('Unexpected non-file in Windows package: '+rel);
  }
 }
 await inventory(context.appOutDir);
 const backslash=String.fromCharCode(92);
 const winPath=p=>p.split(path.sep).join(backslash).split('$').join('$$');
 const lines=[...files.map(p=>'Delete "$INSTDIR'+backslash+winPath(p)+'"'),...dirs.sort((a,b)=>b.length-a.length).map(p=>'RMDir "$INSTDIR'+backslash+winPath(p)+'"')];
 await fs.writeFile(path.join(context.packager.projectDir,'release/uninstall-files.nsh'),lines.join('\n')+'\n');
};
