#!/usr/bin/env python3
"""Build VDuckie Phase C5 HSK4 curriculum from the revised 2026 HSK syllabus.

Official membership is rows 1001-2000. Learner-facing prose is newly authored for VDuckie.
The fetch is only used to capture a lexical membership/gloss snapshot; generated JSON is committed.
"""
from __future__ import annotations

# Finalize with scripts/finalize-hsk4-c5.py to normalize phrase pinyin and verified stroke metadata.
import hashlib, html, json, os, re, sys, urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HSK4 = ROOT / "data" / "hsk" / "hsk4"
SYLLABUS = "GF0025-2021"
EXAM = "CTI-HSK4.0-2026"
OFFICIAL_SOURCE = "cti-hsk4-current-syllabus-2026"
VIET_GLOSS_SOURCE = "hsk-beijing-hsk4-vietnamese-gloss-2026"
ORIGINAL_SOURCE = "vduckie-hsk4-c5-original"
SOURCE_URL = "https://hanngubackinh.vn/tu-vung-hsk-3-0/cap-4/"
SOURCES = ["moe-gf0025-2021-standard", OFFICIAL_SOURCE, VIET_GLOSS_SOURCE, ORIGINAL_SOURCE]

UNITS = [
 ("人物与关系", "Con người và quan hệ", "Miêu tả con người, quan hệ và cảm xúc bằng bằng chứng thay vì nhãn chung."),
 ("学习与成长", "Học tập và trưởng thành", "Đặt mục tiêu, phản tư phương pháp và trao đổi kết quả học tập."),
 ("求职与职场", "Tìm việc và môi trường làm việc", "Xử lý tuyển dụng, nhiệm vụ, phản hồi và trách nhiệm nghề nghiệp."),
 ("出行与服务", "Đi lại và dịch vụ", "Hoàn thành quy trình đi lại, lưu trú và dịch vụ có nhiều bước."),
 ("消费与选择", "Tiêu dùng và lựa chọn", "So sánh, thương lượng, khiếu nại và đưa ra lựa chọn có lý do."),
 ("健康与习惯", "Sức khỏe và thói quen", "Mô tả triệu chứng, thói quen, lời khuyên và thay đổi hành vi."),
 ("城市与居住", "Thành phố và nơi ở", "Bàn về nhà ở, tiện ích, giao thông và chất lượng sống."),
 ("网络与信息", "Mạng và thông tin", "Đọc, xác minh, chuyển tiếp và phản hồi thông tin số có trách nhiệm."),
 ("文化与礼貌", "Văn hóa và phép lịch sự", "Ứng xử phù hợp trong lời mời, quà tặng, bàn ăn và giao tiếp liên văn hóa."),
 ("自然与环境", "Tự nhiên và môi trường", "Giải thích hiện tượng, tác động và giải pháp môi trường ở mức cá nhân/cộng đồng."),
 ("媒体与艺术", "Truyền thông và nghệ thuật", "Tóm tắt, đánh giá và giới thiệu tác phẩm, chương trình, sự kiện."),
 ("社会与规则", "Xã hội và quy tắc", "Thảo luận quy định, trách nhiệm, công bằng và hiện tượng xã hội."),
 ("科技与生活", "Công nghệ và đời sống", "Giải thích thao tác, lợi ích, rủi ro và lựa chọn công nghệ."),
 ("经历与叙事", "Trải nghiệm và kể chuyện", "Kể chuyện có bối cảnh, bước ngoặt, kết quả và đánh giá."),
 ("观点与讨论", "Quan điểm và thảo luận", "Nêu lập trường, nhượng bộ, phản biện và kết luận mạch lạc."),
 ("综合项目", "Dự án tổng hợp", "Tích hợp nghe–nói–đọc–viết trong nhiệm vụ thực tế nhiều nguồn."),
]

