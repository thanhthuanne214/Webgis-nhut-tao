/**
 * Style thửa đất giữ nguyên màu từ QGIS (phân loại theo MDSD).
 * Không thay đổi màu sắc.
 */
(function (global) {
  "use strict";

  var COLOR_MAP = {
    "1190": { stroke: "rgba(35,35,35,1.0)", fill: "rgba(202,222,124,1.0)" },
    BCS: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,255,254,1.0)" },
    BHK: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,240,180,1.0)" },
    CLN: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,210,160,1.0)" },
    DBV: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DDT: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DGD: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DGT: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,50,1.0)" },
    DNL: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DSH: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DTL: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(170,255,255,1.0)" },
    DVH: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    DYT: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    HHK: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(118,215,38,1.0)" },
    HNK: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,240,180,1.0)" },
    "HNK+ONT": { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,240,180,1.0)" },
    LNK: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,215,170,1.0)" },
    LUA: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,252,130,1.0)" },
    LUC: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,252,140,1.0)" },
    "LUC+ONT": { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,252,140,1.0)" },
    MNC: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(180,255,255,1.0)" },
    NKH: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(245,255,180,1.0)" },
    NTD: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(210,210,210,1.0)" },
    NTS: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(170,255,255,1.0)" },
    ONT: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,208,255,1.0)" },
    "ONT+LNK": { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,208,255,1.0)" },
    "ONT+LUC": { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,208,255,1.0)" },
    SKC: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(250,170,160,1.0)" },
    SON: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(160,255,255,1.0)" },
    TIN: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    TMD: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(250,170,160,1.0)" },
    TON: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    TSC: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(255,170,160,1.0)" },
    TSN: { stroke: "rgba(35,35,35,1.0)", fill: "rgba(170,255,255,1.0)" }
  };

  var DEFAULT_COLOR = {
    stroke: "rgba(35,35,35,1.0)",
    fill: "rgba(29,224,203,1.0)"
  };

  var SELECT_STROKE = "rgba(239,68,68,1.0)";
  var HOVER_STROKE = "rgba(14,165,233,1.0)";

  function makeStyle(fill, stroke, width) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: stroke,
        width: width || 0.988,
        lineCap: "butt",
        lineJoin: "miter"
      }),
      fill: new ol.style.Fill({ color: fill })
    });
  }

  function styleAggregated(feature, resolution) {
    var value = feature.get("MDSD");
    var key = value !== null && value !== undefined ? String(value) : "default";
    var colors = COLOR_MAP[key] || DEFAULT_COLOR;

    if (feature.get("_selected")) {
      return [
        makeStyle(colors.fill, SELECT_STROKE, 3.5),
        makeStyle(colors.fill, "rgba(239,68,68,0.35)", 8)
      ];
    }
    if (feature.get("_hover")) {
      return [makeStyle(colors.fill, HOVER_STROKE, 2.2)];
    }
    return [makeStyle(colors.fill, colors.stroke, 0.988)];
  }

  global.styleAggregated = styleAggregated;
  global.PARCEL_COLOR_MAP = COLOR_MAP;
})(typeof window !== "undefined" ? window : this);
