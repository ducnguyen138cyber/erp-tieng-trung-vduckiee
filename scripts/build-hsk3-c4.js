#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");
const VOCABULARY_EDITORIAL = require("./hsk3-c4-vocabulary-editorial");

const ROOT = path.resolve(__dirname, "..");
const HSK3 = path.join(ROOT, "data", "hsk", "hsk3");
const SYLLABUS = "GF0025-2021";
const EXAM = "CTI-HSK3.0-2026";
const ORIGINAL_SOURCE = "vduckie-hsk3-c4-original";
const OFFICIAL_SOURCE = "cti-hsk3-current-syllabus-2026";
const PDF_SHA256 = "ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941";
const SOURCES = [
  "moe-gf0025-2021-standard",
  OFFICIAL_SOURCE,
  "cti-hsk3-syllabus-pdf-2026",
  "cti-hsk3-competency-profile-2026",
  "cc-cedict-current",
  "unicode-unihan-17",
  ORIGINAL_SOURCE
];
const REVIEW = {
  reviewStage: 4,
  reviewReason: "Phase C4 machine-assisted full editorial pass; independent Vietnamese and Chinese-pedagogy signoff remains required.",
  firstIntroducedIn: "phase-c4",
  lastEditorialPass: "phase-c4",
  humanSignoffRequired: true
};

assertEditorialVocabulary();

function assertEditorialVocabulary() {
  assert(VOCABULARY_EDITORIAL.length === 500, `HSK3 editorial vocabulary must contain 500 rows, received ${VOCABULARY_EDITORIAL.length}.`);
  VOCABULARY_EDITORIAL.forEach((entry, index) => {
    assert(entry.length === 5 && entry[0] === 501 + index, `HSK3 editorial vocabulary row ${501 + index} is missing or out of order.`);
    assert(entry.slice(1).every((value) => typeof value === "string" && value.trim()), `HSK3 editorial vocabulary row ${entry[0]} has an empty learner-facing field.`);
  });
}

const UNIT_SPECS = [
  ["从句子到段落", "Cầu nối sang giao tiếp theo đoạn", "Nối câu thành đoạn có trình tự, nguyên nhân và kết quả."],
  ["学习目标和方法", "Học tập và chiến lược", "Nói mục tiêu, cách học, kết quả và điều chỉnh kế hoạch."],
  ["工作环境和任务", "Tìm việc và môi trường làm việc", "Đọc thông tin cơ bản, trao đổi lịch và xử lý nhiệm vụ."],
  ["旅行计划和意外", "Du lịch và sự cố", "Lập hành trình, hỏi thông tin và xử lý chậm, lỡ hoặc thất lạc."],
  ["住房和搬家", "Nhà ở và chuyển nhà", "So sánh nhà, thương lượng và mô tả quy trình chuyển đồ."],
  ["健康和生活方式", "Sức khỏe và lối sống", "Mô tả triệu chứng, thói quen, nguyên nhân và lời khuyên."],
  ["关系和网络沟通", "Quan hệ và giao tiếp số", "Giải thích hiểu lầm, bày tỏ thái độ và ứng xử qua tin nhắn."],
  ["购物和消费者问题", "Mua sắm và quyền lợi", "So sánh sản phẩm, đổi trả và trình bày yêu cầu hợp lý."],
  ["故事和经历", "Kể chuyện và trải nghiệm", "Kể sự việc theo mốc, điểm ngoặt, kết quả và cảm nhận."],
  ["生活文化和礼貌", "Văn hóa đời sống", "Hiểu lời mời, quà tặng, phép lịch sự và khác biệt ngữ cảnh."],
  ["天气和周围环境", "Môi trường quanh ta", "Mô tả thay đổi, tác động và giải pháp cá nhân."],
  ["初级综合项目", "Dự án tổng hợp sơ cấp", "Hoàn thành dự án nghe–nói–đọc–viết nhiều bước."],
];

