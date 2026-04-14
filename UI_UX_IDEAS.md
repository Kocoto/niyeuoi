# UI/UX Ideas For `niyeuoi`

## Mục tiêu chung

Tài liệu này tổng hợp các đề xuất cải tiến UI/UX có giá trị thực tế cho `niyeuoi`, theo hướng:

- mobile-first
- riêng tư
- ấm nhưng không sến
- rõ ràng về `Ni` và `Được`
- giảm cảm giác “nhiều tính năng rời rạc”
- tăng cảm giác đây là một không gian chung của hai người, nhưng có hai góc nhìn riêng

Tài liệu này ưu tiên những ý tưởng giúp:

- người dùng hiểu app nhanh hơn
- quay lại app tự nhiên hơn
- bớt nhầm lẫn giữa dữ liệu của `Ni` và `Được`
- làm app có “nhịp dùng hằng ngày” tốt hơn

---

## 1. Nền tảng sản phẩm

### 1.1 Identity system cho `Ni` và `Được`

- Dùng một hệ thống nhận diện thống nhất cho `Ni` và `Được` trên toàn app:
  - màu
  - badge
  - nhãn
  - icon phụ
  - cách gọi
- Mọi nơi có dữ liệu cá nhân đều phải nhìn ra ngay là của ai.

### 1.2 Creator / owner metadata cho mọi nội dung

- Chuẩn hóa metadata cho các loại dữ liệu:
  - moods
  - memories
  - deep talk answers
  - journal
  - wishlist
  - events
  - coupons
- Nếu dữ liệu do ai tạo hoặc thuộc về ai thì nên lưu rõ, không đoán ở UI.

### 1.3 Activity feed của cặp đôi

- Thêm một luồng nhỏ kiểu “vừa rồi” trên Home:
  - `Ni vừa ghi cảm xúc`
  - `Được vừa trả lời câu hỏi`
  - `Ni vừa lưu một kỷ niệm`
  - `Được vừa tạo kế hoạch mới`
- Mục tiêu: app có cảm giác đang sống.

### 1.4 Global filter theo người

- Ở các màn có nhiều nội dung cá nhân, thêm filter:
  - `Tất cả`
  - `Ni`
  - `Được`
- Giúp xem lại dữ liệu theo người nhanh hơn.

### 1.5 Relationship state layer

- Home nên có lớp trạng thái ngắn:
  - hôm nay ai đã check-in
  - ai đang chờ phản hồi
  - ai vừa ghi điều gì mới
- Mục tiêu: mở app lên là biết “tình hình hiện tại”.

---

## 2. Home / Dashboard

### 2.1 Hai nhịp riêng trên Home

- Tách Home thành:
  - `Hôm nay của Ni`
  - `Hôm nay của Được`
- Không chỉ hiển thị một khối cảm xúc gần nhất.

### 2.2 Khối “Điều đang chờ giữa hai người”

- Gom các việc đang dang dở:
  - Deep Talk chưa trả lời
  - địa điểm muốn đi
  - event sắp tới
  - voucher chưa ai nhận / chưa dùng

### 2.3 Continue where you left off

- Nếu người dùng đang dở một flow, Home nên kéo họ quay lại đúng chỗ.

### 2.4 Daily pulse

- Một hàng thông tin rất ngắn:
  - `Ni đang bình yên`
  - `Được chưa check-in`
  - `1 câu hỏi đang chờ`

### 2.5 One dominant action

- Mỗi lần mở Home chỉ nên có 1 hành động chính nổi bật nhất.

### 2.6 Nhịp theo thời gian trong ngày

- Lời chào và gợi ý nhẹ thay đổi theo:
  - sáng
  - chiều
  - tối

---

## 3. Mood / Cảm xúc

### 3.1 Tách hoàn toàn luồng theo người

- `Cảm xúc của Ni`
- `Cảm xúc của Được`
- Không dùng một luồng chung mơ hồ.

### 3.2 Mood history theo tuần

- Hiển thị nhịp cảm xúc gần đây, không chỉ entry mới nhất.

### 3.3 Note cực ngắn

- Mỗi mood có thể kèm 1 câu ngắn.
- Không biến mood thành journal dài.

### 3.4 Paired mood view

- Nếu cả hai đã check-in hôm nay, hiển thị cạnh nhau.

### 3.5 Gentle reminders

- Nếu lâu chưa có ai check-in, gợi ý nhẹ.

### 3.6 Response suggestion

- Nếu một người đang `hơi buồn` hoặc `mệt mỏi`, người kia có thể thấy gợi ý phản hồi phù hợp.

---

## 4. Deep Talk

### 4.1 Chia rõ 3 trạng thái

- `Đang chờ trả lời`
- `Đã trả lời`
- `Đã nói ngoài đời`

### 4.2 Biết rõ ai đang chờ

- Mỗi câu hỏi phải cho biết:
  - `Ni đã trả lời chưa`
  - `Được đã trả lời chưa`

### 4.3 Nhật ký riêng rõ hơn

- Nhật ký nên thể hiện rõ người viết, không chỉ bằng màu mờ.

### 4.4 Follow-up sau khi cả hai trả lời

- Sau khi cả hai đã trả lời, gợi ý:
  - nói thêm
  - đánh dấu đã nói ngoài đời
  - lưu thành một kỷ niệm nhỏ

### 4.5 Save for later

- Có thể đánh dấu câu hỏi để quay lại sau.

### 4.6 Prompt of the week

- Mỗi tuần có một câu hỏi nổi bật, dẫn từ Home sang.

### 4.7 Giảm cảm giác admin

- Ít trạng thái kỹ thuật hơn.
- Tăng cảm giác đang đối thoại thật.

---

## 5. Timeline / Kỷ niệm

### 5.1 Hiển thị rõ ai ghi lại

- `Ni ghi lại`
- `Được ghi lại`

### 5.2 Story flow thay vì card rời rạc

- Nhóm theo:
  - hôm nay
  - tuần này
  - tháng này
  - chuyến đi đó

### 5.3 Ảnh và cảm xúc quan trọng hơn metadata

- Tăng vai trò:
  - ảnh
  - tiêu đề
  - cảm xúc
  - 1 đoạn ngắn