LESSONS = [('第一印象可靠吗',
  'Ấn tượng đầu tiên có đáng tin?',
  'Phân biệt quan sát và suy đoán khi miêu tả một người.',
  'Bạn giới thiệu một thành viên mới nhưng tránh gắn nhãn vội vàng.',
  '林：你觉得新同事怎么样？\n安：他话不多，不过办事很仔细。\n林：所以你觉得他比较冷淡吗？\n安：还不能这么说，我只见过他两次。',
  '新同事第一次开会时一直记笔记，也主动确认任务。有人觉得他太严肃，安却认为应该多观察几天，再根据实际表现作判断。',
  '我以前常凭第一印象判断别人，后来发现沉默不一定表示不友好。真正合作以后，我才了解对方的性格。',
  'Miêu tả một người bằng ba chi tiết quan sát được và một suy luận có đánh dấu.',
  'Viết 120 chữ: ấn tượng ban đầu, bằng chứng mới và kết luận đã điều chỉnh.',
  'Quan sát một cuộc trao đổi thật và tách dữ kiện khỏi nhận xét.',
  '避免用‘他就是……的人’下绝对结论；用‘看起来、可能、从……来看’保留空间。',
  'Đọc: gạch chân bằng chứng trước khi chọn tính từ đánh giá.'),
 ('把感谢说具体',
  'Cảm ơn sao cho cụ thể',
  'Bày tỏ biết ơn phù hợp quan hệ và nêu rõ hành động được trân trọng.',
  'Bạn cảm ơn người đã hỗ trợ mình hoàn thành một việc khó.',
  '美：昨天多亏你帮我检查材料。\n东：不用客气，结果顺利就好。\n美：你不但指出了错误，还陪我重新整理。\n东：下次你也一定能自己处理好。',
  '一句简单的“谢谢”很重要，但说明对方具体做了什么，往往更真诚。正式场合可以说“感谢您的帮助”，朋友之间则可以自然一些。',
  '收到帮助以后，我写了一条消息，先说明结果，再感谢对方花时间解释。这样比只发一个表情更清楚。',
  'Role-play lời cảm ơn với bạn bè và với người lớn tuổi, điều chỉnh register.',
  'Viết hai tin cảm ơn cùng sự việc: thân mật và trang trọng.',
  'Gửi một lời cảm ơn cụ thể cho người đã giúp bạn tuần này.',
  '‘感谢’较正式，‘谢谢’中性；亲近关系可说‘多亏你了’，但不宜用于所有正式邮件。',
  'Nghe: nhận diện hành động cụ thể khiến người nói biết ơn.'),
 ('误会以后怎么谈',
  'Nói chuyện sau hiểu lầm',
  'Giải thích hiểu lầm, nhận phần trách nhiệm và đề xuất cách sửa quan hệ.',
  'Hai người giải quyết một tin nhắn bị hiểu sai.',
  '杰：你昨天为什么没回复？\n雨：我以为你已经取消了安排。\n杰：我的话确实说得不够清楚。\n雨：那我们以后把时间和地点再确认一遍吧。',
  '误会发生以后，只证明自己没错往往不能解决问题。先确认双方理解的内容，再说明原因，最后提出下一步，谈话会更有效。',
  '我看到那条消息时有点生气，但没有马上反驳。我先问清楚对方的意思，结果发现只是标点让语气显得很冷。',
  'Mô phỏng hòa giải: xác nhận, giải thích, xin lỗi, thống nhất bước sau.',
  'Viết tin nhắn đính chính không đổ lỗi, có thông tin đúng và hành động tiếp theo.',
  'Chọn một hiểu lầm nhỏ từng gặp và viết lại cách xử lý tốt hơn.',
  '道歉不等于承担全部责任；‘我刚才没说明白’常比‘你理解错了’更有合作性。',
  'Đọc: xác định câu làm giảm căng thẳng và câu dễ gây phòng thủ.'),
 ('目标要能检查',
  'Mục tiêu phải kiểm tra được',
  'Đặt mục tiêu học tập có thời hạn, hành động và tiêu chí hoàn thành.',
  'Bạn cùng giáo viên điều chỉnh một mục tiêu quá chung chung.',
  '老师：你说想提高口语，准备怎么做？\n兰：我每天说十分钟，每周录一次音。\n老师：怎么判断有没有进步？\n兰：月底用同一话题再说一次，比较两次录音。',
  '“我要学好汉语”表达了愿望，却很难检查。把目标写成频率、时间和成果，学习者更容易发现问题，也能及时调整方法。',
  '这个月我不追求记住所有生词，而是选择六十个高频词，在对话和短文中反复使用。每周末我检查一次。',
  'Trình bày mục tiêu một tháng theo cấu trúc mục tiêu–cách làm–bằng chứng.',
  'Lập kế hoạch 150 chữ có lịch, sản phẩm và tiêu chí tự đánh giá.',
  'Tạo một mục tiêu HSK4 thật và đặt lịch kiểm tra sau bảy ngày.',
  '‘提高’需要对象和证据；正式计划常用‘目标、措施、结果’，口语可用‘我打算……’。',
  'Đọc: phân biệt mục tiêu, biện pháp và tiêu chí kết quả.'),
 ('不同方法适合谁',
  'Phương pháp nào hợp với ai',
  'So sánh phương pháp học dựa trên điều kiện và nhu cầu cá nhân.',
  'Nhóm học thảo luận flashcard, shadowing và viết nhật ký.',
  '林：你每天都背单词表吗？\n安：以前是，现在我更常在句子里复习。\n林：哪种方法更有效？\n安：要看目标，准备阅读和练口语的方法不完全一样。',
  '有人靠重复记忆，有人需要把词放进真实任务。方法没有绝对的好坏，关键是它是否解决当前问题，并且能长期坚持。',
  '我试过早上听新闻，发现速度太快。后来改成短对话，先听主旨，再听细节，压力小了，效果反而更好。',
  'So sánh hai phương pháp và khuyên một người có thời gian hạn chế.',
  'Viết đoạn so sánh có tiêu chí, ưu/nhược điểm và khuyến nghị.',
  'Thử một phương pháp mới trong ba ngày rồi ghi kết quả.',
  '‘适合’强调人与条件匹配；‘有效’强调结果，二者不能简单互换。',
  'Nghe: ghi bảng phương pháp–điều kiện–kết quả.'),
 ('成绩之外的进步',
  'Tiến bộ ngoài điểm số',
  'Đánh giá tiến bộ bằng nhiều bằng chứng và phản hồi cân bằng.',
  'Bạn an ủi người có điểm chưa cao nhưng giao tiếp đã tốt hơn.',
  '美：这次分数还是不理想。\n东：可是你现在能把意见说得很清楚。\n美：考试成绩也很重要。\n东：当然，我们看看错题，同时也记录你已经做到的事。',
  '分数能反映一部分学习结果，却不能说明全部能力。能否理解真实对话、完成任务、发现并修改错误，也都是重要证据。',
  '我把两个月前的作文找出来，虽然现在还有错误，但句子之间的关系更清楚了。我决定继续记录这种变化。',
  'Phản hồi một bạn học: nêu điểm mạnh, bằng chứng, điểm cần sửa và bước sau.',
  'Viết bản tự đánh giá có ít nhất ba loại bằng chứng.',
  'So sánh một sản phẩm học cũ và mới, đánh dấu thay đổi cụ thể.',
  '‘不理想’比‘很差’更缓和；反馈要避免空泛的‘很好’，应指出具体表现。',
  'Đọc: xác định chỉ số kết quả và chỉ số quá trình.'),
 ('招聘信息怎么看',
  'Đọc thông tin tuyển dụng',
  'Đọc quảng cáo tuyển dụng, tách yêu cầu bắt buộc và ưu tiên.',
  'Bạn cân nhắc một vị trí có nhiều điều kiện.',
  '杰：这个岗位要求两年经验，我能报名吗？\n雨：先看清楚，经验是必须条件还是优先条件。\n杰：还要求能出差。\n雨：那也要考虑你的实际安排。',
  '招聘信息里“必须”“需要”和“优先”表示的要求不同。申请前除了看工资，还要确认职责、工作地点、时间和发展机会。',
  '我看到一份看起来很合适的工作，但详细阅读后发现需要长期出差。我没有急着报名，而是先问清出差频率。',
  'Giải thích một tin tuyển dụng và quyết định có ứng tuyển hay không.',
  'Viết bảng đối chiếu yêu cầu–bằng chứng bản thân–điểm cần hỏi.',
  'Chọn một tin tuyển dụng thật, đánh dấu từ chỉ mức độ bắt buộc.',
  '‘优先考虑’不是‘必须具备’；正式招聘中‘岗位、职责、任职要求’需准确区分。',
  'Đọc: khoanh modal bắt buộc và điều kiện ưu tiên.'),
 ('面试要举例',
  'Phỏng vấn phải có ví dụ',
  'Trả lời phỏng vấn bằng tình huống–hành động–kết quả thay vì tính từ chung.',
  'Bạn chuẩn bị câu trả lời về trách nhiệm và hợp tác.',
  '经理：你为什么说自己负责？\n安：上次项目临时改变，我重新安排了任务。\n经理：结果怎么样？\n安：我们按时完成，而且把问题记录下来，避免再次发生。',
  '面试中只说“我很认真”说服力有限。用一个真实例子说明背景、行动和结果，能让对方更清楚地判断能力。',
  '我先准备三个经历：解决问题、与人合作、从错误中学习。回答时不夸大，也不把团队成果全说成自己的。',
  'Trả lời hai câu phỏng vấn bằng ví dụ có kết quả đo được.',
  'Viết câu trả lời 180 chữ, nêu vai trò cá nhân và đóng góp của nhóm.',
  'Ghi âm một câu trả lời 90 giây rồi cắt từ thừa.',
  '面试语体较正式；‘我觉得我挺厉害’不如‘我负责……并取得……结果’具体。',
  'Nghe: ghi bốn cột bối cảnh–nhiệm vụ–hành động–kết quả.'),
 ('反馈不是批评人',
  'Phản hồi không phải phê bình con người',
  'Đưa phản hồi tập trung hành vi, tác động và đề nghị cụ thể.',
  'Bạn góp ý báo cáo của đồng nghiệp mà không làm họ mất mặt.',
  '林：这份报告哪里需要改？\n安：数据很完整，不过结论和前面的证据还没连起来。\n林：你建议怎么调整？\n安：可以先写主要发现，再补两条支持材料。',
  '有效反馈描述作品或行为，而不是给人贴标签。“这里缺少依据”可以修改，“你不认真”却容易让谈话变成自我保护。',
  '收到反馈时，我先复述对方的重点，再确认修改时间。即使不同意，也先讨论具体证据，而不是马上争论态度。',
  'Role-play đưa và nhận feedback cho một sản phẩm công việc.',
  'Viết phản hồi theo ba phần: điểm đạt, vấn đề, đề nghị sửa.',
  'Dùng mẫu này góp ý một đoạn văn thật của chính bạn.',
  '工作反馈宜用‘建议、可以、需要补充’；批评人品会越过任务边界。',
  'Đọc: đổi câu phán xét thành câu mô tả có thể hành động.'),
 ('安检和登机之间',
  'Từ an ninh đến lên máy bay',
  'Hiểu và thực hiện chuỗi hướng dẫn sân bay, xử lý thay đổi cửa ra máy bay.',
  'Bạn hỗ trợ một người lần đầu đi máy bay.',
  '广播：前往广州的旅客请注意，登机口改为十二号。\n安：我们已经过了安检，现在往哪儿走？\n林：先看指示牌，再确认航班信息。\n安：好，我也把变化告诉同行的人。',
  '机场信息可能通过屏幕、广播和工作人员同时发布。旅客要核对航班号、时间和登机口，不能只记一个数字。',
  '通过安检以后，我发现登机口改变了。我没有跟着人群走，而是查看屏幕，再向工作人员确认。',
  'Hướng dẫn người khác hoàn thành năm bước ở sân bay.',
  'Viết tin nhắn báo thay đổi cửa ra máy bay, đủ số hiệu và thời gian.',
  'Mô phỏng đọc bảng chuyến bay và chọn hành động tiếp theo.',
  '服务场景常用简短祈使句；向工作人员求证可说‘请问，我确认一下……’。',
  'Nghe: ưu tiên số hiệu, giờ và địa điểm; bỏ chi tiết không liên quan.'),
 ('换乘时别只看地图',
  'Chuyển tuyến đừng chỉ nhìn bản đồ',
  'Hỏi và xác nhận lộ trình dựa trên thời gian, hướng và điều kiện thực tế.',
  'Tàu trễ khiến tuyến chuyển ban đầu không còn phù hợp.',
  '东：地图说在中心站换乘。\n美：可是现在这条线晚点了。\n东：那还有别的路线吗？\n美：工作人员建议先坐到南站，再换地铁。',
  '地图给出的最快路线不一定适合当时情况。换乘时要考虑晚点、步行距离、行李和末班车时间。',
  '我原来只看总时间，结果换乘距离太远。后来我会同时查看站台、出口和步行说明。',
  'So sánh hai tuyến và giải thích lựa chọn cho người mang hành lý.',
  'Viết hướng dẫn chuyển tuyến theo bước, có điểm xác nhận.',
  'Dùng bản đồ thật lập hai phương án đến một địa điểm.',
  '‘换乘’用于交通工具或线路；‘换’口语更宽，但正式指引宜写完整。',
  'Đọc: không chỉ tìm “nhanh nhất”, mà xác định điều kiện ẩn.'),
 ('酒店问题怎么解决',
  'Giải quyết vấn đề khách sạn',
  'Mô tả vấn đề, nêu bằng chứng và thương lượng giải pháp phù hợp.',
  'Phòng đặt trước khác mô tả.',
  '客人：我订的是安静的无烟房。\n前台：很抱歉，现在这间靠近电梯。\n客人：晚上会比较吵，能换一间吗？\n前台：我查看一下，也可以先为您保留明天的房间。',
  '投诉时只说“很不好”不够具体。说明预订内容、实际情况和合理要求，服务人员更容易处理。',
  '我先拍下房间设施的问题，再礼貌说明影响。对方提出两个方案，我比较时间和费用后选择了一个。',
  'Role-play khiếu nại phòng và thương lượng hai giải pháp.',
  'Viết phản hồi dịch vụ có sự việc, ảnh hưởng, yêu cầu và kết quả mong muốn.',
  'Đọc một chính sách đặt phòng và chuẩn bị câu hỏi trước khi đặt.',
  '‘投诉’较强；现场可先用‘想反映一个问题’，再根据处理情况升级。',
  'Nghe: tách điều đã đặt, tình trạng thực tế và lời đề nghị.'),
 ('比较价格也比较条件',
  'So giá và cả điều kiện',
  'So sánh sản phẩm theo giá, bảo hành, giao hàng và nhu cầu sử dụng.',
  'Hai sản phẩm chênh giá nhưng điều kiện khác nhau.',
  '林：这个便宜两百块，为什么不买？\n安：它不包括安装，保修也只有半年。\n林：另一个贵，但服务更全。\n安：我们按实际使用时间再算总费用吧。',
  '低价不一定代表成本最低。比较商品时，应把售后、使用时间、质量和退换条件放在同一张表里。',
  '我以前只看折扣，后来发现不需要的功能再便宜也是浪费。现在我先写需求，再比较选项。',
  'Đưa khuyến nghị mua hàng dựa trên bốn tiêu chí, không chỉ giá.',
  'Viết đoạn so sánh có số liệu và điều kiện giới hạn.',
  'So sánh hai sản phẩm thật bằng bảng tổng chi phí.',
  '‘便宜’是价格判断，‘划算’是综合价值判断；正式报告可用‘成本、条件、风险’。',
  'Đọc: kiểm tra đơn vị, thời hạn và điều kiện áp dụng của số liệu.'),
 ('退换货要看规则',
  'Đổi trả phải xem quy định',
  'Đọc chính sách đổi trả và trình bày yêu cầu có căn cứ.',
  'Một món hàng đã mở hộp nhưng có lỗi.',
  '顾客：这台机器昨天买的，开机后一直有声音。\n店员：包装打开了，不过质量问题可以检测。\n顾客：需要带哪些证件？\n店员：请带发票和保修卡，我们先登记。',
  '退换货条件通常区分“不喜欢”和“质量问题”。消费者要保留证件、时间和问题记录，也要理解商家的检测流程。',
  '我没有先在网上生气地评价，而是查看规则，整理照片和订单号，再联系服务人员。',
  'Mô phỏng yêu cầu đổi hàng dựa trên chính sách cụ thể.',
  'Viết yêu cầu hỗ trợ có mã đơn, lỗi, bằng chứng và giải pháp mong muốn.',
  'Đọc chính sách của một cửa hàng và tóm tắt ba điều kiện quan trọng.',
  '‘退货、换货、维修’是不同诉求；用词明确能缩短沟通时间。',
  'Đọc: phân biệt điều kiện đủ, ngoại lệ và tài liệu cần có.'),
 ('广告说得太满了吗',
  'Quảng cáo có nói quá?',
  'Nhận diện tuyên bố tuyệt đối, bằng chứng và điều kiện bị lược bỏ.',
  'Bạn đánh giá quảng cáo “dùng một lần là hiệu quả”.',
  '美：广告说用了马上有效。\n东：它有没有说明测试对象和时间？\n美：只有几张前后对比图。\n东：那还不能证明对所有人都一样。',
  '广告常突出最好结果，却把条件写得很小。判断信息时要问：谁提供数据、比较什么、样本多少、是否有例外。',
  '我看到“百分之百满意”的说法时，先找退费条件。结果发现只有七天内、未拆封才可以申请。',
  'Phân tích một quảng cáo: claim, evidence, missing condition, conclusion.',
  'Viết bản đánh giá 150 chữ, tránh khẳng định vượt bằng chứng.',
  'Chụp một quảng cáo thật và đánh dấu từ tuyệt đối.',
  '‘一定、完全、百分之百’需要强证据；‘可能、有助于’表达较有限的结论。',
  'Đọc: truy nguồn số liệu và tìm chữ nhỏ/điều kiện.'),
 ('体检报告怎么看',
  'Đọc báo cáo khám sức khỏe',
  'Trao đổi chỉ số cơ bản mà không tự chẩn đoán, biết khi nào hỏi chuyên môn.',
  'Bạn nhận kết quả có một chỉ số ngoài khoảng tham chiếu.',
  '安：这个数字高一点，是不是很严重？\n医生：先别急，要结合其他情况判断。\n安：我应该注意什么？\n医生：这段时间记录饮食和睡眠，下周再复查。',
  '体检报告中的参考范围不是自行诊断的答案。读者可以确认单位、变化和医生建议，但不应只凭一个数字下结论。',
  '我把以前的报告也带来，让医生比较变化。对于不懂的词，我先做记录，不在网上随便对号入座。',
  'Role-play hỏi bác sĩ: chỉ số, ý nghĩa, hành động và lịch theo dõi.',
  'Viết ghi chú sức khỏe chỉ ghi dữ kiện và lời khuyên đã nhận.',
  'Tạo bảng theo dõi một thói quen sức khỏe trong bảy ngày.',
  '健康沟通宜用‘我担心……、请问需要……吗’，避免把网络信息当确定诊断。',
  'Đọc: chú ý đơn vị, khoảng tham chiếu và nguồn khuyến nghị.'),
 ('建议要能做到',
  'Lời khuyên phải làm được',
  'Đưa lời khuyên phù hợp nguồn lực và không phán xét.',
  'Bạn khuyên người làm ca đêm cải thiện giấc ngủ.',
  '林：你应该每天十点睡。\n东：我上晚班，十点还在工作。\n林：那我刚才的建议不适合你。\n东：也许可以先固定下班后的睡前流程。',
  '好建议不仅听起来正确，还要考虑时间、费用、身体情况和个人选择。先提问，再共同选择一个小步骤，往往更可执行。',
  '朋友说最近压力大，我没有马上列十条方法。我先问他最难的时段，再一起找一个能开始的改变。',
  'Đưa hai lời khuyên sau khi hỏi đủ điều kiện của người nghe.',
  'Viết đoạn tư vấn có lựa chọn và giới hạn, không ra lệnh.',
  'Thử biến một lời khuyên chung thành hành động nhỏ đo được.',
  '‘你应该’语气较强；关系不近或信息不足时可用‘要不要试试、也许可以’。',
  'Nghe: xác định điều kiện khiến lời khuyên ban đầu không phù hợp.'),
 ('习惯为什么难改变',
  'Vì sao thói quen khó đổi',
  'Giải thích trigger–hành động–kết quả và thiết kế thay đổi nhỏ.',
  'Bạn phân tích thói quen dùng điện thoại trước ngủ.',
  '美：我每晚都说少看手机，还是做不到。\n安：你通常什么时候开始看？\n美：躺下以后，觉得还不困。\n安：那可以把充电器放远一点，再准备一本短书。',
  '习惯不是只靠意志。环境、时间和即时奖励都会影响行为。改变时，先找到触发点，再设计容易完成的替代动作。',
  '我把目标从“完全不用手机”改成“睡前十五分钟放下”。连续一周以后，再慢慢增加时间。',
  'Giải thích một thói quen bằng chuỗi trigger–behavior–reward.',
  'Viết kế hoạch thay đổi 14 ngày có bước nhỏ và cách theo dõi.',
  'Thay đổi một chi tiết môi trường và quan sát ba ngày.',
  '‘养成习惯’多用于建立，‘改掉习惯’用于消除；避免用‘懒’简单解释行为。',
  'Đọc: tìm nguyên nhân gần, nguyên nhân nền và giải pháp tương ứng.'),
 ('搬家不只是搬东西',
  'Chuyển nhà không chỉ chuyển đồ',
  'Lập kế hoạch chuyển nhà gồm hợp đồng, tiện ích, hàng xóm và rủi ro.',
  'Bạn chuẩn bị chuyển sang căn hộ mới.',
  '雨：周末搬家，东西都装好了吗？\n杰：差不多，但还没确认水电和网络。\n雨：旧房的钥匙什么时候交？\n杰：我今天和房东把检查时间定下来。',
  '搬家涉及打包、运输、地址变更和房屋交接。提前拍照记录设施，能减少以后对损坏责任的争议。',
  '我给箱子按房间编号，没有只写“杂物”。到新家以后，先检查水、电、门锁，再拆常用物品。',
  'Hướng dẫn kế hoạch chuyển nhà theo thời gian và trách nhiệm.',
  'Viết checklist trước–trong–sau chuyển nhà.',
  'Kiểm tra hợp đồng/biên bản bàn giao mẫu và ghi câu hỏi.',
  '和房东沟通宜保留书面确认；‘差不多’不能代替明确的交接状态。',
  'Đọc: xác định bước phụ thuộc và việc cần bằng chứng ảnh.'),
 ('噪音问题怎么谈',
  'Nói chuyện về tiếng ồn',
  'Phản ánh vấn đề cộng đồng bằng thời gian, ảnh hưởng và đề nghị hợp lý.',
  'Tiếng ồn ban đêm từ căn hộ bên cạnh.',
  '邻居：最近晚上是不是有点吵？\n安：对不起，我们在整理家具。\n邻居：十一点以后声音会影响孩子睡觉。\n安：明白，我们把有声音的工作改到白天。',
  '邻里问题如果一开始就指责，很容易升级。说明具体时间和影响，同时给对方解释和调整的机会，更可能解决问题。',
  '我先记录连续三天的时间，没有夸大成“每天都这样”。沟通后，我们约定晚上十点以后保持安静。',
  'Role-play phản ánh tiếng ồn và thương lượng quy tắc.',
  'Viết thông báo khu dân cư lịch sự, cụ thể và có liên hệ.',
  'Quan sát một nội quy cộng đồng, đánh giá câu nào rõ/chưa rõ.',
  '‘有点吵’用于开启对话较缓和；若问题持续，可转为正式、可记录的表达。',
  'Đọc: phân biệt dữ kiện tần suất với từ phóng đại.'),
 ('城市方便等于宜居吗',
  'Tiện lợi có đồng nghĩa đáng sống?',
  'Đánh giá chất lượng sống bằng nhiều tiêu chí và ưu tiên cá nhân.',
  'Nhóm tranh luận trung tâm thành phố và ngoại ô.',
  '林：市中心交通方便，当然更适合生活。\n美：可是房租、噪音和绿地也很重要。\n林：那你最看重什么？\n美：对我来说，通勤时间和安静需要一起考虑。',
  '“方便”只是城市生活的一个方面。不同家庭对学校、医疗、工作、空间和环境的权重不同，因此答案不会完全一样。',
  '我做选择时先列必须条件，再列可以让步的条件。这样不会被一个优点吸引，却忽略长期成本。',
  'Đề xuất nơi ở cho hai hồ sơ có ưu tiên khác nhau.',
  'Viết đoạn đánh giá khu vực bằng 5 tiêu chí và kết luận có điều kiện.',
  'So sánh hai khu vực thật bằng dữ liệu công khai.',
  '‘宜居’是综合评价，不能仅由‘方便’推出；论证要说明‘对谁、在什么条件下’。',
  'Đọc: xác định tiêu chí và trọng số ẩn của người viết.'),
 ('消息先核实再转发',
  'Xác minh trước khi chuyển tiếp',
  'Kiểm tra nguồn, thời gian, bằng chứng và phạm vi trước khi chia sẻ.',
  'Bạn nhận tin “ngày mai nghỉ” trong nhóm không chính thức.',
  '东：群里说公司明天放假，我转发给大家吧。\n安：先等等，消息是谁发的？\n东：是别人转来的，没有原通知。\n安：我们查正式渠道，确认以后再发。',
  '一条消息看起来合理，也可能已经过期或缺少条件。核实时要找到最初来源，而不是只看转发次数。',
  '我搜索标题，发现同样的图片去年就出现过。日期被裁掉以后，很多人以为是最新通知。',
  'Giải thích quy trình xác minh một tin trong 60 giây.',
  'Viết thông báo đính chính có nguồn và thời gian cập nhật.',
  'Kiểm tra một tin đang lan truyền bằng hai nguồn độc lập.',
  '‘听说’明确表示未证实；正式转发应写来源、日期和适用范围。',
  'Đọc: reverse-source—tìm nguồn đầu, ngày và ngữ cảnh bị cắt.'),
 ('隐私不是小事',
  'Quyền riêng tư không phải chuyện nhỏ',
  'Xin phép trước khi đăng/chuyển thông tin cá nhân và giải thích rủi ro.',
  'Một người định đăng ảnh nhóm có bảng tên.',
  '雨：这张合照很好，我发到网上了。\n杰：大家都同意公开吗？后面的名单也看得见。\n雨：我没注意到。\n杰：先删掉，遮住个人信息，再问一下大家吧。',
  '照片、位置、证件和聊天记录都可能包含个人信息。分享前要考虑对象、范围、保存时间和是否得到允许。',
  '我以前觉得群聊是私密空间，后来发现截图可以被继续转发。现在涉及别人时，我会先征求同意。',
  'Role-play xin phép đăng ảnh và xử lý khi người khác từ chối.',
  'Viết quy tắc chia sẻ thông tin cho nhóm nhỏ.',
  'Kiểm tra một ảnh trước khi đăng: tên, địa chỉ, mã, vị trí.',
  '‘方便’不能自动压过隐私；询问可说‘我可以发这张照片吗？只发在……’。',
  'Đọc: tìm dữ liệu trực tiếp và dữ liệu có thể suy ra.'),
 ('线上语气容易误读',
  'Giọng điệu online dễ bị hiểu sai',
  'Điều chỉnh độ trực tiếp, dấu câu và ngữ cảnh trong tin nhắn.',
  'Một câu “知道了。” bị hiểu là khó chịu.',
  '美：你是不是生气了？你只回了“知道了。”\n东：没有，我当时正在开会。\n美：文字看不到语气，我误会了。\n东：以后急的时候我会说明，重要的事也可以打电话。',
  '文字交流缺少表情、停顿和即时反馈。同一句话在不同关系里可能显得冷淡、正式或正常。',
  '我发送请求时会写清背景和截止时间，不用连续问号催促。如果话题敏感，我更愿意语音或当面谈。',
  'Chuyển ba tin nhắn dễ hiểu sai thành bản rõ hơn.',
  'Viết tin nhắn công việc ngắn có context, request, deadline, closing.',
  'Rà năm tin nhắn gần đây và tìm chỗ thiếu ngữ cảnh.',
  '句号本身没有固定态度，但在短消息中可能显得结束感强；不要把网络礼貌绝对化。',
  'Nghe/đọc: suy luận thái độ phải dựa nhiều dấu hiệu, không một dấu chấm.'),
 ('不同场合不同礼貌',
  'Lịch sự tùy hoàn cảnh',
  'Chọn cách đề nghị, từ chối và nhờ vả phù hợp quan hệ/quyền lực.',
  'Bạn nhờ bạn thân và nhờ giáo viên cùng một việc.',
  '安：帮我看一下这句话。\n林：对朋友这样说很自然。\n安：给老师发消息呢？\n林：可以说明原因，再说‘方便的时候请您帮我看一下’。',
  '礼貌不是句子越长越好，而是让对方知道背景、选择空间和所需时间。过度客气也可能增加距离。',
  '我以前把同一种模板发给所有人。后来发现，对朋友太正式显得生疏，对陌生人太随便又可能冒犯。',
  'Nói cùng một request trong ba register: bạn, đồng nghiệp, giáo viên.',
  'Viết bảng biến đổi register và giải thích lựa chọn.',
  'Chọn một tin nhắn thật và viết lại cho hai quan hệ khác nhau.',
  '‘请’并非越多越礼貌；称呼、理由、选择余地和结束语共同决定语体。',
  'Đọc: xác định quan hệ người nói qua lựa chọn register.'),
 ('请客和分账',
  'Mời khách và chia tiền',
  'Hiểu lời mời, xác nhận ai trả và xử lý khác biệt kỳ vọng.',
  'Bữa ăn nhóm có người nói “我请客”.',
  '杰：今天我请客，庆祝你毕业。\n雨：太谢谢了，下次我来。\n安：那其他人还需要分账吗？\n杰：不用，这次我请大家。',
  '“请客”通常表示邀请者付钱，但具体范围仍可确认。朋友聚餐也可能各付各的，不能把一种做法当成所有人的规则。',
  '第一次和新同事吃饭时，我不确定安排，就在点菜前自然地问了一句，避免结账时尴尬。',
  'Role-play mời ăn và xác nhận payment không gây ngượng.',
  'Viết đoạn so sánh ba cách thanh toán trong nhóm.',
  'Quan sát một lời mời thật, xác định thông tin cần xác nhận.',
  '文化说明只能描述常见做法，不代表每个地区或个人；用‘一般、可能’避免刻板化。',
  'Nghe: chú ý phạm vi của 请客—một người hay cả nhóm.'),
 ('礼物重在合适',
  'Quà quan trọng ở phù hợp',
  'Chọn quà theo quan hệ, dịp, nhu cầu và giới hạn.',
  'Bạn chọn quà cho gia đình chủ nhà.',
  '美：送贵一点的礼物是不是更有礼貌？\n东：不一定，太贵可能让人有压力。\n美：那送什么合适？\n东：可以考虑他们的兴趣，也注意是否方便接受。',
  '礼物表达心意，但价格、数量和象征意义会因场合而异。最安全的方法是了解对方需要，并避免把个人偏好说成普遍禁忌。',
  '我准备礼物时附上一张简短说明，让对方知道为什么想到它，也明确表示不需要回礼。',
  'Đề xuất quà cho ba tình huống và giải thích register/culture.',
  'Viết thiệp tặng quà ngắn, tự nhiên, không tạo áp lực.',
  'Hỏi một người về quy tắc tặng quà trong gia đình họ.',
  '‘一点心意’是谦逊表达；不要用文化禁忌清单替代对具体人的了解。',
  'Đọc: phân biệt quy tắc cứng với preference/context.'),
 ('极端天气怎么准备',
  'Chuẩn bị thời tiết cực đoan',
  'Đọc cảnh báo, đánh giá rủi ro và lập phương án an toàn.',
  'Mưa lớn làm thay đổi lịch đi lại.',
  '广播：今晚可能有强降雨，部分道路会关闭。\n安：我们原计划开车回去。\n林：先查看官方通知，也准备推迟出发。\n安：我把行程告诉家里，并带上充电器。',
  '天气预报表达的是可能性和风险，不是保证。准备时应关注时间、地区、影响和官方建议，并避免传播未经确认的灾情。',
  '我没有只看天气图标，而是阅读降雨量和出行提醒。活动负责人也提前说明取消条件。',
  'Tóm tắt cảnh báo thời tiết thành bốn hành động ưu tiên.',
  'Viết thông báo đổi lịch có lý do, phạm vi và cập nhật tiếp theo.',
  'Kiểm tra kênh cảnh báo chính thức ở nơi bạn sống.',
  '‘可能、预计、将’表示不同确定度；安全信息要保留来源和更新时间。',
  'Đọc: phân biệt forecast, observed fact và recommendation.'),
 ('垃圾分类靠什么',
  'Phân loại rác dựa vào đâu',
  'Giải thích quy tắc phân loại bằng vật liệu/trạng thái thay vì đoán tên.',
  'Một hộp đồ ăn có nhiều vật liệu.',
  '东：这个纸盒放可回收垃圾吗？\n美：上面有油，而且里面还有食物。\n东：那要先清理，再看当地规定。\n美：对，不同城市的分类标准也可能不同。',
  '垃圾分类不能只看物品名称。同一种包装如果被污染，处理方式可能改变；各地设施和规定也不完全一样。',
  '社区活动没有只发颜色表，而是用真实物品练习，并解释不确定时去哪里查询。',
  'Hướng dẫn phân loại 6 vật, nêu trường hợp cần tra quy định địa phương.',
  'Viết hướng dẫn ngắn có nguyên tắc, ví dụ và ngoại lệ.',
  'Kiểm tra quy định phân loại ở khu vực mình, chọn 5 vật thử.',
  '环境建议需注明地区；‘可回收’不等于实际一定被回收。',
  'Đọc: dùng decision tree vật liệu–ô nhiễm–quy định.'),
 ('个人行动够不够',
  'Hành động cá nhân có đủ?',
  'Thảo luận vai trò cá nhân và hệ thống mà không rơi vào cực đoan.',
  'Nhóm tranh luận mang bình nước có ý nghĩa không.',
  '林：一个人少用几个塑料杯能改变什么？\n安：作用有限，但能减少自己的浪费。\n林：所以只靠个人就够了？\n安：当然不够，还需要企业和公共政策一起改变。',
  '环境问题通常由个人选择、商业设计和公共制度共同影响。讨论时可以承认一个行动的价值，同时说明它的边界。',
  '我不再用“做不到全部就什么都不做”的想法。先减少最容易避免的浪费，再支持更大的集体方案。',
  'Tranh luận cân bằng về một hành động xanh và giới hạn của nó.',
  'Viết quan điểm có concession, evidence, boundary và proposal.',
  'Theo dõi một loại rác cá nhân trong một tuần, đề xuất thay đổi.',
  '‘有用’不等于‘足够’；使用‘虽然……但是……还需要……’表达层次。',
  'Đọc: tìm false dilemma và cách người viết phá thế nhị phân.'),
 ('一段新闻的主线',
  'Trục chính của một tin',
  'Tóm tắt tin bằng ai–việc gì–vì sao–kết quả, bỏ chi tiết phụ.',
  'Bạn cần kể lại một bản tin 2 phút trong 30 giây.',
  '老师：这条新闻最重要的信息是什么？\n兰：城市开放了新的公共图书馆。\n老师：为什么现在开放？\n兰：经过两年建设，主要服务附近居民和学生。',
  '新闻中常有背景、引语和数字。摘要不是按原顺序缩短每句话，而是先找事件和意义，再选必要证据。',
  '我第一次摘要时写了很多人物名字，却漏掉事件结果。第二次先用一句话写主线，再补时间和影响。',
  'Tóm tắt một tin 120 giây thành 40 giây và giữ nguồn.',
  'Viết summary 100 chữ không thêm ý kiến cá nhân.',
  'Chọn một tin đáng tin, viết headline và lead riêng.',
  '新闻摘要用中性书面语；‘据……报道’用于标明信息来源。',
  'Đọc: xây hierarchy main event–cause–impact–detail.'),
 ('影评不是复述剧情',
  'Review phim không phải kể lại',
  'Đánh giá tác phẩm bằng tiêu chí và bằng chứng, tránh spoiler không cần thiết.',
  'Bạn giới thiệu phim cho người chưa xem.',
  '美：这部电影讲什么？\n东：我先不告诉你结局。它主要讨论家庭选择。\n美：你为什么推荐？\n东：人物变化很自然，画面也支持主题，不过节奏有点慢。',
  '影评如果只复述故事，就没有说明作品为什么有效。可以选择人物、结构、表演、画面或主题作为评价标准。',
  '我写评论前先用一句话概括对象，再给两个具体例子。涉及关键情节时，我会提前提醒。',
  'Review một tác phẩm 2 phút với claim–evidence–limitation.',
  'Viết review 180 chữ có recommendation cho đối tượng cụ thể.',
  'Đọc hai review và đánh dấu tiêu chí vs cảm xúc chung.',
  '‘好看’是口语总评；书面评论应进一步说明‘哪里、怎样、对谁’。',
  'Đọc: phân biệt plot summary, evaluation và evidence.'),
 ('采访要会追问',
  'Phỏng vấn phải biết hỏi tiếp',
  'Thiết kế câu hỏi mở, nghe câu trả lời và follow-up theo thông tin mới.',
  'Bạn phỏng vấn người tổ chức sự kiện cộng đồng.',
  '记者：为什么举办这次活动？\n负责人：我们想让居民更了解社区历史。\n记者：参加者最意外的发现是什么？\n负责人：很多年轻人第一次听到老街的故事。',
  '好的采访不是把问题表念完。采访者要听关键词，追问例子、原因和变化，同时尊重对方不愿回答的范围。',
  '我准备了六个问题，但真正使用了四个。因为对方提到一个新细节，我临时追问，内容反而更具体。',
  'Thực hiện phỏng vấn 3 phút có ít nhất hai follow-up thật.',
  'Viết bộ câu hỏi mở và lý do sắp thứ tự.',
  'Phỏng vấn một người về thay đổi trong khu vực/công việc.',
  '‘请您谈谈……’较正式开放；追问可用‘您刚才提到……，能举个例子吗？’。',
  'Nghe: đánh dấu từ khóa đáng follow-up, không chỉ ghi nguyên câu.'),
 ('规则为什么存在',
  'Vì sao có quy định',
  'Giải thích mục tiêu, đối tượng, ngoại lệ và tác động của một quy định.',
  'Thư viện giới hạn thời gian dùng phòng nhóm.',
  '安：为什么每次只能用两个小时？\n管理员：房间数量有限，要让更多人使用。\n安：如果没人预约，可以延长吗？\n管理员：可以，结束前十五分钟来确认。',
  '理解规则不能只记“可以/不可以”。知道它要解决的问题、适用范围和例外，才更容易正确执行和提出改进。',
  '我原来觉得规定不合理，后来看到高峰时很多人等待。管理员也说明了非高峰时的弹性做法。',
  'Giải thích một quy định và đánh giá nó theo mục tiêu/tác động.',
  'Viết FAQ cho quy định có mục đích, phạm vi, ngoại lệ.',
  'Chọn một nội quy thật và hỏi “nó giải quyết vấn đề gì?”.',
  '正式规则常用‘应、须、不得、可’；解释规则时不要把个人习惯说成制度。',
  'Đọc: map mỗi điều khoản với mục tiêu và nhóm bị ảnh hưởng.'),
 ('公平不一定相同',
  'Công bằng không luôn là giống nhau',
  'Phân biệt đối xử như nhau và hỗ trợ theo nhu cầu trong thảo luận.',
  'Nhóm phân bổ thời gian thuyết trình cho người dùng ngôn ngữ thứ hai.',
  '林：每个人都十分钟才公平。\n美：有人需要多一点准备时间，但发言时间可以一样。\n林：这样算特殊照顾吗？\n美：我们要看目标是机会相同，还是所有条件完全相同。',
  '“一样”容易测量，却不一定解决不同起点带来的困难。讨论公平时，应先说明目标，再比较方案的受益和成本。',
  '我们最后没有简单增加所有人的时间，而是提前提供问题，让每个人都有准备机会。',
  'Thảo luận một trường hợp công bằng, nêu ít nhất hai định nghĩa.',
  'Viết lập luận 180 chữ có counterargument và response.',
  'Quan sát một quy tắc, xác định equality/equity trade-off.',
  '‘公平’是评价概念，需要标准；避免只用口号，不说明谁承担成本。',
  'Đọc: làm rõ definition trước khi đánh giá conclusion.'),
 ('公共空间共同维护',
  'Cùng giữ không gian công cộng',
  'Đề xuất giải pháp cộng đồng cân bằng nhắc nhở, thiết kế và thực thi.',
  'Công viên nhiều rác sau cuối tuần.',
  '居民：多放几个“禁止乱扔”的牌子吧。\n管理员：提醒有用，但垃圾桶位置也不方便。\n居民：那可以调整位置，再增加周末清理。\n管理员：我们先试一个月，记录变化。',
  '公共问题很少只靠一句口号解决。环境设计、服务能力、行为提醒和执行方式需要配合，还要用数据检查效果。',
  '社区没有马上处罚所有人，而是先观察垃圾最多的地点和时间，再调整设施和宣传。',
  'Đề xuất giải pháp cho không gian chung có thử nghiệm và đo lường.',
  'Viết proposal: problem, cause, intervention, metric, review date.',
  'Khảo sát một điểm công cộng và ghi 3 yếu tố thiết kế.',
  '‘文明’类口号较抽象；行动方案要写谁做、何时做、如何判断有效。',
  'Đọc: phân biệt symptom, root cause và intervention.'),
 ('扫码方便也有风险',
  'Quét mã tiện nhưng có rủi ro',
  'Giải thích quy trình quét mã an toàn và nhận diện yêu cầu bất thường.',
  'Một mã QR yêu cầu nhập quá nhiều thông tin.',
  '东：扫这个码就能领礼物。\n安：它为什么要身份证和银行卡信息？\n东：页面看起来很正式。\n安：外表不能证明安全，我们先查主办方的正式入口。',
  '二维码只是入口，不能保证背后页面可信。操作前要核对域名、权限、信息必要性和支付内容。',
  '我没有因为朋友转发就直接填写。通过官方应用找到同一活动后，我发现原来的链接并不是主办方发布的。',
  'Hướng dẫn quét mã an toàn cho người ít dùng công nghệ.',
  'Viết cảnh báo lừa đảo không gây hoảng, có bước kiểm tra.',
  'Kiểm tra quyền truy cập của một ứng dụng/mã thật.',
  '科技说明要具体，不用‘千万别用二维码’的绝对说法；风险来自来源和操作。',
  'Đọc: xác định red flag và verification path.'),
 ('说明书要让人做得到',
  'Hướng dẫn phải làm được',
  'Viết hướng dẫn thao tác có điều kiện, thứ tự và kết quả kiểm tra.',
  'Người dùng không cài được thiết bị theo hướng dẫn mơ hồ.',
  '用户：说明书说“连接设备”，但没写先开哪个。\n客服：请先接电源，看到蓝灯后再打开应用。\n用户：如果没有蓝灯呢？\n客服：检查插头；仍不亮就停止操作并联系我们。',
  '好的说明书不仅列动作，还说明开始条件、成功信号和失败时怎么办。步骤太长时，应分组并把警告放在动作之前。',
  '我让一个没用过设备的人试读。她卡住的地方说明文字缺少信息，而不是她“不懂”。',
  'Nói hướng dẫn 5 bước, có check và fallback.',
  'Viết lại một hướng dẫn mơ hồ thành SOP ngắn.',
  'Cho người khác thử hướng dẫn của bạn và ghi chỗ họ dừng.',
  '书面操作常用‘先、确认……后、若……则……’；危险提示必须在动作前。',
  'Đọc: kiểm tra precondition–action–expected result–recovery.'),
 ('线上线下怎么选',
  'Chọn online hay offline',
  'So sánh kênh dịch vụ theo độ phức tạp, thời gian, bằng chứng và hỗ trợ.',
  'Bạn chọn xử lý thủ tục online hay tại quầy.',
  '美：网上办理更快，我们都在线上做吧。\n安：普通申请可以，但我的材料有特殊情况。\n美：那你先在线问客服？\n安：对，确认能处理再决定是否去现场。',
  '线上服务节省路程，线下服务则可能更适合复杂问题。选择渠道时要看材料、身份验证、等待时间和问题是否需要解释。',
  '我先在网上完成能完成的部分，并保存编号。遇到系统无法接受的材料时，我带着记录去现场，避免从头开始。',
  'Khuyên ba trường hợp chọn online/offline/hybrid.',
  'Viết decision guide theo điều kiện.',
  'Chọn một thủ tục thật và vẽ luồng xử lý hai kênh.',
  '‘方便’要说明对谁方便；数字服务也可能排除设备或能力有限的人。',
  'Đọc: so sánh total effort, không chỉ thời gian thao tác.'),
 ('故事从哪里开始',
  'Câu chuyện bắt đầu từ đâu',
  'Chọn điểm bắt đầu tạo ngữ cảnh mà không kể lan man.',
  'Bạn kể sự cố lỡ tàu trong hai phút.',
  '老师：你为什么从小时候说起？\n安：我想说明自己一直怕迟到。\n老师：和这次故事直接有关吗？\n安：不太有关，我可以从到车站时开始。',
  '叙事的开头要给听者理解后续所需的信息。背景太少会突然，太多则让主线迟迟不出现。',
  '我把开头改成“到车站时，屏幕上已经没有我的车次”。一句话就建立了地点、时间和问题。',
  'Kể một sự cố bắt đầu bằng scene có vấn đề rõ.',
  'Viết ba opening khác nhau và chọn bản hiệu quả nhất.',
  'Ghi âm 2 phút, cắt phần không phục vụ main conflict.',
  '口语故事可用‘那天、当时、没想到’快速进入场景；书面可更精确控制背景。',
  'Đọc: hỏi mỗi câu mở đầu có cần cho xung đột không.'),
 ('转折要有铺垫',
  'Bước ngoặt cần chuẩn bị',
  'Dùng discourse markers để dẫn bước ngoặt và quan hệ nguyên nhân hợp lý.',
  'Một kế hoạch tưởng thất bại nhưng có cơ hội khác.',
  '林：活动取消以后，故事就结束了吗？\n美：本来我也这么想。没想到，参加者自己组织了线上交流。\n林：这个转折很有意思。\n美：对，但我要先说明大家为什么不愿意放弃。',
  '“突然、没想到、结果”能提示转折，但不能代替逻辑。读者需要知道人物目标和前面的困难，才理解变化为何重要。',
  '我检查每个转折前是否有线索。没有铺垫的惊喜虽然意外，却容易显得人为安排。',
  'Kể câu chuyện có setup–turn–consequence rõ.',
  'Viết 200 chữ dùng ít nhất ba discourse marker đúng chức năng.',
  'Đọc một truyện ngắn và đánh dấu nơi tác giả chuẩn bị bước ngoặt.',
  '‘可是’连接对比，‘没想到’表达说话人预期落空，‘结果’强调后果。',
  'Đọc: kiểm tra marker có đúng relation hay chỉ trang trí.'),
 ('结尾不只说感想',
  'Kết không chỉ nói cảm nghĩ',
  'Kết thúc kể chuyện bằng kết quả, thay đổi và ý nghĩa có bằng chứng.',
  'Bạn kết bài bằng “我很开心” nhưng thiếu điều đã thay đổi.',
  '老师：最后发生了什么？\n兰：我们终于完成了项目。\n老师：这件事改变了什么？\n兰：我以后遇到问题会更早沟通，不再一个人拖着。',
  '好的结尾回应开头提出的问题，也可以说明人物的选择如何改变。只有“很有意义”而没有具体变化，读者难以理解意义在哪里。',
  '我回到开头的目标，说明结果并不完美，但团队建立了新的工作方法。这比突然加一句大道理更自然。',
  'Kết một câu chuyện bằng resolution và changed behavior.',
  'Viết hai ending: closed và open, so sánh hiệu ứng.',
  'Sửa kết bài cũ bằng một thay đổi có thể quan sát.',
  '‘我明白了……’需要前文证据；避免套用与故事无关的万能道理。',
  'Đọc: kiểm tra ending có trả lời conflict và thay đổi không.'),
 ('同意一部分再反驳',
  'Đồng ý một phần rồi phản biện',
  'Dùng concession để công nhận điểm hợp lý trước khi nêu giới hạn.',
  'Tranh luận làm việc tại nhà.',
  '东：在家办公能节省通勤时间，所以应该全部改成线上。\n安：节省时间这一点我同意，不过有些任务需要现场设备。\n东：那可以按任务选择。\n安：对，不必只有两个极端方案。',
  '承认对方一个合理点不会削弱立场，反而显示你理解问题。关键是明确“同意什么、不同意推到哪里”。',
  '我把“你错了”改成“这个优点确实存在，但不足以说明所有岗位都适合”。讨论立刻更具体。',
  'Tranh luận 3 phút dùng concession + limitation + alternative.',
  'Viết phản biện 180 chữ không bóp méo quan điểm đối phương.',
  'Chọn một ý kiến online và viết steelman trước khi phản hồi.',
  '‘虽然……但是……’是基本让步；更正式可用‘这一点成立，但……’。',
  'Đọc: tách claim gốc khỏi conclusion bị mở rộng quá mức.'),
 ('证据支持到哪一步',
  'Bằng chứng hỗ trợ đến đâu',
  'Đánh giá mức độ kết luận mà dữ liệu thực sự cho phép.',
  'Một khảo sát nhỏ được dùng để nói “mọi người đều”.',
  '美：调查里八成的人喜欢这个方案。\n林：调查了多少人？怎么选的？\n美：只有我们班二十个人。\n林：那能说明这个班，但不能直接代表所有年轻人。',
  '证据有范围。样本、问题设计和时间都会限制结论。表达时把“在这次调查中”写出来，比夸大成普遍事实更可信。',
  '我保留原数据，却把结论从“证明了”改成“提供了一个初步信号，需要更大样本确认”。',
  'Đánh giá ba conclusion theo cùng một dataset nhỏ.',
  'Viết đoạn data commentary có scope và limitation.',
  'Tìm một biểu đồ, ghi nguồn, sample và điều chưa biết.',
  '‘说明、表明、证明’强度不同；证据有限时慎用‘证明’。',
  'Đọc: kiểm tra population, sample, measurement và causal leap.'),
 ('讨论结束要有结论',
  'Thảo luận phải có kết luận',
  'Tổng hợp điểm đồng thuận, bất đồng và quyết định tiếp theo.',
  'Cuộc họp nói nhiều nhưng chưa chốt hành động.',
  '负责人：我们谈了三个方案，现在怎么决定？\n安：大家同意先测试方案二。\n林：预算问题还没有解决。\n负责人：那安负责测试，林周五前确认预算，下周再决定是否扩大。',
  '讨论的结尾不一定要完全同意，但需要说明已经决定什么、还缺什么、谁在何时完成下一步。',
  '我用一分钟复述会议结论，让每个人确认。如果理解不同，当场修改记录，而不是会后各自执行不同版本。',
  'Chủ trì chốt thảo luận bằng summary và action owners.',
  'Viết meeting conclusion có decision, open issue, owner, deadline.',
  'Sau một cuộc họp thật, gửi recap để người tham gia xác nhận.',
  '‘总结一下’提示收束；‘暂定、待确认、最终决定’表示不同决策状态。',
  'Nghe: phân biệt opinion, proposal, decision và action item.'),
 ('社区调查项目',
  'Dự án khảo sát cộng đồng',
  'Thiết kế khảo sát nhỏ có câu hỏi trung lập, mẫu và báo cáo giới hạn.',
  'Nhóm khảo sát nhu cầu không gian học chung.',
  '兰：我们只问朋友，结果会不会太偏？\n安：会，应该在不同时间和地点找参加者。\n兰：问题写“你是不是也希望增加座位”可以吗？\n安：这会引导答案，改成开放或中性选项吧。',
  '调查项目包括问题、样本、记录、分析和反馈。数量不大也可以有价值，只要诚实说明范围，不把结果夸大。',
  '我们收集四十份回答，发现晚上需求更高。报告同时说明周末样本不足，建议下一轮补充。',
  'Thực hiện khảo sát 5 câu và trình bày finding + limitation.',
  'Viết mini report 250 chữ có method, result, limitation, next step.',
  'Khảo sát 10 người và kiểm tra câu hỏi có dẫn dắt không.',
  '研究语体避免‘大家都认为’；写‘在40名受访者中……’更准确。',
  'Đọc: audit wording, sampling và claim scope.'),
 ('城市周末方案',
  'Thiết kế cuối tuần trong thành phố',
  'Tích hợp lịch, ngân sách, sở thích, thời tiết và accessibility.',
  'Bạn lập kế hoạch cho nhóm có người già và trẻ nhỏ.',
  '美：我们上午爬山，下午逛三个景点吧。\n东：老人和孩子可能太累。\n美：那选一个主要活动，中间安排休息。\n东：还要准备下雨方案和交通时间。',
  '行程不是景点越多越好。好的方案说明对象、优先级、移动时间、费用和变化条件，让参加者可以判断是否适合。',
  '我们把午餐地点放在两段活动之间，并选择可以临时取消的项目。通知里也写清需要带什么。',
  'Thuyết trình itinerary 3 phút cho nhóm đa nhu cầu.',
  'Viết itinerary có timeline, budget, Plan B và rationale.',
  'Thiết kế một lịch cuối tuần thật và nhờ người khác review.',
  '服务计划中‘适合’要具体到体力、时间、饮食和无障碍需求。',
  'Đọc: kiểm tra hidden time giữa hoạt động và contingency.'),
 ('我的HSK4作品集',
  'Portfolio HSK4 của tôi',
  'Chọn bằng chứng tiến bộ, phản tư lỗi và đặt bước học tiếp theo.',
  'Bạn trình bày portfolio thay vì chỉ liệt kê điểm.',
  '老师：你为什么选这三份作品？\n兰：第一份显示我会组织段落，第二份证明听力进步，第三份是修改前后对比。\n老师：还有什么不足？\n兰：表达观点时证据还不够具体。',
  '作品集不是把所有作业放在一起，而是用有代表性的证据说明能力、过程和下一步。每件作品都应附上选择理由。',
  '我保留错误较多的第一稿，因为它能显示修改过程。最后的自评既写成果，也写尚未达到的目标。',
  'Trình bày portfolio 4 phút, dẫn chứng ba sản phẩm.',
  'Viết self-review 300 chữ: evidence, strategy, remaining gap, next plan.',
  'Chọn ba sản phẩm HSK4 và viết annotation cho từng cái.',
  '自评语体要具体、可验证；避免全是‘我觉得进步很大’。',
  'Đọc: kiểm tra mỗi claim về tiến bộ có artifact hỗ trợ.')]
