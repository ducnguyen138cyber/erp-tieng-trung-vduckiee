# Nghiệm thu đồng bộ tiến độ và ôn tập (PR #124)

PR #123 đã merge tại `507b2d44`. Cloudflare Production deployment `66eddff1` thành công; mở trực tiếp HSK3 bài03 xác nhận đề ngữ pháp và tự đối chiếu mới. Bản này là giai đoạn kế tiếp, nhánh riêng, **không tự merge**.

## Thay đổi và giữ dữ liệu

| Phần | Hành vi mới | Dữ liệu cũ |
| --- | --- | --- |
| HSK | Hợp nhất từng bài/câu/từ và vị trí; cập nhật nền không tải lại bài đang mở do mirror lượt xem cũ | Giữ completedAt, kết quả và vị trí; completion không tự thành mastery |
| Ôn từ HSK | Nghĩa Việt → tự gõ từ Hán đã học; xem mẫu không tính đúng; cùng ngày không tăng mức nhớ; 3 lượt gọi lại đúng sau khoảng hạn 1,3,7 ngày mới tính ghi nhớ | Stage/counters cũ vẫn lưu, không coi là bằng chứng nhớ cách ngày |
| Shadowing | Đồng bộ câu, cấp, tùy chọn, mục lưu/cần luyện; tombstone khi bỏ đánh dấu | Giữ ID/cờ cũ; bản ghi âm trên thiết bị, không đưa vào hồ sơ |
| Bài luyện | Lưu draft theo phiên, câu đã trả lời, deadline gốc, điểm cao và lịch sử; thiết bị kia tiếp tục lượt đó | Giữ best/attempts cũ, không thêm thời gian hoặc EXP |
| Daily | Hồ sơ chung nhận dữ liệu từ system row cũ; hợp nhất từng từ/bài; lượt trả lời mới có ID để gộp cả hai thiết bị và chống cộng trùng | Giữ baseline correct/wrong/skills/stage; không tạo lại lịch sử chưa từng được lưu |
| Hôm nay | Dùng đoạn mô tả hiện có cho bài tiếp tục, số từ yếu và gợi ý học 5 phút | Không thêm card, đổi cột hoặc sidebar |

Tiếp tục dùng `public.user_words` và hồ sơ v82, không tạo bảng/migration, không thay dữ liệu Production. Ghi theo quy trình đọc mới nhất → hợp nhất → UPDATE có điều kiện theo `updated_at` server; xung đột/INSERT trùng được đọc lại và thử lại tối đa 4 lần. Chưa thành công thì cache theo tài khoản, báo đang chờ và thử lại. Offline không báo đã đồng bộ.

## Bằng chứng kỹ thuật

- **72 test Node liên quan đạt** ở checkpoint sau sửa Daily đồng thời. Có test retry không mang mastery của lượt cũ; hai thiết bị ghi đồng thời; replay không nhân đôi; sai/xem đáp án không tạo ghi nhớ; lịch 1–3–7; Shadowing bỏ lưu; draft/deadline; phản hồi muộn sau đổi tài khoản.
- Postgres17 CI chạy nguyên schema/policies của repository, hai owner riêng và role anonymous: own read/write được phép, cross-owner read/update/delete bị chặn, insert/reassign trái owner bị chặn. Chạy trên database dùng một lần và rollback, không chạy trên Production.
- Supabase thực tế chỉ kiểm tra metadata: user_words bật RLS, owner policies đúng, PK và trigger updated_at tồn tại. Không đọc hàng học tập của người dùng.
- Browser Preview dùng hai context desktop1440/mobile390, mã ứng dụng thật, auth/REST fixture cô lập. Hành trình gồm dữ liệu cũ, học hai bài, xem đáp án, Shadowing, bài luyện dở, Daily, offline/reload/reconnect, A→B→đăng xuất→A. Trạng thái cuối xem job **Learning progress and spaced recall** và `journeys.json`, không coi việc viết test là đã chạy đạt.
- Artifact `learning-progress-desktop-mobile`: screenshots, trace từng thiết bị, journeys.json. Các workflow học liệu, HSK4–6, giao diện, game, EXP, Vietnamese tiếp tục chạy; kết quả cuối được ghi tại mô tả PR.

