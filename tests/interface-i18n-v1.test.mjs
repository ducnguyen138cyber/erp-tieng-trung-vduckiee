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
  assert.match(html,/interface-i18n-v1\.js\?v=factory1/);
  assert.match(html,/interface-language-menu-v1\.css\?v=3b1/);
  assert.match(worker,/vduckie-pwa-v42/);
  assert.match(worker,/interface-i18n-v1\.js\?v=factory1/);
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


test('screenshot regression: Chinese UI has localized dashboard, adaptive review and HSK controls',()=>{
  const {api}=runtime();
  api.setLanguage('zh');
  const cases=[
    ['Tiếp tục bài HSK','继续上次的 HSK 课程'],
    ['Tra từ theo mục tiêu','按学习目标查词'],
    ['Ôn từ yếu','复习薄弱词汇'],
    ['Bám đúng cấp độ và bài gần nhất của bạn.','从上次学习的等级和课程继续。'],
    ['⚡ Bắt đầu phiên 5 câu','⚡ 开始 5 题练习'],
    ['Mức: Tiêu chuẩn','难度：标准'],
    ['Độ chính xác 65%','正确率 65%'],
    ['0 phiên đã làm','已完成 0 次练习'],
    ['0/24 bài đã hoàn thành · Từ mới, ví dụ, nghe đọc và luyện tập.','已完成 0/24 课 · 生词、例句、听读和练习。'],
    ['Kho HSK bổ trợ ở menu là nơi tra cứu sâu, không phải giáo trình chính. Kết quả tự học được lưu riêng với điểm thi và EXP.','菜单中的 HSK 补充资源用于深入查阅，并非主课程。自学进度与考试分数和 EXP 分开记录。'],
    ['TỪ 1 / 15','单词 1 / 15'],
    ['Ví dụ sử dụng (2)','使用例句（2）'],
    ['🔊 Nghe phát âm','🔊 听发音'],
    ['Nghe → đoán nghĩa → xem ví dụ → thử nhớ lại.','听发音 → 猜意思 → 看例句 → 回忆。'],
    ['← Bài trước','← 上一课'],
    ['Bài sau →','下一课 →'],
    ['15 từ','15 个词汇'],
    ['Kho','仓库']
  ];
  for(const [input,want] of cases)assert.equal(api.translateUI(input),want,input);
  api.setLanguage('en');
  assert.equal(api.translateUI('Ví dụ sử dụng (2)'),'Usage examples (2)');
  assert.equal(api.translateUI('TỪ 1 / 15'),'WORD 1 / 15');
  assert.equal(api.translateUI('Mức: Tiêu chuẩn'),'Level: Standard');
  api.setLanguage('vi');
  assert.equal(api.translateUI('0/24 bài đã hoàn thành · Từ mới, ví dụ, nghe đọc và luyện tập.'),
    '0/24 bài đã hoàn thành · Từ mới, ví dụ, nghe đọc và luyện tập.');
});

