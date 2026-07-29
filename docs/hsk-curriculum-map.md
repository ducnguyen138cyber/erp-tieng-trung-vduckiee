# VDuckie HSK 1–9 Curriculum Architecture — Phase C0

> Trạng thái: kiến trúc đã được kiểm tra; chưa phải nội dung production. Production vẫn dùng HSK1 V75 legacy và quality gate vẫn khóa.

## 1. Quyết định chuẩn và phiên bản

VDuckie dùng **GF0025-2021** làm chuẩn năng lực ba bậc/chín cấp, bốn chiều ngôn ngữ và năm kỹ năng. Đề cương **CTI HSK 3.0 (2026)** là track inventory, nhiệm vụ và luyện thi. Hai nguồn liên quan nhưng không đồng nhất.

Tại ngày 2026-07-29, CTI mô tả HSK 3.0 cấp 1–6 ở trạng thái chuyển tiếp/pilot; thông báo chính thức nêu lịch thi thường kỳ 2026 vẫn theo HSK 2.0 cho tới thông báo khác. Mọi release phải kiểm tra lại trạng thái này. HSK7–9 giữ một official vocabulary band chung; `pedagogicTargetLevel` chỉ là thứ tự dạy nội bộ.

Nguồn và phạm vi sử dụng đầy đủ nằm trong `data/hsk/sources.json` và `sourceClaims` của [curriculum map](../data/hsk/curriculum/architecture.json).

## 2. Kết quả audit hiện tại

- Legacy production: 15 bài / 150 từ, đang khóa ở curriculum V75.
- Canonical HSK1: 300 từ / 900 câu, stable IDs và provenance tốt.
- Canonical hiện có 0 unit, 0 lesson và 0 assessment thực.
- 300/300 nghĩa tiếng Việt còn machine-assisted; human-reviewed = 0.
- Coverage collocation/context/common-error lần lượt là 0/0/0.
- HSK2–4 canonical mới là shell; HSK5–9 chưa có nội dung. Không được dùng placeholder để che khoảng trống này.

Điểm nên giữ: inventory CTI 300 từ, 900 câu gốc làm candidate, stable ID/sourceRef/shard/checksum, phần phát âm/viết/mobile hiện có và production lock.

Điểm phải viết/enrich: thứ tự unit–lesson, giải thích ngữ pháp, chữ Hán, collocation/cách dùng/lỗi người Việt, hội thoại, nghe–nói–đọc–viết, assessment, rubric, audio và human review.

## 3. Quy mô kiến trúc

Các độ dài/tốc độ dưới đây là **design envelope của VDuckie**, không phải quota đề thi chính thức.

| HSK | Bậc | Unit | Core lesson | Từ tích lũy theo đề cương CTI mới | Văn bản | Audio |
|---:|---|---:|---:|---:|---:|---:|
| 1 | elementary | 10 | 24 | 300 | 5–80 chữ | 5–35 giây |
| 2 | elementary | 10 | 28 | 500 | 30–180 chữ | 15–65 giây |
| 3 | elementary | 12 | 36 | 1.000 | 100–350 chữ | 35–130 giây |
| 4 | intermediate | 12 | 40 | 2.000 | 220–650 chữ | 60–190 giây |
| 5 | intermediate | 14 | 48 | 3.600 | 400–1000 chữ | 100–320 giây |
| 6 | intermediate | 14 | 52 | 5.400 | 700–1800 chữ | 160–440 giây |
| 7 | advanced | 15 | 56 | 11.000 | 900–2400 chữ | 240–560 giây |
| 8 | advanced | 16 | 60 | 11.000 | 1400–3400 chữ | 300–680 giây |
| 9 | advanced | 16 | 64 | 11.000 | 2000–5000 chữ | 360–840 giây |

Tổng: **119 unit / 408 core lesson**. Đây là kế hoạch authoring có thể điều chỉnh sau pilot, không phải mục tiêu để lấp dữ liệu.

## 4. Contract một lesson

