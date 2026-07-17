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
