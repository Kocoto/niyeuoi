# Report: Wishlist V2 And Events V2

## Phần đã hoàn thành

- Thay `Wishlist` cũ bằng `WishlistV2`.
- Thay `Events` cũ bằng `EventsV2`.
- Cả hai màn nay đã theo đúng hướng phase 2: rõ ai tạo, rõ ý nghĩa, dùng shared system.

## File chính đã làm

- `frontend/src/pages/WishlistV2.tsx`
- `frontend/src/pages/EventsV2.tsx`
- `frontend/src/App.tsx` (cập nhật import)
- `backend/src/models/WishlistRecord.ts`
- `backend/src/models/EventRecord.ts`
- `backend/src/services/wishlistRecordService.ts`
- `backend/src/services/eventRecordService.ts`
- `backend/src/controllers/wishlistRecordController.ts`
- `backend/src/controllers/eventRecordController.ts`
- `backend/src/routes/wishlistRecordRoutes.ts`
- `backend/src/routes/eventRecordRoutes.ts`
- `backend/src/server.ts` (đăng ký `/api/wishlist-v2` và `/api/events-v2`)

---

## Chi tiết thay đổi

### 1. Wishlist V2

#### Backend (`/api/wishlist-v2`)

- Model `WishlistRecord` với field mới:
  - `owner: AppRole` — mong muốn này của Ni hay Được
  - `category: 'item' | 'place' | 'food' | 'experience'`
  - `status: 'waiting' | 'done'` (thay chuỗi tiếng Việt dễ typo)
- Giữ `isSecretlyPrepared` cho boyfriend.

#### Frontend (WishlistV2.tsx)

- Filter theo người: `Tất cả / Ni / Được`.
- Toggle xem đã xong.
- Mỗi card hiện `RolePill` của chủ sở hữu, loại, giá, trạng thái.
- Form tạo:
  - Chọn owner (Ni / Được).
  - Chọn category với emoji.
  - Link, giá, ghi chú.
  - Checkbox "lén chuẩn bị" chỉ hiện với boyfriend.
- Dùng `SheetDialog` cho detail + create/edit.
- Dùng `EmptyState` theo filter.

---

### 2. Events V2

#### Backend (`/api/events-v2`)

- Model `EventRecord` với field mới:
  - `createdBy: AppRole` — ai lên lịch sự kiện này
  - `eventType: 'anniversary' | 'birthday' | 'date' | 'special'`
  - `isRecurring: boolean` — nhắc lại mỗi năm (sinh nhật, kỷ niệm)

#### Frontend (EventsV2.tsx)

- Sự kiện chia hai nhóm: `Sắp tới` và `Đã qua` (mặc định ẩn đã qua).
- Countdown có ngữ nghĩa:
  - `Hôm nay là [sự kiện]`
  - `Ngày mai là [loại]`
  - `Còn X ngày`
  - `Đã qua X ngày`
- Màu sắc badge countdown theo độ gần:
  - Hôm nay: primary đỏ, nổi bật
  - Còn ≤7 ngày: vàng amber, cảnh báo nhẹ
  - Xa hơn: hồng nhạt
  - Đã qua: xám
- `isRecurring = true`: tự tính ngày gần nhất trong năm (không hiển thị là "đã qua").
- Dùng `RolePill` để hiển thị ai tạo sự kiện.
- Dùng `SheetDialog` cho detail + create/edit.
- 4 loại với emoji và gợi ý mô tả khi chọn.

---

## Kết quả đạt được

- Wishlist không còn chung chung; mỗi mong muốn gắn rõ với Ni hoặc Được.
- Filter theo người giúp xem nhanh "Ni muốn gì", "Được muốn gì".
- Events có countdown có nghĩa thay vì chỉ đếm số ngày trung tính.
- Recurring events tự tính lại mỗi năm.

## Phần chưa làm ở cụm này

- Wishlist chưa có gợi ý cross-link sang Places hoặc Events (theo plan 8.3).
- Events chưa có cross-link sang Wishlist hoặc Coupon (theo plan 9.1).
- Challenges (`/challenges`) vẫn dùng màn cũ, chưa nâng lên V2.
- Global filter theo người cho các màn cũ (Places) chưa làm.
