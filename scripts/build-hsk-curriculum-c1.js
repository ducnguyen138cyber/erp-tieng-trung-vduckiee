#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const HSK1 = path.join(ROOT, "data/hsk/hsk1");
const SYLLABUS = "GF0025-2021";
const EXAM = "CTI-HSK3.0-2026";
const SOURCES = Object.freeze([
  "moe-gf0025-2021-standard",
  "cti-hsk3-current-syllabus-2026",
  "cti-hsk3-competency-profile-2026",
  "blcu-new-standard-pedagogy-2025",
  "vduckie-hsk1-phase2a-original"
]);
const STATUS = "machine-assisted";
const DERIVED_PHRASES = new Set([
  "不舒服", "杯", "前面", "后面", "走", "越南", "意思", "英语", "生日", "每天",
  "吃饭", "回家", "面条", "不喜欢", "碗", "旧", "左边", "右边", "旁边", "晴",
  "阴", "身体", "头", "眼睛", "吃药", "不能", "周末", "一起", "公园", "看电影", "什么时候"
]);

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function writeJson(relativePath, value) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

const unitDefinitions = [
  ["语音和汉字入门", "Định hướng phát âm và chữ Hán", "Phân biệt thanh điệu, nhóm âm khó với người Việt và viết nét cơ bản."],
  ["第一次见面", "Gặp gỡ lần đầu", "Chào, nói tên, quốc tịch, vai trò và hỏi lại lịch sự."],
  ["家人和朋友", "Gia đình và người quen", "Giới thiệu quan hệ, số người và thông tin rất ngắn về một người."],
  ["课堂和语言", "Lớp học và ngôn ngữ", "Hỏi nghĩa, xin nhắc lại, nói khả năng và đồ dùng học tập."],
  ["数字日期和约会", "Số, ngày và cuộc hẹn", "Nói số, ngày, giờ, điện thoại và hẹn thời điểm đơn giản."],
  ["我的一天", "Một ngày của tôi", "Nói hoạt động, nơi chốn, trình tự và thói quen cơ bản."],
  ["日常饮食", "Ăn uống hằng ngày", "Gọi món đơn giản, nói thích/không thích, số lượng và nhu cầu."],
  ["买东西", "Mua sắm và đồ vật", "Hỏi giá, màu sắc, kích thước, lượng và đưa ra lựa chọn."],
  ["出行和方向", "Đi lại và phương hướng", "Hỏi nơi chốn, vị trí, phương tiện và chỉ đường rất ngắn."],
  ["天气健康和计划", "Thời tiết, sức khỏe và kế hoạch", "Mô tả thời tiết, cảm giác cơ thể và kế hoạch gần."]
];

const grammarDefinitions = [
  ["shi-identity", "是字句", "Câu với 是 để xác định", "A + 是 + B", "Dùng để xác định người, nghề nghiệp, quốc tịch hoặc loại sự vật.", ["Không dùng 是 trước tính từ khi chỉ đơn thuần miêu tả.", "Có thể phủ định bằng 不是."], "是 đứng giữa chủ ngữ và thành phần định danh.", [["我是学生。", "Tôi là học sinh."], ["她是越南人。", "Cô ấy là người Việt Nam."]], [["我是很好。", "Không dùng 是 trước 很好 khi chỉ miêu tả trạng thái."]], ["Dịch máy móc mọi từ ‘là’ trong tiếng Việt thành 是."]],
  ["ma-question", "吗疑问句", "Câu hỏi có 吗", "Câu trần thuật + 吗？", "Biến một nhận định thành câu hỏi đúng/sai, không đổi trật tự từ.", ["Trả lời bằng động từ/tính từ chính hoặc 是/不是.", "Không dùng 吗 cùng từ nghi vấn như 谁, 什么, 哪儿."], "吗 đứng cuối câu.", [["你是老师吗？", "Bạn là giáo viên à?"], ["你忙吗？", "Bạn bận không?"]], [["你是谁吗？", "谁 đã tạo câu hỏi nên không thêm 吗."]], ["Đảo động từ lên trước như tiếng Anh."]],
  ["ne-follow-up", "呢的用法", "呢 để hỏi tiếp hoặc nhắc chủ đề", "Chủ đề + 呢？", "Dùng để hỏi lại cùng một thông tin hoặc hỏi vị trí/trạng thái đang được nhắc tới.", ["Giọng nói thường mềm và ngắn.", "Không thay thế mọi loại câu hỏi có 吗."], "呢 đứng cuối cụm chủ đề hoặc câu.", [["我很好，你呢？", "Tôi khỏe, còn bạn?"], ["我的书呢？", "Sách của tôi đâu?"]], [["你是学生呢？", "Nếu hỏi đúng/sai nên dùng 吗."]], ["Dùng 呢 như một bản dịch cố định của ‘thì sao’ trong mọi ngữ cảnh."]],
  ["de-possession", "的表示领属", "的 chỉ sở hữu và định ngữ", "Người/đặc điểm + 的 + danh từ", "Nối người sở hữu hoặc đặc điểm với danh từ.", ["Quan hệ thân thuộc rất gần có thể lược 的: 我妈妈.", "Không đặt 的 sau danh từ trung tâm."], "的 đứng trước danh từ được bổ nghĩa.", [["这是我的书。", "Đây là sách của tôi."], ["她是我的老师。", "Cô ấy là giáo viên của tôi."]], [["这是书我的。", "的 và phần sở hữu phải đứng trước danh từ."]], ["Đặt trật tự theo tiếng Việt ‘sách của tôi’ thành 书我的."]],
  ["you-existence", "有字句", "有 để nói có và tồn tại", "Chủ thể/nơi chốn + 有 + danh từ", "Diễn đạt sở hữu hoặc sự tồn tại tại một nơi.", ["Phủ định bằng 没有, không dùng 不有.", "Câu tồn tại thường đưa nơi chốn lên đầu."], "有 đứng trước đối tượng tồn tại hoặc được sở hữu.", [["我有一个妹妹。", "Tôi có một em gái."], ["学校里有商店。", "Trong trường có cửa hàng."]], [["我不有钱。", "Phủ định 有 bằng 没有."]], ["Dùng 不有 do dịch trực tiếp ‘không có’."]],
  ["demonstratives", "这那和量词", "这/那 với lượng từ", "这/那 + lượng từ + danh từ", "Chỉ vật/người gần hoặc xa; danh từ đếm được thường cần lượng từ.", ["个 là lượng từ chung nhưng không thay mọi lượng từ.", "本 dùng với sách; 杯 dùng với đồ uống trong cốc."], "Từ chỉ định đứng trước lượng từ.", [["这本书很好。", "Quyển sách này rất hay."], ["那个人是医生。", "Người kia là bác sĩ."]], [["这书很好。", "Ở giai đoạn đầu nên dùng lượng từ: 这本书."]], ["Bỏ lượng từ vì tiếng Việt không luôn biểu hiện lượng từ."]],
  ["question-words", "疑问代词", "Từ nghi vấn giữ nguyên vị trí", "Ai/cái gì/đâu/bao nhiêu thay đúng vị trí của thông tin cần hỏi", "谁, 什么, 哪儿, 几, 多少, 怎么, 怎么样 không kéo lên đầu câu.", ["Không thêm 吗.", "几 thường hỏi số lượng nhỏ, 多少 rộng hơn."], "Đứng tại vị trí của câu trả lời.", [["你叫什么名字？", "Bạn tên là gì?"], ["你去哪儿？", "Bạn đi đâu?"]], [["什么你叫名字？", "Không kéo 什么 lên đầu câu."]], ["Sắp xếp từ nghi vấn theo trật tự tiếng Việt."]],
  ["negation", "不和没（有）", "Phủ định với 不 và 没（有）", "不 + thói quen/ý định/tính chất; 没（有） + sự việc đã xảy ra/sở hữu", "Chọn phủ định theo thời và loại vị ngữ.", ["不 thường dùng cho hiện tại, tương lai, thói quen.", "没 dùng với 有 và hành động chưa xảy ra/không xảy ra."], "Đứng trước động từ hoặc tính từ.", [["我不喝咖啡。", "Tôi không uống cà phê."], ["我今天没上班。", "Hôm nay tôi không đi làm."]], [["我不有时间。", "Phải dùng 没有时间."]], ["Dùng 不 cho mọi câu phủ định."]],
  ["adjective-predicate", "形容词谓语句", "Tính từ làm vị ngữ", "Chủ ngữ + 很 + tính từ", "Miêu tả trạng thái mà không cần 是; 很 thường làm câu tự nhiên, không nhất thiết mang nghĩa ‘rất’.", ["太…了 biểu thị mức độ nổi bật.", "Khi đối lập có thể bỏ 很."], "Tính từ đứng trực tiếp sau chủ ngữ, thường có phó từ mức độ.", [["今天天气很好。", "Hôm nay thời tiết đẹp."], ["这个菜太辣了。", "Món này cay quá."]], [["天气是很冷。", "Không dùng 是 trước tính từ trong câu miêu tả đơn giản."]], ["Hiểu mọi 很 đều là ‘rất’ và dùng 是 trước tính từ."]],
  ["time-order", "时间词语序", "Trật tự biểu thức thời gian", "Chủ ngữ + thời gian + nơi chốn + động từ + tân ngữ", "Đưa mốc thời gian trước động từ để nói lịch và thói quen.", ["Thời gian có thể đứng đầu câu để làm chủ đề.", "Giờ dùng 点; phút dùng 分; 半 là rưỡi."], "Thường sau chủ ngữ hoặc đầu câu.", [["我八点上班。", "Tôi đi làm lúc 8 giờ."], ["明天下午我们见。", "Chiều mai chúng ta gặp nhau."]], [["我上班八点。", "Trong câu cơ bản, thời gian đứng trước động từ."]], ["Đặt thời gian cuối câu theo thói quen tiếng Việt."]],
  ["zai-location", "在字句", "在 để chỉ nơi chốn", "Chủ ngữ + 在 + nơi chốn + động từ", "Nói người/vật ở đâu hoặc hành động xảy ra ở đâu.", ["在 + nơi chốn thường đứng trước động từ chính.", "Câu tồn tại dùng 有, không đổi tự do với 在."], "Sau chủ ngữ, trước nơi chốn và động từ.", [["我在学校学习。", "Tôi học ở trường."], ["书在桌子上。", "Sách ở trên bàn."]], [["我学习在学校。", "Trong câu cơ bản, cụm 在 + nơi chốn đứng trước động từ."]], ["Đặt nơi chốn cuối câu như tiếng Việt."]],
  ["modal-verbs", "会能可以", "会, 能, 可以", "Chủ ngữ + động từ năng nguyện + động từ chính", "会 nói kỹ năng đã học; 能 nói khả năng/điều kiện; 可以 nói sự cho phép hoặc khả năng trong ngữ cảnh.", ["Phủ định đặt trước động từ năng nguyện.", "Không dùng hai động từ năng nguyện nếu không có mục đích rõ."], "Đứng trước động từ chính.", [["我会说一点儿汉语。", "Tôi biết nói một chút tiếng Trung."], ["这里可以坐吗？", "Ở đây có thể ngồi không?"]], [["我说会汉语。", "会 phải đứng trước động từ chính."]], ["Dùng 会 cho mọi nghĩa ‘có thể’."]],
  ["xiang-yao", "想和要", "想 và 要 để nói mong muốn", "Chủ ngữ + 想/要 + động từ hoặc danh từ", "想 mềm hơn, thể hiện mong muốn; 要 trực tiếp hơn, có thể là muốn/cần/sẽ.", ["Trong gọi món, 我要… tự nhiên nhưng trực tiếp.", "想 + động từ phù hợp khi nói kế hoạch."], "Đứng trước động từ hoặc đối tượng mong muốn.", [["我想喝茶。", "Tôi muốn uống trà."], ["我要一杯水。", "Tôi muốn một cốc nước."]], [["我喝想茶。", "想 phải đứng trước động từ."]], ["Không phân biệt độ trực tiếp giữa 想 và 要."]],
  ["progressive", "在／正在…呢", "Đang diễn ra", "Chủ ngữ + 在/正在 + động từ + (tân ngữ) + 呢", "Diễn tả hành động đang diễn ra tại thời điểm nói.", ["Không bắt buộc dùng đủ 正在 và 呢 cùng lúc.", "Không dùng với mọi động từ trạng thái."], "在/正在 đứng trước động từ; 呢 cuối câu.", [["我正在吃饭。", "Tôi đang ăn cơm."], ["他看书呢。", "Anh ấy đang đọc sách."]], [["我吃正在饭。", "正在 phải đứng trước động từ."]], ["Đặt ‘đang’ sau động từ theo trật tự tiếng Việt."]],
  ["le-change", "了表示完成或变化", "了 chỉ hoàn thành hoặc thay đổi", "Động từ + 了 / Câu + 了", "Ở HSK1 chỉ giới thiệu hai chức năng cơ bản: hoàn thành có giới hạn và tình huống mới thay đổi.", ["Không đồng nhất 了 với mọi động từ quá khứ.", "Phủ định sự việc chưa xảy ra thường dùng 没 và bỏ 了."], "Sau động từ hoặc cuối câu tùy chức năng.", [["我吃饭了。", "Tôi ăn cơm rồi."], ["下雨了。", "Trời mưa rồi."]], [["我没吃了饭。", "Với 没, thường bỏ 了: 我没吃饭."]], ["Thêm 了 vào mọi câu quá khứ tiếng Việt."]],
  ["ba-suggestion", "吧表示建议", "吧 để đề nghị", "Câu mệnh lệnh/đề nghị + 吧", "Làm lời đề nghị mềm hơn hoặc mời người nghe cùng hành động.", ["Không dùng trong yêu cầu cần chính xác tuyệt đối.", "Ngữ điệu và quan hệ người nói vẫn quan trọng."], "吧 đứng cuối câu.", [["我们走吧。", "Chúng ta đi nhé."], ["请坐吧。", "Mời ngồi nhé."]], [["吧我们走。", "吧 đứng cuối câu."]], ["Đặt 吧 đầu câu vì dịch từ ‘nhé’ không theo trật tự Trung."]],
  ["numbers-time", "数字日期时间", "Số, ngày tháng và giờ", "Năm + 年; tháng + 月; ngày + 号/日; giờ + 点; phút + 分", "Đọc số điện thoại từng số; đọc năm từng chữ số; dùng 两 trước lượng từ trong nhiều trường hợp.", ["二 và 两 không hoàn toàn thay thế nhau.", "Ngày nói khẩu ngữ thường dùng 号."], "Theo thứ tự lớn đến nhỏ.", [["今天是五月八号。", "Hôm nay là ngày 8 tháng 5."], ["现在九点半。", "Bây giờ là 9 giờ rưỡi."]], [["八号五月。", "Tiếng Trung đi từ đơn vị lớn đến nhỏ: 五月八号."]], ["Dùng trật tự ngày-tháng như tiếng Việt."]]
];