1. **objectives** — Nêu năng lực có thể thực hiện sau bài học.
2. **warm-up** — Kích hoạt ngữ cảnh, trải nghiệm và kiến thức nền.
3. **vocabulary** — Dạy nghĩa, cách dùng, kết hợp từ và lỗi dễ mắc.
4. **characters** — Nhận diện chữ; luyện viết theo yêu cầu cấp độ.
5. **grammar** — Dạy hình thức, ý nghĩa, ngữ dụng và đối chiếu.
6. **input** — Hội thoại hoặc bài đọc chính có mục đích giao tiếp.
7. **comprehension** — Giải mã ý chính, chi tiết, hàm ý phù hợp cấp độ.
8. **listening** — Nghe ý chính, chi tiết, chép chính tả và shadowing.
9. **speaking** — Phản xạ, role-play hoặc sản sinh lời nói.
10. **reading** — Đọc có chiến lược và giải thích đáp án.
11. **writing** — Viết từ chữ/câu đến văn bản theo cấp độ.
12. **translation** — Trung–Việt hoặc Việt–Trung khi mục tiêu yêu cầu. (khi phù hợp)
13. **integrated-practice** — Vận dụng nhiều kỹ năng trong một nhiệm vụ.
14. **summary** — Tóm tắt điều đã học và checklist tự đánh giá.
15. **spaced-review** — Gắn lịch ôn 1/3/7/14/30 ngày và mục tiêu yếu.
16. **real-world-task** — Hoàn thành một tình huống dùng tiếng Trung thật.

Mỗi lesson phải có ít nhất một task sản sinh; mỗi unit có input chính, câu hỏi hiểu, shadowing, role-play và biến thể cá nhân hóa. Mỗi từ mục tiêu cần ba ví dụ có chất lượng sau review, không phải ba câu đổi tên theo template.

## 5. Lộ trình level và unit

### HSK 1

**Đầu ra:** Giao tiếp đơn giản về thông tin cá nhân, sự vật, thời gian, nơi chốn và nhu cầu thường nhật.

1. **Định hướng phát âm và chữ Hán:** Phân biệt thanh điệu, nhóm âm khó với người Việt và viết nét cơ bản.
2. **Gặp gỡ lần đầu:** Chào, nói tên, quốc tịch, vai trò và hỏi lại lịch sự.
3. **Gia đình và người quen:** Giới thiệu quan hệ, số người và thông tin rất ngắn về một người.
4. **Lớp học và ngôn ngữ:** Hỏi nghĩa, xin nhắc lại, nói khả năng và đồ dùng học tập.
5. **Số, ngày và cuộc hẹn:** Nói số, ngày, giờ, điện thoại và hẹn thời điểm đơn giản.
6. **Một ngày của tôi:** Nói hoạt động, nơi chốn, trình tự và thói quen cơ bản.
7. **Ăn uống hằng ngày:** Gọi món đơn giản, nói thích/không thích, số lượng và nhu cầu.
8. **Mua sắm và đồ vật:** Hỏi giá, màu sắc, kích thước, lượng và đưa ra lựa chọn.
9. **Đi lại và phương hướng:** Hỏi nơi chốn, vị trí, phương tiện và chỉ đường rất ngắn.
10. **Thời tiết, sức khỏe và kế hoạch:** Mô tả thời tiết, cảm giác cơ thể và kế hoạch gần.

**Điều kiện sang cấp:** kiến thức 80%, tiếp nhận 75%, sản sinh 70%; bắt buộc: phát âm nền tảng, final assessment, nhiệm vụ nói.

### HSK 2

**Đầu ra:** Giao tiếp cơ bản trong đời sống, học tập và công việc quen thuộc bằng chuỗi câu có liên kết.

1. **Ôn cầu nối HSK1:** Khôi phục phản xạ âm, chữ, câu và chiến lược học.
2. **Lịch sinh hoạt và tần suất:** Sắp xếp lịch, nói tần suất, thời lượng và thay đổi kế hoạch.
3. **Nhà ở và khu phố:** Mô tả phòng, vị trí, tiện ích và hỏi thông tin khu vực.
4. **Đi lại và du lịch ngắn:** Mua vé, hỏi tuyến, nói điểm đi/đến và xử lý thay đổi.
5. **Ăn uống và dịch vụ:** Đặt món, nêu yêu cầu, nhận xét và giải quyết thiếu/sai đơn giản.
6. **Sức khỏe và chăm sóc bản thân:** Mô tả triệu chứng cơ bản, lời khuyên và lịch hẹn.
7. **Học tập và kỹ năng:** Nói mục tiêu, tiến bộ, khó khăn và cách luyện tập.
8. **Công việc thường ngày:** Mô tả nhiệm vụ, đồng nghiệp, thời hạn và nhờ hỗ trợ.
9. **Giải trí và quan hệ:** Mời, từ chối lịch sự, kể hoạt động và bày tỏ cảm xúc.
10. **Trải nghiệm và kế hoạch:** Kể việc đã làm, so sánh lựa chọn và lập kế hoạch gần.