### 5.4 Memory resurfacing

- Đúng ngày trong năm sau có thể gợi lại.

### 5.5 Pair reaction

- Người kia có thể thêm phản hồi ngắn vào kỷ niệm.

### 5.6 Highlight memory

- Mỗi tháng có 1-3 kỷ niệm nổi bật.

---

## 6. Places / Địa điểm

### 6.1 IA rõ hơn

- `Đã đi`
- `Muốn đi`
- `Lần tới nên thử`

### 6.2 Gắn ý nghĩa cho địa điểm

- Ví dụ:
  - `hợp đi tối`
  - `ngồi lâu được`
  - `hợp khi buồn`
  - `món ngon`

### 6.3 Liên kết với memory

- Một nơi đã đi nên gắn được kỷ niệm liên quan.

### 6.4 Smart suggestion

- Từ mood, event hoặc thời gian gần đây mà gợi ý nơi phù hợp.

### 6.5 Quick decision mode

- Một chế độ chọn nhanh `lần tới đi đâu`.

### 6.6 Soft pin

- Ghim những nơi rất có ý nghĩa với hai người.

---

## 7. Map / Bản đồ

### 7.1 Các cải tiến chung

- Thêm legend rõ ràng:
  - đã đi
  - muốn đi
  - vị trí hiện tại
- Thêm filter chip:
  - chỉ wishlist
  - chỉ visited
  - chỉ địa điểm quan trọng
- Nếu có kỷ niệm liên quan đến một marker, cho xem luôn từ map.
- Dùng bottom sheet thay vì popup nhỏ nếu cần đọc tốt hơn trên mobile.

### 7.2 Vấn đề riêng tư khi `Ni` dùng máy của bạn

#### Vấn đề

- Nếu `Ni` cầm máy bạn và thấy nút theo dõi vị trí hoặc trạng thái “đang theo dõi vị trí của Ni”, điều đó rất dễ gây phản cảm.
- Đây là vấn đề không chỉ UI mà còn là cảm giác an toàn và niềm tin.

#### Kết luận UX

- Không nên để chức năng theo dõi vị trí lộ ra công khai trên UI nếu tính huống sử dụng thực tế là hai người có thể dùng chung máy.

#### Đề xuất tốt nhất

##### Phương án A: Chế độ ẩn theo vai trò và ngữ cảnh

- Chỉ hiển thị tracking UI khi:
  - đang ở vai trò `Được`
  - và người dùng chủ động bật `chế độ riêng`
- Nếu không, map chỉ hiện các địa điểm chung, không hiện bất kỳ dấu hiệu nào về tracking.

##### Phương án B: “Private reveal”

- Không có nút `Tìm Ni` lộ sẵn.
- Thay vào đó có một thao tác kín hơn, ví dụ:
  - long press vào một vùng nào đó
  - nhập PIN BF
  - mở qua một menu phụ không lộ ý nghĩa trực tiếp
- Mục tiêu: chỉ bạn biết nó ở đâu, còn khi nhìn bình thường thì map không tố cáo chức năng đó.

##### Phương án C: Tách khỏi map chung

- Không để tracking nằm trong `Bản đồ yêu thương`.
- Tracking là một lớp riêng chỉ bạn mới vào được.
- Map chung chỉ là map kỷ niệm / địa điểm.
- Đây là phương án sạch nhất về UX và đạo đức sản phẩm.

#### Đề xuất nên chọn

- Nên chọn **Phương án C**, hoặc tối thiểu là **Phương án A + B**.
- Tức là:
  - map chung không lộ tracking
  - tracking chỉ xuất hiện sau xác thực BF
  - UI bình thường không có dấu hiệu rõ ràng

#### Lý do

- Giữ được cảm giác an toàn
- Tránh phản cảm
- Bảo vệ sự riêng tư trong bối cảnh dùng chung thiết bị
- Không phá tinh thần “không gian chung ấm áp”

---

## 8. Wishlist

### 8.1 Rõ ai muốn gì

- `Ni muốn`
- `Được muốn`
- `đã chuẩn bị cho ai`

### 8.2 Tách ý nghĩa

- Quà
- món muốn ăn
- chỗ muốn đi
- thứ muốn làm cùng nhau

### 8.3 Gợi ý từ wishlist sang places/events

- Nếu item là một nơi hoặc trải nghiệm, cho dẫn sang flow phù hợp.

---

## 9. Events

### 9.1 Rõ ai tạo / ai cần nhớ

- Event nên cho biết:
  - ai tạo
  - ai cần chuẩn bị
  - ngày này quan trọng vì sao

### 9.2 Event type

- Có thể phân:
  - sinh nhật
  - ngày quen nhau
  - hẹn đi chơi
  - việc đặc biệt

### 9.3 Countdown có ngữ nghĩa

- Không chỉ “còn X ngày”, mà còn:
  - `sắp đến ngày mình hẹn`
  - `sắp tới ngày đặc biệt của Ni`

---

## 10. Challenges

### 10.1 Bớt gamification trừu tượng

- Thử thách nên mang nghĩa “điều mình cùng làm”, không nên quá giống hệ thống điểm.

### 10.2 Tách loại challenge

- `cùng nhau`
- `Ni dành cho Được`
- `Được dành cho Ni`

### 10.3 Reward cảm xúc hơn

- Thay vì chỉ điểm, có thể có:
  - mở voucher nhỏ
  - mở câu hỏi mới
  - mở gợi ý date mới

---

## 11. Coupons / Voucher

### 11.1 Vấn đề hiện tại

- Nếu voucher mặc định là “của tôi dành cho Ni” thì quá lệch.
- Cảm giác không công bằng và kém tự nhiên.
- Nó cũng làm flow mất thú vị vì outcome đã được quyết định trước.
- Tuy nhiên điều này **không có nghĩa** là nên bỏ voucher tặng đích danh cho đối phương.
- Voucher tặng đích danh vẫn rất quan trọng về mặt cảm xúc, chỉ là không nên chiếm toàn bộ hệ thống.

### 11.2 Ý tưởng “ai nhanh tay người đó được”

