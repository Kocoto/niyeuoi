# Implementation Roadmap 3 Giai Đoạn

## Mục tiêu

Roadmap này chọn ra các hạng mục đáng làm nhất từ `UI_UX_IDEAS.md`, sắp theo thứ tự triển khai thực tế trong codebase để:

- không làm vỡ cấu trúc hiện tại
- tạo giá trị UI/UX rõ ngay từ sớm
- xây đúng lớp nền trước khi mở rộng tính năng

Nguyên tắc sắp xếp:

- Giai đoạn 1: xây nền và sửa các điểm gây nhầm lẫn lớn nhất
- Giai đoạn 2: tăng chiều sâu sử dụng hằng ngày
- Giai đoạn 3: hoàn thiện nhịp sản phẩm và cá nhân hóa

---

## Giai đoạn 1: Nền Tảng Nhận Diện Và Luồng Cốt Lõi

### Mục tiêu

- Làm app rõ ràng ngay về mặt `Ni` và `Được`
- Xóa các điểm mơ hồ gây hiểu sai dữ liệu
- Chuẩn hóa shell và shared UI để các màn sau không bị lệch nhau

### Hạng mục chính

#### 1. Shared identity system

- Chuẩn hóa:
  - person badge
  - role label
  - creator label
  - owner label
  - waiting status
- Áp dụng thống nhất trên toàn app

#### 2. Creator / owner metadata cho dữ liệu cốt lõi

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

#### 4. Mood flow hoàn chỉnh

- Tách rõ:
  - `Cảm xúc của Ni`
  - `Cảm xúc của Được`
- Mood phải gắn người tạo rõ ràng

#### 5. Deep Talk clarity pass

- Tách rõ:
  - ai đã trả lời
  - ai chưa trả lời
  - ai đã nói ngoài đời
- Làm lại thông tin trạng thái theo người

#### 6. Timeline clarity pass

- Mỗi kỷ niệm phải hiện rõ ai ghi lại
- Tổ chức lại story grouping nhẹ nếu đủ thời gian

#### 7. Shared sheet / modal system

- Chuẩn hóa bottom sheet và modal behavior cho mobile-first

#### 8. Copy audit vòng 1

- Loại bỏ:
  - tiếng Anh còn sót
  - wording mơ hồ
  - role wording kiểu kỹ thuật

### Vì sao giai đoạn này đứng đầu

- Đây là lớp nền.
- Nếu chưa làm phần này, mọi cải tiến sâu hơn sau đó sẽ bị lệch hoặc phải sửa lại.

### Outcome mong muốn

- Người dùng mở app là biết đang ở góc nhìn của ai
- Không còn cảm giác dữ liệu “không biết là của ai”
- Home đủ dùng như màn bắt đầu chính
- Mood / Deep Talk / Timeline trở thành các flow có danh tính rõ ràng

---

## Giai đoạn 2: Nhịp Sử Dụng Hằng Ngày Và Kết Nối Các Màn

### Mục tiêu

- Khiến app có lý do quay lại thường xuyên
- Làm các màn bắt đầu liên kết với nhau
- Chuyển từ “nhiều tính năng” sang “một hệ trải nghiệm có nhịp”

### Hạng mục chính

#### 1. Activity feed

- Tạo luồng `vừa rồi` trên Home:
  - ai vừa ghi gì
  - ai vừa làm gì
  - có gì mới đang chờ

#### 2. Places redesign

- Tách rõ:
  - `Muốn đi`
  - `Đã đi`
  - `Lần tới nên thử`
- Gắn địa điểm với note / memory / reason

#### 3. Wishlist redesign

- Tách owner rõ ràng:
  - `Ni muốn`
  - `Được muốn`
  - `Đang chuẩn bị`

#### 4. Events redesign

- Hiển thị rõ:
  - ai tạo
  - ngày này dành cho ai
  - ý nghĩa ngày đó

#### 5. Challenges redesign

- Bớt cảm giác “game nhiệm vụ”
- Tăng nghĩa:
  - cùng nhau
  - Ni dành cho Được
  - Được dành cho Ni

#### 6. Empty states / zero states pass

- Làm lại empty state toàn app
- Biến empty state thành lời mời bắt đầu đúng ngữ cảnh

#### 7. Navigation / app shell refinement

- Tối ưu:
  - `Thêm`
  - recently used destinations
  - cross-links giữa các màn

#### 8. Notification / reminder UX

- Chỉ giữ reminder có giá trị
- Tạo ngôn ngữ nhắc nhẹ, không áp lực

### Vì sao giai đoạn này ở giữa

- Sau khi nền nhận diện đã rõ, app cần được “nối mạch”.
- Giai đoạn này biến app thành một hệ sinh thái có lý do quay lại.

### Outcome mong muốn

- App có nhịp sống hằng ngày rõ hơn
- Các màn không còn tách rời
- Người dùng hiểu vì sao nên mở app lại

---

## Giai đoạn 3: Riêng Tư, Reward, Và Cá Nhân Hóa Sâu

### Mục tiêu

- Hoàn thiện các tính năng nhạy cảm
- Tạo chiều sâu mà không phá cảm giác riêng tư
- Bổ sung các lớp “surprise and return” một cách có kiểm soát

### Hạng mục chính

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

### Vì sao giai đoạn này để sau

- Đây là lớp nâng cao.
- Nếu làm quá sớm sẽ tăng độ phức tạp khi nền dữ liệu và UI chưa ổn định.

### Outcome mong muốn

- App có chiều sâu và nhịp quay lại tốt
- Các tính năng nhạy cảm được xử lý đúng tinh thần riêng tư
- Reward và personalization giúp app sống hơn mà không phản cảm

---

## Ưu tiên triển khai thực tế trong codebase

### Sprint mở đầu nên bắt đầu bằng gì

1. Shared identity system
2. Creator metadata cho memory / deep talk / wishlist / events / coupons
3. Home v2 hoàn chỉnh
4. Deep Talk clarity pass
5. Timeline clarity pass

### Sau đó mới nên làm

1. Places / Wishlist / Events / Challenges redesign
2. Activity feed
3. Empty state pass
4. Reminder UX

### Cuối cùng mới nên chạm mạnh vào

1. Map privacy
2. Voucher system redesign
3. Reward / trigger layer
4. Smart suggestions

---

## Kết luận

Nếu bắt đầu làm thật trong codebase, nên triển khai theo thứ tự:

- **Giai đoạn 1** để sửa những chỗ gây nhầm lẫn lớn nhất và xây lớp nền
- **Giai đoạn 2** để app có nhịp dùng hằng ngày và các màn liên kết chặt hơn
- **Giai đoạn 3** để hoàn thiện phần riêng tư, reward, và cá nhân hóa

Thứ tự này giúp tránh làm các tính năng “hấp dẫn” quá sớm trong khi nền nhận diện và cấu trúc trải nghiệm vẫn chưa đủ chắc.
