/* Account-isolated Vietnamese progress. No HSK, ERP or EXP writes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.VDuckieVIProgress=factory();})(typeof window==='object'?window:this,function(){
'use strict';
var SECTIONS=['words','grammar','dialogue','practice'],DAY=86400000;
function validKey(key){return /^(?:position|[lp]\d{2}(?:-w\d{2})?)$/.test(key);}
function stamp(value){return Math.max(0,Math.min(Number(value)||0,8640000000000000));}
function clean(key,value){
 value=value&&typeof value==='object'?value:{};var out={updatedAt:stamp(value.updatedAt)};
 if(key==='position'){out.unit=/^[lp]\d{2}$/.test(value.unit)?value.unit:'p01';out.tab=['words','grammar','dialogue','practice','quiz'].includes(value.tab)?value.tab:'words';return out;}
 if(key.includes('-w')){out.bookmarked=!!value.bookmarked;out.known=!!value.known;out.stage=Math.max(0,Math.min(5,Math.floor(Number(value.stage)||0)));out.nextReview=stamp(value.nextReview);out.lastReviewed=stamp(value.lastReviewed);out.wrong=Math.max(0,Math.floor(Number(value.wrong)||0));out.correct=Math.max(0,Math.floor(Number(value.correct)||0));return out;}
 out.sections={};SECTIONS.forEach(function(s){if(value.sections&&value.sections[s]===true)out.sections[s]=true;});
 out.words={};Object.keys(value.words||{}).forEach(function(id){if(id.startsWith(key+'-w')&&/^[lp]\d{2}-w\d{2}$/.test(id)&&value.words[id])out.words[id]=true;});
 out.best=Math.max(0,Math.min(100,Math.round(Number(value.best)||0)));out.completed=SECTIONS.every(function(s){return out.sections[s];})&&out.best>=80;
 return out;
}
function stable(value){if(!value||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stable).join(',')+']';return '{'+Object.keys(value).sort().map(function(k){return JSON.stringify(k)+':'+stable(value[k]);}).join(',')+'}';}
function mergeRecord(key,a,b){
 if(!a)return clean(key,b);if(!b)return clean(key,a);a=clean(key,a);b=clean(key,b);
 var latest=a.updatedAt>b.updatedAt?a:b.updatedAt>a.updatedAt?b:stable(a)>stable(b)?a:b;
 if(key==='position'||key.includes('-w'))return latest;
 return clean(key,{updatedAt:Math.max(a.updatedAt,b.updatedAt),sections:Object.assign({},a.sections,b.sections),words:Object.assign({},a.words,b.words),best:Math.max(a.best,b.best)});
}
function normalize(records){var result={};Object.keys(records||{}).forEach(function(k){if(validKey(k))result[k]=clean(k,records[k]);});return result;}
function merge(a,b){var out=normalize(a);Object.keys(b||{}).forEach(function(k){if(validKey(k))out[k]=mergeRecord(k,out[k],b[k]);});return out;}
function review(value,correct,now){
 var out=clean('l01-w01',value);out.updatedAt=now;out.lastReviewed=now;
 if(correct){out.correct++;out.known=true;var fresh=!value||!value.lastReviewed||now-value.lastReviewed>=20*3600000||out.stage===0;if(fresh){out.stage=Math.min(5,out.stage+1);out.nextReview=now+[1,3,7,14,30][Math.max(0,out.stage-1)]*DAY;}}
 else {out.wrong++;out.stage=0;out.nextReview=now+10*60000;}
 return out;
}
function create(options){
 var storage=options.storage,cloud=options.cloud,onChange=options.onChange||function(){},clock=options.now||Date.now;
 var account='guest',records={},epoch=0,timer=null,running=null,status='仅保存在本机，登录后使用独立账户进度。';
 var prefix='vduckie-vietnamese-v1:';
 function read(){try{return normalize(JSON.parse(storage.getItem(prefix+account)||'{}'));}catch(_){return {};}}
 function persist(){try{storage.setItem(prefix+account,JSON.stringify(records));return true;}catch(_){status='本机存储不可用。请保持联网并检查同步状态。';return false;}}
 function notify(){onChange({records:records,status:status,account:account});}
 function schedule(){clearTimeout(timer);if(account!=='guest')timer=setTimeout(function(){sync();},650);}
 function switchAccount(id){var next=id||'guest';if(next===account)return;clearTimeout(timer);epoch++;running=null;account=next;records=read();status=account==='guest'?'游客进度仅保存在本机。':'正在读取此账户的越南语进度…';notify();if(account!=='guest')sync();}
 function change(key,update){if(!validKey(key))throw Error('Invalid Vietnamese progress key');var value=clean(key,records[key]);update(value);value.updatedAt=Math.max(clock(),value.updatedAt+1);records[key]=clean(key,value);status=account==='guest'?'游客进度已保存在本机。':'已保存本机，等待云端同步。';persist();notify();schedule();return records[key];}
 async function sync(){
  records=merge(records,read());
  if(account==='guest'){notify();return;}if(running)return running;
  var myEpoch=epoch,myAccount=account;
  if(options.online&&!options.online()){status='当前离线，进度保存在本机；联网后自动重试。';notify();return;}
  status='正在同步越南语进度…';notify();
  var job=(async function(){try{
   var remote=normalize(await cloud.loadVietnameseProgress());if(epoch!==myEpoch||account!==myAccount)return;
   records=merge(records,remote);persist();notify();
   var pending=Object.keys(records).filter(function(k){return stable(records[k])!==stable(remote[k]);}).map(function(k){return {key:k,value:records[k]};});
   for(var i=0;i<pending.length;i+=24){if(epoch!==myEpoch)return;await cloud.saveVietnameseRecords(pending.slice(i,i+24));}
   if(epoch!==myEpoch)return;
   var changed=pending.some(function(item){return stable(item.value)!==stable(records[item.key]);});
   status=changed?'已保存本机，继续同步新进度…':'已同步到当前账户。';notify();if(changed)schedule();
  }catch(error){if(epoch===myEpoch){status='暂未同步到云端。进度保存在本机，可点击重试。';notify();}}
  finally{if(epoch===myEpoch)running=null;}})();running=job;return job;
 }
 records=read();
 return {snapshot:function(){return {records:records,status:status,account:account};},get:function(key){return clean(key,records[key]);},change:change,sync:sync,switchAccount:switchAccount,dispose:function(){epoch++;clearTimeout(timer);},due:function(now){now=now||clock();return Object.keys(records).filter(function(k){var r=records[k];return k.includes('-w')&&(r.known||r.wrong||r.bookmarked)&&r.nextReview<=now;});}};
}
return {create:create,normalize:normalize,merge:merge,mergeRecord:mergeRecord,review:review,stable:stable,clean:clean,validKey:validKey};
});
