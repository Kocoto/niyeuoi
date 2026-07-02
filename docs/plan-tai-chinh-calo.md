# Kế hoạch: Tài chính cá nhân (50/30/20 + Nợ + Bán‑tự‑động) & Quản lý Calo

> **File này là nguồn sự thật về plan + tiến độ.** Sau mỗi mục hoàn thành: tick `[x]` ở phần Checklist + ghi ngày + commit. Đầu mỗi phiên đọc Checklist là biết mục kế tiếp. Xem thêm memory `plan-tai-chinh-calo.md`.

## Context (Vì sao làm)

App Niyeuoi hiện đã có hệ chi tiêu **khá đầy đủ**: ví (chung / boyfriend / girlfriend), 9 danh mục mặc định, ngân sách theo danh mục/tháng, mục tiêu tiết kiệm, giao dịch định kỳ (cron 7h sáng), quick preset, AI Gemini (OCR hoá đơn + tóm tắt tháng), báo cáo/xu hướng/CSV.

Người dùng muốn nâng cấp mảng **quản lý tài chính cá nhân** cho sát thực tế của mình:
- Lương **16.400.000đ/tháng** (người dùng tự nhập trong app, không hard‑code), đang có **nợ tín dụng phải trả hàng tháng** (nhập tổng nợ + số phải trả/tháng).
- Chia tiền theo **50/30/20**: Thiết yếu 50% · Mong muốn & hẹn hò 30% · Tiết kiệm/đầu tư 20% — nhưng **trừ khoản trả nợ ra trước**, phần còn lại mới chia.
- **Bán tự động ghi chi tiêu** từ thông báo ngân hàng (chia sẻ nội dung sang app → AI đọc số tiền → tạo giao dịch nháp → app hỏi "chi cho gì").
- Thêm **quản lý calo cho cả 2 người**.

**Quyết định đã chốt (hỏi/đáp):** giữ TẤT CẢ trong 1 app Niyeuoi · automation làm bản bán‑tự‑động trước · nợ tách nhóm trừ trước · calo cho cả 2 vai + AI ước tính · thêm cả 4 đề xuất bổ sung (A6).

Nguyên tắc: **tái dùng hạ tầng sẵn có** (auth PIN, `src/api/api.ts`, `aiService`, `schedulerService`, pattern route→controller→service→model, feature‑folder `components/<feature>/`). Chỉ mảng calo là subsystem mới cần mục riêng.

---

## Giai đoạn A — Khung 50/30/20 + Quản lý Nợ (ưu tiên, thuần backend + web, OTA được)

### A1. Danh mục gắn "nhóm" (bucket)
- Thêm field `bucket: 'needs' | 'wants' | 'savings'` vào `backend/src/models/ExpenseCategory.ts` (default `'needs'`).
- Gán bucket cho 9 danh mục mặc định trong `expenseCategoryService.ts` (seed): Ăn uống/Nhà cửa/Đi lại/Y tế → **needs**; Giải trí/Đi hẹn hò/Mua sắm → **wants**; Tiết kiệm → **savings**; Khác → **needs**.
- Cho phép đổi bucket khi tạo/sửa danh mục (thêm vào `TransactionForm`/màn quản lý danh mục + `expenseApi.ts`).

### A2. Hồ sơ thu nhập + tỉ lệ (model mới `BudgetPlan`)
- `backend/src/models/BudgetPlan.ts`: `{ owner: 'shared'|Role, monthlyIncome, needsPct(50), wantsPct(30), savingsPct(20), createdBy, timestamps }` — 1 bản ghi / owner (upsert). **Người dùng tự nhập lương** qua `PlanForm` (không điền sẵn); tỉ lệ mặc định 50/30/20 nhưng chỉnh được.
- Service mới `backend/src/services/budgetPlanService.ts`:
  - `getAllocation(owner, month, year)` → trả về `{ income, debtTotal, disposable = income - debtTotal, buckets: { needs, wants, savings: { target, spent, remaining, percentage } }, daysLeft, dailyAllowance }`.
  - `target` mỗi nhóm = `disposable * pct`. `spent` lấy từ giao dịch expense trong tháng, nhóm theo `category.bucket` — **tái dùng aggregation** trong `expenseTransactionService.getSpendingByCategory()`.

