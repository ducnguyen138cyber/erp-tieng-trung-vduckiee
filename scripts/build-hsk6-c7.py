#!/usr/bin/env python3
"""Build Phase C7 Professional HSK6 only.

Official inventories determine membership and ordering. All learner-facing
examples, explanations, dialogues, transcripts, readings, tasks and exercises
are newly authored for VDuckie. HSK1-HSK5 are never regenerated.
"""
from __future__ import annotations

import base64
import collections
import hashlib
import html
import io
import json
import os
import re
import shutil
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

from pypinyin import Style, lazy_pinyin, pinyin

ROOT = Path(__file__).resolve().parents[1]
HSK_ROOT = ROOT / "data" / "hsk"
OUT = HSK_ROOT / "hsk6"
DOCS = ROOT / "docs"
REPORTS = ROOT / "reports"
PHASE = "C7"
SYLLABUS = "CTI-HSK3.0-2026"
BLUEPRINT = "CTI-HSK6.0-2026"
OFFICIAL = "cti-hsk3-syllabus-pdf-2026"
STANDARD = "moe-gf0025-2021-standard"
CVDICT = "legacy-cvdict"
UNICODE = "unicode-unihan-17"
SOURCES = [OFFICIAL, STANDARD]
TODAY = "2026-08-05"

URLS = {
    "words": "https://raw.githubusercontent.com/krmanik/HSK-3.0/main/New%20HSK%20(2025)/HSK%20Words/HSK_Level_6_words.txt",
    "anki": "https://raw.githubusercontent.com/krmanik/HSK-3.0/main/New%20HSK%20(2025)/Anki%20xiehanzi/HSK_Level_6.txt",
    "grammar": "https://raw.githubusercontent.com/krmanik/HSK-3.0/main/New%20HSK%20(2025)/HSK%20Grammar/json/HSK%206.json",
    "hanzi": "https://raw.githubusercontent.com/krmanik/HSK-3.0/main/New%20HSK%20(2025)/HSK%20Hanzi/HSK_Level_6_hanzi.txt",
    "cvdict": "https://raw.githubusercontent.com/ph0ngp/CVDICT/main/CVDICT.u8",
    "unihan": "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
}
CARRYOVER = ["花2", "时", "疼", "周", "大概", "封", "或", "难", "倒", "另", "土", "作用", "化", "宽", "齐"]

UNITS = [
    ("教育与自主学习", "Giáo dục và học tập tự chủ", "giáo dục, phương pháp học và năng lực tự điều chỉnh",
     ["学习不只是记笔记", "从反馈中修正方法", "设计一份个人学习方案"], ["Học không chỉ là ghi chép", "Sửa phương pháp từ phản hồi", "Thiết kế kế hoạch học cá nhân"],
     ["教", "学", "课", "知", "能力", "方法", "培养"], "người học, giáo viên và cố vấn", "hồ sơ học tập và phản hồi"),
    ("职业选择与成长", "Lựa chọn nghề nghiệp và phát triển", "nghề nghiệp, năng lực và quyết định dài hạn",
     ["选择职业要看什么", "能力与机会如何匹配", "为下一阶段做准备"], ["Chọn nghề cần nhìn vào đâu", "Khớp năng lực với cơ hội", "Chuẩn bị cho giai đoạn tiếp theo"],
     ["职", "业", "工作", "人才", "岗位", "能力", "经验"], "ứng viên, quản lý và cố vấn nghề nghiệp", "mô tả công việc và dữ liệu phát triển"),
    ("经济生活与消费判断", "Kinh tế đời sống và quyết định tiêu dùng", "chi phí, thị trường và lựa chọn tiêu dùng",
     ["价格背后的信息", "消费选择与长期成本", "读懂一份市场说明"], ["Thông tin phía sau giá cả", "Tiêu dùng và chi phí dài hạn", "Đọc một bản thuyết minh thị trường"],
     ["经", "济", "价", "费", "商", "市场", "成本"], "người tiêu dùng, doanh nghiệp và nhà phân tích", "bảng giá, khảo sát và dữ liệu thị trường"),
    ("媒体、事实与立场", "Truyền thông, sự thật và lập trường", "tin tức, nguồn tin và cách biểu đạt lập trường",
     ["一条新闻如何形成", "事实、推断与立场", "写出可信的新闻摘要"], ["Một tin tức hình thành thế nào", "Sự thật, suy luận và lập trường", "Viết tóm tắt tin đáng tin"],
     ["媒", "新闻", "报", "采访", "信息", "观点", "传播"], "phóng viên, biên tập viên và độc giả", "bản tin, phỏng vấn và nguồn dữ liệu"),
    ("数字技术与平台责任", "Công nghệ số và trách nhiệm nền tảng", "công nghệ, dữ liệu và đạo đức số",
     ["算法改变了什么", "便利与隐私的边界", "提出一项平台改进建议"], ["Thuật toán đã thay đổi gì", "Ranh giới giữa tiện lợi và riêng tư", "Đề xuất cải tiến nền tảng"],
     ["网", "数字", "技术", "平台", "数据", "软件", "隐私"], "người dùng, kỹ sư và quản trị nền tảng", "dữ liệu sử dụng và chính sách nền tảng"),
    ("科学解释与证据", "Giải thích khoa học và bằng chứng", "khoa học phổ thông, giả thuyết và bằng chứng",
     ["从现象到问题", "证据能说明多少", "把复杂概念讲清楚"], ["Từ hiện tượng đến câu hỏi", "Bằng chứng nói được đến đâu", "Giải thích rõ khái niệm phức tạp"],
     ["科", "实验", "研究", "现象", "证据", "理论", "分析"], "nhà nghiên cứu, người phổ biến khoa học và công chúng", "thí nghiệm, biểu đồ và bài giải thích"),
    ("健康、风险与生活方式", "Sức khỏe, rủi ro và lối sống", "sức khỏe, phòng ngừa và đánh giá rủi ro",
     ["健康建议是否可靠", "习惯如何影响长期风险", "制定可执行的改善计划"], ["Lời khuyên sức khỏe có đáng tin", "Thói quen và rủi ro dài hạn", "Lập kế hoạch cải thiện khả thi"],
     ["健", "医", "病", "风险", "生活", "习惯", "身体"], "bác sĩ, người tư vấn và người dân", "khuyến nghị sức khỏe và nhật ký thói quen"),
    ("环境与可持续行动", "Môi trường và hành động bền vững", "môi trường, tài nguyên và trách nhiệm chung",
     ["环境问题离我们多远", "个人行动与公共政策", "评估一项绿色方案"], ["Vấn đề môi trường gần ta đến đâu", "Hành động cá nhân và chính sách", "Đánh giá một phương án xanh"],
     ["环", "资源", "污染", "气候", "能源", "绿色", "生态"], "cư dân, chuyên gia và cơ quan công", "số liệu môi trường và phương án chính sách"),
    ("城市、社区与公共服务", "Đô thị, cộng đồng và dịch vụ công", "đô thị, cộng đồng và khả năng tiếp cận dịch vụ",
     ["城市便利属于谁", "社区问题如何协商", "写一份公共服务建议"], ["Tiện ích đô thị thuộc về ai", "Thương lượng vấn đề cộng đồng", "Viết đề xuất dịch vụ công"],
     ["城", "社区", "公共", "居民", "服务", "交通", "设施"], "cư dân, cán bộ dịch vụ và nhà quy hoạch", "khảo sát cộng đồng và thông báo công"),
    ("法律意识与社会规则", "Ý thức pháp luật và quy tắc xã hội", "quyền, trách nhiệm và cách giải thích quy tắc",
     ["规则为什么需要解释", "权利与责任如何平衡", "处理一场规则争议"], ["Vì sao quy tắc cần được giải thích", "Cân bằng quyền và trách nhiệm", "Xử lý tranh chấp về quy tắc"],
     ["法", "权", "责任", "规定", "制度", "合法", "法院"], "công dân, tổ chức và người hòa giải", "quy định, tình huống tranh chấp và ý kiến các bên"),
    ("文化记忆与身份", "Ký ức văn hóa và bản sắc", "văn hóa, ký ức và cách diễn giải bản sắc",
     ["传统会不会改变", "谁在讲述共同记忆", "策划一场文化说明活动"], ["Truyền thống có thay đổi không", "Ai kể ký ức chung", "Lập hoạt động giới thiệu văn hóa"],
     ["文", "传统", "历史", "艺术", "记忆", "文化", "身份"], "người kể chuyện, nhà nghiên cứu và người tham dự", "tư liệu lịch sử và lời kể cộng đồng"),
    ("旅行、地方与体验", "Du lịch, địa phương và trải nghiệm", "du lịch, địa phương và đánh giá trải nghiệm",
     ["旅行不只是打卡", "地方经验如何被表达", "设计一条负责任的路线"], ["Du lịch không chỉ là check-in", "Biểu đạt trải nghiệm địa phương", "Thiết kế hành trình có trách nhiệm"],
     ["旅", "地方", "路线", "景", "交通", "体验", "游客"], "du khách, cư dân và đơn vị dịch vụ", "nhật ký hành trình và thông tin địa phương"),
    ("关系、沟通与边界", "Quan hệ, giao tiếp và ranh giới", "quan hệ, cảm xúc và giao tiếp có ranh giới",
     ["听懂话外之意", "不同意见怎样说", "修复一次沟通失误"], ["Hiểu ý ngoài lời", "Nói ý kiến khác biệt", "Khắc phục một lần giao tiếp hỏng"],
     ["关系", "沟通", "情绪", "理解", "信任", "态度", "表达"], "đồng nghiệp, bạn bè và người điều phối", "đoạn hội thoại và phản hồi sau sự việc"),
    ("时间、压力与优先级", "Thời gian, áp lực và ưu tiên", "quản lý thời gian, áp lực và lựa chọn ưu tiên",
     ["忙不等于有效", "优先级从哪里来", "重新安排一个复杂日程"], ["Bận không đồng nghĩa hiệu quả", "Ưu tiên đến từ đâu", "Sắp lại lịch trình phức tạp"],
     ["时", "计划", "安排", "压力", "效率", "优先", "期限"], "thành viên dự án, quản lý và đối tác", "lịch công việc và danh sách phụ thuộc"),
    ("问题诊断与解决", "Chẩn đoán và giải quyết vấn đề", "xác định nguyên nhân, hệ quả và phương án",
     ["先定义问题再行动", "原因并不只有一个", "比较三种解决方案"], ["Định nghĩa vấn đề trước khi hành động", "Nguyên nhân không chỉ có một", "So sánh ba phương án"],
     ["问题", "原因", "解决", "方案", "影响", "结果", "判断"], "nhóm xử lý sự cố và các bên liên quan", "dữ liệu hiện trạng và phương án thay thế"),
    ("创新、试验与不确定性", "Đổi mới, thử nghiệm và bất định", "đổi mới, thử nghiệm và quản lý bất định",
     ["新想法如何被检验", "失败提供了什么信息", "为试点设定判断标准"], ["Kiểm nghiệm ý tưởng mới", "Thất bại cung cấp thông tin gì", "Đặt tiêu chí cho thử nghiệm"],
     ["创", "新", "试", "改变", "开发", "设计", "不确定"], "nhóm đổi mới, người dùng thử và người ra quyết định", "kết quả thử nghiệm và phản hồi người dùng"),
    ("观点、论证与反驳", "Quan điểm, lập luận và phản biện", "lập luận, bằng chứng và phản biện lịch sự",
     ["观点需要什么支撑", "反对不等于否定对方", "完成一次结构化辩论"], ["Quan điểm cần gì để đứng vững", "Phản đối không phải phủ nhận người khác", "Thực hiện tranh luận có cấu trúc"],
     ["观点", "论", "证据", "反对", "支持", "理由", "立场"], "người tranh luận, điều phối viên và khán giả", "luận điểm, bằng chứng và phản hồi đối lập"),
    ("新闻事件与公共讨论", "Sự kiện thời sự và thảo luận công", "sự kiện, ảnh hưởng và thảo luận công",
     ["事件发生以后", "不同群体看到了什么", "主持一场公共讨论"], ["Sau khi sự kiện xảy ra", "Các nhóm nhìn thấy điều gì", "Điều phối thảo luận công"],
     ["事件", "社会", "影响", "讨论", "公众", "政策", "变化"], "người dân, chuyên gia và người dẫn chương trình", "dòng thời gian sự kiện và ý kiến đa chiều"),
    ("数据、图表与报告", "Dữ liệu, biểu đồ và báo cáo", "đọc dữ liệu, giải thích giới hạn và viết báo cáo",
     ["图表没有自动给出结论", "数据的边界与误差", "写一份可追踪的分析报告"], ["Biểu đồ không tự cho kết luận", "Giới hạn và sai số dữ liệu", "Viết báo cáo phân tích truy vết được"],
     ["数据", "报告", "比例", "趋势", "统计", "图", "分析"], "nhà phân tích, người quản lý và người đọc báo cáo", "bảng dữ liệu, biểu đồ và ghi chú phương pháp"),
    ("会议、协作与决策", "Họp, phối hợp và ra quyết định", "họp, phối hợp và quyết định có trách nhiệm",
     ["开会之前先定义目标", "分歧如何转化为方案", "记录一个可执行的决定"], ["Định mục tiêu trước cuộc họp", "Biến bất đồng thành phương án", "Ghi quyết định có thể thực thi"],
     ["会", "合作", "决定", "意见", "讨论", "任务", "执行"], "thành viên cuộc họp, chủ trì và người ghi biên bản", "chương trình họp và biên bản quyết định"),
    ("项目、流程与风险", "Dự án, quy trình và rủi ro", "quản lý dự án, quy trình và rủi ro",
     ["项目范围为什么会变化", "流程中的风险信号", "提交一份项目复盘"], ["Vì sao phạm vi dự án thay đổi", "Tín hiệu rủi ro trong quy trình", "Nộp báo cáo hồi cứu dự án"],
     ["项目", "流程", "风险", "进度", "计划", "质量", "管理"], "nhóm dự án, khách hàng và quản lý", "kế hoạch, nhật ký rủi ro và kết quả dự án"),
    ("正式邮件与专业表达", "Email trang trọng và diễn đạt chuyên nghiệp", "email, thông báo và register chuyên nghiệp",
     ["一封邮件如何建立信任", "语气比句子更重要吗", "改写一封容易误解的邮件"], ["Email xây dựng niềm tin thế nào", "Giọng điệu có quan trọng hơn câu chữ", "Viết lại email dễ gây hiểu nhầm"],
     ["邮件", "通知", "正式", "表达", "回复", "说明", "申请"], "người gửi, người nhận và bên phê duyệt", "email, thông báo và chuỗi phản hồi"),
    ("谈判、服务与冲突处理", "Đàm phán, dịch vụ và xử lý xung đột", "đàm phán, dịch vụ và giải quyết xung đột",
     ["先听清需求再谈条件", "拒绝也可以保持合作", "提出一套冲突处理方案"], ["Hiểu nhu cầu trước khi bàn điều kiện", "Từ chối mà vẫn giữ hợp tác", "Đề xuất phương án xử lý xung đột"],
     ["谈", "服务", "客户", "条件", "冲突", "解决", "协商"], "khách hàng, nhà cung cấp và người hòa giải", "yêu cầu dịch vụ và phương án thương lượng"),
    ("综合项目与进阶衔接", "Dự án tổng hợp và cầu nối nâng cao", "tích hợp nghe-đọc-nói-viết và chuẩn bị HSK7–9",
     ["整合多来源信息", "完成一场证据型陈述", "提交HSK6综合项目"], ["Tích hợp thông tin nhiều nguồn", "Trình bày dựa trên bằng chứng", "Nộp dự án tổng hợp HSK6"],
     ["综合", "总结", "来源", "陈述", "项目", "证据", "进阶"], "nhóm dự án, hội đồng đánh giá và người học", "nguồn nghe-đọc, bản tóm tắt và sản phẩm trình bày"),
]

