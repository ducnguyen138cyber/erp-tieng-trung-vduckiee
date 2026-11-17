# VDuckie – Bảng rà soát trải nghiệm từng màn hình

Ngày lập: 17/11/2026. Nguồn: giao diện/source `d67baa3` và hai ảnh người dùng gửi. Đây là **kế hoạch nghiệm thu mới**, chưa phải kết luận các màn đã đạt. Các kiểm thử tự động của PR #132 là bằng chứng nền, không thay cho rà soát từng trường hợp dưới đây.

## Cách đánh giá chung

- Chạy mỗi trường hợp trên PC (1366/1440px), mobile browser (320/390/430px), PWA. Rà thêm tablet 768px và ngang 844×390 cho màn có lỗi bố cục. Safari/iPhone và PWA cài thật được ghi riêng với mô phỏng.
- Với phần lấy dữ liệu: thử bình thường, mạng chậm, đang tải, trống, lỗi và thử lại. Thử guest/tài khoản mới/tài khoản có tiến độ nếu liên quan.
- Đánh giá chữ bị che: đầu/cuối trang, tiêu đề, feedback, nút cố định, dock/chat, safe area và bàn phím. Kiểm tra nút nhìn thấy nhận được thao tác tại tâm và các góc. Không chỉ chụp ảnh khi chưa mở bàn phím.
- Đánh giá độ mượt: thao tác đơn và 10 lần liên tiếp; cuộn/đổi màn/chạm nhanh. Ghi thời gian tới phản hồi nhìn thấy và thời gian tới kết quả. Tách độ trễ mạng khỏi thời gian UI phản hồi.
- Mục tiêu nghiệm thu đề xuất: phản hồi chạm trong khoảng 100–200ms; chuyển bước đã có dữ liệu khoảng ≤300ms; tác vụ mạng lâu có loading và retry, không đứng im. Đây là mục tiêu cần đo, chưa phải số đo của các màn.
- P0: che/mất nút chính, không thoát được, mất/trộn tiến độ, chấm/cộng điểm lặp, chồng màn. P1: khó dùng, chậm, chữ cắt, thứ tự/focus sai nhưng còn đường thực hiện.
- Chỉ ghi Đạt khi đủ thao tác và bằng chứng cho môi trường đó. Các trạng thái dùng: Chưa test / Đạt / Lỗi / Chờ thiết bị thật / Không áp dụng.

## Danh sách trường hợp cần test

