import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const client=fs.readFileSync('assets/ai/duckie-chat.js','utf8');
const endpoint=fs.readFileSync('functions/api/duckie-chat.js','utf8');
const index=fs.readFileSync('index.html','utf8');
test('chat widget mounts and retains controls',()=>{new vm.Script(client);for(const name of ['duckie-chat-launch','duckie-chat-panel','duckie-chat-messages','duckie-chat-form','data-dc-clear','data-dc-min','data-dc-tools'])assert.ok(client.includes(name));assert.match(index,/duckie-chat\.js/);assert.match(index,/duckie-chat\.css/);});
test('backend validates chat content and explicitly detects missing AI binding',()=>{assert.match(endpoint,/env\.AI/);assert.match(endpoint,/onRequestPost/);assert.match(endpoint,/Tính năng trả lời AI chưa được kích hoạt/);assert.match(endpoint,/max_tokens:800/);assert.doesNotMatch(endpoint,/OPENAI_API_KEY/);});

test('user-facing chat has mascot and no developer footer',()=>{assert.match(client,/vduckie-welcome\.webp/);assert.doesNotMatch(client,/Chỉ gửi nội dung chat tới AI khi backend được bật/);assert.doesNotMatch(client,/Chế độ hỏi đáp AI hiện chưa sẵn sàng\. Bạn vẫn có thể/);assert.match(client,/duckie-chat-status\" role=\"status\" hidden/);});

test('Workers AI uses an active fast model rather than the retired model',()=>{assert.match(endpoint,/@cf\/meta\/llama-3\.1-8b-instruct-fast/);assert.doesNotMatch(endpoint,/@cf\/meta\/llama-3\.1-8b-instruct['"]/);});
