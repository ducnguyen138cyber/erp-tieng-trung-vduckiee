// Guest-only Chromium experiment: identical runner, localhost server and throttling.
// Report measurements, never interpret one run as a production performance SLO.
import { readFile, writeFile } from 'node:fs/promises';
const before=JSON.parse(await readFile('artifacts/performance/before/audit.json','utf8'));
const after=JSON.parse(await readFile('artifacts/performance/after/audit.json','utf8'));
const compared=before.profiles.map(b=>{
  const a=after.profiles.find(x=>x.profile===b.profile);
  if(!a)throw new Error('Missing candidate profile: '+b.profile);
  const bMs=b.observedHomeMs,aMs=a.observedHomeMs;
  return {profile:b.profile,beforeMs:bMs,afterMs:aMs,
    deltaMs:aMs-bMs,changePercent:Math.round((aMs-bMs)/bMs*1000)/10,
    beforeCls:b.metrics?.cls??null,afterCls:a.metrics?.cls??null,
    beforeScripts:b.metrics?.scriptResources??null,afterScripts:a.metrics?.scriptResources??null,
    beforeAuthSdk:b.metrics?.authSdkPresent??null,afterAuthSdk:a.metrics?.authSdkPresent??null,
    baseReachable:b.reachable,candidateReachable:a.reachable,
    candidateErrors:a.uncaughtErrors||[]};
});
await writeFile('artifacts/performance/comparison.json',
  JSON.stringify({method:'One cold Chromium guest run per profile on same GitHub runner and two localhost ports; not production or signed-in performance.',compared},null,2)+'\n');
console.log('VDUCKIE_BEFORE_AFTER '+JSON.stringify(compared));
if(compared.some(x=>!x.baseReachable||!x.candidateReachable)){
  throw new Error('One of the measured app dashboards failed to initialize; do not merge.');
}