| ID | Màn hình | Tính năng | Thao tác/trạng thái cần thử | Điều kiện đạt | Ưu tiên |
|---|---|---|---|---|---|
| A01 | Toàn ứng dụng | Mở trang | Mở lạnh, mở lại, vào link sâu khi chưa đăng nhập/đã đăng nhập. | Một màn đúng route; không chớp màn cũ, không hiện EXP 0 giả; có trạng thái tải. | P0 |
| A02 | Toàn ứng dụng | Điều hướng | Đi từng menu, đổi nhanh 10 lần, Back/Forward, reload và mở link sâu. | Một màn hiển thị; menu đúng; vị trí và tiến độ không bị ghi đè bởi dữ liệu đến muộn. | P0 |
| A03 | Toàn ứng dụng | Cuộn và bố cục | Cuộn hết màn; xoay ngang/dọc; tăng chữ 200%; thử nội dung dài. | Không mất chữ/nút cuối; cuộn đúng vùng; không tràn ngang ngoài các dải cuộn chủ ý. | P1 |
| A04 | Toàn ứng dụng | Vùng bấm và lớp phủ | Kiểm tra tâm và bốn góc các nút khi có dock, chat, bàn phím, modal. | Nút nhìn thấy bấm được; không có lớp trong suốt cản; thao tác một lần thực hiện một lần. | P0 |
| A05 | Toàn ứng dụng | Menu mobile | Mở/đóng bằng nút, nền, Escape; chuyển màn; mở auth từ menu. | Đóng đúng; trả focus; không khóa cuộn hay giữ nền inert sau khi thoát. | P0 |
| H01 | Trang chủ | Tiếp tục học | Tài khoản mới/có bài dang dở/đã hoàn thành; mở lại và sync. | Đề xuất đúng dữ liệu; một nút chính; vào đúng bài/bước; không nhảy vị trí khi tải. | P0 |
| H02 | Trang chủ | Các thẻ và thanh bên | Đổi ngôn ngữ; dữ liệu lớn; tải chậm; ẩn/mở tính năng mở rộng. | Tiêu đề, tiến độ và CTA đủ chữ; giữ cột giữa/thanh bên phải desktop. | P1 |
| H03 | Trang chủ | Nhiệm vụ và chuỗi ngày | Hoàn thành bài, chuyển ngày, tải lỗi rồi thử lại. | Không nhân thẻ, không nhấp nháy; trạng thái và điểm nhất quán. | P1 |
| R01 | Lộ trình HSK | Danh sách cấp độ | Mở dải lộ trình; cuộn hết; render lại Home nhiều lần. | Mỗi cấp một thẻ; HSK5/6 học được, không thêm bản Sắp mở; dải thẻ ổn định. | P1 |
| R02 | Lộ trình HSK | Lật thẻ và mở cấp | Chạm lần một/lần hai; dùng bàn phím; chọn HSK1–6 và thẻ chưa mở. | Chữ và thanh tiến độ không bị lật mất; vào đúng cấp; cấp khóa không vào nội dung sai. | P1 |
| C01 | Giáo trình HSK1–6 | Danh mục bài | Đổi cấp, tìm bài, đổi bộ lọc; không có kết quả; quay lại. | Đúng bài và trạng thái; không có thẻ trùng; focus tìm kiếm không mất. | P1 |
| C02 | Giáo trình HSK1–6 | Mở và tiếp tục bài | Bài đầu/giữa/cuối mỗi cấp; reload; link sâu; Back. | Vào đúng bài và tab; thanh tiến độ đủ chữ; không thu hẹp nội dung desktop. | P0 |
| C03 | Giáo trình HSK1–6 | Từ mới/flashcard | Trước/Tiếp, chọn thẻ cũ, thuộc/chưa thuộc, ẩn/hiện Pinyin, Việt → Trung. | Mặc định có Hán + Pinyin có dấu + Việt; ví dụ rõ; không xóa thẻ khi đánh dấu thuộc. | P1 |
| C04 | Giáo trình HSK1–6 | Nghe và đọc | Nghe/dừng/phát lại/đổi tốc độ; văn bản dài; âm thanh lỗi. | Không chồng âm; nút và transcript không che nhau; có phản hồi khi không phát được. | P1 |
| C05 | Giáo trình HSK1–6 | Ngữ pháp và kiến thức thêm | Đổi tab, mở ví dụ/giải thích; cuộn tới cuối; câu dài. | Đủ chữ Hán/Pinyin/Việt; không cắt bảng, lời giải hoặc nút điều hướng. | P1 |
| C06 | Giáo trình HSK1–6 | Luyện tập và chấm bài | Chưa trả lời, đúng/sai, sửa đáp án; gõ IME; nhấn Kiểm tra nhanh hai lần. | Không chấm lặp; phản hồi rõ; đáp án không lộ trước; câu mở có tham khảo/tự đối chiếu. | P0 |
| C07 | Giáo trình HSK1–6 | Hoàn thành và EXP | Hoàn thành, retry khi mạng lỗi, reload, lặp bài, sync thiết bị khác. | Không cộng trùng; không ghi nhận hoàn thành khi thiếu điều kiện; có trạng thái lưu rõ. | P0 |
| E01 | Đề thi HSK | Chọn và làm đề | Chọn cấp/kỹ năng; nghe; đổi câu; đáp án dài; Back. | Timer/đáp án và nút không che nhau; không mất bài do đổi câu. | P1 |
| E02 | Đề thi HSK | Nộp và xem kết quả | Bỏ trống, nộp hai lần, hết giờ, xem giải thích, làm lại. | Một kết quả; điểm đúng; giải thích đọc hết; lượt mới không giữ đáp án cũ sai. | P0 |
| S01 | Shadowing | Tìm và tiếp tục | Mở từ menu/link sâu; đổi HSK1–3; chọn bài; reload/tiếp tục. | Đúng vị trí; không trở về giáo trình khác; giữ lựa chọn bài. | P0 |
| S02 | Shadowing | Nghe và luyện câu | Phát/dừng/lặp câu/đổi tốc độ; ẩn Pinyin; bấm nhanh nhiều câu. | Một audio tại một thời điểm; Hán/Pinyin/Việt và nút đủ chỗ. | P1 |
| S03 | Shadowing | Ghi âm | Cho phép/từ chối micro; ghi/dừng/nghe lại; đổi màn khi đang ghi. | Có hướng dẫn quyền rõ; dừng capture khi rời; không treo hoặc mất nút. | P1 |
| D01 | 5 từ công xưởng/Daily | Giới thiệu và Tiếp | Mở phiên; kiểm tra nhãn; Tiếp/Quay lại; thoát giữa phiên rồi mở lại. | Nhãn Tiếp; một lần bấm tiến một bước; không mất hoặc lặp nội dung. | P1 |
| D02 | 5 từ công xưởng/Daily | Viết tay | Ngón tay/bút/chuột; xóa nét; xoay màn; thiếu dữ liệu nét; chọn chữ khác. | Có nét thật; không cuộn trang khi vẽ; thao tác vẫn dùng được khi thiếu stroke data. | P0 |
| D03 | 5 từ công xưởng/Daily | Thanh nút và chat | Cuộn cuối, mở bàn phím, hiện dock/chat, thử ở 320px và ngang màn. | Quay lại/Tiếp/Xóa nét không bị che; có safe area và vùng chạm đủ. | P0 |
| D04 | 5 từ công xưởng/Daily | Câu hỏi và hoàn thành | Chọn sai/đúng, nhập Hán bằng IME, nhấn nhanh, hoàn thành/reload. | Không cộng/trừ lặp; phản hồi đọc hết; tiến độ lưu đúng; không chồng form. | P0 |
| V01 | Ôn tập thích ứng | Từ đến hạn và trống | Không có từ, có nhiều từ; lọc kỹ năng; mở ôn từ trang chủ. | Trạng thái trống dễ hiểu; đúng tập từ; không lặp vô hạn hoặc đứng chờ. | P1 |
| V02 | Ôn tập thích ứng | Chu trình ôn | Việt → Trung/Pinyin/nghĩa/viết; trả lời, sửa, làm lại, thoát và tiếp tục. | Đúng kỹ năng yếu; nút/feedback không che nhau; lịch ôn chỉ cập nhật một lần. | P1 |
| Q01 | Tìm kiếm đầu trang | Gõ và trả kết quả | Hán/Pinyin có hoặc không dấu/Việt; IME; gõ nhanh, xóa, đổi query. | Không tìm giữa composition; query mới không bị kết quả cũ ghi đè; có loading/empty/error. | P0 |
| Q02 | Tìm kiếm đầu trang | Bàn phím và viewport | Focus input trên iPhone; mở/đóng bàn phím; xoay màn khi đang gõ. | Không zoom tự động; input và kết quả còn nhìn thấy; không nhảy nền. | P0 |
| Q03 | Tìm kiếm đầu trang | Đóng tìm kiếm/chi tiết | Chạm X/Back/Escape, OS Back, vuốt iOS; đóng rồi mở lại nhanh. | Đóng ngay cả khi history chậm; trả cuộn/focus; không còn lớp khóa bấm. | P0 |
| Q04 | Tìm kiếm đầu trang | Chi tiết từ | Từ nhiều chữ/nghĩa/ví dụ dài; nghe/copy/lưu/phân tích/viết nét. | Đọc hết nội dung; X luôn tiếp cận được; không bị header/chat che chữ. | P1 |
| K01 | Từ điển và kho HSK | Tra và bộ lọc | Tra từ đơn/cụm; nguồn HSK/ERP; lọc cấp; không có kết quả; hiển thị thêm. | Kết quả đúng query; có phản hồi nguồn chưa tải; không đứng hình khi đổi bộ lọc. | P1 |
| K02 | Từ điển và kho HSK | Ví dụ và lưu từ | Hán/Pinyin/Việt; nghe; lưu khi guest/member; lưu trùng; đổi tài khoản. | Ví dụ đủ chữ; phản hồi rõ; không lưu nhầm hay trộn sổ từ giữa tài khoản. | P1 |
| F01 | Bài học công xưởng | Bài học | Chọn chủ đề/bài; mở nội dung dài; nghe; quay lại và tiếp tục. | Đúng bài; nút/tiêu đề không che nhau; giữ chỗ học hợp lý. | P1 |
| F02 | Bài học công xưởng | Thẻ từ | Lật, Trước/Tiếp, chọn cũ, ẩn Pinyin, đánh dấu thuộc; đổi chủ đề. | Đủ Hán/Pinyin/Việt; không nhảy thẻ hay xóa thẻ đã thuộc. | P1 |
| F03 | Bài học công xưởng | Hội thoại | Đổi hội thoại/vai, nghe phát lại; cuộn câu dài. | Một audio; lời thoại/dịch rõ; nút nghe không đè lên chữ. | P1 |
| F04 | Bài học công xưởng | Kiểm tra | Đúng/sai/bỏ trống, nộp nhanh, làm lại, xem kết quả. | Không chấm lặp; câu hỏi/đáp án/giải thích đọc hết. | P1 |
| F05 | Bài học công xưởng | Từ điển công xưởng | Tìm, lọc nhóm, mở từ, nghe/copy, quay lại. | Không lag khi lọc; không mất query/cuộn; thao tác rõ phản hồi. | P1 |
| F06 | Bài học công xưởng | Sổ từ cá nhân | Thêm/sửa/xóa, trùng từ, để trống, lưu lỗi rồi retry. | Không mất dữ liệu; form/bàn phím không che nút; thông báo theo đúng hành động. | P0 |
| F07 | Bài học công xưởng | Cộng đồng | Mở danh sách; tìm; nhập gửi từ; guest/member; lỗi mạng. | Hiện trạng thái rõ; không gửi trùng; form không tràn/che nút gửi. | P1 |
| N01 | Học tiếng Việt | Danh mục và tiếp tục | Mở/đóng, chọn bài/tab, Back/reload, guest/member, sync. | Không lộ màn khác; đúng bài/tab; tách dữ liệu theo tài khoản. | P1 |
| N02 | Học tiếng Việt | Từ/âm thanh/hội thoại | Lật nghĩa, Trước/Tiếp, đánh dấu, nghe chậm, audio lỗi. | Không chồng âm; chữ Việt/Trung đủ; fallback không gây treo. | P1 |
| N03 | Học tiếng Việt | Luyện tập và hoàn thành | Nghe/điền từ/xếp câu/nối cặp; nộp/làm lại/lưu. | Đúng phản hồi; bàn phím và nút không che nhau; điểm không nhân đôi. | P1 |
| G01 | Game | Menu và cấu hình | Mở từng game; chọn cấp/chế độ/ẩn Pinyin; Back và mở lại. | Vào đúng game; lựa chọn rõ; không giữ lớp phủ từ màn trước. | P1 |
| G02 | Game | Gõ Pinyin | Bắt đầu, IME/bàn phím, đúng/sai, combo/tim, pause/đổi tab, kết thúc. | Không mất focus; input/nút không bị bàn phím che; không giật do hiệu ứng. | P1 |
| G03 | Game | Nối cặp | Chọn/bỏ chọn bằng chạm lại, nối đúng/sai, hết giờ, nhiều ván. | Chạm phản hồi rõ; không lặp từ quá mức; không chồng thẻ hoặc khóa thao tác. | P1 |
| G04 | Game | Xếp câu | Chọn/bỏ từ, sửa thứ tự, nộp, làm lại, màn hẹp. | Thấy hết token và nút; không dịch chuyển bất ngờ khi thêm/bỏ từ. | P1 |
| G05 | Game | Kết quả/BXH game | Gửi điểm hai lần, mạng lỗi/retry; đổi game/cấp/mode/kỳ. | Không gửi trùng; bộ lọc và kết quả khớp; không lẫn EXP học tập. | P1 |
| B01 | EXP/Bảng xếp hạng | Tải lần đầu | Guest/member; mạng chậm; mở Home rồi BXH trong lúc dữ liệu chưa về. | Một màn; skeleton giữ chỗ; không hiện số 0 giả; podium không làm nhảy nội dung. | P0 |
| B02 | EXP/Bảng xếp hạng | Đồng nhất dữ liệu | So Top 5, podium, danh sách và hạng cá nhân sau khi nhận thưởng. | Cùng tổng EXP; không ghi đè số mới bằng response cũ; không phát thưởng lặp. | P0 |
| B03 | EXP/Bảng xếp hạng | Lỗi/trống/đổi tài khoản | Lỗi RPC, không có dữ liệu, retry, logout/login tài khoản khác. | Có trạng thái rõ; retry dùng được; không để dữ liệu tài khoản trước. | P0 |
| P01 | Tài khoản/Hồ sơ | Đăng nhập/đăng ký | Nhập, bấm lại tab hiện tại/mở lại form, hiện mật khẩu; gửi hai lần. | Không tự xóa dữ liệu đang nhập; form/nút không bị bàn phím che; busy rõ. | P0 |
| P02 | Tài khoản/Hồ sơ | Xác minh/khôi phục/Google | OTP/link hết hạn; callback; quên mật khẩu; hủy Google; mạng lỗi. | Thông báo đúng; về được bài cũ; không spinner vô hạn; thử lại được. | P0 |
| P03 | Tài khoản/Hồ sơ | Hồ sơ và đăng xuất | Tên dài, EXP lớn, sửa thông tin, logout/login thiết bị khác. | Đủ chữ và nút; thông tin cập nhật đúng; không lộ dữ liệu tài khoản trước. | P0 |
| T01 | Duckie Chat/Trợ lý | Mở/đóng và bố cục | Mở chat ở từng màn; gõ khi có bàn phím; đóng rồi chuyển màn. | Không che Tiếp/Nộp/Lưu; cuộn đúng khung; X dễ chạm và trả focus. | P0 |
| T02 | Duckie Chat/Trợ lý | Gửi và lỗi | Câu dài/Hán/Pinyin; gửi nhanh; chờ; mất mạng; retry; nghe câu trả lời. | Một lần gửi một lượt; có trạng thái; không tự cuộn cướp vị trí đang đọc. | P1 |
| T03 | Trợ giảng – Giải thích | Từ đang chọn | Mở từ đã tra, tìm từ khác; thiếu dữ liệu; nghe và xem ví dụ. | Giải thích đúng từ; Hán/Pinyin/Việt đủ chữ; có trạng thái khi nguồn chưa tải. | P1 |
| T04 | Trợ giảng – Hội thoại | Từng tình huống | Chào hỏi/mua hàng/công xưởng; nhập dài bằng IME; kiểm tra và câu tiếp. | Câu hỏi/ô nhập/gợi ý không che nhau; phản hồi đúng lượt; không coi kiểm từ khóa là chấm chính xác hoàn toàn. | P1 |
| T05 | Trợ giảng – Bài tập | Tạo và làm bài | Tạo bộ mới, chọn đáp án, câu tiếp, kết quả, bắt đầu lại. | Không giữ kết quả bộ cũ; đáp án/feedback rõ; bấm nhanh không chấm lặp. | P1 |
| T06 | Trợ giảng – Điểm yếu | Thống kê và ôn | Chưa có dữ liệu, có nhiều lỗi; mở ôn từ yếu, trả lời và xem cập nhật. | Trạng thái trống dễ hiểu; đúng từ cần ôn; không nhảy danh sách khi đang chọn. | P1 |
| T07 | Trợ giảng – Luyện nói | Micro và nhận dạng | Cho/từ chối quyền, thiết bị không hỗ trợ; ghi/dừng; rời tab khi đang thu. | Có phản hồi quyền/hỗ trợ; không treo micro; transcript và nút đọc được; không trình bày như chấm phát âm chuyên sâu. | P1 |
| T08 | Trợ giảng – Trợ giảng | Gợi ý từ kho dữ liệu | Chọn các gợi ý giải thích/ví dụ/viết/ôn; đổi từ, đóng/mở panel. | Nội dung theo từ hiện tại; nút không bị che; nêu đúng khả năng trả lời từ kho dữ liệu. | P1 |
| L01 | Ngôn ngữ và trợ năng | VI/中文/English | Đổi trên Home, bài học, BXH, tìm kiếm, form; reload. | Không chớp ngôn ngữ; nhãn dài không bị cắt; không dịch nhầm nghĩa/đáp án học liệu. | P1 |
| L02 | Ngôn ngữ và trợ năng | Bàn phím và chữ lớn | Tab/Shift-Tab/Enter/Escape; 200% zoom/chữ lớn; reduced motion. | Focus thấy rõ và theo thứ tự; không mắc kẹt; chữ/nút không bị che. | P1 |
| W01 | PWA/Offline/Đồng bộ | Cài và mở lại | Mở từ icon PWA; cold/warm; đổi app; khóa/mở máy; quay lại bài. | Đúng route/tiến độ; không tạo phiên học trùng; không mất âm thanh/scroll control. | P0 |
| W02 | PWA/Offline/Đồng bộ | Nâng phiên bản | Đang làm bài khi có bản mới; cập nhật rồi mở lại. | Không mất câu trả lời; không dùng lẫn code/cache cũ mới; có đường thoát khi cập nhật lỗi. | P0 |
| W03 | PWA/Offline/Đồng bộ | Offline và trở lại mạng | Trang đã/chưa ghé; vào bài, tra từ, nghe; mất mạng giữa lưu rồi nối lại. | Nêu rõ phần dùng được/chưa tải; không treo; giữ tiến độ và retry an toàn. | P0 |
| W04 | PWA/Offline/Đồng bộ | Hai thiết bị và tài khoản | PC → điện thoại → PC; sửa đồng thời; logout/login người khác. | Giữ hoàn thành độc lập; không cộng EXP trùng; không trộn tài khoản. | P0 |

