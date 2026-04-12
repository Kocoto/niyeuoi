# Report: Places V2

## Phần đã hoàn thành

- Thay `Places` cũ bằng `PlacesV2` dùng endpoint `/api/places-v2` mới.
- Thêm `addedBy` metadata cho mọi địa điểm.
- Thêm filter theo người (Tất cả / Ni / Được).
- Giữ toàn bộ tính năng phức tạp của màn cũ: GPS, Nominatim, Plus Code, ảnh upload, random, rating.

## File chính đã làm

- `frontend/src/pages/PlacesV2.tsx`
- `frontend/src/App.tsx` (update import)
- `backend/src/models/PlaceRecord.ts`
- `backend/src/services/placeRecordService.ts`
- `backend/src/controllers/placeRecordController.ts`
- `backend/src/routes/placeRecordRoutes.ts`
- `backend/src/server.ts` (đăng ký `/api/places-v2`)

---

## Chi tiết thay đổi

### Backend (`/api/places-v2`)

- Model `PlaceRecord` với field mới `addedBy: AppRole`.
- Giữ toàn bộ các field cũ: name, address, image, rating, note, category, isVisited, location (GeoJSON Point).
- Endpoint `/random?isVisited=true|false` vẫn có.
- Backend cũ (`/api/places`) vẫn dùng được bởi LoveMap và HomeV2.

### Frontend (PlacesV2.tsx)

#### Thêm mới

- **Filter theo người**: 3 chip `Tất cả / Ni / Được` — lọc ngay trên tab đang xem.
- **`RolePill`** hiển thị ai thêm địa điểm trên mỗi card.
- **`EmptyState`** có ngữ cảnh theo tab và filter.
- **`SheetDialog`** cho cả detail, create, edit — không còn custom modal.
- Badge "Thêm bởi" trong detail sheet.

#### Giữ nguyên

- Tabs **Muốn đi / Đã đi**.
- GPS lấy vị trí hiện tại khi tạo địa điểm.
- Nominatim geocoding forward + reverse.
- Plus Code decoding với `open-location-code`.
- Cập nhật vị trí từ detail (GPS hoặc tìm thủ công).
- Upload ảnh qua `/api/upload`.
- Nút "May mắn" (random) theo tab đang xem.
- Rating modal khi đánh dấu Đã đi.
- Nút "Dẫn đường Google Maps" khi có tọa độ.

---

## Kết quả đạt được

- Mỗi địa điểm giờ biết rõ do Ni hay Được thêm vào.
- Filter theo người giúp xem "Ni muốn đi đâu", "Được đã đăng ký đâu" nhanh hơn.
- UI đồng bộ với shared system (SheetDialog, RolePill, EmptyState).

## Phần chưa làm ở cụm này

- Cross-link từ địa điểm sang memory (plan 6.3) chưa có.
- `Lần tới nên thử` và category ý nghĩa bổ sung (plan 6.2) chưa triển khai.
- Smart suggestion từ mood / event (plan 6.4) chưa làm.
- LoveMap vẫn đang dùng `/api/places` cũ (không có `addedBy`) — sẽ xem xét ở đợt sau.