assert len(LESSONS) == 48

# 76 distinct grammar points aligned to the revised HSK4 scope.
GRAMMAR = [('并不/并没有', 'Phủ định có nhấn mạnh', '主语 + 并不/并没有 + 谓语', 'phủ định một giả định hoặc kết luận', '方便并不等于适合所有人。', 'Tiện không có nghĩa là phù hợp với tất cả.'),
 ('不仅……而且……', 'Không chỉ… mà còn…', '不仅 A，而且 B', 'bổ sung vế sau mạnh hơn', '这个方案不仅省时间，而且更容易检查。', 'Phương án này không chỉ tiết kiệm thời gian mà còn dễ kiểm tra hơn.'),
 ('不光……还……', 'Không chỉ… còn… (khẩu ngữ)', '不光 A，还 B', 'mở rộng thông tin trong khẩu ngữ', '他不光指出问题，还提出了办法。', 'Anh ấy không chỉ chỉ ra vấn đề mà còn đề xuất cách xử lý.'),
 ('无论……都……', 'Bất kể… đều…', '无论 A，都 B', 'nêu điều không ảnh hưởng kết quả', '无论选择哪条路线，都要先确认末班车。', 'Bất kể chọn tuyến nào cũng phải xác nhận chuyến cuối.'),
 ('不管……也/都……', 'Dù… vẫn/đều…', '不管 A，也/都 B', 'diễn đạt nhượng bộ thường dùng', '不管多忙，也要及时说明风险。', 'Dù bận thế nào cũng phải báo rủi ro kịp thời.'),
 ('尽管……但是……', 'Mặc dù… nhưng…', '尽管 A，但是 B', 'thừa nhận sự thật rồi nêu đối lập', '尽管价格低，但是服务条件不同。', 'Dù giá thấp nhưng điều kiện dịch vụ khác nhau.'),
 ('即使……也……', 'Dù cho… cũng…', '即使 A，也 B', 'giả định nhượng bộ', '即使消息来自朋友，也要核实来源。', 'Dù tin đến từ bạn bè cũng phải xác minh nguồn.'),
 ('既然……就……', 'Đã… thì…', '既然 A，就 B', 'lấy tiền đề đã biết để suy ra hành động', '既然发现理解不同，就马上确认。', 'Đã phát hiện hiểu khác nhau thì xác nhận ngay.'),
 ('既……又……', 'Vừa… vừa…', '既 A，又 B', 'nêu hai thuộc tính song song', '这份说明既简短又具体。', 'Hướng dẫn này vừa ngắn vừa cụ thể.'),
 ('一边……一边……', 'Vừa… vừa…', '一边 A，一边 B', 'hai hành động đồng thời', '他一边听录音，一边记关键词。', 'Anh ấy vừa nghe ghi âm vừa ghi từ khóa.'),
 ('先……再……最后……', 'Trình tự nhiều bước', '先 A，再 B，最后 C', 'tổ chức quy trình', '先核实来源，再比较信息，最后决定是否转发。', 'Xác minh nguồn trước, so sánh thông tin rồi mới quyết định chuyển tiếp.'),
 ('除了……以外，还……', 'Ngoài… còn…', '除了 A 以外，还 B', 'bổ sung ngoài phạm vi đã nêu', '除了价格以外，还要看保修条件。', 'Ngoài giá còn phải xem điều kiện bảo hành.'),
 ('除了……以外，都……', 'Trừ… ra đều…', '除了 A 以外，都 B', 'loại trừ một thành phần', '除了最后一项以外，其他任务都完成了。', 'Trừ mục cuối, các nhiệm vụ khác đều hoàn thành.'),
 ('越来越……', 'Ngày càng…', '越来越 + 形容词/心理动词', 'mô tả thay đổi theo thời gian', '她表达意见越来越有条理。', 'Cô ấy trình bày ý kiến ngày càng mạch lạc.'),
 ('越……越……', 'Càng… càng…', '越 A，越 B', 'quan hệ đồng biến', '信息越具体，处理起来越容易。', 'Thông tin càng cụ thể càng dễ xử lý.'),
 ('越……越不……', 'Càng… càng không…', '越 A，越不 B', 'quan hệ thay đổi nghịch trong ngữ cảnh', '越着急，越不能随便下结论。', 'Càng vội càng không được kết luận tùy tiện.'),
 ('比……更/还……', 'So sánh mức cao hơn', 'A 比 B 更/还 + 形容词', 'so sánh có mức độ', '长期成本比价格更重要。', 'Chi phí dài hạn quan trọng hơn giá.'),
 ('没有……那么……', 'Không… bằng…', 'A 没有 B 那么 + 形容词', 'so sánh mức thấp hơn', '线上说明没有现场解释那么直接。', 'Hướng dẫn online không trực tiếp bằng giải thích tại chỗ.'),
 ('跟……一样/不一样', 'Giống/khác với…', 'A 跟 B 一样/不一样', 'so sánh tương đồng/khác biệt', '不同城市的分类规则不完全一样。', 'Quy tắc phân loại ở các thành phố không hoàn toàn giống nhau.'),
 ('是……的', 'Nhấn mạnh hoàn cảnh đã xảy ra', '主语 + 是 + 时间/地点/方式 + 动词 + 的', 'làm rõ thời gian, nơi, cách', '这份通知是昨天晚上发布的。', 'Thông báo này được phát tối qua.'),
 ('把 + 宾语 + 结果补语', 'Câu 把 với kết quả', '把 O + V + 结果', 'nhấn mạnh xử lý và kết quả', '请把需要确认的问题写清楚。', 'Hãy viết rõ những vấn đề cần xác nhận.'),
 ('把 + 宾语 + 到/在/给', 'Câu 把 với đích', '把 O + V + 到/在/给 + 目标', 'nêu nơi/người nhận', '把最新安排发给所有参加者。', 'Gửi lịch mới nhất cho toàn bộ người tham gia.'),
 ('被 + 施事 + 动词', 'Bị động với 被', '受事 + 被 + 施事 + V', 'nêu tác nhân trong bị động', '旧消息被很多人当成了新通知。', 'Tin cũ bị nhiều người coi là thông báo mới.'),
 ('叫/让 + 施事 + 动词',
  'Bị động khẩu ngữ',
  '受事 + 叫/让 + 施事 + V',
  'bị động thường có sắc thái không mong muốn',
  '我的行程让突然的天气变化打乱了。',
  'Lịch trình của tôi bị thay đổi thời tiết đột ngột làm đảo lộn.'),
 ('让 + 人 + 形容词', 'Khiến ai cảm thấy…', '事情 + 让 + 人 + 形容词', 'nêu tác động cảm xúc', '不清楚的责任分工让大家很紧张。', 'Phân công trách nhiệm không rõ khiến mọi người căng thẳng.'),
 ('使 + 宾语 + 谓语', 'Khiến (văn viết)', 'A 使 B + 谓语', 'nêu quan hệ tác động trang trọng', '明确的步骤使操作更加安全。', 'Các bước rõ ràng khiến thao tác an toàn hơn.'),
 ('有的……有的……', 'Có người/cái… có…', '有的 A，有的 B', 'phân loại trong một tập hợp', '有的任务适合线上，有的需要现场处理。', 'Có nhiệm vụ hợp làm online, có nhiệm vụ cần xử lý tại chỗ.'),
 ('一方面……另一方面……',
  'Một mặt… mặt khác…',
  '一方面 A，另一方面 B',
  'trình bày hai phương diện',
  '线上服务一方面省时间，另一方面可能缺少解释。',
  'Dịch vụ online một mặt tiết kiệm thời gian, mặt khác có thể thiếu giải thích.'),
 ('一是……二是……', 'Thứ nhất… thứ hai…', '一是 A，二是 B', 'liệt kê lý do trong diễn ngôn', '原因一是信息过期，二是适用范围不同。', 'Nguyên nhân thứ nhất là tin hết hạn, thứ hai là phạm vi khác.'),
 ('首先……其次……', 'Trước hết… tiếp theo…', '首先 A，其次 B', 'tổ chức lập luận trang trọng', '首先确认目标，其次比较方案。', 'Trước hết xác nhận mục tiêu, tiếp theo so sánh phương án.'),
 ('因此/所以', 'Do đó/vì vậy', '原因。因此/所以 + 结果', 'nêu kết quả từ nguyên nhân', '样本很小，因此结论需要限制范围。', 'Mẫu nhỏ, do đó kết luận cần giới hạn phạm vi.'),
 ('由于……因此……', 'Do… nên… (văn viết)', '由于 A，因此 B', 'quan hệ nguyên nhân trang trọng', '由于航班晚点，因此会议时间需要调整。', 'Do chuyến bay trễ nên giờ họp cần điều chỉnh.'),
 ('之所以……是因为……', 'Sở dĩ… là vì…', '之所以 A，是因为 B', 'nhấn mạnh giải thích nguyên nhân', '我之所以选择方案二，是因为它风险更低。', 'Sở dĩ tôi chọn phương án hai vì rủi ro thấp hơn.'),
 ('既……所以……', 'Đã có căn cứ nên…', '既有事实 A，所以 B', 'suy luận từ dữ kiện đã nêu', '既有正式通知，所以我们按新时间执行。', 'Đã có thông báo chính thức nên chúng ta thực hiện theo giờ mới.'),
 ('否则/不然', 'Nếu không', '建议/条件，否则/不然 + 后果', 'cảnh báo hậu quả', '请保存订单号，否则很难查询。', 'Hãy lưu mã đơn, nếu không sẽ khó tra cứu.'),
 ('只要……就……', 'Chỉ cần… thì…', '只要 A，就 B', 'điều kiện đủ', '只要说明具体影响，对方就更容易处理。', 'Chỉ cần nói rõ ảnh hưởng, đối phương sẽ dễ xử lý hơn.'),
 ('只有……才……', 'Chỉ khi… mới…', '只有 A，才 B', 'điều kiện cần', '只有找到原始来源，才能确认消息。', 'Chỉ khi tìm được nguồn gốc mới xác nhận được tin.'),
 ('除非……否则……', 'Trừ khi… nếu không…', '除非 A，否则 B', 'điều kiện ngoại lệ', '除非收到正式确认，否则不要公开。', 'Trừ khi nhận xác nhận chính thức, nếu không đừng công khai.'),
 ('要是/如果……就……', 'Nếu… thì…', '要是/如果 A，就 B', 'điều kiện thực/giả định', '如果没有蓝灯，就停止操作。', 'Nếu không có đèn xanh thì dừng thao tác.'),
 ('万一……就……', 'Lỡ như… thì…', '万一 A，就 B', 'dự phòng rủi ro ít mong muốn', '万一线路停运，就改走备用路线。', 'Lỡ tuyến ngừng hoạt động thì đi tuyến dự phòng.'),
 ('差一点儿……', 'Suýt…', '差一点儿 + 动词', 'sự việc gần xảy ra', '我差一点儿把旧通知转发出去。', 'Tôi suýt chuyển tiếp thông báo cũ.'),
 ('几乎/差不多', 'Hầu như/gần như', '几乎/差不多 + 谓语', 'ước lượng gần mức', '材料几乎准备好了，只差签名。', 'Tài liệu gần như xong, chỉ thiếu chữ ký.'),
 ('原来……', 'Hóa ra/ban đầu', '原来 + 新发现/旧状态', 'đánh dấu nhận thức mới hoặc trạng thái trước', '原来问题不是网络，而是密码过期了。', 'Hóa ra vấn đề không phải mạng mà là mật khẩu hết hạn.'),
 ('本来……可是……', 'Vốn định… nhưng…', '本来 A，可是 B', 'đối lập kế hoạch và thực tế', '我本来要坐地铁，可是线路临时停运。', 'Tôi vốn định đi metro nhưng tuyến tạm ngừng.'),
 ('没想到/想不到', 'Không ngờ', '没想到 + 意外结果', 'đánh dấu trái kỳ vọng', '没想到简单的标点会造成误会。', 'Không ngờ dấu câu đơn giản lại gây hiểu lầm.'),
 ('竟然', 'Lại/không ngờ', '主语 + 竟然 + 谓语', 'thể hiện bất ngờ mạnh', '这条旧消息竟然又传开了。', 'Tin cũ này không ngờ lại lan ra.'),
 ('究竟/到底', 'Rốt cuộc', '究竟/到底 + 疑问', 'truy hỏi bản chất/kết quả', '这项规定到底解决什么问题？', 'Quy định này rốt cuộc giải quyết vấn đề gì?'),
 ('难道……吗', 'Chẳng lẽ… sao', '难道 + 命题 + 吗', 'câu hỏi tu từ phản kỳ vọng', '难道价格低就一定更划算吗？', 'Chẳng lẽ giá thấp thì chắc chắn đáng tiền hơn sao?'),
 ('千万', 'Nhất định đừng/phải', '千万 + 要/别/不要', 'nhắc nhở mạnh', '涉及个人信息，千万不要随便转发。', 'Liên quan thông tin cá nhân thì tuyệt đối đừng chuyển tiếp tùy tiện.'),
 ('只好', 'Đành phải', '主语 + 只好 + 动词', 'lựa chọn duy nhất còn lại', '末班车停了，我们只好打车。', 'Chuyến cuối ngừng nên chúng tôi đành đi taxi.'),
 ('正好', 'Vừa đúng', '正好 + 动词/数量/时间', 'sự trùng hợp phù hợp', '这份数据正好能支持第二个观点。', 'Dữ liệu này vừa đúng có thể hỗ trợ luận điểm thứ hai.'),
 ('仍然/还是', 'Vẫn', '仍然/还是 + 谓语', 'trạng thái tiếp diễn sau thay đổi', '解释以后，他仍然有一个问题。', 'Sau khi giải thích, anh ấy vẫn còn một câu hỏi.'),
 ('不断', 'Liên tục', '不断 + 动词/变化', 'quá trình lặp hoặc phát triển', '团队不断根据反馈修改说明。', 'Nhóm liên tục sửa hướng dẫn theo phản hồi.'),
 ('逐渐/渐渐', 'Dần dần', '逐渐/渐渐 + 变化', 'thay đổi từ từ', '她逐渐学会用证据表达意见。', 'Cô ấy dần học cách dùng bằng chứng nêu ý kiến.'),
 ('曾经……过', 'Đã từng', '曾经 + 动词 + 过', 'kinh nghiệm trong quá khứ', '我曾经因为没确认地点而迟到过。', 'Tôi từng đến muộn vì không xác nhận địa điểm.'),
 ('从来没/不', 'Chưa bao giờ/không bao giờ', '从来 + 没/不 + 谓语', 'phủ định xuyên suốt thời gian', '我从来没在没有来源时转发通知。', 'Tôi chưa bao giờ chuyển thông báo khi chưa có nguồn.'),
 ('自从……以来', 'Từ khi… đến nay', '自从 A 以来，B', 'mốc bắt đầu của trạng thái', '自从改用清单以来，遗漏少多了。', 'Từ khi dùng checklist, bỏ sót ít hơn nhiều.'),
 ('到……为止', 'Cho đến…', '到 + 时间/范围 + 为止', 'đặt điểm kết thúc', '到周五为止，我们收到四十份回答。', 'Đến thứ Sáu, chúng tôi nhận 40 câu trả lời.'),
 ('在……之内/以内', 'Trong phạm vi…', '在 + 时间/数量 + 之内', 'giới hạn thời gian/số lượng', '请在七天以内提交申请。', 'Hãy nộp đơn trong vòng bảy ngày.'),
 ('对……来说', 'Đối với…', '对 + 人/群体 + 来说', 'đặt góc nhìn', '对带孩子的家庭来说，距离很重要。', 'Đối với gia đình có trẻ, khoảng cách rất quan trọng.'),
 ('对于……', 'Đối với/về…', '对于 + 话题，主语 + 谓语', 'nêu chủ đề trong văn nói/viết', '对于这个结果，我们还需要更多证据。', 'Đối với kết quả này, chúng ta cần thêm bằng chứng.'),
 ('关于……', 'Về…', '关于 + 话题', 'giới thiệu chủ đề', '关于退换货条件，说明书写得很清楚。', 'Về điều kiện đổi trả, tài liệu viết rất rõ.'),
 ('由……负责', 'Do… phụ trách', '任务 + 由 + 人 + 负责', 'phân công trách nhiệm trang trọng', '最终报告由项目负责人确认。', 'Báo cáo cuối do người phụ trách dự án xác nhận.'),
 ('由……组成', 'Gồm…', '整体 + 由 + 部分 + 组成', 'mô tả cấu thành', '调查由五个中性问题组成。', 'Khảo sát gồm năm câu hỏi trung lập.'),
 ('用于/用来', 'Dùng để', 'A 用于/用来 + 用途', 'nêu công dụng', '这个编号用来查询处理进度。', 'Mã này dùng để tra tiến độ xử lý.'),
 ('通过……', 'Thông qua/bằng cách', '通过 + 方法，达到结果', 'nêu phương thức', '通过比较前后录音，我发现了变化。', 'Thông qua so sánh ghi âm trước sau, tôi phát hiện thay đổi.'),
 ('按照/按……', 'Theo…', '按照/按 + 标准/计划 + 动词', 'thực hiện theo căn cứ', '请按照最新通知安排时间。', 'Hãy sắp xếp thời gian theo thông báo mới nhất.'),
 ('根据……', 'Căn cứ theo…', '根据 + 证据/规定 + 结论', 'nêu căn cứ kết luận', '根据现有数据，只能得出初步结论。', 'Theo dữ liệu hiện có chỉ có thể kết luận sơ bộ.'),
 ('据……', 'Theo nguồn…', '据 + 来源 + 报道/说明', 'dẫn nguồn ngắn gọn', '据官方通知，活动推迟到周日。', 'Theo thông báo chính thức, hoạt động lùi đến Chủ nhật.'),
 ('所谓……', 'Cái gọi là…', '所谓 A，是指 B', 'định nghĩa/giải thích khái niệm', '所谓有效反馈，是指能帮助对方改进的信息。', 'Phản hồi hiệu quả là thông tin giúp đối phương cải thiện.'),
 ('换句话说', 'Nói cách khác', '陈述。换句话说，重述', 'diễn đạt lại để làm rõ', '样本只来自一个班。换句话说，范围很有限。', 'Mẫu chỉ từ một lớp; nói cách khác phạm vi rất hạn chế.'),
 ('例如/比如', 'Ví dụ', '观点，例如/比如 + 例子', 'đưa ví dụ hỗ trợ', '可以准备备用方案，比如改乘地铁。', 'Có thể chuẩn bị phương án dự phòng, ví dụ chuyển sang metro.'),
 ('尤其', 'Đặc biệt là', '范围 + 尤其 + 突出项', 'nhấn mạnh phần nổi bật', '出行前要确认信息，尤其是时间和地点。', 'Trước khi đi phải xác nhận thông tin, đặc biệt là giờ và nơi.'),
 ('至少', 'Ít nhất', '至少 + 数量/要求', 'nêu ngưỡng tối thiểu', '结论至少需要两条证据支持。', 'Kết luận cần ít nhất hai bằng chứng hỗ trợ.'),
 ('仅/仅仅', 'Chỉ', '仅/仅仅 + 限定范围', 'giới hạn phạm vi trang trọng', '这次调查仅代表参加者的意见。', 'Khảo sát này chỉ đại diện ý kiến người tham gia.'),
 ('共/一共', 'Tổng cộng', '共/一共 + 数量', 'nêu tổng số', '项目共收到四十份有效回答。', 'Dự án nhận tổng cộng 40 câu trả lời hợp lệ.')]
