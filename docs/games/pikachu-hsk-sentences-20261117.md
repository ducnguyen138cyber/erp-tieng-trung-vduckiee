# Nối cặp Pikachu và kho Dịch câu theo HSK

## Hành vi

- Bàn nối vuông, 6/8/10/12 cặp, mặc định8; các ô trộn chung. Có hai kiểu: chữ Hán giống nhau hoặc Hán–Việt.
- Đường nối qua ô trống hoặc vòng ngoài, tối đa hai góc gấp. Hai ô đúng nhưng bị chắn không bị xóa/cộng điểm.
- 90giây, đúng+5giây; hết giờ khóa bàn, có thể chơi lại. Pause/ẩn tab dừng đồng hồ. Đảo thủ công−5giây; hết nước đi tự đảo miễn phí, giữ các lỗ trống.
- Giữ vùng trống sau xóa để bàn không nhảy. Đường nối xuất hiện trước khi hai ô mất; vẫn hỗ trợ chạm lại bỏ chọn, phím Enter/Space, tùy chọn Pinyin và reduced motion.
- Điểm100/cặp, không cộng EXP. Chỉ dọn hết bàn mới lưu BXH. Nhóm `:pikachu-same` / `:pikachu-meaning` tách khỏi điểm bàn cũ; vẫn xem lại nhóm cũ.
- Dịch câu chọn HSK1–6 và Công xưởng,10câu/lượt. Lưu trình độ và lịch sử câu thực sự đã hiện trên thiết bị; đóng giữa lượt không đánh dấu cả10câu là đã gặp. Hết câu mới quay lại câu cũ nhất; ưu tiên khác họ mẫu trong cùng lượt.
- Chỉ tải ngân hàng của cấp được chọn, không tải toàn bộ2.449câu khi mở Home. Các cấp HSK dùng nhóm BXH riêng; nhóm chủ đề cũ vẫn đọc được.

## Kho câu

| Cấp | Câu Việt riêng biệt |
|---|---:|
| HSK1 |869|
| HSK2 |249|
| HSK3 |539|
| HSK4 |276|
| HSK5 |266|
| HSK6 |250|
| Tổng |2449|

Nguồn: các cặp Trung–Việt đã có trong câu/grammar/lesson của VDuckie; thêm600câu từ60khung có bản dịch theo10chủ đề cho HSK4–6. `scripts/build-game-sentence-catalog.cjs` sinh lại dữ liệu có checksum và locator từng nguồn. Câu Trung trùng nhau bị loại trên toàn bộ6cấp, prompt Việt trùng trong một cấp gộp các đáp án mẫu. Bỏ câu giữ chỗ, ví dụ sai, fragment, câu chỉ giải thích cách dùng từ và nghĩa Việt lẫn chữ Hán. Không tự dịch lại nghĩa Việt có sẵn. Pinyin nguồn được giữ; phần thiếu lấy từ pinyin-pro đóng gói trong repo ở bước build, không gọi dịch vụ AI lúc chơi.

Cấp dựa trên nguồn bài học VDuckie và các khung bổ sung theo độ phức tạp; không tuyên bố mọi từ trong câu thuộc đúng danh sách chuẩn thi. Kiểm máy về cấu trúc/cách chơi không thay nghiệm thu ngôn ngữ độc lập. Nguồn học liệu trước đó vẫn có trạng thái machine-assisted; giữ thông tin này trong manifest thay vì tự gắn nhãn đã được chuyên gia duyệt.

## Kiểm chứng

- `tests/pikachu-engine.test.cjs`: đường thẳng/gấp/vòng ngoài/bị chắn;400bàn dọn được; giữ lỗ khi đảo; điểm không lặp; đếm ngược/bonus/pause/hết giờ.
- `tests/matching-game-browser.mjs`: click thật, đường nối, xóa ô, thời gian, pause, timeout, hai kiểu ghép, bảng vuông, replay và ghi điểm fixture; Chromium desktop/320/390 + WebKit390.
- `tests/sentence-catalog.test.cjs`: checksum, đủ Hán/Pinyin/Việt, từng đáp án nhập được, không lặp qua nhiều lượt/serialized reload, phân bố họ mẫu.
- `tests/sentence-hsk-browser.mjs`: sáu cấp, tải theo cấp,20câu liên tiếp không lặp, nhớ sau reload, không lộ đáp án trước trả lời, UI hẹp và xếp hạng theo HSK; backend cô lập.
- `tests/public-demo-browser.mjs`: cập nhật kiểm thử game câu từ chủ đề cũ sang HSK1/HSK3/Công xưởng; các game khác vẫn được kiểm.
- Migration `20261117094241_pikachu_and_hsk_sentence_categories.sql` chỉ mở rộng whitelist nhóm điểm; không đổi RLS, quyền, dữ liệu học hoặc cách tính EXP. Đã áp dụng vào project đang phục vụ app; query xác nhận nhóm mới/cũ hợp lệ, HSK9 và kích thước99bị từ chối.

Ảnh và log browser được tải lên artifact của workflow Typing game browser verification. Kết quả cuối cùng xem Checks của PR; không coi việc có file test là đã qua. Chưa gọi đây là kiểm PWA/iPhone vật lý hay bàn phím ảo thật.
