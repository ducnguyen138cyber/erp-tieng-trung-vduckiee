'use strict';
// Reproducible extraction from existing paired text; never translate or invent a reading at runtime.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('assets/boot/pinyin-parts-boot-v1.js','utf8'),ctx);vm.runInContext(zlib.gunzipSync(Buffer.from(ctx.__PINYIN_GZIP_PARTS__.join(''),'base64')).toString(),ctx);
const frames=JSON.parse(fs.readFileSync('data/games/sentence-expansion-frames.json')),manifest={version:2,selection:'HSK levels follow VDuckie lesson sources; original expansion uses graded sentence patterns, not an official exam claim',pinyin:'Source readings retained; missing readings generated at build time with the repository pinyin-pro engine',reviewStatus:'machine-checked; no independent human signoff claimed',levels:[]};
const id=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16),norm=s=>s.normalize('NFC').toLowerCase().replace(/[\p{P}\p{Z}\s]+/gu,'');
const seenChinese=new Set();
for(let level=1;level<=6;level++){
 const groups=new Map();let rejected=0;
 function add(zh,vi,py,source,family){
  zh=String(zh||'').trim();vi=String(vi||'').trim();const chars=zh.match(/[\u3400-\u9fff]/g)||[];
  if(chars.length<4||chars.length>80||vi.length<5||vi.length>260||!/[。！？?!]$/.test(zh)||/[\u3400-\u9fff]/.test(vi)||/[a-zA-Z0-9]/.test(zh)||/语境|词语|目标词|例句|范例|上下文|“|”/.test(zh)||/khung kết hợp|ví dụ đặt|nghĩa trọng tâm|trong ngữ cảnh|từ .*được dùng/i.test(vi)){rejected++;return;}
  const reading=py||ctx.pinyinPro.pinyin(zh,{toneType:'symbol',type:'array',nonZh:'removed'}).filter(x=>/[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(x)).join(' ');
  if(!reading||/[\u3400-\u9fff0-9]/.test(reading)){rejected++;return;}
  const chineseKey=norm(zh);if(seenChinese.has(chineseKey))return;seenChinese.add(chineseKey);
  const key=norm(vi);let item=groups.get(key);if(!item){item={id:'sg-'+id(key),level,topic:'hsk'+level,vi,family,answers:[],sources:[]};groups.set(key,item);}
  if(!item.answers.some(a=>a.hanzi===zh)&&item.answers.length<6){item.answers.push({hanzi:zh,pinyin:reading});item.sources.push({path:source,pinyinSource:py?'source':'repository-pinyin-pro-build'});}
 }
 function walk(o,p,family){if(Array.isArray(o)){o.forEach((v,i)=>walk(v,p+'/'+i,family));return;}if(!o||typeof o!=='object')return;
  if(o.id)family=o.id;
  const zh=o.zh||o.chinese||o.textZh,vi=o.vi||o.vietnamese||o.textVi;if(typeof zh==='string'&&typeof vi==='string')add(zh,vi,o.pinyinTone||o.pinyin,p,family);
  for(const [k,v] of Object.entries(o))if(!/incorrect|wrong|commonerror/i.test(k))walk(v,p+'/'+k,family);
 }
 const root='data/hsk/hsk'+level;
 if(level===1){const ix=JSON.parse(fs.readFileSync(root+'/sentences/index.json'));for(const s of ix.shards){const f=root+'/sentences/'+s.file;walk(JSON.parse(fs.readFileSync(f)),f,'canonical');}}
 for(const name of ['grammar.json','lessons.json','vocabulary-enrichment.json']){const f=root+'/'+name;walk(JSON.parse(fs.readFileSync(f)),f,name);}
 for(const [i,pair] of (frames.levels[level]||[]).entries())for(const [j,topic] of frames.topics.entries())add(pair[0].replaceAll('{zh}',topic[0]),pair[1].replaceAll('{vi}',topic[1]),null,'data/games/sentence-expansion-frames.json/levels/'+level+'/'+i+'/topic/'+j,'original-'+level+'-'+i);
 const sentences=[...groups.values()].sort((a,b)=>a.id.localeCompare(b.id));const file='sentences-hsk'+level+'.json',json=JSON.stringify({version:2,level,sentences},null,2)+'\n';fs.writeFileSync('data/games/'+file,json);manifest.levels.push({level,topic:'hsk'+level,file,count:sentences.length,answers:sentences.reduce((n,s)=>n+s.answers.length,0),sha256:crypto.createHash('sha256').update(json).digest('hex')});console.log('HSK'+level,sentences.length,'prompts; rejected',rejected);
}
manifest.total=manifest.levels.reduce((n,s)=>n+s.count,0);fs.writeFileSync('data/games/sentence-catalog.json',JSON.stringify(manifest,null,2)+'\n');console.log('Total',manifest.total);
