# NEXT STEP

## Cách dùng file này

- File này là nguồn sự thật cho **đợt đang làm dở**.
- Trước khi code, luôn đọc:
  - `IMPLEMENTATION_ROADMAP.md`
  - `NEXT_STEP.md`
- Không dùng riêng `IMPLEMENTATION_ROADMAP.md` để đi code.
- Vai trò của từng file:
  - `IMPLEMENTATION_ROADMAP.md`: thứ tự ưu tiên và logic chia đợt
  - `NEXT_STEP.md`: slice đang active, scope, handoff, file likely touched
  - `UI_UX_IDEAS.md`: ý đồ sản phẩm và chi tiết UX cho từng màn
- Chỉ làm đúng `Current Active Slice`.
- Không tự mở rộng scope sang slice khác nếu chưa cập nhật lại file này.
- Nếu slice đang active quá to, phải tách nhỏ thêm ngay trong file này rồi mới code.
- Khi chuyển sang phase mới:
  - cập nhật lại breakdown trong file này theo `Slice order khuyến nghị trong codebase` của `IMPLEMENTATION_ROADMAP.md`
  - thêm `Reference Sections` tương ứng cho slice mới
- Trước khi dừng phiên, bắt buộc cập nhật:
  - `Session Handoff`
  - trạng thái slice trong `Current Phase Breakdown`

## Prompt mở thread mới

```text
Đọc E:/niyeuoi/IMPLEMENTATION_ROADMAP.md và E:/niyeuoi/NEXT_STEP.md.
Chỉ làm đúng `Current Active Slice` trong NEXT_STEP.md.
Không mở rộng scope.
Đọc thêm đúng các section được liệt kê trong `Reference Sections` của slice đang active trong UI_UX_IDEAS.md.
Nếu dừng giữa chừng, phải cập nhật NEXT_STEP.md với:
- Status hiện tại
- Đã xong gì
- Còn dở gì
- File đã sửa
- Test đã chạy/chưa
- Blocker
```

## Snapshot repo hiện tại

- Backend đã có dấu vết theo người ở:
  - `Mood.createdBy`
  - `Coupon.createdBy`
  - `JournalEntry.createdBy`
  - `DeepTalkQuestion.answers.boyfriend/girlfriend`
- Backend **chưa** có field creator/owner rõ ràng ở:
  - `Memory`
  - `Place`
  - `Wishlist`
  - `Event`
- Frontend đã có role-aware một phần ở:
  - `AuthContext`
  - `Home`
  - `DeepTalk`
- Frontend vẫn còn trùng lặp role labels ở:
  - `frontend/src/constants/roles.ts`
  - `frontend/src/constants/roleLabels.ts`
- Rule migration đã được chốt ở:
  - `UI_UX_IDEAS.md`
  - `IMPLEMENTATION_ROADMAP.md`

## Current Phase

- Đang ở: `Đợt A - lớp nền bắt buộc`
- Mục tiêu của đợt này:
  - chốt contract dữ liệu theo người
  - giữ tương thích ngược cho dữ liệu cũ
  - chuẩn hóa shared identity để các màn sau dùng chung

## Current Phase Breakdown

### A0 - Repo handoff system

- Status: `done`
- Outcome:
  - roadmap đã có rule chia việc và migration
  - `NEXT_STEP.md` đã được chuyển sang dạng handoff vận hành

### A1 - Backend metadata contract an toàn cho dữ liệu cũ

