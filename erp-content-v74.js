(function (root) {
  "use strict";

  var lessons = [
    {
      id: "warehouse-stock",
      number: "01",
      title: "Kho và tồn kho",
      subtitle: "仓库与库存 (Kho và tồn kho)",
      goal: "Đọc được số liệu tồn, phân biệt tồn hệ thống với tồn thực tế và biết câu cần dùng khi số liệu không khớp.",
      scenario: "Bạn nhận báo cáo tồn kho cuối ngày và phải xác nhận số liệu trước khi cho xưởng lĩnh vật tư.",
      words: ["仓库", "库存", "期初库存", "结存", "实际库房", "库房负责人", "库存查询", "库存不足", "有库存", "数量"],
      workflow: [
        ["先查询系统库存。", "Trước tiên tra cứu tồn kho trên hệ thống."],
        ["再核对实际库房的数量。", "Sau đó đối chiếu số lượng trong kho thực tế."],
        ["如果有差异，就联系库房负责人。", "Nếu có chênh lệch thì liên hệ người phụ trách kho."],
        ["确认无误后再保存数据。", "Sau khi xác nhận chính xác mới lưu dữ liệu."]
      ],
      dialogue: "Kho thiếu vật tư"
    },
    {
      id: "material-issue",
      number: "02",
      title: "Lĩnh liệu và phát liệu",
      subtitle: "领料与发料 (Lĩnh liệu và phát liệu)",
      goal: "Nắm luồng xưởng yêu cầu vật tư, kho cấp phát và cách xử lý khi lĩnh thiếu hoặc thiếu điều chuyển.",
      scenario: "Công lệnh đã mở nhưng xưởng chưa nhận đủ nguyên vật liệu để bắt đầu sản xuất.",
      words: ["领料", "发料", "补领料", "领料检查", "未领料", "领料不足", "调拨", "补调拨", "急料", "原材料"],
      workflow: [
        ["先确认工单和材料品号。", "Trước tiên xác nhận công lệnh và mã nguyên vật liệu."],
        ["检查生产库是否有库存。", "Kiểm tra kho sản xuất có tồn hay không."],
        ["库存不足时先办理调拨。", "Khi thiếu tồn kho thì làm điều chuyển trước."],
        ["发料完成后核对实际领料数量。", "Sau khi phát liệu, đối chiếu số lượng lĩnh thực tế."]
      ],
      dialogue: "Công lệnh chưa lĩnh liệu"
    },
    {
      id: "work-order",
      number: "03",
      title: "Công lệnh và tiến độ",
      subtitle: "工单与进度 (Công lệnh và tiến độ)",
      goal: "Đọc trạng thái công lệnh, ngày bắt đầu, ngày hoàn thành và phát hiện lệnh chậm tiến độ.",
      scenario: "Quản lý yêu cầu kiểm tra các công lệnh đã mở nhưng chưa có sản lượng thực tế.",
      words: ["工单", "工单号", "生产订单", "生产指令", "制令编号", "制令状态", "开工日期", "实际开工期", "实际完工期", "计划入库日期"],
      workflow: [
        ["按工单号查询生产订单。", "Tra cứu đơn sản xuất theo số công lệnh."],
        ["核对制令状态和开工日期。", "Đối chiếu trạng thái lệnh và ngày bắt đầu."],
        ["检查实际产量和计划入库日期。", "Kiểm tra sản lượng thực tế và ngày nhập kho kế hoạch."],
        ["发现延期时立即通知生产部门。", "Khi phát hiện chậm tiến độ phải báo ngay cho bộ phận sản xuất."]
      ],
      dialogue: "Công lệnh quá hạn"
    },
    {
      id: "production-receipt",
      number: "04",
      title: "Hoàn công và nhập kho",
      subtitle: "完工与入库 (Hoàn công và nhập kho)",
      goal: "Kiểm tra sản lượng, chứng từ hoàn công và nhập thành phẩm đúng kho, đúng ngày.",
      scenario: "Xưởng báo đã hoàn thành nhưng trên ERP vẫn chưa xuất hiện số lượng nhập kho.",
      words: ["完工", "完工检查", "生产入库", "完工入库", "未入库", "实际产量", "预计产量", "成品", "半成品", "入库数量"],
      workflow: [
        ["先确认工单已经完工。", "Trước tiên xác nhận công lệnh đã hoàn thành."],
        ["核对实际产量和合格数量。", "Đối chiếu sản lượng thực tế và số lượng đạt."],
        ["建立生产入库单并选择正确库别。", "Lập phiếu nhập kho sản xuất và chọn đúng kho."],
        ["审核后再次查询入库数量。", "Sau khi duyệt, tra cứu lại số lượng nhập kho."]
      ],
      dialogue: "Thành phẩm chưa nhập kho"
    },
    {
      id: "bom-usage",
      number: "05",
      title: "BOM và định mức",
      subtitle: "物料清单与定额 (BOM và định mức)",
      goal: "So sánh lượng tiêu chuẩn với lượng dùng thực tế và xác định nguyên nhân vượt định mức.",
      scenario: "Một công lệnh dùng vật tư nhiều hơn BOM, cần kiểm tra trước khi điều chỉnh dữ liệu.",
      words: ["物料清单", "产品结构", "标准用量", "实际用量", "用量差异", "差异比率", "定额", "投料", "用料", "废料"],
      workflow: [
        ["先打开产品的物料清单。", "Trước tiên mở BOM của sản phẩm."],
        ["比较标准用量和实际用量。", "So sánh lượng tiêu chuẩn với lượng thực tế."],
        ["确认差异来自补料、废料还是设置错误。", "Xác nhận chênh lệch do bù liệu, phế liệu hay thiết lập sai."],
        ["审批变更后重新计算物料需求。", "Sau khi duyệt thay đổi, tính lại nhu cầu vật tư."]
      ],
      dialogue: "Sai định mức BOM"
    },
    {
      id: "transfer-count",
      number: "06",
      title: "Điều chuyển và kiểm kê",
      subtitle: "调拨与盘点 (Điều chuyển và kiểm kê)",
      goal: "Thực hiện điều chuyển đúng kho và xử lý chênh lệch sau kiểm kê.",
      scenario: "Vật tư có trong nhà máy nhưng đang nằm sai kho, cuối tháng lại phát sinh lệch kiểm kê.",
      words: ["调拨", "补调拨", "生产库别", "生产库别名称", "盘点", "仓库期初库存", "车间期初库存", "结存差异", "系统结存", "报表结存"],
      workflow: [
        ["确认调出库和调入库。", "Xác nhận kho chuyển đi và kho nhận."],
        ["核对品号、数量和库别。", "Đối chiếu mã hàng, số lượng và kho."],
        ["盘点期间暂停相关出入库操作。", "Trong lúc kiểm kê, tạm dừng các thao tác nhập xuất liên quan."],
        ["复盘后建立库存调整单。", "Sau khi kiểm đếm lại, lập phiếu điều chỉnh tồn kho."]
      ],
      dialogue: "Kiểm kê kho"
    },
    {
      id: "inventory-report",
      number: "07",
      title: "Báo cáo nhập–xuất–tồn",
      subtitle: "进销存报表 (Báo cáo nhập–xuất–tồn)",
      goal: "Đối chiếu báo cáo và hệ thống theo công thức tồn đầu + nhập − xuất = tồn cuối.",
      scenario: "Báo cáo Excel và ERP cho ra hai số tồn cuối khác nhau, bạn phải tìm dòng gây lệch.",
      words: ["进销存", "报表数据", "系统数据", "报表入库", "系统入库", "报表出库", "系统出库", "理论结存", "差异汇总", "差异原因"],
      workflow: [
        ["先统一报表的日期和库别。", "Trước tiên thống nhất ngày và kho của báo cáo."],
        ["逐项核对期初、入库和出库。", "Đối chiếu lần lượt đầu kỳ, nhập và xuất."],
        ["用理论结存定位差异。", "Dùng tồn lý thuyết để xác định chênh lệch."],
        ["记录差异原因并重新导出报表。", "Ghi nguyên nhân chênh lệch rồi xuất lại báo cáo."]
      ],
      dialogue: "Chênh lệch nhập – xuất – tồn"
    },
    {
      id: "exception-close",
      number: "08",
      title: "Bất thường và đóng lệnh",
      subtitle: "异常处理与结案 (Xử lý bất thường và kết thúc)",
      goal: "Phân tích lỗi, ghi phương án xử lý, duyệt dữ liệu và đóng công lệnh đúng điều kiện.",
      scenario: "Công lệnh đã hết việc nhưng còn thiếu chứng từ, chênh lệch vật tư hoặc chưa hoàn tất phê duyệt.",
      words: ["异常工单", "异常分析", "处理方案", "状态", "审核", "审批", "有效", "完工检查", "关闭", "生产报表"],
      workflow: [
        ["先检查工单的领料和入库记录。", "Trước tiên kiểm tra lịch sử lĩnh liệu và nhập kho của công lệnh."],
        ["分析异常并填写处理方案。", "Phân tích bất thường và điền phương án xử lý."],
        ["确认所有单据已经审核。", "Xác nhận mọi chứng từ đã được duyệt."],
        ["完成检查后关闭工单。", "Sau khi kiểm tra xong thì đóng công lệnh."]
      ],
      dialogue: "Đóng công lệnh"
    }
  ];

  var specificExamples = {
    "生产线": ["这条生产线今天开始生产。", "Chuyền sản xuất này hôm nay bắt đầu sản xuất."],
    "急料": ["这批急料必须今天送到车间。", "Lô vật liệu gấp này phải được chuyển tới xưởng trong hôm nay."],
    "开工": ["材料齐全以后才能开工。", "Chỉ được bắt đầu sản xuất sau khi vật liệu đã đầy đủ."],
    "操作": ["请按照流程进行系统操作。", "Vui lòng thao tác trên hệ thống đúng theo quy trình."],
    "设置": ["这个参数需要重新设置。", "Tham số này cần được thiết lập lại."],
    "导出": ["请重新导出今天的报表。", "Vui lòng xuất lại báo cáo hôm nay."],
    "导入": ["导入数据前要先检查格式。", "Trước khi nhập dữ liệu phải kiểm tra định dạng."],
    "有效": ["这张单据目前仍然有效。", "Chứng từ này hiện vẫn còn hiệu lực."],
    "加工": ["这批零件由外部厂商加工。", "Lô linh kiện này được nhà cung cấp bên ngoài gia công."],
    "维护": ["基础资料需要定期维护。", "Dữ liệu cơ bản cần được bảo trì định kỳ."],
    "审核": ["保存单据后请提交审核。", "Sau khi lưu chứng từ, vui lòng gửi duyệt."],
    "审批": ["这个变更还在等待审批。", "Thay đổi này vẫn đang chờ phê duyệt."],
    "测试": ["上线以前必须完成系统测试。", "Trước khi đưa vào sử dụng phải hoàn thành kiểm thử hệ thống."],
    "培训": ["明天下午进行ERP操作培训。", "Chiều mai sẽ đào tạo thao tác ERP."],
    "实施": ["新流程将在下个月实施。", "Quy trình mới sẽ được triển khai vào tháng sau."],
    "部署": ["测试完成后再部署系统。", "Sau khi kiểm thử xong mới triển khai hệ thống."],
    "现场调研": ["实施前要先到车间做现场调研。", "Trước khi triển khai cần xuống xưởng khảo sát hiện trường."],
    "了解": ["我先了解实际流程，再修改系统。", "Tôi sẽ tìm hiểu quy trình thực tế trước rồi mới sửa hệ thống."],
    "自己解决": ["这个小问题我可以先自己解决。", "Vấn đề nhỏ này tôi có thể tự giải quyết trước."],
    "关闭": ["确认没有未完成单据后再关闭工单。", "Sau khi xác nhận không còn chứng từ chưa hoàn tất mới đóng công lệnh."],
    "销售": ["销售订单已经转成生产需求。", "Đơn bán hàng đã được chuyển thành nhu cầu sản xuất."],
    "采购": ["库存不足时需要申请采购。", "Khi tồn kho không đủ cần đề nghị mua hàng."],
    "生产": ["车间正在按计划生产。", "Xưởng đang sản xuất theo kế hoạch."],
    "完工": ["这张工单已经全部完工。", "Công lệnh này đã hoàn công toàn bộ."],
    "盘点": ["月底仓库要进行盘点。", "Cuối tháng kho phải tiến hành kiểm kê."],
    "外协": ["这道工序需要安排外协。", "Công đoạn này cần được bố trí gia công ngoài."]
  };

  var templates = {
    "Kho": [
      ["请核对{zh}的数量。", "Vui lòng đối chiếu số lượng liên quan đến {vi}."],
      ["系统里的{zh}需要再次确认。", "Mục {vi} trên hệ thống cần được xác nhận lại."],
      ["今天先检查{zh}。", "Hôm nay hãy kiểm tra {vi} trước."]
    ],
    "Sản xuất": [
      ["请确认{zh}是否符合生产计划。", "Vui lòng xác nhận {vi} có phù hợp kế hoạch sản xuất không."],
      ["这张工单需要检查{zh}。", "Công lệnh này cần kiểm tra {vi}."],
      ["我们今天核对{zh}数据。", "Hôm nay chúng ta đối chiếu dữ liệu {vi}."]
    ],
    "Kiểm tra": [
      ["系统提示{zh}，请确认原因。", "Hệ thống hiển thị {vi}; vui lòng xác nhận nguyên nhân."],
      ["请检查{zh}并记录结果。", "Vui lòng kiểm tra {vi} và ghi lại kết quả."],
      ["处理前先确认{zh}。", "Trước khi xử lý hãy xác nhận {vi}."]
    ],
    "Chứng từ": [
      ["请在系统中确认{zh}信息。", "Vui lòng xác nhận thông tin {vi} trên hệ thống."],
      ["这份报表需要填写{zh}。", "Báo cáo này cần điền {vi}."],
      ["保存前请核对{zh}。", "Trước khi lưu hãy đối chiếu {vi}."]
    ]
  };

  function fill(value, term) {
    return value.replace("{zh}", term[0]).replace("{vi}", term[3].toLowerCase());
  }

  var terms = root.ERP_TERMS || [];
  for (var i = 0; i < terms.length; i++) {
    var term = terms[i];
    if (term[6] && term[7]) continue;
    var specific = specificExamples[term[0]];
    if (specific) {
      term[6] = specific[0];
      term[7] = specific[1];
      continue;
    }
    var choices = templates[term[4]] || templates["Chứng từ"];
    var template = choices[i % choices.length];
    term[6] = fill(template[0], term);
    term[7] = fill(template[1], term);
  }

  root.ERPContentV74 = {
    version: "74.0",
    lessons: lessons,
    completedExampleCount: terms.filter(function (term) { return term[6] && term[7]; }).length
  };

  root.ERPScenariosV74 = [
    {
      title: "Điều chuyển sai kho",
      role: "Bạn là nhân viên ERP, đang sửa một phiếu điều chuyển chọn nhầm kho.",
      steps: [
        { prompt: "这张调拨单的调入库选错了。", promptVi: "Phiếu điều chuyển này đã chọn sai kho nhận.", target: "我先停止审核，再核对正确的生产库别。", targetVi: "Tôi sẽ dừng duyệt trước rồi đối chiếu đúng kho sản xuất.", required: [["停止", "取消"], ["审核"], ["生产库别", "库别"]] },
        { prompt: "物料已经到了正确的仓库。", promptVi: "Vật tư thực tế đã tới đúng kho.", target: "我会修改调拨单，不会重复搬动物料。", targetVi: "Tôi sẽ sửa phiếu điều chuyển, không di chuyển vật tư lặp lại.", required: [["修改", "调整"], ["调拨单"], ["物料"]] },
        { prompt: "修改后怎么确认？", promptVi: "Sau khi sửa thì xác nhận thế nào?", target: "我会重新审核，并查询两个仓库的库存。", targetVi: "Tôi sẽ duyệt lại và tra cứu tồn của cả hai kho.", required: [["审核"], ["查询", "检查"], ["仓库", "库存"]] }
      ]
    },
    {
      title: "Phiếu nhập kho bị từ chối",
      role: "Bạn là nhân viên ERP, hỗ trợ xưởng sửa phiếu nhập kho sản xuất.",
      steps: [
        { prompt: "生产入库单被退回了。", promptVi: "Phiếu nhập kho sản xuất đã bị trả lại.", target: "我先查看退回原因和审核意见。", targetVi: "Tôi xem nguyên nhân trả lại và ý kiến duyệt trước.", required: [["查看", "检查"], ["原因"], ["审核"]] },
        { prompt: "实际产量填写错了。", promptVi: "Sản lượng thực tế đã điền sai.", target: "我会核对完工数量，再修改实际产量。", targetVi: "Tôi sẽ đối chiếu số lượng hoàn công rồi sửa sản lượng thực tế.", required: [["核对"], ["完工", "数量"], ["修改", "实际产量"]] },
        { prompt: "改好以后怎么办？", promptVi: "Sửa xong thì làm gì?", target: "保存后重新提交审核，审核通过再入库。", targetVi: "Sau khi lưu sẽ gửi duyệt lại; duyệt xong mới nhập kho.", required: [["保存"], ["提交", "审核"], ["入库"]] }
      ]
    },
    {
      title: "Công lệnh quá hạn",
      role: "Bạn là nhân viên ERP, đang rà soát tiến độ công lệnh.",
      steps: [
        { prompt: "这个工单已经超过计划入库日期。", promptVi: "Công lệnh này đã quá ngày nhập kho kế hoạch.", target: "我先检查工单状态和实际产量。", targetVi: "Tôi kiểm tra trạng thái công lệnh và sản lượng thực tế trước.", required: [["检查"], ["工单", "状态"], ["实际产量"]] },
        { prompt: "车间说材料还没有到齐。", promptVi: "Xưởng nói vật liệu vẫn chưa về đủ.", target: "我会确认缺料明细，并通知采购和仓库。", targetVi: "Tôi sẽ xác nhận chi tiết thiếu liệu và báo mua hàng cùng kho.", required: [["确认"], ["缺料", "材料"], ["采购"], ["仓库"]] },
        { prompt: "计划日期需要调整吗？", promptVi: "Có cần điều chỉnh ngày kế hoạch không?", target: "确认新的交期后，我会申请调整计划入库日期。", targetVi: "Sau khi xác nhận hạn giao mới, tôi sẽ đề nghị điều chỉnh ngày nhập kho kế hoạch.", required: [["确认"], ["交期", "日期"], ["调整", "计划入库日期"]] }
      ]
    },
    {
      title: "Bổ lĩnh liệu do hao hụt",
      role: "Bạn là nhân viên ERP, xử lý yêu cầu bổ sung vật tư từ xưởng.",
      steps: [
        { prompt: "车间申请补领料，说生产中有损耗。", promptVi: "Xưởng xin bổ lĩnh liệu vì có hao hụt trong sản xuất.", target: "我先核对标准用量、实际用量和损耗数量。", targetVi: "Tôi đối chiếu lượng tiêu chuẩn, lượng thực tế và số lượng hao hụt trước.", required: [["核对"], ["标准用量"], ["实际用量"], ["损耗", "数量"]] },
        { prompt: "损耗超过了规定比例。", promptVi: "Hao hụt đã vượt tỷ lệ quy định.", target: "需要填写差异原因，并由负责人审批。", targetVi: "Cần điền nguyên nhân chênh lệch và để người phụ trách phê duyệt.", required: [["差异原因"], ["负责人"], ["审批"]] },
        { prompt: "审批通过以后怎么做？", promptVi: "Sau khi duyệt thì làm thế nào?", target: "我会建立补领料单，并通知仓库发料。", targetVi: "Tôi sẽ lập phiếu bổ lĩnh liệu và báo kho phát vật tư.", required: [["补领料"], ["通知"], ["仓库", "发料"]] }
      ]
    },
    {
      title: "Sản lượng thực tế bằng 0",
      role: "Bạn là nhân viên ERP, kiểm tra lệnh đã chạy nhưng chưa ghi nhận sản lượng.",
      steps: [
        { prompt: "工单已经开工三天，实际产量还是零。", promptVi: "Công lệnh đã chạy ba ngày nhưng sản lượng thực tế vẫn bằng 0.", target: "我先联系车间确认实际生产进度。", targetVi: "Tôi liên hệ xưởng để xác nhận tiến độ sản xuất thực tế trước.", required: [["联系"], ["车间"], ["确认", "生产", "进度"]] },
        { prompt: "车间已经完成了一部分产品。", promptVi: "Xưởng đã hoàn thành một phần sản phẩm.", target: "请补录完工数量和实际完工日期。", targetVi: "Vui lòng bổ sung số lượng hoàn công và ngày hoàn thành thực tế.", required: [["补录", "填写"], ["完工", "数量"], ["实际完工日期", "实际完工期"]] },
        { prompt: "补录后还要检查什么？", promptVi: "Sau khi bổ sung còn cần kiểm tra gì?", target: "我会核对生产入库单和工单状态。", targetVi: "Tôi sẽ đối chiếu phiếu nhập kho sản xuất và trạng thái công lệnh.", required: [["核对"], ["生产入库单", "入库"], ["工单", "状态"]] }
      ]
    },
    {
      title: "BOM thay đổi giữa kỳ",
      role: "Bạn là nhân viên ERP, xử lý thay đổi BOM khi công lệnh đang sản xuất.",
      steps: [
        { prompt: "产品结构已经变更，但是工单还在用旧BOM。", promptVi: "Cấu trúc sản phẩm đã thay đổi nhưng công lệnh vẫn dùng BOM cũ.", target: "我先确认变更生效日期和受影响的工单。", targetVi: "Tôi xác nhận ngày thay đổi có hiệu lực và các công lệnh bị ảnh hưởng trước.", required: [["确认"], ["变更", "生效", "日期"], ["工单"]] },
        { prompt: "这个工单需要使用新的材料。", promptVi: "Công lệnh này cần sử dụng vật liệu mới.", target: "我会申请变更物料清单，并重新计算需求。", targetVi: "Tôi sẽ đề nghị thay đổi BOM và tính lại nhu cầu.", required: [["申请", "变更"], ["物料清单"], ["重新", "计算", "需求"]] },
        { prompt: "旧材料已经领了怎么办？", promptVi: "Vật liệu cũ đã lĩnh rồi thì làm sao?", target: "先确认可否退料，再按新BOM补领料。", targetVi: "Trước tiên xác nhận có thể trả liệu không, sau đó bổ lĩnh theo BOM mới.", required: [["确认"], ["退料"], ["新BOM", "补领料"]] }
      ]
    },
    {
      title: "Kho âm trên hệ thống",
      role: "Bạn là nhân viên ERP, điều tra số tồn âm sau khi xuất kho.",
      steps: [
        { prompt: "系统库存变成负数了。", promptVi: "Tồn kho trên hệ thống đã thành số âm.", target: "我先停止继续出库，再检查最近的单据。", targetVi: "Tôi sẽ dừng xuất tiếp rồi kiểm tra các chứng từ gần nhất.", required: [["停止"], ["出库"], ["检查", "单据"]] },
        { prompt: "发现一张入库单还没有审核。", promptVi: "Phát hiện một phiếu nhập kho chưa được duyệt.", target: "我会核对实际到货数量，并尽快完成审核。", targetVi: "Tôi sẽ đối chiếu số lượng hàng thực tế và hoàn thành duyệt sớm nhất.", required: [["核对"], ["实际", "数量"], ["审核"]] },
        { prompt: "审核后库存正常了。", promptVi: "Sau khi duyệt, tồn kho đã bình thường.", target: "我会记录原因，并检查是否还有类似单据。", targetVi: "Tôi sẽ ghi lại nguyên nhân và kiểm tra còn chứng từ tương tự không.", required: [["记录", "原因"], ["检查"], ["单据"]] }
      ]
    },
    {
      title: "Đối chiếu cuối tháng",
      role: "Bạn là nhân viên ERP, đối chiếu số liệu kho trước khi khóa kỳ.",
      steps: [
        { prompt: "月底结账前要核对哪些数据？", promptVi: "Trước khi khóa sổ cuối tháng cần đối chiếu dữ liệu nào?", target: "要核对期初、入库、出库和期末结存。", targetVi: "Cần đối chiếu tồn đầu, nhập, xuất và tồn cuối kỳ.", required: [["期初"], ["入库"], ["出库"], ["结存"]] },
        { prompt: "报表结存和系统结存不同。", promptVi: "Tồn cuối báo cáo và hệ thống khác nhau.", target: "我会按日期和品号查找差异明细。", targetVi: "Tôi sẽ tìm chi tiết chênh lệch theo ngày và mã hàng.", required: [["日期"], ["品号"], ["差异", "明细"]] },
        { prompt: "差异处理完以后呢？", promptVi: "Sau khi xử lý chênh lệch thì sao?", target: "重新导出报表，确认无误后再结账。", targetVi: "Xuất lại báo cáo; xác nhận chính xác rồi mới khóa sổ.", required: [["导出", "报表"], ["确认", "无误"], ["结账"]] }
      ]
    },
    {
      title: "Đóng công lệnh",
      role: "Bạn là nhân viên ERP, kiểm tra điều kiện trước khi kết thúc công lệnh.",
      steps: [
        { prompt: "这张工单可以关闭了吗？", promptVi: "Công lệnh này có thể đóng chưa?", target: "我先检查领料、完工和生产入库记录。", targetVi: "Tôi kiểm tra lịch sử lĩnh liệu, hoàn công và nhập kho sản xuất trước.", required: [["检查"], ["领料"], ["完工"], ["生产入库", "入库"]] },
        { prompt: "还有一笔材料没有处理。", promptVi: "Vẫn còn một khoản vật liệu chưa được xử lý.", target: "需要确认是退料、补领料还是废料。", targetVi: "Cần xác nhận đó là trả liệu, bổ lĩnh hay phế liệu.", required: [["确认"], ["退料", "补领料", "废料"]] },
        { prompt: "所有数据都确认好了。", promptVi: "Mọi dữ liệu đã được xác nhận xong.", target: "审核生产报表后，我会关闭工单。", targetVi: "Sau khi duyệt báo cáo sản xuất, tôi sẽ đóng công lệnh.", required: [["审核"], ["生产报表"], ["关闭", "工单"]] }
      ]
    },
    {
      title: "Phế liệu vượt định mức",
      role: "Bạn là nhân viên ERP, phân tích phế liệu bất thường của một công lệnh.",
      steps: [
        { prompt: "这个工单的废料超过定额。", promptVi: "Phế liệu của công lệnh này vượt định mức.", target: "我先核对投料、实际产量和废料重量。", targetVi: "Tôi đối chiếu lượng cấp vào, sản lượng thực tế và trọng lượng phế liệu trước.", required: [["核对"], ["投料"], ["实际产量"], ["废料", "重量"]] },
        { prompt: "车间说是设备故障造成的。", promptVi: "Xưởng nói nguyên nhân là sự cố thiết bị.", target: "请车间填写异常原因和处理方案。", targetVi: "Đề nghị xưởng điền nguyên nhân bất thường và phương án xử lý.", required: [["车间"], ["异常", "原因"], ["处理方案"]] },
        { prompt: "系统数据需要调整吗？", promptVi: "Dữ liệu hệ thống có cần điều chỉnh không?", target: "审批通过后再调整实际用量和废料数量。", targetVi: "Chỉ sau khi phê duyệt mới điều chỉnh lượng dùng thực tế và số lượng phế liệu.", required: [["审批"], ["调整"], ["实际用量"], ["废料", "数量"]] }
      ]
    },
    {
      title: "Gia công ngoài chậm tiến độ",
      role: "Bạn là nhân viên ERP, theo dõi lô hàng đang gia công ngoài.",
      steps: [
        { prompt: "外协厂商还没有完成加工。", promptVi: "Nhà gia công ngoài vẫn chưa hoàn thành gia công.", target: "我先确认外协订单和预计完成日期。", targetVi: "Tôi xác nhận đơn gia công ngoài và ngày dự kiến hoàn thành trước.", required: [["确认"], ["外协", "订单"], ["预计", "完成", "日期"]] },
        { prompt: "厂商说还要延迟两天。", promptVi: "Nhà cung cấp nói cần chậm thêm hai ngày.", target: "我会更新进度，并通知生产计划人员。", targetVi: "Tôi sẽ cập nhật tiến độ và báo nhân viên kế hoạch sản xuất.", required: [["更新", "进度"], ["通知"], ["生产", "计划"]] },
        { prompt: "客户交期不能改变。", promptVi: "Hạn giao khách hàng không thể thay đổi.", target: "我会确认能否加急加工或安排其他厂商。", targetVi: "Tôi sẽ xác nhận có thể gia công gấp hoặc bố trí nhà cung cấp khác không.", required: [["确认"], ["加急", "加工"], ["厂商"]] }
      ]
    },
    {
      title: "Báo cáo sản xuất sai số liệu",
      role: "Bạn là nhân viên ERP, kiểm tra báo cáo sản xuất trước khi gửi quản lý.",
      steps: [
        { prompt: "生产报表的实际产量不正确。", promptVi: "Sản lượng thực tế trong báo cáo sản xuất không đúng.", target: "我先核对工单、完工记录和入库数量。", targetVi: "Tôi đối chiếu công lệnh, lịch sử hoàn công và số lượng nhập kho trước.", required: [["核对"], ["工单"], ["完工"], ["入库数量"]] },
        { prompt: "发现昨天的数据没有导入。", promptVi: "Phát hiện dữ liệu hôm qua chưa được nhập vào.", target: "我会检查文件格式，然后重新导入数据。", targetVi: "Tôi sẽ kiểm tra định dạng tệp rồi nhập lại dữ liệu.", required: [["检查"], ["格式"], ["重新", "导入", "数据"]] },
        { prompt: "重新导入后怎么确认？", promptVi: "Sau khi nhập lại thì xác nhận thế nào?", target: "再次核对汇总数据，确认无误后导出报表。", targetVi: "Đối chiếu lại dữ liệu tổng hợp; xác nhận đúng rồi xuất báo cáo.", required: [["核对", "汇总", "数据"], ["确认", "无误"], ["导出", "报表"]] }
      ]
    }
  ];
})(typeof window !== "undefined" ? window : this);