### A3. Quản lý Nợ (model + service mới)
- `backend/src/models/Debt.ts`: `{ name, creditor?, totalAmount, remainingAmount, monthlyPayment, dueDayOfMonth(1-31), interestRate?, owner, walletId?, isActive, createdBy, timestamps }`. **Người dùng nhập tổng nợ + số phải trả/tháng** (lãi suất tuỳ chọn, dùng cho dự báo A6).
- `backend/src/services/expenseDebtService.ts`: CRUD + `pay(debtId, amount, walletId)` = tạo 1 giao dịch expense (danh mục "Trả nợ") **atomic** (dùng session như `adjustBalance`) + trừ `remainingAmount`; đóng `isActive` khi về 0.
- `debtTotal` trong A2 = tổng `monthlyPayment` của các nợ `isActive` cùng owner → đây là phần **trừ trước** khi chia 50/30/20.
- Cron nhắc hạn trả nợ: thêm job trong `schedulerService.ts` bắn Discord khi gần `dueDayOfMonth` (theo pattern `recurringRuleService`).

### A6. Đề xuất tài chính bổ sung (đã chốt thêm cả 4)
- **Quỹ dự phòng riêng:** thêm field `type: 'normal' | 'emergency'` vào `models/SavingsGoal.ts` (default `'normal'`); `ExpenseSavings.tsx` + `SavingsGoalCard.tsx` phân biệt quỹ dự phòng (badge riêng, gợi ý mục tiêu = 3–6× chi phí thiết yếu tháng lấy từ allocation). Không tạo model mới — tái dùng `savingsGoalService`.
- **Dự báo & chiến lược trả nợ:** trong `expenseDebtService.ts` thêm `getPayoffProjection(owner)` → mỗi khoản tính số tháng còn lại + tổng lãi (từ `remainingAmount`, `monthlyPayment`, `interestRate`); nếu ≥2 khoản, trả về gợi ý thứ tự **snowball** (nợ nhỏ trước) và **avalanche** (lãi cao trước). Endpoint `GET /expenses/debts/projection`. UI: khối tóm tắt trong `ExpenseDebts.tsx`.
- **Còn tiêu/ngày + cảnh báo lố nhóm:** `getAllocation()` (A2) trả thêm `daysLeft` và `dailyAllowance` cho nhóm wants = `remaining / daysLeft`. Cảnh báo bucket: mở rộng logic alert sẵn có trong `expenseTransactionService` (ngưỡng 80%/100%) để bắn Discord theo **nhóm 50/30/20**, không chỉ theo danh mục. `AllocationPanel` hiển thị "còn ~Xk/ngày".
- **AI cố vấn 50/30/20:** trong `aiService.ts` thêm `generateFinanceAdvice({ allocation, debts, savings })` (khuôn như `generateMonthlySummary`) → lời khuyên tiếng Việt theo tình trạng từng nhóm + nợ. Endpoint `GET /expenses/advice?owner&month&year`. UI: tái dùng `AISummaryCard.tsx` (thêm tab/nút "Cố vấn").

### A4. Endpoint & controller (mở rộng file expense sẵn có)
Trong `backend/src/routes/expenseRoutes.ts` + `controllers/expenseController.ts`:
- `GET /expenses/plan` · `POST /expenses/plan` (upsert hồ sơ thu nhập/tỉ lệ)
- `GET /expenses/allocation?owner&month&year` (khung 50/30/20 target vs spent + daysLeft/dailyAllowance)
- `GET/POST /expenses/debts` · `PUT/DELETE /expenses/debts/:id` · `POST /expenses/debts/:id/pay` · `GET /expenses/debts/projection?owner`
- `GET /expenses/advice?owner&month&year` (AI cố vấn)