- Status: `done`
- Mục tiêu:
  - bổ sung contract creator/owner cho dữ liệu còn thiếu
  - không ép dữ liệu cũ phải có field mới ngay
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.2 Creator / owner metadata cho mọi nội dung`
    - `17.5 Nguyên tắc migration khi thêm creator / owner`
    - `31. Wireflow shared identity system`
- In scope:
  - chốt tên field backend cho `Memory`, `Place`, `Wishlist`, `Event`
  - thêm field mới theo kiểu backward-compatible
  - nếu cần, tạo helper type dùng chung cho role/ownership
- Out of scope:
  - redesign UI
  - backfill dữ liệu thật
  - filter theo người trên frontend
- Likely files:
  - `backend/src/models/Memory.ts`
  - `backend/src/models/Place.ts`
  - `backend/src/models/Wishlist.ts`
  - `backend/src/models/Event.ts`
  - `backend/src/utils/authToken.ts`
  - hoặc một file type/helper mới ở backend nếu cần
- Done when:
  - record cũ vẫn đọc được
  - create/update không vỡ vì field mới
  - schema mới thể hiện rõ hướng đi cho creator/owner

### A2 - Backend write path và API surface

- Status: `done`
- Mục tiêu:
  - luồng tạo/sửa dữ liệu mới ghi được metadata theo người
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.2 Creator / owner metadata cho mọi nội dung`
    - `5.1 Hiển thị rõ ai ghi lại`
    - `8.1 Rõ ai muốn gì`
    - `9.1 Rõ ai tạo / ai cần nhớ`
    - `31. Wireflow shared identity system`
- In scope:
  - service/controller nhận và lưu field mới
  - ưu tiên lấy role từ session hiện tại nếu hợp lý
  - response trả field mới để frontend dùng được
- Likely files:
  - `backend/src/services/memoryService.ts`
  - `backend/src/services/placeService.ts`
  - `backend/src/services/wishlistService.ts`
  - `backend/src/services/eventService.ts`
  - controller tương ứng nếu cần
- Done when:
  - record mới có metadata nhất quán
  - record cũ vẫn không lỗi

### A3 - Frontend shared identity primitives

- Status: `done`
- Mục tiêu:
  - gom logic hiển thị `Ni` / `Được` về một chỗ
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.1 Identity system cho Ni và Được`
    - `13. Shared UI System`
    - `31. Wireflow shared identity system`
    - `37. Wireflow auth / role switching`
- In scope:
  - bỏ trùng lặp constants
  - tạo shared label/badge helper hoặc component
- Likely files:
  - `frontend/src/constants/roles.ts`
  - `frontend/src/constants/roleLabels.ts`
  - `frontend/src/components/`
  - `frontend/src/context/AuthContext.tsx`
- Done when:
  - chỉ còn một nguồn role labels chính
  - page khác có thể import dùng chung

### A4 - Áp shared identity vào Mood / Deep Talk / Timeline

- Status: `done`
- Mục tiêu:
  - 3 màn cốt lõi nhìn vào là biết dữ liệu của ai
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `3. Mood / Cảm xúc`
    - `4. Deep Talk`
    - `5. Timeline / Kỷ niệm`
    - `24. Wireflow Mood`
    - `25. Wireflow Deep Talk`
    - `26. Wireflow Timeline`
- In scope:
  - Timeline hiện rõ ai ghi lại
  - Deep Talk hiện rõ ai trả lời / ai đang chờ
  - Mood hiện rõ ai check-in
- Likely files:
  - `frontend/src/pages/Timeline.tsx`
  - `frontend/src/pages/DeepTalk.tsx`
  - `frontend/src/pages/MoodLofi.tsx`
- Done when:
  - cả record mới và record cũ đều render được
  - nếu thiếu metadata thì UI dùng wording trung tính

### A5 - Home dùng lớp dữ liệu mới

- Status: `done`
- Mục tiêu:
  - Home không còn dựa vào một khối cảm xúc mơ hồ
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.3 Activity feed của cặp đôi`
    - `1.5 Relationship state layer`
    - `2. Home / Dashboard`
    - `23. Wireflow Home`
- In scope:
  - hai nhịp theo người
  - next step rõ hơn
  - chỗ trống vẫn giữ cân bằng nếu chỉ một bên có dữ liệu
- Likely files:
  - `frontend/src/pages/Home.tsx`
- Done when:
  - Home nói rõ dữ liệu nào là của ai

### A6 - Legacy QA pass

