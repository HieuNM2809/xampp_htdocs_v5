# 🗺️ Leaflet.js — Thư Viện Bản Đồ Tương Tác

> **Leaflet.js** là thư viện JavaScript mã nguồn mở, nhẹ và mạnh mẽ nhất để xây dựng bản đồ tương tác trên web.  
> Website chính thức: [https://leafletjs.com](https://leafletjs.com) | Phiên bản mới nhất: **1.9.4**

---

## 📌 Leaflet.js Là Gì?

**Leaflet** là một thư viện JavaScript **miễn phí**, được phát hành năm 2011 bởi **Vladimir Agafonkin**.  
Nó cho phép nhúng bản đồ địa lý tương tác vào trang web chỉ với vài dòng code, không cần backend phức tạp.

### Đặc điểm nổi bật

| Tiêu chí | Thông tin |
|---|---|
| 📦 Kích thước | ~42KB (gzip) — cực kỳ nhẹ |
| 📜 Giấy phép | BSD 2-Clause (miễn phí hoàn toàn) |
| 🌐 Tương thích | Mọi trình duyệt hiện đại + mobile |
| ⚡ Hiệu năng | Tối ưu cho cả desktop và thiết bị di động |
| 🔌 Plugin | Hơn **400+ plugin** từ cộng đồng |

---

## 🎯 Leaflet Dùng Để Làm Gì?

### 1. 🗺️ Hiển Thị Bản Đồ Tile
Tải và hiển thị các lớp bản đồ từ nhiều nguồn tile khác nhau:
- **OpenStreetMap** (miễn phí)
- **Google Maps**, **Bing Maps**
- **Mapbox**, **CartoDB** (có API key)
- **Esri Satellite** (ảnh vệ tinh)

```js
const map = L.map('map').setView([21.028, 105.854], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
```

---

### 2. 📍 Đặt Markers (Điểm Đánh Dấu)
Thêm điểm đánh dấu tại tọa độ bất kỳ trên bản đồ:

```js
// Marker mặc định
L.marker([21.028, 105.854]).addTo(map);

// Marker tùy chỉnh icon
const icon = L.divIcon({ html: '📍', iconSize: [30, 30] });
L.marker([21.028, 105.854], { icon }).addTo(map);
```

---

### 3. 💬 Popup & Tooltip Thông Tin
Hiển thị thông tin khi click hoặc hover vào điểm trên bản đồ:

```js
L.marker([21.028, 105.854])
  .addTo(map)
  .bindPopup('<b>Hà Nội</b><br>Thủ đô Việt Nam')
  .openPopup();

// Tooltip (hiện khi hover)
L.marker([10.823, 106.629])
  .addTo(map)
  .bindTooltip('TP. Hồ Chí Minh');
```

---

### 4. 🔷 Vẽ Hình Học (Geometry)
Vẽ các hình dạng địa lý như đường, vùng, hình tròn:

```js
// Đường thẳng (Polyline)
L.polyline([[21.0, 105.8], [16.0, 108.2], [10.8, 106.6]], {
  color: '#3b82f6', weight: 3
}).addTo(map);

// Hình chữ nhật (Rectangle)
L.rectangle([[20.0, 104.0], [22.0, 107.0]], {
  color: '#ef4444', fillOpacity: 0.2
}).addTo(map);

// Hình tròn (Circle) — bán kính tính bằng mét
L.circle([21.028, 105.854], {
  radius: 5000, color: '#10b981'
}).addTo(map);

// Đa giác (Polygon)
L.polygon([[21.0, 105.8], [21.5, 106.0], [20.8, 106.2]]).addTo(map);
```

---

### 5. 🗂️ Layer Groups & Control
Nhóm các đối tượng và tạo bộ điều khiển chuyển đổi lớp:

```js
const baseMaps = {
  "Street": L.tileLayer('...openstreetmap...'),
  "Satellite": L.tileLayer('...esri...'),
};

const overlays = {
  "Markers": markerGroup,
  "Khu vực": polygonGroup,
};

L.control.layers(baseMaps, overlays).addTo(map);
```

---

### 6. 📡 GeoJSON — Dữ Liệu Địa Lý Chuẩn
Đọc và hiển thị dữ liệu địa lý theo định dạng GeoJSON tiêu chuẩn:

```js
const geojsonData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [105.854, 21.028] },
      properties: { name: "Hà Nội", pop: 8000000 }
    }
  ]
};

L.geoJSON(geojsonData, {
  onEachFeature: (feature, layer) => {
    layer.bindPopup(feature.properties.name);
  }
}).addTo(map);
```

---

### 7. 📅 Xử Lý Sự Kiện Bản Đồ
Lắng nghe các sự kiện người dùng như click, zoom, di chuyển:

```js
// Click để lấy tọa độ
map.on('click', (e) => {
  console.log(`Lat: ${e.latlng.lat}, Lng: ${e.latlng.lng}`);
  L.popup().setLatLng(e.latlng).setContent('Bạn đã click đây!').openOn(map);
});

// Sự kiện zoom
map.on('zoomend', () => {
  console.log('Zoom level:', map.getZoom());
});

// Di chuyển bản đồ
map.on('moveend', () => {
  console.log('Center:', map.getCenter());
});
```

---

### 8. ✈️ Điều Khiển Bản Đồ Bằng Code
Bay đến vị trí, zoom, fit bounds:

```js
// Bay mượt đến tọa độ
map.flyTo([16.047, 108.206], 12, { duration: 2 });

// Zoom đến vùng cụ thể
map.fitBounds([[8.5, 102.1], [23.4, 109.5]]);

// Đặt view ngay lập tức
map.setView([21.028, 105.854], 15);
```

---

## 🏗️ Các Trường Hợp Sử Dụng Thực Tế

| Lĩnh vực | Ứng dụng cụ thể |
|---|---|
| 🛒 **Thương mại điện tử** | Theo dõi đơn hàng, hiển thị cửa hàng gần nhất |
| 🚗 **Vận tải / Giao thông** | Bản đồ tuyến đường, vị trí xe thời gian thực |
| 🏥 **Y tế** | Bản đồ cơ sở y tế, phân bố dịch bệnh |
| 🏙️ **Bất động sản** | Hiển thị vị trí nhà, khu vực xung quanh |
| 📊 **Phân tích dữ liệu** | Choropleth map, heatmap dân số |
| 🌿 **Môi trường** | Theo dõi ô nhiễm, cảnh báo thiên tai |
| 🧭 **Du lịch** | Bản đồ địa điểm tham quan, lộ trình |
| 📰 **Báo chí** | Infographic bản đồ tương tác |

---

## 📦 Plugin Phổ Biến

| Plugin | Chức năng |
|---|---|
| `Leaflet.markercluster` | Gom nhóm markers khi zoom out |
| `Leaflet.heat` | Heatmap (bản đồ nhiệt) |
| `Leaflet.draw` | Vẽ hình học trực tiếp trên bản đồ |
| `Leaflet-routing-machine` | Tìm đường đi |
| `Leaflet.fullscreen` | Chế độ toàn màn hình |
| `Leaflet.awesome-markers` | Icons tùy chỉnh phong phú |
| `Leaflet.Search` | Tìm kiếm địa điểm |

---

## ⚖️ So Sánh Leaflet vs Các Thư Viện Khác

| Tiêu chí | **Leaflet** | Google Maps JS | OpenLayers | Mapbox GL JS |
|---|---|---|---|---|
| 💰 Chi phí | **Miễn phí** | Có phí (sau ngưỡng) | Miễn phí | Có phí (sau ngưỡng) |
| 📦 Kích thước | **~42KB** | ~300KB | ~500KB | ~250KB |
| 🎓 Độ khó | **Dễ** | Trung bình | Khó | Trung bình |
| 🔌 Plugin | **400+** | Hạn chế | Nhiều | Nhiều |
| 📱 Mobile | ✅ Tốt | ✅ Tốt | ⚠️ Trung bình | ✅ Tốt |
| 3D / Vector | ❌ Cần plugin | ✅ Có | ✅ Có | ✅ Tốt nhất |

> **Kết luận:** Leaflet là lựa chọn tốt nhất cho dự án cần bản đồ **đơn giản → trung bình**, miễn phí, nhẹ và dễ tùy biến.

---

## 🚀 Bắt Đầu Nhanh (Quick Start)

### Cách 1: CDN (Không cần cài đặt)
```html
<!-- Trong <head> -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Trước </body> -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Cách 2: npm
```bash
npm install leaflet
```

```js
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

### HTML tối thiểu
```html
<div id="map" style="height: 400px;"></div>
<script>
  const map = L.map('map').setView([21.028, 105.854], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([21.028, 105.854]).addTo(map).bindPopup('Hà Nội 🇻🇳').openPopup();
</script>
```

---

## 📚 Tài Nguyên Học Tập

- 📖 [Tài liệu chính thức](https://leafletjs.com/reference.html)
- 🎮 [Tutorials từ đầu](https://leafletjs.com/examples.html)
- 🔌 [Danh sách Plugin](https://leafletjs.com/plugins.html)
- 💻 [GitHub Repository](https://github.com/Leaflet/Leaflet)
- 🌍 [OpenStreetMap Tiles (miễn phí)](https://www.openstreetmap.org)

---

*Tài liệu này được tạo kèm theo project `130_leaflet_map` — Ví dụ bản đồ Việt Nam tương tác.*
