import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=(p)=>fs.readFileSync(p,'utf8');
const source=read('assets/i18n/interface-i18n-v1.js');
function runtime(initial){
  const data=new Map(initial?[["vduckie-ui-language-v1",initial]]:[]);
  const events=[];
  const document={
    readyState:'loading',body:null,documentElement:{lang:'vi'},
    addEventListener(name,callback){events.push({name,callback});},
    dispatchEvent(event){events.push({name:event.type,detail:event.detail});}
  };
  const window={document,localStorage:{getItem(k){return data.get(k)||null;},setItem(k,v){data.set(k,v);}}};
  const context={window,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
  vm.runInNewContext(source,context,{filename:'interface-i18n-v1.js'});
  return {api:window.VDuckieInterfaceI18n,data,events};
}
test('defaults to Vietnamese and leaves unlisted lesson content untouched',()=>{
  const {api}=runtime();
  assert.equal(api.getLanguage(),'vi');
  assert.equal(api.t('Trang chủ'),'Trang chủ');
  assert.equal(api.t('努力'),'努力');
  assert.equal(api.t('Wǒ huì nǔlì xuéxí Zhōngwén.'),'Wǒ huì nǔlì xuéxí Zhōngwén.');
});
test('switches VI / zh-CN / English and saves preference across reloads',()=>{
  const first=runtime();
  assert.equal(first.api.setLanguage('zh'),true);
  assert.equal(first.api.getLanguage(),'zh');
  assert.equal(first.api.t('Trang chủ'),'首页');
  assert.equal(first.api.t('Thông tin tài khoản'),'账户信息');
  assert.equal(first.api.t('Bảng xếp hạng'),'排行榜');
  assert.equal(first.data.get('vduckie-ui-language-v1'),'zh');
  assert.equal(first.events.filter(e=>e.name==='vduckie:language-change').length,1);
  const again=runtime(first.data.get('vduckie-ui-language-v1'));
  assert.equal(again.api.getLanguage(),'zh');
  assert.equal(again.api.setLanguage('en'),true);
  assert.equal(again.api.t('Tiếp tục học'),'Continue learning');
  assert.equal(again.api.t('Đề HSK thực chiến'),'HSK Practice Tests');
  assert.equal(again.api.t('Ngôn ngữ'),'Language');
  assert.equal(again.api.setLanguage('vi'),true);
  assert.equal(again.api.t('Ngôn ngữ'),'Ngôn ngữ');
  assert.equal(again.api.setLanguage('fr'),false);
  assert.equal(again.api.getLanguage(),'vi');
});
test('UI localization excludes lesson data, and does not reload the page or clear user progress',()=>{
  assert.match(source,/excludedSelector=.*#hskLesson/);
  assert.match(source,/\.hsk-pro-exercises/);
  assert.match(source,/vduckie-ui-language-v1/);
  assert.match(source,/MutationObserver/);
  assert.doesNotMatch(source,/location\.reload\s*\(|localStorage\.clear\s*\(|document\.write\s*\(/);
  assert.match(source,/function translateText\(node\)/);
  assert.match(source,/function translateAttributes\(element\)/);
});
test('signed-in selector is inside the account dropdown under profile details, guests get a header option',()=>{
  assert.match(source,/getElementById\("v91AccountDropdown"\)/);
  assert.match(source,/querySelector\("\.v91-account-divider"\)/);
  assert.match(source,/insertBefore\(menu,divider\|\|null\)/);
  assert.match(source,/data-vd-ui-lang="vi"/);
  assert.match(source,/data-vd-ui-lang="zh"/);
  assert.match(source,/data-vd-ui-lang="en"/);
  assert.match(source,/wrap\.id="vdUiLanguageGuest"/);
  assert.match(source,/function ensureGuest\(\)/);
});
test('app bootstrap and PWA install the two localized assets',()=>{
  const html=read('index.html'),worker=read('service-worker.js'),css=read('assets/i18n/interface-language-menu-v1.css');
  assert.match(html,/interface-i18n-v1\.js\?v=3b2/);
  assert.match(html,/interface-language-menu-v1\.css\?v=3b1/);
  assert.match(worker,/vduckie-pwa-v30/);
  assert.match(worker,/interface-i18n-v1\.js\?v=3b2/);
  assert.match(css,/#vdI18nChoices/);
  assert.match(css,/\.vd-i18n-guest/);
});


test('Chinese UI copy translates the screenshot headline and common dynamic learning labels',()=>{
  const {api}=runtime();
  api.setLanguage('zh');
  assert.equal(api.translateUI('Bắt đầu hành trình cùng VDuckie'),'与 VDuckie 开启学习之旅');
  assert.equal(api.translateUI('Học ngay →'),'立即学习 →');
  assert.equal(api.translateUI('   Bài học đề xuất cho bạn  '),'为你推荐的课程');
  assert.equal(api.translateUI('5/10 câu đã kiểm tra'),'已检查 5/10 题');
  assert.equal(api.translateUI('Còn 2 từ cần ôn'),'还有 2 个待复习词汇');
  assert.equal(api.translateUI('CẤP ĐỘ 3'),'等级 3');
  assert.equal(api.translateUI('HSK 3 · 12/36 bài'),'HSK 3 · 已完成 12/36 课');
  assert.equal(api.translateUI('努力'),'努力');
  api.setLanguage('en');
  assert.equal(api.translateUI('Bắt đầu hành trình cùng VDuckie'),'Start your journey with VDuckie');
  assert.equal(api.translateUI('Học ngay →'),'Learn now →');
  assert.equal(api.translateUI('5/10 câu đã kiểm tra'),'5/10 questions checked');
});

test('homepage hero heading uses a stable i18n binding when content is regenerated',()=>{
  const shell=read('app-shell-v88.html');
  assert.match(shell,/<h1 id="homeHubTitle" data-vd-i18n-key="Bắt đầu hành trình cùng VDuckie">/);
  const pin={textContent:'Bắt đầu hành trình cùng VDuckie',getAttribute:()=> 'Bắt đầu hành trình cùng VDuckie'};
  const document={readyState:'loading',body:{},documentElement:{lang:'vi'},
    addEventListener(){},dispatchEvent(){},getElementById(){return null;},
    querySelector(){return null;},
    querySelectorAll(query){return query==='[data-vd-i18n-key]'?[pin]:[];}};
  const window={document,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:()=>{}};
  const context={window,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
  vm.runInNewContext(source,context);
  assert.equal(window.VDuckieInterfaceI18n.setLanguage('zh'),true);
  assert.equal(pin.textContent,'与 VDuckie 开启学习之旅');
  pin.textContent='Bắt đầu hành trình cùng VDuckie';
  window.VDuckieInterfaceI18n.refresh();
  assert.equal(pin.textContent,'与 VDuckie 开启学习之旅');
  window.VDuckieInterfaceI18n.setLanguage('vi');
  assert.equal(pin.textContent,'Bắt đầu hành trình cùng VDuckie');
});

test('homepage, sidebar and roadmap have no untranslated Vietnamese UI labels in Chinese mode',()=>{
  const {api}=runtime();
  api.setLanguage('zh');
  const shell=read('app-shell-v88.html');
  const sections=[
    shell.slice(shell.indexOf('id="studySidebar"'),shell.indexOf('</aside>',shell.indexOf('id="studySidebar"'))),
    shell.slice(shell.indexOf('id="homeHub"'),shell.indexOf('</section>',shell.indexOf('id="homeHub"'))),
    shell.slice(shell.indexOf('id="homeJourney"'),shell.indexOf('</section>',shell.indexOf('id="homeJourney"')))
  ];
  const missing=[];
  for(const block of sections){
    const labels=[...new Set([...block.matchAll(/>([^<>]+)</g)].map(m=>m[1].trim().replace(/&amp;/g,'&')).filter(Boolean))];
    for(const label of labels){
      if(label==='×'||!/[À-ỹĐđ]/.test(label))continue;
      if(api.translateUI(label)===label)missing.push(label);
    }
  }
  assert.deepEqual(missing,[]);
});


test('dynamic HSK, review, personal stats and dictionary controls translate without touching course text',()=>{
  const {api}=runtime();
  api.setLanguage('zh');
  assert.equal(api.translateUI('Bạn đã hoàn thành 7 bài. Tiếp tục đúng vị trí đang học hoặc chọn cấp độ khác.'),'你已完成 7 课。继续上次学习的课程，或选择其他等级。');
  assert.equal(api.translateUI('Còn 3 câu chưa kiểm tra. Làm và kiểm tra hết các câu để lưu hoàn thành.'),'还有 3 题未检查。完成并检查所有题目才能保存进度。');
  assert.equal(api.translateUI('↻ Ôn từ đến hạn (5)'),'↻ 复习到期词汇（5）');
  assert.equal(api.translateUI('Chuỗi hiện tại 6 ngày.'),'当前已连续学习 6 天。');
  assert.equal(api.translateUI('Sai 2 · đúng 8'),'错误 2 · 正确 8');
  assert.equal(api.translateUI('Phát âm · chữ Hán'),'发音 · 汉字');
  assert.equal(api.translateUI('Kho & tồn kho'),'仓库与库存');
  assert.equal(api.translateUI('Không tải được bảng xếp hạng'),'无法加载排行榜');
  assert.equal(api.translateUI('我今天去公司上班。'),'我今天去公司上班。');
  api.setLanguage('en');
  assert.equal(api.translateUI('Còn 3 câu chưa kiểm tra. Làm và kiểm tra hết các câu để lưu hoàn thành.'),'3 questions remaining. Answer and check all to save completion.');
  assert.equal(api.translateUI('Phát âm · chữ Hán'),'Pronunciation · Hanzi');
  assert.equal(api.translateUI('Không tải được bảng xếp hạng'),'Could not load leaderboard');
});

test('headings/controls can translate within protected learning areas, but vocabulary and examples remain protected',()=>{
  assert.match(source,/function isProtected\(element\)/);
  assert.match(source,/function permittedProtected\(element\)/);
  assert.match(source,/\.graded-hsk-page/);
  assert.match(source,/\.hsk-pro-exercises/);
  assert.match(source,/\.hsk-focus-examples/);
  assert.match(source,/\.hsk-study-progress/);
  assert.match(source,/header,nav,\[role='button'\]/);
  assert.match(source,/querySelectorAll\("\[data-vd-i18n-key\]"\)/);
});