const lessonDefinitions = [
  {u:1, zh:"听清四声", vi:"Nghe rõ bốn thanh", focus:["一","八","七","四","十","好"], grammar:["numbers-time"], chars:["一","八"], objective:"Phân biệt và bắt chước bốn thanh trong từ một âm tiết.", pronunciation:"Nghe–chỉ thanh, đọc theo đường cao độ và so sánh nhóm mā/má/mǎ/mà.", dialogue:"老师：你好！请听：一、七、八、十。\n学生：一、七、八、十。\n老师：很好，再说一次。", reading:"一、七、八、十。先 nghe, sau đó đọc chậm rồi đọc theo nhịp.", listening:"Nghe sáu âm tiết, đánh dấu thanh và lặp lại sau khoảng nghỉ hai giây.", speaking:"Tự ghi âm ba vòng: chậm, tốc độ học, tốc độ hội thoại; so sánh đường thanh.", writing:"Gõ pinyin có dấu cho sáu từ và ghi số thanh tương ứng.", task:"Đọc một dãy bốn số cho bạn học ghi lại."},
  {u:1, zh:"写好第一组汉字", vi:"Viết nhóm chữ đầu tiên", focus:["人","大","小","口","日","月"], grammar:["demonstratives"], chars:["人","大"], objective:"Nhận diện nét cơ bản và viết chữ theo đúng hướng nét.", pronunciation:"Giữ âm đầu rõ trong rén/dà/xiǎo; không nuốt thanh 3.", dialogue:"老师：这是什么字？\n学生：这是“人”。\n老师：这个呢？\n学生：这是“大”。", reading:"人、大、小、日、月 là các chữ đơn giản giúp nhận ra cấu trúc và vị trí nét.", listening:"Nghe tên chữ, chọn đúng hình và đọc lại cả từ mẫu.", speaking:"Chỉ vào chữ và nói: 这是… / 那是…", writing:"Viết mỗi chữ ba lần, đánh số thứ tự nét và tự kiểm tra điểm bắt đầu–kết thúc.", task:"Làm một thẻ chữ gồm chữ, pinyin, nghĩa và một từ có chữ đó."},
  {u:2, zh:"你好，我很好", vi:"Xin chào, tôi khỏe", focus:["你","好","我","很","也","谢谢","再见"], grammar:["adjective-predicate","ne-follow-up"], chars:["你","好"], objective:"Chào hỏi, đáp lời và hỏi lại tự nhiên trong cuộc gặp ngắn.", pronunciation:"Phân biệt nǐ/hěn và xử lý biến điệu thanh 3 trong 你好, 很好.", dialogue:"A：你好！\nB：你好！你好吗？\nA：我很好，谢谢。你呢？\nB：我也很好。再见！", reading:"小林 gặp 安娜 ở trường. Hai người chào, hỏi thăm và kết thúc bằng 再见.", listening:"Nghe hai lượt hội thoại; lượt một chọn quan hệ, lượt hai điền lời đáp.", speaking:"Đóng vai gặp bạn mới trong 30 giây, đổi vai và thay mức độ thân mật.", writing:"Viết một đoạn chat bốn dòng chào hỏi, hỏi thăm và tạm biệt.", task:"Chào một người thật bằng tiếng Trung và ghi lại câu họ đáp."},
  {u:2, zh:"我叫安娜", vi:"Tôi tên là Anna", focus:["叫","名字","什么","是","中国","人","越南"], grammar:["shi-identity","question-words"], chars:["叫","名"], objective:"Nói tên, quốc tịch và hỏi thông tin tương ứng.", pronunciation:"Phân biệt zh trong 中国 và âm cuối -ng; đọc tên riêng theo nhịp tự nhiên.", dialogue:"A：你叫什么名字？\nB：我叫安娜。你呢？\nA：我叫明。你是中国人吗？\nB：不是，我是越南人。", reading:"名片：安娜，学生，越南人。她学习汉语。", listening:"Nghe ba người tự giới thiệu và ghép tên với quốc tịch/vai trò.", speaking:"Tự giới thiệu 45 giây: tên, quốc tịch, vai trò và lý do học tiếng Trung.", writing:"Điền danh thiếp song ngữ và viết ba câu giới thiệu.", task:"Trao đổi danh thiếp giả với bạn và hỏi lại một thông tin chưa nghe rõ."},
  {u:2, zh:"请再说一次", vi:"Xin hãy nói lại một lần", focus:["请","说","听","看","写","读","对不起","没关系"], grammar:["ma-question","ba-suggestion"], chars:["请","说"], objective:"Xin nhắc lại, xác nhận nghe hiểu và phản hồi lịch sự.", pronunciation:"Luyện q/x/sh và nhịp câu 请再说一次; không đọc q như /k/.", dialogue:"A：对不起，我没听懂。请再说一次。\nB：我叫王明。\nA：你叫王明，对吗？\nB：对。没关系。", reading:"Trong lớp, khi không nghe rõ, hãy dùng 请再说一次 hoặc 请说慢一点儿, không im lặng đoán.", listening:"Nghe câu nhanh rồi chọn câu yêu cầu sửa chữa giao tiếp phù hợp.", speaking:"Role-play: người A nói nhỏ/nhanh; người B xin nhắc lại và xác nhận.", writing:"Viết ba câu dùng 请 để yêu cầu nghe, đọc hoặc viết lại.", task:"Trong một cuộc hội thoại thật, dùng ít nhất một câu xin nhắc lại lịch sự."},
  {u:3, zh:"这是我的家人", vi:"Đây là gia đình tôi", focus:["家","爸爸","妈妈","哥哥","姐姐","弟弟","妹妹","的"], grammar:["de-possession","demonstratives"], chars:["家","爸"], objective:"Giới thiệu thành viên gia đình và quan hệ sở hữu.", pronunciation:"Đọc thanh nhẹ trong 爸爸/妈妈 và giữ nhịp từ ghép hai âm tiết.", dialogue:"A：这是谁？\nB：这是我的妈妈。那是我的爸爸。\nA：你有哥哥吗？\nB：没有，我有一个妹妹。", reading:"我家有四个人：爸爸、妈妈、妹妹和我。爸爸是医生，妈妈是老师。", listening:"Nghe mô tả gia đình và chọn sơ đồ đúng.", speaking:"Giới thiệu ảnh gia đình trong 60 giây; có thể dùng nhân vật giả để bảo vệ riêng tư.", writing:"Viết 4–5 câu về một gia đình thật hoặc hư cấu.", task:"Tạo cây gia đình đơn giản và thuyết minh bằng tiếng Trung."},
  {u:3, zh:"他很高兴", vi:"Anh ấy rất vui", focus:["他","她","朋友","同学","老师","学生","高兴","漂亮","大","小"], grammar:["adjective-predicate","shi-identity"], chars:["他","她"], objective:"Giới thiệu một người và miêu tả bằng tính từ cơ bản.", pronunciation:"Phân biệt tā (他/她) trong nghe; chú ý âm p trong 漂亮 không bật sai kiểu tiếng Việt.", dialogue:"A：她是谁？\nB：她是我的同学。\nA：她怎么样？\nB：她很好，也很漂亮。", reading:"王老师是中国人。他很高，也很高兴认识新学生。", listening:"Nghe bốn mô tả, xác định người được nói tới dựa trên vai trò và đặc điểm.", speaking:"Chọn một nhân vật, nói 5 câu: quan hệ, vai trò, quốc tịch, hai đặc điểm.", writing:"Viết mô tả ngắn rồi gạch dưới câu 是 và khoanh câu vị ngữ tính từ.", task:"Giới thiệu một đồng nghiệp/bạn học theo cách tôn trọng, không bình phẩm nhạy cảm."},
  {u:4, zh:"这是什么意思", vi:"Cái này nghĩa là gì?", focus:["汉语","字","意思","什么","怎么","老师","学习","学校","书","本"], grammar:["question-words","demonstratives"], chars:["学","字"], objective:"Hỏi nghĩa, cách đọc và cách viết trong lớp học.", pronunciation:"Phân biệt x trong 学习 với s; luyện cụm 这个字怎么读.", dialogue:"学生：老师，这个字是什么意思？\n老师：是“học”。\n学生：怎么读？\n老师：读 xué。\n学生：请写一下。", reading:"学习汉语时，不懂可以问：这是什么意思？怎么读？怎么写？", listening:"Nghe ba câu hỏi lớp học và chọn hành động giáo viên cần thực hiện.", speaking:"Đóng vai giáo viên–học viên với ba thẻ từ mới.", writing:"Viết mẫu ghi chú từ mới gồm chữ, pinyin, nghĩa, câu ví dụ.", task:"Dùng tiếng Trung hỏi ít nhất một từ thật trong buổi học tiếp theo."},
  {u:4, zh:"我会说一点儿汉语", vi:"Tôi biết nói một chút tiếng Trung", focus:["会","能","可以","说","听","读","写","一点儿","汉语","英语"], grammar:["modal-verbs","negation"], chars:["会","能"], objective:"Nói kỹ năng, mức độ và xin phép đơn giản.", pronunciation:"Luyện huì/huí và nối nhịp 会说; tránh đọc 能 thành âm mũi quá ngắn.", dialogue:"A：你会说汉语吗？\nB：会说一点儿，但是不会写很多字。\nA：这里可以坐吗？\nB：可以。", reading:"小安会说越南语和一点儿汉语。她能听懂慢一点儿的话，也可以用手机写字。", listening:"Nghe từng người nói kỹ năng; đánh dấu 会/不会/能/不能.", speaking:"Bảng khảo sát lớp: hỏi ba người họ biết làm gì và báo cáo lại.", writing:"Viết 5 câu về kỹ năng ngôn ngữ, gồm một câu phủ định và một câu xin phép.", task:"Xin phép hoặc hỏi khả năng trong một tình huống thật bằng 可以…吗？"},
  {u:5, zh:"你的电话号码是多少", vi:"Số điện thoại của bạn là bao nhiêu?", focus:["零","一","二","两","三","四","五","六","七","八","九","十","百","电话","多少"], grammar:["numbers-time","question-words"], chars:["电","话"], objective:"Đọc và ghi số điện thoại, số phòng và số lượng cơ bản.", pronunciation:"Đọc dãy số từng chữ số, giữ rõ 二/一/七 và thanh 1 của 一 khi đọc số.", dialogue:"A：你的电话号码是多少？\nB：一三八，二零五六，七八九零。\nA：请再说一次。\nB：一三八，二零五六，七八九零。", reading:"房间号：508。电话：13820567890。人数：两个人。", listening:"Nghe năm dãy số, phân biệt số điện thoại với số lượng và số phòng.", speaking:"Đọc ba dãy số có khoảng nghỉ hợp lý; bạn học ghi lại và xác nhận.", writing:"Viết số bằng chữ Hán và chuyển chữ Hán thành chữ số.", task:"Mô phỏng trao đổi số liên lạc, dùng xin nhắc lại khi cần."},
  {u:5, zh:"今天几月几号", vi:"Hôm nay là ngày mấy?", focus:["今天","明天","昨天","年","月","号","星期","几","生日","现在"], grammar:["numbers-time","question-words"], chars:["今","明"], objective:"Hỏi và nói ngày, thứ, sinh nhật và mốc gần.", pronunciation:"Luyện j/q trong 今天/几 và âm cuối -ng của 星期.", dialogue:"A：今天几月几号？\nB：今天五月八号，星期三。\nA：明天呢？\nB：明天五月九号。", reading:"通知：五月十号，星期五，下午两点上汉语课。", listening:"Nghe lịch ngắn và chọn đúng ngày–thứ–hoạt động.", speaking:"Hỏi lịch của bạn: hôm nay, ngày mai, sinh nhật và một ngày hẹn.", writing:"Viết lịch ba ngày bằng tiếng Trung, theo thứ tự năm–tháng–ngày.", task:"Đọc một thông báo ngày giờ thật và chuyển thành lịch cá nhân."},
  {u:5, zh:"我们三点见", vi:"Chúng ta gặp lúc 3 giờ", focus:["点","分","半","上午","中午","下午","时候","见","来","去"], grammar:["time-order","numbers-time"], chars:["点","分"], objective:"Hẹn giờ, xác nhận thời điểm và xử lý thay đổi đơn giản.", pronunciation:"Phân biệt diǎn/tiān; luyện nhịp 三点半见.", dialogue:"A：你什么时候来？\nB：我下午三点来。\nA：三点半可以吗？\nB：可以，我们三点半见。", reading:"约会：星期六上午九点，在学校门口见。请不要迟到。", listening:"Nghe bốn cuộc hẹn và điền người–giờ–địa điểm.", speaking:"Thương lượng một giờ gặp phù hợp; ít nhất một lần đề xuất giờ khác.", writing:"Viết tin nhắn hẹn gồm ngày, giờ, nơi, lời xác nhận.", task:"Tạo một cuộc hẹn giả trên lịch và nói lại toàn bộ thông tin không nhìn mẫu."},
  {u:6, zh:"我每天八点上班", vi:"Mỗi ngày tôi đi làm lúc 8 giờ", focus:["每天","早上","起床","吃饭","上班","下班","回家","睡觉","工作","时候"], grammar:["time-order","negation"], chars:["上","下"], objective:"Kể thói quen hằng ngày theo trình tự thời gian.", pronunciation:"Phân biệt shàng/shuì và giữ thanh 4 rõ trong chuỗi hoạt động.", dialogue:"A：你每天几点起床？\nB：我七点起床，八点上班。\nA：几点下班？\nB：五点下班，然后回家。", reading:"我早上七点起床，七点半吃饭。八点上班，下午五点下班，晚上十一点睡觉。", listening:"Nghe lịch sinh hoạt, sắp xếp thẻ hoạt động theo đúng thứ tự.", speaking:"Nói một ngày thường trong 60–90 giây, dùng ít nhất bốn mốc giờ.", writing:"Viết timeline sáu hoạt động, sau đó đổi một chi tiết và đọc lại.", task:"So sánh lịch của mình với bạn bằng câu ngắn, tìm một điểm giống nhau."},
  {u:6, zh:"书在桌子上", vi:"Sách ở trên bàn", focus:["在","有","里","上","下","前面","后面","桌子","椅子","东西"], grammar:["zai-location","you-existence"], chars:["在","里"], objective:"Nói vị trí của người/vật và sự tồn tại trong không gian quen thuộc.", pronunciation:"Luyện zài/zǎi và âm cuốn lưỡi nhẹ trong 桌子; không thêm âm cuối tiếng Việt.", dialogue:"A：我的书在哪儿？\nB：在桌子上。\nA：桌子上有手机吗？\nB：没有，手机在椅子上。", reading:"房间里有一张桌子和两把椅子。电脑在桌子上，书在电脑旁边。", listening:"Nghe mô tả phòng và đặt biểu tượng đúng vị trí.", speaking:"Mô tả bàn làm việc mà người nghe không nhìn thấy; người nghe vẽ sơ đồ.", writing:"Viết 5 câu, phân biệt hai mẫu 在 và 有.", task:"Tìm một đồ vật bị ‘thất lạc’ trong trò chơi chỉ dẫn vị trí."},
  {u:6, zh:"他正在看书", vi:"Anh ấy đang đọc sách", focus:["正在","看","读","写","听","说","做","学习","工作","呢"], grammar:["progressive","ne-follow-up"], chars:["看","听"], objective:"Mô tả hành động đang diễn ra và hỏi người khác đang làm gì.", pronunciation:"Luyện zhèngzài với hai âm đầu khác nhau; đọc 看书 theo cụm.", dialogue:"A：你在做什么呢？\nB：我正在看书。你呢？\nA：我在写汉字。\nB：老师在做什么？\nA：他在听我们说话。", reading:"现在是晚上八点。爸爸在看电视，妈妈在看书，我正在学习汉语。", listening:"Nghe âm thanh/hội thoại ngắn và chọn hành động đang diễn ra.", speaking:"Trò đoán hành động: diễn tả hoặc làm động tác, bạn hỏi và đoán bằng 正在.", writing:"Viết mô tả một bức tranh có ít nhất ba người đang làm việc khác nhau.", task:"Gửi bản ghi âm 30 giây mô tả những gì đang xảy ra quanh mình."},
  {u:7, zh:"我喜欢吃米饭", vi:"Tôi thích ăn cơm", focus:["吃","喝","米饭","面条","菜","水果","苹果","茶","水","喜欢","不喜欢"], grammar:["negation","xiang-yao"], chars:["吃","喝"], objective:"Nói món thích/không thích và hỏi lựa chọn ăn uống.", pronunciation:"Phân biệt chī/qī và hē/hé; giữ thanh 1 dài vừa phải.", dialogue:"A：你喜欢吃什么？\nB：我喜欢吃米饭和菜。你呢？\nA：我喜欢面条，不喜欢吃太甜的东西。\nB：你想喝茶吗？\nA：想。", reading:"小王早上喝水，中午吃米饭和菜，晚上喜欢吃面条。他每天也吃水果。", listening:"Nghe ba người chọn món và ghi thích/không thích.", speaking:"Phỏng vấn bạn về ba món ăn và hai đồ uống, báo cáo lại bằng 他/她.", writing:"Viết thực đơn một ngày và hai câu giải thích lựa chọn.", task:"Nói yêu cầu ăn uống thật của mình bằng cách lịch sự, không phán xét khẩu vị người khác."},
  {u:7, zh:"我要一杯茶", vi:"Tôi muốn một cốc trà", focus:["要","想","请","杯","碗","个","本","些","多少","钱","包子","茶"], grammar:["xiang-yao","demonstratives"], chars:["要","杯"], objective:"Gọi món, nói lượng và xác nhận yêu cầu đơn giản.", pronunciation:"Luyện yào/yǒu, bēi/bèi; chú ý thanh nhẹ của 个.", dialogue:"服务员：你好，请问你要什么？\n顾客：我要一碗面条和两个包子。\n服务员：喝什么？\n顾客：一杯茶。多少钱？\n服务员：二十五块。", reading:"菜单：米饭十块，面条十五块，包子三块一个，茶五块一杯。", listening:"Nghe đơn hàng, chọn đúng món–lượng–giá và phát hiện một món thiếu.", speaking:"Role-play gọi món; người phục vụ phải xác nhận lại toàn bộ đơn.", writing:"Viết một đơn hàng có ba món, lượng từ và tổng tiền.", task:"Tự gọi một món giả bằng tiếng Trung, dùng 请问 và 谢谢."},
  {u:8, zh:"这个东西很好看", vi:"Đồ này trông đẹp", focus:["东西","衣服","书","电脑","手机","电视","漂亮","好看","大","小","新","旧"], grammar:["demonstratives","adjective-predicate"], chars:["这","那"], objective:"Chỉ đồ vật và miêu tả màu/kích thước/trạng thái cơ bản.", pronunciation:"Luyện zhè/nà và phân biệt xīn/xìng; đọc cụm 这个东西 theo nhịp.", dialogue:"A：这件衣服怎么样？\nB：很好看，也不太大。\nA：那件呢？\nB：那件很漂亮，但是有一点儿小。", reading:"这是我的新手机。它不大，很好看。那个旧电脑是我爸爸的。", listening:"Nghe mô tả, chọn đúng đồ vật giữa bốn phương án gần giống.", speaking:"Mô tả một đồ vật mà không nói tên; bạn đoán.", writing:"Viết quảng cáo ngắn 4 câu cho một đồ vật, không dùng lời phóng đại sai sự thật.", task:"Chọn giữa hai đồ vật và giải thích bằng ba tiêu chí đơn giản."},
  {u:8, zh:"这个多少钱", vi:"Cái này bao nhiêu tiền?", focus:["买","卖","钱","块","多少","贵","便宜","这","那","哪个","太","了"], grammar:["question-words","le-change","adjective-predicate"], chars:["买","钱"], objective:"Hỏi giá, phản hồi mức giá và chọn sản phẩm.", pronunciation:"Phân biệt mǎi/mài và guì/kuài; luyện câu 多少钱 liền mạch.", dialogue:"顾客：这个多少钱？\n店员：八十块。\n顾客：太贵了。那个呢？\n店员：那个五十块。\n顾客：好，我买那个。", reading:"商店今天有活动：苹果五块一斤，茶二十块一盒，这本书三十块。", listening:"Nghe ba cuộc mua bán, ghi giá và lựa chọn cuối.", speaking:"Role-play mua hàng với ngân sách giới hạn; hỏi ít nhất hai món trước khi chọn.", writing:"Viết hội thoại sáu lượt về hỏi giá và quyết định mua/không mua.", task:"Đọc một nhãn giá thật bằng tiếng Trung hoặc chuyển một nhãn giá Việt sang câu Trung đúng."},
  {u:9, zh:"医院在哪儿", vi:"Bệnh viện ở đâu?", focus:["哪儿","这里","那里","前面","后面","左边","右边","旁边","医院","学校","商店","饭店"], grammar:["zai-location","question-words"], chars:["前","后"], objective:"Hỏi nơi chốn và chỉ vị trí tương đối rất ngắn.", pronunciation:"Luyện nǎr/nàli và âm cuối -ng trong 旁边; không bỏ thanh ở từ chỉ hướng.", dialogue:"A：请问，医院在哪儿？\nB：在学校前面。\nA：商店呢？\nB：商店在医院旁边。\nA：谢谢！\nB：不客气。", reading:"从学校门口往前走，左边是商店，右边是饭店。医院在饭店后面。", listening:"Nghe chỉ dẫn và chọn đúng điểm đến trên sơ đồ.", speaking:"Một người hỏi ba địa điểm; người kia chỉ bằng sơ đồ, sau đó đổi vai.", writing:"Viết 5 câu mô tả vị trí các nơi trong khu phố.", task:"Chỉ đường từ phòng học đến một địa điểm thật bằng câu cực ngắn, rõ ràng."},
  {u:9, zh:"我坐出租车去", vi:"Tôi đi bằng taxi", focus:["坐","开","走","来","去","回","出租车","车","飞机","火车","怎么","到"], grammar:["question-words","time-order"], chars:["车","走"], objective:"Nói phương tiện, điểm đi/đến và cách di chuyển.", pronunciation:"Phân biệt zuò/zǒu và chē/qù; luyện cụm 坐出租车.", dialogue:"A：你怎么去公司？\nB：我坐出租车去。你呢？\nA：我坐车，晚上走路回家。\nB：你几点到？\nA：八点到。", reading:"明天我去北京。上午坐火车去，下午三点到。朋友开车来接我。", listening:"Nghe hành trình, điền phương tiện–giờ–điểm đến.", speaking:"Lập kế hoạch đi từ nhà đến ba địa điểm, giải thích phương tiện.", writing:"Viết lịch trình ngắn có đi, đến, về và hai mốc giờ.", task:"Hỏi một người thật họ đi làm/đi học bằng gì và nói lại câu trả lời."},
  {u:10, zh:"今天天气怎么样", vi:"Hôm nay thời tiết thế nào?", focus:["天气","晴","阴","下雨","热","冷","怎么样","今天","明天","太","很","了"], grammar:["adjective-predicate","le-change"], chars:["天","雨"], objective:"Mô tả thời tiết và phản ứng với thay đổi thời tiết.", pronunciation:"Phân biệt qíng/qǐng và lěng/rè; luyện ngữ điệu câu 怎么样.", dialogue:"A：今天天气怎么样？\nB：很热。\nA：明天呢？\nB：明天下雨，也有一点儿冷。\nA：那我们不去公园了。", reading:"天气预报：星期六晴，二十八度；星期天下雨，二十度。出门请带伞。", listening:"Nghe dự báo hai ngày và chọn quần áo/kế hoạch phù hợp.", speaking:"Đóng vai người dẫn dự báo 45 giây cho ba ngày.", writing:"Viết ba câu thời tiết và một câu thay đổi kế hoạch.", task:"Xem thời tiết tại nơi mình sống và báo lại bằng tiếng Trung đơn giản."},
  {u:10, zh:"我有一点儿不舒服", vi:"Tôi hơi không khỏe", focus:["身体","头","眼睛","不舒服","医生","医院","休息","水","吃药","能","不能","请"], grammar:["you-existence","modal-verbs","negation"], chars:["医","休"], objective:"Nói cảm giác cơ thể cơ bản, xin hỗ trợ và hiểu lời khuyên rất ngắn.", pronunciation:"Luyện shēntǐ/shūfu và qǐng/qīng; giữ thanh nhẹ trong 舒服.", dialogue:"A：你怎么了？\nB：我有一点儿不舒服，头很疼。\nA：你能去医院吗？\nB：能。\nA：多喝水，好好休息。", reading:"今天小李不舒服。他不去上班，在家休息。下午他去医院看医生。", listening:"Nghe triệu chứng và lời khuyên, ghép đúng cặp; không suy diễn chẩn đoán.", speaking:"Role-play báo tình trạng đơn giản và nhờ giúp đỡ; tránh tự chẩn đoán bệnh.", writing:"Viết tin nhắn xin nghỉ ngắn: tình trạng, hành động, lời cảm ơn.", task:"Chuẩn bị ba câu khẩn cấp cơ bản; khi thật sự bệnh phải tìm người/chuyên môn, không chỉ dựa vào bài học."},
  {u:10, zh:"周末我们去公园吧", vi:"Cuối tuần chúng ta đi công viên nhé", focus:["周末","想","要","可以","一起","公园","看电影","吃饭","什么时候","哪儿","吧","好"], grammar:["xiang-yao","ba-suggestion","modal-verbs"], chars:["想","去"], objective:"Đề xuất, chấp nhận/từ chối lịch sự và thống nhất kế hoạch gần.", pronunciation:"Luyện xiǎng/xiàng và ngữ điệu mềm với 吧; đọc 可以吗 liền mạch.", dialogue:"A：周末你想做什么？\nB：我想看电影。\nA：我们一起去吧。\nB：好。什么时候？\nA：星期六下午三点，可以吗？\nB：可以。", reading:"群消息：星期六下午三点在学校门口见。我们先吃饭，再去看电影。下雨的话，改到星期天。", listening:"Nghe nhóm bạn thương lượng và xác định kế hoạch cuối cùng.", speaking:"Nhóm ba người phải thống nhất hoạt động, giờ và nơi; mỗi người đưa một đề xuất.", writing:"Viết tin nhắn mời, gồm hoạt động, thời gian, địa điểm và câu hỏi xác nhận.", task:"Mời một người tham gia hoạt động giả, phản hồi lịch sự dù đồng ý hay từ chối."},
];

