# Report: Coupons V2 And Map Privacy

## Phần đã hoàn thành

- Thay `Coupons` cũ bằng `CouponsV2` theo đúng wireflow trong roadmap phase 2.
- Sửa `LoveMap` để tracking không lộ công khai khi Ni cầm máy.

## File chính đã làm

- `frontend/src/pages/CouponsV2.tsx`
- `frontend/src/pages/LoveMap.tsx` (edit)
- `frontend/src/App.tsx` (update import)
- `backend/src/models/CouponRecord.ts`
- `backend/src/services/couponRecordService.ts`
- `backend/src/controllers/couponRecordController.ts`
- `backend/src/routes/couponRecordRoutes.ts`
- `backend/src/server.ts` (thêm route `/api/coupons-v2`)

---

## Chi tiết thay đổi

### 1. Voucher system redesign (CouponsV2)

#### Backend mới (`/api/coupons-v2`)

- Tạo model `CouponRecord` với các field mới:
  - `voucherType: 'personal' | 'grab' | 'shared'`
  - `createdBy: AppRole`
  - `recipientRole?: AppRole` — chỉ dùng cho `personal`
  - `ownedBy?: AppRole` — ai đang giữ sau khi claim hoặc nhận đích danh
  - `isUsed: boolean`
  - `expiresAt?: Date`
- Endpoint mới:
  - `POST /api/coupons-v2/:id/claim` — nhận voucher nhanh tay (grab)
  - `POST /api/coupons-v2/:id/use` — sử dụng voucher
- Backend cũ (`/api/coupons`) giữ nguyên để tương thích.

#### Frontend (CouponsV2.tsx)

- 3 loại voucher:
  - **Đích danh**: tặng riêng cho Ni hoặc Được, người nhận được chọn khi tạo.
  - **Nhanh tay**: ai vào trước nhận trước, sau đó mới là của họ.
  - **Dùng chung**: không thuộc riêng ai, cả hai cùng hưởng.
- 4 tab:
  - **Chờ nhận**: voucher `grab` chưa có chủ.
  - **Đã có**: voucher đang thuộc về người dùng hiện tại, hoặc voucher chung chưa dùng.
  - **Đã tặng**: voucher `personal` mình tạo, chưa dùng.
  - **Đã dùng**: tất cả voucher đã dùng.
- Form tạo voucher:
  - Chọn loại trước, nhập tên + mô tả.
  - Nếu loại `personal` thì chọn rõ tặng ai (Ni / Được).
- Badge count trên tab `Chờ nhận` và `Đã có`.
- Dùng `SheetDialog` cho cả detail và create flow.
- Dùng `RolePill` để hiển thị ai tạo / ai nhận.
- Dùng `EmptyState` theo từng tab với hướng dẫn phù hợp.

#### AI generate

- Khi nhấn `AI sinh`, voucher được tạo theo loại `grab` — không tự mặc định là của ai.

---

### 2. LoveMap privacy fix

#### Vấn đề cũ

- Subtitle lộ thông tin "chế độ BF xem vị trí Ni".
- Badge "Đang theo dõi vị trí của Ni" hiển thị ngay khi role là boyfriend.
- Nếu Ni cầm máy, dễ gây phản cảm.

#### Cách xử lý (Option A+B theo roadmap)

- Xóa subtitle đề cập tracking.
- Thêm state `trackingEnabled = false` (mặc định tắt).
- Polling và tracking UI chỉ bật khi BF chủ động toggle nút Navigation.
- Tên nút và trạng thái không lộ "tracking Ni" — chỉ là icon Navigation.
- Map bình thường chỉ thấy các địa điểm, không có dấu hiệu tracking.
- Bảng popup của place đã sửa copy từ `Da di` / `Muon di` sang `Đã đi` / `Muốn đi`.

---

## Kết quả đạt được

- Voucher system không còn cảm giác "mặc định là của tôi dành cho Ni".
- Có đủ 3 loại voucher theo đúng UX plan.
- Flow claim grab voucher hoạt động.
- Map không còn lộ tracking UI khi mở bình thường.

## Phần chưa làm ở cụm này

- Weekly/monthly auto-gen voucher chưa có scheduler.
- `expiresAt` chưa có UI set khi tạo (chỉ lưu khi backend tự gen).
- Global filter theo người (`Tất cả / Ni / Được`) cho voucher list chưa làm.
- LoveMap Option C (tách tracking thành layer riêng hoàn toàn) chưa làm — hiện đang dừng ở A+B.
