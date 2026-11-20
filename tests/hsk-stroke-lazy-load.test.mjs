import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../hsk-lessons.js',import.meta.url),'utf8');
const start=source.indexOf('  var strokeDataPromise = null;');
const end=source.indexOf('  function setupWritingTrainer(',start);
assert.ok(start>=0&&end>start,'Locate current writing loader, not an unrelated source section');
const factory=new Function('root','document',source.slice(start,end)+'\nreturn loadCharacterData;');

test('verified writing paths load only after request and concurrently share one script',async()=>{
  const appended=[];
  const data={'你':{strokes:['real-path-1']},'好':{strokes:['real-path-2']}};
  const root={fetch:()=>Promise.reject(new Error('local fallback should not run'))};
  const document={
    createElement:()=>({}),
    head:{appendChild(script){
      appended.push(script);
      queueMicrotask(()=>{root.HSK_HANZI_DATA=data;script.onload();});
    }}
  };
  const load=factory(root,document);
  assert.equal(appended.length,0,'Cold home must not start loading the 613 KB dataset');
  const makeRequest=character=>new Promise((resolve,reject)=>load(character,resolve,reject));
  const [first,second]=await Promise.all([makeRequest('你'),makeRequest('好')]);
  assert.equal(first,data['你']);
  assert.equal(second,data['好']);
  assert.equal(appended.length,1,'Only one local payload for simultaneous writing requests');
  assert.equal(appended[0].src,'./vendor/hsk-char-data.js?v=1');
  assert.equal((await makeRequest('你')),data['你'],'Use verified cached paths on later strokes');
  assert.equal(appended.length,1);
});

test('a character absent from the local bundle retains the original JSON fallback',async()=>{
  let fallbackPath='';
  const root={fetch:async path=>{
    fallbackPath=path;
    return{ok:true,json:async()=>({strokes:['fallback-path']})};
  }};
  const document={
    createElement:()=>({}),
    head:{appendChild(script){queueMicrotask(()=>{root.HSK_HANZI_DATA={};script.onload();});}}
  };
  const load=factory(root,document);
  const result=await new Promise((resolve,reject)=>load('新',resolve,reject));
  assert.equal(fallbackPath,'./hanzi-data/'+encodeURIComponent('新')+'.json');
  assert.deepEqual(result,{strokes:['fallback-path']});
});

test('load error reports failure without fabricating stroke data',async()=>{
  const root={fetch:()=>Promise.reject(new Error('network unavailable'))};
  const document={createElement:()=>({}),head:{appendChild(script){queueMicrotask(()=>script.onerror());}}};
  const load=factory(root,document);
  const error=await new Promise(resolve=>load('学',()=>resolve(null),resolve));
  assert.ok(error instanceof Error);
  assert.match(error.message,/Cannot load verified stroke dataset/);
});
