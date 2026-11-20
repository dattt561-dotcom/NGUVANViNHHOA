HỌC VĂN 4.9.8 — CẤU TRÚC TỆP (đã chia nhỏ từ 1 tệp)

index.html            Khung trang (HTML) + nạp các tệp bên dưới
css/                  11 tệp giao diện, tải theo thứ tự 01 → 11 (KHÔNG đảo thứ tự: thứ tự = thứ tự ưu tiên CSS)
  01-base            nền tảng, màu, thẻ, nút        06-materials   học liệu
  02-responsive      điện thoại / tablet            07-hubs        trang nhóm chức năng
  03-dark-a11y       chế độ tối, trợ năng           08-workspace   bàn làm bài, nhật ký
  04-community       cộng đồng học sinh             09-intro       intro
  05-effects         hiệu ứng                       10-focus-login chế độ tập trung, ô đăng nhập
                                                    11-perf-modern hiệu năng, chú thích nổi
js/core/              lõi: khởi động, lưu trữ/âm thanh/giao diện, Supabase, AI + đăng nhập, thông báo/realtime/intro
js/pages/             từng trang chức năng: điều hướng, nộp bài, giao bài, lớp & tài khoản, chấm bài, bảng điều khiển,
                      nhập/sao lưu & quản trị, thư viện & chat, chống gian lận, trò chơi & luyện đọc, diễn đàn & cuộc gọi, thống kê, trang chủ
js/features/          tính năng bổ sung theo phiên bản: cộng đồng, đánh giá/PWA, hiệu ứng trang chủ, xuất tài khoản & 1 thiết bị,
                      học liệu, trang nhóm, giờ thực, bàn làm bài 2 bên, chế độ tập trung & đồng hồ, tối ưu hiệu năng,
                      API hiện đại, đăng nhập/đồng bộ/đổi mật khẩu
sw.js                 Service Worker (lưu sẵn mọi tệp để dùng ngoại tuyến)
_headers              cấu hình cache cho Netlify (CSS/JS lưu lâu dài, index.html luôn kiểm tra mới)
supabase_setup.sql    SQL thiết lập Supabase (chạy trong SQL Editor)
tools/restamp.py      công cụ cập nhật mã băm ?v=... sau khi sửa css/js:  python3 tools/restamp.py [số phiên bản]
backup/               bản 1 tệp cũ (4.9.7) để quay lại nếu cần

CÁCH ĐƯA LÊN WEB: tải lên TOÀN BỘ thư mục này (index.html + css + js + sw.js + _headers). Chỉ tải mỗi index.html thì web sẽ mất giao diện.
Các tệp JS chạy theo đúng thứ tự trong index.html (thuộc tính defer) nên hành vi y hệt bản 1 tệp.