**Điều kiện sang cấp:** kiến thức 80%, tiếp nhận 75%, sản sinh 72%; bắt buộc: unit checkpoints, final assessment, nói kể theo tranh.

### HSK 3

**Đầu ra:** Giao tiếp hiệu quả về các nhiệm vụ quen thuộc, xử lý vấn đề đơn giản và diễn đạt thành đoạn.

1. **Cầu nối sang giao tiếp theo đoạn:** Ôn cấu trúc nền và chuyển từ câu rời sang đoạn.
2. **Học tập và chiến lược:** Mô tả mục tiêu, phương pháp, kết quả và điều chỉnh.
3. **Tìm việc và môi trường làm việc:** Đọc tin tuyển dụng, trao đổi lịch và nhiệm vụ.
4. **Du lịch và sự cố:** Lập lịch trình, hỏi thông tin và giải quyết lỡ/chậm/thất lạc.
5. **Nhà ở và chuyển nhà:** So sánh, thương lượng, mô tả quy trình và vấn đề.
6. **Sức khỏe và lối sống:** Mô tả tình trạng, nguyên nhân, thói quen và lời khuyên.
7. **Quan hệ và giao tiếp số:** Giải thích hiểu lầm, bày tỏ thái độ và ứng xử online.
8. **Mua sắm và quyền lợi:** So sánh sản phẩm, đổi trả và trình bày lý do.
9. **Kể chuyện và trải nghiệm:** Dùng mốc thời gian, điểm ngoặt và cảm nhận.
10. **Văn hóa đời sống:** Hiểu lời mời, quà tặng, phép lịch sự và khác biệt ngữ cảnh.
11. **Môi trường quanh ta:** Mô tả thay đổi, vấn đề và giải pháp cá nhân.
12. **Dự án tổng hợp sơ cấp:** Hoàn thành nhiệm vụ nghe–nói–đọc–viết nhiều bước.

**Điều kiện sang cấp:** kiến thức 82%, tiếp nhận 78%, sản sinh 75%; bắt buộc: mid-level assessment, final assessment, project sơ cấp.

### HSK 4

**Đầu ra:** Giao tiếp đầy đủ, liên tục về đời sống, học tập và công việc; giải thích quan điểm quen thuộc.

1. **Cầu nối diễn ngôn trung cấp:** Ôn liên kết, tóm tắt và chiến lược đoán nghĩa.
2. **Nhà ở và dịch vụ đô thị:** Trao đổi hợp đồng, sửa chữa và khiếu nại lịch sự.
3. **Tuyển dụng và phỏng vấn:** Giới thiệu năng lực, hỏi việc và phản hồi phỏng vấn.
4. **Làm việc nhóm:** Phân công, cập nhật, góp ý và xử lý bất đồng.
5. **Giáo dục và lựa chọn học tập:** So sánh chương trình, mục tiêu và kết quả.
6. **Du lịch có kế hoạch:** Đọc hướng dẫn, điều chỉnh lịch và giải quyết sự cố.
7. **Sức khỏe cộng đồng:** Hiểu tư vấn, trình bày thói quen và đánh giá khuyến nghị.
8. **Truyền thông và mạng xã hội:** Tóm tắt thông tin, phân biệt ý kiến và sự kiện.
9. **Môi trường và tiêu dùng:** Phân tích hành vi, tác động và đề xuất thay đổi.
10. **Văn hóa và quan hệ:** Điều chỉnh cách nói theo vai, khoảng cách và ngữ cảnh.
11. **Kể chuyện có điểm nhìn:** Tổ chức sự kiện, nhân vật, động cơ và kết quả.
12. **Dự án giao tiếp thực tế:** Thực hiện phỏng vấn, báo cáo và phản hồi.