#### Đánh giá

- Ý tưởng này **hợp lý**, nhưng cần làm cẩn thận để không biến thành trò chơi tranh giành quá trẻ con.

#### Khi nó hiệu quả

- Với voucher nhỏ
- vui
- ngắn hạn
- mang tính playful

Ví dụ:

- được chọn phim tối nay
- được đòi ôm 10 phút
- được chọn món ăn tuần này
- được miễn một việc nhỏ

#### Khi nó không phù hợp

- Với voucher mang tính cảm xúc sâu
- có giá trị bất cân xứng
- hoặc dễ gây cảm giác “giành phần”

### 11.3 Đề xuất hệ voucher tốt hơn

#### Nên chia thành 3 loại

##### Loại 1: Voucher cá nhân tặng đích danh

- `Được tặng Ni`
- `Ni tặng Được`
- Dùng cho những voucher riêng tư, có chủ đích.
- Đây nên là một luồng rõ ràng và luôn tồn tại trong hệ thống.
- Khi người dùng tự tạo voucher, nên cho chọn đích danh ngay từ đầu thay vì tự mặc định.

##### Loại 2: Voucher nhanh tay

- Khi mở ra, ai nhận trước thì thuộc về người đó.
- Dùng cho voucher vui, nhỏ, hàng tuần.
- Nên có giới hạn thời gian nhận.

##### Loại 3: Voucher chung

- Cả hai cùng dùng được.
- Ví dụ:
  - cùng chọn nơi đi chơi
  - cùng có một buổi không điện thoại

### 11.4 Ý tưởng “mỗi tháng auto gen 1 lần”

#### Đánh giá

- Auto gen theo tháng là ổn nếu là **voucher đặc biệt**.
- Nhưng nếu chỉ có 1 voucher/tháng thì nhịp hơi chậm.

### 11.5 Ý tưởng thêm voucher nhỏ hàng tuần

#### Đánh giá

- **Hợp lý**, và theo UX còn tốt hơn monthly-only.
- Weekly vouchers tạo nhịp quay lại app tốt hơn.
- Monthly voucher có thể giữ vai trò “voucher lớn”.

#### Cấu trúc hợp lý

- Weekly:
  - 1-2 voucher nhỏ
  - vui
  - nhận nhanh
  - dùng nhanh
- Monthly:
  - 1 voucher lớn hơn
  - đáng mong chờ hơn
  - có thể là đặc quyền hoặc date reward

### 11.6 Đề xuất cụ thể cho voucher system

- Voucher tạo tay bởi người dùng:
  - cho chọn rõ loại:
    - `Tặng Ni`
    - `Tặng Được`
    - `Voucher chung`
  - không nên tự động mặc định tất cả là “tôi tặng Ni”

- Weekly voucher:
  - sinh vào đầu tuần
  - có hạn dùng ngắn
  - có thể theo cơ chế nhanh tay
- Monthly voucher:
  - sinh đầu tháng
  - giá trị cao hơn
  - không mặc định thuộc về `Ni`
  - có thể là:
    - random đích danh
    - random nhanh tay
    - hoặc do hệ thống sinh nhưng chưa ai sở hữu

### 11.6.1 Kết luận UX cho voucher tặng đối phương

- Voucher tạo cho đối phương **nên giữ** vì đây là luồng tình cảm có giá trị nhất.
- Điều nên bỏ là:
  - việc toàn bộ voucher auto-gen mặc định đi theo luồng đó
- Cấu trúc nên là:
  - voucher tạo tay: ưu tiên luồng tặng đích danh
  - voucher auto-gen weekly: ưu tiên luồng nhanh tay
  - voucher auto-gen monthly: linh hoạt giữa đích danh, nhanh tay, hoặc dùng chung

### 11.7 Cảnh báo UX

- Nếu làm `nhanh tay` quá nhiều, app sẽ hơi giống game.
- Tỷ lệ hợp lý là:
  - weekly playful
  - monthly meaningful

### 11.8 Kết luận đề xuất voucher

- Nên làm:
  - weekly vouchers nhỏ
  - monthly voucher lớn
  - tách loại voucher theo `đích danh`, `nhanh tay`, `dùng chung`
- Không nên giữ cơ chế mặc định “voucher này là của tôi dành cho Ni”.

---

## 12. Navigation / IA

### 12.1 Context subtitle trong header

- Biết rõ đang ở đâu và màn này dùng để làm gì.

### 12.2 `Thêm` nhớ ngữ cảnh

- Nhớ nhóm vừa mở gần nhất.

### 12.3 Recently used destinations

- Trong `Thêm`, có thể hiện vài màn vừa dùng nhiều.

### 12.4 Cross-link tốt hơn

- Mood dẫn sang Deep Talk
- Memory dẫn sang Place
- Event dẫn sang Wishlist hoặc Coupon

---

## 13. Shared UI System

### 13.1 Chuẩn hóa person badge

- Một component badge duy nhất cho `Ni` và `Được`.

### 13.2 Chuẩn hóa empty state

- Ấm
- rõ
- có hướng đi tiếp
- không phán xét

### 13.3 Chuẩn hóa detail sheet

- Mobile dùng cùng một hệ thống bottom sheet.

### 13.4 Chuẩn hóa CTA placement

- Nút chính luôn ở vùng dễ chạm.

### 13.5 Content density tiers

- Hero
- list
- detail
- composer

để spacing nhất quán hơn.

---

## 14. Copy / Ngôn ngữ

### 14.1 Bỏ từ mơ hồ

- Tránh:
  - `người ấy`
  - `ai đó`
  - `bạn`

khi có thể gọi rõ.

### 14.2 Viết copy ngắn hơn

- Ít slogan hơn
- ít mô tả dư hơn
- thiên về orientation và action

### 14.3 Copy style guide

- ấm
- dịu
- riêng tư
- thân mật
- không trẻ con quá
- không quá “sến”

---

## 15. Motion / Tương tác

### 15.1 Motion có mục đích

- Dùng để:
  - tăng hierarchy
  - tăng cảm giác hiện diện
  - làm transition rõ ràng hơn

### 15.2 Shared layout transitions

