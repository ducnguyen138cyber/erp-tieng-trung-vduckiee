(function (root) {
  "use strict";

  /*
   * VDuckie companion lessons for the public MSUTONG Beginner 1 topic order.
   * Dialogue, explanations and exercises are original VDuckie content. They are
   * not transcriptions of the textbook.
   */
  var lessons = [
    {
      id: "b1-u1", title: "Xin chào", zhTitle: "你好", goal: "Chào đúng người, phân biệt 你 / 您 và đáp lại tự nhiên.",
      words: [["你好","nǐ hǎo","Xin chào"],["您好","nín hǎo","Xin chào (lịch sự)"],["老师","lǎoshī","Giáo viên"],["我","wǒ","Tôi"],["你","nǐ","Bạn"],["们","men","Hậu tố số nhiều"]],
      grammar: [["你 / 您 + 好","Dùng 你好 với người ngang hàng; 您好 khi muốn thể hiện sự kính trọng.","老师，您好！","Thưa cô/thầy, xin chào!"],["Danh từ + 们","Thêm 们 sau đại từ hoặc danh từ chỉ người để nói số nhiều.","你们好！","Chào mọi người!"]],
      dialogue: [["A","老师，您好！","Lǎoshī, nín hǎo!","Thưa cô, em chào cô!"],["B","你好！你们好！","Nǐ hǎo! Nǐmen hǎo!","Chào em! Chào các em!"]]
    },
    {
      id: "b1-u2", title: "Bạn tên là gì?", zhTitle: "你叫什么名字？", goal: "Hỏi tên, nói tên và hỏi lại người đối diện.",
      words: [["叫","jiào","Tên là / gọi là"],["什么","shénme","Gì / cái gì"],["名字","míngzi","Tên"],["我","wǒ","Tôi"],["呢","ne","Còn… thì sao?"],["是","shì","Là"]],
      grammar: [["Chủ ngữ + 叫 + tên","Dùng 叫 để giới thiệu tên, không cần thêm 是.","我叫德。","Tôi tên Đức."],["……呢？","Lặp lại câu hỏi ngắn gọn về người đối diện.","我叫德，你呢？","Tôi tên Đức, còn bạn?"]],
      dialogue: [["A","你好！你叫什么名字？","Nǐ hǎo! Nǐ jiào shénme míngzi?","Xin chào! Bạn tên là gì?"],["B","我叫德。你呢？","Wǒ jiào Dé. Nǐ ne?","Tôi tên Đức. Còn bạn?"]]
    },
    {
      id: "b1-u3", title: "Rất vui khi được gặp bạn", zhTitle: "很高兴认识你", goal: "Làm quen, hỏi quốc tịch và đáp lời xã giao.",
      words: [["很","hěn","Rất"],["高兴","gāoxìng","Vui / hân hạnh"],["认识","rènshi","Quen biết / làm quen"],["也","yě","Cũng"],["人","rén","Người"],["越南","Yuènán","Việt Nam"]],
      grammar: [["很 + tính từ","Trong câu miêu tả đơn giản, 很 thường nối chủ ngữ với tính từ.","我很高兴。","Tôi rất vui."],["Chủ ngữ + 也 + động từ","也 đứng trước động từ hoặc tính từ để nói “cũng”.","我也很高兴。","Tôi cũng rất vui."]],
      dialogue: [["A","我是越南人。很高兴认识你。","Wǒ shì Yuènán rén. Hěn gāoxìng rènshi nǐ.","Tôi là người Việt Nam. Rất vui được gặp bạn."],["B","我也是。","Wǒ yě shì.","Tôi cũng vậy."]]
    },
    {
      id: "b1-u4", title: "Bạn đi đâu?", zhTitle: "你去哪儿？", goal: "Hỏi nơi đến và nói hành động di chuyển ngắn.",
      words: [["去","qù","Đi"],["哪儿","nǎr","Đâu / chỗ nào"],["学校","xuéxiào","Trường học"],["公司","gōngsī","Công ty"],["回","huí","Quay về"],["家","jiā","Nhà / gia đình"]],
      grammar: [["去 + địa điểm","Địa điểm đứng ngay sau 去.","我去公司。","Tôi đi công ty."],["去哪儿？","Đặt 哪儿 sau 去 để hỏi nơi đến.","你去哪儿？","Bạn đi đâu?"]],
      dialogue: [["A","你去哪儿？","Nǐ qù nǎr?","Bạn đi đâu?"],["B","我去公司。下午回家。","Wǒ qù gōngsī. Xiàwǔ huí jiā.","Tôi đi công ty. Chiều tôi về nhà."]]
    },
    {
      id: "b1-u5", title: "Bạn muốn ăn gì?", zhTitle: "你想吃什么？", goal: "Nói mong muốn, gọi món và hỏi đồ ăn thức uống.",
      words: [["想","xiǎng","Muốn"],["吃","chī","Ăn"],["喝","hē","Uống"],["米饭","mǐfàn","Cơm"],["水","shuǐ","Nước"],["茶","chá","Trà"]],
      grammar: [["想 + động từ","想 đứng trước hành động để diễn đạt mong muốn.","我想喝茶。","Tôi muốn uống trà."],["Động từ + 什么？","Đặt 什么 sau động từ để hỏi đối tượng.","你想吃什么？","Bạn muốn ăn gì?"]],
      dialogue: [["A","你想吃什么？","Nǐ xiǎng chī shénme?","Bạn muốn ăn gì?"],["B","我想吃米饭，也想喝茶。","Wǒ xiǎng chī mǐfàn, yě xiǎng hē chá.","Tôi muốn ăn cơm, cũng muốn uống trà."]]
    },
    {
      id: "b1-u6", title: "Bạn làm việc ở đâu?", zhTitle: "你在哪儿工作？", goal: "Nói nghề nghiệp, nơi làm việc và vị trí hiện tại.",
      words: [["工作","gōngzuò","Làm việc / công việc"],["在","zài","Ở / tại"],["工厂","gōngchǎng","Nhà máy"],["车间","chējiān","Xưởng sản xuất"],["银行","yínháng","Ngân hàng"],["职员","zhíyuán","Nhân viên"]],
      grammar: [["在 + nơi chốn + động từ","在 đặt trước nơi diễn ra hành động.","我在工厂工作。","Tôi làm việc ở nhà máy."],["在哪儿 + động từ？","Dùng để hỏi nơi hành động diễn ra.","你在哪儿工作？","Bạn làm việc ở đâu?"]],
      dialogue: [["A","你在哪儿工作？","Nǐ zài nǎr gōngzuò?","Bạn làm việc ở đâu?"],["B","我在工厂工作。我是职员。","Wǒ zài gōngchǎng gōngzuò. Wǒ shì zhíyuán.","Tôi làm việc ở nhà máy. Tôi là nhân viên."]]
    },
    {
      id: "b1-u7", title: "Ngân hàng Trung Quốc ở đâu?", zhTitle: "中国银行在哪儿？", goal: "Hỏi và chỉ vị trí bằng các từ phương hướng cơ bản.",
      words: [["这里","zhèlǐ","Ở đây"],["那里","nàlǐ","Ở đó"],["前面","qiánmiàn","Phía trước"],["后面","hòumiàn","Phía sau"],["旁边","pángbiān","Bên cạnh"],["中国银行","Zhōngguó Yínháng","Ngân hàng Trung Quốc"]],
      grammar: [["A 在 B + phương vị","Nói vị trí của A so với B.","银行在公司旁边。","Ngân hàng ở cạnh công ty."],["A 在哪儿？","Đưa đối tượng cần tìm lên đầu câu.","中国银行在哪儿？","Ngân hàng Trung Quốc ở đâu?"]],
      dialogue: [["A","请问，中国银行在哪儿？","Qǐngwèn, Zhōngguó Yínháng zài nǎr?","Xin hỏi, Ngân hàng Trung Quốc ở đâu?"],["B","在公司旁边。","Zài gōngsī pángbiān.","Ở bên cạnh công ty."]]
    },
    {
      id: "b1-u8", title: "Sinh nhật của bạn là ngày nào?", zhTitle: "你的生日是几月几号？", goal: "Hỏi và nói ngày, tháng, sinh nhật.",
      words: [["生日","shēngrì","Sinh nhật"],["月","yuè","Tháng"],["号","hào","Ngày (trong tháng)"],["今天","jīntiān","Hôm nay"],["明天","míngtiān","Ngày mai"],["几","jǐ","Mấy / bao nhiêu"]],
      grammar: [["几月几号？","Hỏi tháng và ngày; tiếng Trung nói tháng trước, ngày sau.","今天几月几号？","Hôm nay là ngày bao nhiêu tháng mấy?"],["A 的 B","的 nối người sở hữu với sự vật hoặc thông tin.","你的生日","Sinh nhật của bạn"]],
      dialogue: [["A","你的生日是几月几号？","Nǐ de shēngrì shì jǐ yuè jǐ hào?","Sinh nhật bạn là ngày nào?"],["B","我的生日是八月二十号。","Wǒ de shēngrì shì bā yuè èrshí hào.","Sinh nhật tôi là ngày 20 tháng 8."]]
    },
    {
      id: "b1-u9", title: "Bạn thích phim Mỹ hay phim Trung Quốc?", zhTitle: "你喜欢美国电影还是中国电影？", goal: "Nói sở thích và chọn giữa hai phương án.",
      words: [["喜欢","xǐhuan","Thích"],["电影","diànyǐng","Phim"],["美国","Měiguó","Nước Mỹ"],["中国","Zhōngguó","Trung Quốc"],["还是","háishi","Hay là (câu hỏi)"],["看","kàn","Xem / nhìn / đọc"]],
      grammar: [["A 还是 B？","Dùng 还是 trong câu hỏi lựa chọn.","你喝茶还是喝水？","Bạn uống trà hay uống nước?"],["喜欢 + danh từ/động từ","Sau 喜欢 có thể là một vật hoặc một hành động.","我喜欢看电影。","Tôi thích xem phim."]],
      dialogue: [["A","你喜欢美国电影还是中国电影？","Nǐ xǐhuan Měiguó diànyǐng háishi Zhōngguó diànyǐng?","Bạn thích phim Mỹ hay phim Trung Quốc?"],["B","我喜欢中国电影。","Wǒ xǐhuan Zhōngguó diànyǐng.","Tôi thích phim Trung Quốc."]]
    },
    {
      id: "b1-u10", title: "Nhà bạn có mấy người?", zhTitle: "你家有几口人？", goal: "Giới thiệu gia đình và hỏi số người.",
      words: [["有","yǒu","Có"],["口","kǒu","Khẩu (lượng từ cho người trong gia đình)"],["爸爸","bàba","Bố"],["妈妈","māma","Mẹ"],["哥哥","gēge","Anh trai"],["妹妹","mèimei","Em gái"]],
      grammar: [["有 + số lượng + danh từ","有 diễn đạt sự tồn tại hoặc sở hữu.","我家有四口人。","Nhà tôi có bốn người."],["几 + lượng từ + danh từ？","几 đứng trước lượng từ để hỏi số lượng nhỏ.","你家有几口人？","Nhà bạn có mấy người?"]],
      dialogue: [["A","你家有几口人？","Nǐ jiā yǒu jǐ kǒu rén?","Nhà bạn có mấy người?"],["B","我家有四口人：爸爸、妈妈、妹妹和我。","Wǒ jiā yǒu sì kǒu rén: bàba, māma, mèimei hé wǒ.","Nhà tôi có bốn người: bố, mẹ, em gái và tôi."]]
    }
  ];

  root.VDuckieMSUTONG = Object.freeze({
    version: "2.0",
    label: "MSUTONG Sơ cấp 1 · VDuckie companion",
    contentStatus: "10 bài học được, nội dung VDuckie nguyên bản theo thứ tự chủ đề công khai",
    lessons: lessons
  });
})(typeof window !== "undefined" ? window : globalThis);
