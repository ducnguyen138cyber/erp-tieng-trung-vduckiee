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
- Ứng dụng hiện không đăng ký service worker hoặc manifest, vì vậy không có
  scope/cache PWA cũ cần chuyển domain.

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

## Kiểm tra

```bash
node --test tests/v90.4-cloudflare-origin.test.js
node tests/v72-layout.test.js
node tests/v73-home-hub.test.js
node tests/supabase-sync.test.js
node --check hsk-lessons.js
```
