# VDuckiee Chinese

Website học tiếng Trung ERP và HSK, chạy trên GitHub Pages với Supabase Auth và
đồng bộ sổ từ theo tài khoản.

## Giao diện v73

- Mở web ở đường dẫn gốc sẽ hiện màn hình khám phá thay vì tự mở bài học.
- Màn hình khám phá có thẻ chào mừng, thống kê kho học liệu, bài học đề xuất và
  5 mascot VDuckie mặc trang phục theo từng kỹ năng.
- Bài học chỉ xuất hiện sau khi người học chọn HSK, ERP hoặc một thẻ đề xuất;
  liên kết sâu có `area=erp` / `area=hsk` vẫn mở thẳng khu vực tương ứng.
- Có thể bấm logo/tên VDuckie ở đầu trang để quay về màn hình khám phá.
- Thanh học tập cố định bên trái trên desktop, menu trượt trên mobile.
- Nội dung bài học và các thao tác nằm ở cột giữa.
- Lộ trình ERP/HSK nằm ở cột phải; các chặng HSK dùng huy hiệu, đường nối và
  trạng thái đang học/hoàn thành/sắp mở.
- Đăng nhập Google nằm ở góc trên bên phải.
- Roast Mode và 60 clip Adam v70.2 được giữ nguyên.

## Kiểm tra

```bash
node tests/v72-layout.test.js
node tests/v73-home-hub.test.js
node tests/supabase-sync.test.js
node --check hsk-lessons.js
```
