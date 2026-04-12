# Report: DeepTalk And Timeline V2

## Phần đã hoàn thành

- Thay `DeepTalk` cũ bằng `DeepTalkV2`.
- Thay `Timeline` cũ bằng `TimelineV2`.
- Hai màn này là trọng tâm clarity pass trong roadmap phase 1.

## File chính đã làm

- `frontend/src/pages/DeepTalkV2.tsx`
- `frontend/src/pages/TimelineV2.tsx`
- `frontend/src/components/SheetDialog.tsx`
- `backend/src/models/DeepTalkQuestionRecord.ts`
- `backend/src/models/MemoryRecord.ts`

## Chi tiết thay đổi

### 1. Deep Talk clarity pass

- Chia lại tab theo đúng logic sử dụng:
  - `Đang chờ`
  - `Đã trả lời`
  - `Nhật ký riêng`
- Mỗi card câu hỏi hiện rõ:
  - ai là người mang câu hỏi vào app
  - trạng thái của `Ni`
  - trạng thái của `Được`
  - overall state của câu hỏi
- Detail sheet mới cho câu hỏi:
  - hiển thị hai phía tách bạch
  - cho trả lời bằng text
  - hoặc đánh dấu `Đã nói ngoài đời`
- Flow thêm câu hỏi và thêm nhật ký đã dùng shared sheet system.

### 2. Timeline clarity pass

- Bỏ timeline zigzag kiểu cũ.
- Chuyển sang story groups theo thời gian:
  - `Hôm nay`
  - `Tuần này`
  - `Tháng này`
  - `Trước đó`
- Mỗi memory card hiện rõ:
  - ai ghi lại
  - mood
  - ngày
  - ảnh nếu có
  - đoạn kể ngắn
- Tạo detail sheet riêng cho memory.
- Tạo editor sheet chung cho thêm/sửa memory.
- Khi tạo memory mới, frontend đã gửi `createdBy` theo role hiện tại.

### 3. Shared sheet/modal system áp dụng thực tế

- `DeepTalkV2` dùng `SheetDialog` cho:
  - add question
  - add journal
  - question detail
- `TimelineV2` dùng `SheetDialog` cho:
  - add/edit memory
  - memory detail

## Kết quả đạt được

- Deep Talk đã bớt cảm giác admin/task manager.
- Timeline đã bớt cảm giác bảng dữ liệu và gần story flow hơn.
- Cả hai màn đều biết rõ dữ liệu đến từ ai, không còn chỉ dựa vào màu hoặc đoán ngầm.

## Phần chưa làm ở cụm này

- `Save for later` cho Deep Talk chưa có schema riêng.
- Follow-up actions sau khi cả hai đã trả lời vẫn chưa triển khai.
- Timeline chưa có reaction / highlight memory / resurfacing của phase sau.
