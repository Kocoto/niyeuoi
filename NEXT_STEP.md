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

- Đang ở: `Đợt B - nhịp sử dụng hằng ngày và kết nối các màn`
- Mục tiêu của đợt này:
  - khiến app có lý do quay lại thường xuyên hơn
  - làm các màn bắt đầu liên kết với nhau thay vì đứng riêng lẻ
  - chuyển từ cảm giác “nhiều tính năng” sang một trải nghiệm có nhịp dùng hàng ngày

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

- Status: `done`
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

### B1 - Places redesign

- Status: `done`
- Mục tiêu:
  - tách rõ `Muốn đi`, `Đã đi`, `Lần tới nên thử`
  - làm Places bớt cảm giác một list phẳng, tăng ngữ cảnh vì sao địa điểm này đáng quay lại
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `6. Places / Địa điểm`
    - `27. Wireflow Places`
    - `36. Wireflow empty states / zero states`
- In scope:
  - sắp lại IA và grouping chính của màn Places
  - gắn rõ note / reason / trạng thái cho từng địa điểm nếu dữ liệu hiện có cho phép
  - giữ tinh thần mobile-first và rõ `Ni` / `Được` từ Phase A
- Out of scope:
  - map privacy redesign
  - global filter theo người
  - wishlist / events / challenges / activity feed
  - thay đổi semantics `owner` ngoài những gì đã chốt ở Phase A
- Likely files:
  - `frontend/src/pages/Places.tsx`
  - `backend/src/models/Place.ts`
  - `backend/src/services/placeService.ts`
- Done when:
  - người dùng nhìn vào là phân biệt được `Muốn đi`, `Đã đi`, `Lần tới nên thử`
  - dữ liệu cũ vẫn render an toàn
  - empty state và copy không còn generic như một list CRUD

### B2 - Wishlist redesign

- Status: `done`
- Mục tiêu:
  - tách rõ `Ni muốn`, `Được muốn`, `Đang chuẩn bị`
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `8. Wishlist`
    - `28. Wireflow Wishlist`
    - `36. Wireflow empty states / zero states`
- In scope:
  - tách wishlist theo người và trạng thái chuẩn bị
  - làm rõ ai muốn gì, ai đang chuẩn bị điều gì
  - giữ ngôn ngữ riêng tư, mobile-first, không làm wishlist thành list mua sắm chung mơ hồ

### B3 - Events redesign

- Status: `done`
- Mục tiêu:
  - làm rõ ai tạo, ngày đó dành cho ai, và ý nghĩa của ngày
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `9. Events`
    - `29. Wireflow Events`
    - `36. Wireflow empty states / zero states`
- In scope:
  - tách event theo ngữ nghĩa rõ hơn thay vì list ngày tháng phẳng
  - làm rõ ai tạo và ngày đó dành cho ai
  - giữ đúng tinh thần riêng tư, mobile-first, không lẫn sang activity feed

### B4 - Challenges redesign

- Status: `done`
- Mục tiêu:
  - bớt cảm giác game nhiệm vụ, tăng nghĩa “cùng nhau” hoặc “dành cho nhau”
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `10. Challenges`
    - `30. Wireflow Challenges`
    - `36. Wireflow empty states / zero states`
- In scope:
  - tách challenge theo ngữ nghĩa `cùng nhau`, `Ni dành cho Được`, `Được dành cho Ni`
  - giảm cảm giác task list / gamification chung chung
  - giữ đúng tinh thần riêng tư, mobile-first, không lẫn sang activity feed hay reward

### B5 - Activity feed

