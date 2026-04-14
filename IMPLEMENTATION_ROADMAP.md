# Implementation Roadmap + Execution Contract

## Mục đích của file này

File này không chỉ là roadmap tổng quát. Nó là bản chuyển đổi từ `UI_UX_IDEAS.md` sang thứ tự thực thi trong codebase hiện tại, để:

- AI mở thread mới vẫn hiểu đúng ý đồ sản phẩm
- không đọc `UI_UX_IDEAS.md` theo kiểu cảm tính rồi tự chọn việc
- biết rõ:
  - làm gì trước
  - vì sao làm trước
  - phần nào là chi tiết UX nguồn gốc
  - phần nào chưa nên đụng

## Cách đọc bộ 3 tài liệu

Khi bắt đầu một thread mới, phải đọc theo thứ tự:

1. `IMPLEMENTATION_ROADMAP.md`
2. `NEXT_STEP.md`
3. các section được chỉ định trong `UI_UX_IDEAS.md`

Ý nghĩa từng file:

- `IMPLEMENTATION_ROADMAP.md`
  - cho biết execution order, dependency, deliverable, done criteria
- `NEXT_STEP.md`
  - cho biết slice nào đang active, handoff, file nào likely touched
- `UI_UX_IDEAS.md`
  - cho biết product intent, wireflow, copy, UX nuance

Không dùng riêng `UI_UX_IDEAS.md` để tự chọn việc.
Không dùng riêng `IMPLEMENTATION_ROADMAP.md` để tự đoán UI chi tiết.

---

## Tinh thần sản phẩm không được lệch

Mọi quyết định code phải giữ đúng các ý sau từ `UI_UX_IDEAS.md`:

- mobile-first
- riêng tư
- ấm nhưng không sến
- rõ ràng về `Ni` và `Được`
- một không gian chung của hai người, nhưng có hai góc nhìn riêng
- giảm cảm giác “nhiều tính năng rời rạc”
- tăng cảm giác app có “nhịp dùng hằng ngày”

### Những điều AI không được hiểu sai

- Không biến app thành dashboard KPI cặp đôi.
- Không collapse dữ liệu của hai người thành một luồng chung mơ hồ.
- Không làm tracking lộ công khai trên map chung.
- Không để voucher mặc định lệch về `Ni`.
- Không game hóa quá đà các flow cảm xúc.
- Không overwrite dữ liệu cũ chỉ để hợp với schema mới.

---

## Lưu ý quan trọng về khác biệt giữa `UI_UX_IDEAS` và roadmap này

Trong `UI_UX_IDEAS.md`, phần `20. Đề xuất hướng triển khai` là **ưu tiên sản phẩm ở mức ý tưởng**.

Trong file này, các phase bên dưới là **thứ tự thực thi trong codebase hiện tại**.

Vì vậy có những điểm được cố tình đổi thứ tự:

- `Map privacy redesign`
  - trong ideas nằm sớm hơn
  - nhưng trong execution phải để sau khi identity, auth, role switching, shared shell đã ổn
- `Voucher system redesign`
  - trong ideas là ưu tiên cao
  - nhưng trong code nên làm sau khi data ownership, creator labels, event/challenge structure đã rõ

Kết luận:

- `UI_UX_IDEAS.md` trả lời: “điều gì có giá trị sản phẩm”
- `IMPLEMENTATION_ROADMAP.md` trả lời: “điều gì nên code trước để không làm vỡ hệ”

---

## Bản đồ ý tưởng sang cụm triển khai

### Cụm A: Lớp nền bắt buộc

Nguồn từ `UI_UX_IDEAS.md`:

- `1.1 Identity system cho Ni và Được`
- `1.2 Creator / owner metadata cho mọi nội dung`
- `3. Mood / Cảm xúc`
- `4. Deep Talk`
- `5. Timeline / Kỷ niệm`
- `13. Shared UI System`
- `14. Copy / Ngôn ngữ`
- `16. Accessibility / Usability`
- `17. Data / Personalization`
- `23. Wireflow Home`
- `24. Wireflow Mood`
- `25. Wireflow Deep Talk`
- `26. Wireflow Timeline`
- `31. Wireflow shared identity system`
- `35. Wireflow shared sheets / modal system`
- `37. Wireflow auth / role switching`

