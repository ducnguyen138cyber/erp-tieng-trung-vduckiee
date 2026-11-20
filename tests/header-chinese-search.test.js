import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('assets/search/header-chinese-search.js','utf8');
function searchHarness(){
 const document={readyState:'loading',addEventListener(){}};
 const window={HSK_DICTIONARY_TERMS:[
  {hanzi:'努力',pinyin:'nǔ lì',meanings:['cố gắng','nỗ lực'],levels:['3']},
  {hanzi:'学习',pinyin:'xué xí',meanings:['học tập'],levels:['1']},
  {hanzi:'你好',pinyin:'nǐ hǎo',meanings:['xin chào'],levels:['1']}
 ]};
 vm.runInNewContext(code,{window,document,SpeechSynthesisUtterance:function(){},setTimeout});
 return window.VDuckieHeaderSearch;
}
test('Vietnamese, Chinese and Pinyin resolve same dictionary record',()=>{
 const svc=searchHarness();
 for(const query of ['cố gắng','co gang','努力','nu li','nǔ lì','nu3 li4']){
  const matches=svc.search(query);
  assert.equal(matches[0]?.hanzi,'努力',query);
 }
 for(const query of ['học tập','xue xi','xuexi'])assert.equal(svc.search(query)[0]?.hanzi,'学习',query);
 for(const query of ['你好','ni hao'])assert.equal(svc.search(query)[0]?.hanzi,'你好',query);
 assert.equal(svc.search('notawordabcd').length,0);
});

test('legacy HSK enhancement runtime stays syntactically valid',()=>{
 const source=fs.readFileSync('assets/v62/runtime-v70.2.js','utf8');
 new vm.Script(source);
});
test('component analysis prioritizes the lexical meaning of 力 without deleting surname data',()=>{
 const row=JSON.parse(fs.readFileSync('assets/v79/hsk-dictionary/terms-03.json','utf8')).find(r=>r.h==='力');
 const helpers=code.slice(code.indexOf('function terms(r)'),code.indexOf('// Cache normalized dictionary rows'));
 const choose=vm.runInNewContext(helpers+';componentMeaning');
 const meanings={hsk:row.m,erp:[]};
 assert.equal(choose({meanings}),'sức mạnh');assert.equal(meanings.hsk[0],'họ [Li4]');
 assert.equal(choose({meanings:{hsk:['họ [Li4]']}}),'họ [Li4]');
});
