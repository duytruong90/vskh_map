# VSKH Tactical Map

Bản đồ chiến thuật tương tác cho bang chiến — kéo thả đội hình lên bản đồ, vẽ hướng
tấn công, lưu và chia sẻ kế hoạch. Chạy hoàn toàn phía trình duyệt: không cần server,
không cần build.

## Chạy thử

```bash
git clone https://github.com/duytruong90/vskh_map.git
cd vskh_map
python3 -m http.server 8000     # hoặc: npx serve .
# → mở http://localhost:8000
```

Mở thẳng `index.html` bằng trình duyệt (`file://`) cũng chạy được: cắm icon, vẽ nét,
lưu, xuất/nhập `.json` đều bình thường. Riêng **Xuất ảnh PNG** thì không — trình duyệt
chặn đọc canvas có ảnh `file://`, nên tính năng này cần chạy qua `http://`.

Đăng nhập demo: chọn **Chỉ huy** và nhập mã `vskh2024`, hoặc chọn **Thành viên** (chỉ xem)
và không cần mã. Mã này nằm ở `DEFAULTS.leaderCode` trong `assets/js/config.js`.

> Lớp đăng nhập chạy hoàn toàn trên trình duyệt và chỉ dùng để phân vai chỉ huy /
> thành viên trên máy người dùng. Nó **không phải** lớp bảo mật thật — bất kỳ ai mở
> DevTools đều thấy được mã. Muốn kiểm soát truy cập thật thì phải có backend.

## Tính năng

**Cắm ký hiệu**
- 26 icon chia 4 nhóm: Đoàn Đội, Tài Nguyên, Chiến Thuật, Môn Phái.
- Nhóm **Môn Phái** gồm 7 môn phái (Thiết Y, Thần Tướng, Huyết Hà, Toái Mộng,
  Long Ngâm, Cửu Linh, Tố Vấn) dùng logo ảnh thay cho glyph vẽ tay; ghi đè đúng tên
  file trong `assets/img/class/` là logo mới hiện ngay, không phải sửa code. Thiếu
  file thì tự rơi về glyph SVG dự phòng — hiện Huyết Hà đang ở trạng thái này.
  Xem `assets/img/class/README.md`.
- 4 phe màu (Đỏ / Xanh / Trung Lập / Ghi Chú) — cùng một icon cắm được cho nhiều phe.
- Chọn icon rồi click lên bản đồ, hoặc kéo thẳng icon từ bảng bên trái vào bản đồ.
  Giữ `Shift` khi thả để cắm liên tiếp nhiều cái.
- Kéo để di chuyển, double-click để đặt nhãn, `Del` để xoá, nhân đôi và đổi cỡ
  (60%–200%) trong bảng thuộc tính.

**Vẽ nét**
- Bút tay, mũi tên, tẩy; 5 màu; 3 độ dày.
- Tẩy xoá theo từng nét, `Ctrl+Z` / `Ctrl+Shift+Z` hoàn tác được mọi thao tác
  (kể cả "Xoá tất cả").

**Bản đồ nền**
- Bản đồ mặc định là map bang chiến Sword of Justice (`assets/img/guildwar-map.webp`,
  1825×1018). Ảnh gốc `Guildwar Map.png` (2.0 MB) vẫn nằm ở thư mục gốc làm bản lưu;
  bản dùng trong app đã cắt viền tối và nén WebP q92 còn 163 KB (PSNR 44 dB — mắt
  thường không phân biệt được).
- Tải ảnh riêng từ máy, hoặc dán URL ảnh. Kích thước ảnh được đo tự động, ký hiệu
  lưu theo toạ độ tương đối nên đổi bản đồ không lệch tỉ lệ.

**Lưu & chia sẻ**
- Tự lưu vào `localStorage` sau mỗi thay đổi.
- Xuất / nhập kế hoạch dạng `.json`.
- Xuất ảnh `.png` gộp bản đồ + nét vẽ + ký hiệu.
- Sao chép link chia sẻ (kế hoạch nén trong `#plan=` của URL).

**Khung nhìn**: lăn chuột để zoom tại con trỏ, kéo nền hoặc giữ `Space` để di chuyển,
nút vừa khung hoặc phím `F` để vừa màn hình.

## Cập nhật bản mới (quan trọng)

