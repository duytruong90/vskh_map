# Logo môn phái

App đọc đúng 5 file dưới đây. Muốn dùng logo thật thì **ghi đè đúng tên file này**,
không cần sửa code:

| File | Nhãn hiện tại trong app | Màu nhận dạng |
| --- | --- | --- |
| `class-1.png` | Môn Phái Tím | tím |
| `class-2.png` | Môn Phái Lục | xanh bạc hà |
| `class-3.png` | Môn Phái Lam | xanh dương |
| `class-4.png` | Môn Phái Kim | vàng kim |
| `class-5.png` | Môn Phái Hồng | hồng |

Ảnh hiện tại chỉ là **hình tạm** do máy dựng từ glyph dự phòng, chưa phải logo môn phái thật.

Yêu cầu ảnh: PNG nền trong suốt, vuông, cạnh 128–512 px là đẹp nhất (app co ảnh về
ô ~22 px trên ghim và ~30 px trong bảng chọn).

Đổi tên hiển thị: sửa `label` của các mục `class-*` trong `assets/js/config.js`.
Nếu một file bị thiếu hoặc lỗi, app tự động hiện glyph SVG dự phòng thay vì vỡ giao diện.