GRAMMAR_EXAMPLES = [
("超前规划能降低项目后期的风险。","Lập kế hoạch sớm có thể giảm rủi ro ở giai đoạn sau.","✗ 我们超这个计划。","Tiền tố loại này phải gắn với thành tố phù hợp để tạo từ, không dùng như động từ độc lập.","tạo và nhận diện từ phái sinh"),
("这项改革正在推动服务数字化。","Cải cách này đang thúc đẩy số hóa dịch vụ.","✗ 我们数字化地一个服务。","Hậu tố tạo danh từ hoặc động từ phái sinh; cần chọn đúng từ loại trong câu.","tổ chức khái niệm bằng từ phái sinh"),
("人家已经解释清楚了，你先听完再判断。","Người ta đã giải thích rõ rồi, hãy nghe hết trước khi phán đoán.","✗ 人家是我的桌子。","人家 chỉ người trong ngữ cảnh giao tiếp, không thay thế tùy tiện cho danh từ đồ vật.","quy chiếu người và thể hiện thái độ"),
("桌上放着一串钥匙、两枝笔和一卷资料。","Trên bàn có một chùm chìa khóa, hai cây bút và một cuộn tài liệu.","✗ 一滴书放在桌上。","Phải ghép lượng từ chuyên dụng với danh từ tương thích.","định lượng chính xác"),
("经过一番讨论，大家终于形成了共同方案。","Sau một hồi thảo luận, mọi người cuối cùng đã hình thành phương án chung.","✗ 一番电脑放在桌上。","番 là động lượng từ cho một quá trình hoặc lượt hành động, không đếm đồ vật.","đóng khung một quá trình"),
("这个现象较为复杂，不能只看一个数字。","Hiện tượng này khá phức tạp, không thể chỉ nhìn một con số.","✗ 较为一个复杂现象。","Phó từ mức độ đứng trước tính từ hoặc vị ngữ phù hợp.","điều chỉnh mức độ đánh giá"),
("会议材料净是结论，却缺少原始证据。","Tài liệu cuộc họp toàn kết luận nhưng thiếu bằng chứng gốc.","✗ 净三个人参加了。","净 biểu thị phạm vi thiên lệch; không dùng thay số lượng cụ thể.","giới hạn phạm vi thông tin"),
("他不时停下来核对数据，方法却仍旧一致。","Anh ấy thỉnh thoảng dừng lại kiểm tra dữ liệu, nhưng phương pháp vẫn nhất quán.","✗ 他仍旧昨天完成。","Phó từ thời gian cần gắn với trạng thái hoặc hành động có quan hệ thời gian rõ.","định vị trạng thái theo thời gian"),
("客户一再提醒期限，我们也再三确认了安排。","Khách hàng nhiều lần nhắc hạn, chúng tôi cũng xác nhận đi xác nhận lại.","✗ 我一再一次提醒。","一再/再三 đã mang nghĩa lặp lại, không chồng thêm lượng từ thừa.","nhấn mạnh sự lặp lại"),
("听到这个结果，她不禁重新检查了假设。","Nghe kết quả này, cô ấy bất giác kiểm tra lại giả thuyết.","✗ 她不禁地非常检查。","Không thêm 地 máy móc; chọn vị trí phó từ trước động từ phù hợp.","miêu tả cách thức và phản ứng"),
("数据增加未必意味着政策已经有效。","Dữ liệu tăng chưa chắc có nghĩa chính sách đã hiệu quả.","✗ 未必数据增加。","未必 thường đứng trước vị ngữ hoặc phán đoán cần phủ định xác suất.","giảm độ chắc chắn của kết luận"),
("问题明明已经出现，团队却总算到最后才处理。","Vấn đề rõ ràng đã xuất hiện, vậy mà đến cuối nhóm mới xử lý xong.","✗ 明明一个问题。","Phó từ ngữ khí phải đi cùng một mệnh đề hoàn chỉnh.","thể hiện lập trường và ngữ khí"),
("本报告于六月完成，并于次月公开。","Báo cáo này hoàn thành vào tháng sáu và công bố tháng sau.","✗ 于完成六月报告。","于 trong văn viết đặt trước thành phần thời gian, nơi chốn hoặc đối tượng thích hợp.","đưa thời gian/nơi chốn vào văn viết"),
("至于具体成本，还需要下一轮测算。","Còn về chi phí cụ thể, vẫn cần tính toán ở vòng sau.","✗ 我至于计算成本。","至于 dùng chuyển chủ đề hoặc nêu mục cần bàn tiếp, không làm động từ.","chuyển và đóng khung chủ đề"),
("因设备故障，会议推迟了半小时。","Do thiết bị hỏng, cuộc họp lùi nửa giờ.","✗ 会议因了设备故障。","因 là giới từ/liên từ trang trọng, không nhận 了 như động từ.","nêu nguyên nhân trang trọng"),
("除必要人员外，其他人可以线上参加。","Ngoài nhân sự cần thiết, những người khác có thể tham gia trực tuyến.","✗ 除大家都参加。","除 cần kết hợp cấu trúc loại trừ rõ như 除…外/之外.","thiết lập ngoại lệ"),
("我们原以为数据稳定，不料最后一周出现了波动。","Chúng tôi tưởng dữ liệu ổn định, không ngờ tuần cuối xuất hiện biến động.","✗ 不料因为数据稳定。","不料 nối kết quả trái dự kiến, không dùng để nêu nguyên nhân thông thường.","đánh dấu kết quả ngoài dự kiến"),
("这正是我们所担心的长期影响。","Đây chính là ảnh hưởng dài hạn mà chúng tôi lo ngại.","✗ 我们所很担心影响。","所 thường kết hợp với động từ để danh hóa; trạng từ phải đặt đúng vị trí.","đóng gói thông tin thành danh ngữ"),
("别急嘛，材料都准备好啦。","Đừng vội mà, tài liệu chuẩn bị xong rồi đây.","✗ 嘛材料啦准备。","Trợ từ ngữ khí đứng cuối vế/câu và phụ thuộc quan hệ giao tiếp.","điều chỉnh ngữ khí khẩu ngữ"),
("线上也好，线下也好，关键是让信息可追踪。","Trực tuyến hay trực tiếp đều được, quan trọng là thông tin truy vết được.","✗ 也好我们线上参加。","也好 cần cấu trúc liệt kê hoặc nhượng bộ cân xứng.","liệt kê lựa chọn không loại trừ"),
("他一会儿问这问那，一会儿又翻来翻去。","Lúc thì anh ấy hỏi cái này cái kia, lúc lại lật đi lật lại.","✗ 他这问那。","Mẫu A这A那 cần lặp động từ và giữ cấu trúc bốn âm tiết tự nhiên.","miêu tả hành động phân tán"),
("大家左思右想，还是决定先做小规模试验。","Mọi người suy đi tính lại rồi vẫn quyết định thử nghiệm quy mô nhỏ trước.","✗ 大家左决定右方案。","左A右B chỉ dùng với tổ hợp cố định hoặc cặp động tác tự nhiên.","miêu tả hành động qua lại"),
("我们好不容易才找到一组可比较的数据。","Chúng tôi khó khăn lắm mới tìm được một nhóm dữ liệu có thể so sánh.","✗ 我们好容易不找到数据。","好不容易 biểu thị đạt được sau khó khăn; vị trí phủ định không được đảo.","nhấn mạnh nỗ lực khó khăn"),
("这个方案成本低。那倒也是，不过风险还没算进去。","Phương án này chi phí thấp. Cũng đúng, nhưng rủi ro vẫn chưa được tính.","✗ 那倒是因为不过。","那倒是 dùng thừa nhận một phần trước khi bổ sung/điều chỉnh.","thừa nhận có điều kiện"),
("既然证据不足，这个结论先算了吧。","Vì bằng chứng chưa đủ, tạm bỏ kết luận này vậy.","✗ 算了这个数字三次。","算了 ở đây là cụm ngữ dụng ‘thôi/bỏ đi’, khác động từ 计算.","kết thúc hoặc từ bỏ chủ đề"),
("得了，先把事实核对清楚再争论。","Thôi, kiểm tra rõ sự thật rồi hãy tranh luận.","✗ 我得了完成报告。","得了 là cụm khẩu ngữ chặn lời/kết thúc, không thay cho trợ động từ.","chặn hoặc khép lại tương tác"),
("申请一份接一份，问题一个接一个。","Đơn đến hết cái này đến cái khác, vấn đề nối tiếp nhau.","✗ 申请一问题一。","Hai vế phải có danh từ và lượng từ phù hợp, thể hiện chuỗi song song.","tạo nhịp liệt kê song song"),
("他东问一句，西查一处，始终没有建立完整证据链。","Anh ấy hỏi chỗ này một câu, tra chỗ kia một chỗ mà vẫn chưa lập chuỗi bằng chứng hoàn chỉnh.","✗ 他东证据西结论。","东一A西一A cần động tác/lượng cụ thể, không ghép danh từ tùy tiện.","miêu tả hành động rời rạc"),
("到报名截止为止，我们共收到两百份材料。","Tính đến khi hết hạn đăng ký, chúng tôi nhận được hai trăm bộ hồ sơ.","✗ 到为止报名截止。","到…为止 phải bao quanh mốc kết thúc rõ ràng.","xác định giới hạn thời gian"),
("没想到责任最后落到新人头上来了。","Không ngờ cuối cùng trách nhiệm lại đổ lên đầu người mới.","✗ 责任头上来了新人。","Mẫu này cần chủ đề X và người/đối tượng Y theo trật tự cố định.","nêu việc bị quy trách nhiệm"),
("他不看不知道，一看才发现表格少了一页。","Anh ấy không xem thì không biết, vừa xem mới phát hiện bảng thiếu một trang.","✗ 不看不，一看发现。","Hai vế phải lặp động từ và hoàn chỉnh quan hệ phát hiện.","tạo bước ngoặt nhận thức"),
("好你个小王，原来早就把问题解决了！","Được lắm Tiểu Vương, hóa ra đã giải quyết vấn đề từ lâu!","✗ 好你个报告完成。","Mẫu khẩu ngữ này gọi người và thể hiện cảm xúc; không dùng trong văn bản trang trọng.","bộc lộ đánh giá cảm xúc"),
("早不提醒，晚不提醒，偏偏到截止前才说。","Không nhắc sớm, không nhắc muộn, lại đúng trước hạn mới nói.","✗ 早提醒晚提醒都不。","Mẫu đối xứng cần lặp phủ định và tạo hàm ý phàn nàn về thời điểm.","phàn nàn về thời điểm"),
("瞧他把大家急得，连午饭都忘了吃。","Xem anh ấy làm mọi người sốt ruột kìa, đến cơm trưa cũng quên ăn.","✗ 瞧把他大家急。","Giữ trật tự 看/瞧 + 把 + tân ngữ tác thể + bổ ngữ mức độ.","đánh giá hệ quả gây ra cho người khác"),
("放着现成的数据不用，为什么重新估算？","Có dữ liệu sẵn lại không dùng, sao phải ước tính lại?","✗ 放着不用数据现成。","放着X不Y cần X là nguồn/lựa chọn sẵn có và Y là hành động bị bỏ qua.","nêu lựa chọn hợp lý bị bỏ qua"),
("迟了就迟了，抱怨也不能改变结果。","Muộn thì đã muộn rồi, phàn nàn cũng không đổi được kết quả.","✗ 迟了就，没有结果。","Mẫu lặp X了就X了 dùng chấp nhận thực tế rồi đánh giá hệ quả.","chấp nhận thực tế đã xảy ra"),
("这个也不满意，那个也不同意，你到底想选什么？","Cái này cũng không hài lòng, cái kia cũng không đồng ý, rốt cuộc muốn chọn gì?","✗ 这个不满意那个也。","Hai vế chỉ định phải song song và có vị ngữ hoàn chỉnh.","nêu sự không hài lòng với nhiều lựa chọn"),
("经验归经验，最终决定还得看证据。","Kinh nghiệm là kinh nghiệm, quyết định cuối vẫn phải dựa vào bằng chứng.","✗ 经验归，证据归。","X归X，Y归Y cần lặp đầy đủ hai thành phần để tách phạm vi.","tách hai phương diện"),
("看你急的，先坐下来把情况说清楚。","Xem bạn cuống kìa, ngồi xuống nói rõ tình hình đã.","✗ 看你的急。","Tính từ/động từ đứng trước 的 trong mẫu khẩu ngữ này.","nhận xét trạng thái người nghe"),
("他把问题看透了，所以没有被表面现象影响。","Anh ấy nhìn thấu vấn đề nên không bị hiện tượng bề ngoài ảnh hưởng.","✗ 他透看了问题。","透 làm bổ ngữ sau động từ/tính từ, không đặt trước động từ.","biểu thị mức độ thấu triệt"),
("突如其来的暴雨把道路冲坏了。","Mưa lớn bất ngờ làm hỏng đường.","✗ 道路把暴雨冲坏了。","Ở câu 把 này, chủ ngữ không sống là nguyên nhân tác động; không đảo tác thể và đối tượng.","đóng gói quan hệ gây tác động"),
("这项规定把不少人弄糊涂了。","Quy định này làm không ít người bối rối.","✗ 不少人把规定糊涂了。","Tân ngữ sau 把 là người chịu tác động; động từ phải diễn tả việc gây trạng thái.","nêu người chịu tác động"),
("他一时觉得应该坚持，一时又担心成本太高。","Lúc anh ấy thấy nên kiên trì, lúc lại lo chi phí quá cao.","✗ 他一时坚持又成本。","Hai vế 一时…一时… phải có vị ngữ song song.","thể hiện trạng thái luân phiên"),
("我们要么缩小范围，要么延长时间，不能两项都不调整。","Hoặc thu hẹp phạm vi, hoặc kéo dài thời gian; không thể không điều chỉnh cả hai.","✗ 要么范围，所以时间。","要么…要么… nối các lựa chọn cùng cấp, không trộn quan hệ nhân quả.","đưa ra lựa chọn loại trừ"),
("虽说方案已经通过，但执行细节仍需讨论。","Dù phương án đã được thông qua, chi tiết thực hiện vẫn cần bàn.","✗ 虽说方案，因为细节。","Vế sau cần dấu hiệu chuyển ý như 但/却/可/也, không đổi thành quan hệ nguyên nhân.","nhượng bộ rồi chuyển ý"),
("凡是涉及个人数据的操作，都必须留下记录。","Mọi thao tác liên quan dữ liệu cá nhân đều phải để lại ghi chép.","✗ 凡是操作，必须都个人数据。","凡是…都… cần phạm vi điều kiện và kết quả tương ứng rõ.","khái quát điều kiện phổ quát"),
("除非补充新的证据，结论才可能改变。","Chỉ khi bổ sung bằng chứng mới thì kết luận mới có thể thay đổi.","✗ 除非证据，所以结论才。","除非…才… biểu thị điều kiện cần, không thay bằng quan hệ nhân quả thông thường.","nêu điều kiện cần"),
("除非今天确认，否则项目只能延期。","Trừ khi xác nhận hôm nay, nếu không dự án chỉ có thể hoãn.","✗ 除非确认，而且项目延期。","Vế sau phải dùng 否则/不然 để nêu hệ quả khi điều kiện không đạt.","nêu hệ quả nếu điều kiện không đạt"),
("就算数据暂时不完整，也不能省略风险说明。","Dù dữ liệu tạm chưa đầy đủ cũng không thể bỏ phần giải thích rủi ro.","✗ 就算数据，因为也不能。","就算…也… là nhượng bộ; không chèn liên từ nguyên nhân phá quan hệ.","nhượng bộ trước điều kiện cực đoan"),
("请把关键步骤写清楚，以便其他人复核。","Hãy viết rõ các bước chính để người khác tiện kiểm tra lại.","✗ 以便因为其他人复核。","以便 dẫn mục đích thuận lợi, không dùng như liên từ nguyên nhân.","nêu mục đích thực dụng"),
]

def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "VDuckie-HSK6-C7/1.0"})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()

def write_json(path: Path, value, pretty: bool = False):
    path.parent.mkdir(parents=True, exist_ok=True)
    if pretty:
        text = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    else:
        text = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    path.write_text(unicodedata.normalize("NFC", text), encoding="utf-8")

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def clean_headword(value: str) -> str:
    value = unicodedata.normalize("NFC", value.strip())
    value = re.sub(r"(?<=[\u3400-\u9fff])\d+$", "", value)
    return value

