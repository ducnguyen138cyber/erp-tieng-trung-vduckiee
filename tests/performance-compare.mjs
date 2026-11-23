// Guest-only Chromium experiment: identical runner, localhost server and throttling.
// Report measurements, never interpret one run as a production performance SLO.
import { readFile, writeFile } from 'node:fs/promises';
const before=JSON.parse(await readFile('artifacts/performance/before/audit.json','utf8'));
const after=JSON.parse(await readFile('artifacts/performance/after/audit.json','utf8'));
const medianRow=rows=>[...rows].sort((a,b)=>a.observedHomeMs-b.observedHomeMs)[Math.floor(rows.length/2)];
const compared=[...new Set(before.profiles.map(x=>x.profile))].map(profile=>{
  const baseRows=before.profiles.filter(x=>x.profile===profile),candidateRows=after.profiles.filter(x=>x.profile===profile);
  if(baseRows.length!==3||candidateRows.length!==3)throw new Error('Expected three cold samples per side: '+profile);
  const b=medianRow(baseRows),a=medianRow(candidateRows);
  const bMs=b.observedHomeMs,aMs=a.observedHomeMs;
  return {profile:b.profile,beforeMs:bMs,afterMs:aMs,
    deltaMs:aMs-bMs,changePercent:Math.round((aMs-bMs)/bMs*1000)/10,
    beforeCls:b.metrics?.cls??null,afterCls:a.metrics?.cls??null,
    beforeScripts:b.metrics?.scriptResources??null,afterScripts:a.metrics?.scriptResources??null,
    beforeAuthSdk:b.metrics?.authSdkPresent??null,afterAuthSdk:a.metrics?.authSdkPresent??null,
    baseSamples:baseRows.map(x=>x.observedHomeMs),candidateSamples:candidateRows.map(x=>x.observedHomeMs),
    baseReachable:baseRows.every(x=>x.reachable),candidateReachable:candidateRows.every(x=>x.reachable),
    candidateErrors:candidateRows.flatMap(x=>x.uncaughtErrors||[])};
});
await writeFile('artifacts/performance/comparison.json',
  JSON.stringify({method:'Median of three cold Chromium guest runs per profile on same GitHub runner and two localhost ports; not production or signed-in performance.',compared},null,2)+'\n');
console.log('VDUCKIE_BEFORE_AFTER '+JSON.stringify(compared));
if(compared.some(x=>!x.baseReachable||!x.candidateReachable)){
  throw new Error('One of the measured app dashboards failed to initialize; do not merge.');
}
if(compared.some(x=>x.candidateErrors.length||x.afterMs>x.beforeMs)||!compared.some(x=>x.profile==='mobile-4g-low-end'&&x.afterMs<x.beforeMs))throw new Error('Performance acceptance failed: no median regression, no browser errors, and mobile improvement required. Do not merge.');
