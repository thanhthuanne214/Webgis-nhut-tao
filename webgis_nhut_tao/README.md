# WebGIS Tra cứu Thông Tin Quy Hoạch – Xã Nhựt Tảo, Tỉnh Tây Ninh

## Chạy thử

1. Mở thư mục `webgis_nhut_tao` bằng một HTTP server đơn giản (không mở trực tiếp `file://` vì trình duyệt chặn tải module lớn).

```bash
# Python 3
cd webgis_nhut_tao
python3 -m http.server 8080

# hoặc Node
npx serve .
```

2. Truy cập: http://localhost:8080

## Đổi thông tin dự án

Chỉ sửa file **`js/config.js`**. Không cần sửa HTML/CSS/JS khác.

| Biến | Ý nghĩa |
|------|---------|
| `TEN_DU_AN` | Tiêu đề hiển thị |
| `TEN_DIA_BAN` / `TINH` | Địa bàn |
| `TAM_BAN_DO` | [lat, lng] trung tâm khi Reset |
| `ZOOM_MAC_DINH` | Mức zoom mặc định |
| `DISCLAIMER` | Dòng miễn trừ trách nhiệm chân bản đồ |
| `CHE_TEN_CHU_SU_DUNG` | `true` = che một phần tên chủ |
| `BAY_DEN_THUA_MUOT` | `true` = animation bay tới thửa |
| `FIELDS` | Ánh xạ tên trường GeoJSON |

## Dữ liệu

- Nguồn: xuất QGIS (qgis2web) – lớp **Aggregated** (30.328 thửa).
- Thông tin quy hoạch đã được gắn sẵn vào từng thửa (không có lớp quy hoạch riêng).
- **Màu sắc thửa đất giữ nguyên** theo phân loại `MDSD` từ QGIS.
- File: `data/Aggregated_1.js`

## Tính năng (theo đặc tả)

- Tra cứu theo Số tờ / Số thửa
- Tra cứu theo tọa độ (EPSG:4326 – kinh độ, vĩ độ)
- Tìm theo tên chủ sử dụng (gợi ý khi gõ)
- Click / Identify thửa → panel thông tin thửa + quy hoạch
- Hover highlight thửa
- 3 nền bản đồ: Ảnh vệ tinh (Google), Tối, Sáng
- Bật/tắt lớp + thanh độ mờ
- Đo khoảng cách & đo diện tích (geodesic / mặt cầu)
- GPS Locate Me, Reset Extent, Zoom, thước tỷ lệ
- Disclaimer cố định chân bản đồ
- Responsive desktop / tablet / mobile

## Thư viện

| Thư viện | Phiên bản | Vị trí |
|----------|-----------|--------|
| OpenLayers | 10.7.0 | `lib/ol.js`, `lib/ol.css` |

Không dùng CDN runtime cho logic; tile bản đồ nền gọi Google / CARTO.

## Cấu trúc thư mục

```
webgis_nhut_tao/
├── index.html
├── README.md
├── css/style.css
├── js/
│   ├── config.js          ← chỉ sửa file này khi đổi thông tin
│   ├── app.js
│   └── style_aggregated.js
├── data/
│   └── Aggregated_1.js    ← dữ liệu thửa (27 MB)
└── lib/
    ├── ol.js
    └── ol.css
```

## Ghi chú

- Dữ liệu lớn (~30k polygon): lần tải đầu có thể mất vài giây.
- Tên chủ sử dụng và địa chỉ là dữ liệu cá nhân; khi trình diễn công khai nên bật `CHE_TEN_CHU_SU_DUNG: true`.
- Không có backend; mọi xử lý chạy phía trình duyệt.