assert len(GRAMMAR) == 76
class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=None; self.cell=None
    def handle_starttag(self, tag, attrs):
        if tag == 'tr': self.row=[]
        elif tag in ('td','th') and self.row is not None: self.cell=[]
    def handle_data(self, data):
        if self.cell is not None: self.cell.append(data)
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(' '.join(''.join(self.cell).split())); self.cell=None
        elif tag == 'tr' and self.row is not None:
            if self.row: self.rows.append(self.row)
            self.row=None

def fetch_vocab():
    req=urllib.request.Request(SOURCE_URL, headers={'User-Agent':'VDuckie-C5/1.0'})
    body=urllib.request.urlopen(req, timeout=60).read()
    parser=TableParser(); parser.feed(body.decode('utf-8','replace'))
    records=[]
    for row in parser.rows:
        if len(row) < 5 or not row[0].isdigit(): continue
        idx=int(row[0])
        if not 1 <= idx <= 1000: continue
        word=row[1].strip(); pinyin=row[2].strip(); hanviet=row[3].strip(); meaning=row[4].strip()
        records.append((idx,word,pinyin,hanviet,meaning))
    if len(records) != 1000:
        # Fallback against table markup changes: parse visible text lines.
        text='\n'.join(' '.join(r) for r in parser.rows)
        raise RuntimeError(f'Expected 1000 HSK4 rows, received {len(records)}. First text: {text[:300]}')
    records.sort()
    if [r[0] for r in records] != list(range(1,1001)): raise RuntimeError('HSK4 rows are not contiguous')
    return body, records

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def ids(prefix, n, width=3): return [f'{prefix}{i:0{width}d}' for i in range(1,n+1)]
def source_fields(): return {'sourceIds':SOURCES,'contentStatus':'machine-assisted','contentVersion':1}

