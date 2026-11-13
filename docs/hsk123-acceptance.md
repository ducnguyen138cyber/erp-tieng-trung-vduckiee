# Nghiệm thu PR #123 (2026-11-13)

Kế thừa kiểm kê và bằng chứng của PR, không kiểm duyệt lại từ đầu. Đây là phát hành sửa kỹ thuật, không phải chứng nhận học liệu đã được giáo viên duyệt.

- Đối chiếu 27 đề HSK3 đã sửa với ví dụ và công thức của chính grammarFocus; giữ tự đối chiếu, không chấm một đáp án mẫu thành đúng/sai.
- Phát hiện thêm 6 câu connector-cloze có nguồn và đáp án khác nghĩa (bài 03, 09, 15, 21, 27, 33): sửa yêu cầu theo nghĩa ví dụ ngữ pháp gốc, chuyển sang tự đối chiếu. Ba bài mở 01, 19, 36 cũng có nguồn không phù hợp cấu trúc và thiếu mẫu: sửa cùng nguyên tắc. Thêm đáp án giải thích ngữ cảnh cho 6 usage-explanation. Bằng chứng trước/sau: [15 mục](hsk123-acceptance-corrections.json). Không đổi ID; phiên bản cuối PR vẫn được đối chiếu với main gốc trong change ledger.
- Tổng số record có thay đổi trực tiếp trong PR: **2.176**, tăng 3 so với bàn giao trước. Sáu lỗi chấm đáp án thêm được xác nhận Critical; ba bài mở thiếu mẫu/ngữ cảnh và sáu bài giải thích thiếu mẫu là High. 27 Critical trước đó vẫn đã được xử lý. Các mẫu cũ còn lại chưa qua kiểm duyệt chuyên môn.
- 474 trường Pinyin số: giữ nguyên Hán tự, Pinyin có dấu và nghĩa gốc, regression đối chiếu từng ID. Không thay chữ/tone-mark theo pypinyin.
- 52 transcript: vẫn ẩn trước câu trả lời không rỗng, hiện sau khi tự đối chiếu. Browser regression kiểm tra hành vi này cùng luồng đã học/không tự thành thạo.
- Toàn bộ câu vừa chuyển từ đáp án chuỗi sang rubric có đáp án tham khảo/ý trả lời/bằng chứng nguồn. Bài nói/viết mở đã tồn tại trước PR chưa đồng loạt được sáng tác thêm mẫu; giới hạn này được giữ rõ. Hệ thống không chấm tự động chúng.
- [430 cảnh báo cách đọc](hsk123-pronunciation-review.md): 415 có thể hợp lệ (âm nhẹ, 一/不, 谁, 儿 hóa), 15 cần chuyên môn; **0 lỗi phát âm được xác nhận trong nhóm cảnh báo này**. Mỗi mục có ID, Hán, Pinyin, Việt, câu nguồn, lý do, sourceIds và tài liệu đối chiếu. Phân loại không phải teacher verdict. Không tự sửa hoặc nâng reviewStatus; qualityGate vẫn locked.

## CI và tài nguyên

Ba assertion cũ được tái hiện trên main `6fba328`. Test mới chạy chính loader index.html với shell thật, xác minh mỗi asset đúng một lần, có khóa cache, file tồn tại/parse được và thứ tự tải. Kiểm tra browser còn đối chiếu bytes phản hồi HTTP 200 với file thực tế, ghi SHA256. Phát hiện precache EXP core vẫn giữ URL cũ: sửa đúng URL đang tải, không thay mã EXP hoặc mascot.

Game performance: hai run 43344968452 (attempt đầu) và 43346733402 đều dừng tại click choose trước khi lấy mẫu 1440-hard-optimized; log ghi nút visible/enabled/stable, không có failure ở budget gameplay. Artifact đầu chỉ có ảnh easy/medium, video hard-baseline và video optimized trắng; **không có trace trước sửa**. Không thể suy từ đó rằng game chậm. Sửa riêng harness: đợi lifecycle document.write/paint-guard hoàn tất; mỗi mẫu dùng browser process mới để tách tài nguyên video/renderer giữa các mẫu. Giữ nguyên CPU 4x, timeout 15s, toàn bộ threshold và bàn phím/click thật. Thu trace từng mẫu và screenshot/JSON khi lỗi. Không sửa game production.

CI/Preview cuối cùng sẽ được bổ sung sau khi chạy bản sửa này; chưa dùng kết quả cũ để tuyên bố bản mới đạt.