### A5. Frontend
- `frontend/src/api/expenseApi.ts`: thêm type + hàm cho plan/allocation/debts.
- Component mới trong `frontend/src/components/expenses/`:
  - `AllocationPanel.tsx` — 3 thanh tiến độ (needs/wants/savings) target vs đã chi, dòng "Nợ trừ trước" + "Còn lại chia". Tái dùng `BudgetProgressBar` làm nền.
  - `DebtCard.tsx`, `DebtForm.tsx` — thẻ nợ (còn lại/tháng phải trả/ngày đến hạn + nút "Trả nợ"), form thêm/sửa.
  - `PlanForm.tsx` — nhập lương + tỉ lệ.
- Trang mới `frontend/src/pages/ExpenseDebts.tsx` (danh sách nợ) + khai báo route trong `App.tsx`; `AllocationPanel` nhúng vào đầu `pages/Expenses.tsx`.

---

## Giai đoạn B — Bán tự động ghi chi tiêu từ thông báo

### B1. Backend AI parse (thuần backend, deploy được ngay)
- `backend/src/services/aiService.ts`: thêm `extractTransactionText(rawText)` (theo khuôn `extractReceiptData`), trả `{ amount, type: 'expense'|'income', merchant?, bankName?, date? }`. Prompt hỗ trợ format thông báo bank/ví VN (Techcombank, VPBank, MB, MoMo, ZaloPay…).
- Endpoint `POST /expenses/parse-text` trong controller expense → gọi hàm trên.

### B2. Web nhập nhanh (OTA được, chạy được ngay không cần build lại)
- Component `frontend/src/components/expenses/NotificationImportSheet.tsx`: 1 ô dán nội dung thông báo → gọi `/expenses/parse-text` → prefill `TransactionForm` dạng **nháp** → người dùng chọn danh mục → lưu. Mở từ `QuickAddBar`.

### B3. Android Share target (cần BUILD LẠI APK — không OTA được)
- Cài plugin nhận intent chia sẻ: `send-intent` (thêm vào `frontend/package.json`).
- `frontend/android/app/src/main/AndroidManifest.xml`: thêm `intent-filter` `ACTION_SEND` `text/plain` cho `MainActivity` (giữ nguyên phần Capacitor).
- `frontend/src/utils/nativeApp.ts` (hoặc hook mới): lắng nghe intent nhận được → điều hướng sang màn Import với text đã share → chạy tiếp luồng B2.
- Kết quả: long‑press thông báo ngân hàng → **Chia sẻ → Niyeuoi** → app tự mở, AI đọc số tiền, chỉ cần chọn danh mục.
- Ghi chú: đây là thay đổi native → theo memory `mobile-build-capacitor.md` phải `npm run build → npx cap sync android → gradlew assembleDebug` và **cài lại APK**.

---

## Giai đoạn C — Quản lý Calo (subsystem mới, cho cả 2 người)

Theo quy ước CLAUDE.md: route→controller→service→model riêng + trang + feature‑folder.

### C1. Backend
- Model `backend/src/models/CalorieEntry.ts`: `{ owner: Role, date, mealType: 'breakfast'|'lunch'|'dinner'|'snack', name, calories, protein?, carbs?, fat?, imageUrl?, note?, createdBy, timestamps }`. Index `owner+date`.
- Model `backend/src/models/CalorieGoal.ts`: `{ owner: Role, dailyTarget, createdBy }` (upsert / vai).
- `backend/src/services/calorieService.ts`: CRUD + `getDailySummary(owner, date)` (tổng calo/macro vs target) + `getWeekTrend`.
- `aiService.ts`: thêm `estimateCalories({ description?, imageBase64?, mimeType? })` → `{ calories, protein, carbs, fat, name }` (tái dùng Gemini vision như OCR).
- `backend/src/routes/calorieRoutes.ts` + `controllers/calorieController.ts`, **mount `/api/calories` trong `server.ts`**. Endpoint: `GET/POST /calories`, `PUT/DELETE /calories/:id`, `GET /calories/summary?owner&date`, `GET /calories/goal` + `POST /calories/goal`, `POST /calories/estimate`.

### C2. Frontend
- `frontend/src/api/calorieApi.ts` (dùng chung instance `api.ts`).
- Trang `frontend/src/pages/Calories.tsx` + route trong `App.tsx` + mục trong `Navbar`.
- Feature‑folder `frontend/src/components/calories/`: `CalorieRing` (vòng tiến độ ngày), `MealEntryForm` (nhập tay / mô tả / ảnh → nút "AI ước tính"), `MealList`, `RolePicker` (xem calo của 2 vai — tái dùng `constants/roleLabels.ts`).