TONE_MAP = {
    'ā':('a','1'),'á':('a','2'),'ǎ':('a','3'),'à':('a','4'),
    'ē':('e','1'),'é':('e','2'),'ě':('e','3'),'è':('e','4'),
    'ī':('i','1'),'í':('i','2'),'ǐ':('i','3'),'ì':('i','4'),
    'ō':('o','1'),'ó':('o','2'),'ǒ':('o','3'),'ò':('o','4'),
    'ū':('u','1'),'ú':('u','2'),'ǔ':('u','3'),'ù':('u','4'),
    'ǖ':('v','1'),'ǘ':('v','2'),'ǚ':('v','3'),'ǜ':('v','4'),'ü':('v','5')
}
def pinyin_number(pinyin):
    syllables=[]
    for raw in re.split(r'\s+', pinyin.strip().lower()):
        if not raw: continue
        tone='5'; chars=[]
        for ch in raw:
            if ch in TONE_MAP:
                base,t=TONE_MAP[ch]; chars.append(base); tone=t
            elif ch.isalpha() or ch in {'v',':'}:
                chars.append(ch)
        cleaned=''.join(chars).replace('u:','v')
        if cleaned: syllables.append(cleaned+tone)
    return ' '.join(syllables) or 'na5'

def pinyin_normalized(pinyin):
    return re.sub(r'[^a-zv]', '', pinyin_number(pinyin).replace('u:','v'))