const characterDefinitions = [
  ["一","一",["yī"],[]],["八","八",["bā"],[]],["人","人",["rén"],[]],["大","大",["dà"],["太"]],
  ["你","亻",["nǐ"],["他"]],["好","女",["hǎo"],[]],["叫","口",["jiào"],[]],["名","口",["míng"],[]],
  ["请","讠",["qǐng"],["清"]],["说","讠",["shuō"],[]],["家","宀",["jiā"],[]],["爸","父",["bà"],[]],
  ["他","亻",["tā"],["她"]],["她","女",["tā"],["他"]],["学","子",["xué"],[]],["字","宀",["zì"],[]],
  ["会","人",["huì"],[]],["能","月",["néng"],[]],["电","田",["diàn"],[]],["话","讠",["huà"],[]],
  ["今","人",["jīn"],[]],["明","日",["míng"],[]],["点","灬",["diǎn"],[]],["分","刀",["fēn"],[]],
  ["上","一",["shàng"],["下"]],["下","一",["xià"],["上"]],["在","土",["zài"],[]],["里","里",["lǐ"],[]],
  ["看","目",["kàn"],[]],["听","口",["tīng"],[]],["吃","口",["chī"],[]],["喝","口",["hē"],[]],
  ["要","覀",["yào"],[]],["杯","木",["bēi"],[]],["这","辶",["zhè"],["过"]],["那","阝",["nà"],[]],
  ["买","乙",["mǎi"],["卖"]],["钱","钅",["qián"],[]],["前","刂",["qián"],["后"]],["后","口",["hòu"],["前"]],
  ["车","车",["chē"],[]],["走","走",["zǒu"],[]],["天","大",["tiān"],[]],["雨","雨",["yǔ"],[]],
  ["医","匚",["yī"],[]],["休","亻",["xiū"],[]],["想","心",["xiǎng"],[]],["去","厶",["qù"],[]],
  ["认","讠",["rèn"],[]],["识","讠",["shí"],[]]
];

