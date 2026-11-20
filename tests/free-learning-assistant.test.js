import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const source=fs.readFileSync('assets/ai/free-learning-assistant.js','utf8');
const entry=fs.readFileSync('index.html','utf8');
test('six free assistant modules load without paid API or invented model answers',()=>{
 new vm.Script(source);
 for(const name of ['explain','talk','quiz','weak','voice','help'])assert.match(source,new RegExp('\\b'+name+'\\b'));
 assert.match(source,/SpeechRecognition/);
 assert.match(source,/vduckie-free-assistant-v1/);
 assert.match(source,/VDuckieDictionary/);
 assert.match(source,/Không có ví dụ đã xác minh|Chưa có ví dụ được xác minh/);
 assert.doesNotMatch(source,/sk-[a-zA-Z0-9]|OPENAI_API_KEY|api\.openai\.com/);
 assert.match(entry,/assets\/ai\/free-learning-assistant\.js/);
 assert.match(entry,/assets\/ai\/free-learning-assistant\.css/);
});
test('learning outcomes distinguish rules from actual AI',()=>{
 assert.match(source,/Bản không dùng AI API/);
 assert.match(source,/không chấm chính xác ngữ pháp/);
 assert.match(source,/chưa phải điểm đánh giá thanh điệu/);
});
test('assistant uses the same canonical HSK example and level as dictionary detail',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://example.invalid/',runScripts:'outside-only'}),w=dom.window;
 try{
  const word={hanzi:'努力',pinyin:'nǔ lì',hskLevels:[2],meanings:{hsk:['nỗ lực']},examples:{hsk:[],erp:[]}};
  w.VDuckieDictionary={records:[word]};w.VDuckieHeaderSearch={selected:()=>word};
  w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(String(url).split('?')[0].replace(/^\.\//,''),'utf8'))});
  w.eval(fs.readFileSync('assets/search/learning-examples.js','utf8'));w.eval(source);
  w.VDuckieFreeAssistant.open('explain');
  const entry=await w.VDuckieLearningExamples.lookup('努力');assert.equal(entry.level,3);
  await new Promise(r=>setImmediate(r));
  assert.equal(w.document.querySelector('[data-va-hsk]').textContent,'3 · GF0025-2021');
  const content=w.document.querySelector('[data-va-source-example]').textContent;
  for(const value of [entry.example.zh,entry.example.pinyin,entry.example.vi])assert.ok(content.includes(value),value);
  w.document.querySelector('[data-va-tab="help"]').click();
  await new Promise(r=>setImmediate(r));
  assert.equal(w.document.querySelector('[data-va-hsk]').textContent,'3 · GF0025-2021');
 }finally{w.close();}
});
