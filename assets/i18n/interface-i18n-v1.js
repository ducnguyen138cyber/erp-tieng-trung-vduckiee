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
  var rootsSelector="header.top,#studySidebar,.study-center,.study-rail,#leaderboard,#v865HomeSidebar,.v865-home-sidebar,.v865-home-shell,.v865-home-main,#expWeeklyMissions,#expMiniLeaderboard,#expHomeAccount,#v91AccountDropdown,#v91AccountModal,.exp-main-nav,.home-recommended,.home-library-card,.duckie-chat-panel,.free-learning-assistant,[data-vd-ui-surface]";
  var excludedSelector="#hskLesson,#hskAssessment,.hsk-pro-section,#dailyLearningPanel,#dailyDictionaryResults,.dictionary-results,.erp-lesson-content,.hsk-focus-examples,.hsk-pro-exercises,.hsk-pro-vocabulary,.duckie-chat-thread,.duckie-chat-messages,#duckieChatMessages,.glossary-results,.flashcard-content";
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
        [/^↻\s*Ôn HSK\s*·\s*(\d+)$/i,["↻ 复习 HSK · $1","↻ Review HSK · $1"]]
      ];
      for(var n=0;n<variants.length;n++)if(variants[n][0].test(canonical)){
        return canonical.replace(variants[n][0],variants[n][1][lang==="zh"?0:1]);
      }
    }
    return original;
  }
  function permittedProtected(element){
    return !!(element&&element.closest&&element.closest(".graded-hsk-page,.hsk-study-progress,.hsk-study-finish,.hsk-study-review-drawer,button,[role='tab'],[role='menuitem'],[data-vd-i18n-key]"));
  }
  function isProtected(element){
    if(!element||!element.closest)return true;
    if(element.closest("script,style,noscript,textarea,option,[contenteditable='true'],.vd-i18n-slot,.vd-i18n-guest"))return true;
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
    doc.documentElement.lang=lang==="zh"?"zh-CN":lang;
    ensureMenu();
    ensureGuest();
    var roots=doc.querySelectorAll(rootsSelector);
    for(var i=0;i<roots.length;i++)translateRoot(roots[i]);
    // Interactive controls can exist on screens outside the homepage.
    var controls=doc.querySelectorAll("button,[role='tab'],[role='menuitem']");
    for(var j=0;j<controls.length;j++){
      if(controls[j].closest(excludedSelector))continue;
      if(controls[j].closest(rootsSelector))continue;
      translateRoot(controls[j]);
    }
    translatePinned();
    ensureMenu();
  }
  function schedule(){if(scheduled)return;scheduled=true;var done=function(){scheduled=false;apply();};if(root.requestAnimationFrame)root.requestAnimationFrame(done);else root.setTimeout(done,32);}
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
  root.VDuckieInterfaceI18n=Object.freeze({getLanguage:function(){return lang;},setLanguage:setLanguage,t:t,refresh:apply});
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
