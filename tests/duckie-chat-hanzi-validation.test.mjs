import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync('functions/api/duckie-chat.js','utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function req(question){return new Request('https://vduckie.pages.dev/api/duckie-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:question}]})})}
test('Chinese writing request retries missing Hanzi and keeps real characters',async()=>{
 let calls=0;
 const env={AI:{run:async()=>{calls++;return {response:calls===1?'\u201c\u201d (wǎn chī)':'吃晚饭 (chī wǎnfàn) — ăn tối'}}}};
 const res=await api.onRequestPost({request:req('ăn tối viết như nào trong tiếng Trung?'),env});assert.equal(res.status,200);assert.equal(calls,2);assert.match((await res.json()).reply,/吃晚饭/);
});
test('writing request never returns fake empty Chinese glyphs',async()=>{
 const env={AI:{run:async()=>({response:'"" (wǎn chī) — ăn tối'})}};
 const res=await api.onRequestPost({request:req('ăn tối viết thế nào bằng tiếng trung?'),env});assert.equal(res.status,422);assert.match((await res.json()).error,/chữ Hán/);
});
test('normal chats do not require Chinese characters',async()=>{
 let calls=0;const env={AI:{run:async()=>{calls++;return {response:'Xin chào!'}}}};
 const res=await api.onRequestPost({request:req('hello'),env});assert.equal(res.status,200);assert.equal(calls,1);
});