const enrichmentSeed = {
  "爱": [[["爱家人","yêu gia đình"],["爱学习","thích học"]], ["Không dùng 爱 cho mọi mức độ ‘thích’; 喜欢 thường trung tính hơn."]],
  "吧": [[["走吧","đi nhé"],["吃饭吧","ăn cơm nhé"]], ["吧 đứng cuối câu; không đặt trước lời đề nghị."]],
  "爸爸": [[["我爸爸","bố tôi"],["爸爸妈妈","bố mẹ"]], ["Âm tiết thứ hai thường đọc thanh nhẹ: bàba."]],
  "白天": [[["白天上班","ban ngày đi làm"],["白天很热","ban ngày rất nóng"]], ["Không nhầm 白天 với 明天."]],
  "请": [[["请坐","mời ngồi"],["请再说一次","xin nói lại lần nữa"]], ["请 làm yêu cầu lịch sự hơn nhưng vẫn cần ngữ điệu phù hợp."]],
  "说": [[["说汉语","nói tiếng Trung"],["说慢一点儿","nói chậm một chút"]], ["说 là nói; 告诉 là nói/cho biết có người nhận thông tin."]],
  "的": [[["我的书","sách của tôi"],["漂亮的衣服","quần áo đẹp"]], ["Đừng dùng trật tự tiếng Việt 书我的."]],
  "有": [[["有时间","có thời gian"],["学校里有商店","trong trường có cửa hàng"]], ["Phủ định bằng 没有, không dùng 不有."]],
  "在": [[["在学校学习","học ở trường"],["书在桌子上","sách ở trên bàn"]], ["Cụm 在 + nơi chốn thường đứng trước động từ hành động."]],
  "会": [[["会说汉语","biết nói tiếng Trung"],["会开车","biết lái xe"]], ["会 thiên về kỹ năng đã học; 能/可以 có nghĩa khác."]],
  "能": [[["能听懂","có thể nghe hiểu"],["今天不能来","hôm nay không thể đến"]], ["Không thay mọi 可以 bằng 能 khi hỏi xin phép."]],
  "可以": [[["可以坐吗","có thể ngồi không"],["这里可以看书","ở đây có thể đọc sách"]], ["Câu xin phép cần ngữ điệu lịch sự, không chỉ thêm 可以."]],
  "想": [[["想喝茶","muốn uống trà"],["想去北京","muốn đi Bắc Kinh"]], ["想 mềm hơn 要 khi nói mong muốn."]],
  "要": [[["要一杯水","muốn một cốc nước"],["明天要上班","ngày mai phải/sẽ đi làm"]], ["要 có thể là muốn, cần hoặc sắp; phải đọc theo ngữ cảnh."]],
  "买": [[["买衣服","mua quần áo"],["买一本书","mua một quyển sách"]], ["Phân biệt thanh 3 买 với thanh 4 卖."]],
  "钱": [[["多少钱","bao nhiêu tiền"],["没有钱","không có tiền"]], ["多少钱 là một cụm hỏi giá; không đảo thành 钱多少."]],
  "几": [[["几个人","mấy người"],["几点","mấy giờ"]], ["几 thường dùng khi dự kiến số lượng nhỏ và cần lượng từ."]],
  "多少": [[["多少钱","bao nhiêu tiền"],["电话号码是多少","số điện thoại là bao nhiêu"]], ["多少 có thể không cần lượng từ trong nhiều câu hỏi."]],
  "哪儿": [[["去哪儿","đi đâu"],["在哪儿","ở đâu"]], ["哪儿 giữ vị trí của câu trả lời, không kéo lên đầu câu."]],
  "怎么": [[["怎么去","đi bằng cách nào"],["这个字怎么读","chữ này đọc thế nào"]], ["怎么 hỏi cách thức; 怎么样 hỏi đánh giá/trạng thái."]],
  "怎么样": [[["天气怎么样","thời tiết thế nào"],["这件衣服怎么样","bộ đồ này thế nào"]], ["Không thay 怎么 trong câu hỏi cách làm."]],
  "喜欢": [[["喜欢吃米饭","thích ăn cơm"],["很喜欢学习","rất thích học"]], ["Tân ngữ hoặc động từ hoạt động đứng sau 喜欢."]],
  "吃": [[["吃饭","ăn cơm/ăn bữa"],["吃水果","ăn hoa quả"]], ["吃饭 là ăn bữa, không chỉ nghĩa đen ‘ăn cơm’."]],
  "喝": [[["喝水","uống nước"],["喝茶","uống trà"]], ["Phân biệt hē với hé (和)."]],
  "来": [[["来学校","đến trường"],["明天来","ngày mai đến"]], ["来 hướng về điểm quy chiếu; 去 rời điểm quy chiếu."]],
  "去": [[["去医院","đi bệnh viện"],["坐车去","đi bằng xe"]], ["Không dùng 来/去 chỉ theo bản dịch tiếng Việt; cần xét hướng."]],
  "回": [[["回家","về nhà"],["回公司","quay về công ty"]], ["回 nhấn mạnh quay lại nơi gốc/quen thuộc."]],
  "看": [[["看书","đọc sách"],["看医生","đi khám bác sĩ"]], ["看 thay đổi nghĩa theo tân ngữ; không dịch cứng thành ‘nhìn’."]],
  "听": [[["听汉语","nghe tiếng Trung"],["听老师说","nghe giáo viên nói"]], ["听 là hành động nghe; 听见/听懂 nói kết quả."]],
  "写": [[["写汉字","viết chữ Hán"],["写名字","viết tên"]], ["Cụm động–tân giữ trật tự 写 + nội dung."]],
  "读": [[["读课文","đọc bài khóa"],["怎么读","đọc thế nào"]], ["读 có thể là đọc thành tiếng/học; 看书 thường là đọc sách."]],
  "老师": [[["汉语老师","giáo viên tiếng Trung"],["王老师","thầy/cô Vương"]], ["Họ + 老师 là cách xưng hô; không thêm 先生 tùy tiện."]],
  "学生": [[["大学生","sinh viên đại học"],["我是学生","tôi là học sinh/sinh viên"]], ["Nghĩa cụ thể phụ thuộc bậc học trong ngữ cảnh."]],
  "朋友": [[["好朋友","bạn tốt/thân"],["中国朋友","người bạn Trung Quốc"]], ["朋友 không tự động mang nghĩa người yêu."]],
  "家": [[["回家","về nhà"],["我家有四个人","nhà/gia đình tôi có bốn người"]], ["家 có thể là nhà hoặc gia đình tùy cấu trúc."]],
  "名字": [[["叫什么名字","tên là gì"],["写名字","viết tên"]], ["Không dùng 名字 để xưng hô trực tiếp với người."]],
  "今天": [[["今天上班","hôm nay đi làm"],["今天几号","hôm nay ngày mấy"]], ["Biểu thức thời gian thường đứng trước động từ."]],
  "明天": [[["明天见","mai gặp"],["明天下雨","ngày mai trời mưa"]], ["Không nhầm 明天 với 白天."]],
  "昨天": [[["昨天没上班","hôm qua không đi làm"],["昨天天气很好","hôm qua thời tiết đẹp"]], ["Khi dùng 没 cho việc không xảy ra, thường không thêm 了."]],
  "现在": [[["现在几点","bây giờ mấy giờ"],["现在在工作","hiện đang làm việc"]], ["现在 là mốc thời gian; 正在 là dấu hiệu tiến hành."]],
  "上班": [[["八点上班","8 giờ đi làm"],["在公司上班","làm việc ở công ty"]], ["上班 là đi/làm ca làm, không phải ‘lên lớp’."]],
  "下班": [[["五点下班","5 giờ tan làm"],["下班以后","sau khi tan làm"]], ["下班 không dùng cho tan học; tan học là 下课/放学."]],
  "起床": [[["七点起床","7 giờ thức dậy"],["早起床","dậy sớm"]], ["起床 là ra khỏi giường, khác 睡醒 là tỉnh giấc."]],
  "睡觉": [[["晚上睡觉","ngủ buổi tối"],["十一点睡觉","11 giờ đi ngủ"]], ["睡觉 là ngủ/đi ngủ, không dùng 是 trước động từ."]],
  "米饭": [[["吃米饭","ăn cơm"],["一碗米饭","một bát cơm"]], ["饭 có thể là bữa ăn; 米饭 là cơm chín."]],
  "茶": [[["喝茶","uống trà"],["一杯茶","một cốc trà"]], ["Dùng lượng từ 杯 khi gọi một cốc trà."]],
  "水": [[["喝水","uống nước"],["一杯水","một cốc nước"]], ["水 là danh từ khối; khi đếm cần đơn vị chứa/lượng."]],
  "苹果": [[["吃苹果","ăn táo"],["三个苹果","ba quả táo"]], ["Dùng lượng từ 个 trong ngữ cảnh cơ bản."]],
  "衣服": [[["买衣服","mua quần áo"],["这件衣服","bộ/chiếc đồ này"]], ["件 là lượng từ tự nhiên cho quần áo, không phải 本."]],
  "书": [[["看书","đọc sách"],["一本书","một quyển sách"]], ["Lượng từ của sách là 本."]],
  "电脑": [[["用电脑","dùng máy tính"],["电脑在桌子上","máy tính ở trên bàn"]], ["电脑 thường chỉ máy tính nói chung; 手机 là điện thoại di động."]],
  "出租车": [[["坐出租车","đi taxi"],["出租车来了","taxi đến rồi"]], ["Phương tiện dùng 坐, không dùng 做."]],
  "天气": [[["天气很好","thời tiết đẹp"],["天气怎么样","thời tiết thế nào"]], ["Không dùng 是 trước tính từ trong miêu tả cơ bản."]],
  "下雨": [[["今天下雨","hôm nay mưa"],["下雨了","trời mưa rồi"]], ["下雨 là động từ–tân ngữ cố định; không thêm 是."]],
  "热": [[["天气很热","trời nóng"],["太热了","nóng quá"]], ["Câu tính từ không cần 是."]],
  "冷": [[["今天很冷","hôm nay lạnh"],["有一点儿冷","hơi lạnh"]], ["Phân biệt lěng với néng trong phát âm."]],
  "医生": [[["看医生","đi khám bác sĩ"],["他是医生","anh ấy là bác sĩ"]], ["看医生 nghĩa là đi khám, không chỉ ‘nhìn bác sĩ’."]],
  "医院": [[["去医院","đi bệnh viện"],["医院在哪儿","bệnh viện ở đâu"]], ["Cụm nơi chốn với 去 không cần 在: 去医院."]],
  "不舒服": [[["有一点儿不舒服","hơi không khỏe"],["身体不舒服","cơ thể không khỏe"]], ["Chỉ mô tả cảm giác; không dùng để tự chẩn đoán bệnh cụ thể."]],
  "休息": [[["在家休息","nghỉ ở nhà"],["好好休息","nghỉ ngơi cho tốt"]], ["休息 là động từ; không dùng 是休息."]],
  "再见": [[["老师，再见","chào thầy/cô"],["明天见","mai gặp"]], ["再见 dùng khi chia tay; không phải lời chào lúc gặp."]],
  "谢谢": [[["谢谢你","cảm ơn bạn"],["谢谢老师","cảm ơn thầy/cô"]], ["Phản hồi thường là 不客气/不用谢, không phải 没关系 trong mọi tình huống."]],
  "对不起": [[["对不起，我来晚了","xin lỗi, tôi đến muộn"],["对不起，请再说一次","xin lỗi, xin nói lại"]], ["Dùng cho xin lỗi hoặc mở lời sửa chữa; không lạm dụng khi chỉ cảm ơn."]],
  "没关系": [[["没关系，请坐","không sao, mời ngồi"],["A：对不起。B：没关系。","A: xin lỗi. B: không sao."]], ["Thường đáp lời xin lỗi; đáp cảm ơn nên dùng 不客气."]],
  "认识": [[["认识你很高兴","rất vui được biết bạn"],["我认识他","tôi biết anh ấy"]], ["认识 là biết/quen người hoặc sự vật; 知道 thiên về biết thông tin."]],
  "工作": [[["在公司工作","làm việc ở công ty"],["找工作","tìm việc"]], ["工作 vừa là động từ vừa là danh từ; trật tự phụ thuộc chức năng."]],
  "学习": [[["学习汉语","học tiếng Trung"],["在学校学习","học ở trường"]], ["学习 nhấn mạnh quá trình học; 学 có phạm vi rộng và khẩu ngữ hơn."]],
  "学校": [[["去学校","đi trường"],["学校里","trong trường"]], ["去 + nơi chốn không thêm 在."]],
  "很": [[["很好","rất/tương đối tốt"],["很漂亮","đẹp"]], ["Trong câu tính từ trung tính, 很 có thể chủ yếu làm câu tự nhiên chứ không nhấn ‘rất’."]],
  "太": [[["太贵了","đắt quá"],["太好了","tốt quá"]], ["Mẫu thường là 太 + tính từ + 了."]],
  "了": [[["下雨了","trời mưa rồi"],["我吃饭了","tôi ăn rồi"]], ["Không gắn 了 máy móc vào mọi câu quá khứ."]],
  "吗": [[["你好吗","bạn khỏe không"],["可以吗","được không"]], ["Không dùng 吗 với từ nghi vấn 谁/什么/哪儿."]],
  "呢": [[["你呢","còn bạn"],["我的书呢","sách tôi đâu"]], ["呢 không thay thế tùy ý cho 吗."]],
  "谁": [[["他是谁","anh ấy là ai"],["谁是老师","ai là giáo viên"]], ["谁 đứng đúng vị trí của người cần hỏi."]],
  "什么": [[["这是什么","đây là gì"],["你想吃什么","bạn muốn ăn gì"]], ["Không thêm 吗 sau câu đã có 什么."]],
  "本": [[["一本书","một quyển sách"],["这本书","quyển sách này"]], ["本 là lượng từ cho sách/tạp chí; không dùng cho người."]],
  "个": [[["一个人","một người"],["这个东西","đồ vật này"]], ["个 là lượng từ chung nhưng không thay mọi lượng từ chuyên biệt."]],
  "杯": [[["一杯茶","một cốc trà"],["两杯水","hai cốc nước"]], ["杯 đếm đồ uống theo cốc; không phải bản thân chất lỏng."]],
  "点": [[["八点","8 giờ"],["一点儿","một chút"]], ["点 có nhiều nghĩa; 点 trong giờ khác 一点儿 chỉ lượng nhỏ."]],
  "半": [[["三点半","3 giờ rưỡi"],["半年","nửa năm"]], ["Trong giờ, 半 đứng sau 点: 三点半."]],
  "前面": [[["学校前面","phía trước trường"],["前面有商店","phía trước có cửa hàng"]], ["前面 là danh từ vị trí; thường cần 的 hoặc đứng sau nơi chốn."]],
  "后面": [[["医院后面","phía sau bệnh viện"],["后面有人","phía sau có người"]], ["Không đảo thành 后面医院 khi muốn nói ‘phía sau bệnh viện’."]],
  "上": [[["桌子上","trên bàn"],["上班","đi làm"]], ["上 trong từ ghép có thể không còn nghĩa không gian trực tiếp."]],
  "下": [[["桌子下","dưới bàn"],["下班","tan làm"]], ["下 có nghĩa không gian và tham gia nhiều từ ghép; phải đọc theo cụm."]],
  "里": [[["学校里","trong trường"],["家里","ở/trong nhà"]], ["Nơi chốn + 里; không đặt 里 trước danh từ."]],
  "坐": [[["坐车","đi xe"],["请坐","mời ngồi"]], ["Phân biệt 坐 (ngồi/đi phương tiện) với 做 (làm)."]],
  "走": [[["走路","đi bộ"],["我们走吧","chúng ta đi nhé"]], ["走 có thể là đi/rời đi; không luôn đồng nghĩa 去."]],
  "好看": [[["衣服很好看","quần áo đẹp"],["这本书好看","quyển sách này hay/dễ xem"]], ["好看 dùng cho vẻ ngoài hoặc nội dung hấp dẫn; 漂亮 thiên về đẹp."]],
  "漂亮": [[["很漂亮","rất đẹp"],["漂亮的衣服","quần áo đẹp"]], ["Khi đứng trước danh từ thường cần 的."]],
  "大": [[["大房间","phòng lớn"],["很大","rất/là lớn"]], ["Không dùng 是大 trong câu miêu tả cơ bản."]],
  "小": [[["小孩子","trẻ nhỏ"],["有一点儿小","hơi nhỏ"]], ["小 trước danh từ có thể biểu thị nhỏ hoặc thân mật tùy từ."]],
  "高兴": [[["很高兴认识你","rất vui được biết bạn"],["今天很高兴","hôm nay rất vui"]], ["高兴 là cảm xúc; 好 là đánh giá chung, không thay hoàn toàn."]],
  "汉语": [[["学习汉语","học tiếng Trung"],["说汉语","nói tiếng Trung"]], ["汉语 nhấn mạnh ngôn ngữ; 中文 có phạm vi dùng khác."]],
  "中国": [[["中国人","người Trung Quốc"],["去中国","đi Trung Quốc"]], ["Tên nước + 人 tạo quốc tịch, không thêm 的 trong mẫu cơ bản."]],
  "人": [[["一个人","một người"],["越南人","người Việt Nam"]], ["Khi đếm người cần lượng từ 个 trong mẫu cơ bản."]],
  "我": [[["我是学生","tôi là học sinh"],["我的书","sách của tôi"]], ["Không lặp đại từ làm chủ ngữ nếu ngữ cảnh đã rõ một cách máy móc."]],
  "你": [[["你好吗","bạn khỏe không"],["你的名字","tên của bạn"]], ["Trong giao tiếp trang trọng có thể cần 您; HSK1 vẫn ưu tiên 你 trong ngữ cảnh phù hợp."]],
  "他": [[["他是老师","anh ấy là giáo viên"],["他的朋友","bạn của anh ấy"]], ["他 và 她 cùng phát âm tā, phải dựa ngữ cảnh khi nghe."]],
  "她": [[["她很高兴","cô ấy rất vui"],["她的家","nhà/gia đình cô ấy"]], ["Trong khẩu ngữ không phân biệt âm với 他."]],
  "我们": [[["我们一起去","chúng ta cùng đi"],["我们的老师","giáo viên của chúng tôi"]], ["我们 có thể bao gồm hoặc không bao gồm người nghe tùy ngữ cảnh; 咱们 thường bao gồm người nghe."]],
  "也": [[["我也很好","tôi cũng khỏe"],["也喜欢学习","cũng thích học"]], ["也 đứng trước động từ/tính từ, không đặt cuối câu như ‘cũng’."]],
  "都": [[["我们都学习汉语","chúng tôi đều học tiếng Trung"],["这些都很好","những cái này đều tốt"]], ["都 đứng sau chủ ngữ/chủ đề số nhiều và trước vị ngữ."]],
  "和": [[["爸爸和妈妈","bố và mẹ"],["茶和水","trà và nước"]], ["和 nối danh từ/cụm danh từ; không dùng thay mọi liên từ nối câu."]],
  "不": [[["不喝茶","không uống trà"],["不是老师","không phải giáo viên"]], ["不 thường phủ định hiện tại, thói quen, ý định; không dùng với 有."]],
  "没有": [[["没有时间","không có thời gian"],["今天没有课","hôm nay không có tiết"]], ["没有 vừa phủ định sở hữu/tồn tại vừa phủ định việc chưa xảy ra; không thêm 不."]],
  "是": [[["我是学生","tôi là học sinh"],["这是书","đây là sách"]], ["Không dùng 是 trước tính từ trong câu miêu tả đơn giản."]],
  "这": [[["这个人","người này"],["这本书","quyển sách này"]], ["Từ chỉ định thường đi với lượng từ trước danh từ."]],
  "那": [[["那个人","người kia"],["那本书","quyển sách kia"]], ["Phân biệt 那 nà với 哪 nǎ trong phát âm và nghĩa."]],
  "哪": [[["哪个人","người nào"],["哪本书","quyển sách nào"]], ["哪 thường cần lượng từ khi chọn trong một tập hợp."]],
  "时间": [[["有时间","có thời gian"],["什么时间","thời gian nào"]], ["Khi hỏi giờ cụ thể, 什么时候 thường tự nhiên hơn tùy ngữ cảnh."]],
  "时候": [[["什么时候","khi nào"],["吃饭的时候","lúc ăn cơm"]], ["时候 thường cần thành phần xác định phía trước, không dùng trống tùy tiện."]],
  "上午": [[["上午九点","9 giờ sáng"],["上午上班","làm việc buổi sáng"]], ["Buổi + giờ: 上午九点, không đảo 九点上午."]],
  "下午": [[["下午三点","3 giờ chiều"],["下午见","chiều gặp"]], ["下午 đứng trước mốc giờ cụ thể."]],
  "中午": [[["中午吃饭","ăn trưa"],["中午十二点","12 giờ trưa"]], ["中午 là khoảng giữa trưa, không phải mọi thời điểm buổi chiều."]],
  "星期": [[["星期三","thứ Tư"],["这个星期","tuần này"]], ["星期 + số; Chủ nhật có thể nói 星期天/星期日."]],
  "年": [[["二〇二六年","năm 2026"],["今年","năm nay"]], ["Năm thường đọc từng chữ số trong ngày tháng."]],
  "月": [[["五月","tháng Năm"],["下个月","tháng sau"]], ["Thứ tự ngày tháng tiếng Trung: tháng trước ngày."]],
  "号": [[["五月八号","ngày 8 tháng 5"],["房间号","số phòng"]], ["Khẩu ngữ dùng 号 cho ngày; văn viết trang trọng có thể dùng 日."]],
  "分钟": [[["十分钟","mười phút"],["还有五分钟","còn năm phút"]], ["Phút sau số; không thêm 个."]],
  "开": [[["开车","lái xe"],["商店开了","cửa hàng mở rồi"]], ["开 có nhiều nghĩa; phải học theo kết hợp từ."]],
  "做": [[["做饭","nấu cơm"],["做什么","làm gì"]], ["Phân biệt 做 zuò với 坐 zuò bằng chữ và ngữ cảnh."]],
  "饭店": [[["去饭店","đi nhà hàng/khách sạn tùy vùng"],["饭店里","trong nhà hàng"]], ["饭店 có thể là nhà hàng hoặc khách sạn tùy khu vực/ngữ cảnh."]],
  "商店": [[["去商店买东西","đi cửa hàng mua đồ"],["商店在前面","cửa hàng ở phía trước"]], ["商店 là cửa hàng nói chung; không tự động là siêu thị."]],
  "桌子": [[["桌子上","trên bàn"],["一张桌子","một cái bàn"]], ["Lượng từ tự nhiên là 张, không phải 个 trong nội dung chuẩn."]],
  "椅子": [[["坐在椅子上","ngồi trên ghế"],["一把椅子","một cái ghế"]], ["Lượng từ thường là 把; 个 có thể nghe nhưng kém chính xác hơn."]],
  "东西": [[["买东西","mua đồ"],["这个东西","đồ vật này"]], ["东西 dōngxi có âm tiết thứ hai thanh nhẹ trong khẩu ngữ."]],
  "电话": [[["打电话","gọi điện"],["电话号码","số điện thoại"]], ["Nói hành động gọi điện bằng 打电话, không dùng 做电话."]],
  "看见": [[["看见老师","nhìn thấy giáo viên"],["没看见","không nhìn thấy"]], ["看 là hành động nhìn; 看见 nhấn kết quả nhìn thấy."]],
  "听见": [[["听见声音","nghe thấy âm thanh"],["没听见","không nghe thấy"]], ["听见 là kết quả; 听 là hành động."]],
  "一点儿": [[["一点儿水","một chút nước"],["会说一点儿汉语","biết nói một chút tiếng Trung"]], ["一点儿 đứng trước danh từ hoặc sau động từ tùy cấu trúc; không dịch theo một vị trí cố định."]],
  "些": [[["这些书","những quyển sách này"],["买一些水果","mua một ít hoa quả"]], ["些 biểu thị số nhiều/không xác định, không đi với số đếm cụ thể."]],
  "二": [[["二月","tháng Hai"],["二十","hai mươi"]], ["Trước lượng từ thường dùng 两: 两个人; trong số thứ tự/đếm dùng 二."]],
  "两": [[["两个人","hai người"],["两杯茶","hai cốc trà"]], ["Không dùng 两 trong mọi số ghép: 二十二, không phải 两十二."]],
  "百": [[["一百块","một trăm tệ"],["两百人","hai trăm người"]], ["Trước 百 có thể dùng 两 trong khẩu ngữ phổ biến."]],
  "十": [[["十个人","mười người"],["二十块","hai mươi tệ"]], ["Số 10 đứng một mình là 十, không bắt buộc 一十."]],
  "零": [[["二〇二六年","năm 2026"],["一零八","108 đọc từng số trong mã"]], ["Cách đọc 零 phụ thuộc số lượng, năm hay mã/số điện thoại."]],
  "好": [[["很好","rất/tốt"],["好朋友","bạn tốt/thân"]], ["好 trước động từ có thể biểu thị dễ/tốt trong từ ghép; học theo cụm."]],
  "没关系": [[["A：对不起。B：没关系。","A: xin lỗi. B: không sao."],["没关系，我们再来一次","không sao, chúng ta làm lại"]], ["Không dùng thay lời đáp cảm ơn trong mọi trường hợp."]],
  "不客气": [[["A：谢谢。B：不客气。","A: cảm ơn. B: không có gì."],["不用谢，不客气","không cần cảm ơn, không có gì"]], ["Chủ yếu đáp lời cảm ơn, không phải đáp lời xin lỗi."]]
};