**Điều kiện sang cấp:** kiến thức 82%, tiếp nhận 80%, sản sinh 76%; bắt buộc: speaking task, writing portfolio, mock challenge.

### HSK 5

**Đầu ra:** Giao tiếp chính xác, phù hợp hơn trong công việc và học thuật phổ thông; tóm tắt và lập luận đơn giản.

1. **Tóm tắt và cấu trúc thông tin:** Ghi ý, nhận diện luận điểm và diễn đạt lại.
2. **Giáo dục và phát triển cá nhân:** Phân tích lựa chọn, động lực và kết quả.
3. **Công nghệ trong đời sống:** Giải thích tính năng, tác động và rủi ro.
4. **Truyền thông và độ tin cậy:** So sánh nguồn, nhận diện thiên lệch và tóm tắt tin.
5. **Kinh tế đời sống:** Giải thích giá cả, tiêu dùng, tiết kiệm và xu hướng.
6. **Tổ chức và quản lý:** Báo cáo tiến độ, ưu tiên, rủi ro và cải tiến.
7. **Tâm lý và quan hệ:** Phân tích cảm xúc, động cơ và chiến lược giao tiếp.
8. **Sức khỏe và khoa học phổ thông:** Đọc/đánh giá lời khuyên và chứng cứ cơ bản.
9. **Môi trường và thành phố:** Lập luận về chính sách đời sống và trách nhiệm.
10. **Văn hóa và sáng tạo:** Phân tích tác phẩm/sự kiện ở mức phổ thông.
11. **Lịch sử qua câu chuyện:** Kết nối sự kiện, bối cảnh và góc nhìn.
12. **Thuyết trình và hỏi đáp:** Tổ chức bài nói, dùng dẫn chứng và xử lý câu hỏi.
13. **Viết thực dụng nhiều đoạn:** Email trang trọng, báo cáo và đề xuất.
14. **Dự án tổng hợp:** Tổng hợp hai nguồn ngắn thành sản phẩm nói/viết.

**Điều kiện sang cấp:** kiến thức 84%, tiếp nhận 82%, sản sinh 78%; bắt buộc: source-based writing, presentation, final assessment.

### HSK 6

**Đầu ra:** Dùng tiếng Trung phong phú, lưu loát trong bối cảnh nghề nghiệp, học thuật và chủ đề phổ thông tương đối phức tạp.

1. **Đọc sâu và suy luận:** Theo dõi tham chiếu, hàm ý, cấu trúc và giọng điệu.
2. **Tin tức và diễn ngôn công cộng:** Phân tích khung tin, nguồn và cách trình bày.
3. **Khoa học và công nghệ:** Giải thích quy trình, bằng chứng, giới hạn và tác động.
4. **Kinh tế và tổ chức:** Đọc dữ liệu mô tả, nguyên nhân, rủi ro và quyết định.
5. **Giáo dục và nghiên cứu:** Hiểu câu hỏi nghiên cứu, phương pháp và kết quả phổ thông.
6. **Xã hội và thế hệ:** So sánh quan điểm, bối cảnh và hệ quả.
7. **Lịch sử và ký ức:** Phân biệt sự kiện, diễn giải và góc nhìn.
8. **Văn học và phong cách:** Đọc hình ảnh, giọng kể và hiệu quả biểu đạt.
9. **Môi trường và chính sách:** Đánh giá lợi ích, chi phí và bên liên quan.
10. **Đạo đức trong đời sống:** Xây lập luận, phản ví dụ và nhượng bộ.
11. **Giao tiếp nghề nghiệp nâng cao:** Chủ trì họp, đàm phán và xử lý bất đồng.
12. **Tóm tắt và diễn đạt lại:** Tổng hợp nguồn, tránh chép và giữ độ chính xác.
13. **Tranh luận có chứng cứ:** Phản biện lập luận và trả lời chất vấn.
14. **Dự án kết thúc trung cấp:** Thực hiện báo cáo đa kỹ năng có nguồn.

**Điều kiện sang cấp:** kiến thức 85%, tiếp nhận 83%, sản sinh 80%; bắt buộc: analytical essay, debate, mock exam.

### HSK 7