### Cụm B: Nhịp dùng hằng ngày và liên kết giữa các màn

Nguồn từ `UI_UX_IDEAS.md`:

- `1.3 Activity feed của cặp đôi`
- `1.4 Global filter theo người`
- `1.5 Relationship state layer`
- `2. Home / Dashboard`
- `6. Places / Địa điểm`
- `8. Wishlist`
- `9. Events`
- `10. Challenges`
- `12. Navigation / IA`
- `33. Wireflow activity feed`
- `34. Wireflow notification / reminder UX`
- `36. Wireflow empty states / zero states`
- `27. Wireflow Places`
- `28. Wireflow Wishlist`
- `29. Wireflow Events`
- `30. Wireflow Challenges`
- `32. Wireflow navigation / app shell`

### Cụm C: Riêng tư, reward, cá nhân hóa sâu

Nguồn từ `UI_UX_IDEAS.md`:

- `7. Map / Bản đồ`
- `11. Coupons / Voucher`
- `15. Motion / Tương tác`
- `17. Data / Personalization`
- `21. Wireflow voucher`
- `22. Wireflow map privacy`
- `38. Wireflow reward / trigger system`

---

## Data contract tối thiểu theo entity

Phần này dùng để tránh AI thread mới đoán sai `createdBy`, `owner`, `holder`, `target`.

### Mức tối thiểu cần đạt ở Phase 1

- `Mood`
  - đã có `createdBy`
  - cần chuẩn hóa hiển thị ở UI
- `DeepTalkQuestion`
  - đã có answer split theo `boyfriend/girlfriend`
  - cần chuẩn hóa trạng thái chờ/trả lời/nói ngoài đời
- `JournalEntry`
  - đã có `createdBy`
  - cần hiển thị rõ người viết
- `Memory`
  - cần thêm ít nhất `createdBy`
  - chưa bắt buộc `owner` ở phase đầu
- `Place`
  - cần thêm ít nhất `createdBy`
  - trạng thái `isVisited` giữ nguyên ở phase đầu
- `Wishlist`
  - phase đầu nên có ít nhất `createdBy`
  - phase sau mới mở rộng `owner` hoặc `preparedFor`
- `Event`
  - phase đầu nên có ít nhất `createdBy`
  - phase sau mới mở rộng `relatedTo`, `type`, `forWhom`
- `Coupon`
  - đã có `createdBy`
  - phase 3 mới tách tiếp:
    - loại voucher
    - người nhận
    - người đang giữ
    - voucher chung

### Rule chung

- Nếu chưa chắc semantics của `owner`, ưu tiên thêm `createdBy` trước.
- Không ép `required: true` cho field mới ở record cũ trong bước đầu.
- Record cũ chưa biết rõ ai tạo:
  - giữ nguyên
  - UI hiển thị trung tính hoặc `không rõ`

---

## Phase 1: Nền Tảng Nhận Diện Và Luồng Cốt Lõi

### Mục tiêu

- Làm app rõ ràng ngay về mặt `Ni` và `Được`
- Xóa các điểm mơ hồ gây hiểu sai dữ liệu
- Chốt contract dữ liệu theo người
- Chuẩn hóa shell và shared UI để các phase sau không bị lệch

### Source sections trong `UI_UX_IDEAS.md`

- `1.1`
- `1.2`
- `2`
- `3`
- `4`
- `5`
- `13`
- `14`
- `16`
- `17.5`
- `23`
- `24`
- `25`
- `26`
- `31`
- `35`
- `37`

### Deliverables bắt buộc

#### 1. Shared identity system

- Chuẩn hóa:
  - person badge
  - role label
  - creator label
  - owner label
  - waiting status
