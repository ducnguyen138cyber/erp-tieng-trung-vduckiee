# VDuckiee Chinese

Website học tiếng Trung ERP và HSK, chạy trên GitHub Pages với Supabase Auth và
đồng bộ sổ từ theo tài khoản.

## Giao diện v72

- Thanh học tập cố định bên trái trên desktop, menu trượt trên mobile.
- Nội dung bài học và các thao tác nằm ở cột giữa.
- Lộ trình ERP/HSK nằm ở cột phải; các chặng HSK dùng huy hiệu, đường nối và
  trạng thái đang học/hoàn thành/sắp mở.
- Đăng nhập Google nằm ở góc trên bên phải.
- Roast Mode và 60 clip Adam v70.2 được giữ nguyên.

## Kiểm tra

```bash
node tests/v72-layout.test.js
node tests/supabase-sync.test.js
node --check hsk-lessons.js
```
