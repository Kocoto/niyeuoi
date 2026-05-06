# Copy Audit — Ngôn ngữ và Giọng điệu App

## Mục đích file này

Tài liệu này ghi lại các vấn đề copy (ngôn ngữ hiển thị cho người dùng) đang tồn tại trong codebase, cùng hướng sửa cụ thể và bảng chuẩn hóa thuật ngữ.

Đọc file này trước khi chạm vào bất kỳ string hiển thị nào trong frontend.

---

## Tại sao copy hiện tại có vấn đề

App được viết theo kiểu developer viết implementation notes rồi paste thẳng vào JSX. Kết quả là người dùng đọc những dòng giải thích tại sao hệ thống làm việc theo cách đó, thay vì cảm nhận điều gì đó.

Hai người dùng app này là một cặp đôi. Họ không cần biết "lớp này đọc từ backend", không cần biết "hai nhịp tách rõ", không cần biết "dữ liệu cũ chưa rõ ai lưu". Họ chỉ cần cảm thấy app hiểu mình và dẫn họ đi đúng chỗ.

---

## Hai loại lỗi chính

### Loại 1: Developer rationale copy — giải thích hệ thống thay vì nói với người dùng

Copy kiểu này nghe như người viết code đang giải thích thiết kế cho đồng nghiệp, không phải nói với người yêu.

**Ví dụ thực tế trong codebase:**

| Đang hiển thị | Người dùng nghe thấy gì | Nên là |
|---|---|---|
| `"Lớp này đọc từ backend để Home không tự đoán: hôm nay ai đã có nhịp riêng, điều gì đang chờ, và bước nào đáng mở tiếp."` | Không hiểu tại sao app giải thích cách app hoạt động cho mình | `"Hôm nay mỗi người đang ở đâu, và điều gì còn chờ giữa hai người."` |
| `"Hai nhịp tách rõ, không còn một khối chung"` | Nghe như architecture decision, không phải lời chào | `"Hôm nay của hai người"` |
| `"Hai phía rõ ràng, một bước nhẹ"` | Vẫn không rõ điều này có nghĩa gì với mình | `"Hôm nay ai cần gì"` hoặc `"Nhịp hôm nay"` |
| `"Reward chỉ nên là lời gợi mở nhẹ sau một điều vừa được khép lại, không phải một lớp nhiệm vụ mới."` | App đang thanh minh về design của mình | `"Điều vừa mở ra sau khi hai người hoàn thành."` |
| `"Home chỉ đặt lại ở đây khi backend thấy một ngày hoặc dấu ghim thật sự có ngữ cảnh. Không phải lời nhắc phải làm gì ngay."` | App giải thích logic lọc dữ liệu | `"Một kỷ niệm cũ vừa quay lại đúng ngày."` |
| `"Home chỉ đọc những gợi ý backend đã thấy có ngữ cảnh, rồi đặt lại tối đa vài bước nhỏ để hai người tự chọn."` | App giải thích nguồn dữ liệu | `"Một hướng nhỏ từ những gì hai người đang có."` |
| `"Khi có mood, Deep Talk, kỷ niệm, kế hoạch, challenge hoặc voucher mới, phần này sẽ hiện đúng phía của người đó."` | Đọc documentation về empty state | Xóa đi hoặc thay bằng lời mời bắt đầu |
| `"Trang chủ cần giữ riêng góc của bạn, nhưng vẫn cho thấy điều gì đang chờ giữa hai người để không còn cảm giác một khối chung mơ hồ."` | Home đang giải thích thiết kế của Home | `"Mở ra là thấy hôm nay của cả hai."` |
| `"Home giờ nên dẫn lại đúng ngữ cảnh: ai vừa cập nhật gì, phía nào còn đang chờ, và việc nào đáng làm nhất ngay lúc này."` | "Home giờ nên" — ai nói vậy? | `"Ai vừa làm gì, điều gì còn đang chờ."` |

### Loại 2: Technical fallback copy — hiện thẳng lỗi dữ liệu lên màn hình

Khi một bản ghi cũ không có đủ metadata, code hiện thẳng trạng thái kỹ thuật ra UI.

**Ví dụ thực tế:**

| Đang hiển thị | Vấn đề | Nên là |
|---|---|---|
| `"Bản ghi cũ chưa rõ người"` | Người dùng không biết "bản ghi cũ" là gì | Ẩn badge hoặc hiện `"Đã lưu trước đây"` |
| `"Dữ liệu cũ chưa rõ ai lưu"` | Người dùng không quan tâm đến source | Ẩn hoặc hiện `"Một kỷ niệm cũ"` |
| `"Record cũ chưa rõ ai tạo"` | "Record" là từ kỹ thuật | Ẩn hoặc hiện `"Đã thêm trước đây"` |
| `"Record cũ chưa rõ ai khởi xướng"` | Tương tự | Ẩn hoặc `"Thử thách cũ"` |
| `"Từ dữ liệu của"` (trong badge) | Nghe như database query | `"Liên quan đến"` hoặc bỏ hẳn |
| `"Từ dữ liệu thật"` (trong badge) | Tại sao phải nói là "thật"? | Bỏ badge này |
| `"Chưa có nhịp mới cần kéo ra; Home vẫn giữ chỗ nhẹ nhàng."` | Semicolon + giọng kỹ thuật | `"Chưa có gì mới từ phía này hôm nay."` |

---

## Lỗi tiếng Anh hoặc tiếng Việt không dấu

### Thuật ngữ cần chốt — dùng gì nhất quán