## Giới hạn cần nghiệm thu minh bạch

1. **Chưa thử đăng nhập bằng hai tài khoản Supabase thật qua email/OTP.** Browser thay auth/REST bằng fixture, còn RLS được chạy riêng trên Postgres. Không đồng nhất hai loại bằng chứng này với E2E hosted Auth.
2. Hai context là giả lập hai thiết bị, không phải kiểm tra phần cứng iPhone/Android hoặc trình duyệt Safari. Offline thử bài đã mở và cache đủ; nội dung chưa tải vẫn cần mạng. Hoạt động Auth thật/CDN trong một lần mở offline lạnh chưa được chứng minh bởi fixture.
3. Xung đột vị trí/tùy chọn dùng timestamp và tie-break ổn định; đồng hồ thiết bị sai quá nhiều có thể chọn vị trí không như mong muốn. Câu trả lời mới có ID nên vẫn giữ được sự kiện riêng. Counter cũ chỉ giữ baseline, không suy diễn thành lịch sử từng lần.
4. Client/tab cũ cần tải lại sau phát hành để dùng cơ chế ghi mới. Không thể bảo đảm tab chạy mã cũ không ghi đè snapshot bằng giao thức cũ. Không tự triển khai trigger/migration để chặn client cũ.
5. Ôn gọi lại là kiểm tra **từ mục tiêu đã học**, không phải chấm tự do mọi từ đồng nghĩa hay chứng nhận trình độ tiếng Trung. Mốc ngày dùng đồng hồ giả trong unit test, chưa phải nghiên cứu theo dõi người học thực tế 7 ngày.
6. Giữ nguyên quality gate và trạng thái kiểm duyệt. Daily công xưởng giữ tên stage cũ; các stage này không được nhập thành bằng chứng mastery HSK. Không thêm/chỉnh corpus trong PR này.
7. Sửa runner hậu triển khai visuals sang Ubuntu24.04 vì ubuntu-latest26.04 không hỗ trợ Playwright1.58.2 đang ghim. Job main sau merge123 đã lỗi ở cài Chromium; không phải bằng chứng hình ảnh Production bị hỏng. Fix chỉ có hiệu lực main sau khi PR124 được nghiệm thu/merge.

## Kết quả browser đã chạy

Head `1c0af8c` chạy trên Preview bất biến `https://0a4a6306.vduckie.pages.dev/`: cả 3 job merge/recall, RLS và browser đạt (run `43387666627`). 7 nhóm kiểm tra browser đạt, 0 page error; một xung đột ghi thực sự được thử lại thành công. Browser xác nhận index.html đã cache có redirected=true; chuẩn hóa response đã giúp reload offline và nối lại đồng bộ thành công. 82 test Node liên quan (72 + 10 service worker) local đạt. Ảnh/trace/journeys trong artifact `14019232109`.

Các sửa từ browser: mirror lượt xem/cài đặt chỉ đổi timestamp không tải lại bài đang học; Shadowing theo dõi chủ tài khoản ngay cả khi chưa mở; Daily giữ cả hai lượt sai trên hai thiết bị; khoảng trống nút điều hướng tránh Duckie Chat; thiếu dữ liệu nét không phát unhandled rejection và vẫn học tiếp. Không nới timeout hoặc bỏ assertion kiểm tra lỗi.

Head tiếp theo bổ sung xác nhận **bài thực sự đang hiển thị sau reload** phải khớp lessonId trong URL (không chỉ đọc localStorage) và chụp ảnh điện thoại ở bài luyện đã tiếp tục. Kết quả head cuối cùng/CI hồi quy ghi tại PR.

## Trạng thái bàn giao

PR đang Draft; hoàn thành browser/regression và cập nhật mô tả PR trước khi xin nghiệm thu. Không tự merge PR124. Các giới hạn Auth thật/offline lạnh cần được xác minh trước khi tuyên bố toàn bộ yêu cầu đồng bộ đa thiết bị đã đạt.
