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

- Status: `done`
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

- Status: `done`
- Mục tiêu:
  - tối ưu `Thêm`, recently used destinations, và cross-links giữa các màn
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `2. Home / Dashboard`
    - `12. Navigation / IA`
    - `13. Shared UI System`
    - `32. Wireflow navigation / app shell`
- In scope:
  - xác định lại vai trò của `Thêm` để đỡ cảm giác app bị dàn trải
  - cân nhắc recently used destinations và cross-links thật sự giúp flow đi tiếp
  - giữ đúng nhịp dùng hàng ngày, không mở rộng sang reward / smart suggestions

### B8 - Empty states / reminder UX

- Status: `done`
- Mục tiêu:
  - biến empty state thành lời mời bắt đầu đúng ngữ cảnh, reminder nhẹ và có giá trị
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `13. Shared UI System`
    - `34. Wireflow notification / reminder UX`
    - `36. Wireflow empty states / zero states`
- In scope:
  - xác định các empty state đang quá trống hoặc chưa giúp người dùng bắt đầu bước tiếp theo
  - tinh chỉnh reminder theo hướng nhẹ, hữu ích, không biến thành nhắc nhở gây áp lực
  - giữ scope trong UX copy + CTA + trạng thái chờ, không kéo sang redesign navigation hay reward logic

### C1 - Map privacy

- Status: `done`
- Mục tiêu:
  - tách rõ map chung và private tracking mode, với guardrail riêng tư rõ ràng
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `7. Map / Bản đồ`
    - `17. Data / Personalization`
    - `22. Wireflow map privacy`
    - `37. Wireflow auth / role switching`
- In scope:
  - xác định lại đâu là bản đồ chung, đâu là private tracking chỉ mở khi đúng điều kiện
  - thiết kế gating cho BF private mode, timeout tự tắt, và wording không làm tính năng này trở thành mặc định
  - giữ dữ liệu chia sẻ vị trí hiện có an toàn, không kéo sang voucher / reward / smart suggestions

### C2a - Voucher type foundation

- Status: `active`
- Mục tiêu:
  - tách rõ 3 loại voucher trong model và IA trước khi đụng sâu vào create/redeem flow
- Reference Sections:
  - `UI_UX_IDEAS.md`:
    - `11. Coupons / Voucher`
    - `17. Data / Personalization`
    - `21. Wireflow voucher`
- In scope:
  - xác định semantics cho voucher đích danh / nhanh tay / dùng chung
  - chuẩn hóa field và cách hiển thị để biết ai tặng, ai nhận, ai đang giữ, và loại voucher là gì
  - giữ backward-compatible cho voucher cũ, chưa mở rộng sang reward / trigger hoặc orchestration liên màn

### C2b - Voucher create / redeem flow refinement

- Status: `pending`
- Mục tiêu:
  - làm composer, detail, và redeem flow khớp với 3 loại voucher mới mà không thiên vị `Ni` hay `Được`

## Current Active Slice

- ID: `C2a`
- Status: `active`
- Tên: `Voucher type foundation`
- Việc phải làm ngay:
  1. Đọc đúng `11`, `17`, và `21` trong `UI_UX_IDEAS.md`.
  2. Xác định dữ liệu voucher hiện tại đang thiếu nghĩa ở đâu: loại, người nhận, người giữ, tính surprise, và khả năng dùng chung.
  3. Chốt lớp nền model + serialization + list IA trước, để lượt sau mới đi vào create/redeem flow mà không phải đập lại semantics.
  4. Không mở rộng sang `C2b+`, không kéo reward / trigger / smart suggestion vào lượt này.
- Không được làm trong slice này:
  - reward / trigger orchestration
  - memory resurfacing hoặc smart suggestions
  - rewrite toàn bộ UI voucher detail/composer nếu lớp semantics bên dưới chưa chốt xong
- Done checklist:
  - 3 loại voucher có semantics rõ và không mâu thuẫn nhau
  - dữ liệu cũ vẫn đọc được an toàn và có fallback hợp lý
  - list/card/badge chính đã đủ để người dùng hiểu loại voucher mà không cần đoán
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

- `C1 - Map privacy`

### Current status

- `C1` đã hoàn tất. Vì `C2 - voucher system redesign` nguyên bản quá rộng cho một lượt, nó đã được tách thành `C2a - Voucher type foundation` và `C2b - Voucher create / redeem flow refinement`, trong đó `C2a` được chuyển sang active.
- Kết quả chốt cho `C1`:
  - `frontend/src/pages/LoveMap.tsx` giờ tách rõ map chung và private mode: map mặc định chỉ hiển thị địa điểm chung, không còn marker vị trí thật, nút `Tìm Ni`, hay wording lộ tracking trên giao diện chung
  - BF chỉ có thể mở private mode qua một entry trung tính, sau đó phải nhập lại PIN BF; private mode có indicator riêng, countdown tự tắt, và khi đóng sẽ quay về map chung sạch dấu vết
  - `backend/src/routes/locationRoutes.ts` giờ chặn ghi vị trí cho đúng vai `Ni`, chặn đọc vị trí cho đúng vai `Được`, và buộc phải có private access token sống ngắn mới lấy được vị trí hiện tại
  - thêm `backend/src/utils/privateAccessToken.ts` để private mode không chỉ là khóa UI mà có guardrail backend riêng với thời hạn ngắn
- Chưa chạy browser/manual smoke cho `C1`; xác nhận hiện có đang ở mức build frontend + backend và eslint file frontend vừa sửa

### Files touched in latest session

- `frontend/src/pages/LoveMap.tsx`
- `backend/src/routes/locationRoutes.ts`
- `backend/src/utils/privateAccessToken.ts`
- `NEXT_STEP.md`

### Tests run in latest session

- Đã chạy `npm run build` trong `backend`.
- Kết quả: pass.
- Đã chạy `npm run build` trong `frontend`.
- Kết quả: pass.
- Đã chạy `npx eslint src/pages/LoveMap.tsx` trong `frontend`.
- Kết quả: pass.
- Ghi chú:
  - frontend build vẫn có cảnh báo chunk size của Vite, nhưng không fail build
  - chưa có browser smoke riêng cho `C1`

### Known blockers

- Không có blocker mở cho `C1`.
- Lượt tiếp theo vẫn cần giữ guardrail:
  - không kéo `C2a` sang reward / trigger hay smart suggestion
  - không thiên vị voucher về một phía mặc định chỉ vì hiện tại flow cũ đơn giản hơn
  - không phá dữ liệu voucher cũ chỉ để ép đủ semantics mới ngay trong một lượt

### Next concrete step

- Bắt đầu `C2a - Voucher type foundation`.
- Đọc đúng các section:
  - `11. Coupons / Voucher`
  - `17. Data / Personalization`
  - `21. Wireflow voucher`
- Ưu tiên đọc trước:
  - `frontend/src/pages/Coupons.tsx`
  - `backend/src/models/Coupon.ts`
  - `backend/src/controllers/couponController.ts`
  - `backend/src/services/couponService.ts`