- Áp dụng thống nhất trên toàn app

#### 2. Creator metadata cho dữ liệu cốt lõi

- Bổ sung hoặc chuẩn hóa metadata cho:
  - moods
  - memories
  - deep talk answers
  - journal
  - wishlist
  - events
  - coupons

#### 3. Home v2

- Giữ Home là dashboard chính
- Bổ sung rõ:
  - `Hôm nay của Ni`
  - `Hôm nay của Được`
  - `Điều đang chờ giữa hai người`
  - `Một bước tiếp theo`

#### 4. Mood clarity pass

- Tách rõ:
  - `Cảm xúc của Ni`
  - `Cảm xúc của Được`
- Mood phải gắn người tạo rõ ràng

#### 5. Deep Talk clarity pass

- Tách rõ:
  - ai đã trả lời
  - ai chưa trả lời
  - ai đã nói ngoài đời
- Nhật ký riêng phải hiện rõ người viết

#### 6. Timeline clarity pass

- Mỗi kỷ niệm phải hiện rõ ai ghi lại
- Nếu dữ liệu cũ chưa có metadata, UI phải fallback an toàn

#### 7. Shared sheet / modal system

- Chuẩn hóa bottom sheet và modal behavior cho mobile-first

#### 8. Copy audit vòng 1

- Loại bỏ:
  - wording mơ hồ
  - role wording kiểu kỹ thuật
  - phần tiếng Anh còn sót khi không cần

### Không làm trong Phase 1

- Places redesign đầy đủ
- Wishlist redesign đầy đủ
- Events redesign đầy đủ
- Challenges redesign đầy đủ
- voucher 3 loại
- tracking private mode
- reward / trigger
- smart suggestions

### Done criteria

- Người dùng mở app là biết đang ở góc nhìn của ai
- Record mới ghi được metadata theo người ở các entity ưu tiên
- Record cũ không bị mất và không làm màn lỗi
- Mood / Deep Talk / Timeline / Home đều không còn cảm giác “không biết của ai”
- Shared role labels không còn bị trùng lặp lung tung

---

## Phase 2: Nhịp Sử Dụng Hằng Ngày Và Kết Nối Các Màn

### Mục tiêu

- Khiến app có lý do quay lại thường xuyên
- Làm các màn bắt đầu liên kết với nhau
- Chuyển từ “nhiều tính năng” sang “một hệ trải nghiệm có nhịp”

### Source sections trong `UI_UX_IDEAS.md`

- `1.3`
- `1.4`
- `1.5`
- `2`
- `6`
- `8`
- `9`
- `10`
- `12`
- `27`
- `28`
- `29`
- `30`
- `32`
- `33`
- `34`
- `36`

### Deliverables bắt buộc

#### 1. Activity feed

- Tạo luồng `vừa rồi` trên Home:
  - ai vừa ghi gì
  - ai vừa làm gì
  - có gì mới đang chờ

#### 2. Global filter theo người

- Với các màn có nhiều nội dung cá nhân, hỗ trợ:
  - `Tất cả`
  - `Ni`
  - `Được`

#### 3. Places redesign

- Tách rõ:
  - `Muốn đi`
  - `Đã đi`
  - `Lần tới nên thử`
- Gắn địa điểm với note / memory / reason

#### 4. Wishlist redesign

- Tách rõ:
  - `Ni muốn`
  - `Được muốn`
  - `Đang chuẩn bị`

#### 5. Events redesign

- Hiển thị rõ:
  - ai tạo
  - ngày này dành cho ai
  - ý nghĩa ngày đó

#### 6. Challenges redesign

- Bớt cảm giác “game nhiệm vụ”
- Tăng nghĩa:
  - cùng nhau
  - Ni dành cho Được
  - Được dành cho Ni

#### 7. Navigation / app shell refinement

- Tối ưu:
  - `Thêm`
  - recently used destinations
  - cross-links giữa các màn

#### 8. Empty states / zero states pass

- Biến empty state thành lời mời bắt đầu đúng ngữ cảnh

