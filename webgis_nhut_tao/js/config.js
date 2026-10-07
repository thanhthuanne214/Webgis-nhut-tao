// Cấu hình dự án - chỉ sửa file này khi cần đổi thông tin
window.APP_CONFIG = {
  // 0.1 Thông tin dự án
  TEN_DU_AN: "Cổng Tra cứu Thông Tin Quy Hoạch Xã Nhựt Tảo Tỉnh Tây Ninh",
  TEN_DIA_BAN: "Xã Nhựt Tảo",
  TINH: "Tỉnh Tây Ninh",
  TAM_BAN_DO: [10.57006, 106.47672], // lat, lng
  ZOOM_MAC_DINH: 14,
  DISCLAIMER: "Thông tin chỉ mang tính tham khảo. Vui lòng xác minh tại cơ quan nhà nước có thẩm quyền.",

  // 0.2 Dữ liệu
  LOP_HIEN_TRANG: "Aggregated",
  LOP_QUY_HOACH: null,
  HE_TOA_DO: "EPSG:4326",
  ANH_VE_TINH: "Google Satellite Hybrid",
  CHE_TEN_CHU_SU_DUNG: false,
  BAY_DEN_THUA_MUOT: false,

  // 0.3 Ánh xạ trường
  FIELDS: {
    soTo: "soto",
    soThua: "sothua",
    maThua: "Stt_to_thu",
    dienTich: "DienTich",
    dienTichPhapLy: null,
    hienTrang: "Hientrang",
    chuSuDung: "TenChu",
    diaChi: "DiaChiThua",
    coQuyHoach: "MadatQH",
    maLoaiDatQH: "MadatQH",
    tenLoaiDatQH: "LoaidatQH",
    dienTichQH: "DTQH"
  },

  // 0.4 Giao diện — xanh da trời
  FONT_CHU: "Helvetica, Arial, sans-serif",
  FONT_SO: "Helvetica, Arial, sans-serif",
  MAU_CHINH: "#0ea5e9",
  MAU_TOI: "#0c4a6e",
  MAU_NEN: "#e0f2fe"
};