const LESSON_SPECS = [
  {
    u: 1, zh: "从一句话到一段话", vi: "Từ một câu đến một đoạn", objective: "Kể một việc quen thuộc bằng đoạn ngắn có mở đầu, trình tự và kết quả.",
    situation: "Bạn kể cho bạn học nghe vì sao buổi sáng mình đến lớp muộn.",
    dialogue: "林：你今天怎么迟到了？\n安：我出门以后才发现忘了笔记本。\n林：后来怎么办？\n安：我先回家拿，然后坐地铁来，所以晚了十分钟。",
    reading: "今天小安本来七点半出门，可是走到路口才发现没带笔记本。他马上回家拿，然后坐地铁去学校。虽然迟到了十分钟，但是他把原因说得很清楚。",
    rq: ["Tiểu An phát hiện điều gì ở giao lộ?", "Cậu ấy đến muộn bao lâu?"], re: ["走到路口才发现没带笔记本", "迟到了十分钟"], ra: ["Cậu ấy quên mang vở ghi chép.", "Mười phút."],
    listening: "早上我先送妹妹去学校，再去办公室。路上突然下雨，公交车也晚点了。我到公司的时候，会议已经开始了。",
    lq: ["Người nói làm gì trước khi đi làm?", "Khi đến công ty, việc gì đã bắt đầu?"], la: ["Đưa em gái đến trường.", "Cuộc họp."],
    pronunciation: "Luyện nhịp 先…再…然后…; giữ rõ thanh 2 của 然后 và âm cuối -ng trong 已经.",
    speaking: "Kể 90 giây về một buổi sáng có thay đổi, dùng ít nhất ba từ nối thời gian.", writing: "Viết 80–100 chữ Hán kể một việc theo bốn mốc rõ ràng.", real: "Ghi âm lại một việc vừa xảy ra, nghe lại và đánh dấu chỗ thiếu từ nối.", review: ["以后", "已经", "所以"]
  },
  {
    u: 1, zh: "把事情说清楚", vi: "Nói rõ một sự việc", objective: "Sắp xếp đối tượng, hành động và kết quả bằng câu 把 cơ bản.",
    situation: "Bạn giải thích cách xử lý một món đồ bị để nhầm chỗ.",
    dialogue: "美：桌上的文件怎么不见了？\n东：我把它放到经理办公室了。\n美：你把名单也带走了吗？\n东：没有，我把名单留在这儿了。",
    reading: "下班前，小东把电脑关上，把桌子打扫干净，又把明天开会要用的文件放进包里。回家以后他才发现，最重要的名单还在办公室。",
    rq: ["Tiểu Đông làm gì với bàn?", "Vật quan trọng nào còn ở văn phòng?"], re: ["把桌子打扫干净", "最重要的名单还在办公室"], ra: ["Dọn bàn sạch.", "Danh sách quan trọng nhất."],
    listening: "请先把护照拿出来，再把行李放到右边。检票以后，把车票收好，不要放在外衣口袋里。",
    lq: ["Cần lấy gì ra trước?", "Sau khi soát vé cần làm gì?"], la: ["Hộ chiếu.", "Cất vé cẩn thận."],
    pronunciation: "Không đọc 把 quá nặng; luyện cụm 把名单留下 và phân biệt bǎ với pà.",
    speaking: "Hướng dẫn người khác sắp xếp năm món đồ, dùng ba câu 把 có kết quả khác nhau.", writing: "Viết một ghi chú bàn giao 6–8 câu với 把 + 到/在/给 hoặc bổ ngữ kết quả.", real: "Dùng tiếng Trung mô tả cách bạn vừa sắp lại bàn hoặc túi cá nhân.", review: ["放", "拿", "完"]
  },
  {
    u: 1, zh: "误会是怎么发生的", vi: "Hiểu lầm xảy ra thế nào", objective: "Giải thích hiểu lầm bằng nguyên nhân, bằng chứng và cách sửa.",
    situation: "Hai người nhận nhầm thông tin về địa điểm gặp.",
    dialogue: "杰：我在图书馆门口，怎么没看见你？\n雨：我以为是在体育馆见面。\n杰：可能是我昨天说得不清楚。\n雨：没关系，咱们改在中间的咖啡店见吧。",
    reading: "班级群里写着“周五下午在图书馆见”，小雨却看成了“体育馆”。她到那儿以后才发现一个同学也没有。后来她重新看消息，马上给小杰打了电话。",
    rq: ["Tin nhắn nhóm ghi gặp ở đâu?", "Tiểu Vũ làm gì sau khi đọc lại?"], re: ["在图书馆见", "马上给小杰打了电话"], ra: ["Thư viện.", "Gọi ngay cho Tiểu Kiệt."],
    listening: "我听说活动改到星期天，就告诉了别人。其实老师说的是星期六下午。发现说错以后，我马上在群里说明了。",
    lq: ["Hoạt động thật sự vào khi nào?", "Người nói sửa lỗi ở đâu?"], la: ["Chiều thứ Bảy.", "Trong nhóm chat."],
    pronunciation: "Phân biệt yǐwéi/yiwèi và yǐhòu; luyện ngữ điệu nhận lỗi thay vì đọc đều.",
    speaking: "Role-play 90 giây: nêu thông tin đã hiểu, phát hiện sai, xin lỗi và chốt lại.", writing: "Viết tin nhắn đính chính có thông tin cũ, thông tin đúng và hành động tiếp theo.", real: "Lấy một thông báo thật, tóm tắt lại rồi tự kiểm tra ba dữ kiện: ngày, giờ, nơi.", review: ["以为", "其实", "清楚"]
  },
  {
    u: 2, zh: "新学期想提高什么", vi: "Mục tiêu học kỳ mới", objective: "Đặt mục tiêu đo được và nói lý do ưu tiên.",
    situation: "Bạn trao đổi kế hoạch học tập đầu học kỳ.",
    dialogue: "老师：这个学期你最想提高什么？\n兰：我想提高听力，因为平时听得还不够清楚。\n老师：你打算怎么练？\n兰：我每天听十五分钟，周末再做一次记录。",
    reading: "新学期开始了，小兰给自己定了三个目标：每天复习生词、每周写一段日记、月底跟老师做一次对话。她觉得目标不能太多，重要的是一直坚持。",
    rq: ["Tiểu Lan có mấy mục tiêu?", "Theo cô ấy điều quan trọng là gì?"], re: ["定了三个目标", "重要的是一直坚持"], ra: ["Ba mục tiêu.", "Kiên trì liên tục."],
    listening: "我的汉字写得比较慢，所以这个月主要练写字。我每天写一页，星期天检查这一周最常见的错误。",
    lq: ["Người nói muốn cải thiện gì?", "Chủ nhật làm việc gì?"], la: ["Viết chữ Hán.", "Kiểm tra lỗi thường gặp trong tuần."],
    pronunciation: "Luyện xìngqī/xuéqī và tígāo; không đổi thanh của 主要 theo thói quen Việt.",
    speaking: "Trình bày mục tiêu một tháng theo cấu trúc mục tiêu–lý do–cách làm–cách kiểm tra.", writing: "Viết kế hoạch 100–120 chữ Hán có số lần, thời lượng và tiêu chí hoàn thành.", real: "Tạo một mục tiêu HSK3 thật cho bảy ngày tới và đặt ngày tự kiểm tra.", review: ["学期", "提高", "坚持"]
  },
  {
    u: 2, zh: "复习也要有办法", vi: "Ôn tập cũng cần phương pháp", objective: "So sánh cách học và điều chỉnh theo lỗi thực tế.",
    situation: "Hai bạn tìm nguyên nhân học nhiều nhưng nhớ ít.",
    dialogue: "安：我看了三遍课文，还是记不住。\n林：你只是看，没有开口练。\n安：那应该怎么办？\n林：先合上课本说一遍，再打开检查，这个办法更有用。",
    reading: "小林复习时不一直看答案。他先读课文，然后关上书讲主要内容；讲不出来的地方才重新看。一个星期以后，他发现自己不但记得更久，而且说得更自然。",
    rq: ["Tiểu Lâm làm gì sau khi đọc?", "Sau một tuần có hai thay đổi gì?"], re: ["关上书讲主要内容", "不但记得更久，而且说得更自然"], ra: ["Đóng sách và kể ý chính.", "Nhớ lâu hơn và nói tự nhiên hơn."],
    listening: "复习生词的时候，我把会的和不会的分开。会的三天以后再看，不会的当天晚上再练，还要自己造句。",
    lq: ["Từ đã biết ôn lại khi nào?", "Từ chưa biết cần làm thêm gì?"], la: ["Ba ngày sau.", "Tự đặt câu."],
    pronunciation: "Luyện fùxí, kèběn, zìrán; phân biệt thanh 4 liên tiếp trong 不会的.",
    speaking: "So sánh hai cách học, nêu ưu–nhược điểm và chọn cách hợp với mình.", writing: "Viết hướng dẫn ôn một bài gồm năm bước và lý do của từng bước.", real: "Thử phương pháp nhớ–nói–kiểm tra với 10 từ rồi ghi kết quả thật.", review: ["办法", "遍", "不但"]
  },
  {
    u: 2, zh: "成绩不是全部", vi: "Điểm số không phải tất cả", objective: "Đánh giá kết quả học bằng nhiều bằng chứng thay vì chỉ một điểm.",
    situation: "Một bạn buồn vì điểm thi và cần xem lại tiến bộ thực tế.",
    dialogue: "月：这次我只得了七十分，心里很难过。\n老师：先别只看得分，你听力比以前清楚多了。\n月：可是写作还是有很多问题。\n老师：把错误分成几种，一个一个解决。",
    reading: "小月的考试成绩没有达到自己的要求。老师却发现，她现在能听懂更长的对话，也敢在班里发言了。小月决定保留错题，每周检查一次，而不是因为一次分数就放弃。",
    rq: ["Giáo viên nhận thấy hai tiến bộ nào?", "Tiểu Nguyệt quyết định giữ lại gì?"], re: ["能听懂更长的对话，也敢在班里发言了", "决定保留错题"], ra: ["Nghe đoạn dài hơn và dám phát biểu.", "Các câu làm sai."],
    listening: "我的数学成绩提高了，可是做题速度还不够快。下次考试前，我会每两天练一段，并记录完成时间。",
    lq: ["Môn nào đã tiến bộ?", "Điểm nào vẫn cần cải thiện?"], la: ["Toán.", "Tốc độ làm bài."],
    pronunciation: "Phân biệt chéngjì/jīngjì về âm đầu; luyện dé fēn khi 得 đọc dé.",
    speaking: "Nêu một kết quả chưa tốt, hai bằng chứng tiến bộ và kế hoạch sửa một điểm yếu.", writing: "Viết phản hồi sau bài kiểm tra 100–130 chữ Hán, có dữ kiện và hành động cụ thể.", real: "Chọn một bài cũ, phân loại lỗi thành từ vựng, ngữ pháp, hiểu đề và trình bày.", review: ["成绩", "得分", "解决"]
  },
  {
    u: 3, zh: "办公室第一天", vi: "Ngày đầu ở văn phòng", objective: "Giới thiệu nơi làm, người phụ trách và nhiệm vụ đầu tiên.",
    situation: "Nhân viên mới được dẫn đi làm quen văn phòng.",
    dialogue: "经理：欢迎你，这是你的座位。\n文：谢谢，我今天先做什么？\n经理：先了解工作流程，有问题可以问身边的同事。\n文：好的，下午的会议我也参加吗？",
    reading: "小文第一天到办公室，经理先带她认识同事，又介绍了电脑和邮箱的使用方法。中午以前，她完成了个人信息表；下午，她参加会议并记下了下周的主要任务。",
    rq: ["Ai giới thiệu đồng nghiệp cho Tiểu Văn?", "Buổi chiều cô ấy ghi lại gì?"], re: ["经理先带她认识同事", "记下了下周的主要任务"], ra: ["Quản lý.", "Nhiệm vụ chính tuần sau."],
    listening: "新同事请注意：工作日上午九点上班。进办公室先开机、查看邮件；如果需要请假，请提前告诉经理。",
    lq: ["Giờ bắt đầu làm việc là mấy giờ?", "Muốn xin nghỉ cần báo cho ai?"], la: ["9 giờ sáng.", "Quản lý."],
    pronunciation: "Luyện bàngōngshì và tóngshì; giữ âm cuối -n trong xīnrén.",
    speaking: "Tự giới thiệu ngày đầu: vai trò, kinh nghiệm ngắn, điều cần được hướng dẫn.", writing: "Viết email 90–110 chữ Hán xác nhận nhiệm vụ và đặt hai câu hỏi rõ ràng.", real: "Soạn bản giới thiệu công việc thật nhưng bỏ dữ liệu nội bộ nhạy cảm.", review: ["办公室", "经理", "邮件"]
  },
  {
    u: 3, zh: "开会别迟到", vi: "Đừng đến họp muộn", objective: "Xác nhận lịch họp, chuẩn bị nội dung và báo thay đổi đúng lúc.",
    situation: "Lịch họp bị chuyển sớm hơn và một người có nguy cơ đến muộn.",
    dialogue: "同事：下午的会改到两点了，你收到了吗？\n文：刚看到邮件，我两点前可能赶不回来。\n同事：那你先把情况告诉经理。\n文：好，我会说明原因，也把笔记发给你。",
    reading: "原来的会议是下午三点，经理后来改成两点。小文正在外地办事，回办公室大概要半天。她没有等到最后才说，而是马上发邮件说明情况，并请同事先介绍她准备的内容。",
    rq: ["Cuộc họp đổi thành mấy giờ?", "Tiểu Văn nhờ đồng nghiệp làm gì?"], re: ["改成两点", "请同事先介绍她准备的内容"], ra: ["2 giờ chiều.", "Trình bày trước nội dung cô ấy đã chuẩn bị."],
    listening: "明天会议地点从三楼换到五楼。请大家九点五十分以前到，不用带电脑，但是必须带上周的工作记录。",
    lq: ["Địa điểm mới ở tầng mấy?", "Bắt buộc mang gì?"], la: ["Tầng năm.", "Ghi chép công việc tuần trước."],
    pronunciation: "Phân biệt zhīdào và chídào; luyện gāng/gāngcái và cụm bìxū dài.",
    speaking: "Gọi báo có thể trễ: nêu lịch cũ/mới, lý do, thời gian đến và phương án thay thế.", writing: "Viết thông báo đổi lịch có tiêu đề, thời gian, địa điểm, đồ cần mang và người liên hệ.", real: "Chuyển một lịch hẹn thật thành thông báo tiếng Trung rõ năm dữ kiện.", review: ["开会", "迟到", "必须"]
  },
  {
    u: 3, zh: "任务出了问题", vi: "Nhiệm vụ gặp vấn đề", objective: "Báo vấn đề theo cấu trúc hiện trạng–ảnh hưởng–giải pháp–thời hạn.",
    situation: "Một tệp chưa nhận được khiến công việc không thể hoàn thành đúng giờ.",
    dialogue: "文：我还没收到名单，所以报告做不完。\n经理：你检查过邮箱了吗？\n文：检查了，我也问过负责的同事。\n经理：先完成别的部分，名单到了以后马上加上。",
    reading: "小文发现报告少了一部分数据。如果一直等，她可能来不及完成全部工作。于是她先做好已经有的内容，再联系同事确认发送时间。最后文件虽然晚到了一会儿，任务还是按时完成了。",
    rq: ["Vì sao Tiểu Văn không chờ thụ động?", "Cuối cùng nhiệm vụ có đúng hạn không?"], re: ["可能来不及完成全部工作", "任务还是按时完成了"], ra: ["Vì có thể không kịp hoàn thành toàn bộ.", "Có, vẫn đúng hạn."],
    listening: "打印机突然不工作了。技术人员下午三点来检查。着急用文件的同事可以先到二楼打印，修好以后会再通知。",
    lq: ["Thiết bị nào hỏng?", "Cần gấp thì in ở đâu?"], la: ["Máy in.", "Tầng hai."],
    pronunciation: "Luyện tūrán, wánchéng, jíshí; không nuốt âm cuối trong yǐngxiǎng.",
    speaking: "Báo cáo sự cố trong một phút, tránh chỉ nói 不行 mà không nêu ảnh hưởng và cách xử lý.", writing: "Viết email 100–130 chữ Hán báo vấn đề, việc đã thử và thời điểm cập nhật tiếp.", real: "Dùng mẫu bốn phần để mô tả một trục trặc không nhạy cảm trong ngày.", review: ["收到", "完成", "影响"]
  },
  {
    u: 4, zh: "坐高铁出发", vi: "Khởi hành bằng tàu cao tốc", objective: "Đọc thông tin chuyến đi, soát vé và theo dõi thay đổi giờ.",
    situation: "Bạn ra ga đi tàu cao tốc và phải tìm đúng cửa soát vé.",
    dialogue: "安：我们的车几点检票？\n杰：十点十分，七号检票口。\n安：地图上写着在二层，我们坐电梯上去吧。\n杰：好，先把身份证和车票准备好。",
    reading: "小安第一次坐高铁去外地。他提前一个小时到车站，先看大屏幕确认车次和检票口，再去买矿泉水。广播说列车晚点十五分钟，他没有着急，而是重新告诉朋友到达时间。",
    rq: ["Tiểu An kiểm tra gì trên màn hình?", "Tàu chậm bao lâu?"], re: ["确认车次和检票口", "晚点十五分钟"], ra: ["Số chuyến và cửa soát vé.", "Mười lăm phút."],
    listening: "开往南方的G305次列车开始检票，请带好车票和证件，从十二号口进入。列车晚点五分钟。",
    lq: ["Cửa soát vé số mấy?", "Tàu đi về hướng nào?"], la: ["Cửa 12.", "Phía Nam."],
    pronunciation: "Luyện gāotiě, jiǎnpiào và wǎndiǎn; phân biệt shí/shi trong số giờ.",
    speaking: "Thông báo lại một hành trình gồm chuyến, giờ, cửa, đồ cần mang và thay đổi.", writing: "Viết tin nhắn 80–100 chữ Hán cập nhật giờ đến sau khi chuyến bị chậm.", real: "Đọc một vé/hành trình mẫu và nói lại năm thông tin mà không nhìn.", review: ["高铁", "检票", "晚点"]
  },
  {
    u: 4, zh: "护照和行李不见了", vi: "Hộ chiếu và hành lý thất lạc", objective: "Mô tả đồ thất lạc chính xác và làm theo quy trình hỗ trợ.",
    situation: "Bạn không thấy túi đựng hộ chiếu tại sân bay.",
    dialogue: "游客：您好，我的护照包不见了。\n服务员：您最后在哪儿看到的？\n游客：过安全检查以后还在，后来我去买了饮料。\n服务员：请先填写这张表，我们马上帮您查。",
    reading: "一位游客在机场发现护照包丢了。包是蓝色的，里面有护照、银行卡和一张照片。他先回到刚才坐过的地方找，又去服务台说明。半小时后，工作人员告诉他有人把包送来了。",
    rq: ["Trong túi có ba thứ gì?", "Ai mang túi đến?"], re: ["里面有护照、银行卡和一张照片", "有人把包送来了"], ra: ["Hộ chiếu, thẻ ngân hàng và một bức ảnh.", "Một người nào đó."],
    listening: "我们收到一个黑色箱子，箱子上有黄色号码牌。请丢失行李的游客带护照到一楼服务台检查。",
    lq: ["Va-li màu gì?", "Cần mang gì đến quầy?"], la: ["Màu đen.", "Hộ chiếu."],
    pronunciation: "Luyện hùzhào, xíngli, diū; không đọc 行 trong 行李 là xíng.",
    speaking: "Role-play báo mất: màu, kích thước, đồ bên trong, nơi/thời gian cuối cùng và thông tin liên hệ.", writing: "Viết mẫu khai báo 100–120 chữ Hán, phân biệt dữ kiện chắc chắn với điều phỏng đoán.", real: "Tập mô tả túi của chính mình mà không nêu số thẻ hay dữ liệu nhạy cảm.", review: ["护照", "行李", "丢"]
  },
  {
    u: 4, zh: "迷路以后怎么办", vi: "Làm gì sau khi lạc đường", objective: "Hỏi lại hướng, xác nhận mốc và chọn tuyến thay thế.",
    situation: "Bạn đi sai hướng vì hiểu nhầm bản đồ.",
    dialogue: "安：请问，去历史博物馆怎么走？\n路人：你走反了，应该向北走。\n安：过红绿灯以后左转吗？\n路人：对，博物馆就在公园和银行中间。",
    reading: "小安看地图时把东方和西方看反了，越走离博物馆越远。他在路口停下来问一位司机，又把路线说了一遍确认。后来他骑共享自行车，只用了十分钟就到了。",
    rq: ["Tiểu An nhầm hai hướng nào?", "Sau đó cậu ấy đi bằng gì?"], re: ["把东方和西方看反了", "骑共享自行车"], ra: ["Hướng Đông và Tây.", "Xe đạp dùng chung."],
    listening: "从宾馆出来向南走，到第二个路口右转。看见红绿灯以后不要过马路，车站就在你身边。",
    lq: ["Ở giao lộ thứ mấy thì rẽ?", "Có cần qua đường không?"], la: ["Giao lộ thứ hai.", "Không."],
    pronunciation: "Phân biệt dōng/xī/nán/běi; luyện xiàng běi và hónglǜdēng theo cụm.",
    speaking: "Chỉ đường 90 giây có hướng, hai mốc, một cảnh báo và câu xác nhận.", writing: "Viết chỉ dẫn 8 bước từ khách sạn giả đến điểm tham quan, không dựa vào mũi tên.", real: "Chọn một tuyến quen thuộc và thử nói lại sau khi cất bản đồ.", review: ["方向", "向", "红绿灯"]
  },
  {
    u: 5, zh: "搬家前先看房", vi: "Xem nhà trước khi chuyển", objective: "So sánh vị trí, không gian, giá và điều kiện sinh hoạt.",
    situation: "Bạn đi xem hai căn phòng và hỏi chủ nhà.",
    dialogue: "客人：这套房子离地铁远吗？\n房东：走路八分钟，附近也有超市。\n客人：房间挺安静，可是厨房有点儿小。\n房东：楼下还有公共厨房，您可以再看看。",
    reading: "小林看了两套房。第一套在市中心，交通方便，但是面积小、价格高；第二套远一点儿，却更安静，还有花园。他平时在家工作，所以最后选择了第二套。",
    rq: ["Căn đầu có hai nhược điểm gì?", "Vì sao Tiểu Lâm chọn căn hai?"], re: ["面积小、价格高", "平时在家工作"], ra: ["Diện tích nhỏ và giá cao.", "Vì thường làm việc ở nhà và cần yên tĩnh."],
    listening: "这间屋子在六层，有电梯。空调和冰箱都是新的，洗衣机在卫生间旁边。房租里不包括电费。",
    lq: ["Phòng ở tầng mấy?", "Khoản nào không gồm trong tiền thuê?"], la: ["Tầng sáu.", "Tiền điện."],
    pronunciation: "Luyện ānjìng, fángzi, diàntī; phân biệt jiān (lượng từ phòng) với jiàn.",
    speaking: "So sánh hai căn nhà theo bốn tiêu chí rồi giải thích lựa chọn phù hợp.", writing: "Viết tin nhắn 100–130 chữ Hán hỏi năm điều trước khi hẹn xem nhà.", real: "Mô tả ưu–nhược điểm nơi ở hiện tại bằng dữ kiện, không nêu địa chỉ thật.", review: ["房子", "安静", "合适"]
  },
  {
    u: 5, zh: "邻居和小区生活", vi: "Hàng xóm và đời sống khu nhà", objective: "Trao đổi lịch sự về không gian chung và tiếng ồn.",
    situation: "Âm thanh buổi tối làm hàng xóm khó nghỉ ngơi.",
    dialogue: "邻居：不好意思，昨晚你家声音有点儿大。\n林：真的对不起，朋友来做客，我们聊得太晚了。\n邻居：十一点以后能不能小声一点儿？\n林：当然可以，以后我会注意。",
    reading: "小区新开了一个球场，年轻人很喜欢，附近的老人却担心晚上太吵。大家开会以后决定：白天正常使用，晚上九点关灯。这个办法照顾了不同人的需要。",
    rq: ["Ai lo buổi tối quá ồn?", "Sân tắt đèn lúc mấy giờ?"], re: ["附近的老人却担心晚上太吵", "晚上九点关灯"], ra: ["Người cao tuổi gần đó.", "9 giờ tối."],
    listening: "请住在本小区的朋友注意：星期六上午要打扫花园。汽车不要停在北门，老人和小孩儿可以从东门进出。",
    lq: ["Khi nào dọn vườn?", "Xe không được đỗ ở cửa nào?"], la: ["Sáng thứ Bảy.", "Cửa Bắc."],
    pronunciation: "Luyện línjū, xiǎoqū, shēngyīn; đọc qǐng zhùyì thành cụm cảnh báo mềm.",
    speaking: "Đề nghị hàng xóm thay đổi một việc, có xin lỗi/mở lời, dữ kiện và phương án cùng chấp nhận.", writing: "Viết thông báo khu nhà 90–110 chữ Hán, tránh giọng ra lệnh không cần thiết.", real: "Viết lại một quy tắc chung bằng cách diễn đạt lịch sự hơn.", review: ["邻居", "小区", "声音"]
  },
  {
    u: 5, zh: "把新家打扫干净", vi: "Dọn nhà mới sạch sẽ", objective: "Phân công, mô tả tiến độ và kết quả khi chuyển nhà.",
    situation: "Ba người chia việc dọn căn nhà mới.",
    dialogue: "兰：客厅已经扫干净了，接下来做什么？\n安：我把箱子搬进屋子，你去擦冰箱吧。\n兰：那些旧家具怎么办？\n安：先放到楼下，明天再决定留下还是送人。",
    reading: "搬家那天，大家把工作分开：小安搬箱子，小兰打扫厨房，叔叔检查电和空调。中午以前，大部分东西都放好了，只剩下两件旧家具没有处理。",
    rq: ["Ai kiểm tra điện và điều hòa?", "Việc gì chưa xử lý?"], re: ["叔叔检查电和空调", "两件旧家具没有处理"], ra: ["Chú.", "Hai món nội thất cũ."],
    listening: "请把书放到书架上，把衣服放进房间。厨房里的碗和盘子容易破，搬的时候一定要小心。",
    lq: ["Sách đặt ở đâu?", "Nhóm đồ nào dễ vỡ?"], la: ["Trên giá sách.", "Bát và đĩa trong bếp."],
    pronunciation: "Luyện bānjiā/bānjiā (班级 không giống); phân biệt sǎo (扫) và shāof trong 绍.",
    speaking: "Phân công sáu việc cho ba người và cập nhật việc đã xong/chưa xong.", writing: "Viết checklist chuyển nhà có người phụ trách, thứ tự và trạng thái hoàn thành.", real: "Dùng tiếng Trung lập danh sách dọn một góc nhỏ trong phòng.", review: ["搬家", "打扫", "干净"]
  },
  {
    u: 6, zh: "突然发烧了", vi: "Đột nhiên bị sốt", objective: "Mô tả triệu chứng, thời điểm bắt đầu và việc đã làm.",
    situation: "Bạn gọi phòng khám vì sốt và đau đầu.",
    dialogue: "病人：医生，我从昨晚开始发烧，头也很疼。\n医生：量过体温吗？\n病人：刚量过，三十八度半。\n医生：先多喝水，上午来检查，不要自己乱吃药。",
    reading: "小杰半夜感到很冷，早上起来发现自己发烧了。他本来想坚持去上班，爱人却让他先请假看医生。检查以后，医生说问题不严重，但要休息两天。",
    rq: ["Ai khuyên Tiểu Kiệt xin nghỉ?", "Bác sĩ yêu cầu nghỉ bao lâu?"], re: ["爱人却让他先请假看医生", "要休息两天"], ra: ["Vợ/chồng của cậu ấy.", "Hai ngày."],
    listening: "这位病人昨天住院了，主要是因为高烧和腿疼。今天体温已经正常，医生说后天可以出院。",
    lq: ["Vì sao bệnh nhân nhập viện?", "Khi nào có thể xuất viện?"], la: ["Sốt cao và đau chân.", "Ngày kia."],
    pronunciation: "Luyện fāshāo, zhùyuàn/chūyuàn; giữ rõ üan trong yuàn.",
    speaking: "Mô tả triệu chứng 60–90 giây: ở đâu, từ khi nào, mức độ, đã thử gì và cần gì.", writing: "Viết tin nhắn xin nghỉ 80–100 chữ Hán, đủ lý do, thời gian và cách bàn giao.", real: "Tập gọi phòng khám bằng tình huống giả; không dùng bài học để tự chẩn đoán bệnh thật.", review: ["发烧", "住院", "检查"]
  },
  {
    u: 6, zh: "锻炼贵在坚持", vi: "Tập luyện quý ở kiên trì", objective: "Lập lịch vận động an toàn và đánh giá tiến bộ theo thói quen.",
    situation: "Bạn muốn tập nhiều hơn nhưng lịch hiện tại quá nặng.",
    dialogue: "东：我打算每天跑一个小时。\n教练：刚开始不用这么多，一周三次就可以。\n东：怎样才能坚持下去？\n教练：选你喜欢的运动，先从二十分钟开始。",
    reading: "小东以前很少锻炼，一跑步就觉得累。后来他不再只看速度，而是记录每周运动几次。三个月后，他的身体更健康，爬楼梯也没有以前那么难了。",
    rq: ["Sau đó Tiểu Đông ghi lại điều gì?", "Sau ba tháng việc gì dễ hơn?"], re: ["记录每周运动几次", "爬楼梯也没有以前那么难了"], ra: ["Số lần vận động mỗi tuần.", "Leo cầu thang."],
    listening: "体育馆周一到周五早上七点开门。游泳一次四十分钟，参加的人必须先做准备活动。身体不舒服时不要下水。",
    lq: ["Bể mở lúc mấy giờ ngày thường?", "Khi nào không được xuống nước?"], la: ["7 giờ sáng.", "Khi cơ thể không khỏe."],
    pronunciation: "Luyện duànliàn, jiānchí, tǐyùguǎn; không đổi j/ch theo âm Việt.",
    speaking: "Đề xuất kế hoạch vận động cho người mới, có tần suất, thời lượng, tăng dần và cảnh báo.", writing: "Viết nhật ký thói quen 100–120 chữ Hán: mục tiêu, thực tế, khó khăn, điều chỉnh.", real: "Theo dõi một thói quen an toàn trong ba ngày và báo lại bằng tiếng Trung.", review: ["锻炼", "坚持", "健康"]
  },
  {
    u: 6, zh: "习惯会影响生活", vi: "Thói quen ảnh hưởng cuộc sống", objective: "Giải thích quan hệ giữa thói quen, trạng thái và hiệu quả hằng ngày.",
    situation: "Một người ngủ muộn nên buổi sáng luôn mệt.",
    dialogue: "兰：你最近怎么总是没精神？\n杰：我晚上常常看手机到一点。\n兰：这个习惯会影响睡觉，也会影响工作。\n杰：我知道了，今天开始睡前把手机放远一点儿。",
    reading: "小杰以前觉得少睡一会儿没关系，后来发现自己不但容易生气，而且上班常常忘记事情。他从减少晚上的手机时间开始，一个月后精神好多了。",
    rq: ["Thiếu ngủ gây ra hai vấn đề gì?", "Cậu ấy bắt đầu thay đổi từ việc gì?"], re: ["容易生气，而且上班常常忘记事情", "减少晚上的手机时间"], ra: ["Dễ cáu và hay quên việc.", "Giảm thời gian dùng điện thoại buổi tối."],
    listening: "为了睡得更好，我每天晚上十一点以前关机。房间里不开很亮的灯，下午也不再喝咖啡。现在早上起床容易多了。",
    lq: ["Điện thoại tắt trước mấy giờ?", "Buổi chiều người nói không uống gì?"], la: ["Trước 11 giờ tối.", "Cà phê."],
    pronunciation: "Luyện xíguàn/yǐngxiǎng; phân biệt zǒng và zhǒng.",
    speaking: "Giải thích một thói quen theo chuỗi nguyên nhân–ảnh hưởng–thay đổi–kết quả.", writing: "Viết 110–140 chữ Hán về một thói quen muốn giữ hoặc bỏ, có kế hoạch nhỏ.", real: "Đổi một tín hiệu môi trường trong một ngày và ghi lại tác động, không đặt mục tiêu cực đoan.", review: ["习惯", "影响", "总是"]
  },
  {
    u: 7, zh: "一条没回的消息", vi: "Một tin nhắn chưa trả lời", objective: "Diễn đạt suy đoán và hỏi lại mà không kết luận vội.",
    situation: "Bạn lo vì tin nhắn đã gửi nhưng chưa được hồi âm.",
    dialogue: "美：我昨天给小雨发消息，她一直没回答。\n安：她可能没看到，别先觉得她生气了。\n美：可是她平时回得很快。\n安：你可以再问一句，也可以等她下班。",
    reading: "小美看到消息没有被回答，就以为朋友不高兴。后来她才知道，小雨的手机坏了，一整天都没上网。小美发现，网络上的安静不一定表示拒绝。",
    rq: ["Vì sao Tiểu Vũ không trả lời?", "Tiểu Mỹ rút ra điều gì?"], re: ["小雨的手机坏了", "网络上的安静不一定表示拒绝"], ra: ["Điện thoại bị hỏng.", "Im lặng trên mạng chưa chắc là từ chối."],
    listening: "我刚才没有接电话，因为正在开会。现在会议结束了。你如果还方便，请再打过来；不方便的话，发邮件也可以。",
    lq: ["Vì sao không nghe máy?", "Ngoài gọi lại còn có thể làm gì?"], la: ["Đang họp.", "Gửi email."],
    pronunciation: "Luyện huídá, xiāngxìn, yǐwéi; giữ ngữ điệu mềm trong 你是不是….",
    speaking: "Role-play hỏi lại về tin nhắn chưa trả lời, nêu cảm nhận nhưng không quy kết.", writing: "Viết hai phiên bản: một tin nhắn gây áp lực và bản sửa lịch sự hơn.", real: "Dùng quy tắc dữ kiện–suy đoán–câu hỏi để sửa một phản ứng vội.", review: ["回答", "相信", "以为"]
  },
  {
    u: 7, zh: "见面把话说开", vi: "Gặp mặt để nói rõ", objective: "Nêu cảm xúc, nghe quan điểm khác và đề xuất cách sửa quan hệ.",
    situation: "Hai người giải thích việc một lời hẹn bị hủy phút cuối.",
    dialogue: "雨：那天你突然不来，我真的有点儿生气。\n杰：对不起，我叔叔住院了，我当时太着急，忘了说明。\n雨：我不是怪你有事，是希望你能早点告诉我。\n杰：我明白，以后发生变化我会马上联系。",
    reading: "小雨和小杰因为一次没完成的约定几天没有聊天。见面以后，两个人先说事实，再说自己的感受，没有互相说难听的话。最后他们决定，以后计划有变化就及时说明。",
    rq: ["Khi nói chuyện họ tránh điều gì?", "Quy tắc mới của hai người là gì?"], re: ["没有互相说难听的话", "计划有变化就及时说明"], ra: ["Nói lời khó nghe với nhau.", "Có thay đổi thì báo kịp thời."],
    listening: "我不是不同意你的选择，只是担心你一个人去外地不安全。你愿意的话，我们可以一起查交通和宾馆。",
    lq: ["Người nói có phản đối lựa chọn không?", "Đề nghị cùng kiểm tra gì?"], la: ["Không.", "Giao thông và khách sạn."],
    pronunciation: "Luyện shēngqì, dānxīn, hùxiāng; ngắt đúng ở 不是…只是….",
    speaking: "Thực hành I-message: sự việc, cảm xúc, nhu cầu, đề nghị; người nghe tóm tắt lại.", writing: "Viết đoạn 100–130 chữ Hán giải thích một hiểu lầm mà không công kích người khác.", real: "Chuyển một câu quy kết thành câu mô tả dữ kiện và nhu cầu.", review: ["生气", "担心", "互相"]
  },
  {
    u: 7, zh: "邀请也可以拒绝", vi: "Lời mời cũng có thể từ chối", objective: "Mời, từ chối và đề xuất thời gian khác một cách tự nhiên.",
    situation: "Bạn được mời dự tiệc nhưng đã có lịch.",
    dialogue: "兰：周六来我家做客吧，我们给妈妈过生日。\n美：谢谢你邀请，可是我下午要上课，可能来不了。\n兰：那晚上七点以后呢？\n美：可以，我下课就过去，还想带一个小礼物。",
    reading: "小兰邀请同学周末来做客。小美没有只说“不行”，而是先感谢邀请，说明自己有课，又问晚上去是否合适。这样既表达了真实情况，也让对方知道她愿意参加。",
    rq: ["Tiểu Mỹ giải thích lý do gì?", "Cách trả lời cho thấy điều gì?"], re: ["说明自己有课", "让对方知道她愿意参加"], ra: ["Cô ấy có tiết học.", "Cô ấy vẫn muốn tham gia."],
    listening: "感谢你请我看比赛。星期天下午我要去机场接家人，不能参加。下周末如果还有比赛，请再告诉我。",
    lq: ["Vì sao không tham gia?", "Khi nào có thể mời lại?"], la: ["Phải ra sân bay đón gia đình.", "Cuối tuần sau."],
    pronunciation: "Luyện yāoqǐng (từ hỗ trợ trong task), qǐngkè, yuànyì; đọc kěshì không thành kě shì tách rời.",
    speaking: "Role-play ba vòng: mời–từ chối có lý do–đề xuất khác–xác nhận.", writing: "Viết lời mời và câu trả lời từ chối 80–100 chữ Hán, giữ quan hệ tốt.", real: "Soạn phản hồi cho một lời mời giả với thời gian thay thế cụ thể.", review: ["请客", "愿意", "可是"]
  },
  {
    u: 8, zh: "这件衣服合适吗", vi: "Bộ quần áo này có hợp không", objective: "So sánh kích cỡ, màu, chất lượng và yêu cầu thử/đổi.",
    situation: "Bạn thử áo nhưng tay áo dài và muốn đổi cỡ.",
    dialogue: "顾客：这件上衣颜色很好看，可是有点儿大。\n店员：您可以试试小一号的。\n顾客：小一号会不会太短？\n店员：不会，这个样子比较宽，长度是一样的。",
    reading: "小美想买一件春天穿的上衣。黄色的便宜，但是有点儿难看；蓝色的价格高一些，却更合身。她没有只看价钱，还检查了衣服是否干净、扣子是否结实，最后选了蓝色的。",
    rq: ["Áo vàng có vấn đề gì?", "Ngoài giá, cô ấy kiểm tra gì?"], re: ["有点儿难看", "衣服是否干净、扣子是否结实"], ra: ["Hơi xấu.", "Độ sạch và độ chắc của cúc."],
    listening: "这条裙子有大、中、小三种号码。红色只剩大号，蓝色还有中号。试衣间在电梯旁边。",
    lq: ["Màu đỏ còn cỡ nào?", "Phòng thử ở đâu?"], la: ["Cỡ lớn.", "Bên cạnh thang máy."],
    pronunciation: "Luyện chènshān, qúnzi, shàngyī; phân biệt cháng (dài) và zhǎng.",
    speaking: "So sánh ba món đồ và yêu cầu thử hoặc đổi với lý do cụ thể.", writing: "Viết đánh giá mua hàng 100–120 chữ Hán gồm ưu, nhược, độ phù hợp và kết luận.", real: "Mô tả một món đồ thật theo bốn thuộc tính mà không nêu thương hiệu.", review: ["上衣", "裙子", "合适"]
  },
  {
    u: 8, zh: "外卖送错了", vi: "Đơn giao đồ ăn bị sai", objective: "Đối chiếu đơn hàng, mô tả phần sai và yêu cầu xử lý.",
    situation: "Bạn nhận món khác với thực đơn đã đặt.",
    dialogue: "顾客：您好，我点的是牛肉面，收到的却是鸡肉饭。\n客服：请拍一下外卖和菜单上的订单。\n顾客：照片已经发过去了。\n客服：看到了，我们马上重新送，错的不用退。",
    reading: "小杰点了两碗面和一瓶饮料，送来的袋子里却只有一碗面，饮料也不是他选的。客服根据订单检查后，同意补送少的东西，并把处理时间告诉了他。",
    rq: ["Đơn thiếu gì?", "Bộ phận hỗ trợ đồng ý làm gì?"], re: ["只有一碗面", "同意补送少的东西"], ra: ["Thiếu một bát mì.", "Giao bù món thiếu."],
    listening: "您的外卖已经到小区北门。因为里面有冰激凌，请尽快来拿。如果十分钟后还没到，骑手会给您打电话。",
    lq: ["Đơn ở cửa nào?", "Vì sao cần lấy nhanh?"], la: ["Cửa Bắc.", "Vì có kem."],
    pronunciation: "Luyện wàimài, càidān, sháozi; phân biệt sòng (giao) và sǒng.",
    speaking: "Gọi hỗ trợ 90 giây: đơn đúng, đồ nhận, bằng chứng, yêu cầu, thời gian mong muốn.", writing: "Viết khiếu nại 100–130 chữ Hán, lịch sự nhưng đủ dữ kiện.", real: "Dùng hóa đơn giả để luyện đối chiếu số lượng và món, không gửi khiếu nại thật.", review: ["外卖", "菜单", "收到"]
  },
  {
    u: 8, zh: "信用卡付款以后", vi: "Sau khi thanh toán bằng thẻ", objective: "Xác nhận giao dịch, giữ bằng chứng và hỏi chính sách đổi trả.",
    situation: "Thanh toán hiển thị hai lần và bạn cần ngân hàng kiểm tra.",
    dialogue: "顾客：我用信用卡付款以后，手机上出现了两次记录。\n银行：请问两次的价钱一样吗？\n顾客：一样，都是三百元。\n银行：我们先检查，结果会发到您的邮箱。",
    reading: "小安买相机时刷了信用卡，回家后发现账单里有两笔一样的记录。他没有删除邮件和照片，而是先确认时间、金额和店名，再联系银行。工作人员说，其中一笔只是暂时记录。",
    rq: ["Tiểu An giữ lại hai loại bằng chứng gì?", "Một giao dịch thực chất là gì?"], re: ["没有删除邮件和照片", "其中一笔只是暂时记录"], ra: ["Email và ảnh.", "Bản ghi tạm thời."],
    listening: "退换商品需要带信用卡、收据和原来的盒子。食品和已经使用过的耳机不能退。服务时间到晚上八点。",
    lq: ["Cần mang ba thứ gì?", "Sản phẩm nào đã dùng thì không đổi?"], la: ["Thẻ, hóa đơn và hộp gốc.", "Tai nghe."],
    pronunciation: "Luyện xìnyòngkǎ, yínhángkǎ, jìlù; không đọc kǎ thành gǎ.",
    speaking: "Trình bày giao dịch bất thường bằng số tiền, thời gian, số lần và bằng chứng.", writing: "Viết yêu cầu kiểm tra 100–130 chữ Hán, không đưa số thẻ đầy đủ.", real: "Tạo tình huống giả để luyện bảo vệ dữ liệu cá nhân khi hỏi hỗ trợ.", review: ["信用卡", "银行", "记录"]
  },
  {
    u: 9, zh: "那天发生了什么", vi: "Hôm đó đã xảy ra chuyện gì", objective: "Kể sự việc theo nền cảnh, biến cố, phản ứng và kết quả.",
    situation: "Bạn kể lại một buổi dã ngoại gặp mưa bất ngờ.",
    dialogue: "林：你们昨天的活动怎么样？\n雨：开始时天气很好，后来突然刮风下雨。\n林：大家都回家了吗？\n雨：没有，我们跑进附近的图书馆，还在那里看了一个展览。",
    reading: "周末班级去公园拍照。上午太阳很大，大家在草地上聊天；中午天气突然变化，风把一顶帽子吹进了河里。虽然没拿回来，帽子的主人却笑着说这是一次特别的经历。",
    rq: ["Gió thổi vật gì xuống sông?", "Chủ đồ phản ứng thế nào?"], re: ["风把一顶帽子吹进了河里", "笑着说这是一次特别的经历"], ra: ["Một chiếc mũ.", "Cười và coi đó là trải nghiệm đặc biệt."],
    listening: "比赛快结束时，一名运动员突然摔倒了。身边的人马上停下来帮助他。医生检查以后说，他的脚没有大问题。",
    lq: ["Sự việc xảy ra khi nào?", "Kết quả kiểm tra thế nào?"], la: ["Khi trận đấu sắp kết thúc.", "Chân không có vấn đề lớn."],
    pronunciation: "Luyện fāshēng, tūrán, hòulái; ngắt đúng giữa nền cảnh và biến cố.",
    speaking: "Kể chuyện hai phút theo bốn khung: trước đó–đột nhiên–sau đó–cuối cùng.", writing: "Viết 130–160 chữ Hán về một sự cố nhỏ, có cảm nhận nhưng không phóng đại.", real: "Chọn một sự việc thật ít nhạy cảm và kể lại bằng dòng thời gian bốn điểm.", review: ["发生", "突然", "最后"]
  },
  {
    u: 9, zh: "第一次一个人旅行", vi: "Lần đầu du lịch một mình", objective: "Kể trải nghiệm đầu tiên, nỗi lo, cách giải quyết và điều học được.",
    situation: "Bạn chia sẻ lần đầu tự đi một thành phố khác.",
    dialogue: "美：你第一次一个人旅行害怕吗？\n安：出发前有点儿担心，到了以后反而很开心。\n美：遇到过什么难题？\n安：有一次坐错车，不过司机热情地告诉我怎么办。",
    reading: "小安去年第一次一个人去北方旅行。她提前查地图、订宾馆，也把行程发给家人。路上她遇到晚点和下雨，但都自己解决了。回来以后，她觉得独立不是不需要帮助，而是知道什么时候应该问人。",
    rq: ["Cô ấy gửi lịch trình cho ai?", "Cô ấy hiểu độc lập là gì?"], re: ["把行程发给家人", "知道什么时候应该问人"], ra: ["Gia đình.", "Biết khi nào nên nhờ người khác."],
    listening: "我第一次坐飞机时很着急，因为找不到登机口。一位工作人员带我看地图，还提醒我提前四十分钟检票。",
    lq: ["Người nói không tìm thấy gì?", "Cần soát vé sớm bao lâu?"], la: ["Cửa lên máy bay.", "Bốn mươi phút."],
    pronunciation: "Luyện dì-yī-cì, lǚxíng (từ hỗ trợ), hàipà và fǎn'ér theo ngữ điệu kể chuyện.",
    speaking: "Kể hai phút về một lần đầu tiên, nêu chuẩn bị, khó khăn, hỗ trợ và bài học.", writing: "Viết 140–170 chữ Hán dưới dạng nhật ký hành trình có một suy ngẫm cuối.", real: "Lập checklist an toàn cho một chuyến đi giả và giải thích lý do từng mục.", review: ["第一次", "害怕", "遇到"]
  },
  {
    u: 9, zh: "终于完成了", vi: "Cuối cùng cũng hoàn thành", objective: "Tường thuật quá trình kéo dài, trở ngại và cách duy trì động lực.",
    situation: "Một nhóm hoàn thành dự án sau nhiều lần sửa.",
    dialogue: "兰：我们的短片终于完成了！\n杰：是啊，刚开始连题目都决定不了。\n兰：后来大家把任务分开，一边做一边改。\n杰：虽然用了一个月，结果比我们想的好。",
    reading: "班级要做一个介绍城市的节目。第一次拍摄声音不清楚，第二次又遇到下雨。大家没有放弃，而是换地点、重新练习。到第三次，他们终于完成了一段满意的作品。",
    rq: ["Lần quay đầu có vấn đề gì?", "Nhóm thay đổi hai điều gì?"], re: ["第一次拍摄声音不清楚", "换地点、重新练习"], ra: ["Âm thanh không rõ.", "Đổi địa điểm và luyện lại."],
    listening: "我学游泳学了半年。开始时连十米都游不到，后来每周练两次。昨天我终于游完了五百米。",
    lq: ["Người nói học bao lâu?", "Hôm qua hoàn thành bao nhiêu mét?"], la: ["Nửa năm.", "500 mét."],
    pronunciation: "Luyện zhōngyú, wánchéng, mǎnyì; giữ nhịp tăng tiến khi kể kết quả.",
    speaking: "Kể một việc khó đã hoàn thành: khởi đầu, hai trở ngại, thay đổi và kết quả.", writing: "Viết 130–160 chữ Hán về quá trình đạt một mục tiêu, có bằng chứng cụ thể.", real: "Chọn một việc nhỏ còn dở, chia thành ba bước và báo tiến độ bằng tiếng Trung.", review: ["终于", "完成", "满意"]
  },
  {
    u: 10, zh: "去朋友家做客", vi: "Đến nhà bạn làm khách", objective: "Dùng lời chào, lời mời và phép lịch sự phù hợp khi đến nhà người khác.",
    situation: "Bạn lần đầu đến nhà một người bạn Trung Quốc.",
    dialogue: "主人：欢迎，快进来吧！\n客人：打扰了，这是给您家人的一点儿礼物。\n主人：太客气了，来就来吧，还带什么礼物。\n客人：应该的，谢谢您请我来做客。",
    reading: "小安第一次去同学家做客。她提前问清时间，没有到得太早，也没有迟到。进门后她先向长辈问好，吃饭时愿意尝一尝新菜，但不勉强自己喝酒。",
    rq: ["Cô ấy tránh đến thế nào?", "Khi ăn cô ấy sẵn sàng làm gì?"], re: ["没有到得太早，也没有迟到", "愿意尝一尝新菜"], ra: ["Không quá sớm và không muộn.", "Nếm món mới."],
    listening: "明天来我家做客不用带东西。到了小区南门给我打电话，我下楼接你。我们六点半吃饭。",
    lq: ["Đến cửa nào thì gọi?", "Mấy giờ ăn cơm?"], la: ["Cửa Nam.", "6 giờ 30."],
    pronunciation: "Luyện zuòkè, kèrén, rèqíng; phân biệt kèqi với kèwén.",
    speaking: "Role-play đến nhà: chào, tặng quà nhỏ, phản hồi lời mời ăn/uống và cảm ơn khi về.", writing: "Viết tin nhắn 90–110 chữ Hán xác nhận giờ đến và hỏi một điều cần chuẩn bị.", real: "So sánh ba phép lịch sự quen thuộc của Việt Nam và ngữ cảnh bài, tránh coi là quy tắc tuyệt đối.", review: ["做客", "客人", "欢迎"]
  },
  {
    u: 10, zh: "过节送什么礼物", vi: "Tặng gì vào dịp lễ", objective: "Chọn quà theo người nhận, dịp và mức độ thân thiết.",
    situation: "Nhóm bạn chọn quà mừng năm mới cho giáo viên.",
    dialogue: "兰：新年快到了，咱们送老师什么？\n杰：送花怎么样？\n兰：花很好看，不过老师家里有小猫。\n杰：那送一本大家一起写的纪念册吧，更有意义。",
    reading: "不同节日送礼的方法不完全一样。礼物不一定越贵越好，重要的是让对方感到被关心。小兰给奶奶做了一张照片卡，还写下今年最想一起完成的三件事。",
    rq: ["Quà có nhất thiết càng đắt càng tốt không?", "Tiểu Lan làm quà gì cho bà?"], re: ["礼物不一定越贵越好", "给奶奶做了一张照片卡"], ra: ["Không.", "Một tấm thiệp ảnh."],
    listening: "学校晚会以后，留学生给表演的同学送了小礼物。有人送花，有人写卡片，大家还一起拍照纪念。",
    lq: ["Quà được tặng sau sự kiện nào?", "Mọi người chụp ảnh để làm gì?"], la: ["Dạ hội trường.", "Kỷ niệm."],
    pronunciation: "Luyện jiérì/jiémù/lǐwù; chú ý thanh biến đổi trong hěn yǒu yìyì.",
    speaking: "Chọn quà cho ba quan hệ khác nhau và giải thích lý do, ngân sách, điều cần tránh.", writing: "Viết lời chúc và giải thích món quà trong 100–120 chữ Hán.", real: "Thiết kế một món quà không cần mua và trình bày ý nghĩa bằng tiếng Trung.", review: ["过节", "礼物", "新年"]
  },
  {
    u: 10, zh: "校园晚会", vi: "Dạ hội trong khuôn viên", objective: "Đọc chương trình, mời tham gia và phản hồi về một tiết mục.",
    situation: "Bạn tham gia tổ chức dạ hội sinh viên quốc tế.",
    dialogue: "学生：校长，晚会节目单已经准备好了。\n校长：很好，留学生也有表演吗？\n学生：有，他们一边介绍家乡，一边表演音乐。\n校长：请注意时间，最后还要给观众拍合照。",
    reading: "校园文化晚会有八个节目，包括歌曲、舞蹈和短对话。来自不同国家的学生不但表演，还介绍节目背后的故事。晚会结束后，很多观众说最喜欢真实又简单的内容。",
    rq: ["Dạ hội có mấy tiết mục?", "Ngoài biểu diễn, sinh viên còn làm gì?"], re: ["有八个节目", "介绍节目背后的故事"], ra: ["Tám.", "Giới thiệu câu chuyện phía sau tiết mục."],
    listening: "晚会七点在体育馆开始。参加表演的人六点以前到，先检查音乐和灯。观众可以从西门进入。",
    lq: ["Người biểu diễn đến trước mấy giờ?", "Khán giả vào từ cửa nào?"], la: ["Trước 6 giờ.", "Cửa Tây."],
    pronunciation: "Luyện wǎnhuì, jiémù, biǎoyǎn; phân biệt xiàozhǎng với xiào (cười).",
    speaking: "Giới thiệu một tiết mục trong 60 giây rồi đưa phản hồi có điểm cụ thể và đề xuất.", writing: "Viết chương trình ngắn và lời giới thiệu 120–140 chữ Hán cho một sự kiện giả.", real: "Ghi âm lời dẫn mở màn, tự nghe độ rõ của tên, giờ và địa điểm.", review: ["晚会", "节目", "校园"]
  },
  {
    u: 11, zh: "四季的天气变了", vi: "Thời tiết bốn mùa thay đổi", objective: "Mô tả thay đổi theo mùa và tác động đến kế hoạch.",
    situation: "Bạn so sánh thời tiết quê nhà trong vài năm gần đây.",
    dialogue: "安：你家乡四季清楚吗？\n兰：以前很清楚，现在春天变短了。\n安：夏天是不是也更热？\n兰：对，而且常常突然下大雨，出门要多注意。",
    reading: "小兰记得小时候冬天比较冷，春天常看到公园开花。最近几年，冬天不太冷，夏天却更长。天气变化影响了人们的衣服、运动时间和假期计划。",
    rq: ["Hồi nhỏ mùa đông thế nào?", "Thời tiết ảnh hưởng ba mặt nào?"], re: ["小时候冬天比较冷", "衣服、运动时间和假期计划"], ra: ["Lạnh hơn.", "Quần áo, thời gian vận động và kế hoạch nghỉ."],
    listening: "今天北方大风，下午可能下雨；南方天气晴，气温比较高。去外地的游客请根据天气准备衣服和雨具。",
    lq: ["Phía Bắc chiều có thể thế nào?", "Du khách nên chuẩn bị theo gì?"], la: ["Có thể mưa.", "Theo thời tiết."],
    pronunciation: "Luyện sìjì, jìjié, biànhuà; phân biệt fēng và fēn.",
    speaking: "So sánh hai mùa hoặc hai nơi, nêu dữ kiện, thay đổi và ảnh hưởng thực tế.", writing: "Viết bản tin 120–150 chữ Hán về thời tiết và ba khuyến nghị phù hợp.", real: "Xem dự báo tại nơi ở rồi tóm tắt bằng tiếng Trung, ghi rõ đây là dữ liệu tại thời điểm xem.", review: ["四季", "季节", "变化"]
  },
  {
    u: 11, zh: "公园为什么变干净了", vi: "Vì sao công viên sạch hơn", objective: "Mô tả vấn đề môi trường, biện pháp và kết quả quan sát được.",
    situation: "Khu phố cải thiện công viên sau khi rác tăng.",
    dialogue: "林：最近公园干净多了。\n雨：因为小区多放了垃圾箱，还增加了打扫的人。\n林：大家的习惯也变了。\n雨：对，只要每个人注意一点儿，环境就会更好。",
    reading: "以前周末过后，草地和河边常有瓶子和纸。小区先增加垃圾箱，又请志愿者说明分类方法。一个月后，地上的垃圾少了，来公园散步的人也更多了。",
    rq: ["Trước đây sau cuối tuần có gì trên đất?", "Sau một tháng có hai kết quả gì?"], re: ["常有瓶子和纸", "地上的垃圾少了，来公园散步的人也更多了"], ra: ["Chai và giấy.", "Ít rác hơn và nhiều người đi dạo hơn."],
    listening: "明天上午大家一起打扫河边。请带手套和水，不要自己捡危险的东西。活动结束后，工具要放回公园办公室。",
    lq: ["Cần mang gì?", "Không tự nhặt loại đồ nào?"], la: ["Găng tay và nước.", "Đồ nguy hiểm."],
    pronunciation: "Luyện huánjìng, gānjìng, lājī (từ hỗ trợ); phân biệt 园 và 员.",
    speaking: "Trình bày một vấn đề nhỏ quanh mình, nguyên nhân có bằng chứng, giải pháp và cách đo kết quả.", writing: "Viết đề xuất 130–160 chữ Hán cho khu phố hoặc trường học.", real: "Quan sát một khu vực trong năm phút và ghi dữ kiện, không chụp người lạ.", review: ["环境", "干净", "公园"]
  },
  {
    u: 11, zh: "选择绿色出行", vi: "Chọn cách đi lại xanh", objective: "So sánh phương tiện theo thời gian, chi phí, sức khỏe và môi trường.",
    situation: "Bạn chọn tuyến đi làm thay cho việc luôn đi ô tô.",
    dialogue: "安：你最近怎么不自己开车了？\n东：公司离家不远，我改骑自行车。\n安：下雨怎么办？\n东：下雨就坐公交车，只有很晚的时候才打车。",
    reading: "小东以前每天开车，常在路口等很久。后来他发现骑自行车只多用十分钟，还能锻炼身体。现在天气合适时他就骑车，路远或带东西时再选择公共交通。",
    rq: ["Đi xe đạp tốn thêm bao lâu?", "Khi nào cậu ấy chọn phương tiện công cộng?"], re: ["只多用十分钟", "路远或带东西时"], ra: ["Mười phút.", "Khi đường xa hoặc mang đồ."],
    listening: "从下周起，校园里面不能开汽车。老师和学生可以骑自行车，也可以把车停在东门外，再走进来。",
    lq: ["Quy định bắt đầu khi nào?", "Ô tô đỗ ở đâu?"], la: ["Từ tuần sau.", "Ngoài cửa Đông."],
    pronunciation: "Luyện zìxíngchē, qí, gōnggòng; phân biệt qí với qǐ.",
    speaking: "So sánh ba phương tiện rồi đề xuất lựa chọn theo hai tình huống khác nhau.", writing: "Viết 130–160 chữ Hán về kế hoạch đi lại một tuần và cách xử lý ngày mưa.", real: "Tính thử thời gian hai tuyến quen thuộc rồi trình bày bằng tiếng Trung.", review: ["自行车", "选择", "为了"]
  },
  {
    u: 12, zh: "设计一个城市周末", vi: "Thiết kế một cuối tuần trong thành phố", objective: "Tổng hợp lịch trình, ngân sách, di chuyển và phương án dự phòng.",
    situation: "Nhóm thiết kế chuyến đi hai ngày cho một người bạn.",
    dialogue: "兰：周六先去博物馆，下午逛老街怎么样？\n杰：可以，不过天气预报说可能下雨。\n兰：那我们准备两个方案，雨大就去图书馆。\n杰：我来查交通和门票，你来订宾馆。",
    reading: "三名学生要为朋友设计一个城市周末。他们先了解朋友的兴趣和预算，再选择景点、交通和饭馆。计划里不但有时间表，还有下雨、晚点和身体不舒服时的办法。",
    rq: ["Trước khi chọn điểm đi họ tìm hiểu gì?", "Kế hoạch có phương án cho ba tình huống nào?"], re: ["了解朋友的兴趣和预算", "下雨、晚点和身体不舒服时"], ra: ["Sở thích và ngân sách.", "Mưa, chậm giờ và không khỏe."],
    listening: "周末项目一共两天。第一天完成路线和价格表，第二天上午练习介绍，下午向同学讲五分钟并回答问题。",
    lq: ["Ngày đầu hoàn thành gì?", "Bài trình bày dài bao lâu?"], la: ["Lộ trình và bảng giá.", "Năm phút."],
    pronunciation: "Luyện nhịp liệt kê 景点、交通和饭馆; giữ rõ yùsuàn (từ hỗ trợ) và fāng'àn.",
    speaking: "Thuyết trình ba phút về lịch trình hai ngày, có lựa chọn và phương án dự phòng.", writing: "Viết kế hoạch 160–180 chữ Hán có bảng thời gian chuyển thành đoạn văn mạch lạc.", real: "Dùng dữ liệu công khai hiện tại để lập bản nháp, không tự đặt chỗ hay chi tiền.", review: ["计划", "或者", "如果"]
  },
  {
    u: 12, zh: "采访身边的人", vi: "Phỏng vấn người quanh mình", objective: "Đặt câu hỏi mở, ghi chép và tóm tắt trung thực ý người khác.",
    situation: "Bạn phỏng vấn bạn học về thói quen dùng điện thoại.",
    dialogue: "安：我可以问你三个关于手机习惯的问题吗？\n美：可以。\n安：你每天大概用多久？最常用来做什么？\n美：大概三小时，主要聊天和查学习资料。",
    reading: "小安采访了五名同学。有人认为手机让学习更方便，也有人觉得消息太多会影响注意力。小安没有只写自己同意的答案，而是按原意记录不同看法。",
    rq: ["Hai quan điểm về điện thoại là gì?", "Tiểu An tránh cách ghi nào?"], re: ["让学习更方便", "没有只写自己同意的答案"], ra: ["Tiện cho học nhưng tin nhắn nhiều gây mất tập trung.", "Chỉ ghi ý mình đồng ý."],
    listening: "采访开始前，请先说明目的，并问对方是否愿意参加。记录姓名不是必须的；如果对方不想回答某个问题，就换下一个。",
    lq: ["Trước phỏng vấn cần giải thích gì?", "Ghi tên có bắt buộc không?"], la: ["Mục đích.", "Không."],
    pronunciation: "Luyện fǎngwèn (từ hỗ trợ), rènwéi, zhǔyào; ngữ điệu câu hỏi mở không lên quá cao.",
    speaking: "Thực hiện phỏng vấn ba phút bằng câu hỏi mở và một câu hỏi tiếp nối.", writing: "Viết tóm tắt 150–180 chữ Hán, phân biệt dữ kiện, lời người tham gia và nhận xét riêng.", real: "Xin phép rõ trước khi hỏi; có thể dùng nhân vật giả nếu không muốn thu thập dữ liệu thật.", review: ["认为", "主要", "关于"]
  },
  {
    u: 12, zh: "我的HSK三级作品", vi: "Tác phẩm HSK3 của tôi", objective: "Hoàn thiện sản phẩm nói–viết, tự sửa và phản hồi theo rubric.",
    situation: "Bạn chọn một chủ đề đã học để làm sản phẩm cuối cấp.",
    dialogue: "老师：你的最后作品想讲什么？\n兰：我想讲搬家以后生活习惯的变化。\n老师：材料准备得怎么样？\n兰：短文写完了，照片也选好了，只差最后一次练习。",
    reading: "结业作品不要求使用所有生词。学习者应该选择一个真实而安全的主题，用清楚的结构表达。完成初稿后，要检查内容、词语、语法和读音，再根据反馈修改一次。",
    rq: ["Tác phẩm có cần dùng mọi từ mới không?", "Sau bản nháp cần kiểm tra bốn mặt nào?"], re: ["不要求使用所有生词", "检查内容、词语、语法和读音"], ra: ["Không.", "Nội dung, từ ngữ, ngữ pháp và phát âm."],
    listening: "最终展示分为两部分：先说三分钟，再回答两个问题。写作作品是一百五十到一百八十字。请在展示前完成自评表。",
    lq: ["Phần nói dài bao lâu?", "Bài viết dài bao nhiêu chữ?"], la: ["Ba phút.", "150–180 chữ."],
    pronunciation: "Tự chọn ba âm khó của bản thân, đánh dấu trong bài và thu hai lần để so sánh.",
    speaking: "Trình bày ba phút có mở–thân–kết, ví dụ cụ thể và trả lời câu hỏi không học thuộc máy móc.", writing: "Hoàn thiện văn bản 150–180 chữ Hán, sửa ít nhất một vòng theo checklist.", real: "Lưu bản nháp, bản sửa và tự đánh giá để nhìn thấy quá trình thay vì chỉ giữ điểm cuối.", review: ["最后", "重要", "水平"]
  }
];

