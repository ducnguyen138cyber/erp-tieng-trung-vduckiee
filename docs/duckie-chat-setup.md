# Duckie Chat – miễn phí trước
- Frontend tại `assets/ai/duckie-chat.js`; tên Duckie Chat là tên tạm.
- Backend là Cloudflare Pages Function `functions/api/duckie-chat.js`.
- Trong Cloudflare Dashboard → Workers & Pages → dự án VDuckie → Settings → Bindings, thêm Workers AI binding với tên **AI**, sau đó deploy lại.
- Không cần OpenAI API key. Backend cố định model `@cf/meta/llama-3.1-8b-instruct`; chi phí/hạn mức phụ thuộc gói Cloudflare.
- Nếu website không được deploy bằng Cloudflare Pages Functions, cần chuyển deployment sang hỗ trợ Functions hoặc tạo Worker route `/api/duckie-chat`. GitHub Pages thuần không chạy được Function này.
- Chưa có binding thì endpoint trả HTTP 503 có thông báo rõ ràng; tuyệt đối không giả câu trả lời AI.
- Lịch sử chỉ lưu trong sessionStorage (phiên tab), không được gửi đến Supabase.
- Trước khi mở cho nhiều người dùng, bổ sung rate limit / chống spam / xác thực và kiểm soát chi phí ở server.
