'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function bridge({signedIn=true,online=true}={}){
 const calls=[],session=signedIn?{user:{id:'alice'}}:null;
 const client={from(table){calls.push(['table',table]);let chain={select(fields){calls.push(['select',fields]);return chain;},eq(k,v){calls.push(['eq',k,v]);return chain;},like(k,v){calls.push(['like',k,v]);return chain;},then(resolve){return Promise.resolve({data:[{word_key:'__vduckie_vi_v1__:l01',note:'{"updatedAt":1,"best":80}'},{word_key:'__vduckie_hsk_progress_v1__',note:'{"best":100}'},{word_key:'foreign:l02',note:'{}'}],error:null}).then(resolve);},upsert(rows,options){calls.push(['upsert',rows,options]);return Promise.resolve({error:null});}};return chain;}};
 const window={__viClient:client,__viSession:session},document={readyState:'loading',addEventListener(){}};
 const source=fs.readFileSync('supabase-sync.js','utf8').replace('var client = null;','var client = window.__viClient;').replace('var session = null;','var session = window.__viSession;');
 vm.runInNewContext(source,{window,document,navigator:{onLine:online},console,URL,Promise});return {api:window.VDuckieCloud,calls};
}
test('cloud bridge writes only account-owned Vietnamese system rows and filters exact namespaces on read',async()=>{
 const {api,calls}=bridge();assert.equal(api.vietnameseIdentity().userId,'alice');
 const remote=await api.loadVietnameseProgress();assert.deepEqual(Object.keys(remote),['l01']);
 await api.saveVietnameseRecords([{key:'l01',value:{updatedAt:10,best:80}}]);
 const write=calls.find(c=>c[0]==='upsert');assert.equal(write[1][0].word_key,'__vduckie_vi_v1__:l01');assert.equal(write[1][0].category,'__system_vietnamese__');assert.equal(write[1][0].user_id,'alice');assert.equal(write[1][0].is_known,false);assert.equal(write[1][0].is_saved,false);
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='alice'));
 await assert.rejects(api.saveVietnameseRecords([{key:'__vduckie_hsk_progress_v1__',value:{}}]));
});
test('signed-out and offline saves reject truthfully instead of claiming cloud success',async()=>{
 for(const options of [{signedIn:false},{online:false}]){const {api,calls}=bridge(options);await assert.rejects(api.loadVietnameseProgress());await assert.rejects(api.saveVietnameseRecords([{key:'l01',value:{}}]));assert.equal(calls.length,0);}
});
function audioRuntime(voices){const spoken=[],messages=[];const window={location:{href:'https://example.test/'},speechSynthesis:{getVoices:()=>voices,cancel(){},speak(utterance){spoken.push(utterance);queueMicrotask(()=>utterance.onend());}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};vm.runInNewContext(fs.readFileSync('assets/vietnamese/audio.js','utf8'),{window,URL,setTimeout,clearTimeout,fetch:async()=>{throw Error('missing manifest');}});return {api:window.VDuckieVIAudio,spoken,messages};}
test('audio failure uses an installed Vietnamese voice and never reads Vietnamese in Chinese or English',async()=>{
 const no=audioto(audioRuntime([{lang:'en-US'},{lang:'zh-CN'}]));assert.equal(await no.api.play('l01','xin chào',false,m=>no.messages.push(m)),false);assert.equal(no.spoken.length,0);assert.match(no.messages.join(''),/没有越南语语音/);
 const yes=audioRuntime([{lang:'zh-CN'},{lang:'vi-VN',name:'Vietnamese'}]);assert.equal(await yes.api.device('xin chào',true,m=>yes.messages.push(m)),true);assert.equal(yes.spoken[0].voice.lang,'vi-VN');assert.ok(yes.spoken[0].rate<1);
});
function audioto(x){return x;}