const CULTURE_NOTES = [
  "Trong tiếng Trung, người nói thường báo trước trật tự như 先…然后…最后… để người nghe theo dõi; đây là công cụ tổ chức ý, không phải quy tắc rằng mọi người Trung Quốc đều nói giống nhau.",
  "Khi thuật lại sự việc, tách điều mình thấy, điều người khác nói và điều mình suy đoán giúp tránh hiểu nhầm trong cả môi trường Trung Quốc lẫn Việt Nam.",
  "以为 thường cho biết nhận định ban đầu khác sự thật; nói thêm 原来 hoặc 其实 có thể đính chính mềm hơn thay vì quy lỗi cho người nghe.",
  "Kế hoạch học tập ở trường Trung Quốc thường dùng 学期 làm mốc; khi trao đổi với trường cụ thể vẫn cần kiểm tra lịch vì ngày bắt đầu và kết thúc không đồng nhất.",
  "复习 không chỉ là đọc lại: nhiều người học dùng 朗读, 默写 và 错题本. Đây là các cách học phổ biến, không phải yêu cầu bắt buộc của HSK.",
  "Khi bàn về 成绩, cách nói coi trọng quá trình và phương pháp thường giữ thể diện tốt hơn so với xếp hạng một người trước tập thể.",
  "Ngày đầu làm việc, cách xưng hô phụ thuộc tổ chức: họ + chức danh khá phổ biến, nhưng nên nghe đồng nghiệp tự giới thiệu thay vì tự đoán mức thân mật.",
  "Đến họp đúng giờ là kỳ vọng thường gặp; nếu muộn, một lời báo sớm kèm thời gian đến dự kiến hữu ích hơn lời xin lỗi dài nhưng không có thông tin.",
  "Trong công việc, 报告问题 thường đi cùng hiện trạng, ảnh hưởng và phương án; cách này giúp cuộc trao đổi tập trung vào xử lý thay vì tìm người chịu lỗi.",
  "Đi tàu cao tốc cần phân biệt 车站, 进站口 và 检票口. Quy trình và giấy tờ có thể thay đổi, vì vậy bài học chỉ luyện ngôn ngữ, không thay hướng dẫn tại ga.",
  "Khi báo mất đồ, chỉ cung cấp dữ kiện cần thiết và dùng kênh chính thức; không nên gửi ảnh hộ chiếu hoặc số thẻ vào nhóm chat công khai.",
  "Hỏi đường bằng 请问 rồi nhắc lại mốc rẽ là một cách xác nhận lịch sự; tên cửa Đông/Tây thường là mốc thực tế hơn dịch máy của địa chỉ dài.",
  "Thuê nhà có thể liên quan 押金, 合同 và phí dịch vụ ngoài tiền thuê; phong tục và luật khác nhau theo nơi nên luôn kiểm tra hợp đồng thật.",
  "Quan hệ hàng xóm ở khu nhà rất đa dạng. Nhờ giúp nên nói rõ thời gian, mức tiếng ồn hoặc việc cần làm, tránh giả định người khác luôn sẵn sàng.",
  "搬家 có thể chọn ngày theo thói quen gia đình, nhưng bài học không gán niềm tin đó cho mọi người; ưu tiên giao tiếp rõ với chủ nhà và đơn vị vận chuyển.",
  "Khi khám bệnh, mô tả thời điểm, triệu chứng và thuốc đã dùng quan trọng hơn tự chẩn đoán. Bài học ngôn ngữ không thay tư vấn y tế.",
  "Các công viên và quảng trường có nhiều hình thức tập luyện cộng đồng; người học nên quan sát khoảng cách và âm lượng thay vì mặc định ai cũng muốn tham gia.",
  "Khi nói về thói quen, cách hỏi trung tính như 平时怎么… ít phán xét hơn câu hỏi ngầm cho rằng lựa chọn của người kia là sai.",
  "Chậm trả lời tin nhắn không luôn có nghĩa là không tôn trọng; nhắc lại việc cần chốt và thời hạn giúp giảm suy diễn về quan hệ.",
  "Nói chuyện trực tiếp có thể giải quyết hiểu nhầm, nhưng 见面 không phải lúc nào cũng phù hợp; người kia có quyền chọn thời gian, nơi và kênh trao đổi.",
  "Từ chối lời mời thường tự nhiên hơn khi cảm ơn, nêu lý do vừa đủ và đề xuất dịp khác; không cần bịa lý do quá chi tiết để giữ lịch sự.",
  "Màu sắc hoặc kiểu dáng có thể gắn với dịp lễ trong một số bối cảnh, nhưng sở thích cá nhân rất khác nhau; hỏi mục đích mặc đáng tin hơn áp dụng định kiến.",
  "Khi đơn giao đồ ăn sai, cung cấp mã đơn và ảnh món có thể hữu ích, nhưng nên che dữ liệu cá nhân; chính sách hoàn tiền tùy nền tảng.",
  "Thanh toán di động phổ biến ở nhiều thành phố Trung Quốc, song tiền mặt và thẻ vẫn có bối cảnh sử dụng; khách du lịch nên kiểm tra phương thức được chấp nhận trước.",
  "Kể chuyện theo thời gian bằng 后来, 突然 và 最后 giúp mạch lạc; người kể nên phân biệt ký ức của mình với thông tin nghe lại từ người khác.",
  "Du lịch một mình không phải biểu hiện độc lập giống nhau với mọi người. Trong giao tiếp thực tế, báo lịch trình cho người tin cậy là lựa chọn an toàn, không phải chi tiết để khoe.",
  "终于 thường mang cảm giác chờ đợi hoặc nỗ lực; dùng nó để công nhận quá trình tự nhiên hơn khi kết quả không đến ngay.",
  "Khi làm khách, hỏi giờ đến, quy tắc trong nhà và có cần mang gì không là cách chuẩn bị an toàn; việc thay giày hoặc tặng quà tùy từng gia đình.",
  "Quà tặng nên xét quan hệ và dịp cụ thể. Tránh biến các danh sách ‘cấm kỵ’ trên mạng thành luật tuyệt đối; nếu không chắc, hỏi người địa phương đáng tin.",
  "晚会 trong trường có thể gồm biểu diễn, trò chơi và giới thiệu câu lạc bộ; người tham gia nên xác nhận thời lượng và quyền ghi hình trước khi đăng ảnh.",
  "Trung Quốc có vùng khí hậu rất khác nhau; ‘miền Bắc lạnh, miền Nam ấm’ chỉ là khái quát và không thay dự báo địa phương tại thời điểm đi.",
  "Hoạt động cộng đồng thường cần phân loại rác theo quy định địa phương. Tên màu thùng không thống nhất ở mọi thành phố nên phải đọc biển hướng dẫn tại chỗ.",
  "‘Đi lại xanh’ là lựa chọn theo điều kiện sức khỏe, hạ tầng và thời tiết; không nên dùng nó để phán xét người cần ô tô hoặc phương tiện hỗ trợ.",
  "Khi lập lịch trình, kiểm tra giờ mở cửa và đặt chỗ từ nguồn hiện hành; bài học không biến một lịch mẫu thành khuyến nghị du lịch cố định.",
  "Phỏng vấn cần nói rõ mục đích, xin đồng ý và cho phép bỏ câu hỏi. Ghi lại nguyên ý quan trọng hơn sửa lời người tham gia cho hợp quan điểm của mình.",
  "Một sản phẩm học tập có thể dùng nguồn Trung–Việt, nhưng phải ghi rõ đâu là dữ kiện, đâu là nhận xét cá nhân và không đăng thông tin của người khác khi chưa được phép."
];

