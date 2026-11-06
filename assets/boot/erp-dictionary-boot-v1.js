/* ERP terms v76/v77 and HSK dictionary boot scripts, preserved execution order. */
/* assets/v76/erp-terms-v76-core.js */
(function(root){
  "use strict";
  var terms=root.ERP_TERMS||(root.ERP_TERMS=[]);
  var existing=Object.create(null);
  var added=[];
  for(var i=0;i<terms.length;i++)if(terms[i]&&terms[i][0])existing[terms[i][0]]=true;

  function add(rows){
    for(var j=0;j<rows.length;j++){
      var row=rows[j];
      if(!row||!row[0]||existing[row[0]])continue;
      var term=[row[0],"","",row[1]||"",row[2]||"Chứng từ",row[3]||("Thuật ngữ dùng trong nghiệp vụ "+String(row[2]||"ERP").toLowerCase()+" của hệ thống ERP."),row[4]||"",row[5]||""];
      terms.push(term);
      added.push(term);
      existing[row[0]]=true;
    }
  }

  function updateUi(categories){
    if(typeof document==="undefined")return;
    var filters=document.getElementById("filters"),button;
    if(filters){
      for(var i=0;i<categories.length;i++){
        if(filters.querySelector('[data-category="'+categories[i]+'"]'))continue;
        button=document.createElement("button");
        button.type="button";
        button.setAttribute("data-category",categories[i]);
        button.textContent=categories[i];
        filters.appendChild(button);
      }
    }
    var count=document.querySelector(".home-resource-tile.resource-erp strong");
    if(count)count.textContent=terms.length+"+";
    var help=document.querySelector("#personal .personal-box .help");
    if(help)help.textContent="Nếu từ đã có trong bộ "+terms.length+" thuật ngữ, tiếng Trung, pinyin và âm gần Việt sẽ hiện ngay để bạn lưu.";
  }

  function findTerm(word){
    for(var i=0;i<terms.length;i++)if(terms[i][0]===word)return terms[i];
    return null;
  }

  function refreshVisiblePronunciation(){
    if(typeof document==="undefined")return;
    var cardHanzi=document.getElementById("cardHanzi");
    var cardTerm=cardHanzi?findTerm(cardHanzi.textContent):null;
    if(cardTerm){
      var cardPinyin=document.getElementById("cardPinyin");
      var cardNear=document.getElementById("cardNearVi");
      if(cardPinyin)cardPinyin.textContent=cardTerm[1]||"";
      if(cardNear)cardNear.textContent=cardTerm[2]||"—";
    }
    var quizHanzi=document.getElementById("quizHanzi");
    var quizTerm=quizHanzi?findTerm(quizHanzi.textContent):null;
    if(quizTerm){
      var quizPinyin=document.getElementById("quizPinyin");
      if(quizPinyin)quizPinyin.textContent=(quizTerm[1]||"")+" · "+(quizTerm[2]||"");
    }
    var search=document.getElementById("search");
    if(search&&typeof Event!=="undefined")search.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function fillPronunciation(){
    if(!root.ERPPronunciation||typeof root.ERPPronunciation.generate!=="function")return false;
    for(var i=0;i<added.length;i++){
      var result=root.ERPPronunciation.generate(added[i][0]);
      if(result){added[i][1]=result.pinyin||"";added[i][2]=result.nearVi||"";}
    }
    refreshVisiblePronunciation();
    return true;
  }

  function finish(categories,sourceCount){
    root.ERP_TERMS_V76={sourceCount:sourceCount,addedCount:added.length,totalCount:terms.length,categories:categories.slice(0)};
    updateUi(categories);
    if(typeof document!=="undefined"&&document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){updateUi(categories);},{once:true});
    if(root.PinyinEngineReady&&typeof root.PinyinEngineReady.then==="function")root.PinyinEngineReady.then(function(){if(!fillPronunciation())setTimeout(fillPronunciation,0);});
    else setTimeout(fillPronunciation,0);
  }

  root.VDuckieERPTermsV76={add:add,finish:finish,terms:terms,added:added};
})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v76/erp-terms-v76-production.js */
(function(root){"use strict";root.VDuckieERPTermsV76.add([
["接单式生产","Sản xuất theo đơn hàng (MTO)","Sản xuất","Chỉ sản xuất khi có đơn hàng hoặc nhu cầu cụ thể."],
["库存式生产","Sản xuất để tồn kho (MTS)","Sản xuất","Sản xuất dựa trên dự báo để bổ sung thành phẩm tồn kho."],
["装配式生产","Lắp ráp theo đơn hàng (ATO)","Sản xuất","Chuẩn bị bán thành phẩm chung trước, sau đó lắp ráp theo đơn."],
["按单设计","Thiết kế theo đơn hàng (ETO)","Sản xuất","Thiết kế sản phẩm riêng theo yêu cầu của từng đơn hàng."],
["批次需求计划","Kế hoạch nhu cầu theo lô (LRP)","Sản xuất","Tính nhu cầu sản xuất và mua hàng theo từng lô hoặc đơn hàng."],
["物料需求计划","Kế hoạch nhu cầu vật tư (MRP)","Sản xuất","Tính nhu cầu vật tư dựa trên kế hoạch và cấu trúc BOM."],
["毛需求","Nhu cầu gộp / nhu cầu thô","Sản xuất","Nhu cầu chưa khấu trừ tồn kho và nguồn cung hiện có."],
["净需求","Nhu cầu ròng","Sản xuất","Nhu cầu còn thiếu sau khi trừ tồn khả dụng và nguồn cung."],
["需求数量","Số lượng nhu cầu","Sản xuất","Số lượng cần đáp ứng tại một thời điểm hoặc cho một đơn hàng."],
["供给数量","Số lượng cung ứng","Sản xuất","Số lượng dự kiến nhập, sản xuất hoặc đang có thể đáp ứng nhu cầu."],
["需求截点","Mốc nhu cầu","Sản xuất","Thời điểm dùng để cắt và so sánh cung - cầu trong LRP."],
["供需平衡","Cân bằng cung cầu","Sản xuất","Trạng thái lượng cung vừa đủ đáp ứng nhu cầu."],
["安全库存","Tồn kho an toàn","Sản xuất","Mức tồn tối thiểu để giảm nguy cơ thiếu vật tư."],
["可用库存","Tồn kho khả dụng","Sản xuất","Lượng tồn có thể sử dụng sau khi trừ phần đã giữ chỗ."],
["最大补量","Lượng bổ sung tối đa","Sản xuất","Giới hạn cao nhất mà hệ thống được phép đề xuất bổ sung."],
["最低补量","Lượng bổ sung tối thiểu","Sản xuất","Số lượng tối thiểu cần sản xuất hoặc mua trong một lần bổ sung."],
["补货倍量","Bội số bổ sung hàng","Sản xuất","Số lượng đặt hoặc sản xuất phải theo bội số quy định."],
["固定前置天数","Số ngày chuẩn bị cố định","Sản xuất","Phần thời gian chuẩn bị không thay đổi theo số lượng."],
["变动前置天数","Số ngày chuẩn bị biến đổi","Sản xuất","Phần thời gian thay đổi theo số lượng sản xuất hoặc mua."],
["检验天数","Số ngày kiểm nghiệm","Sản xuất","Thời gian dự kiến dành cho kiểm tra chất lượng sau khi nhận hàng."],
["预计进货","Nhập hàng dự kiến","Sản xuất","Nguồn cung dự kiến sẽ về kho vào một ngày xác định."],
["计划销售量","Số lượng bán theo kế hoạch","Sản xuất","Lượng hàng dự kiến bán theo kế hoạch."],
["预计销售量","Số lượng bán dự kiến","Sản xuất","Lượng bán được dự báo hoặc đã dự kiến trên hệ thống."],
["计划领用量","Lượng sử dụng theo kế hoạch","Sản xuất","Lượng vật tư dự kiến lĩnh theo kế hoạch."],
["预计领用量","Lượng sử dụng dự kiến","Sản xuất","Lượng vật tư dự kiến sẽ được xuất dùng."],
["生产计划","Kế hoạch sản xuất","Sản xuất","Kế hoạch về sản phẩm, số lượng và thời gian cần sản xuất."],
["采购计划","Kế hoạch mua hàng","Sản xuất","Kế hoạch mua vật tư để đáp ứng nhu cầu."],
["生产计划锁定","Khóa kế hoạch sản xuất","Sản xuất","Xác nhận không cho hệ thống tự ý thay đổi kế hoạch đã duyệt."],
["生产计划发放","Phát hành kế hoạch sản xuất","Sản xuất","Chuyển kế hoạch đã khóa thành lệnh sản xuất."],
["采购计划锁定","Khóa kế hoạch mua hàng","Sản xuất","Xác nhận nội dung kế hoạch mua trước khi phát hành."],
["采购计划发放","Phát hành kế hoạch mua hàng","Sản xuất","Chuyển kế hoạch mua thành chứng từ mua hàng hoặc yêu cầu mua."],
["低阶码","Mã cấp thấp nhất","Sản xuất","Cấp thấp nhất của vật tư trong toàn bộ cấu trúc BOM, dùng khi tính nhu cầu."],
["展开BOM","Triển khai BOM","Sản xuất","Phân rã sản phẩm xuống các cấp vật tư để tính nhu cầu."],
["品号供需明细","Chi tiết cung cầu theo mã hàng","Sản xuất","Báo cáo theo dõi các nguồn cung và nhu cầu của từng mã hàng."],
["生产线负荷","Tải của chuyền sản xuất","Sản xuất","Khối lượng công việc dự kiến trên từng chuyền hoặc bộ phận."],
["断料风险","Nguy cơ đứt vật tư","Sản xuất","Rủi ro không có đủ vật tư đúng thời điểm sản xuất."],
["闲置库存","Tồn kho nhàn rỗi","Sản xuất","Hàng tồn không còn nhu cầu sử dụng trong thời gian dài."],
["插单","Chèn đơn gấp","Sản xuất","Đưa một đơn mới vào giữa kế hoạch đang thực hiện."],
["备料","Chuẩn bị vật tư","Sản xuất","Tập hợp và chuẩn bị vật tư trước khi sản xuất."],
["交货期","Thời hạn giao hàng","Sản xuất","Ngày hoặc khoảng thời gian phải giao hàng cho khách."],
["制造命令","Lệnh chế tạo / lệnh sản xuất","Sản xuất","Chứng từ chính thức giao nhiệm vụ sản xuất."],
["制令单","Phiếu lệnh sản xuất","Sản xuất","Phiếu ghi sản phẩm, số lượng, thời gian và đơn vị phụ trách."],
["制令单别","Loại lệnh sản xuất","Sản xuất","Mã phân loại chứng từ lệnh sản xuất."],
["开单日期","Ngày lập phiếu","Chứng từ","Ngày chứng từ được tạo trên hệ thống."],
["状态码","Mã trạng thái","Kiểm tra","Mã thể hiện tình trạng xử lý của chứng từ."],
["未完工","Chưa hoàn thành","Kiểm tra","Trạng thái lệnh sản xuất chưa hoàn tất."],
["指定完工","Chỉ định hoàn thành","Sản xuất","Người dùng chủ động đóng lệnh dù hệ thống chưa tự đóng."],
["自动完工","Tự động hoàn thành","Sản xuất","Hệ thống tự cập nhật lệnh sang trạng thái hoàn thành khi đủ điều kiện."],
["重工工单","Lệnh sản xuất lại / lệnh tái gia công","Sản xuất","Lệnh dùng để sửa hoặc làm lại sản phẩm lỗi."],
["预计开工日","Ngày dự kiến bắt đầu","Sản xuất","Ngày kế hoạch bắt đầu sản xuất."],
["预计完工日","Ngày dự kiến hoàn thành","Sản xuất","Ngày kế hoạch hoàn tất sản xuất."],
["需领用量","Số lượng cần lĩnh","Sản xuất","Lượng vật tư theo định mức cần xuất cho lệnh."],
["实际领用量","Số lượng lĩnh thực tế","Sản xuất","Lượng vật tư đã thực tế xuất cho sản xuất."],
["超领","Lĩnh vượt định mức","Sản xuất","Lĩnh vật tư nhiều hơn số lượng cần theo lệnh."],
["控制超领","Kiểm soát lĩnh vượt","Sản xuất","Thiết lập cho phép hoặc cấm lĩnh vượt số lượng trên lệnh."],
["自动领料","Tự động lĩnh liệu","Sản xuất","Hệ thống tự tạo nghiệp vụ xuất vật tư theo điều kiện cài đặt."],
["直接材料","Nguyên vật liệu trực tiếp","BOM","Vật tư cấu thành trực tiếp sản phẩm."],
["间接材料","Nguyên vật liệu gián tiếp","BOM","Vật tư phục vụ sản xuất nhưng không trực tiếp cấu thành sản phẩm."],
["材料形态","Loại hình vật liệu","BOM","Thuộc tính phân biệt vật tư trực tiếp, gián tiếp hoặc loại khác."],
["领料码","Mã phương thức lĩnh liệu","Sản xuất","Thiết lập cách thức hệ thống xử lý nghiệp vụ lĩnh vật tư."],
["退料","Trả vật tư về kho","Kho","Trả lại vật tư thừa hoặc không sử dụng sau khi đã lĩnh."],
["退料单","Phiếu trả vật tư","Chứng từ","Chứng từ ghi nhận vật tư từ xưởng trả về kho."],
["厂内领料单","Phiếu lĩnh liệu nội bộ","Chứng từ","Chứng từ xuất vật tư cho sản xuất trong nhà máy."],
["厂内退料单","Phiếu trả liệu nội bộ","Chứng từ","Chứng từ trả vật tư từ xưởng về kho."],
["生产入库单","Phiếu nhập kho sản xuất","Chứng từ","Chứng từ nhập thành phẩm hoặc bán thành phẩm sau sản xuất."],
["报废数量","Số lượng phế phẩm","Sản xuất","Số lượng sản phẩm hoặc vật tư bị xác định là phế."],
["报废库","Kho phế phẩm","Kho","Kho dùng để quản lý hàng hỏng hoặc đã báo phế."],
["加工计价","Tính giá gia công","Sản xuất","Xác định đơn giá hoặc chi phí gia công."],
["加工核价","Phê duyệt giá gia công","Sản xuất","Kiểm tra và xác nhận giá gia công với nhà cung cấp."],
["加工单价","Đơn giá gia công","Sản xuất","Giá gia công cho một đơn vị sản phẩm hoặc công đoạn."],
["托外加工","Gia công thuê ngoài","Sản xuất","Đưa sản phẩm hoặc công đoạn cho nhà cung cấp bên ngoài thực hiện."],
["托外制令","Lệnh gia công thuê ngoài","Sản xuất","Lệnh sản xuất giao cho đơn vị gia công bên ngoài."],
["托外领料","Xuất vật tư cho gia công ngoài","Sản xuất","Xuất vật tư để nhà cung cấp thực hiện gia công."],
["托外退料","Nhận trả vật tư từ gia công ngoài","Sản xuất","Vật tư chưa dùng được đơn vị gia công trả lại."],
["托外进货","Nhập hàng gia công ngoài","Sản xuất","Nhận hàng sau khi nhà cung cấp hoàn thành gia công."],
["托外验收","Nghiệm thu hàng gia công ngoài","Sản xuất","Kiểm tra và chấp nhận hàng gia công nhận về."],
["托外验退","Từ chối nhận hàng gia công ngoài","Sản xuất","Không chấp nhận hàng gia công do không đạt yêu cầu."],
["验退件","Hàng bị từ chối nghiệm thu","Kiểm tra","Hàng không đạt kiểm tra và phải trả lại nhà cung cấp."],
["托外退货","Trả hàng gia công ngoài","Sản xuất","Trả sản phẩm gia công cho nhà cung cấp sau khi đã nhận."],
["生产进度","Tiến độ sản xuất","Sản xuất","Tình trạng hoàn thành của lệnh theo thời gian."],
["完工数量","Số lượng hoàn thành","Sản xuất","Số lượng đã sản xuất xong."],
["在制品","Sản phẩm dở dang","Sản xuất","Sản phẩm đang trong quá trình sản xuất, chưa hoàn tất."],
["半成品","Bán thành phẩm","Sản xuất","Sản phẩm trung gian đã hoàn thành một số công đoạn."],
["成品","Thành phẩm","Sản xuất","Sản phẩm đã hoàn thành toàn bộ quy trình sản xuất."],
["产品结构","Cấu trúc sản phẩm","BOM","Quan hệ nhiều cấp giữa thành phẩm, bán thành phẩm và linh kiện."],
["主件","Sản phẩm chính / mã cha","BOM","Mã sản phẩm ở cấp trên trong BOM."],
["元件","Linh kiện / mã con","BOM","Vật tư hoặc bán thành phẩm cấu thành mã cha."],
["组成用量","Lượng cấu thành","BOM","Số lượng linh kiện cần cho một đơn vị hoặc một số lượng cơ sở."],
["底数","Số lượng cơ sở","BOM","Mẫu số dùng cùng lượng cấu thành để biểu diễn định mức."],
["损耗率","Tỷ lệ hao hụt","BOM","Tỷ lệ vật tư bổ sung do hao hụt trong sản xuất."],
["生效日","Ngày có hiệu lực","BOM","Ngày bắt đầu áp dụng dữ liệu BOM hoặc linh kiện."],
["失效日","Ngày hết hiệu lực","BOM","Ngày ngừng áp dụng dữ liệu BOM hoặc linh kiện."],
["替代料","Vật tư thay thế","BOM","Vật tư có thể thay cho vật tư chính khi cần."],
["取替代料","Khai báo vật tư thay thế","BOM","Thiết lập quan hệ thay thế giữa các mã vật tư."],
["BOM变更","Thay đổi BOM","BOM","Thay đổi linh kiện, định mức hoặc hiệu lực của cấu trúc sản phẩm."],
["工程变更单","Phiếu thay đổi kỹ thuật","BOM","Chứng từ ghi nhận và phê duyệt thay đổi kỹ thuật/BOM."],
["料件用量复制","Sao chép định mức vật tư","BOM","Sao chép dữ liệu dùng vật tư từ một BOM sang BOM khác."],
["元件资料批量修改","Sửa hàng loạt dữ liệu linh kiện","BOM","Cập nhật đồng thời một linh kiện trong nhiều BOM."],
["元件序号重整","Sắp xếp lại số thứ tự linh kiện","BOM","Đánh lại thứ tự các dòng linh kiện trong BOM."],
["自制件","Chi tiết tự sản xuất","BOM","Mã hàng do doanh nghiệp tự sản xuất."],
["采购件","Chi tiết mua ngoài","BOM","Mã vật tư được mua từ nhà cung cấp."],
["托外加工件","Chi tiết gia công ngoài","BOM","Mã hàng do nhà cung cấp bên ngoài gia công."],
["包装材料","Vật liệu đóng gói","BOM","Vật tư dùng để đóng gói sản phẩm."],
["标准成本","Giá thành tiêu chuẩn","BOM","Chi phí tiêu chuẩn dự kiến của sản phẩm."],
["本阶材料","Chi phí vật liệu cấp hiện tại","BOM","Chi phí vật liệu phát sinh trực tiếp ở cấp BOM hiện tại."],
["下阶材料","Chi phí vật liệu cấp dưới","BOM","Chi phí vật liệu được cộng dồn từ các cấp BOM thấp hơn."],
["本阶人工","Chi phí nhân công cấp hiện tại","BOM","Chi phí lao động trực tiếp ở công đoạn hoặc cấp hiện tại."],
["下阶人工","Chi phí nhân công cấp dưới","BOM","Chi phí lao động cộng dồn từ các cấp dưới."],
["本阶制造费用","Chi phí sản xuất chung cấp hiện tại","BOM","Chi phí chung phát sinh tại cấp sản xuất hiện tại."],
["下阶制造费用","Chi phí sản xuất chung cấp dưới","BOM","Chi phí chung cộng dồn từ các cấp dưới."],
["标准材料成本","Chi phí vật liệu tiêu chuẩn","BOM","Phần chi phí vật tư theo định mức tiêu chuẩn."],
["标准人工成本","Chi phí nhân công tiêu chuẩn","BOM","Phần chi phí lao động theo tiêu chuẩn."],
["标准制造费用","Chi phí sản xuất chung tiêu chuẩn","BOM","Chi phí sản xuất chung theo định mức."],
["材料品号","Mã nguyên vật liệu","BOM","Mã vật tư được sử dụng trên dòng BOM hoặc lệnh sản xuất."],
["主件品号","Mã sản phẩm chính","BOM","Mã cha được khai báo trong BOM."],
["用量资料","Dữ liệu định mức sử dụng","BOM","Dữ liệu số lượng vật tư cấu thành trong BOM."]
]);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v76/erp-terms-v76-warehouse-purchasing.js */
(function(root){"use strict";root.VDuckieERPTermsV76.add([
["进货","Nhập hàng mua","Kho","Nhận hàng từ nhà cung cấp và tăng tồn kho."],
["退货","Trả hàng mua","Kho","Trả hàng cho nhà cung cấp và giảm tồn kho."],
["销货","Xuất bán hàng","Kho","Xuất hàng giao cho khách và giảm tồn kho."],
["销退","Hàng bán bị trả lại","Kho","Nhận lại hàng khách trả và tăng tồn kho."],
["转拨单","Phiếu điều chuyển kho","Kho","Chứng từ chuyển hàng giữa hai kho."],
["转出库","Kho chuyển đi","Kho","Kho nguồn xuất hàng trong nghiệp vụ điều chuyển."],
["转入库","Kho nhận chuyển","Kho","Kho đích nhận hàng trong nghiệp vụ điều chuyển."],
["暂出","Tạm xuất / cho mượn","Kho","Đưa hàng ra ngoài tạm thời nhưng vẫn cần theo dõi."],
["暂入","Tạm nhập / mượn vào","Kho","Nhận hàng vào tạm thời mà chưa ghi nhận là hàng mua."],
["借出","Cho mượn hàng","Kho","Đưa vật tư hoặc hàng hóa cho bên khác mượn."],
["借入","Mượn hàng","Kho","Nhận vật tư hoặc hàng hóa của bên khác để sử dụng tạm."],
["归还","Hoàn trả","Kho","Trả lại hàng đã mượn hoặc nhận lại hàng đã cho mượn."],
["库存异动","Biến động tồn kho","Kho","Nghiệp vụ tăng hoặc giảm tồn không thuộc luồng mua bán thông thường."],
["一般异动","Biến động kho thông thường","Kho","Loại chứng từ điều chỉnh tăng giảm tồn kho trực tiếp."],
["库存明细表","Bảng chi tiết tồn kho","Kho","Báo cáo chi tiết nhập, xuất và tồn theo mã hàng."],
["库存明细账","Sổ chi tiết tồn kho","Kho","Sổ theo dõi toàn bộ biến động của từng mã hàng."],
["进耗存统计表","Bảng thống kê nhập - tiêu hao - tồn","Kho","Báo cáo tổng hợp nhập, sử dụng và tồn kho."],
["盘点","Kiểm kê","Kho","Đếm thực tế và đối chiếu với số lượng trên hệ thống."],
["账面数量","Số lượng sổ sách","Kho","Số lượng tồn được ghi nhận trên hệ thống."],
["实盘数量","Số lượng kiểm kê thực tế","Kho","Số lượng thực tế đếm được khi kiểm kê."],
["盘盈","Thừa kiểm kê","Kho","Số thực tế lớn hơn số trên hệ thống."],
["盘亏","Thiếu kiểm kê","Kho","Số thực tế nhỏ hơn số trên hệ thống."],
["批号","Số lô","Kho","Mã dùng để truy xuất một lô hàng hoặc vật tư."],
["主要库别","Kho mặc định chính","Kho","Kho mặc định được thiết lập cho mã hàng."],
["库别","Mã kho / loại kho","Kho","Mã phân biệt từng kho trong hệ thống."],
["仓管人员","Nhân viên quản lý kho","Kho","Người phụ trách nhập, xuất và quản lý tồn kho."],
["负库存","Tồn kho âm","Kho","Tình trạng số lượng tồn trên hệ thống nhỏ hơn 0."],
["月底成本计价","Tính giá vốn cuối tháng","Kho","Tính lại đơn giá và giá trị tồn kho vào cuối kỳ."],
["库存包装数量","Số lượng tồn theo đơn vị đóng gói","Kho","Tồn kho được quy đổi theo quy cách đóng gói."],
["库存单位成本","Đơn giá tồn kho","Kho","Giá trị bình quân hoặc đơn giá của hàng tồn."],
["库存金额","Giá trị tồn kho","Kho","Tổng giá trị tiền của hàng còn trong kho."],
["出入库记录","Lịch sử nhập xuất kho","Kho","Dữ liệu ghi lại các lần nhập và xuất hàng."],
["请购","Yêu cầu mua hàng","Mua hàng","Đề xuất nội bộ về việc cần mua vật tư hoặc dịch vụ."],
["请购单","Phiếu yêu cầu mua hàng","Mua hàng","Chứng từ do bộ phận có nhu cầu lập để đề nghị mua."],
["请购人员","Người yêu cầu mua","Mua hàng","Người trực tiếp đề xuất nhu cầu mua hàng."],
["请购部门","Bộ phận yêu cầu mua","Mua hàng","Đơn vị phát sinh nhu cầu mua."],
["来源类别","Loại nguồn phát sinh","Mua hàng","Cho biết yêu cầu mua đến từ MRP, LRP, BOM, đơn hàng hoặc nhập tay."],
["锁定码","Mã khóa","Mua hàng","Dấu hiệu cho biết dữ liệu đã được xác nhận và không được tùy ý sửa."],
["结案码","Mã kết thúc","Mua hàng","Trạng thái thể hiện chứng từ đã hoặc chưa đóng."],
["未结案","Chưa kết thúc","Mua hàng","Chứng từ vẫn còn số lượng hoặc công việc chưa hoàn thành."],
["自动结案","Tự động kết thúc","Mua hàng","Hệ thống tự đóng chứng từ khi đạt điều kiện."],
["指定结案","Chỉ định kết thúc","Mua hàng","Người dùng chủ động đóng chứng từ."],
["采购单","Đơn mua hàng","Mua hàng","Chứng từ chính thức đặt mua từ nhà cung cấp."],
["采购变更单","Phiếu thay đổi đơn mua hàng","Mua hàng","Chứng từ ghi nhận thay đổi đối với đơn mua đã phê duyệt."],
["采购预计进货表","Bảng dự kiến hàng mua về","Mua hàng","Báo cáo các mặt hàng dự kiến nhập theo đơn mua."],
["供应商","Nhà cung cấp","Mua hàng","Đơn vị cung cấp hàng hóa hoặc dịch vụ."],
["厂商代号","Mã nhà cung cấp","Mua hàng","Mã định danh nhà cung cấp trong ERP."],
["最低采购量","Số lượng mua tối thiểu","Mua hàng","Lượng tối thiểu nhà cung cấp yêu cầu cho mỗi lần đặt."],
["最近进价","Giá mua gần nhất","Mua hàng","Đơn giá mua ở lần giao dịch gần nhất."],
["标准进价","Giá mua tiêu chuẩn","Mua hàng","Đơn giá mua chuẩn dùng để tham khảo hoặc tính toán."],
["进货单","Phiếu nhập hàng mua","Mua hàng","Chứng từ ghi nhận hàng nhà cung cấp giao đến."],
["进货验收","Nghiệm thu hàng nhập","Mua hàng","Kiểm tra và xác nhận hàng nhập đạt yêu cầu."],
["验收数量","Số lượng nghiệm thu đạt","Mua hàng","Số lượng hàng được chấp nhận sau kiểm tra."],
["验退数量","Số lượng bị từ chối","Mua hàng","Số lượng không đạt và bị từ chối nhận."],
["验退件退回","Trả hàng bị từ chối nghiệm thu","Mua hàng","Giao lại hàng không đạt cho nhà cung cấp."],
["折让","Giảm giá / chiết giảm do lỗi","Mua hàng","Điều chỉnh giảm tiền phải trả thay vì trả hàng."],
["退货单","Phiếu trả hàng mua","Mua hàng","Chứng từ trả hàng đã nhập cho nhà cung cấp."],
["应付凭单","Chứng từ phải trả","Mua hàng","Chứng từ ghi nhận khoản công nợ phải trả nhà cung cấp."],
["手动结账","Đối soát thủ công","Mua hàng","Người dùng tự lựa chọn chứng từ để kết toán công nợ."],
["统计资料更新","Cập nhật dữ liệu thống kê","Mua hàng","Tái tính hoặc làm mới dữ liệu dùng cho báo cáo thống kê."],
["采购人员","Nhân viên mua hàng","Mua hàng","Người phụ trách tìm nguồn, đặt hàng và theo dõi giao hàng."],
["采购部门","Bộ phận mua hàng","Mua hàng","Đơn vị phụ trách hoạt động mua sắm."],
["预计到货日","Ngày dự kiến hàng về","Mua hàng","Ngày nhà cung cấp dự kiến giao hàng."],
["迟交品项","Mặt hàng giao trễ","Mua hàng","Mặt hàng đã quá hạn giao theo đơn mua."],
["采购数量","Số lượng mua","Mua hàng","Số lượng đặt trên đơn mua hàng."],
["未交数量","Số lượng chưa giao","Mua hàng","Phần số lượng nhà cung cấp chưa giao đủ."]
]);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v76/erp-terms-v76-sales-finance.js */
(function(root){"use strict";root.VDuckieERPTermsV76.add([
["报价","Báo giá","Bán hàng","Đề xuất giá và điều kiện bán cho khách hàng."],
["报价单","Phiếu báo giá","Bán hàng","Chứng từ ghi giá, số lượng và điều kiện chào bán."],
["订单变更单","Phiếu thay đổi đơn hàng","Bán hàng","Chứng từ sửa nội dung đơn đặt hàng đã xác nhận."],
["订单结案","Kết thúc đơn hàng","Bán hàng","Đóng đơn hàng khi đã hoàn thành hoặc không tiếp tục thực hiện."],
["预计出货","Xuất hàng dự kiến","Bán hàng","Kế hoạch giao hàng trong tương lai."],
["销货单","Phiếu xuất bán","Bán hàng","Chứng từ ghi nhận hàng giao cho khách."],
["分批销货","Xuất bán nhiều đợt","Bán hàng","Giao một đơn hàng thành nhiều lần."],
["赠品数量","Số lượng hàng tặng","Bán hàng","Số lượng giao miễn phí cho khách."],
["销退单","Phiếu hàng bán bị trả lại","Bán hàng","Chứng từ ghi nhận khách trả lại hàng."],
["结账单","Phiếu kết toán / đối soát","Bán hàng","Chứng từ tập hợp các khoản cần thu từ khách."],
["应收账款","Công nợ phải thu","Bán hàng","Khoản tiền khách hàng còn phải thanh toán."],
["客户商品计价","Thiết lập giá bán theo khách hàng","Bán hàng","Quản lý đơn giá riêng cho từng khách và sản phẩm."],
["客户品号","Mã hàng của khách","Bán hàng","Mã sản phẩm theo hệ thống của khách hàng."],
["送货地址","Địa chỉ giao hàng","Bán hàng","Địa điểm giao hàng được chỉ định trên đơn."],
["业务员","Nhân viên kinh doanh","Bán hàng","Người phụ trách khách hàng và đơn bán."],
["预计出货明细","Chi tiết xuất hàng dự kiến","Bán hàng","Báo cáo các đơn dự kiến giao theo ngày hoặc nhân viên."],
["客户结账单","Phiếu đối soát khách hàng","Bán hàng","Chứng từ tổng hợp các khoản khách cần thanh toán."],
["销售单价","Đơn giá bán","Bán hàng","Giá bán của một đơn vị hàng hóa."],
["未出货数量","Số lượng chưa giao","Bán hàng","Phần số lượng trên đơn chưa xuất cho khách."],
["客户信用额度","Hạn mức tín dụng khách hàng","Bán hàng","Mức công nợ tối đa được phép cho khách."],
["收款条件","Điều kiện thanh toán","Bán hàng","Thời hạn và phương thức khách phải thanh toán."],
["交货地址","Địa chỉ giao hàng","Bán hàng","Địa chỉ thực tế để giao sản phẩm."],
["固定资产","Tài sản cố định","Tài chính","Tài sản sử dụng dài hạn được quản lý và trích khấu hao."],
["资产请购","Yêu cầu mua tài sản","Tài chính","Đề nghị nội bộ mua mới tài sản cố định."],
["资产采购","Mua tài sản","Tài chính","Quy trình đặt mua tài sản từ nhà cung cấp."],
["资产进货","Nhập tài sản","Tài chính","Nhận tài sản mua về và ghi nhận thông tin ban đầu."],
["资产编号","Mã tài sản","Tài chính","Mã định danh riêng cho từng tài sản."],
["资产类别","Nhóm tài sản","Tài chính","Phân loại tài sản để quản lý và tính khấu hao."],
["资产盘点","Kiểm kê tài sản","Tài chính","Đối chiếu tài sản thực tế với sổ quản lý."],
["保险资料","Thông tin bảo hiểm tài sản","Tài chính","Dữ liệu hợp đồng bảo hiểm của tài sản."],
["资产外送","Đưa tài sản ra ngoài","Tài chính","Ghi nhận tài sản được chuyển ra ngoài công ty tạm thời."],
["资产收回","Thu hồi tài sản","Tài chính","Ghi nhận tài sản được đưa trở lại công ty."],
["资产改良","Cải tạo tài sản","Tài chính","Chi phí nâng cấp làm tăng công năng hoặc thời gian sử dụng."],
["资产重估","Đánh giá lại tài sản","Tài chính","Điều chỉnh giá trị tài sản theo kết quả đánh giá lại."],
["资产报废","Báo phế tài sản","Tài chính","Loại bỏ tài sản không còn sử dụng được."],
["资产出售","Bán tài sản","Tài chính","Chuyển nhượng tài sản cho bên khác."],
["资产调整","Điều chỉnh tài sản","Tài chính","Sửa thông tin hoặc giá trị tài sản."],
["资产折旧","Khấu hao tài sản","Tài chính","Phân bổ giá trị tài sản theo thời gian sử dụng."],
["资产减损","Suy giảm giá trị tài sản","Tài chính","Ghi nhận phần giá trị tài sản bị giảm."],
["资产移转","Điều chuyển tài sản","Tài chính","Chuyển tài sản giữa bộ phận, địa điểm hoặc người quản lý."],
["折旧方法","Phương pháp khấu hao","Tài chính","Phương pháp dùng để phân bổ giá trị tài sản."],
["使用年限","Thời gian sử dụng","Tài chính","Số năm hoặc tháng dự kiến sử dụng tài sản."],
["残值","Giá trị còn lại ước tính","Tài chính","Giá trị dự kiến còn lại khi hết thời gian khấu hao."],
["取得成本","Nguyên giá tài sản","Tài chính","Tổng chi phí để đưa tài sản vào trạng thái sẵn sàng sử dụng."],
["账面价值","Giá trị sổ sách","Tài chính","Nguyên giá trừ khấu hao lũy kế và giảm giá trị."],
["累计折旧","Khấu hao lũy kế","Tài chính","Tổng khấu hao đã ghi nhận từ khi tài sản được sử dụng."],
["付款单","Phiếu thanh toán","Tài chính","Chứng từ ghi nhận việc thanh toán tiền."],
["应付账款","Công nợ phải trả","Tài chính","Khoản tiền doanh nghiệp phải trả nhà cung cấp."],
["应收凭单","Chứng từ phải thu","Tài chính","Chứng từ ghi nhận khoản phải thu khách hàng."],
["现金收入传票","Phiếu thu tiền mặt","Tài chính","Chứng từ kế toán ghi nhận thu tiền mặt."],
["现金支出传票","Phiếu chi tiền mặt","Tài chính","Chứng từ kế toán ghi nhận chi tiền mặt."],
["转账传票","Phiếu hạch toán chuyển khoản","Tài chính","Chứng từ kế toán cho nghiệp vụ không thu hoặc chi tiền mặt."]
]);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v76/erp-terms-v76-system-documents.js */
(function(root){"use strict";root.VDuckieERPTermsV76.add([
["权限管理","Quản lý quyền hạn","Hệ thống","Thiết lập phạm vi người dùng được xem và thao tác trên ERP."],
["密码参数","Tham số mật khẩu","Hệ thống","Quy định độ dài, thời hạn và nguyên tắc sử dụng mật khẩu."],
["登录者账号","Tài khoản đăng nhập","Hệ thống","Tài khoản người dùng dùng để vào hệ thống."],
["登录者代号","Mã người đăng nhập","Hệ thống","Mã định danh của người dùng ERP."],
["超级用户","Người dùng quản trị cao nhất","Hệ thống","Tài khoản có quyền quản trị và mở khóa người dùng."],
["账号锁定","Khóa tài khoản","Hệ thống","Ngăn tài khoản đăng nhập do lỗi hoặc chính sách bảo mật."],
["密码有效截止日","Ngày hết hạn mật khẩu","Hệ thống","Ngày cuối cùng mật khẩu còn có hiệu lực."],
["群组资料","Dữ liệu nhóm người dùng","Hệ thống","Nhóm dùng để gom những người có quyền tương tự."],
["用户系统权限","Quyền hệ thống của người dùng","Hệ thống","Danh sách các phân hệ người dùng được phép truy cập."],
["权限复制","Sao chép quyền hạn","Hệ thống","Sao chép cấu hình quyền từ người dùng này sang người khác."],
["执行权限","Quyền thực thi","Hệ thống","Quyền mở và thực hiện một chức năng hoặc nghiệp vụ."],
["设计权限","Quyền thiết kế giao diện","Hệ thống","Quyền sắp xếp hoặc tùy chỉnh trường hiển thị."],
["只读","Chỉ đọc","Hệ thống","Được xem nhưng không được sửa dữ liệu."],
["隐藏","Ẩn","Hệ thống","Không được nhìn thấy trường hoặc dữ liệu."],
["授权","Cấp quyền","Hệ thống","Cho phép người dùng thực hiện một phạm vi công việc."],
["作业权限","Quyền chức năng","Hệ thống","Quyền đối với từng màn hình hoặc nghiệp vụ cụ thể."],
["系统类别","Phân hệ hệ thống","Hệ thống","Nhóm chức năng như kho, mua hàng, sản xuất và kế toán."],
["权限明细表","Bảng chi tiết quyền hạn","Hệ thống","Báo cáo liệt kê quyền của từng người dùng."],
["密码到期","Mật khẩu hết hạn","Hệ thống","Trạng thái mật khẩu không còn được phép sử dụng."],
["密码变更","Đổi mật khẩu","Hệ thống","Thay mật khẩu đăng nhập của người dùng."],
["用户代号","Mã người dùng","Hệ thống","Mã định danh dùng trong quản lý tài khoản và quyền."],
["用户群组","Nhóm người dùng","Hệ thống","Nhóm quyền áp dụng cho nhiều tài khoản."],
["资料权限","Quyền dữ liệu","Hệ thống","Giới hạn phạm vi dữ liệu người dùng được xem."],
["成本权限","Quyền xem chi phí","Hệ thống","Quyền xem hoặc sửa trường giá vốn và chi phí."],
["售价权限","Quyền xem giá bán","Hệ thống","Quyền xem hoặc sửa đơn giá bán."],
["凭证","Mẫu chứng từ / biểu mẫu in","Chứng từ","Biểu mẫu dùng để in dữ liệu chứng từ ERP."],
["自定义凭证","Chứng từ tự thiết kế","Chứng từ","Biểu mẫu được tùy chỉnh theo nhu cầu doanh nghiệp."],
["凭证设计","Thiết kế chứng từ","Chứng từ","Thiết lập bố cục và trường dữ liệu của mẫu in."],
["凭证命名","Đặt tên chứng từ","Chứng từ","Đặt tên cho mẫu biểu để nhận diện và sử dụng."],
["凭证存档","Lưu mẫu chứng từ","Chứng từ","Lưu file thiết kế biểu mẫu."],
["凭证预览","Xem trước chứng từ","Chứng từ","Kiểm tra mẫu in trước khi sử dụng."],
["底图样式","Kiểu ảnh nền","Chứng từ","Mẫu nền dùng trong thiết kế chứng từ."],
["套表打印","In lồng biểu mẫu","Chứng từ","In dữ liệu lên giấy có mẫu in sẵn."],
["纸张大小","Kích thước giấy","Chứng từ","Khổ giấy dùng khi in chứng từ."],
["打印路径","Đường dẫn in / đường dẫn mẫu","Chứng từ","Vị trí hệ thống đọc file mẫu chứng từ."],
["数据表","Bảng dữ liệu","Chứng từ","Bảng cơ sở dữ liệu cung cấp dữ liệu cho mẫu in."],
["单头","Phần đầu chứng từ","Chứng từ","Thông tin chung như số phiếu, ngày và đối tượng."],
["单身","Phần chi tiết chứng từ","Chứng từ","Các dòng hàng hóa hoặc nghiệp vụ chi tiết."],
["单尾","Phần cuối chứng từ","Chứng từ","Khu vực tổng cộng, ghi chú và chữ ký."],
["签核","Ký duyệt","Chứng từ","Xác nhận hoặc phê duyệt chứng từ."],
["合计金额","Tổng số tiền","Chứng từ","Tổng giá trị tiền trên chứng từ."],
["表头","Đầu bảng / tiêu đề trang","Chứng từ","Phần tiêu đề ở đầu bảng hoặc trang in."],
["表尾","Cuối bảng","Chứng từ","Phần cuối của bảng hoặc báo cáo."],
["页眉","Đầu trang","Chứng từ","Nội dung lặp lại ở đầu mỗi trang."],
["页脚","Chân trang","Chứng từ","Nội dung lặp lại ở cuối mỗi trang."],
["打印样式","Mẫu in","Chứng từ","Kiểu bố cục được dùng khi in."],
["凭证格式","Định dạng chứng từ","Chứng từ","Cấu trúc và hình thức trình bày của mẫu in."],
["单据性质","Tính chất chứng từ","Chứng từ","Thiết lập quy tắc xử lý cho từng loại chứng từ."],
["单据确认","Xác nhận chứng từ","Chứng từ","Chuyển chứng từ sang trạng thái có hiệu lực."],
["取消确认","Hủy xác nhận","Chứng từ","Đưa chứng từ đã xác nhận về trạng thái có thể sửa."],
["单据变更","Thay đổi chứng từ","Chứng từ","Ghi nhận thay đổi bằng chứng từ biến động hoặc phiên bản mới."],
["前置单据","Chứng từ nguồn","Chứng từ","Chứng từ ở bước trước dùng để tạo chứng từ hiện tại."],
["复制前置单据","Sao chép chứng từ nguồn","Chứng từ","Tạo chứng từ mới bằng cách lấy dữ liệu từ chứng từ trước."],
["单别","Loại chứng từ","Chứng từ","Mã phân loại chứng từ."],
["单号","Số chứng từ","Chứng từ","Số định danh của chứng từ."],
["序号","Số thứ tự dòng","Chứng từ","Số thứ tự của dòng chi tiết."],
["备注","Ghi chú","Chứng từ","Thông tin bổ sung trên chứng từ."]
]);root.VDuckieERPTermsV76.finish(["BOM","Mua hàng","Bán hàng","Tài chính","Hệ thống"],291);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-core.js */
(function(root){
  "use strict";
  var terms=root.ERP_TERMS||(root.ERP_TERMS=[]);
  var existing=Object.create(null);
  var added=[];
  var batchSize=90;
  for(var i=0;i<terms.length;i++){
    if(terms[i]&&terms[i][0])existing[terms[i][0]]=true;
  }

  function addText(text){
    var lines=String(text||"").split(/\r?\n/);
    for(var i=0;i<lines.length;i++){
      var line=lines[i].trim();
      if(!line||line.charAt(0)==="#")continue;
      var row=line.split("\t");
      var word=(row[0]||"").trim();
      if(!word||existing[word])continue;
      var meaning=(row[1]||"").trim();
      var category=(row[2]||"Chứng từ").trim();
      var note=(row[3]||("Thuật ngữ thuộc nhóm "+category+" trong hệ thống ERP.")).trim();
      var term=[word,"","",meaning,category,note,"",""];
      terms.push(term);
      added.push(term);
      existing[word]=true;
    }
  }

  function ensureCategoryButtons(categories){
    if(typeof document==="undefined")return;
    var filters=document.getElementById("filters");
    if(!filters)return;
    for(var i=0;i<categories.length;i++){
      var category=categories[i];
      if(filters.querySelector('[data-category="'+category+'"]'))continue;
      var button=document.createElement("button");
      button.type="button";
      button.setAttribute("data-category",category);
      button.textContent=category;
      filters.appendChild(button);
    }
  }

  function updateUi(categories){
    if(typeof document==="undefined")return;
    ensureCategoryButtons(categories);
    var count=document.querySelector(".home-resource-tile.resource-erp strong");
    if(count)count.textContent=terms.length+"+";
    var help=document.querySelector("#personal .personal-box .help");
    if(help)help.textContent="Nếu từ đã có trong bộ "+terms.length+" thuật ngữ, tiếng Trung, pinyin và âm gần Việt sẽ hiện ngay để bạn lưu.";
  }

  function findTerm(word){
    for(var i=0;i<terms.length;i++)if(terms[i][0]===word)return terms[i];
    return null;
  }

  function refreshVisiblePronunciation(){
    if(typeof document==="undefined")return;
    var cardHanzi=document.getElementById("cardHanzi");
    var cardTerm=cardHanzi?findTerm(cardHanzi.textContent):null;
    if(cardTerm){
      var cardPinyin=document.getElementById("cardPinyin");
      var cardNear=document.getElementById("cardNearVi");
      if(cardPinyin)cardPinyin.textContent=cardTerm[1]||"";
      if(cardNear)cardNear.textContent=cardTerm[2]||"—";
    }
    var quizHanzi=document.getElementById("quizHanzi");
    var quizTerm=quizHanzi?findTerm(quizHanzi.textContent):null;
    if(quizTerm){
      var quizPinyin=document.getElementById("quizPinyin");
      if(quizPinyin)quizPinyin.textContent=(quizTerm[1]||"")+" · "+(quizTerm[2]||"");
    }
    var search=document.getElementById("search");
    if(search&&typeof Event!=="undefined")search.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function fillPronunciationInBatches(){
    if(!root.ERPPronunciation||typeof root.ERPPronunciation.generate!=="function")return false;
    var index=0;
    function next(){
      var end=Math.min(index+batchSize,added.length);
      for(;index<end;index++){
        var result=root.ERPPronunciation.generate(added[index][0]);
        if(result){
          added[index][1]=result.pinyin||"";
          added[index][2]=result.nearVi||"";
        }
      }
      if(index<added.length){
        setTimeout(next,0);
      }else{
        refreshVisiblePronunciation();
        root.dispatchEvent&&root.dispatchEvent(new CustomEvent("vduckie:erp-v77-ready",{detail:root.ERP_TERMS_V77||{}}));
      }
    }
    next();
    return true;
  }

  function finish(categories,sourceCount,sources){
    root.ERP_TERMS_V77={
      sourceCount:sourceCount,
      addedCount:added.length,
      totalCount:terms.length,
      categories:categories.slice(0),
      sources:(sources||[]).slice(0)
    };
    updateUi(categories);
    if(typeof document!=="undefined"&&document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded",function(){updateUi(categories);},{once:true});
    }
    if(root.PinyinEngineReady&&typeof root.PinyinEngineReady.then==="function"){
      root.PinyinEngineReady.then(function(){
        if(!fillPronunciationInBatches())setTimeout(fillPronunciationInBatches,0);
      });
    }else{
      setTimeout(fillPronunciationInBatches,0);
    }
  }

  root.VDuckieERPTermsV77={
    addText:addText,
    finish:finish,
    terms:terms,
    added:added
  };
})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-planning-production.js */
(function(root){"use strict";root.VDuckieERPTermsV77.addText(`
主生产计划	Kế hoạch sản xuất tổng thể (MPS)	Hoạch định	Kế hoạch sản xuất theo kỳ cho các thành phẩm chủ lực.
物料需求计划	Kế hoạch nhu cầu vật tư (MRP)	Hoạch định	Tính nhu cầu vật tư theo kế hoạch, tồn kho và BOM.
需求驱动型物料需求计划	Kế hoạch nhu cầu vật tư định hướng theo nhu cầu (DDMRP)	Hoạch định	Phương pháp lập kế hoạch dùng điểm đệm và tín hiệu nhu cầu.
粗能力计划	Hoạch định năng lực sơ bộ (RCCP)	Hoạch định	Đánh giá sơ bộ khả năng đáp ứng của nguồn lực trọng yếu.
能力需求计划	Hoạch định nhu cầu năng lực (CRP)	Hoạch định	Tính tải chi tiết của máy, chuyền và trung tâm làm việc.
有限能力排程	Lập lịch hữu hạn năng lực	Hoạch định	Lập lịch có xét giới hạn thực tế của nguồn lực.
无限能力排程	Lập lịch vô hạn năng lực	Hoạch định	Lập lịch chưa giới hạn bởi năng lực khả dụng.
需求预测	Dự báo nhu cầu	Hoạch định	Ước lượng nhu cầu tương lai từ dữ liệu và giả định.
销售预测	Dự báo bán hàng	Hoạch định	Dự báo số lượng bán theo sản phẩm và thời kỳ.
预测模型	Mô hình dự báo	Hoạch định	Phương pháp tính dùng để tạo dự báo.
预测准确率	Độ chính xác dự báo	Hoạch định	Chỉ số đánh giá mức phù hợp giữa dự báo và thực tế.
预测偏差	Sai lệch dự báo	Hoạch định	Khoảng chênh giữa dự báo và nhu cầu thực tế.
滚动预测	Dự báo cuốn chiếu	Hoạch định	Dự báo được cập nhật liên tục theo kỳ mới.
独立需求	Nhu cầu độc lập	Hoạch định	Nhu cầu không phát sinh trực tiếp từ nhu cầu của vật tư khác.
相关需求	Nhu cầu phụ thuộc	Hoạch định	Nhu cầu được tính từ BOM hoặc sản phẩm cấp trên.
计划订单	Đơn hàng kế hoạch	Hoạch định	Đề xuất sản xuất, mua hoặc điều chuyển do hệ thống tạo.
计划生产订单	Lệnh sản xuất kế hoạch	Hoạch định	Lệnh sản xuất ở trạng thái đề xuất chưa phát hành.
计划采购订单	Đơn mua hàng kế hoạch	Hoạch định	Đề xuất mua hàng do hệ thống hoạch định tạo.
计划转移订单	Lệnh điều chuyển kế hoạch	Hoạch định	Đề xuất chuyển tồn giữa kho hoặc địa điểm.
计划确认	Xác nhận kế hoạch	Hoạch định	Chuyển đề xuất kế hoạch thành chứng từ thực thi.
行动消息	Thông báo hành động	Hoạch định	Đề xuất đẩy sớm, lùi, tăng, giảm hoặc hủy đơn kế hoạch.
未来消息	Thông báo tương lai	Hoạch định	Thông báo về ngày có thể đáp ứng khi yêu cầu hiện tại bị trễ.
重新计划	Lập kế hoạch lại	Hoạch định	Tính lại kế hoạch khi nhu cầu hoặc nguồn cung thay đổi.
净变化计划	Hoạch định thay đổi ròng	Hoạch định	Chỉ tính lại các vật tư chịu ảnh hưởng bởi thay đổi.
再生计划	Hoạch định tái sinh toàn bộ	Hoạch định	Tính lại toàn bộ phạm vi kế hoạch.
计划周期	Chu kỳ hoạch định	Hoạch định	Khoảng thời gian giữa các lần chạy kế hoạch.
计划范围	Phạm vi hoạch định	Hoạch định	Khoảng thời gian tương lai được đưa vào tính toán.
冻结期	Kỳ đóng băng	Hoạch định	Khoảng thời gian gần hiện tại hạn chế thay đổi kế hoạch.
需求时界	Mốc thời gian nhu cầu	Hoạch định	Mốc phân biệt nhu cầu thực tế và dự báo.
计划时界	Ranh giới thời gian kế hoạch	Hoạch định	Mốc kiểm soát mức độ hệ thống được phép thay đổi kế hoạch.
累计提前期	Tổng thời gian chuẩn bị tích lũy	Hoạch định	Tổng lead time từ cấp thấp nhất đến thành phẩm.
采购提前期	Thời gian chuẩn bị mua hàng	Hoạch định	Thời gian từ đặt mua đến khi hàng sẵn sàng sử dụng.
生产提前期	Thời gian sản xuất	Hoạch định	Thời gian cần để hoàn thành sản xuất.
运输提前期	Thời gian vận chuyển	Hoạch định	Thời gian hàng di chuyển giữa hai địa điểm.
计划员	Nhân viên hoạch định	Hoạch định	Người chịu trách nhiệm theo dõi và điều chỉnh kế hoạch.
物料计划员	Nhân viên kế hoạch vật tư	Hoạch định	Người phụ trách nhu cầu và nguồn cung của nhóm vật tư.
产能负荷	Tải năng lực	Hoạch định	Mức công việc chiếm dụng năng lực trong một kỳ.
可用产能	Năng lực khả dụng	Hoạch định	Năng lực có thể sử dụng sau khi xét lịch và dừng máy.
瓶颈资源	Nguồn lực nút thắt	Hoạch định	Nguồn lực giới hạn sản lượng chung.
计划利用率	Tỷ lệ sử dụng kế hoạch	Hoạch định	Tỷ lệ tải kế hoạch trên năng lực khả dụng.
在制品	Sản phẩm dở dang (WIP)	Sản xuất	Vật tư hoặc sản phẩm đang trong quá trình sản xuất.
生产批次	Lô sản xuất	Sản xuất	Nhóm sản phẩm được sản xuất và quản lý chung theo một lô.
工艺路线	Quy trình công nghệ / routing	Sản xuất	Chuỗi công đoạn và nguồn lực để sản xuất một sản phẩm.
工序	Công đoạn	Sản xuất	Bước công việc trong quy trình sản xuất.
工序编号	Mã công đoạn	Sản xuất	Mã nhận diện từng công đoạn.
工序顺序	Thứ tự công đoạn	Sản xuất	Trình tự thực hiện các công đoạn.
工作中心	Trung tâm làm việc	Sản xuất	Nhóm máy hoặc lao động thực hiện công đoạn.
资源组	Nhóm nguồn lực	Sản xuất	Nhóm nguồn lực có tính chất và năng lực tương tự.
机器资源	Nguồn lực máy móc	Sản xuất	Máy hoặc thiết bị dùng trong lập lịch và thực hiện.
人工资源	Nguồn lực nhân công	Sản xuất	Lao động dùng để tính năng lực và chi phí.
准备时间	Thời gian chuẩn bị máy	Sản xuất	Thời gian thiết lập trước khi chạy công đoạn.
加工时间	Thời gian gia công	Sản xuất	Thời gian trực tiếp xử lý một đơn vị hoặc lô.
排队时间	Thời gian chờ hàng	Sản xuất	Thời gian công việc chờ trước khi được xử lý.
转移时间	Thời gian chuyển công đoạn	Sản xuất	Thời gian di chuyển bán thành phẩm giữa công đoạn.
等待时间	Thời gian chờ kỹ thuật	Sản xuất	Thời gian bắt buộc chờ sau công đoạn.
标准工时	Giờ công tiêu chuẩn	Sản xuất	Thời gian định mức để hoàn thành công việc.
实际工时	Giờ công thực tế	Sản xuất	Thời gian thực tế đã sử dụng.
工时差异	Chênh lệch thời gian công	Giá thành	Chênh giữa công thực tế và công định mức.
机器工时	Giờ máy	Sản xuất	Thời gian máy được sử dụng cho sản xuất.
人工工时	Giờ công lao động	Sản xuất	Thời gian lao động trực tiếp cho sản xuất.
报工	Báo cáo công việc sản xuất	Sản xuất	Ghi nhận sản lượng, thời gian và tình trạng công đoạn.
完工报告	Báo cáo hoàn thành sản xuất	Sản xuất	Ghi nhận số lượng hoàn thành và dữ liệu thực tế.
产量报告	Báo cáo sản lượng	Sản xuất	Báo cáo số lượng đạt được theo kỳ, lệnh hoặc chuyền.
投料	Đưa vật tư vào sản xuất	Sản xuất	Cấp và sử dụng vật tư cho công đoạn hoặc lệnh.
倒冲领料	Xuất vật tư ngược / backflush	Sản xuất	Tự động trừ vật tư theo sản lượng hoàn thành.
反冲	Backflush / ghi nhận ngược	Sản xuất	Cơ chế tự động ghi nhận tiêu hao dựa trên đầu ra.
齐套分析	Phân tích đủ bộ vật tư	Hoạch định	Kiểm tra vật tư đã đủ để bắt đầu hoặc hoàn thành lệnh.
缺料清单	Danh sách thiếu vật tư	Hoạch định	Danh sách vật tư chưa đủ cho kế hoạch hoặc lệnh.
物料可用性检查	Kiểm tra khả dụng vật tư	Hoạch định	Xác định vật tư có đủ đúng số lượng và thời điểm.
生产排程	Lịch sản xuất	Hoạch định	Sắp xếp lệnh theo thời gian và nguồn lực.
正向排程	Lập lịch tiến	Hoạch định	Tính lịch từ ngày bắt đầu về phía tương lai.
逆向排程	Lập lịch lùi	Hoạch định	Tính lịch ngược từ ngày cần hoàn thành.
派工	Phân công sản xuất	Sản xuất	Giao công việc cho máy, chuyền hoặc người thực hiện.
生产调度	Điều độ sản xuất	Sản xuất	Điều chỉnh thứ tự và nguồn lực để đáp ứng tiến độ.
工单释放	Phát hành lệnh công việc	Sản xuất	Cho phép lệnh đi vào giai đoạn thực thi.
工单暂停	Tạm dừng lệnh công việc	Sản xuất	Ngừng thực hiện lệnh trong thời gian nhất định.
工单关闭	Đóng lệnh công việc	Sản xuất	Kết thúc lệnh sau khi hoàn tất ghi nhận.
工单拆分	Tách lệnh công việc	Sản xuất	Chia một lệnh thành nhiều lệnh nhỏ.
工单合并	Gộp lệnh công việc	Sản xuất	Hợp nhất các lệnh phù hợp để xử lý chung.
返工	Làm lại / tái gia công	Sản xuất	Thực hiện lại công đoạn để sửa sản phẩm không đạt.
返修	Sửa chữa sản phẩm lỗi	Sản xuất	Khắc phục sản phẩm lỗi để đạt yêu cầu.
首件确认	Xác nhận sản phẩm đầu tiên	Chất lượng	Kiểm tra mẫu đầu tiên trước khi sản xuất hàng loạt.
试生产	Sản xuất thử	Sản xuất	Chạy thử quy trình hoặc sản phẩm trước sản xuất chính thức.
量产	Sản xuất hàng loạt	Sản xuất	Sản xuất ổn định với số lượng lớn.
换线	Chuyển đổi chuyền	Sản xuất	Đổi sản phẩm hoặc cấu hình trên chuyền.
换模	Thay khuôn	Sản xuất	Thay khuôn phục vụ sản xuất sản phẩm khác.
停机时间	Thời gian dừng máy	Sản xuất	Khoảng thời gian máy không sản xuất.
生产效率	Hiệu suất sản xuất	Sản xuất	Mức đầu ra thực tế so với tiêu chuẩn hoặc kế hoạch.
良品率	Tỷ lệ hàng đạt	Chất lượng	Tỷ lệ sản phẩm đạt yêu cầu trên tổng sản lượng.
不良率	Tỷ lệ lỗi	Chất lượng	Tỷ lệ sản phẩm không đạt trên tổng sản lượng.
一次合格率	Tỷ lệ đạt ngay lần đầu (FPY)	Chất lượng	Tỷ lệ sản phẩm đạt mà không cần sửa hoặc làm lại.
综合设备效率	Hiệu suất thiết bị tổng thể (OEE)	Sản xuất	Chỉ số kết hợp tính sẵn sàng, hiệu suất và chất lượng.
节拍时间	Thời gian nhịp sản xuất	Sản xuất	Khoảng thời gian mục tiêu giữa hai sản phẩm hoàn thành.
周期时间	Thời gian chu kỳ	Sản xuất	Thời gian thực tế để hoàn thành một chu kỳ công việc.
生产节拍	Nhịp sản xuất	Sản xuất	Tốc độ sản xuất cần thiết để đáp ứng nhu cầu.
产线平衡	Cân bằng chuyền	Sản xuất	Phân bổ công việc để giảm chờ và nghẽn chuyền.
副产品	Sản phẩm phụ	Sản xuất	Sản phẩm phát sinh cùng quá trình với sản phẩm chính.
联产品	Đồng sản phẩm	Sản xuất	Nhiều sản phẩm chính cùng sinh ra từ một quy trình.
过程制造	Sản xuất theo quy trình	Sản xuất	Sản xuất dựa trên công thức, mẻ và quá trình liên tục.
离散制造	Sản xuất rời rạc	Sản xuất	Sản xuất sản phẩm có thể đếm theo từng đơn vị.
重复制造	Sản xuất lặp lại	Sản xuất	Sản xuất khối lượng lớn với quy trình ổn định.
精益制造	Sản xuất tinh gọn	Sản xuất	Tổ chức sản xuất nhằm giảm lãng phí và thời gian chờ.
看板	Kanban	Sản xuất	Tín hiệu kéo dùng để bổ sung hoặc sản xuất.
看板卡	Thẻ Kanban	Sản xuất	Thẻ hoặc tín hiệu đại diện cho nhu cầu kéo.
拉式生产	Sản xuất kéo	Sản xuất	Chỉ sản xuất khi có tín hiệu nhu cầu từ công đoạn sau.
推式生产	Sản xuất đẩy	Sản xuất	Sản xuất theo kế hoạch dự báo và đẩy xuống công đoạn sau.
`);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-product-plm.js */
(function(root){"use strict";root.VDuckieERPTermsV77.addText(`
产品主数据	Dữ liệu gốc sản phẩm	BOM	Thông tin chuẩn dùng chung cho sản phẩm trong toàn hệ thống.
物料主数据	Dữ liệu gốc vật tư	BOM	Thông tin chuẩn về mã, đơn vị, thuộc tính và chính sách vật tư.
品号主档	Danh mục mã hàng	BOM	Danh mục trung tâm quản lý mã sản phẩm và vật tư.
产品类别	Nhóm sản phẩm	BOM	Phân loại sản phẩm phục vụ quản lý và báo cáo.
物料类别	Nhóm vật tư	BOM	Phân loại vật tư theo tính chất hoặc mục đích sử dụng.
产品层次结构	Cấu trúc phân cấp sản phẩm	BOM	Cây phân nhóm sản phẩm từ tổng quát đến chi tiết.
产品变型	Biến thể sản phẩm	BOM	Phiên bản sản phẩm theo màu, cỡ, cấu hình hoặc thuộc tính.
产品配置	Cấu hình sản phẩm	BOM	Xác định cấu hình sản phẩm theo lựa chọn và quy tắc.
配置规则	Quy tắc cấu hình	BOM	Điều kiện kiểm soát tổ hợp thuộc tính sản phẩm.
属性组	Nhóm thuộc tính	BOM	Nhóm các thuộc tính dùng chung cho sản phẩm.
产品属性	Thuộc tính sản phẩm	BOM	Đặc điểm mô tả và phân biệt sản phẩm.
颜色	Màu sắc	BOM	Thuộc tính màu của sản phẩm hoặc vật tư.
尺寸	Kích thước	BOM	Thuộc tính kích cỡ của sản phẩm.
款式	Kiểu dáng	BOM	Thuộc tính mẫu hoặc kiểu của sản phẩm.
型号	Model / kiểu máy	BOM	Mã model dùng để nhận diện dòng sản phẩm.
物料类型	Loại vật tư	BOM	Phân biệt nguyên liệu, bán thành phẩm, thành phẩm, dịch vụ hoặc tài sản.
自制件	Chi tiết tự sản xuất	BOM	Vật tư được sản xuất trong nội bộ.
外购件	Chi tiết mua ngoài	BOM	Vật tư được mua từ nhà cung cấp.
委外件	Chi tiết gia công ngoài	BOM	Vật tư do nhà cung cấp gia công theo lệnh.
虚拟件	Cụm ảo / phantom item	BOM	Cụm logic trong BOM không quản lý tồn riêng.
非库存物料	Vật tư không quản lý tồn	BOM	Mặt hàng không theo dõi số lượng tồn kho.
服务物料	Mặt hàng dịch vụ	BOM	Mã dùng để mua hoặc bán dịch vụ.
替代物料	Vật tư thay thế	BOM	Vật tư có thể dùng thay vật tư chính.
可替代组	Nhóm vật tư thay thế	BOM	Nhóm các vật tư được phép thay thế lẫn nhau.
替代优先级	Ưu tiên vật tư thay thế	BOM	Thứ tự lựa chọn giữa các vật tư thay thế.
物料清单版本	Phiên bản BOM	BOM	Phiên bản cấu trúc vật tư có thời gian và phạm vi hiệu lực.
工程物料清单	BOM kỹ thuật (EBOM)	BOM	BOM do bộ phận thiết kế hoặc kỹ thuật quản lý.
制造物料清单	BOM sản xuất (MBOM)	BOM	BOM được chuẩn hóa cho quy trình sản xuất.
销售物料清单	BOM bán hàng	BOM	Cấu trúc bộ sản phẩm dùng trong bán hàng.
服务物料清单	BOM dịch vụ	BOM	Danh sách phụ tùng và công việc phục vụ bảo trì.
配方	Công thức sản xuất	BOM	Danh sách nguyên liệu và tỷ lệ trong sản xuất quá trình.
配方版本	Phiên bản công thức	BOM	Phiên bản công thức có điều kiện hiệu lực cụ thể.
成分	Thành phần	BOM	Nguyên liệu hoặc cấu phần tham gia công thức.
组件	Linh kiện thành phần	BOM	Vật tư cấp dưới cấu thành sản phẩm.
父项	Mã cha	BOM	Sản phẩm hoặc cụm cấp trên trong cấu trúc.
子项	Mã con	BOM	Vật tư hoặc cấu phần cấp dưới trong cấu trúc.
BOM层级	Cấp BOM	BOM	Mức của vật tư trong cây cấu trúc.
单层BOM	BOM một cấp	BOM	BOM chỉ thể hiện thành phần trực tiếp.
多层BOM	BOM nhiều cấp	BOM	BOM thể hiện toàn bộ cây cấu trúc nhiều tầng.
BOM展开	Triển khai BOM	BOM	Phân rã sản phẩm xuống các cấu phần theo nhiều cấp.
BOM反查	Tra ngược BOM	BOM	Tìm các sản phẩm cha đang sử dụng một vật tư.
用量基数	Số lượng cơ sở BOM	BOM	Mẫu số dùng để biểu diễn định mức theo một số lượng chuẩn.
组件用量	Định mức cấu phần	BOM	Số lượng cấu phần cần cho số lượng cơ sở.
固定用量	Định mức cố định	BOM	Lượng vật tư không thay đổi theo quy mô lô.
变动用量	Định mức biến đổi	BOM	Lượng vật tư thay đổi theo số lượng sản xuất.
损耗数量	Số lượng hao hụt	BOM	Phần vật tư dự kiến mất trong quá trình sản xuất.
产出率	Tỷ lệ đầu ra	BOM	Tỷ lệ sản lượng đạt được từ đầu vào.
收率	Tỷ lệ thu hồi	BOM	Tỷ lệ thành phẩm hoặc bán thành phẩm thu được.
生效日期	Ngày hiệu lực	BOM	Ngày dữ liệu bắt đầu được phép sử dụng.
失效日期	Ngày hết hiệu lực	BOM	Ngày dữ liệu ngừng được sử dụng.
工程变更	Thay đổi kỹ thuật	BOM	Thay đổi có kiểm soát đối với sản phẩm, BOM hoặc tài liệu.
工程变更申请	Đề nghị thay đổi kỹ thuật (ECR)	BOM	Yêu cầu xem xét một thay đổi kỹ thuật.
工程变更单	Lệnh thay đổi kỹ thuật (ECO)	BOM	Chứng từ phê duyệt và triển khai thay đổi kỹ thuật.
变更原因	Lý do thay đổi	BOM	Nguyên nhân của thay đổi sản phẩm hoặc dữ liệu.
变更影响分析	Phân tích ảnh hưởng thay đổi	BOM	Đánh giá tác động đến tồn kho, lệnh, chi phí và chất lượng.
版本控制	Quản lý phiên bản	BOM	Quản lý lịch sử và hiệu lực của các phiên bản.
修订号	Số revision	BOM	Mã lần sửa đổi của sản phẩm hoặc tài liệu.
工程版本	Phiên bản kỹ thuật	BOM	Phiên bản thiết kế được quản lý theo vòng đời.
产品生命周期	Vòng đời sản phẩm	BOM	Các giai đoạn từ phát triển đến ngừng sử dụng.
生命周期状态	Trạng thái vòng đời	BOM	Trạng thái như thiết kế, thử nghiệm, hoạt động hoặc ngừng dùng.
发布产品	Phát hành sản phẩm	BOM	Đưa sản phẩm vào phạm vi công ty hoặc đơn vị để sử dụng.
产品停用	Ngừng sử dụng sản phẩm	BOM	Không cho dùng sản phẩm trong giao dịch mới.
图纸编号	Mã bản vẽ	BOM	Mã nhận diện bản vẽ kỹ thuật.
技术规格	Thông số kỹ thuật	BOM	Yêu cầu kỹ thuật của vật tư hoặc sản phẩm.
设计文件	Tài liệu thiết kế	BOM	Tệp bản vẽ, mô hình hoặc tài liệu kỹ thuật.
文档版本	Phiên bản tài liệu	BOM	Phiên bản được kiểm soát của tài liệu.
产品合规	Tuân thủ sản phẩm	BOM	Quản lý yêu cầu pháp lý và tiêu chuẩn của sản phẩm.
危险物料	Vật tư nguy hiểm	BOM	Vật tư cần kiểm soát đặc biệt về lưu kho và vận chuyển.
保质期	Hạn sử dụng	BOM	Khoảng thời gian sản phẩm còn đạt yêu cầu.
有效期	Thời hạn hiệu lực	BOM	Khoảng thời gian dữ liệu hoặc sản phẩm có hiệu lực.
货架寿命	Tuổi thọ lưu kho	BOM	Thời gian sản phẩm có thể lưu kho trước khi hết hạn.
批次属性	Thuộc tính lô	BOM	Thông tin đặc trưng được quản lý theo từng lô.
序列号控制	Kiểm soát số serial	BOM	Quy tắc theo dõi từng đơn vị bằng số serial.
双重计量单位	Hai đơn vị tính đồng thời	BOM	Quản lý cùng lúc đơn vị chính và đơn vị phụ.
换算系数	Hệ số quy đổi đơn vị	BOM	Tỷ lệ chuyển đổi giữa hai đơn vị tính.
包装规格	Quy cách đóng gói	BOM	Số lượng và hình thức đóng gói của sản phẩm.
包装层级	Cấp đóng gói	BOM	Cấp đơn vị như cái, hộp, thùng, pallet.
条形码	Mã vạch	BOM	Mã máy đọc dùng nhận diện sản phẩm hoặc đơn vị chứa.
全球贸易项目代码	Mã hàng thương mại toàn cầu (GTIN)	BOM	Mã GS1 nhận diện sản phẩm thương mại.
联合国标准产品与服务代码	Mã UNSPSC	BOM	Mã phân loại sản phẩm và dịch vụ chuẩn quốc tế.
`);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-warehouse-wms.js */
(function(root){"use strict";root.VDuckieERPTermsV77.addText(`
仓库管理系统	Hệ thống quản lý kho (WMS)	Kho
仓库	Kho	Kho
库区	Khu vực kho	Kho
库位	Vị trí lưu kho	Kho
货位	Ô chứa hàng	Kho
储位	Vị trí lưu trữ	Kho
库位类型	Loại vị trí kho	Kho
库位状态	Trạng thái vị trí kho	Kho
库位容量	Sức chứa vị trí kho	Kho
库位混放	Cho phép lưu chung vị trí	Kho
固定库位	Vị trí kho cố định	Kho
动态库位	Vị trí kho động	Kho
暂存区	Khu vực tạm lưu	Kho
收货区	Khu vực nhận hàng	Kho
待检区	Khu vực chờ kiểm tra	Kho
合格品区	Khu vực hàng đạt	Kho
不合格品区	Khu vực hàng không đạt	Kho
退货区	Khu vực hàng trả lại	Kho
拣货区	Khu vực lấy hàng	Kho
包装区	Khu vực đóng gói	Kho
发货区	Khu vực xuất hàng	Kho
越库区	Khu vực cross-docking	Kho
越库作业	Nghiệp vụ cross-docking	Kho
收货	Nhận hàng	Kho
预收货	Nhận hàng dự kiến	Kho
收货单	Phiếu nhận hàng	Kho
收货差异	Chênh lệch nhận hàng	Kho
过量收货	Nhận vượt số lượng	Kho
短缺收货	Nhận thiếu số lượng	Kho
上架	Đưa hàng lên vị trí	Kho
上架策略	Chiến lược đưa hàng lên vị trí	Kho
上架任务	Nhiệm vụ đưa hàng lên vị trí	Kho
上架确认	Xác nhận đưa hàng lên vị trí	Kho
补货	Bổ sung hàng	Kho
补货策略	Chiến lược bổ sung hàng	Kho
补货任务	Nhiệm vụ bổ sung hàng	Kho
紧急补货	Bổ sung hàng khẩn cấp	Kho
拣货	Lấy hàng	Kho
拣货单	Phiếu lấy hàng	Kho
拣货任务	Nhiệm vụ lấy hàng	Kho
拣货策略	Chiến lược lấy hàng	Kho
按单拣货	Lấy hàng theo từng đơn	Kho
批量拣货	Lấy hàng theo lô	Kho
波次拣货	Lấy hàng theo đợt	Kho
分区拣货	Lấy hàng theo khu vực	Kho
集群拣货	Lấy hàng theo cụm đơn	Kho
边拣边分	Vừa lấy vừa phân loại	Kho
摘果式拣货	Lấy hàng kiểu nhặt theo đơn	Kho
播种式拣货	Lấy hàng rồi phân bổ theo đơn	Kho
波次	Đợt xử lý kho	Kho
波次模板	Mẫu đợt xử lý kho	Kho
波次释放	Phát hành đợt xử lý kho	Kho
工作模板	Mẫu công việc kho	Kho
工作池	Nhóm công việc kho	Kho
库位指令	Chỉ thị vị trí kho	Kho
移动指令	Chỉ thị di chuyển	Kho
库内移动	Di chuyển nội bộ trong kho	Kho
库存转移	Điều chuyển tồn kho	Kho
移库	Chuyển vị trí kho	Kho
移库单	Phiếu chuyển vị trí kho	Kho
调拨申请	Yêu cầu điều chuyển	Kho
调拨订单	Lệnh điều chuyển kho	Kho
在途库存	Tồn kho đang vận chuyển	Kho
在手库存	Tồn kho hiện có	Kho
可用量	Số lượng khả dụng	Kho
可承诺量	Số lượng có thể cam kết	Kho
可承诺交期	Ngày giao có thể cam kết	Kho
预留库存	Tồn kho đã giữ chỗ	Kho
软预留	Giữ chỗ mềm	Kho
硬预留	Giữ chỗ cứng	Kho
库存冻结	Đóng băng tồn kho	Kho
库存状态	Trạng thái tồn kho	Kho
库存维度	Chiều quản lý tồn kho	Kho
批次管理	Quản lý theo lô	Kho
序列号管理	Quản lý theo số sê-ri	Kho
批次有效期	Thời hạn hiệu lực của lô	Kho
生产日期	Ngày sản xuất	Kho
先进先出	Nhập trước xuất trước (FIFO)	Kho
后进先出	Nhập sau xuất trước (LIFO)	Kho
先到期先出	Hết hạn trước xuất trước (FEFO)	Kho
库存周转	Vòng quay tồn kho	Kho
库存周转率	Tỷ lệ vòng quay tồn kho	Kho
库存天数	Số ngày tồn kho	Kho
呆滞库存	Tồn kho chậm luân chuyển	Kho
过期库存	Tồn kho quá hạn	Kho
缓慢移动库存	Tồn kho luân chuyển chậm	Kho
库存积压	Tồn kho ứ đọng	Kho
缺货	Thiếu hàng	Kho
断货	Hết hàng	Kho
缺货率	Tỷ lệ thiếu hàng	Kho
安全存量	Tồn kho an toàn	Kho
最高库存	Mức tồn kho tối đa	Kho
最低库存	Mức tồn kho tối thiểu	Kho
再订货点	Điểm đặt hàng lại	Kho
经济订货量	Lượng đặt hàng kinh tế (EOQ)	Kho
循环盘点	Kiểm kê luân phiên	Kho
全面盘点	Kiểm kê toàn bộ	Kho
盲盘	Kiểm kê mù	Kho
复盘	Kiểm kê lại	Kho
盘点单	Phiếu kiểm kê	Kho
盘点任务	Nhiệm vụ kiểm kê	Kho
盘点差异	Chênh lệch kiểm kê	Kho
库存调整	Điều chỉnh tồn kho	Kho
库存调整单	Phiếu điều chỉnh tồn kho	Kho
包装	Đóng gói	Kho
包装单	Phiếu đóng gói	Kho
装箱	Đóng thùng	Kho
装箱单	Phiếu đóng thùng	Kho
容器	Thùng chứa	Kho
容器化	Tự động chọn thùng chứa	Kho
托盘	Pallet	Kho
托盘标签	Nhãn pallet	Kho
许可证牌	Mã nhãn logistics	Kho
条码	Mã vạch	Kho
二维码	Mã QR	Kho
条码扫描	Quét mã vạch	Kho
移动设备菜单	Menu thiết bị di động	Kho
仓库工作者	Nhân viên vận hành kho	Kho
任务分配	Phân công nhiệm vụ	Kho
作业优先级	Mức ưu tiên công việc	Kho
仓库绩效	Hiệu suất kho	Kho
库存准确率	Độ chính xác tồn kho	Kho
拣货准确率	Độ chính xác lấy hàng	Kho
订单履行率	Tỷ lệ hoàn thành đơn hàng	Kho
`);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-procurement.js */
(function(root){"use strict";root.VDuckieERPTermsV77.addText(`
采购管理	Quản lý mua hàng	Mua hàng
采购寻源	Tìm nguồn cung ứng	Mua hàng
采购申请	Yêu cầu mua hàng	Mua hàng
采购申请单	Phiếu yêu cầu mua hàng	Mua hàng
申请人	Người đề nghị	Mua hàng
需求部门	Bộ phận có nhu cầu	Mua hàng
采购类别	Nhóm mua hàng	Mua hàng
采购目录	Danh mục mua hàng	Mua hàng
目录采购	Mua hàng theo danh mục	Mua hàng
非目录采购	Mua hàng ngoài danh mục	Mua hàng
采购政策	Chính sách mua hàng	Mua hàng
采购审批	Phê duyệt mua hàng	Mua hàng
审批层级	Cấp phê duyệt	Mua hàng
审批限额	Hạn mức phê duyệt	Mua hàng
预算检查	Kiểm tra ngân sách	Mua hàng
采购预算	Ngân sách mua hàng	Mua hàng
寻源事件	Đợt tìm nguồn cung	Mua hàng
询价	Yêu cầu báo giá	Mua hàng
询价单	Phiếu yêu cầu báo giá (RFQ)	Mua hàng
报价邀请	Thư mời báo giá	Mua hàng
供应商报价	Báo giá của nhà cung cấp	Mua hàng
报价截止日	Hạn chót báo giá	Mua hàng
报价比较	So sánh báo giá	Mua hàng
比价	So sánh giá	Mua hàng
议价	Đàm phán giá	Mua hàng
还价	Trả giá	Mua hàng
技术评标	Đánh giá kỹ thuật	Mua hàng
商务评标	Đánh giá thương mại	Mua hàng
综合评分	Điểm đánh giá tổng hợp	Mua hàng
中标供应商	Nhà cung cấp trúng thầu	Mua hàng
未中标通知	Thông báo không trúng thầu	Mua hàng
采购协议	Thỏa thuận mua hàng	Mua hàng
框架协议	Thỏa thuận khung	Mua hàng
一揽子订单	Đơn mua hàng khung	Mua hàng
采购合同	Hợp đồng mua hàng	Mua hàng
合同编号	Số hợp đồng	Mua hàng
合同有效期	Thời hạn hiệu lực hợp đồng	Mua hàng
合同金额	Giá trị hợp đồng	Mua hàng
合同余额	Giá trị hợp đồng còn lại	Mua hàng
合同履约	Thực hiện hợp đồng	Mua hàng
采购订单	Đơn đặt mua hàng (PO)	Mua hàng
采购订单行	Dòng chi tiết đơn mua hàng	Mua hàng
标准采购订单	Đơn mua hàng tiêu chuẩn	Mua hàng
紧急采购	Mua hàng khẩn cấp	Mua hàng
零星采购	Mua hàng lẻ	Mua hàng
服务采购	Mua dịch vụ	Mua hàng
外协采购	Mua dịch vụ gia công	Mua hàng
委外采购	Mua gia công thuê ngoài	Mua hàng
采购订单确认	Xác nhận đơn mua hàng	Mua hàng
供应商确认	Xác nhận của nhà cung cấp	Mua hàng
订单变更	Thay đổi đơn mua hàng	Mua hàng
变更版本	Phiên bản thay đổi	Mua hàng
订单取消	Hủy đơn mua hàng	Mua hàng
采购退货	Trả hàng mua	Mua hàng
采购退货单	Phiếu trả hàng mua	Mua hàng
退货原因	Lý do trả hàng	Mua hàng
供应商主数据	Dữ liệu gốc nhà cung cấp	Mua hàng
潜在供应商	Nhà cung cấp tiềm năng	Mua hàng
合格供应商	Nhà cung cấp đạt chuẩn	Mua hàng
首选供应商	Nhà cung cấp ưu tiên	Mua hàng
唯一供应商	Nhà cung cấp duy nhất	Mua hàng
供应商准入	Phê duyệt nhà cung cấp	Mua hàng
供应商注册	Đăng ký nhà cung cấp	Mua hàng
供应商审核	Đánh giá nhà cung cấp	Mua hàng
供应商评级	Xếp hạng nhà cung cấp	Mua hàng
供应商绩效	Hiệu suất nhà cung cấp	Mua hàng
供应商淘汰	Loại nhà cung cấp	Mua hàng
供应商黑名单	Danh sách đen nhà cung cấp	Mua hàng
供应商风险	Rủi ro nhà cung cấp	Mua hàng
供应风险评估	Đánh giá rủi ro nguồn cung	Mua hàng
供应商门户	Cổng thông tin nhà cung cấp	Mua hàng
供应商协同	Cộng tác với nhà cung cấp	Mua hàng
供应商库存	Tồn kho do nhà cung cấp quản lý (VMI)	Mua hàng
寄售采购	Mua hàng ký gửi	Mua hàng
寄售库存	Tồn kho ký gửi	Mua hàng
寄售结算	Quyết toán hàng ký gửi	Mua hàng
采购价格	Giá mua	Mua hàng
价格条件	Điều kiện giá	Mua hàng
价格协议	Thỏa thuận giá mua	Mua hàng
阶梯价格	Giá theo bậc số lượng	Mua hàng
数量折扣	Chiết khấu theo số lượng	Mua hàng
现金折扣	Chiết khấu thanh toán sớm	Mua hàng
采购附加费	Phụ phí mua hàng	Mua hàng
到岸成本	Chi phí hàng về	Mua hàng
供应商交期	Thời gian giao của nhà cung cấp	Mua hàng
承诺交货日	Ngày giao hàng cam kết	Mua hàng
请求交货日	Ngày yêu cầu giao hàng	Mua hàng
催交	Thúc giao hàng	Mua hàng
催交单	Thông báo thúc giao hàng	Mua hàng
交货进度	Tiến độ giao hàng	Mua hàng
准时交货率	Tỷ lệ giao hàng đúng hạn	Mua hàng
采购周期	Chu kỳ mua hàng	Mua hàng
采购节省	Giá trị tiết kiệm mua hàng	Mua hàng
采购支出	Chi tiêu mua hàng	Mua hàng
支出分析	Phân tích chi tiêu	Mua hàng
采购集中度	Mức độ tập trung mua hàng	Mua hàng
三方匹配	Đối chiếu ba bên	Mua hàng
两方匹配	Đối chiếu hai bên	Mua hàng
发票容差	Dung sai đối chiếu hóa đơn	Mua hàng
采购差异	Chênh lệch mua hàng	Mua hàng
采购价格差异	Chênh lệch giá mua (PPV)	Mua hàng
`);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-sales-crm.js */
(function(root){"use strict";root.VDuckieERPTermsV77.addText(`
客户关系管理	Quản lý quan hệ khách hàng (CRM)	Bán hàng
客户主数据	Dữ liệu gốc khách hàng	Bán hàng
潜在客户	Khách hàng tiềm năng	Bán hàng
销售线索	Đầu mối bán hàng	Bán hàng
线索来源	Nguồn đầu mối	Bán hàng
线索分配	Phân công đầu mối	Bán hàng
线索转化	Chuyển đổi đầu mối	Bán hàng
销售机会	Cơ hội bán hàng	Bán hàng
商机阶段	Giai đoạn cơ hội bán hàng	Bán hàng
商机金额	Giá trị cơ hội dự kiến	Bán hàng
成交概率	Xác suất chốt đơn	Bán hàng
预计成交日	Ngày dự kiến chốt đơn	Bán hàng
销售漏斗	Phễu bán hàng	Bán hàng
销售管道	Đường ống bán hàng	Bán hàng
赢单	Chốt đơn thành công	Bán hàng
丢单	Mất cơ hội bán hàng	Bán hàng
丢单原因	Lý do mất đơn	Bán hàng
客户活动	Hoạt động với khách hàng	Bán hàng
客户拜访	Thăm khách hàng	Bán hàng
跟进任务	Nhiệm vụ theo dõi	Bán hàng
销售区域	Khu vực bán hàng	Bán hàng
销售渠道	Kênh bán hàng	Bán hàng
分销渠道	Kênh phân phối	Bán hàng
经销商	Nhà phân phối	Bán hàng
代理商	Đại lý	Bán hàng
终端客户	Khách hàng cuối	Bán hàng
客户分类	Phân loại khách hàng	Bán hàng
客户等级	Cấp khách hàng	Bán hàng
客户生命周期	Vòng đời khách hàng	Bán hàng
客户价值	Giá trị khách hàng	Bán hàng
客户流失	Khách hàng rời bỏ	Bán hàng
报价申请	Yêu cầu lập báo giá	Bán hàng
销售报价	Báo giá bán hàng	Bán hàng
销售报价单	Phiếu báo giá bán hàng	Bán hàng
报价有效期	Thời hạn hiệu lực báo giá	Bán hàng
报价版本	Phiên bản báo giá	Bán hàng
报价审批	Phê duyệt báo giá	Bán hàng
报价转订单	Chuyển báo giá thành đơn hàng	Bán hàng
销售订单	Đơn bán hàng (SO)	Bán hàng
销售订单行	Dòng chi tiết đơn bán hàng	Bán hàng
标准销售订单	Đơn bán hàng tiêu chuẩn	Bán hàng
紧急订单	Đơn hàng khẩn	Bán hàng
预售订单	Đơn hàng bán trước	Bán hàng
寄售订单	Đơn bán hàng ký gửi	Bán hàng
免费订单	Đơn hàng miễn phí	Bán hàng
样品订单	Đơn hàng mẫu	Bán hàng
销售合同	Hợp đồng bán hàng	Bán hàng
框架销售协议	Thỏa thuận bán hàng khung	Bán hàng
销售订单确认	Xác nhận đơn bán hàng	Bán hàng
订单释放	Phát hành đơn bán hàng	Bán hàng
订单冻结	Đóng băng đơn hàng	Bán hàng
订单拆分	Tách đơn hàng	Bán hàng
订单合并	Gộp đơn hàng	Bán hàng
订单优先级	Mức ưu tiên đơn hàng	Bán hàng
订单履行	Thực hiện đơn hàng	Bán hàng
订单到现金	Quy trình từ đơn hàng đến thu tiền (O2C)	Bán hàng
需求日期	Ngày khách yêu cầu	Bán hàng
承诺日期	Ngày giao hàng cam kết	Bán hàng
请求发货日	Ngày yêu cầu xuất hàng	Bán hàng
实际发货日	Ngày xuất hàng thực tế	Bán hàng
订单分配	Phân bổ tồn kho cho đơn hàng	Bán hàng
缺货订单	Đơn hàng thiếu hàng	Bán hàng
延期交货	Giao hàng trễ	Bán hàng
延期订单	Đơn hàng bị trì hoãn	Bán hàng
欠货	Số lượng còn nợ giao	Bán hàng
可售库存	Tồn kho có thể bán (ATS)	Bán hàng
可承诺供货量	Lượng có thể cam kết (ATP)	Bán hàng
可承诺生产能力	Năng lực có thể cam kết (CTP)	Bán hàng
交货	Giao hàng	Bán hàng
交货单	Phiếu giao hàng	Bán hàng
交货计划	Kế hoạch giao hàng	Bán hàng
分批交货	Giao hàng nhiều đợt	Bán hàng
一次性交货	Giao hàng một lần	Bán hàng
直运	Giao thẳng từ nhà cung cấp	Bán hàng
直运订单	Đơn hàng giao thẳng	Bán hàng
发运确认	Xác nhận xuất hàng	Bán hàng
签收	Ký nhận hàng	Bán hàng
签收证明	Bằng chứng giao hàng (POD)	Bán hàng
销售退货	Hàng bán trả lại	Bán hàng
退货申请	Yêu cầu trả hàng	Bán hàng
退货授权	Ủy quyền trả hàng (RMA)	Bán hàng
退货订单	Đơn trả hàng bán	Bán hàng
退货收货	Nhận hàng trả lại	Bán hàng
退货检验	Kiểm tra hàng trả lại	Bán hàng
换货	Đổi hàng	Bán hàng
退款	Hoàn tiền	Bán hàng
贷项通知单	Thông báo ghi có	Bán hàng
借项通知单	Thông báo ghi nợ	Bán hàng
销售价格	Giá bán	Bán hàng
价格表	Bảng giá bán	Bán hàng
客户价格	Giá riêng theo khách hàng	Bán hàng
促销价格	Giá khuyến mại	Bán hàng
折扣	Chiết khấu bán hàng	Bán hàng
行折扣	Chiết khấu theo dòng	Bán hàng
总折扣	Chiết khấu toàn đơn	Bán hàng
折扣权限	Quyền giảm giá	Bán hàng
销售返利	Chiết khấu hoàn lại cho khách	Bán hàng
经销商返利	Chiết khấu hoàn lại cho nhà phân phối	Bán hàng
销售佣金	Hoa hồng bán hàng	Bán hàng
佣金比例	Tỷ lệ hoa hồng	Bán hàng
销售目标	Mục tiêu bán hàng	Bán hàng
销售业绩	Kết quả bán hàng	Bán hàng
销售额	Doanh số bán hàng	Bán hàng
毛利	Lợi nhuận gộp	Bán hàng
毛利率	Tỷ suất lợi nhuận gộp	Bán hàng
客户信用	Quản lý tín dụng khách hàng	Bán hàng
信用检查	Kiểm tra tín dụng	Bán hàng
信用冻结	Đóng băng tín dụng	Bán hàng
逾期应收	Công nợ phải thu quá hạn	Bán hàng
客户对账	Đối chiếu công nợ khách hàng	Bán hàng
客户对账单	Bảng đối chiếu công nợ khách hàng	Bán hàng
客户服务	Dịch vụ khách hàng	Bán hàng
服务请求	Yêu cầu dịch vụ	Bán hàng
客户投诉	Khiếu nại khách hàng	Bán hàng
投诉处理	Xử lý khiếu nại	Bán hàng
客户满意度	Mức độ hài lòng khách hàng	Bán hàng
`);})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-broad-candidates.js */
(function(root){
"use strict";
var pool=root.__ERP_V77_CANDIDATES__||(root.__ERP_V77_CANDIDATES__=[]),seen=Object.create(null);
for(var i=0;i<pool.length;i++)if(pool[i]&&pool[i][0])seen[pool[i][0]]=1;
function add(z,v,c,n){z=(z||"").trim();if(!z||seen[z])return;pool.push([z,(v||"").trim(),c||"Hệ thống",n||""]);seen[z]=1}
function rows(text){return String(text||"").trim().split(/\n+/).map(function(line){return line.split("|")})}
function series(entityText,opText,kind){var es=rows(entityText),os=rows(opText);for(var a=0;a<es.length;a++)for(var b=0;b<os.length;b++){var e=es[a],o=os[b],note=kind===1?"Chức năng xử lý chứng từ ERP.":kind===2?"Chỉ tiêu phân tích và báo cáo ERP.":"Chức năng quản trị dữ liệu gốc ERP.";add(e[0]+o[0],o[1]+" "+e[1],e[2],note)}}
var docOps=`创建|Tạo
修改|Sửa
提交|Trình
审批|Phê duyệt
确认|Xác nhận
撤回|Thu hồi
冻结|Đóng băng
解冻|Bỏ đóng băng
关闭|Đóng
重开|Mở lại
复制|Sao chép
查询|Tra cứu
导入|Nhập dữ liệu
导出|Xuất dữ liệu
打印|In
归档|Lưu trữ`;
var docs=`预算申请|đề nghị ngân sách|Ngân sách
预算调整单|phiếu điều chỉnh ngân sách|Ngân sách
费用报销单|phiếu hoàn ứng chi phí|Tài chính
付款申请单|phiếu đề nghị thanh toán|Tài chính
收款申请单|phiếu đề nghị thu tiền|Tài chính
资金调拨单|phiếu điều chuyển vốn|Tài chính
银行付款单|phiếu thanh toán ngân hàng|Tài chính
银行收款单|phiếu thu qua ngân hàng|Tài chính
税务调整单|phiếu điều chỉnh thuế|Tài chính
成本调整单|phiếu điều chỉnh chi phí|Giá thành
质量通知单|phiếu thông báo chất lượng|Chất lượng
不合格品报告|báo cáo sản phẩm không phù hợp|Chất lượng
纠正措施单|phiếu hành động khắc phục|Chất lượng
预防措施单|phiếu hành động phòng ngừa|Chất lượng
偏差申请单|phiếu đề nghị chấp thuận sai lệch|Chất lượng
维护通知单|phiếu thông báo bảo trì|Bảo trì
维修工单|lệnh sửa chữa thiết bị|Bảo trì
保养工单|lệnh bảo dưỡng thiết bị|Bảo trì
停机申请单|phiếu đề nghị dừng máy|Bảo trì
备件领用单|phiếu lĩnh phụ tùng|Bảo trì
运输订单|lệnh vận chuyển|Logistics
装运计划单|phiếu kế hoạch giao vận|Logistics
运费结算单|phiếu quyết toán cước vận chuyển|Logistics
报关申请单|phiếu đề nghị khai báo hải quan|Xuất nhập khẩu
进出口许可证申请|đề nghị giấy phép xuất nhập khẩu|Xuất nhập khẩu
招聘申请单|phiếu đề nghị tuyển dụng|Nhân sự
入职申请单|phiếu tiếp nhận nhân viên|Nhân sự
转正申请单|phiếu đề nghị chính thức|Nhân sự
调岗申请单|phiếu đề nghị điều chuyển vị trí|Nhân sự
离职申请单|phiếu đề nghị nghỉ việc|Nhân sự
请假申请单|phiếu xin nghỉ|Nhân sự
加班申请单|phiếu đề nghị làm thêm|Tiền lương
出差申请单|phiếu đề nghị công tác|Nhân sự
薪资调整单|phiếu điều chỉnh lương|Tiền lương
项目立项申请|đề nghị khởi tạo dự án|Dự án
项目变更单|phiếu thay đổi dự án|Dự án
项目验收单|phiếu nghiệm thu dự án|Dự án
服务请求单|phiếu yêu cầu dịch vụ|Dịch vụ
现场服务单|phiếu dịch vụ hiện trường|Dịch vụ
系统变更申请|đề nghị thay đổi hệ thống|Hệ thống`;
series(docs,docOps,1);
var anaOps=`查询|Tra cứu
明细|Chi tiết
汇总|Tổng hợp
分析|Phân tích
对比|So sánh
趋势|Xu hướng
预测|Dự báo
报表|Báo cáo
看板|Bảng điều khiển
导出|Xuất dữ liệu`;
var subjects=`现金流|dòng tiền|Tài chính
资金头寸|vị thế tiền mặt|Tài chính
应收账龄|tuổi nợ phải thu|Tài chính
应付账龄|tuổi nợ phải trả|Tài chính
银行余额|số dư ngân hàng|Tài chính
外汇敞口|trạng thái ngoại tệ|Tài chính
税负|gánh nặng thuế|Tài chính
收入确认|ghi nhận doanh thu|Tài chính
产品成本|giá thành sản phẩm|Giá thành
制造费用|chi phí sản xuất chung|Giá thành
成本差异|chênh lệch chi phí|Giá thành
盈利能力|khả năng sinh lời|Giá thành
预算执行|thực hiện ngân sách|Ngân sách
预算占用|mức chiếm dụng ngân sách|Ngân sách
采购支出|chi tiêu mua hàng|Ngân sách
质量成本|chi phí chất lượng|Chất lượng
不良率|tỷ lệ lỗi|Chất lượng
供应商质量|chất lượng nhà cung cấp|Chất lượng
过程能力|năng lực quá trình|Chất lượng
设备故障|sự cố thiết bị|Bảo trì
设备停机|thời gian dừng thiết bị|Bảo trì
维修成本|chi phí sửa chữa|Bảo trì
备件消耗|tiêu hao phụ tùng|Bảo trì
运输成本|chi phí vận chuyển|Logistics
运输时效|thời gian vận chuyển|Logistics
承运商绩效|hiệu suất hãng vận chuyển|Logistics
清关时效|thời gian thông quan|Xuất nhập khẩu
关税成本|chi phí thuế quan|Xuất nhập khẩu
人员流动|biến động nhân sự|Nhân sự
招聘效率|hiệu quả tuyển dụng|Nhân sự
出勤率|tỷ lệ chuyên cần|Nhân sự
人工成本|chi phí nhân công|Tiền lương
薪资结构|cơ cấu tiền lương|Tiền lương
项目进度|tiến độ dự án|Dự án
项目成本|chi phí dự án|Dự án
项目收入|doanh thu dự án|Dự án
服务响应|mức đáp ứng dịch vụ|Dịch vụ
服务成本|chi phí dịch vụ|Dịch vụ
系统性能|hiệu năng hệ thống|Hệ thống
接口运行|tình trạng chạy giao diện|Dữ liệu`;
series(subjects,anaOps,2);
var masterOps=`建立|Tạo
修改|Sửa
审核|Duyệt
启用|Kích hoạt
停用|Ngừng sử dụng
复制|Sao chép
导入|Nhập dữ liệu
导出|Xuất dữ liệu
查询|Tra cứu
归档|Lưu trữ`;
var masters=`会计科目|tài khoản kế toán|Tài chính
成本中心|trung tâm chi phí|Giá thành
利润中心|trung tâm lợi nhuận|Giá thành
预算项目|hạng mục ngân sách|Ngân sách
税码|mã thuế|Tài chính
银行账户|tài khoản ngân hàng|Tài chính
质量标准|tiêu chuẩn chất lượng|Chất lượng
检验特性|đặc tính kiểm nghiệm|Chất lượng
抽样方案|phương án lấy mẫu|Chất lượng
设备主数据|dữ liệu gốc thiết bị|Bảo trì
功能位置|vị trí chức năng thiết bị|Bảo trì
维护策略|chiến lược bảo trì|Bảo trì
承运商主数据|dữ liệu gốc hãng vận chuyển|Logistics
运输路线|tuyến vận chuyển|Logistics
海关商品编码|mã hàng hóa hải quan|Xuất nhập khẩu
员工主数据|dữ liệu gốc nhân viên|Nhân sự
岗位主数据|dữ liệu gốc vị trí công việc|Nhân sự
薪资项目|khoản mục tiền lương|Tiền lương
项目主数据|dữ liệu gốc dự án|Dự án
服务产品|sản phẩm dịch vụ|Dịch vụ
数据标准|tiêu chuẩn dữ liệu|Dữ liệu
接口映射|ánh xạ giao diện|Dữ liệu`;
series(masters,masterOps,3);
var direct=`会计年度|Năm tài chính|Tài chính
过账期间|Kỳ hạch toán|Tài chính
特殊期间|Kỳ kế toán đặc biệt|Tài chính
期末结账|Khóa sổ cuối kỳ|Tài chính
自动过账|Hạch toán tự động|Tài chính
批量过账|Hạch toán hàng loạt|Tài chính
暂存凭证|Chứng từ tạm lưu|Tài chính
循环凭证|Chứng từ định kỳ|Tài chính
冲销凭证|Chứng từ đảo bút toán|Tài chính
清账|Đối trừ công nợ|Tài chính
部分清账|Đối trừ một phần|Tài chính
未清项|Khoản mục chưa đối trừ|Tài chính
三方匹配|Đối chiếu ba bên|Tài chính
发票容差|Dung sai hóa đơn|Tài chính
付款批次|Lô thanh toán|Tài chính
付款建议|Đề xuất thanh toán|Tài chính
自动付款程序|Chương trình thanh toán tự động|Tài chính
银行对账单|Sao kê ngân hàng|Tài chính
未达账项|Khoản chưa khớp ngân hàng|Tài chính
余额调节表|Bảng điều chỉnh số dư|Tài chính
汇率重估|Đánh giá lại tỷ giá|Tài chính
未实现汇兑损益|Lãi lỗ tỷ giá chưa thực hiện|Tài chính
合同资产|Tài sản hợp đồng|Tài chính
合同负债|Nợ phải trả hợp đồng|Tài chính
履约义务|Nghĩa vụ thực hiện hợp đồng|Tài chính
使用权资产|Tài sản quyền sử dụng|Tài chính
租赁负债|Nợ thuê tài sản|Tài chính
递延所得税|Thuế thu nhập hoãn lại|Tài chính
进项税额|Thuế đầu vào|Tài chính
销项税额|Thuế đầu ra|Tài chính
税务申报|Kê khai thuế|Tài chính
电子发票|Hóa đơn điện tử|Tài chính
成本要素|Yếu tố chi phí|Giá thành
初级成本要素|Yếu tố chi phí sơ cấp|Giá thành
次级成本要素|Yếu tố chi phí thứ cấp|Giá thành
内部订单|Lệnh nội bộ|Giá thành
作业类型|Loại hoạt động|Giá thành
作业价格|Đơn giá hoạt động|Giá thành
分配循环|Chu kỳ phân bổ|Giá thành
评估循环|Chu kỳ đánh giá phân bổ|Giá thành
成本结转|Kết chuyển chi phí|Giá thành
在制品计算|Tính sản phẩm dở dang|Giá thành
差异结算|Quyết toán chênh lệch|Giá thành
标准成本估算|Ước tính giá thành tiêu chuẩn|Giá thành
成本组件结构|Cấu trúc thành phần giá thành|Giá thành
材料价格差异|Chênh lệch giá nguyên liệu|Giá thành
人工效率差异|Chênh lệch hiệu suất lao động|Giá thành
边际贡献|Số dư đảm phí|Giá thành
盈亏平衡点|Điểm hòa vốn|Giá thành
获利能力分析|Phân tích khả năng sinh lời|Giá thành
转移价格|Giá chuyển nhượng nội bộ|Giá thành
预算版本|Phiên bản ngân sách|Ngân sách
预算场景|Kịch bản ngân sách|Ngân sách
预算编制|Lập ngân sách|Ngân sách
预算下达|Phân bổ ngân sách|Ngân sách
预算释放|Giải phóng ngân sách|Ngân sách
预算超支|Vượt ngân sách|Ngân sách
预算预警|Cảnh báo ngân sách|Ngân sách
可用预算|Ngân sách khả dụng|Ngân sách
资本预算|Ngân sách vốn|Ngân sách
零基预算|Ngân sách từ số không|Ngân sách
质量管理体系|Hệ thống quản lý chất lượng (QMS)|Chất lượng
检验计划|Kế hoạch kiểm nghiệm|Chất lượng
检验批|Lô kiểm nghiệm|Chất lượng
使用决策|Quyết định sử dụng lô kiểm nghiệm|Chất lượng
进料检验|Kiểm tra nguyên liệu đầu vào|Chất lượng
过程检验|Kiểm tra trong quá trình|Chất lượng
成品检验|Kiểm tra thành phẩm|Chất lượng
出货检验|Kiểm tra trước xuất hàng|Chất lượng
首件检验|Kiểm tra sản phẩm đầu tiên|Chất lượng
抽样检验|Kiểm tra lấy mẫu|Chất lượng
不合格品|Sản phẩm không phù hợp|Chất lượng
质量隔离|Cách ly chất lượng|Chất lượng
让步接收|Chấp nhận có điều kiện|Chất lượng
纠正预防措施|Hành động khắc phục và phòng ngừa (CAPA)|Chất lượng
根本原因分析|Phân tích nguyên nhân gốc|Chất lượng
八步法|Phương pháp 8D|Chất lượng
失效模式分析|Phân tích chế độ lỗi (FMEA)|Chất lượng
测量系统分析|Phân tích hệ thống đo lường (MSA)|Chất lượng
统计过程控制|Kiểm soát quá trình thống kê (SPC)|Chất lượng
控制图|Biểu đồ kiểm soát|Chất lượng
过程能力指数|Chỉ số năng lực quá trình|Chất lượng
供应商审核|Đánh giá nhà cung cấp|Chất lượng
校准管理|Quản lý hiệu chuẩn|Chất lượng
产品召回|Thu hồi sản phẩm|Chất lượng
质量追溯|Truy xuất chất lượng|Chất lượng
企业资产管理|Quản lý tài sản doanh nghiệp (EAM)|Bảo trì
设备台账|Sổ thiết bị|Bảo trì
设备层级|Cấu trúc phân cấp thiết bị|Bảo trì
设备物料清单|BOM thiết bị|Bảo trì
预防性维护|Bảo trì phòng ngừa|Bảo trì
预测性维护|Bảo trì dự đoán|Bảo trì
纠正性维护|Bảo trì khắc phục|Bảo trì
紧急维修|Sửa chữa khẩn cấp|Bảo trì
维护计划|Kế hoạch bảo trì|Bảo trì
维护周期|Chu kỳ bảo trì|Bảo trì
计量点|Điểm đo thiết bị|Bảo trì
状态监测|Giám sát tình trạng|Bảo trì
润滑管理|Quản lý bôi trơn|Bảo trì
故障代码|Mã sự cố|Bảo trì
维修历史|Lịch sử sửa chữa|Bảo trì
平均故障间隔|Thời gian trung bình giữa hai hỏng hóc (MTBF)|Bảo trì
平均修复时间|Thời gian sửa chữa trung bình (MTTR)|Bảo trì
综合设备效率|Hiệu suất thiết bị tổng thể (OEE)|Bảo trì
运输管理系统|Hệ thống quản lý vận tải (TMS)|Logistics
运输需求|Nhu cầu vận chuyển|Logistics
运输计划|Kế hoạch vận chuyển|Logistics
装载计划|Kế hoạch xếp tải|Logistics
配载|Phối tải|Logistics
整车运输|Vận chuyển nguyên xe (FTL)|Logistics
零担运输|Vận chuyển hàng lẻ (LTL)|Logistics
多式联运|Vận tải đa phương thức|Logistics
运输调度|Điều phối vận chuyển|Logistics
码头预约|Đặt lịch bến nhận hàng|Logistics
交叉转运|Cross-docking|Logistics
循环取货|Lấy hàng theo tuyến vòng (milk run)|Logistics
运输跟踪|Theo dõi vận chuyển|Logistics
运费计价|Tính cước vận chuyển|Logistics
运费结算|Quyết toán cước vận chuyển|Logistics
运输索赔|Khiếu nại vận chuyển|Logistics
国际贸易管理|Quản lý thương mại quốc tế|Xuất nhập khẩu
贸易合规|Tuân thủ thương mại|Xuất nhập khẩu
海关编码|Mã HS hải quan|Xuất nhập khẩu
商品归类|Phân loại hàng hóa hải quan|Xuất nhập khẩu
原产地规则|Quy tắc xuất xứ|Xuất nhập khẩu
原产地证书|Chứng nhận xuất xứ (C/O)|Xuất nhập khẩu
进口申报|Khai báo nhập khẩu|Xuất nhập khẩu
出口申报|Khai báo xuất khẩu|Xuất nhập khẩu
报关单|Tờ khai hải quan|Xuất nhập khẩu
关税税率|Thuế suất nhập khẩu|Xuất nhập khẩu
保税库存|Tồn kho bảo thuế|Xuất nhập khẩu
保税仓库|Kho bảo thuế|Xuất nhập khẩu
信用证|Thư tín dụng (L/C)|Xuất nhập khẩu
提单|Vận đơn đường biển (B/L)|Xuất nhập khẩu
空运提单|Vận đơn hàng không (AWB)|Xuất nhập khẩu
商业发票|Hóa đơn thương mại|Xuất nhập khẩu
装箱单|Phiếu đóng gói|Xuất nhập khẩu
国际贸易术语|Điều kiện thương mại quốc tế (Incoterms)|Xuất nhập khẩu
人力资本管理|Quản lý vốn nhân lực (HCM)|Nhân sự
组织架构|Cơ cấu tổ chức|Nhân sự
岗位编制|Định biên vị trí|Nhân sự
职位说明书|Bản mô tả công việc|Nhân sự
劳动力规划|Hoạch định lực lượng lao động|Nhân sự
人才库|Kho ứng viên / nhân tài|Nhân sự
候选人|Ứng viên|Nhân sự
面试安排|Sắp xếp phỏng vấn|Nhân sự
录用通知|Thư mời nhận việc|Nhân sự
入职流程|Quy trình tiếp nhận nhân viên|Nhân sự
试用期|Thời gian thử việc|Nhân sự
劳动合同|Hợp đồng lao động|Nhân sự
员工调动|Điều chuyển nhân viên|Nhân sự
晋升管理|Quản lý thăng chức|Nhân sự
离职流程|Quy trình nghỉ việc|Nhân sự
继任计划|Kế hoạch kế nhiệm|Nhân sự
能力模型|Mô hình năng lực|Nhân sự
绩效考核|Đánh giá hiệu suất|Nhân sự
培训计划|Kế hoạch đào tạo|Nhân sự
考勤管理|Quản lý chấm công|Nhân sự
排班管理|Quản lý ca làm việc|Nhân sự
打卡记录|Dữ liệu chấm công|Nhân sự
年假余额|Số ngày phép còn lại|Nhân sự
工资核算|Tính lương|Tiền lương
工资周期|Chu kỳ tính lương|Tiền lương
基本工资|Lương cơ bản|Tiền lương
绩效奖金|Thưởng hiệu suất|Tiền lương
加班工资|Tiền làm thêm giờ|Tiền lương
津贴|Phụ cấp|Tiền lương
扣款|Khoản khấu trừ|Tiền lương
追溯计算|Tính hồi tố tiền lương|Tiền lương
个人所得税|Thuế thu nhập cá nhân|Tiền lương
社会保险|Bảo hiểm xã hội|Tiền lương
工资单|Phiếu lương|Tiền lương
工资过账|Hạch toán tiền lương|Tiền lương
项目组合管理|Quản lý danh mục dự án (PPM)|Dự án
项目定义|Định nghĩa dự án|Dự án
工作分解结构|Cấu trúc phân rã công việc (WBS)|Dự án
项目任务|Nhiệm vụ dự án|Dự án
项目里程碑|Cột mốc dự án|Dự án
项目基线|Đường cơ sở dự án|Dự án
项目预算|Ngân sách dự án|Dự án
项目预测|Dự báo dự án|Dự án
项目资源|Nguồn lực dự án|Dự án
资源分配|Phân bổ nguồn lực|Dự án
项目工时表|Bảng giờ công dự án|Dự án
项目风险|Rủi ro dự án|Dự án
项目交付物|Sản phẩm bàn giao dự án|Dự án
项目结算|Quyết toán dự án|Dự án
挣值管理|Quản lý giá trị thu được (EVM)|Dự án
项目关闭|Đóng dự án|Dự án
现场服务管理|Quản lý dịch vụ hiện trường (FSM)|Dịch vụ
服务合同|Hợp đồng dịch vụ|Dịch vụ
服务级别协议|Thỏa thuận mức dịch vụ (SLA)|Dịch vụ
客户资产|Tài sản của khách hàng|Dịch vụ
服务工单|Lệnh dịch vụ|Dịch vụ
服务派工|Điều phối kỹ thuật viên|Dịch vụ
服务技师|Kỹ thuật viên dịch vụ|Dịch vụ
上门服务|Dịch vụ tại chỗ khách hàng|Dịch vụ
远程服务|Dịch vụ từ xa|Dịch vụ
安装服务|Dịch vụ lắp đặt|Dịch vụ
维修服务|Dịch vụ sửa chữa|Dịch vụ
保修服务|Dịch vụ bảo hành|Dịch vụ
服务备件|Phụ tùng dịch vụ|Dịch vụ
服务报价|Báo giá dịch vụ|Dịch vụ
服务验收|Nghiệm thu dịch vụ|Dịch vụ
主数据管理|Quản lý dữ liệu gốc (MDM)|Dữ liệu
数据治理|Quản trị dữ liệu|Dữ liệu
数据所有者|Chủ sở hữu dữ liệu|Dữ liệu
数据管理员|Người quản trị dữ liệu|Dữ liệu
数据质量规则|Quy tắc chất lượng dữ liệu|Dữ liệu
数据血缘|Dòng dõi dữ liệu|Dữ liệu
数据目录|Danh mục dữ liệu|Dữ liệu
数据字典|Từ điển dữ liệu|Dữ liệu
数据清洗|Làm sạch dữ liệu|Dữ liệu
重复数据合并|Gộp dữ liệu trùng|Dữ liệu
数据迁移|Di chuyển dữ liệu|Dữ liệu
数据转换|Chuyển đổi dữ liệu|Dữ liệu
数据验证|Xác thực dữ liệu|Dữ liệu
数据仓库|Kho dữ liệu|Dữ liệu
数据湖|Hồ dữ liệu|Dữ liệu
抽取转换加载|Trích xuất, chuyển đổi và nạp dữ liệu (ETL)|Dữ liệu
应用程序接口|Giao diện lập trình ứng dụng (API)|Dữ liệu
消息队列|Hàng đợi thông điệp|Dữ liệu
中间件|Phần mềm trung gian|Dữ liệu
接口监控|Giám sát giao diện|Dữ liệu
批处理作业|Tác vụ xử lý hàng loạt|Hệ thống
作业调度器|Bộ lập lịch tác vụ|Hệ thống
系统审计日志|Nhật ký kiểm toán hệ thống|Hệ thống
工作流引擎|Công cụ quy trình phê duyệt|Hệ thống
职责分离|Phân tách nhiệm vụ (SoD)|Hệ thống
紧急访问权限|Quyền truy cập khẩn cấp|Hệ thống
多公司管理|Quản lý nhiều công ty|Hệ thống
多账套管理|Quản lý nhiều bộ sổ|Hệ thống
本地化配置|Cấu hình bản địa hóa|Hệ thống
多语言支持|Hỗ trợ đa ngôn ngữ|Hệ thống
多币种支持|Hỗ trợ đa tiền tệ|Hệ thống
编号规则|Quy tắc đánh số|Hệ thống
功能开关|Công tắc tính năng|Hệ thống
个性化设置|Thiết lập cá nhân hóa|Hệ thống`;
var ds=rows(direct);for(var d=0;d<ds.length;d++)add(ds[d][0],ds[d][1],ds[d][2],"Thuật ngữ nghiệp vụ chuẩn thuộc phân hệ "+ds[d][2]+".");
root.__ERP_V77_CANDIDATE_META__={count:pool.length,version:"77.1"};
})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v77/erp-terms-v77-finalize.js */
(function(root){
  "use strict";
  var api=root.VDuckieERPTermsV77;
  var pool=root.__ERP_V77_CANDIDATES__||[];
  var target=1600;
  if(!api||typeof api.addText!=="function"){
    console.error("Không tìm thấy bộ gộp từ vựng ERP v77.");
    return;
  }

  var preferred=["Tài chính","Giá thành","Ngân sách","Chất lượng","Bảo trì","Logistics","Xuất nhập khẩu","Nhân sự","Tiền lương","Dự án","Dịch vụ","Dữ liệu","Hệ thống"];
  var groups=Object.create(null),categoryOrder=[];
  for(var i=0;i<pool.length;i++){
    var row=pool[i],category=row[2]||"Hệ thống";
    if(!groups[category]){groups[category]=[];categoryOrder.push(category);}
    groups[category].push(row);
  }
  for(var c=0;c<categoryOrder.length;c++){
    groups[categoryOrder[c]].sort(function(a,b){
      var ap=/^Thuật ngữ nghiệp vụ chuẩn/.test(a[3]||"")?0:1;
      var bp=/^Thuật ngữ nghiệp vụ chuẩn/.test(b[3]||"")?0:1;
      return ap-bp;
    });
  }
  categoryOrder.sort(function(a,b){
    var ai=preferred.indexOf(a),bi=preferred.indexOf(b);
    if(ai<0)ai=999;if(bi<0)bi=999;
    return ai-bi;
  });

  var positions=Object.create(null),rounds=0,progress=true;
  while(api.terms.length<target&&progress){
    progress=false;rounds++;
    for(var j=0;j<categoryOrder.length&&api.terms.length<target;j++){
      var name=categoryOrder[j],index=positions[name]||0,list=groups[name];
      if(index>=list.length)continue;
      var before=api.terms.length,row=list[index];
      positions[name]=index+1;
      api.addText([row[0],row[1],row[2],row[3]||""].join("\t"));
      if(api.terms.length>before)progress=true;
    }
    if(rounds>pool.length+5)break;
  }

  var present=Object.create(null),categories=[];
  for(var k=0;k<api.terms.length;k++){
    var cat=api.terms[k][4]||"Chứng từ";
    if(!present[cat]){present[cat]=true;categories.push(cat);}
  }
  categories.sort(function(a,b){
    var ai=preferred.indexOf(a),bi=preferred.indexOf(b);
    if(ai<0)ai=999;if(bi<0)bi=999;
    return ai-bi||a.localeCompare(b,"vi");
  });

  var sources=["Tài liệu iGP/Workflow ERP của doanh nghiệp","SAP S/4HANA","Microsoft Dynamics 365","Oracle Fusion Cloud ERP/SCM","Odoo ERP","Thuật ngữ ERP phổ biến quốc tế"];
  api.finish(categories,527+pool.length,sources);
  root.ERP_TERMS_V77.version="77.1";
  root.ERP_TERMS_V77.targetCount=target;
  root.ERP_TERMS_V77.candidateCount=pool.length;
  root.ERP_TERMS_V77.targetReached=api.terms.length>=target;
  root.ERP_TERMS_V77.totalCount=api.terms.length;
  if(api.terms.length<target)console.error("Bộ từ ERP v77.1 chưa đạt mục tiêu:",api.terms.length,"/",target);
})(typeof globalThis!=="undefined"?globalThis:this);
;
/* assets/v79/hsk-dictionary-v79.js */
(function(root){
  "use strict";

  if(root.VDuckieHSKDictionaryLoader&&root.VDuckieHSKDictionaryLoader.version==="79.0"){
    root.VDuckieHSKDictionaryLoader.load();
    return;
  }

  var VERSION="79.0";
  var BASE_PATH="./assets/v79/hsk-dictionary/";
  var MIN_TERMS=10000;
  var loading=false;
  var retryCount=0;

  function emit(name,detail){
    if(typeof root.dispatchEvent!=="function")return;
    var event;
    try{event=new CustomEvent(name,{detail:detail||{}});}
    catch(error){event=document.createEvent("CustomEvent");event.initCustomEvent(name,false,false,detail||{});}
    root.dispatchEvent(event);
  }

  function setStatus(status,message,extra){
    var meta=root.HSK_DICTIONARY_META||(root.HSK_DICTIONARY_META={});
    meta.version=VERSION;
    meta.status=status;
    meta.message=message||"";
    if(extra)for(var key in extra)if(Object.prototype.hasOwnProperty.call(extra,key))meta[key]=extra[key];
    emit("vduckie:hsk-dictionary-status",meta);
  }

  function fetchJson(url){
    return fetch(url,{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error(response.status+" "+response.statusText+" · "+url);
      return response.json();
    });
  }

  function normalizeTerm(item){
    return {
      hanzi:item.h||"",
      pinyin:item.p||"",
      traditional:item.t||"",
      pos:item.o||"",
      levels:Array.isArray(item.l)?item.l.slice(0):[],
      meanings:Array.isArray(item.m)?item.m.slice(0):[],
      id:item.i||""
    };
  }

  function installData(manifest,chunks){
    var terms=[];
    for(var i=0;i<chunks.length;i++){
      var chunk=chunks[i]||[];
      for(var j=0;j<chunk.length;j++){
        var term=normalizeTerm(chunk[j]);
        if(term.hanzi)terms.push(term);
      }
    }
    if(terms.length<MIN_TERMS)throw new Error("Bộ HSK chỉ có "+terms.length+" từ; cần tối thiểu "+MIN_TERMS+" từ.");
    root.HSK_DICTIONARY_TERMS=terms;
    root.HSK_DICTIONARY_META={
      version:VERSION,
      status:"ready",
      message:"Đã nạp "+terms.length+" từ HSK.",
      termCount:terms.length,
      translatedCount:Number(manifest.translatedCount||0),
      untranslatedCount:Number(manifest.untranslatedCount||0),
      levelCounts:manifest.levelCounts||{},
      standard:manifest.standard||"GF0025-2021 · HSK 3.0",
      generatedAt:manifest.generatedAt||"",
      sources:manifest.sources||[]
    };
    loading=false;
    emit("vduckie:hsk-dictionary-ready",root.HSK_DICTIONARY_META);
  }

  function load(){
    if(loading||root.HSK_DICTIONARY_TERMS&&root.HSK_DICTIONARY_TERMS.length>=MIN_TERMS)return;
    loading=true;
    setStatus("loading","Đang nạp bộ từ điển HSK 10.000+ từ…");
    fetchJson(BASE_PATH+"manifest.json?v="+VERSION).then(function(manifest){
      if(!manifest||Number(manifest.termCount||0)<MIN_TERMS||!Array.isArray(manifest.chunks))throw new Error("Manifest HSK v79 không hợp lệ.");
      return Promise.all(manifest.chunks.map(function(name){return fetchJson(BASE_PATH+name+"?v="+VERSION);})).then(function(chunks){
        installData(manifest,chunks);
      });
    }).catch(function(error){
      loading=false;
      retryCount++;
      setStatus("waiting","Dữ liệu HSK v79 đang được đồng bộ lên web.",{error:String(error&&error.message||error),retryCount:retryCount});
      if(retryCount<=12)root.setTimeout(load,Math.min(30000,3000+retryCount*2000));
      else setStatus("error","Chưa nạp được bộ HSK 10.000+ từ. Hãy tải lại trang sau khi GitHub Pages đồng bộ.",{error:String(error&&error.message||error)});
    });
  }

  root.VDuckieHSKDictionaryLoader={version:VERSION,load:load,retry:function(){retryCount=0;load();}};
  if(typeof document==="undefined")return;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});
  else load();
})(typeof window!=="undefined"?window:globalThis);
;
/* assets/v79/unified-dictionary-v79.js */
(function(root){
  "use strict";
  if(root.__VDUCKIE_DICTIONARY_V79_LOADING__)return;
  root.__VDUCKIE_DICTIONARY_V79_LOADING__=true;
  var count=5,tasks=[];
  for(var i=1;i<=count;i++)(function(index){
    tasks.push(fetch("./assets/v79/unified-dictionary-v79.part"+index+".txt?v=79.1",{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error("Thiếu gói Từ điển v79 phần "+index);
      return response.text();
    }));
  })(i);
  Promise.all(tasks).then(function(parts){
    Function(parts.join(""))();
  }).catch(function(error){
    root.__VDUCKIE_DICTIONARY_V79_LOADING__=false;
    console.error("Không nạp được Từ điển chung v79:",error);
  });
})(typeof window!=="undefined"?window:globalThis);
;
