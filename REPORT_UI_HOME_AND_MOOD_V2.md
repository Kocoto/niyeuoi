# Report: Home And Mood V2

## Phần đã hoàn thành

- Thay `Home` cũ bằng `HomeV2`.
- Thay `MoodLofi` cũ bằng `MoodV2`.
- Hai màn này đã đi đúng hướng roadmap phase 1:
  - rõ góc nhìn `Ni` / `Được`
  - bớt cảm giác app là tập hợp shortcut
  - rõ “hôm nay của ai” thay vì một luồng chung

## File chính đã làm

- `frontend/src/pages/HomeV2.tsx`
- `frontend/src/pages/MoodV2.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/NavbarV2.tsx`

## Chi tiết thay đổi

### 1. Home v2

- Hero mới theo role hiện tại, không còn kiểu landing mơ hồ.
- Tách phần `Hôm nay` thành hai khối riêng:
  - `Góc của Ni`
  - `Góc của Được`
- Mỗi khối hiện:
  - cảm xúc gần nhất
  - kỷ niệm gần nhất
  - số việc còn chờ
- Thêm khối `Điều đang chờ giữa hai người` để gom:
  - câu hỏi Deep Talk còn dang dở
  - địa điểm chưa chốt
  - check-in còn thiếu
- Thêm khối `Một việc đủ rõ` để giữ đúng nguyên tắc one dominant action.
- Thêm feed `Gần đây` từ:
  - mood
  - memory
  - deep talk answers

### 2. Mood v2

- Bỏ cách ghi mood kiểu click phát là lưu ngay mà không có ngữ cảnh.
- Chuyển sang flow:
  - chọn mood
  - thêm note ngắn
  - lưu có chủ đích
- Tách rõ hai cột:
  - `Cảm xúc của Ni`
  - `Cảm xúc của Được`
- Thêm khối `Nhịp chung` để nhìn ngay cảm xúc gần nhất của hai người.
- Có support suggestion nhẹ khi người còn lại đang `Hơi buồn` hoặc `Mệt mỏi`.

### 3. Navigation shell đi kèm

- `NavbarV2` giữ rõ:
  - góc hiện tại của ai
  - màn hiện tại đang làm gì
  - bottom nav 3 mục chính + `Thêm`
- Phần `Thêm` được nhóm theo intent thay vì đổ toàn bộ thành một dãy icon ngang.

## Kết quả đạt được

- Mở app lên đã thấy rõ vai trò hiện tại.
- Home trở thành dashboard đúng nghĩa thay vì chỉ là hub điều hướng.
- Mood không còn là một danh sách chung; đã thành hai nhịp cảm xúc đứng cạnh nhau.

## Phần chưa làm ở cụm này

- `Home` mới đã có feed nhẹ, nhưng chưa phải activity feed đầy đủ của phase 2.
- `Mood` chưa có reminder/gentle nudges tự động từ backend.