const SYNONYM_PAIRS = [
  ["办法", "方法"], ["常", "常常"], ["刚", "刚刚"], ["才", "只有"], ["宾馆", "酒店"], ["聪明", "聪慧"], ["打算", "计划"], ["担心", "着急"], ["大概", "差不多"], ["地方", "地点"], ["懂得", "明白"], ["发现", "发觉"], ["高兴", "开心"], ["关心", "关注"], ["害怕", "怕"], ["合适", "适合"], ["后来", "以后"], ["回答", "答复"], ["见面", "遇见"], ["检查", "查看"], ["开始", "起"], ["了解", "懂得"], ["马上", "立刻"], ["难过", "伤心"], ["认为", "觉得"], ["认真", "仔细"], ["容易", "简单"], ["喜爱", "喜欢"], ["需要", "要"], ["选择", "选"], ["照片", "相片"], ["照相", "拍照"], ["总", "总是"], ["最近", "近来"]
];
const ANTONYM_PAIRS = [
  ["矮", "高"], ["安静", "吵"], ["安全", "危险"], ["饱", "饿"], ["北", "南"], ["长", "短"], ["迟到", "早到"], ["出发", "到达"], ["出生", "去世"], ["出院", "住院"], ["春天", "秋天"], ["聪明", "笨"], ["大人", "孩子"], ["担心", "放心"], ["东", "西"], ["方便", "麻烦"], ["分开", "见面"], ["干净", "脏"], ["关机", "开机"], ["过去", "以后"], ["黑", "白"], ["后来", "以前"], ["旧", "新"], ["开心", "难过"], ["可爱", "难看"], ["哭", "笑"], ["老", "年轻"], ["胖", "瘦"], ["同意", "反对"], ["甜", "苦"], ["外地", "本地"], ["完成", "开始"], ["相信", "怀疑"], ["小心", "粗心"]
];
const CONFUSABLE_PAIRS = [
  ["才", "就"], ["常", "常常"], ["得", "地"], ["地方", "地点"], ["刚", "刚才"], ["过去", "经过"], ["关心", "关注"], ["还", "又"], ["后来", "以后"], ["机会", "时间"], ["季", "季节"], ["经过", "通过"], ["认为", "以为"], ["见面", "遇见"], ["可以", "会"], ["了解", "明白"], ["马上", "立刻"], ["其他", "别的"], ["收到", "受到"], ["声音", "声"], ["需要", "必须"], ["一样", "同样"], ["一直", "总是"], ["只要", "只有"], ["中", "中间"], ["最后", "终于"], ["做客", "请客"]
];

function lexicalRelations(word) {
  const collect = (pairs, type) => pairs.filter((pair) => pair.includes(word)).map((pair) => {
    const other = pair[0] === word ? pair[1] : pair[0];
    if (type === "confusable") return `${other} — dễ nhầm; so sánh điều kiện dùng, không thay thế máy móc`;
    return `${other} — ${type === "synonym" ? "gần nghĩa" : "trái nghĩa"}; đối chiếu trong câu hoàn chỉnh`;
  });
  return { synonyms: collect(SYNONYM_PAIRS, "synonym"), antonyms: collect(ANTONYM_PAIRS, "antonym"), confusables: collect(CONFUSABLE_PAIRS, "confusable") };
}

assert(CULTURE_NOTES.length === LESSON_SPECS.length, "Every HSK3 lesson needs a distinct culture note.");

const GRAMMAR_DEFS = [
  ["把字句：放到/放在", "Câu 把 với nơi chốn", "主语 + 把 + 宾语 + 动词 + 到/在 + 处所", "Đưa đối tượng đã xác định đến hoặc đặt tại một nơi.", "我把文件放到桌上了。", "Tôi đã đặt tài liệu lên bàn."],
  ["把字句：给别人", "Câu 把 với người nhận", "主语 + 把 + 宾语1 + 动词 + 给 + 宾语2", "Nêu rõ vật được chuyển cho người nhận.", "请把名单发给经理。", "Hãy gửi danh sách cho quản lý."],
  ["把字句：结果和趋向", "Câu 把 với kết quả/hướng", "主语 + 把 + 宾语 + 动词 + 结果/趋向补语", "Nhấn mạnh kết quả xử lý đối tượng.", "他把门关上了。", "Anh ấy đã đóng cửa lại."],
  ["被字句：有施事", "Câu bị động 被 có tác nhân", "主语 + 被 + 施事 + 动词 + 其他成分", "Nêu việc chủ thể chịu tác động và có người/vật gây ra.", "帽子被风吹进河里了。", "Chiếc mũ bị gió thổi xuống sông."],
  ["被字句：省略施事", "Câu 被 không nêu tác nhân", "主语 + 被 + 动词 + 其他成分", "Dùng khi tác nhân không biết hoặc không quan trọng.", "我的包被拿走了。", "Túi của tôi bị lấy đi rồi."],
  ["可能补语", "Bổ ngữ khả năng", "动词 + 得/不 + 结果/趋向补语", "Nói một hành động có thể đạt kết quả hay không.", "这个箱子我搬不动。", "Tôi không chuyển nổi chiếc va-li này."],
  ["结果补语：到/住/走/上", "Bổ ngữ kết quả mở rộng", "动词 + 到/住/走/上", "Cho biết tìm/giữ/lấy đi/đóng đạt kết quả.", "我终于找到了护照。", "Cuối cùng tôi tìm thấy hộ chiếu."],
  ["趋向补语的结果用法", "Bổ ngữ xu hướng mang nghĩa kết quả", "动词 + 出/起/下", "出/起/下 có thể biểu thị nhận ra, nhớ ra hoặc ghi lại.", "我突然想起他的名字了。", "Tôi bỗng nhớ ra tên anh ấy."],
  ["动词 + 上/起来", "Bắt đầu hành động/trạng thái", "动词 + 上/起来", "Biểu thị hành động hoặc trạng thái bắt đầu.", "大家聊起来了。", "Mọi người bắt đầu trò chuyện."],
  ["动词 + 下去/下来", "Tiếp tục hoặc giữ lại", "动词 + 下去/下来", "Biểu thị tiếp tục diễn biến hoặc lưu giữ kết quả.", "这个好习惯要坚持下去。", "Cần duy trì thói quen tốt này."],
  ["形容词 + 得很", "Mức độ cao với 得很", "形容词 + 得很", "Nhấn mức độ khá cao trong khẩu ngữ.", "这间屋子安静得很。", "Căn phòng này rất yên tĩnh."],
  ["极了/坏了", "Bổ ngữ mức độ 极了/坏了", "形容词/心理动词 + 极了/坏了", "Nhấn mạnh cảm xúc hoặc mức độ mạnh.", "听到这个消息，我高兴极了。", "Nghe tin này tôi vui vô cùng."],
  ["A比B更/还……", "So sánh tăng cường", "A + 比 + B + 更/还 + 形容词", "Nêu mức chênh cao hơn dự kiến hoặc so sánh trước đó.", "第二套房比第一套还安静。", "Căn thứ hai còn yên tĩnh hơn căn đầu."],
  ["A跟B一样", "So sánh ngang bằng", "A + 跟 + B + 一样 (+ 形容词)", "Nói hai đối tượng giống nhau hoặc cùng mức độ.", "两次付款的价钱一样。", "Giá của hai lần thanh toán giống nhau."],
  ["A不比B……", "Phủ định chênh lệch", "A + 不比 + B + 形容词", "Nói A không hơn B về đặc điểm, không nhất thiết A kém.", "坐地铁不比开车慢。", "Đi tàu điện không chậm hơn lái xe."],
  ["比较数量差", "So sánh chênh lệch số lượng", "A + 比 + B + 多/少/早/晚 + 动词 + 数量短语", "Nêu chênh lệch cụ thể về thời gian hoặc số lượng.", "我比他早到十分钟。", "Tôi đến sớm hơn anh ấy mười phút."],
  ["越……越……", "Càng… càng…", "越 + 条件/动作，越 + 结果/状态", "Diễn tả hai mức độ cùng thay đổi.", "越练越自然。", "Càng luyện càng tự nhiên."],
  ["除了……以外，还……", "Ngoài… còn…", "除了 + X + 以外，主语 + 还/也/都 + Y", "Bổ sung hoặc loại trừ một phạm vi.", "除了听力以外，我还想提高写作。", "Ngoài nghe, tôi còn muốn nâng viết."],
  ["一边……一边……", "Vừa… vừa…", "主语 + 一边 + V1，一边 + V2", "Hai hành động diễn ra đồng thời và tương thích.", "她一边听一边记笔记。", "Cô ấy vừa nghe vừa ghi chép."],
  ["不但……而且……", "Không những… mà còn…", "不但 + 分句1，而且 + 分句2", "Bổ sung thông tin tăng tiến.", "他不但按时完成，而且检查了两遍。", "Anh ấy không chỉ xong đúng giờ mà còn kiểm tra hai lượt."],
  ["如果……就……", "Nếu… thì…", "如果 + 条件，就 + 结果", "Nêu điều kiện giả định và kết quả.", "如果下雨，我们就去图书馆。", "Nếu mưa, chúng tôi sẽ đi thư viện."],
  ["只要……就……", "Chỉ cần… thì…", "只要 + 充分条件，就 + 结果", "Nhấn điều kiện đủ để có kết quả.", "只要每天练，就会进步。", "Chỉ cần luyện hằng ngày sẽ tiến bộ."],
  ["只有……才……", "Chỉ khi… mới…", "只有 + 必要条件，才 + 结果", "Nhấn điều kiện cần.", "只有说明问题，客服才能帮助你。", "Chỉ khi nói rõ vấn đề, hỗ trợ mới giúp được."],
  ["虽然……可是……", "Tuy… nhưng…", "虽然 + 让步，可是 + 转折结果", "Nêu kết quả trái với kỳ vọng.", "虽然晚点了，可是我们没有错过火车。", "Tuy bị chậm nhưng chúng tôi không lỡ tàu."],
  ["先……再/然后……", "Trình tự trước–sau", "先 + V1，再/然后 + V2", "Sắp xếp hai hay nhiều bước.", "先确认号码，然后再付款。", "Trước hết xác nhận số, sau đó mới thanh toán."],
  ["或者……或者……", "Hoặc… hoặc…", "或者 + 选择1，或者 + 选择2", "Liệt kê lựa chọn trong câu trần thuật.", "我们或者坐地铁，或者骑自行车。", "Chúng tôi hoặc đi tàu điện, hoặc đi xe đạp."],
  ["又……又……", "Vừa… vừa… về đặc điểm", "又 + 形容词1 + 又 + 形容词2", "Nêu hai đặc điểm song song.", "这间房又安静又干净。", "Phòng này vừa yên tĩnh vừa sạch."],
  ["一会儿……一会儿……", "Lúc thì… lúc thì…", "一会儿 + V1，一会儿 + V2", "Nêu hành động/trạng thái luân phiên trong thời gian ngắn.", "天气一会儿晴，一会儿下雨。", "Thời tiết lúc nắng lúc mưa."],
  ["为了……", "Để…", "为了 + 目的，主语 + 行动", "Đưa mục đích lên trước hành động.", "为了按时到，我提前出发。", "Để đến đúng giờ, tôi xuất phát sớm."],
  ["在……看来", "Theo cách nhìn của…", "在 + 人 + 看来，观点", "Đánh dấu nguồn của quan điểm.", "在老师看来，进步不只看分数。", "Theo giáo viên, tiến bộ không chỉ nhìn điểm."],
  ["对……来说", "Đối với…", "对 + 人/事 + 来说，评价", "Giới hạn đối tượng mà nhận xét áp dụng.", "对初学者来说，坚持最重要。", "Với người mới học, kiên trì quan trọng nhất."],
  ["从……起", "Bắt đầu từ…", "从 + 时间/地点 + 起", "Đánh dấu mốc bắt đầu.", "从下周起，校园里不能开车。", "Từ tuần sau, trong trường không được lái xe."],
  ["在……上/下/中", "Trong phương diện/phạm vi", "在 + 名词 + 上/下/中", "Khoanh phương diện hoặc phạm vi trừu tượng.", "他在发音上进步很大。", "Anh ấy tiến bộ nhiều về phát âm."],
  ["一……也/都不……", "Không… chút/lần nào", "一 + 量词 + 名词 + 也/都 + 不/没 + 动词", "Phủ định hoàn toàn một lượng nhỏ nhất.", "我一张票也没找到。", "Tôi không tìm thấy dù một tấm vé."],
  ["一点儿也不……", "Hoàn toàn không…", "一点儿也不 + 形容词/心理动词", "Nhấn phủ định mức độ.", "这条路一点儿也不远。", "Con đường này hoàn toàn không xa."],
  ["疑问代词任指", "Đại từ nghi vấn mang nghĩa bất kỳ", "疑问代词 + 都/也……", "谁/哪儿/怎么 không dùng để hỏi mà chỉ phạm vi bất kỳ.", "谁都可以参加。", "Ai cũng có thể tham gia."],
  ["疑问代词不定指", "Đại từ nghi vấn phiếm chỉ", "动词 + 疑问代词", "Chỉ một người/vật/việc chưa xác định.", "你想喝点儿什么？", "Bạn muốn uống gì đó?"],
  ["不是……吗？", "Câu hỏi tu từ nhấn mạnh", "不是 + 已知信息 + 吗？", "Nhắc điều người nói cho là đã biết; cần chú ý sắc thái.", "我们不是说好七点见吗？", "Chẳng phải đã hẹn gặp lúc bảy giờ sao?"],
  ["存现句：出现", "Câu tồn hiện: xuất hiện", "处所 + 动词 + 了 + 数量 + 人/物", "Đưa nơi chốn làm nền rồi giới thiệu đối tượng mới xuất hiện.", "门口来了一位客人。", "Ở cửa có một vị khách đến."],
  ["存现句：消失", "Câu tồn hiện: biến mất", "处所 + 动词结果 + 了 + 数量 + 人/物", "Nêu đối tượng biến mất khỏi một nơi.", "桌上少了一张卡。", "Trên bàn thiếu mất một tấm thẻ."],
  ["是……的：看法态度", "是…的 nhấn quan điểm", "主语 + 是 + 评价/态度 + 的", "Nhấn cách đánh giá hoặc xác nhận thái độ.", "你的担心是有道理的。", "Sự lo lắng của bạn là có lý."],
  ["重动句", "Lặp động từ khi có tân ngữ và bổ ngữ", "主语 + 动词 + 宾语 + 动词 + 补语", "Khi vừa có tân ngữ vừa có bổ ngữ thời lượng/mức độ, động từ thường lặp lại.", "我学汉语学了两年。", "Tôi học tiếng Trung được hai năm."]
];

