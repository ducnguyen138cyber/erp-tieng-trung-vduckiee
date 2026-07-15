(function (root) {
  "use strict";

  function lesson(id, title, goal, words, grammar, dialogue) {
    return { id: id, title: title, goal: goal, words: words, grammar: grammar, dialogue: dialogue };
  }

  var levels = {
    1: [
      lesson("hsk1-1", "Chào hỏi và tự giới thiệu", "Chào hỏi, nói tên và giới thiệu mình là ai.", [
        ["你好", "nǐ hǎo", "Xin chào", "你好，我叫德。", "Xin chào, tôi tên Đức."],
        ["我", "wǒ", "Tôi", "我是越南人。", "Tôi là người Việt Nam."],
        ["你", "nǐ", "Bạn", "你叫什么名字？", "Bạn tên là gì?"],
        ["叫", "jiào", "Tên là / gọi là", "我叫德。", "Tôi tên Đức."],
        ["名字", "míngzi", "Tên", "你的名字很好听。", "Tên của bạn rất hay."],
        ["是", "shì", "Là", "我是新同事。", "Tôi là đồng nghiệp mới."]
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
        ["今天", "jīntiān", "Hôm nay", "今天我上班。", "Hôm nay tôi đi làm."],
        ["明天", "míngtiān", "Ngày mai", "明天我们见。", "Ngày mai chúng ta gặp nhau."],
        ["点", "diǎn", "Giờ", "下午三点开会。", "Ba giờ chiều họp."]
      ], [
        ["现在 + số + 点", "Nói giờ hiện tại.", "现在九点。", "Bây giờ là chín giờ."],
        ["Thời gian + động từ", "Thời gian thường đặt trước động từ.", "明天八点上班。", "Ngày mai tám giờ đi làm."]
      ], [
        ["A", "我们几点开会？", "Mấy giờ chúng ta họp?"],
        ["B", "今天下午三点开会。", "Hôm nay ba giờ chiều họp."]
      ]),
      lesson("hsk1-4", "Địa điểm và vị trí", "Hỏi một người hoặc đồ vật đang ở đâu.", [
        ["在", "zài", "Ở / tại", "我在公司。", "Tôi ở công ty."],
        ["学校", "xuéxiào", "Trường học", "妹妹在学校。", "Em gái ở trường."],
        ["公司", "gōngsī", "Công ty", "公司在这里。", "Công ty ở đây."],
        ["这里", "zhèlǐ", "Ở đây", "请坐这里。", "Mời ngồi đây."],
        ["那里", "nàlǐ", "Ở đó", "洗手间在那里。", "Nhà vệ sinh ở đó."],
        ["哪儿", "nǎr", "Ở đâu", "你在哪儿工作？", "Bạn làm việc ở đâu?"]
      ], [
        ["A 在 B", "Nói vị trí của A.", "经理在办公室。", "Quản lý ở văn phòng."],
        ["A 在哪儿？", "Hỏi vị trí của A.", "仓库在哪儿？", "Kho ở đâu?"]
      ], [
        ["A", "你的公司在哪儿？", "Công ty của bạn ở đâu?"],
        ["B", "我的公司在那里。", "Công ty của tôi ở đằng kia."]
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
        ["去", "qù", "Đi", "我去公司。", "Tôi đi công ty."],
        ["出租车", "chūzūchē", "Taxi", "我们坐出租车去。", "Chúng ta đi bằng taxi."]
      ], [
        ["太 + tính từ + 了", "Nhấn mạnh mức độ quá.", "今天太冷了。", "Hôm nay lạnh quá."],
        ["坐 + phương tiện + 去", "Nói đi bằng phương tiện gì.", "我坐出租车去公司。", "Tôi đi taxi đến công ty."]
      ], [
        ["A", "外面下雨了，怎么去公司？", "Ngoài trời mưa rồi, đi công ty thế nào?"],
        ["B", "我们坐出租车去吧。", "Chúng ta đi taxi nhé."]
      ]),
      lesson("hsk1-8", "Công việc hằng ngày", "Nói nơi làm việc, đồng nghiệp và khả năng cơ bản.", [
        ["工作", "gōngzuò", "Làm việc / công việc", "我在工厂工作。", "Tôi làm việc ở nhà máy."],
        ["上班", "shàngbān", "Đi làm", "我八点上班。", "Tôi đi làm lúc tám giờ."],
        ["下班", "xiàbān", "Tan làm", "我五点下班。", "Tôi tan làm lúc năm giờ."],
        ["同事", "tóngshì", "Đồng nghiệp", "他是我的同事。", "Anh ấy là đồng nghiệp của tôi."],
        ["会", "huì", "Biết / có thể (kỹ năng)", "我会说一点汉语。", "Tôi biết nói một chút tiếng Trung."],
        ["不会", "bú huì", "Không biết / không thể", "我不会写这个字。", "Tôi không biết viết chữ này."]
      ], [
        ["会 + động từ", "Nói kỹ năng đã biết.", "我会用电脑。", "Tôi biết dùng máy tính."],
        ["几点上班/下班？", "Hỏi giờ làm hoặc tan làm.", "你几点下班？", "Bạn mấy giờ tan làm?"]
      ], [
        ["A", "你会说汉语吗？", "Bạn biết nói tiếng Trung không?"],
        ["B", "我会说一点，但是不会写很多字。", "Tôi biết nói một chút, nhưng chưa biết viết nhiều chữ."]
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
        ["正在", "zhèngzài", "Đang", "我正在开会。", "Tôi đang họp."],
        ["已经", "yǐjīng", "Đã", "我已经到公司了。", "Tôi đã đến công ty rồi."],
        ["还", "hái", "Vẫn / còn", "他还在工作。", "Anh ấy vẫn đang làm việc."],
        ["过", "guo", "Đã từng", "我去过中国。", "Tôi đã từng đi Trung Quốc."],
        ["完", "wán", "Xong", "我做完作业了。", "Tôi làm xong bài tập rồi."],
        ["以前", "yǐqián", "Trước đây", "我以前不会说汉语。", "Trước đây tôi không biết nói tiếng Trung."]
      ], [
        ["正在 + động từ", "Việc đang diễn ra ngay lúc nói.", "经理正在打电话。", "Quản lý đang gọi điện."],
        ["Động từ + 过", "Nói kinh nghiệm đã từng có.", "我学过一点汉语。", "Tôi từng học một chút tiếng Trung."]
      ], [
        ["A", "文件做好了吗？", "Tài liệu làm xong chưa?"],
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
        ["介绍", "jièshào", "Giới thiệu", "请介绍一下这个系统。", "Hãy giới thiệu một chút về hệ thống này."]
      ], [
        ["……得 + tính từ", "Bổ nghĩa cách thực hiện động từ.", "你说得太快了。", "Bạn nói nhanh quá."],
        ["请 + động từ + 一下", "Đề nghị lịch sự, nhẹ nhàng.", "请再说一下。", "Vui lòng nói lại một lần."]
      ], [
        ["A", "这个问题你明白吗？", "Bạn hiểu vấn đề này không?"],
        ["B", "我不太明白，请你再介绍一下。", "Tôi chưa hiểu lắm, vui lòng giới thiệu lại một chút."]
      ]),
      lesson("hsk2-8", "Trong văn phòng", "Giao tiếp cơ bản về họp, tài liệu và hoàn thành công việc.", [
        ["办公室", "bàngōngshì", "Văn phòng", "经理在办公室。", "Quản lý ở văn phòng."],
        ["经理", "jīnglǐ", "Quản lý / giám đốc", "经理正在开会。", "Quản lý đang họp."],
        ["开会", "kāihuì", "Họp", "下午两点开会。", "Hai giờ chiều họp."],
        ["文件", "wénjiàn", "Tài liệu / tệp", "请把文件给我。", "Vui lòng đưa tài liệu cho tôi."],
        ["事情", "shìqing", "Sự việc / việc", "我有一件事情要说。", "Tôi có một việc cần nói."],
        ["完成", "wánchéng", "Hoàn thành", "今天必须完成工作。", "Hôm nay phải hoàn thành công việc."]
      ], [
        ["把 + vật + động từ", "Đưa vật chịu tác động lên trước động từ.", "请把文件放这里。", "Hãy đặt tài liệu ở đây."],
        ["必须 + động từ", "Nói việc bắt buộc phải làm.", "这个事情必须今天完成。", "Việc này phải hoàn thành hôm nay."]
      ], [
        ["A", "经理在哪儿？", "Quản lý ở đâu?"],
        ["B", "他在办公室开会，让我先完成这个文件。", "Anh ấy đang họp ở văn phòng, bảo tôi hoàn thành tài liệu này trước."]
      ])
    ],
    3: [
      lesson("hsk3-1", "Nguyên nhân và điều kiện", "Nối ý bằng vì–nên, nếu–thì và tuy–nhưng.", [
        ["因为", "yīnwèi", "Bởi vì", "因为下雨，我没去。", "Vì trời mưa nên tôi không đi."],
        ["所以", "suǒyǐ", "Cho nên", "他生病了，所以没上班。", "Anh ấy ốm nên không đi làm."],
        ["如果", "rúguǒ", "Nếu", "如果有问题，请告诉我。", "Nếu có vấn đề, hãy nói với tôi."],
        ["就", "jiù", "Thì / liền", "检查完就可以保存。", "Kiểm tra xong thì có thể lưu."],
        ["虽然", "suīrán", "Tuy rằng", "虽然很难，但是我想试试。", "Tuy khó nhưng tôi muốn thử."],
        ["但是", "dànshì", "Nhưng", "他很忙，但是会帮助我。", "Anh ấy rất bận nhưng sẽ giúp tôi."]
      ], [
        ["因为……所以……", "Nêu nguyên nhân rồi kết quả.", "因为数据不对，所以不能保存。", "Vì dữ liệu sai nên không thể lưu."],
        ["如果……就……", "Nêu điều kiện và kết quả.", "如果有库存，就可以领料。", "Nếu có tồn kho thì có thể lĩnh liệu."]
      ], [
        ["A", "为什么这个单不能保存？", "Tại sao phiếu này không thể lưu?"],
        ["B", "因为数量不对，所以系统不让保存。", "Vì số lượng không đúng nên hệ thống không cho lưu."]
      ]),
      lesson("hsk3-2", "Trình tự công việc", "Mô tả một quy trình theo thứ tự rõ ràng.", [
        ["先", "xiān", "Trước tiên", "先检查库存。", "Trước tiên kiểm tra tồn kho."],
        ["然后", "ránhòu", "Sau đó", "然后填写数量。", "Sau đó điền số lượng."],
        ["最后", "zuìhòu", "Cuối cùng", "最后保存单据。", "Cuối cùng lưu chứng từ."],
        ["开始", "kāishǐ", "Bắt đầu", "会议九点开始。", "Cuộc họp bắt đầu lúc chín giờ."],
        ["结束", "jiéshù", "Kết thúc", "工作已经结束了。", "Công việc đã kết thúc."],
        ["继续", "jìxù", "Tiếp tục", "确认以后继续操作。", "Sau khi xác nhận thì tiếp tục thao tác."]
      ], [
        ["先……然后……最后……", "Trình bày ba bước liên tiếp.", "先登录，然后检查，最后保存。", "Đầu tiên đăng nhập, sau đó kiểm tra, cuối cùng lưu."],
        ["Động từ + 以后", "Sau khi làm xong việc gì.", "开会以后继续工作。", "Sau cuộc họp tiếp tục làm việc."]
      ], [
        ["A", "补领料怎么操作？", "Bổ lĩnh liệu thao tác thế nào?"],
        ["B", "先检查工单，然后填写数量，最后审核单据。", "Trước tiên kiểm tra công lệnh, sau đó điền số lượng, cuối cùng duyệt chứng từ."]
      ]),
      lesson("hsk3-3", "Phân công và xử lý", "Nói ai phụ trách, phát hiện gì và cần xử lý ra sao.", [
        ["安排", "ānpái", "Sắp xếp / phân công", "经理安排我去车间。", "Quản lý sắp xếp tôi xuống xưởng."],
        ["负责", "fùzé", "Phụ trách", "他负责仓库系统。", "Anh ấy phụ trách hệ thống kho."],
        ["检查", "jiǎnchá", "Kiểm tra", "请检查这张单。", "Vui lòng kiểm tra phiếu này."],
        ["发现", "fāxiàn", "Phát hiện", "我发现数量不对。", "Tôi phát hiện số lượng không đúng."],
        ["解决", "jiějué", "Giải quyết", "这个问题已经解决了。", "Vấn đề này đã được giải quyết."],
        ["需要", "xūyào", "Cần", "这个工单需要补料。", "Công lệnh này cần bổ vật liệu."]
      ], [
        ["负责 + danh từ/động từ", "Nói phạm vi trách nhiệm.", "我负责检查系统数据。", "Tôi phụ trách kiểm tra dữ liệu hệ thống."],
        ["需要 + động từ", "Nói hành động cần thực hiện.", "发现问题以后需要马上处理。", "Phát hiện vấn đề xong cần xử lý ngay."]
      ], [
        ["A", "谁负责检查这个问题？", "Ai phụ trách kiểm tra vấn đề này?"],
        ["B", "经理安排我检查，我发现以后会马上解决。", "Quản lý phân công tôi kiểm tra, phát hiện xong tôi sẽ giải quyết ngay."]
      ]),
      lesson("hsk3-4", "Số lượng và kết quả", "Báo cáo con số, mức tăng giảm và kết quả ước lượng.", [
        ["数量", "shùliàng", "Số lượng", "请确认实际数量。", "Vui lòng xác nhận số lượng thực tế."],
        ["结果", "jiéguǒ", "Kết quả", "检查结果没有问题。", "Kết quả kiểm tra không có vấn đề."],
        ["增加", "zēngjiā", "Tăng lên", "订单数量增加了。", "Số lượng đơn hàng đã tăng."],
        ["减少", "jiǎnshǎo", "Giảm xuống", "错误已经减少了。", "Lỗi đã giảm xuống."],
        ["大概", "dàgài", "Khoảng / đại khái", "大概有一百件。", "Khoảng một trăm chiếc."],
        ["左右", "zuǒyòu", "Khoảng", "需要两个小时左右。", "Cần khoảng hai giờ."]
      ], [
        ["Số + 左右", "Nói con số xấp xỉ.", "库存有五百个左右。", "Tồn kho có khoảng năm trăm cái."],
        ["增加/减少 + 了", "Mô tả sự thay đổi đã xảy ra.", "实际数量减少了十个。", "Số lượng thực tế giảm mười cái."]
      ], [
        ["A", "检查结果怎么样？", "Kết quả kiểm tra thế nào?"],
        ["B", "实际数量大概少了二十个左右。", "Số lượng thực tế thiếu khoảng hai mươi cái."]
      ]),
      lesson("hsk3-5", "Trao đổi ý kiến", "Đồng ý, đưa đề xuất, giải thích và thông báo cho người khác.", [
        ["同意", "tóngyì", "Đồng ý", "我同意这个方案。", "Tôi đồng ý phương án này."],
        ["认为", "rènwéi", "Cho rằng", "我认为需要再检查。", "Tôi cho rằng cần kiểm tra lại."],
        ["建议", "jiànyì", "Đề nghị / kiến nghị", "我建议先备份数据。", "Tôi đề nghị sao lưu dữ liệu trước."],
        ["解释", "jiěshì", "Giải thích", "请解释一下原因。", "Vui lòng giải thích nguyên nhân."],
        ["联系", "liánxì", "Liên hệ", "我会联系仓库负责人。", "Tôi sẽ liên hệ người phụ trách kho."],
        ["通知", "tōngzhī", "Thông báo", "处理完以后通知我。", "Xử lý xong hãy thông báo cho tôi."]
      ], [
        ["我认为 / 我建议……", "Nêu quan điểm hoặc đề xuất lịch sự.", "我建议今天完成。", "Tôi đề nghị hoàn thành hôm nay."],
        ["……以后通知……", "Yêu cầu báo lại sau khi hoàn thành.", "确认以后通知车间。", "Xác nhận xong thông báo cho xưởng."]
      ], [
        ["A", "你认为应该怎么处理？", "Bạn cho rằng nên xử lý thế nào?"],
        ["B", "我建议先联系仓库，解释清楚以后再通知车间。", "Tôi đề nghị liên hệ kho trước, giải thích rõ rồi thông báo cho xưởng."]
      ]),
      lesson("hsk3-6", "Chất lượng và yêu cầu", "Mô tả chất lượng, mức đạt và yêu cầu làm việc cẩn thận.", [
        ["质量", "zhìliàng", "Chất lượng", "这批产品质量很好。", "Chất lượng lô sản phẩm này rất tốt."],
        ["合格", "hégé", "Đạt tiêu chuẩn", "检查以后产品合格。", "Sau kiểm tra sản phẩm đạt."],
        ["重要", "zhòngyào", "Quan trọng", "数据准确很重要。", "Dữ liệu chính xác rất quan trọng."],
        ["清楚", "qīngchu", "Rõ ràng", "请写清楚问题原因。", "Hãy viết rõ nguyên nhân vấn đề."],
        ["注意", "zhùyì", "Chú ý", "操作时要注意数量。", "Khi thao tác cần chú ý số lượng."],
        ["认真", "rènzhēn", "Nghiêm túc / kỹ", "他工作很认真。", "Anh ấy làm việc rất nghiêm túc."]
      ], [
        ["要注意……", "Nhắc điều cần chú ý.", "保存前要注意检查。", "Trước khi lưu cần chú ý kiểm tra."],
        ["Động từ + 清楚", "Thực hiện đến mức rõ ràng.", "请把要求说清楚。", "Hãy nói rõ yêu cầu."]
      ], [
        ["A", "这批产品合格吗？", "Lô sản phẩm này đạt không?"],
        ["B", "质量基本合格，但是有两个问题需要认真检查。", "Chất lượng cơ bản đạt, nhưng có hai vấn đề cần kiểm tra kỹ."]
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
        ["B", "不仅没有解决，而且仍然影响生产。", "Không những chưa giải quyết mà vẫn còn ảnh hưởng sản xuất."]
      ]),
      lesson("hsk4-2", "Kế hoạch và quản lý tiến độ", "Báo cáo nhiệm vụ, trách nhiệm và hiệu suất công việc.", [
        ["计划", "jìhuà", "Kế hoạch", "我们需要调整生产计划。", "Chúng ta cần điều chỉnh kế hoạch sản xuất."],
        ["进度", "jìndù", "Tiến độ", "目前进度有点慢。", "Tiến độ hiện tại hơi chậm."],
        ["责任", "zérèn", "Trách nhiệm", "这是我的责任。", "Đây là trách nhiệm của tôi."],
        ["任务", "rènwu", "Nhiệm vụ", "今天的任务已经完成。", "Nhiệm vụ hôm nay đã hoàn thành."],
        ["经验", "jīngyàn", "Kinh nghiệm", "他有丰富的管理经验。", "Anh ấy có kinh nghiệm quản lý phong phú."],
        ["效率", "xiàolǜ", "Hiệu suất", "新系统提高了工作效率。", "Hệ thống mới nâng cao hiệu suất làm việc."]
      ], [
        ["按照 + kế hoạch/quy định", "Làm theo căn cứ đã định.", "请按照计划完成任务。", "Hãy hoàn thành nhiệm vụ theo kế hoạch."],
        ["提高 + danh từ", "Nâng cao một chỉ tiêu.", "这个方法能提高效率。", "Cách này có thể nâng cao hiệu suất."]
      ], [
        ["A", "目前生产进度怎么样？", "Tiến độ sản xuất hiện tại thế nào?"],
        ["B", "任务完成了百分之八十，效率比以前高。", "Nhiệm vụ đã hoàn thành tám mươi phần trăm, hiệu suất cao hơn trước."]
      ]),
      lesson("hsk4-3", "Phân tích vấn đề", "Trình bày nguyên nhân, ảnh hưởng và phương án phòng tránh.", [
        ["原因", "yuányīn", "Nguyên nhân", "我们正在调查错误原因。", "Chúng tôi đang điều tra nguyên nhân lỗi."],
        ["影响", "yǐngxiǎng", "Ảnh hưởng", "这个问题会影响生产。", "Vấn đề này sẽ ảnh hưởng sản xuất."],
        ["处理", "chǔlǐ", "Xử lý", "异常数据已经处理了。", "Dữ liệu bất thường đã được xử lý."],
        ["情况", "qíngkuàng", "Tình hình / trường hợp", "请说明实际情况。", "Vui lòng nói rõ tình hình thực tế."],
        ["发生", "fāshēng", "Xảy ra", "昨天发生了系统错误。", "Hôm qua xảy ra lỗi hệ thống."],
        ["避免", "bìmiǎn", "Tránh", "要避免同样的问题再次发生。", "Cần tránh vấn đề tương tự xảy ra lần nữa."]
      ], [
        ["为了避免……", "Nêu mục đích phòng tránh.", "为了避免错误，保存前要检查。", "Để tránh lỗi, trước khi lưu phải kiểm tra."],
        ["对……有影响", "Nói ảnh hưởng lên đối tượng.", "停机会对进度有影响。", "Dừng máy sẽ ảnh hưởng đến tiến độ."]
      ], [
        ["A", "这个异常是什么原因？", "Bất thường này do nguyên nhân gì?"],
        ["B", "操作错误影响了库存，我们正在处理，避免再次发生。", "Lỗi thao tác ảnh hưởng tồn kho, chúng tôi đang xử lý để tránh xảy ra lần nữa."]
      ]),
      lesson("hsk4-4", "Báo cáo và dữ liệu", "Đọc dữ liệu, phân tích và trình bày kết luận có căn cứ.", [
        ["报告", "bàogào", "Báo cáo", "我正在写库存报告。", "Tôi đang viết báo cáo tồn kho."],
        ["数据", "shùjù", "Dữ liệu", "系统数据和实际不一样。", "Dữ liệu hệ thống khác thực tế."],
        ["分析", "fēnxī", "Phân tích", "需要分析差异原因。", "Cần phân tích nguyên nhân chênh lệch."],
        ["说明", "shuōmíng", "Giải thích / thuyết minh", "请说明数据来源。", "Vui lòng nói rõ nguồn dữ liệu."],
        ["总结", "zǒngjié", "Tổng kết", "会议结束后要做总结。", "Sau cuộc họp cần làm tổng kết."],
        ["证明", "zhèngmíng", "Chứng minh", "这些数据证明方法有效。", "Những dữ liệu này chứng minh cách làm hiệu quả."]
      ], [
        ["根据 + căn cứ", "Nêu nguồn làm căn cứ.", "根据报告，库存没有问题。", "Theo báo cáo, tồn kho không có vấn đề."],
        ["数据表明/证明……", "Dùng dữ liệu để đưa ra kết luận.", "数据表明效率提高了。", "Dữ liệu cho thấy hiệu suất đã tăng."]
      ], [
        ["A", "报告分析出什么结果？", "Báo cáo phân tích ra kết quả gì?"],
        ["B", "数据证明差异来自操作问题，我会在总结里说明。", "Dữ liệu chứng minh chênh lệch do thao tác, tôi sẽ giải thích trong phần tổng kết."]
      ]),
      lesson("hsk4-5", "Thảo luận và quyết định", "Trao đổi lựa chọn, điều kiện và phản hồi đồng ý hoặc từ chối.", [
        ["讨论", "tǎolùn", "Thảo luận", "我们需要讨论这个方案。", "Chúng ta cần thảo luận phương án này."],
        ["选择", "xuǎnzé", "Lựa chọn", "你可以选择两个方法。", "Bạn có thể chọn hai phương pháp."],
        ["决定", "juédìng", "Quyết định", "经理决定明天开始。", "Quản lý quyết định ngày mai bắt đầu."],
        ["接受", "jiēshòu", "Chấp nhận", "客户接受了新的日期。", "Khách hàng đã chấp nhận ngày mới."],
        ["拒绝", "jùjué", "Từ chối", "他拒绝了这个要求。", "Anh ấy từ chối yêu cầu này."],
        ["条件", "tiáojiàn", "Điều kiện", "这个条件我们不能接受。", "Điều kiện này chúng tôi không thể chấp nhận."]
      ], [
        ["在……条件下", "Nói trong điều kiện nào.", "在库存足够的条件下可以生产。", "Trong điều kiện đủ tồn kho có thể sản xuất."],
        ["经过讨论，决定……", "Nêu quyết định sau thảo luận.", "经过讨论，我们决定调整计划。", "Sau thảo luận, chúng tôi quyết định điều chỉnh kế hoạch."]
      ], [
        ["A", "客户接受这个处理方案吗？", "Khách hàng chấp nhận phương án xử lý này không?"],
        ["B", "经过讨论，他接受了大部分条件，但拒绝改日期。", "Sau thảo luận, họ chấp nhận phần lớn điều kiện nhưng từ chối đổi ngày."]
      ]),
      lesson("hsk4-6", "Thay đổi và cải tiến", "Đánh giá thành công, thất bại và điều chỉnh phương án cho phù hợp.", [
        ["改变", "gǎibiàn", "Thay đổi", "新工作改变了我的生活。", "Công việc mới thay đổi cuộc sống của tôi."],
        ["改进", "gǎijìn", "Cải tiến", "我们要改进操作流程。", "Chúng ta phải cải tiến quy trình thao tác."],
        ["调整", "tiáozhěng", "Điều chỉnh", "请调整计划数量。", "Vui lòng điều chỉnh số lượng kế hoạch."],
        ["适合", "shìhé", "Phù hợp", "这个方法更适合工厂。", "Phương pháp này phù hợp nhà máy hơn."],
        ["成功", "chénggōng", "Thành công", "数据已经成功导入。", "Dữ liệu đã được nhập thành công."],
        ["失败", "shībài", "Thất bại", "保存失败，请重新操作。", "Lưu thất bại, vui lòng thao tác lại."]
      ], [
        ["适合 + đối tượng", "Nói mức phù hợp với ai/cái gì.", "这个流程不适合现在的生产。", "Quy trình này không phù hợp sản xuất hiện tại."],
        ["通过……来改进……", "Nêu cách dùng để cải tiến.", "通过培训来改进操作。", "Thông qua đào tạo để cải tiến thao tác."]
      ], [
        ["A", "新流程运行得成功吗？", "Quy trình mới vận hành thành công không?"],
        ["B", "第一次失败了，调整以后更适合现场，现在成功了。", "Lần đầu thất bại, sau điều chỉnh phù hợp hiện trường hơn, giờ đã thành công."]
      ]),
      lesson("hsk4-7", "Công nghệ và an toàn", "Thảo luận công nghệ, thông tin, môi trường và rủi ro an toàn.", [
        ["网络", "wǎngluò", "Mạng", "今天公司的网络不稳定。", "Hôm nay mạng công ty không ổn định."],
        ["技术", "jìshù", "Kỹ thuật / công nghệ", "这个技术可以提高效率。", "Công nghệ này có thể nâng cao hiệu suất."],
        ["信息", "xìnxī", "Thông tin", "请保护客户信息。", "Vui lòng bảo vệ thông tin khách hàng."],
        ["发展", "fāzhǎn", "Phát triển", "人工智能发展得很快。", "Trí tuệ nhân tạo phát triển rất nhanh."],
        ["环境", "huánjìng", "Môi trường", "工作环境越来越好。", "Môi trường làm việc ngày càng tốt."],
        ["安全", "ānquán", "An toàn", "数据安全非常重要。", "An toàn dữ liệu rất quan trọng."]
      ], [
        ["越来越 + tính từ", "Mức độ tăng dần theo thời gian.", "网络速度越来越快。", "Tốc độ mạng ngày càng nhanh."],
        ["在……方面", "Khoanh phạm vi đang nói.", "在数据安全方面要更小心。", "Về mặt an toàn dữ liệu cần cẩn thận hơn."]
      ], [
        ["A", "新技术对公司有什么影响？", "Công nghệ mới ảnh hưởng gì đến công ty?"],
        ["B", "效率越来越高，但是在信息安全方面要特别注意。", "Hiệu suất ngày càng cao, nhưng về an toàn thông tin phải đặc biệt chú ý."]
      ]),
      lesson("hsk4-8", "Văn hóa và thích nghi", "Giao tiếp tôn trọng khác biệt và kể quá trình thích nghi môi trường mới.", [
        ["文化", "wénhuà", "Văn hóa", "我对中国文化很感兴趣。", "Tôi rất hứng thú với văn hóa Trung Quốc."],
        ["习惯", "xíguàn", "Thói quen / quen", "我还不习惯这里的天气。", "Tôi vẫn chưa quen thời tiết ở đây."],
        ["交流", "jiāoliú", "Giao tiếp / trao đổi", "多交流可以提高口语。", "Giao tiếp nhiều có thể nâng cao khẩu ngữ."],
        ["理解", "lǐjiě", "Hiểu / thông cảm", "谢谢你的理解。", "Cảm ơn sự thông cảm của bạn."],
        ["尊重", "zūnzhòng", "Tôn trọng", "我们应该尊重文化差异。", "Chúng ta nên tôn trọng khác biệt văn hóa."],
        ["适应", "shìyìng", "Thích nghi", "我慢慢适应了新工作。", "Tôi dần thích nghi công việc mới."]
      ], [
        ["对……感兴趣", "Nói hứng thú với điều gì.", "我对工厂管理很感兴趣。", "Tôi hứng thú với quản lý nhà máy."],
        ["慢慢/逐渐 + động từ", "Quá trình thay đổi dần dần.", "我逐渐适应了这里的生活。", "Tôi dần thích nghi cuộc sống ở đây."]
      ], [
        ["A", "你适应中国公司的工作方式了吗？", "Bạn đã thích nghi cách làm việc ở công ty Trung Quốc chưa?"],
        ["B", "我还在学习。多交流、互相理解和尊重很重要。", "Tôi vẫn đang học. Giao tiếp nhiều, hiểu và tôn trọng lẫn nhau rất quan trọng."]
      ])
    ]
  };

  var levelDescriptions = {
    1: "Nền tảng giao tiếp",
    2: "Sinh hoạt và công việc",
    3: "Trình bày và xử lý",
    4: "Trao đổi có chiều sâu"
  };
  var progressKey = "erp-hsk-progress-v1";
  var stateKey = "erp-hsk-state-v1";
  var selectedLevel = 1;
  var selectedLesson = 0;
  var completed = {};
  var quiz = { lessonId: "", index: 0, score: 0, answered: false, selected: -1 };

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }
  function loadState() {
    try {
      var savedState = JSON.parse(localStorage.getItem(stateKey) || "{}");
      if (savedState.level >= 1 && savedState.level <= 4) selectedLevel = savedState.level;
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
    for (var level = 1; level <= 4; level++) {
      html += '<button class="hsk-level' + (selectedLevel === level ? " active" : "") + '" data-hsk-level="' + level + '"><strong>HSK ' + level + '</strong><small>' + levelCompleted(level) + "/" + levels[level].length + " bài · " + levelDescriptions[level] + "</small></button>";
    }
    byId("hskLevels").innerHTML = html;
  }
  function renderLessonList() {
    var done = levelCompleted(selectedLevel);
    var percent = Math.round(done * 100 / levels[selectedLevel].length);
    byId("hskProgress").innerHTML = '<div class="hsk-progress"><strong>Tiến độ HSK ' + selectedLevel + '</strong><span>' + done + "/" + levels[selectedLevel].length + " bài đã hoàn thành</span><div class=\"hsk-progress-bar\"><i style=\"width:" + percent + '%\"></i></div></div>';
    var html = "";
    for (var i = 0; i < levels[selectedLevel].length; i++) {
      var item = levels[selectedLevel][i];
      html += '<button class="hsk-lesson-link' + (selectedLesson === i ? " active" : "") + (completed[item.id] ? " done" : "") + '" data-hsk-lesson="' + i + '"><span class="hsk-lesson-number">' + (completed[item.id] ? "✓" : (i + 1)) + "</span><span><strong>" + escapeHtml(item.title) + "</strong><small>6 từ · 2 mẫu câu</small></span>" + (completed[item.id] ? '<span class="hsk-check">✓</span>' : "") + "</button>";
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
  function renderDialogue(item) {
    var joined = [];
    var html = '<div class="hsk-section"><div class="hsk-section-title"><h4>3. Hội thoại mẫu</h4><button class="hsk-speak" data-hsk-dialogue="1">♪ Nghe cả đoạn</button></div><div class="hsk-dialogue">';
    for (var i = 0; i < item.dialogue.length; i++) {
      var line = item.dialogue[i];
      var lineReading = reading(line[1], "");
      joined.push(line[1]);
      html += '<div class="hsk-dialogue-line"><em>NGƯỜI ' + escapeHtml(line[0]) + "</em><strong>" + escapeHtml(line[1]) + "</strong><b>" + escapeHtml(lineReading.pinyin) + "</b><i>Gần âm: " + escapeHtml(lineReading.nearVi) + "</i><span>" + escapeHtml(line[2]) + "</span></div>";
    }
    return html + '</div><span class="hidden" id="hskDialogueText">' + escapeHtml(joined.join("。")) + "</span></div>";
  }
  function renderQuiz(item) {
    if (quiz.lessonId !== item.id) resetQuiz();
    var html = '<div class="hsk-section hsk-quiz"><div class="hsk-quiz-head"><h4>4. Kiểm tra cuối bài</h4><span class="step">CẦN ĐÚNG 4/5</span></div>';
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
  function renderLesson() {
    var item = currentLesson();
    var done = Boolean(completed[item.id]);
    var html = '<div class="hsk-lesson-head"><div><span class="step">HSK ' + selectedLevel + " · BÀI " + (selectedLesson + 1) + " / " + levels[selectedLevel].length + "</span><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.goal) + '</p></div><div class="hsk-actions"><button class="' + (done ? "hsk-speak" : "muted") + '" data-hsk-action="complete">' + (done ? "✓ Đã hoàn thành" : "Đánh dấu đã học") + '</button><button class="accent" data-hsk-action="next-lesson">Bài tiếp →</button></div></div>';
    html += renderWords(item) + renderGrammar(item) + renderDialogue(item) + renderQuiz(item);
    byId("hskLesson").innerHTML = html;
  }
  function renderAll() {
    if (!byId("hskLevels") || !byId("hskLesson")) return;
    renderLevels();
    renderLessonList();
    renderLesson();
  }
  function moveNextLesson() {
    if (selectedLesson < levels[selectedLevel].length - 1) selectedLesson++;
    else if (selectedLevel < 4) { selectedLevel++; selectedLesson = 0; }
    resetQuiz();
    saveState();
    renderAll();
    if (byId("hsk")) byId("hsk").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function openFromHash() {
    if (root.location.hash !== "#hsk") return;
    var nav = document.querySelectorAll("[data-view]");
    var views = ["cards", "hsk", "dialogue", "quiz", "glossary", "personal", "community"];
    for (var i = 0; i < nav.length; i++) nav[i].className = nav[i].getAttribute("data-view") === "hsk" ? "active" : "";
    for (var j = 0; j < views.length; j++) if (byId(views[j])) byId(views[j]).className = views[j] === "hsk" ? "panel" : "panel hidden";
  }
  function bindEvents() {
    byId("hskLevels").onclick = function (event) {
      var button = event.target.closest ? event.target.closest("[data-hsk-level]") : event.target;
      if (!button || !button.getAttribute("data-hsk-level")) return;
      selectedLevel = Number(button.getAttribute("data-hsk-level"));
      selectedLesson = 0;
      resetQuiz();
      saveState();
      renderAll();
    };
    byId("hskLessonList").onclick = function (event) {
      var button = event.target.closest ? event.target.closest("[data-hsk-lesson]") : event.target;
      if (!button || button.getAttribute("data-hsk-lesson") === null) return;
      selectedLesson = Number(button.getAttribute("data-hsk-lesson"));
      resetQuiz();
      saveState();
      renderAll();
    };
    byId("hskLesson").onclick = function (event) {
      var target = event.target.closest ? event.target.closest("button") : event.target;
      if (!target) return;
      if (target.getAttribute("data-hsk-speak")) { speak(target.getAttribute("data-hsk-speak")); return; }
      if (target.getAttribute("data-hsk-dialogue")) { speak(byId("hskDialogueText").textContent, 0.66); return; }
      if (target.getAttribute("data-hsk-option") !== null) {
        if (quiz.answered) return;
        var options = quizOptions(currentLesson().words[quiz.index], quiz.index);
        quiz.selected = Number(target.getAttribute("data-hsk-option"));
        quiz.answered = true;
        if (options[quiz.selected][2] === currentLesson().words[quiz.index][2]) quiz.score++;
        renderLesson();
        return;
      }
      var action = target.getAttribute("data-hsk-action");
      if (action === "complete") {
        var id = currentLesson().id;
        if (completed[id]) delete completed[id]; else completed[id] = true;
        saveState(); renderAll();
      } else if (action === "next-lesson") moveNextLesson();
      else if (action === "quiz-next") { quiz.index++; quiz.answered = false; quiz.selected = -1; renderAll(); }
      else if (action === "quiz-restart") { resetQuiz(); renderLesson(); }
    };
  }

  root.HSKCurriculum = { levels: levels, lessonCount: 32, standard: "HSK 3.0 · 2026-07" };
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
