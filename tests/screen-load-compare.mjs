import {readFile,writeFile} from 'node:fs/promises';
const root='artifacts/screen-load';
const read=async side=>JSON.parse(await readFile(`${root}/${side}/routes.json`,'utf8')).results;
const before=await read('before'),after=await read('after');
const median=rows=>[...rows].sort((a,b)=>a.elapsedMs-b.elapsedMs)[Math.floor(rows.length/2)].elapsedMs;
const groups=Map.groupBy(before,x=>`${x.profile}|${x.screen}|${x.kind}`);
const results=[];
for(const [key,b] of groups){const a=after.filter(x=>`${x.profile}|${x.screen}|${x.kind}`===key),count=b[0].kind==='warm'?3:1;
 if(b.length!==count||a.length!==count)throw Error('Incomplete screen samples: '+key);
 const beforeMs=median(b),afterMs=median(a);results.push({profile:b[0].profile,screen:b[0].screen,kind:b[0].kind,beforeMs,afterMs,changePercent:Math.round((afterMs-beforeMs)/Math.max(1,beforeMs)*1000)/10,ok:a.every(x=>x.ok&&!x.browserErrors.length),baselineOk:b.every(x=>x.ok&&!x.browserErrors.length),beforeSamples:b.map(x=>x.elapsedMs),afterSamples:a.map(x=>x.elapsedMs)});
}
await writeFile(`${root}/comparison.json`,JSON.stringify({method:'Warm median of three; cold single sample diagnostic only; do not treat as physical device metrics.',results},null,2));
for(const row of results)console.log('VDUCKIE_SCREEN_COMPARE '+JSON.stringify(row));
if(results.some(x=>!x.ok||!x.baselineOk))throw Error('Route did not load or browser error; inspect evidence before merge');