- Status: `done`
- Mục tiêu:
  - tạo luồng `vừa rồi` để Home có nhịp sống hàng ngày rõ hơn
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.3 Activity feed của cặp đôi`
    - `2. Home / Dashboard`
    - `33. Wireflow activity feed`
    - `34. Wireflow notification / reminder UX`
    - `36. Wireflow empty states / zero states`
- In scope:
  - tạo luồng `vừa rồi` rõ ai vừa ghi gì, ai vừa làm gì, điều gì đang chờ
  - làm Home có nhịp quay lại hằng ngày rõ hơn mà không biến thành dashboard KPI
  - giữ đúng tinh thần riêng tư, mobile-first, không lẫn sang global filter hay navigation refinement

### B6 - Global filter theo người

- Status: `active`
- Mục tiêu:
  - hỗ trợ `Tất cả` / `Ni` / `Được` ở các màn có nhiều nội dung cá nhân
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `1.1 Identity system cho Ni và Được`
    - `6. Places / Địa điểm`
    - `8. Wishlist`
    - `9. Events`
    - `10. Challenges`
    - `13. Shared UI System`
    - `31. Wireflow shared identity system`
- In scope:
  - xác định nơi thật sự cần `Tất cả` / `Ni` / `Được` thay vì thêm filter đại trà
  - dùng chung ngôn ngữ và badge từ Phase A để filter không làm mờ vai trò
  - giữ backward-compatible và không phá các grouping vừa hoàn tất ở Places / Wishlist / Events / Challenges

### B7 - Navigation / app shell refinement

- Status: `pending`
- Mục tiêu:
  - tối ưu `Thêm`, recently used destinations, và cross-links giữa các màn

### B8 - Empty states / reminder UX

- Status: `pending`
- Mục tiêu:
  - biến empty state thành lời mời bắt đầu đúng ngữ cảnh, reminder nhẹ và có giá trị

## Current Active Slice

- ID: `B6`
- Status: `active`
- Tên: `Global filter theo người`
- Việc phải làm ngay:
  1. Đọc đúng `1.1`, `6`, `8`, `9`, `10`, `13`, và `31` trong `UI_UX_IDEAS.md`.
  2. Xác định màn nào thật sự cần `Tất cả` / `Ni` / `Được`, và màn nào nên giữ grouping hiện có.
  3. Thiết kế filter sao cho vẫn rõ `Ni` và `Được`, không kéo UI về một luồng chung mơ hồ.
  4. Không mở rộng sang `B7+`, không đụng app shell refinement hay empty-state overhaul trong lượt này.
- Không được làm trong slice này:
  - map privacy redesign
  - navigation / app shell refinement
  - empty state overhaul diện rộng
  - reward / trigger / voucher / smart suggestions
- Done checklist:
  - filter hỗ trợ xem theo `Tất cả` / `Ni` / `Được` ở đúng màn cần thiết
  - filter không phá grouping và copy hiện có của từng màn
  - dữ liệu cũ không bị phá và không làm màn lỗi
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

- `B5 - Activity feed`

### Current status

- `B5` đã hoàn tất và `B6 - Global filter theo người` đã được chuyển sang active.
- Kết quả chốt cho `B5`:
  - `frontend/src/pages/Home.tsx` giờ lấy thêm `events`, `challenges`, và `coupons` cùng với `moods`, `deeptalk`, `memories` để Home có một luồng `Vừa rồi` sống hơn nhưng vẫn ngắn gọn
  - feed `Vừa rồi` đã nói rõ ai vừa làm gì, deep-link đúng màn, và có fallback trung tính cho record cũ thiếu metadata thay vì làm vỡ Home
  - `Điều đang chờ giữa hai người` được thêm reminder dịu cho ngày sắp tới và voucher đang chờ, nhưng vẫn ưu tiên mood/deep talk và không biến Home thành dashboard KPI
  - `Một bước tiếp theo` giờ có thể dẫn sang voucher hoặc event khi phù hợp, sau khi đã ưu tiên các việc có tính nhịp hàng ngày như mood và Deep Talk
  - empty state của feed đã đổi sang ngôn ngữ giải thích khu vực này dùng để làm gì và người dùng nên bắt đầu từ đâu
- Chưa chạy browser/manual smoke cho `B5`; xác nhận hiện có đang ở mức build + eslint file vừa sửa

### Files touched in latest session

- `frontend/src/pages/Home.tsx`
- `NEXT_STEP.md`

### Tests run in latest session

- Đã chạy `npm run build` trong `frontend`.
- Kết quả: pass.
- Đã chạy `npx eslint src/pages/Home.tsx` trong `frontend`.
- Kết quả: pass.
- Ghi chú:
  - frontend build vẫn có cảnh báo chunk size của Vite, nhưng không fail build
  - chưa có browser smoke riêng cho `B5`

### Known blockers

- Không có blocker mở cho `B5`.
- Lượt tiếp theo vẫn cần giữ guardrail:
  - không kéo `B6` sang navigation/app shell refinement hoặc empty-state overhaul diện rộng
  - không thêm filter ở mọi màn nếu grouping hiện có đã đủ rõ
  - không phá dữ liệu cũ hay làm mờ ranh giới `Ni` / `Được` chỉ để có filter thống nhất

### Next concrete step

- Bắt đầu `B6 - Global filter theo người`.
- Đọc đúng các section:
  - `1.1 Identity system cho Ni và Được`
  - `6. Places / Địa điểm`
  - `8. Wishlist`
  - `9. Events`
  - `10. Challenges`
  - `13. Shared UI System`
  - `31. Wireflow shared identity system`
- Ưu tiên đọc trước:
  - `frontend/src/pages/Places.tsx`
  - `frontend/src/pages/Wishlist.tsx`
  - `frontend/src/pages/Events.tsx`
  - `frontend/src/pages/Challenges.tsx`
