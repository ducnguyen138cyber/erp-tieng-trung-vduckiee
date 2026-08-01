#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const HSK2 = path.join(ROOT, "data", "hsk", "hsk2");
const HSK2_DIR = HSK2;
const DATA_ROOT = path.join(ROOT, "data", "hsk");
const SYLLABUS = "GF0025-2021";
const EXAM = "CTI-HSK3.0-2026";
const STATUS = "machine-assisted";
const ORIGINAL_SOURCE = "vduckie-hsk2-c3-original";
const SOURCES = Object.freeze([
  "moe-gf0025-2021-standard",
  "cti-hsk3-current-syllabus-2026",
  "cti-hsk3-syllabus-pdf-2026",
  "cti-hsk3-competency-profile-2026",
  "blcu-new-standard-pedagogy-2025",
  ORIGINAL_SOURCE
]);

function writeJson(relativePath, value) {
  const target = path.isAbsolute(relativePath) ? relativePath : path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.isAbsolute(relativePath) ? relativePath : path.join(ROOT, relativePath), "utf8"));
}

function unique(values) { return [...new Set(values)]; }
function pad(value, size) { return String(value).padStart(size, "0"); }
function sha256(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function lessonId(index) { return `hsk2-lesson-${String(index).padStart(2, "0")}`; }
function unitId(index) { return `hsk2-unit-${String(index).padStart(2, "0")}`; }
function grammarId(index) { return `hsk2-grammar-${String(index).padStart(2, "0")}`; }
function exerciseId(index, slot) { return `${lessonId(index)}-exercise-${slot}`; }
function assessmentId(index) { return `hsk2-assessment-unit-${String(index).padStart(2, "0")}`; }

// Short factual fields extracted from CTI's official 2026 syllabus, pages 84-89
// (PDF pages 87-92), vocabulary rows 301-500. Sense suffixes are preserved in
// officialHeadword and removed only from the learner-facing simplified field.
const OFFICIAL_VOCABULARY = String.raw`
301|啊|a|助
302|爱好|àihào|动、名
303|白色|báisè|名
304|班|bān|名、（量）
305|帮|bāng|动
306|帮忙|bāngmáng|动
307|包|bāo|动、名、量
308|本子|běnzi|名
309|比|bǐ|动、介
310|笔|bǐ|名、（量）
311|别1|bié|副
312|不错|búcuò|形
313|不好意思|bùhǎoyìsi|
314|长|cháng|形
315|车站|chēzhàn|名
316|出|chū|动
317|出国|chūguó|动
318|出来|chūlái|动
319|出门|chūmén|动
320|出去|chūqù|动
321|床|chuáng|名
322|词|cí|名
323|次|cì|量、（形）
324|从|cóng|介、（副）
325|从小|cóngxiǎo|副
326|错|cuò|形
327|打1|dǎ|动
328|打车|dǎchē|动
329|打开|dǎkāi|动
330|但|dàn|连、（副）
331|但是|dànshì|连
332|得|de|助
333|地|de|助
334|等1|děng|动、（介）
335|地铁|dìtiě|名
336|点2|diǎn|动、（名、量）
337|懂|dǒng|动
338|动|dòng|动
339|饭馆|fànguǎn|名
340|飞|fēi|动
341|高|gāo|形、名
342|高中|gāozhōng|名
343|告诉|gàosu|动
344|个子|gèzi|名
345|跟|gēn|介、连、（名、动）
346|公交车|gōngjiāochē|名
347|过|guò|动
348|过来|guòlái|动
349|过年|guònián|动
350|过去1|guòqù|动
351|过|guo|助
352|还是|háishi|副、连
353|黑色|hēisè|名
354|红茶|hóngchá|名
355|红色|hóngsè|名
356|后面|hòumiàn|名
357|花1|huā|动
358|花2|huā|名、（形）
359|画|huà|动、名
360|坏|huài|形
361|回来|huílái|动
362|回去|huíqù|动
363|机场|jīchǎng|名
364|机票|jīpiào|名
365|记得|jìde|动
366|间|jiān|量、（名）
367|教|jiāo|动
368|教室|jiàoshì|名
369|介绍|jièshào|动
370|进|jìn|动
371|近|jìn|形
372|进来|jìnlái|动
373|进去|jìnqù|动
374|经常|jīngcháng|副
375|酒店|jiǔdiàn|名
376|就|jiù|副、（介）
377|咖啡|kāfēi|名
378|开始|kāishǐ|动、名
379|开学|kāixué|动
380|考|kǎo|动
381|考试|kǎoshì|动、名
382|可能|kěnéng|形、名、动
383|裤子|kùzi|名
384|快|kuài|形、副
385|快乐|kuàilè|形
386|快要|kuàiyào|副
387|篮球|lánqiú|名
388|累|lèi|形、动
389|离|lí|动
390|里面|lǐmiàn|名
391|楼|lóu|名
392|路|lù|名
393|路上|lùshang|名
394|旅游|lǚyóu|动
395|绿茶|lǜchá|名
396|绿色|lǜsè|名、（形）
397|慢|màn|形
398|没意思|méiyìsi|
399|每|měi|代、（副）
400|门|mén|名
401|门口|ménkǒu|名
402|门票|ménpiào|名
403|面1|miàn|后缀、（动、名、量）
404|名|míng|名、量
405|拿|ná|动
406|那么|nàme|代、连
407|那样|nàyàng|代
408|奶茶|nǎichá|名
409|奶奶|nǎinai|名
410|男孩儿|nánháir|名
411|鸟|niǎo|名
412|女孩儿|nǚháir|名
413|旁边|pángbiān|名
414|跑|pǎo|动
415|跑步|pǎobù|动
416|票|piào|名
417|妻子|qīzi|名
418|起来|qǐlái|动
419|前面|qiánmiàn|名
420|晴|qíng|形
421|球|qiú|名
422|让|ràng|动、（介）
423|肉|ròu|名
424|商场|shāngchǎng|名
425|上来|shànglái|动
426|上面|shàngmiàn|名
427|上去|shàngqù|动
428|上网|shàngwǎng|动
429|身体|shēntǐ|名
430|生日|shēngrì|名
431|时|shí|名、（量）
432|事情|shìqing|名
433|手|shǒu|名
434|手表|shǒubiǎo|名
435|书包|shūbāo|名
436|舒服|shūfu|形
437|送|sòng|动
438|虽然|suīrán|连
439|所以|suǒyǐ|连
440|疼|téng|形、（动）
441|踢|tī|动
442|题|tí|名
443|条|tiáo|量、（名）
444|跳舞|tiàowǔ|动
445|头|tóu|名、（量）、（形）
446|外国|wàiguó|名
447|外面|wàimiàn|名
448|完|wán|动
449|万|wàn|数
450|往|wǎng|动、介
451|网上|wǎngshang|名
452|忘|wàng|动
453|位|wèi|量
454|为什么|wèishénme|
455|希望|xīwàng|动
456|洗|xǐ|动
457|洗手间|xǐshǒujiān|名
458|下来|xiàlái|动
459|下面|xiàmiàn|名
460|下去|xiàqù|动
461|小孩儿|xiǎoháir|名
462|小时候|xiǎoshíhou|名
463|笑|xiào|动
464|姓|xìng|名、动
465|姓名|xìngmíng|名
466|颜色|yánsè|名
467|眼睛|yǎnjing|名
468|药|yào|名
469|药店|yàodiàn|名
470|爷爷|yéye|名
471|一会儿|yíhuìr|数量、（副）
472|已经|yǐjīng|副
473|一起|yìqǐ|副
474|意思|yìsi|名
475|阴|yīn|形
476|因为|yīnwèi|介、连
477|游|yóu|动
478|游泳|yóuyǒng|动
479|有意思|yǒuyìsi|
480|有时|yǒushí|副
481|右|yòu|名
482|右边|yòubian|名
483|鱼|yú|名
484|远|yuǎn|形
485|运动|yùndòng|动、名
486|站1|zhàn|名
487|丈夫|zhàngfu|名
488|这么|zhème|代
489|这样|zhèyàng|代
490|着|zhe|助
491|正|zhèng|副、（形）
492|周|zhōu|名、（量）
493|准备|zhǔnbèi|动
494|自己|zìjǐ|代
495|走|zǒu|动
496|走路|zǒulù|动
497|足球|zúqiú|名
498|最|zuì|副
499|左|zuǒ|名
500|左边|zuǒbian|名
`.trim();

// VDuckie-authored Vietnamese glosses. They are machine-assisted and explicitly
// not labelled as human-reviewed.
const VIETNAMESE_GLOSSES = String.raw`
à; ô; nhỉ (trợ từ/cảm thán)
sở thích; thích
màu trắng
lớp; ca/kíp
giúp
giúp đỡ
gói; túi; bao; gói lại
vở; sổ
so với
bút; cây bút
đừng
không tệ; khá tốt
xin lỗi; ngại quá
dài
bến xe; trạm xe
ra
ra nước ngoài
đi/ra đây
ra khỏi nhà
đi/ra ngoài
giường
từ; từ ngữ
lần
từ (mốc bắt đầu)
từ nhỏ
sai
đánh; gọi; thực hiện
gọi/đi taxi
mở
nhưng
nhưng
trợ từ nối động từ với bổ ngữ
trợ từ nối trạng ngữ với động từ
đợi; chờ
tàu điện ngầm
chấm; điểm; gọi/chọn
hiểu
động; di chuyển
quán ăn; nhà hàng nhỏ
bay
cao
trung học phổ thông
nói; cho biết
vóc dáng; chiều cao cơ thể
với; cùng; theo
xe buýt
đi qua; vượt qua
đi/lại đây
ăn Tết; đón năm mới
đi/qua đó; quá khứ
đã từng (trợ từ trải nghiệm)
hay là; vẫn
màu đen
trà đen
màu đỏ
phía sau
tiêu (tiền/thời gian)
hoa
vẽ; tranh
hỏng; xấu
trở về đây
trở về đó
sân bay
vé máy bay
nhớ; nhớ làm
lượng từ cho phòng
dạy
phòng học
giới thiệu
vào
gần
đi/vào đây
đi/vào trong
thường xuyên
khách sạn
thì; liền; chỉ
cà phê
bắt đầu
khai giảng; bắt đầu kỳ học
thi; kiểm tra
kỳ thi; bài kiểm tra
có thể; khả năng
quần
nhanh; sắp
vui vẻ; hạnh phúc
sắp… rồi
bóng rổ
mệt
cách; cách xa
bên trong
tầng; tòa nhà
đường
trên đường
du lịch
trà xanh
màu xanh lá
chậm
chán; không thú vị
mỗi
cửa
cửa ra vào
vé vào cửa
mặt; phía; lượng từ cho mì
tên; lượng từ cho người
cầm; lấy
như thế; vậy thì
như thế kia
trà sữa
bà nội/bà
bé trai
chim
bé gái
bên cạnh
chạy
chạy bộ
vé
vợ
đứng/dậy; bắt đầu nổi lên
phía trước
trời quang; nắng
quả bóng; môn bóng
để; cho phép; khiến
thịt
trung tâm thương mại
đi/lên đây
phía trên
đi/lên đó
lên mạng
cơ thể; sức khỏe
sinh nhật
lúc; khi
việc; sự việc
tay
đồng hồ đeo tay
cặp sách
dễ chịu; khỏe
tặng; đưa; tiễn
tuy rằng
cho nên
đau
đá (bóng)
đề; câu hỏi
lượng từ cho vật dài/mảnh
nhảy múa
đầu
nước ngoài
bên ngoài
xong; hoàn thành
mười nghìn
về phía; hướng tới
trên mạng
quên
vị (lượng từ lịch sự cho người)
tại sao
hy vọng; mong
rửa; giặt
nhà vệ sinh
đi/xuống đây
phía dưới
đi/xuống đó
trẻ nhỏ
lúc nhỏ
cười
họ; mang họ
họ tên
màu sắc
mắt
thuốc
hiệu thuốc
ông nội/ông
một lát; một lúc
đã
cùng nhau
ý nghĩa; ý
âm u; nhiều mây
vì; bởi vì
bơi; đi chơi quanh
bơi lội
thú vị
đôi khi
bên phải
phía bên phải
cá
xa
vận động; thể thao
trạm; bến
chồng
như thế này; đến mức này
như thế này
trợ từ chỉ trạng thái tiếp diễn
đang; đúng; chính
tuần
chuẩn bị
bản thân; tự mình
đi; rời đi
đi bộ
bóng đá
nhất
bên trái
phía bên trái
`.trim();

const POS_MAP = Object.freeze({
  "名": "noun", "动": "verb", "形": "adjective", "副": "adverb", "介": "preposition",
  "连": "conjunction", "助": "particle", "代": "pronoun", "量": "measure-word", "数": "numeral",
  "后缀": "suffix", "数量": "quantity-expression"
});

const TONE_MAP = Object.freeze({
  "ā":["a",1],"á":["a",2],"ǎ":["a",3],"à":["a",4],
  "ē":["e",1],"é":["e",2],"ě":["e",3],"è":["e",4],
  "ī":["i",1],"í":["i",2],"ǐ":["i",3],"ì":["i",4],
  "ō":["o",1],"ó":["o",2],"ǒ":["o",3],"ò":["o",4],
  "ū":["u",1],"ú":["u",2],"ǔ":["u",3],"ù":["u",4],
  "ǖ":["ü",1],"ǘ":["ü",2],"ǚ":["ü",3],"ǜ":["ü",4]
});

function pinyinNumber(value) {
  return value.split(/([\s'’\-]+)/).map((part) => {
    if (!/[A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(part)) return part;
    let tone = 5;
    const plain = [...part].map((char) => {
      if (!TONE_MAP[char]) return char;
      tone = TONE_MAP[char][1];
      return TONE_MAP[char][0];
    }).join("");
    return `${plain}${tone}`;
  }).join("").replace(/\s+/g, " ").trim();
}

function parsePartOfSpeech(value, row) {
  const inferred = {313:["formula"],398:["adjective-phrase"],454:["interrogative-pronoun"],479:["adjective-phrase"]};
  if (!value) return inferred[row] || ["other"];
  return unique(Object.entries(POS_MAP).filter(([zh]) => value.includes(zh)).map(([, en]) => en));
}

function parseVocabularyFacts() {
  const glosses = VIETNAMESE_GLOSSES.split("\n").map((item) => item.trim());
  const rows = OFFICIAL_VOCABULARY.split("\n").map((line) => line.split("|"));
  if (rows.length !== 200 || glosses.length !== 200) throw new Error(`HSK2 inventory mismatch: ${rows.length}/${glosses.length}`);
  return rows.map(([rowText, officialHeadword, pinyin, posZh], offset) => {
    const row = Number(rowText);
    const simplified = officialHeadword.replace(/[12]$/, "");
    return {
      row,
      id: `hsk2-v-${String(offset + 1).padStart(4, "0")}`,
      simplified,
      officialHeadword,
      senseKey: `${simplified}:${row}`,
      pinyin,
      posZh,
      partOfSpeech: parsePartOfSpeech(posZh, row),
      meaningVi: glosses[offset]
    };
  });
}

const ORIGINAL_EXAMPLES = String.raw`
啊，我明白了。|À, tôi hiểu rồi.
我的爱好是游泳。|Sở thích của tôi là bơi.
我想买白色的。|Tôi muốn mua cái màu trắng.
这个班有二十名学生。|Lớp này có hai mươi học sinh.
你能帮我吗？|Bạn có thể giúp tôi không?
谢谢你来帮忙。|Cảm ơn bạn đã đến giúp.
我出门时常带一个小包。|Khi ra ngoài tôi thường mang một chiếc túi nhỏ.
请把名字写在本子上。|Hãy viết tên vào vở.
今天比昨天冷。|Hôm nay lạnh hơn hôm qua.
我买了两支笔。|Tôi mua hai cây bút.
别忘了带机票。|Đừng quên mang vé máy bay.
这家饭馆的菜不错。|Món ăn của quán này khá ngon.
不好意思，我来晚了。|Xin lỗi, tôi đến muộn.
这条路很长。|Con đường này rất dài.
我在车站等你。|Tôi đợi bạn ở bến xe.
他刚从教室出来。|Anh ấy vừa ra khỏi phòng học.
明年我想出国学习。|Năm sau tôi muốn ra nước ngoài học.
请出来一下。|Hãy ra đây một chút.
我七点出门。|Tôi ra khỏi nhà lúc bảy giờ.
外面下雨，别出去。|Ngoài trời đang mưa, đừng ra ngoài.
床旁边有一张桌子。|Bên cạnh giường có một cái bàn.
这个词是什么意思？|Từ này có nghĩa là gì?
我去过两次上海。|Tôi đã đến Thượng Hải hai lần.
从这里一直往前走。|Từ đây cứ đi thẳng về phía trước.
她从小喜欢画画。|Từ nhỏ cô ấy đã thích vẽ.
这道题我做错了。|Câu này tôi làm sai.
我先给妈妈打电话。|Tôi gọi điện cho mẹ trước.
下雨了，我们打车吧。|Trời mưa rồi, chúng ta gọi taxi nhé.
请把门打开。|Hãy mở cửa ra.
我很累，但还想走一走。|Tôi rất mệt nhưng vẫn muốn đi dạo.
房间不大，但是很舒服。|Phòng không lớn nhưng rất dễ chịu.
他说得很清楚。|Anh ấy nói rất rõ.
她高兴地笑了。|Cô ấy vui vẻ cười.
你在这里等我一会儿。|Bạn đợi tôi ở đây một lát.
坐地铁比坐公交车快。|Đi tàu điện ngầm nhanh hơn đi xe buýt.
我点了一杯奶茶。|Tôi gọi một cốc trà sữa.
老师说的话我听懂了。|Tôi đã hiểu lời giáo viên nói.
别动，我给你看看。|Đừng cử động, để tôi xem cho.
学校旁边有一家小饭馆。|Bên cạnh trường có một quán ăn nhỏ.
鸟从树上飞走了。|Con chim bay khỏi cây.
这座楼很高。|Tòa nhà này rất cao.
我妹妹今年上高中。|Em gái tôi năm nay học cấp ba.
请告诉我你的姓名。|Hãy cho tôi biết họ tên của bạn.
他个子很高。|Anh ấy có vóc dáng cao.
我跟朋友一起去。|Tôi đi cùng bạn.
我每天坐公交车上班。|Mỗi ngày tôi đi xe buýt đến chỗ làm.
过马路时要小心。|Khi qua đường phải cẩn thận.
你过来看看。|Bạn lại đây xem.
我们今年在奶奶家过年。|Năm nay chúng tôi ăn Tết ở nhà bà.
过去的事情别再想了。|Đừng nghĩ mãi về chuyện đã qua.
我去过北京。|Tôi từng đến Bắc Kinh.
你喝茶还是咖啡？|Bạn uống trà hay cà phê?
他穿着黑色的裤子。|Anh ấy mặc quần màu đen.
我早上喜欢喝红茶。|Buổi sáng tôi thích uống trà đen.
红色的包是我的。|Chiếc túi màu đỏ là của tôi.
车站在商场后面。|Bến xe ở phía sau trung tâm thương mại.
这件衣服花了三百块。|Bộ quần áo này tốn ba trăm tệ.
桌上有一朵花。|Trên bàn có một bông hoa.
这个小孩儿喜欢画小鸟。|Đứa trẻ này thích vẽ chim.
我的手表坏了。|Đồng hồ đeo tay của tôi hỏng rồi.
他晚上十点才回来。|Mười giờ tối anh ấy mới về.
太晚了，我先回去。|Muộn quá rồi, tôi về trước.
从这里到机场要多久？|Từ đây đến sân bay mất bao lâu?
我在网上买了机票。|Tôi đã mua vé máy bay trên mạng.
记得明天带书包。|Nhớ mang cặp sách ngày mai.
我想订一间安静的房间。|Tôi muốn đặt một phòng yên tĩnh.
王老师教我们汉语。|Thầy Vương dạy chúng tôi tiếng Trung.
学生都在教室里。|Học sinh đều ở trong phòng học.
我来介绍一下这位老师。|Tôi xin giới thiệu vị giáo viên này.
请进，别站在门口。|Mời vào, đừng đứng ở cửa.
药店离这里很近。|Hiệu thuốc rất gần đây.
老师，请进来吧。|Thầy/cô ơi, mời vào đây.
里面有人，你先别进去。|Bên trong có người, bạn đừng vào vội.
我经常跑步。|Tôi thường xuyên chạy bộ.
这家酒店离机场不远。|Khách sạn này không xa sân bay.
下地铁以后就往左走。|Sau khi xuống tàu điện ngầm thì đi sang trái.
我下午不喝咖啡。|Buổi chiều tôi không uống cà phê.
电影七点开始。|Bộ phim bắt đầu lúc bảy giờ.
下周就开学了。|Tuần sau là khai giảng rồi.
明天我们考听力。|Ngày mai chúng tôi thi nghe.
这次考试不太难。|Kỳ thi lần này không quá khó.
他今天可能不来。|Hôm nay anh ấy có thể không đến.
这条黑色裤子太长了。|Chiếc quần đen này dài quá.
你走得太快了。|Bạn đi nhanh quá.
祝你生日快乐！|Chúc bạn sinh nhật vui vẻ!
火车快要到了。|Tàu sắp đến rồi.
弟弟每周打两次篮球。|Em trai chơi bóng rổ hai lần mỗi tuần.
走了一天，我有点儿累。|Đi cả ngày nên tôi hơi mệt.
我家离公司很近。|Nhà tôi gần công ty.
书包在房间里面。|Cặp sách ở bên trong phòng.
我住在三楼。|Tôi sống ở tầng ba.
这条路怎么走？|Con đường này đi thế nào?
我在路上看见了他。|Tôi gặp anh ấy trên đường.
暑假我们去中国旅游。|Nghỉ hè chúng tôi đi du lịch Trung Quốc.
她要一杯绿茶。|Cô ấy gọi một cốc trà xanh.
我喜欢绿色。|Tôi thích màu xanh lá.
请说慢一点儿。|Hãy nói chậm một chút.
一个人看这个电影没意思。|Xem bộ phim này một mình thì chán.
我每天七点起来。|Mỗi ngày tôi dậy lúc bảy giờ.
请把门关上。|Hãy đóng cửa lại.
我在门口等你。|Tôi đợi bạn ở cửa.
学生门票多少钱？|Vé học sinh giá bao nhiêu?
这面墙是白色的。|Bức tường này màu trắng.
名单上有十名学生。|Trong danh sách có mười học sinh.
请拿好你的东西。|Hãy cầm đồ của bạn cho chắc.
那么，我们明天见。|Vậy thì, ngày mai gặp nhé.
别那样说。|Đừng nói như thế.
这家店的奶茶不错。|Trà sữa của cửa hàng này khá ngon.
奶奶正在做饭。|Bà đang nấu cơm.
那个男孩儿在踢足球。|Cậu bé kia đang đá bóng.
树上有两只鸟。|Trên cây có hai con chim.
女孩儿高兴地笑了。|Cô bé vui vẻ cười.
银行就在超市旁边。|Ngân hàng ngay cạnh siêu thị.
别跑，路上车多。|Đừng chạy, trên đường nhiều xe.
我早上去公园跑步。|Buổi sáng tôi đi công viên chạy bộ.
请收好车票。|Hãy giữ vé xe cẩn thận.
他的妻子是医生。|Vợ anh ấy là bác sĩ.
快起来，上课了。|Mau dậy, vào học rồi.
饭馆在酒店前面。|Quán ăn ở phía trước khách sạn.
今天是晴天。|Hôm nay trời quang.
这个球是谁的？|Quả bóng này của ai?
妈妈不让我喝咖啡。|Mẹ không cho tôi uống cà phê.
我想吃一点儿肉。|Tôi muốn ăn một chút thịt.
我们在商场门口见。|Chúng ta gặp nhau ở cửa trung tâm thương mại.
你能走上来吗？|Bạn có thể đi lên đây không?
钥匙在桌子上面。|Chìa khóa ở phía trên bàn.
他已经上去了。|Anh ấy đã đi lên rồi.
晚上我常用电脑上网。|Buổi tối tôi thường dùng máy tính lên mạng.
多运动对身体好。|Vận động nhiều tốt cho sức khỏe.
这个星期六是我的生日。|Thứ Bảy tuần này là sinh nhật tôi.
吃饭时别看手机。|Khi ăn đừng xem điện thoại.
我有一件事情想告诉你。|Tôi có một việc muốn nói với bạn.
请先洗手。|Hãy rửa tay trước.
我的手表慢了五分钟。|Đồng hồ của tôi chậm năm phút.
书包里有三本书。|Trong cặp có ba quyển sách.
吃了药以后舒服多了。|Uống thuốc xong thấy dễ chịu hơn nhiều.
我想送她一本书。|Tôi muốn tặng cô ấy một quyển sách.
虽然下雨，他还是来了。|Tuy trời mưa, anh ấy vẫn đến.
因为下雨，所以我们没出去。|Vì mưa nên chúng tôi không ra ngoài.
我头疼，想休息。|Tôi đau đầu, muốn nghỉ.
他们在操场踢足球。|Họ đá bóng ở sân trường.
最后一题我不会做。|Câu cuối tôi không biết làm.
我买了两条鱼。|Tôi mua hai con cá.
她很喜欢跳舞。|Cô ấy rất thích nhảy múa.
我的头有点儿疼。|Đầu tôi hơi đau.
他在外国工作。|Anh ấy làm việc ở nước ngoài.
外面很冷，多穿一点儿。|Bên ngoài rất lạnh, mặc thêm một chút.
作业已经做完了。|Bài tập đã làm xong.
这个城市有一百万人。|Thành phố này có một triệu người.
一直往前走，就到了。|Cứ đi thẳng về phía trước là đến.
我在网上看到了这个消息。|Tôi thấy tin này trên mạng.
别忘了给奶奶打电话。|Đừng quên gọi điện cho bà.
那位老师姓王。|Vị giáo viên kia họ Vương.
你为什么学汉语？|Tại sao bạn học tiếng Trung?
我希望明年去中国。|Tôi hy vọng năm sau đi Trung Quốc.
饭前要洗手。|Trước bữa ăn phải rửa tay.
请问，洗手间在哪儿？|Xin hỏi nhà vệ sinh ở đâu?
请从楼上下来。|Hãy đi từ trên lầu xuống đây.
猫在桌子下面。|Con mèo ở dưới bàn.
你先下去，我一会儿来。|Bạn xuống trước, lát nữa tôi đến.
这个小孩儿很爱笑。|Đứa trẻ này rất hay cười.
我小时候住在农村。|Lúc nhỏ tôi sống ở nông thôn.
她一看见我就笑了。|Vừa nhìn thấy tôi cô ấy đã cười.
请问您姓什么？|Xin hỏi quý danh của ngài là gì?
请在这里写姓名。|Hãy viết họ tên ở đây.
你喜欢什么颜色？|Bạn thích màu gì?
我的眼睛有点儿疼。|Mắt tôi hơi đau.
这种药一天吃两次。|Thuốc này uống hai lần một ngày.
前面有一家药店。|Phía trước có một hiệu thuốc.
爷爷每天走路去公园。|Ông mỗi ngày đi bộ đến công viên.
请等我一会儿。|Hãy đợi tôi một lát.
我已经买好票了。|Tôi đã mua vé xong rồi.
周末我们一起去游泳吧。|Cuối tuần chúng ta cùng đi bơi nhé.
我不懂这句话的意思。|Tôi không hiểu ý của câu này.
今天阴，可能会下雨。|Hôm nay trời âm u, có thể sẽ mưa.
因为身体不舒服，他没上班。|Vì không khỏe nên anh ấy không đi làm.
小鱼在水里游。|Cá nhỏ bơi trong nước.
妹妹正在学游泳。|Em gái đang học bơi.
这本书很有意思。|Quyển sách này rất thú vị.
我有时坐地铁上班。|Đôi khi tôi đi tàu điện ngầm đến chỗ làm.
洗手间在右边。|Nhà vệ sinh ở bên phải.
银行就在商场右边。|Ngân hàng ngay bên phải trung tâm thương mại.
这条鱼很新鲜。|Con cá này rất tươi.
机场离市中心很远。|Sân bay rất xa trung tâm thành phố.
我每天运动半个小时。|Mỗi ngày tôi vận động nửa giờ.
下一站是火车站。|Trạm tiếp theo là ga tàu.
她的丈夫在银行工作。|Chồng cô ấy làm việc ở ngân hàng.
今天怎么这么冷？|Sao hôm nay lạnh thế này?
你这样说，我就懂了。|Bạn nói như vậy thì tôi hiểu rồi.
门开着，请进。|Cửa đang mở, mời vào.
他正往这边走。|Anh ấy đang đi về phía này.
我下周开始上班。|Tuần sau tôi bắt đầu đi làm.
我正在准备考试。|Tôi đang chuẩn bị cho kỳ thi.
自己的事情要自己做。|Việc của mình phải tự làm.
我们走吧，别迟到了。|Chúng ta đi thôi, đừng đến muộn.
我每天走路去公司。|Mỗi ngày tôi đi bộ đến công ty.
他们周末一起踢足球。|Cuối tuần họ cùng đá bóng.
这家饭馆的鱼最好吃。|Cá ở quán này ngon nhất.
地铁站在左边。|Ga tàu điện ngầm ở bên trái.
药店在医院左边。|Hiệu thuốc ở bên trái bệnh viện.
`.trim();

const PEDAGOGY_NOTES = Object.freeze({
  309:{usage:"比 đặt trước đối tượng so sánh; không thêm 很 trước tính từ trong mẫu cơ bản.",error:"Tránh nói 比…很… khi chỉ muốn so sánh chênh lệch đơn giản.",confusable:"没有…那么…"},
  311:{usage:"别 + động từ dùng để khuyên hoặc ngăn ai làm việc gì.",error:"别 đứng trước động từ, không đặt cuối câu như ‘đừng’."},
  323:{usage:"次 đếm số lần xảy ra của hành động.",error:"Phân biệt 次 (lần) với 遍 (lượt từ đầu đến cuối, học ở cấp sau)."},
  332:{usage:"得 đứng sau động từ và trước bổ ngữ miêu tả mức độ/kết quả.",error:"Không nhầm 得 với 的 hoặc 地 dù đều có thể đọc de.",confusable:"的 / 地"},
  333:{usage:"地 nối trạng ngữ miêu tả cách thức với động từ.",error:"Không nhầm 地 với 得 trong mẫu động từ + 得 + bổ ngữ.",confusable:"的 / 得"},
  336:{usage:"点 trong 点菜/点饮料 là gọi món; trong 点头 là chấm/gật.",error:"Không nhầm với 点 chỉ giờ đã học ở HSK1."},
  347:{usage:"过 đọc guò là động từ ‘đi qua/vượt qua’.",error:"Không đọc nhẹ như trợ từ trải nghiệm 过.",confusable:"过 (guo, trợ từ trải nghiệm)"},
  351:{usage:"Động từ + 过 nói về trải nghiệm từng có, không nêu một thời điểm hoàn tất cụ thể.",error:"Phủ định dùng 没(有) + động từ + 过, không dùng 不.",confusable:"了 / 过 (guò, đi qua)"},
  352:{usage:"还是 nối lựa chọn trong câu hỏi; cũng có nghĩa ‘vẫn’ theo ngữ cảnh.",error:"Trong câu trần thuật lựa chọn thường dùng 或者, không thay máy móc bằng 还是.",confusable:"或者"},
  357:{usage:"花 + thời gian/tiền + làm việc gì: bỏ ra, tiêu tốn.",error:"Phân biệt 花 động từ ‘tiêu’ với 花 danh từ ‘hoa’.",confusable:"花 (hoa)"},
  358:{usage:"花 là danh từ ‘hoa’; học theo cụm 一朵花, 花园.",error:"Phân biệt với 花 + tiền/thời gian.",confusable:"花 (tiêu)"},
  365:{usage:"记得 + việc cần làm/đã nhớ: nhớ, nhớ làm.",error:"记得 là ‘nhớ’; 想 là ‘muốn/nghĩ’, không thay thế nhau."},
  370:{usage:"进 chỉ hướng vào; thêm 来/去 để nói hướng về hay rời người nói.",error:"Không bỏ 来/去 khi hướng di chuyển là trọng tâm.",confusable:"进来 / 进去"},
  376:{usage:"一…就… diễn tả vừa có điều kiện/hành động trước thì hành động sau xảy ra ngay.",error:"就 đứng trước động từ/vị ngữ chính của vế sau."},
  382:{usage:"可能 có thể làm động từ năng nguyện hoặc danh từ ‘khả năng’.",error:"Không dùng 可能 để xin phép; dùng 可以."},
  386:{usage:"快要/就要…了 báo một việc sắp xảy ra.",error:"Không dùng 快要 với mốc thời gian cụ thể theo cách máy móc."},
  389:{usage:"A 离 B + 近/远 diễn tả khoảng cách.",error:"Không đảo thành B 离 A nếu chủ đề cần nói là A."},
  399:{usage:"每 + danh từ lượng/thời gian thường phối hợp với 都.",error:"Không bỏ lượng từ khi danh từ cần lượng từ: 每个人."},
  403:{usage:"面 có thể chỉ mặt/phía hoặc làm lượng từ cho vật phẳng như tường, cờ.",error:"Không đồng nhất mọi 面 với 面条 ‘mì’."},
  406:{usage:"那么 chỉ cách/mức độ xa ngữ cảnh hoặc mở kết luận ‘vậy thì’.",error:"Phân biệt 这么 (thế này) và 那么 (thế kia/vậy thì).",confusable:"这么"},
  418:{usage:"Động từ + 起来 có thể chỉ hướng đi lên hoặc bắt đầu một trạng thái/hành động.",error:"Không dịch mọi 起来 thành ‘đứng dậy’."},
  422:{usage:"让 + người + động từ: cho phép/yêu cầu/khiến ai làm gì.",error:"Người thực hiện đứng sau 让."},
  438:{usage:"虽然 thường đi với 但是/可是 ở vế sau; chủ ngữ đặt theo trọng tâm câu.",error:"Không dùng 因为 ở vế sau của 虽然.",confusable:"因为…所以…"},
  443:{usage:"条 là lượng từ cho vật dài/mềm như đường, quần, cá.",error:"Không dùng 条 cho mọi đồ vật chỉ vì tiếng Việt có ‘cái’."},
  450:{usage:"往 + phương hướng/nơi chốn + động từ.",error:"往 chỉ hướng; 到 nhấn điểm đến đạt tới."},
  454:{usage:"为什么 giữ vị trí từ hỏi và không đi cùng 吗.",error:"Không thêm 吗 vào cuối câu đã có 为什么."},
  471:{usage:"一会儿 có thể chỉ một khoảng ngắn hoặc ‘một lát nữa’ tùy vị trí.",error:"Phân biệt 一会儿 với 一点儿 chỉ lượng nhỏ."},
  472:{usage:"已经 thường phối hợp với 了 để nhấn trạng thái đã đạt tới.",error:"Không bắt buộc dịch 已经 thành ‘đã’ ở mọi câu tiếng Việt."},
  476:{usage:"因为 nêu nguyên nhân; 所以 nêu kết quả.",error:"Không đảo 因为 và 所以 theo trật tự tiếng Việt tùy tiện."},
  490:{usage:"Động từ + 着 nhấn trạng thái đang duy trì.",error:"着 không thay cho 正在 trong mọi hành động đang tiến hành.",confusable:"正在"},
  498:{usage:"最 + tính từ/động từ tâm lý biểu thị mức cao nhất trong phạm vi.",error:"Phải có phạm vi so sánh rõ trong ngữ cảnh, không dùng 最 cho hai đối tượng đơn thuần."}
});

function parseExamples() {
  const rows = ORIGINAL_EXAMPLES.split("\n").map((line) => line.split("|"));
  if (rows.length !== 200 || rows.some((row) => row.length !== 2)) throw new Error(`HSK2 example mismatch: ${rows.length}`);
  return rows.map(([zh, vi]) => ({zh, vi}));
}

const unitDefinitions = [
  ["HSK一级到二级的桥", "Ôn cầu nối HSK1", "Khôi phục phản xạ âm, chữ, câu và chiến lược tự sửa trước khi học nội dung mới."],
  ["生活安排和频率", "Lịch sinh hoạt và tần suất", "Sắp xếp lịch, nói tần suất, thời lượng và thay đổi kế hoạch."],
  ["住房和社区", "Nhà ở và khu phố", "Mô tả phòng, vị trí, tiện ích và hỏi thông tin khu vực."],
  ["出行和短途旅行", "Đi lại và du lịch ngắn", "Mua vé, hỏi tuyến, nói điểm đi/đến và xử lý thay đổi."],
  ["饮食购物和服务", "Ăn uống, mua sắm và dịch vụ", "Đặt món, nêu yêu cầu, nhận xét và xử lý sai/thiếu đơn giản."],
  ["健康和自我照顾", "Sức khỏe và chăm sóc bản thân", "Mô tả triệu chứng, nghe lời khuyên và nói thói quen chăm sóc sức khỏe."],
  ["学习和日常工作", "Học tập và công việc thường ngày", "Nói mục tiêu, khó khăn, nhiệm vụ và nhờ hỗ trợ trong lớp/công việc."],
  ["爱好家庭和关系", "Sở thích, gia đình và quan hệ", "Mời, kể hoạt động, giới thiệu quan hệ và bày tỏ cảm xúc."],
  ["比较描述和网络沟通", "So sánh, miêu tả và giao tiếp số", "So sánh lựa chọn, mô tả người/vật và trao đổi qua tin nhắn/mạng."],
  ["经历和近期计划", "Trải nghiệm và kế hoạch gần", "Kể trải nghiệm đã có, kết nối sự kiện và lập kế hoạch gần."]
];

const grammarDefinitions = [
  {nameZh:"礼貌修复和语气助词啊",nameVi:"Sửa chữa giao tiếp lịch sự và trợ từ 啊",formula:"不好意思 + yêu cầu / Câu + 啊",meaningVi:"Dùng lời xin lỗi, yêu cầu nhắc lại và trợ từ 啊 để phản hồi tự nhiên khi chưa nghe rõ.",usageVi:["不好意思 mở đầu lời làm phiền hoặc xin lỗi nhẹ.","啊 có thể biểu thị nhận ra, ngạc nhiên hoặc làm mềm giọng; nghĩa phụ thuộc ngữ điệu."],correct:[["不好意思，请再说一次。","Xin lỗi, hãy nói lại một lần."],["啊，我明白了。","À, tôi hiểu rồi."]],incorrect:["啊 đứng đầu/cuối câu nhưng không thay được mọi trợ từ ngữ khí."],confusables:["吧","呢"],status:"extension"},
  {nameZh:"动词结果补语",nameVi:"Bổ ngữ kết quả cơ bản",formula:"Động từ + 懂/错/完/好",meaningVi:"Nói kết quả đạt được sau hành động: nghe hiểu, làm sai, làm xong, chuẩn bị xong.",usageVi:["Trọng tâm nằm ở kết quả, không chỉ ở hành động.","Phủ định việc chưa đạt kết quả thường dùng 没(有)."],correct:[["我听懂了。","Tôi nghe hiểu rồi."],["这道题做错了。","Câu này làm sai rồi."]],incorrect:["Không đảo thành 懂听 hoặc 错做."],confusables:["了"],status:"new"},
  {nameZh:"每……都……",nameVi:"Mỗi… đều…",formula:"每 + đơn vị/người + 都 + vị ngữ",meaningVi:"Diễn tả thói quen hoặc quy luật lặp lại đối với mọi thành viên/thời điểm trong phạm vi.",usageVi:["每 đứng trước danh từ/lượng từ.","都 đứng sau chủ ngữ/chủ đề và trước vị ngữ."],correct:[["我每天都跑步。","Ngày nào tôi cũng chạy bộ."],["每个人都要写名字。","Mỗi người đều phải viết tên."]],incorrect:["Không đặt 都 trước 每: 都每天."],confusables:["常常","有时"],status:"new"},
  {nameZh:"时间顺序和先后",nameVi:"Trình tự thời gian với 先…再…",formula:"先 + hành động 1，再 + hành động 2",meaningVi:"Sắp xếp hai hành động theo thứ tự rõ ràng.",usageVi:["Có thể thêm thời gian cụ thể trước cả chuỗi.","再 nói hành động sau trong kế hoạch; 又 thường nói lặp lại đã xảy ra."],correct:[["我先吃饭，再出门。","Tôi ăn trước rồi mới ra ngoài."],["先准备好，再给我打电话。","Chuẩn bị xong trước rồi gọi cho tôi."]],incorrect:["Không dùng 再 cho hành động lặp đã hoàn tất nếu muốn nhấn ‘lại’."],confusables:["又"],status:"new"},
  {nameZh:"快要／就要……了",nameVi:"Sắp… rồi",formula:"快要/就要 + động từ + 了",meaningVi:"Báo một sự việc sắp xảy ra hoặc trạng thái sắp thay đổi.",usageVi:["快要 nhấn rất gần thời điểm xảy ra.","了 đứng cuối câu báo tình huống mới."],correct:[["火车快要到了。","Tàu sắp đến rồi."],["就要考试了。","Sắp thi rồi."]],incorrect:["Không thêm 已经 vào cùng một vị trí nếu sự việc mới chỉ sắp xảy ra."],confusables:["已经…了"],status:"new"},
  {nameZh:"方位词组",nameVi:"Cụm phương vị trong/ngoài/trên/dưới",formula:"Danh từ nơi chốn + 里/外/上/下/前/后",meaningVi:"Xác định vị trí tương đối của người hoặc vật.",usageVi:["Từ phương vị đứng sau danh từ mốc.","Có thể thêm 面 để thành 里面、外面、上面、下面."],correct:[["书在包里面。","Sách ở trong cặp."],["人在门外面。","Người ở bên ngoài cửa."]],incorrect:["Không đảo thành 里面包 khi muốn nói ‘trong cặp’."],confusables:["有字句","在字句"],status:"new"},
  {nameZh:"离字句",nameVi:"Nói khoảng cách với 离",formula:"A + 离 + B + 近/远",meaningVi:"Miêu tả A cách B gần hay xa.",usageVi:["A là đối tượng đang được mô tả.","Có thể thêm con số khoảng cách khi đã biết cách nói đơn vị."],correct:[["我家离学校很近。","Nhà tôi gần trường."],["机场离这里不远。","Sân bay không xa đây."]],incorrect:["Không dùng 在 thay 离 để nói khoảng cách."],confusables:["从…到…"],status:"new"},
  {nameZh:"趋向补语来和去",nameVi:"Bổ ngữ xu hướng 来/去",formula:"Động từ hướng + 来/去",meaningVi:"来 biểu thị hướng về phía người nói/điểm nhìn; 去 biểu thị rời xa.",usageVi:["进来 là vào đây; 进去 là vào đó/bên trong xa điểm nhìn.","Lựa chọn phụ thuộc điểm nhìn của người nói."],correct:[["请进来。","Mời vào đây."],["他已经进去了。","Anh ấy đã đi vào rồi."]],incorrect:["Không chọn 来/去 chỉ theo bản dịch tiếng Việt mà bỏ qua điểm nhìn."],confusables:["出来/出去","上来/上去"],status:"new"},
  {nameZh:"从……到……",nameVi:"Từ… đến…",formula:"从 + điểm đầu + 到 + điểm cuối",meaningVi:"Nêu tuyến đường, phạm vi thời gian hoặc quá trình từ điểm bắt đầu đến điểm kết thúc.",usageVi:["Cụm 从…到… thường đứng trước động từ chính.","Có thể dùng với nơi chốn hoặc thời gian."],correct:[["从家到公司要三十分钟。","Từ nhà đến công ty mất ba mươi phút."],["我从九点工作到五点。","Tôi làm việc từ chín đến năm giờ."]],incorrect:["Không đảo điểm đầu và điểm cuối."],confusables:["离"],status:"new"},
  {nameZh:"坐和乘车方式",nameVi:"Nói phương tiện và cách di chuyển",formula:"坐 + phương tiện / 打车 / 走路",meaningVi:"Chọn động từ phù hợp để nói cách đi lại.",usageVi:["坐 dùng với xe, tàu, máy bay trong mẫu cơ bản.","打车 là gọi/đi taxi; 走路 là đi bộ."],correct:[["我们坐地铁去机场。","Chúng tôi đi tàu điện ngầm đến sân bay."],["太晚了，打车吧。","Muộn quá rồi, gọi taxi nhé."]],incorrect:["去 + nơi chốn không thêm 在 trước nơi chốn."],confusables:["开车","走路"],status:"reinforcement"},
  {nameZh:"动词过和趋向",nameVi:"过: đi qua và hướng di chuyển",formula:"过 + nơi/mốc / Động từ + 过来/过去",meaningVi:"Phân biệt 过 đọc guò là đi qua với các động từ xu hướng 过来、过去.",usageVi:["过马路 = qua đường.","拿过来 = mang lại đây; 走过去 = đi qua đó."],correct:[["过马路要小心。","Qua đường phải cẩn thận."],["请把票拿过来。","Hãy mang vé lại đây."]],incorrect:["Không đọc nhẹ 过 trong nghĩa ‘đi qua’."],confusables:["过 (trợ từ trải nghiệm)"],status:"new"},
  {nameZh:"一点儿和数量要求",nameVi:"Một chút và yêu cầu số lượng",formula:"一点儿 + danh từ / tính từ + 一点儿",meaningVi:"Nói lượng nhỏ hoặc điều chỉnh mức độ khi gọi món/yêu cầu dịch vụ.",usageVi:["一点儿 đứng trước danh từ.","Sau tính từ, 一点儿 biểu thị ‘… hơn một chút’."],correct:[["我要一点儿肉。","Tôi muốn một chút thịt."],["请慢一点儿。","Hãy chậm một chút."]],incorrect:["Không nhầm 一点儿 với 一会儿 ‘một lát’."],confusables:["有点儿","一会儿"],status:"extension"},
  {nameZh:"比字句",nameVi:"So sánh với 比",formula:"A + 比 + B + tính từ",meaningVi:"So sánh một đặc điểm giữa hai người/vật.",usageVi:["Không dùng 很 trực tiếp trước tính từ trong mẫu so sánh trung tính.","Có thể thêm 一点儿、多了 để nói mức chênh."],correct:[["这件比那件便宜。","Cái này rẻ hơn cái kia."],["地铁比公交车快。","Tàu điện ngầm nhanh hơn xe buýt."]],incorrect:["Sai: 这个比那个很贵。"],confusables:["没有…那么…","最"],status:"new"},
  {nameZh:"常用量词条间位面",nameVi:"Lượng từ 条、间、位、面",formula:"Số/từ chỉ định + lượng từ + danh từ",meaningVi:"Dùng lượng từ phù hợp cho vật dài, phòng, người (lịch sự) và bề mặt.",usageVi:["条: đường/quần/cá; 间: phòng; 位: người lịch sự; 面: vật phẳng như tường/cờ.","Không dùng 个 thay toàn bộ lượng từ."],correct:[["一条鱼","một con cá"],["两间房","hai phòng"]],incorrect:["Sai: 一个裤子; dùng 一条裤子."],confusables:["个","件"],status:"new"},
  {nameZh:"怎么了和身体部位疼",nameVi:"Hỏi triệu chứng với 怎么了 và …疼",formula:"Chủ ngữ + 怎么了？ / Bộ phận + 疼",meaningVi:"Hỏi có chuyện gì và nói vị trí đau.",usageVi:["怎么了 hỏi tình trạng/sự cố, không chỉ hỏi cách làm.","Bộ phận cơ thể thường đứng trước 疼."],correct:[["你怎么了？","Bạn sao vậy?"],["我眼睛疼。","Tôi đau mắt."]],incorrect:["Không thêm 是 trước 疼 trong câu miêu tả cơ bản."],confusables:["怎么样","为什么"],status:"new"},
  {nameZh:"状态变化和多了",nameVi:"Thay đổi trạng thái và …多了",formula:"Tính từ + 多了 / …了",meaningVi:"Nói trạng thái thay đổi rõ hơn so với trước.",usageVi:["舒服多了 = khỏe/dễ chịu hơn nhiều.","了 báo trạng thái mới, không phải dấu quá khứ bắt buộc."],correct:[["吃药以后舒服多了。","Uống thuốc xong dễ chịu hơn nhiều."],["天气冷了。","Trời trở lạnh rồi."]],incorrect:["Không dùng 是 trước cụm tính từ."],confusables:["比字句"],status:"extension"},
  {nameZh:"因为……所以……",nameVi:"Vì… nên…",formula:"因为 + nguyên nhân，所以 + kết quả",meaningVi:"Nối nguyên nhân và kết quả rõ ràng.",usageVi:["Trong khẩu ngữ có thể lược một vế nối nếu quan hệ đã rõ.","所以 đứng trước kết quả."],correct:[["因为下雨，所以我没跑步。","Vì mưa nên tôi không chạy bộ."],["他累了，所以先回家。","Anh ấy mệt nên về nhà trước."]],incorrect:["Không dùng 但是 thay 所以 khi muốn nói kết quả."],confusables:["虽然…但是…"],status:"new"},
  {nameZh:"得字程度补语",nameVi:"Bổ ngữ mức độ với 得",formula:"Động từ + 得 + tính từ/cụm miêu tả",meaningVi:"Đánh giá cách một hành động được thực hiện.",usageVi:["Nếu có tân ngữ, thường cần sắp xếp lại: 他说汉语说得很好.","Phủ định đặt trong bổ ngữ: 说得不快."],correct:[["老师教得很清楚。","Giáo viên dạy rất rõ."],["他跑得不快。","Anh ấy chạy không nhanh."]],incorrect:["Sai: 他得跑很快。"],confusables:["地","的"],status:"new"},
  {nameZh:"地字状语",nameVi:"Trạng ngữ với 地",formula:"Tính từ/cụm miêu tả + 地 + động từ",meaningVi:"Miêu tả cách thức hoặc trạng thái khi thực hiện hành động.",usageVi:["地 đứng trước động từ.","Nhiều trạng ngữ một âm tiết khẩu ngữ có thể không dùng 地; bài này luyện mẫu rõ ràng."],correct:[["她高兴地笑了。","Cô ấy vui vẻ cười."],["请慢慢地说。","Hãy nói chậm rãi."]],incorrect:["Sai: 她笑得高兴地。"],confusables:["得","的"],status:"new"},
  {nameZh:"让字兼语句",nameVi:"Cho phép/yêu cầu với 让",formula:"A + 让 + B + động từ",meaningVi:"A cho phép, yêu cầu hoặc khiến B làm gì.",usageVi:["Người thực hiện hành động đứng sau 让.","Phủ định có thể đặt trước 让 hoặc trước động từ tùy ý nghĩa."],correct:[["老师让我再说一次。","Giáo viên bảo tôi nói lại."],["妈妈不让我喝咖啡。","Mẹ không cho tôi uống cà phê."]],incorrect:["Không đảo người thực hiện ra sau động từ."],confusables:["请","叫"],status:"new"},
  {nameZh:"跟……一起……",nameVi:"Cùng… với 跟…一起…",formula:"Chủ ngữ + 跟 + người + 一起 + động từ",meaningVi:"Nói hai hay nhiều người cùng thực hiện một hoạt động.",usageVi:["跟 giới thiệu người đồng hành.","一起 đứng trước động từ chính."],correct:[["我跟朋友一起踢足球。","Tôi đá bóng cùng bạn."],["你跟我们一起去吧。","Bạn đi cùng chúng tôi nhé."]],incorrect:["Không đặt 一起 ở cuối câu một cách máy móc."],confusables:["和"],status:"new"},
  {nameZh:"虽然……但是……",nameVi:"Tuy… nhưng…",formula:"虽然 + nhượng bộ，但是/但 + kết quả trái kỳ vọng",meaningVi:"Nối hai vế có quan hệ nhượng bộ–đối lập.",usageVi:["但是 có thể rút gọn thành 但.","Trong khẩu ngữ có thể lược 但是 nếu quan hệ đã rõ."],correct:[["虽然很累，但是他很快乐。","Tuy rất mệt nhưng anh ấy vui."],["虽然下雨，他还是来了。","Tuy mưa, anh ấy vẫn đến."]],incorrect:["Không ghép 虽然 với 所以 cho cùng quan hệ."],confusables:["因为…所以…"],status:"new"},
  {nameZh:"过年和时间经历",nameVi:"Kể ký ức theo mốc thời gian",formula:"Mốc thời gian + chủ ngữ + hành động",meaningVi:"Dùng 小时候、从小、过年、生日 để kể các sự việc quen thuộc theo mốc.",usageVi:["Thời gian đứng đầu câu hoặc sau chủ ngữ trước động từ.","Dùng 了/过 theo ý nghĩa, không thêm máy móc."],correct:[["我小时候住在河内。","Lúc nhỏ tôi sống ở Hà Nội."],["今年我们在爷爷家过年。","Năm nay chúng tôi ăn Tết ở nhà ông."]],incorrect:["Không đặt mốc thời gian cuối câu theo trật tự tiếng Việt."],confusables:["的时候"],status:"reinforcement"},
  {nameZh:"着表示状态持续",nameVi:"Trạng thái duy trì với 着",formula:"Động từ + 着 (+ tân ngữ)",meaningVi:"Miêu tả trạng thái đang được duy trì, thường làm nền cho thông tin khác.",usageVi:["门开着 = cửa đang ở trạng thái mở.","着 không tương đương toàn bộ với 正在."],correct:[["门开着。","Cửa đang mở."],["他穿着黑色的裤子。","Anh ấy đang mặc quần đen."]],incorrect:["Không dùng 着 sau mọi động từ chỉ vì tiếng Việt có ‘đang’."],confusables:["正在…呢"],status:"new"},
  {nameZh:"最高级最",nameVi:"Mức cao nhất với 最",formula:"Phạm vi + chủ ngữ + 最 + tính từ/động từ tâm lý",meaningVi:"Nói đối tượng có mức độ cao nhất trong một phạm vi.",usageVi:["Phạm vi có thể được nêu trực tiếp hoặc rõ từ ngữ cảnh.","最 đứng trước tính từ/động từ tâm lý."],correct:[["这家饭馆最好。","Quán này tốt nhất."],["我最喜欢游泳。","Tôi thích bơi nhất."]],incorrect:["Với hai đối tượng đơn thuần, ưu tiên 比 thay vì 最."],confusables:["比字句"],status:"new"},
  {nameZh:"还是和选择问句",nameVi:"Câu hỏi lựa chọn với 还是",formula:"Lựa chọn A + 还是 + lựa chọn B？",meaningVi:"Yêu cầu người nghe chọn giữa các phương án.",usageVi:["Không thêm 吗 vào cuối câu lựa chọn.","还是 còn có nghĩa ‘vẫn’ trong ngữ cảnh khác."],correct:[["你坐地铁还是公交车？","Bạn đi tàu điện hay xe buýt?"],["你喝茶还是咖啡？","Bạn uống trà hay cà phê?"]],incorrect:["Sai: 你喝茶还是咖啡吗？"],confusables:["或者"],status:"new"},
  {nameZh:"为什么和因果回答",nameVi:"Hỏi lý do với 为什么",formula:"为什么 + vị ngữ？ / 因为 + nguyên nhân",meaningVi:"Hỏi và trả lời nguyên nhân.",usageVi:["为什么 đứng tại vị trí hỏi lý do, không thêm 吗.","Câu trả lời có thể dùng 因为 hoặc nêu trực tiếp nguyên nhân."],correct:[["你为什么学汉语？","Tại sao bạn học tiếng Trung?"],["因为我想去中国工作。","Vì tôi muốn sang Trung Quốc làm việc."]],incorrect:["Không nói 为什么吗."],confusables:["怎么","怎么了"],status:"new"},
  {nameZh:"趋向补语上下出来",nameVi:"Chuỗi bổ ngữ xu hướng",formula:"上/下/出/进 + 来/去",meaningVi:"Miêu tả hướng di chuyển tương đối với điểm nhìn người nói.",usageVi:["先 xác định hướng cơ bản, sau đó chọn 来/去.","Có thể kết hợp với tân ngữ nơi chốn theo mẫu đã học."],correct:[["请从楼上下来。","Hãy từ trên lầu xuống đây."],["他跑出去了。","Anh ấy chạy ra ngoài rồi."]],incorrect:["Không dùng 来/去 tùy ý nếu điểm nhìn đã rõ."],confusables:["进来/进去","出来/出去"],status:"extension"},
  {nameZh:"过表示经历",nameVi:"Trải nghiệm với 过",formula:"Chủ ngữ + động từ + 过 + tân ngữ",meaningVi:"Nói đã từng có trải nghiệm ít nhất một lần trước hiện tại.",usageVi:["Phủ định: 没(有) + động từ + 过.","Không dùng mốc quá khứ quá cụ thể như trọng tâm hoàn tất; khi đó thường cần cấu trúc khác."],correct:[["我去过北京。","Tôi từng đến Bắc Kinh."],["你吃过这个菜吗？","Bạn từng ăn món này chưa?"]],incorrect:["Sai: 我不去过北京。"],confusables:["了","过 (guò, đi qua)"],status:"new"}
];

const lessonDefinitions = [
  {
    u:1, newRows:[301,312,313,305,306,343,453], reviewWords:["请","说","听","老师"],
    zh:"听不清时怎么办", vi:"Khi nghe chưa rõ", objective:"Xin nhắc lại, xác nhận và nhờ giúp đỡ mà không làm đứt hội thoại.",
    situation:"Bạn đến lớp mới, chưa nghe rõ tên giáo viên và cần xử lý lịch sự.",
    dialogue:"A：不好意思，您能再说一次吗？\nB：我姓王，是这个班的老师。\nA：啊，王老师。您能帮我写一下名字吗？\nB：可以，我告诉你怎么写。",
    reading:"新同学没听清老师的名字。他先说“不好意思”，再请老师帮忙。王老师告诉他自己的姓名，还把名字写在本子上。同学听懂以后说：“啊，明白了。”",
    readingQ:["Học sinh dùng câu nào trước khi xin giúp?","Ai viết/giải thích tên cho học sinh?"], readingA:[["不好意思。","不好意思"],["Giáo viên họ Vương.","王老师"]],
    listening:"老师：这位是李老师。学生：不好意思，是哪位老师？老师：李老师。学生：啊，听懂了，谢谢您帮忙。",
    listeningQ:["Giáo viên mới họ gì?","Học sinh cảm ơn vì việc gì?"], listeningA:["李","Vì được giúp nghe/hiểu rõ."],
    pronunciation:"Luyện nhịp bù hǎoyìsi và thanh nhẹ ở gàosu; giữ giọng hỏi lịch sự, không kéo dài 啊.",
    speaking:"Role-play 45 giây: một người nói tên nhanh, người kia xin nhắc lại, xác nhận rồi cảm ơn.",
    writing:"Viết đoạn chat bốn dòng nhờ một người giúp và xác nhận đã hiểu.", realTask:"Trong một cuộc trò chuyện thật, dùng ít nhất một câu sửa chữa giao tiếp thay vì đoán.",
    grammarPractice:"Viết lại lời yêu cầu trực tiếp thành một lời nhờ lịch sự có 不好意思.", errorPair:["再说一次啊不好意思。","不好意思，请再说一次。"]
  },
  {
    u:1, newRows:[322,308,310,337,326,442,329,474], reviewWords:["学习","写","读","汉字"],
    zh:"把问题说清楚", vi:"Nói rõ vấn đề học tập", objective:"Nói mình hiểu/chưa hiểu, xác định lỗi và hỏi nghĩa của từ hoặc câu.",
    situation:"Bạn đang chữa bài cùng bạn học và cần nói rõ chỗ nào sai.",
    dialogue:"A：请打开本子，看第三题。\nB：这个词我不懂，是什么意思？\nA：你写错了一个字。用这支笔再写一次吧。\nB：现在我懂了。",
    reading:"小林做完练习以后和同学一起看答案。他发现第二题写错了，第三题有一个词不懂。他把问题写在本子上，第二天请老师说明意思。",
    readingQ:["Tiểu Lâm sai câu nào?","Cậu ấy ghi câu hỏi ở đâu?"], readingA:[["Câu số hai.","第二题写错了"],["Trong vở.","写在本子上"]],
    listening:"老师：请打开书，读这个词。学生：老师，我没听懂它的意思。老师：先看例句，再做这道题。学生：好，我用笔写下来。",
    listeningQ:["Giáo viên yêu cầu xem gì trước?","Học sinh dùng gì để ghi?"], listeningA:["Câu ví dụ.","Bút."] ,
    pronunciation:"Phân biệt cí (词) với cì (次), bǐ (笔) với bǐ (比); đọc dǒng trọn âm cuối -ng.",
    speaking:"Giải thích cho bạn chỗ sai của một câu bằng mẫu 这个词/字… và 我懂/不懂…",
    writing:"Viết một lời nhắn cho giáo viên: nêu số câu, từ chưa hiểu và điều bạn muốn được giải thích.", realTask:"Tạo một trang ‘sổ lỗi’: câu sai, câu sửa và lý do bằng tiếng Việt ngắn.",
    grammarPractice:"Biến 我听。 thành câu có kết quả ‘tôi nghe hiểu rồi’. ", errorPair:["我懂听了。","我听懂了。"]
  },
  {
    u:2, newRows:[399,492,374,480,323,378,448], reviewWords:["每天","时间","工作","学习"],
    zh:"一周怎么安排", vi:"Sắp xếp một tuần", objective:"Nói lịch lặp lại, tần suất và lúc bắt đầu/kết thúc hoạt động.",
    situation:"Bạn và bạn học so lịch tuần để chọn buổi luyện tiếng Trung.",
    dialogue:"A：你每周学几次汉语？\nB：我经常晚上学，有时周六也学。\nA：我们周三开始，学完以后一起吃饭吧。\nB：好。",
    reading:"安娜每周运动三次，也经常练习汉语。她周一和周四晚上学习，周六有时跟朋友跑步。每次开始前，她先关掉手机；学完以后才上网。",
    readingQ:["Anna học tiếng Trung vào những tối nào?","Trước khi bắt đầu, cô ấy làm gì?"], readingA:[["Tối thứ Hai và thứ Năm.","周一和周四晚上"],["Tắt điện thoại.","先关掉手机"]],
    listening:"我每周上五天班。星期二和星期四下班以后，我去跑步。每次跑三十分钟，跑完再回家。周末我有时不运动。",
    listeningQ:["Người nói chạy bộ vào ngày nào?","Mỗi lần chạy bao lâu?"], listeningA:["Thứ Ba và thứ Năm.","Ba mươi phút."] ,
    pronunciation:"Luyện cặp zhōu/zhǒu và jīngcháng; không nuốt thanh nhẹ trong yǒushí.",
    speaking:"Nói lịch bảy ngày trong một phút, có ít nhất một hoạt động thường xuyên và một hoạt động đôi khi.",
    writing:"Viết lịch tuần 6–8 câu, dùng 每…都… và 次 để nêu tần suất.", realTask:"So lịch với một người và chốt một buổi học chung bằng tiếng Trung.",
    grammarPractice:"Sắp xếp 每 / 我 / 都 / 早上 / 跑步 thành câu đúng.", errorPair:["都我每天学习。","我每天都学习。"]
  },
  {
    u:2, newRows:[418,319,361,362,471,493,452,365], reviewWords:["早上","晚上","回家","电话"],
    zh:"出门前别忘了", vi:"Đừng quên trước khi ra ngoài", objective:"Kể trình tự chuẩn bị và nhắc việc cần làm trong ngày.",
    situation:"Bạn cùng nhà nhắc nhau trước khi đi làm và hẹn giờ về.",
    dialogue:"A：快起来，八点了！\nB：我准备好了，一会儿就出门。\nA：记得拿手机，别忘了钥匙。\nB：知道了。我晚上九点回来，你先回去吧。",
    reading:"小王每天七点起来。他先洗脸、吃早饭，再准备书包。出门前，他一定看一看手机、钥匙和车票。昨天他忘了拿本子，只好回来一次。",
    readingQ:["Tiểu Vương làm gì sau khi ăn sáng?","Hôm qua cậu ấy quên vật gì?"], readingA:[["Chuẩn bị cặp sách.","再准备书包"],["Quên vở.","忘了拿本子"]],
    listening:"女：你准备好了吗？男：还没有，我找不到手表。女：在床上。记得带伞，一会儿可能下雨。男：好，我拿了就出门。",
    listeningQ:["Đồng hồ ở đâu?","Người nữ nhắc mang gì?"], listeningA:["Trên giường.","Ô."] ,
    pronunciation:"Phân biệt huílái/huíqù theo hướng; đọc liǎngr trong yíhuìr tự nhiên, không tách từng âm.",
    speaking:"Nói chuỗi năm việc từ lúc thức dậy đến lúc ra khỏi nhà bằng 先…再…",
    writing:"Viết tin nhắn nhắc bạn ba việc trước khi đi du lịch và cho biết giờ bạn trở về.", realTask:"Tạo checklist tiếng Trung gồm 6 mục cho buổi sáng ngày mai.",
    grammarPractice:"Nối hai câu 吃早饭。出门。 bằng 先…再…", errorPair:["我再先吃饭出门。","我先吃饭，再出门。"]
  },
  {
    u:2, newRows:[386,472,491,490,432,382,431], reviewWords:["现在","明天","下雨","来"],
    zh:"计划可能有变化", vi:"Kế hoạch có thể thay đổi", objective:"Báo việc sắp xảy ra, việc đã hoàn tất và khả năng thay đổi kế hoạch.",
    situation:"Một cuộc hẹn ngoài trời có thể đổi vì thời tiết.",
    dialogue:"A：你已经到公园了吗？\nB：还没有，我正坐着地铁过去。\nA：天快要下雨了，这件事情可能要改。\nB：到时给我打电话吧。",
    reading:"今天下午大家要在公园见面。小李已经准备好了，小王正往公园走。可是天阴着，快要下雨了。老师说：“到时如果雨很大，我们可能去旁边的咖啡店。”",
    readingQ:["Ai đang đi về phía công viên?","Nếu mưa to, mọi người có thể đi đâu?"], readingA:[["Tiểu Vương.","小王正往公园走"],["Quán cà phê bên cạnh.","旁边的咖啡店"]],
    listening:"火车快要到了。请已经买好票的客人准备上车。车门开着的时候，请不要跑。可能有雨，请拿好自己的东西。",
    listeningQ:["Phương tiện nào sắp đến?","Hành khách không được làm gì khi cửa mở?"], listeningA:["Tàu hỏa.","Không chạy."] ,
    pronunciation:"Giữ âm cuối -ng trong zhèng và qíng; phân biệt yǐjīng với yìqǐ.",
    speaking:"Thông báo một thay đổi kế hoạch: việc đã chuẩn bị, điều sắp xảy ra và phương án có thể thay thế.",
    writing:"Viết tin nhắn 5–6 câu hoãn/chuyển một cuộc hẹn vì một lý do cụ thể.", realTask:"Gửi bản nháp thông báo thay đổi lịch cho một người bạn tự kiểm tra.",
    grammarPractice:"Hoàn thành 火车___到了 bằng 快要…了.", errorPair:["火车已经快要到了了。","火车快要到了。"]
  },
  {
    u:3, newRows:[321,400,401,390,447,426,459], reviewWords:["房间","桌子","椅子","家"],
    zh:"我的房间", vi:"Phòng của tôi", objective:"Mô tả vật ở trong, ngoài, trên, dưới và gần cửa.",
    situation:"Bạn gọi video và mô tả phòng để người thân tìm một món đồ.",
    dialogue:"A：你的本子在哪儿？\nB：在房间里面，床旁边的桌子上面。\nA：门口那个包呢？\nB：不是我的。我的包在门后面，别拿外面的。",
    reading:"我的房间不大。床在门的右边，桌子在床前面。桌子上面有电脑，下面有一个小包。书都在包里面。门口没有东西，所以进出很方便。",
    readingQ:["Giường ở phía nào của cửa?","Sách ở đâu?"], readingA:[["Bên phải cửa.","门的右边"],["Trong túi.","包里面"]],
    listening:"请进。你的房间在二楼。床上面有一条白色的东西，是毛巾。洗手间在房间外面，出门往左走。",
    listeningQ:["Phòng ở tầng mấy?","Nhà vệ sinh ở trong hay ngoài phòng?"], listeningA:["Tầng hai.","Ngoài phòng."] ,
    pronunciation:"Phân biệt mén/ménkǒu; đọc lǐmiàn, wàimiàn liền cụm và rõ thanh điệu.",
    speaking:"Mô tả sáu vị trí trong phòng mà không chỉ tay; người nghe vẽ sơ đồ.",
    writing:"Viết 5–6 câu (khoảng 50–70 chữ Hán) mô tả phòng và vị trí ít nhất bốn đồ vật.", realTask:"Dán nhãn tiếng Trung cho năm vị trí/đồ vật trong phòng thật.",
    grammarPractice:"Sửa trật tự 里面书包有书。", errorPair:["里面书包有书。","书包里面有书。"]
  },
  {
    u:3, newRows:[391,366,413,371,484,419,356], reviewWords:["学校","医院","商店","在"],
    zh:"小区附近有什么", vi:"Quanh khu nhà có gì", objective:"Hỏi và mô tả tầng, phòng, vị trí trước/sau và khoảng cách gần/xa.",
    situation:"Bạn xem một phòng thuê và hỏi các tiện ích gần đó.",
    dialogue:"A：这间房在几楼？\nB：在五楼。楼前面有超市，后面有公园。\nA：离地铁站近吗？\nB：很近，旁边还有一家饭馆。",
    reading:"小陈住在六楼的一间房里。楼前面是车站，后面是一个小公园。地铁站离他家很近，走路只要五分钟；机场很远，要坐一个小时的车。",
    readingQ:["Nhà ga tàu điện cách nhà Tiểu Trần thế nào?","Sân bay cách nhà bao lâu đi xe?"], readingA:[["Rất gần.","很近"],["Một giờ.","一个小时"]],
    listening:"这间酒店在商场后面，离机场不远。酒店旁边有地铁站，前面有两家饭馆。您的房间在八楼。",
    listeningQ:["Khách sạn ở phía nào của trung tâm thương mại?","Phòng của khách ở tầng mấy?"], listeningA:["Phía sau.","Tầng tám."] ,
    pronunciation:"Phân biệt jìn (进/近) bằng ngữ cảnh; giữ âm đầu h trong hòumiàn.",
    speaking:"Dùng một sơ đồ khu phố để giới thiệu 4 địa điểm và hai quan hệ khoảng cách.",
    writing:"Viết tin nhắn chỉ vị trí nhà bạn cho một người lần đầu đến.", realTask:"Mô tả ba tiện ích quanh nơi ở thật bằng câu 离…近/远.",
    grammarPractice:"Hoàn thành 我家___公司很近 bằng 离.", errorPair:["我家在公司很近。","我家离公司很近。"]
  },
  {
    u:3, newRows:[499,481,500,482,370,372,373], reviewWords:["一直","这边","那边","哪儿"],
    zh:"进来还是进去", vi:"Vào đây hay đi vào đó", objective:"Chỉ trái/phải và chọn 来/去 theo điểm nhìn người nói.",
    situation:"Bạn đứng trong tòa nhà và hướng dẫn người giao hàng đi vào đúng cửa.",
    dialogue:"A：我在楼下，走哪个门？\nB：从左边的门进来，别走右边。\nA：我看见门了，要进去吗？\nB：对，进去以后往左走，我在教室里等你。",
    reading:"学校有两个门。左边的门离地铁站近，右边的门在商场旁边。小李现在在学校里面，所以他让朋友从左门进来；老师在另一个教室，让小李进去找他。",
    readingQ:["Cửa nào gần ga tàu điện?","Vì sao Tiểu Lý dùng 进来 với bạn?"], readingA:[["Cửa bên trái.","左边的门离地铁站近"],["Vì Tiểu Lý đang ở trong trường.","在学校里面"]],
    listening:"请从右边的门进去。进去以后不要上楼，先往前走。看见咖啡店以后向左走，办公室就在左边。",
    listeningQ:["Đi vào bằng cửa nào?","Có lên tầng ngay không?"], listeningA:["Cửa bên phải.","Không, đi thẳng trước."] ,
    pronunciation:"Phân biệt zuǒ/yòu và jìn/jìnlái; luyện nhịp từ hướng hai âm tiết.",
    speaking:"Một người đứng ngoài, một người đứng trong: hướng dẫn đường và giải thích vì sao dùng 来 hoặc 去.",
    writing:"Viết 5 bước chỉ đường từ cửa tòa nhà đến một phòng.", realTask:"Chỉ đường bằng tiếng Trung cho một điểm thật trong công ty/trường.",
    grammarPractice:"Chọn 进来 hay 进去 khi người nói đang ở trong phòng.", errorPair:["我在房间里，请进去。","我在房间里，请进来。"]
  },
  {
    u:4, newRows:[315,346,335,328,392,393,486], reviewWords:["火车","出租车","怎么","分钟"],
    zh:"哪种车更方便", vi:"Đi phương tiện nào tiện hơn", objective:"Hỏi tuyến, chọn phương tiện và mô tả chặng đường cơ bản.",
    situation:"Bạn cần đi từ nhà đến bến tàu trong giờ cao điểm.",
    dialogue:"A：去火车站坐公交车还是地铁？\nB：坐地铁吧，路上车多，打车也可能慢。\nA：在哪一站下？\nB：第三站，下车以后走五分钟。",
    reading:"从小林家到火车站有三种走法。公交车便宜，但是路上常堵车；打车方便，但是比较贵；地铁最快，坐四站就到。小林今天拿着大包，所以选择打车。",
    readingQ:["Phương tiện nào nhanh nhất?","Hôm nay Tiểu Lâm chọn gì và vì sao?"], readingA:[["Tàu điện ngầm.","地铁最快"],["Taxi vì mang túi lớn.","拿着大包，所以选择打车"]],
    listening:"下一站是中心车站。去机场的客人请在这一站下车，再坐机场公交车。路上大约四十分钟。",
    listeningQ:["Khách đi sân bay xuống ở đâu?","Chặng xe buýt mất khoảng bao lâu?"], listeningA:["Trạm trung tâm.","Khoảng 40 phút."] ,
    pronunciation:"Phân biệt chēzhàn và zhàn; luyện âm đầu d/t trong dìtiě, dǎchē.",
    speaking:"So sánh ba phương tiện theo thời gian, giá và sự tiện lợi rồi chọn một.",
    writing:"Viết hướng dẫn 5 câu từ nhà đến chỗ làm bằng một hoặc hai phương tiện.", realTask:"Tra tuyến thật và nói lại điểm lên, điểm xuống, số trạm bằng tiếng Trung.",
    grammarPractice:"Nối 从家、到车站、坐地铁 thành một câu.", errorPair:["我到家从车站坐地铁。","我从家坐地铁到车站。"]
  },
  {
    u:4, newRows:[363,364,416,317,446,340,348], reviewWords:["飞机","护照","时间","名字"],
    zh:"在机场办手续", vi:"Làm thủ tục ở sân bay", objective:"Trao đổi thông tin vé, chuyến bay và yêu cầu mang đồ lại đây.",
    situation:"Bạn làm thủ tục cho chuyến bay đầu tiên ra nước ngoài.",
    dialogue:"工作人员：您好，请给我看机票。\n旅客：电子票可以吗？\n工作人员：可以。您是第一次出国吗？\n旅客：是的。我的包还在那边，我拿过来。",
    reading:"小明第一次坐飞机出国。他提前两个小时到机场，在手机上找到机票。工作人员问了他的姓名和要去的国家。办完手续后，他把大包交给工作人员，只拿着一个小包上飞机。",
    readingQ:["Minh đến sân bay sớm bao lâu?","Sau thủ tục, Minh mang theo túi nào?"], readingA:[["Hai giờ.","提前两个小时"],["Túi nhỏ.","只拿着一个小包"]],
    listening:"飞往上海的客人请注意：飞机可能晚三十分钟。已经有机票的客人不用换票，请在十二号门等。",
    listeningQ:["Chuyến bay có thể chậm bao lâu?","Hành khách đợi ở cửa số mấy?"], listeningA:["30 phút.","Cửa số 12."] ,
    pronunciation:"Luyện jīchǎng/jīpiào và chūguó; đọc fēi rõ thanh 1, không kéo thành hai âm.",
    speaking:"Role-play nhân viên–hành khách: kiểm tra vé, tên, điểm đến và xử lý một thay đổi.",
    writing:"Viết tin nhắn báo cho gia đình: đã đến sân bay, chuyến bay lúc nào và có thay đổi gì.", realTask:"Tự điền một thẻ hành trình giả bằng tiếng Trung.",
    grammarPractice:"Giải thích khác nhau giữa 拿过来 và 拿过去 theo vị trí người nói.", errorPair:["我在这里，请把票拿过去。","我在这里，请把票拿过来。"]
  },
  {
    u:4, newRows:[375,394,477,402,320,350,450], reviewWords:["住","房间","公园","到"],
    zh:"周末短途旅行", vi:"Chuyến đi ngắn cuối tuần", objective:"Đặt phòng/vé, hỏi hướng và kể các bước của chuyến đi ngắn.",
    situation:"Bạn lên kế hoạch cuối tuần, từ khách sạn đến công viên và điểm tham quan.",
    dialogue:"A：酒店订好了吗？\nB：好了，离公园很近。\nA：门票呢？\nB：网上买了。明天从酒店出去，往右走十分钟就到。",
    reading:"周末小王和朋友去杭州旅游。他们住的酒店不大，但是很干净。第一天，他们买门票进公园，在湖边走了两个小时。晚上回酒店以前，他们又到附近的饭馆吃鱼。",
    readingQ:["Khách sạn có đặc điểm gì?","Buổi tối trước khi về khách sạn họ làm gì?"], readingA:[["Không lớn nhưng sạch.","不大，但是很干净"],["Đến quán gần đó ăn cá.","到附近的饭馆吃鱼"]],
    listening:"从酒店出去以后往左走，过一个路口就能看见公园。门票在右边的小房子里买。旅游车下午五点回来。",
    listeningQ:["Ra khỏi khách sạn thì đi hướng nào?","Xe du lịch về lúc mấy giờ?"], listeningA:["Sang trái.","5 giờ chiều."] ,
    pronunciation:"Phân biệt jiǔdiàn (khách sạn) với jiǔ diǎn (9 giờ) bằng nhịp và thanh.",
    speaking:"Giới thiệu lịch trình một ngày: đi từ đâu, bằng gì, mua vé ở đâu, về lúc nào.",
    writing:"Viết 6–8 câu (khoảng 60–90 chữ Hán) với ít nhất bốn mốc trong kế hoạch du lịch.", realTask:"Tạo một lịch trình thật có địa chỉ, phương tiện và giờ xuất phát.",
    grammarPractice:"Điền 从…到… vào câu nói đường từ khách sạn đến công viên.", errorPair:["从酒店往公园到走。","从酒店往公园走。"]
  },
  {
    u:5, newRows:[339,377,408,354,395,423,483], reviewWords:["吃","喝","喜欢","杯"],
    zh:"在饭馆点什么", vi:"Gọi món ở quán", objective:"Gọi đồ ăn/uống, nêu khẩu vị và xác nhận món.",
    situation:"Bạn gọi món cho hai người, một người không uống cà phê.",
    dialogue:"服务员：两位喝什么？\nA：我要一杯绿茶，他要奶茶。\nB：我不喝奶茶，来红茶吧。\nA：再点一条鱼和一点儿肉。",
    reading:"这家饭馆不大，但是菜不错。中午人很多。小李喜欢吃鱼，小安不吃肉。两个人先点一壶绿茶，后来小安觉得太苦，换了一杯奶茶。",
    readingQ:["Ai không ăn thịt?","Vì sao Tiểu An đổi đồ uống?"], readingA:[["Tiểu An.","小安不吃肉"],["Vì trà xanh quá đắng.","觉得太苦"]],
    listening:"您好，您点的是一条鱼、一盘肉、一杯红茶和一杯咖啡。鱼要等二十分钟，其他的马上来。",
    listeningQ:["Có mấy đồ uống?","Món nào phải đợi 20 phút?"], listeningA:["Hai.","Cá."] ,
    pronunciation:"Luyện lǜchá (绿茶), hóngchá và nǎichá; tránh đọc lǜ thành /lu/.",
    speaking:"Role-play gọi món, đổi một đồ uống và xác nhận lại toàn bộ đơn.",
    writing:"Viết đơn gọi món cho ba người có một yêu cầu đặc biệt.", realTask:"Dùng tiếng Trung gọi thử một bữa ăn giả và tự kiểm tra lượng từ.",
    grammarPractice:"Đổi 请说慢。 thành yêu cầu mềm hơn với 一点儿.", errorPair:["请一点儿慢说。","请说慢一点儿。"]
  },
  {
    u:5, newRows:[424,307,383,466,303,353,355,396], reviewWords:["买","衣服","件","便宜"],
    zh:"选颜色和衣服", vi:"Chọn màu và quần áo", objective:"Hỏi màu, thử lựa chọn và so sánh sản phẩm khi mua sắm.",
    situation:"Bạn tìm quần và túi trong trung tâm thương mại.",
    dialogue:"A：这条裤子有别的颜色吗？\nB：有白色、黑色和绿色。\nA：黑色的比白色的好看。那个红色的包多少钱？\nB：三百块。",
    reading:"商场二楼卖衣服和包。小美想买一条裤子。绿色的便宜，但是有点儿长；黑色的合适，但是比较贵。最后她买了黑色裤子和一个白色小包。",
    readingQ:["Quần màu nào rẻ?","Cuối cùng Tiểu Mỹ mua màu gì?"], readingA:[["Màu xanh lá.","绿色的便宜"],["Quần đen và túi trắng.","黑色裤子和一个白色小包"]],
    listening:"今天商场有活动。红色的包两百块，黑色的包三百块。白色裤子没有了，绿色裤子还有三条。",
    listeningQ:["Túi màu nào rẻ hơn?","Còn bao nhiêu quần xanh lá?"], listeningA:["Túi đỏ.","Ba chiếc."] ,
    pronunciation:"Phân biệt bái/hēi/hóng/lǜ; đọc yánsè với thanh 2–4 rõ ràng.",
    speaking:"So sánh hai món theo màu, giá, kích thước và chọn một món có lý do.",
    writing:"Viết tin nhắn hỏi cửa hàng về màu, giá và cỡ của một sản phẩm.", realTask:"Chọn hai món thật trên mạng và mô tả bằng 5 câu tiếng Trung.",
    grammarPractice:"Tạo câu A 比 B + tính từ với hai chiếc túi.", errorPair:["黑色的比白色的很贵。","黑色的比白色的贵。"]
  },
  {
    u:5, newRows:[357,449,405,443,403,360,406], reviewWords:["钱","块","东西","换"],
    zh:"东西不对怎么办", vi:"Khi món đồ có vấn đề", objective:"Nêu số lượng/giá, chỉ ra đồ hỏng hoặc sai và yêu cầu xử lý.",
    situation:"Món bạn nhận bị hỏng và số lượng khác với đơn.",
    dialogue:"A：不好意思，这条裤子坏了。\nB：您花了多少钱？\nA：三百块。我还买了两碗面，但是只拿到一碗。\nB：那么我给您换，也把另一碗拿来。",
    reading:"小林在网上花一万块买了一台电脑。收到以后，他发现电脑坏了，包里也没有说明。本来商店说两天送到，却花了五天。小林拿着票去商场，请工作人员换一台。",
    readingQ:["Máy tính giá bao nhiêu?","Tiểu Lâm mang gì đến trung tâm thương mại?"], readingA:[["Mười nghìn tệ.","花一万块"],["Vé/hóa đơn.","拿着票"]],
    listening:"您买的是两条鱼和三碗面，一共一百二十块。如果东西坏了，请拿票到商场一楼。",
    listeningQ:["Đơn có bao nhiêu bát mì?","Đồ hỏng thì đến tầng nào?"], listeningA:["Ba bát.","Tầng một."] ,
    pronunciation:"Phân biệt huā (tiêu/hoa) và huà (vẽ); luyện tiáo, wǎn, miàn theo cụm lượng từ.",
    speaking:"Role-play khách–nhân viên: nêu vấn đề, giá, số lượng và đề nghị đổi/bổ sung.",
    writing:"Viết tin nhắn khiếu nại ngắn: đã mua gì, vấn đề gì, mong muốn xử lý ra sao.", realTask:"Tạo mẫu câu ba bước để xử lý hàng sai/hỏng mà vẫn lịch sự.",
    grammarPractice:"Chọn lượng từ đúng cho 裤子、房间、老师、墙.", errorPair:["我买了一个裤子。","我买了一条裤子。"]
  },
  {
    u:6, newRows:[429,436,440,445,467,433,468,469], reviewWords:["医生","医院","病","休息"],
    zh:"哪里不舒服", vi:"Bạn khó chịu ở đâu", objective:"Mô tả triệu chứng, vị trí đau và hiểu hướng dẫn dùng thuốc cơ bản.",
    situation:"Bạn nói chuyện với nhân viên y tế về cơn đau và nơi mua thuốc.",
    dialogue:"医生：你怎么了？\nA：我身体不太舒服，头疼，眼睛也疼。\n医生：先休息，少看手机。这个药一天吃两次。\nA：附近有药店吗？",
    reading:"小安昨天晚上头疼，今天早上眼睛也不舒服。他先去医院看医生。医生让他少上网、多休息，还写了药名。医院前面就有药店，小安拿着药单去买药。",
    readingQ:["Bác sĩ khuyên Tiểu An làm gì?","Hiệu thuốc ở đâu?"], readingA:[["Ít lên mạng và nghỉ nhiều.","少上网、多休息"],["Phía trước bệnh viện.","医院前面"]],
    listening:"这种药饭后吃，一天两次。吃药以后如果还是头疼、眼睛疼，请明天再来看医生。",
    listeningQ:["Thuốc uống trước hay sau ăn?","Nếu vẫn đau thì làm gì?"], listeningA:["Sau ăn.","Ngày mai đi khám lại."] ,
    pronunciation:"Phân biệt tóu/téng và shǒu; đọc yǎnjing với thanh nhẹ ở âm sau.",
    speaking:"Role-play hỏi bệnh: tình trạng, bộ phận đau, thời gian bắt đầu và lời khuyên.",
    writing:"Viết tin nhắn xin nghỉ 5 câu, nêu triệu chứng và kế hoạch đi khám/mua thuốc.", realTask:"Tạo thẻ thông tin sức khỏe đơn giản bằng tiếng Trung, không ghi dữ liệu nhạy cảm thật.",
    grammarPractice:"Hoàn thành câu hỏi tình trạng với 怎么了 và câu trả lời có …疼.", errorPair:["我的头是疼。","我头疼。"]
  },
  {
    u:6, newRows:[414,415,485,388,456,457,338], reviewWords:["早上","公园","小时","水"],
    zh:"怎么运动更舒服", vi:"Vận động sao cho khỏe", objective:"Nói thói quen vận động, mức độ mệt và quy trình chăm sóc sau tập.",
    situation:"Hai người chọn một bài tập phù hợp với thể lực.",
    dialogue:"A：你每天运动吗？\nB：我常跑步，但是跑得不快。\nA：累了就别跑，先走一走。\nB：好。运动完我去洗手，洗手间在哪儿？",
    reading:"小王以前不爱动，现在每周跑步三次。第一次他跑得太快，十分钟就很累。后来他先走路，再慢慢跑，运动以后也记得喝水，所以身体舒服多了。",
    readingQ:["Lần đầu Tiểu Vương gặp vấn đề gì?","Sau này cậu ấy thay đổi cách tập ra sao?"], readingA:[["Chạy quá nhanh và nhanh mệt.","跑得太快"],["Đi bộ trước rồi chạy chậm.","先走路，再慢慢跑"]],
    listening:"今天的运动课先走五分钟，再跑十五分钟。累的人可以慢一点儿。运动完请洗手，洗手间在教室外面。",
    listeningQ:["Chạy bao nhiêu phút?","Nhà vệ sinh ở đâu?"], listeningA:["15 phút.","Ngoài phòng học."] ,
    pronunciation:"Phân biệt pǎo/pǎobù và dòng âm cuối trong yùndòng; luyện shuǐ/shǒu.",
    speaking:"Nói kế hoạch tập 1 tuần, gồm tần suất, thời lượng, mức độ và dấu hiệu cần nghỉ.",
    writing:"Viết 5–7 câu (khoảng 50–80 chữ Hán) về một buổi tập từ khởi động đến nghỉ.", realTask:"Đặt mục tiêu vận động an toàn một tuần bằng 5 câu tiếng Trung.",
    grammarPractice:"Dùng 得 để nói ‘anh ấy chạy không nhanh’. ", errorPair:["他得跑不快。","他跑得不快。"]
  },
  {
    u:6, newRows:[420,475,384,397,341,314,344], reviewWords:["天气","冷","热","今天"],
    zh:"天气和人的样子", vi:"Thời tiết và dáng người", objective:"Miêu tả thời tiết, tốc độ, chiều dài/chiều cao và vóc dáng.",
    situation:"Bạn mô tả người cần đón trong ngày thời tiết thay đổi.",
    dialogue:"A：今天天气怎么样？\nB：上午晴，下午可能阴。\nA：来接我的人什么样？\nB：他个子很高，穿着长裤，走得很快。",
    reading:"今天早上是晴天，小李走得很快。下午天阴了，路上人多，车走得很慢。来接他的人个子很高，穿着一条长裤，手里拿着白色的包。",
    readingQ:["Buổi chiều thời tiết thế nào?","Người đến đón cầm gì?"], readingA:[["Trời âm u.","下午天阴了"],["Một chiếc túi trắng.","白色的包"]],
    listening:"明天上午晴，下午阴。最高二十六度。去机场的路可能很慢，请大家早点儿出门。",
    listeningQ:["Nhiệt độ cao nhất bao nhiêu?","Vì sao cần ra ngoài sớm?"], listeningA:["26 độ.","Đường ra sân bay có thể chậm/tắc."] ,
    pronunciation:"Phân biệt qíng/yīn và cháng/gāo; giữ thanh 3 của kuài khi nói chậm.",
    speaking:"Mô tả một người qua vóc dáng, trang phục và cách di chuyển để bạn nhận ra.",
    writing:"Viết bản tin thời tiết 5 câu kèm một lời khuyên đi lại.", realTask:"Ghi âm dự báo thời tiết 30 giây cho ngày mai.",
    grammarPractice:"Dùng tính từ + 多了 để nói thời tiết ấm hơn trước.", errorPair:["今天是很晴。","今天是晴天。"]
  },
  {
    u:7, newRows:[304,342,379,368,367,380,381,435], reviewWords:["大学","学生","老师","课"],
    zh:"新学期开始了", vi:"Học kỳ mới bắt đầu", objective:"Nói lớp học, lịch khai giảng, bài kiểm tra và đồ dùng cần chuẩn bị.",
    situation:"Bạn mới vào lớp, kiểm tra lịch học và chuẩn bị cặp sách.",
    dialogue:"A：你在哪个班？\nB：二班。下周开学，教室在三楼。\nA：王老师教你们吗？\nB：对。开学第二周就要考试，书包和本子都要带。",
    reading:"小陈今年上高中。开学第一天，他提前到教室，把书、本子和笔放进书包。老师先介绍课程，再告诉大家：这个月要考两次，第一次考试只考听力和阅读。",
    readingQ:["Giáo viên làm gì trước?","Lần thi đầu kiểm tra kỹ năng nào?"], readingA:[["Giới thiệu môn học.","先介绍课程"],["Nghe và đọc.","听力和阅读"]],
    listening:"三班的同学请注意：明天上午八点在五楼教室考试。请带笔，不要带电脑。李老师教的内容都要复习。",
    listeningQ:["Thi ở tầng mấy?","Được mang vật gì?"], listeningA:["Tầng năm.","Bút."] ,
    pronunciation:"Phân biệt bān/bǐ và kǎo/kāi; luyện jiāo (教 dạy) đúng thanh.",
    speaking:"Giới thiệu lớp của bạn: cấp học, giáo viên, phòng, ngày khai giảng và lịch kiểm tra.",
    writing:"Viết 5–6 câu (khoảng 50–70 chữ Hán) thông báo lịch học, địa điểm và vật cần mang.", realTask:"Tạo checklist chuẩn bị ngày học mới bằng tiếng Trung.",
    grammarPractice:"Dùng 得 để đánh giá cách giáo viên dạy.", errorPair:["老师得教很清楚。","老师教得很清楚。"]
  },
  {
    u:7, newRows:[333,332,404,465,464,369,454,434], reviewWords:["名字","说","写","清楚"],
    zh:"介绍得清楚一点儿", vi:"Giới thiệu rõ hơn", objective:"Giới thiệu họ tên, mô tả cách nói/làm và hỏi lý do học tập.",
    situation:"Bạn ghi danh cho một hoạt động và tự giới thiệu trước nhóm.",
    dialogue:"A：请写姓名。您姓什么？\nB：我姓阮，名叫文德。\nA：请介绍一下自己，也说说为什么学汉语。\nB：我希望工作时说得更清楚。",
    reading:"新同学先在本子上写姓名，再高兴地介绍自己。他姓李，名叫小明。他说得不快，大家都听懂了。老师问他为什么来这个班，他说希望认识更多朋友。",
    readingQ:["Học sinh mới nói nhanh hay chậm?","Cậu ấy học lớp này vì sao?"], readingA:[["Không nhanh.","说得不快"],["Muốn quen thêm bạn.","希望认识更多朋友"]],
    listening:"请大家慢慢地说姓名，再介绍自己的爱好。说得清楚的人不用再说；大家没听懂时，请再说一次。",
    listeningQ:["Ngoài họ tên cần giới thiệu gì?","Khi mọi người chưa hiểu thì làm gì?"], listeningA:["Sở thích.","Nói lại một lần."] ,
    pronunciation:"Phân biệt de trong 得 và 地 bằng vị trí; đọc xìngmíng, jièshào theo cụm.",
    speaking:"Tự giới thiệu 60 giây: họ tên, công việc/học tập, sở thích và lý do học tiếng Trung.",
    writing:"Viết hồ sơ 5–7 câu (khoảng 60–80 chữ Hán), tránh dịch trật tự họ tên từ tiếng Việt máy móc.", realTask:"Ghi âm tự giới thiệu và tự chấm độ rõ, tốc độ, thanh điệu.",
    grammarPractice:"Phân biệt nói ‘nói rõ’ bằng 说得清楚 và ‘vui vẻ nói’ bằng 高兴地说.", errorPair:["他清楚地说得。","他说得很清楚。"]
  },
  {
    u:7, newRows:[422,494,455,331,345,376,324], reviewWords:["工作","同事","请","先"],
    zh:"请同事帮个忙", vi:"Nhờ đồng nghiệp giúp", objective:"Mô tả nhiệm vụ quen thuộc, nhờ người khác và nêu hy vọng/kết quả.",
    situation:"Bạn cần đồng nghiệp kiểm tra một việc trước giờ nộp.",
    dialogue:"A：这件事情我自己做不完，你能帮忙吗？\nB：可以。你希望我先做什么？\nA：请跟我一起看名单。经理让我下午就交。\nB：好，但是我三点有会。",
    reading:"小林从早上九点开始工作。今天经理让他检查一份名单。他希望中午以前做完，但是内容很多，所以请同事跟他一起看。两个人先分工作，下午两点就完成了。",
    readingQ:["Quản lý yêu cầu kiểm tra gì?","Công việc hoàn thành lúc mấy giờ?"], readingA:[["Một danh sách.","检查一份名单"],["2 giờ chiều.","下午两点"]],
    listening:"请各位下午一点到教室开会。经理希望大家自己准备一个问题。会议从一点开始，三点就结束。",
    listeningQ:["Cuộc họp bắt đầu lúc mấy giờ?","Mỗi người chuẩn bị gì?"], listeningA:["1 giờ chiều.","Một câu hỏi."] ,
    pronunciation:"Luyện ràng (让), zìjǐ và xīwàng; giữ nhịp 跟我一起.",
    speaking:"Role-play nhờ đồng nghiệp: nêu việc, thời hạn, phần cần giúp và phản hồi lịch của mình.",
    writing:"Viết tin nhắn công việc ngắn có yêu cầu, lý do, thời hạn và lời cảm ơn.", realTask:"Soạn một lời nhờ thật trong công việc nhưng không gửi nếu chưa được phép.",
    grammarPractice:"Sắp xếp 经理 / 让我 / 下午 / 交 thành câu.", errorPair:["经理让我交下午。","经理让我下午交。"]
  },
  {
    u:8, newRows:[302,387,497,441,421,444,479,398], reviewWords:["喜欢","朋友","周末","一起"],
    zh:"你的爱好是什么", vi:"Sở thích của bạn là gì", objective:"Nói sở thích, mời hoạt động và đánh giá thú vị/chán.",
    situation:"Một nhóm bạn chọn hoạt động cuối tuần.",
    dialogue:"A：你的爱好是什么？\nB：我喜欢打篮球，也喜欢踢足球。你呢？\nA：我不爱球，我喜欢跳舞。\nB：那我们看表演吧，一个人在家没意思。",
    reading:"班里每个人的爱好不同。小张周末踢足球，小美学跳舞，小林喜欢看篮球比赛。大家觉得一起运动很有意思，一个人在教室做练习没意思。",
    readingQ:["Tiểu Mỹ thích gì?","Mọi người thấy hoạt động nào thú vị?"], readingA:[["Học nhảy.","小美学跳舞"],["Cùng nhau vận động.","一起运动很有意思"]],
    listening:"星期六下午学校有篮球比赛，星期日上午大家一起踢足球。喜欢跳舞的同学可以星期六晚上来看表演。",
    listeningQ:["Trận bóng rổ khi nào?","Tối thứ Bảy có hoạt động gì?"], listeningA:["Chiều thứ Bảy.","Xem biểu diễn nhảy/múa."] ,
    pronunciation:"Phân biệt lánqiú/zúqiú; luyện tī và tiàowǔ với đầu lưỡi đúng.",
    speaking:"Mời bạn làm một hoạt động, hỏi sở thích và thương lượng khi hai người thích khác nhau.",
    writing:"Viết lời mời cuối tuần kèm hai lựa chọn và thời gian cụ thể.", realTask:"Hỏi thật một người về sở thích bằng tiếng Trung và ghi lại câu trả lời.",
    grammarPractice:"Dùng 跟…一起… để mời một người chơi bóng.", errorPair:["我一起跟朋友足球踢。","我跟朋友一起踢足球。"]
  },
  {
    u:8, newRows:[470,409,487,417,410,412,461], reviewWords:["家人","爸爸","妈妈","孩子"],
    zh:"介绍一家人", vi:"Giới thiệu một gia đình", objective:"Giới thiệu quan hệ gia đình và miêu tả ngắn người lớn/trẻ em.",
    situation:"Bạn xem ảnh gia đình của một người bạn.",
    dialogue:"A：照片里的小孩儿是谁？\nB：男孩儿是我弟弟，女孩儿是我妹妹。\nA：旁边两位呢？\nB：是我爷爷和奶奶。后面是姐姐和她的丈夫。",
    reading:"李老师和妻子有两个孩子，一个男孩儿，一个女孩儿。爷爷奶奶住得很近，经常来帮忙。周末一家人一起吃饭，小孩儿给大家讲学校里的事情。",
    readingQ:["Gia đình thầy Lý có mấy con?","Ông bà giúp vào khi nào/thế nào?"], readingA:[["Hai con.","两个孩子"],["Họ ở gần và thường đến giúp.","住得很近，经常来帮忙"]],
    listening:"照片左边是王女士和她的丈夫，右边是爷爷奶奶。前面的男孩儿八岁，女孩儿六岁。",
    listeningQ:["Vợ chồng cô Vương ở phía nào?","Bé gái mấy tuổi?"], listeningA:["Bên trái.","6 tuổi."] ,
    pronunciation:"Luyện qīzi/zhàngfu và nǎinai/yéye; đọc háir trong 孩儿 liền âm.",
    speaking:"Giới thiệu 4–6 người trong một gia đình giả, nêu quan hệ và một đặc điểm mỗi người.",
    writing:"Viết 5–7 câu (khoảng 60–80 chữ Hán) mô tả ảnh gia đình, dùng vị trí và quan hệ.", realTask:"Tạo cây gia đình hư cấu bằng tên Trung để luyện, không cần dùng dữ liệu thật.",
    grammarPractice:"Dùng 位 thay 个 khi giới thiệu lịch sự hai người lớn.", errorPair:["那两个老师是我爷爷奶奶。","那两位是我的爷爷和奶奶。"]
  },
  {
    u:8, newRows:[462,325,349,430,437,473,385], reviewWords:["以前","现在","礼物","朋友"],
    zh:"小时候和现在", vi:"Lúc nhỏ và bây giờ", objective:"Kể một ký ức ngắn, nói hoạt động dịp lễ/sinh nhật và cảm xúc.",
    situation:"Bạn kể về một bức ảnh sinh nhật hồi nhỏ.",
    dialogue:"A：这是你小时候吗？\nB：对。我从小就爱笑。那天是我的生日。\nA：爷爷送了你什么？\nB：他送我一个球。我们一起玩得很快乐。",
    reading:"小美小时候住在爷爷奶奶家。每年过年，家人都回来一起吃饭。她十岁生日时，奶奶送她一本画画的书。现在她还留着那本书，看见它就觉得很快乐。",
    readingQ:["Tiểu Mỹ sống với ai lúc nhỏ?","Bà tặng gì vào sinh nhật 10 tuổi?"], readingA:[["Ông bà.","爷爷奶奶家"],["Một quyển sách vẽ.","一本画画的书"]],
    listening:"我从小喜欢足球。十二岁生日时，爸爸送我一个足球。过年的时候，我常跟哥哥一起踢。现在我们还会一起看比赛。",
    listeningQ:["Bố tặng gì?","Hai anh em thường làm gì dịp Tết?"], listeningA:["Một quả bóng đá.","Cùng đá bóng."] ,
    pronunciation:"Phân biệt cóngxiǎo/xiǎoshíhou; luyện kuàilè không đổi thanh sai.",
    speaking:"Kể một ký ức 60–90 giây theo mốc lúc nhỏ–sự kiện–món quà–cảm xúc.",
    writing:"Viết 6–8 câu (khoảng 70–90 chữ Hán) về một sinh nhật hoặc dịp Tết, có trình tự rõ.", realTask:"Chọn một ảnh cũ và ghi chú 5 câu tiếng Trung (có thể dùng ảnh giả).",
    grammarPractice:"Đặt 小时候 ở vị trí đúng trong câu.", errorPair:["我住在河内小时候。","我小时候住在河内。"]
  },
  {
    u:9, newRows:[428,451,359,411,358,463,478], reviewWords:["手机","照片","看","发"],
    zh:"网上分享周末", vi:"Chia sẻ cuối tuần trên mạng", objective:"Đọc/viết tin nhắn ngắn về hoạt động, ảnh và cảm nhận.",
    situation:"Bạn trả lời bài đăng của bạn về một ngày đi bơi và vẽ tranh.",
    dialogue:"A：你在网上发的照片真好看。\nB：谢谢。上午我去游泳，下午画了花和鸟。\nA：那只鸟很有意思，看了就想笑。\nB：下次一起去吧。",
    reading:"周末小安没有一直上网。上午他去游泳，下午在公园画画。他画了两朵花和一只鸟。晚上他把画放到网上，朋友们看了都笑着说：“这只鸟很快乐。”",
    readingQ:["Buổi chiều Tiểu An làm gì?","Bạn bè phản ứng thế nào?"], readingA:[["Vẽ ở công viên.","在公园画画"],["Cười và bình luận con chim vui vẻ.","笑着说"]],
    listening:"我今天在网上看见一个游泳活动。星期日上午九点开始，地点在学校旁边。参加的人请带水，不用带票。",
    listeningQ:["Hoạt động bắt đầu khi nào?","Có cần mang vé không?"], listeningA:["9 giờ sáng Chủ nhật.","Không."] ,
    pronunciation:"Phân biệt huā (花) và huà (画), yóu/yóuyǒng; luyện shàngwǎng.",
    speaking:"Mô tả một bài đăng: ảnh gì, hoạt động gì, cảm xúc và lời mời phản hồi.",
    writing:"Viết 5–7 câu (khoảng 60–80 chữ Hán) về cuối tuần và một bình luận trả lời.", realTask:"Soạn một caption tiếng Trung cho ảnh không nhạy cảm, chưa cần đăng thật.",
    grammarPractice:"Dùng 着 để mô tả trạng thái/cách người trong ảnh đang cười.", errorPair:["她正在笑着了。","她笑着看照片。"]
  },
  {
    u:9, newRows:[309,498,438,330,476,439,352], reviewWords:["贵","便宜","好看","喜欢"],
    zh:"哪一个更合适", vi:"Lựa chọn nào phù hợp hơn", objective:"So sánh hai lựa chọn, nêu mức cao nhất và giải thích nguyên nhân–nhượng bộ.",
    situation:"Bạn chọn phương tiện và khách sạn cho chuyến đi.",
    dialogue:"A：坐地铁还是打车？\nB：地铁比打车便宜，但是要走十分钟。\nA：虽然有点儿远，我还是坐地铁。\nB：好，因为周末路上车多，所以地铁可能最快。",
    reading:"小李看了三家酒店。第一家最近，但是最贵；第二家比第一家远一点儿，房间最好看；第三家最便宜，但离地铁站很远。因为他要早起去机场，所以最后选择了第一家。",
    readingQ:["Khách sạn nào đẹp nhất?","Vì sao Tiểu Lý chọn khách sạn đầu?"], readingA:[["Khách sạn thứ hai.","第二家比第一家远一点儿，房间最好看"],["Vì cần dậy sớm đi sân bay và nó gần nhất.","要早起去机场"]],
    listening:"虽然公交车最便宜，但是要一个小时。地铁比公交车快，打车最快但最贵。因为我拿着两个大包，所以我还是打车。",
    listeningQ:["Phương tiện nào rẻ nhất?","Người nói chọn gì?"], listeningA:["Xe buýt.","Taxi."] ,
    pronunciation:"Luyện bǐ, zuì, suīrán, suǒyǐ; không đọc 还是 thành háishì.",
    speaking:"So sánh ba lựa chọn thật theo ba tiêu chí và bảo vệ lựa chọn cuối.",
    writing:"Viết 6–8 câu (khoảng 70–90 chữ Hán) so sánh hai sản phẩm/dịch vụ và kết luận có lý do.", realTask:"So sánh hai tuyến đi làm thật bằng tiếng Trung.",
    grammarPractice:"Sửa câu so sánh có 很 và thêm phạm vi cho 最.", errorPair:["这个比那个很好。","这个比那个好。"]
  },
  {
    u:9, newRows:[311,389,334,336,407,489,488,327], reviewWords:["电话","这里","那里","请"],
    zh:"电话里说清位置", vi:"Nói rõ vị trí qua điện thoại", objective:"Hỏi lý do, yêu cầu chờ, mô tả khoảng cách và chỉ cách thao tác qua điện thoại.",
    situation:"Bạn gọi cho nhân viên giao hàng đang đứng sai cửa.",
    dialogue:"A：你好，我到了，但是没看见你。\nB：你是不是站在那个红色门口？我的楼不在那里。\nA：那我怎么走？\nB：别再那样往前走了，等我一会儿。我给你打电话告诉你。",
    reading:"送东西的人到了小区，却站错了楼。小王在电话里说：“别往前走，那样会更远。你先等一会儿，看见红色的门以后给我打电话。”送东西的人照他说的做，很快找到了。",
    readingQ:["Người giao hàng sai điều gì?","Tiểu Vương bảo nhìn cửa màu gì?"], readingA:[["Đứng nhầm tòa nhà/cửa.","站错了楼"],["Cửa đỏ.","红色的门"]],
    listening:"您好，饭馆离地铁站很近。出站以后别往右走，请往左走。看见白色商场时给我打电话，我在门口等您。",
    listeningQ:["Ra ga thì đi hướng nào?","Khi thấy gì thì gọi điện?"], listeningA:["Sang trái.","Trung tâm thương mại màu trắng."] ,
    pronunciation:"Phân biệt zhème/zhèyàng/nàyàng và bié/děng; luyện dǎ diànhuà theo cụm.",
    speaking:"Role-play cuộc gọi 60 giây để sửa vị trí sai mà không dùng cử chỉ.",
    writing:"Viết tin nhắn chỉ đường 6 bước, có một cảnh báo với 别.", realTask:"Mô tả qua điện thoại đường từ cổng đến chỗ ngồi thật.",
    grammarPractice:"Tạo câu hỏi lựa chọn với 还是 và không thêm 吗.", errorPair:["你往左还是右吗？","你往左还是往右？"]
  },
  {
    u:10, newRows:[316,318,425,427,458,460,495,496], reviewWords:["来","去","楼上","楼下"],
    zh:"上下楼和进出", vi:"Lên xuống và ra vào", objective:"Dùng chuỗi bổ ngữ xu hướng để kể/điều khiển chuyển động trong không gian.",
    situation:"Bạn hướng dẫn nhóm mang đồ giữa các tầng.",
    dialogue:"A：东西在楼上，你能走上去拿吗？\nB：可以。拿到以后怎么做？\nA：把小包拿下来，大包拿不动就别动。\nB：好，我先上去，再走下来。",
    reading:"活动开始前，大家把桌子从房间里拿出来，再搬到楼下。小李先走上去开门，小王把东西拿下来。做完以后，两个人一起走出去休息。",
    readingQ:["Đồ được chuyển từ đâu xuống đâu?","Ai lên mở cửa trước?"], readingA:[["Từ phòng xuống tầng dưới.","从房间里拿出来，再搬到楼下"],["Tiểu Lý.","小李先走上去开门"]],
    listening:"请大家从右边的门进来，上二楼以后往左走。活动结束时，请从前面的门出去，不要下楼找后门。",
    listeningQ:["Vào bằng cửa nào?","Kết thúc thì ra bằng cửa nào?"], listeningA:["Cửa bên phải.","Cửa phía trước."] ,
    pronunciation:"Luyện cặp shànglái/shàngqù, xiàlái/xiàqù; giữ âm đầu ch trong chūlái.",
    speaking:"Dùng mô hình tòa nhà, đưa sáu chỉ dẫn lên/xuống/ra/vào theo điểm nhìn.",
    writing:"Viết quy trình 8 bước di chuyển đồ trong hai tầng, dùng 来/去 nhất quán.", realTask:"Chỉ dẫn một đường đi có cầu thang hoặc thang máy bằng tiếng Trung.",
    grammarPractice:"Chọn 下来 hay 下去 khi người nói đang đứng dưới tầng.", errorPair:["我在楼下，你下去吧。","我在楼下，你下来吧。"]
  },
  {
    u:10, newRows:[347,351], reviewWords:["去","看","吃","以后","以前","计划"],
    zh:"我有过这样的经历", vi:"Tôi từng có trải nghiệm như vậy", objective:"Kể trải nghiệm đã từng có, phân biệt 过 ‘đi qua’ và trợ từ 过, rồi lập kế hoạch tiếp theo.",
    situation:"Bạn trao đổi về chuyến đi từng có và chọn trải nghiệm muốn thử lần tới.",
    dialogue:"A：你去过中国吗？\nB：去过。去年我去上海旅游，还坐船过了河。\nA：你吃过当地的鱼吗？\nB：吃过，很好吃。下次我想去北京。",
    reading:"小安以前没出过国，今年第一次去中国。他去过北京和上海，也坐地铁过了很多站。旅行结束后，他写下最喜欢的三件事情，并准备明年跟家人再去一次。",
    readingQ:["Đây có phải lần đầu Tiểu An ra nước ngoài không?","Cậu ấy chuẩn bị làm gì năm sau?"], readingA:[["Có.","以前没出过国"],["Đi lại cùng gia đình.","跟家人再去一次"]],
    listening:"我去过两次广州。第一次坐飞机，第二次坐火车。每次都要过一条很长的河。我还没去过成都，希望明年去。",
    listeningQ:["Người nói đã đến Quảng Châu mấy lần?","Nơi nào chưa từng đến?"], listeningA:["Hai lần.","Thành Đô."] ,
    pronunciation:"Phân biệt guò (động từ, thanh 4) với guo (trợ từ, thanh nhẹ) trong câu liền mạch.",
    speaking:"Kể một trải nghiệm 90 giây: đã từng/chưa từng, thời gian, việc nổi bật, cảm nhận, kế hoạch lần tới.",
    writing:"Viết 6–8 câu (khoảng 70–100 chữ Hán) về một trải nghiệm gần đây và kế hoạch tiếp theo.", realTask:"Phỏng vấn một người bằng 你…过吗？ rồi tóm tắt câu trả lời.",
    grammarPractice:"Phân biệt hai 过 trong 我去过北京，也过了那条河.", errorPair:["我不去过北京。","我没去过北京。"]
  }
];

const SOURCE_IDS = [
  "moe-gf0025-2021-standard",
  "cti-hsk3-current-syllabus-2026",
  "cti-hsk3-competency-profile-2026",
  "blcu-new-standard-pedagogy-2025",
  "vduckie-hsk2-c3-original"
];
const OFFICIAL_SOURCE_IDS = SOURCE_IDS.slice(0, 3);
const SCHEMA_VERSION = "GF0025-2021";
const EXAM_VERSION = "CTI-HSK3.0-2026";
const REVIEW_METADATA = Object.freeze({
  reviewStage: 3,
  reviewReason: "Phase C3 machine-assisted lesson-by-lesson editorial pass; independent Vietnamese and Chinese pedagogy sign-off remains required.",
  firstIntroducedIn: "phase-c3",
  lastEditorialPass: "phase-c3",
  humanSignoffRequired: true
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function splitChineseSentences(value) {
  return String(value || "")
    .split(/[。！？\n]/)
    .map((item) => item.replace(/^[A-ZＡ-Ｚ老师学生小王小李小安小美医生店员经理同事妈妈爸爸爷爷奶奶：:]+(?=你|我|他|她|请|好|现|今|明|周|这|那|先|别|可|没|要|因|虽|上|下|从|离|往|坐|去|来|给|把|有|在|看|听|说|吃|喝|买|穿|用|等|走|开|关|做|想|喜|需|应|会|能)/, "").trim())
    .filter(Boolean);
}

const MEASURE_WORDS = Object.freeze({
  杯:"杯", 班:"个", 报纸:"份", 本子:"本", 笔:"支", 宾馆:"家/个", 菜:"道/盘", 层:"层", 车站:"个", 船:"条/艘", 次:"次", 词:"个", 大家:"—", 弟弟:"个/位", 房间:"间", 公共汽车:"辆", 公司:"家", 孩子:"个", 河:"条", 花:"朵", 机场:"个", 机票:"张", 件:"件", 教室:"间", 姐姐:"个/位", 酒店:"家", 考试:"场/次", 课:"节", 路:"条", 旅游:"次", 妹妹:"个/位", 门:"扇", 面包:"个/片", 男:"个/位", 男孩儿:"个", 鸟:"只", 女孩儿:"个", 票:"张", 妻子:"个/位", 铅笔:"支", 身体:"—", 事情:"件", 手表:"块/只", 手机:"部/台", 题:"道", 先生:"位", 小孩儿:"个", 小时:"个", 新闻:"条", 姓:"个", 眼睛:"双/只", 药:"种/片", 游泳:"次", 鱼:"条", 运动:"项", 丈夫:"个/位", 自行车:"辆"
});

const CONFUSABLES = Object.freeze({
  帮:["帮助"], 别:["不要"], 长:["常"], 出:["出来/出去"], 次:["遍"], 从:["离"], 错:["坏"], 得:["地/的"], 地:["得/的"], 点:["点儿"], 懂:["知道"], 对:["错"], 非常:["很"], 过:["过 (trợ từ)/过 (động từ)"], 还:["又/再"], 还是:["或者"], 花:["花 (bông hoa)/花 (tiêu tiền)"], 回答:["问"], 记得:["记住"], 近:["远"], 就:["才"], 快:["快要"], 快要:["快"], 离:["从"], 每:["常常"], 那么:["这样/那样"], 女:["女生/女人"], 起来:["出来/上来"], 让:["请/叫"], 虽然:["但是"], 往:["向"], 为什么:["怎么"], 一会儿:["一点儿"], 已经:["正在"], 因为:["所以"], 又:["再"], 着:["正在"], 最:["更/比较"]
});

const USAGE_NOTES = Object.freeze({
  比:"Đặt đối tượng so sánh sau 比; tính từ thường không đi cùng 很 trong mẫu cơ bản.",
  别:"Mệnh lệnh phủ định thân mật/lịch sự tùy ngữ điệu; không thay cho mọi trường hợp 不.",
  次:"Đếm số lần của sự kiện; 遍 nhấn mạnh làm trọn từ đầu đến cuối.",
  得:"Đọc de khi nối động từ với bổ ngữ mức độ: 说得很快.",
  地:"Đọc de khi nối trạng thái/cách thức với động từ: 慢慢地说.",
  点:"Mục từ này chỉ giờ đúng hoặc ‘điểm’, không tự động đồng nghĩa với 点儿.",
  过:"Phân biệt động từ guò ‘đi qua’ với trợ từ guo chỉ trải nghiệm.",
  还是:"Dùng trong câu hỏi lựa chọn; câu trần thuật thường dùng 或者.",
  花:"Có hai mục từ đồng hình: ‘hoa’ và ‘tiêu (thời gian/tiền)’; dựa vào từ loại và ngữ cảnh.",
  记得:"Diễn tả còn nhớ hoặc nhớ phải làm; 记住 nhấn vào việc ghi nhớ được.",
  就:"Thường biểu thị sớm, nhanh, liền hoặc kết quả theo điều kiện; hiểu theo quan hệ trong câu.",
  快要:"Báo hiệu sự việc sắp xảy ra; thường đi với 了 ở cuối câu.",
  离:"Dùng để nói khoảng cách giữa hai địa điểm: A 离 B + 远/近.",
  每:"Mỗi… thường phối hợp với 都 khi khái quát thói quen.",
  那么:"Chỉ mức độ/cách thức hoặc nối phản hồi; không phải lượng từ.",
  起来:"Bổ ngữ xu hướng ‘đứng/dậy lên’ hoặc bắt đầu trạng thái; bài này chỉ dùng nghĩa đã nêu trong ngữ cảnh.",
  让:"Có thể là ‘để/cho phép’ hoặc khiến/bảo ai làm gì; chủ thể hành động sau 让 phải rõ.",
  虽然:"Mở mệnh đề nhượng bộ; vế sau thường có 但是/可是 nhưng không dịch từng chữ cứng nhắc.",
  条:"Lượng từ cho vật dài/mềm và một số danh từ như 路、河、鱼、新闻.",
  往:"Giới thiệu hướng di chuyển: 往 + phương hướng + động từ.",
  为什么:"Hỏi nguyên nhân; câu trả lời tự nhiên thường dùng 因为, không dùng để hỏi cách làm.",
  一会儿:"Một khoảng thời gian ngắn; không đồng nghĩa với 一点儿 chỉ lượng/mức độ nhỏ.",
  已经:"Đánh dấu trạng thái đã đạt trước mốc nói; thường phối hợp với 了.",
  因为:"Đưa nguyên nhân; có thể kết hợp 所以 ở vế kết quả.",
  着:"Đọc zhe, đánh dấu trạng thái đang duy trì; khác 正在 nhấn hành động đang diễn ra.",
  最:"So sánh cao nhất trong một phạm vi ngầm hoặc được nêu; không dùng 比 cùng một vị trí.",
  又:"Chỉ sự lặp lại đã xảy ra hoặc hai đặc điểm cùng tồn tại; việc tương lai thường dùng 再.",
  再:"Chỉ hành động sẽ lặp lại/sau đó; sự lặp đã xảy ra thường dùng 又.",
  才:"Nhấn muộn, ít hoặc điều kiện mới đạt; đối chiếu 就 để hiểu sắc thái thời điểm."
});

function measureWordFor(word) {
  if (word.row === 357) return null;
  if (word.row === 358) return "朵";
  return MEASURE_WORDS[word.simplified] || null;
}

function defaultUsageNote(word, example, measureWord) {
  if (measureWord && measureWord !== "—") return `Khi đếm “${word.simplified}”, chọn lượng từ theo ngữ cảnh (${measureWord}); không ghép số trực tiếp với danh từ.`;
  if (word.partOfSpeech.includes("formula")) return `Dùng “${word.simplified}” như một cụm hoàn chỉnh trong tình huống tương tự “${example.zh}”, không tách để dịch từng chữ.`;
  if (word.partOfSpeech.includes("particle")) return `Vị trí và ngữ điệu quyết định chức năng của “${word.simplified}”; nghe cả câu “${example.zh}” trước khi bắt chước.`;
  if (word.partOfSpeech.includes("adverb")) return `Đặt “${word.simplified}” trước thành phần mà nó bổ nghĩa; lấy trật tự trong “${example.zh}” làm mẫu.`;
  if (word.partOfSpeech.includes("adjective")) return `Quan sát “${word.simplified}” đang làm vị ngữ hay bổ nghĩa cho danh từ trong “${example.zh}”; không tự thêm 是.`;
  if (word.partOfSpeech.includes("verb") && word.partOfSpeech.includes("noun")) return `“${word.simplified}” có thể làm động từ hoặc danh từ; xác định vai trò qua vị trí của nó trong câu “${example.zh}”.`;
  if (word.partOfSpeech.includes("verb")) return `Học “${word.simplified}” cùng tân ngữ hoặc bổ ngữ trong mẫu “${example.zh}”; không bê nguyên trật tự tiếng Việt.`;
  return `Học “${word.simplified}” trong cụm hoàn chỉnh “${example.zh}”, rồi thay thông tin cùng loại để tạo câu mới.`;
}

function defaultVocabularyError(word, example, confusables, measureWord) {
  if (confusables.length) return `Dễ lẫn “${word.simplified}” với ${confusables.join(" / ")}; kiểm tra nghĩa và vị trí trong mẫu “${example.zh}”.`;
  if (measureWord && measureWord !== "—") return `Khi có số lượng, đừng bỏ lượng từ trước “${word.simplified}”; mẫu phù hợp dùng ${measureWord}.`;
  if (word.partOfSpeech.includes("formula")) return `Không tách hoặc đổi trật tự các tiếng trong cụm cố định “${word.simplified}”; dùng cả cụm theo ngữ cảnh.`;
  if (word.partOfSpeech.includes("particle")) return `Không dịch “${word.simplified}” thành một từ Việt cố định; ngữ điệu và vị trí trong câu mới quyết định sắc thái.`;
  if (word.partOfSpeech.includes("adjective")) return `Không chèn 是 trước “${word.simplified}” chỉ vì tiếng Việt dùng “là”; kiểm tra mẫu “${example.zh}”.`;
  if (word.partOfSpeech.includes("adverb")) return `Không đặt “${word.simplified}” sau động từ theo trật tự tiếng Việt; đối chiếu vị trí trong “${example.zh}”.`;
  if (word.partOfSpeech.includes("verb")) return `Không thêm 是 trước động từ “${word.simplified}”; giữ cụm động từ theo mẫu “${example.zh}”.`;
  return `Không học “${word.simplified}” như bản dịch rời; phải đặt vào một cụm cùng loại với “${example.zh}”.`;
}

function makeVocabulary() {
  const examples = parseExamples();
  const records = parseVocabularyFacts().map((word, index) => {
    const example = examples[index];
    const notes = PEDAGOGY_NOTES[word.row] || {};
    const confusables = CONFUSABLES[word.simplified] || notes.confusables || [];
    const measureWord = measureWordFor(word);
    const errors = [notes.error || defaultVocabularyError(word, example, confusables, measureWord)];
    return {
      recordType:"vocabulary", id:word.id, syllabusVersion:SCHEMA_VERSION, hskLevel:2,
      level:2, pedagogicTargetLevel:2, simplified:word.simplified,
      officialHeadword:word.officialHeadword, officialRow:word.row, senseKey:word.senseKey,
      pinyin:word.pinyin, pinyinTone:word.pinyin, pinyinNumber:pinyinNumber(word.pinyin),
      pinyinNormalized:word.pinyin.normalize("NFD").replace(/u\u0308/g,"v").replace(/\p{M}/gu,"").replace(/ü/g,"v").replace(/[^a-zv]/gi,"").toLowerCase(), partOfSpeech:word.partOfSpeech,
      meaningVi:word.meaningVi, contextMeaningsVi:[{context:example.zh,meaningVi:word.meaningVi}],
      measureWord,
      collocations:[{ zh:example.zh.replace(/[。！？]$/, ""), vi:example.vi, kind:"sentence-pattern" }],
      usageNoteVi:USAGE_NOTES[word.simplified] || notes.usage || defaultUsageNote(word, example, measureWord),
      examples:[{ zh:example.zh, vi:example.vi, sourceType:"original" }],
      synonyms:[], antonyms:[], confusables, commonErrorsVi:errors,
      sourceIds:SOURCE_IDS, sourceRefs:[{sourceId:"cti-hsk3-current-syllabus-2026", fields:["officialHeadword","pinyinTone","hskLevel"], locator:`official-vocabulary-row-${word.row}`}],
      audioRef:null, contentStatus:"machine-assisted", translationReviewStatus:"machine-assisted",
      reviewStatus:"unreviewed", knowledgeStatus:"new", contentVersion:1
    };
  });
  assert(records.length === 200, `HSK2 vocabulary phải có 200 từ mới, nhận ${records.length}.`);
  assert(new Set(records.map((item) => item.id)).size === 200, "Trùng vocabulary ID.");
  assert(records.every((item) => item.examples[0].zh.includes(item.simplified)), "Có ví dụ không chứa đúng target.");
  return records;
}

const CHARACTER_ROWS = `
帮|bāng|巾|邦+巾|邦
班|bān|王|王+刂+王|斑
比|bǐ|比|比|北
别|bié|刂|另+刂|到
长|cháng|长|长|常
出|chū|凵|屮+凵|山
床|chuáng|广|广+木|庆
词|cí|讠|讠+司|问
次|cì|欠|冫+欠|吹
从|cóng|人|人+人|众
错|cuò|钅|钅+昔|借
打|dǎ|扌|扌+丁|订
地|dì|土|土+也|他
等|děng|竹|竹+寺|待
懂|dǒng|忄|忄+董|重
饭|fàn|饣|饣+反|板
高|gāo|高|高|亮
告|gào|口|牛+口|靠
跟|gēn|足|足+艮|很
过|guò|辶|寸+辶|这
红|hóng|纟|纟+工|江
花|huā|艹|艹+化|华
画|huà|田|一+田+凵|由
坏|huài|土|土+不|杯
回|huí|囗|囗+口|国
机|jī|木|木+几|饥
记|jì|讠|讠+己|纪
间|jiān|门|门+日|问
教|jiāo|攵|孝+攵|数
进|jìn|辶|井+辶|近
近|jìn|辶|斤+辶|进
考|kǎo|耂|耂+丂|老
快|kuài|忄|忄+夬|块
乐|lè|丿|乐|东
离|lí|亠|亠+凶+禸|璃
楼|lóu|木|木+娄|数
路|lù|足|足+各|露
旅|lǚ|方|方+𠂉+氏|族
绿|lǜ|纟|纟+录|录
门|mén|门|门|问
拿|ná|手|合+手|盒
跑|pǎo|足|足+包|抱
晴|qíng|日|日+青|情
让|ràng|讠|讠+上|认
商|shāng|口|亠+丷+冏|摘
身|shēn|身|身|射
事|shì|亅|事|亊
送|sòng|辶|关+辶|运
虽|suī|虫|口+虫|强
疼|téng|疒|疒+冬|痛
踢|tī|足|足+易|提
跳|tiào|足|足+兆|桃
外|wài|夕|夕+卜|处
往|wǎng|彳|彳+主|住
洗|xǐ|氵|氵+先|选
药|yào|艹|艹+约|约
阴|yīn|阝|阝+月|阳
运|yùn|辶|云+辶|远
站|zhàn|立|立+占|战
准|zhǔn|冫|冫+隹|谁
`.trim().split("\n").map((line) => line.split("|"));

const MANUAL_STROKE_COUNTS = Object.freeze({
  班:10, 别:7, 长:4, 词:7, 次:6, 从:4, 错:13, 打:5, 等:12, 懂:15,
  跟:13, 红:6, 花:7, 画:8, 坏:7, 回:6, 机:6, 记:5, 间:7, 教:11,
  考:6, 乐:5, 楼:13, 路:13, 绿:11, 门:3, 拿:10, 跑:12, 晴:12, 让:5,
  商:11, 事:8, 送:9, 疼:10, 踢:15, 跳:13, 外:5, 洗:9, 阴:6, 站:10
});

function strokeCounts() {
  const vm = require("vm");
  const code = fs.readFileSync(path.join(ROOT, "vendor/hsk-char-data.js"), "utf8");
  const context = { window:{} };
  vm.runInNewContext(code, context);
  const data = context.window.HSK_HANZI_DATA || {};
  return Object.fromEntries(Object.entries(data).map(([character, record]) => [character, record && Array.isArray(record.strokes) ? record.strokes.length : null]));
}

function makeCharacters(vocabulary) {
  assert(CHARACTER_ROWS.length === 60, `Cần đúng 60 chữ HSK2, nhận ${CHARACTER_ROWS.length}.`);
  const counts = strokeCounts();
  return CHARACTER_ROWS.map(([character, reading, radical, components, confusable], index) => {
    const strokeCount = counts[character] || MANUAL_STROKE_COUNTS[character];
    assert(strokeCount, `Thiếu dữ liệu số nét tĩnh cho chữ ${character}.`);
    return {
      recordType:"character", id:`hsk2-character-${pad(index + 1, 3)}`, syllabusVersion:SCHEMA_VERSION,
      hskLevel:2, character, recognitionRequired:true, writingRequired:true, radical,
      structure:components.includes("+") ? "compound" : "single-component",
      components:components.includes("+") ? components.split("+") : [], readings:[reading],
      strokeCount, strokeCountSource:counts[character] ? "bundled-static-vector-count" : "machine-cross-checked-static-count",
      wordRefs:vocabulary.filter((word) => word.simplified.includes(character)).map((word) => word.id),
      confusables:confusable ? [confusable] : [],
      mnemonic:{ type:"memory-aid-not-etymology", noteVi:components.includes("+") ? `Mẹo nhận dạng: nhìn ${character} theo các phần ${components}; đây chỉ là mẹo nhớ, không phải giải thích từ nguyên.` : `Mẹo nhận dạng: ghi nhớ hình khối tổng thể của ${character} rồi đối chiếu chữ ${confusable}; đây chỉ là mẹo nhớ, không phải giải thích từ nguyên.` },
      strokeOrderStatus:"static-fallback", strokeOrderAsset:null,
      sourceIds:["moe-gf0025-2021-standard","cti-hsk3-current-syllabus-2026","unicode-unihan-17"],
      contentStatus:"machine-assisted", reviewStatus:"unreviewed", knowledgeStatus:"new", contentVersion:1
    };
  });
}

function makeGrammar() {
  assert(grammarDefinitions.length === 29, `Cần đúng 29 điểm ngữ pháp, nhận ${grammarDefinitions.length}.`);
  const rewrites = {
    "啊，我明白了。":{zh:"啊，现在我明白了。",vi:"À, bây giờ tôi hiểu rồi."},
    "火车快要到了。":{zh:"我们的火车快要到了。",vi:"Tàu của chúng tôi sắp đến rồi."},
    "她高兴地笑了。":{zh:"听到这个好消息，她高兴地笑了。",vi:"Nghe tin vui này, cô ấy vui vẻ cười."},
    "我让他帮我。":{zh:"我让弟弟来帮我。",vi:"Tôi nhờ em trai đến giúp."},
    "妈妈不让我喝咖啡。":{zh:"妈妈今天不让我喝咖啡。",vi:"Hôm nay mẹ không cho tôi uống cà phê."},
    "虽然下雨，但是我们还是去了。":{zh:"虽然外面下雨，但是我们还是去商场了。",vi:"Dù ngoài trời mưa, chúng tôi vẫn đi trung tâm thương mại."},
    "虽然下雨，他还是来了。":{zh:"虽然下雨，他还是来我家了。",vi:"Tuy trời mưa, anh ấy vẫn đến nhà tôi."},
    "她笑着说。":{zh:"她看着照片，笑着说：‘真好看。’",vi:"Cô ấy nhìn ảnh, cười và nói: ‘Đẹp thật.’"},
    "他穿着黑色的裤子。":{zh:"今天他穿着一条黑色的裤子。",vi:"Hôm nay anh ấy mặc một chiếc quần màu đen."},
    "你坐地铁还是公交车？":{zh:"明天你坐地铁还是公共汽车？",vi:"Ngày mai bạn đi tàu điện ngầm hay xe buýt?"},
    "你喝茶还是咖啡？":{zh:"你下午喝茶还是喝咖啡？",vi:"Buổi chiều bạn uống trà hay cà phê?"},
    "你为什么迟到？":{zh:"你今天为什么迟到？",vi:"Hôm nay vì sao bạn đến muộn?"},
    "你为什么学汉语？":{zh:"你现在为什么学汉语？",vi:"Bây giờ vì sao bạn học tiếng Trung?"},
    "请把书拿下来。":{zh:"请把楼上的书拿下来。",vi:"Hãy mang quyển sách trên lầu xuống đây."},
    "请从楼上下来。":{zh:"请你从三楼下来。",vi:"Hãy từ tầng ba xuống đây."},
    "我去过北京。":{zh:"我以前跟家人去过北京。",vi:"Trước đây tôi từng đến Bắc Kinh cùng gia đình."}
  };
  return grammarDefinitions.map((grammar, index) => {
    const lessonIndex = index <= 25 ? index : index === 26 ? 25 : index === 27 ? 26 : 27;
    const correctExamples = (Array.isArray(grammar.correct) ? grammar.correct : [grammar.correct]).map((example) => Array.isArray(example) ? {zh:example[0],vi:example[1]} : example).map((example)=>rewrites[example.zh]||example);
    const incorrectPair = index===26 ? ["你为什么迟到了吗？","你今天为什么迟到？"] : lessonDefinitions[lessonIndex].errorPair;
    return ({
    recordType:"grammar", id:`hsk2-grammar-${pad(index + 1, 2)}`, syllabusVersion:SCHEMA_VERSION,
    hskLevel:2, nameZh:grammar.nameZh, nameVi:grammar.nameVi, formula:grammar.formula,
    communicativeFunctionVi:grammar.meaningVi, meaningVi:grammar.meaningVi,
    usageVi:Array.isArray(grammar.usageVi) ? grammar.usageVi : [grammar.usageVi],
    positionVi:grammar.positionVi || "Vị trí được thể hiện trong công thức và câu mẫu.",
    correctExamples,
    incorrectExamples:[{zh:incorrectPair[0],explanationVi:`Sửa thành “${incorrectPair[1]}”. ${Array.isArray(grammar.incorrect)?grammar.incorrect.join(" "):grammar.incorrect}`}],
    commonErrorsVi:[grammar.errorVi || "Không sao chép trật tự từ tiếng Việt; đối chiếu công thức và ngữ cảnh."],
    confusables:Array.isArray(grammar.confusables) ? grammar.confusables : [],
    negativeQuestionVi:grammar.negativeQuestionVi || "Phủ định/nghi vấn được luyện trong bài áp dụng; chỉ dùng khi phù hợp với chức năng này.",
    introducedLevel:2, reviewLevels:[3,4], knowledgeStatus:grammar.status || "new",
    sourceIds:SOURCE_IDS, contentStatus:"machine-assisted", translationReviewStatus:"machine-assisted",
    reviewStatus:"unreviewed", contentVersion:1
  });
  });
}

function characterRefsForLesson(characters, lesson, lessonIndex) {
  const focusChars = unique(lesson.newRows.flatMap((row) => {
    const word = parseVocabularyFacts()[row - 301];
    return [...word.simplified];
  }));
  const matched = characters.filter((record) => focusChars.includes(record.character)).map((record) => record.id);
  const distributed = [lessonIndex, lessonIndex + 28, lessonIndex + 56]
    .map((characterIndex) => characters[characterIndex % characters.length].id);
  return unique(distributed.concat(matched)).slice(0, 6);
}

function buildExerciseBase(lesson, lessonIndex, exerciseIndex, grammarIds, vocabularyRefs) {
  return {
    recordType:"exercise", id:`hsk2-lesson-${pad(lessonIndex + 1, 2)}-exercise-${exerciseIndex + 1}`,
    syllabusVersion:SCHEMA_VERSION, hskLevel:2, difficulty:1 + ((lessonIndex + exerciseIndex) % 3),
    topic:unitDefinitions[lesson.u - 1][1], grammarFocus:grammarIds, vocabularyFocus:vocabularyRefs,
    sourceIds:SOURCE_IDS, contentStatus:"machine-assisted", translationReviewStatus:"machine-assisted",
    reviewStatus:"unreviewed", contentVersion:1,
    reviewMetadata:{ firstIntroducedIn:`hsk2-lesson-${pad(lessonIndex + 1, 2)}`, reviewStage:3, reviewReason:REVIEW_METADATA.reviewReason, previousExerciseId:null }
  };
}

function segmentChinese(value) {
  const segmenter = new Intl.Segmenter("zh", { granularity:"word" });
  return [...segmenter.segment(String(value || ""))]
    .map((item) => item.segment.trim())
    .filter((item) => item && !/^[，。！？、；：“”‘’（）《》…]+$/.test(item));
}

function rotate(values, amount = 1) {
  if (values.length < 2) return [...values];
  const offset = amount % values.length;
  return values.slice(offset).concat(values.slice(0, offset));
}

function inferSpeakingFormat(prompt) {
  if (/điện thoại|cuộc gọi|gọi điện/i.test(prompt)) return "phone-role-play";
  if (/role-play|đóng vai|hỏi đáp/i.test(prompt)) return "role-play";
  if (/kể|tóm tắt|thuật lại/i.test(prompt)) return "oral-retell";
  if (/so sánh/i.test(prompt)) return "comparison-presentation";
  if (/mô tả|ảnh|tòa nhà|bài đăng/i.test(prompt)) return "guided-description";
  if (/giới thiệu|trình bày/i.test(prompt)) return "mini-presentation";
  return "situational-speaking";
}

function inferWritingFormat(prompt) {
  if (/tin nhắn|lời nhắn|đoạn chat/i.test(prompt)) return "message-writing";
  if (/thông báo|bản tin/i.test(prompt)) return "notice-writing";
  if (/hướng dẫn|quy trình|bước|chỉ đường/i.test(prompt)) return "practical-instructions";
  if (/hồ sơ/i.test(prompt)) return "profile-writing";
  if (/bài đăng|caption|bình luận/i.test(prompt)) return "social-post";
  if (/đơn gọi món/i.test(prompt)) return "order-form";
  if (/checklist|lịch tuần/i.test(prompt)) return "checklist-writing";
  if (/đoạn|câu/i.test(prompt)) return "short-paragraph";
  return "practical-writing";
}

function makeExercisesForLesson(lesson, lessonIndex, vocabularyRecords, grammarIds) {
  const vocabularyRefs = vocabularyRecords.map((record) => record.id);
  const base = (i) => buildExerciseBase(lesson, lessonIndex, i, grammarIds, vocabularyRefs);
  const firstAnswer = lesson.listeningA[0];
  const secondReading = lesson.readingA[1];
  const fixed = lesson.errorPair[1];
  const broken = lesson.errorPair[0];
  const questionVariant = lessonIndex % 4;
  const firstListeningSentence = splitChineseSentences(lesson.listening)[0];
  const listeningFocus = vocabularyRecords.find((record) => lesson.listening.includes(record.simplified));
  const clozeAnswer = listeningFocus ? listeningFocus.simplified : segmentChinese(firstListeningSentence).find((word) => /\p{Script=Han}/u.test(word));
  const clozeZh = clozeAnswer ? lesson.listening.replace(clozeAnswer, "____") : `${lesson.listening} ____`;
  const neighboringAnswers = [
    lesson.listeningA[1],
    lessonDefinitions[(lessonIndex + 1) % lessonDefinitions.length].listeningA[0],
    lessonDefinitions[(lessonIndex + 2) % lessonDefinitions.length].listeningA[1]
  ];
  const listeningOptions = rotate(unique([firstAnswer, ...neighboringAnswers]).slice(0, 3), lessonIndex % 3);
  const sentenceTokens = segmentChinese(fixed);
  const scrambledTokens = rotate(sentenceTokens, Math.max(1, lessonIndex % Math.max(2, sentenceTokens.length)));
  const measureWordTarget = vocabularyRecords.find((record) => record.measureWord && record.measureWord !== "—" && !["丈夫","妻子"].includes(record.simplified));
  const correctMeasureWord = measureWordTarget && measureWordTarget.measureWord.split("/")[0];
  const measureWordOptions = correctMeasureWord
    ? rotate(unique([correctMeasureWord,"个","本","张","条","位"]).slice(0,3), lessonIndex % 3)
    : [];
  const translationTarget = vocabularyRecords[0];
  const speakingFormat = inferSpeakingFormat(lesson.speaking);
  const writingFormat = inferWritingFormat(lesson.writing);

  const listeningExercise = questionVariant === 0
    ? { format:"listen-main-detail", prompt:`Nghe transcript của bài “${lesson.vi}” và trả lời: ${lesson.listeningQ[0]}`, stimulus:{scriptZh:lesson.listening,audioStatus:"script-ready-audio-pending",questionVi:lesson.listeningQ[0]}, options:[], answer:firstAnswer, acceptedAnswers:[firstAnswer], explanationVi:"Đáp án lấy từ đúng chi tiết trong transcript; audio chuẩn còn pending nên transcript và TTS chỉ là phương án học tạm.", cognitiveSkill:"recognition" }
    : questionVariant === 1
      ? { format:"listen-dictation", prompt:`Nghe bài “${lesson.vi}” rồi chép lại nguyên câu đầu tiên. Sau khi hoàn thành, đối chiếu từng chữ và dấu câu với transcript.`, stimulus:{scriptZh:lesson.listening,audioStatus:"script-ready-audio-pending",dictationScope:"first-sentence"}, options:[], answer:firstListeningSentence, acceptedAnswers:[firstListeningSentence,`${firstListeningSentence}。`], explanationVi:`Câu cần chép là “${firstListeningSentence}”. Tập trung vào ranh giới từ, trợ từ và thanh điệu khi shadowing.`, cognitiveSkill:"recall" }
      : questionVariant === 2
        ? { format:"listen-select", prompt:`Nghe và chọn đáp án đúng: ${lesson.listeningQ[0]}`, stimulus:{scriptZh:lesson.listening,audioStatus:"script-ready-audio-pending",questionVi:lesson.listeningQ[0]}, options:listeningOptions, answer:firstAnswer, acceptedAnswers:[firstAnswer], explanationVi:`Chi tiết trong transcript cho thấy đáp án là “${firstAnswer}”; hai lựa chọn còn lại không khớp tình huống.`, cognitiveSkill:"recognition" }
        : { format:"listen-fill", prompt:`Nghe bài “${lesson.vi}” và điền từ còn thiếu vào transcript rút gọn.`, stimulus:{scriptZh:lesson.listening,clozeZh,audioStatus:"script-ready-audio-pending"}, options:[], answer:clozeAnswer, acceptedAnswers:[clozeAnswer], explanationVi:`Từ cần điền là “${clozeAnswer}”; nghe lại cụm chứa từ này rồi shadowing cả câu.`, cognitiveSkill:"recall" };

  const readingExercise = questionVariant === 0
    ? { format:"reading-short-answer", prompt:`Đọc đoạn của bài “${lesson.vi}” rồi trả lời ngắn: ${lesson.readingQ[1]}`, stimulus:{textZh:lesson.reading,questionVi:lesson.readingQ[1],evidenceZh:secondReading[1]}, options:[], answer:secondReading[0], acceptedAnswers:[secondReading[0],secondReading[1]], explanationVi:`Bằng chứng “${secondReading[1]}” hỗ trợ trực tiếp cho đáp án.`, cognitiveSkill:"analysis" }
    : questionVariant === 1
      ? { format:"reading-evidence", prompt:`Đọc rồi chép cụm bằng chứng trả lời câu hỏi: ${lesson.readingQ[1]}`, stimulus:{textZh:lesson.reading,questionVi:lesson.readingQ[1]}, options:[], answer:secondReading[1], acceptedAnswers:[secondReading[1]], explanationVi:`Cụm bằng chứng cần chỉ ra là “${secondReading[1]}”, không chỉ nêu kết luận.`, cognitiveSkill:"analysis" }
      : questionVariant === 2
        ? { format:"reading-detail", prompt:`Đọc và trả lời chi tiết: ${lesson.readingQ[0]}`, stimulus:{textZh:lesson.reading,questionVi:lesson.readingQ[0],evidenceZh:lesson.readingA[0][1]}, options:[], answer:lesson.readingA[0][0], acceptedAnswers:[lesson.readingA[0][0],lesson.readingA[0][1]], explanationVi:`Chi tiết “${lesson.readingA[0][1]}” quyết định đáp án.`, cognitiveSkill:"analysis" }
        : { format:"reading-inference", prompt:`Từ chi tiết “${lesson.readingA[0][1]}”, có thể kết luận gì cho câu hỏi: ${lesson.readingQ[0]}`, stimulus:{textZh:lesson.reading,evidenceZh:lesson.readingA[0][1]}, options:[], answer:lesson.readingA[0][0], acceptedAnswers:[lesson.readingA[0][0]], explanationVi:"Kết luận phải dựa vào chi tiết đã dẫn; không suy đoán thêm thông tin ngoài bài.", cognitiveSkill:"inference" };

  const grammarExercise = questionVariant === 0
    ? { format:"grammar-error-correction", prompt:`Sửa câu chưa tự nhiên theo điểm ngữ pháp của bài: ${broken}`, stimulus:{incorrectZh:broken}, options:[], answer:fixed, acceptedAnswers:[fixed], explanationVi:`Câu phù hợp là “${fixed}”. ${lesson.grammarPractice}`, cognitiveSkill:"analysis" }
    : questionVariant === 1
      ? { format:"sentence-order", prompt:`Sắp xếp các cụm thành câu đúng cho bài “${lesson.vi}”.`, stimulus:{tokens:scrambledTokens}, options:[], answer:fixed, acceptedAnswers:[fixed], explanationVi:`Trật tự đúng là “${fixed}”. Đối chiếu vị trí của thành phần ngữ pháp trọng tâm.`, cognitiveSkill:"application" }
      : questionVariant === 2
        ? { format:"grammar-transformation", prompt:`Biến đổi câu sau thành câu đúng theo cấu trúc của bài: ${broken}`, stimulus:{sourceZh:broken,targetStructureVi:lesson.grammarPractice}, options:[], answer:fixed, acceptedAnswers:[fixed], explanationVi:`Sau khi biến đổi: “${fixed}”. ${lesson.grammarPractice}`, cognitiveSkill:"application" }
        : { format:"dialogue-completion", prompt:`Hoàn thành lượt đáp để sửa ý chưa tự nhiên “${broken}” bằng cấu trúc trọng tâm.`, stimulus:{dialogueContextZh:lesson.dialogue}, options:[], answer:fixed, acceptedAnswers:[fixed], explanationVi:`Một lượt đáp đạt yêu cầu là “${fixed}”.`, cognitiveSkill:"application" };

  let lexisExercise;
  if (questionVariant === 0) {
    const targets = vocabularyRecords.slice(0,3);
    const mappings = targets.map((record) => `${record.simplified} → ${record.examples[0].zh.replace(record.simplified,"____")}`);
    lexisExercise = { skill:"vocabulary", format:"collocation-match", prompt:`Trong bài “${lesson.vi}”, ghép ${targets.map((record)=>record.simplified).join("、")} với mẫu câu có chỗ trống phù hợp.`, stimulus:{words:targets.map((record)=>record.simplified),patterns:rotate(targets.map((record)=>record.examples[0].zh.replace(record.simplified,"____")),1)}, options:[], answer:mappings, acceptedAnswers:[mappings.join(" | ")], explanationVi:"Mỗi đáp án giữ đúng nghĩa và kết hợp từ trong câu mẫu gốc của mục từ.", cognitiveSkill:"application" };
  } else if (questionVariant === 1 && measureWordTarget) {
    lexisExercise = { skill:"vocabulary", format:"measure-word-choice", prompt:`Chọn lượng từ phù hợp để hoàn thành: 一___${measureWordTarget.simplified}`, stimulus:{nounZh:measureWordTarget.simplified}, options:measureWordOptions, answer:correctMeasureWord, acceptedAnswers:[correctMeasureWord], explanationVi:`Lượng từ phù hợp trong ngữ cảnh cơ bản là “${correctMeasureWord}”: 一${correctMeasureWord}${measureWordTarget.simplified}.`, cognitiveSkill:"recognition" };
  } else if (questionVariant === 2) {
    lexisExercise = { skill:"translation", format:"controlled-translation", prompt:`Dịch có kiểm soát sang tiếng Trung: ${translationTarget.examples[0].vi}`, stimulus:{targetWordZh:translationTarget.simplified}, options:[], answer:translationTarget.examples[0].zh, acceptedAnswers:[translationTarget.examples[0].zh], explanationVi:`Câu đích dùng đúng từ “${translationTarget.simplified}”: ${translationTarget.examples[0].zh}`, cognitiveSkill:"application" };
  } else if (questionVariant === 3) {
    lexisExercise = { skill:"speaking", format:"pronunciation-shadowing", prompt:`Shadowing hai lượt và tự đánh dấu âm/thanh cần sửa: ${lesson.pronunciation}`, stimulus:{scriptZh:firstListeningSentence,audioStatus:"script-ready-audio-pending"}, options:[], answer:{rubric:{initialFinals:30,tones:30,rhythm:25,selfCorrection:15}}, acceptedAnswers:["rubric-self-check"], explanationVi:"Tự đối chiếu âm đầu, vận mẫu, thanh điệu và nhịp cụm; bản TTS không thay thế audio đã kiểm duyệt.", cognitiveSkill:"application" };
  } else {
    const targets = vocabularyRecords.slice(0,3);
    const mappings = targets.map((record) => `${record.simplified} → ${record.examples[0].zh.replace(record.simplified,"____")}`);
    lexisExercise = { skill:"vocabulary", format:"collocation-match", prompt:`Trong bài “${lesson.vi}”, ghép ${targets.map((record)=>record.simplified).join("、")} với mẫu câu có chỗ trống phù hợp.`, stimulus:{words:targets.map((record)=>record.simplified),patterns:rotate(targets.map((record)=>record.examples[0].zh.replace(record.simplified,"____")),1)}, options:[], answer:mappings, acceptedAnswers:[mappings.join(" | ")], explanationVi:"Mỗi đáp án giữ đúng nghĩa và kết hợp từ trong câu mẫu gốc của mục từ.", cognitiveSkill:"application" };
  }

  return [
    { ...base(0), skill:"listening", ...listeningExercise, templateFamily:`hsk2-${pad(lessonIndex+1,2)}-listening-${listeningExercise.format}` },
    { ...base(1), skill:"reading", ...readingExercise, templateFamily:`hsk2-${pad(lessonIndex+1,2)}-reading-${readingExercise.format}` },
    { ...base(2), skill:"grammar", ...grammarExercise, templateFamily:`hsk2-${pad(lessonIndex+1,2)}-grammar-${grammarExercise.format}` },
    { ...base(3), ...lexisExercise, templateFamily:`hsk2-${pad(lessonIndex+1,2)}-lexis-${lexisExercise.format}` },
    { ...base(4), skill:"speaking", format:speakingFormat, prompt:lesson.speaking,
      options:[], answer:{rubric:{taskCompletion:35,targetLanguage:30,comprehensibility:25,selfCorrection:10}}, acceptedAnswers:["rubric-self-check"],
      explanationVi:"Hoàn thành mục tiêu giao tiếp quan trọng hơn nói dài; dùng từ/cấu trúc gợi ý, nói rõ và tự sửa khi nhận ra lỗi.", cognitiveSkill:"synthesis", templateFamily:`hsk2-${pad(lessonIndex+1,2)}-speaking-${speakingFormat}` },
    { ...base(5), skill:"writing", format:writingFormat, prompt:lesson.writing,
      options:[], answer:{rubric:{taskCompletion:35,organization:25,targetLanguage:25,legibilityAccuracy:15}}, acceptedAnswers:["rubric-self-check"],
      explanationVi:"Tự kiểm tra đủ thông tin, trình tự câu, từ mục tiêu và dấu câu; không cộng điểm chỉ vì viết vượt độ dài.", cognitiveSkill:"synthesis", templateFamily:`hsk2-${pad(lessonIndex+1,2)}-writing-${writingFormat}` }
  ];
}

function makeLessons(vocabulary, characters, grammar) {
  const exercises = [];
  const lessons = lessonDefinitions.map((lesson, index) => {
    const id = `hsk2-lesson-${pad(index + 1, 2)}`;
    const vocabularyRecords = lesson.newRows.map((row) => vocabulary[row - 301]);
    const vocabularyRefs = vocabularyRecords.map((record) => record.id);
    const grammarIndexes = index === 25 ? [25,26] : index === 26 ? [27] : index === 27 ? [28] : [index];
    const grammarIds = grammarIndexes.map((grammarIndex) => grammar[grammarIndex].id);
    const characterRefs = characterRefsForLesson(characters, lesson, index);
    const lessonExercises = makeExercisesForLesson(lesson, index, vocabularyRecords, grammarIds);
    exercises.push(...lessonExercises);
    const section = (suffix, type, titleVi, content) => ({ id:`${id}-${suffix}`, type, titleVi, content });
    const previousLesson = index > 0 ? `hsk2-lesson-${pad(index, 2)}` : null;
    const orderInUnit = lessonDefinitions.slice(0,index + 1).filter((item)=>item.u===lesson.u).length;
    return {
      recordType:"lesson", id, syllabusVersion:SCHEMA_VERSION, level:2, unitId:`hsk2-unit-${pad(lesson.u, 2)}`,
      order:orderInUnit, topic:unitDefinitions[lesson.u - 1][1], titleZh:lesson.zh, titleVi:lesson.vi,
      objectives:[lesson.objective,"Hoàn thành một nhiệm vụ tiếp nhận và một nhiệm vụ sản sinh có tiêu chí tự đánh giá.","Phân biệt nội dung mới với kiến thức HSK1 được ôn lại."],
      prerequisiteIds:previousLesson ? [previousLesson] : [], prerequisiteMasteryId:index===0?"hsk1-assessment-mastery":null,
      vocabularyRefs, grammarRefs:grammarIds, characterRefs,
      knowledgeMap:{ new:{vocabularyRefs,grammarRefs:grammarIds,characterRefs}, review:{hsk1Words:lesson.reviewWords}, reinforcement:["retrieval","pronunciation","word-order"], extension:[lesson.realTask] },
      sections:[
        section("situation","situation","Tình huống và mục tiêu",{promptVi:lesson.situation,successCriterionVi:lesson.objective}),
        section("vocabulary","vocabulary","Từ vựng mới theo ngữ cảnh",{instructionVi:"Từ gắn nhãn new thuộc 200 từ mới HSK2; từ HSK1 trong phần review không được tính lại.",focusWords:vocabularyRefs.map((canonicalId) => { const word=vocabulary.find((item)=>item.id===canonicalId); return {canonicalId,simplified:word.simplified,canonicalLookup:{field:"id",value:canonicalId},lexicalStatus:"canonical",knowledgeStatus:"new",collocations:word.collocations,commonErrorsVi:word.commonErrorsVi,assessmentEligible:true}; }),reviewWords:lesson.reviewWords.map((word)=>({simplified:word,knowledgeStatus:"review",introducedLevel:1}))}),
        section("character","character","Chữ Hán trọng tâm",{characterRefs,knowledgeStatus:"new",reviewCharacters:lesson.reviewWords.join(""),workflow:["nhận diện bộ và cấu trúc","đếm nét từ dữ liệu tĩnh","đối chiếu chữ dễ nhầm","viết trong từ đã học"],noteVi:"Mnemonic chỉ là mẹo nhớ; stroke order animation chưa được xác minh nên không tuyên bố có asset chuẩn."}),
        section("grammar","grammar","Ngữ pháp để hoàn thành nhiệm vụ",{grammarRefs:grammarIds,knowledgeStatus:grammarIds.map((grammarId)=>grammar.find((item)=>item.id===grammarId).knowledgeStatus),teachingFlow:["chức năng giao tiếp","cấu trúc và điều kiện dùng","phủ định/nghi vấn khi phù hợp","đối chiếu lỗi","bài áp dụng"]}),
        section("dialogue","dialogue","Hội thoại có tình huống",{contextVi:lesson.situation,goalVi:lesson.objective,scriptZh:lesson.dialogue,tasks:["nghe ý chính trước khi nhìn transcript","shadowing theo lượt","đổi thông tin để role-play"]}),
        section("reading","reading","Đọc hiểu có bằng chứng",{textZh:lesson.reading,questionsVi:lesson.readingQ,answerPolicy:"Trả lời sau khi chỉ được bằng chứng; câu suy luận cơ bản phải dựa vào chi tiết văn bản.",answerKey:lesson.readingA.map((answer,qIndex)=>({qVi:lesson.readingQ[qIndex],answerVi:answer[0],evidenceZh:answer[1],explanationVi:`Cụm “${answer[1]}” hỗ trợ trực tiếp cho đáp án.`}))}),
        section("listening","listening","Nghe ý chính, chi tiết và shadowing",{scriptOrTeacherBriefVi:"Audio đã kiểm duyệt chưa có; dùng transcript để thu âm sau, TTS chỉ hỗ trợ học tạm.",passes:["lượt 1: ý chính","lượt 2: chi tiết","lượt 3: dictation cụm mục tiêu","lượt 4: shadowing"],audioStatus:"script-ready-audio-pending",scriptZh:lesson.listening,questionsVi:lesson.listeningQ,answerKey:lesson.listeningA.map((answer,qIndex)=>({qVi:lesson.listeningQ[qIndex],answer}))}),
        section("pronunciation","pronunciation","Phát âm cho người Việt",{coachingVi:lesson.pronunciation,selfCheck:["âm đầu","vận mẫu","thanh điệu","nhịp cụm","nghe lại và tự sửa"]}),
        section("guided","guided-practice","Luyện có hướng dẫn",{steps:[lesson.grammarPractice,`Đọc lại hội thoại và thay ít nhất hai thông tin liên quan đến ${lesson.vi.toLowerCase()}.`,`Làm bài sửa lỗi “${lesson.errorPair[0]}” trước khi xem đáp án.`,`Tóm tắt đoạn nghe bằng 2–3 câu.`],exerciseRefs:lessonExercises.slice(0,4).map((exercise)=>exercise.id)}),
        section("independent","independent-practice","Nói, viết và dùng thật",{speakingVi:lesson.speaking,writingVi:lesson.writing,realWorldTaskVi:lesson.realTask,exerciseRefs:lessonExercises.slice(4).map((exercise)=>exercise.id)}),
        section("summary","summary","Tự đánh giá can-do",{canDoVi:lesson.objective,checklist:[`Tôi dùng được từ mới của bài “${lesson.vi}” trong câu.`,`Tôi giải thích được vì sao “${lesson.errorPair[0]}” chưa phù hợp.`,`Tôi trả lời được câu đọc/nghe bằng bằng chứng.`,`Tôi hoàn thành nhiệm vụ đời thực ở mức HSK2.`]}),
        section("review","review","Ôn cách quãng",{spacingDays:[1,3,7,14,30],retrievalMix:[`Ngày 1: nhớ lại 6 từ new và 2 từ review mà không nhìn pinyin.`,`Ngày 3: trả lời lại câu nghe “${lesson.listeningQ[1]}”.`,`Ngày 7: làm lại sửa lỗi ngữ pháp bằng câu mới.`,`Ngày 14/30: làm lại nhiệm vụ nói hoặc viết, so sánh với bản cũ.`],realWorldTaskVi:lesson.realTask,retrievalFromLessonIds:previousLesson?[previousLesson]:[],reviewPolicyVi:"new = giới thiệu ở HSK2; review = đã có ở HSK1; reinforcement = gọi lại trong ngữ cảnh mới; extension = vận dụng vào nhiệm vụ đời thực."})
      ],
      practiceRefs:lessonExercises.map((exercise)=>exercise.id), reviewRefs:[], estimatedMinutes:75,
      difficulty:1 + Math.floor(index / 10), sourceIds:SOURCE_IDS, contentStatus:"machine-assisted",
      translationReviewStatus:"machine-assisted", contentVersion:1, reviewMetadata:{...REVIEW_METADATA}
    };
  });
  assert(exercises.length === 168, `Cần 168 bài tập, nhận ${exercises.length}.`);
  return { lessons, exercises };
}

function makeUnits(lessons) {
  return unitDefinitions.map((unit, index) => {
    const [titleZh,titleVi,task] = unit;
    const unitLessons = lessons.filter((lesson) => lesson.unitId === `hsk2-unit-${pad(index + 1, 2)}`);
    return {
      recordType:"unit", id:`hsk2-unit-${pad(index + 1, 2)}`, syllabusVersion:SCHEMA_VERSION, level:2, order:index + 1,
      topic:titleVi, titleZh, titleVi,
      objectives:[task,"Tích hợp nghe–nói–đọc–viết trong tình huống tổng quát, không giới hạn bối cảnh công sở.","Ôn kiến thức cũ có nhãn rõ và đạt checkpoint trước khi chuyển unit."],
      prerequisiteUnitIds:index ? [`hsk2-unit-${pad(index,2)}`] : [], prerequisiteLevelId:index===0?"hsk1":null,
      lessonRefs:unitLessons.map((lesson)=>({id:lesson.id,path:"lessons.json",order:lesson.order})),
      checkpointRef:{id:`hsk2-assessment-unit-${pad(index+1,2)}`,path:"assessments.json"},
      sourceIds:SOURCE_IDS, contentStatus:"machine-assisted", contentVersion:1
    };
  });
}

function makeAssessments(units, lessons, exercises) {
  const skillWeights = {listening:20,grammar:15,reading:20,speaking:25,writing:20};
  const assessmentSkills = Object.keys(skillWeights);
  const selectBalanced = (pool, plan) => assessmentSkills.flatMap((skill) => {
    const matches = pool.filter((exercise) => exercise.skill === skill);
    assert(matches.length >= plan[skill], `Không đủ ${skill} cho assessment (${matches.length}/${plan[skill]}).`);
    return matches.slice(0, plan[skill]).map((exercise) => exercise.id);
  });
  const make = (id,type,titleZh,titleVi,refs,targetLessons,pass) => ({
    recordType:"assessment",id,syllabusVersion:SCHEMA_VERSION,examBlueprintVersion:EXAM_VERSION,level:2,
    assessmentType:type,titleZh,titleVi,exerciseRefs:refs,
    sections:Object.fromEntries(assessmentSkills.map((skill)=>[skill,refs.filter((ref)=>exercises.find((exercise)=>exercise.id===ref)?.skill===skill).length])),skillWeights,
    targetGrammar:unique(targetLessons.flatMap((lesson)=>lesson.grammarRefs)),targetVocabulary:unique(targetLessons.flatMap((lesson)=>lesson.vocabularyRefs)),
    difficultyDistribution:{easy:25,core:55,stretch:20},rubric:{pass,knowledge:80,receptive:75,productive:72,remediation:"Kỹ năng dưới ngưỡng phải làm một item khác định dạng rồi retrieval sau 1 và 3 ngày; không chỉ xem lại đáp án."},
    sourceIds:SOURCE_IDS,contentStatus:"machine-assisted",reviewStatus:"unreviewed",contentVersion:1
  });
  const assessments = units.map((unit,index) => {
    const targetLessons = lessons.filter((lesson)=>lesson.unitId===unit.id);
    const targetExercises = exercises.filter((exercise)=>targetLessons.some((lesson)=>lesson.practiceRefs.includes(exercise.id)));
    const refs = selectBalanced(targetExercises,{listening:2,grammar:2,reading:2,speaking:2,writing:2});
    return make(`hsk2-assessment-unit-${pad(index+1,2)}`,"mini-checkpoint",`第${index+1}单元检查`,`Checkpoint Unit ${index+1}: ${unit.titleVi}`,refs,targetLessons,75);
  });
  const midpointLessons=lessons.slice(0,14), finalLessons=lessons, masteryLessons=lessons.slice(-10);
  const midpointPool=exercises.filter((exercise)=>midpointLessons.some((lesson)=>lesson.practiceRefs.includes(exercise.id)));
  const masteryPool=exercises.filter((exercise)=>masteryLessons.some((lesson)=>lesson.practiceRefs.includes(exercise.id)));
  assessments.push(make("hsk2-assessment-midpoint","midpoint", "二级中期检查","HSK2 Midpoint: Unit 1–5", selectBalanced(midpointPool,{listening:4,grammar:4,reading:4,speaking:4,writing:4}),midpointLessons,75));
  assessments.push(make("hsk2-assessment-final","final", "二级结业评估","HSK2 Final Assessment", selectBalanced(exercises,{listening:6,grammar:6,reading:6,speaking:6,writing:6}),finalLessons,75));
  assessments.push(make("hsk2-assessment-mastery","mastery-review", "二级掌握门槛","HSK2 Mastery Review", selectBalanced(masteryPool,{listening:3,grammar:3,reading:3,speaking:5,writing:5}),masteryLessons,80));
  assert(assessments.length===13,"HSK2 phải có 13 assessment.");
  return assessments;
}

function makeLevel(units,lessons,assessments) {
  return {
    recordType:"level",id:"hsk2",syllabusVersion:SCHEMA_VERSION,examBlueprintVersion:EXAM_VERSION,stage:"elementary",level:2,
    titleZh:"HSK（二级）专业课程",titleVi:"HSK2 Professional Curriculum",
    objectives:["Duy trì hội thoại ngắn về lịch trình, dịch vụ, sở thích, trải nghiệm và nhu cầu.","Hiểu thông báo/tin nhắn ngắn và kể lại một chuỗi sự việc đơn giản.","Viết đoạn thực dụng 5–8 câu với thời gian, trình tự và quan hệ nguyên nhân cơ bản."],
    topics:units.map((unit)=>unit.titleVi), unitRefs:units.map((unit)=>({id:unit.id,path:"units.json"})),
    lessonIndex:lessons.map((lesson)=>({id:lesson.id,unitId:lesson.unitId,path:"lessons.json"})),
    assessmentRefs:assessments.map((assessment)=>({id:assessment.id,path:"assessments.json"})),finalAssessmentId:"hsk2-assessment-final",
    sourceIds:SOURCE_IDS,contentStatus:"machine-assisted",translationReviewStatus:"machine-assisted",productionReady:false,contentVersion:1
  };
}

function makeManifest(units,lessons,grammar,characters,exercises,assessments,vocabulary) {
  return {
    schemaVersion:"1.0.0",phase:"C3",curriculumId:"vduckie-hsk2-professional-course",syllabusVersion:SCHEMA_VERSION,examBlueprintVersion:EXAM_VERSION,
    level:2,status:"phase-c3-professional-machine-editorial-human-signoff-required",productionEnabled:false,publicOverrideAllowed:false,writesProgress:false,
    developerOnly:true,readOnly:true,qualityGate:"locked",
    collections:{units:{path:"units.json",count:units.length},lessons:{path:"lessons.json",count:lessons.length},grammar:{path:"grammar.json",count:grammar.length},characters:{path:"characters.json",count:characters.length},exercises:{path:"exercises.json",count:exercises.length},assessments:{path:"assessments.json",count:assessments.length},vocabularyEnrichment:{path:"vocabulary-enrichment.json",count:vocabulary.length,linkStrategy:"canonicalLookup.id"},vocabulary:{path:"vocabulary/index.json",count:vocabulary.length,newAtLevel:200,cumulativeThroughLevel:500}},
    learnerJourney:{lessonFlow:["context","new-vocabulary-in-use","characters","grammar-for-purpose","dialogue","reading","listening-transcript","pronunciation","guided-practice","speaking-writing","summary","spaced-review","real-world-task"],mastery:{knowledge:80,receptive:75,productive:72,mandatory:["unit checkpoints","final assessment","nhiệm vụ nói có rubric"],spacingDays:[1,3,7,14,30]}},
    sourceIds:SOURCE_IDS,reviewGate:{vietnameseHumanReview:false,chinesePedagogyHumanReview:false,audioRecorded:false,strokeOrderVerified:false,productionReleaseAllowed:false},
    editorialQualityGate:{status:"pass-machine-editorial-human-signoff-required",reviewedLessons:28,readingSpecificQuestions:true,listeningTranscriptCoverage:"28/28",exerciseCount:168,exerciseFormatCount:unique(exercises.map((exercise)=>exercise.format)).length,officialNewVocabulary:"200/200",humanVietnameseSignoff:false,humanChinesePedagogySignoff:false}
  };
}

function shardVocabulary(vocabulary) {
  const dir=path.join(HSK2_DIR,"vocabulary");
  const shards=[];
  for(let start=0;start<vocabulary.length;start+=50){
    const records=vocabulary.slice(start,start+50); const first=start+1,last=start+records.length;
    const file=`hsk2-v-${pad(first,4)}-${pad(last,4)}.json`;
    writeJson(path.join(dir,file),{schemaVersion:"1.0.0",collectionType:"vocabulary",level:2,records});
    shards.push({file,firstId:records[0].id,lastId:records.at(-1).id,count:records.length});
  }
  writeJson(path.join(dir,"index.json"),{schemaVersion:"1.0.0",collectionType:"vocabulary-index",level:2,expectedCount:vocabulary.length,officialBand:"2",officialRows:"301-500",cumulativeThroughLevel:500,shards});
}

function updateRootManifest() {
  const manifestPath=path.join(DATA_ROOT,"manifest.json"); const manifest=readJson(manifestPath);
  manifest.hsk2CourseManifestPath="hsk2/course-manifest.json";
  const level=manifest.levels.find((item)=>item.level===2);
  level.status="machine-assisted"; level.courseManifestPath="hsk2/course-manifest.json"; level.productionReady=false;
  writeJson(manifestPath,manifest);
}

function updateSources() {
  const sourcePath=path.join(DATA_ROOT,"sources.json"); const registry=readJson(sourcePath);
  const originalSource = {
    sourceId:"vduckie-hsk2-c3-original",title:"VDuckie HSK2 Phase C3 original learning content",publisher:"VDuckie",sourceType:"original-curriculum-content",url:null,accessDate:"2026-08-01",syllabusVersion:EXAM_VERSION,levels:[2],scope:["Vietnamese explanations","examples","dialogues","reading","listening transcripts","speaking","writing","exercises","assessments"],confidence:"machine-assisted-human-signoff-required",licenseStatus:"verified",licenseNote:"All learning prose and tasks are newly authored for VDuckie; no commercial textbook text is copied.",derivedDataNote:"Official sources determine alignment and vocabulary membership only; VDuckie wording remains original."
  };
  const existing = registry.sources.find((source)=>source.sourceId===originalSource.sourceId);
  if(existing) Object.assign(existing,originalSource); else registry.sources.push(originalSource);
  writeJson(sourcePath,registry);
}

function writeReports({vocabulary,characters,grammar,lessons,exercises,assessments}) {
  const formats=unique(exercises.map((exercise)=>exercise.format));
  const report={
    generatedAt:"2026-08-01",phase:"C3",level:2,status:"pass-machine-editorial-human-signoff-required",
    counts:{units:10,lessons:lessons.length,newVocabulary:vocabulary.length,cumulativeVocabulary:500,characters:characters.length,grammar:grammar.length,dialogues:lessons.length,listeningTranscripts:lessons.length,readings:lessons.length,speakingTasks:lessons.length,writingTasks:lessons.length,exercises:exercises.length,assessments:assessments.length},
    editorialSampling:{sampledLessonIds:["hsk2-lesson-01","hsk2-lesson-09","hsk2-lesson-14","hsk2-lesson-22","hsk2-lesson-28"],method:"Machine-assisted full pass plus stratified sampling of first/middle/last and contrasting domains.",changes:["Rewrote comparisons to remove 很 after 比.","Separated two official senses of 过 and 花 by canonical ID.","Removed ERP-heavy framing in favor of daily-life, study, service, travel and relationship tasks.","Replaced generic vocabulary notes with target-bearing usage, error and translated pattern fields.","Aligned exercise format labels, stimuli, accepted answers and rubrics with the task learners actually perform.","Balanced every checkpoint and cumulative assessment across listening, grammar, reading, speaking and writing.","Shortened overlong writing targets and rewrote sampled unnatural Chinese dialogue/reading lines.","Marked every unverified audio and stroke asset as pending/unverified."],humanSignoffRequired:true,humanVietnameseSignoff:false,humanChinesePedagogySignoff:false},
    validation:{schema:"pass",officialRows:"301-500 exact",targetExamples:"200/200",lessonAssignment:"200/200 exactly once",audioStatus:"28/28 script-ready-audio-pending",exerciseFormats:formats,duplicatePolicy:"ID/exact/normalized/near-duplicate checks in HSK2 validator",productionWrites:false}
  };
  writeJson(path.join(HSK2_DIR,"editorial-c3.json"),report);
  writeJson(path.join(HSK2_DIR,"provenance/source-snapshot.json"),{schemaVersion:"1.0.0",capturedAt:"2026-08-01",officialVocabulary:{sourceId:"cti-hsk3-current-syllabus-2026",url:"https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf",sha256:"ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941",pagesUsed:"87-92 (PDF numbering as rendered)",rows:"301-500",factsStored:["official row","headword","pinyin"],copyrightPolicy:"No sample test, answer key, audio or commercial textbook prose stored."},authorship:{contentSourceId:"vduckie-hsk2-c3-original",machineAssisted:true,humanSignoffRequired:true}});
}

function main() {
  const vocabulary=makeVocabulary();
  const characters=makeCharacters(vocabulary);
  const grammar=makeGrammar();
  const {lessons,exercises}=makeLessons(vocabulary,characters,grammar);
  const units=makeUnits(lessons);
  const assessments=makeAssessments(units,lessons,exercises);
  const level=makeLevel(units,lessons,assessments);
  const manifest=makeManifest(units,lessons,grammar,characters,exercises,assessments,vocabulary);
  assert(unique(lessonDefinitions.flatMap((lesson)=>lesson.newRows)).length===200,"Một số official row bị lặp hoặc thiếu trong lesson assignment.");
  assert(Math.min(...lessonDefinitions.flatMap((lesson)=>lesson.newRows))===301 && Math.max(...lessonDefinitions.flatMap((lesson)=>lesson.newRows))===500,"Lesson assignment phải phủ row 301–500.");
  writeJson(path.join(HSK2_DIR,"level.json"),level);
  writeJson(path.join(HSK2_DIR,"units.json"),{schemaVersion:"1.0.0",collectionType:"units",level:2,records:units});
  writeJson(path.join(HSK2_DIR,"lessons.json"),{schemaVersion:"1.0.0",collectionType:"lessons",level:2,records:lessons});
  writeJson(path.join(HSK2_DIR,"grammar.json"),{schemaVersion:"1.0.0",collectionType:"grammar",level:2,records:grammar});
  writeJson(path.join(HSK2_DIR,"characters.json"),{schemaVersion:"1.0.0",collectionType:"characters",level:2,records:characters});
  writeJson(path.join(HSK2_DIR,"exercises.json"),{schemaVersion:"1.0.0",collectionType:"exercises",level:2,records:exercises});
  writeJson(path.join(HSK2_DIR,"assessments.json"),{schemaVersion:"1.0.0",collectionType:"assessments",level:2,records:assessments});
  writeJson(path.join(HSK2_DIR,"vocabulary-enrichment.json"),{schemaVersion:"1.0.0",collectionType:"vocabulary-enrichment",level:2,entries:vocabulary.map((word)=>({canonicalId:word.id,simplified:word.simplified,officialRow:word.officialRow,senseKey:word.senseKey,collocations:word.collocations,measureWord:word.measureWord,usageNoteVi:word.usageNoteVi,confusables:word.confusables,commonErrorsVi:word.commonErrorsVi,example:word.examples[0],contentStatus:"machine-assisted",humanSignoffRequired:true}))});
  writeJson(path.join(HSK2_DIR,"course-manifest.json"),manifest);
  shardVocabulary(vocabulary); updateRootManifest(); updateSources();
  writeReports({vocabulary,characters,grammar,lessons,exercises,assessments});
  console.log(JSON.stringify({ok:true,level:2,counts:{units:units.length,lessons:lessons.length,vocabulary:vocabulary.length,characters:characters.length,grammar:grammar.length,exercises:exercises.length,assessments:assessments.length}},null,2));
}

if(require.main===module) main();

module.exports={parseVocabularyFacts,parseExamples,makeVocabulary,makeCharacters,makeGrammar,makeLessons,makeUnits,makeAssessments};
