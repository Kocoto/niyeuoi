# CLAUDE.md — Bản đồ dự án Niyeuoi

App kỷ niệm + chi tiêu cho một cặp đôi (2 người dùng: `boyfriend` / `girlfriend`, đăng nhập bằng PIN).

## Tech stack
- **Frontend** (`frontend/`): React 19 + Vite + TypeScript, Tailwind v4, react-router-dom v7, framer-motion, react-leaflet (bản đồ), lucide-react. Là PWA (`vite-plugin-pwa`).
- **Backend** (`backend/`): Express 5 + Mongoose (MongoDB), Cloudinary (ảnh + bundle OTA), multer, node-cron, Google Generative AI. TypeScript, deploy trên Render (`https://niyeuoi.onrender.com`).
- **Mobile**: Capacitor (Android + iOS scaffold) + OTA self-host qua Capgo. Chi tiết build/OTA xem memory `mobile-build-capacitor.md`.

## Bản đồ thư mục

### frontend/src/
- `pages/` — 1 file / 1 route (Home, Places, Timeline, Wishlist, LoveMap, Coupons, Events, MoodLofi, Challenges, DeepTalk, Letters, Expenses*). Route khai báo trong `App.tsx`.
- `components/` — component dùng chung + **thư mục con theo tính năng** (`expenses/`, `home/`, `coupons/`, `places/`). Gate: `ServerGate` (chờ backend), `AuthGate` (PIN). `Navbar`.
- `api/` — client axios. `api.ts` = instance chung (baseURL `VITE_API_URL`, token Bearer từ localStorage). Mọi call backend đi qua đây.
- `context/` — `AuthContext` (role, PIN, đổi người), `UIContext`.
- `hooks/` — `useLocationTracker`.
- `utils/` — `currency.ts`, `nativeApp.ts` (init Capacitor: status bar/splash/back/OTA notifyAppReady).
- `constants/` — `roles.ts`, `roleLabels.ts` (tên/nhãn 2 vai).
- `types/` — khai báo type dùng chung / ambient.

### backend/src/
- `server.ts` — khởi tạo Express, CORS, mount route `/api/*`, kết nối Mongo, cron.
- `routes/` — định nghĩa endpoint, mount vào server.ts (vd `/api/places`, `/api/ota`).
- `controllers/` — xử lý req/res cho từng route.
- `services/` — business logic (đa số logic nặng ở đây, vd `expenseTransactionService`, `relationshipStateService`, `aiService`).
- `models/` — schema Mongoose (Place, Memory, Coupon, AppBundle...).
- `config/` — `cloudinary.ts`.
- `middleware/` — `uploadMiddleware` (multer+Cloudinary, chỉ ảnh), `validateObjectId`.
- `utils/` — `authToken` (session/PIN), `logger` (info/warn/error/success/http), `requestIdentity`.

## Quy ước "để code ở đâu"
- Sub-component của 1 trang → `components/<feature>/` (theo tiền lệ `components/expenses/`).
- Type / hàm logic thuần của 1 trang → file `.ts` cạnh feature đó (vd `components/coupons/couponLogic.ts`).
- Gọi API → luôn qua `src/api/api.ts` (đừng tạo axios instance mới).
- Backend: route → controller → service → model. Logic nặng đặt ở `services/`.

## Lệnh chính
| Việc | Lệnh (chạy trong thư mục tương ứng) |
|---|---|
| Chạy dev frontend | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` (tsc -b + vite) |
| Lint | `cd frontend && npm run lint` |
| Chạy dev backend | `cd backend && npm run dev` |
| Phát hành OTA (web, không cài lại app) | `cd frontend && npm run ota:release -- <version>` (tăng version mỗi lần) |
| Build APK Android | `cd frontend/android && gradlew assembleDebug` (JDK: `C:\Program Files\Android\Android Studio\jbr`) |
| Cài + chạy trên máy qua USB | `cd frontend && npx cap run android` |

## Lưu ý quan trọng
- Bản mobile phải trỏ `VITE_API_URL` về backend Render (không dùng localhost) — đã set ở `frontend/.env.production`.
- App native tắt service worker (xem `src/main.tsx`).
- Màn hình trắng khi chạy native → gần như chắc do `react`/`react-dom` lệch version. Đồng bộ về cùng version.

## Bảo trì file này (dành cho Claude)
Giữ CLAUDE.md **cao tầng** — mô tả cấu trúc/quy ước/lệnh ổn định, KHÔNG liệt kê từng tính năng/route/component.

**Cập nhật file này ngay trong cùng lượt làm việc khi (và CHỈ khi) có thay đổi cấu trúc:**
- Thêm/xoá/đổi tên **thư mục top-level** (vd `frontend/src/<mới>/`, `backend/src/<mới>/`).
- Thêm một **subsystem/tính năng lớn mới** cần một mục riêng để định hướng (vd mảng auth, realtime, thanh toán).
- Thêm/đổi **lệnh** chạy/build/deploy, hoặc **quy ước "để code ở đâu"**.
- Đổi tech stack, biến môi trường bắt buộc, hoặc luồng triển khai.

**KHÔNG cập nhật khi** chỉ thêm một trang/route/component/endpoint theo đúng pattern đã mô tả — quy ước sẵn có đã bao trùm. Nếu thấy phải sửa file này mỗi tính năng, nghĩa là nó đang quá chi tiết → viết cao tầng lại.
