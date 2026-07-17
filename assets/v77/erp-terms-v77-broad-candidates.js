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