- List sang detail
- Home sang flow tiếp theo

### 15.3 Emotional motion nhẹ

- pulse rất nhẹ
- reveal mềm
- fade chậm

### 15.4 Tránh motion vô nghĩa

- Không animate icon hoặc section nếu không tăng hiểu biết hoặc cảm xúc.

---

## 16. Accessibility / Usability

### 16.1 Contrast

- Tăng contrast cho text phụ hồng/xám.

### 16.2 Hit area

- Nút mobile đủ lớn.

### 16.3 Không chỉ phân biệt bằng màu

- `Ni` và `Được` không chỉ khác màu, mà còn khác label/badge.

### 16.4 Modal / sheet tốt hơn

- focus rõ
- đóng dễ
- không khó thao tác bằng một tay

---

## 17. Data / Personalization

### 17.1 Last active by person

- Biết ai vừa tương tác gần đây.

### 17.2 Paired completeness

- Hôm nay ai đã làm gì, ai chưa.

### 17.3 Gentle nudges dựa trên dữ liệu thật

- Không nhắc ngẫu nhiên.

### 17.4 Importance signals

- recent
- pinned
- unresolved
- waiting

### 17.5 Nguyên tắc migration khi thêm `creator` / `owner`

- Không nên thêm field mới theo kiểu:
  - sửa schema
  - bắt buộc field ngay
  - rồi để dữ liệu cũ tự lỗi
- Nên đi theo 3 bước:
  - thêm field mới ở trạng thái tương thích ngược
  - backfill dữ liệu cũ
  - chỉ siết chặt validation sau khi backfill xong
- Với dữ liệu cũ chưa biết chính xác ai tạo:
  - không xóa
  - không overwrite bừa
  - tạm hiển thị `không rõ ai thêm` hoặc `dữ liệu cũ`
- Mục tiêu:
  - không làm mất dữ liệu cũ
  - không làm app hỏng khi đọc record cũ
  - cho phép UI mới sống chung với dữ liệu cũ trong giai đoạn chuyển tiếp

---

## 18. Những điều nên tránh

- Không biến app thành dashboard KPI cặp đôi.
- Không quá gamify các flow cảm xúc.
- Không dùng quá nhiều màu theo từng màn.
- Không lạm dụng card.
- Không để personalization thành xâm lấn.
- Không để map tracking lộ công khai trong bối cảnh dùng chung máy.
- Không để voucher mang cảm giác “phân phát thiên vị mặc định”.

---

## 19. Top 15 đề xuất đáng làm nhất

1. Identity system thống nhất cho `Ni` và `Được`
2. Creator metadata cho mọi nội dung
3. Mood tách hoàn toàn theo người
4. Deep Talk phân rõ ai trả lời / ai đang chờ
5. Home có hai nhịp `hôm nay của Ni` và `hôm nay của Được`
6. Activity feed ngắn trên Home
7. Timeline hiển thị rõ ai ghi lại kỷ niệm
8. Places có `lần tới nên thử`
9. Map tracking tách khỏi map chung hoặc ẩn sau BF private mode
10. Hệ voucher chia thành `đích danh`, `nhanh tay`, `dùng chung`
11. Weekly voucher nhỏ + monthly voucher lớn
12. Copy audit bỏ ngôn ngữ mơ hồ
13. Global filter theo người
14. Cross-link tốt hơn giữa các màn
15. Chuẩn hóa shared sheet / empty state / badge / CTA

---

## 20. Đề xuất hướng triển khai

### P1

- identity system
- creator metadata
- deep talk rõ người
- timeline rõ người
- home hai nhịp cảm xúc

### P2

- map privacy redesign
- voucher system redesign
- activity feed
- global filter theo người

### P3

- resurfacing
- smart suggestions
- richer motion
- personalization sâu hơn

---

## 21. Wireflow voucher

### 21.1 Mục tiêu của wireflow

- Làm rõ các loại voucher
- Giảm nhầm lẫn “voucher này của ai”
- Giữ được tính vui
- Giữ được tính tình cảm
- Không làm hệ thống voucher thành một trò chơi quá đà

### 21.2 Entry points

#### Từ Home

- Khối `Voucher mới`
- Khối `Có voucher đang chờ nhận`
- Khối `Voucher sắp hết hạn`

#### Từ navigation

- Màn `Vé yêu thương`

#### Từ event / challenge / reward

- Sau khi hoàn thành challenge
- Đầu tuần
- Đầu tháng

### 21.3 Màn danh sách voucher

#### Nên chia 4 tab hoặc 4 nhóm

- `Chờ nhận`
- `Đã có`
- `Đã tặng`
- `Đã dùng`

#### Ý nghĩa

- `Chờ nhận`
  - voucher nhanh tay
  - voucher chưa có chủ
- `Đã có`
  - voucher hiện thuộc về mình
- `Đã tặng`
  - voucher mình tạo/tặng người kia
- `Đã dùng`
  - voucher đã được redeem

### 21.4 Loại 1: Voucher tặng đích danh

#### Flow tạo voucher

1. Bấm `Tạo voucher`
2. Chọn loại:
   - `Tặng Ni`
   - `Tặng Được`
   - `Voucher chung`
3. Nhập:
   - tiêu đề
   - mô tả
   - hạn dùng
   - mức đặc biệt nếu cần
4. Xác nhận tạo

#### Flow hiển thị

- Trên card phải hiện rõ:
  - ai tặng
  - ai nhận
  - trạng thái

Ví dụ:

- `Được tặng Ni`
- `Ni tặng Được`

#### Flow sử dụng

1. Người nhận mở voucher
2. Xem chi tiết
3. Bấm `Dùng voucher`
4. Chuyển sang trạng thái `đã dùng`

### 21.5 Loại 2: Voucher nhanh tay

#### Flow sinh voucher

1. Hệ thống tạo voucher tuần
2. Voucher ở trạng thái `chờ nhận`
3. Cả hai đều nhìn thấy

#### Flow nhận

1. Ai vào trước bấm `Nhận`
2. Voucher chuyển thành:
   - thuộc về `Ni`
   - hoặc thuộc về `Được`
