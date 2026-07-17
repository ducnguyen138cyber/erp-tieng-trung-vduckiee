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