test('localized lesson UI is permitted inside protected HSK, but Vietnamese word meanings remain untouched',()=>{
  const nodes=[
    {nodeValue:'Nghe → đoán nghĩa → xem ví dụ → thử nhớ lại.',type:'intro'},
    {nodeValue:'TỪ 1 / 15',type:'wordCounter'},
    {nodeValue:'Bắt đầu',type:'meaning'}
  ];
  function closestFor(type,selector){
    if(selector.includes('script,style,noscript'))return null;
    if(selector.includes('.hsk-focus-example,.hsk-focus-meaning')&&type==='meaning')return {};
    if(selector.includes('#hskLesson'))return {};
    if(selector.includes('.hsk-focus-intro')&&type==='intro')return {};
    if(selector.includes('.hsk-focus-word-title>span')&&type==='wordCounter')return {};
    return null;
  }
  for(const node of nodes)node.parentElement={closest:selector=>closestFor(node.type,selector)};
  const root={getAttribute:()=>null,querySelectorAll:()=>[],closest:()=>null};
  const doc={readyState:'loading',body:root,documentElement:{lang:'vi'},
    addEventListener(){},dispatchEvent(){},getElementById:()=>null,querySelector:()=>null,
    querySelectorAll(selector){return selector.startsWith('header.top,')?[root]:[];},
    createTreeWalker(){let i=0;return {nextNode(){return nodes[i++]||null;}};}
  };
  const window={document:doc,localStorage:{getItem:()=>null,setItem(){}}};
  vm.runInNewContext(source,{window,document:doc,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
  assert.equal(window.VDuckieInterfaceI18n.setLanguage('zh'),true);
  assert.equal(nodes[0].nodeValue,'听发音 → 猜意思 → 看例句 → 回忆。');
  assert.equal(nodes[1].nodeValue,'单词 1 / 15');
  assert.equal(nodes[2].nodeValue,'Bắt đầu','vocabulary meaning must remain unchanged');
});


test('dynamic text is translated in the same paint cycle, without the old 85ms timeout or self-triggered observers',()=>{
  const jobs=[],stats={timers:0,observed:0,disconnected:0};
  let listener;
  const textNode={nodeValue:'Tiếp tục bài HSK',parentElement:{closest:()=>null}};
  const surface={closest:()=>null,getAttribute:()=>null,querySelectorAll:()=>[],contains:()=>false};
  const doc={readyState:'complete',body:surface,documentElement:{lang:'vi'},
    addEventListener(){},dispatchEvent(){},getElementById(){return null;},
    querySelector(){return null;},querySelectorAll(selector){
      if(selector.startsWith('header.top,'))return [surface];
      return [];
    },
    createTreeWalker(element){let read=false;return{nextNode(){return !read&&element===surface?(read=true,textNode):null;}}}
  };
  class FakeMutationObserver{
    constructor(callback){listener=callback;}
    observe(){stats.observed++;}
    disconnect(){stats.disconnected++;}
  }
  const win={document:doc,localStorage:{getItem(){return 'zh';},setItem(){}},
    MutationObserver:FakeMutationObserver,
    queueMicrotask(callback){jobs.push(callback);},
    setTimeout(){stats.timers++;throw new Error('Delayed locale repaint');}
  };
  vm.runInNewContext(source,{window:win,document:doc,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
  assert.equal(textNode.nodeValue,'继续上次的 HSK 课程');
  // The host's runtime paints a Vietnamese source string again.
  textNode.nodeValue='Tiếp tục bài HSK';
  listener([{type:'characterData'}]);
  listener([{type:'characterData'}]);
  assert.equal(jobs.length,1,'coalesce repeated mutations into one microtask');
  assert.equal(stats.timers,0,'do not wait for visible Vietnamese paint');
  jobs.shift()();
  assert.equal(textNode.nodeValue,'继续上次的 HSK 课程');
  assert.equal(stats.disconnected,1,'disconnect before our own text mutations');
  assert.equal(stats.observed,2,'resume observing after the atomic translation pass');
});

test('localized cards can be prepared while detached from the page and reverse on language change',()=>{
  const node={nodeValue:'Ôn từ yếu',parentElement:{closest:()=>null}};
  const card={getAttribute:()=>null,closest:()=>null,querySelectorAll:()=>[]};
  const doc={readyState:'loading',body:null,documentElement:{lang:'vi'},
    addEventListener(){},dispatchEvent(){},
    createTreeWalker(element){let done=false;return{nextNode(){return element===card&&!done?(done=true,node):null;}}}
  };
  const data=new Map();
  const win={document:doc,localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}};
  vm.runInNewContext(source,{window:win,document:doc,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
  const api=win.VDuckieInterfaceI18n;
  api.setLanguage('zh');
  api.localizeSubtree(card);
  assert.equal(node.nodeValue,'复习薄弱词汇');
  api.setLanguage('en');
  api.localizeSubtree(card);
  assert.equal(node.nodeValue,'Review weak words');
  api.setLanguage('vi');
  api.localizeSubtree(card);
  assert.equal(node.nodeValue,'Ôn từ yếu');
  const personal=read('assets/v85/personal-dashboard-v85.js');
  const premium=read('assets/v86/premium-learning-v86.js');
  assert.match(personal,/localizeSubtree\(node\);if\(main\)/);
  assert.match(premium,/localizeSubtree\(node\);if\(main\)/);
  assert.match(premium,/localizeSubtree\(el\);document\.body\.appendChild\(el\)/);
});


test('screenshot audit: review, ranking, dictionary, HSK tabs, and profile use Chinese UI',()=>{
  const {api}=runtime();
  api.setLanguage('zh');
  const cases=[
    ['Ôn tập thích ứng','自适应复习'],
    ['GỌI LẠI','回忆练习'],
    ['Pinyin đúng của 上架确认 là gì?','上架确认的正确拼音是什么？'],
    ['上架确认 nghĩa là gì?','上架确认是什么意思？'],
    ['← Quay lại','← 返回'],
    ['1 · Từ mới','1 · 生词'],
    ['2 · Nghe & đọc','2 · 听读'],
    ['3 · Luyện tập','3 · 练习'],
    ['4 · Kiến thức thêm','4 · 补充知识'],
    ['UNIT 10 · BÀI 24 / 24','单元 10 · 第 24/24 课'],
    ['Từ điển Trung – Việt','中越词典'],
    ['TRA CỨU RIÊNG','独立词汇查询'],
    ['12529 kết quả · đang hiện 50 kết quả đầu','找到 12529 条结果 · 显示前 50 条'],
    ['7 kết quả','找到 7 条结果'],
    ['♪ Nghe','♪ 听发音'],
    ['+ Sổ từ','+ 生词本'],
    ['Kho','仓库'],
    ['HỒ SƠ HỌC TẬP','学习档案'],
    ['VDuckie của bạn','我的 VDuckie'],
    ['0 từ ERP đã thuộc','已掌握 0 个 ERP 词汇'],
    ['2/20 bài giáo trình hoàn thành','已完成 2/20 节课程'],
    ['Supabase sync khi đăng nhập','登录后通过 Supabase 同步'],
    ['PWA dùng chung tiến độ','PWA 共享学习进度'],
    ['Level 1','等级 1'],
    ['Có hồ sơ người học không đồng nghĩa với đã hoàn thành bài được thưởng EXP. Hãy đăng nhập, hoàn thành một bài HSK rồi kiểm tra lại mục Tổng EXP.','拥有学习者档案不代表已完成可获得 EXP 的课程。请登录并完成一节 HSK 课程，再查看“总 EXP”。'],
  ];
  for(const [from,to] of cases)assert.equal(api.translateUI(from),to,from);
  // Lessons, example sentences and Vietnamese learner-facing dictionary definitions remain source data.
  for(const content of ['上架确认','Lĩnh liệu / nhận nguyên vật liệu để sản xuất','Thứ Bảy chúng ta đi xem phim nhé']){
    assert.equal(api.translateUI(content),content);
  }
  api.setLanguage('en');
  assert.equal(api.translateUI('Pinyin đúng của 上架确认 là gì?'),'What is the correct pinyin for 上架确认?');
  assert.equal(api.translateUI('12529 kết quả · đang hiện 50 kết quả đầu'),'12529 results · showing first 50');
  assert.equal(api.translateUI('1 · Từ mới'),'1 · Vocabulary');
  api.setLanguage('vi');
  assert.equal(api.translateUI('HỒ SƠ HỌC TẬP'),'HỒ SƠ HỌC TẬP');
});

test('daily learning interface is translatable while dictionary glosses and quiz answers stay protected',()=>{
  assert.doesNotMatch(source,/var excludedSelector=[^\n]*#dailyLearningPanel/);
  assert.match(source,/var excludedSelector=[^\n]*#dailyDictionaryResults/);
  assert.match(source,/\.daily-options/);
  assert.match(source,/\.dictionary-word/);
  assert.match(source,/\.dictionary-meta small/);
  assert.match(source,/\.dictionary-example/);
  assert.match(source,/\.focus-word>p/);
  assert.match(source,/\.hsk-pro-lesson-head h3 small/);
  const daily=read('assets/daily-learning-v2.js');
  assert.match(daily,/id="dailyDictionaryStatus"/);
  assert.match(daily,/class="profile-screen app-screen"/);
  assert.match(daily,/class="learning-session app-screen"/);
});
