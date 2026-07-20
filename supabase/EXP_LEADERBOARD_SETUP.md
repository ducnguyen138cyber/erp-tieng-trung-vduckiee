# Bật backend EXP và Bảng xếp hạng

Frontend v89.0 đã được nối sẵn nhưng backend chỉ hoạt động sau khi migration được chạy thành công.

1. Mở Supabase Dashboard của project đang dùng trên website.
2. Chọn **SQL Editor** → **New query**.
3. Mở file `supabase/migrations/create_exp_leaderboard.sql` trong repository, dán toàn bộ nội dung vào SQL Editor.
4. Bấm **Run** bằng tài khoản owner/admin của project.
5. Đăng xuất rồi đăng nhập Google lại trên website, hoặc tải lại trang. Hàm `sync_my_profile()` sẽ đồng bộ `full_name/name` và `avatar_url/picture` vào `profiles`.
6. Mở tab **Xếp hạng** và hoàn thành một bài thật để kiểm tra.

Không thêm `service_role` key vào frontend. Frontend chỉ dùng publishable key hiện có và gọi RPC. Số EXP, chống trùng và giới hạn ngày đều được quyết định trong database.


## Kiểm tra nhanh sau khi chạy

- Mở **Database → Tables** và xác nhận có `profiles`, `exp_transactions`.
- Mở **Database → Functions** và xác nhận có `award_exp`, `get_my_exp`, `get_leaderboard`, `get_my_rank`, `sync_my_profile`.
- Không cấp quyền INSERT trực tiếp cho `exp_transactions`; migration cố ý chỉ cho đọc giao dịch của chính người dùng.
- Một website tĩnh không thể chứng minh tuyệt đối hành vi học trước người cố tình gọi RPC từ Console. Migration giảm rủi ro bằng điểm cố định phía database, định dạng nguồn, khóa chống bấm đồng thời, chống trùng và hạn mức ngày; tuyệt đối không cho trình duyệt truyền số EXP.