### C3. CLAUDE.md
- Thêm 1 dòng subsystem **Calo** vào bản đồ thư mục (đây là mảng lớn mới ⇒ đúng điều kiện cập nhật CLAUDE.md). Không liệt kê từng component.

---

## File tạo / sửa (tóm tắt)

**Tạo — backend:** `models/{Debt,BudgetPlan,CalorieEntry,CalorieGoal}.ts`; `services/{expenseDebtService,budgetPlanService,calorieService}.ts`; `routes/calorieRoutes.ts`; `controllers/calorieController.ts`.
**Sửa — backend:** `models/ExpenseCategory.ts` (+bucket); `models/SavingsGoal.ts` (+type dự phòng); `services/{expenseCategoryService(seed bucket),savingsGoalService,expenseTransactionService(alert theo nhóm),aiService(+3 hàm: parse text, advice, estimate calo),schedulerService(nhắc nợ)}.ts`; `routes/expenseRoutes.ts` + `controllers/expenseController.ts`; `server.ts` (mount /api/calories).
**Tạo — frontend:** `pages/{ExpenseDebts,Calories}.tsx`; `api/calorieApi.ts`; `components/expenses/{AllocationPanel,DebtCard,DebtForm,PlanForm,NotificationImportSheet}.tsx`; `components/calories/*`.
**Sửa — frontend:** `api/expenseApi.ts`; `pages/Expenses.tsx` (nhúng AllocationPanel); `App.tsx` (route); `components/Navbar`; `components/expenses/QuickAddBar.tsx` (nút import); (giai đoạn B3) `package.json`, `capacitor.config.ts`, `android/.../AndroidManifest.xml`, `utils/nativeApp.ts`.
**Sửa — gốc:** `CLAUDE.md` (subsystem Calo).

**Tái dùng:** `expenseTransactionService` (aggregation + session atomic), `aiService.extractReceiptData` (khuôn prompt), `expenseWalletService.adjustBalance`, `BudgetProgressBar`, `AmountInput`, `CategoryChip/Icon`, `constants/roleLabels.ts`, `schedulerService` pattern.

---

## Checklist tiến độ (tick sau mỗi mục)

