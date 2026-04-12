# Report: Build And Validation

## Những gì đã kiểm tra

- Build frontend:
  - chạy `npm run build` trong `frontend`
- Build backend:
  - chạy `npm run build` trong `backend`

## Kết quả

- Frontend build pass (sau cả đợt CouponsV2 + LoveMap fix).
- Backend build pass (sau khi sửa lỗi TS `string | string[]` trong couponRecordController).

## Ghi nhận thêm từ build frontend

- Vite cảnh báo bundle JS chính đang lớn hơn ngưỡng 500 kB sau minify (699 kB).
- Cảnh báo này chưa chặn build, nhưng nên xử lý ở đợt sau bằng:
  - code splitting cho các màn nặng
  - tách lazy routes cho map / places / pages cũ
  - cân nhắc manual chunks

## Tác động thực tế

- Phase 1 core screens vẫn build ổn định.
- Phase 2 screens (CouponsV2, LoveMap fix) build pass.
- Backend route `/api/coupons-v2` đã được đăng ký, model `CouponRecord` compile sạch.

## Ghi chú còn mở

- `Challenges` chưa được nâng lên V2.
- LoveMap vẫn dùng `/api/places` cũ (chưa có `addedBy`).
- Roadmap phase 2 còn lại:
  - Cross-link giữa các màn (Wishlist ↔ Places / Events ↔ Coupon)
  - Weekly/monthly voucher scheduler
  - Challenges V2

## Tổng kết P2 đã hoàn thành

| Màn | Tình trạng |
|-----|------------|
| CouponsV2 | ✅ 3 loại + 4 tab + claim flow |
| LoveMap privacy | ✅ tracking ẩn sau toggle |
| WishlistV2 | ✅ owner + category + filter người |
| EventsV2 | ✅ eventType + countdown + isRecurring |
| PlacesV2 | ✅ addedBy + filter người + giữ GPS/geocoding |
