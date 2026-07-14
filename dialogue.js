(function (root) {
  "use strict";

  var scenarios = [
    {
      title: "Kho thiếu vật tư",
      role: "Bạn là nhân viên ERP, đang phối hợp với kho.",
      steps: [
        {
          prompt: "这个工单的材料库存不足，你先检查一下。",
          promptVi: "Vật liệu của công lệnh này không đủ tồn kho, bạn kiểm tra trước đi.",
          target: "我先检查系统库存，再确认实际库存和工单用量。",
          targetVi: "Tôi kiểm tra tồn hệ thống trước, sau đó xác nhận tồn thực tế và lượng dùng của công lệnh.",
          required: [["检查", "核对"], ["库存"], ["工单", "用量"]]
        },
        {
          prompt: "系统库存和实际库存不一致，怎么办？",
          promptVi: "Tồn hệ thống và tồn thực tế không khớp, xử lý thế nào?",
          target: "我会记录差异，确认原因，然后通知仓库负责人。",
          targetVi: "Tôi sẽ ghi nhận chênh lệch, xác nhận nguyên nhân rồi thông báo người phụ trách kho.",
          required: [["差异"], ["原因"], ["仓库", "负责人"]]
        },
        {
          prompt: "确认后需要补领料，你会怎么处理？",
          promptVi: "Sau khi xác nhận cần bổ lĩnh liệu, bạn sẽ xử lý thế nào?",
          target: "我会先审核工单，再办理补领料。",
          targetVi: "Tôi sẽ duyệt công lệnh trước, sau đó làm bổ lĩnh liệu.",
          required: [["审核", "确认"], ["工单"], ["补领料"]]
        }
      ]
    },
    {
      title: "Thành phẩm chưa nhập kho",
      role: "Bạn là nhân viên ERP, đang kiểm tra tiến độ nhập kho.",
      steps: [
        {
          prompt: "这批成品已经完工，为什么还没有入库？",
          promptVi: "Lô thành phẩm này đã hoàn công, tại sao vẫn chưa nhập kho?",
          target: "我先检查完工数量和生产入库单。",
          targetVi: "Tôi kiểm tra số lượng hoàn công và phiếu nhập kho sản xuất trước.",
          required: [["检查", "核对"], ["完工", "数量"], ["入库"]]
        },
        {
          prompt: "实际产量和计划数量不一致。",
          promptVi: "Sản lượng thực tế và số lượng kế hoạch không khớp.",
          target: "我会确认差异原因，再修改实际产量。",
          targetVi: "Tôi sẽ xác nhận nguyên nhân chênh lệch rồi sửa sản lượng thực tế.",
          required: [["差异", "原因"], ["修改", "调整"], ["实际产量"]]
        },
        {
          prompt: "数据确认无误后怎么办？",
          promptVi: "Sau khi xác nhận dữ liệu không có sai sót thì làm gì?",
          target: "确认无误后，我会审核单据并完成入库。",
          targetVi: "Sau khi xác nhận chính xác, tôi sẽ duyệt chứng từ và hoàn tất nhập kho.",
          required: [["确认", "无误"], ["审核", "单据"], ["入库"]]
        }
      ]
    },
    {
      title: "Chênh lệch nhập – xuất – tồn",
      role: "Bạn là nhân viên ERP, đang đối chiếu báo cáo kho.",
      steps: [
        {
          prompt: "报表结存和系统结存有差异，请检查。",
          promptVi: "Tồn cuối báo cáo và tồn cuối hệ thống có chênh lệch, hãy kiểm tra.",
          target: "我先核对期初、入库数量和出库数量。",
          targetVi: "Tôi đối chiếu đầu kỳ, số lượng nhập và số lượng xuất trước.",
          required: [["核对", "检查"], ["期初"], ["入库"], ["出库"]]
        },
        {
          prompt: "差异来自一张未审核的出库单。",
          promptVi: "Chênh lệch đến từ một phiếu xuất kho chưa được duyệt.",
          target: "我会检查出库单，并联系仓库负责人确认。",
          targetVi: "Tôi sẽ kiểm tra phiếu xuất và liên hệ người phụ trách kho để xác nhận.",
          required: [["检查", "出库单"], ["联系"], ["仓库", "负责人"], ["确认"]]
        },
        {
          prompt: "处理完成后需要做什么？",
          promptVi: "Sau khi xử lý xong cần làm gì?",
          target: "我会更新处理方案，并重新导出报表。",
          targetVi: "Tôi sẽ cập nhật phương án xử lý và xuất lại báo cáo.",
          required: [["更新"], ["处理方案"], ["导出", "报表"]]
        }
      ]
    },
    {
      title: "Công lệnh chưa lĩnh liệu",
      role: "Bạn là nhân viên ERP, đang theo dõi công lệnh sản xuất.",
      steps: [
        {
          prompt: "这个生产订单已经开工，但是还没有领料。",
          promptVi: "Đơn sản xuất này đã bắt đầu nhưng vẫn chưa lĩnh liệu.",
          target: "我先确认工单状态和物料需求。",
          targetVi: "Tôi xác nhận trạng thái công lệnh và nhu cầu vật tư trước.",
          required: [["确认", "检查"], ["工单", "状态"], ["物料", "需求"]]
        },
        {
          prompt: "仓库说生产库没有库存。",
          promptVi: "Kho báo kho sản xuất không có tồn.",
          target: "我会检查库存，然后办理调拨。",
          targetVi: "Tôi sẽ kiểm tra tồn kho rồi làm điều chuyển.",
          required: [["检查", "库存"], ["调拨"]]
        },
        {
          prompt: "调拨完成后怎么办？",
          promptVi: "Sau khi điều chuyển hoàn tất thì làm gì?",
          target: "调拨完成后，我会通知仓库发料并继续生产。",
          targetVi: "Sau khi điều chuyển xong, tôi sẽ thông báo kho cấp vật tư và tiếp tục sản xuất.",
          required: [["通知", "仓库"], ["发料", "领料"], ["生产"]]
        }
      ]
    },
    {
      title: "Sai định mức BOM",
      role: "Bạn là nhân viên ERP, đang xử lý sai lệch định mức vật tư.",
      steps: [
        {
          prompt: "这个工单的实际用量超过了标准用量。",
          promptVi: "Lượng dùng thực tế của công lệnh này đã vượt lượng tiêu chuẩn.",
          target: "我先核对物料清单和实际领料数量。",
          targetVi: "Tôi đối chiếu BOM và số lượng lĩnh liệu thực tế trước.",
          required: [["核对", "检查"], ["物料清单"], ["领料", "数量"]]
        },
        {
          prompt: "物料清单里的用量设置错了。",
          promptVi: "Lượng dùng trong BOM đã được thiết lập sai.",
          target: "我会确认正确用量，再申请修改物料清单。",
          targetVi: "Tôi sẽ xác nhận lượng dùng đúng rồi đề nghị sửa BOM.",
          required: [["确认"], ["用量"], ["修改", "物料清单"]]
        },
        {
          prompt: "修改以后怎么确认数据？",
          promptVi: "Sau khi sửa thì xác nhận dữ liệu thế nào?",
          target: "我会重新计算需求，并核对工单差异。",
          targetVi: "Tôi sẽ tính lại nhu cầu và đối chiếu chênh lệch công lệnh.",
          required: [["重新", "计算"], ["需求"], ["核对", "工单", "差异"]]
        }
      ]
    },
    {
      title: "Kiểm kê kho",
      role: "Bạn là nhân viên ERP, đang phối hợp kiểm kê cuối tháng.",
      steps: [
        {
          prompt: "今天要盘点，请先冻结仓库数据。",
          promptVi: "Hôm nay cần kiểm kê, hãy khóa dữ liệu kho trước.",
          target: "我先确认所有单据已经审核，再冻结库存。",
          targetVi: "Tôi xác nhận mọi chứng từ đã được duyệt rồi mới khóa tồn kho.",
          required: [["确认"], ["单据", "审核"], ["冻结", "库存"]]
        },
        {
          prompt: "盘点数量和系统数量不一致。",
          promptVi: "Số lượng kiểm kê và số lượng hệ thống không khớp.",
          target: "我会记录盘点差异，并安排复盘。",
          targetVi: "Tôi sẽ ghi nhận chênh lệch kiểm kê và sắp xếp kiểm đếm lại.",
          required: [["记录"], ["盘点", "差异"], ["复盘"]]
        },
        {
          prompt: "复盘以后确认是系统错误。",
          promptVi: "Sau khi kiểm đếm lại xác nhận là lỗi hệ thống.",
          target: "我会提交库存调整单，审核后更新库存。",
          targetVi: "Tôi sẽ gửi phiếu điều chỉnh tồn kho, sau khi duyệt sẽ cập nhật tồn.",
          required: [["库存调整单"], ["审核"], ["更新", "库存"]]
        }
      ]
    },
    {
      title: "Trả hàng nhà cung cấp",
      role: "Bạn là nhân viên ERP, xử lý lô nguyên liệu không đạt.",
      steps: [
        {
          prompt: "这批原材料检验不合格，需要退货。",
          promptVi: "Lô nguyên liệu này kiểm nghiệm không đạt, cần trả hàng.",
          target: "我先确认检验结果和不合格数量。",
          targetVi: "Tôi xác nhận kết quả kiểm nghiệm và số lượng không đạt trước.",
          required: [["确认"], ["检验", "结果"], ["不合格", "数量"]]
        },
        {
          prompt: "供应商已经同意退货。",
          promptVi: "Nhà cung cấp đã đồng ý nhận trả hàng.",
          target: "我会建立采购退货单，并通知仓库备货。",
          targetVi: "Tôi sẽ lập phiếu trả hàng mua và thông báo kho chuẩn bị hàng.",
          required: [["采购退货单", "退货单"], ["通知"], ["仓库"]]
        },
        {
          prompt: "货物发出后还要处理什么？",
          promptVi: "Sau khi hàng được gửi đi còn cần xử lý gì?",
          target: "我会确认出库数量，并跟进供应商补货。",
          targetVi: "Tôi sẽ xác nhận số lượng xuất và theo dõi nhà cung cấp bù hàng.",
          required: [["确认", "出库", "数量"], ["跟进"], ["供应商", "补货"]]
        }
      ]
    },
    {
      title: "Đơn mua hàng chậm giao",
      role: "Bạn là nhân viên ERP, đang theo dõi tiến độ mua hàng.",
      steps: [
        {
          prompt: "采购订单已经到期，但是供应商还没交货。",
          promptVi: "Đơn mua đã đến hạn nhưng nhà cung cấp vẫn chưa giao.",
          target: "我先检查采购订单和预计到货日期。",
          targetVi: "Tôi kiểm tra đơn mua và ngày dự kiến hàng đến trước.",
          required: [["检查"], ["采购订单"], ["预计", "到货", "日期"]]
        },
        {
          prompt: "供应商说要晚三天交货。",
          promptVi: "Nhà cung cấp nói sẽ giao chậm ba ngày.",
          target: "我会更新交货日期，并通知生产部门。",
          targetVi: "Tôi sẽ cập nhật ngày giao và thông báo bộ phận sản xuất.",
          required: [["更新", "交货", "日期"], ["通知"], ["生产", "部门"]]
        },
        {
          prompt: "生产不能等三天，怎么办？",
          promptVi: "Sản xuất không thể chờ ba ngày, xử lý thế nào?",
          target: "我会确认现有库存，再申请紧急采购。",
          targetVi: "Tôi sẽ xác nhận tồn hiện có rồi đề nghị mua khẩn cấp.",
          required: [["确认", "库存"], ["申请"], ["紧急采购"]]
        }
      ]
    }
  ];

  var scenarioIndex = 0;
  var stepIndex = 0;
  var exerciseMode = "conversation";
  var roastVoice = true;
  var vietnameseAudio = null;
  var vietnameseSpeechId = 0;
  var reactionTimer = null;
  var reactionLeft = 8;
  var mediaRecorder = null;
  var mediaStream = null;
  var audioChunks = [];
  var audioUrl = "";

  function byId(id) {
    return document.getElementById(id);
  }

  function currentStep() {
    return scenarios[scenarioIndex].steps[stepIndex];
  }

  function setReading(text, pinyinId, nearId) {
    var pinyinElement = byId(pinyinId);
    var nearElement = byId(nearId);
    if (!text) {
      pinyinElement.textContent = "";
      nearElement.textContent = "";
      return;
    }
    var generated = root.ERPPronunciation && root.ERPPronunciation.generate(text);
    if (generated && generated.pinyin) {
      pinyinElement.textContent = generated.pinyin;
      nearElement.textContent = "Đọc gần: " + generated.nearVi;
      return;
    }
    pinyinElement.textContent = "Đang tạo pinyin…";
    nearElement.textContent = "";
    if (root.PinyinEngineReady) {
      root.PinyinEngineReady.then(function () {
        var latest = root.ERPPronunciation && root.ERPPronunciation.generate(text);
        if (latest && latest.pinyin) {
          pinyinElement.textContent = latest.pinyin;
          nearElement.textContent = "Đọc gần: " + latest.nearVi;
        }
      });
    }
  }

  function renderStep() {
    var scenario = scenarios[scenarioIndex];
    var step = currentStep();
    if (reactionTimer) root.clearInterval(reactionTimer);
    reactionTimer = null;
    reactionLeft = 8;
    byId("startReaction").textContent = "⏱ Bắt đầu 8 giây";
    byId("startReaction").className = exerciseMode === "reaction" ? "muted" : "muted hidden";
    byId("listenPrompt").className = exerciseMode === "translate" ? "speaker hidden" : "speaker";
    byId("dialogueRole").textContent = scenario.role;
    byId("dialogueProgress").textContent = "Lượt " + (stepIndex + 1) + " / " + scenario.steps.length;
    if (exerciseMode === "translate") {
      byId("dialoguePromptLabel").textContent = "DỊCH NHANH VIỆT → TRUNG";
      byId("dialoguePromptZh").textContent = step.targetVi;
      byId("dialoguePromptVi").textContent = "Nhập câu tiếng Trung. Pinyin và âm gần Việt sẽ tự hiện theo câu bạn nhập.";
      setReading("", "dialoguePromptPinyin", "dialoguePromptNear");
      byId("dialogueModeNote").textContent = "Mục tiêu: gọi đúng các ý ERP quan trọng, không bắt buộc giống hệt câu mẫu.";
      byId("dialogueAnswer").placeholder = "Nhập câu tiếng Trung từ nghĩa tiếng Việt phía trên";
    } else if (exerciseMode === "shadow") {
      byId("dialoguePromptLabel").textContent = "NGHE VÀ NHẠI";
      byId("dialoguePromptZh").textContent = step.target;
      byId("dialoguePromptVi").textContent = step.targetVi;
      setReading(step.target, "dialoguePromptPinyin", "dialoguePromptNear");
      byId("dialogueModeNote").textContent = "Nghe câu mẫu, nhìn pinyin và âm gần Việt, rồi bấm “Đọc và chấm”.";
      byId("dialogueAnswer").placeholder = "Đọc bằng microphone; máy sẽ điền câu đã nghe vào đây";
    } else {
      byId("dialoguePromptLabel").textContent = exerciseMode === "reaction" ? "PHẢN XẠ 8 GIÂY" : "HỆ THỐNG NÓI";
      byId("dialoguePromptZh").textContent = step.prompt;
      byId("dialoguePromptVi").textContent = step.promptVi;
      setReading(step.prompt, "dialoguePromptPinyin", "dialoguePromptNear");
      byId("dialogueModeNote").textContent = exerciseMode === "reaction" ? "Bấm bắt đầu, trả lời trước khi đồng hồ về 0 rồi chấm nội dung hoặc phát âm." : "Trả lời tự do theo tình huống. Máy chấm các ý nghiệp vụ bắt buộc.";
      byId("dialogueAnswer").placeholder = "Nhập câu tiếng Trung hoặc dùng microphone";
    }

    byId("dialogueTargetZh").textContent = step.target;
    byId("dialogueTargetVi").textContent = step.targetVi;
    setReading(step.target, "dialogueTargetPinyin", "dialogueTargetNear");

    byId("dialogueHint").className = "dialogue-hint hidden";
    byId("dialogueAnswer").value = "";
    setReading("", "dialogueAnswerPinyin", "dialogueAnswerNear");
    byId("dialogueFeedback").className = "dialogue-feedback hidden";
    byId("dialogueFeedback").textContent = "";
    byId("pronunciationFeedback").className = "dialogue-feedback hidden";
    byId("recognizedBlock").className = "recognized hidden";
    byId("nextDialogue").className = "accent hidden";
  }

  function normalizeChinese(value) {
    return String(value || "").replace(/[\s，。！？、,.!?；;：:]/g, "");
  }

  function keywordResult(answer, groups) {
    var normalized = normalizeChinese(answer);
    var matched = 0;
    for (var i = 0; i < groups.length; i++) {
      var groupMatched = false;
      for (var j = 0; j < groups[i].length; j++) {
        if (normalized.indexOf(groups[i][j]) !== -1) groupMatched = true;
      }
      if (groupMatched) matched++;
    }
    return { matched: matched, total: groups.length, score: groups.length ? matched / groups.length : 0 };
  }

  function checkTypedAnswer() {
    if (reactionTimer) {
      root.clearInterval(reactionTimer);
      reactionTimer = null;
      byId("startReaction").textContent = "⏱ Làm lại 8 giây";
    }
    var answer = byId("dialogueAnswer").value.trim();
    var feedback = byId("dialogueFeedback");
    feedback.className = "dialogue-feedback";
    if (!answer) {
      feedback.textContent = "Chưa nhập gì thì không có gì để chấm. Hãy nói hoặc nhập một câu Trung.";
      return;
    }
    var result = keywordResult(answer, currentStep().required);
    if (result.score === 1) {
      feedback.className = "dialogue-feedback good";
      feedback.textContent = "Đạt: đủ " + result.total + "/" + result.total + " ý ERP quan trọng. Có thể chuyển sang lượt tiếp theo.";
      byId("nextDialogue").className = "accent";
    } else if (result.score >= 0.5) {
      feedback.className = "dialogue-feedback medium";
      feedback.textContent = "Tạm được: mới có " + result.matched + "/" + result.total + " ý quan trọng. Xem câu mẫu rồi bổ sung cho đủ.";
    } else {
      feedback.className = "dialogue-feedback bad";
      feedback.textContent = "Khá tệ: chỉ có " + result.matched + "/" + result.total + " ý quan trọng. Câu này chưa xử lý đúng nghiệp vụ; mở gợi ý và làm lại.";
    }
  }

  function longestCommonSubsequence(a, b) {
    var previous = new Array(b.length + 1).fill(0);
    for (var i = 1; i <= a.length; i++) {
      var current = new Array(b.length + 1).fill(0);
      for (var j = 1; j <= b.length; j++) {
        current[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
      }
      previous = current;
    }
    return previous[b.length];
  }

  function pronunciationScore(transcript, target) {
    var heard = normalizeChinese(transcript);
    var expected = normalizeChinese(target);
    if (!heard || !expected) return 0;
    return (2 * longestCommonSubsequence(heard, expected)) / (heard.length + expected.length);
  }

  function pronunciationComment(score) {
    var percent = Math.round(score * 100);
    var comments;
    if (score >= 0.9) {
      comments = [
        "Được — " + percent + "%. Lần này mày đọc ra hồn, máy nhận gần như trọn câu.",
        "Ổn áp — " + percent + "%. Cuối cùng mày cũng phát âm giống tiếng Trung chứ không phải thần chú gọi kho.",
        "Khá chuẩn — " + percent + "%. Hôm nay mồm mày chịu hợp tác, người nghe không phải đoán mò nữa.",
        "Qua đẹp — " + percent + "%. Câu này đủ rõ để người trong kho hiểu ngay, chưa cần gọi phiên dịch cứu hộ.",
        "Nghe ra tiếng Trung tử tế — " + percent + "%. Hiếm khi mày không bóp méo câu mẫu; giữ đúng nhịp này.",
        "Thoát nạn — " + percent + "%. Lần này âm và nhịp đều đứng đúng chỗ, không có chữ nào bị mày hành hạ.",
        "Đáng tin — " + percent + "%. Nói câu này trong xưởng thì người ta xử lý nghiệp vụ được, không phải nhíu mày giải mã."
      ];
    } else if (score >= 0.72) {
      comments = [
        "Tạm nghe được — " + percent + "%. Đừng vội ảo tưởng; vài âm và thanh điệu vẫn còn nhão như cháo.",
        "Chưa đến mức mất mặt — " + percent + "%. Nhưng mày vẫn đang nuốt chữ, đọc lại cho gọn.",
        "Qua cửa nhưng đừng gáy — " + percent + "%. Người nghe hiểu được, song vài chữ vẫn bị mày bẻ cong không thương tiếc.",
        "Tạm sống — " + percent + "%. Câu chưa nát, nhưng thanh điệu còn trượt như số liệu kho cuối tháng.",
        "Nghe được nhưng chưa sạch — " + percent + "%. Mày còn dính chữ và hụt âm cuối; đọc lại từng cụm cho tử tế.",
        "Chưa thành thảm họa — " + percent + "%. Tuy nhiên nhịp câu vẫn lộn xộn, nghe như công lệnh bị chen sai thứ tự.",
        "Có tiến bộ — " + percent + "%. Ít nhất máy hiểu phần lớn, nhưng đừng để mấy âm sai kéo cả câu xuống bùn."
      ];
    } else if (score >= 0.5) {
      comments = [
        "Tệ vãi — " + percent + "%. Mày đọc như đang nhai chữ rồi nhổ ra, máy chỉ nhận được khoảng nửa câu.",
        "Nghe chán đời — " + percent + "%. Câu mẫu một đằng, mày phát âm một nẻo. Nghe lại rồi đọc từng cụm.",
        "Lủng củng như báo cáo ghép tay — " + percent + "%. Có vài chữ đúng nhưng cả câu vẫn xiêu vẹo, nghe rất mệt.",
        "Mày cứu được nửa câu rồi bỏ mặc nửa còn lại — " + percent + "%. Phát âm kiểu đầu voi đuôi chuột thế này chưa dùng để giao tiếp được.",
        "Chưa chết hẳn nhưng đang hấp hối — " + percent + "%. Máy nhặt được vài từ, phần còn lại bị mày nghiền thành tiếng ồn.",
        "Người nghe phải đoán nhiều hơn nghe — " + percent + "%. Câu này có khung nhưng âm sai quá dày, sửa từng cụm ngay.",
        "Tạm nhận ra chủ đề ERP — " + percent + "%. Còn câu cụ thể là gì thì mày đã phát âm cho bay màu gần hết."
      ];
    } else {
      comments = [
        "Thảm hại — " + percent + "%. Mày đọc nát đến mức máy không biết đó là tiếng Trung hay tiếng ngoài hành tinh.",
        "Phát âm như đấm vào tai — " + percent + "%. Đọc kiểu này người trong kho nghe xong chỉ muốn đóng luôn công lệnh.",
        "Tệ không cứu nổi — " + percent + "%. Mày đang đọc mò chứ không phải nói tiếng Trung. Nghe mẫu, bám pinyin và làm lại từ đầu.",
        "Nát hơn báo cáo tồn kho bị sửa tay — " + percent + "%. Mỗi âm mày đọc lệch một hướng, ghép lại chẳng còn ra câu gì.",
        "Mày đọc như ERP mất kết nối giữa ca — " + percent + "%. Chữ có vào nhưng ý nghĩa chết sạch giữa đường.",
        "Pinyin nằm chình ình trước mắt mà vẫn đọc sai — " + percent + "%. Đây không còn là thiếu hướng dẫn, đây là đọc ẩu có hệ thống.",
        "Thanh điệu rơi sạch như hàng xuất kho không chứng từ — " + percent + "%. Nghe phẳng lì và méo mó đến mức không ai đoán nổi câu gốc.",
        "Nếu phát âm là chứng từ thì câu này bị trả về ngay — " + percent + "%. Sai từ đầu đến cuối, không đủ điều kiện duyệt.",
        "Người nghe không cần từ điển, họ cần phép màu — " + percent + "%. Mày vừa biến tiếng Trung thành một đống âm thanh vô tổ chức.",
        "Cái mic vừa phải gánh một tai nạn phát âm — " + percent + "%. Đừng đổ lỗi cho thiết bị; nghe mẫu rồi đọc lại từng cụm.",
        "Đây không phải giọng địa phương — " + percent + "%. Đây là mày tự phát minh ra một ngôn ngữ mà chẳng ai đăng ký sử dụng.",
        "Mày vừa biến một câu ERP bình thường thành mật mã — " + percent + "%. Người Trung nghe xong cũng phải xin bản dịch.",
        "Kho còn kiểm kê lại được, câu vừa rồi thì khó cứu — " + percent + "%. Âm đầu sai, âm cuối mất, thanh điệu chạy sạch.",
        "Âm đầu sai, âm cuối mất, ở giữa thì nhão — " + percent + "%. Mày phá câu này rất đồng đều, không chừa phần nào.",
        "Đọc như đang súc miệng bằng pinyin — " + percent + "%. Chữ nào cũng lùng bùng, dính vào nhau rồi biến dạng.",
        "Từng chữ bị mày hành hạ không thương tiếc — " + percent + "%. Câu mẫu rõ ràng mà qua miệng mày thành phế phẩm.",
        "Câu mẫu chạy một đường, mồm mày chạy đường khác — " + percent + "%. Hai bên không có nổi một cuộc gặp tử tế.",
        "Phiên dịch nghe câu này chắc cũng xin nghỉ giữa ca — " + percent + "%. Không đủ dữ kiện để đoán mày đang định nói gì.",
        "Máy nhận dạng không thông minh lắm, nhưng lần này lỗi chính vẫn là mày — " + percent + "%. Phát âm méo quá thì máy cũng chịu chết.",
        "Mày đang nói bằng niềm tin chứ không bằng phát âm — " + percent + "%. Không âm chuẩn, không thanh điệu, chỉ còn sự tự tin vô căn cứ.",
        "Đọc chậm đã tệ, đọc nhanh còn thành thảm họa — " + percent + "%. Quay lại tốc độ rùa bò và sửa từng âm một.",
        "Công lệnh còn có thể hủy, câu vừa rồi nên tiêu hủy — " + percent + "%. Đừng cố vá; nghe mẫu và đọc lại từ đầu.",
        "Không thể đổ hết cho thanh điệu nữa — " + percent + "%. Mày đang sai cả phụ âm, nguyên âm lẫn nhịp câu."
      ];
    }
    return comments[Math.floor(Math.random() * comments.length)];
  }

  function splitVietnameseSpeech(message) {
    var normalized = String(message || "")
      .replace(/%/g, " phần trăm")
      .replace(/[—–]/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) return [];
    var words = normalized.split(" ");
    var chunks = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var next = current ? current + " " + words[i] : words[i];
      if (next.length > 170 && current) {
        chunks.push(current);
        current = words[i];
      } else {
        current = next;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  function stopVietnameseSpeech() {
    vietnameseSpeechId++;
    if (!vietnameseAudio) return;
    vietnameseAudio.onended = null;
    vietnameseAudio.onerror = null;
    vietnameseAudio.pause();
    vietnameseAudio.removeAttribute("src");
    vietnameseAudio = null;
  }

  function markVietnameseVoiceError() {
    var feedback = byId("pronunciationFeedback");
    if (!feedback || /Không tải được giọng Việt trực tuyến/.test(feedback.textContent)) return;
    feedback.textContent += " Không tải được giọng Việt trực tuyến; kiểm tra mạng rồi bấm chấm lại.";
  }

  function playVietnameseChunk(chunks, index, speechId) {
    if (!roastVoice || speechId !== vietnameseSpeechId || index >= chunks.length) return;
    var audio = new root.Audio();
    vietnameseAudio = audio;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.src = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=" +
      encodeURIComponent(chunks[index]);
    audio.onended = function () {
      if (speechId === vietnameseSpeechId) playVietnameseChunk(chunks, index + 1, speechId);
    };
    audio.onerror = markVietnameseVoiceError;
    var playback = audio.play();
    if (playback && playback.catch) playback.catch(markVietnameseVoiceError);
  }

  function speakVietnamese(message) {
    if (!roastVoice || !root.Audio) return;
    stopVietnameseSpeech();
    var chunks = splitVietnameseSpeech(message);
    if (!chunks.length) return;
    playVietnameseChunk(chunks, 0, vietnameseSpeechId);
  }

  function startReactionChallenge() {
    if (reactionTimer) root.clearInterval(reactionTimer);
    reactionLeft = 8;
    var button = byId("startReaction");
    byId("dialogueAnswer").value = "";
    setReading("", "dialogueAnswerPinyin", "dialogueAnswerNear");
    byId("dialogueFeedback").className = "dialogue-feedback hidden";
    button.textContent = "Còn " + reactionLeft + " giây";
    byId("dialogueAnswer").focus();
    reactionTimer = root.setInterval(function () {
      reactionLeft--;
      button.textContent = reactionLeft > 0 ? "Còn " + reactionLeft + " giây" : "HẾT GIỜ";
      if (reactionLeft <= 0) {
        root.clearInterval(reactionTimer);
        reactionTimer = null;
        var feedback = byId("dialogueFeedback");
        feedback.className = "dialogue-feedback bad";
        feedback.textContent = "Hết 8 giây. Phản xạ chậm như hệ thống treo cuối tháng — câu chưa xong thì nghiệp vụ đã tắc. Chấm câu hiện tại hoặc làm lại.";
        speakVietnamese(feedback.textContent);
      }
    }, 1000);
  }

  function showRecognized(transcript) {
    if (reactionTimer) {
      root.clearInterval(reactionTimer);
      reactionTimer = null;
      byId("startReaction").textContent = "⏱ Làm lại 8 giây";
    }
    byId("recognizedBlock").className = "recognized";
    byId("recognizedZh").textContent = transcript;
    setReading(transcript, "recognizedPinyin", "recognizedNear");
    var score = pronunciationScore(transcript, currentStep().target);
    var feedback = byId("pronunciationFeedback");
    feedback.className = score >= 0.72 ? "dialogue-feedback good" : score >= 0.5 ? "dialogue-feedback medium" : "dialogue-feedback bad";
    var roast = pronunciationComment(score);
    feedback.textContent = roast + " Cách sửa: nghe lại câu mẫu, chia thành từng cụm ngắn, bám pinyin rồi đọc chậm trước khi tăng tốc. Điểm này là ước lượng từ nhận dạng giọng nói, không phải phép đo âm vị chuyên nghiệp.";
    speakVietnamese(roast);
  }

  function startSpeechAssessment() {
    byId("dialogueHint").className = "dialogue-hint";
    var Recognition = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!Recognition) {
      var feedback = byId("pronunciationFeedback");
      feedback.className = "dialogue-feedback bad";
      feedback.textContent = "Trình duyệt này không hỗ trợ nhận dạng giọng Trung. Bạn vẫn có thể ghi âm, nghe lại và đối chiếu với câu mẫu.";
      return;
    }
    var recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    byId("pronunciationFeedback").className = "dialogue-feedback";
    byId("pronunciationFeedback").textContent = "Đang nghe… Đọc câu mẫu bằng tiếng Trung.";
    recognition.onresult = function (event) {
      var transcript = event.results[0][0].transcript || "";
      showRecognized(transcript);
      byId("dialogueAnswer").value = transcript;
      setReading(transcript, "dialogueAnswerPinyin", "dialogueAnswerNear");
    };
    recognition.onerror = function (event) {
      byId("pronunciationFeedback").className = "dialogue-feedback bad";
      byId("pronunciationFeedback").textContent = event.error === "not-allowed" ? "Bạn chưa cấp quyền microphone." : "Không nhận được giọng nói. Kiểm tra microphone và thử lại.";
    };
    recognition.start();
  }

  function toggleRecording() {
    var button = byId("recordDialogue");
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      button.textContent = "● Ghi âm để nghe lại";
      return;
    }
    if (!navigator.mediaDevices || !root.MediaRecorder) {
      byId("pronunciationFeedback").className = "dialogue-feedback bad";
      byId("pronunciationFeedback").textContent = "Trình duyệt này không hỗ trợ ghi âm cục bộ.";
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      mediaStream = stream;
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = function (event) {
        if (event.data.size) audioChunks.push(event.data);
      };
      mediaRecorder.onstop = function () {
        var blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(blob);
        byId("recordedAudio").src = audioUrl;
        byId("recordedAudio").className = "recorded-audio";
        if (mediaStream) mediaStream.getTracks().forEach(function (track) { track.stop(); });
      };
      mediaRecorder.start();
      button.textContent = "■ Dừng ghi âm";
    }).catch(function () {
      byId("pronunciationFeedback").className = "dialogue-feedback bad";
      byId("pronunciationFeedback").textContent = "Không thể mở microphone. Hãy kiểm tra quyền truy cập của trình duyệt.";
    });
  }

  function init() {
    var selector = byId("dialogueScenario");
    if (!selector) return;
    for (var i = 0; i < scenarios.length; i++) {
      var option = document.createElement("option");
      option.value = String(i);
      option.textContent = scenarios[i].title;
      selector.appendChild(option);
    }
    selector.onchange = function () {
      scenarioIndex = Number(this.value);
      stepIndex = 0;
      renderStep();
    };
    byId("dialogueMode").onchange = function () {
      exerciseMode = this.value;
      renderStep();
    };
    byId("roastVoice").onclick = function () {
      roastVoice = !roastVoice;
      this.textContent = roastVoice ? "🔊 Chửi giọng Việt online: BẬT" : "🔇 Chửi giọng Việt online: TẮT";
      if (!roastVoice) {
        stopVietnameseSpeech();
        if (root.speechSynthesis) root.speechSynthesis.cancel();
      }
    };
    byId("listenPrompt").onclick = function () { root.speechSynthesis.cancel(); var text = exerciseMode === "shadow" ? currentStep().target : currentStep().prompt; var utterance = new SpeechSynthesisUtterance(text); utterance.lang = "zh-CN"; utterance.rate = 0.72; root.speechSynthesis.speak(utterance); };
    byId("listenTarget").onclick = function () { root.speechSynthesis.cancel(); var utterance = new SpeechSynthesisUtterance(currentStep().target); utterance.lang = "zh-CN"; utterance.rate = 0.68; root.speechSynthesis.speak(utterance); };
    byId("showDialogueHint").onclick = function () { byId("dialogueHint").className = "dialogue-hint"; };
    byId("useDialogueHint").onclick = function () { byId("dialogueAnswer").value = currentStep().target; setReading(currentStep().target, "dialogueAnswerPinyin", "dialogueAnswerNear"); };
    byId("checkDialogue").onclick = checkTypedAnswer;
    byId("assessSpeech").onclick = startSpeechAssessment;
    byId("startReaction").onclick = startReactionChallenge;
    byId("recordDialogue").onclick = toggleRecording;
    byId("dialogueAnswer").oninput = function () { setReading(this.value.trim(), "dialogueAnswerPinyin", "dialogueAnswerNear"); };
    byId("nextDialogue").onclick = function () {
      if (stepIndex < scenarios[scenarioIndex].steps.length - 1) {
        stepIndex++;
      } else {
        scenarioIndex = (scenarioIndex + 1) % scenarios.length;
        selector.value = String(scenarioIndex);
        stepIndex = 0;
      }
      renderStep();
    };
    renderStep();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