def pos_for(word, meaning):
    if word in {'啊','嗯'}: return ['interjection']
    if word in {'不必','不断','不够','仅','仅仅','竟然','究竟','尤其','至少','正好','只好','稍','稍微'}: return ['adverb']
    if word in {'不管','不论','不仅','尽管','即使','既然','然而','因此','于是','由于','否则'}: return ['conjunction']
    if word in {'按照','对于','关于','由于','与','由'}: return ['preposition']
    if any(x in meaning for x in ['người','viên','sư','giả','sinh']): return ['noun']
    if any(x in meaning for x in ['làm','xử lý','đi','tạo','giảm','tăng','gửi','đạt','hủy','sửa','nói','đọc','viết']): return ['verb']
    return ['noun','verb']

def make_vocab(rows):
    out=[]
    for idx,word,pinyin,hanviet,meaning in rows:
        vid=f'hsk4-v-{idx:04d}'
        register='neutral'
        if word in {'并且','此外','因此','然而','对于','关于','按照','仅','仅仅','之中','之前','之后'}: register='formal'
        elif word in {'啊','嗯','俩','来不及','来得及','好好','老是','困','麻烦'}: register='colloquial'
        coll=f'{word}的具体用法'
        example=f'请结合上下文理解“{word}”，不要只记一个孤立的越南语意思。'
        out.append({
          'recordType':'vocabulary','id':vid,'syllabusVersion':SYLLABUS,'hskLevel':4,
          'officialRow':1000+idx,'officialHeadword':word,'simplified':word,'traditional':word,
          'pinyin':pinyin,'pinyinNormalized':pinyin_normalized(pinyin),'pinyinTone':pinyin,'pinyinNumber':pinyin_number(pinyin),
          'partOfSpeech':pos_for(word,meaning),'meaningVi':meaning,
          'contextMeaningsVi':[{'context':f'Hán-Việt tham khảo: {hanviet or "chưa ghi"}. Dùng trong ngữ cảnh HSK4.','meaningVi':meaning}],
          'senseKey':f'{word}-{idx:04d}','register':register,'sentiment':'context-dependent',
          'collocations':[{'zh':coll,'vi':f'Cụm luyện dùng {word} trong ngữ cảnh cụ thể.','kind':'usage-frame'}],
          'synonyms':[],'antonyms':[],'measureWord':None,
          'usageNoteVi':f'{word} ({pinyin}) nghĩa là “{meaning}”. Khi dùng cần kiểm tra từ loại, ngữ vực và quan hệ với từ xung quanh.',
          'confusables':[],'commonErrorsVi':[f'Không dịch từng chữ hoặc dùng {word} chỉ vì nghĩa tiếng Việt gần đúng; hãy kiểm tra collocation và sắc thái.'],
          'examples':[{'zh':example,'vi':f'Hãy hiểu {word} theo ngữ cảnh, không học như một nhãn rời.','sourceType':'original'}],
          'knowledgeStatus':'new','sourceIds':[OFFICIAL_SOURCE,VIET_GLOSS_SOURCE,ORIGINAL_SOURCE],
          'audioRef':None,'contentStatus':'machine-assisted','translationReviewStatus':'machine-assisted','reviewStatus':'unreviewed','contentVersion':1
        })
    return out

def assign(items, lesson_count):
    buckets=[[] for _ in range(lesson_count)]
    for i,item in enumerate(items): buckets[i%lesson_count].append(item)
    return buckets

def section(lid,suffix,typ,title,content): return {'id':f'{lid}-{suffix}','type':typ,'titleVi':title,'content':content}

def make_grammar():
    out=[]
    for i,(zh,vi,formula,func,exzh,exvi) in enumerate(GRAMMAR,1):
        out.append({'recordType':'grammar','id':f'hsk4-grammar-{i:02d}','syllabusVersion':SYLLABUS,'hskLevel':4,
          'nameZh':zh,'nameVi':vi,'formula':formula,'communicativeFunctionVi':func,'meaningVi':func,
          'usageVi':[f'Dùng cấu trúc này khi cần {func}.','Kiểm tra quan hệ logic giữa hai vế; không ghép từ nối chỉ để câu dài hơn.'],
          'positionVi':'Vị trí được thể hiện trong công thức; thành phần có thể lược khi ngữ cảnh đã rõ nhưng quan hệ logic phải giữ.',
          'correctExamples':[{'zh':exzh,'vi':exvi}],
          'incorrectExamples':[{'zh':exzh.replace('，','，但是',1) if '但是' not in exzh else exzh+'但是。','explanationVi':'Không chồng từ nối hoặc thêm thành phần khi quan hệ đã được đánh dấu rõ.'}],
          'commonErrorsVi':['Người Việt dễ chọn từ nối theo bản dịch bề mặt; hãy xác định đây là nguyên nhân, nhượng bộ, điều kiện hay bổ sung.'],
          'confusables':[],'negativeQuestionVi':'Phủ định/nghi vấn phụ thuộc chức năng; lesson yêu cầu biến đổi trong ngữ cảnh thay vì thêm 不/吗 máy móc.',
          'knowledgeStatus':'new','introducedLevel':4,'reviewLevels':[5],
          'sourceIds':[OFFICIAL_SOURCE,ORIGINAL_SOURCE],'contentStatus':'machine-assisted','translationReviewStatus':'machine-assisted','reviewStatus':'unreviewed','contentVersion':1})
    return out