#### 9. Reminder UX

- Chỉ giữ reminder có giá trị
- Tạo ngôn ngữ nhắc nhẹ, không áp lực

### Không làm trong Phase 2

- tracking BF private mode
- voucher 3 loại hoàn chỉnh
- reward / trigger orchestration
- smart suggestions theo dữ liệu sâu

### Done criteria

- App có nhịp sống hằng ngày rõ hơn
- Places / Wishlist / Events / Challenges không còn là các list rời rạc
- Activity feed và filter theo người làm dữ liệu dễ hiểu hơn
- Home và navigation kéo người dùng đi tiếp tự nhiên hơn

---

## Phase 3: Riêng Tư, Reward, Và Cá Nhân Hóa Sâu

### Mục tiêu

- Hoàn thiện các tính năng nhạy cảm
- Tạo chiều sâu mà không phá cảm giác riêng tư
- Bổ sung các lớp “surprise and return” một cách có kiểm soát

### Source sections trong `UI_UX_IDEAS.md`

- `7`
- `11`
- `15`
- `17`
- `21`
- `22`
- `38`

### Deliverables bắt buộc

#### 1. Map privacy redesign

- Tách:
  - map chung
  - private tracking mode
- Private tracking chỉ mở sau xác thực BF
- Có timeout tự tắt

#### 2. Coupon / voucher system redesign

- Tách 3 loại:
  - voucher đích danh
  - voucher nhanh tay
  - voucher dùng chung
- Thiết kế:
  - weekly vouchers nhỏ
  - monthly voucher lớn

#### 3. Reward / trigger system

- Gắn challenge, deep talk, mood, event với reward nhẹ
- Reward không được quá game hóa

#### 4. Memory resurfacing

- Gợi lại kỷ niệm cũ đúng thời điểm

#### 5. Smart suggestions

- Gợi ý:
  - nơi nên đi
  - việc nên làm
  - câu hỏi nên trả lời
  - voucher nên nhận

#### 6. Paired completeness / relationship state

- Hôm nay ai đã làm gì
- điều gì còn thiếu ở phía nào
- đâu là bước tiếp theo hợp lý

#### 7. Auth / role switching refinement

- Làm role switching mượt hơn
- Tăng cảm giác app đổi góc nhìn thật sự

### Done criteria

- Tính năng nhạy cảm được xử lý đúng tinh thần riêng tư
- Reward và personalization giúp app sống hơn mà không phản cảm
- Tracking không phá tinh thần “không gian chung ấm áp”
- Voucher không còn cảm giác mặc định thiên vị

---

## Slice order khuyến nghị trong codebase

Phần này để AI thread mới biết nên chia nhỏ ra sao.

### Phase 1

- `A1`: backend metadata contract an toàn cho dữ liệu cũ
- `A2`: backend write path và API surface
- `A3`: frontend shared identity primitives
- `A4`: áp shared identity vào Mood / Deep Talk / Timeline
- `A5`: Home dùng lớp dữ liệu mới
- `A6`: legacy QA pass

### Phase 2

- `B1`: Places redesign
- `B2`: Wishlist redesign
- `B3`: Events redesign
- `B4`: Challenges redesign
- `B5`: activity feed
- `B6`: global filter theo người
- `B7`: navigation / app shell refinement
- `B8`: empty states / reminder UX

### Phase 3

- `C1`: map privacy
- `C2`: voucher system redesign
- `C3`: reward / trigger system
- `C4`: memory resurfacing
- `C5`: smart suggestions
- `C6`: paired completeness / relationship state
- `C7`: auth / role switching refinement

---

## Cách chia việc để bàn giao theo từng đợt

### Kết luận ngắn

- Có thể chia để hôm nay làm xong một đợt rồi hôm sau giao người khác làm đợt tiếp theo.
- Nhưng **không nên chia theo tên mục lớn trong `UI_UX_IDEAS.md`**.
- Nên chia theo các slice có thể bàn giao được trong codebase:
  - có phạm vi rõ
  - có dependency rõ
  - có tiêu chí xong rõ