`index.html` gọi CSS/JS kèm tham số phiên bản (`styles.css?v=2.0.0`). Trình duyệt coi
mỗi phiên bản là một file khác nhau, nên người dùng **không bị kẹt bản cũ trong cache**
khi bạn đẩy bản mới.

Mỗi lần sửa CSS hoặc JS rồi phát hành, nhớ tăng số này ở cả 7 dòng trong `index.html`:

```bash
sed -i 's/?v=2\.0\.0/?v=2.0.1/g' index.html     # Linux/macOS
(Get-Content index.html) -replace '\?v=2\.0\.0','?v=2.0.1' | Set-Content index.html   # PowerShell
```

Quên tăng số thì người đã mở trang trước đó có thể vẫn thấy giao diện cũ cho tới khi họ
tự bấm Ctrl+F5.

## Giao diện

Giao diện dùng ngôn ngữ thiết kế **Jade Ops**: bản đồ tràn khung, mọi bảng nổi lên trên
bản đồ (thanh dọc bên trái, bảng đội hình, bảng thuộc tính, thanh chế độ ở giữa trên).
Nền mực xanh với một màu nhấn ngọc bích duy nhất; tiêu đề dùng chữ có chân, còn mọi con
số và nhãn hệ thống dùng chữ đơn cách.

Ngọc bích **chỉ** dành cho điều khiển và trạng thái đang chọn — Đỏ / Xanh / Vàng vẫn
thuộc riêng về phe trên bản đồ, để không nhầm màu nhấn với màu quân.

Chuyển động khai báo trong `assets/css/styles.css` (biến `--t-*`, `--e-*`): thả icon
220ms, chọn ký hiệu 140ms, đổi chế độ 180ms, mở bảng 260ms, nét vẽ xong loé sáng 300ms.
Kéo marker không có transition để bám con trỏ tuyệt đối. Toàn bộ tôn trọng
`prefers-reduced-motion`.

### Phím tắt

| Phím | Tác dụng |
| --- | --- |
| `1` / `2` / `3` | Kéo thả / Vẽ nét / Di chuyển |
| `Ctrl+Z`, `Ctrl+Shift+Z` | Hoàn tác, làm lại |
| `Del`, `Backspace` | Xoá ký hiệu đang chọn |
| `Esc` | Bỏ chọn |
| `F` | Vừa màn hình |
| `Shift` + click | Cắm liên tiếp cùng một icon |

## Cấu trúc

```
index.html                 khung giao diện
assets/css/fonts.css       khai báo @font-face cho chữ tự lưu trữ
assets/fonts/*.woff2       Be Vietnam Pro, Noto Serif, JetBrains Mono (OFL)
assets/css/styles.css      giao diện Jade Ops (token, thành phần, chuyển động)
assets/js/config.js        bảng màu, bộ icon, hằng số (mã chỉ huy nằm ở đây)
assets/js/icons.js         sinh SVG cho huy hiệu và ghim bản đồ
assets/js/store.js         trạng thái, undo/redo, lưu localStorage
assets/js/board.js         zoom/pan, kéo thả marker, lớp vẽ, xuất PNG
assets/js/app.js           nối giao diện với store
assets/img/guildwar-map.webp  bản đồ chiến trường mặc định (đã nén)
assets/img/class/*.png        logo môn phái đã tách nền (xem README trong thư mục)
Guildwar Map.png              ảnh gốc chưa nén, không dùng trực tiếp trong app
```

Không dùng thư viện ngoài, không có bước build — script thường, chạy được cả khi mở
file trực tiếp. Deploy bằng cách đẩy thư mục này lên bất kỳ static host nào
(Vercel, Netlify, GitHub Pages).

## Giới hạn đã biết

- Kế hoạch lưu trên máy từng người; hai chỉ huy sửa cùng lúc **không** thấy thay đổi
  của nhau. Muốn đồng bộ thời gian thực cần thêm backend (WebSocket / Firebase).
- Ảnh nền tải từ máy được nhúng base64 vào `localStorage`; ảnh lớn (> ~5MB) có thể
  vượt hạn mức lưu trữ — app sẽ báo và bạn nên xuất file `.json` thay vì dựa vào tự lưu.
- Link chia sẻ không kèm được ảnh nền tải từ máy (chỉ kèm URL ảnh), và giới hạn ~30.000
  ký tự; kế hoạch quá lớn thì dùng file `.json`.
- Xuất PNG với ảnh nền từ domain khác chỉ chạy khi domain đó cho phép CORS.