function buildGrammar() {
  return grammarDefinitions.map((g, index) => ({
    recordType: "grammar",
    id: `hsk1-grammar-${g[0]}`,
    syllabusVersion: SYLLABUS,
    hskLevel: 1,
    nameZh: g[1],
    nameVi: g[2],
    formula: g[3],
    meaningVi: g[4],
    usageVi: g[5],
    positionVi: g[6],
    correctExamples: g[7].map(([zh, vi]) => ({ zh, vi })),
    incorrectExamples: g[8].map(([zh, explanationVi]) => ({ zh, explanationVi })),
    commonErrorsVi: g[9],
    confusables: [],
    introducedLevel: 1,
    reviewLevels: [2, 3],
    sourceIds: SOURCES.slice(0, 4),
    contentStatus: STATUS,
    translationReviewStatus: STATUS,
    reviewStatus: "linguistic-reviewed",
    contentVersion: 1,
  }));
}

function buildCharacters() {
  return characterDefinitions.map(([character, radical, readings, confusables], index) => ({
    recordType: "character",
    id: `hsk1-character-${String(index + 1).padStart(3, "0")}`,
    syllabusVersion: SYLLABUS,
    hskLevel: 1,
    character,
    recognitionRequired: true,
    writingRequired: index < 36,
    radical,
    components: [],
    readings,
    wordRefs: [],
    confusables,
    strokeOrderStatus: "static-fallback",
    strokeOrderAsset: null,
    sourceIds: [SOURCES[0], SOURCES[1]],
    contentStatus: STATUS,
    reviewStatus: "unreviewed",
    contentVersion: 1
  }));
}

