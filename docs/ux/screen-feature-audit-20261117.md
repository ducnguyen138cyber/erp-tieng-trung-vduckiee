# VDuckie — Kết quả rà trải nghiệm 17/11/2026

PR: [#134](https://github.com/ducnguyen138cyber/erp-tieng-trung-vduckiee/pull/134). Build: UX v68; source UX v68 (SHA chính xác xem head/merge của PR). Đây là kết quả theo phần đã thao tác, **không phải chứng nhận mọi điều kiện của 69 ca đều đạt**.

## Đã thực hiện

- Thao tác trực tiếp trên production bằng Chromium desktop: Home, HSK5, Daily (vẽ bằng chuột, xóa, bước ngữ cảnh, quiz), ôn trống, tìm kiếm/chi tiết từ, Shadowing/reload, tiếng Việt, bảy màn công xưởng, hồ sơ, các game và sáu tab trợ giảng. Không tạo tài khoản hay gửi từ cộng đồng công khai.
- Rà 17 đích menu bằng click UI thật: Chromium 1440×950, 390×850, 320×850, tablet768×950, ngang844×390; WebKit390×850. Kiểm route đúng, nội dung hiện và không tràn ngang tài liệu; chụp từng màn. Có thêm kiểm X/thoát, HSK5/6 và hit-test nút đóng chi tiết từ.
- Dữ liệu backend trong kiểm tự động là fixture cô lập. Có regression guest/member, auth form, EXP, Daily touch Chromium/WebKit, game, tiếng Việt, HSK, đồng bộ hai context và offline. Trạng thái chạy cuối cùng và ảnh/JSON nằm trong Checks/Artifacts của PR; không suy từ file test có sẵn thành đã qua.
- Không dùng thời gian chạy automation làm số đo input latency. Chưa đủ bằng chứng để nói mọi thao tác đều dưới100–200ms.

## Lỗi đã sửa

| Mã | Bước tái hiện | Hành vi sau sửa | Bằng chứng hồi quy |
|---|---|---|---|
| UX-003 | Home → mở khám phá → bấm hai lần HSK5/6; trước vào roadmap chung. | Vào trực tiếp đúng cấp học được chọn, CTA nhất quán HSK1–6. | UR + UX, sáu cấu hình. |
| UX-004 | Desktop gõ từ → đang có dropdown → bấm menu Ôn tập. | Đóng toàn bộ lớp tìm trước chuyển màn; response muộn không mở lại. | UX + MS; giữ lịch sử tìm trên cùng route. |
| UX-005 | Desktop mở từ có nhiều phần → cuộn chi tiết xuống cuối. | X sticky, vùng44×44, hit-test ba điểm và click đóng được. | UX, Chromium desktop; MS giữ hành vi mobile. |
| UX-006 | Chỉ chọn trước một bài HSK3/5, chưa có đáp án/từ đã học. | Hero/thẻ tiếp tục/nút chính không báo đã học; Bắt đầu HSK1 thực sự mở bài1. | UR event test + first-visit tests. |
| UX-007 | Học bài HSK → chuyển sang Review/Daily/BXH. | Không giữ tham số level/lesson/tab/assessment của màn cũ trong URL mới. | UR + UX. |
| UX-011 | Hồ sơ/từ điển/ôn trống/Daily → bấm X; trước màn bị observer mở lại. | Dọn phiên và chuyển route về Home; menu/URL và màn hiện khớp nhau. | UX `panel-exit`, sáu cấu hình. |
| UX-012 | Từ cộng đồng → fetch lỗi; danh sách vẫn ghi Đang tải. | Danh sách có lỗi và hướng dẫn Làm mới; retry được; refresh lỗi giữ từ đã tải. | UR + UX `community-error-retry`. |
| UX-013 | Daily intro trên 320/390px: tâm nút Tiếp tại y802 chạm trúng nút Hồ sơ của dock. | Chừa chiều cao cho header hai hàng + dock/safe area; footer ở trên dock. | UX `daily-footer`: intro → viết → ngữ cảnh trên đủ sáu cấu hình. |

Hai yêu cầu ảnh trước đó (Tiếp, bỏ khóa HSK5/6 thừa) đã phát hành trong PR#133 và được kiểm lại trong lượt này.


## Ghi nhận cần làm tiếp

| Mã | Phát hiện | Đánh giá |
|---|---|---|
| UX-008 | Chi tiết 努力 ghi HSK3, trợ giảng ghi HSK2 và thiếu ví dụ đã có ở modal; phân tích 力 ưu tiên nghĩa họ[Li4]. | Vấn đề thống nhất nguồn/nghĩa học liệu, cần kiểm theo từng bộ chuẩn; chưa sửa corpus trong bản UX. |
| UX-009 | Sau reload Shadowing, nội dung đúng câu nhưng tiêu đề tab có lúc là Lộ trình HSK. | Lỗi nhãn tab nhỏ, chưa kết luận nguyên nhân từ ảnh/route; cần regression riêng trước sửa. |
| UX-010 | Thẻ công xưởng hiện Hán/Pinyin trước, cần lật xem Việt; ví dụ mặt sau chưa có Pinyin. | Khác tiêu chí mặc định ba phần trong bảng. Cần chuẩn hóa flashcard, không đánh dấu Đạt mục này. |

## Kết quả từng ca

“CI fixture” chỉ áp dụng cho điều kiện ghi bên dưới. “PC + CI” cũng không có nghĩa tất cả nhánh của ca gốc đều đã qua. **PWA cài thật và OS keyboard/micro thật vẫn chờ cho mọi ca có liên quan.**

| ID | Màn / tính năng | Mức kiểm hiện có | Đã kiểm / kết quả | Còn thiếu hoặc vấn đề | Nguồn |
|---|---|---|---|---|---|
| A01 | Toàn ứng dụng — Mở trang | PC + CI | Mở Home và link sâu; guest/member fixture, cold/warm trong beta lab. | Thiết bị thật; độ trễ mạng di động thực tế. | UX, BP, SB |
| A02 | Toàn ứng dụng — Điều hướng | PC + CI | 17 màn bằng menu thật ở 6 cấu hình; Back/Forward/reload có regression riêng. | Chưa đo 10 thao tác liên tiếp cho mọi màn. | UX, SR |
| A03 | Toàn ứng dụng — Cuộn và bố cục | CI một phần | Không tràn ngang tài liệu ở 1440/390/320/768 và 844×390; ảnh từng màn. | Chưa nghiệm thu toàn bộ chữ lớn 200% và mọi nội dung dài. | UX, LP |
| A04 | Toàn ứng dụng — Vùng bấm và lớp phủ | PC + CI một phần | Hit-test nút X tại 20/50/80%; Daily có kiểm tra chat và Next. | Không suy ra mọi nút trên mọi màn đều qua hit-test. | UX, HW |
| A05 | Toàn ứng dụng — Menu mobile | CI | Mở menu mobile trước khi bấm từng đích; đóng đúng sau điều hướng. | OS Back/edge swipe và bàn phím iOS thật. | UX, SB |
| H01 | Trang chủ — Tiếp tục học | PC + CI | Xác nhận mâu thuẫn metadata-only HSK3/5; sửa hero/sidebar/CTA và kiểm resume HSK1 bằng sự kiện thật. | Tiến độ người dùng thật khác tài khoản fixture. | UR, LP, SY |
| H02 | Trang chủ — Các thẻ và thanh bên | PC + CI | Mở/thu khám phá; bố cục ba cột và Home VI/EN/ZH được kiểm trong regression. | Tên/nội dung dài bất kỳ; zoom 200%. | LP, SB |
| H03 | Trang chủ — Nhiệm vụ và chuỗi ngày | CI một phần | Nhiệm vụ guest/member và điều hướng tới hoạt động; regression EXP/chống thưởng trùng. | Chuyển ngày thực tế và gián đoạn mạng đúng thời điểm nhận thưởng. | SB, BP |
| R01 | Lộ trình HSK — Danh sách cấp độ | PC + CI | Mỗi HSK5/6 đúng một thẻ; render/enhance lại không dựng khóa trùng. | PWA cài thật. | UR, UX |
| R02 | Lộ trình HSK — Lật thẻ và mở cấp | PC + CI | Tái hiện HSK5 mở roadmap chung; sửa và bấm hai lần vào đúng HSK5/6 trên 6 cấu hình. | Đủ mọi tương tác bàn phím với cả thẻ khóa. | UX, UR |
| C01 | Giáo trình HSK1–6 — Danh mục bài | CI một phần | Danh mục/cấp học và route; regression learner HSK1–6. | Toàn bộ tổ hợp tìm/lọc/trống mỗi cấp. | HK, LP |
| C02 | Giáo trình HSK1–6 — Mở và tiếp tục bài | PC + CI | HSK5 bài đầu mở đúng; HSK1–4 bố cục/Trước/Tiếp/deep link trong regression. | Không tuyên bố đã học tay hết mọi bài đầu/giữa/cuối của 6 cấp. | LP, HK, SY |
| C03 | Giáo trình HSK1–6 — Từ mới/flashcard | PC + CI một phần | Điều hướng thẻ, tiến độ và reveal được kiểm trong learner contracts. | Nghĩa hiện sau chạm ở một số bộ thẻ; chưa đạt tiêu chí mặc định đủ cả ba như bảng gốc. | HK, LP |
| C04 | Giáo trình HSK1–6 — Nghe và đọc | CI một phần | Nghe/transcript và trạng thái UI theo learner tests. | Chưa nghe đánh giá âm thanh trên loa/tai nghe thiết bị thật. | HK |
| C05 | Giáo trình HSK1–6 — Ngữ pháp và kiến thức thêm | CI một phần | Tab kiến thức/ngữ pháp trong learner contracts và bố cục lesson. | Rà hết bảng/câu dài/giải thích của toàn bộ học liệu. | HK, LP |
| C06 | Giáo trình HSK1–6 — Luyện tập và chấm bài | CI | Regression trả lời đúng/sai, tham khảo câu mở và transcript ẩn trước đáp án. | IME vật lý trên điện thoại. | HK |
| C07 | Giáo trình HSK1–6 — Hoàn thành và EXP | CI fixture | Merge/recall/EXP và đồng bộ hai context, offline retry, dữ liệu cô lập. | Không thực hiện ghi dữ liệu học thật lên tài khoản production. | SY, HK |
| E01 | Đề thi HSK — Chọn và làm đề | CI một phần | Danh mục đề 56 bài và hợp đồng chọn đề/kỹ năng. | Chưa làm trọn một đề bằng tay trên thiết bị thật. | LP, HK |
| E02 | Đề thi HSK — Nộp và xem kết quả | CI một phần | Regression timer/nộp/kết quả trong bộ kiểm đề HSK. | Nghiệm thu toàn bộ bài thi và lời giải dài. | HK |
| S01 | Shadowing — Tìm và tiếp tục | PC + CI | Menu riêng; câu 2 giữ đúng sau reload, trạng thái ẩn Pinyin được giữ. | Chữ tiêu đề tab sau reload đôi lúc còn là Lộ trình HSK; ghi nhận UX-009. | LP, SH |
| S02 | Shadowing — Nghe và luyện câu | PC + CI một phần | Trước/Tiếp, ẩn Pinyin, hiển thị Hán/Pinyin/Việt; lifecycle audio trong regression. | Chưa đánh giá nghe bằng tai hay đổi output audio thật. | LP, SH |
| S03 | Shadowing — Ghi âm | Chờ thiết bị/quyền | Đã đọc trạng thái UI trước ghi và kiểm lifecycle bằng fixture. | Thu thật, từ chối quyền micro, iOS background/lock. | SH |
| D01 | 5 từ công xưởng/Daily — Giới thiệu và Tiếp | PC + CI | Nhãn Tiếp; đi qua giới thiệu → viết → ngữ cảnh → quiz. | Một phiên trọn vẹn trên PWA cài thật. | HW, SY |
| D02 | 5 từ công xưởng/Daily — Viết tay | PC + CI | Chuột vẽ được nét; touch/erase và fallback trong Chromium + WebKit. | Ngón tay/bút trên điện thoại thật; xoay khi đang vẽ. | HW |
| D03 | 5 từ công xưởng/Daily — Thanh nút và chat | PC + CI | Đã phát hiện dock che Tiếp trong app đầy đủ (UX-013), chừa chiều cao footer; kiểm lại intro/viết/ngữ cảnh, ngoài kiểm touch/chat. | Bàn phím/safe area iPhone thật. | HW |
| D04 | 5 từ công xưởng/Daily — Câu hỏi và hoàn thành | PC + CI | Trước trả lời Next khóa; sai có feedback; đã chấm khóa lựa chọn, Next mở. | Phiên thật đầy đủ/sync người dùng; không chỉ ca mẫu. | SY, HW |
| V01 | Ôn tập thích ứng — Từ đến hạn và trống | PC + CI | Guest không có từ đến hạn, CTA quay Home; fixture có dữ liệu ôn. | Tập dữ liệu lớn production. | UX, SY |
| V02 | Ôn tập thích ứng — Chu trình ôn | CI fixture | Chu trình recall, lịch yếu/ôn và merge bài học. | Chưa rà tay mọi kỹ năng với bàn phím thật. | SY |
| Q01 | Tìm kiếm đầu trang — Gõ và trả kết quả | PC + CI | 努力 và nhiều cách Hán/Việt/Pinyin, IME, hủy query và response muộn. | Độ phủ/nghĩa từ điển không phải nghiệm thu nội dung trong lượt UX này. | MS |
| Q02 | Tìm kiếm đầu trang — Bàn phím và viewport | CI mô phỏng | Input ≥16px trước focus, viewport thu nhỏ và khôi phục scroll. | Không gọi resize là bàn phím iOS thật; cần kiểm trên máy. | MS |
| Q03 | Tìm kiếm đầu trang — Đóng tìm kiếm/chi tiết | PC + CI | Sửa search phủ màn sau chuyển menu; X/Back/Escape, delayed history và mở lại. | Vuốt cạnh màn iOS thật. | MS, UX |
| Q04 | Tìm kiếm đầu trang — Chi tiết từ | PC + CI | Modal dài, nghe/copy/lưu/stroke; sửa X cuộn khuất desktop và tăng vùng chạm 44px. | Kiểm mọi từ dài; phân tích 力 còn nghĩa họ [Li4], xem UX-008. | MS, UX |
| K01 | Từ điển và kho HSK — Tra và bộ lọc | PC + CI một phần | Trang riêng mở, query 努力 có ví dụ Hán/Pinyin/Việt; công xưởng lọc 领料 còn 10 mục. | Mọi bộ lọc/cụm từ và dữ liệu rất lớn. | LP, UX |
| K02 | Từ điển và kho HSK — Ví dụ và lưu từ | PC + CI fixture | Chi tiết từ, ví dụ; lưu guest/member và stroke controls có kiểm browser. | Lưu/đổi tài khoản thật production. | MS, SY |
| F01 | Bài học công xưởng — Bài học | PC + CI | Bài Kho và tồn kho; câu hỏi đúng khóa đáp án và có Next; route/menu/bố cục. | Các bài còn lại chỉ qua route/contract, chưa đọc từng nội dung. | UX, SB |
| F02 | Bài học công xưởng — Thẻ từ | PC + CI một phần | Lật thẻ, xem nghĩa/câu mẫu, Next tăng 1/10 → 2/10. | Thẻ đang yêu cầu lật để xem nghĩa; câu mẫu chưa có Pinyin, xem UX-010. | UX |
| F03 | Bài học công xưởng — Hội thoại | PC + CI một phần | Mở tình huống, bỏ trống báo lỗi, mở câu mẫu đủ Hán/Pinyin/Việt. | Ghi/nghe bằng thiết bị thật và toàn bộ tình huống. | UX, SB |
| F04 | Bài học công xưởng — Kiểm tra | PC + CI một phần | Chọn đáp án có nút Câu tiếp; menu/độ rộng; chưa đi hết mọi câu. | Nộp/làm lại đầy đủ cho tất cả tổ hợp đề. | UX, SB |
| F05 | Bài học công xưởng — Từ điển công xưởng | PC + CI | Tra 领料 hiển thị 10 thuật ngữ đúng query; danh mục lớn mở được. | Chưa đo input latency bộ 1600 từ trên điện thoại cấu hình thấp. | UX |
| F06 | Bài học công xưởng — Sổ từ cá nhân | PC + CI một phần | Giao diện trống và tra tiếng Việt lĩnh liệu trả gợi ý; fixture sync phân tài khoản. | Chưa thêm/sửa/xóa từ thật production. | UX, SY |
| F07 | Bài học công xưởng — Cộng đồng | PC + CI một phần | Lỗi mạng có retry; sửa danh sách kẹt Đang tải khi fetch thất bại; giữ dữ liệu cũ nếu refresh lỗi. | Chưa gửi từ công khai; endpoint trong cloud browser đang fetch lỗi, không kết luận site down. | UR, UX |
| N01 | Học tiếng Việt — Danh mục và tiếp tục | PC + CI | Danh mục, mở l01 và đổi words/grammar/dialogue/practice; lưu guest riêng. | Sync tài khoản thật. | VN, UX |
| N02 | Học tiếng Việt — Từ/âm thanh/hội thoại | PC + CI | Mở nghĩa/ví dụ, cấu trúc hội thoại và audio fallback được kiểm. | Âm thanh/TTS trên thiết bị thật. | VN |
| N03 | Học tiếng Việt — Luyện tập và hoàn thành | PC + CI | Bỏ trống có cảnh báo; chưa nghe yêu cầu nghe hoặc đổi đọc; đáp án đúng có feedback và Next. | Toàn bộ dạng bài trên OS keyboard thật. | VN |
| G01 | Game — Menu và cấu hình | PC + CI | Mở cả ba game, cấu hình, trở lại; nối cặp có 12.446 từ, bật/tắt Pinyin. | Game gõ hiện chỉ HSK1–4; HSK5/6 ở đây vẫn khóa theo chức năng hiện tại. | GM, UX |
| G02 | Game — Gõ Pinyin | PC + CI | Chọn HSK/độ khó/gợi ý; browser gameplay/performance fixture kiểm điểm/tim/focus/lifecycle. | Bàn phím ảo và gián đoạn app thật. | GM |
| G03 | Game — Nối cặp | PC + CI | Chọn rồi chạm lại hủy, ghép 请进 với mời vào +100; giữ thẻ ghép đúng. | Nhiều ván, pause, chống lặp và hint có kiểm bằng fixture. | GM |
| G04 | Game — Xếp câu | PC + CI một phần | Game hiện là Dịch câu Pinyin: gõ một câu, hiện Hán/Pinyin, +100 và nút Next. | Mục Xếp câu trong kế hoạch không khớp tên/luồng game đang công khai; không đánh Đạt cho thao tác token chưa có. | GM |
| G05 | Game — Kết quả/BXH game | CI fixture | BXH game, lưu điểm, bộ lọc/rollback; không quy đổi điểm game thành EXP. | Ghi điểm thật hai lần và gián đoạn mạng production. | GM |
| B01 | EXP/Bảng xếp hạng — Tải lần đầu | PC + CI | Loading → podium/list; guest không có EXP giả; chậm/lỗi và chia sẻ request có regression. | Điện thoại mạng di động và tài khoản thật. | SB, BP |
| B02 | EXP/Bảng xếp hạng — Đồng nhất dữ liệu | PC + CI fixture | Top5/podium/list cùng tổng349 trên dữ liệu quan sát; thưởng/response muộn trong fixture. | Nhận thưởng production rồi đối chiếu nhiều thiết bị thật. | SB, BP |
| B03 | EXP/Bảng xếp hạng — Lỗi/trống/đổi tài khoản | CI fixture | RPC lỗi/trống/retry và trạng thái member/guest có regression. | Logout/login các tài khoản production. | SB, SY |
| P01 | Tài khoản/Hồ sơ — Đăng nhập/đăng ký | CI fixture | Form 1440/390/320, validation/busy/không reset khi bấm lại; không gửi tài khoản thật. | Bàn phím điện thoại và thông tin thật. | AU |
| P02 | Tài khoản/Hồ sơ — Xác minh/khôi phục/Google | CI fixture | Google/callback/reset/duplicate-email/SMTP error bằng fixture. | Không khẳng định đã thử OTP email thật/Google thật. | AU, SY |
| P03 | Tài khoản/Hồ sơ — Hồ sơ và đăng xuất | PC + CI một phần | Hồ sơ guest; tái hiện X không thoát, sửa và kiểm quay Home/route. | Đổi tên dài, logout/login thật và nhiều thiết bị. | UX, AU |
| T01 | Duckie Chat/Trợ lý — Mở/đóng và bố cục | PC + CI | Chat mở/đóng, keyboard viewport mô phỏng, Next Daily không bị launcher che. | Mọi màn kết hợp OS keyboard thật. | CH, HW |
| T02 | Duckie Chat/Trợ lý — Gửi và lỗi | CI fixture | Nhập/gửi và lỗi AI bằng server fixture, không gửi nội dung người dùng thật. | Độ trễ/dịch vụ AI production và nhận dạng giọng nói thật. | CH |
| T03 | Trợ giảng – Giải thích — Từ đang chọn | PC một phần | Mở từ 努力 → Hỏi trợ giảng; hiện nghĩa/Pinyin. | HSK hiển thị2 trong trợ giảng nhưng chi tiết từ3, ví dụ chưa dùng chung; UX-008. | Trực tiếp 17/11 |
| T04 | Trợ giảng – Hội thoại — Từng tình huống | PC một phần | Hội thoại Chào hỏi, nhập 我叫德。; feedback ghi rõ chỉ nhận từ khóa. | Các tình huống khác và IME/keyboard thật. | Trực tiếp 17/11 |
| T05 | Trợ giảng – Bài tập — Tạo và làm bài | PC một phần | Bài tập 领料, chọn đúng khóa bốn đáp án, có feedback và Câu tiếp. | Bộ mới/kết quả toàn bộ/màn hẹp. | Trực tiếp 17/11 |
| T06 | Trợ giảng – Điểm yếu — Thống kê và ôn | PC một phần | Điểm yếu ghi nhận1 lượt đúng; trạng thái chưa đủ câu sai rõ ràng. | Luồng có nhiều câu sai và cập nhật danh sách ôn. | Trực tiếp 17/11 |
| T07 | Trợ giảng – Luyện nói — Micro và nhận dạng | Chờ micro thật | Tab luyện nói và giải thích giới hạn có hiển thị. | Chưa xin quyền/thu/nhận dạng thật trong browser; cần thiết bị và quyền. | Trực tiếp 17/11 |
| T08 | Trợ giảng – Trợ giảng — Gợi ý từ kho dữ liệu | PC một phần | Mở gợi ý; Học thứ tự nét đóng panel trở lại modal luyện nét. | Ví dụ/cấp HSK dùng cùng nguồn như T03; mobile keyboard và nội dung dài. | Trực tiếp 17/11 |
| L01 | Ngôn ngữ và trợ năng — VI/中文/English | CI một phần | VI/EN/ZH Home/learning shell không reload; regression i18n/mutation. | Không coi mọi nhãn/nội dung học liệu đã được kiểm dịch thủ công. | SB, BP |
| L02 | Ngôn ngữ và trợ năng — Bàn phím và chữ lớn | CI một phần | Focus, Escape, reduced-motion theo auth/search/game tests. | Tab order tất cả màn, 200% chữ và trình đọc màn hình. | AU, MS, GM |
| W01 | PWA/Offline/Đồng bộ — Cài và mở lại | Chờ PWA cài thật | Manifest/SW và shell/offline có kiểm; không gọi browser context là cài PWA thật. | Mở từ icon, khóa/mở máy, chuyển app iOS/Android thật. | SY, PW |
| W02 | PWA/Offline/Đồng bộ — Nâng phiên bản | CI fixture | Nâng cache v68, URL asset mới, cache không trộn query; upgrade/offline tests. | Đang nhập bài trên PWA cài thật lúc rollout. | PW, SY |
| W03 | PWA/Offline/Đồng bộ — Offline và trở lại mạng | CI fixture | Offline reload/queue/reconnect trên hai browser context với backend giả. | Thiết bị thật, mạng chập chờn, audio/dictionary chưa cache đủ. | SY, PW |
| W04 | PWA/Offline/Đồng bộ — Hai thiết bị và tài khoản | CI fixture | Hai context PC/mobile, merge tiến độ, phân tài khoản và quyền owner Postgres. | Chưa dùng hai thiết bị vật lý hay tài khoản production. | SY |

## Tra bằng chứng

| Mã | File/bộ chạy trong repository |
|---|---|
| UX | `tests/ux-screen-audit-browser.mjs`; workflow `ux-screen-audit.yml`; artifact `ux-screen-audit/report.json`, ảnh từng engine/viewport/màn. |
| UR | `tests/ux-navigation-regressions.test.cjs`, `first-visit-today-focus.test.mjs`, `v89.4-hsk-badge-coin-flip.test.js`. |
| SR | `tests/screen-routing-browser.mjs` (chờ route được khởi tạo, không chỉ chờ biến global có mặt). |
| LP | `tests/learning-polish-browser.mjs`; workflow Sidebar stability / learning-experience-acceptance. |
| HW | `tests/daily-handwriting-mobile-browser.mjs`; Daily handwriting mobile. |
| MS | `tests/header-search-browser.mjs`, `mobile-search-browser.mjs`; Mobile dictionary search. |
| AU | `tests/auth-screen-browser.mjs`; Sidebar stability. |
| SB | `tests/sidebar-browser.mjs`, `brand-runtime-browser.mjs`; Sidebar stability. |
| CH | `tests/duckie-chat-browser.mjs`; Sidebar stability (AI giả lập). |
| GM | `matching-game-browser.mjs`, `typing-game-browser.mjs`, `game-ranking-browser.mjs`, gameplay/performance; Typing game browser verification. |
| VN | `vietnamese-course` tests/workflow. |
| SH | `hsk-shadowing-browser.mjs` và Shadowing contracts trong Sidebar stability. |
| HK | HSK current learner browser contracts + HSK Content Quality; machine checks không thay kiểm nghĩa thủ công. |
| SY | `learning-progress-browser.mjs`, merge/recall/owner-RLS; Learning progress and spaced recall. |
| PW | `sidebar-service-worker.test.js`, `pwa.test.js`, `pwa-mobile.test.cjs`. |
| BP | `beta-performance-browser.mjs`, P1 Public Load Lab; số lab không tương đương điện thoại người dùng. |

Không gửi điểm game, OTP, từ cộng đồng hoặc dữ liệu học thử vào tài khoản production. Ảnh CI dùng dữ liệu fixture; thao tác trực tiếp giữ ở guest.