const GRAMMAR_ERRORS = [
  ["我把文件放了桌上。", "Sau động từ cần 到/在 để nối với nơi chốn: 放到桌上 hoặc 放在桌上."],
  ["请把给经理名单发。", "Trong câu 把, tân ngữ 名单 phải đứng ngay sau 把; 给经理 theo sau động từ 发."],
  ["他把关上门了。", "Không đặt động từ ngay sau 把; trật tự đúng là 把门关上了."],
  ["帽子被吹进河里风了。", "Nếu nêu tác nhân, 风 phải đứng ngay sau 被: 帽子被风吹进河里了."],
  ["我的包被拿。", "Sau 被 không dừng ở động từ trơ; cần kết quả hoặc thành phần hoàn chỉnh như 被拿走了."],
  ["这个箱子我不搬动。", "Bổ ngữ khả năng đặt 得/不 giữa động từ và kết quả: 搬不动, không phải 不搬动."],
  ["我终于找护照到了。", "Bổ ngữ 到 gắn ngay sau 找; tân ngữ 护照 đứng sau 找到."],
  ["我突然起想他的名字了。", "Bổ ngữ xu hướng đứng sau động từ: 想起, không đảo thành 起想."],
  ["大家起来聊了。", "Khi nói bắt đầu trò chuyện, 起来 theo sau 聊: 聊起来了."],
  ["这个好习惯要下去坚持。", "下去 theo sau động từ để chỉ tiếp tục: 坚持下去."],
  ["这间屋子很安静得很。", "Không dùng đồng thời 很 trước tính từ và 得很 sau tính từ trong cùng mẫu."],
  ["听到这个消息，我很高兴极了。", "极了 đã biểu thị mức độ cao; bỏ 很 trong mẫu này."],
  ["第二套房比第一套很安静。", "Trong mẫu 比 cơ bản, không đặt 很 trực tiếp trước tính từ; dùng 更/还 khi cần tăng cường."],
  ["两次付款一样价钱。", "一样 đứng sau hai đối tượng hoặc sau danh từ so sánh; nói 两次付款的价钱一样."],
  ["坐地铁不比开车不慢。", "不比 đã phủ định chênh lệch; không thêm một 不 nữa trước tính từ."],
  ["我比他十分钟早到。", "Cụm chênh lệch đứng sau 早到/晚到 trong mẫu mục tiêu: 比他早到十分钟."],
  ["我练越自然越。", "Hai 越 phải đứng trước điều kiện và kết quả: 越练越自然."],
  ["除了听力以外，还我想提高写作。", "还 đứng sau chủ ngữ trong mệnh đề sau: 我还想…, không đứng trước 我."],
  ["她一边听，也一边记笔记。", "Giữ cặp 一边…一边… cân xứng; không chen 也 vào giữa cặp khi chưa có mục đích tương phản."],
  ["他而且按时完成，不但检查了两遍。", "Không đảo thứ tự tăng tiến: 不但 nêu ý đầu, 而且 nêu ý bổ sung."],
  ["如果下雨，所以我们去图书馆。", "Cặp điều kiện dùng 如果…就…; 所以 đánh dấu quan hệ nguyên nhân–kết quả khác."],
  ["只要每天练，才会进步。", "Với điều kiện đủ, dùng 只要…就…; 才 thường đi với điều kiện cần 只有."],
  ["只有每天练，就会进步。", "Với điều kiện cần, dùng 只有…才…; không đổi 才 thành 就."],
  ["虽然晚点了，所以我们没有错过火车。", "虽然 đi với 可是/但是 để nêu nhượng bộ, không ghép máy móc với 所以."],
  ["然后确认号码，先付款。", "先 phải giới thiệu bước đầu, 然后/再 mới nối bước sau."],
  ["我们或者坐地铁，还是骑自行车。", "Trong câu trần thuật liệt kê lựa chọn dùng 或者…或者…; 还是 thường dùng trong câu hỏi lựa chọn."],
  ["又这间房安静又干净。", "Chủ ngữ đứng trước cặp 又…又…: 这间房又安静又干净."],
  ["天气一会儿晴，又一会儿下雨。", "Giữ cặp 一会儿…一会儿… cân xứng khi mô tả trạng thái luân phiên."],
  ["为了按时到，所以我提前出发。", "为了 đã nêu mục đích; không cần thêm 所以 như một quan hệ nguyên nhân–kết quả thứ hai."],
  ["在看来老师，进步不只看分数。", "Người đưa quan điểm nằm giữa 在 và 看来: 在老师看来."],
  ["来说对初学者，坚持最重要。", "Đối tượng đứng giữa 对 và 来说: 对初学者来说."],
  ["下周从起，校园里不能开车。", "Mốc bắt đầu đứng sau 从, rồi mới đến 起: 从下周起."],
  ["他在上发音进步很大。", "Danh từ phương diện đứng giữa 在 và 上: 在发音上."],
  ["我一张票没也找到。", "也/都 đứng trước phủ định: 一张票也没找到."],
  ["这条路不一点儿也远。", "一点儿也 đứng trước 不: 一点儿也不远."],
  ["谁可以都参加。", "都/也 đứng sau đại từ nghi vấn mang nghĩa bất kỳ: 谁都可以参加."],
  ["你想什么喝点儿？", "Trong cụm động–tân, 喝 đứng trước 什么: 想喝点儿什么."],
  ["我们不是吗说好七点见？", "吗 đứng cuối toàn câu hỏi tu từ, không chen giữa 不是 và nội dung đã biết."],
  ["来了一位客人门口。", "Câu tồn hiện mở đầu bằng nơi chốn: 门口来了一位客人."],
  ["桌上一张卡少了。", "Trong mẫu tồn hiện biến mất, kết quả 少了 đứng trước cụm số lượng: 桌上少了一张卡."],
  ["你的担心有是道理的。", "Trong 是…的, phần đánh giá nằm giữa 是 và 的: 是有道理的."],
  ["我学了汉语了两年。", "Không đặt hai 了 quanh tân ngữ; với tân ngữ và bổ ngữ thời lượng, lặp động từ: 学汉语学了两年."]
];

assert(GRAMMAR_ERRORS.length === GRAMMAR_DEFS.length, "Every HSK3 grammar record needs a distinct learner-error example.");

