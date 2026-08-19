# VDuckiee Chinese

Website học tiếng Trung ERP và HSK, production chính trên Cloudflare Pages tại
`https://vduckie.pages.dev`, đồng thời vẫn tương thích với GitHub Pages và
Supabase Auth/đồng bộ dữ liệu theo tài khoản.

## Triển khai đa domain

- Tất cả CSS, JavaScript, ảnh, SVG, audio và favicon dùng đường dẫn tương đối
  `./...`, nên hoạt động ở cả domain gốc Cloudflare Pages và repository con của
  GitHub Pages.
- OAuth Google dùng thư mục của origin hiện tại làm callback; source không
  hard-code hostname production hoặc prefix `/erp-tieng-trung-vduckiee/`.
- Supabase project URL và publishable/anon key là credential công khai phía
  trình duyệt; tuyệt đối không đưa `service_role` key vào repository.
- Ứng dụng là PWA cài đặt được. Manifest, service worker và toàn bộ URL cache
  dùng đường dẫn tương đối theo scope hiện tại, nên chạy được ở domain gốc và
  GitHub Pages subpath.
- Service worker ưu tiên mạng cho navigation, dùng stale-while-revalidate cho
  tài nguyên tĩnh, xóa cache PWA phiên bản cũ khi activate và có trang fallback
  ngoại tuyến. Supabase Auth/sync, OAuth callback, Functions/API và request
  không phải GET luôn đi thẳng qua mạng, không được cache.

## Giao diện v73+

- Mở web ở đường dẫn gốc sẽ hiện màn hình khám phá thay vì tự mở bài học.
- Màn hình khám phá có thẻ chào mừng, thống kê kho học liệu, bài học đề xuất và
  mascot VDuckie theo từng kỹ năng.
- Bài học chỉ xuất hiện sau khi người học chọn HSK, ERP hoặc một thẻ đề xuất;
  liên kết sâu có `area=erp` / `area=hsk` vẫn mở thẳng khu vực tương ứng.
- Có thể bấm logo/tên VDuckie ở đầu trang để quay về màn hình khám phá.
- Thanh học tập cố định bên trái trên desktop, menu trượt trên mobile.
- Nội dung bài học và các thao tác nằm ở cột giữa.
- Lộ trình ERP/HSK nằm ở cột phải; các chặng HSK dùng huy hiệu, đường nối và
  trạng thái đang học/hoàn thành/sắp mở.
- Đăng nhập Google nằm ở góc trên bên phải.
- Roast Mode và audio/giọng đọc hiện có được giữ nguyên.

## Học hằng ngày: MSUTONG + ERP Daily 5

- Trang đầu chỉ có ba việc cần làm: tiếp tục MSUTONG, học 5 từ ERP mới và ôn
  các từ đến hạn. Mỗi việc mở thành một màn riêng, không tạo trang kéo dài.
- MSUTONG là lộ trình chính. Sơ cấp 1 có 10 bài companion học được theo thứ tự
  chủ đề công khai; các quyển sau chỉ hiển thị roadmap. HSK cũ vẫn là kho bổ trợ.
- Daily 5 lấy từ kho `ERP_TERMS`, giữ nguyên năm từ trong cùng ngày và ưu tiên
  từ chưa học. Phiên học dạy từ trước, luyện nét, gọi lại, ghép cụm, đặt vào câu
  ERP, trộn năm từ rồi mới kiểm tra cuối.
- Một câu đúng không thể làm từ “đã thuộc”. Review dùng các mốc xác định, lưu
  đúng/sai theo dạng bài và đưa câu sai trở lại sớm hơn.
- Trạng thái Daily Learning dùng cùng bảng Supabase `user_words` qua một system
  row; không có tiến độ riêng cho mobile. Khi offline, giao diện nói rõ chưa
  đồng bộ cloud.
- Mobile/PWA có dock cố định: Hôm nay, MSUTONG, +5, Ôn tập và VDuckie.
- Desktop và mobile đều có menu 3 gạch; Từ điển là một màn tra cứu riêng.

## Kiểm tra

```bash
node --test tests/v90.4-cloudflare-origin.test.js
node tests/v72-layout.test.js
node tests/v73-home-hub.test.js
node tests/supabase-sync.test.js
node --check hsk-lessons.js
node --test tests/pwa.test.js
node --test tests/daily-learning.test.js
```