- Status: `active`
- Mục tiêu:
  - chốt rằng dữ liệu cũ không bị phá sau Đợt A
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `17.5 Nguyên tắc migration khi thêm creator / owner`
  - `IMPLEMENTATION_ROADMAP.md`:
    - `Nguyên tắc giữ an toàn cho dữ liệu cũ`
- Test cases cần có:
  - record cũ không có metadata
  - record mới có metadata
  - đổi role đăng nhập
  - create/edit/delete vẫn hoạt động

## Current Active Slice

- ID: `A6`
- Status: `active`
- Tên: `Legacy QA pass`
- Việc phải làm ngay:
  1. Kiểm tra lại `Mood`, `Deep Talk`, `Timeline`, `Home` với record cũ thiếu metadata.
  2. Kiểm tra luồng đổi role đăng nhập và các create/edit/delete chính sau Đợt A.
  3. Ghi rõ case nào đã chạy thủ công, case nào mới chỉ qua build.
  4. Không mở rộng sang phase B hay thêm feature mới trong lượt QA này.
- Không được làm trong slice này:
  - redesign lại UI đã chốt ở A4/A5
  - thêm mới semantics `owner`
  - mở rộng sang Places / Wishlist / Events / Challenges
  - đổi backend schema/API nếu chưa có bug thật
- Done checklist:
  - có danh sách QA rõ cho record cũ và record mới
  - có kết luận phần nào đã an toàn, phần nào còn thiếu test tay
  - không có regression rõ ở Mood / Deep Talk / Timeline / Home
  - file này được cập nhật đúng trạng thái thật

## Quy tắc cập nhật trước khi dừng

- Nếu chưa xong slice:
  - giữ nguyên `Current Active Slice`
  - cập nhật `Session Handoff`
  - ghi rõ phần nào đã chạm dở
- Nếu đã xong slice:
  - đổi status slice hiện tại sang `done`
  - đổi slice kế tiếp sang `active`
  - cập nhật `Current Active Slice`
  - ghi test và rủi ro còn lại

## Session Handoff

### Last completed slice

- `A5 - Home dùng lớp dữ liệu mới`

### Current status

- `A5` đã xong:
  - `frontend/src/pages/Home.tsx` không còn dựa vào một khối dashboard KPI mơ hồ
  - Home đã tách thành `Hôm nay của Ni` và `Hôm nay của Được` bằng dữ liệu mood / deep talk / memory theo từng người
  - thêm khối `Điều đang chờ giữa hai người` và `Một bước tiếp theo` nhưng vẫn giữ tone ấm, riêng tư
  - thêm `Gần đây` dạng feed ngắn để Home có cảm giác đang sống mà chưa mở rộng sang activity feed phase B
  - luồng fetch của Home đã chuyển sang degrade gracefully với `Promise.allSettled`, tránh một endpoint lỗi làm sập toàn màn
- `A6` chưa bắt đầu QA.

### Files touched in latest session

- `frontend/src/pages/Home.tsx`
- `NEXT_STEP.md`

### Tests run in latest session

- Đã chạy `npm run build` trong `frontend`.
- Kết quả: pass.

### Known blockers

- Chưa có blocker kỹ thuật cho `A6`.
- `A6` cần dữ liệu legacy đủ đa dạng để xác nhận các fallback trung tính trên UI, nếu repo hiện tại chưa có sẵn thì phải note rõ phần nào mới chỉ được bảo chứng bằng build.
- Vẫn cần giữ semantics `owner` cho slice sau; `A6` chỉ kiểm tra `createdBy`/answer state đã có từ phase A.

### Next concrete step

- Bắt đầu `A6`.
- Đọc trước các file:
  - `frontend/src/pages/MoodLofi.tsx`
  - `frontend/src/pages/DeepTalk.tsx`
  - `frontend/src/pages/Timeline.tsx`
  - `frontend/src/pages/Home.tsx`
- Ưu tiên lập checklist QA cho record cũ thiếu metadata, đổi role, và các thao tác create/edit/delete chính sau Đợt A.
