/* VDuckie UI i18n v1: translates interface chrome only; educational content remains in Vietnamese. */
(function(root, doc){
  "use strict";
  if(!doc || root.VDuckieInterfaceI18n)return;
  var KEY="vduckie-ui-language-v1";
  var supported={vi:true,zh:true,en:true};
  var strings={
    "Trang chủ":["首页","Home"],
    "HỌC HÔM NAY":["今日学习","TODAY'S LEARNING"],
    "Học hôm nay":["今日学习","Learn today"],
    "Giáo trình HSK":["HSK 课程","HSK Curriculum"],
    "Daily ERP +5":["每日 ERP +5","Daily ERP +5"],
    "Ôn tập":["复习","Review"],
    "Xếp hạng":["排行榜","Ranking"],
    "TRA CỨU":["查询工具","LOOKUP"],
    "Từ điển":["词典","Dictionary"],
    "Kho HSK bổ trợ":["HSK 辅助资源","HSK Resources"],
    "ERP CÔNG VIỆC":["职场 ERP","WORKPLACE ERP"],
    "Bài học ERP":["ERP 课程","ERP Lessons"],
    "Thẻ từ ERP":["ERP 单词卡","ERP Flashcards"],
    "Hội thoại ERP":["ERP 会话","ERP Conversations"],
    "Kiểm tra ERP":["ERP 测验","ERP Quizzes"],
    "Từ điển ERP":["ERP 词典","ERP Dictionary"],
    "Sổ từ cá nhân":["个人生词本","Personal Wordbook"],
    "Từ cộng đồng":["社区词库","Community Words"],
    "VDuckie & thống kê":["VDuckie 与统计","VDuckie & Statistics"],
    "你好! (Xin chào!)":["你好！","Hello!"],
    "Bắt đầu hành trình cùng VDuckie":["与 VDuckie 开启学习之旅","Start your journey with VDuckie"],
    "Chọn một bài vừa sức và học tiếng Trung theo cách của bạn — từ công việc ERP đến lộ trình HSK。":["选择适合自己的课程，按自己的节奏学习中文。","Choose a suitable lesson and learn Chinese at your own pace."],
    "Bắt đầu học HSK":["开始学习 HSK","Start learning HSK"],
    "Học từ vựng ERP":["学习 ERP 词汇","Learn ERP Vocabulary"],
    "KHO HỌC LIỆU":["学习资源","LEARNING RESOURCES"],
    "Đủ món để học mỗi ngày":["每天都有新内容","Everything you need to learn daily"],
    "Từ vựng":["词汇","Vocabulary"],
    "Bài HSK 1–4":["HSK 1–4 课程","HSK 1–4 Lessons"],
    "Đề HSK thực chiến":["HSK 模拟真题","HSK Practice Tests"],
    "Chặng HSK":["HSK 学习阶段","HSK Stages"],
    "Xem toàn bộ lộ trình HSK":["查看完整 HSK 学习路线","View the full HSK roadmap"],
    "Bài học đề xuất cho bạn":["为你推荐的课程","Recommended lessons"],
    "Chạm một thẻ để bắt đầu":["点击卡片即可开始","Tap a card to begin"],
    "Từ vựng theo chủ đề":["主题词汇","Themed vocabulary"],
    "Cấu trúc câu HSK":["HSK 句型","HSK sentence structures"],
    "Hội thoại thực tế":["实用会话","Real-world conversations"],
    "Phản xạ và phát âm":["口语反应与发音","Speaking and pronunciation"],
    "10 thẻ ERP mỗi ngày":["每天 10 张 ERP 词卡","10 ERP flashcards a day"],
    "Học mẫu rồi nể bẫy":["学习例句并避开易错点","Learn examples and avoid mistakes"],
    "Nghe câu mẫu trong ERP":["收听 ERP 例句","Listen to ERP examples"],
    "Mic chấm câu bạn đọc":["麦克风辅助口语练习","Practice speaking with your mic"],
    "Học ngay":["立即学习","Learn now"],
    "LỘ TRÌNH ĐẾN KHI THÀNH THẠO":["精通学习路线","YOUR PATH TO MASTERY"],
    "Đi từng chặng, nhìn rõ tiến độ":["循序渐进，进步看得见","Learn step by step, track your progress"],
    "Đi từng chặng, không học mò":["循序渐进，稳步学习","Learn step by step"],
    "Xem lộ trình":["查看学习路线","View roadmap"],
    "Tiếp tục học":["继续学习","Continue learning"],
    "Nhiệm vụ tuần":["每周任务","Weekly missions"],
    "Chuỗi ngày học":["连续学习天数","Learning streak"],
    "GIỮ CHUỖI HÔM NAY":["保持今日连续学习","KEEP TODAY'S STREAK"],
    "Học đủ 5 ngày":["学习满 5 天","Learn for 5 days"],
    "Ôn 10 từ vựng":["复习 10 个单词","Review 10 words"],
    "Làm 1 bài kiểm tra":["完成 1 次测验","Complete 1 quiz"],
    "Hoàn thành nhiệm vụ để nhận EXP và tăng Level.":["完成任务，获得 EXP 并升级。","Complete missions to earn EXP and level up."],
    "Bảng xếp hạng":["排行榜","Leaderboard"],
    "Top học viên tuần này":["本周学习达人","Top learners this week"],
    "Xem tất cả":["查看全部","View all"],
    "BẢNG XẾP HẠNG NGƯỜI HỌC":["学习排行榜","LEARNER LEADERBOARD"],
    "Học đều, EXP tự lên":["坚持学习，EXP 自然增长","Keep learning, earn EXP"],
    "Tuần này":["本周","This week"],
    "Tháng này":["本月","This month"],
    "Tổng EXP":["总 EXP","Total EXP"],
    "Hạng":["排名","Rank"],
    "HẠNG":["排名","RANK"],
    "AVATAR":["头像","AVATAR"],
    "NGƯỜI HỌC":["学习者","LEARNER"],
    "Người học":["学习者","Learner"],
    "Chưa ai nhận EXP":["暂无 EXP 记录","No EXP earned yet"],
    "Đang tải bảng xếp hạng…":["正在加载排行榜…","Loading leaderboard…"],
    "Đăng nhập Google":["使用 Google 登录","Sign in with Google"],
    "Đăng nhập":["登录","Sign in"],
    "Đăng xuất":["退出登录","Sign out"],
    "Tiếp tục học":["继续学习","Continue learning"],
    "Từ điển cá nhân":["个人词典","Personal dictionary"],
    "Thành tích cá nhân":["个人成就","Achievements"],
    "EXP và cấp độ":["EXP 与等级","EXP and levels"],
    "Thông tin tài khoản":["账户信息","Account details"],
    "Cấp độ hiện tại":["当前等级","Current level"],
    "Từ đã thuộc":["已掌握的词汇","Mastered words"],
    "Từ đã lưu":["已收藏的词汇","Saved words"],
    "EXP trong level này":["本等级已获 EXP","EXP in this level"],
    "EXP cần để lên level tiếp":["升级还需 EXP","EXP needed for next level"],
    "Mở menu tài khoản":["打开账户菜单","Open account menu"],
    "Đóng":["关闭","Close"],
    "Đóng menu":["关闭菜单","Close menu"],
    "Về trang chủ":["返回首页","Go to home"],
    "Ngôn ngữ":["语言","Language"],
    "Chọn ngôn ngữ giao diện":["选择界面语言","Choose interface language"],
    "Ngôn ngữ giao diện":["界面语言","Interface language"],
    "Giao diện":["界面","Interface"],
    "Tiếng Việt":["越南语","Vietnamese"],
    "Tiếng Trung":["简体中文","Simplified Chinese"],
    "Tiếng Anh":["英语","English"],
    "Giáo trình hiện chủ yếu bằng tiếng Việt.":["课程内容目前主要为越南语。","Course content is currently mainly in Vietnamese."],
    "Luyện tập":["练习","Practice"],
    "Hoàn thành":["完成","Complete"],
    "Đã hoàn thành":["已完成","Completed"],
    "Học tiếp":["继续学习","Continue"],
    "Bài tiếp":["下一课","Next lesson"],
    "Bài trước":["上一课","Previous lesson"],
    "Từ mới":["生词","New words"],
    "Nghe & đọc":["听力与阅读","Listen & read"],
    "Kiến thức thêm":["补充知识","Extra knowledge"],
    "Học từ":["学习词汇","Study words"],
    "Bài tập":["练习题","Exercises"],
    "Kiểm tra":["检查答案","Check"],
    "Kiểm tra đáp án":["检查答案","Check answer"],
    "Xem đáp án":["查看答案","Show answer"],
    "Xem nghĩa":["查看释义","Show meaning"],
    "Chưa nhớ":["还没记住","Not yet"],
    "Đã nhớ":["记住了","Remembered"],
    "Ôn từ HSK":["复习 HSK 单词","Review HSK words"],
    "Bắt đầu chuỗi ngày học":["开启连续学习","Start a learning streak"],
    "Xem tất cả bảng xếp hạng":["查看完整排行榜","View full leaderboard"],
    "Đang tải…":["加载中…","Loading…"],
    "Đang tải":["加载中","Loading"],
    "Quay lại":["返回","Back"],
    "Tìm kiếm":["搜索","Search"],
    "Tìm từ":["查词","Look up a word"],
    "Tra tiếng Việt, Pinyin hoặc chữ Hán...":["输入越南语、拼音或汉字搜索...","Search Vietnamese, Pinyin or Hanzi..."],
    "Tra tiếng Việt, Pinyin hoặc chữ Hán…":["输入越南语、拼音或汉字搜索…","Search Vietnamese, Pinyin or Hanzi…"],
    "Tra từ":["查词","Look up"],
    "Lưu từ":["收藏词汇","Save word"],
    "Thêm vào sổ từ":["加入生词本","Add to wordbook"],
    "Kết quả":["结果","Results"],
    "Không tìm thấy":["未找到结果","No results found"],
    "Cài đặt":["设置","Settings"],
    "Hồ sơ":["个人资料","Profile"],
    "Tài khoản":["账户","Account"],
    "Bắt đầu":["开始","Start"],
    "Nộp bài":["提交","Submit"],
    "Hoàn thành & lưu tiến độ":["完成并保存进度","Finish & save progress"],
    "Từ cần ôn":["待复习词汇","Words to review"],
    "Từ yếu":["薄弱词汇","Weak words"],
    "Tiến độ bài học":["课程进度","Lesson progress"],
    "Đăng lên kho chung":["发布到共享词库","Share with community"],
    "Xem tất cả từ":["查看所有词汇","View all words"],
    "Chủ đề":["主题","Topics"],
    "Bài học":["课程","Lessons"],
    "Bắt đầu HSK 1":["开始学习 HSK 1","Start HSK 1"],
    "Ôn từ đến hạn":["复习到期单词","Review due words"],
    "Mới bắt đầu? Chọn HSK 1. Đã biết tiếng Trung? Chọn cấp phù hợp rồi học lần lượt: từ mới → nghe & đọc → luyện tập → lưu tiến độ.":["初学者请选择 HSK 1，其他学习者可选择合适等级。课程内容仍以越南语为主。","New learners can start with HSK 1; others may choose their level. Lessons remain in Vietnamese."],
    "GIÁO TRÌNH CHÍNH · HSK 1–4":["核心课程 · HSK 1–4","MAIN CURRICULUM · HSK 1–4"],
    "Học tiếng Trung theo từng bài":["按课学习中文","Learn Chinese lesson by lesson"],
    "Đề thi HSK":["HSK 模拟考试","HSK Exams"],
    "Chưa có dữ liệu":["暂无数据","No data yet"],
    "Lưu tiến độ":["保存进度","Save progress"],
    "Gửi":["发送","Send"],
    "Duckie Chat":["Duckie 聊天","Duckie Chat"]
  };
  var rootsSelector="header.top,#studySidebar,#homeHub,.study-rail,#leaderboard,#v865HomeSidebar,.v865-home-sidebar,.v865-home-shell,.v865-home-main,#expWeeklyMissions,#expMiniLeaderboard,#expHomeAccount,#v91AccountDropdown,#v91AccountModal,.exp-main-nav,.home-recommended,.home-library-card";
  var excludedSelector="#hskLesson,#hskAssessment,.hsk-pro-section,#dailyLearningPanel,#dailyDictionaryResults,.dictionary-results,.erp-lesson-content,.hsk-focus-examples,.hsk-pro-exercises,.hsk-pro-vocabulary,.duckie-chat-thread,.duckie-chat-messages,#duckieChatMessages,.glossary-results,.flashcard-content";
  var history=new WeakMap(),attrs=new WeakMap(), scheduled=false,menu=null,lang=read(),observer=null;
  function read(){try{var v=root.localStorage.getItem(KEY);return supported[v]?v:"vi";}catch(error){return "vi";}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
  function t(key,next){var index=(next||lang)==="zh"?0:(next||lang)==="en"?1:-1;return index<0||!strings[key]?key:strings[key][index]||key;}
  function translateValue(original){
    var direct=t(original);
    if(direct!==original)return direct;
    var m=original.match(/^([+]?\d[\d.,]*)(\s*)(bài|từ|ngày) đã hoàn thành$/i);
    if(m&&lang!=="vi")return lang==="zh"?m[1]+(m[3]==="bài"?" 课已完成":m[3]==="từ"?" 个词已掌握":" 天已完成"):m[1]+" "+(m[3]==="bài"?"lessons":m[3]==="từ"?"words":"days")+" completed";
    return original;
  }
  function translateText(node){
    if(!node||!node.parentElement||node.parentElement.closest(excludedSelector))return;
    var original=node.nodeValue||"", entry=history.get(node);
    if(entry&&original===entry.output)original=entry.source;
    else if(entry&&original===entry.source)original=entry.source;
    var trimmed=original.trim();
    if(!trimmed)return;
    var translated=translateValue(trimmed);
    var result=original.replace(trimmed,translated);
    history.set(node,{source:original,output:result});
    if(node.nodeValue!==result)node.nodeValue=result;
  }
  function translateAttributes(element){
    if(element.closest(excludedSelector))return;
    var prev=attrs.get(element)||{};
    ["placeholder","aria-label","title"].forEach(function(attr){
      var raw=element.getAttribute(attr);
      if(!raw)return;
      var source=prev[attr]&&prev[attr].output===raw?prev[attr].source:raw;
      var result=translateValue(source);
      prev[attr]={source:source,output:result};
      if(raw!==result)element.setAttribute(attr,result);
    });
    attrs.set(element,prev);
  }
  function translateRoot(element){
    if(!element)return;
    translateAttributes(element);
    var walker=doc.createTreeWalker(element,4,null),node;
    while((node=walker.nextNode()))translateText(node);
    var elements=element.querySelectorAll("[aria-label],[placeholder],[title]");
    for(var i=0;i<elements.length;i++)translateAttributes(elements[i]);
  }
  function ensureMenu(){
    var dropdown=doc.getElementById("v91AccountDropdown");
    if(!dropdown)return;
    menu=doc.getElementById("vdUiLanguageSlot");
    if(!menu){
      menu=doc.createElement("div");
      menu.id="vdUiLanguageSlot";menu.className="vd-i18n-slot";
      menu.setAttribute("role","none");
      menu.innerHTML='<button type="button" class="vd-i18n-toggle" role="menuitem" aria-expanded="false" aria-controls="vdI18nChoices"><span class="v91-item-icon" aria-hidden="true">🌐</span><span data-vd-lang-title></span><span class="vd-i18n-current" data-vd-lang-current>VI</span><span aria-hidden="true">⌄</span></button>'+
      '<div id="vdI18nChoices" class="vd-i18n-choices" role="group" hidden aria-label="Chọn ngôn ngữ giao diện">'+
      '<button type="button" data-vd-ui-lang="vi">🇻🇳 Tiếng Việt</button>'+
      '<button type="button" data-vd-ui-lang="zh">🇨🇳 简体中文</button>'+
      '<button type="button" data-vd-ui-lang="en">🇬🇧 English</button></div>'+
      '<p class="vd-i18n-note" hidden></p>';
      var divider=dropdown.querySelector(".v91-account-divider");
      dropdown.insertBefore(menu,divider||null);
      menu.querySelector(".vd-i18n-toggle").addEventListener("click",function(){
        var choices=menu.querySelector(".vd-i18n-choices"),open=choices.hidden;
        choices.hidden=!open;
        this.setAttribute("aria-expanded",open?"true":"false");
      });
      menu.querySelectorAll("[data-vd-ui-lang]").forEach(function(button){
        button.addEventListener("click",function(){
          setLanguage(button.getAttribute("data-vd-ui-lang"));
          menu.querySelector(".vd-i18n-choices").hidden=true;
          menu.querySelector(".vd-i18n-toggle").setAttribute("aria-expanded","false");
          menu.querySelector(".vd-i18n-toggle").focus();
        });
      });
    }
    menu.querySelector("[data-vd-lang-title]").textContent=t("Ngôn ngữ");
    menu.querySelector("[data-vd-lang-current]").textContent=lang==="zh"?"中文":lang.toUpperCase();
    menu.querySelectorAll("[data-vd-ui-lang]").forEach(function(b){var selected=b.getAttribute("data-vd-ui-lang")===lang;b.classList.toggle("is-selected",selected);b.setAttribute("aria-pressed",selected?"true":"false");});
  }
  function apply(){
    if(!doc.body)return;
    doc.documentElement.lang=lang==="zh"?"zh-CN":lang;
    ensureMenu();
    var roots=doc.querySelectorAll(rootsSelector);
    for(var i=0;i<roots.length;i++)translateRoot(roots[i]);
    // Interactive controls can exist on screens outside the homepage.
    var controls=doc.querySelectorAll("button,[role='tab'],[role='menuitem']");
    for(var j=0;j<controls.length;j++){
      if(controls[j].closest(excludedSelector))continue;
      if(controls[j].closest(rootsSelector))continue;
      translateRoot(controls[j]);
    }
    ensureMenu();
  }
  function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||root.setTimeout)(function(){scheduled=false;apply();},0);}
  function setLanguage(next){
    if(!supported[next])return false;
    if(next!==lang){lang=next;try{root.localStorage.setItem(KEY,lang);}catch(error){}
      doc.dispatchEvent(new CustomEvent("vduckie:language-change",{detail:{language:lang}}));
    }
    apply();return true;
  }
  function start(){
    apply();
    if(root.MutationObserver){
      observer=new root.MutationObserver(function(changes){
        for(var i=0;i<changes.length;i++){
          if(changes[i].type==="childList"||changes[i].type==="characterData"){schedule();break;}
        }
      });
      observer.observe(doc.body,{childList:true,subtree:true,characterData:true});
    }
  }
  root.VDuckieInterfaceI18n=Object.freeze({getLanguage:function(){return lang;},setLanguage:setLanguage,t:t,refresh:apply});
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