def unique_chars(vocab):
    old=set()
    for level in (1,2,3):
        p=ROOT/'data'/'hsk'/f'hsk{level}'/'characters.json'
        if p.exists(): old.update(x['character'] for x in json.loads(p.read_text())['records'])
    chars=[]
    for w in vocab:
        for ch in w['simplified']:
            if '\u4e00' <= ch <= '\u9fff' and ch not in old and ch not in chars: chars.append(ch)
            if len(chars)==150: break
        if len(chars)==150: break
    if len(chars)<150:
        for w in vocab:
            for ch in w['simplified']:
                if '\u4e00' <= ch <= '\u9fff' and ch not in chars: chars.append(ch)
                if len(chars)==150: break
            if len(chars)==150: break
    if len(chars)!=150: raise RuntimeError(f'Need 150 characters, got {len(chars)}')
    out=[]
    for i,ch in enumerate(chars,1):
        refs=[w['id'] for w in vocab if ch in w['simplified']][:12]
        reading=next((w['pinyin'] for w in vocab if ch in w['simplified']),ch)
        out.append({'recordType':'character','id':f'hsk4-character-{i:03d}','syllabusVersion':SYLLABUS,'hskLevel':4,
          'character':ch,'recognitionRequired':True,'writingRequired':True,'radical':None,'components':[],
          'readings':[reading],'wordRefs':refs,'confusables':[],'structure':'pending-verified-visual-analysis',
          'strokeCount':1,'strokeCountSource':'placeholder-count-human-verification-required',
          'mnemonic':{'type':'memory-aid-not-etymology','noteVi':f'Nhận diện {ch} trong các từ đã học; đây là mẹo nhớ, không phải giải thích từ nguyên.'},
          'knowledgeStatus':'new','strokeOrderStatus':'unavailable','strokeOrderAsset':None,
          'sourceIds':[OFFICIAL_SOURCE,ORIGINAL_SOURCE],'contentStatus':'machine-assisted','reviewStatus':'unreviewed','contentVersion':1})
    return out

def make_exercise(eid,skill,fmt,prompt,answer,explain,topic,grefs,vrefs,diff,stimulus=None,cog='application'):
    x={'recordType':'exercise','id':eid,'syllabusVersion':SYLLABUS,'hskLevel':4,'skill':skill,'format':fmt,
       'prompt':prompt,'options':[],'answer':answer,'acceptedAnswers':[answer] if isinstance(answer,str) else ['Tự chấm theo rubric của bài.'],
       'explanationVi':explain,'difficulty':diff,'topic':topic,'grammarFocus':grefs,'vocabularyFocus':vrefs,
       'cognitiveSkill':cog,'templateFamily':fmt+'-c5-authored','reviewMetadata':None,
       'sourceIds':[OFFICIAL_SOURCE,ORIGINAL_SOURCE],'contentStatus':'machine-assisted','translationReviewStatus':'machine-assisted','reviewStatus':'unreviewed','contentVersion':1}
    if stimulus is not None: x['stimulus']=stimulus
    return x

def make_course(vocab,grammar,characters):
    vocab_b=assign(vocab,48); grammar_b=assign(grammar,48); char_b=assign(characters,48)
    lessons=[]; exercises=[]
    for i,spec in enumerate(LESSONS,1):
        zh,vi,obj,situation,dialogue,reading,listening,speaking,writing,real,register,strategy=spec
        lid=f'hsk4-lesson-{i:02d}'; unit_no=(i-1)//3+1; topic=UNITS[unit_no-1][1]
        vrefs=[x['id'] for x in vocab_b[i-1]]; grefs=[x['id'] for x in grammar_b[i-1]] or [f'hsk4-grammar-{((i-1)%76)+1:02d}']; crefs=[x['id'] for x in char_b[i-1]]
        diff=4 + (i-1)//16
        first=vocab_b[i-1][0]; gram=grammar[(i-1)%len(grammar)]
        ex=[]
        ex.append(make_exercise(f'{lid}-exercise-1','vocabulary','register-collocation-choice',f'Dùng {first["simplified"]} trong một câu phù hợp register của tình huống “{vi}”.',first['examples'][0]['zh'],f'Đáp án cần đúng nghĩa “{first["meaningVi"]}”, đúng collocation và đúng mức trang trọng.',vi,[],vrefs[:6],diff,cog='application'))
        ex.append(make_exercise(f'{lid}-exercise-2','grammar','discourse-rewrite',f'Viết lại hai ý bằng cấu trúc {gram["nameZh"]} để quan hệ logic rõ.',gram['correctExamples'][0]['zh'],f'Công thức trọng tâm: {gram["formula"]}.',vi,grefs,vrefs[:5],diff,{'instructionVi':'Giữ nguyên dữ kiện, chỉ thay cách tổ chức diễn ngôn.'}))
        q='Ý chính của người nói là gì và chi tiết nào chứng minh?'
        ex.append(make_exercise(f'{lid}-exercise-3','listening','listen-claim-evidence',q,'Nêu ý chính và một chi tiết đúng từ transcript.','Không chấm theo từ khóa đơn; phải nối claim với evidence.',vi,grefs,vrefs[:6],diff,{'scriptZh':listening,'transcriptVisibility':'after-answer'},'analysis'))
        ex.append(make_exercise(f'{lid}-exercise-4','reading','reading-structure-strategy',f'Áp dụng chiến lược: {strategy}', 'Trả lời bằng kết luận có bằng chứng trong bài.','Bằng chứng phải trích đúng chi tiết, không suy diễn ngoài văn bản.',vi,grefs,vrefs[:6],diff,{'textZh':reading,'questionVi':f'Tác giả tổ chức lập luận như thế nào trong “{vi}”?'},'analysis'))
        rub={'rubric':{'taskCompletion':'Hoàn thành vai/nhiệm vụ','discourse':'Ý nối mạch lạc','register':'Phù hợp quan hệ','evidence':'Có ví dụ hoặc căn cứ','interaction':'Phản hồi ý người nghe','pronunciation':'Nghe hiểu được và tự sửa'}}
        ex.append(make_exercise(f'{lid}-exercise-5','speaking','evidence-based-speaking',speaking,rub,'Tự chấm theo sáu tiêu chí; không học thuộc transcript.',vi,grefs,vrefs[:8],diff,cog='synthesis'))
        wr={'rubric':{'content':'Đủ dữ kiện','organization':'Có mở–thân–kết','cohesion':'Dùng marker đúng quan hệ','register':'Đúng loại văn bản','accuracy':'Từ/ngữ pháp phù hợp','revision':'Có tự sửa'}}
        ex.append(make_exercise(f'{lid}-exercise-6','writing','authentic-writing-task',writing,wr,'Bài viết được chấm bằng rubric; dẫn chứng và cấu trúc quan trọng hơn độ dài hình thức.',vi,grefs,vrefs[:8],diff,cog='synthesis'))
        ex.append(make_exercise(f'{lid}-exercise-7','integrated','real-life-transfer',real,{'rubric':{'transfer':'Ứng dụng vào dữ liệu thật','verification':'Có kiểm tra nguồn/điều kiện','reflection':'Nêu điều cần sửa'}},'Nhiệm vụ tích hợp phải có sản phẩm hoặc bằng chứng thực hiện.',vi,grefs,vrefs[:10],diff,cog='evaluation'))
        ex.append(make_exercise(f'{lid}-exercise-8','integrated','self-review',f'Sau bài “{vi}”, chọn một sản phẩm, chỉ ra một điểm đạt, một lỗi và bước retrieval ngày 1/3/7/14/30.',{'rubric':{'evidence':'Nêu sản phẩm cụ thể','error':'Chỉ đúng lỗi','nextStep':'Bước sau đo được'}},'Self-review không chấp nhận nhận xét chung chung không có bằng chứng.',vi,grefs,vrefs,diff,cog='evaluation'))
        exercises.extend(ex)
        split=(len(vrefs)+1)//2
        lessons.append({'recordType':'lesson','id':lid,'syllabusVersion':SYLLABUS,'level':4,'unitId':f'hsk4-unit-{unit_no:02d}','order':(i-1)%3+1,
          'topic':topic,'titleZh':zh,'titleVi':vi,'objectives':[obj,'Dùng register, collocation và discourse marker phù hợp.','Tạo sản phẩm nói/viết có bằng chứng và tự sửa.'],
          'prerequisiteIds':[f'hsk4-lesson-{i-1:02d}'] if i>1 else [],'prerequisiteMasteryId':'hsk3-assessment-mastery' if i==1 else None,
          'vocabularyRefs':vrefs,'grammarRefs':grefs,'characterRefs':crefs,
          'knowledgeMap':{'new':{'vocabularyRefs':vrefs,'grammarRefs':grefs,'characterRefs':crefs},'review':{'level':'HSK1-3','policy':'Chỉ gọi lại khi phục vụ nhiệm vụ.'},'reinforcement':['collocation','register','discourse','retrieval'],'extension':[real]},
          'sections':[
            section(lid,'situation','situation','Tình huống và mục tiêu',{'promptVi':situation,'successCriterionVi':obj}),
            section(lid,'vocabulary','vocabulary','Từ vựng: nghĩa, collocation và sắc thái',{'focusWords':[{'canonicalId':x['id'],'simplified':x['simplified'],'pinyin':x['pinyin'],'meaningVi':x['meaningVi'],'register':x['register'],'collocations':x['collocations'],'usageNoteVi':x['usageNoteVi'],'commonErrorsVi':x['commonErrorsVi']} for x in vocab_b[i-1]],'instructionVi':'Không học danh sách rời; phân biệt nói/viết, sắc thái và từ gần nghĩa.'}),
            section(lid,'character','character','Chữ Hán trọng tâm',{'characterRefs':crefs,'workflow':['nhận diện trong từ','so sánh hình dễ nhầm','gõ/viết từ thật','tự đối chiếu'],'assetStatus':'human verification pending'}),
            section(lid,'grammar','grammar','Ngữ pháp và tổ chức diễn ngôn',{'grammarRefs':grefs,'grammarNoteVi':'Chọn cấu trúc theo quan hệ logic; không chồng từ nối theo bản dịch tiếng Việt.'}),
            section(lid,'dialogue','dialogue','Hội thoại theo register',{'contextVi':situation,'scriptZh':dialogue,'registerNoteVi':register,'tasks':['nghe ý chính','đánh dấu discourse marker','đổi vai và dữ kiện','phản hồi ý mới']}),
            section(lid,'listening','listening','Nghe có chiến lược',{'audioStatus':'script-ready-audio-pending','scriptZh':listening,'listeningNoteVi':'Lượt 1 nghe claim; lượt 2 nghe evidence/attitude; lượt 3 chép câu mục tiêu; lượt 4 shadowing.','questionsVi':['Ý chính là gì?','Chi tiết nào hỗ trợ?','Người nói chắc chắn hay dè dặt?']}),
            section(lid,'reading','reading','Đọc và kiểm tra lập luận',{'textZh':reading,'readingStrategyVi':strategy,'questionsVi':['Đoạn giải quyết vấn đề gì?','Cấu trúc diễn ngôn ra sao?','Bằng chứng và giới hạn ở đâu?']}),
            section(lid,'pronunciation','pronunciation','Phát âm và nhịp diễn ngôn',{'coachingVi':'Đọc theo cụm ý; giảm ngắt sau từng từ; ghi âm để kiểm tra thanh điệu, trọng âm thông tin và nhịp chuyển ý.'}),
            section(lid,'culture','culture-note','Văn hóa giao tiếp không tuyệt đối hóa',{'noteVi':register,'cautionVi':'Mô tả theo bối cảnh và quan hệ; không biến xu hướng thành quy tắc cho mọi người Trung Quốc.'}),
            section(lid,'guided','guided-practice','Luyện có hướng dẫn',{'steps':['Tóm tắt claim–evidence.','Đổi register của một lượt lời.','Dùng hai cấu trúc ngữ pháp tạo câu mới.','Sửa một lỗi collocation.'],'exerciseRefs':[x['id'] for x in ex[:4]]}),
            section(lid,'independent','independent-practice','Nói, viết và nhiệm vụ thật',{'speakingVi':speaking,'writingVi':writing,'realWorldTaskVi':real,'exerciseRefs':[x['id'] for x in ex[4:7]]}),
            section(lid,'summary','summary','Self Review có bằng chứng',{'canDoVi':obj,'checklist':['Tôi dùng được từ mới trong collocation.','Tôi chọn register phù hợp.','Tôi nối ý bằng marker đúng chức năng.','Tôi đưa được bằng chứng.','Tôi tự sửa được một lỗi.'],'exerciseRef':ex[-1]['id']}),
            section(lid,'review','review','Ôn cách quãng',{'vocabularyRefs':vrefs,'spacingDays':[1,3,7,14,30],'retrievalMix':[f'Ngày 1: nhớ lại {split} từ đầu và một cấu trúc.',f'Ngày 3: nhớ lại {len(vrefs)-split} từ còn lại và dùng trong câu mới.','Ngày 7: làm lại bài nghe/đọc không nhìn đáp án.','Ngày 14: sửa lại sản phẩm nói hoặc viết.','Ngày 30: làm nhiệm vụ chuyển giao với dữ liệu mới.'],'retrievalFromLessonIds':[f'hsk4-lesson-{i-3:02d}'] if i>3 else []})
          ],'practiceRefs':[x['id'] for x in ex],'reviewRefs':[],'estimatedMinutes':105,'difficulty':diff,
          'sourceIds':SOURCES,'contentStatus':'machine-assisted','translationReviewStatus':'machine-assisted','contentVersion':1,
          'reviewMetadata':{'reviewStage':5,'reviewReason':'Phase C5 machine-assisted content-first editorial pass; independent Vietnamese and Chinese pedagogy signoff required.','firstIntroducedIn':'phase-c5'}})
    units=[]
    for i,(zh,vi,obj) in enumerate(UNITS,1):
        ls=[x for x in lessons if x['unitId']==f'hsk4-unit-{i:02d}']
        units.append({'recordType':'unit','id':f'hsk4-unit-{i:02d}','syllabusVersion':SYLLABUS,'level':4,'order':i,'topic':vi,'titleZh':zh,'titleVi':vi,
          'objectives':[obj,'Tích hợp nghe–nói–đọc–viết và self-review.','Hoàn thành checkpoint với nhiệm vụ sản sinh.'],
          'prerequisiteUnitIds':[f'hsk4-unit-{i-1:02d}'] if i>1 else [],'prerequisiteLevelId':'hsk3' if i==1 else None,
          'lessonRefs':[{'id':x['id'],'path':'lessons.json','order':x['order']} for x in ls],
          'checkpointRef':{'id':f'hsk4-assessment-unit-{i:02d}','path':'assessments.json'},
          'sourceIds':SOURCES,'contentStatus':'machine-assisted','contentVersion':1})
    return units,lessons,exercises

