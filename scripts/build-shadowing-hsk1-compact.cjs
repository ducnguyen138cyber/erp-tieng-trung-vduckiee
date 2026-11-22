// Deterministic public projection; canonical course records stay unchanged.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/hsk/hsk1/sentences');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
const records=manifest.shards.flatMap(s=>JSON.parse(fs.readFileSync(path.join(dir,s.file),'utf8')).records).filter(r=>r.chinese&&r.pinyin&&r.vietnamese).map(r=>[r.id,r.chinese,r.pinyin,r.vietnamese,r.reviewStatus||'unreviewed']);
if(records.length!==900||new Set(records.map(r=>r[0])).size!==900)throw Error('Unexpected HSK1 sentence corpus');
const output=JSON.stringify({version:1,records})+'\n',target=path.join(root,'data/shadowing/hsk1-compact-v1.json');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('Regenerate compact HSK1 shadowing data');}else fs.writeFileSync(target,output);
