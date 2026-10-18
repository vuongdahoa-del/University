export {};
type Reply = {error?:string;canceled?:boolean;file?:string;name?:string;ext?:string;content?:string;src?:string};
declare global { interface Window { desktop?: {
 open:()=>Promise<Reply>; save:(data:{content:string;file?:string;name?:string;saveAs:boolean})=>Promise<Reply>;
 image:()=>Promise<Reply>;pdf:(html:string)=>Promise<Reply>;print:(html:string)=>Promise<Reply>;docx:(base64:string)=>Promise<Reply>;
 dirty:(value:boolean)=>Promise<unknown>;window:(action:string)=>Promise<unknown>;onClose:(cb:()=>void)=>()=>void;
} } }
