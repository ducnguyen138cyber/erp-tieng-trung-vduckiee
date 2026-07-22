(function (root) {
  "use strict";
  if (root.VDuckieThoughts) return;

  var DATA = Object.freeze({
    1: Object.freeze([
      { id: "lv1-00a", zh: "这是哪里？", vi: "Đây là đâu vậy?" },
      { id: "lv1-00b", zh: "我出生了！", vi: "Tôi nở rồi!" },
      { id: "lv1-01", zh: "我要出生啦！", vi: "Tôi sắp chào đời rồi!" },
      { id: "lv1-02", zh: "外面的世界是什么样？", vi: "Thế giới bên ngoài trông như thế nào nhỉ?" },
      { id: "lv1-03", zh: "再努力一点点！", vi: "Cố thêm một chút nữa nào!" },
      { id: "lv1-04", zh: "我听见学习的声音了。", vi: "Tôi nghe thấy âm thanh học tập rồi." },
      { id: "lv1-05", zh: "今天也要积累经验。", vi: "Hôm nay cũng phải tích lũy kinh nghiệm." },
      { id: "lv1-06", zh: "壳上好像有一道小裂缝。", vi: "Hình như trên vỏ có một vết nứt nhỏ." },
      { id: "lv1-07", zh: "快一点长大吧！", vi: "Mau lớn lên thôi nào!" },
      { id: "lv1-08", zh: "我已经准备好了。", vi: "Tôi đã sẵn sàng rồi." },
      { id: "lv1-09", zh: "别急，我正在成长。", vi: "Đừng vội, tôi đang lớn lên đây." },
      { id: "lv1-10", zh: "下一次升级会发生什么？", vi: "Lần lên cấp tới sẽ xảy ra điều gì nhỉ?" }
    ]),
    2: Object.freeze([
      { id: "lv2-01", zh: "今天学什么？", vi: "Hôm nay học gì nhỉ?" },
      { id: "lv2-00", zh: "我要快快长大！", vi: "Tôi muốn lớn thật nhanh!" },
      { id: "lv2-02", zh: "我会认真听课。", vi: "Tôi sẽ chăm chú nghe bài." },
      { id: "lv2-03", zh: "这个汉字真有意思！", vi: "Chữ Hán này thú vị thật!" },
      { id: "lv2-04", zh: "再学十个词吧。", vi: "Học thêm mười từ nữa nhé." },
      { id: "lv2-05", zh: "我一定会进步。", vi: "Tôi nhất định sẽ tiến bộ." },
      { id: "lv2-06", zh: "先听一遍，再跟读。", vi: "Nghe một lượt trước rồi đọc theo." },
      { id: "lv2-07", zh: "别怕说错，继续说！", vi: "Đừng sợ nói sai, cứ nói tiếp!" },
      { id: "lv2-08", zh: "今天也要加油！", vi: "Hôm nay cũng phải cố gắng nhé!" },
      { id: "lv2-09", zh: "我记住这个词了。", vi: "Tôi nhớ được từ này rồi." },
      { id: "lv2-10", zh: "学习让我越来越聪明。", vi: "Học tập khiến tôi ngày càng thông minh." }
    ]),
    3: Object.freeze([
      { id: "lv3-01", zh: "我要认真学习！", vi: "Tôi phải học thật chăm!" },
      { id: "lv3-02", zh: "眼镜戴好，开始上课。", vi: "Đeo kính ngay ngắn rồi bắt đầu học." },
      { id: "lv3-03", zh: "今天的作业不能忘。", vi: "Không được quên bài tập hôm nay." },
      { id: "lv3-04", zh: "这个句子我会读。", vi: "Câu này tôi đọc được rồi." },
      { id: "lv3-05", zh: "先写汉字，再背单词。", vi: "Viết chữ Hán trước rồi học từ mới." },
      { id: "lv3-06", zh: "我的书包准备好了。", vi: "Cặp sách của tôi đã chuẩn bị xong." },
      { id: "lv3-07", zh: "红领巾要戴整齐。", vi: "Khăn quàng đỏ phải đeo thật ngay ngắn." },
      { id: "lv3-08", zh: "老师，这道题我会！", vi: "Thưa cô, bài này em làm được!" },
      { id: "lv3-09", zh: "错了也没关系，再来一次。", vi: "Sai cũng không sao, làm lại lần nữa." },
      { id: "lv3-10", zh: "每天进步一点点。", vi: "Mỗi ngày tiến bộ thêm một chút." }
    ]),
    4: Object.freeze([
      { id: "lv4-01", zh: "知识就是力量！", vi: "Kiến thức chính là sức mạnh!" },
      { id: "lv4-02", zh: "先看课件，再做笔记。", vi: "Xem bài giảng trước rồi ghi chép." },
      { id: "lv4-03", zh: "这个语法要多练习。", vi: "Ngữ pháp này cần luyện tập nhiều hơn." },
      { id: "lv4-04", zh: "今天去图书馆吧。", vi: "Hôm nay đi thư viện nhé." },
      { id: "lv4-05", zh: "我来查一下这个词。", vi: "Để tôi tra từ này một chút." },
      { id: "lv4-06", zh: "小组讨论马上开始。", vi: "Thảo luận nhóm sắp bắt đầu rồi." },
      { id: "lv4-07", zh: "先理解，再记忆。", vi: "Hiểu trước rồi mới ghi nhớ." },
      { id: "lv4-08", zh: "我的发音越来越自然。", vi: "Phát âm của tôi ngày càng tự nhiên." },
      { id: "lv4-09", zh: "这次测试一定要认真。", vi: "Bài kiểm tra lần này nhất định phải làm cẩn thận." },
      { id: "lv4-10", zh: "学到的知识要用起来。", vi: "Kiến thức đã học phải đem ra sử dụng." }
    ]),
    5: Object.freeze([
      { id: "lv5-01", zh: "先检查一下数据。", vi: "Trước tiên kiểm tra lại dữ liệu." },
      { id: "lv5-02", zh: "这个报表好像有问题。", vi: "Báo cáo này hình như có vấn đề." },
      { id: "lv5-03", zh: "请确认一下物料数量。", vi: "Hãy xác nhận lại số lượng vật tư." },
      { id: "lv5-04", zh: "邮件发出前再检查一次。", vi: "Kiểm tra lại một lần trước khi gửi email." },
      { id: "lv5-05", zh: "今天的任务要按时完成。", vi: "Nhiệm vụ hôm nay phải hoàn thành đúng giờ." },
      { id: "lv5-06", zh: "系统里的数据要一致。", vi: "Dữ liệu trong hệ thống phải đồng nhất." },
      { id: "lv5-07", zh: "我先整理一下资料。", vi: "Tôi sắp xếp lại tài liệu trước." },
      { id: "lv5-08", zh: "这个流程还可以优化。", vi: "Quy trình này vẫn có thể tối ưu." },
      { id: "lv5-09", zh: "先问清楚，再处理。", vi: "Hỏi cho rõ trước rồi mới xử lý." },
      { id: "lv5-10", zh: "工作也能帮助我学中文。", vi: "Công việc cũng giúp tôi học tiếng Trung." }
    ]),
    6: Object.freeze([
      { id: "lv6-01", zh: "我们一起解决问题。", vi: "Chúng ta cùng giải quyết vấn đề." },
      { id: "lv6-02", zh: "先看进度，再安排任务。", vi: "Xem tiến độ trước rồi sắp xếp công việc." },
      { id: "lv6-03", zh: "这个风险需要提前处理。", vi: "Rủi ro này cần được xử lý sớm." },
      { id: "lv6-04", zh: "请把最新数据发给我。", vi: "Hãy gửi cho tôi dữ liệu mới nhất." },
      { id: "lv6-05", zh: "会议前要准备充分。", vi: "Phải chuẩn bị kỹ trước cuộc họp." },
      { id: "lv6-06", zh: "目标要清楚，责任要明确。", vi: "Mục tiêu phải rõ, trách nhiệm phải minh bạch." },
      { id: "lv6-07", zh: "今天先处理最重要的事。", vi: "Hôm nay xử lý việc quan trọng nhất trước." },
      { id: "lv6-08", zh: "数据变化值得关注。", vi: "Biến động dữ liệu này đáng chú ý." },
      { id: "lv6-09", zh: "问题找到了，就容易解决。", vi: "Tìm ra vấn đề thì sẽ dễ giải quyết." },
      { id: "lv6-10", zh: "团队配合比一个人更快。", vi: "Phối hợp nhóm nhanh hơn làm một mình." }
    ]),
    7: Object.freeze([
      { id: "lv7-01", zh: "这个问题交给我。", vi: "Vấn đề này cứ giao cho tôi." },
      { id: "lv7-02", zh: "先分析原因，再给方案。", vi: "Phân tích nguyên nhân trước rồi đưa phương án." },
      { id: "lv7-03", zh: "经验要变成标准流程。", vi: "Kinh nghiệm cần được biến thành quy trình chuẩn." },
      { id: "lv7-04", zh: "这组数据说明了趋势。", vi: "Nhóm dữ liệu này cho thấy xu hướng." },
      { id: "lv7-05", zh: "让我再验证一次。", vi: "Để tôi xác minh lại một lần nữa." },
      { id: "lv7-06", zh: "细节决定结果。", vi: "Chi tiết quyết định kết quả." },
      { id: "lv7-07", zh: "系统稳定比功能多更重要。", vi: "Hệ thống ổn định quan trọng hơn nhiều chức năng." },
      { id: "lv7-08", zh: "这个方案可以长期使用。", vi: "Phương án này có thể sử dụng lâu dài." },
      { id: "lv7-09", zh: "先做小范围测试。", vi: "Kiểm thử trong phạm vi nhỏ trước." },
      { id: "lv7-10", zh: "专业来自持续练习。", vi: "Sự chuyên nghiệp đến từ luyện tập liên tục." }
    ]),
    8: Object.freeze([
      { id: "lv8-01", zh: "方向比速度更重要。", vi: "Hướng đi quan trọng hơn tốc độ." },
      { id: "lv8-02", zh: "先确定目标，再分配资源。", vi: "Xác định mục tiêu trước rồi phân bổ nguồn lực." },
      { id: "lv8-03", zh: "团队需要清楚的优先级。", vi: "Đội ngũ cần thứ tự ưu tiên rõ ràng." },
      { id: "lv8-04", zh: "今天的决定影响长期结果。", vi: "Quyết định hôm nay ảnh hưởng kết quả dài hạn." },
      { id: "lv8-05", zh: "数据和现场都要看。", vi: "Phải xem cả dữ liệu lẫn thực tế hiện trường." },
      { id: "lv8-06", zh: "让流程更简单、更可靠。", vi: "Hãy làm quy trình đơn giản và đáng tin cậy hơn." },
      { id: "lv8-07", zh: "重要的问题不能拖。", vi: "Vấn đề quan trọng không thể trì hoãn." },
      { id: "lv8-08", zh: "听完意见再做决定。", vi: "Nghe hết ý kiến rồi mới quyết định." },
      { id: "lv8-09", zh: "稳定增长比短期冲刺更好。", vi: "Tăng trưởng ổn định tốt hơn chạy nước rút ngắn hạn." },
      { id: "lv8-10", zh: "领导也要不断学习。", vi: "Người lãnh đạo cũng phải không ngừng học hỏi." }
    ]),
    9: Object.freeze([
      { id: "lv9-01", zh: "每天进步一点点。", vi: "Mỗi ngày tiến bộ thêm một chút." },
      { id: "lv9-02", zh: "真正的高手重视基础。", vi: "Cao thủ thực sự coi trọng nền tảng." },
      { id: "lv9-03", zh: "先保持冷静，再判断。", vi: "Giữ bình tĩnh trước rồi mới phán đoán." },
      { id: "lv9-04", zh: "复杂的问题也能拆开解决。", vi: "Vấn đề phức tạp cũng có thể chia nhỏ để giải quyết." },
      { id: "lv9-05", zh: "经验越多，越要谨慎。", vi: "Càng nhiều kinh nghiệm càng phải thận trọng." },
      { id: "lv9-06", zh: "我还可以做得更好。", vi: "Tôi vẫn có thể làm tốt hơn nữa." },
      { id: "lv9-07", zh: "知识需要不断更新。", vi: "Kiến thức cần được cập nhật liên tục." },
      { id: "lv9-08", zh: "找到规律，效率就会提高。", vi: "Tìm ra quy luật thì hiệu suất sẽ tăng." },
      { id: "lv9-09", zh: "真正的成长没有终点。", vi: "Sự trưởng thành thực sự không có điểm dừng." },
      { id: "lv9-10", zh: "把困难变成新的经验。", vi: "Biến khó khăn thành kinh nghiệm mới." }
    ]),
    10: Object.freeze([
      { id: "lv10-01", zh: "学无止境！", vi: "Việc học không có điểm dừng!" },
      { id: "lv10-02", zh: "掌握知识，也要保持谦虚。", vi: "Nắm vững kiến thức nhưng vẫn phải khiêm tốn." },
      { id: "lv10-03", zh: "今天继续挑战更高目标。", vi: "Hôm nay tiếp tục chinh phục mục tiêu cao hơn." },
      { id: "lv10-04", zh: "经验要分享，能力才会放大。", vi: "Kinh nghiệm cần được chia sẻ để năng lực được nhân rộng." },
      { id: "lv10-05", zh: "我来看看还有哪里能改进。", vi: "Để tôi xem còn chỗ nào có thể cải thiện." },
      { id: "lv10-06", zh: "真正的强大来自持续成长。", vi: "Sức mạnh thật sự đến từ trưởng thành liên tục." },
      { id: "lv10-07", zh: "先读懂问题，再写答案。", vi: "Hiểu rõ vấn đề trước rồi mới viết câu trả lời." },
      { id: "lv10-08", zh: "中文和ERP都要精通。", vi: "Phải thành thạo cả tiếng Trung lẫn ERP." },
      { id: "lv10-09", zh: "完成不是终点，优化才刚开始。", vi: "Hoàn thành chưa phải điểm cuối, tối ưu mới bắt đầu." },
      { id: "lv10-10", zh: "继续前进，别忘了享受过程。", vi: "Tiếp tục tiến lên và đừng quên tận hưởng hành trình." }
    ])
  });

  var bags = Object.create(null);
  var lastByLevel = Object.create(null);

  function normalizeLevel(level) {
    return Math.max(1, Math.min(10, Math.floor(Number(level || 1))));
  }

  function shuffled(list) {
    var result = list.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1));
      var temporary = result[index];
      result[index] = result[randomIndex];
      result[randomIndex] = temporary;
    }
    return result;
  }

  function refill(level) {
    var list = DATA[level] || DATA[1];
    var nextBag = shuffled(list);
    var previous = lastByLevel[level];
    if (nextBag.length > 1 && previous && nextBag[nextBag.length - 1].id === previous) {
      var swapIndex = nextBag.length - 2;
      var temporary = nextBag[swapIndex];
      nextBag[swapIndex] = nextBag[nextBag.length - 1];
      nextBag[nextBag.length - 1] = temporary;
    }
    bags[level] = nextBag;
  }

  function next(level) {
    var normalized = normalizeLevel(level);
    if (!bags[normalized] || !bags[normalized].length) refill(normalized);
    var thought = bags[normalized].pop();
    if (thought && thought.id === lastByLevel[normalized] && (DATA[normalized] || []).length > 1) {
      if (!bags[normalized].length) refill(normalized);
      var replacement = bags[normalized].pop();
      if (replacement) {
        bags[normalized].unshift(thought);
        thought = replacement;
      }
    }
    lastByLevel[normalized] = thought && thought.id || "";
    return thought || DATA[1][0];
  }

  root.VDuckieThoughts = Object.freeze({
    version: "95.0",
    data: DATA,
    next: next,
    list: function (level) { return (DATA[normalizeLevel(level)] || DATA[1]).slice(); },
    reset: function (level) {
      if (level == null) {
        bags = Object.create(null);
        lastByLevel = Object.create(null);
        return;
      }
      var normalized = normalizeLevel(level);
      delete bags[normalized];
      delete lastByLevel[normalized];
    }
  });
})(window);