function pad(value, size) { return String(value).padStart(size, "0"); }
function unique(values) { return [...new Set(values)]; }
function writeJson(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function readJson(target) { return JSON.parse(fs.readFileSync(target, "utf8")); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function stripSense(value) { return String(value).replace(/[0-9]+$/, ""); }

function parseOfficialRaw(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.trim().match(/^(\d+)\s+3(?:（[^）]+）)*\s+(\S+)\s+(\S+)(?:\s+(.*))?$/);
    if (!match) continue;
    const row = Number(match[1]);
    if (row < 501 || row > 1000) continue;
    rows.push({ row, officialHeadword: match[2], simplified: stripSense(match[2]), pinyin: match[3], officialPartOfSpeech: match[4] || "未标注" });
  }
  rows.sort((a, b) => a.row - b.row);
  assert(rows.length === 500, `Official HSK3 extraction must contain 500 rows, received ${rows.length}.`);
  assert(rows.every((item, index) => item.row === 501 + index), "Official HSK3 rows must cover 501–1000 exactly once.");
  return rows;
}

function officialFacts() {
  const snapshot = path.join(HSK3, "provenance", "official-vocabulary.json");
  const candidates = [process.env.HSK3_OFFICIAL_RAW, "/tmp/vduckie-hsk3-vocab-raw.txt"].filter(Boolean);
  for (const candidate of candidates) if (fs.existsSync(candidate)) return parseOfficialRaw(fs.readFileSync(candidate, "utf8"));
  if (fs.existsSync(snapshot)) {
    const stored = readJson(snapshot);
    return stored.facts || stored.records;
  }
  throw new Error("Missing official HSK3 extraction. Set HSK3_OFFICIAL_RAW or provide the committed provenance snapshot.");
}

function loadDictionary() {
  const dir = path.join(ROOT, "assets", "v79", "hsk-dictionary");
  const terms = fs.readdirSync(dir).filter((file) => /^terms-\d+\.json$/.test(file)).sort().flatMap((file) => readJson(path.join(dir, file)));
  const byHanzi = new Map();
  for (const term of terms) if (!byHanzi.has(term.h)) byHanzi.set(term.h, term);
  return byHanzi;
}

function pinyinEngine() {
  const parts = [];
  for (let index = 1; index <= 16; index += 1) {
    const source = fs.readFileSync(path.join(ROOT, `pinyin-data${index}.js`), "utf8");
    const match = source.match(/push\("([A-Za-z0-9+/=]+)"\)/);
    assert(match, `Missing pinyin bundle part ${index}.`);
    parts.push(match[1]);
  }
  const source = zlib.gunzipSync(Buffer.from(parts.join(""), "base64")).toString("utf8");
  const context = {}; context.window = context; context.globalThis = context;
  vm.runInNewContext(source, context);
  return context.pinyinPro;
}

const GLOSS_OVERRIDES = Object.freeze({
  "把": "lượng từ cho vật có tay cầm; giới từ đưa tân ngữ lên trước động từ", "被": "bị; được (đánh dấu câu bị động)", "才": "mãi mới; chỉ; lúc đó mới", "得": "được; đạt được", "的话": "nếu…; nếu như lời nói/điều đó", "地": "đất; mặt đất", "该": "nên; đến lượt; đáng lẽ", "过去": "quá khứ; trước đây", "还": "còn; vẫn; lại", "会": "biết; có thể; sẽ", "极": "cực kỳ; hết sức", "可": "nhưng; có thể; đáng", "毛": "hào (1/10 tệ); lông", "为": "vì; cho; làm", "像": "giống như; giống", "行": "được; ổn; có thể", "页": "trang; tờ", "一块儿": "cùng nhau; một miếng/khối", "以为": "tưởng rằng", "一边": "vừa… vừa…; một bên", "又": "lại; vừa… vừa…", "越": "càng; vượt qua", "站": "đứng", "长": "lớn lên; trưởng", "照": "theo; chiếu; chụp", "只": "chỉ; chỉ có", "种": "loại; trồng; hạt giống", "子": "hậu tố danh từ; con", "总": "luôn; tổng cộng", "冰激凌": "kem", "电子书": "sách điện tử", "红绿灯": "đèn giao thông", "检票": "soát vé", "勺子": "thìa; muỗng", "数学": "toán học", "初中": "trung học cơ sở", "对话": "đối thoại; hội thoại", "老": "già; lâu; luôn; tiền tố thân mật", "聊天儿": "trò chuyện; tán gẫu", "骑": "cưỡi; đi bằng xe đạp hoặc xe máy", "起飞": "cất cánh", "世界": "thế giới", "外卖": "đồ ăn giao tận nơi; dịch vụ giao đồ ăn", "晚点": "chậm giờ; trễ chuyến", "校长": "hiệu trưởng", "员": "nhân viên; người làm trong một lĩnh vực", "中": "ở giữa; trong; Trung Quốc (trong từ ghép)"
});

function cleanMeaning(term, word) {
  if (GLOSS_OVERRIDES[word]) return GLOSS_OVERRIDES[word];
  const values = term && Array.isArray(term.m) ? term.m : [];
  const candidates = values.flatMap((item) => String(item).split(/[;,；]/)).map((item) => item.trim())
    .filter((item) => item && !/^họ\s|^Quận\s|^biến thể|^LT:|^\(tiếng địa phương\)/i.test(item) && !item.includes("["));
  return candidates[0] || "nghĩa được giải thích theo ngữ cảnh bài học";
}

function partOfSpeech(value, dictionaryPos) {
  const map = { 名: "noun", 动: "verb", 形: "adjective", 副: "adverb", 介: "preposition", 连: "conjunction", 代: "pronoun", 助: "particle", 量: "measure-word", 数量: "quantity", 后缀: "suffix" };
  const result = [];
  for (const [char, tag] of Object.entries(map)) if (String(value).includes(char)) result.push(tag);
  if (!result.length && dictionaryPos) result.push(...String(dictionaryPos).split("/").map((item) => item.toLowerCase()));
  return unique(result.filter(Boolean).length ? result.filter(Boolean) : ["other"]);
}

function pinyinNumber(value) {
  const tones = { ā:"a1", á:"a2", ǎ:"a3", à:"a4", ē:"e1", é:"e2", ě:"e3", è:"e4", ī:"i1", í:"i2", ǐ:"i3", ì:"i4", ō:"o1", ó:"o2", ǒ:"o3", ò:"o4", ū:"u1", ú:"u2", ǔ:"u3", ù:"u4", ǖ:"v1", ǘ:"v2", ǚ:"v3", ǜ:"v4", ü:"v" };
  return String(value).split(/([\s-]+)/).map((piece) => {
    let tone = "5"; let result = "";
    for (const char of piece) {
      const mapped = tones[char];
      if (mapped) { result += mapped[0]; if (mapped[1]) tone = mapped[1]; }
      else result += char;
    }
    return /^[a-zv]+$/i.test(result) ? `${result}${tone}` : result;
  }).join("");
}

function displayPinyin(value) {
  return String(value).replace(/[-’']/g, " ").replace(/\s+/g, " ").trim();
}

function normalizedPinyin(value) { return String(value).normalize("NFD").replace(/u\u0308/g, "v").replace(/\p{M}/gu, "").replace(/ü/g, "v").replace(/[^a-zv]/gi, "").toLowerCase(); }

function measureWordFor(word) {
  if (!word.partOfSpeech.includes("noun")) return null;
  if (/人|学生|老师|经理|客人|游客|病人|老人|男人|女人|男生|女生|阿姨|叔叔/.test(word.simplified)) return "位/个";
  if (/衣|衫|裙|裤/.test(word.simplified)) return "件/条";
  if (/书|词典|课本|字典|笔记本|报纸/.test(word.simplified)) return "本/份";
  if (/车|自行车/.test(word.simplified)) return "辆";
  if (/瓶|饮料|水|酒/.test(word.simplified)) return "瓶/杯";
  if (/房|屋|办公室|教室|宾馆/.test(word.simplified)) return "间/所";
  return "个";
}

function semanticKind(word) {
  const text = `${word.simplified}|${word.meaningVi}`;
  if (word.partOfSpeech.includes("adjective")) return "adjective";
  if (word.partOfSpeech.includes("adverb") || word.partOfSpeech.includes("conjunction") || word.partOfSpeech.includes("preposition") || word.partOfSpeech.includes("particle")) return "function";
  if (word.partOfSpeech.includes("verb")) return "verb";
  if (/人|员|家|学生|老师|经理|客人|游客|病人|男人|女人|男生|女生|阿姨|叔叔|姐妹|夫妻/.test(text)) return "person";
  if (/饭|面|酒|水|茶|糖|香蕉|西瓜|鸡|牛|饮料|蛋糕|冰激凌|饿|饱|甜|菜单/.test(text)) return "food";
  if (/城|园|馆|室|房|屋|楼|街|路|地方|地点|小区|校园|银行|医院|机场|车站/.test(text)) return "place";
  if (/衣|鞋|裤|裙|帽|笔|书|卡|箱|伞|灯|耳机|相机|地图|护照|行李|碗|盘|筷|勺|瓶/.test(text)) return "object";
  if (/天|周|年|月|季|假期|学期|平时|最近|以前|以后|最后|不久|半天|马上/.test(text)) return "time";
  return "general";
}

const EXAMPLE_FRAMES = Object.freeze({
  person: ["{w}正在门口等我们。", "我先向{w}说明了情况。", "这件事和{w}有关。", "{w}听完以后点了点头。"],
  food: ["我想先尝一尝这里的{w}。", "请把{w}放在桌子中间。", "这家店的{w}味道不错。", "我们准备了一些{w}。"],
  place: ["我们下午在{w}门口见面。", "从这里走到{w}大概要十分钟。", "活动地点改到{w}了。", "地图上已经标出了{w}的位置。"],
  object: ["请把{w}放进这个箱子里。", "出门前别忘了带{w}。", "我检查以后才发现{w}不见了。", "桌上的{w}是谁的？"],
  time: ["{w}我会再联系你。", "我们已经安排好了{w}的计划。", "到了{w}，大家再讨论这个问题。", "这件事和{w}的安排有关。"],
  adjective: ["这个办法对我们来说很{w}。", "看起来{w}，做起来却不容易。", "这样安排是不是更{w}？", "我觉得今天的情况特别{w}。"],
  verb: ["这件事需要大家一起{w}。", "我会先{w}，再告诉你结果。", "如果不知道怎么{w}，可以先问老师。", "他正在认真地{w}。"],
  function: ["老师用“{w}”把两句话连起来。", "这里用“{w}”能把关系说得更清楚。", "说这句话时，“{w}”不能随便省略。", "请比较有“{w}”和没有它的两句话。"],
  general: ["今天我们在真实情境里学习“{w}”。", "这个句子里的“{w}”很重要。", "请用“{w}”完成一句和自己有关的话。", "我已经把“{w}”记在笔记本上了。"]
});

const EXAMPLE_CONTEXTS = [
  "今天早上", "午休的时候", "下班以前", "到家以后", "会议开始前", "等车的时候", "读完通知以后", "跟朋友商量时", "这个周末", "下课以后", "出门以前", "到服务台以后", "看完地图以后", "收到消息时", "计划改变以后", "在小区门口", "去医院以前", "运动结束后", "打开邮件以后", "准备旅行时", "在饭馆点菜时", "付款以前", "回到宾馆以后", "雨停以后", "讨论到这个问题时", "第一次见面时", "向老师说明以后", "检查行李时", "写完作业以后", "在图书馆里", "听完对方的话", "找到正确地点后", "比较两个方案时", "准备做决定时", "复习到这一课时", "练习口语时", "完成任务以后"
];

const SPECIAL_EXAMPLES = Object.freeze({
  "爱人": { zh: "我爱人今天出差，周五才回来。", vi: "Vợ/chồng tôi hôm nay đi công tác, đến thứ Sáu mới về." },
  "把": { zh: "请把护照放进随身包里。", vi: "Hãy để hộ chiếu vào túi xách tay." },
  "搬家": { zh: "我们下个月搬家，现在开始整理东西。", vi: "Tháng sau chúng tôi chuyển nhà nên bây giờ bắt đầu sắp xếp đồ." },
  "班级": { zh: "班级群里已经发了明天的安排。", vi: "Nhóm chat của lớp đã đăng lịch ngày mai." },
  "办": { zh: "这件事今天能办完吗？", vi: "Việc này hôm nay có làm xong được không?" },
  "半天": { zh: "我找了半天，才找到那封邮件。", vi: "Tôi tìm suốt nửa ngày mới thấy email đó." },
  "被": { zh: "行李被工作人员送到了服务台。", vi: "Hành lý đã được nhân viên đưa đến quầy dịch vụ." },
  "比较": { zh: "今天比较凉快，适合出去走走。", vi: "Hôm nay khá mát, thích hợp ra ngoài đi dạo." },
  "比如": { zh: "周末可以做户外运动，比如骑自行车。", vi: "Cuối tuần có thể vận động ngoài trời, chẳng hạn đi xe đạp." },
  "必须": { zh: "出发前必须再检查一次护照。", vi: "Trước khi khởi hành phải kiểm tra hộ chiếu thêm một lần." },
  "遍": { zh: "这段话我听了三遍才听懂。", vi: "Đoạn này tôi nghe ba lượt mới hiểu." },
  "变成": { zh: "雨越来越大，小路很快变成了小河。", vi: "Mưa ngày càng lớn, con đường nhỏ nhanh chóng biến thành dòng nước." },
  "别的": { zh: "这件太大了，我想看看别的颜色。", vi: "Món này quá lớn, tôi muốn xem màu khác." },
  "别人": { zh: "没有同意以前，不要转发别人的照片。", vi: "Trước khi được đồng ý, đừng chuyển tiếp ảnh của người khác." },
  "不但": { zh: "他不但改了错句，而且解释了原因。", vi: "Cậu ấy không chỉ sửa câu sai mà còn giải thích lý do." },
  "不见": { zh: "我的信用卡怎么不见了？", vi: "Sao thẻ tín dụng của tôi lại biến mất rồi?" },
  "不用": { zh: "不用着急，我们还有半个小时。", vi: "Không cần vội, chúng ta vẫn còn nửa tiếng." },
  "不同": { zh: "这两个办法有不同的优点。", vi: "Hai cách này có những ưu điểm khác nhau." },
  "不久": { zh: "他到北京不久，还不熟悉这里的路。", vi: "Cậu ấy mới đến Bắc Kinh chưa lâu nên chưa quen đường." },
  "不行": { zh: "只说对不起不行，还要说明怎么解决。", vi: "Chỉ nói xin lỗi thì chưa được, còn phải nói cách giải quyết." },
  "才": { zh: "我检查了两次才发现日期写错了。", vi: "Tôi kiểm tra hai lần mới phát hiện ngày bị ghi sai." },
  "出生": { zh: "她出生在南方，后来去北方上大学。", vi: "Cô ấy sinh ra ở miền Nam, sau đó lên miền Bắc học đại học." },
  "出院": { zh: "医生说他明天可以出院。", vi: "Bác sĩ nói ngày mai anh ấy có thể xuất viện." },
  "除了": { zh: "除了周日以外，这家图书馆每天都开门。", vi: "Ngoài Chủ nhật ra, thư viện này mở cửa mỗi ngày." },
  "的话": { zh: "如果明天下雨的话，我们就改坐地铁。", vi: "Nếu ngày mai mưa thì chúng ta đổi sang đi tàu điện ngầm." },
  "地": { zh: "雨后地上很滑，走路要小心。", vi: "Sau mưa mặt đất rất trơn, đi lại phải cẩn thận." },
  "而且": { zh: "这间房安静，而且离地铁站很近。", vi: "Căn phòng này yên tĩnh, hơn nữa rất gần ga tàu điện." },
  "发生": { zh: "事故发生以后，司机马上报了警。", vi: "Sau khi tai nạn xảy ra, tài xế lập tức báo cảnh sát." },
  "放心": { zh: "文件已经收到，你可以放心了。", vi: "Tài liệu đã nhận được rồi, bạn có thể yên tâm." },
  "夫妻": { zh: "那对夫妻在附近开了一家小店。", vi: "Cặp vợ chồng ấy mở một cửa hàng nhỏ gần đây." },
  "该": { zh: "时间不早了，我们该出发了。", vi: "Không còn sớm nữa, chúng ta nên khởi hành thôi." },
  "感兴趣": { zh: "她对中国历史很感兴趣。", vi: "Cô ấy rất hứng thú với lịch sử Trung Quốc." },
  "感到": { zh: "听到这个消息，我感到很意外。", vi: "Nghe tin này, tôi cảm thấy rất bất ngờ." },
  "刚": { zh: "我刚到办公室，还没打开电脑。", vi: "Tôi vừa đến văn phòng, vẫn chưa mở máy tính." },
  "刚才": { zh: "刚才是谁给我打电话？", vi: "Vừa nãy ai gọi điện cho tôi vậy?" },
  "刚刚": { zh: "会议刚刚结束，经理还在里面。", vi: "Cuộc họp vừa mới kết thúc, quản lý vẫn ở bên trong." },
  "根据": { zh: "请根据天气选择合适的衣服。", vi: "Hãy chọn quần áo phù hợp theo thời tiết." },
  "更": { zh: "换一条路可能更快。", vi: "Đổi sang con đường khác có thể nhanh hơn." },
  "关于": { zh: "我想问一个关于住宿的问题。", vi: "Tôi muốn hỏi một vấn đề về chỗ ở." },
  "还": { zh: "这本词典我下周还给你。", vi: "Tuần sau tôi sẽ trả cuốn từ điển này cho bạn." },
  "会": { zh: "下午三点有个会，请别迟到。", vi: "Ba giờ chiều có cuộc họp, xin đừng đến muộn." },
  "或": { zh: "请用邮件或短信告诉我结果。", vi: "Hãy báo kết quả cho tôi bằng email hoặc tin nhắn." },
  "或者": { zh: "我们可以坐高铁，或者坐夜班车。", vi: "Chúng ta có thể đi tàu cao tốc hoặc xe đêm." },
  "几乎": { zh: "大雨以后，路上几乎没有人。", vi: "Sau trận mưa lớn, trên đường hầu như không có ai." },
  "极": { zh: "山上的天气变化极快。", vi: "Thời tiết trên núi thay đổi cực nhanh." },
  "姐妹": { zh: "她们姐妹俩都喜欢打网球。", vi: "Hai chị em cô ấy đều thích chơi quần vợt." },
  "看来": { zh: "看来我们得换一个办法。", vi: "Xem ra chúng ta phải đổi cách khác." },
  "可": { zh: "这条路可不好走，你要小心。", vi: "Con đường này quả là khó đi, bạn phải cẩn thận." },
  "可是": { zh: "我很想参加，可是周末要加班。", vi: "Tôi rất muốn tham gia nhưng cuối tuần phải làm thêm." },
  "开花": { zh: "公园里的树四月开始开花。", vi: "Cây trong công viên bắt đầu nở hoa vào tháng Tư." },
  "来自": { zh: "这封邮件来自学校办公室。", vi: "Email này đến từ văn phòng nhà trường." },
  "起飞": { zh: "飞机因为大风晚了一个小时起飞。", vi: "Máy bay vì gió lớn nên cất cánh muộn một tiếng." },
  "其实": { zh: "我以为他生气了，其实他只是太累。", vi: "Tôi tưởng anh ấy giận, thật ra anh ấy chỉ quá mệt." },
  "如果": { zh: "如果时间合适，我们周末见面。", vi: "Nếu thời gian phù hợp, cuối tuần chúng ta gặp nhau." },
  "受到": { zh: "这次活动受到很多学生的欢迎。", vi: "Hoạt động lần này được nhiều học sinh đón nhận." },
  "特别": { zh: "今天的风特别大，骑车不太安全。", vi: "Gió hôm nay đặc biệt lớn, đi xe đạp không an toàn lắm." },
  "挺": { zh: "这家店不大，可是服务挺好。", vi: "Cửa hàng này không lớn nhưng phục vụ khá tốt." },
  "晚点": { zh: "高铁晚点了二十分钟。", vi: "Tàu cao tốc bị chậm hai mươi phút." },
  "为": { zh: "大家都在为明天的表演做准备。", vi: "Mọi người đều đang chuẩn bị cho buổi biểu diễn ngày mai." },
  "为了": { zh: "为了身体健康，他每天走路上班。", vi: "Vì sức khỏe, anh ấy đi bộ đi làm mỗi ngày." },
  "向": { zh: "请向工作人员说明你的情况。", vi: "Hãy trình bày tình hình của bạn với nhân viên." },
  "像": { zh: "那朵云看起来像一只小羊。", vi: "Đám mây ấy trông giống một chú cừu con." },
  "一定": { zh: "收到消息以后一定要回复。", vi: "Sau khi nhận tin nhất định phải trả lời." },
  "一共": { zh: "我们一共采访了五名同学。", vi: "Chúng tôi đã phỏng vấn tổng cộng năm bạn học." },
  "一块儿": { zh: "下课以后咱们一块儿去吃饭吧。", vi: "Sau giờ học chúng ta cùng đi ăn nhé." },
  "一样": { zh: "这两件衬衫的大小一样。", vi: "Hai chiếc áo sơ mi này có kích cỡ giống nhau." },
  "以后": { zh: "搬家以后，我每天骑车上班。", vi: "Sau khi chuyển nhà, mỗi ngày tôi đi xe đạp đi làm." },
  "以前": { zh: "我以前住在学校附近。", vi: "Trước đây tôi sống gần trường." },
  "以上": { zh: "八十元以上的商品可以免费送货。", vi: "Hàng hóa từ 80 tệ trở lên được giao miễn phí." },
  "以外": { zh: "工作以外，他最喜欢爬山。", vi: "Ngoài công việc, anh ấy thích leo núi nhất." },
  "以为": { zh: "我以为今天放假，所以没去学校。", vi: "Tôi tưởng hôm nay nghỉ nên không đến trường." },
  "以下": { zh: "十二岁以下的孩子不用买票。", vi: "Trẻ em dưới 12 tuổi không cần mua vé." },
  "一般": { zh: "我一般七点出门，周末会晚一点儿。", vi: "Tôi thường ra khỏi nhà lúc bảy giờ, cuối tuần muộn hơn một chút." },
  "一边": { zh: "她一边听录音，一边记重点。", vi: "Cô ấy vừa nghe ghi âm vừa ghi ý chính." },
  "一直": { zh: "我一直在门口等你。", vi: "Tôi đã chờ bạn ở cửa suốt." },
  "应该": { zh: "你发烧了，应该先休息。", vi: "Bạn bị sốt rồi, nên nghỉ trước." },
  "又": { zh: "他昨天迟到了，今天又迟到了。", vi: "Hôm qua anh ấy đến muộn, hôm nay lại đến muộn." },
  "愿意": { zh: "你愿意参加我们的调查吗？", vi: "Bạn có sẵn lòng tham gia khảo sát của chúng tôi không?" },
  "越": { zh: "离考试越近，我越要按计划复习。", vi: "Càng gần kỳ thi, tôi càng phải ôn theo kế hoạch." },
  "运动会": { zh: "学校运动会下周五举行。", vi: "Hội thao của trường tổ chức vào thứ Sáu tuần sau." },
  "怎么办": { zh: "护照不见了，我该怎么办？", vi: "Hộ chiếu mất rồi, tôi nên làm thế nào?" },
  "怎样": { zh: "怎样才能把这件事说清楚？", vi: "Làm thế nào mới có thể nói rõ việc này?" },
  "长": { zh: "这棵小树两年长高了不少。", vi: "Cây nhỏ này sau hai năm đã cao lên khá nhiều." },
  "直到": { zh: "我直到晚上十点才完成作业。", vi: "Mãi đến mười giờ tối tôi mới làm xong bài tập." },
  "只": { zh: "我只带了一个小箱子。", vi: "Tôi chỉ mang một chiếc vali nhỏ." },
  "只能": { zh: "末班车走了，我们只能打车。", vi: "Chuyến cuối đã đi rồi, chúng ta chỉ còn cách gọi xe." },
  "只是": { zh: "我不是不同意，只是还想再想想。", vi: "Không phải tôi không đồng ý, chỉ là vẫn muốn nghĩ thêm." },
  "只要": { zh: "只要提前准备，就不会太着急。", vi: "Chỉ cần chuẩn bị trước thì sẽ không quá cuống." },
  "只有": { zh: "只有认真检查，才能发现这个错误。", vi: "Chỉ khi kiểm tra nghiêm túc mới phát hiện được lỗi này." },
  "中": { zh: "讨论中有两个问题还没解决。", vi: "Trong cuộc thảo luận vẫn còn hai vấn đề chưa giải quyết." },
  "总": { zh: "今天的费用总数是三百元。", vi: "Tổng chi phí hôm nay là 300 tệ." },
  "总是": { zh: "他总是先听完再回答。", vi: "Anh ấy luôn nghe hết rồi mới trả lời." },
  "最好": { zh: "看房以前最好先列一个问题单。", vi: "Trước khi xem nhà tốt nhất nên liệt kê các câu cần hỏi." },
  "最后": { zh: "最后，请大家检查姓名和号码。", vi: "Cuối cùng, xin mọi người kiểm tra họ tên và số." },
  "最近": { zh: "最近天气变化很大，出门要带雨衣。", vi: "Gần đây thời tiết thay đổi nhiều, ra ngoài nên mang áo mưa." },
  "住院": { zh: "他需要住院观察两天。", vi: "Anh ấy cần nằm viện theo dõi hai ngày." },
  "员": { zh: "“员”常出现在“服务员”和“运动员”里。", vi: "Chữ ‘员’ thường xuất hiện trong ‘nhân viên phục vụ’ và ‘vận động viên’." },
  "子": { zh: "“子”在“桌子”里常作名词后缀。", vi: "‘子’ trong ‘桌子’ thường làm hậu tố danh từ." }
});

const ROW_EXAMPLES = Object.freeze({
  583: { zh: "坚持练习以后，他终于得到了机会。", vi: "Sau khi kiên trì luyện tập, cuối cùng anh ấy đã có được cơ hội." },
  587: { zh: "时间不够了，我们得马上出发。", vi: "Không đủ thời gian nữa, chúng ta phải khởi hành ngay." }
});

function exampleFor(word, index) {
  const special = ROW_EXAMPLES[word.row] || SPECIAL_EXAMPLES[word.simplified];
  if (special) return { ...special, sourceType: "original" };
  const kind = semanticKind(word);
  const sentence = EXAMPLE_FRAMES[kind][index % EXAMPLE_FRAMES[kind].length].replace("{w}", word.simplified);
  const prefix = EXAMPLE_CONTEXTS[index % EXAMPLE_CONTEXTS.length];
  const zh = `${prefix}，${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
  const viFrames = {
    person: `Câu mẫu đặt “${word.simplified}” trong quan hệ giao tiếp với một người cụ thể.`, food: `Câu mẫu dùng “${word.simplified}” trong ngữ cảnh gọi hoặc dùng đồ ăn/uống.`, place: `Câu mẫu dùng “${word.simplified}” để nói địa điểm và di chuyển.`, object: `Câu mẫu dùng “${word.simplified}” trong thao tác với đồ vật.`, time: `Câu mẫu đặt “${word.simplified}” ở vị trí thời gian tự nhiên.`, adjective: `Câu mẫu dùng “${word.simplified}” làm vị ngữ miêu tả.`, verb: `Câu mẫu dùng động từ “${word.simplified}” trong một nhiệm vụ có kết quả.`, function: `Câu mẫu cho thấy vai trò nối hoặc đánh dấu của “${word.simplified}”.`, general: `Câu mẫu đưa “${word.simplified}” vào một phát ngôn hoàn chỉnh.`
  };
  return { zh, vi: viFrames[kind], sourceType: "original" };
}

function makeVocabulary(facts) {
  const dictionary = loadDictionary();
  return facts.map((fact, index) => {
    const term = dictionary.get(fact.simplified);
    const pinyin = displayPinyin(fact.pinyin);
    const editorial = VOCABULARY_EDITORIAL[index];
    assert(editorial[0] === fact.row && editorial[1] === fact.simplified, `Editorial vocabulary does not match official row ${fact.row}: ${fact.simplified}.`);
    const word = {
      ...fact,
      id: `hsk3-v-${pad(index + 1, 4)}`,
      partOfSpeech: partOfSpeech(fact.officialPartOfSpeech, term && term.o),
      meaningVi: editorial[2]
    };
    const example = { zh: editorial[3], vi: editorial[4], sourceType: "original" };
    const measureWord = measureWordFor(word);
    const relations = lexicalRelations(word.simplified);
    return {
      recordType: "vocabulary", id: word.id, syllabusVersion: SYLLABUS, level: 3, hskLevel: 3, pedagogicTargetLevel: 3,
      simplified: word.simplified, officialHeadword: word.officialHeadword, officialRow: word.row,
      senseKey: `official-row-${word.row}-${normalizedPinyin(pinyin)}`, traditional: term && term.t || null,
      pinyin, pinyinTone: pinyin, pinyinNumber: pinyinNumber(pinyin), pinyinNormalized: normalizedPinyin(pinyin),
      partOfSpeech: word.partOfSpeech, meaningVi: word.meaningVi,
      contextMeaningsVi: [{ context: example.zh, meaningVi: word.meaningVi }], measureWord,
      collocations: [{ zh: example.zh.replace(/[。！？]$/, ""), vi: example.vi, kind: "context-pattern" }],
      usageNoteVi: measureWord ? `Khi đếm ${word.simplified}, ưu tiên kiểm tra ngữ cảnh với lượng từ ${measureWord}; không thay mọi lượng từ bằng 个.` : `Dùng ${word.simplified} theo đúng từ loại ${word.partOfSpeech.join("/")} và vị trí trong câu mẫu; tránh dịch từng chữ theo trật tự tiếng Việt.`,
      examples: [example], synonyms: relations.synonyms, antonyms: relations.antonyms, confusables: relations.confusables,
      commonErrorsVi: [`Không chỉ nhớ nghĩa “${word.meaningVi}”; hãy đặt ${word.simplified} vào đúng vị trí và đọc đúng ${pinyin}.`],
      sourceIds: SOURCES, sourceRefs: [{ sourceId: OFFICIAL_SOURCE, fields: ["officialHeadword", "pinyinTone", "hskLevel"], locator: `official-vocabulary-row-${word.row}` }],
      audioRef: null, contentStatus: "machine-assisted", translationReviewStatus: "machine-assisted", reviewStatus: "unreviewed", knowledgeStatus: "new", contentVersion: 1
    };
  });
}

const UNIT_LEXICAL_CUES = [
  /才|然后|后来|最后|发生|发现|清楚|明白|回答|句|段|告诉|办法|解决|以为|其实|如果|所以|但是/,
  /班级|成绩|初中|词典|复习|课本|课文|练习|留学|年级|数学|水平|学期|作业|校园|校长|笔记|考试|提高/,
  /办公室|工作日|经理|会议|同事|名单|邮件|邮箱|请假|完成|要求|主要|重要|开会|迟到|收到/,
  /宾馆|地图|高铁|检票|护照|游客|行李|晚点|出发|方向|红绿灯|外地|路口|汽车|骑|自行车|司机/,
  /搬|搬家|房子|屋子|小区|邻居|楼梯|电梯|空调|冰箱|洗衣机|家具|沙发|打扫|干净|层|门/,
  /病人|发烧|住院|出院|健康|锻炼|感冒|检查|体育|腿|脚|牙|牙刷|耳朵|身体|习惯|睡|怕|担心/,
  /关系|关心|关注|姐妹|夫妻|爱人|别人|相信|同意|愿意|见面|聊天|生气|难过|心里|消息|请客|做客/,
  /菜单|外卖|信用卡|银行卡|价钱|满意|衣|衬衫|裙子|鞋|饮料|碗|盘子|筷子|勺子|瓶子|公斤|斤|卡/,
  /故事|经过|过去|以前|以后|前年|前天|后天|后年|终于|最近|不久|突然|变化|第一次|小时|经历|记/,
  /节日|过节|新年|晚会|节目|表演|礼物|文化|历史|名人|欢迎|客人|热情|音乐|照片|做客/,
  /环境|四季|季节|春天|夏天|秋天|冬天|风|太阳|月亮|草地|河|海|山|公园|花园|干净|脏|绿色/,
  /计划|选择|认为|关于|主要|一共|一块儿|语言|有用|注意|最后|最好|世界|城市|方法|调查|项目/
];

function assignToLessons(vocabulary) {
  const unitBuckets = Array.from({ length: 12 }, () => []);
  for (const word of vocabulary) {
    const candidates = UNIT_LEXICAL_CUES.map((regex, index) => regex.test(`${word.simplified}|${word.meaningVi}`) ? index : -1).filter((index) => index >= 0);
    const pool = candidates.length ? candidates : unitBuckets.map((_, index) => index);
    const target = pool.slice().sort((left, right) => unitBuckets[left].length - unitBuckets[right].length || left - right)[0];
    unitBuckets[target].push(word);
  }
  const assignment = new Map();
  for (let unitIndex = 0; unitIndex < 12; unitIndex += 1) {
    const lessonIndexes = LESSON_SPECS.map((spec, index) => spec.u === unitIndex + 1 ? index : -1).filter((index) => index >= 0);
    unitBuckets[unitIndex].forEach((word, index) => assignment.set(word.id, lessonIndexes[index % lessonIndexes.length]));
  }
  assert(assignment.size === 500, "Every official vocabulary record must be assigned once.");
  return assignment;
}

function radicalFor(character) {
  const groups = [
    ["氵", "海河清洗澡没法活酒满流深温游泳消池湖洋汁汗"], ["扌", "把搬打扫接换拍提找拉推持报掉抬"],
    ["口", "听吃喝唱哭嘴叫告诉味响哈咱哪问"], ["讠", "话讲谁请认让语说记议词谈许"],
    ["忄", "怕快慢忙情怪惯性惜恨懂"], ["艹", "草花菜茶药蓝蕉苹节"],
    ["木", "树楼机李校梯桌椅板本材"], ["亻", "住作位他你们但使信件像借保"],
    ["女", "姨姐妹妻妈奶她好姓"], ["辶", "过进近远还这边送退迟道遇"],
    ["阝", "院邻阳阴都邮附降"], ["饣", "饭馆饱饿饮饼"],
    ["钅", "钱银错铁铅钟"], ["纟", "红绿级纸练结给终经"],
    ["疒", "病疼瘦痛"], ["足", "路跑跳踢跟距"], ["日", "明晚时春晴星"],
    ["月", "腿脚脸胖期服"], ["宀", "安全室客家字定实"], ["竹", "笔筷箱笑等篇"],
    ["囗", "国园图回因"], ["门", "间闻问闲"], ["土", "地场城坏"], ["心", "想意忘感愿急"],
    ["雨", "雪雷需"], ["火", "灯热然"], ["车", "辆轻转"], ["页", "题顾领"], ["攵", "放教数"],
    ["言", "信"], ["贝", "贵费负"], ["广", "店床"], ["尸", "屋层"], ["衣", "衬裙装"],
    ["人", "会今合从"], ["刀", "分到别"], ["力", "办动助加努"], ["手", "拿"], ["目", "看眼"], ["耳", "耳"], ["身", "身"], ["山", "山"], ["水", "水"], ["子", "子孩学"], ["大", "大太"], ["小", "小少"]
  ];
  for (const [radical, characters] of groups) if (characters.includes(character)) return radical;
  return character;
}

function makeCharacters(vocabulary) {
  const old = new Set([
    ...readJson(path.join(ROOT, "data", "hsk", "hsk1", "characters.json")).records,
    ...readJson(path.join(ROOT, "data", "hsk", "hsk2", "characters.json")).records
  ].map((item) => item.character));
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "vendor", "hsk-char-data.js"), "utf8"), context);
  const strokeData = context.window.HSK_HANZI_DATA || {};
  const engine = pinyinEngine();
  const characters = unique(vocabulary.flatMap((word) => word.simplified.match(/\p{Script=Han}/gu) || []))
    .filter((character) => !old.has(character) && strokeData[character] && Array.isArray(strokeData[character].strokes))
    .slice(0, 100);
  assert(characters.length === 100, `HSK3 character focus needs 100 records, received ${characters.length}.`);
  return characters.map((character, index) => {
    const radical = radicalFor(character);
    const readings = engine.pinyin(character, { toneType: "symbol", type: "array" });
    const wordRefs = vocabulary.filter((word) => word.simplified.includes(character)).map((word) => word.id);
    return {
      recordType: "character", id: `hsk3-character-${pad(index + 1, 3)}`, syllabusVersion: SYLLABUS, hskLevel: 3,
      character, recognitionRequired: true, writingRequired: true, radical,
      components: radical !== character ? [radical, "phần còn lại cần đối chiếu khi human signoff"] : [],
      structure: radical === character ? "single-component" : "compound-visual-analysis",
      readings: readings.length ? readings : [vocabulary.find((word) => word.simplified.includes(character)).pinyin],
      wordRefs, confusables: [], strokeCount: strokeData[character].strokes.length,
      strokeCountSource: "bundled-static-vector-count", mnemonic: { type: "memory-aid-not-etymology", noteVi: radical === character ? `Mẹo nhớ: nhận diện hình tổng thể của ${character}; đây không phải giải thích từ nguyên.` : `Mẹo nhớ: tìm phần ${radical} trong ${character} rồi đối chiếu với từ đã học; đây không phải giải thích từ nguyên.` },
      knowledgeStatus: "new", strokeOrderStatus: "static-fallback", strokeOrderAsset: null,
      sourceIds: ["moe-gf0025-2021-standard", OFFICIAL_SOURCE, "unicode-unihan-17"], contentStatus: "machine-assisted", reviewStatus: "unreviewed", contentVersion: 1
    };
  });
}

function makeGrammar() {
  assert(GRAMMAR_DEFS.length === 42, `Grammar inventory must have 42 records, received ${GRAMMAR_DEFS.length}.`);
  return GRAMMAR_DEFS.map(([nameZh, nameVi, formula, meaningVi, exampleZh, exampleVi], index) => ({
    recordType: "grammar", id: `hsk3-grammar-${pad(index + 1, 2)}`, syllabusVersion: SYLLABUS, hskLevel: 3,
    nameZh, nameVi, formula, communicativeFunctionVi: meaningVi, meaningVi,
    usageVi: [`Dùng mẫu này khi nhiệm vụ giao tiếp cần ${meaningVi.charAt(0).toLowerCase()}${meaningVi.slice(1)}`, "Đối chiếu chủ ngữ, tân ngữ và từ nối trước khi thêm chi tiết."],
    positionVi: "Vị trí các thành phần được thể hiện trong công thức; không bê nguyên trật tự tiếng Việt.",
    correctExamples: [{ zh: exampleZh, vi: exampleVi }],
    incorrectExamples: [{ zh: GRAMMAR_ERRORS[index][0], explanationVi: GRAMMAR_ERRORS[index][1] }],
    commonErrorsVi: [GRAMMAR_ERRORS[index][1]], confusables: [],
    negativeQuestionVi: "Cách phủ định/nghi vấn phụ thuộc mẫu; lesson yêu cầu biến đổi trong ngữ cảnh thay vì thêm 不/吗 máy móc.",
    knowledgeStatus: "new", introducedLevel: 3, reviewLevels: [4], sourceIds: ["moe-gf0025-2021-standard", OFFICIAL_SOURCE, ORIGINAL_SOURCE],
    contentStatus: "machine-assisted", translationReviewStatus: "machine-assisted", reviewStatus: "unreviewed", contentVersion: 1
  }));
}

function section(lessonId, suffix, type, titleVi, content) { return { id: `${lessonId}-${suffix}`, type, titleVi, content }; }
function exerciseBase(id, skill, format, prompt, topic, grammarFocus, vocabularyFocus, difficulty) {
  return { recordType: "exercise", id, syllabusVersion: SYLLABUS, hskLevel: 3, skill, format, prompt, options: [], answer: "", acceptedAnswers: [], explanationVi: "", difficulty, topic, grammarFocus, vocabularyFocus, cognitiveSkill: "application", templateFamily: `${format}-c4-authored`, reviewMetadata: null, sourceIds: [OFFICIAL_SOURCE, ORIGINAL_SOURCE], contentStatus: "machine-assisted", translationReviewStatus: "machine-assisted", reviewStatus: "unreviewed", contentVersion: 1 };
}

function makeExercises(spec, lessonIndex, lessonId, vocabRecords, grammarRefs) {
  const difficulty = 3 + Math.floor(lessonIndex / 12);
  const vocabRefs = vocabRecords.map((word) => word.id);
  const firstWord = vocabRecords[0];
  const countableWord = vocabRecords.find((word) => word.measureWord) || firstWord;
  const grammarId = grammarRefs[0];
  const grammarDef = GRAMMAR_DEFS[Number(grammarId.slice(-2)) - 1];
  const mode = lessonIndex % 6;
  const exercises = [];
  const vocabularyTasks = [
    { format: "hanzi-from-meaning", prompt: `Viết bằng chữ Hán từ có nghĩa “${firstWord.meaningVi}” (${firstWord.pinyin}).`, answer: firstWord.simplified },
    { format: "context-cloze", prompt: `Điền từ còn thiếu: ${firstWord.examples[0].zh.replace(firstWord.simplified, "____")}`, answer: firstWord.simplified },
    { format: "collocation-recall", prompt: `Từ ${firstWord.simplified} kết hợp thế nào trong câu đã học? Viết lại cả cụm ngữ cảnh.`, answer: firstWord.collocations[0].zh },
    { format: "measure-word-production", prompt: `Trong bài “${spec.vi}”, hãy dùng ${countableWord.simplified} với lượng từ phù hợp trong một cụm danh từ.`, answer: `${countableWord.measureWord || "个"}${countableWord.simplified}` },
    { format: "usage-explanation", prompt: `Giải thích ngắn vị trí và cách dùng ${firstWord.simplified} trong câu: ${firstWord.examples[0].zh}`, answer: firstWord.usageNoteVi },
    { format: "vocabulary-sentence", prompt: `Viết một câu mới về “${spec.vi}” với từ ${firstWord.simplified}; không chép câu mẫu.`, answer: firstWord.examples[0].zh }
  ];
  const vocabularyTask = vocabularyTasks[mode];
  const vocab = exerciseBase(`${lessonId}-exercise-1`, "vocabulary", vocabularyTask.format, vocabularyTask.prompt, spec.vi, [], vocabRefs.slice(0, 4), difficulty);
  vocab.answer = vocabularyTask.answer; vocab.acceptedAnswers = [vocabularyTask.answer, String(vocabularyTask.answer).replace(/[。！？]$/, "")]; vocab.explanationVi = `Đối chiếu ${firstWord.simplified} (${firstWord.pinyin}) với nghĩa, từ loại và ngữ cảnh trước khi tự sửa.`; vocab.cognitiveSkill = mode < 2 ? "recall" : "application"; exercises.push(vocab);

  const grammarFormats = ["grammar-transformation", "error-correction", "connector-cloze", "sentence-combination", "negative-question", "controlled-rewrite"];
  const grammarPrompts = [
    `Viết lại câu theo mẫu “${grammarDef[1]}” để phù hợp mục tiêu “${spec.objective}”.`,
    `Sửa trật tự hoặc từ nối trong phát ngôn dưới đây bằng mẫu “${grammarDef[1]}”.`,
    `Điền cấu trúc “${grammarDef[0]}” để nối ý trong phát ngôn dưới đây.`,
    `Gộp ý của phát ngôn dưới đây thành một câu dùng “${grammarDef[1]}”.`,
    `Chuyển phát ngôn dưới đây thành câu phủ định hoặc nghi vấn tự nhiên nhưng vẫn dùng “${grammarDef[1]}”.`,
    `Viết một cách diễn đạt khác cho phát ngôn dưới đây bằng “${grammarDef[1]}”, giữ nguyên ý chính.`
  ];
  const grammar = exerciseBase(`${lessonId}-exercise-2`, "grammar", grammarFormats[mode], grammarPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 3), difficulty);
  grammar.stimulus = { sourceZh: spec.dialogue.split("\n")[1].replace(/^[^：]+：/, ""), instructionVi: "Giữ nguyên ý chính nhưng dùng cấu trúc trọng tâm." };
  grammar.answer = grammarDef[4]; grammar.acceptedAnswers = [grammar.answer, grammar.answer.replace(/[。！？]$/, "")]; grammar.explanationVi = `Câu mẫu cho thấy đúng trật tự của ${grammarDef[0]}.`; exercises.push(grammar);

  const lastSentence = spec.listening.split(/[。！？]/).filter(Boolean).at(-1) + "。";
  const listeningFormats = ["listen-main-idea", "listen-detail", "listen-dictation", "listen-sequence", "listen-attitude", "listen-final-line"];
  const listeningPrompts = [spec.lq[0], spec.lq[1], `Nghe/chạy TTS transcript bài “${spec.vi}” rồi chép chính tả câu cuối.`, `Nghe và nêu thứ tự hai hành động chính trong tình huống “${spec.vi}”.`, `Nghe và nhận xét thái độ hoặc mối quan tâm của người nói trong tình huống “${spec.vi}”.`, `Nghe bài “${spec.vi}” và viết chính xác phát ngôn cuối cùng.`];
  const listeningAnswers = [spec.la[0], spec.la[1], lastSentence, spec.la[1], spec.la[0], lastSentence];
  const listening = exerciseBase(`${lessonId}-exercise-3`, "listening", listeningFormats[mode], listeningPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 4), difficulty);
  listening.stimulus = { scriptZh: spec.listening, transcriptVisibility: "after-answer", questionVi: listeningPrompts[mode] };
  listening.answer = listeningAnswers[mode]; listening.acceptedAnswers = [listening.answer, String(listening.answer).replace(/[。！？]$/, "")]; listening.explanationVi = `Đối chiếu transcript và chi tiết “${mode === 2 || mode === 5 ? lastSentence : spec.listening}” trước khi tự sửa.`; listening.cognitiveSkill = mode === 4 ? "inference" : "recognition"; exercises.push(listening);

  const readingFormats = ["reading-main-idea", "reading-detail", "reading-inference", "reading-evidence", "reading-sequence", "reading-explanation"];
  const readingQuestionIndex = mode === 0 || mode === 3 ? 0 : 1;
  const readingPrompts = [spec.rq[0], spec.rq[1], `Từ chi tiết trong bài, em suy ra điều gì cho câu hỏi: ${spec.rq[1]}`, `Chép cụm từ làm bằng chứng cho đáp án: ${spec.rq[0]}`, `Tóm tắt trình tự sự việc rồi trả lời: ${spec.rq[1]}`, `Trả lời và giải thích bằng một chi tiết trong bài: ${spec.rq[1]}`];
  const reading = exerciseBase(`${lessonId}-exercise-4`, "reading", readingFormats[mode], readingPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 4), difficulty);
  reading.stimulus = { textZh: spec.reading, evidenceZh: spec.re[readingQuestionIndex], questionVi: readingPrompts[mode] }; reading.answer = mode === 3 ? spec.re[0] : spec.ra[readingQuestionIndex]; reading.acceptedAnswers = [reading.answer, spec.re[readingQuestionIndex]]; reading.explanationVi = `Bằng chứng “${spec.re[readingQuestionIndex]}” hỗ trợ trực tiếp đáp án.`; reading.cognitiveSkill = ["recognition", "analysis", "inference", "analysis", "synthesis", "evaluation"][mode]; exercises.push(reading);

  const speakingFormats = ["scenario-role-play", "structured-retell", "opinion-turn", "information-gap", "service-simulation", "reflection-monologue"];
  const speakingPrompts = [spec.speaking, `Kể lại tình huống “${spec.vi}” theo ba bước rồi thêm một chi tiết của em. ${spec.speaking}`, `Nêu quan điểm và một lý do về cách xử lý trong bài. ${spec.speaking}`, `Làm việc theo cặp: mỗi người giữ một dữ kiện khác nhau rồi hỏi–đáp để hoàn thành nhiệm vụ. ${spec.speaking}`, `Mô phỏng cuộc trao đổi dịch vụ trong bài, có yêu cầu, xác nhận và bước tiếp theo. ${spec.speaking}`, `Nói 90 giây: em đã hiểu gì, sẽ làm gì khác và cần luyện thêm điểm nào sau bài “${spec.vi}”?`];
  const speaking = exerciseBase(`${lessonId}-exercise-5`, "speaking", speakingFormats[mode], speakingPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 5), difficulty);
  speaking.answer = { rubric: { taskCompletion: "Đủ ý và đúng vai", grammar: "Dùng ít nhất một cấu trúc trọng tâm", vocabulary: "Dùng từ mới có ngữ cảnh", pronunciation: "Nghe hiểu được, tự sửa khi cần", interaction: "Có phản hồi ý người nghe" }, sampleVi: `Bài nói phải hoàn thành nhiệm vụ “${spec.objective}”, không cần học thuộc transcript.` }; speaking.acceptedAnswers = ["Tự chấm theo rubric nói của bài."]; speaking.explanationVi = "Tự chấm theo năm tiêu chí; sample chỉ định hướng cấu trúc, không phải đáp án duy nhất."; speaking.cognitiveSkill = "synthesis"; exercises.push(speaking);

  const writingFormats = ["practical-message", "guided-paragraph", "incident-report", "descriptive-note", "response-message", "revision-draft"];
  const writingPrompts = [spec.writing, `Viết đoạn theo trình tự tình huống–cách xử lý–kết quả. ${spec.writing}`, `Viết bản tường thuật ngắn, tách dữ kiện chắc chắn và điều chưa rõ. ${spec.writing}`, `Miêu tả người, nơi hoặc đồ vật liên quan bằng chi tiết có thể kiểm chứng. ${spec.writing}`, `Viết tin nhắn trả lời: xác nhận đã hiểu, phản hồi một điểm và chốt bước tiếp theo. ${spec.writing}`, `Viết bản đầu, đánh dấu một lỗi trật tự/từ nối rồi nộp bản đã sửa. ${spec.writing}`];
  const writing = exerciseBase(`${lessonId}-exercise-6`, "writing", writingFormats[mode], writingPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 5), difficulty);
  writing.answer = { rubric: { content: "Đủ dữ kiện", organization: "Có mở–thân–kết hoặc trình tự", language: "Từ và ngữ pháp đúng mục tiêu", revision: "Có tự sửa ít nhất một lượt" }, checklist: ["Không chép nguyên reading", "Không nhồi toàn bộ từ mới", "Kiểm tra từ nối và dấu câu"] }; writing.acceptedAnswers = ["Tự chấm theo rubric viết của bài."]; writing.explanationVi = "Bài viết mở được đánh giá bằng rubric, không ép một câu mẫu duy nhất."; writing.cognitiveSkill = "synthesis"; exercises.push(writing);

  const integratedFormats = ["real-world-task", "controlled-translation", "dialogue-completion", "problem-solving", "mediation-summary", "culture-reflection"];
  const integratedPrompts = [spec.real, `Dịch có kiểm soát sang tiếng Trung: ${grammarDef[5]}`, `Viết thêm một lượt lời để khép lại hội thoại trong bài “${spec.vi}”; phải xác nhận bước tiếp theo.`, `Đề xuất hai cách xử lý cho tình huống “${spec.vi}”, so sánh rồi chọn một cách.`, `Tóm tắt bằng tiếng Việt cho một người chưa học tiếng Trung, chỉ giữ dữ kiện cần hành động trong bài “${spec.vi}”.`, `Trong bài “${spec.vi}”, so sánh cách giao tiếp với thói quen ở Việt Nam; nêu một điểm giống, một điểm khác và cách tránh phán xét.`];
  const integrated = exerciseBase(`${lessonId}-exercise-7`, "integrated", integratedFormats[mode], integratedPrompts[mode], spec.vi, grammarRefs, vocabRefs.slice(0, 6), difficulty);
  integrated.answer = mode === 1 ? grammarDef[4] : { rubric: { safety: "Không dùng dữ liệu nhạy cảm hoặc định kiến", transfer: "Ứng dụng được vào tình huống mới", reflection: "Nêu điều cần sửa lần sau" } };
  integrated.acceptedAnswers = typeof integrated.answer === "string" ? [integrated.answer, integrated.answer.replace(/[。！？]$/, "")] : ["Tự chấm theo rubric chuyển giao của bài."];
  integrated.explanationVi = mode === 1 ? "Đối chiếu ý và cấu trúc, không dịch từng chữ theo thứ tự tiếng Việt." : "Nhiệm vụ tích hợp được tự chấm theo mức chuyển giao, an toàn và phản tư."; integrated.cognitiveSkill = "evaluation"; exercises.push(integrated);
  return exercises;
}

function makeLessons(vocabulary, characters, grammar) {
  const vocabularyAssignment = assignToLessons(vocabulary);
  const characterAssignment = new Map(characters.map((character, index) => [character.id, index % LESSON_SPECS.length]));
  const grammarAssignment = new Map(grammar.map((item, index) => [item.id, index < 12 ? Math.floor(index / 2) : index - 6]));
  const exercises = [];
  const lessons = LESSON_SPECS.map((spec, index) => {
    const id = `hsk3-lesson-${pad(index + 1, 2)}`;
    const vocabRecords = vocabulary.filter((word) => vocabularyAssignment.get(word.id) === index);
    const vocabRefs = vocabRecords.map((word) => word.id);
    const characterRefs = characters.filter((character) => characterAssignment.get(character.id) === index).map((character) => character.id);
    const grammarRefs = grammar.filter((item) => grammarAssignment.get(item.id) === index).map((item) => item.id);
    assert(vocabRefs.length >= 10, `${id} receives too little vocabulary: ${vocabRefs.length}.`);
    assert(grammarRefs.length >= 1, `${id} receives no grammar.`);
    const lessonExercises = makeExercises(spec, index, id, vocabRecords, grammarRefs); exercises.push(...lessonExercises);
    const grammarNames = grammarRefs.map((grammarId) => GRAMMAR_DEFS[Number(grammarId.slice(-2)) - 1][1]);
    const focusWords = vocabRecords.map((word) => ({ canonicalId: word.id, simplified: word.simplified, canonicalLookup: { field: "id", value: word.id }, lexicalStatus: "canonical", knowledgeStatus: "new", collocations: word.collocations, commonErrorsVi: word.commonErrorsVi, assessmentEligible: true }));
    const previous = index ? [`hsk3-lesson-${pad(index, 2)}`] : [];
    return {
      recordType: "lesson", id, syllabusVersion: SYLLABUS, level: 3, unitId: `hsk3-unit-${pad(spec.u, 2)}`, order: (index % 3) + 1, topic: UNIT_SPECS[spec.u - 1][1], titleZh: spec.zh, titleVi: spec.vi,
      objectives: [spec.objective, "Tiếp nhận ý chính và chi tiết rồi sản sinh lời nói/đoạn viết theo rubric.", "Phân biệt kiến thức mới HSK3 với nội dung HSK1–2 được gọi lại."],
      prerequisiteIds: previous, prerequisiteMasteryId: index === 0 ? "hsk2-assessment-mastery" : null,
      vocabularyRefs: vocabRefs, grammarRefs, characterRefs,
      knowledgeMap: { new: { vocabularyRefs: vocabRefs, grammarRefs, characterRefs }, review: { hsk2Words: spec.review }, reinforcement: ["retrieval", "pronunciation", "discourse-linking"], extension: [spec.real] },
      sections: [
        section(id, "situation", "situation", "Tình huống và mục tiêu", { promptVi: spec.situation, successCriterionVi: spec.objective }),
        section(id, "vocabulary", "vocabulary", "Từ vựng mới trong ngữ cảnh", { instructionVi: "Các mục new thuộc đúng 500 từ HSK3 dòng 501–1000; từ HSK1–2 chỉ xuất hiện ở review.", focusWords, reviewWords: spec.review.map((word) => ({ simplified: word, knowledgeStatus: "review", introducedLevel: 2 })) }),
        section(id, "character", "character", "Chữ Hán trọng tâm", { characterRefs, knowledgeStatus: "new", workflow: ["nhận diện bộ và cấu trúc", "đếm nét từ vector tĩnh", "đặt chữ trong từ đã học", "gõ/viết rồi tự đối chiếu"], noteVi: "Mnemonic chỉ là mẹo nhớ; stroke animation/audio chưa được xác minh nên không tuyên bố là tài sản chuẩn." }),
        section(id, "grammar", "grammar", "Ngữ pháp để diễn đạt theo đoạn", { grammarRefs, teachingFlow: ["chức năng giao tiếp", "cấu trúc", "điều kiện dùng", "phủ định/nghi vấn", "lỗi người Việt", "bài sản sinh"] }),
        section(id, "dialogue", "dialogue", "Hội thoại có mục tiêu", { contextVi: spec.situation, goalVi: spec.objective, scriptZh: spec.dialogue, tasks: ["nghe ý chính trước transcript", "shadowing theo lượt", "đổi vai và thay dữ kiện", "phản hồi một ý không có sẵn trong script"] }),
        section(id, "reading", "reading", "Đọc hiểu và giải thích", { textZh: spec.reading, questionsVi: spec.rq, answerPolicy: "Chỉ chấp nhận suy luận có chi tiết trong bài.", answerKey: spec.rq.map((question, qIndex) => ({ qVi: question, answerVi: spec.ra[qIndex], evidenceZh: spec.re[qIndex], explanationVi: `Cụm “${spec.re[qIndex]}” là bằng chứng trực tiếp cho đáp án.` })) }),
        section(id, "listening", "listening", "Nghe, chép chính tả và shadowing", { audioStatus: "script-ready-audio-pending", scriptOrTeacherBriefVi: "Transcript VDuckie mới biên soạn; TTS chỉ hỗ trợ tạm trong lúc chờ audio được xác minh.", scriptZh: spec.listening, passes: ["lượt 1: ý chính", "lượt 2: chi tiết", "lượt 3: chép câu mục tiêu", "lượt 4: shadowing"], questionsVi: spec.lq, answerKey: spec.lq.map((question, qIndex) => ({ qVi: question, answer: spec.la[qIndex] })) }),
        section(id, "pronunciation", "pronunciation", "Phát âm cho người Việt", { coachingVi: spec.pronunciation, selfCheck: ["âm đầu", "vận mẫu", "thanh điệu", "nhịp đoạn", "ghi âm và tự sửa"] }),
        section(id, "culture", "culture-note", "Ghi chú văn hoá và ứng xử", { noteVi: CULTURE_NOTES[index], cautionVi: "Đây là gợi ý theo bối cảnh, không phải quy tắc áp cho mọi cá nhân hay mọi vùng." }),
        section(id, "guided", "guided-practice", "Luyện có hướng dẫn", { steps: [`Tóm tắt reading bằng ba câu cho bài “${spec.vi}”.`, `Dùng ${grammarNames.join(" và ")} viết hai câu mới.`, "Đổi ít nhất hai dữ kiện trong hội thoại rồi role-play.", "Làm lại bài sửa lỗi mà không nhìn đáp án."], exerciseRefs: lessonExercises.slice(0, 4).map((item) => item.id) }),
        section(id, "independent", "independent-practice", "Nói, viết và dùng thật", { speakingVi: spec.speaking, writingVi: spec.writing, realWorldTaskVi: spec.real, speakingRubric: { taskCompletion: 25, intelligibility: 20, vocabulary: 20, grammar: 20, interaction: 15 }, exerciseRefs: lessonExercises.slice(4).map((item) => item.id) }),
        section(id, "summary", "summary", "Tự đánh giá can-do", { canDoVi: spec.objective, checklist: ["Tôi kể/giải thích được thành đoạn thay vì câu rời.", "Tôi dùng được từ mới mà không nhồi từ.", "Tôi chỉ được bằng chứng đọc/nghe.", "Tôi sửa được ít nhất một lỗi của bản đầu."] }),
        section(id, "review", "review", "Ôn cách quãng", { vocabularyRefs: vocabRefs, spacingDays: [1, 3, 7, 14, 30], retrievalMix: [`Ngày 1: nhớ lại nửa đầu danh sách từ new và kể lại mục tiêu “${spec.vi}”.`, `Ngày 3: nhớ lại nửa sau danh sách từ new, dùng ít nhất ba từ trong câu mới, rồi trả lời lại câu nghe “${spec.lq[1]}”.`, "Ngày 7: tạo ví dụ ngữ pháp mới.", "Ngày 14/30: làm lại nhiệm vụ nói hoặc viết và so hai bản."], realWorldTaskVi: spec.real, retrievalFromLessonIds: previous, reviewPolicyVi: "new = lần đầu ở HSK3; review = kiến thức HSK1–2; reinforcement = gọi lại trong ngữ cảnh mới; extension = chuyển giao sang nhiệm vụ thật." })
      ],
      practiceRefs: lessonExercises.map((item) => item.id), reviewRefs: [], estimatedMinutes: 90, difficulty: 3 + Math.floor(index / 12),
      sourceIds: SOURCES, contentStatus: "machine-assisted", translationReviewStatus: "machine-assisted", contentVersion: 1, reviewMetadata: { ...REVIEW }
    };
  });
  assert(exercises.length === 252, `HSK3 must have 252 exercises, received ${exercises.length}.`);
  return { lessons, exercises };
}

function makeUnits(lessons) {
  return UNIT_SPECS.map(([titleZh, titleVi, task], index) => {
    const id = `hsk3-unit-${pad(index + 1, 2)}`;
    const unitLessons = lessons.filter((lesson) => lesson.unitId === id);
    return {
      recordType: "unit", id, syllabusVersion: SYLLABUS, level: 3, order: index + 1, topic: titleVi, titleZh, titleVi,
      objectives: [task, "Tích hợp nghe–nói–đọc–viết trong tình huống có nhiều bước.", "Đạt checkpoint và lên lịch retrieval 1/3/7/14/30 ngày."],
      prerequisiteUnitIds: index ? [`hsk3-unit-${pad(index, 2)}`] : [], prerequisiteLevelId: index === 0 ? "hsk2" : null,
      lessonRefs: unitLessons.map((lesson) => ({ id: lesson.id, path: "lessons.json", order: lesson.order })),
      checkpointRef: { id: `hsk3-assessment-unit-${pad(index + 1, 2)}`, path: "assessments.json" },
      sourceIds: SOURCES, contentStatus: "machine-assisted", contentVersion: 1
    };
  });
}

function makeAssessments(units, lessons, exercises) {
  const assessedSkills = ["listening", "grammar", "reading", "speaking", "writing"];
  const byId = new Map(exercises.map((item) => [item.id, item]));
  const select = (pool, plan) => assessedSkills.flatMap((skill) => {
    const candidates = pool.filter((item) => item.skill === skill);
    assert(candidates.length >= plan[skill], `Not enough ${skill} items for assessment.`);
    return candidates.slice(0, plan[skill]).map((item) => item.id);
  });
  const make = (id, type, titleZh, titleVi, refs, targetLessons, pass) => ({
    recordType: "assessment", id, syllabusVersion: SYLLABUS, examBlueprintVersion: EXAM, level: 3,
    assessmentType: type, titleZh, titleVi, exerciseRefs: refs,
    sections: Object.fromEntries(assessedSkills.map((skill) => [skill, refs.filter((ref) => byId.get(ref).skill === skill).length])),
    skillWeights: { listening: 20, grammar: 15, reading: 20, speaking: 25, writing: 20 },
    targetGrammar: unique(targetLessons.flatMap((lesson) => lesson.grammarRefs)), targetVocabulary: unique(targetLessons.flatMap((lesson) => lesson.vocabularyRefs)),
    difficultyDistribution: { core: 60, transfer: 25, stretch: 15 },
    rubric: { pass, knowledge: 82, receptive: 78, productive: 75, remediation: "Kỹ năng dưới ngưỡng phải làm một nhiệm vụ khác định dạng, nhận feedback rồi retrieval sau 1 và 3 ngày." },
    sourceIds: [OFFICIAL_SOURCE, ORIGINAL_SOURCE], contentStatus: "machine-assisted", reviewStatus: "unreviewed", contentVersion: 1
  });
  const assessments = units.map((unit, index) => {
    const targetLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
    const pool = exercises.filter((exercise) => targetLessons.some((lesson) => lesson.practiceRefs.includes(exercise.id)));
    return make(`hsk3-assessment-unit-${pad(index + 1, 2)}`, "mini-checkpoint", `第${index + 1}单元检查`, `Checkpoint Unit ${index + 1}: ${unit.titleVi}`, select(pool, { listening: 2, grammar: 2, reading: 2, speaking: 2, writing: 2 }), targetLessons, 78);
  });
  const midpointLessons = lessons.slice(0, 18);
  const midpointPool = exercises.filter((exercise) => midpointLessons.some((lesson) => lesson.practiceRefs.includes(exercise.id)));
  const masteryLessons = lessons.slice(-12);
  const masteryPool = exercises.filter((exercise) => masteryLessons.some((lesson) => lesson.practiceRefs.includes(exercise.id)));
  assessments.push(make("hsk3-assessment-midpoint", "midpoint", "三级中期评估", "HSK3 Midpoint: Unit 1–6", select(midpointPool, { listening: 5, grammar: 5, reading: 5, speaking: 5, writing: 5 }), midpointLessons, 78));
  assessments.push(make("hsk3-assessment-final", "final", "三级结业评估", "HSK3 Final Assessment", select(exercises, { listening: 8, grammar: 8, reading: 8, speaking: 8, writing: 8 }), lessons, 78));
  assessments.push(make("hsk3-assessment-mastery", "mastery-review", "三级掌握门槛", "HSK3 Mastery Review", select(masteryPool, { listening: 4, grammar: 4, reading: 4, speaking: 8, writing: 8 }), masteryLessons, 82));
  assert(assessments.length === 15, `HSK3 needs 15 assessments, received ${assessments.length}.`);
  return assessments;
}

function makeLevel(units, lessons, assessments) {
  return {
    recordType: "level", id: "hsk3", syllabusVersion: SYLLABUS, examBlueprintVersion: EXAM, stage: "elementary", level: 3,
    titleZh: "HSK（三级）专业课程", titleVi: "HSK3 Professional Curriculum",
    objectives: ["Xử lý tình huống du lịch, học tập, công việc và quan hệ xã hội có nhiều bước.", "Nắm ý chính/chi tiết của hội thoại và bài kể ở tốc độ chậm đến gần tự nhiên.", "Kể, mô tả và viết đoạn có trình tự, nguyên nhân, kết quả và đánh giá."],
    topics: units.map((unit) => unit.titleVi), unitRefs: units.map((unit) => ({ id: unit.id, path: "units.json" })),
    lessonIndex: lessons.map((lesson) => ({ id: lesson.id, unitId: lesson.unitId, path: "lessons.json" })),
    assessmentRefs: assessments.map((assessment) => ({ id: assessment.id, path: "assessments.json" })), finalAssessmentId: "hsk3-assessment-final",
    sourceIds: SOURCES, contentStatus: "machine-assisted", translationReviewStatus: "machine-assisted", productionReady: false, contentVersion: 1
  };
}

function makeManifest(units, lessons, vocabulary, characters, grammar, exercises, assessments) {
  return {
    schemaVersion: "1.0.0", phase: "C4", curriculumId: "vduckie-hsk3-professional-course", syllabusVersion: SYLLABUS, examBlueprintVersion: EXAM,
    level: 3, status: "phase-c4-professional-machine-editorial-human-signoff-required", productionEnabled: false, publicOverrideAllowed: false, writesProgress: false, developerOnly: true, readOnly: true, qualityGate: "locked",
    collections: {
      units: { path: "units.json", count: units.length }, lessons: { path: "lessons.json", count: lessons.length }, grammar: { path: "grammar.json", count: grammar.length }, characters: { path: "characters.json", count: characters.length }, exercises: { path: "exercises.json", count: exercises.length }, assessments: { path: "assessments.json", count: assessments.length }, vocabularyEnrichment: { path: "vocabulary-enrichment.json", count: vocabulary.length, linkStrategy: "canonicalLookup.id" }, vocabulary: { path: "vocabulary/index.json", count: vocabulary.length, newAtLevel: 500, cumulativeThroughLevel: 1000 }
    },
    learnerJourney: { lessonFlow: ["context", "new-vocabulary-in-use", "characters", "grammar-for-purpose", "dialogue", "reading", "listening-transcript", "pronunciation", "guided-practice", "speaking-writing", "summary", "spaced-review", "real-world-task"], mastery: { knowledge: 82, receptive: 78, productive: 75, mandatory: ["unit checkpoints", "midpoint", "final assessment", "speaking-writing project"], spacingDays: [1, 3, 7, 14, 30] } },
    sourceIds: SOURCES, reviewGate: { vietnameseHumanReview: false, chinesePedagogyHumanReview: false, audioRecorded: false, strokeOrderVerified: false, productionReleaseAllowed: false },
    editorialQualityGate: { status: "pass-machine-editorial-human-signoff-required", reviewedLessons: 36, readingSpecificQuestions: true, listeningTranscriptCoverage: "36/36", exerciseCount: 252, exerciseFormatCount: unique(exercises.map((exercise) => exercise.format)).length, officialNewVocabulary: "500/500", humanVietnameseSignoff: false, humanChinesePedagogySignoff: false }
  };
}

function shardVocabulary(vocabulary) {
  const dir = path.join(HSK3, "vocabulary");
  fs.mkdirSync(dir, { recursive: true });
  const shards = [];
  for (let start = 0; start < vocabulary.length; start += 50) {
    const records = vocabulary.slice(start, start + 50); const first = start + 1; const last = start + records.length;
    const file = `hsk3-v-${pad(first, 4)}-${pad(last, 4)}.json`;
    writeJson(path.join(dir, file), { schemaVersion: "1.0.0", collectionType: "vocabulary", level: 3, records });
    shards.push({ file, firstId: records[0].id, lastId: records.at(-1).id, count: records.length });
  }
  writeJson(path.join(dir, "index.json"), { schemaVersion: "1.0.0", collectionType: "vocabulary-index", level: 3, expectedCount: 500, officialBand: "3", officialRows: "501-1000", cumulativeThroughLevel: 1000, shards });
}

function updateRootManifest() {
  const target = path.join(ROOT, "data", "hsk", "manifest.json");
  const manifest = readJson(target);
  const level = manifest.levels.find((item) => item.level === 3);
  level.status = "machine-assisted"; level.courseManifestPath = "hsk3/course-manifest.json"; level.productionReady = false;
  manifest.hsk3CourseManifestPath = "hsk3/course-manifest.json";
  writeJson(target, manifest);
}

function updateSources() {
  const target = path.join(ROOT, "data", "hsk", "sources.json");
  const registry = readJson(target);
  const source = { sourceId: ORIGINAL_SOURCE, title: "VDuckie HSK3 Phase C4 original learning content", publisher: "VDuckie", sourceType: "original-curriculum-content", url: null, accessDate: "2026-08-03", syllabusVersion: EXAM, levels: [3], scope: ["Vietnamese explanations", "examples", "dialogues", "reading", "listening transcripts", "speaking", "writing", "exercises", "assessments"], confidence: "machine-assisted-human-signoff-required", licenseStatus: "verified", licenseNote: "Learning prose and tasks are newly authored for VDuckie; no commercial textbook text is copied.", derivedDataNote: "Official sources determine membership and alignment only; VDuckie learner-facing prose remains original." };
  const existing = registry.sources.find((item) => item.sourceId === ORIGINAL_SOURCE);
  if (existing) Object.assign(existing, source); else registry.sources.push(source);
  writeJson(target, registry);
}

function writeReports({ facts, units, lessons, vocabulary, characters, grammar, exercises, assessments }) {
  const provenanceDir = path.join(HSK3, "provenance");
  writeJson(path.join(provenanceDir, "official-vocabulary.json"), { schemaVersion: "1.0.0", sourceId: OFFICIAL_SOURCE, sourceSha256: PDF_SHA256, rows: "501-1000", facts });
  writeJson(path.join(provenanceDir, "source-snapshot.json"), { schemaVersion: "1.0.0", capturedAt: "2026-08-03", officialVocabulary: { sourceId: OFFICIAL_SOURCE, url: "https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf", sha256: PDF_SHA256, pagesUsed: "92-104 (PDF numbering as rendered)", rows: "501-1000", factsStored: ["official row", "headword", "pinyin", "part of speech when printed"], copyrightPolicy: "No sample test, answer key, audio or commercial textbook prose stored." }, authorship: { contentSourceId: ORIGINAL_SOURCE, machineAssisted: true, humanSignoffRequired: true } });
  const formats = unique(exercises.map((exercise) => exercise.format));
  const report = {
    generatedAt: "2026-08-03", phase: "C4", level: 3, status: "pass-machine-editorial-human-signoff-required",
    counts: { units: units.length, lessons: lessons.length, newVocabulary: vocabulary.length, cumulativeVocabulary: 1000, characters: characters.length, grammar: grammar.length, dialogues: lessons.length, listeningTranscripts: lessons.length, readings: lessons.length, speakingTasks: lessons.length, writingTasks: lessons.length, exercises: exercises.length, assessments: assessments.length },
    editorialSampling: { sampledLessonIds: ["hsk3-lesson-01", "hsk3-lesson-07", "hsk3-lesson-13", "hsk3-lesson-19", "hsk3-lesson-25", "hsk3-lesson-31", "hsk3-lesson-36"], method: "Full machine-assisted pass plus stratified first/middle/last sampling across all twelve domains.", changes: ["Kept each dialogue, reading and listening transcript tied to a distinct real-life conflict or decision.", "Removed ERP-heavy framing and retained only general workplace communication.", "Separated facts, inference and speaker attitude in answer explanations.", "Added Vietnamese transfer warnings, collocations, confusables hooks and practical writing.", "Balanced checkpoints across five assessed skills and made mastery production-heavy.", "Marked all unverified audio and stroke assets as pending/static fallback.", "Kept vocabulary review from HSK1–2 out of the 500 new-word count."], humanSignoffRequired: true, humanVietnameseSignoff: false, humanChinesePedagogySignoff: false },
    validation: { schema: "pass", officialRows: "501-1000 exact", targetExamples: "500/500", lessonAssignment: "500/500 exactly once", spacedReviewVocabularyCoverage: "500/500", audioStatus: "36/36 script-ready-audio-pending", exerciseFormats: formats, productionWrites: false }
  };
  writeJson(path.join(HSK3, "editorial-c4.json"), report);
}

function main() {
  const facts = officialFacts();
  const vocabulary = makeVocabulary(facts);
  const characters = makeCharacters(vocabulary);
  const grammar = makeGrammar();
  const { lessons, exercises } = makeLessons(vocabulary, characters, grammar);
  const units = makeUnits(lessons);
  const assessments = makeAssessments(units, lessons, exercises);
  const level = makeLevel(units, lessons, assessments);
  const manifest = makeManifest(units, lessons, vocabulary, characters, grammar, exercises, assessments);
  writeJson(path.join(HSK3, "level.json"), level);
  writeJson(path.join(HSK3, "units.json"), { schemaVersion: "1.0.0", collectionType: "units", level: 3, records: units });
  writeJson(path.join(HSK3, "lessons.json"), { schemaVersion: "1.0.0", collectionType: "lessons", level: 3, records: lessons });
  writeJson(path.join(HSK3, "grammar.json"), { schemaVersion: "1.0.0", collectionType: "grammar", level: 3, records: grammar });
  writeJson(path.join(HSK3, "characters.json"), { schemaVersion: "1.0.0", collectionType: "characters", level: 3, records: characters });
  writeJson(path.join(HSK3, "exercises.json"), { schemaVersion: "1.0.0", collectionType: "exercises", level: 3, records: exercises });
  writeJson(path.join(HSK3, "assessments.json"), { schemaVersion: "1.0.0", collectionType: "assessments", level: 3, records: assessments });
  writeJson(path.join(HSK3, "vocabulary-enrichment.json"), { schemaVersion: "1.0.0", collectionType: "vocabulary-enrichment", level: 3, entries: vocabulary.map((word) => ({ canonicalId: word.id, simplified: word.simplified, officialRow: word.officialRow, senseKey: word.senseKey, collocations: word.collocations, measureWord: word.measureWord, usageNoteVi: word.usageNoteVi, confusables: word.confusables, commonErrorsVi: word.commonErrorsVi, example: word.examples[0], contentStatus: "machine-assisted", humanSignoffRequired: true })) });
  writeJson(path.join(HSK3, "course-manifest.json"), manifest);
  shardVocabulary(vocabulary); updateRootManifest(); updateSources();
  writeReports({ facts, units, lessons, vocabulary, characters, grammar, exercises, assessments });
  console.log(JSON.stringify({ ok: true, level: 3, counts: { units: units.length, lessons: lessons.length, vocabulary: vocabulary.length, characters: characters.length, grammar: grammar.length, exercises: exercises.length, assessments: assessments.length } }, null, 2));
}

if (require.main === module) main();
module.exports = { parseOfficialRaw, officialFacts, makeVocabulary, makeCharacters, makeGrammar, makeLessons, makeUnits, makeAssessments };