function lessonId(order) {
  return `hsk1-lesson-${String(order).padStart(2, "0")}`;
}

function unitId(order) {
  return `hsk1-unit-${String(order).padStart(2, "0")}`;
}

function grammarId(key) {
  return `hsk1-grammar-${key}`;
}

function characterIdsForLesson(index) {
  const start = (index * 2) % characterDefinitions.length;
  return [start, (start + 1) % characterDefinitions.length].map(i => `hsk1-character-${String(i + 1).padStart(3, "0")}`);
}

function buildLessonSections(definition, order) {
  const focusRows = definition.focus.map(word => {
    const enrichment = enrichmentSeed[word];
    const lexicalStatus = DERIVED_PHRASES.has(word) ? "derived-phrase" : "canonical";
    return {
      simplified: word,
      canonicalLookup: lexicalStatus === "canonical" ? { field: "simplified", value: word } : null,
      lexicalStatus,
      collocations: enrichment ? enrichment[0].map(([zh, vi]) => ({ zh, vi })) : [],
      commonErrorsVi: enrichment ? enrichment[1] : [],
      reviewStatus: enrichment ? "editorial-enriched" : "lesson-focus-only"
    };
  });
  return [
    { id:`${lessonId(order)}-situation`, type:"situation", titleVi:"Khởi động theo tình huống", content:{ promptVi:`Hình dung tình huống: ${definition.vi}. Bạn đã biết nói gì?`, successCriterionVi:definition.objective } },
    { id:`${lessonId(order)}-vocabulary`, type:"vocabulary", titleVi:"Từ vựng theo ngữ cảnh", content:{ focusWords:focusRows, instructionVi:"Học từ trong cụm và câu; không học nghĩa rời. Bấm ẩn pinyin sau lượt nhận diện đầu." } },
    { id:`${lessonId(order)}-character`, type:"character", titleVi:"Chữ Hán trọng tâm", content:{ characterRefs:characterIdsForLesson(order-1), workflow:["nhận diện cấu trúc","xem nét tĩnh","viết theo ô","dùng trong từ đã học"], noteVi:"Stroke order vẫn cần asset chính thức trước production." } },
    { id:`${lessonId(order)}-grammar`, type:"grammar", titleVi:"Ngữ pháp để giao tiếp", content:{ grammarRefs:definition.grammar.map(grammarId), teachingFlow:["ý định giao tiếp","công thức","ví dụ đúng","lỗi người Việt","tự tạo câu"] } },
    { id:`${lessonId(order)}-dialogue`, type:"dialogue", titleVi:"Hội thoại chính", content:{ scriptZh:definition.dialogue, tasks:["nghe ý chính","gạch từ khóa","shadowing theo lượt","đổi thông tin cá nhân"] } },
    { id:`${lessonId(order)}-reading`, type:"reading", titleVi:"Đọc hiểu có chiến lược", content:{ textZh:definition.reading, questionsVi:["Ý chính là gì?","Chi tiết nào trả lời mục tiêu bài?","Từ nào có thể đoán từ ngữ cảnh?"], answerPolicy:"Giải thích bằng bằng chứng trong văn bản, không chỉ hiện đáp án." } },
    { id:`${lessonId(order)}-listening`, type:"listening", titleVi:"Nghe và chép chọn lọc", content:{ scriptOrTeacherBriefVi:definition.listening, passes:["lượt 1: ý chính","lượt 2: chi tiết","lượt 3: chép cụm mục tiêu","lượt 4: shadowing"], audioStatus:"script-ready-audio-pending" } },
    { id:`${lessonId(order)}-pronunciation`, type:"pronunciation", titleVi:"Phát âm cho người Việt", content:{ coachingVi:definition.pronunciation, selfCheck:["âm đầu","vận mẫu","thanh điệu","nhịp cụm","nghe lại và tự sửa"] } },
    { id:`${lessonId(order)}-guided`, type:"guided-practice", titleVi:"Luyện có hướng dẫn", content:{ steps:["thay một thông tin trong mẫu","đổi chủ ngữ/thời gian/nơi chốn","trả lời không nhìn đáp án","giải thích lỗi nếu sai"], exerciseRefs:Array.from({length:3},(_,i)=>`${lessonId(order)}-exercise-${i+1}`) } },
    { id:`${lessonId(order)}-independent`, type:"independent-practice", titleVi:"Nhiệm vụ sản sinh", content:{ speakingVi:definition.speaking, writingVi:definition.writing, exerciseRefs:[`${lessonId(order)}-exercise-4`,`${lessonId(order)}-exercise-5`] } },
    { id:`${lessonId(order)}-summary`, type:"summary", titleVi:"Tóm tắt và tự đánh giá", content:{ canDoVi:definition.objective, checklist:["Tôi hiểu input chính","Tôi dùng đúng cấu trúc","Tôi nói mà không đọc toàn bộ","Tôi viết và tự sửa ít nhất một lỗi"] } },
    { id:`${lessonId(order)}-review`, type:"review", titleVi:"Ôn cách quãng và dùng thật", content:{ spacingDays:[1,3,7,14,30], retrievalMix:["từ→nghĩa","nghĩa→từ","nghe→chọn","nói→ghi âm","viết→tự sửa"], realWorldTaskVi:definition.task } }
  ];
}

