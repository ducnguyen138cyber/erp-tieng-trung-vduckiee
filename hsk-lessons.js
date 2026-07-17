(function (root) {
  "use strict";

  function lesson(id, title, goal, words, grammar, dialogue) {
    return { id: id, title: title, goal: goal, words: words, grammar: grammar, dialogue: dialogue };
  }

  function foundationLesson(id, title, goal, items, practiceWords) {
    return { id: id, title: title, goal: goal, foundation: true, items: items, practiceWords: practiceWords || [] };
  }

  var foundationLessons = [
    foundationLesson("foundation-1", "Bốn thanh điệu và thanh nhẹ", "Nghe và phân biệt độ cao của bốn thanh tiếng Phổ thông trước khi ghép âm.", [
      ["mā · thanh 1", "Cao và giữ ngang, không lên xuống.", "妈"],
      ["má · thanh 2", "Đi từ trung bình lên cao, giống giọng hỏi nhẹ.", "麻"],
      ["mǎ · thanh 3", "Hạ xuống rồi nhấc lên; trong câu thường chỉ hạ thấp.", "马"],
      ["mà · thanh 4", "Từ cao rơi mạnh xuống, ngắn và dứt khoát.", "骂"],
      ["ma · thanh nhẹ", "Đọc ngắn, nhẹ, không mang đường nét cố định.", "吗"]
    ]),
    foundationLesson("foundation-2", "Sáu nguyên âm đơn", "Đặt khẩu hình đúng cho a, o, e, i, u, ü và biết vị trí đặt dấu thanh.", [
      ["a", "Mở miệng rộng, lưỡi thả thấp. Ví dụ: mā.", "妈"],
      ["o", "Môi tròn, lưỡi lùi nhẹ. Ví dụ: wǒ.", "我"],
      ["e", "Miệng hơi mở, âm phát ở phía sau. Ví dụ: è.", "饿"],
      ["i", "Kéo ngang môi. Ví dụ: yī.", "一"],
      ["u", "Chu môi tròn nhỏ. Ví dụ: wǔ.", "五"],
      ["ü", "Giữ lưỡi như i nhưng chu môi như u. Ví dụ: yú.", "鱼"]
    ], [["我", "wǒ", "Tôi", "我是学生。", "Tôi là học sinh."], ["一", "yī", "Một", "我有一本书。", "Tôi có một quyển sách."], ["五", "wǔ", "Năm", "现在五点。", "Bây giờ là năm giờ."]]),
    foundationLesson("foundation-3", "Thanh mẫu b p m f · d t n l", "Phân biệt âm bật hơi và không bật hơi ở nhóm môi và đầu lưỡi.", [
      ["b / p", "b không bật hơi mạnh; p bật luồng hơi rõ.", "爸爸怕"],
      ["m / f", "m khép môi có rung mũi; f để răng trên chạm môi dưới.", "妈妈发"],
      ["d / t", "d ít bật hơi; t bật hơi mạnh ở đầu lưỡi.", "弟弟听"],
      ["n / l", "n thoát hơi qua mũi; l thoát hơi qua hai bên lưỡi.", "奶奶来"]
    ]),
    foundationLesson("foundation-4", "Thanh mẫu g k h · j q x", "Đặt đúng vị trí lưỡi cho nhóm cuống lưỡi và nhóm mặt lưỡi.", [
      ["g / k", "g không bật hơi; k bật hơi mạnh ở phía sau khoang miệng.", "哥哥看"],
      ["h", "Luồng hơi ma sát nhẹ ở cuống lưỡi, không đọc như h tiếng Việt quá nặng.", "很好"],
      ["j / q", "Mặt lưỡi chạm gần ngạc cứng; q bật hơi rõ hơn j.", "姐姐去"],
      ["x", "Mặt lưỡi gần ngạc cứng, tạo khe hẹp cho hơi đi qua.", "学习"]
    ]),
    foundationLesson("foundation-5", "Thanh mẫu z c s · zh ch sh r", "Phân biệt nhóm đầu lưỡi trước và nhóm uốn lưỡi thường gây nhầm.", [
      ["z / c / s", "Đầu lưỡi gần răng trên; c bật hơi, z không bật hơi.", "早上三次"],
      ["zh / ch", "Uốn nhẹ đầu lưỡi; ch bật hơi mạnh hơn zh.", "中国吃茶"],
      ["sh / r", "Uốn lưỡi tạo ma sát; r có độ rung nhẹ hơn âm r tiếng Việt.", "十个人"],
      ["y / w", "Âm đệm đứng đầu âm tiết, giúp i/u/ü ghép đúng chính tả.", "有问题"]
    ]),
    foundationLesson("foundation-6", "Vận mẫu ai ei ao ou · an en", "Ghép nguyên âm đôi và âm mũi trước, đọc liền thành một khối.", [
      ["ai / ei", "Chuyển nhanh khẩu hình, trọng âm rơi vào nguyên âm đầu.", "爱北京"],
      ["ao / ou", "Từ a/o chuyển dần sang u, không tách thành hai tiếng.", "好朋友"],
      ["an / en", "Kết thúc bằng n đầu lưỡi, âm ngắn và gọn.", "看门"],
      ["ian / uan / üan", "Có âm đệm i/u/ü trước phần an.", "今天喜欢"]
    ]),
    foundationLesson("foundation-7", "Vận mẫu ang eng ing ong", "Phân biệt âm mũi sau -ng với âm mũi trước -n.", [
      ["ang", "Mở miệng khá rộng, âm kết ở mũi sau.", "上午"],
      ["eng", "Miệng vừa, lưỡi lùi và kết thúc bằng -ng.", "朋友"],
      ["ing", "Bắt đầu bằng i rồi kéo về âm mũi sau.", "北京"],
      ["ong", "Môi tròn, kết thúc ở âm mũi sau.", "中国"]
    ]),
    foundationLesson("foundation-8", "Biến điệu và ghép pinyin", "Đọc tự nhiên thanh 3 nối nhau, 一 và 不 trong câu.", [
      ["Thanh 3 + thanh 3", "Âm đầu đổi thành thanh 2: nǐ hǎo đọc gần như ní hǎo.", "你好"],
      ["一 + thanh 4", "一 thường đổi thành thanh 2: yí ge.", "一个"],
      ["一 + thanh 1/2/3", "一 thường đổi thành thanh 4: yì tiān.", "一天"],
      ["不 + thanh 4", "不 đổi thành thanh 2: bú shì.", "不是"]
    ], [["你好", "nǐ hǎo", "Xin chào", "你好，我叫德。", "Xin chào, tôi tên Đức."], ["一个", "yí ge", "Một cái/người", "我有一个朋友。", "Tôi có một người bạn."], ["不是", "bú shì", "Không phải", "他不是老师。", "Anh ấy không phải giáo viên."]]),
    foundationLesson("foundation-9", "Sáu nét cơ bản", "Nhận biết hướng đi bút của nét ngang, sổ, phẩy, mác, chấm và hất.", [
      ["横 héng · 一", "Nét ngang: đi từ trái sang phải, hơi nhấc nhẹ ở cuối.", "一"],
      ["竖 shù · 丨", "Nét sổ: đi từ trên xuống dưới, giữ trục thẳng.", "十"],
      ["撇 piě · 丿", "Nét phẩy: từ trên phải xuống dưới trái, nhẹ dần.", "人"],
      ["捺 nà · ㇏", "Nét mác: từ trên trái xuống dưới phải, ấn rồi nhấc.", "大"],
      ["点 diǎn · 丶", "Nét chấm: vào bút nhẹ, ấn nhanh rồi nhấc.", "六"],
      ["提 tí · ㇀", "Nét hất: từ dưới trái hướng lên phải, kết thúc nhanh.", "我"]
    ], [["一", "yī", "Một", "一、二、三。", "Một, hai, ba."], ["十", "shí", "Mười", "今天十号。", "Hôm nay ngày mười."], ["人", "rén", "Người", "这里有三个人。", "Ở đây có ba người."], ["大", "dà", "Lớn", "这个很大。", "Cái này rất lớn."]]),
    foundationLesson("foundation-10", "Nét gập và nét móc", "Làm quen các nét kết hợp thường gặp trước khi viết chữ nhiều nét.", [
      ["横折 héng zhé", "Đi ngang rồi đổi hướng xuống; chỗ gập không nhấc bút.", "口"],
      ["竖钩 shù gōu", "Đi sổ xuống rồi móc nhanh lên trái.", "小"],
      ["横钩 héng gōu", "Đi ngang rồi móc ngắn xuống trái.", "买"],
      ["撇折 piě zhé", "Phẩy xuống trái rồi đổi hướng sang phải.", "么"]
    ], [["口", "kǒu", "Miệng", "请开口读。", "Hãy mở miệng đọc."], ["小", "xiǎo", "Nhỏ", "这个很小。", "Cái này rất nhỏ."], ["买", "mǎi", "Mua", "我想买书。", "Tôi muốn mua sách."]]),
    foundationLesson("foundation-11", "Quy tắc thứ tự nét", "Viết đúng thứ tự để chữ cân đối và tạo nền cho việc tra chữ.", [
      ["Trên trước, dưới sau", "Ví dụ 二: viết nét trên trước rồi nét dưới.", "二"],
      ["Trái trước, phải sau", "Ví dụ 你: bộ nhân đứng 亻 được viết trước phần 尔.", "你"],
      ["Ngang trước, sổ sau", "Ví dụ 十: nét ngang trước, nét sổ sau.", "十"],
      ["Ngoài trước, trong sau", "Ví dụ 问: viết khung 门 rồi mới viết 口.", "问"],
      ["Đóng khung sau cùng", "Ví dụ 国: viết phần trong trước nét ngang đáy cuối.", "国"]
    ], [["二", "èr", "Hai", "我有两本书。", "Tôi có hai quyển sách."], ["你", "nǐ", "Bạn", "你好吗？", "Bạn khỏe không?"], ["问", "wèn", "Hỏi", "我想问一个问题。", "Tôi muốn hỏi một câu."], ["国", "guó", "Nước/quốc gia", "我是越南人。", "Tôi là người Việt Nam."]]),
    foundationLesson("foundation-12", "Bộ thủ và chữ đầu tiên", "Nhìn cấu trúc trái–phải, trên–dưới và luyện các chữ dùng ngay ở HSK 1.", [
      ["亻 · bộ nhân đứng", "Liên quan đến người; gặp trong 你, 他, 们.", "你他"],
      ["女 · bộ nữ", "Liên quan đến nữ giới; là phần trái của 好.", "女好"],
      ["口 · bộ khẩu", "Liên quan đến miệng, lời nói; gặp trong 吗, 叫, 吃.", "吗叫吃"],
      ["木 · bộ mộc", "Liên quan đến cây, gỗ; cũng làm thành phần trong nhiều chữ.", "木本"],
      ["氵 · bộ thủy", "Ba chấm nước, liên quan đến nước; gặp trong 汉, 河, 海.", "汉河海"],
      ["讠 · bộ ngôn", "Liên quan đến lời nói/ngôn ngữ; gặp trong 说, 话, 语.", "说话语"]
    ], [["你好", "nǐ hǎo", "Xin chào", "你好！", "Xin chào!"], ["中国", "Zhōngguó", "Trung Quốc", "我去过中国。", "Tôi từng đi Trung Quốc."], ["汉语", "Hànyǔ", "Tiếng Trung", "我学习汉语。", "Tôi học tiếng Trung."], ["学习", "xuéxí", "Học tập", "我们一起学习。", "Chúng ta cùng học."]])
  ];

  var levels = {
    0: foundationLessons,
    1: [
      lesson("hsk1-1", "Chào hỏi và tự giới thiệu", "Chào hỏi, nói tên và giới thiệu mình là ai.", [
        ["你好", "nǐ hǎo", "Xin chào", "你好，我叫德。", "Xin chào, tôi tên Đức."],
        ["我", "wǒ", "Tôi", "我是越南人。", "Tôi là người Việt Nam."],
        ["你", "nǐ", "Bạn", "你叫什么名字？", "Bạn tên là gì?"],
        ["叫", "jiào", "Tên là / gọi là", "我叫德。", "Tôi tên Đức."],
        ["名字", "míngzi", "Tên", "你的名字很好听。", "Tên của bạn rất hay."],
        ["是", "shì", "Là", "我是学生。", "Tôi là học sinh."]
      ], [
        ["A 是 B", "Dùng để xác định A là B.", "我是越南人。", "Tôi là người Việt Nam."],
        ["你叫……？", "Hỏi tên của người đối diện.", "你叫什么名字？", "Bạn tên là gì?"]
      ], [
        ["A", "你好！你叫什么名字？", "Xin chào! Bạn tên là gì?"],
        ["B", "我叫德。我是越南人。", "Tôi tên Đức. Tôi là người Việt Nam."]
      ]),
      lesson("hsk1-2", "Gia đình và bạn bè", "Giới thiệu những người gần gũi trong gia đình.", [
        ["家", "jiā", "Nhà / gia đình", "我家有四个人。", "Gia đình tôi có bốn người."],
        ["爸爸", "bàba", "Bố", "我爸爸在家。", "Bố tôi ở nhà."],
        ["妈妈", "māma", "Mẹ", "我妈妈会做饭。", "Mẹ tôi biết nấu ăn."],
        ["哥哥", "gēge", "Anh trai", "我哥哥在公司工作。", "Anh trai tôi làm việc ở công ty."],
        ["弟弟", "dìdi", "Em trai", "我弟弟学习汉语。", "Em trai tôi học tiếng Trung."],
        ["朋友", "péngyou", "Bạn bè", "他是我的朋友。", "Anh ấy là bạn của tôi."]
      ], [
        ["A 有 B", "Nói A có người hoặc vật gì.", "我家有四个人。", "Gia đình tôi có bốn người."],
        ["我的 + danh từ", "Biểu thị sở hữu: của tôi.", "她是我的朋友。", "Cô ấy là bạn của tôi."]
      ], [
        ["A", "你家有几个人？", "Nhà bạn có mấy người?"],
        ["B", "我家有爸爸、妈妈、弟弟和我。", "Nhà tôi có bố, mẹ, em trai và tôi."]
      ]),
      lesson("hsk1-3", "Số đếm, ngày và giờ", "Hỏi giờ, nói ngày và sắp xếp một cuộc hẹn đơn giản.", [
        ["一", "yī", "Một", "我有一个问题。", "Tôi có một câu hỏi."],
        ["二", "èr", "Hai", "现在两点。", "Bây giờ là hai giờ."],
        ["三", "sān", "Ba", "我们三个人去。", "Ba người chúng tôi đi."],
        ["今天", "jīntiān", "Hôm nay", "今天我学习汉语。", "Hôm nay tôi học tiếng Trung."],
        ["明天", "míngtiān", "Ngày mai", "明天我们见。", "Ngày mai chúng ta gặp nhau."],
        ["点", "diǎn", "Giờ", "下午三点看书。", "Ba giờ chiều đọc sách."]
      ], [
        ["现在 + số + 点", "Nói giờ hiện tại.", "现在九点。", "Bây giờ là chín giờ."],
        ["Thời gian + động từ", "Thời gian thường đặt trước động từ.", "明天八点学习。", "Ngày mai tám giờ học."]
      ], [
        ["A", "我们几点学习？", "Mấy giờ chúng ta học?"],
        ["B", "今天下午三点学习。", "Hôm nay ba giờ chiều học."]
      ]),
      lesson("hsk1-4", "Địa điểm và vị trí", "Hỏi một người hoặc đồ vật đang ở đâu.", [
        ["在", "zài", "Ở / tại", "我在学校。", "Tôi ở trường."],
        ["学校", "xuéxiào", "Trường học", "妹妹在学校。", "Em gái ở trường."],
        ["图书馆", "túshūguǎn", "Thư viện", "图书馆在这里。", "Thư viện ở đây."],
        ["这里", "zhèlǐ", "Ở đây", "请坐这里。", "Mời ngồi đây."],
        ["那里", "nàlǐ", "Ở đó", "洗手间在那里。", "Nhà vệ sinh ở đó."],
        ["哪儿", "nǎr", "Ở đâu", "你在哪儿学习？", "Bạn học ở đâu?"]
      ], [
        ["A 在 B", "Nói vị trí của A.", "老师在学校。", "Giáo viên ở trường."],
        ["A 在哪儿？", "Hỏi vị trí của A.", "图书馆在哪儿？", "Thư viện ở đâu?"]
      ], [
        ["A", "图书馆在哪儿？", "Thư viện ở đâu?"],
        ["B", "图书馆在那里。", "Thư viện ở đằng kia."]
      ]),
      lesson("hsk1-5", "Ăn uống và sở thích", "Nói món mình ăn, đồ mình uống và sở thích.", [
        ["吃", "chī", "Ăn", "我吃米饭。", "Tôi ăn cơm."],
        ["喝", "hē", "Uống", "你喝茶吗？", "Bạn uống trà không?"],
        ["水", "shuǐ", "Nước", "请给我一杯水。", "Cho tôi một cốc nước."],
        ["茶", "chá", "Trà", "中国人喜欢喝茶。", "Người Trung Quốc thích uống trà."],
        ["米饭", "mǐfàn", "Cơm", "中午我吃米饭。", "Buổi trưa tôi ăn cơm."],
        ["喜欢", "xǐhuan", "Thích", "我喜欢中国菜。", "Tôi thích món Trung Quốc."]
      ], [
        ["喜欢 + danh từ/động từ", "Nói sở thích.", "我喜欢喝茶。", "Tôi thích uống trà."],
        ["……吗？", "Thêm 吗 cuối câu để hỏi có/không.", "你吃米饭吗？", "Bạn ăn cơm không?"]
      ], [
        ["A", "你喜欢喝什么？", "Bạn thích uống gì?"],
        ["B", "我喜欢喝茶，也喜欢喝水。", "Tôi thích uống trà, cũng thích uống nước."]
      ]),
      lesson("hsk1-6", "Mua hàng và hỏi giá", "Hỏi giá, hỏi còn hàng và nói ý định mua.", [
        ["买", "mǎi", "Mua", "我想买这个。", "Tôi muốn mua cái này."],
        ["多少钱", "duōshao qián", "Bao nhiêu tiền", "这个多少钱？", "Cái này bao nhiêu tiền?"],
        ["块", "kuài", "Tệ / đồng (khẩu ngữ)", "这个十块钱。", "Cái này mười tệ."],
        ["有", "yǒu", "Có", "你们有水吗？", "Các bạn có nước không?"],
        ["没有", "méiyǒu", "Không có", "今天没有苹果。", "Hôm nay không có táo."],
        ["贵", "guì", "Đắt", "这个太贵了。", "Cái này đắt quá."]
      ], [
        ["这个多少钱？", "Mẫu hỏi giá cơ bản.", "这杯茶多少钱？", "Cốc trà này bao nhiêu tiền?"],
        ["有 / 没有", "Khẳng định hoặc phủ định sự tồn tại.", "有大的，没有小的。", "Có loại lớn, không có loại nhỏ."]
      ], [
        ["A", "这个杯子多少钱？", "Cái cốc này bao nhiêu tiền?"],
        ["B", "二十块。你要买吗？", "Hai mươi tệ. Bạn muốn mua không?"]
      ]),
      lesson("hsk1-7", "Thời tiết và đi lại", "Mô tả thời tiết và nói mình đi đâu bằng gì.", [
        ["天气", "tiānqì", "Thời tiết", "今天天气很好。", "Hôm nay thời tiết rất đẹp."],
        ["热", "rè", "Nóng", "今天太热了。", "Hôm nay nóng quá."],
        ["冷", "lěng", "Lạnh", "北京冬天很冷。", "Mùa đông Bắc Kinh rất lạnh."],
        ["下雨", "xiàyǔ", "Mưa", "外面下雨了。", "Ngoài trời mưa rồi."],
        ["去", "qù", "Đi", "我去学校。", "Tôi đi học."],
        ["出租车", "chūzūchē", "Taxi", "我们坐出租车去。", "Chúng ta đi bằng taxi."]
      ], [
        ["太 + tính từ + 了", "Nhấn mạnh mức độ quá.", "今天太冷了。", "Hôm nay lạnh quá."],
        ["坐 + phương tiện + 去", "Nói đi bằng phương tiện gì.", "我坐出租车去学校。", "Tôi đi taxi đến trường."]
      ], [
        ["A", "外面下雨了，怎么去学校？", "Ngoài trời mưa rồi, đi đến trường thế nào?"],
        ["B", "我们坐出租车去吧。", "Chúng ta đi taxi nhé."]
      ]),
      lesson("hsk1-8", "Học tập và khả năng", "Nói mình đang học gì, biết làm gì và chưa biết làm gì.", [
        ["学习", "xuéxí", "Học tập", "我学习汉语。", "Tôi học tiếng Trung."],
        ["汉语", "Hànyǔ", "Tiếng Trung", "汉语很有意思。", "Tiếng Trung rất thú vị."],
        ["看书", "kànshū", "Đọc sách", "晚上我喜欢看书。", "Buổi tối tôi thích đọc sách."],
        ["写字", "xiězì", "Viết chữ", "我每天写汉字。", "Mỗi ngày tôi viết chữ Hán."],
        ["会", "huì", "Biết / có thể (kỹ năng)", "我会说一点汉语。", "Tôi biết nói một chút tiếng Trung."],
        ["不会", "bú huì", "Không biết / không thể", "我不会写这个字。", "Tôi không biết viết chữ này."]
      ], [
        ["会 + động từ", "Nói kỹ năng đã biết.", "我会写汉字。", "Tôi biết viết chữ Hán."],
        ["喜欢 + động từ", "Nói hoạt động mình thích.", "我喜欢看书。", "Tôi thích đọc sách."]
      ], [
        ["A", "你会说汉语吗？", "Bạn biết nói tiếng Trung không?"],
        ["B", "我会说一点，也会写几个汉字。", "Tôi biết nói một chút, cũng biết viết vài chữ Hán."]
      ])
    ],
    2: [
      lesson("hsk2-1", "Sinh hoạt mỗi ngày", "Kể lại lịch sinh hoạt từ sáng đến tối.", [
        ["每天", "měitiān", "Mỗi ngày", "我每天学习汉语。", "Mỗi ngày tôi học tiếng Trung."],
        ["早上", "zǎoshang", "Buổi sáng", "我早上七点起床。", "Tôi thức dậy lúc bảy giờ sáng."],
        ["晚上", "wǎnshang", "Buổi tối", "晚上我在家休息。", "Buổi tối tôi nghỉ ở nhà."],
        ["起床", "qǐchuáng", "Thức dậy", "你几点起床？", "Bạn mấy giờ thức dậy?"],
        ["睡觉", "shuìjiào", "Đi ngủ", "我十一点睡觉。", "Tôi đi ngủ lúc mười một giờ."],
        ["时候", "shíhou", "Lúc / khi", "吃饭的时候别看手机。", "Khi ăn đừng xem điện thoại."]
      ], [
        ["……的时候", "Nói thời điểm một việc xảy ra.", "上班的时候我很忙。", "Lúc đi làm tôi rất bận."],
        ["每天都……", "Nói thói quen lặp lại hằng ngày.", "我每天都八点上班。", "Ngày nào tôi cũng đi làm lúc tám giờ."]
      ], [
        ["A", "你每天几点起床？", "Mỗi ngày bạn mấy giờ thức dậy?"],
        ["B", "我早上七点起床，晚上十一点睡觉。", "Tôi dậy lúc bảy giờ sáng, tối mười một giờ đi ngủ."]
      ]),
      lesson("hsk2-2", "Việc đang làm và đã làm", "Phân biệt đang làm, đã xong và từng trải qua.", [
        ["正在", "zhèngzài", "Đang", "我正在看书。", "Tôi đang đọc sách."],
        ["已经", "yǐjīng", "Đã", "我已经到学校了。", "Tôi đã đến trường rồi."],
        ["还", "hái", "Vẫn / còn", "他还在学习。", "Anh ấy vẫn đang học."],
        ["过", "guo", "Đã từng", "我去过中国。", "Tôi đã từng đi Trung Quốc."],
        ["完", "wán", "Xong", "我做完作业了。", "Tôi làm xong bài tập rồi."],
        ["以前", "yǐqián", "Trước đây", "我以前不会说汉语。", "Trước đây tôi không biết nói tiếng Trung."]
      ], [
        ["正在 + động từ", "Việc đang diễn ra ngay lúc nói.", "妹妹正在写作业。", "Em gái đang làm bài tập."],
        ["Động từ + 过", "Nói kinh nghiệm đã từng có.", "我学过一点汉语。", "Tôi từng học một chút tiếng Trung."]
      ], [
        ["A", "作业做完了吗？", "Bài tập làm xong chưa?"],
        ["B", "我正在做，已经做完一半了。", "Tôi đang làm, đã xong một nửa rồi."]
      ]),
      lesson("hsk2-3", "Chỉ đường và giao thông", "Hỏi khoảng cách và chỉ hướng đến một địa điểm.", [
        ["离", "lí", "Cách", "公司离我家很近。", "Công ty cách nhà tôi rất gần."],
        ["远", "yuǎn", "Xa", "火车站有点远。", "Ga tàu hơi xa."],
        ["近", "jìn", "Gần", "超市就在附近，很近。", "Siêu thị ở ngay gần đây, rất gần."],
        ["往", "wǎng", "Về phía", "一直往前走。", "Cứ đi thẳng về phía trước."],
        ["旁边", "pángbiān", "Bên cạnh", "银行在公司旁边。", "Ngân hàng ở cạnh công ty."],
        ["地铁", "dìtiě", "Tàu điện ngầm", "坐地铁很方便。", "Đi tàu điện ngầm rất tiện."]
      ], [
        ["A 离 B + xa/gần", "Diễn tả khoảng cách.", "我家离公司不远。", "Nhà tôi cách công ty không xa."],
        ["往 + hướng + động từ", "Chỉ hướng di chuyển.", "往左走五分钟。", "Đi về bên trái năm phút."]
      ], [
        ["A", "地铁站离这里远吗？", "Ga tàu điện ngầm cách đây xa không?"],
        ["B", "不远，往前走五分钟就在银行旁边。", "Không xa, đi thẳng năm phút là đến cạnh ngân hàng."]
      ]),
      lesson("hsk2-4", "Sức khỏe và đi khám", "Nói triệu chứng đơn giản và hiểu lời khuyên nghỉ ngơi.", [
        ["身体", "shēntǐ", "Cơ thể / sức khỏe", "你身体怎么样？", "Sức khỏe bạn thế nào?"],
        ["生病", "shēngbìng", "Bị ốm", "他今天生病了。", "Hôm nay anh ấy bị ốm."],
        ["医院", "yīyuàn", "Bệnh viện", "我想去医院。", "Tôi muốn đi bệnh viện."],
        ["医生", "yīshēng", "Bác sĩ", "医生让我多休息。", "Bác sĩ bảo tôi nghỉ nhiều."],
        ["药", "yào", "Thuốc", "这个药一天吃两次。", "Thuốc này uống ngày hai lần."],
        ["休息", "xiūxi", "Nghỉ ngơi", "你应该好好休息。", "Bạn nên nghỉ ngơi cho tốt."]
      ], [
        ["应该 + động từ", "Đưa ra lời khuyên.", "你应该去看医生。", "Bạn nên đi khám bác sĩ."],
        ["一天 + số + 次", "Nói số lần trong một ngày.", "这个药一天吃三次。", "Thuốc này uống ba lần một ngày."]
      ], [
        ["A", "你怎么了？", "Bạn làm sao vậy?"],
        ["B", "我生病了，医生说应该多休息。", "Tôi bị ốm, bác sĩ nói nên nghỉ nhiều."]
      ]),
      lesson("hsk2-5", "So sánh", "So sánh hai người, hai vật và nói mức cao nhất.", [
        ["比", "bǐ", "So với", "今天比昨天热。", "Hôm nay nóng hơn hôm qua."],
        ["更", "gèng", "Hơn nữa / càng", "这个方法更简单。", "Cách này đơn giản hơn."],
        ["最", "zuì", "Nhất", "他来得最早。", "Anh ấy đến sớm nhất."],
        ["一样", "yíyàng", "Giống nhau", "这两个颜色一样。", "Hai màu này giống nhau."],
        ["高", "gāo", "Cao", "哥哥比我高。", "Anh trai cao hơn tôi."],
        ["快", "kuài", "Nhanh", "坐地铁比坐车快。", "Đi tàu điện nhanh hơn đi ô tô."]
      ], [
        ["A 比 B + tính từ", "So sánh A với B.", "今天比昨天忙。", "Hôm nay bận hơn hôm qua."],
        ["A 跟 B 一样", "Nói A giống B.", "这个跟那个一样大。", "Cái này lớn bằng cái kia."]
      ], [
        ["A", "坐地铁和坐出租车，哪个更快？", "Đi tàu điện và taxi, cái nào nhanh hơn?"],
        ["B", "坐地铁更快，也更便宜。", "Đi tàu điện nhanh hơn, cũng rẻ hơn."]
      ]),
      lesson("hsk2-6", "Kế hoạch và đề nghị", "Nói điều muốn làm, nên làm và rủ người khác cùng làm.", [
        ["可以", "kěyǐ", "Có thể / được phép", "我可以问一个问题吗？", "Tôi có thể hỏi một câu không?"],
        ["应该", "yīnggāi", "Nên", "我们应该先检查。", "Chúng ta nên kiểm tra trước."],
        ["要", "yào", "Muốn / cần / sẽ", "明天我要上班。", "Ngày mai tôi phải đi làm."],
        ["想", "xiǎng", "Muốn / nghĩ", "我想学习汉语。", "Tôi muốn học tiếng Trung."],
        ["一起", "yìqǐ", "Cùng nhau", "我们一起吃饭吧。", "Chúng ta cùng ăn cơm nhé."],
        ["准备", "zhǔnbèi", "Chuẩn bị", "我在准备明天的会议。", "Tôi đang chuẩn bị cuộc họp ngày mai."]
      ], [
        ["想 / 要 + động từ", "Nói mong muốn hoặc kế hoạch.", "我想去中国工作。", "Tôi muốn sang Trung Quốc làm việc."],
        ["一起……吧", "Rủ người khác cùng làm.", "我们一起学习吧。", "Chúng ta cùng học nhé."]
      ], [
        ["A", "下班以后你想做什么？", "Sau khi tan làm bạn muốn làm gì?"],
        ["B", "我想准备明天的工作，然后一起吃饭吧。", "Tôi muốn chuẩn bị việc ngày mai, rồi cùng ăn cơm nhé."]
      ]),
      lesson("hsk2-7", "Học tập và nhờ giúp", "Nói chưa hiểu, đặt câu hỏi và nhờ người khác giải thích.", [
        ["学习", "xuéxí", "Học tập", "我每天学习两个小时。", "Mỗi ngày tôi học hai giờ."],
        ["问题", "wèntí", "Vấn đề / câu hỏi", "这个问题不难。", "Câu hỏi này không khó."],
        ["明白", "míngbai", "Hiểu", "我不太明白。", "Tôi không hiểu lắm."],
        ["说话", "shuōhuà", "Nói chuyện", "他说话说得很快。", "Anh ấy nói rất nhanh."],
        ["帮助", "bāngzhù", "Giúp đỡ", "谢谢你的帮助。", "Cảm ơn sự giúp đỡ của bạn."],
        ["介绍", "jièshào", "Giới thiệu", "请介绍一下这本书。", "Hãy giới thiệu một chút về quyển sách này."]
      ], [
        ["……得 + tính từ", "Bổ nghĩa cách thực hiện động từ.", "你说得太快了。", "Bạn nói nhanh quá."],
        ["请 + động từ + 一下", "Đề nghị lịch sự, nhẹ nhàng.", "请再说一下。", "Vui lòng nói lại một lần."]
      ], [
        ["A", "这个问题你明白吗？", "Bạn hiểu vấn đề này không?"],
        ["B", "我不太明白，请你再介绍一下。", "Tôi chưa hiểu lắm, vui lòng giới thiệu lại một chút."]
      ]),
      lesson("hsk2-8", "Cuối tuần và hoạt động", "Đọc và kể các hoạt động giải trí quen thuộc vào cuối tuần.", [
        ["周末", "zhōumò", "Cuối tuần", "周末我不上课。", "Cuối tuần tôi không đi học."],
        ["公园", "gōngyuán", "Công viên", "我们去公园走走。", "Chúng ta đi dạo công viên."],
        ["电影", "diànyǐng", "Phim", "这部电影很好看。", "Bộ phim này rất hay."],
        ["运动", "yùndòng", "Vận động / thể thao", "每天运动对身体好。", "Mỗi ngày vận động tốt cho sức khỏe."],
        ["游泳", "yóuyǒng", "Bơi", "夏天我喜欢游泳。", "Mùa hè tôi thích bơi."],
        ["觉得", "juéde", "Cảm thấy / cho rằng", "我觉得今天很开心。", "Tôi cảm thấy hôm nay rất vui."]
      ], [
        ["觉得 + mệnh đề", "Nói cảm nhận hoặc ý kiến.", "我觉得这部电影很好看。", "Tôi thấy bộ phim này rất hay."],
        ["Thời gian + hoạt động", "Nói hoạt động diễn ra lúc nào.", "周末我们去公园。", "Cuối tuần chúng ta đi công viên."]
      ], [
        ["A", "周末你想做什么？", "Cuối tuần bạn muốn làm gì?"],
        ["B", "我想去公园运动，也想看电影。", "Tôi muốn đi công viên vận động, cũng muốn xem phim."]
      ])
    ],
    3: [
      lesson("hsk3-1", "Nguyên nhân và điều kiện", "Nối ý bằng vì–nên, nếu–thì và tuy–nhưng.", [
        ["因为", "yīnwèi", "Bởi vì", "因为下雨，我没去。", "Vì trời mưa nên tôi không đi."],
        ["所以", "suǒyǐ", "Cho nên", "他生病了，所以没上课。", "Anh ấy ốm nên không đi học."],
        ["如果", "rúguǒ", "Nếu", "如果有问题，请告诉我。", "Nếu có vấn đề, hãy nói với tôi."],
        ["就", "jiù", "Thì / liền", "写完作业就可以休息。", "Làm xong bài tập thì có thể nghỉ."],
        ["虽然", "suīrán", "Tuy rằng", "虽然很难，但是我想试试。", "Tuy khó nhưng tôi muốn thử."],
        ["但是", "dànshì", "Nhưng", "他很忙，但是会帮助我。", "Anh ấy rất bận nhưng sẽ giúp tôi."]
      ], [
        ["因为……所以……", "Nêu nguyên nhân rồi kết quả.", "因为下雨，所以我们不去公园。", "Vì trời mưa nên chúng ta không đi công viên."],
        ["如果……就……", "Nêu điều kiện và kết quả.", "如果明天天气好，我们就去爬山。", "Nếu ngày mai thời tiết đẹp, chúng ta sẽ đi leo núi."]
      ], [
        ["A", "你们明天为什么不去爬山？", "Tại sao ngày mai các bạn không đi leo núi?"],
        ["B", "因为可能下雨，所以我们决定在家看书。", "Vì có thể mưa nên chúng tôi quyết định ở nhà đọc sách."]
      ]),
      lesson("hsk3-2", "Trình tự hoạt động", "Kể một hoạt động theo thứ tự trước–sau rõ ràng.", [
        ["先", "xiān", "Trước tiên", "早上先洗脸。", "Buổi sáng trước tiên rửa mặt."],
        ["然后", "ránhòu", "Sau đó", "然后吃早饭。", "Sau đó ăn sáng."],
        ["最后", "zuìhòu", "Cuối cùng", "最后去学校。", "Cuối cùng đi đến trường."],
        ["开始", "kāishǐ", "Bắt đầu", "汉语课九点开始。", "Lớp tiếng Trung bắt đầu lúc chín giờ."],
        ["结束", "jiéshù", "Kết thúc", "电影已经结束了。", "Bộ phim đã kết thúc."],
        ["继续", "jìxù", "Tiếp tục", "休息以后继续看书。", "Sau khi nghỉ thì tiếp tục đọc sách."]
      ], [
        ["先……然后……最后……", "Trình bày ba bước liên tiếp.", "先洗菜，然后做饭，最后一起吃。", "Đầu tiên rửa rau, sau đó nấu cơm, cuối cùng cùng ăn."],
        ["Động từ + 以后", "Sau khi làm xong việc gì.", "下课以后继续看书。", "Sau khi tan học tiếp tục đọc sách."]
      ], [
        ["A", "这个菜怎么做？", "Món này làm thế nào?"],
        ["B", "先洗菜，然后切好，最后放进锅里。", "Trước tiên rửa rau, sau đó cắt xong, cuối cùng cho vào nồi."]
      ]),
      lesson("hsk3-3", "Sắp xếp và giải quyết", "Nói cách sắp xếp việc thường ngày và giải quyết một vấn đề.", [
        ["安排", "ānpái", "Sắp xếp", "我安排好了周末的旅行。", "Tôi đã sắp xếp xong chuyến đi cuối tuần."],
        ["负责", "fùzé", "Phụ trách", "她负责这次班级活动。", "Cô ấy phụ trách hoạt động của lớp lần này."],
        ["检查", "jiǎnchá", "Kiểm tra", "请检查你的作业。", "Hãy kiểm tra bài tập của bạn."],
        ["发现", "fāxiàn", "Phát hiện", "我发现书包不见了。", "Tôi phát hiện cặp sách bị mất."],
        ["解决", "jiějué", "Giải quyết", "这个问题已经解决了。", "Vấn đề này đã được giải quyết."],
        ["需要", "xūyào", "Cần", "我需要老师的帮助。", "Tôi cần sự giúp đỡ của giáo viên."]
      ], [
        ["负责 + danh từ/động từ", "Nói phạm vi trách nhiệm.", "我负责准备这次活动。", "Tôi phụ trách chuẩn bị hoạt động lần này."],
        ["需要 + động từ", "Nói hành động cần thực hiện.", "发现问题以后需要马上处理。", "Phát hiện vấn đề xong cần xử lý ngay."]
      ], [
        ["A", "谁负责检查这个问题？", "Ai phụ trách kiểm tra vấn đề này?"],
        ["B", "老师安排我检查，我发现问题以后会马上解决。", "Giáo viên sắp xếp tôi kiểm tra, phát hiện vấn đề xong tôi sẽ giải quyết ngay."]
      ]),
      lesson("hsk3-4", "Số lượng và kết quả", "Báo cáo con số, mức tăng giảm và kết quả ước lượng.", [
        ["数量", "shùliàng", "Số lượng", "参加活动的人数很多。", "Số người tham gia hoạt động rất nhiều."],
        ["结果", "jiéguǒ", "Kết quả", "考试结果很不错。", "Kết quả thi khá tốt."],
        ["增加", "zēngjiā", "Tăng lên", "学习的人数增加了。", "Số người học đã tăng."],
        ["减少", "jiǎnshǎo", "Giảm xuống", "每天运动可以减少压力。", "Vận động mỗi ngày có thể giảm áp lực."],
        ["大概", "dàgài", "Khoảng / đại khái", "教室里大概有三十个人。", "Trong lớp có khoảng ba mươi người."],
        ["左右", "zuǒyòu", "Khoảng", "需要两个小时左右。", "Cần khoảng hai giờ."]
      ], [
        ["Số + 左右", "Nói con số xấp xỉ.", "教室里有三十个人左右。", "Trong lớp có khoảng ba mươi người."],
        ["增加/减少 + 了", "Mô tả sự thay đổi đã xảy ra.", "参加的人数增加了十个。", "Số người tham gia tăng thêm mười người."]
      ], [
        ["A", "这次活动有多少人参加？", "Hoạt động lần này có bao nhiêu người tham gia?"],
        ["B", "大概有五十个人左右，比上次增加了十个。", "Khoảng năm mươi người, tăng mười người so với lần trước."]
      ]),
      lesson("hsk3-5", "Trao đổi ý kiến", "Đồng ý, đưa đề xuất, giải thích và thông báo cho người khác.", [
        ["同意", "tóngyì", "Đồng ý", "我同意这个方案。", "Tôi đồng ý phương án này."],
        ["认为", "rènwéi", "Cho rằng", "我认为需要再检查。", "Tôi cho rằng cần kiểm tra lại."],
        ["建议", "jiànyì", "Đề nghị / kiến nghị", "我建议每天读一篇文章。", "Tôi đề nghị mỗi ngày đọc một bài."],
        ["解释", "jiěshì", "Giải thích", "请解释一下原因。", "Vui lòng giải thích nguyên nhân."],
        ["联系", "liánxì", "Liên hệ", "到了北京以后请联系我。", "Sau khi đến Bắc Kinh hãy liên hệ tôi."],
        ["通知", "tōngzhī", "Thông báo", "处理完以后通知我。", "Xử lý xong hãy thông báo cho tôi."]
      ], [
        ["我认为 / 我建议……", "Nêu quan điểm hoặc đề xuất lịch sự.", "我建议今天完成。", "Tôi đề nghị hoàn thành hôm nay."],
        ["……以后通知……", "Yêu cầu báo lại sau khi hoàn thành.", "决定以后通知大家。", "Quyết định xong hãy thông báo mọi người."]
      ], [
        ["A", "你认为应该怎么处理？", "Bạn cho rằng nên xử lý thế nào?"],
        ["B", "我建议先联系老师，解释清楚以后再通知大家。", "Tôi đề nghị liên hệ giáo viên trước, giải thích rõ rồi thông báo mọi người."]
      ]),
      lesson("hsk3-6", "Thái độ và yêu cầu", "Nói về chất lượng, kết quả đạt yêu cầu và thái độ học tập.", [
        ["质量", "zhìliàng", "Chất lượng", "这本书的质量很好。", "Chất lượng quyển sách này rất tốt."],
        ["合格", "hégé", "Đạt tiêu chuẩn", "他的考试成绩合格了。", "Kết quả thi của anh ấy đã đạt."],
        ["重要", "zhòngyào", "Quan trọng", "每天复习很重要。", "Ôn tập mỗi ngày rất quan trọng."],
        ["清楚", "qīngchu", "Rõ ràng", "请写清楚问题原因。", "Hãy viết rõ nguyên nhân vấn đề."],
        ["注意", "zhùyì", "Chú ý", "写字时要注意笔顺。", "Khi viết chữ cần chú ý thứ tự nét."],
        ["认真", "rènzhēn", "Nghiêm túc / kỹ", "他学习很认真。", "Anh ấy học rất nghiêm túc."]
      ], [
        ["要注意……", "Nhắc điều cần chú ý.", "考试时要注意看清题目。", "Khi thi cần chú ý đọc rõ đề."],
        ["Động từ + 清楚", "Thực hiện đến mức rõ ràng.", "请把要求说清楚。", "Hãy nói rõ yêu cầu."]
      ], [
        ["A", "这次考试合格了吗？", "Kỳ thi lần này đạt chưa?"],
        ["B", "基本合格，但是有两个问题需要认真检查。", "Cơ bản đã đạt, nhưng có hai vấn đề cần kiểm tra kỹ."]
      ]),
      lesson("hsk3-7", "Du lịch và sự cố", "Kể một chuyến đi, nói sự lo lắng và kết quả cuối cùng.", [
        ["旅行", "lǚxíng", "Du lịch", "我喜欢一个人旅行。", "Tôi thích đi du lịch một mình."],
        ["行李", "xíngli", "Hành lý", "我的行李不见了。", "Hành lý của tôi bị mất."],
        ["护照", "hùzhào", "Hộ chiếu", "出国不能忘记护照。", "Ra nước ngoài không thể quên hộ chiếu."],
        ["迟到", "chídào", "Đến muộn", "因为堵车，我迟到了。", "Vì tắc đường nên tôi đến muộn."],
        ["担心", "dānxīn", "Lo lắng", "别担心，我们来得及。", "Đừng lo, chúng ta vẫn kịp."],
        ["终于", "zhōngyú", "Cuối cùng cũng", "我终于找到行李了。", "Cuối cùng tôi cũng tìm thấy hành lý."]
      ], [
        ["别 + động từ", "Khuyên ai đừng làm hoặc đừng lo.", "别担心，也别着急。", "Đừng lo, cũng đừng vội."],
        ["终于 + động từ", "Việc mong đợi lâu cuối cùng xảy ra.", "飞机终于到了。", "Máy bay cuối cùng cũng đến."]
      ], [
        ["A", "你为什么迟到了？", "Tại sao bạn đến muộn?"],
        ["B", "我的行李丢了，我很担心，后来终于找到了。", "Hành lý của tôi bị mất, tôi rất lo, sau đó cuối cùng cũng tìm thấy."]
      ]),
      lesson("hsk3-8", "Đọc, viết và tiến bộ", "Nói về nội dung đã học và phương pháp cải thiện tiếng Trung.", [
        ["文章", "wénzhāng", "Bài văn / bài viết", "这篇文章不太难。", "Bài viết này không khó lắm."],
        ["句子", "jùzi", "Câu", "请用这个词写一个句子。", "Hãy dùng từ này viết một câu."],
        ["意思", "yìsi", "Ý nghĩa", "这个句子是什么意思？", "Câu này có nghĩa là gì?"],
        ["练习", "liànxí", "Luyện tập / bài tập", "每天都要练习听力。", "Mỗi ngày đều phải luyện nghe."],
        ["提高", "tígāo", "Nâng cao", "我想提高口语。", "Tôi muốn nâng cao khẩu ngữ."],
        ["方法", "fāngfǎ", "Phương pháp", "这个学习方法很有用。", "Phương pháp học này rất hữu ích."]
      ], [
        ["用 A + động từ + B", "Dùng A để làm B.", "用这个词写句子。", "Dùng từ này viết câu."],
        ["想提高……", "Nói kỹ năng muốn cải thiện.", "我想提高听力和口语。", "Tôi muốn nâng cao nghe và nói."]
      ], [
        ["A", "你用什么方法学习汉语？", "Bạn dùng phương pháp gì học tiếng Trung?"],
        ["B", "我每天读文章、写句子，还练习听力和口语。", "Mỗi ngày tôi đọc bài, viết câu, còn luyện nghe và nói."]
      ])
    ],
    4: [
      lesson("hsk4-1", "Liên kết ý phức tạp", "Dùng các cặp liên từ để trình bày ý mạch lạc hơn.", [
        ["不仅", "bùjǐn", "Không chỉ", "他不仅会说，还会写。", "Anh ấy không chỉ biết nói mà còn biết viết."],
        ["而且", "érqiě", "Mà còn / hơn nữa", "这个方法简单而且有效。", "Phương pháp này đơn giản và hiệu quả."],
        ["即使", "jíshǐ", "Cho dù", "即使很忙，我也会学习。", "Cho dù bận tôi vẫn sẽ học."],
        ["也", "yě", "Cũng / vẫn", "有问题也不要着急。", "Có vấn đề cũng đừng vội."],
        ["只要", "zhǐyào", "Chỉ cần", "只要检查清楚就可以。", "Chỉ cần kiểm tra rõ là được."],
        ["仍然", "réngrán", "Vẫn", "修改以后仍然有错误。", "Sau khi sửa vẫn có lỗi."]
      ], [
        ["不仅……而且……", "Bổ sung hai đặc điểm cùng chiều.", "他不仅认真，而且很有经验。", "Anh ấy không chỉ nghiêm túc mà còn giàu kinh nghiệm."],
        ["即使……也……", "Kết quả không đổi dù có điều kiện cản trở.", "即使没有时间，也要检查。", "Dù không có thời gian vẫn phải kiểm tra."]
      ], [
        ["A", "这个问题修改以后怎么样？", "Vấn đề này sau khi sửa thế nào?"],
        ["B", "不仅没有解决，而且仍然影响我们的学习。", "Không những chưa giải quyết mà vẫn còn ảnh hưởng việc học của chúng ta."]
      ]),
      lesson("hsk4-2", "Kế hoạch và mục tiêu", "Trình bày kế hoạch học tập, trách nhiệm và tiến độ đạt mục tiêu.", [
        ["计划", "jìhuà", "Kế hoạch", "我需要调整学习计划。", "Tôi cần điều chỉnh kế hoạch học tập."],
        ["进度", "jìndù", "Tiến độ", "目前复习进度有点慢。", "Tiến độ ôn tập hiện tại hơi chậm."],
        ["责任", "zérèn", "Trách nhiệm", "这是我的责任。", "Đây là trách nhiệm của tôi."],
        ["任务", "rènwu", "Nhiệm vụ", "今天的学习任务已经完成。", "Nhiệm vụ học hôm nay đã hoàn thành."],
        ["经验", "jīngyàn", "Kinh nghiệm", "他有丰富的学习经验。", "Anh ấy có kinh nghiệm học tập phong phú."],
        ["效率", "xiàolǜ", "Hiệu suất", "这个方法提高了学习效率。", "Phương pháp này nâng cao hiệu suất học tập."]
      ], [
        ["按照 + kế hoạch/quy định", "Làm theo căn cứ đã định.", "请按照计划完成任务。", "Hãy hoàn thành nhiệm vụ theo kế hoạch."],
        ["提高 + danh từ", "Nâng cao một chỉ tiêu.", "这个方法能提高效率。", "Cách này có thể nâng cao hiệu suất."]
      ], [
        ["A", "目前复习进度怎么样？", "Tiến độ ôn tập hiện tại thế nào?"],
        ["B", "任务完成了百分之八十，效率比以前高。", "Nhiệm vụ đã hoàn thành tám mươi phần trăm, hiệu suất cao hơn trước."]
      ]),
      lesson("hsk4-3", "Phân tích vấn đề", "Trình bày nguyên nhân, ảnh hưởng và phương án phòng tránh.", [
        ["原因", "yuányīn", "Nguyên nhân", "我们正在了解事情的原因。", "Chúng tôi đang tìm hiểu nguyên nhân sự việc."],
        ["影响", "yǐngxiǎng", "Ảnh hưởng", "睡眠不足会影响学习。", "Thiếu ngủ sẽ ảnh hưởng việc học."],
        ["处理", "chǔlǐ", "Xử lý", "这件事情已经处理好了。", "Việc này đã được xử lý xong."],
        ["情况", "qíngkuàng", "Tình hình / trường hợp", "请说明实际情况。", "Vui lòng nói rõ tình hình thực tế."],
        ["发生", "fāshēng", "Xảy ra", "昨天发生了一件有趣的事。", "Hôm qua xảy ra một chuyện thú vị."],
        ["避免", "bìmiǎn", "Tránh", "要避免同样的问题再次发生。", "Cần tránh vấn đề tương tự xảy ra lần nữa."]
      ], [
        ["为了避免……", "Nêu mục đích phòng tránh.", "为了避免迟到，我每天早起。", "Để tránh đến muộn, tôi dậy sớm mỗi ngày."],
        ["对……有影响", "Nói ảnh hưởng lên đối tượng.", "睡眠对学习有很大影响。", "Giấc ngủ ảnh hưởng lớn đến việc học."]
      ], [
        ["A", "你最近为什么总是迟到？", "Gần đây tại sao bạn luôn đến muộn?"],
        ["B", "主要原因是睡得太晚，我正在调整，避免再次发生。", "Nguyên nhân chính là ngủ quá muộn, tôi đang điều chỉnh để tránh xảy ra lần nữa."]
      ]),
      lesson("hsk4-4", "Thông tin và phân tích", "Đọc thông tin, phân tích số liệu và trình bày kết luận có căn cứ.", [
        ["报告", "bàogào", "Báo cáo", "我正在写一份调查报告。", "Tôi đang viết một báo cáo khảo sát."],
        ["数据", "shùjù", "Dữ liệu", "这些学习数据很有用。", "Những dữ liệu học tập này rất hữu ích."],
        ["分析", "fēnxī", "Phân tích", "我们需要分析考试结果。", "Chúng ta cần phân tích kết quả thi."],
        ["说明", "shuōmíng", "Giải thích / thuyết minh", "请说明数据来源。", "Vui lòng nói rõ nguồn dữ liệu."],
        ["总结", "zǒngjié", "Tổng kết", "课程结束后要做总结。", "Sau khi khóa học kết thúc cần làm tổng kết."],
        ["证明", "zhèngmíng", "Chứng minh", "这些数据证明方法有效。", "Những dữ liệu này chứng minh cách làm hiệu quả."]
      ], [
        ["根据 + căn cứ", "Nêu nguồn làm căn cứ.", "根据报告，学生的成绩提高了。", "Theo báo cáo, thành tích của học sinh đã tăng."],
        ["数据表明/证明……", "Dùng dữ liệu để đưa ra kết luận.", "数据表明这个方法有效。", "Dữ liệu cho thấy phương pháp này hiệu quả."]
      ], [
        ["A", "报告分析出什么结果？", "Báo cáo phân tích ra kết quả gì?"],
        ["B", "数据证明每天复习很有效，我会在总结里说明。", "Dữ liệu chứng minh ôn tập mỗi ngày rất hiệu quả, tôi sẽ giải thích trong phần tổng kết."]
      ]),
      lesson("hsk4-5", "Thảo luận và quyết định", "Trao đổi lựa chọn, điều kiện và phản hồi đồng ý hoặc từ chối.", [
        ["讨论", "tǎolùn", "Thảo luận", "我们需要讨论这个方案。", "Chúng ta cần thảo luận phương án này."],
        ["选择", "xuǎnzé", "Lựa chọn", "你可以选择两个方法。", "Bạn có thể chọn hai phương pháp."],
        ["决定", "juédìng", "Quyết định", "我决定明天开始复习。", "Tôi quyết định ngày mai bắt đầu ôn tập."],
        ["接受", "jiēshòu", "Chấp nhận", "父母接受了我的选择。", "Bố mẹ đã chấp nhận lựa chọn của tôi."],
        ["拒绝", "jùjué", "Từ chối", "他拒绝了这个要求。", "Anh ấy từ chối yêu cầu này."],
        ["条件", "tiáojiàn", "Điều kiện", "这个条件我们不能接受。", "Điều kiện này chúng tôi không thể chấp nhận."]
      ], [
        ["在……条件下", "Nói trong điều kiện nào.", "在时间允许的条件下我会参加。", "Trong điều kiện thời gian cho phép tôi sẽ tham gia."],
        ["经过讨论，决定……", "Nêu quyết định sau thảo luận.", "经过讨论，我们决定一起学习。", "Sau thảo luận, chúng tôi quyết định học cùng nhau."]
      ], [
        ["A", "大家接受这个学习计划吗？", "Mọi người có chấp nhận kế hoạch học này không?"],
        ["B", "经过讨论，大家接受了大部分内容，但决定修改日期。", "Sau thảo luận, mọi người chấp nhận phần lớn nội dung nhưng quyết định sửa ngày."]
      ]),
      lesson("hsk4-6", "Thay đổi và cải tiến", "Đánh giá thành công, thất bại và điều chỉnh phương án cho phù hợp.", [
        ["改变", "gǎibiàn", "Thay đổi", "学习汉语改变了我的生活。", "Học tiếng Trung thay đổi cuộc sống của tôi."],
        ["改进", "gǎijìn", "Cải tiến", "我们要改进学习方法。", "Chúng ta phải cải tiến phương pháp học."],
        ["调整", "tiáozhěng", "Điều chỉnh", "请调整复习计划。", "Hãy điều chỉnh kế hoạch ôn tập."],
        ["适合", "shìhé", "Phù hợp", "这个方法更适合初学者。", "Phương pháp này phù hợp người mới học hơn."],
        ["成功", "chénggōng", "Thành công", "她终于通过了考试。", "Cuối cùng cô ấy đã thi đỗ."],
        ["失败", "shībài", "Thất bại", "失败以后不要放弃。", "Sau thất bại đừng bỏ cuộc."]
      ], [
        ["适合 + đối tượng", "Nói mức phù hợp với ai/cái gì.", "这本书很适合初学者。", "Quyển sách này rất phù hợp người mới học."],
        ["通过……来改进……", "Nêu cách dùng để cải thiện.", "通过练习来改进发音。", "Thông qua luyện tập để cải thiện phát âm."]
      ], [
        ["A", "新的学习方法成功吗？", "Phương pháp học mới có thành công không?"],
        ["B", "第一次失败了，调整以后更适合我，现在进步很快。", "Lần đầu thất bại, sau điều chỉnh phù hợp với tôi hơn, giờ tiến bộ rất nhanh."]
      ]),
      lesson("hsk4-7", "Công nghệ và môi trường", "Đọc về công nghệ, thông tin, môi trường và an toàn trong đời sống.", [
        ["网络", "wǎngluò", "Mạng", "今天家里的网络不稳定。", "Hôm nay mạng ở nhà không ổn định."],
        ["技术", "jìshù", "Kỹ thuật / công nghệ", "这个技术给生活带来方便。", "Công nghệ này mang lại thuận tiện cho cuộc sống."],
        ["信息", "xìnxī", "Thông tin", "不要在网上公开个人信息。", "Đừng công khai thông tin cá nhân trên mạng."],
        ["发展", "fāzhǎn", "Phát triển", "人工智能发展得很快。", "Trí tuệ nhân tạo phát triển rất nhanh."],
        ["环境", "huánjìng", "Môi trường", "我们应该保护自然环境。", "Chúng ta nên bảo vệ môi trường tự nhiên."],
        ["安全", "ānquán", "An toàn", "网络安全非常重要。", "An toàn mạng rất quan trọng."]
      ], [
        ["越来越 + tính từ", "Mức độ tăng dần theo thời gian.", "网络速度越来越快。", "Tốc độ mạng ngày càng nhanh."],
        ["在……方面", "Khoanh phạm vi đang nói.", "在数据安全方面要更小心。", "Về mặt an toàn dữ liệu cần cẩn thận hơn."]
      ], [
        ["A", "新技术对生活有什么影响？", "Công nghệ mới ảnh hưởng gì đến cuộc sống?"],
        ["B", "生活越来越方便，但是在信息安全方面要特别注意。", "Cuộc sống ngày càng thuận tiện, nhưng về an toàn thông tin phải đặc biệt chú ý."]
      ]),
      lesson("hsk4-8", "Văn hóa và thích nghi", "Giao tiếp tôn trọng khác biệt và kể quá trình thích nghi môi trường mới.", [
        ["文化", "wénhuà", "Văn hóa", "我对中国文化很感兴趣。", "Tôi rất hứng thú với văn hóa Trung Quốc."],
        ["习惯", "xíguàn", "Thói quen / quen", "我还不习惯这里的天气。", "Tôi vẫn chưa quen thời tiết ở đây."],
        ["交流", "jiāoliú", "Giao tiếp / trao đổi", "多交流可以提高口语。", "Giao tiếp nhiều có thể nâng cao khẩu ngữ."],
        ["理解", "lǐjiě", "Hiểu / thông cảm", "谢谢你的理解。", "Cảm ơn sự thông cảm của bạn."],
        ["尊重", "zūnzhòng", "Tôn trọng", "我们应该尊重文化差异。", "Chúng ta nên tôn trọng khác biệt văn hóa."],
        ["适应", "shìyìng", "Thích nghi", "我慢慢适应了新的生活。", "Tôi dần thích nghi cuộc sống mới."]
      ], [
        ["对……感兴趣", "Nói hứng thú với điều gì.", "我对中国历史很感兴趣。", "Tôi hứng thú với lịch sử Trung Quốc."],
        ["慢慢/逐渐 + động từ", "Quá trình thay đổi dần dần.", "我逐渐适应了这里的生活。", "Tôi dần thích nghi cuộc sống ở đây."]
      ], [
        ["A", "你适应在中国的生活了吗？", "Bạn đã thích nghi cuộc sống ở Trung Quốc chưa?"],
        ["B", "我还在学习。多交流、互相理解和尊重很重要。", "Tôi vẫn đang học. Trao đổi nhiều, hiểu và tôn trọng lẫn nhau rất quan trọng."]
      ])
    ]
  };

  var levelDescriptions = {
    0: "Pinyin & nét cơ bản",
    1: "Từ và câu nền tảng",
    2: "Sinh hoạt thường ngày",
    3: "Đọc đoạn ngắn",
    4: "Đọc hiểu nâng cao",
    5: "Sắp mở",
    6: "Sắp mở",
    7: "Sắp mở",
    8: "Sắp mở",
    9: "Sắp mở"
  };
  levels[5] = [];
  levels[6] = [];
  levels[7] = [];
  levels[8] = [];
  levels[9] = [];
  var progressKey = "erp-hsk-progress-v2";
  var stateKey = "erp-hsk-state-v2";
  var selectedLevel = 0;
  var selectedLesson = 0;
  var completed = {};
  var quiz = { lessonId: "", index: 0, score: 0, answered: false, selected: -1 };
  var writingState = { lessonId: "", wordIndex: 0, charIndex: 0 };
  var activeWriter = null;
  var writingAnimating = false;
  var writingPaused = false;
  var lessonSectionIndex = 0;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }
  function loadState() {
    try {
      var savedState = JSON.parse(localStorage.getItem(stateKey) || "{}");
      if (savedState.level >= 0 && savedState.level <= 4) selectedLevel = savedState.level;
      if (savedState.lesson >= 0 && savedState.lesson < levels[selectedLevel].length) selectedLesson = savedState.lesson;
    } catch (error) {}
    try { completed = JSON.parse(localStorage.getItem(progressKey) || "{}"); } catch (error) { completed = {}; }
  }
  function saveState() {
    try {
      localStorage.setItem(stateKey, JSON.stringify({ level: selectedLevel, lesson: selectedLesson }));
      localStorage.setItem(progressKey, JSON.stringify(completed));
    } catch (error) {}
  }
  function reading(value, fallbackPinyin) {
    try {
      if (root.ERPPronunciation && typeof root.ERPPronunciation.generate === "function") {
        var result = root.ERPPronunciation.generate(value);
        if (result && result.pinyin) return result;
      }
    } catch (error) {}
    return { pinyin: fallbackPinyin || "", nearVi: "Đang nạp…" };
  }
  function speak(value, rate) {
    if (!value || !root.speechSynthesis) return;
    root.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "zh-CN";
    utterance.rate = rate || 0.72;
    var voices = root.speechSynthesis.getVoices();
    var voice = null;
    for (var i = 0; i < voices.length; i++) {
      if (/google|microsoft/i.test(voices[i].name) && /^zh/i.test(voices[i].lang)) { voice = voices[i]; break; }
      if (!voice && /^zh/i.test(voices[i].lang)) voice = voices[i];
    }
    if (voice) utterance.voice = voice;
    root.speechSynthesis.speak(utterance);
  }
  function levelCompleted(level) {
    var count = 0;
    for (var i = 0; i < levels[level].length; i++) if (completed[levels[level][i].id]) count++;
    return count;
  }
  function currentLesson() { return levels[selectedLevel][selectedLesson]; }
  function resetQuiz() {
    quiz = { lessonId: currentLesson().id, index: 0, score: 0, answered: false, selected: -1 };
  }
  function resetWriting() {
    writingState = { lessonId: currentLesson().id, wordIndex: 0, charIndex: 0 };
    activeWriter = null;
    writingAnimating = false;
    writingPaused = false;
  }
  function poolForLevel(level) {
    var pool = [];
    for (var i = 0; i < levels[level].length; i++) pool = pool.concat(levels[level][i].words);
    return pool;
  }
  function quizOptions(word, questionIndex) {
    var pool = poolForLevel(selectedLevel);
    var output = [word];
    var cursor = (selectedLesson * 17 + questionIndex * 11 + 7) % pool.length;
    while (output.length < 4) {
      var candidate = pool[cursor % pool.length];
      var exists = false;
      for (var i = 0; i < output.length; i++) if (output[i][2] === candidate[2]) exists = true;
      if (!exists) output.push(candidate);
      cursor += 13;
    }
    var shift = (selectedLesson + questionIndex) % output.length;
    return output.slice(shift).concat(output.slice(0, shift));
  }
  function renderLevels() {
    var html = "";
    var roadmap = [
      { level: 0, label: "Nền tảng", medal: "基", description: "Phát âm & chữ Hán" },
      { level: 1, label: "HSK 1", medal: "壹", description: "Nhập môn" },
      { level: 2, label: "HSK 2", medal: "贰", description: "Sơ cấp" },
      { level: 3, label: "HSK 3", medal: "叁", description: "Tiền trung cấp" },
      { level: 4, label: "HSK 4", medal: "肆", description: "Trung cấp" },
      { level: 5, label: "HSK 5", medal: "伍", description: "Trung cấp cao" },
      { level: 6, label: "HSK 6", medal: "陆", description: "Nâng cao" },
      { level: 7, label: "HSK 7–9", medal: "柒", description: "Thành thạo" }
    ];
    for (var index = 0; index < roadmap.length; index++) {
      var item = roadmap[index];
      var level = item.level;
      var locked = level >= 5;
      var finished = !locked && levels[level].length && levelCompleted(level) === levels[level].length;
      html += '<button class="hsk-level level-' + level + (selectedLevel === level ? " active" : "") + (finished ? " complete" : "") + (locked ? " locked" : "") + '" data-hsk-level="' + level + '"' + (locked ? " disabled" : "") + '><span class="hsk-level-medal" aria-hidden="true">' + item.medal + '</span><span class="hsk-level-copy"><strong>' + item.label + '</strong><small>' + (locked ? item.description + " · Sắp mở" : levelCompleted(level) + "/" + levels[level].length + " bài · " + item.description) + "</small></span></button>";
    }
    byId("hskLevels").innerHTML = html;
  }
  function renderLessonList() {
    var done = levelCompleted(selectedLevel);
    var percent = Math.round(done * 100 / levels[selectedLevel].length);
    byId("hskProgress").innerHTML = '<div class="hsk-progress"><strong>Tiến độ ' + (selectedLevel === 0 ? "Nền tảng" : "HSK " + selectedLevel) + '</strong><span>' + done + "/" + levels[selectedLevel].length + " bài đã hoàn thành</span><div class=\"hsk-progress-bar\"><i style=\"width:" + percent + '%\"></i></div></div>';
    var html = "";
    for (var i = 0; i < levels[selectedLevel].length; i++) {
      var item = levels[selectedLevel][i];
      html += '<button class="hsk-lesson-link' + (selectedLesson === i ? " active" : "") + (completed[item.id] ? " done" : "") + '" data-hsk-lesson="' + i + '"><span class="hsk-lesson-number">' + (completed[item.id] ? "✓" : (i + 1)) + "</span><span><strong>" + escapeHtml(item.title) + "</strong><small>" + (item.foundation ? item.items.length + " nội dung nền tảng" : "6 từ · viết · đọc · nghe") + "</small></span>" + (completed[item.id] ? '<span class="hsk-check">✓</span>' : "") + "</button>";
    }
    byId("hskLessonList").innerHTML = html;
  }
  function renderWords(item) {
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>1. Từ mới</h4><span>Nhấn ♪ để nghe từng từ và câu mẫu</span></div><div class="hsk-word-grid">';
    for (var i = 0; i < item.words.length; i++) {
      var word = item.words[i];
      var wordReading = reading(word[0], word[1]);
      html += '<article class="hsk-word"><button class="hsk-speak" data-hsk-speak="' + escapeHtml(word[0]) + '" aria-label="Nghe ' + escapeHtml(word[0]) + '">♪</button><strong>' + escapeHtml(word[0]) + "</strong><b>" + escapeHtml(word[1]) + '</b><i>Gần âm: ' + escapeHtml(wordReading.nearVi) + "</i><p>" + escapeHtml(word[2]) + '</p><small><button class="hsk-speak hsk-example-speak" data-hsk-speak="' + escapeHtml(word[3]) + '" aria-label="Nghe câu mẫu">句</button>' + escapeHtml(word[3]) + "<br>" + escapeHtml(word[4]) + "</small></article>";
    }
    return html + "</div></div>";
  }
  function renderGrammar(item) {
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>2. Mẫu ngữ pháp</h4><span>Học theo cấu trúc, không học vẹt từng chữ</span></div><div class="hsk-grammar-grid">';
    for (var i = 0; i < item.grammar.length; i++) {
      var rule = item.grammar[i];
      html += '<article class="hsk-grammar"><strong>' + escapeHtml(rule[0]) + "</strong><p>" + escapeHtml(rule[1]) + "</p><span>" + escapeHtml(rule[2]) + "</span><small>" + escapeHtml(rule[3]) + "</small></article>";
    }
    return html + "</div></div>";
  }
  function practiceWords(item) { return item.practiceWords || item.words || []; }
  function wordCharacters(word) {
    var matches = String(word || "").match(/[\u3400-\u9fff]/g);
    return matches || [];
  }
  function renderWriting(item, sectionNumber) {
    var words = practiceWords(item);
    if (!words.length) return "";
    if (writingState.lessonId !== item.id) resetWriting();
    if (writingState.wordIndex >= words.length) writingState.wordIndex = 0;
    var selected = words[writingState.wordIndex];
    var characters = wordCharacters(selected[0]);
    if (!characters.length) return "";
    if (writingState.charIndex >= characters.length) writingState.charIndex = 0;
    var currentCharacter = characters[writingState.charIndex];
    var generated = reading(currentCharacter, "");
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>' + sectionNumber + '. Hán tự và thứ tự nét</h4><span>Xem mẫu, tự viết trên màn hình rồi luyện lại vào vở</span></div><div class="hsk-writing-layout"><div class="hsk-character-picker">';
    for (var i = 0; i < words.length; i++) html += '<button class="' + (writingState.wordIndex === i ? "active" : "") + '" data-hsk-write-word="' + i + '">' + escapeHtml(words[i][0]) + "</button>";
    html += '</div><div class="hsk-writing-card"><div class="hsk-teacher-line"><span class="hsk-teacher-avatar">师</span><p><strong>Cô Nhung đang viết chữ ' + escapeHtml(currentCharacter) + '</strong><br>Từ <b>' + escapeHtml(selected[0]) + '</b> · chữ ' + (writingState.charIndex + 1) + "/" + characters.length + '. Xem hướng nét, tạm dừng ở chữ nhiều nét, tự viết trên màn hình hoặc luyện lại vào vở.</p></div><div class="hsk-copy-model"><strong>' + escapeHtml(currentCharacter) + '</strong><span>' + escapeHtml(generated.pinyin || selected[1]) + '</span><i>' + escapeHtml(selected[2]) + '</i></div><div class="hsk-stroke-stage" id="hskStrokeTarget" aria-label="Ô luyện viết chữ ' + escapeHtml(currentCharacter) + '"></div><div class="hsk-writing-tools"><button class="muted" data-hsk-action="write-prev">← Chữ trước</button><button class="accent" data-hsk-action="write-replay">▶ Xem viết mẫu</button><button class="muted" id="hskPauseWriting" data-hsk-action="write-pause">⏸ Tạm dừng</button><button class="muted" data-hsk-action="write-practice">✍ Tự viết trên màn hình</button><button class="muted" data-hsk-action="write-next">Chữ tiếp →</button><button class="hsk-speak" data-hsk-speak="' + escapeHtml(selected[0]) + '">♪ Nghe từ</button></div><p class="hsk-writing-status" id="hskWritingStatus">Đang tải dữ liệu nét chữ…</p></div></div></div>';
    return html;
  }
  function readingPassage(item) {
    var zh = [], vi = [];
    for (var i = 0; i < item.dialogue.length; i++) { zh.push(item.dialogue[i][1]); vi.push(item.dialogue[i][2]); }
    return { zh: zh.join(" "), vi: vi.join(" ") };
  }
  function renderReading(item, sectionNumber) {
    var passage = readingPassage(item);
    var passageReading = reading(passage.zh, "");
    var otherLevel = levels[selectedLevel];
    var options = [passage.vi];
    for (var cursor = 1; options.length < 3 && cursor < otherLevel.length; cursor++) {
      var candidate = readingPassage(otherLevel[(selectedLesson + cursor) % otherLevel.length]).vi;
      if (options.indexOf(candidate) === -1) options.push(candidate);
    }
    var shift = (selectedLesson + selectedLevel) % options.length;
    options = options.slice(shift).concat(options.slice(0, shift));
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>' + sectionNumber + '. Đọc hiểu</h4><span>Đọc chữ Hán trước, chỉ mở gợi ý khi thật sự cần</span></div><div class="hsk-reading-card"><div class="hsk-reading-text">' + escapeHtml(passage.zh) + '</div><div class="hsk-reading-help hidden" id="hskReadingHelp"><strong>' + escapeHtml(passageReading.pinyin) + '</strong><br><span>Gần âm: ' + escapeHtml(passageReading.nearVi) + '</span><br><span>' + escapeHtml(passage.vi) + '</span></div><div class="hsk-writing-tools" style="justify-content:flex-start"><button class="muted" data-hsk-action="reading-help">Hiện pinyin và nghĩa</button><button class="hsk-speak" data-hsk-reading-audio="' + escapeHtml(passage.zh) + '">♪ Nghe bài đọc</button></div><div class="hsk-reading-question"><strong>Nội dung nào đúng với bài đọc?</strong><div class="hsk-reading-options">';
    for (var i = 0; i < options.length; i++) html += '<button data-hsk-reading-option="' + i + '" data-correct="' + (options[i] === passage.vi ? "1" : "0") + '">' + escapeHtml(options[i]) + "</button>";
    return html + "</div></div></div></div>";
  }
  function renderDictation(item, sectionNumber) {
    var word = item.words[(selectedLesson + selectedLevel) % item.words.length];
    return '<div class="hsk-section"><div class="hsk-section-title"><h4>' + sectionNumber + '. Nghe chép chính tả</h4><span>Không nhìn câu mẫu, nghe rồi gõ lại chữ Hán</span></div><div class="hsk-dictation"><strong>Nghe câu và chép lại</strong><p>Có thể nghe lại nhiều lần. Dấu câu không ảnh hưởng kết quả.</p><div class="hsk-dictation-row"><button class="hsk-speak" data-hsk-dictation-audio="' + escapeHtml(word[3]) + '">♪ Phát câu nghe</button><input id="hskDictationInput" autocomplete="off" placeholder="Gõ câu tiếng Trung nghe được"><button class="accent" data-hsk-action="dictation-check" data-answer="' + escapeHtml(word[3]) + '">Kiểm tra</button></div><div class="hsk-dictation-feedback" id="hskDictationFeedback"></div></div></div>';
  }
  function renderFoundation(item) {
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>1. Nội dung nền tảng</h4><span>Nghe mẫu và đọc phần hướng dẫn khẩu hình</span></div><div class="hsk-foundation-grid">';
    for (var i = 0; i < item.items.length; i++) html += '<article class="hsk-foundation-item"><strong>' + escapeHtml(item.items[i][0]) + '</strong><p>' + escapeHtml(item.items[i][1]) + '</p><button class="hsk-speak" data-hsk-speak="' + escapeHtml(item.items[i][2]) + '">♪ Nghe mẫu</button></article>';
    html += "</div></div>";
    if (item.practiceWords && item.practiceWords.length) html += renderWriting(item, 2);
    html += '<div class="hsk-section hsk-foundation-note"><strong>Cách học bài này</strong><p>Nghe từng mẫu ít nhất ba lần, đọc theo chậm rồi bình thường. Với bài nét chữ, xem hoạt ảnh, thử viết bằng tay trên màn hình rồi viết lại vào vở ô vuông.</p></div>';
    return html;
  }
  function loadCharacterData(character, onComplete, onError) {
    if (root.HSK_HANZI_DATA && root.HSK_HANZI_DATA[character]) { onComplete(root.HSK_HANZI_DATA[character]); return; }
    root.fetch("./hanzi-data/" + encodeURIComponent(character) + ".json").then(function (response) {
      if (!response.ok) throw new Error("missing character data");
      return response.json();
    }).then(onComplete).catch(onError);
  }
  function setupWritingTrainer(item, autoPlay) {
    var stage = byId("hskStrokeTarget");
    if (!stage) return;
    var words = practiceWords(item);
    var selected = words[writingState.wordIndex] || words[0];
    var characters = wordCharacters(selected && selected[0]);
    var character = characters[writingState.charIndex] || characters[0];
    var status = byId("hskWritingStatus");
    if (!root.HanziWriter) { if (status) status.textContent = "Chưa tải được trình mô phỏng nét chữ. Hãy tải lại trang."; return; }
    try {
      stage.innerHTML = "";
      var stageSize = Math.floor(stage.getBoundingClientRect().width) - 2;
      if (!stageSize || stageSize < 160) stageSize = 240;
      stageSize = Math.min(258, stageSize);
      activeWriter = root.HanziWriter.create("hskStrokeTarget", character, { renderer: "svg", width: stageSize, height: stageSize, padding: 32, showOutline: true, showCharacter: false, strokeColor: "#18352e", outlineColor: "#d9d2c5", highlightColor: "#c7673c", drawingColor: "#c7673c", drawingWidth: 5, strokeAnimationSpeed: 0.75, delayBetweenStrokes: 280, charDataLoader: loadCharacterData });
      activeWriter.showOutline({ duration: 0 });
      writingAnimating = Boolean(autoPlay);
      writingPaused = false;
      var pauseButton = byId("hskPauseWriting");
      if (pauseButton) { pauseButton.disabled = !autoPlay; pauseButton.textContent = "⏸ Tạm dừng"; }
      if (status) {
        status.className = "hsk-writing-status";
        status.textContent = "Bấm “Xem viết mẫu” hoặc “Tự viết trên màn hình”.";
      }
      if (autoPlay) activeWriter.animateCharacter({ onComplete: function () {
        writingAnimating = false;
        writingPaused = false;
        if (pauseButton) { pauseButton.disabled = true; pauseButton.textContent = "⏸ Tạm dừng"; }
      } });
    } catch (error) { if (status) status.textContent = "Chữ này chưa có dữ liệu hoạt ảnh. Bro chuyển sang chữ khác nhé."; }
  }
  function renderQuiz(item, sectionNumber) {
    if (quiz.lessonId !== item.id) resetQuiz();
    var html = '<div class="hsk-section hsk-quiz"><div class="hsk-quiz-head"><h4>' + sectionNumber + '. Kiểm tra cuối bài</h4><span class="step">CẦN ĐÚNG 4/5</span></div>';
    if (quiz.index >= 5) {
      var passed = quiz.score >= 4;
      if (passed && !completed[item.id]) { completed[item.id] = true; saveState(); }
      html += '<div class="hsk-result ' + (passed ? "pass" : "retry") + '"><strong>' + quiz.score + '/5</strong><h4>' + (passed ? "Đã qua bài" : "Chưa qua bài") + "</h4><p>" + (passed ? "Tiến độ đã được lưu. Có thể chuyển sang bài tiếp theo." : "Ôn lại từ mới và làm lại, lần này đừng đoán mò nhé bro.") + '</p><div class="hsk-actions" style="justify-content:center"><button class="muted" data-hsk-action="quiz-restart">Làm lại</button><button class="accent" data-hsk-action="next-lesson">Bài tiếp theo →</button></div></div>';
      return html + "</div>";
    }
    var word = item.words[quiz.index];
    var options = quizOptions(word, quiz.index);
    html += '<div class="hsk-quiz-prompt"><strong>' + escapeHtml(word[0]) + "</strong><span>" + escapeHtml(word[1]) + "</span></div><div class=\"hsk-quiz-options\">";
    for (var i = 0; i < options.length; i++) {
      var className = "hsk-quiz-option";
      if (quiz.answered && options[i][2] === word[2]) className += " correct";
      else if (quiz.answered && quiz.selected === i) className += " wrong";
      html += '<button class="' + className + '" data-hsk-option="' + i + '"' + (quiz.answered ? " disabled" : "") + ">" + escapeHtml(options[i][2]) + "</button>";
    }
    html += "</div>";
    if (quiz.answered) {
      var correct = options[quiz.selected] && options[quiz.selected][2] === word[2];
      html += '<div class="hsk-quiz-feedback"><strong>' + (correct ? "Chính xác." : "Chưa đúng.") + "</strong> " + escapeHtml(word[0]) + " = " + escapeHtml(word[2]) + '.</div><div class="hsk-actions" style="margin-top:10px"><button class="accent" data-hsk-action="quiz-next">Câu tiếp theo →</button></div>';
    }
    return html + "</div>";
  }
  function lessonSections() {
    var lesson = byId("hskLesson"), sections = [];
    if (!lesson) return sections;
    for (var child = lesson.firstElementChild; child; child = child.nextElementSibling) {
      if (child.classList && child.classList.contains("hsk-section")) sections.push(child);
    }
    return sections;
  }
  function lessonSectionTitle(section, fallback) {
    var heading = section.querySelector(".hsk-section-title h4") || section.querySelector(".hsk-quiz-head h4") || section.querySelector("strong");
    return heading ? heading.textContent.replace(/^\s*\d+\.\s*/, "").trim() : fallback;
  }
  function setupLessonSections() {
    var lesson = byId("hskLesson"), oldStepper = byId("hskMobileStepper");
    if (!lesson) return;
    if (oldStepper && oldStepper.parentNode) oldStepper.parentNode.removeChild(oldStepper);
    var oldBottom = lesson.querySelectorAll(".hsk-mobile-step-bottom");
    for (var oldIndex = 0; oldIndex < oldBottom.length; oldIndex++) oldBottom[oldIndex].parentNode.removeChild(oldBottom[oldIndex]);
    var sections = lessonSections();
    if (!sections.length) return;
    if (lessonSectionIndex < 0) lessonSectionIndex = 0;
    if (lessonSectionIndex >= sections.length) lessonSectionIndex = sections.length - 1;
    var titles = [];
    for (var i = 0; i < sections.length; i++) {
      titles.push(lessonSectionTitle(sections[i], "Nội dung " + (i + 1)));
      sections[i].classList.toggle("mobile-active", i === lessonSectionIndex);
    }
    var current = lessonSectionIndex, percent = Math.round((current + 1) * 100 / sections.length);
    var stepper = document.createElement("div");
    stepper.className = "hsk-mobile-stepper";
    stepper.id = "hskMobileStepper";
    stepper.innerHTML = '<div class="hsk-mobile-step-meta"><strong>Phần ' + (current + 1) + "/" + sections.length + '</strong><span>' + escapeHtml(titles[current]) + '</span></div><div class="hsk-mobile-step-track"><i style="width:' + percent + '%"></i></div>';
    lesson.insertBefore(stepper, sections[0]);
    var isLast = current === sections.length - 1;
    var nextAction = isLast ? (completed[currentLesson().id] ? "next-lesson" : "section-complete") : "section-next";
    var nextLabel = isLast ? (completed[currentLesson().id] ? "Bài kế tiếp →" : "✓ Đánh dấu hoàn thành") : "Tiếp: " + titles[current + 1] + " →";
    var bottom = document.createElement("div");
    bottom.className = "hsk-mobile-step-bottom";
    bottom.innerHTML = '<button data-hsk-action="section-prev"' + (current === 0 ? " disabled" : "") + '>← Phần trước</button><button data-hsk-action="' + nextAction + '">' + escapeHtml(nextLabel) + "</button>";
    sections[current].appendChild(bottom);
  }
  function moveLessonSection(direction) {
    var sections = lessonSections();
    if (!sections.length) return;
    lessonSectionIndex = Math.max(0, Math.min(sections.length - 1, lessonSectionIndex + direction));
    setupLessonSections();
    var stepper = byId("hskMobileStepper");
    if (stepper) stepper.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderLesson(autoPlayWriting) {
    var item = currentLesson();
    var done = Boolean(completed[item.id]);
    var levelLabel = selectedLevel === 0 ? "NỀN TẢNG" : "HSK " + selectedLevel;
    var html = '<div class="hsk-lesson-head"><div><span class="step">' + levelLabel + " · BÀI " + (selectedLesson + 1) + " / " + levels[selectedLevel].length + "</span><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.goal) + '</p></div><div class="hsk-actions"><button class="' + (done ? "hsk-speak" : "muted") + '" data-hsk-action="complete">' + (done ? "✓ Đã hoàn thành" : "Đánh dấu đã học") + '</button><button class="accent" data-hsk-action="next-lesson">Bài tiếp →</button></div></div>';
    if (item.foundation) html += renderFoundation(item);
    else html += renderWords(item) + renderWriting(item, 2) + renderGrammar(item).replace("<h4>2.", "<h4>3.") + renderReading(item, 4) + renderDictation(item, 5) + renderQuiz(item, 6);
    byId("hskLesson").innerHTML = html;
    setupLessonSections();
    if (practiceWords(item).length) setupWritingTrainer(item, Boolean(autoPlayWriting));
  }
  function renderAll() {
    if (!byId("hskLevels") || !byId("hskLesson")) return;
    renderLevels();
    renderLessonList();
    renderLesson(true);
  }
  function moveNextLesson(scrollFromSectionEnd) {
    var preservedScrollX = root.scrollX || 0;
    var preservedScrollY = root.scrollY || root.pageYOffset || 0;
    if (selectedLesson < levels[selectedLevel].length - 1) selectedLesson++;
    else if (selectedLevel < 4) { selectedLevel++; selectedLesson = 0; }
    resetQuiz();
    resetWriting();
    lessonSectionIndex = 0;
    saveState();
    renderAll();
    if (scrollFromSectionEnd) {
      root.setTimeout(function () {
        var lesson = byId("hskLesson");
        if (lesson) lesson.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } else {
      var restoreScroll = function () { root.scrollTo(preservedScrollX, preservedScrollY); };
      restoreScroll();
      if (root.requestAnimationFrame) root.requestAnimationFrame(restoreScroll);
      root.setTimeout(restoreScroll, 60);
    }
  }
  function openFromHash() {
    if (root.location.hash !== "#hsk") return;
    if (root.ERPAreaNavigation && typeof root.ERPAreaNavigation.select === "function") root.ERPAreaNavigation.select("hsk");
  }
  function bindEvents() {
    byId("hskLevels").onclick = function (event) {
      var button = event.target.closest ? event.target.closest("[data-hsk-level]") : event.target;
      if (!button || button.getAttribute("data-hsk-level") === null) return;
      selectedLevel = Number(button.getAttribute("data-hsk-level"));
      selectedLesson = 0;
      resetQuiz();
      resetWriting();
      lessonSectionIndex = 0;
      saveState();
      renderAll();
    };
    byId("hskLessonList").onclick = function (event) {
      var button = event.target.closest ? event.target.closest("[data-hsk-lesson]") : event.target;
      if (!button || button.getAttribute("data-hsk-lesson") === null) return;
      selectedLesson = Number(button.getAttribute("data-hsk-lesson"));
      resetQuiz();
      resetWriting();
      lessonSectionIndex = 0;
      saveState();
      renderAll();
    };
    byId("hskLesson").onclick = function (event) {
      var target = event.target.closest ? event.target.closest("button") : event.target;
      if (!target) return;
      if (target.getAttribute("data-hsk-speak")) { speak(target.getAttribute("data-hsk-speak")); return; }
      if (target.getAttribute("data-hsk-reading-audio")) { speak(target.getAttribute("data-hsk-reading-audio"), 0.66); return; }
      if (target.getAttribute("data-hsk-dictation-audio")) { speak(target.getAttribute("data-hsk-dictation-audio"), 0.66); return; }
      if (target.getAttribute("data-hsk-write-word") !== null) {
        writingState.wordIndex = Number(target.getAttribute("data-hsk-write-word")); writingState.charIndex = 0; renderLesson(true); return;
      }
      if (target.getAttribute("data-hsk-reading-option") !== null) {
        var readingButtons = byId("hskLesson").querySelectorAll("[data-hsk-reading-option]");
        for (var readingIndex = 0; readingIndex < readingButtons.length; readingIndex++) {
          if (readingButtons[readingIndex].getAttribute("data-correct") === "1") readingButtons[readingIndex].className = "correct";
          else if (readingButtons[readingIndex] === target) readingButtons[readingIndex].className = "wrong";
          readingButtons[readingIndex].disabled = true;
        }
        return;
      }
      if (target.getAttribute("data-hsk-option") !== null) {
        if (quiz.answered) return;
        var options = quizOptions(currentLesson().words[quiz.index], quiz.index);
        quiz.selected = Number(target.getAttribute("data-hsk-option"));
        quiz.answered = true;
        if (options[quiz.selected][2] === currentLesson().words[quiz.index][2]) quiz.score++;
        renderLesson(false);
        return;
      }
      var action = target.getAttribute("data-hsk-action");
      if (action === "section-prev") moveLessonSection(-1);
      else if (action === "section-next") moveLessonSection(1);
      else if (action === "section-complete") {
        completed[currentLesson().id] = true;
        saveState(); renderAll();
      } else if (action === "complete") {
        var id = currentLesson().id;
        if (completed[id]) delete completed[id]; else completed[id] = true;
        saveState(); renderAll();
      } else if (action === "next-lesson") moveNextLesson(Boolean(target.closest && target.closest(".hsk-mobile-step-bottom")));
      else if (action === "quiz-next") { quiz.index++; quiz.answered = false; quiz.selected = -1; renderLesson(false); }
      else if (action === "quiz-restart") { resetQuiz(); renderLesson(false); }
      else if (action === "write-replay") {
        if (activeWriter) {
          if (typeof activeWriter.cancelQuiz === "function") activeWriter.cancelQuiz();
          var replayStatus = byId("hskWritingStatus");
          var replayPauseButton = byId("hskPauseWriting");
          writingAnimating = true;
          writingPaused = false;
          if (replayPauseButton) { replayPauseButton.disabled = false; replayPauseButton.textContent = "⏸ Tạm dừng"; }
          if (replayStatus) { replayStatus.className = "hsk-writing-status"; replayStatus.textContent = "Đang viết mẫu từng nét…"; }
          activeWriter.animateCharacter({ onComplete: function () {
            writingAnimating = false;
            writingPaused = false;
            if (replayPauseButton) { replayPauseButton.disabled = true; replayPauseButton.textContent = "⏸ Tạm dừng"; }
            if (replayStatus) replayStatus.textContent = "Đã viết mẫu xong. Bro có thể replay hoặc tự viết.";
          } });
        }
      } else if (action === "write-pause") {
        if (activeWriter && writingAnimating) {
          var pauseStatus = byId("hskWritingStatus");
          if (writingPaused) {
            activeWriter.resumeAnimation();
            writingPaused = false;
            target.textContent = "⏸ Tạm dừng";
            if (pauseStatus) pauseStatus.textContent = "Đang tiếp tục viết mẫu…";
          } else {
            activeWriter.pauseAnimation();
            writingPaused = true;
            target.textContent = "▶ Tiếp tục";
            if (pauseStatus) pauseStatus.textContent = "Đã tạm dừng. Nhìn kỹ nét này rồi bấm Tiếp tục.";
          }
        }
      } else if (action === "write-practice") {
        if (activeWriter && typeof activeWriter.quiz === "function") {
          if (typeof activeWriter.cancelQuiz === "function") activeWriter.cancelQuiz();
          writingAnimating = false;
          writingPaused = false;
          var practicePauseButton = byId("hskPauseWriting");
          if (practicePauseButton) { practicePauseButton.disabled = true; practicePauseButton.textContent = "⏸ Tạm dừng"; }
          var practiceStatus = byId("hskWritingStatus"), mistakes = 0;
          if (practiceStatus) { practiceStatus.className = "hsk-writing-status"; practiceStatus.textContent = "Dùng ngón tay hoặc chuột viết từng nét trong ô."; }
          activeWriter.quiz({
            showHintAfterMisses: 2,
            highlightOnComplete: true,
            onMistake: function () {
              mistakes++;
              if (practiceStatus) { practiceStatus.className = "hsk-writing-status bad"; practiceStatus.textContent = "Nét này chưa đúng hướng hoặc thứ tự. Nhìn gợi ý rồi thử lại."; }
            },
            onCorrectStroke: function () {
              if (practiceStatus) { practiceStatus.className = "hsk-writing-status"; practiceStatus.textContent = "Đúng nét. Viết tiếp nhé."; }
            },
            onComplete: function () {
              if (practiceStatus) { practiceStatus.className = "hsk-writing-status good"; practiceStatus.textContent = mistakes ? "Hoàn thành chữ với " + mistakes + " lần cần sửa. Làm lại để nhớ chắc hơn." : "Hoàn thành không sai nét nào. Rất ổn!"; }
            }
          });
        }
      }
      else if (action === "write-prev" || action === "write-next") {
        var currentWords = practiceWords(currentLesson());
        var currentCharacters = wordCharacters((currentWords[writingState.wordIndex] || currentWords[0])[0]);
        if (action === "write-prev") {
          if (writingState.charIndex > 0) writingState.charIndex--;
          else { writingState.wordIndex = (writingState.wordIndex - 1 + currentWords.length) % currentWords.length; currentCharacters = wordCharacters(currentWords[writingState.wordIndex][0]); writingState.charIndex = currentCharacters.length - 1; }
        } else {
          if (writingState.charIndex < currentCharacters.length - 1) writingState.charIndex++;
          else { writingState.wordIndex = (writingState.wordIndex + 1) % currentWords.length; writingState.charIndex = 0; }
        }
        renderLesson(true);
      } else if (action === "reading-help") {
        var help = byId("hskReadingHelp"); if (help) help.className = help.className.indexOf("hidden") === -1 ? "hsk-reading-help hidden" : "hsk-reading-help";
      } else if (action === "dictation-check") {
        var input = byId("hskDictationInput"), feedback = byId("hskDictationFeedback");
        if (root.VDuckieRoast && typeof root.VDuckieRoast.checkDictation === "function") {
          root.VDuckieRoast.checkDictation(target);
        } else {
          var normalize = function (value) { return String(value || "").replace(/[\s，。！？、,.!?]/g, ""); };
          if (!input.value.trim()) feedback.textContent = "Bro nghe rồi nhập câu trước nhé.";
          else if (normalize(input.value) === normalize(target.getAttribute("data-answer"))) feedback.textContent = "Chính xác. Nghe và viết đều ổn.";
          else feedback.textContent = "Chưa khớp. Đáp án: " + target.getAttribute("data-answer");
        }
      }
    };
  }

  root.HSKCurriculum = { levels: levels, lessonCount: 44, availableThrough: 4, displayedThrough: 9, standard: "Bộ bài thử nghiệm · 2026-07" };
  loadState();
  resetQuiz();
  renderAll();
  bindEvents();
  openFromHash();
  root.addEventListener("hashchange", openFromHash);
  if (root.PinyinEngineReady && typeof root.PinyinEngineReady.then === "function") {
    root.PinyinEngineReady.then(function () { renderAll(); });
  }
})(typeof window !== "undefined" ? window : this);