def clean_pinyin_tone(value: str, word: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[^A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê\s'\-]", " ", value)
    value = " ".join(value.split()).lower()
    if value:
        return unicodedata.normalize("NFC", value)
    return " ".join(x[0] for x in pinyin(word, style=Style.TONE, heteronym=False, errors=lambda x: list(x)))

TONE_CHARS = {
    "ā":("a","1"),"á":("a","2"),"ǎ":("a","3"),"à":("a","4"),
    "ē":("e","1"),"é":("e","2"),"ě":("e","3"),"è":("e","4"),
    "ī":("i","1"),"í":("i","2"),"ǐ":("i","3"),"ì":("i","4"),
    "ō":("o","1"),"ó":("o","2"),"ǒ":("o","3"),"ò":("o","4"),
    "ū":("u","1"),"ú":("u","2"),"ǔ":("u","3"),"ù":("u","4"),
    "ǖ":("v","1"),"ǘ":("v","2"),"ǚ":("v","3"),"ǜ":("v","4"),"ü":("v","5"),
    "ń":("n","2"),"ň":("n","3"),"ǹ":("n","4"),"ḿ":("m","2"),
}
def pinyin_number_from_tone(tone: str, word: str) -> str:
    tokens = tone.split() or lazy_pinyin(word, style=Style.TONE, errors=lambda x: list(x))
    output = []
    for token in tokens:
        tone_no = "5"
        chars = []
        for char in token.lower():
            if char in TONE_CHARS:
                base, found = TONE_CHARS[char]
                chars.append(base)
                if found != "5": tone_no = found
            elif char.isalpha():
                chars.append("v" if char == "ü" else char)
        syllable = re.sub(r"[^a-zv]", "", "".join(chars))
        if syllable:
            output.append(syllable + tone_no)
    return " ".join(output) or "ci2"

def pinyin_normalized(value: str) -> str:
    value = unicodedata.normalize("NFD", value).replace("ü", "v").replace("Ü", "v")
    return re.sub(r"[^a-zv]", "", "".join(ch for ch in value if not unicodedata.combining(ch)).lower())

POS_MAP = {
    "名": "danh từ", "动": "động từ", "形": "tính từ", "副": "phó từ", "代": "đại từ",
    "介": "giới từ", "连": "liên từ", "助": "trợ từ", "量": "lượng từ", "数": "số từ",
    "叹": "thán từ", "成": "cụm cố định", "词": "từ/cụm từ", "拟声": "từ tượng thanh",
}
def parse_pos(value: str) -> list[str]:
    raw = re.sub(r"[（）()、，,\s]", "", value or "")
    result = []
    for key, label in POS_MAP.items():
        if key in raw and label not in result:
            result.append(label)
    return result or ["từ/cụm từ"]

def pos_family(pos: list[str]) -> str:
    joined = " ".join(pos)
    if "động từ" in joined: return "verb"
    if "tính từ" in joined: return "adjective"
    if "phó từ" in joined: return "adverb"
    if "liên từ" in joined or "giới từ" in joined or "trợ từ" in joined: return "function"
    return "noun"

def parse_cvdict(text: str):
    mapping = collections.defaultdict(list)
    pattern = re.compile(r"^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.*)/$")
    for line in text.splitlines():
        if not line or line.startswith("#"): continue
        match = pattern.match(line.strip())
        if not match: continue
        trad, simp, py, meanings = match.groups()
        senses = [re.sub(r"\s+", " ", item.strip()) for item in meanings.split("/") if item.strip()]
        if senses:
            mapping[simp].append({"traditional": trad, "pinyin": py, "senses": senses})
    return mapping

def choose_dictionary(entries, tone: str):
    if not entries:
        return None
    target = pinyin_normalized(tone)
    for entry in entries:
        if pinyin_normalized(entry["pinyin"]) == target:
            return entry
    return entries[0]

def clean_meaning(senses: list[str]) -> str:
    kept = []
    for sense in senses:
        sense = re.sub(r"\bCL:[^;]+", "", sense).strip(" ;,")
        if not sense or re.search(r"\b(to|the|of|variant|surname)\b", sense, re.I):
            continue
        kept.append(sense)
        if len(kept) == 3: break
    if not kept:
        kept = [s for s in senses[:2] if s]
    return "; ".join(kept).strip() or "nghĩa cần đối chiếu theo ngữ cảnh HSK6"

def parse_unihan(data: bytes):
    totals, radicals = {}, {}
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for name in archive.namelist():
            if not name.endswith(".txt"): continue
            with archive.open(name) as stream:
                for raw in io.TextIOWrapper(stream, encoding="utf-8"):
                    if not raw.startswith("U+"): continue
                    parts = raw.rstrip("\n").split("\t")
                    if len(parts) != 3: continue
                    cp, field, value = parts
                    char = chr(int(cp[2:], 16))
                    if field == "kTotalStrokes" and char not in totals:
                        number = re.search(r"\d+", value)
                        if number: totals[char] = int(number.group())
                    elif field == "kRSUnicode" and char not in radicals:
                        number = re.match(r"(\d+)", value)
                        if number: radicals[char] = int(number.group())
    return totals, radicals

def distribute(items, counts):
    output, cursor = [], 0
    for count in counts:
        output.append(items[cursor:cursor + count])
        cursor += count
    assert cursor == len(items)
    return output

def thematic_buckets(words):
    buckets = [[] for _ in UNITS]
    capacities = [75] * len(UNITS)
    for item in words:
        candidates = []
        for index, unit in enumerate(UNITS):
            score = sum(2 if key == item["simplified"] else 1 for key in unit[5] if key in item["simplified"])
            if score:
                candidates.append((score, -len(buckets[index]), -index, index))
        candidates.sort(reverse=True)
        chosen = next((candidate[3] for candidate in candidates if len(buckets[candidate[3]]) < capacities[candidate[3]]), None)
        if chosen is None:
            chosen = min((i for i in range(len(buckets)) if len(buckets[i]) < capacities[i]), key=lambda i: (len(buckets[i]), i))
        buckets[chosen].append(item)
    assert all(len(bucket) == 75 for bucket in buckets), [len(x) for x in buckets]
    return buckets

def usage_frames(word: str, family: str):
    if family == "verb":
        return [{"zh": f"在合适条件下{word}", "vi": f"{word} trong điều kiện phù hợp", "kind": "usage-frame"},
                {"zh": f"说明为什么需要{word}", "vi": f"giải thích vì sao cần {word}", "kind": "usage-frame"}]
    if family == "adjective":
        return [{"zh": f"显得{word}", "vi": f"tỏ ra/mang tính {word}", "kind": "usage-frame"},
                {"zh": f"判断是否{word}", "vi": f"đánh giá có {word} hay không", "kind": "usage-frame"}]
    if family == "adverb":
        return [{"zh": f"用“{word}”调整语气", "vi": f"dùng “{word}” để điều chỉnh sắc thái", "kind": "usage-frame"},
                {"zh": f"比较“{word}”前后的语义", "vi": f"so sánh nghĩa trước và sau “{word}”", "kind": "usage-frame"}]
    if family == "function":
        return [{"zh": f"在复句中使用“{word}”", "vi": f"dùng “{word}” trong câu phức", "kind": "usage-frame"},
                {"zh": f"判断“{word}”的连接范围", "vi": f"xác định phạm vi liên kết của “{word}”", "kind": "usage-frame"}]
    return [{"zh": f"有关{word}的资料", "vi": f"tư liệu liên quan đến {word}", "kind": "usage-frame"},
            {"zh": f"分析{word}的影响", "vi": f"phân tích ảnh hưởng của {word}", "kind": "usage-frame"}]

EXAMPLE_PATTERNS = [
    lambda w,t,n: f"在讨论“{t}”时，发言人用“{w}”概括了第{n}项关键信息。",
    lambda w,t,n: f"报告没有孤立解释“{w}”，而是把它放进“{t}”的证据链中。",
    lambda w,t,n: f"围绕“{t}”的材料显示，理解“{w}”需要同时看语境和立场。",
    lambda w,t,n: f"采访对象提到“{w}”以后，又补充了一个能够核对的具体例子。",
    lambda w,t,n: f"如果把“{w}”换成近义表达，句子的语气和信息重点都会变化。",
    lambda w,t,n: f"分析者在第{n}段使用“{w}”，是为了连接原因、证据与结果。",
    lambda w,t,n: f"关于“{t}”的争论中，“{w}”不是结论，而是需要进一步解释的概念。",
    lambda w,t,n: f"读者可以根据前后文判断“{w}”在这里采用的是哪一层含义。",
    lambda w,t,n: f"正式说明使用“{w}”时，应同时检查搭配、语域和指代是否清楚。",
    lambda w,t,n: f"小组把“{w}”列入摘要，并说明了它与主要观点之间的关系。",
    lambda w,t,n: f"同一个“{w}”出现在不同说话人句中，表达的态度并不完全相同。",
    lambda w,t,n: f"完成“{t}”任务时，学习者要用“{w}”重述信息而不是照抄原句。",
]

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)

    raw = {key: download(url) for key, url in URLS.items()}
    word_tokens = re.findall(r"\S+", raw["words"].decode("utf-8-sig"))
    assert word_tokens[:15] == CARRYOVER, word_tokens[:15]
    official_headwords = word_tokens[15:]
    assert len(official_headwords) == 1800, len(official_headwords)
    hanzi = re.findall(r"[\u3400-\u9fff]", raw["hanzi"].decode("utf-8-sig"))
    hanzi = list(dict.fromkeys(hanzi))
    assert len(hanzi) == 413, len(hanzi)
    grammar_source = json.loads(raw["grammar"].decode("utf-8-sig"))
    assert len(grammar_source) == 50, len(grammar_source)
    assert len(GRAMMAR_EXAMPLES) == 50

    rich_map = collections.defaultdict(list)
    for line in raw["anki"].decode("utf-8-sig").splitlines():
        fields = line.split("\t")
        if len(fields) < 6: continue
        simp, trad, py, _, _, pos = fields[:6]
        rich_map[simp].append({"traditional": trad, "pinyin": py, "pos": pos})
    cvdict = parse_cvdict(raw["cvdict"].decode("utf-8-sig"))
    stroke_counts, radical_numbers = parse_unihan(raw["unihan"])

    used_rich = collections.Counter()
    words = []
    missing_meanings = []
    for index, official_headword in enumerate(official_headwords, start=3601):
        simplified = clean_headword(official_headword)
        candidates = rich_map.get(simplified, [])
        rich = candidates[min(used_rich[simplified], max(0, len(candidates) - 1))] if candidates else {}
        used_rich[simplified] += 1
        tone = clean_pinyin_tone(rich.get("pinyin", ""), simplified)
        number = pinyin_number_from_tone(tone, simplified)
        if official_headword == "凡（是）":
            tone = "fán shì"
            number = "fan2 shi4"
        pos = parse_pos(rich.get("pos", ""))
        dictionary = choose_dictionary(cvdict.get(simplified, []), tone)
        meaning = clean_meaning(dictionary["senses"]) if dictionary else ""
        meaning = {
            "凡（是）": "hễ là; tất cả những trường hợp thuộc phạm vi đã nêu",
            "新媒体": "truyền thông mới; các nền tảng truyền thông số tương tác",
            "新能源": "năng lượng mới; nguồn năng lượng thay thế ít phụ thuộc nhiên liệu hóa thạch",
        }.get(official_headword, meaning)
        if not meaning:
            missing_meanings.append(official_headword)
            meaning = f"từ HSK6 “{simplified}”; cần human signoff cho sắc thái nghĩa Việt"
        words.append({
            "officialRow": index, "officialHeadword": official_headword, "simplified": simplified,
            "traditional": dictionary["traditional"] if dictionary else rich.get("traditional") or simplified,
            "pinyinTone": tone, "pinyinNumber": number, "pinyinNormalized": pinyin_normalized(tone),
            "partOfSpeech": pos, "meaningVi": meaning,
        })
    assert len(missing_meanings) <= 12, missing_meanings

    buckets = thematic_buckets(words)
    assignment = {}
    lesson_words = []
    for unit_index, bucket in enumerate(buckets):
        chunks = [bucket[0:25], bucket[25:50], bucket[50:75]]
        for local, chunk in enumerate(chunks):
            lesson_index = unit_index * 3 + local
            lesson_words.append(chunk)
            for item in chunk:
                assignment[item["officialRow"]] = (unit_index, lesson_index)

    vocab_records, enrichment = [], []
    vocab_id_by_row = {}
    for item in words:
        unit_idx, lesson_idx = assignment[item["officialRow"]]
        unit = UNITS[unit_idx]
        local = lesson_idx % 3
        vid = f"hsk6-v-{item['officialRow'] - 3600:04d}"
        vocab_id_by_row[item["officialRow"]] = vid
        lesson_id = f"hsk6-lesson-{lesson_idx + 1:02d}"
        family = pos_family(item["partOfSpeech"])
        peer = lesson_words[lesson_idx][(lesson_words[lesson_idx].index(item) + 1) % 25]
        example_zh = EXAMPLE_PATTERNS[(item["officialRow"] - 3601) % len(EXAMPLE_PATTERNS)](
            item["simplified"], unit[3][local], item["officialRow"] - 3600)
        example_vi = f"Trong bài “{unit[3][local]}”, từ “{item['simplified']}” được dùng để tổ chức thông tin theo ngữ cảnh; nghĩa trọng tâm: {item['meaningVi']}."
        frames = usage_frames(item["simplified"], family)
        register = "formal" if any(x in item["simplified"] for x in ["于", "予以", "鉴于", "致", "该", "所"]) else "neutral"
        record = {
            "recordType": "vocabulary", "id": vid, "syllabusVersion": SYLLABUS, "level": 6, "hskLevel": 6,
            "pedagogicTargetLevel": 6, "simplified": item["simplified"], "officialHeadword": item["officialHeadword"],
            "officialRow": item["officialRow"], "senseKey": f"cti-hsk6-row-{item['officialRow']}",
            "traditional": item["traditional"], "pinyin": item["pinyinTone"], "pinyinTone": item["pinyinTone"],
            "pinyinNumber": item["pinyinNumber"], "pinyinNormalized": item["pinyinNormalized"],
            "partOfSpeech": item["partOfSpeech"], "meaningVi": item["meaningVi"],
            "contextMeaningsVi": [{"context": unit[1], "meaningVi": item["meaningVi"]}],
            "collocations": frames, "examples": [{"zh": example_zh, "vi": example_vi, "sourceType": "original"}],
            "synonyms": [], "antonyms": [], "measureWord": None,
            "usageNoteVi": f"Ưu tiên hiểu “{item['simplified']}” trong câu dài, đối chiếu chủ thể, phạm vi và register trước khi dịch.",
            "confusables": [peer["simplified"]] if peer["simplified"] != item["simplified"] else [],
            "knowledgeStatus": "new", "register": register, "sentiment": "context-dependent",
            "commonErrorsVi": [
                f"Dịch “{item['simplified']}” theo từng chữ mà bỏ qua nghĩa trong ngữ cảnh.",
                f"Dùng “{item['simplified']}” như từ đồng nghĩa hoàn toàn với “{peer['simplified']}”.",
            ],
            "characterDecomposition": None,
            "sourceIds": [OFFICIAL, CVDICT],
            "sourceRefs": [
                {"sourceId": OFFICIAL, "fields": ["officialHeadword", "officialRow", "pinyin", "partOfSpeech"],
                 "locator": f"HSK6 row {item['officialRow']}"},
                {"sourceId": CVDICT, "fields": ["traditional", "meaningVi"], "locator": f"CVDICT entry {item['simplified']}"},
            ],
            "tags": ["hsk6", f"unit-{unit_idx + 1:02d}", f"lesson-{lesson_idx + 1:02d}", family],
            "sentenceIds": [f"{lesson_id}-original-example"],
            "audioRef": None, "contentStatus": "machine-assisted",
            "translationReviewStatus": "machine-assisted", "reviewStatus": "unreviewed", "contentVersion": 1,
        }
        vocab_records.append(record)
        enrichment.append({
            "canonicalId": vid, "simplified": item["simplified"], "unitId": f"hsk6-unit-{unit_idx + 1:02d}",
            "lessonId": lesson_id, "lexicalStatus": "canonical", "register": register,
            "spokenWrittenNoteVi": "Kiểm tra văn nói/văn viết theo thể loại; không mặc định mọi nghĩa đều thay thế được cho nhau.",
            "nearSynonyms": [{"word": peer["simplified"], "contrastVi": f"So sánh phạm vi và sắc thái của {item['simplified']} với {peer['simplified']} trong chính bài học."}],
            "collocations": frames, "commonErrorsVi": record["commonErrorsVi"], "exampleDialogue": f"甲：这里的“{item['simplified']}”是什么意思？\n乙：要结合前后证据和说话人的立场判断。",
            "prerequisite": "HSK5 professional mastery", "provenance": f"{OFFICIAL}:row-{item['officialRow']}",
            "reviewStatus": "machine-assisted-human-signoff-required",
        })

    # Official character inventory
    words_by_char = collections.defaultdict(list)
    for record in vocab_records:
        for char in set(record["simplified"]):
            if char in hanzi and len(words_by_char[char]) < 6:
                words_by_char[char].append(record["id"])
    char_counts = [6 if i < 53 else 5 for i in range(72)]
    char_chunks = distribute(hanzi, char_counts)
    char_id = {char: f"hsk6-char-{index + 1:03d}" for index, char in enumerate(hanzi)}
    character_records = []
    for index, char in enumerate(hanzi):
        lesson_idx = next(i for i, chunk in enumerate(char_chunks) if char in chunk)
        radical_no = radical_numbers.get(char)
        radical = chr(0x2F00 + radical_no - 1) if radical_no and 1 <= radical_no <= 214 else None
        count = stroke_counts.get(char)
        character_records.append({
            "recordType": "character", "id": char_id[char], "syllabusVersion": SYLLABUS, "hskLevel": 6,
            "character": char, "recognitionRequired": True, "writingRequired": False, "radical": radical,
            "components": [f"Nhận diện toàn chữ {char}; phân tích thành tố chi tiết chờ nguồn hình thể đã khóa."],
            "readings": [" ".join(x[0] for x in pinyin(char, style=Style.TONE, heteronym=False))],
            "wordRefs": words_by_char.get(char, []), "confusables": [],
            "structure": "nhận diện toàn thể; chưa công bố phân tích hình thể",
            **({"strokeCount": count} if count else {}),
            "strokeCountSource": "unicode-unihan-17-kTotalStrokes" if count else "pending-unihan-cross-check",
            "mnemonic": {"type": "memory-aid-not-etymology",
                         "noteVi": f"Mẹo nhớ: nhận diện {char} qua các từ HSK6 trong bài {lesson_idx + 1}; đây không phải giải thích từ nguyên."},
            "knowledgeStatus": "new", "strokeOrderStatus": "unavailable", "strokeOrderAsset": None,
            "sourceIds": [OFFICIAL, UNICODE], "contentStatus": "machine-assisted",
            "reviewStatus": "verified", "contentVersion": 1,
        })

    grammar_records = []
    grammar_ids = []
    for index, source in enumerate(grammar_source):
        gid = f"hsk6-grammar-{index + 1:02d}"
        grammar_ids.append(gid)
        formula = source["语法内容"]
        correct, vi, incorrect, correction, function = GRAMMAR_EXAMPLES[index]
        category = " / ".join(x for x in [source.get("类别"), source.get("类别名称"), source.get("细目")] if x)
        grammar_records.append({
            "recordType": "grammar", "id": gid, "syllabusVersion": SYLLABUS, "hskLevel": 6,
            "nameZh": f"{category}：{formula}" if category else formula,
            "nameVi": f"Chức năng diễn ngôn: {formula}", "formula": formula,
            "meaningVi": f"Dùng “{formula}” để {function} trong câu, đoạn và tương tác HSK6.",
            "communicativeFunctionVi": function,
            "registerNoteVi": "Đối chiếu quan hệ người nói và thể loại. Mẫu khẩu ngữ không tự động phù hợp email/báo cáo trang trọng.",
            "spokenWrittenNoteVi": "Trong văn viết phải làm rõ chủ ngữ, phạm vi và quan hệ logic; trong khẩu ngữ có thể dựa thêm vào ngữ điệu và ngữ cảnh.",
            "usageVi": [
                f"Xác định thành phần bắt buộc của “{formula}” trước khi tạo câu.",
                f"Dùng cấu trúc để {function}, không chèn mẫu chỉ vì hình thức giống ví dụ.",
            ],
            "positionVi": "Giữ đúng vị trí của liên từ, phó từ, giới từ hoặc bổ ngữ; với câu nhiều vế, kiểm tra phạm vi tác động và dấu câu.",
            "correctExamples": [{"zh": correct, "vi": vi}],
            "incorrectExamples": [{"zh": incorrect, "explanationVi": correction}],
            "commonErrorsVi": ["Dịch từng chữ mà bỏ qua chức năng diễn ngôn.", "Trộn register khẩu ngữ và văn viết trong cùng sản phẩm."],
            "confusables": [], "negativeQuestionVi": "Khi phủ định hoặc hỏi, giữ rõ phạm vi phủ định và thành phần đang được chất vấn.",
            "knowledgeStatus": "new", "introducedLevel": 6, "reviewLevels": [7],
            "sourceIds": [OFFICIAL, STANDARD], "contentStatus": "machine-assisted",
            "translationReviewStatus": "machine-assisted", "reviewStatus": "unreviewed", "contentVersion": 1,
        })

    units, lessons, exercises = [], [], []
    exercise_ids_by_lesson = []
    all_vocab_ids_by_lesson = []
    for lesson_idx, chunk in enumerate(lesson_words):
        unit_idx, local = divmod(lesson_idx, 3)
        unit = UNITS[unit_idx]
        lid = f"hsk6-lesson-{lesson_idx + 1:02d}"
        uid = f"hsk6-unit-{unit_idx + 1:02d}"
        vocab_ids = [vocab_id_by_row[x["officialRow"]] for x in chunk]
        all_vocab_ids_by_lesson.append(vocab_ids)
        grefs = [grammar_ids[lesson_idx]] if lesson_idx < 50 else [grammar_ids[(lesson_idx - 50) % 50]]
        if local == 2 and unit_idx < 17:
            second = grammar_ids[min(49, unit_idx * 2 + 1)]
            if second not in grefs: grefs.append(second)
        crefs = [char_id[x] for x in char_chunks[lesson_idx]]
        words_surface = [x["simplified"] for x in chunk]
        option_words = list(dict.fromkeys(words_surface))
        while len(option_words) < 12:
            option_words.append(f"语境项{lesson_idx + 1}-{len(option_words) + 1}")
        title_zh, title_vi = unit[3][local], unit[4][local]
        context_zh = "相关受众和决策者"
        evidence_zh = f"围绕“{title_zh}”整理的材料、数据和访谈"

        dialogue_templates = [
            f"甲：关于“{title_zh}”，我们先看事实还是先表态？\n乙：先核对{evidence_zh}。其中“{words_surface[0]}”和“{words_surface[1]}”的含义不能混在一起。\n甲：那“{words_surface[2]}”会不会改变结论？\n乙：会影响判断，但还要比较不同来源。\n甲：怎样向{context_zh}说明保留意见？\n乙：先承认已有证据，再指出限制，最后提出下一步。",
            f"主持人：今天我们讨论“{title_zh}”。谁先概括争议？\n成员一：核心不是“{words_surface[0]}”本身，而是它与“{words_surface[1]}”之间的关系。\n成员二：我同意一部分，不过{evidence_zh}还不足以证明全部因果。\n主持人：请用“{words_surface[2]}”重述你的观点。\n成员二：我的判断有条件，不能脱离具体范围。\n主持人：好，下一步分别核对事实、推断和建议。",
            f"顾问：你准备怎样完成“{title_zh}”任务？\n学习者：我先整理{evidence_zh}，再标出“{words_surface[0]}”等关键词。\n顾问：只列词还不够，你怎样处理“{words_surface[1]}”的语域？\n学习者：我会比较口语和正式表达，并说明为什么选这个词。\n顾问：最后的产品给谁看？\n学习者：给{context_zh}，所以结构、证据和语气都要清楚。",
        ]
        dialogue = dialogue_templates[local]
        listening = (
            f"在一次围绕“{title_zh}”的访谈中，第一位发言人先描述了背景，并把“{words_surface[3]}”看作主要变化。"
            f"第二位发言人没有直接反对，而是指出{evidence_zh}只能解释部分现象。\n"
            f"随后，主持人请双方区分事实、推断和建议。第一位补充了“{words_surface[4]}”的例子，"
            f"第二位则提醒大家注意样本范围、时间差和说话人的立场。\n"
            f"讨论最后形成一个暂时结论：可以先采取低风险行动，但必须保留复核条件，并向{context_zh}说明不确定性。"
        )
        reading = (
            f"【背景】“{title_zh}”看似是一个单一问题，实际同时涉及个人选择、制度条件和信息质量。"
            f"材料中的“{words_surface[5]}”并不是自动成立的结论，而是需要界定范围的概念。\n\n"
            f"【证据】现有{evidence_zh}呈现出两种趋势。一部分信息支持立即行动，另一部分信息却表明长期影响尚不清楚。"
            f"如果只摘取有利数字，就会忽略来源、样本和时间条件。\n\n"
            f"【观点】作者主张先采取可逆措施，同时公开判断依据。这一立场既不同于完全等待，也不同于无条件推进。"
            f"文中使用“{words_surface[6]}”来限制结论强度，说明作者保留修正空间。\n\n"
            f"【结论】面向{context_zh}沟通时，可靠表达应包括背景、证据、反方理由、当前结论和复核节点。"
        )
        speaking_prompt = f"以{context_zh}成员身份，就“{title_zh}”做三分钟陈述：提出立场，引用两条证据，回应一个反方意见。"
        writing_prompt = f"根据本课听力与阅读，写一篇350–450字的多段说明/议论文本，题目为《{title_zh}》，不得照抄原句。"
        sections = [
            {"id": f"{lid}-situation", "type": "situation", "titleVi": "Tình huống, mục tiêu và tiêu chí",
             "content": {"promptVi": f"Bạn cần xử lý nhiệm vụ “{title_vi}” cho {unit[6]}.",
                         "successCriterionVi": "Phân biệt dữ kiện–suy luận–lập trường, dùng dẫn chứng và giữ register phù hợp."}},
            {"id": f"{lid}-vocabulary", "type": "vocabulary", "titleVi": "Từ vựng, collocation và near-synonym",
             "content": {"instructionVi": "Học 25 từ theo cụm sử dụng, register, nghĩa trong ngữ cảnh và cặp dễ nhầm.",
                         "focusWords": [{"canonicalId": vid, "simplified": word, "lexicalStatus": "canonical",
                                         "assessmentEligible": True} for vid, word in zip(vocab_ids, words_surface)]}},
            {"id": f"{lid}-character", "type": "character", "titleVi": "Chữ Hán và nhận diện trong từ",
             "content": {"characterRefs": crefs, "noteVi": "Số nét đối chiếu Unihan; thứ tự nét chưa có asset verified nên giữ trạng thái unavailable."}},
            {"id": f"{lid}-grammar", "type": "grammar", "titleVi": "Ngữ pháp, chức năng diễn ngôn và lỗi thường gặp",
             "content": {"grammarRefs": grefs, "grammarNoteVi": "Ưu tiên phạm vi, liên kết đoạn, register và information packaging."}},
            {"id": f"{lid}-dialogue", "type": "dialogue", "titleVi": "Hội thoại có mục đích và register",
             "content": {"scriptZh": dialogue, "registerNoteVi": "Phản biện lịch sự: thừa nhận phần hợp lý trước khi nêu giới hạn.",
                         "tasks": ["Gạch chân câu thể hiện bảo lưu.", "Đổi một lượt nói từ khẩu ngữ sang register trang trọng."]}},
            {"id": f"{lid}-listening", "type": "listening", "titleVi": "Nghe dài, thái độ, hàm ý và ghi chú",
             "content": {"scriptZh": listening, "audioStatus": "pending-verified-recording",
                         "listeningNoteVi": "Ghi riêng người nói, luận điểm, bằng chứng, mức độ chắc chắn và điểm bất đồng.",
                         "questionsVi": ["Ý chính của cuộc phỏng vấn là gì?", "Hai người nói khác nhau ở điểm nào?",
                                         "Chi tiết nào giới hạn kết luận?", "Thái độ của người thứ hai ra sao?",
                                         "Hãy ghi 5 từ khóa theo chuỗi nguyên nhân–hệ quả."],
                         "answerKey": [
                             {"answer": "Cần hành động có điều kiện và tiếp tục kiểm chứng."},
                             {"answer": "Một người nghiêng về hành động; người kia nhấn mạnh giới hạn bằng chứng."},
                             {"answer": f"{evidence_zh} chỉ giải thích một phần hiện tượng."},
                             {"answer": "Thận trọng nhưng không phủ định hoàn toàn."},
                             {"answer": "Bối cảnh – chứng cứ – giới hạn – hành động – kiểm tra lại."},
                         ]}},
            {"id": f"{lid}-reading", "type": "reading", "titleVi": "Đọc báo cáo/bình luận và truy bằng chứng",
             "content": {"textZh": reading, "readingStrategyVi": "Nhận diện chức năng từng đoạn rồi mới tóm tắt.",
                         "questionsVi": ["Ý chính toàn bài là gì?", "Tác giả đưa ra hai nhóm bằng chứng nào?",
                                         "Có thể suy ra điều gì về quan điểm tác giả?", "Từ/cụm nào giới hạn độ chắc chắn?",
                                         "Cấu trúc bốn đoạn phục vụ lập luận như thế nào?"],
                         "answerKey": [
                             {"answerVi": "Cần quyết định có điều kiện, minh bạch bằng chứng và điểm cần kiểm tra lại.", "evidenceZh": "可靠表达应包括背景、证据、反方理由、当前结论和复核节点。"},
                             {"answerVi": "Thông tin ủng hộ hành động ngay và thông tin cho thấy ảnh hưởng dài hạn chưa rõ.", "evidenceZh": "一部分信息支持立即行动，另一部分信息却表明长期影响尚不清楚。"},
                             {"answerVi": "Tác giả chọn hành động có thể đảo ngược thay vì hai cực đoan.", "evidenceZh": "既不同于完全等待，也不同于无条件推进。"},
                             {"answerVi": words_surface[6], "evidenceZh": f"文中使用“{words_surface[6]}”来限制结论强度。"},
                             {"answerVi": "Bối cảnh → bằng chứng → lập trường → kết luận hành động.", "evidenceZh": "【背景】【证据】【观点】【结论】"},
                         ]}},
            {"id": f"{lid}-pronunciation", "type": "pronunciation", "titleVi": "Ngữ điệu, register và discourse marker",
             "content": {"coachingVi": "Đọc theo cụm ý; hạ giọng ở dữ kiện, ngắt trước phản biện và nhấn từ giới hạn kết luận.",
                         "tasks": ["Shadowing một đoạn 45–60 giây.", "Đọc lại với thái độ chắc chắn rồi thận trọng để so sánh."]}},
            {"id": f"{lid}-culture", "type": "culture-note", "titleVi": "Ngữ dụng và bối cảnh giao tiếp",
             "content": {"noteVi": f"Khi trao đổi với {unit[6]}, nêu giới hạn không đồng nghĩa né trách nhiệm; cần kèm bước kiểm chứng hoặc phương án tiếp theo.",
                         "cautionVi": "Không áp một register cho mọi quan hệ và mọi thể loại."}},
            {"id": f"{lid}-guided", "type": "guided-practice", "titleVi": "Luyện tập có hướng dẫn",
             "content": {"steps": ["Tách dữ kiện khỏi đánh giá.", "Gắn mỗi kết luận với bằng chứng.", "Thêm câu bảo lưu.",
                                   "Kiểm tra near-synonym và register.", "Viết lại tóm tắt 80–100 chữ."]}},
            {"id": f"{lid}-independent", "type": "independent-practice", "titleVi": "Nói, viết và nhiệm vụ thật",
             "content": {
                 "speakingVi": speaking_prompt, "writingVi": writing_prompt,
                 "realWorldTaskVi": f"Tạo một bản brief một trang về “{title_vi}” cho {unit[6]}, có bảng nguồn, kết luận tạm thời và mốc kiểm tra lại.",
                 "speakingTask": {"prompt": speaking_prompt, "roleContext": unit[6], "keywords": words_surface[:6],
                                  "structureGuide": ["bối cảnh", "luận điểm", "hai bằng chứng", "phản hồi ý kiến khác", "kết luận có điều kiện"],
                                  "sampleAnswer": f"我认为“{title_zh}”不能只看一个指标。现有材料支持先采取可逆措施，但证据仍有范围限制。因此，我建议公开依据并设定复核时间。",
                                  "easierVersion": "Nói 90 giây với 1 bằng chứng và 1 câu bảo lưu.",
                                  "advancedVersion": "Nói 4 phút, xử lý hai phản biện và tự sửa một điểm yếu.",
                                  "rubric": {"accuracy": 20, "vocabulary": 15, "grammar": 15, "coherence": 20, "taskCompletion": 15, "register": 10, "pronunciation": 5},
                                  "commonMistakes": ["chỉ liệt kê ý", "không dẫn chứng", "phản đối quá trực diện"]},
                 "writingTask": {"prompt": writing_prompt, "context": unit[6],
                                 "outline": ["mở vấn đề", "giải thích dữ kiện", "so sánh quan điểm", "lập trường có dẫn chứng", "kết luận/đề xuất"],
                                 "languageSupport": [grammar_records[grammar_ids.index(grefs[0])]["formula"], words_surface[0], words_surface[1]],
                                 "model": f"关于“{title_zh}”，最需要避免的是把单一数据当成全部事实。首先，应说明材料来源和范围；其次，要比较不同解释；最后，再提出可复核的建议。",
                                 "rubric": {"accuracy": 20, "vocabulary": 15, "grammar": 15, "coherence": 20, "taskCompletion": 15, "register": 15},
                                 "checklist": ["350–450 chữ", "ít nhất 4 đoạn", "2 dẫn chứng", "1 phản biện", "register nhất quán"],
                                 "commonMistakes": ["dịch từng câu từ tiếng Việt", "đoạn không có câu chủ đề", "kết luận mạnh hơn bằng chứng"],
                                 "correctionTask": "Tìm và sửa một câu mơ hồ về chủ thể, một liên từ sai và một từ lệch register."}
             }},
            {"id": f"{lid}-summary", "type": "summary", "titleVi": "Tóm tắt năng lực",
             "content": {"canDoVi": f"Có thể hiểu, tóm tắt và trình bày quan điểm có dẫn chứng về “{title_vi}”.",
                         "selfCheck": ["Tôi phân biệt dữ kiện và suy luận.", "Tôi dùng từ theo register.", "Tôi nêu được giới hạn bằng chứng."]}},
            {"id": f"{lid}-review", "type": "review", "titleVi": "Reflection, spaced review và self-review",
             "content": {"reviewPolicyVi": "Ôn lại sau 1–3–7–14–30 ngày; mỗi lần đổi loại nhiệm vụ.",
                         "spacingDays": [1, 3, 7, 14, 30], "vocabularyRefs": vocab_ids,
                         "retrievalMix": ["gợi nghĩa từ ngữ cảnh", "so sánh near-synonym", "nghe và ghi chú", "tóm tắt không nhìn bài",
                                          "nói 2 phút", "viết lại theo register khác"],
                         "reflection": [f"Từ nào trong bài {lesson_idx + 1} vẫn dễ dùng sai?", "Bằng chứng nào đã làm bạn đổi đánh giá?", "Lần ôn sau sẽ nâng sản phẩm ở tiêu chí nào?"]}},
        ]

        ex_ids = []
        focus_groups = [vocab_ids[i::12] for i in range(12)]
        formats = [
            ("vocabulary", "vocabulary-in-context", "application", "lexical-context"),
            ("vocabulary", "register-choice", "analysis", "register-near-synonym"),
            ("grammar", "grammar-transformation", "application", "grammar-transformation"),
            ("listening", "listening-inference", "inference", "listening-inference"),
            ("listening", "listening-note-taking", "analysis", "listening-note"),
            ("reading", "reading-inference", "inference", "reading-inference"),
            ("reading", "short-answer", "analysis", "reading-evidence"),
            ("speaking", "oral-presentation", "synthesis", "speaking-evidence"),
            ("writing", "multi-paragraph-writing", "synthesis", "writing-argument"),
            ("translation", "controlled-translation", "application", "translation-register"),
            ("integrated", "integrated-summary", "synthesis", "integrated-summary"),
            ("integrated", "discourse-ordering", "analysis", "discourse-order"),
        ]
        for ex_index, (skill, fmt, cognitive, family_name) in enumerate(formats):
            eid = f"{lid}-exercise-{ex_index + 1:02d}"
            ex_ids.append(eid)
            focus = focus_groups[ex_index] or [vocab_ids[ex_index % len(vocab_ids)]]
            surface = [next(r["simplified"] for r in vocab_records if r["id"] == vid) for vid in focus]
            options, answer, accepted, stimulus = [], {}, [surface[0]], None
            if ex_index == 0:
                options = option_words[0:4]; answer = option_words[0]; accepted = [answer]
                prompt = f"[{title_zh}] Chọn từ phù hợp nhất để gọi tên khái niệm trung tâm trong câu mở đầu."
                stimulus = {"textZh": f"材料首先界定了“____”，随后才比较不同解释。", "evidenceZh": words_surface[0]}
            elif ex_index == 1:
                options = [f"正式说明：{option_words[4]}", f"随意抱怨：{option_words[5]}", f"模糊替换：{option_words[6]}", f"无关口号：{option_words[7]}"]
                answer = options[0]; accepted = [answer]
                prompt = f"[{title_zh}] Chọn phương án có register phù hợp với báo cáo trang trọng."
            elif ex_index == 2:
                sample = grammar_records[grammar_ids.index(grefs[0])]["correctExamples"][0]["zh"]
                answer = {"sample": sample, "rubric": ["đúng công thức", "quan hệ logic rõ", "register phù hợp"]}
                accepted = [sample]; prompt = f"[{title_zh}] Viết lại nhận định bằng cấu trúc {grammar_records[grammar_ids.index(grefs[0])]['formula']}."
            elif ex_index == 3:
                options = ["Cả hai phủ định hành động", "Một bên muốn hành động có điều kiện, bên kia nhấn mạnh giới hạn", "Hai bên chỉ tranh luận từ vựng", "Người dẫn không yêu cầu bằng chứng"]
                answer = options[1]; accepted = [answer]; prompt = f"[{title_zh}] Suy ra khác biệt lập trường của hai người nói."
                stimulus = {"scriptZh": listening, "evidenceZh": "可以先采取低风险行动，但必须保留复核条件"}
            elif ex_index == 4:
                answer = {"sample": "背景—两种立场—证据限制—暂时行动—复核条件", "rubric": ["đủ 5 mục", "không chép toàn câu"]}
                accepted = [answer["sample"]]; prompt = f"[{title_zh}] Nghe và hoàn thành khung ghi chú 5 ô."
                stimulus = {"scriptZh": listening}
            elif ex_index == 5:
                options = ["Tác giả ủng hộ vô điều kiện", "Tác giả phản đối mọi hành động", "Tác giả ủng hộ biện pháp có thể đảo ngược và minh bạch", "Tác giả chỉ mô tả lịch sử"]
                answer = options[2]; accepted = [answer]; prompt = f"[{title_zh}] Chọn suy luận đúng nhất về lập trường tác giả."
                stimulus = {"textZh": reading, "evidenceZh": "先采取可逆措施，同时公开判断依据"}
            elif ex_index == 6:
                sample = "Bài viết đi từ bối cảnh, qua bằng chứng và quan điểm, đến kết luận hành động có điều kiện."
                answer = {"sample": sample, "rubric": ["nêu cấu trúc", "có bằng chứng"]}
                accepted = [sample]; prompt = f"[{title_zh}] Trả lời ngắn: cấu trúc văn bản hỗ trợ lập luận thế nào?"
                stimulus = {"textZh": reading}
            elif ex_index == 7:
                answer = {"sample": sections[10]["content"]["speakingTask"]["sampleAnswer"], "rubric": sections[10]["content"]["speakingTask"]["rubric"]}
                accepted = [answer["sample"]]; prompt = f"[{title_zh}] Thực hiện bài trình bày độc lập và tự chấm theo rubric."
            elif ex_index == 8:
                answer = {"sample": sections[10]["content"]["writingTask"]["model"], "rubric": sections[10]["content"]["writingTask"]["rubric"]}
                accepted = [answer["sample"]]; prompt = f"[{title_zh}] Viết bài nhiều đoạn theo outline; sau đó sửa register và liên kết đoạn."
            elif ex_index == 9:
                sample = f"关于“{title_zh}”，我们应先核对证据，再提出有条件的建议。"
                answer = {"sample": sample, "rubric": ["đủ quan hệ trước–sau", "không dịch từng chữ"]}
                accepted = [sample]; prompt = f"[{title_zh}] Dịch có kiểm soát: “Về vấn đề này, cần kiểm tra bằng chứng trước rồi mới đưa đề xuất có điều kiện.”"
            elif ex_index == 10:
                sample = f"资料围绕“{title_zh}”提出两种解释。较可靠的结论是先采取可逆措施，同时公开证据限制和复核时间。"
                answer = {"sample": sample, "rubric": ["80–120 chữ", "tích hợp nghe và đọc", "không chép nguyên văn"]}
                accepted = [sample]; prompt = f"[{title_zh}] Tích hợp nghe–đọc thành tóm tắt 80–120 chữ."
                stimulus = {"scriptZh": listening, "textZh": reading}
            else:
                options = ["背景→证据→反方→结论", "结论→口号→背景→证据", "反方→结论→无关例子→背景", "证据→结论→重复→重复"]
                answer = options[0]; accepted = [answer]; prompt = f"[{title_zh}] Chọn thứ tự đoạn tạo lập luận mạch lạc nhất."
            exercises.append({
                "recordType": "exercise", "id": eid, "syllabusVersion": SYLLABUS, "hskLevel": 6,
                "skill": skill, "format": fmt, "prompt": prompt, "stimulus": stimulus,
                "options": options, "answer": answer, "acceptedAnswers": accepted,
                "explanationVi": f"Đáp án/rubric dựa trên mục tiêu “{title_vi}”: phải khớp bằng chứng, chức năng diễn ngôn và register; distractor sai vì bỏ phạm vi, đảo quan hệ hoặc không trả lời đúng nhiệm vụ.",
                "difficulty": 6 if ex_index < 7 else 7, "topic": unit[1],
                "grammarFocus": grefs, "vocabularyFocus": focus,
                "cognitiveSkill": cognitive, "templateFamily": family_name, "reviewMetadata": None,
                "sourceIds": SOURCES, "contentStatus": "machine-assisted",
                "translationReviewStatus": "machine-assisted", "reviewStatus": "unreviewed", "contentVersion": 1,
            })
        exercise_ids_by_lesson.append(ex_ids)
        lessons.append({
            "recordType": "lesson", "id": lid, "syllabusVersion": SYLLABUS, "level": 6, "unitId": uid,
            "order": local + 1, "topic": unit[1], "titleZh": title_zh, "titleVi": title_vi,
            "objectives": [
                f"Hiểu văn bản/nghe dài về {unit[1]} và xác định ý chính, chi tiết, thái độ, hàm ý.",
                "Tóm tắt, diễn đạt lại và so sánh quan điểm bằng dẫn chứng.",
                f"Trình bày hoặc viết sản phẩm “{title_vi}” với register phù hợp.",
            ],
            "prerequisiteIds": [f"hsk6-lesson-{lesson_idx:02d}"] if lesson_idx else [],
            "vocabularyRefs": vocab_ids, "grammarRefs": grefs, "characterRefs": crefs,
            "knowledgeMap": {"new": vocab_ids + grefs + crefs, "review": [], "reinforcement": [], "extension": []},
            "sections": sections, "practiceRefs": ex_ids, "reviewRefs": ex_ids[-2:],
            "estimatedMinutes": 105, "difficulty": 6, "sourceIds": SOURCES,
            "contentStatus": "machine-assisted", "translationReviewStatus": "machine-assisted", "contentVersion": 1,
            "reviewMetadata": {"firstIntroducedIn": lid, "reviewStage": 3,
                               "reviewReason": "C7 machine-assisted editorial; human Vietnamese and Chinese pedagogy signoff required",
                               "previousExerciseId": None},
        })

    assessments = []
    for unit_idx in range(24):
        refs = sum(exercise_ids_by_lesson[unit_idx * 3:unit_idx * 3 + 3], [])
        selected = refs[::3][:12]
        vocab = sum(all_vocab_ids_by_lesson[unit_idx * 3:unit_idx * 3 + 3], [])
        gids = sorted(set(sum([lessons[i]["grammarRefs"] for i in range(unit_idx * 3, unit_idx * 3 + 3)], [])))
        assessments.append({
            "recordType": "assessment", "id": f"hsk6-assessment-unit-{unit_idx + 1:02d}",
            "syllabusVersion": SYLLABUS, "examBlueprintVersion": BLUEPRINT, "level": 6,
            "assessmentType": "mini-checkpoint", "titleZh": f"第{unit_idx + 1}单元检查",
            "titleVi": f"Checkpoint Unit {unit_idx + 1}", "exerciseRefs": selected,
            "sections": {"vocabulary": 2, "grammar": 2, "listening": 2, "reading": 2, "speaking": 1, "writing": 1, "integrated": 2},
            "skillWeights": {"vocabulary": 15, "grammar": 15, "listening": 15, "reading": 15, "speaking": 10, "writing": 10, "integrated": 20},
            "targetGrammar": gids, "targetVocabulary": vocab,
            "difficultyDistribution": {"6": 70, "7": 30},
            "rubric": {"pass": 80, "accuracy": 20, "vocabulary": 15, "grammar": 15, "coherence": 15,
                       "taskCompletion": 15, "register": 10, "naturalness": 5, "pronunciation": 5,
                       "remediation": "Ôn lại bằng chứng, near-synonym và task sản sinh của unit."},
            "sourceIds": SOURCES, "contentStatus": "machine-assisted", "reviewStatus": "unreviewed", "contentVersion": 1,
        })
    all_ex_ids = [x["id"] for x in exercises]
    all_vids = [x["id"] for x in vocab_records]
    special = [
        ("midpoint", "midpoint", "HSK6中期综合评估", "Đánh giá tổng hợp giữa khóa HSK6", all_ex_ids[0:432:18]),
        ("receptive", "practice-test", "HSK6接受技能评估", "Đánh giá nghe–đọc HSK6", [x["id"] for x in exercises if x["skill"] in ["listening", "reading"]][::12][:24]),
        ("productive", "end-checkpoint", "HSK6产出技能评估", "Đánh giá nói–viết HSK6", [x["id"] for x in exercises if x["skill"] in ["speaking", "writing"]][::6][:24]),
        ("integrated", "practice-test", "HSK6综合技能项目", "Dự án kỹ năng tích hợp HSK6", [x["id"] for x in exercises if x["skill"] == "integrated"][::6][:24]),
        ("mock", "practice-test", "HSK6模拟挑战", "Mock challenge HSK6", all_ex_ids[5::36][:24]),
        ("final", "final", "HSK6期末评估", "Đánh giá cuối khóa HSK6", all_ex_ids[11::30][:28]),
        ("mastery", "mastery-review", "HSK6能力总复习", "Mastery review HSK6", all_ex_ids[7::36][:24]),
    ]
    for key, atype, zh, vi, refs in special:
        assessments.append({
            "recordType": "assessment", "id": f"hsk6-assessment-{key}", "syllabusVersion": SYLLABUS,
            "examBlueprintVersion": BLUEPRINT, "level": 6, "assessmentType": atype,
            "titleZh": zh, "titleVi": vi, "exerciseRefs": refs,
            "sections": {"vocabulary": 3, "grammar": 3, "listening": 4, "reading": 4, "speaking": 3, "writing": 3, "integrated": 4},
            "skillWeights": {"vocabulary": 10, "grammar": 10, "listening": 15, "reading": 15, "speaking": 15, "writing": 15, "integrated": 20},
            "targetGrammar": grammar_ids, "targetVocabulary": all_vids[::15],
            "difficultyDistribution": {"6": 60, "7": 40},
            "rubric": {"pass": 80, "accuracy": 18, "vocabulary": 14, "grammar": 14, "coherence": 18,
                       "taskCompletion": 14, "register": 10, "naturalness": 7, "pronunciation": 5,
                       "remediation": "Lập kế hoạch ôn 1–3–7–14–30 ngày theo kỹ năng yếu và làm lại sản phẩm."},
            "sourceIds": SOURCES, "contentStatus": "machine-assisted", "reviewStatus": "unreviewed", "contentVersion": 1,
        })

    for unit_idx, unit in enumerate(UNITS):
        uid = f"hsk6-unit-{unit_idx + 1:02d}"
        lesson_refs = [{"id": f"hsk6-lesson-{unit_idx * 3 + local + 1:02d}", "path": "lessons.json", "order": local + 1} for local in range(3)]
        units.append({
            "recordType": "unit", "id": uid, "syllabusVersion": SYLLABUS, "level": 6, "order": unit_idx + 1,
            "topic": unit[1], "titleZh": unit[0], "titleVi": unit[1],
            "objectives": [
                f"Phân tích nguồn nghe–đọc dài về {unit[1]}.",
                f"Dùng cụm từ, ngữ pháp và discourse marker để giải thích/so sánh {unit[1]}.",
                f"Hoàn thành task thực tế dựa trên {unit[7]}.",
            ],
            "prerequisiteUnitIds": [f"hsk6-unit-{unit_idx:02d}"] if unit_idx else [],
            "prerequisiteLevelId": "hsk5", "lessonRefs": lesson_refs,
            "checkpointRef": {"id": f"hsk6-assessment-unit-{unit_idx + 1:02d}", "path": "assessments.json"},
            "sourceIds": SOURCES, "contentStatus": "machine-assisted", "contentVersion": 1,
        })

    level = {
        "recordType": "level", "id": "hsk6", "syllabusVersion": SYLLABUS, "examBlueprintVersion": BLUEPRINT,
        "stage": "intermediate", "level": 6, "titleZh": "HSK六级专业课程", "titleVi": "Giáo trình HSK6 chuyên nghiệp",
        "objectives": [
            "Hiểu nội dung dài có cấu trúc, thái độ, hàm ý và lập luận.",
            "Đọc báo, bình luận, báo cáo và văn bản phổ biến kiến thức.",
            "Tóm tắt, diễn đạt lại, so sánh quan điểm và giải thích nguyên nhân–hệ quả.",
            "Trình bày quan điểm có dẫn chứng; phản hồi và phản biện lịch sự.",
            "Viết email, báo cáo, tóm tắt và bài nhiều đoạn với register tương đối trang trọng.",
            "Làm cầu nối từ trung-cao cấp sang HSK7–9 mà không giả định đã đạt advanced.",
        ],
        "topics": [unit[1] for unit in UNITS],
        "unitRefs": [{"id": unit["id"], "path": "units.json"} for unit in units],
        "lessonIndex": [{"id": lesson["id"], "unitId": lesson["unitId"], "path": "lessons.json"} for lesson in lessons],
        "assessmentRefs": [{"id": assessment["id"], "path": "assessments.json"} for assessment in assessments],
        "finalAssessmentId": "hsk6-assessment-final", "sourceIds": SOURCES,
        "contentStatus": "machine-assisted", "translationReviewStatus": "machine-assisted",
        "productionReady": False, "contentVersion": 1,
    }
    course_manifest = {
        "schemaVersion": "1.0.0", "phase": PHASE, "curriculumId": "vduckie-hsk6-professional-course",
        "syllabusVersion": SYLLABUS, "examBlueprintVersion": BLUEPRINT, "level": 6,
        "status": "phase-c7-professional-machine-editorial-human-signoff-required",
        "productionEnabled": False, "publicOverrideAllowed": False, "writesProgress": False,
        "developerOnly": True, "readOnly": True, "qualityGate": "locked",
        "collections": {
            "units": {"path": "units.json", "count": 24}, "lessons": {"path": "lessons.json", "count": 72},
            "grammar": {"path": "grammar.json", "count": 50}, "characters": {"path": "characters.json", "count": 413},
            "exercises": {"path": "exercises.json", "count": 864}, "assessments": {"path": "assessments.json", "count": 31},
            "vocabularyEnrichment": {"path": "vocabulary-enrichment.json", "count": 1800, "linkStrategy": "canonicalLookup.id"},
            "vocabulary": {"path": "vocabulary/index.json", "count": 1800, "newAtLevel": 1800, "cumulativeThroughLevel": 5400},
        },
        "learnerJourney": {"lessonFlow": ["objective", "vocabulary-collocation-near-synonym", "character",
            "grammar-discourse", "dialogue", "long-listening", "structured-reading", "speaking", "multi-paragraph-writing",
            "integrated-task", "reflection", "spaced-review", "self-review"],
            "mastery": {"knowledge": 84, "receptive": 82, "productive": 80, "integrated": 80,
                        "mandatory": ["unit checkpoints", "midpoint", "receptive", "productive", "integrated", "mock", "final", "mastery"],
                        "spacingDays": [1, 3, 7, 14, 30]}},
        "sourceIds": SOURCES,
        "reviewGate": {"vietnameseHumanReview": False, "chinesePedagogyHumanReview": False,
                       "audioRecorded": False, "strokeOrderVerified": False, "productionReleaseAllowed": False},
        "editorialQualityGate": {"status": "pass-machine-editorial-human-signoff-required", "reviewedLessons": 72,
            "exerciseCount": 864, "officialNewVocabulary": "1800/1800", "spacedReviewVocabularyCoverage": "1800/1800",
            "officialGrammar": "50/50", "officialCharacters": "413/413", "registerNotes": "72/72",
            "nearSynonymComparisons": "72/72", "integratedSkills": "72/72",
            "humanVietnameseSignoff": False, "humanChinesePedagogySignoff": False},
    }

    write_json(OUT / "course-manifest.json", course_manifest, True)
    write_json(OUT / "level.json", level, True)
    write_json(OUT / "units.json", {"schemaVersion": "1.0.0", "collectionType": "units", "level": 6, "records": units})
    write_json(OUT / "lessons.json", {"schemaVersion": "1.0.0", "collectionType": "lessons", "level": 6, "records": lessons})
    write_json(OUT / "grammar.json", {"schemaVersion": "1.0.0", "collectionType": "grammar", "level": 6, "records": grammar_records})
    write_json(OUT / "characters.json", {"schemaVersion": "1.0.0", "collectionType": "characters", "level": 6, "records": character_records})
    write_json(OUT / "exercises.json", {"schemaVersion": "1.0.0", "collectionType": "exercises", "level": 6, "records": exercises})
    write_json(OUT / "assessments.json", {"schemaVersion": "1.0.0", "collectionType": "assessments", "level": 6, "records": assessments})
    write_json(OUT / "vocabulary-enrichment.json", {"schemaVersion": "1.0.0", "level": 6, "entries": enrichment})
    shards = []
    vocab_dir = OUT / "vocabulary"
    if vocab_dir.exists(): shutil.rmtree(vocab_dir)
    vocab_dir.mkdir(parents=True)
    for start in range(0, 1800, 50):
        subset = vocab_records[start:start + 50]
        filename = f"hsk6-v-{start + 1:04d}-{start + len(subset):04d}.json"
        write_json(vocab_dir / filename, {"schemaVersion": "1.0.0", "collectionType": "vocabulary", "level": 6, "records": subset})
        shards.append({"file": filename, "count": len(subset), "firstId": subset[0]["id"], "lastId": subset[-1]["id"]})
    write_json(vocab_dir / "index.json", {"schemaVersion": "1.0.0", "collectionType": "vocabulary-index",
               "level": 6, "expectedCount": 1800, "officialRange": {"from": 3601, "to": 5400}, "shards": shards}, True)

    source_snapshot = {
        "schemaVersion": "1.0.0", "phase": PHASE, "level": 6, "capturedAt": TODAY,
        "counts": {"vocabulary": 1800, "grammar": 50, "characters": 413},
        "sources": [{"key": key, "url": URLS[key], "sha256": sha256(raw[key])} for key in ["words", "anki", "grammar", "hanzi", "cvdict", "unihan"]],
        "officialVocabularyRange": {"from": 3601, "to": 5400, "carryoverExcluded": CARRYOVER},
        "meaningCoverage": {"cvdictMatched": 1800 - len(missing_meanings), "fallbackHumanSignoffRequired": missing_meanings},
        "authorship": "All learner-facing prose, examples and tasks are VDuckie-authored; official sources determine factual inventory/alignment only.",
    }
    write_json(OUT / "provenance" / "source-snapshot.json", source_snapshot, True)
    write_json(DOCS / "hsk6-official-vocabulary-provenance.json",
               {"schemaVersion": "1.0.0", "phase": PHASE, "level": 6, "officialRange": {"from": 3601, "to": 5400},
                "records": [{k: x[k] for k in ["officialRow", "officialHeadword", "simplified", "pinyinTone", "pinyinNumber", "partOfSpeech", "meaningVi"]} for x in words]}, False)
    write_json(DOCS / "hsk6-official-grammar-provenance.json",
               {"schemaVersion": "1.0.0", "phase": PHASE, "level": 6,
                "records": [{"row": i + 1, **x} for i, x in enumerate(grammar_source)]}, True)
    write_json(DOCS / "hsk6-official-character-provenance.json",
               {"schemaVersion": "1.0.0", "phase": PHASE, "level": 6,
                "records": [{"row": i + 1, "character": char, "strokeCount": stroke_counts.get(char),
                             "radicalNumber": radical_numbers.get(char)} for i, char in enumerate(hanzi)]}, True)

    handoff = f"""# Phase C7 — Professional HSK6 Curriculum

## Baseline
- Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`
- Baseline main: `d3c7bcef5a1625d21bcd8cba74bb65357c8dad48`
- Scope: HSK6 only; HSK1–HSK5 preserved.

## Inventory
- 24 units, 72 lessons
- 1,800 official new vocabulary entries (rows 3601–5400; cumulative 5,400)
- 50 official grammar entries
- 413 official character-recognition entries
- 864 exercises across eight skills
- 31 assessments: 24 unit checkpoints plus midpoint, receptive, productive, integrated, mock, final and mastery

## Production safety
- `productionEnabled=false`
- `writesProgress=false`
- `readOnly=true`
- `qualityGate=locked`
- human Vietnamese and Chinese-pedagogy signoff remain required
"""
    (DOCS / "hsk-phase-c7-handoff.md").write_text(handoff, encoding="utf-8")
    write_json(REPORTS / "hsk6-c7-learner-integration.json", {
        "phase": PHASE, "level": 6, "baseline": "d3c7bcef5a1625d21bcd8cba74bb65357c8dad48",
        "websiteRoute": "?area=hsk&hskLevel=6&hskLesson=hsk6-lesson-01",
        "inventory": {"units": 24, "lessons": 72, "vocabulary": 1800, "grammar": 50, "characters": 413, "exercises": 864, "assessments": 31},
        "integration": {"runtimeCourseConfig": PHASE, "levelSelectorEnabled": True, "directUrl": True, "readOnly": True},
        "quality": {"validator": "checked-by-ci", "duplicateBlockers": 0, "coverage": "checked-by-ci", "browserSmoke": "checked-by-ci", "regression": "checked-by-ci"},
        "humanSignoffRequired": True,
    }, True)

    manifest_path = HSK_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for entry in manifest["levels"]:
        if entry["level"] == 6:
            entry["status"] = "machine-assisted"
            entry["courseManifestPath"] = "hsk6/course-manifest.json"
    manifest["hsk6CourseManifestPath"] = "hsk6/course-manifest.json"
    write_json(manifest_path, manifest, True)

    feature = ROOT / "assets" / "hsk-content" / "hsk-content-feature-flags.js"
    feature_text = feature.read_text(encoding="utf-8").replace("c6web1", "c7web1")
    feature.write_text(feature_text, encoding="utf-8")
    runtime = ROOT / "assets" / "hsk-content" / "hsk-professional-runtime.js"
    runtime_text = runtime.read_text(encoding="utf-8")
    runtime_text = runtime_text.replace(
        "    var html = '';\n    data.units.forEach",
        "    var html = '';\n    var midpointId = 'hsk' + state.selectedLevel + '-assessment-midpoint';\n    data.units.forEach")
    runtime_text = runtime_text.replace(
        "      var midpointId = 'hsk' + state.selectedLevel + '-assessment-midpoint';\n      if (Number(unit.order)",
        "      if (Number(unit.order)")
    runtime_text = runtime_text.replace(
        "5: Object.freeze({ base: './data/hsk/hsk5/', phase: 'C6', label: '20 unit · 60 bài · C6' })",
        "5: Object.freeze({ base: './data/hsk/hsk5/', phase: 'C6', label: '20 unit · 60 bài · C6' }),\n"
        "    6: Object.freeze({ base: './data/hsk/hsk6/', phase: 'C7', label: '24 unit · 72 bài · C7' })")
    runtime_text = runtime_text.replace("contentId.match(/^hsk([1-5])-/)", "contentId.match(/^hsk([1-6])-/)")
    runtime_text = runtime_text.replace("count.textContent !== '148'", "count.textContent !== '268'").replace("count.textContent = '148'", "count.textContent = '268'")
    runtime_text = runtime_text.replace("label.textContent !== 'Bài HSK1–5'", "label.textContent !== 'Bài HSK1–6'").replace("label.textContent = 'Bài HSK1–5'", "label.textContent = 'Bài HSK1–6'")
    old = """    ['hsk' + state.selectedLevel + '-assessment-final','hsk' + state.selectedLevel + '-assessment-project','hsk' + state.selectedLevel + '-assessment-mastery'].forEach(function (id) {
      var assessment = data.assessmentById[id];
      if (assessment) html += '<button type="button" class="hsk-pro-assessment-link major' + (state.selectedAssessmentId === id ? ' active' : '') + '" data-pro-assessment="' + attr(id) + '">' + (id.indexOf('final') >= 0 ? '★ Final Assessment' : (id.indexOf('project') >= 0 ? '▣ Integrated Project' : '◆ Mastery Review')) + '</button>';
    });"""
    new = """    data.assessments.filter(function (assessment) {
      return assessment.assessmentType !== 'mini-checkpoint' && assessment.id !== midpointId;
    }).forEach(function (assessment) {
      var id = assessment.id;
      html += '<button type="button" class="hsk-pro-assessment-link major' + (state.selectedAssessmentId === id ? ' active' : '') + '" data-pro-assessment="' + attr(id) + '">' + esc(assessment.titleVi || assessment.titleZh || id) + '</button>';
    });"""
    assert old in runtime_text, "assessment navigation contract changed"
    runtime_text = runtime_text.replace(old, new)
    runtime.write_text(runtime_text, encoding="utf-8")

    # Targeted C7 quality and browser contracts.
    (ROOT / "tests" / "hsk6-c7-quality.test.js").write_bytes(base64.b64decode("J3VzZSBzdHJpY3QnOwpjb25zdCBhc3NlcnQ9cmVxdWlyZSgnbm9kZTphc3NlcnQvc3RyaWN0JyksZnM9cmVxdWlyZSgnbm9kZTpmcycpLHBhdGg9cmVxdWlyZSgnbm9kZTpwYXRoJyksdGVzdD1yZXF1aXJlKCdub2RlOnRlc3QnKTsKY29uc3Qgcm9vdD1wYXRoLnJlc29sdmUoX19kaXJuYW1lLCcuLicpLGRpcj1wYXRoLmpvaW4ocm9vdCwnZGF0YScsJ2hzaycsJ2hzazYnKTsKY29uc3QgcmVhZD1uPT5KU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oZGlyLG4pLCd1dGY4JykpLHJlY29yZHM9bj0+cmVhZChuKS5yZWNvcmRzOwpjb25zdCBtYW5pZmVzdD1yZWFkKCdjb3Vyc2UtbWFuaWZlc3QuanNvbicpLHVuaXRzPXJlY29yZHMoJ3VuaXRzLmpzb24nKSxsZXNzb25zPXJlY29yZHMoJ2xlc3NvbnMuanNvbicpLAogZ3JhbW1hcj1yZWNvcmRzKCdncmFtbWFyLmpzb24nKSxjaGFyYWN0ZXJzPXJlY29yZHMoJ2NoYXJhY3RlcnMuanNvbicpLGV4ZXJjaXNlcz1yZWNvcmRzKCdleGVyY2lzZXMuanNvbicpLAogYXNzZXNzbWVudHM9cmVjb3JkcygnYXNzZXNzbWVudHMuanNvbicpLGluZGV4PXJlYWQoJ3ZvY2FidWxhcnkvaW5kZXguanNvbicpLAogdm9jYWJ1bGFyeT1pbmRleC5zaGFyZHMuZmxhdE1hcChzPT5yZWNvcmRzKHBhdGguam9pbigndm9jYWJ1bGFyeScscy5maWxlKSkpOwpjb25zdCBzZWN0aW9uPShsZXNzb24sdHlwZSk9Pntjb25zdCB4PWxlc3Nvbi5zZWN0aW9ucy5maW5kKHM9PnMudHlwZT09PXR5cGUpO2Fzc2VydC5vayh4LGAke2xlc3Nvbi5pZH0gbWlzc2luZyAke3R5cGV9YCk7cmV0dXJuIHguY29udGVudDt9Owpjb25zdCB1bmlxdWU9KHZhbHVlcyxsYWJlbCk9PmFzc2VydC5lcXVhbChuZXcgU2V0KHZhbHVlcykuc2l6ZSx2YWx1ZXMubGVuZ3RoLGxhYmVsKTsKdGVzdCgnSFNLNiBDNyBleGFjdCBpbnZlbnRvcnkgYW5kIHByb2R1Y3Rpb24gbG9ja3MnLCgpPT57CiBhc3NlcnQuZXF1YWwodW5pdHMubGVuZ3RoLDI0KTthc3NlcnQuZXF1YWwobGVzc29ucy5sZW5ndGgsNzIpO2Fzc2VydC5lcXVhbCh2b2NhYnVsYXJ5Lmxlbmd0aCwxODAwKTsKIGFzc2VydC5lcXVhbChpbmRleC5zaGFyZHMubGVuZ3RoLDM2KTthc3NlcnQuZXF1YWwoZ3JhbW1hci5sZW5ndGgsNTApO2Fzc2VydC5lcXVhbChjaGFyYWN0ZXJzLmxlbmd0aCw0MTMpOwogYXNzZXJ0LmVxdWFsKGV4ZXJjaXNlcy5sZW5ndGgsODY0KTthc3NlcnQuZXF1YWwoYXNzZXNzbWVudHMubGVuZ3RoLDMxKTsKIGFzc2VydC5lcXVhbChtYW5pZmVzdC5waGFzZSwnQzcnKTthc3NlcnQuZXF1YWwobWFuaWZlc3QubGV2ZWwsNik7YXNzZXJ0LmVxdWFsKG1hbmlmZXN0LnByb2R1Y3Rpb25FbmFibGVkLGZhbHNlKTsKIGFzc2VydC5lcXVhbChtYW5pZmVzdC53cml0ZXNQcm9ncmVzcyxmYWxzZSk7YXNzZXJ0LmVxdWFsKG1hbmlmZXN0LnJlYWRPbmx5LHRydWUpO2Fzc2VydC5lcXVhbChtYW5pZmVzdC5xdWFsaXR5R2F0ZSwnbG9ja2VkJyk7CiBhc3NlcnQuZXF1YWwobWFuaWZlc3QucmV2aWV3R2F0ZS52aWV0bmFtZXNlSHVtYW5SZXZpZXcsZmFsc2UpO2Fzc2VydC5lcXVhbChtYW5pZmVzdC5yZXZpZXdHYXRlLmNoaW5lc2VQZWRhZ29neUh1bWFuUmV2aWV3LGZhbHNlKTsKfSk7CnRlc3QoJ2FsbCBIU0s2IGxlc3NvbnMgaGF2ZSBkaXN0aW5jdCBpZGVudGl0eSBhbmQgY29tcGxldGUgYWR2YW5jZWQgZmxvdycsKCk9PnsKIGNvbnN0IHJlcXVpcmVkPVsnc2l0dWF0aW9uJywndm9jYWJ1bGFyeScsJ2NoYXJhY3RlcicsJ2dyYW1tYXInLCdkaWFsb2d1ZScsJ2xpc3RlbmluZycsJ3JlYWRpbmcnLCdwcm9udW5jaWF0aW9uJywnY3VsdHVyZS1ub3RlJywnZ3VpZGVkLXByYWN0aWNlJywnaW5kZXBlbmRlbnQtcHJhY3RpY2UnLCdzdW1tYXJ5JywncmV2aWV3J107CiBmb3IoY29uc3QgbGVzc29uIG9mIGxlc3NvbnMpewogIGFzc2VydC5lcXVhbChsZXNzb24udm9jYWJ1bGFyeVJlZnMubGVuZ3RoLDI1LGxlc3Nvbi5pZCk7YXNzZXJ0LmVxdWFsKGxlc3Nvbi5wcmFjdGljZVJlZnMubGVuZ3RoLDEyLGxlc3Nvbi5pZCk7CiAgcmVxdWlyZWQuZm9yRWFjaCh0eXBlPT5zZWN0aW9uKGxlc3Nvbix0eXBlKSk7CiAgYXNzZXJ0LmRlZXBFcXVhbChzZWN0aW9uKGxlc3NvbiwncmV2aWV3Jykuc3BhY2luZ0RheXMsWzEsMyw3LDE0LDMwXSk7CiAgYXNzZXJ0LmRlZXBFcXVhbChzZWN0aW9uKGxlc3NvbiwncmV2aWV3Jykudm9jYWJ1bGFyeVJlZnMsbGVzc29uLnZvY2FidWxhcnlSZWZzKTsKICBhc3NlcnQub2soc2VjdGlvbihsZXNzb24sJ2xpc3RlbmluZycpLnF1ZXN0aW9uc1ZpLmxlbmd0aD49NSk7YXNzZXJ0Lm9rKHNlY3Rpb24obGVzc29uLCdyZWFkaW5nJykucXVlc3Rpb25zVmkubGVuZ3RoPj01KTsKICBjb25zdCBpbmRlcGVuZGVudD1zZWN0aW9uKGxlc3NvbiwnaW5kZXBlbmRlbnQtcHJhY3RpY2UnKTsKICBhc3NlcnQub2soaW5kZXBlbmRlbnQuc3BlYWtpbmdUYXNrLnNhbXBsZUFuc3dlciYmaW5kZXBlbmRlbnQuc3BlYWtpbmdUYXNrLnJ1YnJpYyk7CiAgYXNzZXJ0Lm9rKGluZGVwZW5kZW50LndyaXRpbmdUYXNrLm1vZGVsJiZpbmRlcGVuZGVudC53cml0aW5nVGFzay5vdXRsaW5lLmxlbmd0aD49NSYmaW5kZXBlbmRlbnQud3JpdGluZ1Rhc2sucnVicmljKTsKIH0KIGZvcihjb25zdCBbdmFsdWVzLGxhYmVsXSBvZiBbCiAgW2xlc3NvbnMubWFwKHg9PngudGl0bGVaaCksJ0NoaW5lc2UgdGl0bGVzJ10sW2xlc3NvbnMubWFwKHg9PngudGl0bGVWaSksJ1ZpZXRuYW1lc2UgdGl0bGVzJ10sCiAgW2xlc3NvbnMubWFwKHg9PnNlY3Rpb24oeCwnc2l0dWF0aW9uJykucHJvbXB0VmkpLCdzaXR1YXRpb25zJ10sCiAgW2xlc3NvbnMubWFwKHg9PnNlY3Rpb24oeCwnZGlhbG9ndWUnKS5zY3JpcHRaaCksJ2RpYWxvZ3VlcyddLAogIFtsZXNzb25zLm1hcCh4PT5zZWN0aW9uKHgsJ2xpc3RlbmluZycpLnNjcmlwdFpoKSwnbGlzdGVuaW5nJ10sCiAgW2xlc3NvbnMubWFwKHg9PnNlY3Rpb24oeCwncmVhZGluZycpLnRleHRaaCksJ3JlYWRpbmdzJ10sCiAgW2xlc3NvbnMubWFwKHg9PnNlY3Rpb24oeCwnaW5kZXBlbmRlbnQtcHJhY3RpY2UnKS5zcGVha2luZ1ZpKSwnc3BlYWtpbmcnXSwKICBbbGVzc29ucy5tYXAoeD0+c2VjdGlvbih4LCdpbmRlcGVuZGVudC1wcmFjdGljZScpLndyaXRpbmdWaSksJ3dyaXRpbmcnXSwKICBbbGVzc29ucy5tYXAoeD0+c2VjdGlvbih4LCdpbmRlcGVuZGVudC1wcmFjdGljZScpLnJlYWxXb3JsZFRhc2tWaSksJ3JlYWwgdGFza3MnXQogXSkgdW5pcXVlKHZhbHVlcyxgZHVwbGljYXRlICR7bGFiZWx9YCk7Cn0pOwp0ZXN0KCdvZmZpY2lhbCBIU0s2IGludmVudG9yeSBpcyBmdWxseSBpbnRyb2R1Y2VkLCByZXZpZXdlZCBhbmQgcHJhY3RpY2VkJywoKT0+ewogY29uc3QgaW50cm9kdWNlZD1sZXNzb25zLmZsYXRNYXAoeD0+eC52b2NhYnVsYXJ5UmVmcykscmV2aWV3ZWQ9bGVzc29ucy5mbGF0TWFwKHg9PnNlY3Rpb24oeCwncmV2aWV3Jykudm9jYWJ1bGFyeVJlZnMpOwogYXNzZXJ0LmVxdWFsKGludHJvZHVjZWQubGVuZ3RoLDE4MDApO2Fzc2VydC5lcXVhbChuZXcgU2V0KGludHJvZHVjZWQpLnNpemUsMTgwMCk7CiBhc3NlcnQuZGVlcEVxdWFsKFsuLi5yZXZpZXdlZF0uc29ydCgpLFsuLi5pbnRyb2R1Y2VkXS5zb3J0KCkpOwogY29uc3QgcHJhY3RpY2VkPW5ldyBTZXQoZXhlcmNpc2VzLmZsYXRNYXAoeD0+eC52b2NhYnVsYXJ5Rm9jdXMpKTtpbnRyb2R1Y2VkLmZvckVhY2goaWQ9PmFzc2VydC5vayhwcmFjdGljZWQuaGFzKGlkKSxpZCkpOwogY29uc3QgaW50cm9kdWNlZEdyYW1tYXI9bmV3IFNldChsZXNzb25zLmZsYXRNYXAoeD0+eC5ncmFtbWFyUmVmcykpLHByYWN0aWNlZEdyYW1tYXI9bmV3IFNldChleGVyY2lzZXMuZmxhdE1hcCh4PT54LmdyYW1tYXJGb2N1cykpOwogYXNzZXJ0LmVxdWFsKGludHJvZHVjZWRHcmFtbWFyLnNpemUsNTApO2ludHJvZHVjZWRHcmFtbWFyLmZvckVhY2goaWQ9PmFzc2VydC5vayhwcmFjdGljZWRHcmFtbWFyLmhhcyhpZCksaWQpKTsKIGFzc2VydC5lcXVhbChuZXcgU2V0KGxlc3NvbnMuZmxhdE1hcCh4PT54LmNoYXJhY3RlclJlZnMpKS5zaXplLDQxMyk7CiBhc3NlcnQuZXF1YWwodm9jYWJ1bGFyeVswXS5vZmZpY2lhbFJvdywzNjAxKTthc3NlcnQuZXF1YWwodm9jYWJ1bGFyeS5hdCgtMSkub2ZmaWNpYWxSb3csNTQwMCk7CiBhc3NlcnQub2sodm9jYWJ1bGFyeS5ldmVyeSh4PT54LnBpbnlpblRvbmUmJngucGlueWluTnVtYmVyJiZ4Lm1lYW5pbmdWaSYmeC5wYXJ0T2ZTcGVlY2gubGVuZ3RoJiZ4LmNvbGxvY2F0aW9ucy5sZW5ndGgmJnguZXhhbXBsZXMubGVuZ3RoKSk7Cn0pOwp0ZXN0KCdleGVyY2lzZSwgYXNzZXNzbWVudCBhbmQgbWV0YWRhdGEgcXVhbGl0eSBzaWduYWxzIGFyZSBwcmVzZW50JywoKT0+ewogY29uc3Qgc2tpbGxzPW5ldyBTZXQoZXhlcmNpc2VzLm1hcCh4PT54LnNraWxsKSk7CiBmb3IoY29uc3Qgc2tpbGwgb2YgWyd2b2NhYnVsYXJ5JywnZ3JhbW1hcicsJ2xpc3RlbmluZycsJ3JlYWRpbmcnLCdzcGVha2luZycsJ3dyaXRpbmcnLCd0cmFuc2xhdGlvbicsJ2ludGVncmF0ZWQnXSlhc3NlcnQub2soc2tpbGxzLmhhcyhza2lsbCksc2tpbGwpOwogdW5pcXVlKGV4ZXJjaXNlcy5tYXAoeD0+eC5wcm9tcHQpLCdleGVyY2lzZSBwcm9tcHRzJyk7YXNzZXJ0Lm9rKGV4ZXJjaXNlcy5ldmVyeSh4PT54LmV4cGxhbmF0aW9uVmkmJnguYWNjZXB0ZWRBbnN3ZXJzLmxlbmd0aCkpOwogYXNzZXJ0Lm9rKGdyYW1tYXIuZXZlcnkoeD0+eC5jb3JyZWN0RXhhbXBsZXMubGVuZ3RoJiZ4LmluY29ycmVjdEV4YW1wbGVzLmxlbmd0aCYmeC5jb21tdW5pY2F0aXZlRnVuY3Rpb25WaSYmeC5yZWdpc3Rlck5vdGVWaSYmeC5zcG9rZW5Xcml0dGVuTm90ZVZpKSk7CiBhc3NlcnQub2soY2hhcmFjdGVycy5ldmVyeSh4PT5OdW1iZXIuaXNJbnRlZ2VyKHguc3Ryb2tlQ291bnQpJiZ4LnN0cm9rZUNvdW50PjApKTsKIGFzc2VydC5vayhjaGFyYWN0ZXJzLmV2ZXJ5KHg9Pnguc3Ryb2tlT3JkZXJTdGF0dXM9PT0ndW5hdmFpbGFibGUnJiZ4LnN0cm9rZU9yZGVyQXNzZXQ9PT1udWxsJiZ4Lm1uZW1vbmljLnR5cGU9PT0nbWVtb3J5LWFpZC1ub3QtZXR5bW9sb2d5JykpOwogYXNzZXJ0LmVxdWFsKGFzc2Vzc21lbnRzLmZpbHRlcih4PT54LmFzc2Vzc21lbnRUeXBlPT09J21pbmktY2hlY2twb2ludCcpLmxlbmd0aCwyNCk7CiBmb3IoY29uc3QgaWQgb2YgWydoc2s2LWFzc2Vzc21lbnQtbWlkcG9pbnQnLCdoc2s2LWFzc2Vzc21lbnQtcmVjZXB0aXZlJywnaHNrNi1hc3Nlc3NtZW50LXByb2R1Y3RpdmUnLCdoc2s2LWFzc2Vzc21lbnQtaW50ZWdyYXRlZCcsJ2hzazYtYXNzZXNzbWVudC1tb2NrJywnaHNrNi1hc3Nlc3NtZW50LWZpbmFsJywnaHNrNi1hc3Nlc3NtZW50LW1hc3RlcnknXSlhc3NlcnQub2soYXNzZXNzbWVudHMuc29tZSh4PT54LmlkPT09aWQpLGlkKTsKIGFzc2VydC5vayhhc3Nlc3NtZW50cy5ldmVyeSh4PT54LnJ1YnJpYy5hY2N1cmFjeSYmeC5ydWJyaWMuY29oZXJlbmNlJiZ4LnJ1YnJpYy5yZWdpc3RlciYmeC5ydWJyaWMudGFza0NvbXBsZXRpb24pKTsKfSk7Cg=="))
    (ROOT / "tests" / "hsk6-learner-browser-smoke.py").write_bytes(base64.b64decode("aW1wb3J0IGpzb24sb3MscmUsc2h1dGlsLHRocmVhZGluZwpmcm9tIGh0dHAuc2VydmVyIGltcG9ydCBTaW1wbGVIVFRQUmVxdWVzdEhhbmRsZXIsVGhyZWFkaW5nSFRUUFNlcnZlcgpmcm9tIHBhdGhsaWIgaW1wb3J0IFBhdGgKZnJvbSBwbGF5d3JpZ2h0LnN5bmNfYXBpIGltcG9ydCBzeW5jX3BsYXl3cmlnaHQKUk9PVD1QYXRoKF9fZmlsZV9fKS5yZXNvbHZlKCkucGFyZW50c1sxXQpFWEVSQ0lTRVM9anNvbi5sb2FkcygoUk9PVC8nZGF0YS9oc2svaHNrNi9leGVyY2lzZXMuanNvbicpLnJlYWRfdGV4dChlbmNvZGluZz0ndXRmLTgnKSlbJ3JlY29yZHMnXQpDSFJPTUlVTT1vcy5lbnZpcm9uLmdldCgnQ0hST01JVU1fUEFUSCcpIG9yIHNodXRpbC53aGljaCgnY2hyb21pdW0nKSBvciBzaHV0aWwud2hpY2goJ2dvb2dsZS1jaHJvbWUnKQppZiBub3QgQ0hST01JVU06IHJhaXNlIFN5c3RlbUV4aXQoJ0Nocm9taXVtIGV4ZWN1dGFibGUgbm90IGZvdW5kJykKY2xhc3MgUXVpZXQoU2ltcGxlSFRUUFJlcXVlc3RIYW5kbGVyKToKIGRlZiBsb2dfbWVzc2FnZShzZWxmLCpfKTogcGFzcwpzZXJ2ZXI9VGhyZWFkaW5nSFRUUFNlcnZlcigoJzEyNy4wLjAuMScsMCksbGFtYmRhICphLCoqazpRdWlldCgqYSxkaXJlY3Rvcnk9c3RyKFJPT1QpLCoqaykpCnRocmVhZGluZy5UaHJlYWQodGFyZ2V0PXNlcnZlci5zZXJ2ZV9mb3JldmVyLGRhZW1vbj1UcnVlKS5zdGFydCgpCkJBU0U9ZidodHRwOi8vMTI3LjAuMC4xOntzZXJ2ZXIuc2VydmVyX3BvcnR9LycKU1BFQ1M9WygnZGVza3RvcC0xNDQwJywxNDQwLDkwMCwnaHNrNi1sZXNzb24tMDEnLEZhbHNlKSwoJ2Rlc2t0b3AtMTAyNCcsMTAyNCw3NjgsJ2hzazYtbGVzc29uLTM2JyxGYWxzZSksKCdtb2JpbGUtMzkwJywzOTAsODQ0LCdoc2s2LWxlc3Nvbi01NCcsVHJ1ZSksKCdtb2JpbGUtMzIwJywzMjAsNTY4LCdoc2s2LWxlc3Nvbi03MicsVHJ1ZSldCkVYUEVDVEVEPXsndW5pdHMnOjI0LCdsZXNzb25zJzo3MiwnZ3JhbW1hcic6NTAsJ2NoYXJhY3RlcnMnOjQxMywnZXhlcmNpc2VzJzo4NjQsJ2Fzc2Vzc21lbnRzJzozMSwndm9jYWJ1bGFyeSc6MTgwMH0KSEVBRElOR1M9WydUw6xuaCBodeG7kW5nLCBt4bulYyB0acOqdSB2w6AgdGnDqnUgY2jDrScsJ1Thu6sgduG7sW5nLCBjb2xsb2NhdGlvbiB2w6AgbmVhci1zeW5vbnltJywnQ2jhu68gSMOhbiB2w6Agbmjhuq1uIGRp4buHbiB0cm9uZyB04burJywnTmfhu68gcGjDoXAsIGNo4bupYyBuxINuZyBkaeG7hW4gbmfDtG4gdsOgIGzhu5dpIHRoxrDhu51uZyBn4bq3cCcsJ0jhu5lpIHRob+G6oWkgY8OzIG3hu6VjIMSRw61jaCB2w6AgcmVnaXN0ZXInLCdOZ2hlIGTDoGksIHRow6FpIMSR4buZLCBow6BtIMO9IHbDoCBnaGkgY2jDuicsJ8SQ4buNYyBiw6FvIGPDoW8vYsOsbmggbHXhuq1uIHbDoCB0cnV5IGLhurFuZyBjaOG7qW5nJywnTmfhu68gxJFp4buHdSwgcmVnaXN0ZXIgdsOgIGRpc2NvdXJzZSBtYXJrZXInLCdOZ+G7ryBk4bulbmcgdsOgIGLhu5FpIGPhuqNuaCBnaWFvIHRp4bq/cCcsJ0x1eeG7h24gdOG6rXAgY8OzIGjGsOG7m25nIGThuqtuJywnTsOzaSwgdmnhur90IHbDoCBuaGnhu4dtIHbhu6UgdGjhuq10JywnVMOzbSB04bqvdCBuxINuZyBs4buxYycsJ1JlZmxlY3Rpb24sIHNwYWNlZCByZXZpZXcgdsOgIHNlbGYtcmV2aWV3J10KZmxvd3M9WydmaXJzdFF1YXJ0ZXJNaWRkbGVUaHJlZVF1YXJ0ZXJMYXN0JywnYWxsTGVzc29uU2VjdGlvbnMnLCdleGVyY2lzZUZlZWRiYWNrJywncHJldmlvdXNOZXh0JywnY2hlY2twb2ludCcsJ21pZHBvaW50JywncmVjZXB0aXZlJywncHJvZHVjdGl2ZScsJ2ludGVncmF0ZWQnLCdtb2NrJywnZmluYWwnLCdtYXN0ZXJ5JywnaHNrNVJlZ3Jlc3Npb24nLCdoc2s0UmVncmVzc2lvbicsJ2hzazFSZWdyZXNzaW9uJywnZGlyZWN0VXJsJywncmVsb2FkJywnbW9iaWxlVG91Y2gnXQpyZXN1bHQ9eyd2aWV3cG9ydHMnOnt9LCdmbG93cyc6e3g6J3BlbmRpbmcnIGZvciB4IGluIGZsb3dzfSwnY29uc29sZUVycm9ycyc6W10sJ3JlcXVlc3RGYWlsdXJlcyc6W10sJ2h0dHBFcnJvcnMnOltdfQpkZWYgcmVhZHkocGFnZSxsZXZlbCk6CiBwYWdlLndhaXRfZm9yX2Z1bmN0aW9uKCIiImV4cGVjdGVkPT5kb2N1bWVudC5ib2R5JiZkb2N1bWVudC5ib2R5LmRhdGFzZXQuaHNrUHJvZlJlYWR5PT09J3RydWUnJiZ3aW5kb3cuVkR1Y2tpZUhza1Byb2Zlc3Npb25hbFJ1bnRpbWUmJndpbmRvdy5WRHVja2llSHNrUHJvZmVzc2lvbmFsUnVudGltZS5nZXRTdGF0ZSgpLnN0YXR1cz09PSdyZWFkeScmJndpbmRvdy5WRHVja2llSHNrUHJvZmVzc2lvbmFsUnVudGltZS5nZXRTdGF0ZSgpLnNlbGVjdGVkTGV2ZWw9PT1leHBlY3RlZCIiIixhcmc9bGV2ZWwsdGltZW91dD01MDAwMCkKIHJldHVybiBwYWdlLmV2YWx1YXRlKCd3aW5kb3cuVkR1Y2tpZUhza1Byb2Zlc3Npb25hbFJ1bnRpbWUuZ2V0U3RhdGUoKScpCmRlZiBtZXRyaWNzKHBhZ2UpOgogcmV0dXJuIHBhZ2UuZXZhbHVhdGUoIiIiKCk9Pntjb25zdCByYWlsPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoc2tMZXZlbHMnKSxidXR0b25zPVsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjaHNrTGVzc29uIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSknKV0uZmlsdGVyKG49Pm4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0PjApLHpoPVsuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjaHNrTGVzc29uIFtsYW5nPSJ6aC1DTiJdJyldLmZpbHRlcihuPT5uLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodD4wKTtyZXR1cm57b3ZlcmZsb3c6ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoLWlubmVyV2lkdGgsbGV2ZWxSYWlsT3ZlcmZsb3c6cmFpbD9NYXRoLm1heCgwLHJhaWwuc2Nyb2xsV2lkdGgtcmFpbC5jbGllbnRXaWR0aCk6MCxtaW5CdXR0b25IZWlnaHQ6YnV0dG9ucy5sZW5ndGg/TWF0aC5taW4oLi4uYnV0dG9ucy5tYXAobj0+bi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQpKTowLG1pbkNoaW5lc2VGb250OnpoLmxlbmd0aD9NYXRoLm1pbiguLi56aC5tYXAobj0+cGFyc2VGbG9hdChnZXRDb21wdXRlZFN0eWxlKG4pLmZvbnRTaXplKXx8MCkpOjB9fSIiIikKZGVmIGFzc2VydF9jb3Vyc2UocGFnZSxzdGF0ZSk6CiBhc3NlcnQgc3RhdGVbJ3NlbGVjdGVkTGV2ZWwnXT09NiBhbmQgc3RhdGVbJ3JlYWRPbmx5J10gaXMgVHJ1ZSBhbmQgc3RhdGVbJ3Byb2dyZXNzV3JpdGVzRW5hYmxlZCddIGlzIEZhbHNlLHN0YXRlCiBmb3Igayx2IGluIEVYUEVDVEVELml0ZW1zKCk6IGFzc2VydCBzdGF0ZVsnY291bnRzJ11ba109PXYsKGssc3RhdGVbJ2NvdW50cyddKQogcGFnZS5nZXRfYnlfdGV4dCgnSFNLIDYgUHJvZmVzc2lvbmFsIMK3IEM3IGxlYXJuZXItZmFjaW5nJyxleGFjdD1UcnVlKS5maXJzdC53YWl0X2ZvcigpCiBhc3NlcnQgcGFnZS5sb2NhdG9yKCdbZGF0YS1wcm8tbGV2ZWw9IjYiXScpLmNvdW50KCk9PTEgYW5kIG5vdCBwYWdlLmxvY2F0b3IoJ1tkYXRhLXByby1sZXZlbD0iNiJdJykuaXNfZGlzYWJsZWQoKQogYXNzZXJ0IHBhZ2UubG9jYXRvcignLmhzay1wcm8tdW5pdCcpLmNvdW50KCk9PTI0IGFuZCBwYWdlLmxvY2F0b3IoJ1tkYXRhLXByby1sZXNzb25dJykuY291bnQoKT09NzIgYW5kIHBhZ2UubG9jYXRvcignW2RhdGEtcHJvLWFzc2Vzc21lbnRdJykuY291bnQoKT09MzEKIGZvciBoZWFkaW5nIGluIEhFQURJTkdTOiBwYWdlLmxvY2F0b3IoJyNoc2tMZXNzb24nKS5nZXRfYnlfdGV4dChoZWFkaW5nLGV4YWN0PVRydWUpLndhaXRfZm9yKCkKZGVmIGlzX2hzayh4KTogcmV0dXJuICcvZGF0YS9oc2svJyBpbiB4Lmxvd2VyKCkgb3IgJy9hc3NldHMvaHNrLWNvbnRlbnQvJyBpbiB4Lmxvd2VyKCkKdHJ5Ogogd2l0aCBzeW5jX3BsYXl3cmlnaHQoKSBhcyBwdzoKICBicm93c2VyPXB3LmNocm9taXVtLmxhdW5jaChoZWFkbGVzcz1UcnVlLGV4ZWN1dGFibGVfcGF0aD1DSFJPTUlVTSxhcmdzPVsnLS1uby1zYW5kYm94JywnLS1kaXNhYmxlLXNldHVpZC1zYW5kYm94JywnLS1kaXNhYmxlLWRldi1zaG0tdXNhZ2UnXSkKICBmb3IgbmFtZSx3LGgsbGlkLG1vYmlsZSBpbiBTUEVDUzoKICAgY29udGV4dD1icm93c2VyLm5ld19jb250ZXh0KHZpZXdwb3J0PXsnd2lkdGgnOncsJ2hlaWdodCc6aH0saXNfbW9iaWxlPW1vYmlsZSxoYXNfdG91Y2g9bW9iaWxlLGRldmljZV9zY2FsZV9mYWN0b3I9MSk7cGFnZT1jb250ZXh0Lm5ld19wYWdlKCkKICAgcGFnZS5vbignY29uc29sZScsbGFtYmRhIG0sbGFiZWw9bmFtZTpyZXN1bHRbJ2NvbnNvbGVFcnJvcnMnXS5hcHBlbmQoZid7bGFiZWx9OiB7bS50ZXh0fScpIGlmIG0udHlwZT09J2Vycm9yJyBlbHNlIE5vbmUpCiAgIHBhZ2Uub24oJ3JlcXVlc3RmYWlsZWQnLGxhbWJkYSByLGxhYmVsPW5hbWU6cmVzdWx0WydyZXF1ZXN0RmFpbHVyZXMnXS5hcHBlbmQoZid7bGFiZWx9OiB7ci51cmx9IOKAlCB7ci5mYWlsdXJlIG9yICJ1bmtub3duIn0nKSkKICAgcGFnZS5vbigncmVzcG9uc2UnLGxhbWJkYSByLGxhYmVsPW5hbWU6cmVzdWx0WydodHRwRXJyb3JzJ10uYXBwZW5kKGYne2xhYmVsfToge3Iuc3RhdHVzfSB7ci51cmx9JykgaWYgci5zdGF0dXM+PTQwMCBlbHNlIE5vbmUpCiAgIHBhZ2UuZ290byhmJ3tCQVNFfT9hcmVhPWhzayZoc2tMZXZlbD02Jmhza0xlc3Nvbj17bGlkfScsd2FpdF91bnRpbD0nZG9tY29udGVudGxvYWRlZCcsdGltZW91dD02MDAwMCk7c3RhdGU9cmVhZHkocGFnZSw2KTthc3NlcnRfY291cnNlKHBhZ2Usc3RhdGUpCiAgIG51bWJlcj1pbnQobGlkWy0yOl0pO3BhZ2UubG9jYXRvcignI2hza0xlc3NvbicpLmdldF9ieV90ZXh0KHJlLmNvbXBpbGUocmYnQsOASVxzK3tudW1iZXJ9XHMrL1xzKzcyJyxyZS5JKSkuZmlyc3Qud2FpdF9mb3IoKQogICBsYXlvdXQ9bWV0cmljcyhwYWdlKTthc3NlcnQgbGF5b3V0WydvdmVyZmxvdyddPD0yIGFuZCBsYXlvdXRbJ2xldmVsUmFpbE92ZXJmbG93J108PTIsKG5hbWUsbGF5b3V0KQogICBpZiBtb2JpbGU6CiAgICBhc3NlcnQgbm90IGxheW91dFsnbWluQnV0dG9uSGVpZ2h0J10gb3IgbGF5b3V0WydtaW5CdXR0b25IZWlnaHQnXT49NDAsbGF5b3V0CiAgICBhc3NlcnQgbm90IGxheW91dFsnbWluQ2hpbmVzZUZvbnQnXSBvciBsYXlvdXRbJ21pbkNoaW5lc2VGb250J10+PTEyLGxheW91dAogICByZXN1bHRbJ3ZpZXdwb3J0cyddW25hbWVdPXsnd2lkdGgnOncsJ2hlaWdodCc6aCwnbGVzc29uSWQnOmxpZCwnc3RhdGUnOnN0YXRlLCdtZXRyaWNzJzpsYXlvdXR9CiAgIGlmIG5hbWU9PSdkZXNrdG9wLTE0NDAnOgogICAgcGFnZS5sb2NhdG9yKCdbZGF0YS1wcm8tbGVzc29uPSJoc2s2LWxlc3Nvbi0xOCJdJykuY2xpY2soKTthc3NlcnQgcmVhZHkocGFnZSw2KVsnc2VsZWN0ZWRMZXNzb25JZCddPT0naHNrNi1sZXNzb24tMTgnO3Jlc3VsdFsnZmxvd3MnXVsnZmlyc3RRdWFydGVyTWlkZGxlVGhyZWVRdWFydGVyTGFzdCddPSdwYXNzJwogICAgcGFnZS5sb2NhdG9yKCdbZGF0YS1wcm8tcHJldl0nKS5jbGljaygpO2Fzc2VydCByZWFkeShwYWdlLDYpWydzZWxlY3RlZExlc3NvbklkJ109PSdoc2s2LWxlc3Nvbi0xNycKICAgIHBhZ2UubG9jYXRvcignW2RhdGEtcHJvLW5leHRdJykuY2xpY2soKTthc3NlcnQgcmVhZHkocGFnZSw2KVsnc2VsZWN0ZWRMZXNzb25JZCddPT0naHNrNi1sZXNzb24tMTgnO3Jlc3VsdFsnZmxvd3MnXVsncHJldmlvdXNOZXh0J109J3Bhc3MnCiAgICBwYWdlLmdvdG8oZid7QkFTRX0/YXJlYT1oc2smaHNrTGV2ZWw9NiZoc2tMZXNzb249aHNrNi1sZXNzb24tMDEnLHdhaXRfdW50aWw9J2RvbWNvbnRlbnRsb2FkZWQnKTtyZWFkeShwYWdlLDYpCiAgICBleGVyY2lzZT1uZXh0KHggZm9yIHggaW4gRVhFUkNJU0VTIGlmIHhbJ2lkJ109PSdoc2s2LWxlc3Nvbi0wMS1leGVyY2lzZS0wMScpO2NhcmQ9cGFnZS5sb2NhdG9yKGYnW2RhdGEtcHJvLWV4ZXJjaXNlPSJ7ZXhlcmNpc2VbImlkIl19Il0nKQogICAgY2FyZC5sb2NhdG9yKGYnaW5wdXRbdmFsdWU9IntleGVyY2lzZVsiYW5zd2VyIl19Il0nKS5jaGVjaygpO2NhcmQubG9jYXRvcihmJ1tkYXRhLXByby1jaGVjaz0ie2V4ZXJjaXNlWyJpZCJdfSJdJykuY2xpY2soKTtjYXJkLmdldF9ieV90ZXh0KCfEkMO6bmcuJyxleGFjdD1UcnVlKS53YWl0X2ZvcigpO3Jlc3VsdFsnZmxvd3MnXVsnZXhlcmNpc2VGZWVkYmFjayddPSdwYXNzJwogICAgZm9yIGFpZCxrZXkgaW4gWygnaHNrNi1hc3Nlc3NtZW50LXVuaXQtMDEnLCdjaGVja3BvaW50JyksKCdoc2s2LWFzc2Vzc21lbnQtbWlkcG9pbnQnLCdtaWRwb2ludCcpLCgnaHNrNi1hc3Nlc3NtZW50LXJlY2VwdGl2ZScsJ3JlY2VwdGl2ZScpLCgnaHNrNi1hc3Nlc3NtZW50LXByb2R1Y3RpdmUnLCdwcm9kdWN0aXZlJyksKCdoc2s2LWFzc2Vzc21lbnQtaW50ZWdyYXRlZCcsJ2ludGVncmF0ZWQnKSwoJ2hzazYtYXNzZXNzbWVudC1tb2NrJywnbW9jaycpLCgnaHNrNi1hc3Nlc3NtZW50LWZpbmFsJywnZmluYWwnKSwoJ2hzazYtYXNzZXNzbWVudC1tYXN0ZXJ5JywnbWFzdGVyeScpXToKICAgICBwYWdlLmxvY2F0b3IoZidbZGF0YS1wcm8tYXNzZXNzbWVudD0ie2FpZH0iXScpLmNsaWNrKCk7cGFnZS5sb2NhdG9yKCcjaHNrTGVzc29uIC5oc2stcHJvLWxlc3Nvbi1oZWFkJykud2FpdF9mb3IoKTtyZXN1bHRbJ2Zsb3dzJ11ba2V5XT0ncGFzcycKICAgIGZvciBsZXZlbCxsZXNzb25fY291bnQsdm9jYWIsa2V5IGluIFsoNSw2MCwxNjAwLCdoc2s1UmVncmVzc2lvbicpLCg0LDQ4LDEwMDAsJ2hzazRSZWdyZXNzaW9uJyksKDEsMjQsMzAwLCdoc2sxUmVncmVzc2lvbicpXToKICAgICBwYWdlLmxvY2F0b3IoZidbZGF0YS1wcm8tbGV2ZWw9IntsZXZlbH0iXScpLmNsaWNrKCk7c3Q9cmVhZHkocGFnZSxsZXZlbCk7YXNzZXJ0IHN0Wydjb3VudHMnXVsnbGVzc29ucyddPT1sZXNzb25fY291bnQgYW5kIHN0Wydjb3VudHMnXVsndm9jYWJ1bGFyeSddPT12b2NhYixzdDtyZXN1bHRbJ2Zsb3dzJ11ba2V5XT0ncGFzcycKICAgIHBhZ2UuZ290byhmJ3tCQVNFfT9hcmVhPWhzayZoc2tMZXZlbD02Jmhza0xlc3Nvbj1oc2s2LWxlc3Nvbi03Micsd2FpdF91bnRpbD0nZG9tY29udGVudGxvYWRlZCcpO2Fzc2VydCByZWFkeShwYWdlLDYpWydzZWxlY3RlZExlc3NvbklkJ109PSdoc2s2LWxlc3Nvbi03Mic7cmVzdWx0WydmbG93cyddWydkaXJlY3RVcmwnXT0ncGFzcycKICAgIHBhZ2UucmVsb2FkKHdhaXRfdW50aWw9J2RvbWNvbnRlbnRsb2FkZWQnKTthc3NlcnQgcmVhZHkocGFnZSw2KVsnc2VsZWN0ZWRMZXNzb25JZCddPT0naHNrNi1sZXNzb24tNzInO3Jlc3VsdFsnZmxvd3MnXVsncmVsb2FkJ109J3Bhc3MnCiAgIGlmIG1vYmlsZToKICAgIGlmIGxpZD09J2hzazYtbGVzc29uLTcyJzogcGFnZS5sb2NhdG9yKCdbZGF0YS1wcm8tcHJldl0nKS50YXAoKTthc3NlcnQgcGFnZS5ldmFsdWF0ZSgnd2luZG93LlZEdWNraWVIc2tQcm9mZXNzaW9uYWxSdW50aW1lLmdldFN0YXRlKCkuc2VsZWN0ZWRMZXNzb25JZCcpPT0naHNrNi1sZXNzb24tNzEnCiAgICBlbHNlOgogICAgIHBhZ2UubG9jYXRvcignW2RhdGEtcHJvLW5leHRdJykudGFwKCk7YXNzZXJ0IHBhZ2UuZXZhbHVhdGUoJ3dpbmRvdy5WRHVja2llSHNrUHJvZmVzc2lvbmFsUnVudGltZS5nZXRTdGF0ZSgpLnNlbGVjdGVkTGVzc29uSWQnKSE9bGlkCiAgICAgcGFnZS5sb2NhdG9yKCdbZGF0YS1wcm8tcHJldl0nKS50YXAoKTthc3NlcnQgcGFnZS5ldmFsdWF0ZSgnd2luZG93LlZEdWNraWVIc2tQcm9mZXNzaW9uYWxSdW50aW1lLmdldFN0YXRlKCkuc2VsZWN0ZWRMZXNzb25JZCcpPT1saWQKICAgIHJlc3VsdFsnZmxvd3MnXVsnbW9iaWxlVG91Y2gnXT0ncGFzcycKICAgcGFnZS5jbG9zZSgpO2NvbnRleHQuY2xvc2UoKQogIHJlc3VsdFsnZmxvd3MnXVsnYWxsTGVzc29uU2VjdGlvbnMnXT0ncGFzcyc7cmVzdWx0WydmbG93cyddWydmaXJzdFF1YXJ0ZXJNaWRkbGVUaHJlZVF1YXJ0ZXJMYXN0J109J3Bhc3MnCiAgYmFkPVt4IGZvciB4IGluIHJlc3VsdFsncmVxdWVzdEZhaWx1cmVzJ10rcmVzdWx0WydodHRwRXJyb3JzJ10gaWYgaXNfaHNrKHgpXQogIGNvbnNvbGU9W3ggZm9yIHggaW4gcmVzdWx0Wydjb25zb2xlRXJyb3JzJ10gaWYgaXNfaHNrKHgpIG9yICdoc2stcHJvZmVzc2lvbmFsJyBpbiB4Lmxvd2VyKCkgb3IgJ2hzazYnIGluIHgubG93ZXIoKV0KICBhc3NlcnQgbm90IGJhZCBhbmQgbm90IGNvbnNvbGUseyduZXR3b3JrJzpiYWQsJ2NvbnNvbGUnOmNvbnNvbGV9O2Fzc2VydCBhbGwodj09J3Bhc3MnIGZvciB2IGluIHJlc3VsdFsnZmxvd3MnXS52YWx1ZXMoKSkscmVzdWx0WydmbG93cyddO2Jyb3dzZXIuY2xvc2UoKQpmaW5hbGx5Ogogc2VydmVyLnNodXRkb3duKCk7c2VydmVyLnNlcnZlcl9jbG9zZSgpCnByaW50KGpzb24uZHVtcHMocmVzdWx0LGVuc3VyZV9hc2NpaT1GYWxzZSkpCg=="))
    (ROOT / "tests" / "hsk6-learner-browser-smoke.test.js").write_bytes(base64.b64decode("J3VzZSBzdHJpY3QnOwpjb25zdCBhc3NlcnQ9cmVxdWlyZSgnbm9kZTphc3NlcnQvc3RyaWN0JyksZnM9cmVxdWlyZSgnbm9kZTpmcycpLHBhdGg9cmVxdWlyZSgnbm9kZTpwYXRoJyksdGVzdD1yZXF1aXJlKCdub2RlOnRlc3QnKSx7c3Bhd25TeW5jfT1yZXF1aXJlKCdub2RlOmNoaWxkX3Byb2Nlc3MnKTsKdGVzdCgnSFNLNiBsZWFybmVyIGJyb3dzZXIgc21va2UgcGFzc2VzIGFsbCByZXF1aXJlZCB2aWV3cG9ydHMgYW5kIGZsb3dzJyx7dGltZW91dDo1MjAwMDB9LCgpPT57CiBjb25zdCBzY3JpcHQ9cGF0aC5qb2luKF9fZGlybmFtZSwnaHNrNi1sZWFybmVyLWJyb3dzZXItc21va2UucHknKSxmYXZpY29uPXBhdGguam9pbihfX2Rpcm5hbWUsJy4uJywnZmF2aWNvbi5pY28nKSxleGlzdGVkPWZzLmV4aXN0c1N5bmMoZmF2aWNvbik7CiB0cnl7CiAgaWYoIWV4aXN0ZWQpZnMud3JpdGVGaWxlU3luYyhmYXZpY29uLCc8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEgMSI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIvPjwvc3ZnPicsJ3V0ZjgnKTsKICBjb25zdCByPXNwYXduU3luYyhwcm9jZXNzLmVudi5QWVRIT058fCdweXRob24nLFtzY3JpcHRdLHtlbmNvZGluZzondXRmOCcsdGltZW91dDo1MTAwMDAsZW52OnsuLi5wcm9jZXNzLmVudixQWVRIT05VTkJVRkZFUkVEOicxJ319KTsKICBhc3NlcnQuZXF1YWwoci5zdGF0dXMsMCxgJHtyLnN0ZG91dH1cbiR7ci5zdGRlcnJ9YCk7Y29uc3QgcGF5bG9hZD1KU09OLnBhcnNlKHIuc3Rkb3V0LnRyaW0oKSk7CiAgYXNzZXJ0LmRlZXBFcXVhbChPYmplY3Qua2V5cyhwYXlsb2FkLnZpZXdwb3J0cykuc29ydCgpLFsnZGVza3RvcC0xMDI0JywnZGVza3RvcC0xNDQwJywnbW9iaWxlLTMyMCcsJ21vYmlsZS0zOTAnXSk7YXNzZXJ0Lm9rKE9iamVjdC52YWx1ZXMocGF5bG9hZC5mbG93cykuZXZlcnkoeD0+eD09PSdwYXNzJykpOwogfWZpbmFsbHl7aWYoIWV4aXN0ZWQmJmZzLmV4aXN0c1N5bmMoZmF2aWNvbikpZnMudW5saW5rU3luYyhmYXZpY29uKTt9Cn0pOwo="))

    # Advance only the contracts that previously assumed HSK5 was the last learner-facing level.
    phase0_test = ROOT / "tests" / "hsk-phase0.test.js"
    phase0_text = phase0_test.read_text(encoding="utf-8")
    phase0_text = phase0_text.replace("manifest.levels.slice(0,5)", "manifest.levels.slice(0,6)")
    phase0_text = phase0_text.replace(
        '[[1,"machine-assisted",false],[2,"machine-assisted",false],[3,"machine-assisted",false],[4,"machine-assisted",false],[5,"machine-assisted",false]]',
        '[[1,"machine-assisted",false],[2,"machine-assisted",false],[3,"machine-assisted",false],[4,"machine-assisted",false],[5,"machine-assisted",false],[6,"machine-assisted",false]]')
    phase0_text = phase0_text.replace("manifest.levels.slice(5).every", "manifest.levels.slice(6).every")
    phase0_test.write_text(phase0_text, encoding="utf-8")

    phase1_test = ROOT / "tests" / "hsk-phase1-quality.test.js"
    phase1_text = phase1_test.read_text(encoding="utf-8")
    phase1_text = phase1_text.replace("report.levels.slice(0, 5)", "report.levels.slice(0, 6)")
    phase1_text = phase1_text.replace(
        "{ level: 5, status: 'machine-assisted', lessons: 60, complete: false, productionReady: false }\n  ]);",
        "{ level: 5, status: 'machine-assisted', lessons: 60, complete: false, productionReady: false },\n"
        "    { level: 6, status: 'machine-assisted', lessons: 72, complete: false, productionReady: false }\n  ]);")
    phase1_text = phase1_text.replace("report.levels.slice(5).every", "report.levels.slice(6).every")
    phase1_test.write_text(phase1_text, encoding="utf-8")

    print(json.dumps({"ok": True, "phase": PHASE, "counts": course_manifest["collections"],
                      "missingMeanings": missing_meanings}, ensure_ascii=False))

if __name__ == "__main__":
    build()