| Đang dùng | Đề xuất chuẩn | Ghi chú |
|---|---|---|
| `"check-in"` | `"ghi nhận"` hoặc `"ghi cảm xúc"` | Dùng trong copy, không phải nav |
| `"Feed"` | `"Vừa rồi"` hoặc `"Hoạt động gần đây"` | Heading section |
| `"Reward"` | `"Điều vừa mở ra"` hoặc `"Nhịp nhỏ"` | Tránh "thưởng" vì nghe như game |
| `"backend"` | **Không bao giờ xuất hiện trong UI** | Xóa hoàn toàn khỏi copy |
| `"metadata"` | **Không bao giờ xuất hiện trong UI** | Xóa hoàn toàn khỏi copy |
| `"Record cũ"` | **Không bao giờ xuất hiện trong UI** | Dùng fallback trung tính |
| `"Dữ liệu cũ"` | **Không bao giờ xuất hiện trong UI** | Dùng fallback trung tính |
| `"Quick Decision Mode"` | `"Chọn nhanh"` | Places.tsx |
| `"Deep Talk"` | Giữ nguyên là tên tính năng | Nhưng đừng dùng trong câu như `"check Deep Talk"` |
| `"Timeline"` | `"Dòng kỷ niệm"` trong copy mô tả | `"Timeline"` có thể giữ làm tên nav |
| `"Mood"` | `"Cảm xúc"` trong copy mô tả | `"Mood"` có thể giữ làm tên nav |
| `"Challenge"` / `"Challenges"` | `"Thử thách"` trong copy mô tả | `"Challenge"` có thể giữ làm tên nav |
| `"Places"` | `"Địa điểm"` trong copy mô tả | `"Places"` có thể giữ làm tên nav |
| `"Wishlist"` | `"Điều muốn làm"` hoặc `"Danh sách ao ước"` trong copy | `"Wishlist"` có thể giữ làm tên nav |
| `"Events"` | `"Ngày đặc biệt"` hoặc `"Sự kiện"` trong copy | `"Events"` có thể giữ làm tên nav |
| `"Coupons"` / `"voucher"` | `"Voucher"` là đủ, không cần "coupon" | Thống nhất một từ |
| `"Nhịp thưởng"` | `"Điều vừa mở ra"` hoặc xóa | Nghe như game |

### Quy tắc chốt về nav labels

Tên màn trong nav bar (`Mood`, `Timeline`, `Deep Talk`, v.v.) có thể giữ tiếng Anh nếu đây là tên tính năng riêng của app — nhưng copy mô tả bên dưới phải là tiếng Việt hoàn toàn, không lẫn.

---

## Vấn đề ngôi xưng

Ngoài Deep Talk (đã sửa ở D2), vẫn còn "bạn" xuất hiện ở những chỗ nên dùng giọng thân mật hơn:

| Vị trí | Đang dùng | Nên là |
|---|---|---|
| `Home.tsx` PersonBadge prefix | `"Bạn đang là"` | `"Em đang là"` / `"Anh đang là"` tùy role, hoặc bỏ prefix |
| `Home.tsx` PersonBadge prefix | `"Bạn đang ở"` | Tương tự |
| `Home.tsx` nextStep fallback | `"phía bạn"`, `"bạn có thể"` | Dùng tên role: `"phía Ni"`, `"phía Được"` hoặc không có đại từ |
| `Home.tsx` coupon copy | `"Có một voucher đang nằm yên chờ bạn mở"` | `"Có một voucher đang chờ."` |
| `Home.tsx` feed description | `"bạn có thể bắt đầu"` | Bỏ hoặc đổi |

---

## Danh sách file cần sửa theo mức độ ưu tiên

### Ưu tiên 1 — thấy ngay khi mở app

- `frontend/src/pages/Home.tsx` — nhiều nhất, cả developer rationale lẫn technical fallback

### Ưu tiên 2 — thấy khi dùng tính năng cụ thể

- `frontend/src/pages/Places.tsx` — "Quick Decision Mode", technical fallback
- `frontend/src/pages/Wishlist.tsx` — technical fallback, "createdBy/owner" rò rỉ
- `frontend/src/pages/Events.tsx` — "Record cũ chưa rõ ai tạo"
- `frontend/src/pages/Challenges.tsx` — "Record cũ", "Nhịp thưởng"
- `frontend/src/pages/Coupons.tsx` — "LOVE-" prefix, technical terms

### Ưu tiên 3 — ít thấy hơn

- `frontend/src/pages/MoodLofi.tsx` — "check-in", "wording trung tính"
- `frontend/src/pages/DeepTalk.tsx` — "check-in"
- `frontend/src/pages/Timeline.tsx` — kiểm tra lại nhưng ít vấn đề hơn

---

## Nguyên tắc viết copy cho app này

1. **Không giải thích hệ thống** — người dùng không cần biết tại sao app hiển thị điều đó
2. **Không để lộ trạng thái dữ liệu kỹ thuật** — "Record cũ", "metadata", "backend" không bao giờ xuất hiện
3. **Tiếng Việt hoàn toàn trong copy mô tả** — tên tính năng (nav labels) có thể giữ English nếu là brand riêng
4. **Ngôi xưng rõ** — dùng "Ni", "Được", "em", "anh" thay vì "bạn" trong ngữ cảnh thân mật
5. **Fallback luôn trung tính** — khi không có dữ liệu, không hiện lỗi kỹ thuật mà hiện lời mời hoặc ẩn đi
6. **Heading không phải kiến trúc** — h2 phải là điều người dùng cảm thấy, không phải mô tả cấu trúc màn hình

---

## Liên kết với roadmap

- Slices tương ứng trong `NEXT_STEP.md`: `E1`, `E2`, `E3`, `E4`
- Phase này là Phase E trong `IMPLEMENTATION_ROADMAP.md`
- Không đụng schema, API, hay logic — chỉ chạm string literals trong frontend
