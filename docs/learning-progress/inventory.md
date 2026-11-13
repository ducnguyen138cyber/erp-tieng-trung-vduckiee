# Đồng bộ tiến độ và ôn tập — giai đoạn sau PR #123

Base `507b2d44` (PR123 đã merge); Cloudflare Production deployment `66eddff1` thành công, mở bài HSK3-03 trên Production xác nhận đề sửa và chế độ tự đối chiếu.

| Module | Dữ liệu đang có | Truyền tải trước thay đổi | Vấn đề cần xử lý |
| --- | --- | --- | --- |
| HSK1–3 | `vduckie-hsk-study-journey-v1`: bài, vị trí thẻ, phần đã xem, đáp án, SRS | Hồ sơ v82 trong system row `user_words` | LWW cả field khi timestamp khác: hai thiết bị làm hai bài có thể ghi đè nhau; upload không đọc lại server |
| Flashcard/ôn tập HSK | `reviews` trong journal | Cùng hồ sơ v82 | Bấm “Đã nhớ” sau khi hiện đáp án có thể tăng stage ngay; cần bằng chứng nhớ lại cách ngày |
| Shadowing | `vduckie-shadowing-v1`: cấp/câu, nhóm, mục lưu/cần luyện | Trên thiết bị, chưa nằm trong allowlist v82 | Cần đồng bộ vị trí/đánh dấu, giữ ghi âm cục bộ |
| Bài luyện HSK | `vduckie-hsk-practice-exams-v2`: kết quả từng mã bài | Trên thiết bị, chưa nằm trong allowlist v82 | Chưa lưu bài dở; cần lịch sử và kết quả theo từng mã, giữ EXP bằng 0 |
| Daily Learning | `vduckie-daily-learning-v1` | System row riêng `__vduckie_daily_learning_v1__` | LWW cả snapshot, bộ nhớ UI và dữ liệu cũ cần gắn đúng chủ tài khoản |

## Supabase đã kiểm tra (chỉ đọc cấu trúc, không đọc tiến độ người dùng)

Project `vduckie-chinese` hoạt động. `public.user_words` bật RLS. SELECT/INSERT/UPDATE/DELETE đều dành cho authenticated và ràng buộc `auth.uid() = user_id`; UPDATE có cả USING và WITH CHECK. Khóa chính `(user_id, word_key)`. Trigger `set_user_words_updated_at` đặt `updated_at = now()` mỗi UPDATE, dùng được để cập nhật có điều kiện và thử lại khi xung đột.

Advisors không báo thiếu RLS trên bảng này. Có cảnh báo ngoài phạm vi về các RPC EXP/BXH có SECURITY DEFINER và cấu hình mật khẩu; không tự sửa quyền hoặc tính năng đó. RLS metadata không thay thế ca thử thực tế với hai tài khoản. Không tạo schema hoặc thay dữ liệu Production trong bước kiểm kê.

## Kiểm thử đang triển khai

Hai thiết bị/hai danh tính cô lập, dữ liệu cũ, xung đột, cập nhật đồng thời, đăng xuất/đăng nhập, offline/reconnect; nhớ lại 1–3–7 ngày và xem đáp án không được thành thạo. Phân biệt rõ fixture browser với đăng nhập tài khoản Supabase thật trong báo cáo nghiệm thu.

CI sau merge PR123: HSK quality/HSK+EXP đạt; job hậu triển khai visuals thất bại ở cài Chromium vì ubuntu-latest đã chuyển 26.04, Playwright 1.58.2 không hỗ trợ. Ghim runner Ubuntu24.04 cho job này, không bỏ test hay đổi budget.
