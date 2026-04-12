# Report: UI Foundation And Metadata

## Phần đã hoàn thành

- Dựng lớp nền mới cho phase 1 thay vì sửa chắp vá vào từng màn cũ.
- Chuẩn hoá metadata người tạo cho `Memory` và `DeepTalkQuestion` ở backend.
- Tạo các shared building blocks để những màn mới dùng cùng một logic hiển thị role.

## File chính đã làm

- `frontend/src/constants/appRoles.ts`
- `frontend/src/components/RolePill.tsx`
- `frontend/src/components/EmptyState.tsx`
- `frontend/src/components/SheetDialog.tsx`
- `backend/src/models/MemoryRecord.ts`
- `backend/src/models/DeepTalkQuestionRecord.ts`
- `backend/src/services/memoryService.ts`
- `backend/src/services/deepTalkService.ts`
- `backend/src/controllers/deepTalkController.ts`

## Chi tiết thay đổi

### 1. Shared identity system

- Tạo `appRoles.ts` để gom các định nghĩa dùng chung:
  - `AppRole`
  - `ROLE_NAME`
  - `ROLE_FULLNAME`
  - `ROLE_CORNER_LABEL`
  - `ROLE_TONE`
  - `getOtherRole()`
- Tạo `RolePill` để mọi màn mới hiển thị `Ni` và `Được` theo cùng một style.
- Tạo `EmptyState` để các zero-state mới không còn kiểu fallback kỹ thuật cũ.
- Tạo `SheetDialog` để các flow thêm/sửa/chi tiết của màn mới dùng cùng một pattern bottom sheet / modal.

### 2. Metadata backend cho phase 1

- Tạo `MemoryRecord` model mới với field `createdBy`.
- Tạo `DeepTalkQuestionRecord` model mới với field `createdBy`.
- Chuyển `memoryService` sang model mới để khi frontend gửi `createdBy`, bản ghi sẽ giữ đúng người tạo.
- Chuyển `deepTalkService` và `deepTalkController` sang model mới để câu hỏi Deep Talk có thể hiển thị rõ ai là người mang câu hỏi vào app.

### 3. Lý do chọn model mới thay vì vá model cũ

- Một số file cũ có lỗi encoding, patch trực tiếp rất dễ sai context.
- Tách model mới giúp:
  - giữ được schema sạch cho phase 1
  - tránh phá các file cũ quá sâu
  - vẫn build được backend ngay trong đợt này

## Kết quả đạt được

- Màn mới có thể hiển thị role thống nhất.
- `Home`, `DeepTalk`, `Timeline` bản mới đã có dữ liệu `createdBy` để phân biệt ai ghi/ai khởi tạo.
- Backend build pass sau khi chuyển import sang model mới.

## Phần chưa làm ở cụm này

- `Wishlist`, `Events`, `Places`, `Coupons` chưa được nâng schema/flow owner metadata trong đợt này.
- `UIContext` cũ vẫn tồn tại, chưa được thay toàn bộ bằng `SheetDialog` vì mục tiêu chính của đợt này là đưa phase 1 core screens lên trước.
