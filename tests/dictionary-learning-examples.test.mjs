import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const read=file=>readFileSync(file,'utf8');
const shards=Array.from({length:16},(_,i)=>JSON.parse(read(`data/dictionary/learning-examples/${i.toString(16)}.json`)));
test('dictionary examples exactly reuse canonical HSK sentences and translations',()=>{
 let count=0;const sources=new Map();
 for(const shard of shards)for(const [word,entry] of Object.entries(shard.entries)){
  count++;if(!sources.has(entry.source.path))sources.set(entry.source.path,JSON.parse(read(entry.source.path)).records);
  const source=sources.get(entry.source.path).find(r=>r.id===entry.source.id);
  assert.equal(source.simplified,word);assert.equal(source.level||source.hskLevel,entry.level);
  assert(source.examples.some(e=>e.zh===entry.example.zh&&e.vi===entry.example.vi),word+' source drift');
  assert(entry.example.pinyin&&!/[\u3400-\u9fff]/.test(entry.example.pinyin),word+' Pinyin missing');
  assert.equal(entry.source.reviewStatus,source.reviewStatus||'unreviewed');
 }
 assert.equal(count,1982);
});
test('examples are fetched lazily, share concurrent shard requests and preserve unknown words',async()=>{
 const requested=[];const root={fetch:async url=>{requested.push(url);return {ok:true,json:async()=>shards[parseInt(url.match(/\/([a-f0-9])\.json/)[1],16)]};}};
 runInNewContext(read('assets/search/learning-examples.js'),{window:root,Promise,Array,Object,String});
 assert.equal(requested.length,0,'boot must not load dictionary example data');
 const [a,b]=await Promise.all([root.VDuckieLearningExamples.lookup('努力'),root.VDuckieLearningExamples.lookup('努力')]);
 assert.equal(requested.length,1);assert.equal(a,b);assert.equal(a.example.zh,'只要继续努力，你的口语会提高。');
 assert.equal(a.level,3);assert.equal(await root.VDuckieLearningExamples.lookup('这是一个不存在的词条'),null);
});
