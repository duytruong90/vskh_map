# Logo môn phái

App đọc file theo đúng tên dưới đây. Thay logo = **ghi đè đúng tên file**, không cần sửa code.

| File | Môn phái | Nguồn |
| --- | --- | --- |
| `thiet-y.png` | Thiết Y | `Thiet Y.png` |
| `than-tuong.png` | Thần Tướng | `Than Tuong.png` |
| `huyet-ha.png` | Huyết Hà | **chưa có** — xem ghi chú bên dưới |
| `toai-mong.png` | Toái Mộng | `Toai mong.png` |
| `long-ngam.png` | Long Ngâm | `Long Ngam.png` |
| `cuu-linh.png` | Cửu Linh | `Cuu Linh.png` |
| `to-van.png` | Tố Vấn | `To Van.png` |

Ảnh gốc tải lên nằm ở thư mục gốc repo. Ảnh trong thư mục này đã được xử lý lại:
tách nền đen thành nền trong suốt (dùng độ sáng làm alpha), cắt sát viền, bo vuông
và resize về 256 px.

Icon môn phái dùng **chính ảnh logo làm icon** — không lồng vào ghim giọt nước như
các nhóm khác. Phía sau chỉ có một vòng tròn mỏng theo màu phe để vẫn phân biệt được
đỏ / xanh / trung lập; marker neo ở tâm ảnh.

**Huyết Hà chưa có logo.** File `Huyet Ha.webp` được tải lên là ảnh mặt gấu mèo
44×44, không phải huy hiệu môn phái, nên app đang dùng glyph SVG dự phòng màu đỏ.
Chỉ cần bỏ `huyet-ha.png` (PNG nền trong, vuông, 128–512 px) vào thư mục này là
logo hiện lên ngay, không phải sửa code.

Đổi tên hiển thị: sửa `label` của các mục trong nhóm `Môn Phái` ở `assets/js/config.js`.
Thiếu hoặc lỗi file thì app tự rơi về glyph dự phòng chứ không vỡ giao diện.