- [x] **Bước 0** — Tạo `docs/plan-tai-chinh-calo.md` + memory `plan-tai-chinh-calo.md` + dòng ở `MEMORY.md` *(2026-07-01)*
- [x] **A1** — `bucket` cho ExpenseCategory + seed 9 danh mục (+ migration DB đã seed) *(2026-07-01)*. UI: `CategoryManagerSheet` (thêm/sửa/xoá danh mục tự tạo + chọn nhóm 50/30/20 + icon/màu), nút "Quản lý danh mục" trong Expenses, `expenseApi.updateCategory` *(2026-07-02)*. Defaults vẫn bị khoá sửa/xoá (backend chặn).
- [x] **A2** — `BudgetPlan` model + `budgetPlanService` (getPlan/upsertPlan/getAllocation + daysLeft/dailyAllowance) *(2026-07-01)*. Tạo sớm luôn `Debt` model (cần cho debtTotal).
- [x] **A3** — `expenseDebtService` (CRUD + pay atomic + getPayoffProjection) + cron nhắc hạn 8:30 sáng + "Trả nợ" seed vào DEFAULT_CATEGORIES *(2026-07-02)*
- [x] **A4** — Endpoint plan/allocation/debts/projection đã mount vào expenseRoutes + handlers trong expenseController *(2026-07-02)*
- [x] **A5** — Frontend: AllocationPanel, DebtCard/Form, PlanForm, trang ExpenseDebts + route *(2026-07-02)*
- [x] **A6** — Quỹ dự phòng (SavingsGoal +type emergency/normal + badge + toggle trong form) · cảnh báo Discord khi lố nhóm 80%/100% · AI cố vấn 50/30/20 (generateFinanceAdvice + endpoint /advice + tab "Cố vấn" trong AISummaryCard) *(2026-07-02)*
- [x] **B1** — `aiService.extractTransactionText` + endpoint `POST /expenses/parse-text` *(2026-07-02)*
- [x] **B2** — `NotificationImportSheet` (ô dán → AI → prefill → lưu) + nút "Nhập TB" ở QuickAddBar *(2026-07-02)*
- [x] **B3** — Android Share target (custom Capacitor plugin inline, không cần npm package) + manifest intent-filter + nativeApp.ts + Expenses.tsx listener *(2026-07-02)*. **APK build lại (8.81 MB) + cài lên máy (89693c66)**. **Đã test end-to-end + phát hành OTA 1.0.6** *(2026-07-02)*. Sửa bug điều hướng (BrowserRouter + Capacitor không cho `window.location.href='/expenses'` → thêm `ShareNavigator` dùng react-router navigate).
- [x] **C1** — Backend calo: models `CalorieEntry`/`CalorieGoal` + `calorieService` (CRUD + getDailySummary + getWeekTrend) + `aiService.estimateCalories` (text/ảnh) + `calorieController` + `calorieRoutes` mount `/api/calories` *(2026-07-02)*. Backend tsc sạch.
- [x] **C2** — Frontend calo: `calorieApi` + trang `Calories` (RolePicker + chọn ngày + CalorieRing + macros + xu hướng 7 ngày + đặt mục tiêu) + `components/calories/*` (RolePicker/CalorieRing/MealList/MealEntryForm) + route + Navbar group "Sức khoẻ" *(2026-07-02)*. Frontend build sạch.
- [x] **C3** — CLAUDE.md: thêm `Calories` vào pages + `calories/` vào feature-folders (giữ cao tầng) *(2026-07-02)*

## Thứ tự đề xuất
A (50/30/20 + Nợ) → B1+B2 (parse AI + ô dán, deploy/OTA ngay) → C (Calo) → B3 (Android Share, build lại APK cuối cùng). Mỗi giai đoạn build sạch rồi mới sang bước sau.