## Ghi kết quả cho từng môi trường

Mỗi ID ở trên có ba dòng kết quả: PC, mobile browser, PWA. Mặc định toàn bộ là **Chưa test**. Không tự chuyển thành Đạt theo kết quả môi trường khác. Khi chạy ghi đầy đủ:

| ID | Môi trường/thiết bị/browser/viewport | Build | Trạng thái dữ liệu/mạng | Kết quả | Phản hồi UI / tới kết quả (ms) | Vấn đề và cách tái hiện | Ảnh/video |
|---|---|---|---|---|---|---|---|
| Ví dụ Q03 | iPhone / Safari PWA / ghi kích thước | ghi SHA | đã mở chi tiết từ, keyboard mở | Chưa test | chưa đo | ghi bước và vị trí bị che nếu có | ghi link bằng chứng |

## Hai vấn đề đã xác nhận từ ảnh/source

| Mã | Màn | Vấn đề đã xác nhận | Xử lý trong bản này | Giới hạn xác nhận |
|---|---|---|---|---|
| UX-001 | Daily – giới thiệu từ | Nút dùng nhãn “Tao đã xem”. | Thống nhất thành “Tiếp”, giữ mũi tên và hành vi tiến bước. | Chạy regression Daily; kiểm tra PWA thật vẫn nằm trong D01/D03. |
| UX-002 | Home – lộ trình | Hai thẻ HSK5/6 “Sắp mở” trùng các thẻ đã học được. Decorator cũ còn chèn khóa 5/6, tạo 12 thẻ thay vì 10 và làm điều kiện ổn định không đạt. | Bỏ khóa 5/6 khỏi nguồn sinh thẻ; giữ cấp 5/6 đang mở và khóa 7/8/9. | Regression phải xác nhận mỗi HSK5/6 một thẻ, thẻ học được và enhance lần nữa không thay lại DOM. |

## Thứ tự thực hiện tiếp

1. P0: điều hướng/lớp phủ; Daily Tiếp và viết tay; tìm kiếm/đóng/bàn phím; EXP; đăng nhập; lưu tiến độ và PWA.
2. Luồng học trọn vẹn: HSK, Shadowing, ôn tập, tiếng Việt, công xưởng.
3. Game, sổ từ/cộng đồng, ngôn ngữ/chữ lớn, các trường hợp trống/lỗi còn lại.
4. Tổng hợp lỗi theo ID, sửa từng nhóm và chạy lại đúng phần bị ảnh hưởng. Chỉ đo tối ưu sâu sau khi có bước tái hiện hoặc số đo cho điểm chậm.
