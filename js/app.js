"use strict";
/* Tableau de bord inspiré visuellement du site de référence, logique réécrite. */
const CATALOGUE = window.FLASHCARDS_CATALOGUE || {totalLessons:30,available:{},exclude:{}};
const LANG = {
 fr:{lesson:'Leçon',words:'Mots',sentences:'Phrases',text:'Texte',soon:'Bientôt',banner:'Créer des cartes et préparer une nouvelle leçon',hint:'Choisissez une leçon, puis Mots, Phrases ou Texte. Les éléments grisés seront disponibles après publication.',search:'Rechercher une leçon (1–30)',only:'Afficher uniquement les leçons disponibles',ready:'leçon(s) disponible(s)',no:'Aucune leçon ne correspond à votre recherche.',footer:'Projet local en HTML, CSS et JavaScript · aucune base de données requise.',studio:'Atelier de création ↗'},
 en:{lesson:'Lesson',words:'Words',sentences:'Sentences',text:'Text',soon:'Coming soon',banner:'Create flashcards and prepare a new lesson',hint:'Choose a lesson, then Words, Sentences or Text. Grey links are not available yet.',search:'Find a lesson (1–30)',only:'Only available lessons',ready:'available lesson(s)',no:'No lesson matches your search.',footer:'Local HTML, CSS and JavaScript project · no database needed.',studio:'Creator studio ↗'},
 zh:{lesson:'课',words:'生词',sentences:'句子',text:'课文',soon:'即将上线',banner:'制作闪卡并创建新课程',hint:'选择一课，然后选择生词、句子或课文。灰色项目暂不可用。',search:'搜索课程（1–30）',only:'仅显示有内容的课程',ready:'课可用',no:'没有匹配的课程',footer:'本地 HTML / CSS / JavaScript，无需数据库。',studio:'制作闪卡 ↗'},
 es:{lesson:'Lección',words:'Palabras',sentences:'Frases',text:'Texto',soon:'Próximamente',banner:'Crear tarjetas y preparar una nueva lección',hint:'Elige una lección y luego Palabras, Frases o Texto. Los enlaces grises aún no están disponibles.',search:'Buscar una lección (1–30)',only:'Solo lecciones disponibles',ready:'lección(es) disponible(s)',no:'No se encontraron lecciones.',footer:'Proyecto local HTML, CSS y JavaScript · sin base de datos.',studio:'Crear tarjetas ↗'},
 ru:{lesson:'Урок',words:'Слова',sentences:'Предложения',text:'Текст',soon:'Скоро',banner:'Создать карточки и подготовить урок',hint:'Выберите урок и затем слова, предложения или текст. Серые ссылки пока недоступны.',search:'Поиск урока (1–30)',only:'Только доступные уроки',ready:'урок(ов) доступно',no:'Уроки не найдены.',footer:'Локальный HTML, CSS и JavaScript · без базы данных.',studio:'Редактор карточек ↗'},
 ar:{lesson:'الدرس',words:'الكلمات',sentences:'الجمل',text:'النص',soon:'قريباً',banner:'إنشاء بطاقات وإعداد درس جديد',hint:'اختر الدرس ثم الكلمات أو الجمل أو النص. الروابط الرمادية غير متاحة حالياً.',search:'بحث عن درس (1–30)',only:'الدروس المتاحة فقط',ready:'دروس متاحة',no:'لا توجد دروس مطابقة.',footer:'مشروع محلي HTML وCSS وJavaScript بدون قاعدة بيانات.',studio:'استوديو البطاقات ↗'}
};
const NAMES={fr:'Français',en:'English',zh:'中文',es:'Español',ru:'Русский',ar:'العربية'};
const searchEl=document.getElementById('lessonSearch'),onlyEl=document.getElementById('onlyAvailable');
const known=CATALOGUE.available||{};
const available={};
const kinds=['words','sentences','text'];
const count=Math.max(1,Number(CATALOGUE.totalLessons)||30);
const pad=n=>String(n).padStart(2,'0');
const path=(n,kind)=>kind==='text'?`texts/lesson${pad(n)}.json`:`cards/lesson${pad(n)}_${kind}.html`;
const link=(n,kind)=>kind==='text'?`read.html?lesson=${pad(n)}`:path(n,kind);
let lang=loadLang();let probeSequence=0;
function loadLang(){try {const chosen=localStorage.getItem('mes_cartes_lang');if(LANG[chosen])return chosen;}catch(e){}return LANG[(navigator.language||'fr').slice(0,2)]?(navigator.language||'fr').slice(0,2):'fr';}
function tr(key){return (LANG[lang]||LANG.fr)[key]||LANG.fr[key]||key;}
function renderLangs(){const box=document.getElementById('langs');box.replaceChildren();Object.entries(NAMES).forEach(([code,name])=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.className=lang===code?'active':'';b.setAttribute('aria-pressed',lang===code?'true':'false');b.onclick=()=>{lang=code;try{localStorage.setItem('mes_cartes_lang',code);}catch(e){}render();};box.append(b);});}
function isEnabled(n,k){return Array.isArray(available[n])&&available[n].includes(k);}
function updateStatics(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.getElementById('bannerText').textContent=tr('banner');document.getElementById('hint').textContent=tr('hint');searchEl.placeholder=tr('search');document.getElementById('onlyAvailableText').textContent=tr('only');document.getElementById('footerText').textContent=tr('footer');document.getElementById('footerLink').textContent=tr('studio');}
function render(){renderLangs();updateStatics();const grid=document.getElementById('grid');grid.replaceChildren();const q=searchEl.value.trim().toLowerCase();let shown=0;let totalAvailable=0;
for(let n=1;n<=count;n++){const existing=kinds.filter(k=>isEnabled(n,k));if(existing.length)totalAvailable++;if(onlyEl.checked&&!existing.length)continue;
const matches=q===''||String(n).includes(q)||`${tr('lesson')} ${n}`.toLowerCase().includes(q)||`lesson ${n}`.includes(q)||`leçon ${n}`.includes(q);if(!matches)continue;
const article=document.createElement('article');article.className='lesson-card'+(!existing.length?' empty':'');article.setAttribute('aria-label',`${tr('lesson')} ${n}`);
const heading=document.createElement('div');heading.className='lesson-head';const number=document.createElement('strong');number.textContent=n;const small=document.createElement('span');small.textContent=tr('lesson');heading.append(number,small);article.append(heading);
const slots=document.createElement('div');slots.className='lesson-slots';kinds.forEach(k=>{if((CATALOGUE.exclude?.[n]||[]).includes(k))return;const a=document.createElement('a');const ready=isEnabled(n,k);a.className='lesson-slot '+(ready?'ready':'unavailable');const title=document.createElement('span');title.textContent=tr(k);a.append(title);if(ready){a.href=link(n,k);}else{const suffix=document.createElement('span');suffix.className='soon';suffix.textContent=tr('soon');a.append(suffix);a.removeAttribute('href');a.setAttribute('aria-disabled','true');}slots.append(a);});article.append(slots);grid.append(article);shown++;}
const empty=document.getElementById('empty');empty.hidden=shown>0;empty.textContent=tr('no');document.getElementById('status').textContent=`${totalAvailable}/${count} ${tr('ready')}`;
}
function updateFromManifest(){for(let n=1;n<=count;n++){available[n]=Array.isArray(known[n])?[...known[n]]:[];}}
async function probe(){if(location.protocol==='file:')return;const seq=++probeSequence;const checks=[];for(let n=1;n<=count;n++)for(const k of kinds)if(!(CATALOGUE.exclude?.[n]||[]).includes(k))checks.push([n,k,path(n,k)]);
const out=[];const concurrency=8;let pos=0;
async function worker(){while(pos<checks.length){const index=pos++;const [n,k,p]=checks[index];let ok=false;try{const r=await fetch(p,{method:'HEAD',cache:'no-store'});ok=r.ok;}catch(e){}out.push([n,k,ok]);}}
await Promise.all(Array.from({length:concurrency},worker));if(seq!==probeSequence)return;for(let n=1;n<=count;n++)available[n]=[];for(const [n,k,ok] of out)if(ok)available[n].push(k);render();}
searchEl.addEventListener('input',render);onlyEl.addEventListener('change',render);updateFromManifest();render();probe();
