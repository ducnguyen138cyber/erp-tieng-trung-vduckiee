# Thiết lập EXP, Level và nhiệm vụ tuần v90

Backend chỉ hoạt động sau khi chạy migration:

`supabase/migrations/upgrade_exp_level_weekly_v90.sql`

## Cách chạy

1. Mở Supabase Dashboard.
2. Chọn **SQL Editor → New query**.
3. Sao chép toàn bộ migration và bấm **Run** bằng tài khoản owner/admin.
4. Kiểm tra các bảng: `profiles`, `exp_transactions`, `learning_events`.
5. Kiểm tra RPC: `sync_my_profile`, `award_exp`, `record_learning_event`, `get_my_exp`, `get_leaderboard`, `get_my_rank`, `get_weekly_missions`, `claim_weekly_mission`.
6. Đăng xuất, đăng nhập Google lại và tải trang `?v=90.0`.

## Level

Level được tính từ tổng EXP toàn thời gian, không lưu thành cột riêng:

- EXP cần hoàn thành Level hiện tại: `level * 200`
- Level 1: 0–199
- Level 2: 200–599
- Level 3: 600–1.199
- Level 4: 1.200–1.999
- Level 5: 2.000–2.999

## Nhiệm vụ tuần

- Học đủ 5 ngày: `+100 EXP`
- Ôn 10 từ vựng: `+50 EXP`
- Làm 1 bài kiểm tra: `+50 EXP`

`claim_weekly_mission()` kiểm tra bằng chứng trong `learning_events`, tự quyết định số EXP và dedupe theo tuần `Asia/Ho_Chi_Minh`. Frontend không gửi `exp_amount`.

Nếu giao diện báo cần migration v90, schema Supabase vẫn đang ở bản cũ. Không dùng service-role key trong frontend.
