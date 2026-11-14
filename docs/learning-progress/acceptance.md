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

### Khôi phục phiên bị gián đoạn — 2026-11-14

Đã đối chiếu GitHub: cả 13 commit từ `7edede3` đến `1f5d755` đã có trên nhánh `feat/learning-progress-sync-review`. Các sửa callback Daily, không tải lại bài khi đồng bộ nền, giữ hai lượt trả lời Daily, chủ tài khoản Shadowing, chuẩn hóa Cloudflare redirected response và fallback thiếu nét đều đã push. Không tìm được workspace của chính phiên này để phục hồi thêm thay đổi chưa commit; các checkout còn lại thuộc công việc cũ. Không làm lại các sửa đã có.

**CI trên `1f5d755`: 9/9 workflow SUCCESS**, đã kiểm tra từng run qua GitHub API:

| Workflow | Run |
| --- | --- |
| Learning progress and spaced recall | [43389465406](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465406) |
| HSK 224 Exam Targeted Acceptance | [43389465410](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465410) |
| Shadowing HSK2–3 Acceptance | [43389465528](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465528) |
| P1 Public Load Lab | [43389465463](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465463) |
| Vietnamese learning module | [43389465327](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465327) |
| Typing game browser verification | [43389465381](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465381) |
| Sidebar stability | [43389465332](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465332) |
| HSK Content Quality | [43389465527](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465527) |
| HSK current learner browser contracts | [43389465437](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465437) |

Log browser của run `43389465406` xác nhận Preview đúng head `https://a2c1f91a.vduckie.pages.dev/`, 7 nhóm hành trình PASS, `errors: []`, 44 lượt ghi, 1 xung đột đã thử lại. Cache index thực tế có `redirected: true`; reload offline vẫn PASS. [Artifact 14020097245](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43389465406/artifacts/14020097245) giữ ảnh, trace và journeys. Đây là bằng chứng mới nhất của phiên cũ, không dùng checkpoint cũ hơn thay cho head cuối.

Phiên khôi phục chạy lại **86/86 targeted Node tests PASS**, không skip, gồm 11 file merge/Daily/HSK/practice/Shadowing/EXP hiện có, cộng `tests/sidebar-service-worker.test.js` (10 test) và `tests/hsk-stroke-lazy-load.test.mjs` (3 test). Syntax và diff checks PASS. Checkpoint này chưa phát hiện lỗi ứng dụng mới; kiểm tra deadline bổ sung sau đó đã tìm thấy lỗi và được sửa như phần cuối báo cáo.

Commit `6fabc4d` bổ sung hai ca browser: thay một bản Daily JS cũ trong warm cache rồi kiểm tra mạng trả mã hiện tại/cache được cập nhật/tiến độ giữ nguyên; ép thiếu dữ liệu nét và HTTP 404 để kiểm tra trạng thái rõ ràng, nút hoạt ảnh bị vô hiệu, nghe và Tiếp vẫn dùng được, không có page error. Hai file test SW và stroke-loader cũng đã được đưa vào targeted CI để không chỉ được chạy local. Cloudflare trên commit này SUCCESS, Preview `https://8fc7dcdc.vduckie.pages.dev/`.

**Browser bổ sung trên `6fabc4d`: PASS**, đã xác nhận cả 3 job tại [run 43537678894](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43537678894). GitHub Actions khởi chạy trễ rồi hoàn tất; không cần đăng nhập thêm hoặc dispatch thủ công. Chromium local bị môi trường chặn socket, nhưng browser trên GitHub runner đã chạy thành công với Preview đúng commit.

- 86/86 Node tests PASS trong CI, không skip; Postgres owner RLS PASS.
- 9 nhóm hành trình browser PASS, `errors: []`, 48 lượt ghi, 1 xung đột thử lại thành công.
- Warm cache cũ: `refreshed: true`, `cacheUpdated: true`, `progressPreserved: true`.
- Thiếu nét: ép thiếu dataset/HTTP 404 thực sự, nút hoạt ảnh vô hiệu; nghe và Tiếp còn dùng được; không page error.
- Cloudflare index cache vẫn `redirected: true`; offline edit → reload → reconnect và đồng bộ sang context thứ hai PASS.
- [Artifact 14090123144](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/actions/runs/43537678894/artifacts/14090123144) chứa ảnh/trace/journeys.

| Yêu cầu hồi quy | Kết quả và phạm vi |
| --- | --- |
| Daily, hai thiết bị trả lời cùng từ | PASS; giữ cả hai lượt, không nhân đôi khi replay |
| Tiếp tục bài học/bài luyện | PASS; xác nhận lessonId hiển thị sau reload và câu đã trả lời trên mobile |
| Mất mạng, reload, có mạng lại | PASS với bài đã cache và auth/REST fixture |
| Cloudflare chuyển hướng index | PASS trên Preview bất biến đúng commit |
| Đăng xuất/đăng nhập/đổi tài khoản | PASS với A → B → logout → A qua fixture |
| PC ↔ điện thoại | PASS hai Chromium context desktop1440/mobile390, chưa phải hai máy vật lý |
| Service Worker trả mã cũ | PASS browser warm-cache và 10 unit tests cache/activation/versioning |
| Thiếu dữ liệu nét chữ | PASS browser fallback cùng 3 unit tests loader, không tạo nét giả |

### Lỗi còn lại: deadline khi tiếp tục bài luyện

Hai test qua UI thật trên JSDOM tái hiện lỗi trước sửa: mở lại bài cộng thêm phần làm tròn giây vào deadline (ví dụ +234 ms); rời màn hình rồi phát pagehide sau 60 giây đẩy deadline thêm 60 giây. Nguyên nhân là stopTimer xóa deadline và startTimer dựng lại từ số giây đã làm tròn.

Đã sửa để dừng đồng hồ hiển thị vẫn giữ deadline; chỉ bài mới tạo deadline mới; mở lại draft dùng đúng timestamp gốc. Bump query của practice UI sang `progress-sync2` trong index và danh sách SW để tải bản sửa. Hai test hành vi chuyển FAIL → PASS, kiểm tra nhiều lần resume và pagehide. Browser còn xác nhận chính xác sessionId/deadline từ desktop được giữ trên mobile, thay vì chỉ thấy câu đã trả lời.

Targeted suite sau sửa: **88/88 PASS** local, không skip. Đây là lỗi runtime duy nhất sửa thêm trong phiên khôi phục. Không triển khai tính năng mới. Một lượt CI chỉ sửa tài liệu trước đó không tìm thấy Cloudflare check cho đúng head; không đổi sang Preview khác để làm xanh. Commit có sửa runtime sẽ deploy Preview mới và chạy lại toàn bộ hồi quy; kết quả head cuối cùng được ghi trong mô tả PR sau khi hoàn tất.

PR giữ Draft/chưa merge. Giới hạn hai tài khoản Auth thật, phần cứng điện thoại và mở offline lạnh vẫn như trên; chưa đủ bằng chứng để công nhận toàn bộ yêu cầu E2E Production đã đạt.