function buildLessons() {
  const unitCounters = new Map();
  return lessonDefinitions.map((definition, index) => {
    const courseOrder = index + 1;
    const order = (unitCounters.get(definition.u) || 0) + 1;
    unitCounters.set(definition.u, order);
    return {
      recordType: "lesson",
      id: lessonId(courseOrder),
      syllabusVersion: SYLLABUS,
      level: 1,
      unitId: unitId(definition.u),
      order,
      topic: unitDefinitions[definition.u - 1][1],
      titleZh: definition.zh,
      titleVi: definition.vi,
      objectives: [definition.objective, "Hoàn thành ít nhất một nhiệm vụ nghe hoặc đọc và một nhiệm vụ nói hoặc viết.", "Tự phát hiện và sửa một lỗi phổ biến của người Việt."],
      prerequisiteIds: courseOrder === 1 ? [] : [lessonId(courseOrder - 1)],
      vocabularyRefs: [],
      grammarRefs: definition.grammar.map(grammarId),
      characterRefs: characterIdsForLesson(index),
      sections: buildLessonSections(definition, courseOrder),
      practiceRefs: Array.from({length:5},(_,i)=>`${lessonId(courseOrder)}-exercise-${i+1}`),
      reviewRefs: courseOrder === 1 ? [] : [`${lessonId(courseOrder - 1)}-exercise-2`],
      estimatedMinutes: courseOrder === 24 ? 90 : definition.u === 1 ? 60 : 70,
      difficulty: courseOrder <= 5 ? 1 : courseOrder <= 16 ? 2 : 3,
      sourceIds: SOURCES,
      contentStatus: STATUS,
      translationReviewStatus: STATUS,
      contentVersion: 1,
      reviewMetadata: {
        reviewStage: 1,
        reviewReason: "Phase C1 professional-course authoring; human pedagogy and Vietnamese review remain required.",
        firstIntroducedIn: "phase-c1",
        previousExerciseId: courseOrder === 1 ? null : `${lessonId(courseOrder - 1)}-exercise-2`
      }
    };
  });
}

function buildExercises(lessons) {
  const byOrder = lessonDefinitions;
  return lessons.flatMap((lesson, lessonIndex) => {
    const def = byOrder[lessonIndex];
    const firstGrammar = lesson.grammarRefs[0] || null;
    const vocabLookups = def.focus.filter(word => !DERIVED_PHRASES.has(word)).map(word => `lookup:simplified:${word}`);
    const common = {
      recordType:"exercise", syllabusVersion:SYLLABUS, hskLevel:1, difficulty:lesson.difficulty,
      topic:lesson.topic, grammarFocus:lesson.grammarRefs, vocabularyFocus:[], sourceIds:SOURCES,
      contentStatus:STATUS, translationReviewStatus:STATUS, reviewStatus:"linguistic-reviewed", contentVersion:1,
      reviewMetadata:{ firstIntroducedIn:lesson.id, reviewStage:1, reviewReason:"C1 lesson-aligned item; human sampling required.", previousExerciseId:null }
    };
    const dialogueFirstLine = def.dialogue.split("\n")[0];
    return [
      { ...common, id:`${lesson.id}-exercise-1`, skill:"listening", format:"listen-main-idea", prompt:`Nghe input của bài “${lesson.titleVi}” và chọn ý chính phù hợp nhất.`, stimulus:{ teacherBrief:def.listening, focusLookups:vocabLookups }, options:[lesson.objectives[0],"Người nói đang tranh luận về một chủ đề trừu tượng.","Người nói chỉ đọc một danh sách không có mục đích giao tiếp."], answer:lesson.objectives[0], acceptedAnswers:[], explanationVi:"Ý chính phải khớp nhiệm vụ giao tiếp của bài, không chỉ dựa vào một từ nghe được.", cognitiveSkill:"recognition", templateFamily:`${lesson.id}-listening-main` },
      { ...common, id:`${lesson.id}-exercise-2`, skill:"grammar", format:"controlled-production", prompt:`Trong bài “${lesson.titleVi}”, tạo một câu mới dùng ${lesson.grammarRefs.length ? lesson.grammarRefs.join(", ") : "mẫu câu trọng tâm"}; thay thông tin bằng dữ liệu thật hoặc hư cấu an toàn.`, stimulus:{ grammarRef:firstGrammar, model:dialogueFirstLine }, options:[], answer:{ rubric:["đúng trật tự","đúng chức năng","có thông tin mới"] }, acceptedAnswers:["Đáp án mở được chấm theo rubric."], explanationVi:"Bài này chấm theo rubric; đáp án mẫu không phải câu duy nhất đúng.", cognitiveSkill:"application", templateFamily:`${lesson.id}-grammar-production` },
      { ...common, id:`${lesson.id}-exercise-3`, skill:"reading", format:"evidence-question", prompt:`Đọc đoạn của bài “${lesson.titleVi}”, nêu một chi tiết trả lời mục tiêu bài và trích đúng cụm làm bằng chứng.`, stimulus:{ textZh:def.reading }, options:[], answer:{ rubric:["chi tiết đúng","bằng chứng có trong đoạn","giải thích ngắn"] }, acceptedAnswers:["Đáp án mở được chấm theo rubric."], explanationVi:"Người học phải chỉ ra bằng chứng, tránh đoán theo kiến thức ngoài văn bản.", cognitiveSkill:"analysis", templateFamily:`${lesson.id}-reading-evidence` },
      { ...common, id:`${lesson.id}-exercise-4`, skill:"speaking", format:"role-play", prompt:def.speaking, stimulus:{ dialogueZh:def.dialogue, timeSeconds:lessonIndex === 23 ? 90 : 60 }, options:[], answer:{ rubric:{ taskCompletion:40, intelligibility:25, grammarAndWords:25, selfCorrection:10 } }, acceptedAnswers:["Đáp án mở được chấm theo rubric."], explanationVi:"Ưu tiên hoàn thành tình huống và khả năng hiểu được; không trừ nặng vì giọng địa phương nếu thanh và từ vẫn rõ.", cognitiveSkill:"synthesis", templateFamily:`${lesson.id}-speaking-roleplay` },
      { ...common, id:`${lesson.id}-exercise-5`, skill:"writing", format:"guided-writing", prompt:def.writing, stimulus:{ focusLookups:vocabLookups, requiredGrammar:lesson.grammarRefs }, options:[], answer:{ rubric:{ taskCompletion:35, wordOrder:25, grammar:20, charactersAndPunctuation:10, revision:10 } }, acceptedAnswers:["Đáp án mở được chấm theo rubric."], explanationVi:"Bài viết cần truyền đạt được thông tin và có bước tự sửa; không chấm theo một câu mẫu duy nhất.", cognitiveSkill:"synthesis", templateFamily:`${lesson.id}-writing-guided` }
    ];
  });
}

function buildAssessments(lessons, exercises) {
  const assessments = [];
  for (let u = 1; u <= 10; u += 1) {
    const unitLessons = lessons.filter(l => l.unitId === unitId(u));
    const refs = unitLessons.flatMap(l => [`${l.id}-exercise-1`,`${l.id}-exercise-3`,`${l.id}-exercise-4`,`${l.id}-exercise-5`]);
    assessments.push({
      recordType:"assessment", id:`hsk1-assessment-unit-${String(u).padStart(2,"0")}`, syllabusVersion:SYLLABUS,
      examBlueprintVersion:EXAM, level:1, assessmentType:"mini-checkpoint", titleZh:`第${u}单元检查`, titleVi:`Checkpoint Unit ${u}: ${unitDefinitions[u-1][1]}`,
      exerciseRefs:refs, sections:{ receptive:refs.filter((_,i)=>i%4<2).length, productive:refs.filter((_,i)=>i%4>=2).length },
      skillWeights:{ listening:20, reading:20, speaking:30, writing:30 }, targetGrammar:unique(unitLessons.flatMap(l=>l.grammarRefs)), targetVocabulary:[],
      difficultyDistribution:{ easy:40, core:40, stretch:20 }, rubric:{ pass:70, remediation:"Làm lại skill dưới 60%, sau đó retrieval sau 1 và 3 ngày." },
      sourceIds:SOURCES, contentStatus:STATUS, reviewStatus:"blueprint-reviewed", contentVersion:1
    });
  }
  const midpointRefs = lessons.slice(0,12).flatMap(l=>[`${l.id}-exercise-1`,`${l.id}-exercise-3`,`${l.id}-exercise-4`]);
  assessments.push({ recordType:"assessment", id:"hsk1-assessment-midpoint", syllabusVersion:SYLLABUS, examBlueprintVersion:EXAM, level:1, assessmentType:"midpoint", titleZh:"一级中期评估", titleVi:"Đánh giá giữa cấp HSK 1", exerciseRefs:midpointRefs, sections:{ listening:12, reading:12, speaking:12 }, skillWeights:{ listening:30, reading:30, speaking:40 }, targetGrammar:unique(lessons.slice(0,12).flatMap(l=>l.grammarRefs)), targetVocabulary:[], difficultyDistribution:{ easy:35, core:50, stretch:15 }, rubric:{ pass:70, speakingRequired:true, feedback:"Trả về skill profile và ba bài remedial cụ thể." }, sourceIds:SOURCES, contentStatus:STATUS, reviewStatus:"blueprint-reviewed", contentVersion:1 });
  const finalRefs = lessons.slice(12).flatMap(l=>[`${l.id}-exercise-1`,`${l.id}-exercise-3`,`${l.id}-exercise-4`,`${l.id}-exercise-5`]);
  assessments.push({ recordType:"assessment", id:"hsk1-assessment-final", syllabusVersion:SYLLABUS, examBlueprintVersion:EXAM, level:1, assessmentType:"final", titleZh:"HSK一级结业评估", titleVi:"Đánh giá cuối khóa HSK 1", exerciseRefs:finalRefs, sections:{ listening:12, reading:12, speaking:12, writing:12 }, skillWeights:{ listening:25, reading:25, speaking:30, writing:20 }, targetGrammar:unique(lessons.flatMap(l=>l.grammarRefs)), targetVocabulary:[], difficultyDistribution:{ easy:25, core:55, stretch:20 }, rubric:{ knowledgeThreshold:80, receptiveThreshold:75, productiveThreshold:70, mandatory:["speaking","pronunciation-foundation"], noProductionPromotion:true }, sourceIds:SOURCES, contentStatus:STATUS, reviewStatus:"blueprint-reviewed", contentVersion:1 });
  assessments.push({ recordType:"assessment", id:"hsk1-assessment-mastery", syllabusVersion:SYLLABUS, examBlueprintVersion:EXAM, level:1, assessmentType:"mastery-review", titleZh:"一级掌握复习", titleVi:"Mastery Review HSK 1", exerciseRefs:exercises.filter(e=>["speaking","writing","integrated"].includes(e.skill)).slice(-24).map(e=>e.id), sections:{ productivePortfolio:24, spacedReviewDays:[1,3,7,14,30] }, skillWeights:{ speaking:50, writing:30, selfCorrection:20 }, targetGrammar:unique(lessons.flatMap(l=>l.grammarRefs)), targetVocabulary:[], difficultyDistribution:{ retrieval:40, transfer:40, reflection:20 }, rubric:{ mastery:80, weakSkillLoop:true, evidenceRequired:["recording","writing","self-review"] }, sourceIds:SOURCES, contentStatus:STATUS, reviewStatus:"blueprint-reviewed", contentVersion:1 });
  return assessments;
}

