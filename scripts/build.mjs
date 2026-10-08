import {mkdir,copyFile,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const out=new URL('dist/',root);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const name of ['index.html','style.css','app.js','game.js','storage.js'])await copyFile(new URL(name,root),new URL(name,out));
console.log('Static website built in dist/');