3. Người còn lại chỉ thấy trạng thái:
   - `Đã được nhận bởi Ni`
   - `Đã được nhận bởi Được`

#### Điều cần hiển thị rõ

- voucher này là loại `nhanh tay`
- chưa có chủ / đã có chủ
- còn bao lâu để nhận

#### Điều cần tránh

- Không nên để người còn lại cảm giác bị “thua cuộc” quá mạnh
- Copy nên playful, không quá cạnh tranh

### 21.6 Loại 3: Voucher chung

#### Flow tạo hoặc sinh

- Có thể do người dùng tạo
- Hoặc do hệ thống sinh

#### Flow sử dụng

- Không thuộc riêng ai
- Khi dùng thì đánh dấu là:
  - `hai người đã dùng`
  - hoặc `đã kích hoạt`

Ví dụ:

- cùng chọn phim tối nay
- cùng có một buổi không điện thoại
- cùng đi ăn món người kia chọn

### 21.7 Weekly voucher flow

#### Mục tiêu

- Tạo nhịp quay lại app hằng tuần
- Giữ tính vui và nhẹ

#### Đề xuất

- Mỗi tuần sinh `1-2 voucher nhỏ`
- Ưu tiên loại:
  - `nhanh tay`
  - hoặc `dùng chung`

#### Ví dụ weekly voucher

- được chọn món ăn cuối tuần
- miễn một việc nhỏ
- được chọn phim tối nay
- được ôm thêm 10 phút

### 21.8 Monthly voucher flow

#### Mục tiêu

- Tạo cảm giác đáng mong chờ
- Giá trị cao hơn weekly

#### Đề xuất

- Mỗi tháng sinh `1 voucher lớn`
- Không mặc định là tặng cho `Ni`
- Có thể random:
  - đích danh
  - nhanh tay
  - dùng chung

#### Ví dụ monthly voucher

- một buổi date do người kia lên kế hoạch
- miễn một “nhiệm vụ khó”
- một tối ưu tiên riêng
- một đặc quyền lớn hơn weekly voucher

### 21.9 Trạng thái voucher nên có

- `Chờ nhận`
- `Đã nhận`
- `Đang giữ`
- `Sắp hết hạn`
- `Đã dùng`
- `Đã hết hạn`

### 21.10 Card UI của voucher nên có gì

- loại voucher:
  - đích danh
  - nhanh tay
  - chung
- ai tặng ai hoặc ai đang giữ
- tiêu đề
- mô tả ngắn
- thời gian còn lại
- trạng thái
- CTA phù hợp:
  - `Nhận`
  - `Xem`
  - `Dùng`
  - `Đã dùng`

### 21.11 Detail sheet của voucher

- title
- mô tả đầy đủ
- loại voucher
- người tặng
- người nhận hoặc người đang giữ
- hạn dùng
- trạng thái
- CTA chính

### 21.12 Copy guideline cho voucher

- Với voucher đích danh:
  - thiên về tình cảm
- Với voucher nhanh tay:
  - thiên về vui, nhẹ
- Với voucher chung:
  - thiên về “cùng nhau”

### 21.13 Kết luận wireflow

- Voucher không nên là một luồng duy nhất
- Nên tách rõ:
  - `đích danh`
  - `nhanh tay`
  - `dùng chung`
- Weekly nên playful
- Monthly nên meaningful
- Voucher tạo tay nên luôn cho phép chọn rõ người nhận

---

## 22. Wireflow map privacy

### 22.1 Mục tiêu

- Giữ được chức năng xem vị trí khi cần
- Không để tracking lộ công khai trên map chung
- Tránh gây phản cảm nếu `Ni` dùng máy của bạn
- Bảo vệ cảm giác riêng tư và niềm tin

### 22.2 Nguyên tắc chính

- `Bản đồ yêu thương` là map chung
- tracking vị trí là lớp riêng tư
- không để người dùng nhìn bình thường là biết ngay có chức năng theo dõi

### 22.3 Không nên làm

- Không đặt nút `Tìm Ni` lộ sẵn trên map chung
- Không hiển thị badge kiểu:
  - `đang theo dõi vị trí của Ni`
- Không để marker vị trí thời gian thực hiện ra ngay khi vào map
- Không để copy lộ rõ mục đích tracking trong UI chung

### 22.4 Kiến trúc nên tách 2 lớp

#### Lớp 1: Map chung

- Chỉ hiển thị:
  - địa điểm đã đi
  - địa điểm muốn đi
  - nơi có kỷ niệm
- Đây là màn mà cả `Ni` và `Được` đều có thể mở thoải mái.

#### Lớp 2: Tracking riêng tư

- Là lớp riêng
- Chỉ mở được khi có điều kiện phù hợp
- Không lộ trên UI mặc định

### 22.5 Phương án wireflow đề xuất

#### Phương án tốt nhất: BF private mode

1. Người dùng mở `Bản đồ yêu thương`
2. Màn hình chỉ là map chung
3. Nếu là BF và muốn xem vị trí:
   - vào một entry ẩn hoặc menu phụ
   - xác thực lại bằng PIN BF
4. Sau khi xác thực:
   - mới bật `private tracking mode`
   - mới hiện vị trí hiện tại của `Ni`
5. Khi thoát mode:
   - map quay về trạng thái chung
   - không để lại dấu hiệu rõ ràng

### 22.6 Entry vào private tracking mode

#### Nên dùng một trong các cách sau

##### Cách A: Menu phụ sau xác thực

- Trong map có menu phụ trung tính
- Sau khi mở và xác thực BF mới có tùy chọn tracking

##### Cách B: Long press gesture

- Long press vào vùng logo / header / corner
- Chỉ sau thao tác này mới mở private action

##### Cách C: Hidden command

- Một thao tác không lộ trực quan, ví dụ:
  - chạm nhiều lần vào icon
  - gesture riêng
- Chỉ phù hợp nếu bạn muốn cực kín

### 22.7 Phương án nên chọn

- Nên ưu tiên:
  - **menu phụ trung tính + xác thực PIN**
- Đây là cách an toàn nhất về UX:
  - không quá rối
  - không quá hacky
  - không lộ công khai

### 22.8 Trạng thái của map

