// Outil de développement : crée les exemples HTML depuis le vrai modèle du générateur.
// node tools/generate_examples.js
const fs=require('fs');const path=require('path');const vm=require('vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'studio.html'),'utf8');
const from=html.indexOf('function fillTpl(tpl, key, val)');
const until=html.indexOf('`;\n',html.indexOf('const FLASHCARD_TEMPLATE = `',from))+2;
if(from<0||until<2)throw new Error('Template missing in studio.html');
const js=html.slice(from,until);
// Eval template and helper only. Do not execute DOM or network-dependent code.
const ctx=vm.createContext({});
vm.runInContext(`function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}\n${js}\nglobalThis.build=buildFlashcardHTML;`,ctx,{timeout:2000});
const samples=JSON.parse(fs.readFileSync(path.join(root,'exemples','donnees_generation.json'),'utf8'));
for(const [name,data] of Object.entries(samples)){
 const out=ctx.build({...data,voicePack:{}});
 fs.writeFileSync(path.join(root,'cards',name+'.html'),out,'utf8');
 console.log(name+'.html',out.length,'bytes');
}