## Nhật ký (log các mốc)
- **2026-07-02:** **Xong Giai đoạn C (Quản lý Calo).** C1 backend: `models/CalorieEntry` (owner+date index, mealType, calo+macro) + `models/CalorieGoal` (owner unique, dailyTarget) + `services/calorieService` (CRUD entry, getGoal/upsertGoal, getDailySummary, getWeekTrend 7 ngày) + `aiService.estimateCalories` (mô tả text HOẶC ảnh qua Gemini vision → name/calories/protein/carbs/fat) + `controllers/calorieController` + `routes/calorieRoutes` mount `/api/calories` (GET/POST /, PUT/DELETE /:id, /summary, /trend, /goal, /estimate multipart). C2 frontend: `api/calorieApi` + trang `Calories` (RolePicker xem calo 2 vai + chọn ngày + `CalorieRing` SVG + macros + biểu đồ 7 ngày + sheet đặt mục tiêu) + `components/calories/{RolePicker,CalorieRing,MealList,MealEntryForm}` (MealEntryForm có AI ước tính từ mô tả/ảnh) + route `/calories` + Navbar group "Sức khoẻ". C3: CLAUDE.md thêm Calories/calories. Backend tsc + frontend build sạch. **Toàn bộ plan A→B→C đã xong.**
- **2026-07-02:** **Deploy — phát hành OTA 1.0.9.** Backend đã lên `main` (Render auto-deploy từ GitHub). Frontend: `npm install` (thiếu `@capacitor/local-notifications` do commit reminders sau đó thêm vào `package.json` nhưng chưa cài) → `npm run ota:release -- 1.0.9` build + upload 335 KB lên Cloudinary qua backend, publish thành công. Bản 1.0.9 gộp cả **Calo** (plan này) và **Reminders** (subsystem mới ở commit `40b66c9`, ngoài phạm vi plan này) vì cả hai đều chưa từng được OTA trước đó. App thật cần mở lại để nhận bản mới. **Plan tài chính + calo coi như hoàn tất toàn bộ (code + deploy).**
- **2026-07-02:** **Việc phát sinh ngoài plan — bật Web Push cho Reminders + hiển thị version app.** Web Push (VAPID) chưa từng được cấu hình: sinh cặp key mới (`npx web-push generate-vapid-keys`), set `VITE_VAPID_PUBLIC_KEY` vào `frontend/.env.production`; người dùng tự set `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (mail `duocnn130901@gmail.com`) trên Render dashboard. Phát hành **OTA 1.0.10** để đưa public key vào bundle. Thêm `getAppVersion()` trong `utils/nativeApp.ts` (đọc `CapacitorUpdater.current()` → `{web, native, isBuiltin}`) + `AppVersionFooter` trong `components/Navbar.tsx` (hiện "Phiên bản X.X.X · app Y.Y" ở cuối menu "Thêm", cả desktop lẫn mobile) để người dùng biết đang chạy bản OTA nào. Phát hành **OTA 1.0.11**. Frontend build sạch cả 2 lần.
- **2026-07-02:** **Q1 (hàng đợi) + Q2 (chống trùng) cho tự-đọc-notification → OTA 1.0.8.** Q1: service lưu **queue** (JSONArray, không ghi đè, cap 30) thay vì 1 ô; `NotifHelper.getPending()` trả `{items:[]}`; JS `enqueueShareText`/`dequeueShareText` (queue trong sessionStorage); Expenses xử lý **tuần tự** (showingShareRef + closeShare → showNextShare). Q2: service tính **vân tay = tập số nhóm-hàng-nghìn** (số tiền GD + số dư SD, bỏ dấu phân cách) + danh sách `recent` {fp,ts}, trùng trong 10 phút → bỏ ngay tại gốc (diệt cặp SMS+push của MB). MainActivity receiver đổi sang inject event `niyeuoi-notif` (wake, không kèm text) → JS drain queue; đường live + drain hợp nhất qua getPending. **Verify e2e trên builtin:** post A + trùng-A + B → chỉ A hiện (4.000) + B chờ (queueLen=1), đóng A → B hiện (65.000); dedup loại đúng bản trùng. Phát hành OTA 1.0.8 + apply verify 1.0.8/success. **Mục kế tiếp: C1** (backend calo).
- **2026-07-02:** **Tính năng MỚI — tự đọc thông báo (auto notif capture)** + fix (a) share lần 2. Native: `NotificationCaptureService` (NotificationListenerService, lọc regex tiền tệ VND/đ + số nhóm hàng nghìn, lưu SharedPreferences `niyeuoi_notif` + broadcast) + plugin `NotifHelper` (isEnabled/openSettings/getPending) + receiver trong MainActivity (broadcast→inject event `niyeuoi-share`, dùng chung sheet) + service trong Manifest (BIND_NOTIFICATION_LISTENER_SERVICE, exported=true). Web: `NotifCaptureBanner` (bật quyền Notification access), drain `getPending` lúc cold-start + App 'resume', helper `isNotifCaptureEnabled/openNotifSettings`. Fix (a): key `NotificationImportSheet` theo `shareNonce` → share/notif mới remount + auto-parse lại. **Verify e2e** (cấp quyền qua `adb cmd notification allow_listener` + `cmd notification post`, đọc log service + CDP DOM): service bắt → matched → broadcast → sheet mở `/expenses`, AI parse đúng 125.000đ/66.000đ. **APK build lại + cài + phát hành OTA 1.0.7** (download/apply verify current=1.0.7 success). Gotcha: reinstall xong listener cần toggle disallow→allow để rebind; máy khoá màn → notif không tới listener (HyperOS freeze nền). **Mục kế tiếp: C1** (backend calo).
- **2026-07-02:** **Test B3 end-to-end + sửa bug + phát hành OTA 1.0.6.** Bug: `nativeApp.dispatchShareText` mở màn Chi tiêu bằng `window.location.href='/expenses'` — trong Capacitor (BrowserRouter) điều hướng cứng tới route SPA bị 404 nên sheet không mở. Sửa: `dispatchShareText` chỉ set sessionStorage + phát event; thêm `ShareNavigator` (trong `<Router>`) dùng `useNavigate` để điều hướng client-side + hàm `hasPendingShareText()`. Verify qua Chrome DevTools Protocol (adb bị chặn inject input trên máy HyperOS): share intent → `/expenses` + sheet mở, AI parse đúng 55.000đ (MB Bank·HIGHLANDS) và 2.500.000đ (thu nhập·NGUYEN VAN A), tách đúng số dư. Phát hành `npm run ota:release -- 1.0.6` (upload 324KB Cloudinary) + download/apply verify current=1.0.6 status success. **Edge case còn lại (chưa sửa):** share thứ 2 khi sheet đang mở không refresh (auto-parse mount-only, sheet không remount) — cần key theo shareText nếu muốn sửa. **Mục kế tiếp: C1** (backend calo).
- **2026-07-02:** Xong **A1 (phần UI còn lại)** + **B3 (build APK)**. A1: `expenseApi.updateCategory`; component `CategoryManagerSheet.tsx` (list danh mục kèm badge nhóm + Lock cho default; form thêm/sửa với chọn nhóm needs/wants/savings + màu + icon; xoá danh mục tự tạo) — nút "Quản lý danh mục" (icon Tags) trong `Expenses.tsx`, mount sheet + `onSaved=fetchBase`. Frontend build sạch. B3: `npm run build → npx cap sync android → gradlew assembleDebug` (BUILD SUCCESSFUL, `app-debug.apk` 8.81 MB) → `adb install -r` lên máy 89693c66 (Success). **Mục kế tiếp: C1** (backend calo).
- **2026-07-01:** Chốt plan + tạo file tiến độ này + memory. Chưa bắt đầu code (A1 là mục kế tiếp).
- **2026-07-01:** Xong **A1**. Backend: `ExpenseCategory` +field `bucket` (needs/wants/savings, default needs) + `CategoryBucket` type; seed 9 danh mục kèm bucket (Ăn uống/Đi lại/Y tế/Nhà cửa/Khác→needs, Giải trí/Đi hẹn hò/Mua sắm→wants, Tiết kiệm→savings) + migration chạy lại khi DB cũ thiếu bucket. Frontend: `IExpenseCategory` +`bucket` + `CategoryBucket`. Build backend (tsc) + frontend đều sạch.
- **2026-07-01:** Xong **A2**. `models/BudgetPlan.ts` (owner unique, monthlyIncome + needs/wants/savingsPct 50/30/20). `models/Debt.ts` tạo sớm (tổng nợ/còn lại/monthlyPayment/dueDay/interest/owner/isActive). `services/budgetPlanService.ts`: `getPlan`, `upsertPlan`, `getAllocation(owner,month,year)` → income − debtTotal (tổng monthlyPayment nợ active) = disposable, chia 50/30/20; spent gom theo bucket qua $lookup category (thiếu bucket→needs); `daysLeft` + `dailyAllowance` cho nhóm wants. Backend tsc sạch. **Mục kế tiếp: A3** (expenseDebtService CRUD + pay atomic + cron nhắc hạn).
- **2026-07-02:** Xong **B3**. Custom Capacitor plugin `ShareHelperPlugin.java` (đọc `MainActivity.pendingShareText`). `MainActivity.java` override `onCreate`/`onNewIntent`: detect `ACTION_SEND text/plain` → lưu static field + inject `niyeuoi-share` custom event vào WebView nếu app đang chạy nền. `AndroidManifest.xml` thêm intent-filter. `nativeApp.ts`: register `ShareHelper` plugin, đọc pending text khi cold start, lắng nghe live-share event; `consumePendingShareText()` export cho React dùng. `Expenses.tsx`: mount effect đọc pending + listener → `shareText` state → mở `NotificationImportSheet(initialText)` auto-parse. Frontend build sạch. **Phải `npm run build → npx cap sync android → gradlew assembleDebug` và cài lại APK**.
- **2026-07-02:** Xong **A6**. Backend: `SavingsGoal` +field `type` (normal/emergency); `expenseTransactionService.checkBucketAlert` (fire Discord khi chi tiêu qua 80%/100% target nhóm 50/30/20); `aiService.generateFinanceAdvice`; endpoint `GET /expenses/advice`. Frontend: `ISavingsGoal.type`; `SavingsGoalCard` badge vàng + vòng tròn amber cho quỹ dự phòng; `ExpenseSavings` toggle loại + hint "3–6 tháng thiết yếu"; `AISummaryCard` tab "Tổng kết / Cố vấn". Backend + frontend build sạch.
- **2026-07-02:** Xong **B1 + B2**. `aiService.extractTransactionText` (prompt hỗ trợ SMS/app ngân hàng VN → JSON amount/type/merchant/bankName/date). Endpoint `POST /expenses/parse-text`. Frontend: `NotificationImportSheet` (dán text → AI đọc → hiện form có thể sửa amount/type/note/date/ví/danh mục → lưu giao dịch); nút "Nhập TB" màu sky trong QuickAddBar. Backend + frontend build sạch. **Mục kế tiếp: C1** (backend calo).
- **2026-07-02:** Xong **A3 + A4 + A5**. A3: `expenseDebtService` (CRUD + pay atomic + getPayoffProjection + checkDueDateAlerts). A4: routes đầy đủ. A5: `expenseApi.ts` thêm types + functions (IBudgetPlan/AllocationResult/IDebt/PayoffProjection); components `AllocationPanel`, `PlanForm`, `DebtCard`, `DebtForm`; trang `ExpenseDebts`; route `/expenses/debts`; link "Quản lý nợ" trong Navbar; `AllocationPanel` nhúng vào đầu `Expenses.tsx`. Frontend + backend build sạch 0 lỗi. **Mục kế tiếp: A6** (Quỹ dự phòng · alert nhóm · AI cố vấn — hoặc bỏ qua sang B1+B2).
- **2026-07-02:** Xong **A3 + A4**. `services/expenseDebtService.ts`: CRUD + `pay()` atomic (Transaction + adjustBalance + remainingAmount trong 1 session Mongo) + `getPayoffProjection()` (snowball/avalanche). Cron 8:30 sáng nhắc trả nợ (3 ngày trước + hôm nay). Seed thêm "Trả nợ" vào DEFAULT_CATEGORIES. Routes `GET/POST /expenses/plan`, `GET /expenses/allocation`, `GET/POST /expenses/debts`, `PUT/DELETE /expenses/debts/:id`, `POST /expenses/debts/:id/pay`, `GET /expenses/debts/projection`. Backend tsc sạch. **Mục kế tiếp: A5** (Frontend AllocationPanel + DebtCard/Form + PlanForm + trang ExpenseDebts).

## Kiểm thử (end‑to‑end)
1. **Backend:** `cd backend && npm run dev`; test bằng REST/curl các endpoint mới (`/expenses/plan`, `/allocation`, `/debts`, `/debts/:id/pay`, `/parse-text`, `/calories/*`). Kiểm tra `remainingAmount` giảm đúng sau `pay`, số dư ví atomic, `allocation` = (lương − tổng nợ) chia 50/30/20.
2. **Frontend:** `cd frontend && npm run build` (tsc -b + vite) **sạch 0 lỗi** sau mỗi giai đoạn, rồi `npm run lint`.
3. Chạy app (`npm run dev` hoặc `npx cap run android`): tự nhập lương → tạo nợ → thấy AllocationPanel trừ nợ trước + "còn ~Xk/ngày" nhóm mong muốn; xem dự báo trả hết nợ + gợi ý thứ tự; tạo quỹ dự phòng (badge riêng); bấm "Cố vấn" ra lời khuyên AI; dán 1 thông báo bank mẫu → AI ra số tiền đúng → chọn danh mục → lưu; nhập bữa ăn + "AI ước tính" ra calo; đổi vai xem calo 2 người.
4. **Giai đoạn B3:** build APK, cài lại, long‑press 1 thông báo → Chia sẻ → Niyeuoi → app mở đúng màn import (test qua `adb`, KHÔNG `force-stop` để tránh rollback OTA — xem memory mobile).
5. Regression: các chức năng chi tiêu cũ (ví, ngân sách, tiết kiệm, định kỳ, OCR) vẫn chạy y như trước.