function buildUnits(lessons) {
  return unitDefinitions.map((definition, index) => {
    const order = index + 1;
    const unitLessons = lessons.filter(l=>l.unitId===unitId(order));
    return {
      recordType:"unit", id:unitId(order), syllabusVersion:SYLLABUS, level:1, order,
      topic:definition[1], titleZh:definition[0], titleVi:definition[1],
      objectives:[definition[2], "Tích hợp ít nhất một nhiệm vụ tiếp nhận và một nhiệm vụ sản sinh.", "Ôn cách quãng theo dữ liệu điểm yếu thay vì chỉ học lại toàn bài."],
      prerequisiteUnitIds:order===1?[]:[unitId(order-1)],
      lessonRefs:unitLessons.map(l=>({id:l.id,path:"lessons.json",order:l.order})),
      checkpointRef:{id:`hsk1-assessment-unit-${String(order).padStart(2,"0")}`,path:"assessments.json"},
      sourceIds:SOURCES, contentStatus:STATUS, contentVersion:1
    };
  });
}

function buildEnrichment() {
  return Object.entries(enrichmentSeed).filter(([simplified]) => !DERIVED_PHRASES.has(simplified)).map(([simplified, [collocations, commonErrorsVi]], index) => ({
    id:`hsk1-vocabulary-enrichment-${String(index+1).padStart(3,"0")}`,
    canonicalLookup:{field:"simplified",value:simplified},
    simplified,
    collocations:collocations.map(([zh,vi])=>({zh,vi})),
    commonErrorsVi,
    learnerNoteVi:`Học “${simplified}” trong cụm và tự tạo một câu liên quan tới đời sống của bạn.`,
    sourceIds:[SOURCES[0],SOURCES[1],SOURCES[4]],
    contentStatus:STATUS,
    translationReviewStatus:STATUS,
    reviewStatus:"linguistic-reviewed",
    contentVersion:1
  }));
}

function buildLevel(units, lessons, assessments) {
  return {
    recordType:"level", id:"hsk1", syllabusVersion:SYLLABUS, examBlueprintVersion:EXAM,
    stage:"elementary", level:1, titleZh:"HSK 1", titleVi:"HSK 1 — Giao tiếp nền tảng",
    objectives:[
      "Chào hỏi, tự giới thiệu và hỏi–đáp thông tin cá nhân cơ bản.",
      "Xử lý giao dịch rất ngắn về thời gian, ăn uống, mua sắm, phương hướng và sức khỏe.",
      "Nghe/đọc thông tin rõ ràng trong câu ngắn; tạo câu đơn có trật tự đúng.",
      "Nhận diện âm tiết, thanh điệu và chữ Hán trọng tâm; tự sửa lỗi phổ biến của người Việt."
    ],
    topics:unitDefinitions.map(u=>u[1]),
    unitRefs:units.map(u=>({id:u.id,path:"units.json"})),
    lessonIndex:lessons.map(l=>({id:l.id,unitId:l.unitId,path:"lessons.json"})),
    assessmentRefs:assessments.map(a=>({id:a.id,path:"assessments.json"})),
    finalAssessmentId:"hsk1-assessment-final",
    sourceIds:SOURCES,
    contentStatus:STATUS,
    translationReviewStatus:STATUS,
    productionReady:false,
    contentVersion:2
  };
}

function buildManifest(units, lessons, grammar, characters, exercises, assessments, enrichment) {
  return {
    schemaVersion:"1.0.0", phase:"C1", curriculumId:"vduckie-hsk1-professional-course",
    syllabusVersion:SYLLABUS, examBlueprintVersion:EXAM, level:1,
    status:"phase-c1-structurally-complete-human-review-required",
    productionEnabled:false, publicOverrideAllowed:false, writesProgress:false, developerOnly:true, readOnly:true, qualityGate:"locked",
    collections:{
      units:{path:"units.json",count:units.length}, lessons:{path:"lessons.json",count:lessons.length}, grammar:{path:"grammar.json",count:grammar.length},
      characters:{path:"characters.json",count:characters.length}, exercises:{path:"exercises.json",count:exercises.length}, assessments:{path:"assessments.json",count:assessments.length},
      vocabularyEnrichment:{path:"vocabulary-enrichment.json",count:enrichment.length,linkStrategy:"canonicalLookup.simplified"}
    },
    learnerJourney:{
      lessonFlow:["context","vocabulary-in-use","characters","grammar-for-purpose","dialogue/input","comprehension","listening","pronunciation","guided practice","speaking/writing","summary","spaced review","real-world task"],
      progressiveDisclosure:{pinyin:"shown-first-pass-then-hideable",translation:"answer-after-attempt",explanation:"after-answer-with-evidence"},
      resume:{continueFrom:"last-incomplete-section",showWeakSkills:true,onePrimaryAction:true},
      mobile:{tapTargets:"minimum-44px-contract",singleColumnPractice:true,audioControlsPersistent:true},
      accessibility:{keyboardReachable:true,reducedMotionSafe:true,audioHasScript:true,colorNotSoleSignal:true},
      mastery:{knowledge:80,receptive:75,productive:70,mandatory:["pronunciation-foundation","final-assessment","speaking-task"],spacingDays:[1,3,7,14,30]}
    },
    sourceIds:SOURCES,
    reviewGate:{ vietnameseHumanReview:false, pedagogyHumanReview:false, audioRecorded:false, strokeOrderVerified:false, productionReleaseAllowed:false }
  };
}

function buildReport(payload) {
  const {units,lessons,grammar,characters,exercises,assessments,enrichment,manifest} = payload;
  const ids = [...units,...lessons,...grammar,...characters,...exercises,...assessments,...enrichment].map(x=>x.id);
  return {
    reportVersion:"1.0.0", phase:"C1", generatedAt:"2026-07-29", generatedBy:"scripts/build-hsk-curriculum-c1.js",
    counts:{ units:units.length, lessons:lessons.length, grammar:grammar.length, characters:characters.length, exercises:exercises.length, assessments:assessments.length, vocabularyEnrichment:enrichment.length, derivedPhraseFocusEntries:new Set(lessons.flatMap(l=>l.sections.find(s=>s.type==="vocabulary").content.focusWords.filter(w=>w.lexicalStatus==="derived-phrase").map(w=>w.simplified))).size, lessonSections:lessons.reduce((n,l)=>n+l.sections.length,0) },
    coverage:{ allArchitectureUnits:true, coreLessons24:lessons.length===24, everyLessonHasDialogue:lessons.every(l=>l.sections.some(s=>s.type==="dialogue")), everyLessonHasListening:lessons.every(l=>l.sections.some(s=>s.type==="listening")), everyLessonHasSpeakingAndWriting:lessons.every(l=>l.practiceRefs.length>=5), everyLessonHasSpacedReview:lessons.every(l=>l.sections.some(s=>s.type==="review" && Array.isArray(s.content.spacingDays))), uniqueIds:new Set(ids).size===ids.length },
    learnerExperience:manifest.learnerJourney,
    productionSafety:{ productionEnabled:false, publicOverrideAllowed:false, writesProgress:false, qualityGate:"locked", supabaseChanged:false, migrationChanged:false },
    reviewStatus:{ machineAssisted:true, vietnameseHumanReviewRequired:true, pedagogyHumanReviewRequired:true, audioProductionRequired:true, strokeOrderVerificationRequired:true },
    sourceValidation:{ sourceIds:SOURCES, allRecordsHaveSourceIds:[...units,...lessons,...grammar,...characters,...exercises,...assessments,...enrichment].every(r=>Array.isArray(r.sourceIds)&&r.sourceIds.length>0) },
    hashes:{ manifest:sha256(manifest), lessons:sha256(lessons), exercises:sha256(exercises) }
  };
}

function validate(payload) {
  const {units,lessons,grammar,characters,exercises,assessments,enrichment,manifest,level} = payload;
  const errors = [];
  const all = [...units,...lessons,...grammar,...characters,...exercises,...assessments,...enrichment];
  const ids = all.map(r=>r.id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate-id");
  if (units.length !== 10) errors.push("unit-count");
  if (lessons.length !== 24) errors.push("lesson-count");
  if (lessons.some(l=>l.sections.length!==12)) errors.push("lesson-section-count");
  for (const unit of units) {
    const orders = unit.lessonRefs.map(ref => lessons.find(lesson => lesson.id === ref.id).order);
    if (orders.some((value, index) => value !== index + 1)) errors.push(`${unit.id}:lesson-order`);
  }
  const focusRows = lessons.flatMap(l=>l.sections.find(s=>s.type==="vocabulary").content.focusWords);
  if (focusRows.some(row => row.lexicalStatus === "derived-phrase" && row.canonicalLookup !== null)) errors.push("derived-phrase-canonical-claim");
  if (enrichment.some(row => DERIVED_PHRASES.has(row.simplified))) errors.push("derived-phrase-enrichment");
  const requiredTypes=["situation","vocabulary","character","grammar","dialogue","reading","listening","pronunciation","guided-practice","independent-practice","summary","review"];
  for (const lesson of lessons) for (const type of requiredTypes) if (!lesson.sections.some(s=>s.type===type)) errors.push(`${lesson.id}:missing:${type}`);
  if (exercises.length !== 120) errors.push("exercise-count");
  if (assessments.length !== 13) errors.push("assessment-count");
  if (grammar.length < 16) errors.push("grammar-density");
  if (characters.length < 48) errors.push("character-density");
  if (enrichment.length < 80) errors.push("vocabulary-enrichment-density");
  if (manifest.productionEnabled || manifest.publicOverrideAllowed || manifest.writesProgress || level.productionReady) errors.push("production-lock");
  if (manifest.qualityGate!=="locked") errors.push("quality-gate");
  if (all.some(r=>!Array.isArray(r.sourceIds)||r.sourceIds.length===0)) errors.push("source-coverage");
  if (lessons.some(l=>l.contentStatus==="production-ready")) errors.push("premature-production-ready");
  if (level.lessonIndex.length!==24 || level.unitRefs.length!==10 || level.assessmentRefs.length!==13) errors.push("level-index");
  if (errors.length) throw new Error(`C1 validation failed: ${errors.join(", ")}`);
  return { ok:true, errors:[] };
}

function buildPayload() {
  const grammar=buildGrammar();
  const characters=buildCharacters();
  const lessons=buildLessons();
  const exercises=buildExercises(lessons);
  const assessments=buildAssessments(lessons,exercises);
  const units=buildUnits(lessons);
  const enrichment=buildEnrichment();
  const level=buildLevel(units,lessons,assessments);
  const manifest=buildManifest(units,lessons,grammar,characters,exercises,assessments,enrichment);
  const payload={units,lessons,grammar,characters,exercises,assessments,enrichment,level,manifest};
  validate(payload);
  return {...payload, report:buildReport(payload)};
}

function outputMap(payload) {
  return {
    "data/hsk/hsk1/course-manifest.json":payload.manifest,
    "data/hsk/hsk1/units.json":{schemaVersion:"1.0.0",collectionType:"unit",level:1,records:payload.units},
    "data/hsk/hsk1/lessons.json":{schemaVersion:"1.0.0",collectionType:"lesson",level:1,records:payload.lessons},
    "data/hsk/hsk1/grammar.json":{schemaVersion:"1.0.0",collectionType:"grammar",level:1,records:payload.grammar},
    "data/hsk/hsk1/characters.json":{schemaVersion:"1.0.0",collectionType:"character",level:1,records:payload.characters},
    "data/hsk/hsk1/exercises.json":{schemaVersion:"1.0.0",collectionType:"exercise",level:1,records:payload.exercises},
    "data/hsk/hsk1/assessments.json":{schemaVersion:"1.0.0",collectionType:"assessment",level:1,records:payload.assessments},
    "data/hsk/hsk1/vocabulary-enrichment.json":{schemaVersion:"1.0.0",collectionType:"vocabulary-enrichment",level:1,entries:payload.enrichment},
    "data/hsk/hsk1/level.json":payload.level,
    "reports/hsk-c1-course-report.json":payload.report
  };
}

function main() {
  const payload=buildPayload();
  const outputs=outputMap(payload);
  const writeMode=process.argv.includes("--write");
  for (const [file,data] of Object.entries(outputs)) {
    const expected=`${JSON.stringify(data,null,2)}\n`;
    if (writeMode) writeJson(file,data);
    else if (read(file)!==expected) throw new Error(`${file} is stale; run node scripts/build-hsk-curriculum-c1.js --write`);
  }
  process.stdout.write(`${writeMode?"Built":"Validated"} HSK1 C1: ${payload.units.length} units, ${payload.lessons.length} lessons, ${payload.exercises.length} exercises, ${payload.assessments.length} assessments.\n`);
}

if (require.main===module) main();
module.exports={buildGrammar,buildCharacters,buildLessons,buildExercises,buildAssessments,buildUnits,buildEnrichment,buildLevel,buildManifest,buildReport,buildPayload,outputMap,validate,SOURCES,DERIVED_PHRASES};
