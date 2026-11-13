# Báo cáo kiểm duyệt kỹ thuật học liệu HSK1–3

Ngày: **13/11/2026**. Nhánh: `audit/hsk123-content-reliability`. PR: [#123](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/pull/123). Base `main`: `6fba328c5d74dbfaa1909e6b54e0f6ec4391227e`. **Chưa merge.**

Đã triển khai kiểm kê, sửa lỗi xác nhận, kiểm tra hồi quy và cơ chế lưu bằng chứng. Đây là kiểm duyệt kỹ thuật và biên tập có hỗ trợ máy; **chưa có kiểm duyệt chuyên môn độc lập**. Không tuyên bố toàn bộ học liệu chính xác.

## 1. Phạm vi thực tế

| Cấp | Bài học | Từ chuẩn | Câu trong shard | Ngữ pháp | Bài tập | Chữ | Đánh giá | Tổng bản ghi chuẩn |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| HSK1 | 24 | 300 | 900 | 21 | 120 | 50 | 13 | 1.439 |
| HSK2 | 28 | 200 | 0 | 29 | 168 | 60 | 13 | 509 |
| HSK3 | 36 | 500 | 0 | 42 | 252 | 100 | 15 | 958 |
| Tổng | 88 | 1.000 | 900 | 92 | 540 | 210 | 41 | 2.906 |

Tổng còn gồm 32 chương và 3 bản ghi cấp độ. Đã đọc **70 tệp JSON**, kiểm tra cấu trúc/liên kết/đáp án/nhãn nguồn/phiên bản và 1.900 cặp Hán–Pinyin của từ/câu. Kiểm tra thêm **833 mục enrichment** (133/200/500), không cộng trùng vào 1.000 từ chuẩn. Hội thoại, đoạn đọc/nghe nằm trong các bài học; không tính thành bài học mới.

Rà sâu tập trung vào nội dung có dấu hiệu bất thường. Máy không chứng minh được toàn bộ sắc thái nghĩa, độ tự nhiên, tính phù hợp cấp độ hay năng lực giao tiếp.

## 2. Lỗi xác nhận và xử lý

Áp dụng bộ kiểm tra cuối cùng lên dữ liệu `main` gốc: **27 Critical, 2.134 High, 0 Medium, 124 Low**. Đây là số lần vi phạm quy tắc; một bản ghi có thể mắc nhiều lỗi. Có **2.152 ID** liên quan đến lỗi xác nhận.

| Nhóm | Mức độ | Số | Xử lý |
|---|---|---:|---|
| Đáp án HSK3 không liên quan câu nguồn | Critical | 27 | Gắn lại yêu cầu với nghĩa của ví dụ ngữ pháp có sẵn, bỏ chấm theo câu sai, dùng tiêu chí tự đối chiếu |
| Nhãn kiểm duyệt không có bằng chứng độc lập | High | 1.474 | Hạ về `unreviewed`: 1.341 bản ghi chuẩn và 133 enrichment; giữ giá trị trước trong lịch sử |
| Pinyin dạng số mất thanh âm tiết trước | High | 474 | Phục hồi từ chính Pinyin có dấu đã có: HSK2 112, HSK3 362; không đoán cách đọc mới |
| Câu trả lời theo ý nghĩa/sửa câu bị so khớp chuỗi | High | 114 | Tự đối chiếu theo ý nghĩa/bằng chứng; không gán đúng/sai tự động |
| Transcript câu nghe lộ trước khi trả lời | High | 52 | Che trước khi nộp; runtime có quy tắc mặc định cho HSK1–3 |
| Câu hỏi nghe trình tự/thái độ dùng đáp án chi tiết | High | 12 | Nối lại đúng câu hỏi trong nguồn, ghi rõ luyện nghe chi tiết |
| Câu đọc dùng object đáp án nhưng thiếu rubric | High | 4 | Bổ sung tiêu chí và hiện ý cần có/bằng chứng sau khi trả lời |
| Biến thể đúng của bài sắp xếp bị loại | High | 4 | Bổ sung biến thể thời gian trước chủ ngữ, đổi thứ tự hai câu độc lập, đảo hai lựa chọn 还是 |
| Đáp án chấp nhận trùng sau chuẩn hóa dấu câu | Low | 124 | Loại trùng, giữ ý nghĩa |

**Không còn lỗi xác nhận chưa xử lý theo các quy tắc đã triển khai.** Ngoài các lỗi xác nhận, một số câu sản sinh được chuyển sang tự đối chiếu để tránh áp một câu mẫu duy nhất; không coi mọi cách diễn đạt khác mẫu là sai. Tổng cộng **2.173 bản ghi đã sửa**, gồm HSK1 1.474 (có 133 enrichment), HSK2 191, HSK3 508. Đồng bộ thêm nhãn nguồn của **300 ví dụ từ điển**; câu, Pinyin và nghĩa của các ví dụ này giữ nguyên.

Bằng chứng theo ID/đường dẫn/trường trước–sau/lý do nằm trong:

- `docs/hsk123-content-changes.json`: toàn bộ 2.173 bản ghi sửa, mỗi ID tăng đúng một phiên bản so với base.
- `docs/hsk123-derived-changes.json`: 300 mục từ điển tái sử dụng.
- `reports/hsk123/findings.json`: dữ liệu gốc được kiểm tra lại bằng bộ quy tắc cuối.
- `reports/hsk123/baseline.json`: checkpoint kiểm kê ban đầu, giữ nguyên.
- `reports/hsk123/current.json`: kết quả hiện tại và danh sách cảnh báo cần xác minh.

## 3. Ví dụ trước/sau

| ID | Hán / Pinyin / Việt | Trước | Sau |
|---|---|---|---|
| `hsk2-v-0101` | 门口 · ménkǒu · cửa ra vào | `menkou3` thiếu thanh 2 của mén | `men2 kou3` |
| `hsk3-v-0201` | 健康 · jiànkāng · sức khỏe; khỏe mạnh | `jiankang1` thiếu thanh 4 của jiàn | `jian4 kang1` |
| `hsk3-lesson-04-exercise-2` | 我终于找到了护照。 · Wǒ zhōngyú zhǎodào le hùzhào. · Cuối cùng tôi tìm thấy hộ chiếu. | Câu này là đáp án bắt buộc cho một yêu cầu giữ ý về cải thiện nghe — lệch nội dung | Yêu cầu mới dùng đúng nghĩa của ví dụ có sẵn, mẫu chỉ để tham khảo sau khi trả lời; dùng rubric |
| `hsk1-lesson-12-exercise-2` | 下午三点我们见。 · Xiàwǔ sān diǎn wǒmen jiàn. · Chiều ba giờ chúng ta gặp nhau. | Chỉ chấp nhận 我们下午三点见。 | Chấp nhận cả hai vị trí của cụm thời gian |

Các trường chữ Hán, Pinyin có dấu và nghĩa từ vựng chuẩn **không bị sửa hàng loạt bằng suy đoán máy**. Những thay đổi Pinyin là sửa biểu diễn số, không phải chứng nhận phát âm.

## 4. Kiểm tra tự động và kiểm duyệt độc lập

| Cấp | Qua các kiểm tra máy đã triển khai | Được kiểm duyệt chuyên môn độc lập |
|---|---:|---:|
| HSK1 | 1.439/1.439 — 100% | 0/1.439 — 0% |
| HSK2 | 509/509 — 100% | 0/509 — 0% |
| HSK3 | 958/958 — 100% | 0/958 — 0% |

100% ở cột máy chỉ có nghĩa các bản ghi qua những quy tắc cấu trúc, liên kết và hợp đồng trả lời đã lập trình. **Không phải 100% đúng kiến thức/ngôn ngữ.** Không ai được tự ký kiểm duyệt thay giáo viên.

Quy trình trạng thái: `unreviewed → machine-checked → human-reviewed → approved`. Kết quả máy lưu ở sidecar theo ID, phiên bản và hash tệp. Chuyển trạng thái chuyên môn cần người kiểm duyệt, ngày, nguồn/bằng chứng, phiên bản/hash đúng; bước approved cần người phê duyệt khác. `docs/hsk123-review-events.json` hiện **rỗng**. Không mở `qualityGate`, không tự gắn human-reviewed/approved.

## 5. Kiểm thử và blocker

- **97 kiểm thử Node liên quan đạt**, 0 thất bại; thêm **3 kiểm thử Python** cho chuyển thanh, đa âm theo ngữ cảnh và không đoán 儿化 đều đạt.
- Kiểm tra cấu trúc toàn repo có sẵn: 10.695 bản ghi, 0 lỗi. Đây không phải rà chuyên môn HSK4+.
- C2 generator được bổ sung bước áp lại các sửa đổi có lịch sử, tránh ghi đè chúng khi kiểm tra tính tái lập.
- Checkpoint `0c97d88`: **18/18 hành trình browser đạt** (đầu/giữa/cuối mỗi cấp × desktop 1440 và mobile 390), gồm học từ → các phần nội dung → làm bài/xem đáp án → hoàn thành → tải lại → ôn. Kiểm tra câu sai có chủ ý, đáp án khóa, rubric và giữ bản ghi hoàn thành cũ trong profile khách cô lập. Đây là thử nghiệm có chọn mẫu, không phải mọi câu/biến thể.
- Cũng tại checkpoint đó: HSK3–4 browser, khóa HSK5–6, kiểm tra Home/layout/Shadowing/dictionary, 224 bài luyện, Public Load và game regression đã đạt.
- Đã kiểm tra trực tiếp Cloudflare Preview HSK1–3: che/mở transcript, biến thể họ giáo viên, câu viết khác mẫu dùng rubric. Không đăng nhập hoặc ghi dữ liệu học vào tài khoản thật.
- **Đang chờ chạy lại CI trên commit bổ sung cuối**; kết quả cuối được ghi thêm bên dưới. Không dùng kết quả của commit cũ để tự nhận commit mới đã qua.

CI rộng có **3 test tồn tại từ main** liên quan version asset EXP/mascot: `production loads V106.1…`, `all new assets have cache-busted…`, `EXP reward guide matches…`. Đối chứng trên cây code nguyên gốc có cùng tree SHA `18bb69ff25c51e7bea48fb67a6e364bba7b5c05f` cũng thất bại đúng 3 test này (11/14 đạt). Chúng không được đóng, bỏ qua hay đổi assertion để lấy kết quả xanh. Hệ thống EXP/mascot nằm ngoài phạm vi sửa; **CI toàn repo chưa được tuyên bố xanh**.

## 6. Cần chuyên môn xác nhận và giới hạn

Còn **430 cảnh báo máy chưa xác minh**: 41 trường hợp căn âm tiết bảo thủ chưa xử lý được và 389 khác biệt cách đọc theo từ/ngữ cảnh (có 205 mục chứa cờ đa âm theo ngữ cảnh). Nhiều trường hợp có thể là âm nhẹ, biến điệu, 儿化 hoặc tên riêng hợp lệ; **không gọi đây là 430 lỗi Pinyin**. Danh sách đầy đủ theo ID và bằng chứng trong `current.json`.

Ưu tiên chuyên gia: phân loại 430 cảnh báo; kiểm tra mục tiêu và độ tự nhiên của 27 nhiệm vụ ngữ pháp đã chỉnh; 12 câu nghe; đáp án tham khảo/rubric của câu mở; nghĩa theo ngữ cảnh, từ loại, hội thoại và độ khó của học liệu còn lại. Nguồn ghi là chuẩn/đề cương HSK cần được đối chiếu đúng phiên bản; tồn tại source ID không chứng minh nội dung tuân thủ nguồn.

Audio vẫn là TTS/bản nháp, không phải bản thu được xác minh. Các bài đã học có thể dùng lại dữ liệu ở phần đọc/nói: đây là luyện có hướng dẫn, chưa chứng minh nghe độc lập; bài đọc số không tự chứng minh phân biệt đủ bốn thanh. Chưa chấm phát âm hay kỹ năng viết mở bằng máy. Một số bài sắp xếp/sản sinh có thể còn biến thể hợp lệ ngoài mẫu và cần tiếp tục rà; không cam kết bao phủ mọi trường hợp.

Tiến độ/ID hiện có được giữ; không có migration dữ liệu người học. Shadowing và từ điển không dùng khóa đáp án bài tập hoặc Pinyin dạng số; không thay nội dung ngôn ngữ của chúng trong lần sửa này, riêng metadata kiểm duyệt từ điển được đồng bộ. Không coi các phần tái sử dụng đó đã được chuyên gia duyệt toàn bộ.

## 7. Điểm tiếp tục

PR #123 chứa checkpoint kiểm kê và sửa lỗi; không merge tự động. Sau khi CI cuối hoàn tất, xem phần cập nhật kết quả ở dưới, rồi dùng danh sách cảnh báo/bằng chứng để tổ chức kiểm duyệt độc lập. Không tái tạo ngân hàng hoặc đổi ID để xử lý cảnh báo.
