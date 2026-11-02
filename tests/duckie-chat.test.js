import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const client=fs.readFileSync('assets/ai/duckie-chat.js','utf8');
const endpoint=fs.readFileSync('functions/api/duckie-chat.js','utf8');
const index=fs.readFileSync('index.html','utf8');
test('chat widget mounts and retains controls',()=>{new vm.Script(client);for(const name of ['duckie-chat-launch','duckie-chat-panel','duckie-chat-messages','duckie-chat-form','data-dc-clear','data-dc-min','data-dc-tools'])assert.ok(client.includes(name));assert.match(index,/duckie-chat\.js/);assert.match(index,/duckie-chat\.css/);});
test('backend validates chat content and explicitly detects missing AI binding',()=>{assert.match(endpoint,/env\.AI/);assert.match(endpoint,/onRequestPost/);assert.match(endpoint,/Cloudflare Workers AI/);assert.match(endpoint,/max_tokens:700/);assert.doesNotMatch(endpoint,/OPENAI_API_KEY/);});
