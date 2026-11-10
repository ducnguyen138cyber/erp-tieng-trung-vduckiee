// Reuse existing HSK1–4 examples; never invent a missing translation.
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {runInNewContext} from 'node:vm';
const parts=Array.from({length:16},(_,i)=>readFileSync(`pinyin-data${i+1}.js`,'utf8').match(/push\("([A-Za-z0-9+/=]+)"\)/)[1]);
const context={};context.window=context;context.globalThis=context;
runInNewContext(gunzipSync(Buffer.from(parts.join(''),'base64')).toString(),context);
const buckets=Array.from({length:16},()=>({}));
function bucket(word){return Array.from(word).reduce((hash,ch)=>(hash*31+ch.codePointAt(0))>>>0,0)%16;}
let count=0;
for(let level=1;level<=4;level++){
 const dir=`data/hsk/hsk${level}/vocabulary`;
 for(const file of readdirSync(dir).filter(f=>f!=='index.json'&&f.endsWith('.json')).sort()){
  for(const record of JSON.parse(readFileSync(`${dir}/${file}`,'utf8')).records||[]){
   const example=(record.examples||[]).find(e=>e.zh&&e.vi);
   if(!record.simplified||!example)continue;
   const word=record.simplified,entries=buckets[bucket(word)];
   if(entries[word])continue;
   entries[word]={level,pinyin:record.pinyinTone||record.pinyin,meaningVi:record.meaningVi,
    example:{zh:example.zh,pinyin:example.pinyin||context.pinyinPro.pinyin(example.zh,{toneType:'symbol',toneSandhi:true}),vi:example.vi},
    source:{path:`${dir}/${file}`,id:record.id,reviewStatus:record.reviewStatus||'unreviewed'}};
   count++;
  }
 }
}
mkdirSync('data/dictionary/learning-examples',{recursive:true});
for(let i=0;i<16;i++)writeFileSync(`data/dictionary/learning-examples/${i.toString(16)}.json`,JSON.stringify({version:1,entries:buckets[i]})+'\n');
console.log(`Reused ${count} HSK1–4 vocabulary examples in 16 lazy-loaded shards.`);