**Đầu ra:** Dùng tiếng Trung chuẩn mực, lưu loát trong nghề nghiệp, chuyên môn phổ thông và học thuật; bắt đầu dịch có hệ thống.

1. **Cầu nối diễn ngôn cao cấp:** Chuẩn hóa ghi chú, tóm tắt, register và chiến lược từ vựng 7–9.
2. **Báo chí và cấu trúc tin:** Phân tích tiêu đề, nguồn, dẫn lời, khung và hàm ý.
3. **Bài giảng và ghi chú:** Tổ chức luận điểm, ví dụ, chuyển ý và câu hỏi.
4. **Nghiên cứu nhập môn:** Đọc tóm tắt, câu hỏi, phương pháp và kết luận.
5. **Chính sách công cơ bản:** Nhận diện vấn đề, bên liên quan, công cụ và tác động.
6. **Kinh tế và dữ liệu mô tả:** Diễn giải xu hướng, nguyên nhân và giới hạn.
7. **Khoa học và truyền thông:** So sánh nghiên cứu với cách báo chí diễn giải.
8. **Văn hóa và bản sắc:** Phân tích khái niệm, ví dụ và khác biệt góc nhìn.
9. **Văn học hiện đại:** Đọc giọng kể, hình tượng và bối cảnh.
10. **Giao tiếp nghề nghiệp:** Thuyết trình, thương lượng và biên bản ở mức nâng cao.
11. **Lập luận và phản biện:** Kiểm tra giả định, chứng cứ và ngụy biện phổ biến.
12. **Dịch thông tin:** Dịch tin, giới thiệu, tóm tắt và lời nói có chuẩn bị.
13. **Phiên dịch nối tiếp nhập môn:** Nghe–ghi chú–chuyển đạt đoạn ngắn theo ý.
14. **Viết học thuật nhập môn:** Xây đoạn luận, trích dẫn ý và tránh sao chép.
15. **Dự án cấp 7:** Tổng hợp nhiều nguồn thành báo cáo và thuyết trình.

**Điều kiện sang cấp:** kiến thức 85%, tiếp nhận 84%, sản sinh 81%; bắt buộc: translation portfolio, academic presentation, level challenge.

### HSK 8

**Đầu ra:** Dùng tiếng Trung thích hợp, có chiều sâu trong nghề nghiệp và học thuật; tổng hợp, phản biện và dịch theo mục đích.

1. **Tổng hợp nhiều nguồn:** Kết nối điểm đồng/khác, bằng chứng và khoảng trống.
2. **Chính sách và quản trị:** Đánh giá mục tiêu, công cụ, hệ quả và đánh đổi.
3. **Luật và ngôn ngữ quy phạm:** Hiểu định nghĩa, điều kiện, ngoại lệ và mức độ bắt buộc.
4. **Kinh tế và phân tích:** Diễn giải dữ liệu, mô hình, rủi ro và quan điểm.
5. **Đạo đức và công nghệ:** Xây luận điểm, phản biện và xử lý xung đột giá trị.
6. **Khoa học, bằng chứng và bất định:** Đánh giá phương pháp, xác suất và giới hạn kết luận.
7. **Giáo dục và bất bình đẳng:** Tổng hợp nghiên cứu và quan điểm chính sách.
8. **Môi trường và phát triển:** Phân tích hệ thống, đánh đổi và trách nhiệm.
9. **Truyền thông và tu từ:** Phân tích framing, ẩn dụ, giọng điệu và thuyết phục.
10. **Văn học và phê bình:** Đối chiếu cách đọc, thủ pháp và bối cảnh.
11. **Xã hội và bản sắc:** Xử lý khái niệm trừu tượng và quan điểm đa chiều.
12. **Giao tiếp lãnh đạo:** Chủ trì, đàm phán, giải trình và xử lý khủng hoảng.
13. **Tranh luận và phản bác:** Xây rebuttal, concession và tổng kết.
14. **Dịch theo chức năng:** Điều chỉnh nội dung cho đối tượng, thể loại và mục đích.
15. **Phiên dịch nối tiếp:** Xử lý đoạn dài hơn, số liệu, thuật ngữ và tự sửa.
16. **Dự án cấp 8:** Tổng hợp nguồn, phản biện và sản phẩm song ngữ.