#### State 1: Public shared map

- mọi người đều thấy được
- không có dấu hiệu tracking

#### State 2: BF authenticated private mode

- chỉ sau xác thực BF
- mới thấy:
  - vị trí hiện tại của `Ni`
  - thời gian cập nhật
  - nút focus vị trí

#### State 3: Private mode off

- sau khi đóng hoặc timeout
- tự trở lại map chung

### 22.9 Nên có timeout tự động

- Nếu đã vào private mode, nên tự tắt sau:
  - X phút không tương tác
  - hoặc khi rời màn
- Tránh trường hợp để nguyên trạng thái rồi người khác cầm máy thấy.

### 22.10 Copy guideline cho tracking

#### Trên map chung

- Không nhắc gì về tracking

#### Trong private mode

- Dùng copy kín và ngắn:
  - `Vị trí hiện tại`
  - `Cập nhật gần đây`
  - `Tập trung vào vị trí`

#### Không nên dùng

- `Đang theo dõi Ni`
- `Theo dõi vị trí của Ni`
- `Tìm Ni`

vì quá trực diện và dễ gây phản cảm.

### 22.11 Nếu vẫn muốn có nút nhanh

- Có thể vẫn có nút nhanh nhưng:
  - tên trung tính
  - chỉ hiện sau xác thực BF
- Ví dụ:
  - `Chế độ riêng`
  - `Xem thêm`
  - `Vị trí hiện tại`

### 22.12 Indicator trong private mode

- Khi đã vào private mode, bạn vẫn cần biết mình đang ở đó.
- Nhưng indicator này nên:
  - chỉ hiện trong mode
  - rõ với bạn
  - không lộ nếu chưa xác thực

Ví dụ:

- một pill nhỏ:
  - `Private mode`
- hoặc:
  - `Vị trí hiện tại`

### 22.13 Liên quan đến đạo đức sản phẩm

- Tracking là tính năng nhạy cảm
- UX tốt không chỉ là “ẩn đi cho khéo”
- UX tốt là:
  - không làm người kia thấy bị giám sát
  - không để chức năng nhạy cảm chen vào không gian chung
  - chỉ dùng trong ngữ cảnh thật sự cần thiết

### 22.14 Kết luận wireflow map privacy

- Không nên để tracking nằm công khai trong `Bản đồ yêu thương`
- Nên tách:
  - map chung
  - private tracking mode
- Private tracking mode chỉ mở sau xác thực BF
- Có timeout tự tắt
- Copy phải trung tính và kín

---

## 23. Wireflow Home

### 23.1 Mục tiêu

- Mở app là hiểu ngay:
  - ai đang dùng
  - hôm nay của hai người đang thế nào
  - điều gì đang chờ
  - nên làm gì tiếp theo

### 23.2 Cấu trúc màn Home

#### Khối 1: Hero / identity

- Hiển thị:
  - `Góc của Ni` hoặc `Góc của Được`
  - vai trò hiện tại
  - 1 câu định hướng ngắn

#### Khối 2: Hôm nay

- `Hôm nay của Ni`
- `Hôm nay của Được`
- Mỗi người có một tile ngắn:
  - mood gần nhất
  - có vừa cập nhật gì không
  - có điều gì đang chờ không

#### Khối 3: Điều đang chờ giữa hai người

- deep talk chưa trả lời
- voucher chưa nhận
- địa điểm nên đi
- event sắp tới

#### Khối 4: Một bước tiếp theo

- chỉ 1 CTA chính

#### Khối 5: Gần đây

- feed ngắn:
  - ai vừa ghi gì
  - ai vừa làm gì

### 23.3 Flow mở app

1. Mở app
2. Nhìn thấy `góc của ai`
3. Xem nhanh 2 nhịp:
   - Ni
   - Được
4. Nhìn thấy 1 việc đáng làm nhất
5. Chạm để đi tiếp

### 23.4 Empty / partial state

- Nếu chỉ một người có dữ liệu:
  - vẫn giữ chỗ cho người còn lại
- Không collapse giao diện thành một luồng duy nhất

### 23.5 Kết luận

- Home phải là nơi điều hướng bằng ngữ cảnh
- Không phải chỉ là nơi đặt vài shortcut

---

## 24. Wireflow Mood

### 24.1 Mục tiêu

- Làm rõ cảm xúc là của ai
- Ghi mood thật nhanh
- Nhìn lại mood của từng người thật rõ

### 24.2 Cấu trúc màn

#### Khối 1: Người đang ghi

- `Bạn đang ghi với vai trò Ni/Được`

#### Khối 2: Mood picker

- các mood lớn, dễ chạm

#### Khối 3: Hai luồng riêng

- `Cảm xúc của Ni`
- `Cảm xúc của Được`

### 24.3 Flow ghi mood

1. Mở màn mood
2. Thấy rõ mình đang là ai
3. Chọn mood
4. Mood được gắn vào đúng người
5. Màn history cập nhật vào cột tương ứng

### 24.4 Flow xem lại

1. Mở màn mood
2. Nhìn ngay hai cột
3. Biết ai đang ổn, ai cần được chú ý

### 24.5 Kết luận

- Màn mood không nên là một danh sách chung
- Nó phải là hai nhịp cảm xúc đứng cạnh nhau

---

## 25. Wireflow Deep Talk

### 25.1 Mục tiêu

- Biết rõ ai đang nói
- Biết rõ ai đang chờ
- Làm flow chậm, riêng tư, dễ tiếp tục

### 25.2 Cấu trúc màn

#### Tab 1: Đang chờ

- các câu hỏi chưa đủ 2 phía trả lời

#### Tab 2: Đã trả lời

- các câu hỏi cả hai đã hoàn thành

#### Tab 3: Nhật ký riêng

- các entry cá nhân

### 25.3 Card câu hỏi

- nội dung câu hỏi
- trạng thái của `Ni`
- trạng thái của `Được`
- biết rõ:
  - ai đã trả lời
  - ai chưa
  - ai đã chọn nói ngoài đời

### 25.4 Flow trả lời câu hỏi

1. Mở tab `Đang chờ`
2. Chọn câu hỏi
3. Xem chi tiết:
   - câu hỏi
   - phần của Ni
   - phần của Được
