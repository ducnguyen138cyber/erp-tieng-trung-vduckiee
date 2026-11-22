# Duckie Chat – miễn phí trước
- Frontend tại `assets/ai/duckie-chat.js`; tên Duckie Chat là tên tạm.
- Backend là Cloudflare Pages Function `functions/api/duckie-chat.js`.
- Trong Cloudflare Dashboard → Workers & Pages → dự án VDuckie → Settings → Bindings, thêm Workers AI binding với tên **AI**, sau đó deploy lại.
- Không cần OpenAI API key. Backend mặc định model `@cf/meta/llama-3.1-8b-instruct-fast`; chi phí/hạn mức phụ thuộc gói Cloudflare.
- Nếu website không được deploy bằng Cloudflare Pages Functions, cần chuyển deployment sang hỗ trợ Functions hoặc tạo Worker route `/api/duckie-chat`. GitHub Pages thuần không chạy được Function này.
- Chưa có binding thì endpoint trả HTTP 503 có thông báo rõ ràng; tuyệt đối không giả câu trả lời AI.
- Lịch sử chỉ lưu trong sessionStorage (phiên tab), không được gửi đến Supabase.
- Trước khi mở cho nhiều người dùng, bổ sung rate limit / chống spam / xác thực và kiểm soát chi phí ở server.


## PR preview AI acceptance

- Production và Preview có cấu hình binding riêng. Chọn môi trường **Preview** trong dự án Pages `vduckie`, vào **Settings → Bindings**, thêm **Workers AI** với tên biến **AI**, lưu và redeploy nhánh PR #118.
- Không cần tạo/nhập OpenAI key hoặc thay đổi model. Không thay cấu hình Production chỉ để kiểm thử preview.
- Workflow `Duckie AI Quality Live Audit` tìm preview bất biến của đúng commit trong comment Cloudflare. Khi retry deployment cùng commit, chạy lại workflow thất bại; không dùng production để thay thế.
- Ba câu tra cứu chính xác dùng glossary vẫn hoạt động khi thiếu binding; câu hỏi sinh nội dung phải trả 503 rõ ràng. Đây là lookup có sẵn, không phải mô hình AI đã hoạt động.
- Ngày 2026-11-10, preview `118449d0` / head `3adb1aa` trả 503 `AI chưa được kích hoạt` cho 4 probe. CI đã ghi **inconclusive**, không công nhận pass. Trình duyệt cấu hình hiện yêu cầu đăng nhập Cloudflare nên agent chưa thể bật binding.