**Điều kiện sang cấp:** kiến thức 86%, tiếp nhận 85%, sản sinh 83%; bắt buộc: multi-source essay, debate, bilingual portfolio.

### HSK 9

**Đầu ra:** Dùng tiếng Trung chính xác, sâu sắc trong bối cảnh nghề nghiệp, chuyên môn và học thuật phức tạp.

1. **Đọc nghiên cứu chuyên sâu:** Đánh giá câu hỏi, phương pháp, bằng chứng và giới hạn.
2. **Lý thuyết và khái niệm trừu tượng:** Giải thích, đối chiếu và vận dụng khái niệm.
3. **Chính sách và phân tích hệ thống:** Tổng hợp nhiều cấp độ, bên liên quan và hệ quả dài hạn.
4. **Kinh tế vĩ mô và xã hội:** Phân tích lập luận, dữ liệu và giả định.
5. **Khoa học liên ngành:** Kết nối mô hình, bằng chứng và cách truyền đạt.
6. **Luật, hành chính và ngoại giao:** Xử lý register chính thức, điều kiện và tính mơ hồ có chủ ý.
7. **Triết học và đạo đức:** Xây/đánh giá lập luận trừu tượng và phản ví dụ.
8. **Văn học và liên văn bản:** Phân tích phong cách, giọng, biểu tượng và đối thoại văn bản.
9. **Truyền thông công chúng:** Biên tập thông điệp cho đối tượng và kênh khác nhau.
10. **Nghiên cứu và tổng quan tài liệu:** Tổ chức nguồn, lập khoảng trống và tổng hợp.
11. **Thuyết trình chuyên nghiệp:** Thuyết trình dài, hỏi đáp khó và ứng biến.
12. **Tranh luận chuyên sâu:** Xử lý định nghĩa, chứng cứ, phản bác và tổng kết.
13. **Dịch học thuật:** Dịch khái niệm, lập luận, trích dẫn và cấu trúc thông tin.
14. **Dịch nghề nghiệp:** Dịch báo cáo, hành chính, truyền thông và tình huống họp.
15. **Phiên dịch và quản lý thông tin:** Ghi chú, phân đoạn, tự sửa và giữ lập trường người nói.
16. **Capstone HSK 1–9:** Hoàn thành nghiên cứu/tình huống đa kỹ năng có phản biện.

**Điều kiện sang cấp:** kiến thức 87%, tiếp nhận 86%, sản sinh 84%; bắt buộc: capstone, translation/interpreting portfolio, mastery review.

## 6. Vòng đời kiến thức

1. **Introduce:** gắn `firstIntroducedIn`, prerequisite và mục tiêu giao tiếp.
2. **Retrieve:** gọi lại ở dạng bài khác, không sao chép stem.
3. **Expand:** dùng trong chủ đề/register mới, khai báo `expansionOf`.
4. **Assess:** có bằng chứng receptive lẫn productive.
5. **Space:** ôn 1/3/7/14/30 ngày, ưu tiên vùng yếu bằng metadata.

## 7. Assessment và human review

Mỗi cấp có diagnostic, quiz bài, unit checkpoint, mid-level, final, speaking, writing, mock/challenge và mastery review. Từ HSK5 có rubric dịch; HSK7–9 có dịch nói/viết thực chất.

Validator không thay human review. Mẫu tối thiểu mỗi level: 30 từ, 10 điểm ngữ pháp, 5 hội thoại, 45 câu, 5 bài nghe, 5 bài đọc, 5 bài viết, 40 bài tập, 20 lời giải và 30 bản dịch. Review phải ghi người review, lỗi, sửa, confidence và unresolved issues.

## 8. Gate Phase C1

C1 được phép bắt đầu vì C0 không còn blocker thiết kế. C1 chưa được phép mở production cho đến khi:

- level/unit/lesson/grammar/character/exercise/assessment graph hoàn chỉnh;
- Vietnamese và pedagogy sampling do người có năng lực thực hiện;
- dependency/difficulty/duplicate/answer/source validators xanh;
- audio strategy có nguồn và graceful fallback;
- learner-facing mobile/browser smoke xanh;
- CTI rollout status được kiểm tra lại;
- production flags và quality gate chỉ đổi sau phê duyệt riêng.