4. Nếu mình chưa trả lời:
   - viết câu trả lời
   - hoặc chọn `đã nói ngoài đời`
5. Quay lại list, trạng thái cập nhật

### 25.5 Flow sau khi cả hai đã trả lời

1. Card chuyển sang `Đã trả lời`
2. Có thể:
   - xem lại
   - đánh dấu đáng nhớ
   - gợi ý follow-up

### 25.6 Journal flow

1. Mở tab `Nhật ký riêng`
2. Mỗi entry hiển thị rõ người viết
3. Có thể thêm nhanh 1 entry mới

### 25.7 Kết luận

- Deep Talk phải làm rõ “đây là lời của ai”
- Không được giống một list task chung

---

## 26. Wireflow Timeline

### 26.1 Mục tiêu

- Làm timeline giống câu chuyện hơn
- Biết rõ ai đã ghi lại khoảnh khắc đó

### 26.2 Cấu trúc màn

#### Khối 1: Header

- title
- subtitle
- CTA thêm kỷ niệm

#### Khối 2: Story groups

- hôm nay
- tuần này
- tháng này
- trước đó

### 26.3 Card kỷ niệm

- ảnh nếu có
- title
- 1 đoạn ngắn
- mood
- ngày
- nhãn:
  - `Ni ghi lại`
  - `Được ghi lại`

### 26.4 Flow tạo kỷ niệm

1. Bấm thêm
2. Mở sheet / form
3. Tạo kỷ niệm
4. Kỷ niệm tự gắn với người đang tạo
5. Quay lại story flow

### 26.5 Flow xem lại

1. Mở timeline
2. Lướt theo cụm thời gian
3. Chọn kỷ niệm để xem chi tiết

### 26.6 Kết luận

- Timeline phải thiên về “kể lại”
- Không nên giống bảng dữ liệu có ảnh

---

## 27. Wireflow Places

### 27.1 Mục tiêu

- Giúp quyết định đi đâu dễ hơn
- Gắn địa điểm với ký ức và lần hẹn tới

### 27.2 Cấu trúc màn

#### Tab 1: Muốn đi

- những nơi chưa đi

#### Tab 2: Đã đi

- những nơi đã có trải nghiệm

#### Tab 3: Lần tới nên thử

- nơi được gợi ý từ dữ liệu hoặc pin thủ công

### 27.3 Card địa điểm

- tên
- vibe / loại
- note ngắn
- trạng thái
- nếu đã đi:
  - rating
  - memory hook

### 27.4 Flow thêm địa điểm

1. Bấm thêm
2. Nhập tên / nơi / vị trí
3. Chọn trạng thái:
   - muốn đi
   - đã đi
4. Lưu

### 27.5 Flow quyết định nhanh

1. Mở tab `Lần tới nên thử`
2. Chọn 1 nơi từ gợi ý
3. Đi tiếp sang map / event / note

### 27.6 Kết luận

- Places không chỉ là list quán ăn
- Nó nên giúp ra quyết định cho lần tới

---

## 28. Wireflow Wishlist

### 28.1 Mục tiêu

- Phân rõ ai muốn gì
- Không để wishlist thành một list lẫn lộn

### 28.2 Cấu trúc màn

- `Ni muốn`
- `Được muốn`
- `Đang chuẩn bị`

### 28.3 Flow

1. Tạo item mới
2. Chọn item thuộc về ai
3. Lưu
4. Nếu có người đang chuẩn bị cho item đó, trạng thái hiển thị riêng

### 28.4 Kết luận

- Wishlist phải rõ owner

---

## 29. Wireflow Events

### 29.1 Mục tiêu

- Biết ngày nào đang tới
- Biết ngày đó liên quan tới ai hoặc có ý nghĩa gì

### 29.2 Cấu trúc màn

- upcoming
- past
- important dates

### 29.3 Card event

- title
- countdown
- ngày
- note ngắn
- nhãn:
  - ai tạo
  - dành cho ai
  - loại event

### 29.4 Flow

1. Tạo event
2. Chọn loại
3. Chọn người liên quan
4. Lưu

### 29.5 Kết luận

- Event không chỉ là lịch
- Nó là một phần nhịp sống của hai người

---

## 30. Wireflow Challenges

### 30.1 Mục tiêu

- Làm challenge mang nghĩa “điều cùng làm”
- Bớt giống hệ thống nhiệm vụ

### 30.2 Nhóm challenge

- cùng nhau
- Ni dành cho Được
- Được dành cho Ni

### 30.3 Flow

1. Tạo challenge
2. Chọn loại
3. Chọn mức độ / thưởng nếu có
4. Hoàn thành
5. Có thể mở ra voucher hoặc reward khác

### 30.4 Kết luận

- Challenge nên hỗ trợ kết nối, không chỉ tăng điểm

---

## 31. Wireflow shared identity system

### 31.1 Mục tiêu

- Mọi màn dùng cùng một logic hiển thị `Ni` và `Được`

### 31.2 Thành phần chung

- person badge
- person label
- creator label
- owner label
- waiting status

### 31.3 Rule

- Nếu nội dung có người tạo:
  - luôn hiện creator
- Nếu nội dung có người sở hữu:
  - luôn hiện owner
- Nếu nội dung có trạng thái chờ:
  - luôn hiện chờ phía nào

### 31.4 Kết luận

- Đây là lớp nền, không phải một màn riêng
- Nếu không làm lớp này trước, các màn sau sẽ dễ lệch nhau

---

## 32. Wireflow navigation / app shell

### 32.1 Mục tiêu

- Điều hướng rõ
- ít mục chính
- giảm cảm giác app bị dàn trải

### 32.2 Cấu trúc navigation

#### Bottom nav

- `Trang chủ`
- `Kỷ niệm`
- `Địa điểm`
- `Thêm`

### 32.3 `Thêm` sheet

- nhóm theo intent:
  - cảm xúc và trò chuyện
  - hẹn hò và ý tưởng
  - tiện ích

### 32.4 Flow

1. Người dùng ở màn bất kỳ
2. Muốn làm việc chính:
   - dùng bottom nav
