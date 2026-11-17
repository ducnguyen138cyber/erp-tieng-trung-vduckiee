import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync('assets/i18n/interface-i18n-v1.js','utf8');
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
test('dynamic UI translates before paint without rescanning unrelated screens',async()=>{
  const dom=new JSDOM('<header class="top"></header><main class="study-center"><section id="changed"></section><section id="untouched"><button>Trang chủ</button></section></main><section id="outside"></section>',{url:'https://example.invalid',runScripts:'outside-only'});
  const {window:w}=dom,d=w.document;
  try{
    w.localStorage.setItem('vduckie-ui-language-v1','zh');w.eval(source);await settle();
    const untouched=d.getElementById('untouched');
    assert.equal(untouched.textContent,'首页');
    let scanned=0;const walker=d.createTreeWalker.bind(d);
    d.createTreeWalker=(node,...args)=>{if(node.contains(untouched))scanned++;return walker(node,...args);};
    const changed=d.getElementById('changed');
    changed.innerHTML='<button>Tiếp tục học</button><span class="hsk-focus-meaning">Trang chủ</span><h1 data-vd-i18n-key="Bắt đầu hành trình cùng VDuckie">stale heading</h1>';
    await settle();
    assert.equal(changed.querySelector('button').textContent,'继续学习');
    assert.equal(changed.querySelector('.hsk-focus-meaning').textContent,'Trang chủ');
    // Pinned source keys must win over stale content in newly inserted subtrees.
    assert.equal(changed.querySelector('h1').textContent,'与 VDuckie 开启学习之旅');
    const button=changed.querySelector('button');button.firstChild.nodeValue='Bảng xếp hạng';await settle();
    assert.equal(button.textContent,'排行榜');
    d.getElementById('outside').innerHTML='<button>Trang chủ</button><p>Trang chủ</p>';await settle();
    assert.equal(d.querySelector('#outside button').textContent,'首页');
    assert.equal(d.querySelector('#outside p').textContent,'Trang chủ');
    assert.equal(scanned,0,'mutation batches must not walk the entire study center');
    w.VDuckieInterfaceI18n.setLanguage('en');
    assert.equal(untouched.textContent,'Home');assert.equal(button.textContent,'Leaderboard');
    w.VDuckieInterfaceI18n.setLanguage('vi');assert.equal(button.textContent,'Bảng xếp hạng');
  }finally{w.close();}
});
