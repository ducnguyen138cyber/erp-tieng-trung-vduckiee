import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
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
 assert.match(source,/chưa có khả năng hiểu và sửa câu tự do/);
 assert.match(source,/không chấm chính xác ngữ pháp/);
 assert.match(source,/chưa phải điểm đánh giá thanh điệu/);
});
