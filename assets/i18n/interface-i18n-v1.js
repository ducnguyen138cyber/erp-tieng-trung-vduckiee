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
    "Chọn một bài vừa sức và học tiếng Trung theo cách của bạn — từ công việc ERP đến lộ trình HSK.":["选择适合自己的课程，按自己的节奏学习中文。","Choose a suitable lesson and learn Chinese at your own pace."],
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
    "Duckie Chat":["Duckie 聊天","Duckie Chat"],
    "Tự học tiếng Trung":["中文自学","Learn Chinese"],
    "Giao tiếp hiệu quả":["高效沟通学习","Communicate effectively"],
    "Học từ ERP":["学习 ERP 词汇","Learn ERP words"],
    "Từ ERP":["ERP 词汇","ERP words"],
    "Học mẫu rồi né bẫy":["学习范例并避开常见错误","Learn patterns and avoid pitfalls"],
    "Giữ chuỗi hôm nay":["保持今日连续学习","Keep today's streak"],
    "TIẾP TỤC HỌC":["继续学习","CONTINUE LEARNING"],
    "Đã hoàn thành bài học":["已完成课程","Lesson completed"],
    "Học bài tiếp":["继续下一课","Next lesson"],
    "Từ đã luyện":["已练习词汇","Practiced words"],
    "Từ cần ôn lại":["需再次复习的词汇","Words to revisit"],
    "Từ đã nhớ":["已记住的词汇","Remembered words"],
    "Tổng số từ":["词汇总数","Total words"],
    "Tiến độ tự học đã lưu":["自学进度已保存","Study progress saved"],
    "Chọn một bài vừa sức và học tiếng Trung theo cách của bạn — từ công việc ERP đến lộ trình HSK.":["选择适合自己的课程，按自己的节奏学习中文——从职场 ERP 词汇到 HSK 课程。","Choose a lesson at your level, from workplace ERP vocabulary to the HSK curriculum."],
    "Bạn là một người mới chưa biết bắt đầu học tiếng Trung từ đâu? Hãy chọn “Bắt đầu học HSK” để học từ số 0; nếu cần tiếng Trung cho công việc, chọn “Học từ vựng ERP”.":["刚开始学中文？选择“开始学习 HSK”从零起步；学习职场中文可选择“学习 ERP 词汇”。","New to Chinese? Start with HSK from zero, or choose ERP vocabulary for workplace Chinese."],
    "Hãy chọn “Bắt đầu học HSK” để học từ số 0; nếu cần tiếng Trung cho công việc, chọn “Học từ vựng ERP”.":["选择 HSK 从零起步，也可以学习职场 ERP 中文。","Start HSK from zero or learn ERP Chinese for work."]
  };
  // UI-copy inventory shared by static shell and dynamic JS modules; course explanations stay untouched.
  Object.assign(strings,{
  "VDuckie – Tự học tiếng Trung HSK, từ điển và ERP": [
    "VDuckie – HSK 中文学习、词典与 ERP",
    "VDuckie – Learn Chinese, HSK, Dictionary and ERP"
  ],
  "Dữ liệu đang lưu trên thiết bị": [
    "正在本设备保存数据",
    "Data stored on this device"
  ],
  "Đang kiểm tra đồng bộ…": [
    "正在检查同步…",
    "Checking sync…"
  ],
  "Hôm nay": [
    "今天",
    "Today"
  ],
  "KHÁC": [
    "其他",
    "OTHER"
  ],
  "VDuckie &amp; thống kê": [
    "VDuckie 与统计",
    "VDuckie & Statistics"
  ],
  "Bài HSK": [
    "HSK 课程",
    "HSK Lessons"
  ],
  "卡 Từ vựng": [
    "卡 词汇",
    "卡 Vocabulary"
  ],
  "句 Ngữ pháp": [
    "句 语法",
    "句 Grammar"
  ],
  "听 Luyện nghe": [
    "听 听力",
    "听 Listening"
  ],
  "说 Luyện nói": [
    "说 口语",
    "说 Speaking"
  ],
  "ERP CÔNG VIỆC · MỖI NGÀY 10 PHÚT": [
    "职场 ERP · 每天学习 10 分钟",
    "WORKPLACE ERP · 10 MINUTES DAILY"
  ],
  "Học đúng từ bạn gặp trong xưởng.": [
    "学习在工厂中真正用得到的词汇。",
    "Learn words you actually use at work."
  ],
  "Thuật ngữ kho, sản xuất và ERP — có pinyin, ví dụ thực tế và phát âm tiếng Trung.": [
    "仓库、生产及 ERP 术语，包含拼音、实用例句与中文发音。",
    "Warehouse, manufacturing and ERP terms with pinyin, examples and pronunciation."
  ],
  "LỘ TRÌNH HSK 1 → 9": [
    "HSK 1 → 9 学习路线",
    "HSK 1 → 9 ROADMAP"
  ],
  "Học để đọc, viết và thi HSK.": [
    "学习中文听说读写，备考 HSK。",
    "Learn Chinese literacy and prepare for HSK."
  ],
  "Bắt đầu từ nền tảng rồi học tuần tự qua từng cấp độ. Chọn chặng và bài học ở cột lộ trình bên phải.": [
    "从基础开始，循序渐进学习。请在右侧选择学习阶段与课程。",
    "Start with the basics and progress level by level. Choose a stage and lesson on the right."
  ],
  "THẺ 1 / 10": [
    "卡片 1 / 10",
    "CARD 1 / 10"
  ],
  "Nhấn vào thẻ để xem nghĩa": [
    "点击卡片查看释义",
    "Tap the card to reveal meaning"
  ],
  "Nhấn để lật": [
    "点击翻面",
    "Tap to flip"
  ],
  "♪ Nghe phát âm": [
    "♪ 听发音",
    "♪ Listen to pronunciation"
  ],
  "NGHĨA TRONG ERP": [
    "ERP 语境中的含义",
    "MEANING IN ERP"
  ],
  "♪ Nghe câu mẫu": [
    "♪ 听例句",
    "♪ Listen to example"
  ],
  "← Trước": [
    "← 上一个",
    "← Previous"
  ],
  "Học lại": [
    "重新学习",
    "Study again"
  ],
  "Đã nhớ →": [
    "记住了 →",
    "Remembered →"
  ],
  "Tiếp →": [
    "下一步 →",
    "Next →"
  ],
  "+ Học thêm 10 từ": [
    "+ 再学 10 个词",
    "+ Study 10 more words"
  ],
  "Chế độ: Trung → Việt": [
    "模式：中文 → 越南语",
    "Mode: Chinese → Vietnamese"
  ],
  "Tốc độ: Chậm": [
    "速度：慢速",
    "Speed: Slow"
  ],
  "CÂU 1 / 5": [
    "第 1 / 5 题",
    "QUESTION 1 / 5"
  ],
  "Chọn nghĩa đúng": [
    "选择正确释义",
    "Choose the correct meaning"
  ],
  "Câu tiếp theo →": [
    "下一题 →",
    "Next question →"
  ],
  "Làm lại": [
    "重做",
    "Try again"
  ],
  "THUẬT NGỮ": [
    "术语",
    "TERMS"
  ],
  "Tất cả": [
    "全部",
    "All"
  ],
  "Sản xuất": [
    "生产",
    "Production"
  ],
  "Chứng từ": [
    "单据",
    "Documents"
  ],
  "TỪ ĐÃ LƯU": [
    "已收藏的词汇",
    "SAVED WORDS"
  ],
  "Tra bằng tiếng Việt": [
    "用越南语查询",
    "Search in Vietnamese"
  ],
  "Nếu từ đã có trong bộ 154 thuật ngữ, chữ Hán, Pinyin và nghĩa tiếng Việt sẽ hiện ngay để bạn lưu.": [
    "如果已收录该术语，将显示汉字、拼音与越南语释义，方便收藏。",
    "If a term exists, its Hanzi, Pinyin and Vietnamese meaning appear for saving."
  ],
  "Thêm thuật ngữ mới": [
    "添加新术语",
    "Add a new term"
  ],
  "Nhập nghĩa Việt và chữ Trung; Pinyin được tạo tự động. Từ đã lưu được gộp vào từ điển và hàng chờ thẻ học.": [
    "输入越南语释义和汉字，系统自动生成拼音。收藏的词会加入词典与复习队列。",
    "Enter Vietnamese meaning and Hanzi; Pinyin is generated. Saved words join your dictionary and review queue."
  ],
  "Nhập chữ Trung để tự tạo Pinyin. Có thể sửa lại trước khi lưu.": [
    "输入汉字自动生成拼音，保存前可修改。",
    "Enter Hanzi to generate Pinyin; edit it before saving."
  ],
  "Lưu vào sổ từ": [
    "保存到生词本",
    "Save to wordbook"
  ],
  "Từ của bạn": [
    "你的词汇",
    "Your words"
  ],
  "TỪ CỘNG ĐỒNG": [
    "社区词库",
    "COMMUNITY WORDS"
  ],
  "Kho từ dùng chung": [
    "共享词库",
    "Shared vocabulary"
  ],
  "Đang kết nối kho chung…": [
    "正在连接共享词库…",
    "Connecting to shared vocabulary…"
  ],
  "↻ Làm mới": [
    "↻ 刷新",
    "↻ Refresh"
  ],
  "Đóng góp thuật ngữ": [
    "贡献新术语",
    "Contribute a term"
  ],
  "Ai mở link cũng có thể thêm và nhìn thấy từ đã gửi. Pinyin được tạo tự động từ chữ Trung.": [
    "任何访问者都能添加和查看共享词汇，拼音由汉字自动生成。",
    "Anyone with the link can add and view shared words. Pinyin is generated from Hanzi."
  ],
  "Từ mới được lưu công khai, tự xác minh và gộp vào kho học chung.": [
    "提交的词汇会公开保存并加入共享词库。",
    "New words are shared publicly and added to the vocabulary library."
  ],
  "Kho công khai": [
    "公开词库",
    "Public library"
  ],
  "Ai mở web cũng thêm và xem được từ.": [
    "所有访问者均可添加和查看词汇。",
    "Everyone can add and view words."
  ],
  "Từ mới được xác minh ngay và gộp vào từ điển cùng hàng chờ học.": [
    "新词经检查后加入词典和学习队列。",
    "New terms are checked and added to the dictionary and study queue."
  ],
  "Mỗi thiết bị gửi tối đa 100 từ trong 24 giờ để hạn chế spam.": [
    "每台设备每 24 小时最多提交 100 个词，以防垃圾信息。",
    "Up to 100 words per device per 24 hours to prevent spam."
  ],
  "Từ trùng sẽ bị từ chối tự động.": [
    "重复词汇将被自动拒绝。",
    "Duplicate words are automatically rejected."
  ],
  "Từ mọi người đã lưu": [
    "社区已收藏词汇",
    "Words saved by the community"
  ],
  "Đang tải dữ liệu…": [
    "正在加载数据…",
    "Loading data…"
  ],
  "Học từ nền tảng chữ Hán đến đọc hiểu và làm bài": [
    "从汉字基础到阅读和做题",
    "From Hanzi basics to reading and exercises"
  ],
  "12 bài nhập môn + HSK 1–4 đang học được": [
    "12 节入门课 + HSK 1–4 课程",
    "12 introductory lessons + HSK 1–4"
  ],
  "Đây là bộ bài thử nghiệm đang được biên soạn và kiểm tra dần, chưa thay thế giáo trình chính thức. HSK 1–3 được ưu tiên hoàn thiện; HSK 4 giữ bộ bài hiện có. HSK 5–9 vẫn hiển thị đầy đủ ở trạng thái sắp mở.": [
    "这是逐步完善的试用课程，尚不能代替正式教材。HSK 5–9 暂未开放。",
    "This is a work-in-progress course, not a replacement for official materials. HSK 5–9 are not yet available."
  ],
  "BETA · Cập nhật dần": [
    "测试版 · 持续更新",
    "BETA · Updated progressively"
  ],
  "LUYỆN PHẢN XẠ & TỰ NGHE LẠI": [
    "口语反应练习与录音回放",
    "SPEAKING REFLEX & RECORDINGS"
  ],
  "Kiểu bài": [
    "练习类型",
    "Exercise type"
  ],
  "Hội thoại theo tình huống": [
    "情景对话",
    "Situational dialogues"
  ],
  "Dịch nhanh Việt → Trung": [
    "越南语 → 中文快速翻译",
    "Quick Vietnamese → Chinese"
  ],
  "Nghe và nhại": [
    "跟读模仿",
    "Listen and repeat"
  ],
  "Phản xạ trong 8 giây": [
    "8 秒反应挑战",
    "8-second response challenge"
  ],
  "Tình huống": [
    "情境",
    "Situation"
  ],
  "HỆ THỐNG NÓI": [
    "口语练习系统",
    "SPEAKING PRACTICE"
  ],
  "♪ Nghe câu hỏi": [
    "♪ 听问题",
    "♪ Listen to the question"
  ],
  "Câu trả lời tiếng Trung của bạn": [
    "你的中文回答",
    "Your answer in Chinese"
  ],
  "⏱ Bắt đầu 8 giây": [
    "⏱ 开始 8 秒挑战",
    "⏱ Start 8-second challenge"
  ],
  "🎙 Bắt đầu đọc": [
    "🎙 开始朗读",
    "🎙 Start speaking"
  ],
  "Chấm nội dung": [
    "检查内容",
    "Check response"
  ],
  "Xem câu mẫu": [
    "查看示例回答",
    "View model answer"
  ],
  "● Ghi âm để nghe lại": [
    "● 录音回听",
    "● Record and replay"
  ],
  "Tiếp tục HSK": [
    "继续学习 HSK",
    "Continue HSK"
  ],
  "Bắt đầu học HSK 1": [
    "开始学习 HSK 1",
    "Start HSK 1"
  ],
  "Quay lại bài đang học, tiếp tục luyện tập và lưu tiến độ.": [
    "返回上次的课程，继续练习并保存进度。",
    "Return to your last lesson, practice and save progress."
  ],
  "Học từ mới, luyện nghe, làm bài rồi theo dõi tiến độ.": [
    "学习生词、练听力、做练习并跟踪进度。",
    "Learn words, listen, practice and track progress."
  ],
  "Bắt đầu phần Nền tảng": [
    "开始基础课程",
    "Start Foundation"
  ],
  "Tiếp tục lộ trình HSK": [
    "继续 HSK 学习路线",
    "Continue HSK roadmap"
  ],
  "Quay lại đúng bài gần nhất đã học.": [
    "返回最近学习的课程。",
    "Return to your most recent lesson."
  ],
  "Nền tảng": [
    "基础",
    "Foundation"
  ],
  "BẮT ĐẦU CHUỖI CỦA BẠN": [
    "开启你的连续学习",
    "START YOUR STREAK"
  ],
  "TIẾP TỤC GIỮ LỬA": [
    "继续保持学习动力",
    "KEEP THE STREAK"
  ],
  "Sẵn sàng học": [
    "准备好学习",
    "Ready to learn"
  ],
  "Sắp mở": [
    "即将开放",
    "Coming soon"
  ],
  "ngày liên tiếp": [
    "连续学习天数",
    "consecutive days"
  ],
  "Học mỗi ngày để giữ chuỗi và ghi nhớ lâu hơn.": [
    "每天学习，保持连续记录，记得更牢。",
    "Learn daily to maintain your streak and remember longer."
  ],
  "Hoàn thành cả ba để nhận huy hiệu": [
    "完成全部三项即可获得徽章",
    "Complete all three to earn a badge"
  ],
  "Vịt bền bỉ": [
    "坚持不懈的小鸭",
    "Persistent Duckie"
  ],
  "Tiếp tục học →": [
    "继续学习 →",
    "Continue learning →"
  ],
  "Xem lộ trình →": [
    "查看学习路线 →",
    "View roadmap →"
  ],
  "Đăng nhập để lưu tiến độ và nhận EXP nhiệm vụ.": [
    "登录后可保存进度并领取任务 EXP。",
    "Sign in to save progress and claim mission EXP."
  ],
  "Cần kiểm tra migration Supabase v90.": [
    "需要检查 Supabase v90 数据库迁移。",
    "Check Supabase v90 migration."
  ],
  "Kiểm tra kết nối rồi thử lại.": [
    "检查网络后重试。",
    "Check your connection and try again."
  ],
  "Đang tải EXP…": [
    "正在加载 EXP…",
    "Loading EXP…"
  ],
  "👑 Bảng xếp hạng": [
    "👑 排行榜",
    "👑 Leaderboard"
  ],
  "Xem tất cả ›": [
    "查看全部 ›",
    "View all ›"
  ],
  "Không tải được nhiệm vụ tuần.": [
    "无法加载每周任务。",
    "Could not load weekly missions."
  ],
  "Cần chạy migration Supabase v90.": [
    "需要运行 Supabase v90 迁移。",
    "Supabase v90 migration required."
  ],
  "Không tải được bảng xếp hạng.": [
    "无法加载排行榜。",
    "Could not load leaderboard."
  ],
  "Thử lại": [
    "重试",
    "Retry"
  ],
  "Chưa có dữ liệu EXP tuần này.": [
    "本周暂无 EXP 数据。",
    "No EXP data this week."
  ],
  "Menu chính": [
    "主菜单",
    "Main menu"
  ],
  "Khoảng thời gian xếp hạng": [
    "排行时间范围",
    "Ranking period"
  ],
  "Bảng xếp hạng — Developed by VDuckie": [
    "排行榜 — VDuckie 开发",
    "Leaderboard — Developed by VDuckie"
  ],
  "EXP tuần/tháng dùng để xếp hạng theo kỳ; Level luôn tính từ tổng EXP toàn thời gian.": [
    "每周、每月 EXP 用于相应排行；等级始终根据累计 EXP 计算。",
    "Weekly/monthly EXP determines period rankings; level uses lifetime EXP."
  ],
  "Đăng nhập để lưu EXP, nhận thưởng nhiệm vụ và xem hạng của bạn.": [
    "登录后可保存 EXP、领取任务奖励并查看排名。",
    "Sign in to save EXP, claim rewards and view your ranking."
  ],
  "Cần chạy migration Supabase v90 trước.": [
    "请先运行 Supabase v90 数据库迁移。",
    "Run the Supabase v90 migration first."
  ],
  "Hãy kiểm tra kết nối và thử lại.": [
    "请检查连接后重试。",
    "Check your connection and try again."
  ],
  "Chưa có người học": [
    "暂无学习者",
    "No learners yet"
  ],
  "Chưa có dữ liệu EXP": [
    "暂无 EXP 数据",
    "No EXP data yet"
  ],
  "Hãy hoàn thành bài học đầu tiên để xuất hiện ở đây.": [
    "完成第一课即可出现在这里。",
    "Complete your first lesson to appear here."
  ],
  "Chưa kết nối Supabase": [
    "尚未连接 Supabase",
    "Supabase not connected"
  ],
  "Không thể tải bảng xếp hạng.": [
    "无法加载排行榜。",
    "Could not load the leaderboard."
  ],
  "Không tải được bảng xếp hạng": [
    "无法加载排行榜",
    "Could not load leaderboard"
  ],
  "Chưa có bài tự kiểm tra": [
    "暂无自测记录",
    "No self-tests yet"
  ],
  "% câu nhớ nghĩa đúng": [
    "% 的词义回忆正确率",
    "% recall accuracy"
  ],
  "Nội dung đang kiểm duyệt, chưa mở học.": [
    "内容仍在审核，暂未开放。",
    "Content under review; not yet available."
  ],
  "Học HSK": [
    "学习 HSK",
    "Study HSK"
  ],
  "từ đã luyện": [
    "个已练习的词",
    "words practiced"
  ],
  "từ cần ôn": [
    "个待复习的词",
    "words due for review"
  ],
  "CẤP ĐỘ": [
    "等级",
    "LEVEL"
  ],
  "Ôn lại giáo trình MSUTONG trước đây": [
    "复习旧版 MSUTONG 课程",
    "Review previous MSUTONG course"
  ],
  "Ôn giáo trình cũ": [
    "复习旧版课程",
    "Review old course"
  ],
  "Chọn cấp độ HSK": [
    "选择 HSK 等级",
    "Choose HSK level"
  ],
  "Chọn HSK": [
    "选择 HSK",
    "Choose HSK"
  ],
  "LỘ TRÌNH TIẾNG TRUNG": [
    "中文学习路线",
    "CHINESE LEARNING ROADMAP"
  ],
  "Chọn HSK cấp độ": [
    "选择 HSK 等级",
    "Select HSK level"
  ],
  "Đi từng cấp độ từ HSK 1 đến HSK 9. Chọn một trình độ để bắt đầu bài học tương ứng.": [
    "从 HSK 1 到 HSK 9 循序渐进，选择等级开始学习。",
    "Progress from HSK 1 to 9; select a level to start."
  ],
  "← Trang chủ": [
    "← 首页",
    "← Home"
  ],
  "Đang xây dựng nội dung.": [
    "内容建设中。",
    "Content in progress."
  ],
  "Học từ vựng, nghe đọc, ngữ pháp và luyện tập.": [
    "学习词汇、听读、语法和练习。",
    "Study vocabulary, listening, reading, grammar and exercises."
  ],
  "Tiến bộ có số liệu": [
    "可量化的进步",
    "Measurable progress"
  ],
  "DASHBOARD CÁ NHÂN": [
    "个人学习面板",
    "PERSONAL DASHBOARD"
  ],
  "CÁ NHÂN HÓA · V85": [
    "个性化 · V85",
    "PERSONALIZED · V85"
  ],
  "Web học theo mục tiêu của bạn": [
    "按你的目标学习",
    "Learning for your goals"
  ],
  "Vai trò ERP muốn ưu tiên": [
    "优先学习的 ERP 职能",
    "Preferred ERP role"
  ],
  "Đang ưu tiên": [
    "当前重点",
    "Current focus"
  ],
  "ĐỀ XUẤT RIÊNG CHO BẠN": [
    "为你量身推荐",
    "RECOMMENDED FOR YOU"
  ],
  "Không phải ai cũng học cùng một lộ trình": [
    "每个人都有自己的学习路线",
    "Everyone has a different learning path"
  ],
  "Bắt đầu →": [
    "开始 →",
    "Start →"
  ],
  "Chưa có lịch sử. Mỗi từ tra trong Từ điển sẽ được lưu ở đây.": [
    "暂无历史记录。查询的词会保存在这里。",
    "No history yet. Dictionary lookups will appear here."
  ],
  "TRUNG TÂM HỌC TẬP · V83": [
    "学习中心 · V83",
    "LEARNING CENTER · V83"
  ],
  "Học tiếp, không phải tìm lại.": [
    "继续学习，无需重新查找。",
    "Resume learning without searching again."
  ],
  "Mục tiêu ngày và lịch sử tra từ được lưu cùng tài khoản.": [
    "每日目标和查词历史会关联至账户。",
    "Your daily goals and lookups stay with your account."
  ],
  "Đồng bộ tài khoản": [
    "账户同步",
    "Account sync"
  ],
  "Mở Từ điển": [
    "打开词典",
    "Open Dictionary"
  ],
  "MỤC TIÊU HÔM NAY": [
    "今日目标",
    "TODAY'S GOALS"
  ],
  "Giữ nhịp học vừa sức": [
    "保持适合自己的节奏",
    "Keep a steady learning pace"
  ],
  "TRA GẦN ĐÂY": [
    "最近查询",
    "RECENT LOOKUPS"
  ],
  "Lịch sử Từ điển": [
    "词典历史",
    "Dictionary history"
  ],
  "LỐI TẮT": [
    "快捷入口",
    "SHORTCUTS"
  ],
  "Vào học trong một chạm": [
    "一键开始学习",
    "Start learning with one tap"
  ],
  "Tiếp tục bài hiện tại": [
    "继续当前课程",
    "Continue current lesson"
  ],
  "Kho, sản xuất, mua hàng": [
    "仓库、生产、采购",
    "Warehouse, production, purchasing"
  ],
  "12.000+ từ HSK và ERP": [
    "12,000+ HSK 与 ERP 词汇",
    "12,000+ HSK and ERP words"
  ],
  "Giữ lửa học tiếng Trung": [
    "坚持中文学习",
    "Keep your Chinese study streak"
  ],
  "HÔM NAY HỌC GÌ?": [
    "今天学什么？",
    "WHAT TO LEARN TODAY?"
  ],
  "Ba việc đủ để tiến bộ": [
    "每天完成三项小任务",
    "Three steps to make progress"
  ],
  "Hoàn thành ba mục để giữ streak và đạt mục tiêu ngày.": [
    "完成三项任务，保持连续学习并达成每日目标。",
    "Complete three tasks to maintain your streak and meet daily goals."
  ],
  "TỪ YẾU CỦA TÔI": [
    "我的薄弱词汇",
    "MY WEAK WORDS"
  ],
  "Sai nhiều thì ôn trước": [
    "错得多的先复习",
    "Review mistakes first"
  ],
  "NHIỆM VỤ TUẦN": [
    "每周任务",
    "WEEKLY MISSIONS"
  ],
  "Mốc nhỏ, tiến bộ thật": [
    "小目标，真进步",
    "Small goals, real progress"
  ],
  "Hoàn thành cả ba nhiệm vụ để mở huy hiệu": [
    "完成全部三项即可解锁徽章",
    "Complete all three missions to unlock a badge"
  ],
  "Không còn từ quá hạn": [
    "没有逾期单词",
    "No overdue words"
  ],
  "từ đang chờ ôn": [
    "个待复习单词",
    "words awaiting review"
  ],
  "Ôn ngay": [
    "立即复习",
    "Review now"
  ],
  "Đã có hoạt động bài học hôm nay": [
    "今天已有学习记录",
    "Learning activity recorded today"
  ],
  "Quay lại đúng bài đang học": [
    "返回正在学习的课程",
    "Resume your current lesson"
  ],
  "Chưa có từ yếu. Làm quiz hoặc chính tả để web nhận diện nội dung cần ôn.": [
    "目前没有薄弱词汇。做测验或听写后可识别需复习的内容。",
    "No weak words yet. Take a quiz or dictation to identify what to review."
  ],
  "Nghe chữ": [
    "听汉字发音",
    "Listen to Hanzi"
  ],
  "Chữ Hán": [
    "汉字",
    "Chinese characters"
  ],
  "Ngữ pháp": [
    "语法",
    "Grammar"
  ],
  "Hội thoại": [
    "会话",
    "Dialogue"
  ],
  "Đọc hiểu": [
    "阅读理解",
    "Reading comprehension"
  ],
  "Nội dung": [
    "内容",
    "Content"
  ],
  "Xem rubric tự đối chiếu": [
    "查看自评标准",
    "View self-check rubric"
  ],
  "Bài tập của lesson": [
    "本课练习",
    "Lesson exercises"
  ],
  "Hãy viết câu trả lời trước khi tự đối chiếu rubric.": [
    "请先作答，再对照评分标准。",
    "Answer first, then check the rubric."
  ],
  "Hãy nhập/chọn câu trả lời trước.": [
    "请先填写或选择答案。",
    "Please enter or select an answer first."
  ],
  "Đúng.": [
    "正确。",
    "Correct."
  ],
  "Chưa khớp.": [
    "不正确。",
    "Not quite."
  ],
  "Hãy xem lại các từ chưa nhớ.": [
    "请复习尚未记住的词汇。",
    "Review words you haven't mastered."
  ],
  "Chọn chữ Hán đúng với nghĩa trên.": [
    "根据上面的意思选择正确汉字。",
    "Choose the Hanzi matching the meaning above."
  ],
  "Chọn nghĩa đúng của chữ Hán trên.": [
    "选择上方汉字的正确释义。",
    "Choose the meaning of the Hanzi above."
  ],
  "✓ Chính xác!": [
    "✓ 正确！",
    "✓ Correct!"
  ],
  "Chưa đúng. Đáp án:": [
    "不正确。答案：",
    "Not quite. Answer:"
  ],
  "Chưa có từ mới trong bài này.": [
    "本课暂无生词。",
    "No vocabulary in this lesson yet."
  ],
  "Cách dùng:": [
    "用法：",
    "Usage:"
  ],
  "Lượng từ:": [
    "量词：",
    "Measure word:"
  ],
  "Dễ nhầm:": [
    "易混淆：",
    "Often confused:"
  ],
  "Lỗi thường gặp": [
    "常见错误",
    "Common mistakes"
  ],
  "Chạm để xem nghĩa": [
    "点击查看释义",
    "Tap to reveal meaning"
  ],
  "Hiểu sâu hơn": [
    "深入理解",
    "Learn more"
  ],
  "Nhớ nghĩa của từ này?": [
    "记得这个词的意思吗？",
    "Remember this word's meaning?"
  ],
  "Từ tiếp theo →": [
    "下一个词 →",
    "Next word →"
  ],
  "Từ tiếp →": [
    "下一个词 →",
    "Next word →"
  ],
  "← Từ trước": [
    "← 上一个词",
    "← Previous word"
  ],
  "Học từ mới": [
    "学习生词",
    "Study new words"
  ],
  "Nghe → đoán nghĩa → xem ví dụ → thử nhớ lại.": [
    "听发音 → 猜意思 → 看例句 → 回忆。",
    "Listen → guess → examples → recall."
  ],
  "🎮 Chơi trò nhớ nghĩa": [
    "🎮 词义记忆游戏",
    "🎮 Meaning recall game"
  ],
  "Nhớ lại": [
    "回忆",
    "Recall"
  ],
  "Phát transcript bằng TTS": [
    "使用 TTS 播放文字稿",
    "Play transcript with TTS"
  ],
  "Hiện/ẩn transcript": [
    "显示/隐藏文字稿",
    "Toggle transcript"
  ],
  "Xem đáp án + bằng chứng": [
    "查看答案与依据",
    "View answer & evidence"
  ],
  "Chưa xác minh": [
    "尚未验证",
    "Not verified"
  ],
  "Trình duyệt không hỗ trợ fetch.": [
    "浏览器不支持请求功能。",
    "Browser doesn't support fetch."
  ],
  "Không tải được": [
    "加载失败",
    "Could not load"
  ],
  "Tiến độ bài học": [
    "学习进度",
    "Lesson progress"
  ],
  "Làm quiz nhớ nghĩa để phát hiện từ chưa thuộc.": [
    "通过词义测验找出还没掌握的词汇。",
    "Take a recall quiz to identify weak words."
  ],
  "Đã kiểm tra đủ câu. Hãy lưu bài học và quay lại ôn từ vào ngày mai.": [
    "所有题目已检查。请保存进度并在明天复习。",
    "All questions checked. Save progress and review tomorrow."
  ],
  "Kết thúc bài học": [
    "结束课程",
    "Finish lesson"
  ],
  "✓ Hoàn thành bài học": [
    "✓ 已完成课程",
    "✓ Lesson completed"
  ],
  "✓ Hoàn thành & lưu tiến độ": [
    "✓ 完成并保存进度",
    "✓ Finish & save progress"
  ],
  "✓ Đã hoàn thành bài": [
    "✓ 已完成",
    "✓ Completed"
  ],
  "Học bài tiếp →": [
    "学习下一课 →",
    "Next lesson →"
  ],
  "ÔN TẬP CÁCH QUÃNG": [
    "间隔复习",
    "SPACED REVIEW"
  ],
  "Hôm nay không còn từ HSK đến hạn. Tiếp tục học một bài để tạo lịch ôn mới.": [
    "今天没有待复习的 HSK 词汇。继续学习可生成新的复习计划。",
    "No HSK words due today. Study another lesson to create a review schedule."
  ],
  "↻ Ôn HSK": [
    "↻ 复习 HSK",
    "↻ Review HSK"
  ],
  "Tiến độ tự học đã lưu": [
    "学习进度已保存",
    "Study progress saved"
  ],
  "Trợ giảng tiếng Trung": [
    "中文学习助手",
    "Chinese learning assistant"
  ],
  "Mở Duckie Chat": [
    "打开 Duckie Chat",
    "Open Duckie Chat"
  ],
  "Trợ giảng tiếng Trung miễn phí": [
    "免费中文学习助手",
    "Free Chinese tutor"
  ],
  "VDUCKIE · TRỢ GIẢNG MIỄN PHÍ": [
    "VDUCKIE · 免费学习助手",
    "VDUCKIE · FREE TUTOR"
  ],
  "✦ Hỏi trợ giảng": [
    "✦ 询问学习助手",
    "✦ Ask the tutor"
  ],
  "✦ Hỏi VDuckie": [
    "✦ 问问 VDuckie",
    "✦ Ask VDuckie"
  ],
  "Tra cứu và giải thích từ": [
    "词汇查询与解释",
    "Word lookup and explanation"
  ],
  "Tìm": [
    "搜索",
    "Search"
  ],
  "Chọn tình huống": [
    "选择情境",
    "Choose a situation"
  ],
  "🔊 Nghe mẫu": [
    "🔊 听示例",
    "🔊 Listen to example"
  ],
  "Kiểm tra theo mẫu": [
    "对照示例检查",
    "Check against example"
  ],
  "Câu tiếp →": [
    "下一句 →",
    "Next sentence →"
  ],
  "Trợ giảng": [
    "学习助手",
    "Tutor"
  ],
  "Giải thích": [
    "解释",
    "Explanation"
  ],
  "Điểm yếu": [
    "薄弱项",
    "Weak areas"
  ],
  "Luyện nói": [
    "口语练习",
    "Speaking practice"
  ],
  "Công cụ": [
    "工具",
    "Tools"
  ],
  "Phân biệt từ": [
    "辨析词语",
    "Compare words"
  ],
  "Xóa hội thoại": [
    "清空对话",
    "Clear conversation"
  ],
  "Nghe phát âm tiếng Trung": [
    "听中文发音",
    "Listen to Chinese pronunciation"
  ],
  "Bộ công cụ học tập chưa được tải.": [
    "学习工具尚未加载。",
    "Learning tools haven't loaded yet."
  ],
  "Không kết nối được máy chủ AI.": [
    "无法连接 AI 服务器。",
    "Could not connect to AI server."
  ],
  "Máy chủ chưa trả lời được.": [
    "服务器尚未响应。",
    "Server hasn't responded."
  ],
  "Phản hồi quá lâu. Thử gửi lại nhé.": [
    "响应超时，请重试。",
    "Response timed out. Try again."
  ],
  "Chưa kết nối được trợ giảng.": [
    "尚未连接到学习助手。",
    "Tutor connection unavailable."
  ],
  "Không tìm thấy từ phù hợp trong kho hiện có.": [
    "当前词库中没有匹配的词汇。",
    "No matching words in the current dictionary."
  ],
  "Đang tải dữ liệu từ điển…": [
    "正在加载词典数据…",
    "Loading dictionary data…"
  ],
  "TỪ ĐIỂN TRUNG – VIỆT": [
    "中越词典",
    "CHINESE–VIETNAMESE DICTIONARY"
  ],
  "Sao chép": [
    "复制",
    "Copy"
  ],
  "Câu ví dụ từ dữ liệu nguồn": [
    "来源数据中的例句",
    "Example from source data"
  ],
  "Các chữ cấu thành": [
    "汉字组成",
    "Character components"
  ],
  "Học cách viết Hán tự": [
    "学习汉字书写",
    "Learn Hanzi writing"
  ],
  "Đã tải dữ liệu viết nét.": [
    "笔画数据已加载。",
    "Stroke-order data loaded."
  ],
  "Chưa có dữ liệu nét cho chữ này.": [
    "该字暂无笔画数据。",
    "No stroke data for this character."
  ],
  "Không thể tải dữ liệu nét của chữ này.": [
    "无法加载此字的笔画数据。",
    "Could not load stroke data."
  ],
  "Đang lưu…": [
    "正在保存…",
    "Saving…"
  ],
  "Đã lưu vào sổ từ cá nhân ✓": [
    "已保存到个人生词本 ✓",
    "Saved to personal wordbook ✓"
  ],
  "Đúng nét": [
    "笔画正确",
    "Correct stroke"
  ],
  "Chưa học": [
    "尚未学习",
    "Not studied"
  ],
  "Đang học": [
    "学习中",
    "Studying"
  ],
  "Cần ôn lại": [
    "需要复习",
    "Needs review"
  ],
  "☆ Lưu vào sổ từ": [
    "☆ 保存到生词本",
    "☆ Save to wordbook"
  ],
  "📖 Mở sổ từ": [
    "📖 打开生词本",
    "📖 Open wordbook"
  ],
  "← Chữ trước": [
    "← 上一个字",
    "← Previous character"
  ],
  "Chữ sau →": [
    "下一个字 →",
    "Next character →"
  ],
  "▶ Viết mẫu": [
    "▶ 笔画示范",
    "▶ Show stroke order"
  ],
  "Tạm dừng / Tiếp tục": [
    "暂停 / 继续",
    "Pause / Resume"
  ],
  "✍ Tự luyện viết": [
    "✍ 自行书写",
    "✍ Practice writing"
  ],
  "Gợi ý": [
    "提示",
    "Hint"
  ],
  "Viết lại": [
    "重写",
    "Write again"
  ],
  "Mọi cấp HSK": [
    "所有 HSK 等级",
    "All HSK levels"
  ],
  "Đang tải sổ từ…": [
    "正在加载生词本…",
    "Loading wordbook…"
  ],
  "Xóa": [
    "删除",
    "Delete"
  ],
  "Không có từ nào khớp bộ lọc.": [
    "没有符合筛选条件的词汇。",
    "No words match the filters."
  ],
  "Giữ chuỗi hôm nay": [
    "保持今日学习连续记录",
    "Keep today's streak"
  ],
  "Chuỗi hiện tại": [
    "当前连续学习天数",
    "Current streak"
  ],
  "Chưa có từ đến hạn": [
    "暂无待复习词汇",
    "No words due"
  ],
  "Đã xong": [
    "已完成",
    "Done"
  ],
  "Làm quen từ": [
    "熟悉词汇",
    "Get familiar"
  ],
  "Cách viết": [
    "书写方式",
    "Writing"
  ],
  "Gọi lại từ": [
    "回忆词汇",
    "Recall word"
  ],
  "Ghép cụm ERP": [
    "ERP 词语搭配",
    "ERP phrases"
  ],
  "Đặt vào câu ERP": [
    "ERP 造句",
    "ERP sentences"
  ],
  "Kiểm tra cuối": [
    "最终测验",
    "Final quiz"
  ],
  "Ôn tập xong!": [
    "复习完成！",
    "Review complete!"
  ],
  "CHỌN NGÔN NGỮ": [
    "选择语言",
    "SELECT LANGUAGE"
  ]
});
  Object.assign(strings,{
  "CÂU MẪU TRẢ LỜI": [
    "参考回答",
    "MODEL ANSWER"
  ],
  "Dùng câu này": [
    "使用此句",
    "Use this sentence"
  ],
  "MÁY NGHE THÀNH": [
    "语音识别结果",
    "SPEECH RECOGNIZED AS"
  ],
  "Lượt tiếp theo →": [
    "下一轮 →",
    "Next round →"
  ],
  "Kết quả chỉ đo mức độ khớp giữa chữ trình duyệt nghe được và câu mẫu; không chấm thanh điệu, âm đầu hay vận mẫu. Hãy nghe lại bản ghi để tự đối chiếu. Micro hoặc dịch vụ nhận dạng kém có thể làm kết quả sai lệch. Bản ghi chỉ nằm trên thiết bị của bạn.": [
    "结果只比较语音识别文本与示例句，不评估声调及发音细节。请回听录音。识别可能受麦克风影响；录音仅保存在设备上。",
    "Results compare recognized text with the example, not tones or precise pronunciation. Listen back to assess yourself. Accuracy depends on your microphone; recordings stay on your device."
  ],
  "Bắt đầu từ phát âm và chữ Hán, sau đó tiến dần qua từng cấp HSK.": [
    "从发音和汉字基础入门，再逐级学习 HSK。",
    "Start with pronunciation and Hanzi, then progress through HSK levels."
  ],
  "Phát âm · chữ Hán": [
    "发音 · 汉字",
    "Pronunciation · Hanzi"
  ],
  "Nhập môn": [
    "入门",
    "Introductory"
  ],
  "Sơ cấp": [
    "初级",
    "Elementary"
  ],
  "Tiền trung cấp → trung cấp": [
    "准中级 → 中级",
    "Pre-intermediate → intermediate"
  ],
  "Mở lộ trình HSK": [
    "打开 HSK 学习路线",
    "Open HSK roadmap"
  ],
  "LỘ TRÌNH HÔM NAY": [
    "今日学习路线",
    "TODAY'S ROADMAP"
  ],
  "Học theo từng bước": [
    "循序渐进学习",
    "Learn step by step"
  ],
  "từ đã nhớ": [
    "个已记住的词",
    "words remembered"
  ],
  "Bài nghiệp vụ": [
    "业务课程",
    "Workplace lessons"
  ],
  "8 bài Kho · Sản xuất": [
    "8 节仓库 · 生产课程",
    "8 Warehouse · Production lessons"
  ],
  "Học thẻ từ": [
    "使用词卡学习",
    "Study flashcards"
  ],
  "10 từ theo chủ đề": [
    "10 个主题词汇",
    "10 themed words"
  ],
  "Kiểm tra nhanh": [
    "快速测验",
    "Quick quiz"
  ],
  "5 câu củng cố": [
    "5 道巩固题",
    "5 review questions"
  ],
  "Luyện phản xạ": [
    "反应练习",
    "Response practice"
  ],
  "20 tình huống · Luyện phản xạ": [
    "20 个场景 · 反应练习",
    "20 scenarios · Response practice"
  ],
  "câu chưa kiểm tra": [
    "道题尚未检查",
    "unchecked questions"
  ],
  "Chưa kiểm tra": [
    "尚未检查",
    "Not checked"
  ],
  "Trả lời đúng": [
    "回答正确",
    "Correct answers"
  ],
  "Tỷ lệ đúng": [
    "正确率",
    "Accuracy"
  ],
  "Lịch ôn tập": [
    "复习日程",
    "Review schedule"
  ],
  "Kiểm tra lại": [
    "重新检查",
    "Check again"
  ],
  "Tiến độ": [
    "进度",
    "Progress"
  ],
  "Xem chi tiết": [
    "查看详情",
    "View details"
  ],
  "Thu gọn": [
    "收起",
    "Collapse"
  ],
  "Mở rộng": [
    "展开",
    "Expand"
  ],
  "Chọn đáp án": [
    "选择答案",
    "Select an answer"
  ],
  "Chọn bài học": [
    "选择课程",
    "Choose a lesson"
  ],
  "Lưu thay đổi": [
    "保存更改",
    "Save changes"
  ],
  "Xem lại": [
    "复习",
    "Review"
  ],
  "Đã học": [
    "已学习",
    "Studied"
  ],
  "Chưa có lịch sử": [
    "暂无记录",
    "No history"
  ],
  "Nhật ký học tập": [
    "学习记录",
    "Learning journal"
  ],
  "Hoàn thành mục tiêu": [
    "目标已完成",
    "Goal completed"
  ],
  "Chủ đề": [
    "主题",
    "Topic"
  ],
  "Thống kê": [
    "统计",
    "Statistics"
  ],
  "Phát âm": [
    "发音",
    "Pronunciation"
  ],
  "Hoạt động học": [
    "学习活动",
    "Learning activity"
  ],
  "Bài tập": [
    "练习题",
    "Exercises"
  ],
  "Trắc nghiệm": [
    "选择题",
    "Multiple-choice quiz"
  ],
  "Thành tích": [
    "成就",
    "Achievements"
  ],
  "Điểm kinh nghiệm": [
    "经验值",
    "Experience points"
  ]
});
  Object.assign(strings,{
  "tháng này": [
    "本月",
    "this month"
  ],
  "tổng EXP": [
    "累计 EXP",
    "total EXP"
  ],
  "tuần này": [
    "本周",
    "this week"
  ],
  "✓ Đã nhận +": [
    "✓ 已领取 +",
    "✓ Claimed +"
  ],
  "Duckie Chat hỗ trợ học tiếng Trung": [
    "Duckie Chat 中文学习助手",
    "Duckie Chat for learning Chinese"
  ],
  "🔊 Nghe chữ Hán": [
    "🔊 听汉字发音",
    "🔊 Listen to Hanzi"
  ],
  "Chào hỏi": [
    "打招呼",
    "Greetings"
  ],
  "Mua hàng": [
    "采购",
    "Purchasing"
  ],
  "Công xưởng": [
    "工厂",
    "Factory"
  ],
  "Mở trợ giảng học tiếng Trung miễn phí": [
    "打开免费中文学习助手",
    "Open free Chinese tutor"
  ],
  "Đã nhận ra từ phù hợp tình huống:": [
    "已识别符合情境的词汇：",
    "Recognized matching words:"
  ],
  ". Chưa xác minh ngữ pháp toàn câu.": [
    "。尚未检查整句语法。",
    ". Full sentence grammar was not verified."
  ],
  "Chưa thấy các mẫu:": [
    "未找到这些表达模式：",
    "Missing these patterns:"
  ],
  ". Hãy thử một câu có từ phù hợp.": [
    "。请尝试使用符合情境的词汇造句。",
    ". Try a sentence with relevant words."
  ],
  "✓ Đúng.": [
    "✓ 正确。",
    "✓ Correct."
  ],
  "✗ Chưa đúng.": [
    "✗ 不正确。",
    "✗ Not correct."
  ],
  "Đáp án:": [
    "答案：",
    "Answer:"
  ],
  "Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Có thể nghe mẫu và luyện đọc thủ công.": [
    "当前浏览器不支持语音识别。你仍可听示例并自行练习朗读。",
    "Your browser does not support speech recognition. You can still listen and practice manually."
  ],
  "Nhận dạng:": [
    "识别结果：",
    "Recognized:"
  ],
  "Chưa khớp nội dung chữ Hán. Hãy nghe rồi thử lại.": [
    "尚未匹配汉字内容。请听一遍再试。",
    "The Hanzi did not match. Listen and try again."
  ],
  "Không nhận dạng được:": [
    "无法识别：",
    "Could not recognize:"
  ],
  ". Kiểm tra quyền micro và kết nối。": [
    "。请检查麦克风权限和网络连接。",
    ". Check microphone permissions and connection."
  ],
  "Đang nghe…": [
    "正在聆听…",
    "Listening…"
  ],
  "Không khởi động được micro:": [
    "无法启动麦克风：",
    "Could not start microphone:"
  ],
  "Học tiếng Trung cùng VDuckie": [
    "与 VDuckie 一起学中文",
    "Learn Chinese with VDuckie"
  ],
  "Kho từ điển đang tải. Hãy thử lại sau.": [
    "词典仍在加载，请稍后重试。",
    "The dictionary is loading. Try again shortly."
  ],
  "Nghĩa:": [
    "释义：",
    "Meaning:"
  ],
  "Chưa có ví dụ được xác minh cho mục từ này.": [
    "该词条暂无已验证例句。",
    "No verified example for this entry."
  ],
  "Muốn giải thích ngữ pháp linh hoạt và phân biệt ngữ cảnh, cần kết nối AI API ở phiên bản sau.": [
    "灵活的语法和语境讲解功能需在后续版本连接 AI API。",
    "Flexible grammar and context explanations require an AI API in a future version."
  ],
  "Chế độ miễn phí kiểm tra từ khóa phù hợp tình huống; không chấm chính xác ngữ pháp câu tự do.": [
    "免费模式仅检查情境关键词，不会准确评分自由表达句子的语法。",
    "Free mode checks keywords for the scenario, not full sentence grammar."
  ],
  "Chưa nạp đủ dữ liệu từ điển.": [
    "词典数据尚未加载完成。",
    "Dictionary data is not fully loaded."
  ],
  "Kết quả luyện tập": [
    "练习结果",
    "Practice results"
  ],
  "Làm lại bài khác": [
    "练习另一组题",
    "Try another quiz"
  ],
  "Phân tích điểm cần ôn": [
    "分析复习重点",
    "Review weak points"
  ],
  "Đã ghi nhận": [
    "已记录",
    "Recorded"
  ],
  "lượt làm bài trên thiết bị này.": [
    "次本设备的练习记录。",
    "practice sessions on this device."
  ],
  "Đăng nhập Google để lưu từ và đồng bộ giữa các thiết bị.": [
    "请使用 Google 登录以保存词汇并在设备间同步。",
    "Sign in with Google to save words and sync across devices."
  ],
  "Chưa kết nối được tài khoản Supabase.": [
    "尚未连接 Supabase 账户。",
    "Supabase account connection is unavailable."
  ],
  "Không kiểm tra được sổ từ:": [
    "无法检查生词本：",
    "Could not check wordbook:"
  ],
  "Không lưu được từ:": [
    "无法保存词汇：",
    "Could not save word:"
  ],
  "Đăng nhập Google để mở sổ từ đồng bộ.": [
    "请登录 Google 以访问同步生词本。",
    "Sign in with Google to access your synced wordbook."
  ],
  "Không tải được sổ từ:": [
    "无法加载生词本：",
    "Could not load wordbook:"
  ],
  "Không lưu được trạng thái:": [
    "无法保存状态：",
    "Could not save status:"
  ],
  "Không cập nhật được:": [
    "无法更新：",
    "Could not update:"
  ],
  "Chỉ hiển thị từ của tài khoản đang đăng nhập.": [
    "仅显示当前登录账户的词汇。",
    "Showing words for the signed-in account only."
  ],
  "Kho & tồn kho": [
    "仓库与库存",
    "Warehouse & inventory"
  ],
  "Sản xuất & BOM": [
    "生产与 BOM",
    "Production & BOM"
  ],
  "Kế toán & giá thành": [
    "会计与成本",
    "Accounting & costing"
  ],
  "Tài chính": [
    "财务",
    "Finance"
  ],
  "ERP chuyên sâu": [
    "进阶 ERP",
    "Advanced ERP"
  ],
  "Kết hợp HSK + ERP": [
    "HSK + ERP 综合学习",
    "HSK + ERP combined"
  ],
  "Kế toán": [
    "会计",
    "Accounting"
  ],
  "Thi cử và nền tảng": [
    "考试与基础学习",
    "Exams and foundations"
  ],
  "Dùng ngay tại công ty": [
    "工作场景即学即用",
    "Use directly at work"
  ],
  "Kết hợp": [
    "综合",
    "Combined"
  ],
  "Học song song hai mục tiêu": [
    "同时兼顾两个学习目标",
    "Study two goals together"
  ],
  "· hướng nghiệp vụ": [
    "· 业务方向",
    "· business track"
  ],
  ". Lựa chọn này được đồng bộ theo tài khoản。": [
    "。此选择将与账户同步。",
    ". This selection syncs with your account."
  ],
  "từ đã có lịch ôn": [
    "个词已安排复习",
    "words scheduled for review"
  ],
  "bài HSK hoàn thành": [
    "节 HSK 课已完成",
    "HSK lessons completed"
  ],
  "bài ERP hoàn thành": [
    "节 ERP 课已完成",
    "ERP lessons completed"
  ],
  "ngày streak hiện tại": [
    "天当前连续学习",
    "days in current streak"
  ],
  "Đã có lịch ôn": [
    "已安排复习",
    "Review scheduled"
  ],
  "Hoàn thành 40 hoạt động": [
    "完成 40 项学习活动",
    "Complete 40 activities"
  ],
  "Chinh phục 3 bài": [
    "完成 3 课",
    "Complete 3 lessons"
  ],
  "Học một hoạt động hôm nay để thắp đốm lửa đầu tiên. Dữ liệu sẽ đi theo tài khoản khi đổi máy.": [
    "今天完成一项学习活动来开启连续学习记录。数据会与账户同步。",
    "Complete a learning activity today to start your streak. Data will sync with your account."
  ],
  "Học và luyện từ": [
    "学习与练习词汇",
    "Study and practice vocabulary"
  ],
  "Tiếp tục một bài HSK": [
    "继续一节 HSK 课程",
    "Continue an HSK lesson"
  ],
  "STREAK 7 NGÀY · ĐỒNG BỘ TÀI KHOẢN": [
    "连续学习 7 天 · 账户同步",
    "7-DAY STREAK · ACCOUNT SYNC"
  ],
  "ngày": [
    "天",
    "days"
  ]
});
  Object.assign(strings,{
  "Ôn": [
    "复习",
    "Review"
  ],
  "Đang đến hạn ôn": [
    "已到复习时间",
    "Review due"
  ],
  "Mỗi ngày có hoạt động học sẽ được đóng dấu lửa và lưu theo tài khoản.": [
    "每天完成学习活动即可保留连续学习记录，并同步至账户。",
    "Daily activity maintains your streak and syncs to your account."
  ],
  "Mới bắt đầu? Chọn HSK 1. Đã biết tiếng Trung? Chọn cấp phù hợp rồi học lần lượt: từ mới → nghe & đọc → luyện tập → lưu tiến độ.": [
    "刚开始学习中文？请选择 HSK 1。已有基础可选相应等级，依次学习生词、听读、练习并保存进度。",
    "New to Chinese? Start with HSK 1. Otherwise pick your level, then learn vocabulary, listen, practice and save progress."
  ],
  "Người Việt dễ mắc": [
    "越南学习者常见问题",
    "Common difficulties for Vietnamese learners"
  ],
  "Bộ:": [
    "部首：",
    "Radical:"
  ],
  "Chưa có từ mới trong bài này.": [
    "本课暂无生词。",
    "No new vocabulary in this lesson."
  ],
  "Tiếp tục đúng vị trí đang học hoặc chọn cấp độ khác.": [
    "继续上次的课程或选择其他等级。",
    "Resume where you left off or select another level."
  ],
  "Tiến độ MSUTONG cũ được giữ nguyên": [
    "旧版 MSUTONG 学习进度已保留",
    "Your previous MSUTONG progress is preserved"
  ],
  "Nếu cần học lại phần trước, mở riêng giáo trình cũ.": [
    "如需复习旧内容，请打开旧版课程。",
    "Open the previous curriculum to review earlier lessons."
  ],
  "Đang học HSK": [
    "正在学习 HSK",
    "Currently studying HSK"
  ],
  "Đã đánh dấu hoàn thành": [
    "已标记完成",
    "Marked as complete"
  ],
  "Cấp người học": [
    "学习者等级",
    "Learner level"
  ],
  "đến cấp tiếp theo": [
    "距离下一级",
    "to next level"
  ],
  "Xem thêm": [
    "查看更多",
    "See more"
  ],
  "Chỉ hiển thị": [
    "仅显示",
    "Showing only"
  ]
});
  // Screenshot-based regression catalog: functional UI only; learning definitions/examples remain untouched.
  Object.assign(strings,{
    "Tiếp tục bài HSK": [
      "继续上次的 HSK 课程",
      "Continue HSK lesson"
    ],
    "Bám đúng cấp độ và bài gần nhất của bạn.": [
      "从上次学习的等级和课程继续。",
      "Resume the last level and lesson you studied."
    ],
    "Tra từ theo mục tiêu": [
      "按学习目标查词",
      "Look up words by goal"
    ],
    "Mở từ điển và ưu tiên nguồn phù hợp.": [
      "打开词典，优先显示合适的词库。",
      "Open the dictionary with a suitable source."
    ],
    "Ôn từ yếu": [
      "复习薄弱词汇",
      "Review weak words"
    ],
    "Làm lại các từ có số lần sai cao nhất.": [
      "优先复习错误次数最多的词汇。",
      "Review the words you missed most often."
    ],
    "Ưu tiên từ và tình huống thuộc vai trò đã chọn.": [
      "优先学习所选岗位的词汇与情境。",
      "Prioritize words and situations for your chosen role."
    ],
    "Bắt đầu →": [
      "开始 →",
      "Start →"
    ],
    "ERP thực tế": [
      "实用 ERP",
      "Practical ERP"
    ],
    "Kho": [
      "仓库",
      "Warehouse"
    ],
    "Sản xuất": [
      "生产",
      "Production"
    ],
    "Mua hàng": [
      "采购",
      "Purchasing"
    ],
    "Kế toán": [
      "会计",
      "Accounting"
    ],
    "Tài chính": [
      "财务",
      "Finance"
    ],
    "Kho & tồn kho": [
      "仓库与库存",
      "Warehouse & inventory"
    ],
    "Sản xuất & BOM": [
      "生产与物料清单",
      "Production & BOM"
    ],
    "Kế toán & giá thành": [
      "会计与成本",
      "Accounting & costing"
    ],
    "Thi cử và nền tảng": [
      "备考与基础",
      "Exams and foundations"
    ],
    "Dùng ngay tại công ty": [
      "职场即学即用",
      "Use at work"
    ],
    "Học song song hai mục tiêu": [
      "同时学习两类内容",
      "Learn both tracks"
    ],
    "ERP chuyên sâu": [
      "ERP 专项学习",
      "Focused ERP"
    ],
    "Kết hợp HSK + ERP": [
      "HSK 与 ERP 结合",
      "HSK + ERP combined"
    ],
    "Kết hợp": [
      "综合学习",
      "Combined"
    ],
    "Đang ưu tiên": [
      "当前重点",
      "Current focus"
    ],
    "· hướng nghiệp vụ": [
      "· 业务方向",
      "· Business area"
    ],
    ". Lựa chọn này được đồng bộ theo tài khoản.": [
      "。此设置会同步到你的账户。",
      "This choice is synced to your account."
    ],
    "Lựa chọn này được đồng bộ theo tài khoản.": [
      "此设置会同步到你的账户。",
      "This choice is synced to your account."
    ],
    "ĐỀ XUẤT RIÊNG CHO BẠN": [
      "为你量身推荐",
      "Recommended for you"
    ],
    "Không phải ai cũng học cùng một lộ trình": [
      "每个人都有自己的学习路线",
      "Everyone has a different learning path"
    ],
    "VAI TRÒ ERP MUỐN ƯU TIÊN": [
      "优先学习的 ERP 职能",
      "ERP role to prioritize"
    ],
    "Vai trò ERP muốn ưu tiên": [
      "优先学习的 ERP 职能",
      "ERP role to prioritize"
    ],
    "DASHBOARD CÁ NHÂN": [
      "个人学习看板",
      "PERSONAL DASHBOARD"
    ],
    "Tiến bộ có số liệu": [
      "用数据记录成长",
      "Track your progress"
    ],
    "ngày streak hiện tại": [
      "当前连续学习天数",
      "current streak days"
    ],
    "từ đã có lịch ôn": [
      "已安排复习的词汇",
      "words scheduled for review"
    ],
    "bài HSK hoàn thành": [
      "已完成的 HSK 课程",
      "HSK lessons completed"
    ],
    "bài ERP hoàn thành": [
      "已完成的 ERP 课程",
      "ERP lessons completed"
    ],
    "Đề thay đổi theo lỗi của bạn": [
      "根据你的错题调整练习",
      "Practice adapts to your mistakes"
    ],
    "ÔN THÍCH ỨNG · V86": [
      "自适应复习 · V86",
      "ADAPTIVE REVIEW · V86"
    ],
    "Web ưu tiên từ sai nhiều, điều chỉnh độ khó theo tỷ lệ đúng và ghi lại kết quả để lần sau chọn câu phù hợp hơn.": [
      "系统优先安排常错词汇，根据正确率调整难度，并记录结果以优化下次练习。",
      "The app prioritizes missed words, adjusts difficulty to accuracy, and saves results to tailor future sessions."
    ],
    "Mức: Tiêu chuẩn": [
      "难度：标准",
      "Level: Standard"
    ],
    "Mức: Thử thách": [
      "难度：挑战",
      "Level: Challenge"
    ],
    "Mức: Củng cố": [
      "难度：巩固",
      "Level: Reinforcement"
    ],
    "Tiêu chuẩn": [
      "标准",
      "Standard"
    ],
    "Thử thách": [
      "挑战",
      "Challenge"
    ],
    "Củng cố": [
      "巩固",
      "Reinforcement"
    ],
    "⚡ Bắt đầu phiên 5 câu": [
      "⚡ 开始 5 题练习",
      "⚡ Start 5-question session"
    ],
    "BÁO CÁO LỖI CÁ NHÂN": [
      "个人错题报告",
      "PERSONAL ERROR REPORT"
    ],
    "Sai ở đâu, ôn đúng chỗ đó": [
      "精准复习薄弱环节",
      "Review exactly what you missed"
    ],
    "Chưa đủ dữ liệu lỗi. Làm thêm quiz, chính tả hoặc đọc hiểu để web phân tích.": [
      "错题数据不足。请再完成一些测验、听写或阅读练习，以便系统分析。",
      "Not enough error data. Complete more quizzes, dictation or reading exercises."
    ],
    "Khi có dữ liệu sai, hệ thống sẽ đưa ra từ và dạng bài cần ưu tiên.": [
      "产生错题记录后，系统会推荐需要重点复习的词汇和题型。",
      "Once mistakes are recorded, the app will recommend words and exercises to prioritize."
    ],
    "Ba từ cần chú ý:": [
      "三个需要注意的词：",
      "Three words to review:"
    ],
    "Cần ưu tiên trong phiên ôn tiếp theo": [
      "下次复习需要重点关注",
      "Prioritize in the next review"
    ],
    "lỗi": [
      "个错误",
      "errors"
    ],
    "Chính tả": [
      "听写",
      "Dictation"
    ],
    "Đọc hiểu": [
      "阅读理解",
      "Reading comprehension"
    ],
    "Ngữ pháp": [
      "语法",
      "Grammar"
    ],
    "Luyện nói": [
      "口语练习",
      "Speaking practice"
    ],
    "PHIÊN ÔN THÍCH ỨNG": [
      "自适应复习",
      "ADAPTIVE REVIEW"
    ],
    "5 câu theo lỗi cá nhân": [
      "根据错题生成的 5 道题",
      "5 questions based on your mistakes"
    ],
    "Chọn nghĩa chính xác ở mức thử thách.": [
      "在挑战模式下选择正确的释义。",
      "Choose the correct meaning in challenge mode."
    ],
    "Chọn nghĩa phù hợp nhất.": [
      "选择最合适的释义。",
      "Choose the best meaning."
    ],
    "Chính xác.": [
      "回答正确。",
      "Correct."
    ],
    "Xem kết quả →": [
      "查看结果 →",
      "View results →"
    ],
    "Câu tiếp theo →": [
      "下一题 →",
      "Next question →"
    ],
    "Phiên ôn rất ổn": [
      "本次复习表现很好",
      "Great review session"
    ],
    "Đã tìm ra chỗ cần ôn": [
      "已找到需要加强的内容",
      "Areas to review identified"
    ],
    "Kết quả đã được đưa vào hồ sơ học và sẽ ảnh hưởng đến phiên thích ứng tiếp theo.": [
      "结果已保存到学习档案，并会影响下一次自适应练习。",
      "Results are saved to your learning profile and will tailor the next session."
    ],
    "Làm vòng khác": [
      "再练一轮",
      "Try another round"
    ],
    "Hoàn tất": [
      "完成",
      "Finish"
    ],
    "Nghe từng cụm": [
      "分段听读",
      "Listen in chunks"
    ],
    "So sánh câu mẫu và máy nghe được": [
      "对比示例句与识别结果",
      "Compare sample and recognized speech"
    ],
    "Kho HSK bổ trợ ở menu là nơi tra cứu sâu, không phải giáo trình chính. Kết quả tự học được lưu riêng với điểm thi và EXP.": [
      "菜单中的 HSK 补充资源用于深入查阅，并非主课程。自学进度与考试分数和 EXP 分开记录。",
      "The HSK resource library is for deeper reference, not the main curriculum. Self-study progress is stored separately from exam scores and EXP."
    ],
    "Bài này không có danh sách từ mới riêng. Hãy bắt đầu ở phần Nghe & đọc.": [
      "本课没有单独的生词表，请从听读部分开始。",
      "This lesson has no separate word list. Start with listening and reading."
    ],
    "Hãy mở ví dụ trên từng thẻ từ để luyện nghe và đọc.": [
      "请展开单词卡中的例句，练习听力和阅读。",
      "Open examples on each word card to practice listening and reading."
    ],
    "TỪ": [
      "单词",
      "WORD"
    ],
    "Nghe phát âm": [
      "听发音",
      "Listen to pronunciation"
    ],
    "🔊 Nghe phát âm": [
      "🔊 听发音",
      "🔊 Listen to pronunciation"
    ],
    "🔊 Nghe câu": [
      "🔊 听例句",
      "🔊 Listen to sentence"
    ],
    "🔊 Nghe chữ": [
      "🔊 听汉字发音",
      "🔊 Listen to character"
    ],
    "🔊 Nghe": [
      "🔊 听发音",
      "🔊 Listen"
    ],
    "Ví dụ sử dụng": [
      "使用例句",
      "Usage examples"
    ],
    "← Bài trước": [
      "← 上一课",
      "← Previous lesson"
    ],
    "Bài sau": [
      "下一课",
      "Next lesson"
    ],
    "← Từ trước": [
      "← 上一个词",
      "← Previous word"
    ],
    "Từ tiếp": [
      "下一个词",
      "Next word"
    ],
    "Từ tiếp theo": [
      "下一个词",
      "Next word"
    ],
    "Nhớ nghĩa của từ này?": [
      "记住这个词的意思了吗？",
      "Do you remember this word's meaning?"
    ],
    "Học từ mới": [
      "学习生词",
      "Learn new words"
    ],
    "Mục tiêu bài học": [
      "本课目标",
      "Lesson objectives"
    ],
    "Các bước học": [
      "学习步骤",
      "Learning stages"
    ],
    "Cấu trúc đánh giá": [
      "测评结构",
      "Assessment structure"
    ],
    "Nội dung đang kiểm duyệt, chưa mở học.": [
      "内容审核中，暂未开放。",
      "Content under review, not yet available."
    ],
    "Từ mới, ví dụ, nghe đọc và luyện tập.": [
      "生词、例句、听读和练习。",
      "Vocabulary, examples, listening, reading and practice."
    ],
    "Đã hoàn thành": [
      "已完成",
      "Completed"
    ],
    "Từ đã luyện": [
      "已练习词汇",
      "Practiced words"
    ],
    "Ôn từ đến hạn": [
      "复习到期词汇",
      "Review due words"
    ]
  });
  // Regression catalog from Chinese UI screenshot audit: interface chrome, not word meanings.
  Object.assign(strings,{
    "Ôn tập thích ứng": [
      "自适应复习",
      "Adaptive review"
    ],
    "GỌI LẠI": [
      "回忆练习",
      "RECALL"
    ],
    "KIỂM TRA CUỐI": [
      "最终测验",
      "FINAL CHECK"
    ],
    "NHỚ CHỮ HÁN": [
      "记住汉字",
      "RECALL HANZI"
    ],
    "GẶP TỪ MỚI": [
      "认识新词",
      "NEW WORD"
    ],
    "THỨ TỰ NÉT": [
      "笔画顺序",
      "STROKE ORDER"
    ],
    "KHÔNG HỌC TỪ CÔ LẬP": [
      "结合语境学词",
      "LEARN IN CONTEXT"
    ],
    "ĐIỀN TỪ VÀO CÂU ERP": [
      "ERP 句子填空",
      "ERP SENTENCE FILL"
    ],
    "← Quay lại": [
      "← 返回",
      "← Back"
    ],
    "Tiếp": [
      "下一步",
      "Next"
    ],
    "Tao đã xem": [
      "我已看过",
      "I've viewed it"
    ],
    "Gõ chữ Hán": [
      "输入汉字",
      "Type Hanzi"
    ],
    "Kiểm tra": [
      "检查",
      "Check"
    ],
    "Kết quả": [
      "结果",
      "Results"
    ],
    "HOÀN THÀNH PHIÊN": [
      "本次练习已完成",
      "SESSION COMPLETE"
    ],
    "Ôn tập xong!": [
      "复习完成！",
      "Review complete!"
    ],
    "Lượt đúng": [
      "正确次数",
      "Correct answers"
    ],
    "Lượt sai": [
      "错误次数",
      "Incorrect answers"
    ],
    "Từ cần ôn thêm": [
      "需要加强的词汇",
      "Words to review"
    ],
    "Một câu đúng chưa được tính là đã thuộc. Từ yếu đã được hẹn quay lại sớm hơn.": [
      "答对一次不代表完全掌握。薄弱词汇会提前安排复习。",
      "One correct answer does not mean mastery. Weak words will reappear sooner."
    ],
    "Về Hôm nay": [
      "返回今日学习",
      "Back to Today"
    ],
    "Không có từ đến hạn": [
      "暂无到期复习词汇",
      "No words due"
    ],
    "Hôm nay đã xong": [
      "今日学习已完成",
      "Today's learning complete"
    ],
    "VDuckie sẽ đưa từ quay lại đúng lịch. Không cần học dồn.": [
      "VDuckie 会按计划提醒复习，无需集中突击。",
      "VDuckie will schedule each review. No cramming needed."
    ],
    "Đúng. Từ này vẫn sẽ quay lại để nhớ chắc.": [
      "回答正确！这个词以后还会复习，以巩固记忆。",
      "Correct! This word will return to reinforce your memory."
    ],
    "Xem nét mẫu hoặc tự viết theo trên màn hình.": [
      "查看笔画演示，或在屏幕上练习书写。",
      "Watch the stroke demo or practice writing on screen."
    ],
    "▶ Xem viết mẫu": [
      "▶ 查看笔画演示",
      "▶ Stroke demo"
    ],
    "✍ Tự viết": [
      "✍ 自己书写",
      "✍ Practice writing"
    ],
    "♪ Nghe từ": [
      "♪ 听单词",
      "♪ Hear word"
    ],
    "♪ Nghe phát âm": [
      "♪ 听发音",
      "♪ Pronunciation"
    ],
    "♪ Nghe cụm từ": [
      "♪ 听词组",
      "♪ Hear phrase"
    ],
    "Phiên bản này hướng dẫn và cho viết theo; chưa chấm hình dáng chữ tự do.": [
      "当前版本支持笔画演示和跟写，暂不自动评分自由书写的字形。",
      "This version supports stroke guidance but does not grade freehand shapes yet."
    ],
    "TRA CỨU RIÊNG": [
      "独立词汇查询",
      "WORD LOOKUP"
    ],
    "Từ điển Trung – Việt": [
      "中越词典",
      "Chinese–Vietnamese Dictionary"
    ],
    "Tra chữ Hán, pinyin hoặc nghĩa Việt; nghe và lưu thẳng vào Sổ từ.": [
      "可用汉字、拼音或越南语释义搜索；支持朗读并保存到个人生词本。",
      "Search by Hanzi, pinyin, or Vietnamese meaning; listen and save words to your wordbook."
    ],
    "Tìm từ": [
      "搜索词汇",
      "Search words"
    ],
    "Xóa tìm kiếm": [
      "清除搜索",
      "Clear search"
    ],
    "Ví dụ: 领料, lingliao, lĩnh liệu": [
      "例如：领料、lingliao、lĩnh liệu",
      "E.g. 领料, lingliao, lĩnh liệu"
    ],
    "♪ Nghe": [
      "♪ 听发音",
      "♪ Listen"
    ],
    "+ Sổ từ": [
      "+ 生词本",
      "+ Wordbook"
    ],
    "✓ Đã lưu": [
      "✓ 已保存",
      "✓ Saved"
    ],
    "Không tìm thấy từ phù hợp.": [
      "未找到匹配的词汇。",
      "No matching words found."
    ],
    "Thử chữ Hán, pinyin không dấu hoặc nghĩa tiếng Việt khác.": [
      "试试汉字、无声调拼音或其他越南语释义。",
      "Try Hanzi, unaccented pinyin or another Vietnamese meaning."
    ],
    "Chưa có pinyin": [
      "暂无拼音",
      "No pinyin"
    ],
    "Chưa có nghĩa Việt": [
      "暂无越南语释义",
      "No Vietnamese meaning"
    ],
    "HỒ SƠ HỌC TẬP": [
      "学习档案",
      "LEARNING PROFILE"
    ],
    "VDuckie của bạn": [
      "我的 VDuckie",
      "Your VDuckie"
    ],
    "Supabase sync khi đăng nhập": [
      "登录后通过 Supabase 同步",
      "Sync with Supabase when signed in"
    ],
    "PWA dùng chung tiến độ": [
      "PWA 共享学习进度",
      "PWA shares learning progress"
    ],
    "Tiến độ dùng chung khi đăng nhập": [
      "登录后共享学习进度",
      "Progress shared after sign-in"
    ],
    "1 · Từ mới": [
      "1 · 生词",
      "1 · Vocabulary"
    ],
    "2 · Nghe & đọc": [
      "2 · 听读",
      "2 · Listen & read"
    ],
    "3 · Luyện tập": [
      "3 · 练习",
      "3 · Practice"
    ],
    "4 · Kiến thức thêm": [
      "4 · 补充知识",
      "4 · More knowledge"
    ],
    "EXP tuần/tháng dùng để xếp hạng theo kỳ; Level luôn tính từ tổng EXP toàn thời gian.": [
      "每周和每月 EXP 用于周期排行榜；等级始终根据累计 EXP 计算。",
      "Weekly/monthly EXP determines period rankings; level is always based on lifetime EXP."
    ],
    "Nhớ đúng một từ HSK mới: +3 EXP (tối đa 50 từ/ngày) · Viết chính tả: +10 EXP · Hoàn thành bài: +20 EXP · Vượt kiểm tra đủ điều kiện: +15 EXP · Ôn bài: +2 EXP. Chỉ được cộng khi đã đăng nhập; mỗi hoạt động được kiểm tra trùng lặp và giới hạn điểm theo ngày.": [
      "正确记住一个新 HSK 词汇：+3 EXP（每天最多 50 个词）· 听写：+10 EXP · 完成课程：+20 EXP · 通过符合条件的测验：+15 EXP · 复习：+2 EXP。登录后才能获得奖励，每项活动均有重复校验和每日积分上限。",
      "Recall a new HSK word: +3 EXP (up to 50 words/day) · Dictation: +10 · Finish a lesson: +20 · Eligible test: +15 · Review: +2. Sign-in, anti-duplicate checks, and daily limits apply."
    ],
    "Đăng nhập để lưu EXP, nhận thưởng nhiệm vụ và xem hạng của bạn.": [
      "登录以保存 EXP、领取任务奖励并查看自己的排名。",
      "Sign in to save EXP, earn mission rewards and see your rank."
    ],
    "Có hồ sơ người học không đồng nghĩa với đã hoàn thành bài được thưởng EXP. Hãy đăng nhập, hoàn thành một bài HSK rồi kiểm tra lại mục Tổng EXP.": [
      "拥有学习者档案不代表已完成可获得 EXP 的课程。请登录并完成一节 HSK 课程，再查看“总 EXP”。",
      "Having a learner profile does not mean you've earned EXP. Sign in, complete an HSK lesson, then check Total EXP."
    ],
    "Chưa có dữ liệu EXP": [
      "暂无 EXP 数据",
      "No EXP data"
    ],
    "Hãy hoàn thành bài học đầu tiên để xuất hiện ở đây.": [
      "完成第一节课程后即可在这里显示。",
      "Complete your first lesson to appear here."
    ],
    "Chưa có người học": [
      "暂无学习者",
      "No learners yet"
    ],
    "Chưa kết nối Supabase": [
      "尚未连接 Supabase",
      "Supabase not connected"
    ],
    "Không thể tải bảng xếp hạng.": [
      "无法加载排行榜。",
      "Unable to load leaderboard."
    ],
    "Hạng của bạn:": [
      "你的排名：",
      "Your rank:"
    ],
    "tháng này": [
      "本月",
      "this month"
    ],
    "tuần này": [
      "本周",
      "this week"
    ],
    "tổng EXP": [
      "总 EXP",
      "total EXP"
    ],
    "Hạng": [
      "排名",
      "Rank"
    ],
    "Avatar": [
      "头像",
      "Avatar"
    ],
    "Người học": [
      "学习者",
      "Learner"
    ],
    "Bài đầu tiên": [
      "第一课",
      "First lesson"
    ],
    "Bắt đầu lộ trình": [
      "开始学习路线",
      "Start your learning path"
    ],
    "Nhiệm vụ hôm nay": [
      "今日任务",
      "Today's tasks"
    ],
    "Đang ngoại tuyến · tiến độ chưa đồng bộ cloud": [
      "当前离线 · 学习进度尚未同步到云端",
      "Offline · progress not yet synced to cloud"
    ],
    "Định hướng phát âm và chữ Hán": [
      "发音与汉字入门",
      "Introduction to pronunciation and Hanzi"
    ],
    "Số nét:": [
      "笔画数：",
      "Stroke count:"
    ]
  });
  Object.assign(strings,{"Kho đề luyện HSK · 224 đề":["HSK 模拟练习题库 · 224 套","HSK practice bank · 224 papers"],"HSK 1–4 · 56 đề mỗi cấp · 24 câu hỏi có chấm điểm.":["HSK 1–4 · 每级 56 套 · 每套 24 道可评分练习题。","HSK 1–4 · 56 papers per level · 24 scored questions each."],"Mở kho đề HSK →":["打开 HSK 练习题库 →","Open HSK practice bank →"]});
  var rootsSelector="header.top,#studySidebar,.study-center,.study-rail,#leaderboard,#v865HomeSidebar,.v865-home-sidebar,.v865-home-shell,.v865-home-main,#expWeeklyMissions,#expMiniLeaderboard,#expHomeAccount,#v91AccountDropdown,#v91AccountModal,.exp-main-nav,.home-recommended,.home-library-card,#v86PremiumLearning,#v86AdaptiveModal,.v86-listening-tools,.duckie-chat-panel,.free-learning-assistant,#vduckieAssistant,#duckieChat,#v85PersonalDashboard,#v84RetentionCenter,[data-vd-ui-surface]";
  var excludedSelector="#hskLesson,#hskAssessment,.hsk-pro-section,#dailyDictionaryResults,.dictionary-results,.erp-lesson-content,.hsk-focus-examples,.hsk-pro-exercises,.hsk-pro-vocabulary,.duckie-chat-thread,.duckie-chat-messages,#duckieChatMessages,.glossary-results,.flashcard-content";
  var history=new WeakMap(),attrs=new WeakMap(), scheduled=false,menu=null,lang=read(),observer=null;
  function read(){try{var v=root.localStorage.getItem(KEY);return supported[v]?v:"vi";}catch(error){return "vi";}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
  function t(key,next){var index=(next||lang)==="zh"?0:(next||lang)==="en"?1:-1;return index<0||!strings[key]?key:strings[key][index]||key;}
  function translateValue(original){
    var canonical=String(original||"").replace(/\u00a0/g," ").replace(/\s+/g," ").normalize("NFC").trim();
    var direct=t(canonical);
    if(direct!==canonical)return direct;
    var arrow=canonical.match(/^(.+?)(\s*[→↗›])$/);
    if(arrow){var base=arrow[1].trim(),translated=t(base);if(translated!==base)return translated+arrow[2];}
    if(lang!=="vi"){
      var variants=[
        [/^Hạng của bạn:\s*#(\d+)$/i,["你的排名：#$1","Your rank: #$1"]],
        [/^UNIT\s*(\d+)$/i,["单元 $1","UNIT $1"]],
        [/^Checkpoint\s+Unit\s*(\d+)$/i,["单元 $1 阶段测验","Unit $1 checkpoint"]],
        [/^Thứ\s*(\d+)\s*\/\s*(\d+)$/i,["第 $1/$2 项","$1/$2"]],
        [/^Pinyin đúng của\s*([\u3400-\u9fff]+)\s*là gì\?$/i,["$1的正确拼音是什么？","What is the correct pinyin for $1?"]],
        [/^([\u3400-\u9fff]+)\s*nghĩa là gì\?$/i,["$1是什么意思？","What does $1 mean?"]],
        [/^(\d+)\s*kết quả\s*[·•]\s*đang hiện\s*(\d+)\s*kết quả đầu$/i,["找到 $1 条结果 · 显示前 $2 条","$1 results · showing first $2"]],
        [/^(\d+)\s*kết quả$/i,["找到 $1 条结果","$1 results"]],
        [/^(\d+)\s*từ ERP đã thuộc$/i,["已掌握 $1 个 ERP 词汇","$1 ERP words mastered"]],
        [/^(\d+)\s*\/\s*(\d+)\s*bài giáo trình hoàn thành$/i,["已完成 $1/$2 节课程","$1/$2 curriculum lessons completed"]],
        [/^(\d+)\s*\/\s*(\d+)\s*bài giáo trình$/i,["$1/$2 节课程","$1/$2 curriculum lessons"]],
        [/^UNIT\s*(\d+)\s*[·•]\s*BÀI\s*(\d+)\s*\/\s*(\d+)$/i,["单元 $1 · 第 $2/$3 课","UNIT $1 · LESSON $2/$3"]],
        [/^Level\s*(\d+)$/i,["等级 $1","Level $1"]],
        [/^Chưa đúng:\s*([\u3400-\u9fff]+)\s*[·•]\s*(.+)$/i,["还不对：$1 · $2","Not quite: $1 · $2"]],
        [/^(\d+)\s*từ ERP hôm nay$/i,["今日学习 $1 个 ERP 词汇","$1 ERP words today"]],
        [/^Ôn từ đến hạn\s*(\d+)$/i,["复习第 $1 个到期词汇","Review due word $1"]],
        [/^Nhớ đúng một từ HSK mới:/i,["正确记住一个新 HSK 词汇：","Recall one new HSK word:"]],
        [/^TỪ\s*(\d+)\s*\/\s*(\d+)$/i,["单词 $1 / $2","WORD $1 / $2"]],
        [/^Ví dụ sử dụng\s*\((\d+)\)$/i,["使用例句（$1）","Usage examples ($1)"]],
        [/^(\d+)\s*\/\s*(\d+)\s*bài đã hoàn thành\s*[·•]\s*Từ mới, ví dụ, nghe đọc và luyện tập\.$/i,["已完成 $1/$2 课 · 生词、例句、听读和练习。","$1/$2 lessons completed · Vocabulary, examples, listening, reading and practice."]],
        [/^(\d+)\s*\/\s*(\d+)\s*bài đã hoàn thành$/i,["已完成 $1/$2 课","$1/$2 lessons completed"]],
        [/^Độ chính xác\s*(\d+)%$/i,["正确率 $1%","Accuracy $1%"]],
        [/^(\d+)\s*phiên đã làm$/i,["已完成 $1 次练习","$1 sessions completed"]],
        [/^(\d+)\s*bài HSK hoàn thành$/i,["已完成 $1 节 HSK 课程","$1 HSK lessons completed"]],
        [/^(\d+)\s*bài ERP hoàn thành$/i,["已完成 $1 节 ERP 课程","$1 ERP lessons completed"]],
        [/^(\d+)\s*ngày streak hiện tại$/i,["当前连续学习 $1 天","Current streak: $1 days"]],
        [/^Học tiếp HSK\s*([1-9])(?:\s*[→›])?$/i,["继续学习 HSK $1 →","Continue HSK $1 →"]],
        [/^Câu\s*(\d+)\s*\/\s*(\d+)$/i,["第 $1/$2 题","Question $1/$2"]],
        [/^(\d+)\s*điểm$/i,["$1 分","$1 points"]],
        [/^(\d+)\s*lỗi$/i,["$1 个错误","$1 errors"]],
        [/^Chưa đúng\. Đáp án:\s*$/i,["回答有误。正确答案：","Not quite. Answer:"]],
        [/^([+]?\d[\d.,]*)\s+(bài|từ|ngày) đã hoàn thành$/i,["已完成 $1 项","$1 completed"]],
        [/^(\d+)\s*\/\s*(\d+)\s+câu đã kiểm tra$/i,["已检查 $1/$2 题","$1/$2 questions checked"]],
        [/^(\d+)\s+từ cần ôn$/i,["$1 个待复习词汇","$1 words to review"]],
        [/^(\d+)\s+từ đã luyện$/i,["已练习 $1 个词汇","$1 words practiced"]],
        [/^(\d+)\s+bài đã hoàn thành$/i,["已完成 $1 课","$1 lessons completed"]],
        [/^HSK\s*([1-4])\s*[·•]\s*(\d+)\s*\/\s*(\d+)\s*bài$/i,["HSK $1 · 已完成 $2/$3 课","HSK $1 · $2/$3 lessons"]],
        [/^Tiếp tục HSK\s*([1-4])(?:\s*[→›])?$/i,["继续学习 HSK $1 →","Continue HSK $1 →"]],
        [/^Học HSK\s*([1-4])(?:\s*[→›])?$/i,["学习 HSK $1 →","Study HSK $1 →"]],
        [/^CẤP ĐỘ\s*([1-9])$/i,["等级 $1","LEVEL $1"]],
        [/^Còn\s*(\d+)\s*từ cần ôn$/i,["还有 $1 个待复习词汇","$1 words to review"]],
        [/^(\d+)\s*từ đến hạn$/i,["$1 个词已到复习时间","$1 words due"]],
        [/^↻\s*Ôn HSK\s*·\s*(\d+)$/i,["↻ 复习 HSK · $1","↻ Review HSK · $1"]],
        [/^Còn\s*(\d+)\s*câu chưa kiểm tra\.\s*Làm và kiểm tra hết các câu để lưu hoàn thành\.$/i,["还有 $1 题未检查。完成并检查所有题目才能保存进度。","$1 questions remaining. Answer and check all to save completion."]],
        [/^(\d+)\s*\/\s*(\d+)\s*từ$/i,["$1/$2 个词汇","$1/$2 words"]],
        [/^(\d+)\s*\/\s*(\d+)\s*bài$/i,["$1/$2 课","$1/$2 lessons"]],
        [/^(\d+)\s*\/\s*(\d+)\s*câu$/i,["$1/$2 题","$1/$2 questions"]],
        [/^Bài\s*(\d+)$/i,["第 $1 课","Lesson $1"]],
        [/^Câu\s*(\d+)$/i,["第 $1 题","Question $1"]],
        [/^Ôn lại\s*(\d+)\s*từ$/i,["复习 $1 个词汇","Review $1 words"]],
        [/^(\d+)\s*ngày liên tiếp$/i,["连续学习 $1 天","$1-day streak"]],
        [/^(\d+)\s*ngày$/i,["$1 天","$1 days"]],
        [/^(\d+)\s*từ đã nhớ$/i,["已记住 $1 个词","$1 words remembered"]],
        [/^(\d+)\s*từ đang chờ ôn$/i,["$1 个待复习词汇","$1 words pending review"]],
        [/^(\d+)\s*bài HSK đã hoàn thành$/i,["已完成 $1 节 HSK 课程","$1 HSK lessons completed"]],
        [/^(\d+)\s*bài ERP đã hoàn thành$/i,["已完成 $1 节 ERP 课程","$1 ERP lessons completed"]],
        [/^(\d+)\s*từ đã có lịch ôn$/i,["$1 个词已有复习计划","$1 words scheduled for review"]],
        [/^Bạn đã hoàn thành\s*(\d+)\s*bài\.\s*Tiếp tục đúng vị trí đang học hoặc chọn cấp độ khác\.$/i,["你已完成 $1 课。继续上次学习的课程，或选择其他等级。","You have completed $1 lessons. Resume your current lesson or select another level."]],
        [/^Tiến độ MSUTONG cũ được giữ nguyên\s*\((\d+)\s*bài\)\.\s*Nếu cần học lại phần trước, mở riêng giáo trình cũ\.$/i,["旧版 MSUTONG 已保留 $1 课进度。如需复习，请打开旧版课程。","Your $1 previous MSUTONG lessons are preserved. Open the previous curriculum to review them."]],
        [/^↻\s*Ôn từ đến hạn\s*\((\d+)\)$/i,["↻ 复习到期词汇（$1）","↻ Review due words ($1)"]],
        [/^Chọn HSK\s*([1-9])\s*→$/i,["选择 HSK $1 →","Choose HSK $1 →"]],
        [/^Cấp người học\s*(\d+)$/i,["学习者等级 $1","Learner level $1"]],
        [/^Chuỗi hiện tại\s*(\d+)\s*ngày\.$/i,["当前已连续学习 $1 天。","Current streak: $1 days."]],
        [/^Sai\s*(\d+)\s*·\s*đúng\s*(\d+)$/i,["错误 $1 · 正确 $2","Wrong $1 · correct $2"]],
        [/^(\d+)\s*\/\s*(\d+)\s*XP đến cấp tiếp theo$/i,["距离下一等级 $1/$2 XP","$1/$2 XP to the next level"]],
        [/^↻\s*Ôn\s*(\d+)\s*từ HSK đến hạn$/i,["↻ 复习 $1 个到期 HSK 词汇","↻ Review $1 due HSK words"]],
        [/^(\d+)\s*từ$/i,["$1 个词汇","$1 words"]]
      ];
      for(var n=0;n<variants.length;n++)if(variants[n][0].test(canonical)){
        return canonical.replace(variants[n][0],variants[n][1][lang==="zh"?0:1]);
      }
    }
    return original;
  }
  function permittedProtected(element){
    return !!(element&&element.closest&&element.closest(".graded-hsk-page,.v85-personal,.v84-retention,.v83-cockpit,.hsk-study-progress,.hsk-study-finish,.hsk-study-review-drawer,.hsk-focus-intro,.dictionary-meta>span,.hsk-pro-lesson-head .step,.hsk-focus-section-head>span,.hsk-focus-word-title>span,.hsk-focus-quiz>strong,.hsk-focus-quiz>[data-focus-quiz-feedback],.v86-listening-top>strong,.v86-speaking-diff>strong,button,a,label,summary,h1,h2,h3,h4,header,nav,[role='button'],[role='tab'],[role='menuitem'],[data-vd-i18n-key]"));
  }
  function isProtected(element){
    if(!element||!element.closest)return true;
    if(element.closest("script,style,noscript,textarea,option,[contenteditable='true'],.vd-i18n-slot,.vd-i18n-guest"))return true;
    // Never localize Vietnamese glosses, learner answers or Chinese examples, even inside UI-permitted elements.
    if(element.closest(".hsk-focus-example,.hsk-focus-meaning,[data-focus-quiz-choices],.hsk-pro-note,.v86-option,.duckie-chat-messages,.daily-options,.dictionary-word,.dictionary-meta small,.dictionary-example,.focus-word>p,.focus-word>small,.context-focus>p,.question-focus>p,.hsk-pro-lesson-head h3 small"))return true;
    // The practice runtime directly localizes chrome; never change quiz answers or shown HSK words.
    if(element.closest(".hsk-practice-container"))return true;
    return !!(element.closest(excludedSelector)&&!permittedProtected(element));
  }
  function translateText(node){
    if(!node||!node.parentElement||isProtected(node.parentElement))return;
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
    if(isProtected(element))return;
    var prev=attrs.get(element)||{};
    ["placeholder","aria-label","aria-description","title","alt"].forEach(function(attr){
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
    var label=menu.querySelector("[data-vd-lang-title]"),current=menu.querySelector("[data-vd-lang-current]");
    var translated=t("Ngôn ngữ"),shortLabel=lang==="zh"?"中文":lang.toUpperCase();
    if(label.textContent!==translated)label.textContent=translated;
    if(current.textContent!==shortLabel)current.textContent=shortLabel;
    var note=menu.querySelector(".vd-i18n-note"),noteText=t("Giáo trình hiện chủ yếu bằng tiếng Việt.");
    note.hidden=lang==="vi";
    if(!note.hidden&&note.textContent!==noteText)note.textContent=noteText;
    menu.querySelectorAll("[data-vd-ui-lang]").forEach(function(b){var selected=b.getAttribute("data-vd-ui-lang")===lang;b.classList.toggle("is-selected",selected);b.setAttribute("aria-pressed",selected?"true":"false");});
  }
  function ensureGuest(){
    var top=doc.querySelector("header.top .top-actions");if(!top)return;
    var wrap=doc.getElementById("vdUiLanguageGuest");
    if(!wrap){
      wrap=doc.createElement("div");wrap.id="vdUiLanguageGuest";wrap.className="vd-i18n-guest";
      wrap.innerHTML='<button type="button" class="vd-i18n-guest-trigger" aria-label="Chọn ngôn ngữ giao diện" aria-expanded="false" aria-controls="vdGuestLanguageChoices">🌐 VI</button>'+
        '<div class="vd-i18n-guest-choices" id="vdGuestLanguageChoices" role="group" aria-label="Chọn ngôn ngữ giao diện" hidden>'+
        '<button type="button" data-vd-guest-lang="vi">🇻🇳 Tiếng Việt</button>'+
        '<button type="button" data-vd-guest-lang="zh">🇨🇳 简体中文</button>'+
        '<button type="button" data-vd-guest-lang="en">🇬🇧 English</button></div>';
      wrap.querySelector(".vd-i18n-guest-trigger").addEventListener("click",function(){
        var list=wrap.querySelector(".vd-i18n-guest-choices"),opened=list.hidden;
        list.hidden=!opened;this.setAttribute("aria-expanded",opened?"true":"false");
      });
      wrap.querySelectorAll("[data-vd-guest-lang]").forEach(function(button){
        button.addEventListener("click",function(){
          setLanguage(button.getAttribute("data-vd-guest-lang"));
          wrap.querySelector(".vd-i18n-guest-choices").hidden=true;
          wrap.querySelector(".vd-i18n-guest-trigger").setAttribute("aria-expanded","false");
        });
      });
    }
    if(wrap.parentNode!==top)top.insertBefore(wrap,top.firstChild);
    var accountTrigger=doc.querySelector(".v91-account-trigger");
    var shouldShow=!accountTrigger||accountTrigger.hidden;
    if(wrap.hidden===shouldShow)wrap.hidden=!shouldShow;
    var current=lang==="zh"?"中文":lang.toUpperCase(),text="🌐 "+current;
    var button=wrap.querySelector(".vd-i18n-guest-trigger");
    if(button.textContent!==text)button.textContent=text;
    wrap.querySelectorAll("[data-vd-guest-lang]").forEach(function(option){
      var selected=option.getAttribute("data-vd-guest-lang")===lang;
      option.classList.toggle("is-selected",selected);
      option.setAttribute("aria-pressed",selected?"true":"false");
    });
  }
  function translatePinned(){
    doc.querySelectorAll("[data-vd-i18n-key]").forEach(function(element){
      var key=element.getAttribute("data-vd-i18n-key"),wanted=t(key);
      if(!strings[key])return;
      if(element.textContent!==wanted)element.textContent=wanted;
    });
  }
  function apply(){
    if(!doc.body)return;
    // Treat one translation pass as an atomic DOM operation. Our own text updates
    // must not trigger a second observer pass or repeatedly repaint the UI.
    if(observer)observer.disconnect();
    try{
      doc.documentElement.lang=lang==="zh"?"zh-CN":lang;
    ensureMenu();
    ensureGuest();
    var roots=doc.querySelectorAll(rootsSelector);
    for(var i=0;i<roots.length;i++){
      var nested=false;
      for(var j=0;j<i;j++)if(roots[j]&&typeof roots[j].contains==="function"&&roots[j].contains(roots[i])){nested=true;break;}
      if(!nested)translateRoot(roots[i]);
    }
    // Interactive controls can exist on screens outside the homepage.
    var controls=doc.querySelectorAll("button,[role='tab'],[role='menuitem']");
    for(var j=0;j<controls.length;j++){
      if(controls[j].closest(excludedSelector))continue;
      if(controls[j].closest(rootsSelector))continue;
      translateRoot(controls[j]);
    }
      translatePinned();
      ensureMenu();
    }finally{
      if(observer)observer.observe(doc.body,{childList:true,subtree:true,characterData:true});
    }
  }
  // MutationObserver runs before the next browser paint. Translate in a microtask
  // instead of waiting 85ms, when the Vietnamese source text was briefly visible.
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    var run=function(){scheduled=false;apply();};
    if(typeof root.queueMicrotask==="function")root.queueMicrotask(run);
    else Promise.resolve().then(run);
  }
  function localizeSubtree(element){
    // Detached cards are translated before attachment, so rerenders never flash VI.
    if(element)translateRoot(element);
  }
  function setLanguage(next){
    if(!supported[next])return false;
    if(next!==lang){lang=next;try{root.localStorage.setItem(KEY,lang);}catch(error){}
      doc.dispatchEvent(new CustomEvent("vduckie:language-change",{detail:{language:lang}}));
    }
    apply();return true;
  }
  function start(){
    apply();
    ["vduckie:exp-session","vduckie:my-exp-loaded","vduckie:exp-updated"].forEach(function(event){
      doc.addEventListener(event,schedule);
    });
    doc.addEventListener("click",function(event){
      var guest=doc.getElementById("vdUiLanguageGuest");
      if(guest&&!guest.contains(event.target)){
        var menu=guest.querySelector(".vd-i18n-guest-choices");
        if(menu&&!menu.hidden){
          menu.hidden=true;guest.querySelector(".vd-i18n-guest-trigger").setAttribute("aria-expanded","false");
        }
      }
    });
    if(root.MutationObserver){
      observer=new root.MutationObserver(function(changes){
        for(var i=0;i<changes.length;i++){
          if(changes[i].type==="childList"||changes[i].type==="characterData"){schedule();break;}
        }
      });
      observer.observe(doc.body,{childList:true,subtree:true,characterData:true});
    }
  }
  root.VDuckieInterfaceI18n=Object.freeze({getLanguage:function(){return lang;},setLanguage:setLanguage,t:t,translateUI:translateValue,localizeSubtree:localizeSubtree,refresh:apply});
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
