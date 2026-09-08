# Chữ tự lưu trữ

Ba bộ chữ dùng trong giao diện, tải sẵn về repo để trang hiển thị giống nhau trên mọi
máy và vẫn đúng khi mở offline (không gọi ra Google Fonts lúc chạy).

| Bộ chữ | Trọng lượng | Dùng cho |
| --- | --- | --- |
| Be Vietnam Pro | 400, 500, 600 | chữ thân bài, nút, nhãn — thiết kế riêng cho dấu tiếng Việt |
| Noto Serif | 700 | tiêu đề có chân (tên app, tiêu đề bảng) |
| JetBrains Mono | 400, 500, 700 | số liệu và nhãn hệ thống |

Mỗi bộ chỉ lấy hai subset `vietnamese` + `latin` ở đúng những trọng lượng đang dùng —
tổng cộng 228 KB cho 14 file.

Cả ba đều phát hành theo **SIL Open Font License 1.1**, cho phép dùng lại và phân phối
kèm sản phẩm. Bản quyền thuộc về tác giả gốc: Be Vietnam Pro (Lam Bao / Bien Studio),
Noto Serif (Google), JetBrains Mono (JetBrains).

Muốn đổi bộ chữ: thay file `.woff2` và cập nhật `assets/css/fonts.css`, hoặc bỏ hẳn
`fonts.css` — `styles.css` đã khai báo sẵn stack dự phòng của hệ điều hành.
