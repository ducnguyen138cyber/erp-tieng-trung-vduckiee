import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const code=fs.readFileSync('functions/api/duckie-chat.js','utf8');
const {onRequestPost}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
async function ask(messages){
 let system='';
 const env={AI:{run:async(_model,options)=>{system=options.messages[0].content;return {response:'吃晚饭 (chī wǎnfàn) — ăn tối'}}}};
 const request=new Request('https://vduckie.pages.dev/api/duckie-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages})});
 const result=await onRequestPost({request,env});return {status:result.status,answer:await result.json(),system};
}
test('short follow-up writing question inherits previous user topic',async()=>{
 const r=await ask([{role:'user',content:'ăn tối nghĩa là gì?'},{role:'assistant',content:'吃晚饭 (chī wǎnfàn) là ăn tối.'},{role:'user',content:'viết như thế nào?'}]);
 assert.equal(r.status,200);assert.match(r.system,/CÂU HỎI TIẾP NỐI/);assert.match(r.system,/ăn tối nghĩa là gì/);assert.match(r.system,/Không giải thích nghĩa của động từ/);
});
test('explicit new question does not force old topic',async()=>{
 const r=await ask([{role:'user',content:'ăn tối là gì?'},{role:'assistant',content:'吃晚饭'},{role:'user',content:'Giải thích câu 我喜欢中文'}]);
 assert.equal(r.status,200);assert.doesNotMatch(r.system,/CÂU HỎI TIẾP NỐI/);
});
