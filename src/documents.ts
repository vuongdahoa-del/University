import DOMPurify from 'dompurify';
import type { JSONContent } from '@tiptap/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ExternalHyperlink, ImageRun } from 'docx';

export function cleanHTML(html:string):string {
  const fragment=DOMPurify.sanitize(html,{RETURN_DOM_FRAGMENT:true,ADD_ATTR:['data-page-break'],FORBID_TAGS:['style','script','iframe','object','embed','form'],FORBID_ATTR:['srcset']});
  // Only embedded raster images belong to an offline document. Do not retain
  // remote/relative image paths that could not be reopened on another machine.
  fragment.querySelectorAll('img').forEach(image=>{if(!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(image.getAttribute('src')||''))image.remove();});
  const container=document.createElement('div');container.append(fragment);return container.innerHTML;
}
export function validateDocument(raw:string):JSONContent {
  const v=JSON.parse(raw);
  if(v.format!=='bdword'||v.version!==1||v.document?.type!=='doc')throw Error('Ungültiges B&D-Word-Dokument oder nicht unterstützte Version.');
  let count=0;
  function check(n:JSONContent,depth=0){
    if(++count>100000||depth>80||!n||typeof n.type!=='string')throw Error('Dokument ist zu komplex oder beschädigt.');
    if(n.type==='image'&&!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(n.attrs?.src||''))throw Error('Dokument enthält ein nicht eingebettetes Bild.');
    if(n.type==='text'&&typeof n.text!=='string')throw Error('Ungültiger Text.');
    n.content?.forEach(c=>check(c,depth+1));
  }
  check(v.document);return v.document;
}
export function serializeDocument(document:JSONContent){return JSON.stringify({format:'bdword',version:1,document},null,2);}
export function base64(bytes:Uint8Array){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
export function fromBase64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
export async function exportDocx(json:JSONContent):Promise<string>{
  const dimensions=new Map<string,{width:number;height:number}>();
  async function measure(node:JSONContent):Promise<void>{
    if(node.type==='image'){
      const src=String(node.attrs?.src||'');
      if(!/^data:image\/(png|jpeg|gif);base64,/i.test(src))throw Error('DOCX-Bilder bitte als PNG, JPEG oder GIF einfügen.');
      const image=new window.Image();image.src=src;await image.decode();
      const scale=Math.min(1,480/image.naturalWidth,650/image.naturalHeight);
      dimensions.set(src,{width:Math.round(image.naturalWidth*scale),height:Math.round(image.naturalHeight*scale)});
    }
    await Promise.all((node.content||[]).map(measure));
  }
  await measure(json);
  const inline=(nodes:JSONContent[]=[]): (TextRun|ExternalHyperlink|ImageRun)[] => nodes.flatMap((n): (TextRun|ExternalHyperlink|ImageRun)[]=>{
    if(n.type==='hardBreak')return [new TextRun({break:1})];
    if(n.type==='image'){
      const match=/^data:image\/(png|jpeg|gif);base64,(.*)$/i.exec(n.attrs?.src||'');
      if(!match)throw Error('DOCX-Bilder bitte als PNG, JPEG oder GIF einfügen.');
      return [new ImageRun({type:match[1]==='jpeg'?'jpg':match[1] as 'png'|'gif',data:fromBase64(match[2]),transformation:dimensions.get(n.attrs!.src)!})];
    }
    const marks=n.marks||[], style=marks.find(m=>m.type==='textStyle')?.attrs||{};
    const link=marks.find(m=>m.type==='link');
    const run=new TextRun({text:n.text||'',bold:marks.some(m=>m.type==='bold'),italics:marks.some(m=>m.type==='italic'),underline:marks.some(m=>m.type==='underline')?{}:undefined,strike:marks.some(m=>m.type==='strike'),font:style.fontFamily,size:style.fontSize?parseFloat(style.fontSize)*2:undefined,color:style.color?.replace('#',''),shading:marks.find(m=>m.type==='highlight')?{fill:(marks.find(m=>m.type==='highlight')?.attrs?.color||'#fff19a').replace('#','')}:undefined});
    return link&&/^https?:\/\//i.test(link.attrs?.href)?[new ExternalHyperlink({link:link.attrs!.href,children:[run]})]:[run];
  });
  const blocks=(nodes:JSONContent[]=[]): (Paragraph|Table)[]=>nodes.flatMap((n): (Paragraph|Table)[]=>{
    if(n.type==='table')return [new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:(n.content||[]).map(row=>new TableRow({children:(row.content||[]).map(cell=>new TableCell({children:blocks(cell.content)}))}))})];
    if(n.type==='bulletList'||n.type==='orderedList')return (n.content||[]).flatMap((item,i)=>{
      const children=item.content||[];
      return children.flatMap((p,j)=>p.type==='paragraph'?[new Paragraph({children:[new TextRun(j===0?(n.type==='bulletList'?'• ':`${i+Number(n.attrs?.start||1)}. `):''),...inline(p.content)]})]:blocks([p]));
    });
    if(n.type==='image')return [new Paragraph({children:inline([n])})];
    if(n.type==='pageBreak')return [new Paragraph({pageBreakBefore:true})];
    if(n.type==='horizontalRule')return [new Paragraph({text:'────────────────'})];
    if(n.type==='blockquote')return blocks(n.content);
    const level=n.attrs?.level;
    const align:Record<string,typeof AlignmentType[keyof typeof AlignmentType]>={left:AlignmentType.LEFT,center:AlignmentType.CENTER,right:AlignmentType.RIGHT,justify:AlignmentType.JUSTIFIED};
    return [new Paragraph({children:inline(n.content),heading:n.type==='heading'?({1:HeadingLevel.HEADING_1,2:HeadingLevel.HEADING_2,3:HeadingLevel.HEADING_3} as const)[level as 1|2|3]:undefined,alignment:align[n.attrs?.textAlign],indent:n.attrs?.indent?{left:n.attrs.indent*360}:undefined})];
  });
  const doc=new Document({sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children:blocks(json.content)}]});
  return base64(new Uint8Array(await Packer.toArrayBuffer(doc)));
}
