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

# The rest of the generator is encoded in the repository source uploaded by the C7 agent.
# This guard prevents partial materialization if the transport is truncated.
raise RuntimeError("C7 generator transport truncated; restore full source before running")
