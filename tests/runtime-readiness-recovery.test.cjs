const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {getRuntimeSnapshot,findAssets}=require('./helpers/runtime-snapshot');
const {detectServiceWorker}=require('../scripts/hsk1-production-readiness-audit');
test('runtime inventory executes document-write replacements and public developer gating',()=>{
 const publicShell=getRuntimeSnapshot(),developerShell=getRuntimeSnapshot({search:'?developer=1'});
 assert.equal(findAssets('developer-center.js',publicShell).length,0);
 assert.equal(findAssets('developer-center.js',developerShell).length,1);
 assert.equal(findAssets('mobile-navigation.js',publicShell).length,1);
 assert.equal(findAssets('sentence-game.js',publicShell).length,1);
 assert.equal(findAssets('exp-core-v89.js',publicShell).length,0);
 assert.equal(findAssets('exp-core-v90.js',publicShell).length,1);
});
test('readiness accepts current PWA but rejects auth caching and cross-version executable fallbacks',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-readiness-'));
 try{
  const worker=fs.readFileSync('service-worker.js','utf8');fs.copyFileSync('pwa-register.js',path.join(tmp,'pwa-register.js'));
  fs.writeFileSync(path.join(tmp,'service-worker.js'),worker);let result=detectServiceWorker(tmp);
  assert.equal(result.present,true);assert.equal(result.privateBypass,true);assert.equal(result.exactVersions,true);assert.equal(result.networkFirstCode,true);
  fs.writeFileSync(path.join(tmp,'service-worker.js'),worker.replace('if (isDynamicOrPrivate(request, url)) return;',''));
  assert.equal(detectServiceWorker(tmp).privateBypass,false);
  fs.writeFileSync(path.join(tmp,'service-worker.js'),worker.replace('const cached = await caches.match(request);','const cached = await caches.match(request, { ignoreSearch: true });'));
  assert.equal(detectServiceWorker(tmp).exactVersions,false);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