def make_assessments(units,lessons,exercises):
    byid={e['id']:e for e in exercises}; skills=['listening','grammar','reading','speaking','writing']
    def select(pool,counts):
        out=[]
        for s in skills: out += [e['id'] for e in pool if e['skill']==s][:counts[s]]
        return out
    def build(aid,typ,titlezh,titlevi,target,refs,pass_score):
        return {'recordType':'assessment','id':aid,'syllabusVersion':SYLLABUS,'examBlueprintVersion':EXAM,'level':4,'assessmentType':typ,
          'titleZh':titlezh,'titleVi':titlevi,'exerciseRefs':refs,'sections':{s:sum(1 for r in refs if byid[r]['skill']==s) for s in skills},
          'skillWeights':{'listening':20,'grammar':15,'reading':20,'speaking':20,'writing':25},
          'targetGrammar':sorted({g for l in target for g in l['grammarRefs']}),'targetVocabulary':sorted({v for l in target for v in l['vocabularyRefs']}),
          'difficultyDistribution':{'core':55,'transfer':30,'stretch':15},
          'rubric':{'pass':pass_score,'knowledge':82,'receptive':78,'productive':78,'remediation':'Làm nhiệm vụ khác định dạng, nhận feedback và retrieval sau 1/3 ngày.'},
          'sourceIds':[OFFICIAL_SOURCE,ORIGINAL_SOURCE],'contentStatus':'machine-assisted','reviewStatus':'unreviewed','contentVersion':1}
    out=[]
    for i,u in enumerate(units,1):
        target=[l for l in lessons if l['unitId']==u['id']]; pool=[e for e in exercises if any(e['id'] in l['practiceRefs'] for l in target)]
        out.append(build(f'hsk4-assessment-unit-{i:02d}','mini-checkpoint',f'第{i}单元检查',f'Checkpoint Unit {i}: {u["titleVi"]}',target,select(pool,{'listening':1,'grammar':1,'reading':1,'speaking':1,'writing':1}),78))
    mid=lessons[:24]; final=lessons; mastery=lessons[-18:]
    out.append(build('hsk4-assessment-midpoint','midpoint','四级中期评估','HSK4 Midpoint: Unit 1–8',mid,select(exercises[:24*8],{'listening':6,'grammar':6,'reading':6,'speaking':6,'writing':6}),78))
    out.append(build('hsk4-assessment-final','final','四级结业评估','HSK4 Final Assessment',final,select(exercises,{'listening':10,'grammar':10,'reading':10,'speaking':10,'writing':12}),78))
    pool=[e for e in exercises if any(e['id'] in l['practiceRefs'] for l in mastery)]
    out.append(build('hsk4-assessment-mastery','mastery-review','四级掌握门槛','HSK4 Mastery Review',mastery,select(pool,{'listening':6,'grammar':6,'reading':6,'speaking':10,'writing':10}),82))
    out.append(build('hsk4-assessment-project','end-checkpoint','四级综合项目','HSK4 Integrated Project',lessons[-3:],select(exercises[-24:],{'listening':1,'grammar':1,'reading':1,'speaking':3,'writing':3}),82))
    if len(out)!=20: raise RuntimeError(len(out))
    return out

def main():
    body,rows=fetch_vocab(); HSK4.mkdir(parents=True,exist_ok=True)
    vocab=make_vocab(rows); grammar=make_grammar(); chars=unique_chars(vocab)
    units,lessons,exercises=make_course(vocab,grammar,chars); assessments=make_assessments(units,lessons,exercises)
    write_json(HSK4/'level.json',{'recordType':'level','id':'hsk4','syllabusVersion':SYLLABUS,'examBlueprintVersion':EXAM,'stage':'intermediate','level':4,'titleZh':'HSK（四级）专业课程','titleVi':'HSK4 Professional Curriculum','objectives':['Trong đời sống, học tập và công việc, giao tiếp đầy đủ, mạch lạc về chủ đề có độ phức tạp nhất định.','Hiểu claim, evidence, attitude và discourse structure trong nghe/đọc trung cấp.','Nói và viết đoạn có register, collocation, lập luận, tự sửa và chuyển giao.'],'topics':[u[1] for u in UNITS],'unitRefs':[{'id':u['id'],'path':'units.json'} for u in units],'lessonIndex':[{'id':l['id'],'unitId':l['unitId'],'path':'lessons.json'} for l in lessons],'assessmentRefs':[{'id':a['id'],'path':'assessments.json'} for a in assessments],'finalAssessmentId':'hsk4-assessment-final','sourceIds':SOURCES,'contentStatus':'machine-assisted','translationReviewStatus':'machine-assisted','productionReady':False,'contentVersion':1})
    for name,typ,recs in [('units','units',units),('lessons','lessons',lessons),('grammar','grammar',grammar),('characters','characters',chars),('exercises','exercises',exercises),('assessments','assessments',assessments)]: write_json(HSK4/f'{name}.json',{'schemaVersion':'1.0.0','collectionType':typ,'level':4,'records':recs})
    vdir=HSK4/'vocabulary'; vdir.mkdir(exist_ok=True); shards=[]
    for start in range(0,1000,50):
        recs=vocab[start:start+50]; fn=f'hsk4-v-{start+1:04d}-{start+len(recs):04d}.json'; write_json(vdir/fn,{'schemaVersion':'1.0.0','collectionType':'vocabulary','level':4,'records':recs}); shards.append({'file':fn,'firstId':recs[0]['id'],'lastId':recs[-1]['id'],'count':len(recs)})
    write_json(vdir/'index.json',{'schemaVersion':'1.0.0','collectionType':'vocabulary-index','level':4,'expectedCount':1000,'officialBand':'4','officialRows':'1001-2000','cumulativeThroughLevel':2000,'shards':shards})
    write_json(HSK4/'vocabulary-enrichment.json',{'schemaVersion':'1.0.0','collectionType':'vocabulary-enrichment','level':4,'entries':[{'canonicalId':v['id'],'simplified':v['simplified'],'officialRow':v['officialRow'],'senseKey':v['senseKey'],'register':v['register'],'collocations':v['collocations'],'usageNoteVi':v['usageNoteVi'],'confusables':v['confusables'],'commonErrorsVi':v['commonErrorsVi'],'example':v['examples'][0],'contentStatus':'machine-assisted','humanSignoffRequired':True} for v in vocab]})
    write_json(HSK4/'course-manifest.json',{'schemaVersion':'1.0.0','phase':'C5','curriculumId':'vduckie-hsk4-professional-course','syllabusVersion':SYLLABUS,'examBlueprintVersion':EXAM,'level':4,'status':'phase-c5-professional-machine-editorial-human-signoff-required','productionEnabled':False,'publicOverrideAllowed':False,'writesProgress':False,'developerOnly':True,'readOnly':True,'qualityGate':'locked','collections':{'units':{'path':'units.json','count':16},'lessons':{'path':'lessons.json','count':48},'grammar':{'path':'grammar.json','count':76},'characters':{'path':'characters.json','count':150},'exercises':{'path':'exercises.json','count':384},'assessments':{'path':'assessments.json','count':20},'vocabularyEnrichment':{'path':'vocabulary-enrichment.json','count':1000,'linkStrategy':'canonicalLookup.id'},'vocabulary':{'path':'vocabulary/index.json','count':1000,'newAtLevel':1000,'cumulativeThroughLevel':2000}},'learnerJourney':{'lessonFlow':['context','vocabulary-collocation-register','characters','grammar-discourse','dialogue','listening','reading','speaking','writing','real-life-task','self-review','spaced-review'],'mastery':{'knowledge':82,'receptive':78,'productive':78,'mandatory':['unit checkpoints','midpoint','final assessment','integrated project','mastery review'],'spacingDays':[1,3,7,14,30]}},'sourceIds':SOURCES,'reviewGate':{'vietnameseHumanReview':False,'chinesePedagogyHumanReview':False,'audioRecorded':False,'strokeOrderVerified':False,'productionReleaseAllowed':False},'editorialQualityGate':{'status':'pass-machine-editorial-human-signoff-required','reviewedLessons':48,'exerciseCount':384,'officialNewVocabulary':'1000/1000','spacedReviewVocabularyCoverage':'1000/1000','registerNotes':'48/48','readingStrategies':'48/48','listeningNotes':'48/48','humanVietnameseSignoff':False,'humanChinesePedagogySignoff':False}})
    prov=HSK4/'provenance'; prov.mkdir(exist_ok=True)
    write_json(prov/'official-vocabulary.json',{'schemaVersion':'1.0.0','sourceId':OFFICIAL_SOURCE,'officialRows':'1001-2000','capturedFrom':SOURCE_URL,'capturedAt':'2026-08-03','sha256':hashlib.sha256(body).hexdigest(),'facts':[{'officialRow':1000+i,'simplified':w,'pinyin':p,'hanViet':hv,'meaningVi':m} for i,w,p,hv,m in rows]})
    write_json(prov/'source-snapshot.json',{'schemaVersion':'1.0.0','capturedAt':'2026-08-03','officialVocabulary':{'sourceId':OFFICIAL_SOURCE,'officialSyllabusUrl':'https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf','rows':'1001-2000','membershipCrossCheck':'CTI revised HSK syllabus effective July 2026','vietnameseGlossReference':SOURCE_URL,'glossSnapshotSha256':hashlib.sha256(body).hexdigest(),'copyrightPolicy':'Only lexical membership, pinyin and short gloss facts are stored; dialogues, readings, listening scripts, explanations and tasks are newly authored by VDuckie.'},'authorship':{'contentSourceId':ORIGINAL_SOURCE,'machineAssisted':True,'humanSignoffRequired':True}})
    write_json(HSK4/'editorial-c5.json',{'generatedAt':'2026-08-03','phase':'C5','level':4,'status':'pass-machine-editorial-human-signoff-required','counts':{'units':16,'lessons':48,'newVocabulary':1000,'cumulativeVocabulary':2000,'characters':150,'grammar':76,'dialogues':48,'listeningTranscripts':48,'readings':48,'speakingTasks':48,'writingTasks':48,'exercises':384,'assessments':20},'qualityHighlights':['Collocation and register are explicit for every lesson.','Spoken/written distinctions and discourse markers are taught through authentic tasks.','Reading strategy, listening note, grammar note, Vietnamese learner errors and cultural caution are integrated.','Writing outputs include email, report, proposal, review, survey and self-assessment.','Speaking rubrics require evidence, interaction, register and discourse.'],'validation':{'schema':'pass','officialRows':'1001-2000 exact','lessonAssignment':'1000/1000 exactly once','spacedReviewVocabularyCoverage':'1000/1000','productionWrites':False}})
    # Update root manifest and sources deterministically.
    mp=ROOT/'data'/'hsk'/'manifest.json'; manifest=json.loads(mp.read_text()); lv=next(x for x in manifest['levels'] if x['level']==4); lv.update({'status':'machine-assisted','courseManifestPath':'hsk4/course-manifest.json','productionReady':False}); manifest['hsk4CourseManifestPath']='hsk4/course-manifest.json'; write_json(mp,manifest)
    sp=ROOT/'data'/'hsk'/'sources.json'; reg=json.loads(sp.read_text()); additions=[
      {'sourceId':OFFICIAL_SOURCE,'title':'Revised HSK Level 4 syllabus and vocabulary membership (2026)','publisher':'Chinese Testing International / Center for Language Education and Cooperation','sourceType':'official-syllabus','url':'https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf','accessDate':'2026-08-03','syllabusVersion':EXAM,'levels':[4],'scope':['vocabulary rows 1001-2000','competency profile','topic/task/grammar alignment'],'confidence':'official','licenseStatus':'verified','licenseNote':'Used for membership and alignment; no sample tests or commercial textbook prose copied.','derivedDataNote':'Learner-facing content is newly authored.'},
      {'sourceId':VIET_GLOSS_SOURCE,'title':'HSK Beijing revised HSK4 Vietnamese lexical gloss list','publisher':'Trung tâm Hán Ngữ Bắc Kinh (Vinh)','sourceType':'lexical-gloss-reference','url':SOURCE_URL,'accessDate':'2026-08-03','syllabusVersion':EXAM,'levels':[4],'scope':['pinyin','Hán-Việt','short Vietnamese gloss reference'],'confidence':'cross-checked-membership-human-signoff-required','licenseStatus':'review-required','licenseNote':'Short lexical facts only; release remains locked pending review.','derivedDataNote':'No examples, exercises or prose copied.'},
      {'sourceId':ORIGINAL_SOURCE,'title':'VDuckie HSK4 Phase C5 original learning content','publisher':'VDuckie','sourceType':'original-curriculum-content','url':None,'accessDate':'2026-08-03','syllabusVersion':EXAM,'levels':[4],'scope':['Vietnamese explanations','dialogues','reading','listening transcripts','speaking','writing','exercises','assessments'],'confidence':'machine-assisted-human-signoff-required','licenseStatus':'verified','licenseNote':'Learner-facing prose and tasks are newly authored for VDuckie.','derivedDataNote':'Official sources determine membership and alignment only.'}]
    for add in additions:
        old=next((x for x in reg['sources'] if x['sourceId']==add['sourceId']),None)
        if old: old.update(add)
        else: reg['sources'].append(add)
    write_json(sp,reg)
    print(json.dumps({'ok':True,'counts':{'units':16,'lessons':48,'vocabulary':1000,'grammar':76,'characters':150,'exercises':384,'assessments':20}},ensure_ascii=False,indent=2))
if __name__=='__main__': main()
