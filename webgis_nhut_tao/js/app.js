/**
 * WebGIS Tra cứu Quy hoạch – Xã Nhựt Tảo
 * Giao diện kiểu sidebar trái + toolbar phải (xanh da trời)
 */
(function () {
  "use strict";

  var CFG = window.APP_CONFIG;
  var F = CFG.FIELDS;
  var currentTab = "tothua";
  var lastInfoText = "";
  var lastCenterLonLat = null;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function maskName(name) {
    if (!CFG.CHE_TEN_CHU_SU_DUNG || !name) return name || "";
    return String(name)
      .trim()
      .split(/\s+/)
      .map(function (p) {
        return p.length <= 1 ? p : p[0] + "***";
      })
      .join(" ");
  }

  function formatNumber(n, unit) {
    if (n === null || n === undefined || n === "") return "—";
    var num = Number(n);
    if (isNaN(num)) return String(n);
    var s = num.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
    return unit ? s + " " + unit : s;
  }

  function showToast(msg, ms) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove("show");
    }, ms || 2800);
  }

  // ---------- map ----------
  var map, parcelLayer, parcelSource;
  var selectedFeature = null;
  var hoverFeature = null;
  var measureDraw = null;
  var measureSource = null;
  var measureLayer = null;
  var measureType = null;
  var measureListener = null;
  var gpsMarker = null;
  var labelOverlay = null;
  var baseLayers = {};
  var ownerIndex = null;

  function initMap() {
    baseLayers.satellite = new ol.layer.Tile({
      visible: true,
      source: new ol.source.XYZ({
        url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        attributions: "Google"
      })
    });
    baseLayers.dark = new ol.layer.Tile({
      visible: false,
      source: new ol.source.XYZ({
        url: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        attributions: "© CARTO"
      })
    });
    baseLayers.light = new ol.layer.Tile({
      visible: false,
      source: new ol.source.XYZ({
        url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        attributions: "© CARTO"
      })
    });

    var format = new ol.format.GeoJSON();
    var features = format.readFeatures(json_Aggregated_1, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857"
    });
    parcelSource = new ol.source.Vector({ features: features });
    parcelLayer = new ol.layer.Vector({
      source: parcelSource,
      style: styleAggregated,
      opacity: 0.85,
      declutter: false
    });

    measureSource = new ol.source.Vector();
    measureLayer = new ol.layer.Vector({
      source: measureSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: "rgba(14,165,233,0.2)" }),
        stroke: new ol.style.Stroke({
          color: "#0ea5e9",
          width: 2,
          lineDash: [8, 6]
        }),
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: "#0ea5e9" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 1.5 })
        })
      })
    });

    map = new ol.Map({
      target: "map",
      layers: [
        baseLayers.satellite,
        baseLayers.dark,
        baseLayers.light,
        parcelLayer,
        measureLayer
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([CFG.TAM_BAN_DO[1], CFG.TAM_BAN_DO[0]]),
        zoom: CFG.ZOOM_MAC_DINH,
        maxZoom: 20,
        minZoom: 10
      }),
      controls: ol.control.defaults.defaults({
        zoom: false,
        attribution: true,
        rotate: false
      }).extend([new ol.control.ScaleLine({ units: "metric" })])
    });

    map.on("pointermove", onPointerMove);
    map.on("singleclick", onMapClick);

    var loading = $("#loading");
    if (loading) loading.style.display = "none";

    buildOwnerIndex();
  }

  function clearHover() {
    if (hoverFeature) {
      hoverFeature.set("_hover", false);
      hoverFeature = null;
    }
  }

  function clearSelect() {
    if (selectedFeature) {
      selectedFeature.set("_selected", false);
      selectedFeature = null;
    }
    if (labelOverlay) {
      map.removeOverlay(labelOverlay);
      labelOverlay = null;
    }
    $("#empty-state").style.display = "";
    $("#info-content").classList.remove("visible");
    $("#btn-copy").disabled = true;
    $("#btn-direction").disabled = true;
    lastInfoText = "";
    lastCenterLonLat = null;
  }

  function selectFeature(feature) {
    clearSelect();
    clearHover();
    selectedFeature = feature;
    feature.set("_selected", true);
    showInfo(feature);

    var geom = feature.getGeometry();
    if (!geom) return;
    var extent = geom.getExtent();
    var center = ol.extent.getCenter(extent);
    lastCenterLonLat = ol.proj.toLonLat(center);

    // Label overlay
    var soTo = feature.get(F.soTo) || "";
    var soThua = feature.get(F.soThua) || "";
    var el = document.createElement("div");
    el.style.cssText =
      "background:rgba(12,74,110,0.9);color:#fff;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);pointer-events:none;";
    el.textContent = "Tờ " + soTo + " · Thửa " + soThua;
    labelOverlay = new ol.Overlay({
      element: el,
      positioning: "center-center",
      position: center,
      stopEvent: false
    });
    map.addOverlay(labelOverlay);

    map.getView().fit(extent, {
      padding: [60, 60, 60, 380],
      maxZoom: 18,
      duration: CFG.BAY_DEN_THUA_MUOT ? 500 : 0
    });
  }

  function onPointerMove(evt) {
    if (evt.dragging || measureType) return;
    var pixel = map.getEventPixel(evt.originalEvent);
    var hit = map.hasFeatureAtPixel(pixel, {
      layerFilter: function (l) {
        return l === parcelLayer;
      }
    });
    map.getTargetElement().style.cursor = hit ? "pointer" : "";

    var feature = map.forEachFeatureAtPixel(
      pixel,
      function (f) {
        return f;
      },
      {
        layerFilter: function (l) {
          return l === parcelLayer;
        }
      }
    );
    if (feature === hoverFeature) return;
    clearHover();
    if (feature && feature !== selectedFeature) {
      hoverFeature = feature;
      feature.set("_hover", true);
    }
  }

  function onMapClick(evt) {
    if (measureType) return;
    var feature = map.forEachFeatureAtPixel(
      evt.pixel,
      function (f) {
        return f;
      },
      {
        layerFilter: function (l) {
          return l === parcelLayer;
        }
      }
    );
    if (feature) selectFeature(feature);
    else clearSelect();
  }

  // ---------- info panel ----------
  function getProp(feature, key) {
    if (!key) return null;
    return feature.get(key);
  }

  function isEmpty(value) {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      String(value) === "None" ||
      String(value) === "null"
    );
  }

  function addRow(parent, label, value) {
    var row = document.createElement("div");
    row.className = "info-row";
    var l = document.createElement("span");
    l.className = "label";
    l.textContent = label;
    var v = document.createElement("span");
    v.className = "value";
    if (isEmpty(value)) {
      v.textContent = "thiếu thông tin";
      v.style.opacity = "0.65";
      v.style.fontStyle = "italic";
    } else {
      v.textContent = String(value);
    }
    row.appendChild(l);
    row.appendChild(v);
    parent.appendChild(row);
  }

  function showInfo(feature) {
    var blockThua = $("#block-thua");
    var blockRatio = $("#block-ratio");
    var blockQh = $("#block-qh");
    blockThua.innerHTML = "";
    blockRatio.innerHTML = "";
    blockQh.innerHTML = "";

    var h3 = document.createElement("h3");
    h3.textContent = "Thửa đất";
    blockThua.appendChild(h3);

    var soTo = getProp(feature, F.soTo);
    var soThua = getProp(feature, F.soThua);
    var maThua = getProp(feature, F.maThua);
    var dt = getProp(feature, F.dienTich);
    var ht = getProp(feature, F.hienTrang);
    var chu = maskName(getProp(feature, F.chuSuDung));
    var diaChi = getProp(feature, F.diaChi);

    addRow(blockThua, "Số tờ", soTo);
    addRow(blockThua, "Số thửa", soThua);
    addRow(blockThua, "Mã thửa", maThua);
    addRow(blockThua, "Diện tích", formatNumber(dt, "m²"));
    addRow(blockThua, "Hiện trạng", ht);
    addRow(blockThua, "Chủ sử dụng", chu);
    addRow(blockThua, "Địa chỉ", diaChi);

    // Quy hoạch: chỉ tính khi có mã loại đất QH hợp lệ
    var madat = getProp(feature, F.maLoaiDatQH);
    var tenQH = getProp(feature, F.tenLoaiDatQH);
    var hasQH =
      madat !== null &&
      madat !== undefined &&
      String(madat).trim() !== "" &&
      String(madat) !== "None" &&
      String(madat) !== "null";

    var dtt = Number(dt) || 0;
    var dtqhRaw = Number(getProp(feature, F.dienTichQH)) || 0;
    // Không có mã QH → coi diện tích quy hoạch = 0 (tránh DTQH = diện tích thửa nhưng MadatQH trống)
    var dtqh = hasQH ? dtqhRaw : 0;
    var pct = hasQH && dtt > 0 ? Math.min(100, Math.round((dtqh / dtt) * 100)) : 0;
    var outside = Math.max(0, dtt - dtqh);

    var h3r = document.createElement("h3");
    h3r.textContent = "Tỷ lệ quy hoạch";
    blockRatio.appendChild(h3r);

    var wrap = document.createElement("div");
    wrap.className = "ratio-wrap";
    var ring = document.createElement("div");
    ring.className = "ratio-ring";
    ring.style.setProperty("--pct", pct + "%");
    var sp = document.createElement("span");
    sp.textContent = pct + "%";
    ring.appendChild(sp);
    wrap.appendChild(ring);

    var detail = document.createElement("div");
    detail.className = "ratio-detail";
    detail.textContent =
      "Quy hoạch: " +
      pct +
      "% (" +
      formatNumber(dtqh, "m²") +
      ")\nNgoài quy hoạch: " +
      formatNumber(outside, "m²");
    detail.style.whiteSpace = "pre-line";
    wrap.appendChild(detail);
    blockRatio.appendChild(wrap);

    var h3q = document.createElement("h3");
    h3q.textContent = "Chi tiết quy hoạch";
    blockQh.appendChild(h3q);

    if (hasQH) {
      var card = document.createElement("div");
      card.className = "qh-card";
      var sw = document.createElement("div");
      sw.className = "qh-swatch";
      var nm = document.createElement("div");
      nm.className = "qh-name";
      nm.textContent = isEmpty(tenQH) ? "thiếu thông tin" : tenQH;
      var sm = document.createElement("small");
      sm.textContent = "Mã: " + madat;
      nm.appendChild(sm);
      var ar = document.createElement("div");
      ar.className = "qh-area";
      ar.textContent = formatNumber(dtqh, "m²");
      card.appendChild(sw);
      card.appendChild(nm);
      card.appendChild(ar);
      blockQh.appendChild(card);
    } else {
      addRow(blockQh, "Mã loại đất QH", null);
      addRow(blockQh, "Tên loại đất QH", null);
      addRow(blockQh, "Diện tích quy hoạch", null);
    }

    // Copy text
    function copyVal(val) {
      return isEmpty(val) ? "thiếu thông tin" : String(val);
    }
    lastInfoText = [
      "Tờ: " + copyVal(soTo),
      "Thửa: " + copyVal(soThua),
      "Mã thửa: " + copyVal(maThua),
      "Diện tích: " + formatNumber(dt, "m²"),
      "Hiện trạng: " + copyVal(ht),
      "Chủ sử dụng: " + copyVal(chu),
      "Địa chỉ: " + copyVal(diaChi),
      "Tỷ lệ QH: " + pct + "%",
      "DTQH: " + formatNumber(dtqh, "m²"),
      hasQH
        ? "Loại đất QH: " + copyVal(tenQH) + " (" + madat + ")"
        : "Quy hoạch: thiếu thông tin"
    ].join("\n");

    $("#empty-state").style.display = "none";
    $("#info-content").classList.add("visible");
    $("#btn-copy").disabled = false;
    $("#btn-direction").disabled = !lastCenterLonLat;
  }

  // ---------- search ----------
  function buildOwnerIndex() {
    ownerIndex = [];
    var feats = parcelSource.getFeatures();
    for (var i = 0; i < feats.length; i++) {
      var n = feats[i].get(F.chuSuDung);
      if (n) ownerIndex.push({ name: String(n), feature: feats[i] });
    }
  }

  function searchToThua() {
    var raw = $("#inp-tothua").value.trim().replace(/\s+/g, "");
    if (!raw) {
      showToast("Vui lòng nhập số tờ_số thửa");
      return;
    }
    var parts = raw.split(/[_\-\/.,]/);
    if (parts.length < 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
      showToast("Định dạng: số tờ_số thửa (vd: 10_75)");
      return;
    }
    var soTo = parts[0];
    var soThua = parts[1];
    var feats = parcelSource.getFeatures();
    for (var i = 0; i < feats.length; i++) {
      var f = feats[i];
      if (String(f.get(F.soTo)) === soTo && String(f.get(F.soThua)) === soThua) {
        selectFeature(f);
        showToast("Đã tìm thấy thửa " + soTo + "/" + soThua);
        return;
      }
    }
    showToast("Không tìm thấy thửa " + soTo + "/" + soThua);
  }

  function searchCoord() {
    var x = parseFloat($("#inp-x").value.trim().replace(",", "."));
    var y = parseFloat($("#inp-y").value.trim().replace(",", "."));
    if (isNaN(x) || isNaN(y)) {
      showToast("Tọa độ không hợp lệ");
      return;
    }
    if (x < 100 || x > 110 || y < 8 || y > 24) {
      showToast("Tọa độ ngoài vùng Việt Nam");
      return;
    }
    var coord3857 = ol.proj.fromLonLat([x, y]);
    if (gpsMarker) map.removeOverlay(gpsMarker);
    var el = document.createElement("div");
    el.style.cssText =
      "width:14px;height:14px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4);";
    gpsMarker = new ol.Overlay({
      element: el,
      positioning: "center-center",
      position: coord3857
    });
    map.addOverlay(gpsMarker);
    map.getView().animate({
      center: coord3857,
      zoom: Math.max(map.getView().getZoom(), 17),
      duration: CFG.BAY_DEN_THUA_MUOT ? 400 : 0
    });
    var pixel = map.getPixelFromCoordinate(coord3857);
    var feature = map.forEachFeatureAtPixel(
      pixel,
      function (f) {
        return f;
      },
      {
        layerFilter: function (l) {
          return l === parcelLayer;
        }
      }
    );
    if (feature) selectFeature(feature);
    else showToast("Đã ghim tọa độ");
  }

  function onOwnerInput() {
    var q = $("#inp-owner").value.trim().toLowerCase();
    var list = $("#suggest-owner");
    list.innerHTML = "";
    if (q.length < 2 || !ownerIndex) return;
    var count = 0;
    for (var i = 0; i < ownerIndex.length && count < 20; i++) {
      var item = ownerIndex[i];
      if (item.name.toLowerCase().indexOf(q) !== -1) {
        var div = document.createElement("div");
        div.className = "suggest-item";
        div.textContent = item.name;
        (function (feat) {
          div.addEventListener("click", function () {
            selectFeature(feat);
            list.innerHTML = "";
            $("#inp-owner").value = feat.get(F.chuSuDung) || "";
          });
        })(item.feature);
        list.appendChild(div);
        count++;
      }
    }
  }

  // ---------- measure ----------
  function formatLength(line) {
    var length = ol.sphere.getLength(line);
    return length > 1000
      ? (length / 1000).toFixed(2) + " km"
      : length.toFixed(1) + " m";
  }

  function formatArea(polygon) {
    var area = ol.sphere.getArea(polygon);
    var peri = 0;
    var coords = polygon.getLinearRing(0).getCoordinates();
    for (var i = 0; i < coords.length - 1; i++) {
      peri += ol.sphere.getDistance(
        ol.proj.toLonLat(coords[i]),
        ol.proj.toLonLat(coords[i + 1])
      );
    }
    var areaStr =
      area > 10000
        ? (area / 10000).toFixed(2) + " ha"
        : area.toFixed(1) + " m²";
    var periStr =
      peri > 1000 ? (peri / 1000).toFixed(2) + " km" : peri.toFixed(1) + " m";
    return areaStr + " · chu vi " + periStr;
  }

  function startMeasure(type) {
    stopMeasure();
    measureType = type;
    $$(".tool-btn[data-tool]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tool") === type);
    });
    measureDraw = new ol.interaction.Draw({
      source: measureSource,
      type: type,
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: "rgba(14,165,233,0.15)" }),
        stroke: new ol.style.Stroke({
          color: "#0ea5e9",
          width: 2,
          lineDash: [8, 6]
        }),
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: "#0ea5e9" })
        })
      })
    });
    map.addInteraction(measureDraw);
    var resultEl = $("#measure-result");
    resultEl.classList.add("visible");
    resultEl.textContent =
      type === "LineString"
        ? "Bấm các điểm để đo khoảng cách..."
        : "Bấm các điểm để đo diện tích...";

    measureDraw.on("drawstart", function (evt) {
      measureSource.clear();
      var sketch = evt.feature;
      measureListener = sketch.getGeometry().on("change", function (e) {
        var geom = e.target;
        if (geom.getType() === "LineString") {
          resultEl.textContent = "Chiều dài: " + formatLength(geom);
        } else if (geom.getType() === "Polygon") {
          resultEl.textContent = "Diện tích: " + formatArea(geom);
        }
      });
    });
    measureDraw.on("drawend", function (evt) {
      var geom = evt.feature.getGeometry();
      if (geom.getType() === "LineString") {
        resultEl.textContent = "Chiều dài: " + formatLength(geom);
      } else {
        resultEl.textContent = "Diện tích: " + formatArea(geom);
      }
      if (measureListener) {
        ol.Observable.unByKey(measureListener);
        measureListener = null;
      }
    });
  }

  function stopMeasure() {
    if (measureDraw) {
      map.removeInteraction(measureDraw);
      measureDraw = null;
    }
    if (measureListener) {
      ol.Observable.unByKey(measureListener);
      measureListener = null;
    }
    measureType = null;
    $$(".tool-btn[data-tool]").forEach(function (b) {
      b.classList.remove("active");
    });
  }

  function clearMeasure() {
    stopMeasure();
    measureSource.clear();
    $("#measure-result").classList.remove("visible");
  }

  function locateMe() {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ định vị");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var coord = ol.proj.fromLonLat([
          pos.coords.longitude,
          pos.coords.latitude
        ]);
        if (gpsMarker) map.removeOverlay(gpsMarker);
        var el = document.createElement("div");
        el.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 6px rgba(14,165,233,0.3);";
        gpsMarker = new ol.Overlay({
          element: el,
          positioning: "center-center",
          position: coord
        });
        map.addOverlay(gpsMarker);
        map.getView().animate({
          center: coord,
          zoom: 17,
          duration: CFG.BAY_DEN_THUA_MUOT ? 400 : 0
        });
      },
      function () {
        showToast("Không lấy được vị trí GPS");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function resetExtent() {
    map.getView().animate({
      center: ol.proj.fromLonLat([CFG.TAM_BAN_DO[1], CFG.TAM_BAN_DO[0]]),
      zoom: CFG.ZOOM_MAC_DINH,
      duration: CFG.BAY_DEN_THUA_MUOT ? 300 : 0
    });
  }

  // ---------- tabs / UI ----------
  function setTab(tab) {
    currentTab = tab;
    $$(".tabs button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    $("#search-tothua").style.display = tab === "tothua" ? "" : "none";
    $("#search-owner").style.display = tab === "owner" ? "" : "none";
    $("#search-coord").classList.toggle("visible", tab === "coord");
    $("#btn-search-go").classList.toggle(
      "visible",
      tab === "tothua" || tab === "coord"
    );
    $("#suggest-owner").innerHTML = "";
  }

  function bindUI() {
    $("#disclaimer").textContent = CFG.DISCLAIMER;

    $$(".tabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTab(btn.dataset.tab);
      });
    });

    $("#btn-search-go").addEventListener("click", function () {
      if (currentTab === "tothua") searchToThua();
      else if (currentTab === "coord") searchCoord();
    });

    $("#inp-tothua").addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchToThua();
    });
    $("#inp-x").addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchCoord();
    });
    $("#inp-y").addEventListener("keydown", function (e) {
      if (e.key === "Enter") searchCoord();
    });
    $("#inp-owner").addEventListener("input", onOwnerInput);

    $("#btn-zoom-in").addEventListener("click", function () {
      map.getView().animate({
        zoom: map.getView().getZoom() + 1,
        duration: 200
      });
    });
    $("#btn-zoom-out").addEventListener("click", function () {
      map.getView().animate({
        zoom: map.getView().getZoom() - 1,
        duration: 200
      });
    });
    $("#btn-locate").addEventListener("click", locateMe);
    $("#btn-reset").addEventListener("click", resetExtent);
    $("#btn-measure-line").addEventListener("click", function () {
      if (measureType === "LineString") clearMeasure();
      else startMeasure("LineString");
    });
    $("#btn-measure-area").addEventListener("click", function () {
      if (measureType === "Polygon") clearMeasure();
      else startMeasure("Polygon");
    });
    $("#btn-measure-clear").addEventListener("click", clearMeasure);

    $("#btn-layers").addEventListener("click", function () {
      $("#layer-popover").classList.toggle("open");
      this.classList.toggle("active");
    });

    $("#chk-parcel").addEventListener("change", function () {
      parcelLayer.setVisible(this.checked);
    });
    $("#opacity-parcel").addEventListener("input", function () {
      parcelLayer.setOpacity(this.value / 100);
    });

    $$(".basemap-row button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.base;
        Object.keys(baseLayers).forEach(function (k) {
          baseLayers[k].setVisible(k === key);
        });
        $$(".basemap-row button").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
      });
    });

    $("#btn-copy").addEventListener("click", function () {
      if (!lastInfoText) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lastInfoText).then(
          function () {
            showToast("Đã sao chép thông tin");
          },
          function () {
            showToast("Không sao chép được");
          }
        );
      } else {
        showToast("Trình duyệt không hỗ trợ sao chép");
      }
    });

    $("#btn-direction").addEventListener("click", function () {
      if (!lastCenterLonLat) return;
      var url =
        "https://www.google.com/maps/dir/?api=1&destination=" +
        lastCenterLonLat[1] +
        "," +
        lastCenterLonLat[0];
      window.open(url, "_blank", "noopener,noreferrer");
    });

    setTab("tothua");
  }

  function boot() {
    if (typeof ol === "undefined") {
      alert("Không tải được OpenLayers");
      return;
    }
    if (typeof json_Aggregated_1 === "undefined") {
      alert("Không tải được dữ liệu thửa đất");
      return;
    }
    if (typeof styleAggregated === "undefined") {
      alert("Không tải được style");
      return;
    }
    bindUI();
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