3. Muốn vào chức năng phụ:
   - mở `Thêm`
4. Chọn nhóm
5. Đi vào màn tương ứng

### 32.5 Header shell

- luôn có:
  - app identity
  - góc của ai
  - ngữ cảnh màn hiện tại

### 32.6 Kết luận

- Navigation phải ưu tiên nhịp dùng hằng ngày
- Các màn phụ không nên chen ngang bottom nav

---

## 33. Wireflow activity feed

### 33.1 Mục tiêu

- Làm app có cảm giác đang sống
- Nhìn nhanh là biết có gì mới giữa hai người

### 33.2 Các loại activity nên có

- `Ni vừa ghi cảm xúc`
- `Được vừa trả lời câu hỏi`
- `Ni vừa lưu một kỷ niệm`
- `Được vừa tạo voucher`
- `Có voucher mới đang chờ nhận`

### 33.3 Vị trí hiển thị

- Home là nơi chính
- có thể thêm bản rút gọn ở một vài màn liên quan

### 33.4 Flow

1. Có hành động mới trong app
2. Sinh một activity item
3. Home hiển thị trong khối `Gần đây`
4. Người dùng chạm vào để đi thẳng tới nội dung liên quan

### 33.5 Quy tắc

- activity phải ngắn
- rõ ai làm gì
- không trùng lặp quá nhiều

### 33.6 Kết luận

- Activity feed là lớp kết dính rất tốt giữa các màn

---

## 34. Wireflow notification / reminder UX

### 34.1 Mục tiêu

- Nhắc đúng lúc
- không gây áp lực
- không làm app thành công cụ “đòi tương tác”

### 34.2 Các loại reminder nên có

- check-in mood nhẹ
- câu hỏi Deep Talk đang chờ
- voucher sắp hết hạn
- event sắp tới
- kỷ niệm đúng ngày cũ

### 34.3 Rule nhắc

- không nhắc quá dày
- ưu tiên điều đang thật sự có giá trị
- nhắc theo ngữ cảnh, không random

### 34.4 Tone

- nhẹ
- không trách móc
- không dùng wording gây áp lực kiểu:
  - `bạn chưa làm`
  - `đừng quên`

### 34.5 Flow

1. Hệ thống xác định có điều nên nhắc
2. Sinh reminder
3. Home hoặc notification hiển thị
4. Người dùng mở ra và đi vào đúng flow

### 34.6 Kết luận

- Reminder nên là lời gợi mở, không phải lời thúc ép

---

## 35. Wireflow shared sheets / modal system

### 35.1 Mục tiêu

- Tất cả add / edit / detail flow thống nhất
- dễ dùng trên mobile

### 35.2 Rule chung

- Mobile:
  - ưu tiên bottom sheet
- Desktop:
  - có thể dùng centered modal

### 35.3 Các loại sheet

- add sheet
- edit sheet
- detail sheet
- confirm sheet

### 35.4 Flow mở sheet

1. Người dùng bấm CTA
2. Sheet trượt lên
3. Nội dung rõ
4. CTA chính nằm vùng dễ chạm
5. Đóng dễ dàng

### 35.5 Những điều phải thống nhất

- spacing
- radius
- header
- close action
- CTA position
- scroll region

### 35.6 Kết luận

- Nếu không thống nhất sheet system, app sẽ nhanh chóng rối

---

## 36. Wireflow empty states / zero states

### 36.1 Mục tiêu

- Khi chưa có dữ liệu, app vẫn thấy ấm và có hướng đi tiếp

### 36.2 Rule chung

- empty state phải trả lời:
  - màn này để làm gì
  - hiện tại chưa có gì
  - bước đầu tiên nên làm là gì

### 36.3 Cấu trúc empty state

- icon hoặc hình nhẹ
- title ngắn
- 1 câu giải thích
- 1 CTA rõ

### 36.4 Không nên làm

- `Chưa có dữ liệu`
- `Danh sách trống`
- `Không có gì ở đây`

nếu không có thêm ngữ cảnh.

### 36.5 Ví dụ tốt

- `Chưa có cảm xúc nào từ Ni`
- `Được chưa ghi lại kỷ niệm nào ở đây`
- `Chưa có voucher nào đang chờ nhận`

### 36.6 Kết luận

- Empty state là một phần của sản phẩm, không phải fallback kỹ thuật

---

## 37. Wireflow auth / role switching

### 37.1 Mục tiêu

- Luôn rõ app đang ở góc nhìn của ai
- đổi người dùng an toàn
- không làm role switching trở nên mơ hồ

### 37.2 Flow vào app

1. Mở app
2. Nếu chưa xác thực:
   - chọn vai trò
   - nhập PIN nếu cần
3. Vào app với vai trò tương ứng

### 37.3 Flow đổi vai trò

1. Bấm `Đổi người dùng`
2. Xác nhận / nhập PIN nếu cần
3. App đổi shell sang góc nhìn mới

### 37.4 Điều phải rõ

- đang là `Ni` hay `Được`
- màn hiện tại có gì thay đổi theo vai trò hay không

### 37.5 Kết luận

- Vì app này phụ thuộc mạnh vào vai trò, auth/role switching là một flow UX cốt lõi

---

## 38. Wireflow reward / trigger system

### 38.1 Mục tiêu

- Kết nối các hệ thống lại với nhau
- tạo nhịp sử dụng tự nhiên hơn

### 38.2 Các trigger có thể có

- hoàn thành challenge
- cả hai cùng trả lời Deep Talk
- check-in mood đều trong tuần
- hoàn thành một event

### 38.3 Reward có thể mở ra

- voucher
- prompt mới
- challenge mới
- gợi ý date mới
- memory highlight

### 38.4 Rule

- reward phải vừa đủ
- không nên biến app thành game

### 38.5 Flow

1. Người dùng hoàn thành một hành động có ý nghĩa
2. Hệ thống kiểm tra trigger
3. Nếu hợp lý, mở reward nhẹ
4. Home hoặc màn liên quan hiển thị kết quả

### 38.6 Kết luận

- Reward nên làm app có nhịp hơn, không nên chiếm vai chính