### Vì sao không nên chia theo “mục lớn”

- Một mục lớn trong ideas thường đồng thời đụng:
  - schema dữ liệu
  - API
  - component dùng chung
  - copy
  - trạng thái UI
- Nếu giao thẳng kiểu:
  - hôm nay làm mục lớn 1
  - mai người khác làm mục lớn 2

thì rất dễ bị:

- người sau phải sửa lại nền của người trước
- thiếu metadata nên UI làm xong vẫn không hiển thị đúng
- phát sinh merge conflict ở shared component và page shell

### Mô hình khả thi nhất

- Làm nối tiếp an toàn nhất:
  - `A1 -> A2 -> A3 -> A4 -> A5 -> A6`
  - sau đó mới sang `B`
  - sau cùng mới sang `C`
- Chỉ khi `A3` đã chốt contract dữ liệu và shared primitives:
  - `B1` và `B2/B3` mới có thể cân nhắc giao song song

### Luật bàn giao

- Đợt sau chỉ bắt đầu khi:
  - schema/API của đợt trước đã ổn
  - shared component đã chốt
  - dữ liệu cũ vẫn render được
- Mỗi đợt nên có handoff note ngắn:
  - đã đổi gì
  - còn thiếu gì
  - dữ liệu cũ đang được xử lý theo rule nào
  - màn nào cần test lại

---

## Nguyên tắc giữ an toàn cho dữ liệu cũ

- Các tính năng như `ai đăng`, `ai thêm`, `ai tạo` **không nên** được triển khai bằng cách ép dữ liệu cũ phải có field mới ngay lập tức.
- Cách đúng là:
  1. thêm field mới dưới dạng tương thích ngược
  2. deploy code đọc được cả record cũ lẫn mới
  3. backfill dữ liệu cũ nếu suy luận được
  4. nếu không suy luận chắc chắn được thì giữ trạng thái `không rõ`
  5. chỉ siết required validation sau cùng nếu thật sự cần

### Điều này có nghĩa là gì trên thực tế

- Dữ liệu cũ **không tự mất** chỉ vì thêm field metadata.
- Dữ liệu chỉ mất hoặc hỏng nếu:
  - viết migration phá hủy
  - overwrite sai
  - ép validation quá sớm
- Với các record cũ như memory / place / wishlist / event, nên ưu tiên:
  - giữ nguyên bản ghi cũ
  - thêm metadata sau
  - nếu chưa biết ai tạo thì UI hiển thị trung tính

### Rule phải chốt trước khi code

- Có cho phép giá trị:
  - `unknown`
  - `shared`
  - hoặc `legacy`
- UI sẽ hiện gì nếu record cũ chưa có owner
- Model nào chỉ cần `createdBy`
- Model nào thật sự cần thêm `owner`, `holder`, `target`, `preparedFor`

---

## Prompt chuẩn cho thread mới

```text
Đọc E:/niyeuoi/IMPLEMENTATION_ROADMAP.md và E:/niyeuoi/NEXT_STEP.md.
Làm đúng slice đang active trong NEXT_STEP.md.
Đọc thêm đúng các source sections liên quan trong UI_UX_IDEAS.md.
Không mở rộng scope.
Nếu dừng giữa chừng, cập nhật NEXT_STEP.md trước khi kết thúc.
```

---

## Kết luận

Roadmap này phải được hiểu như sau:

- `UI_UX_IDEAS.md`
  - là ý đồ sản phẩm và wireflow
- `IMPLEMENTATION_ROADMAP.md`
  - là execution contract để không làm lệch ý đồ đó
- `NEXT_STEP.md`
  - là trạng thái thi công hiện tại

Nếu giữ đúng 3 lớp này, AI mở thread mới sẽ hiểu:

- anh muốn app đi theo hướng nào
- phải làm gì trước
- chi tiết UX cần đọc ở đâu
- và không tự trôi sang một hướng implementation khác
