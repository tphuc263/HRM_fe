# 🏢 HRM Frontend — Human Resource Management System

> Giao diện quản lý nhân sự được xây dựng bằng **React 19 + TypeScript + Vite**, tích hợp **TanStack Query** cho data fetching và **Tailwind CSS + shadcn/ui** cho hệ thống Design System nhất quán.

---

## 📋 Mục lục

- [Tech Stack](#-tech-stack)
- [Kiến trúc tổng quan](#-kiến-trúc-tổng-quan)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Biến môi trường](#-biến-môi-trường)
- [Routing & Phân quyền](#-routing--phân-quyền)
- [Quy tắc lập trình (Coding Conventions)](#-quy-tắc-lập-trình-coding-conventions)
- [Testing](#-testing)
- [Build & Deployment](#-build--deployment)
- [Xử lý sự cố (Troubleshooting)](#-xử-lý-sự-cố-troubleshooting)
- [Tài liệu tham khảo](#-tài-liệu-tham-khảo)

---

## 🛠 Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| [React](https://react.dev) | 19.x | Thư viện UI chính |
| [TypeScript](https://www.typescriptlang.org) | 6.x | Type safety |
| [Vite](https://vite.dev) | 8.x | Build tool & Dev server |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state management, caching, data fetching |
| [React Router](https://reactrouter.com) | 7.x | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com) | — | Component library (Radix UI + Tailwind) |
| [Axios](https://axios-http.com) | 1.x | HTTP client |
| [Lucide React](https://lucide.dev) | 1.x | Icon library |
| [React Toastify](https://fkhadra.github.io/react-toastify) | 11.x | Toast notifications |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js) | 0.14 | Xuất PDF phiếu lương |
| [xlsx (SheetJS)](https://sheetjs.com) | 0.18 | Xuất báo cáo Excel |

### Dev & Testing

| Công cụ | Mục đích |
|---|---|
| [Jest](https://jestjs.io) + [jsdom](https://github.com/jsdom/jsdom) | Unit testing runtime |
| [React Testing Library](https://testing-library.com/react) | Component testing |
| [MSW](https://mswjs.io) | API mocking cho unit test |
| [Selenium WebDriver](https://www.selenium.dev) | End-to-End testing |
| [ESLint](https://eslint.org) + [typescript-eslint](https://typescript-eslint.io) | Linting & Code quality |

---

## 🏗 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
├─────────────────────────────────────────────────────┤
│  React Router (BrowserRouter)                       │
│  ├── /login          → LoginPage                    │
│  ├── /admin/*        → Admin routes (RBAC)          │
│  └── /employees/:id  → Employee routes              │
├─────────────────────────────────────────────────────┤
│  Context Providers                                  │
│  ├── QueryClientProvider  (TanStack Query)          │
│  ├── AuthProvider         (JWT Auth State)          │
│  ├── ToastProvider        (Notifications)           │
│  └── ThemeProvider        (Dark/Light mode)         │
├─────────────────────────────────────────────────────┤
│  Service Layer (Axios + Interceptors)               │
│  └── apiClient.ts → /api/v1/* (Proxy to Backend)   │
├─────────────────────────────────────────────────────┤
│  Vite Dev Server (port 5173)                        │
│  └── Proxy: /api → http://localhost:8080            │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
Component (useQuery/useMutation)
    ↓
Service Layer (leaveService, employeeService, ...)
    ↓
apiClient.ts (Axios instance + JWT interceptor)
    ↓
Vite Proxy (/api → Backend:8080)
    ↓
Spring Boot REST API
```

---

## 📁 Cấu trúc thư mục

```
frontend/
├── public/                     # Static assets (logo, favicon)
├── selenium/                   # E2E test suite (Selenium + Jest)
│   ├── flows/                  # Test flows (admin, employee workflows)
│   │   ├── admin.workflow.e2e.test.ts
│   │   └── employee.workflow.e2e.test.ts
│   ├── helpers/                # Driver setup, wait utilities
│   │   ├── base.ts             # WebDriver factory
│   │   ├── human.ts            # Human-like interaction helpers
│   │   └── wait.ts             # Explicit wait utilities
│   ├── pages/                  # Page Object Model (POM)
│   │   ├── LoginPO.ts
│   │   ├── EmployeePO.ts
│   │   ├── AttendancePO.ts
│   │   ├── LeaveRequestPO.ts
│   │   └── PayrollPO.ts
│   ├── jest.config.ts          # Jest config riêng cho E2E
│   └── tsconfig.json           # TS config riêng cho E2E
├── src/
│   ├── main.tsx                # Entry point (render React App + Providers)
│   ├── App.tsx                 # Root component: định nghĩa Routes
│   ├── index.css               # Global styles + CSS variables + Tailwind
│   │
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   └── PromptModal.tsx
│   │   ├── layout/             # Layout wrapper
│   │   │   ├── Layout.tsx      # Main layout (Sidebar + Content)
│   │   │   └── Sidebar.tsx     # Navigation sidebar (role-based)
│   │   ├── auth/
│   │   │   └── RequireAuth.tsx # Route guard (redirect nếu chưa login)
│   │   ├── attendance/         # Attendance-specific modals
│   │   └── payroll/            # Payroll-specific modals
│   │
│   ├── pages/                  # Page-level components (1 page = 1 route)
│   │   ├── auth/               # LoginPage
│   │   ├── DashboardPage.tsx   # Admin Dashboard (tổng hợp)
│   │   ├── employees/          # Quản lý nhân viên
│   │   ├── departments/        # Quản lý phòng ban
│   │   ├── attendance/         # Chấm công, nghỉ phép, tăng ca
│   │   ├── payroll/            # Bảng lương
│   │   └── settings/           # Cấu hình: Loại phép, Ca làm, Ngày lễ
│   │
│   ├── services/               # API service layer
│   │   ├── apiClient.ts        # Axios instance + interceptors
│   │   ├── tokenStorage.ts     # JWT token persistence (localStorage)
│   │   ├── authService.ts      # Login, /me endpoint
│   │   ├── employeeService.ts
│   │   ├── departmentService.ts
│   │   ├── attendanceService.ts
│   │   ├── leaveService.ts
│   │   ├── overtimeService.ts
│   │   ├── contractService.ts
│   │   ├── shiftService.ts
│   │   └── holidayService.ts
│   │
│   ├── context/                # React Context (global state)
│   │   ├── AuthContext.tsx      # Authentication state + JWT
│   │   ├── ThemeContext.tsx     # Dark/Light mode toggle
│   │   ├── ToastContext.tsx     # Toast notification queue
│   │   └── useAuth.ts          # Custom hook for AuthContext
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts              # ApiResponse<T> generic wrapper
│   │   ├── auth.ts             # AuthUser, LoginRequest
│   │   ├── employee.ts         # Employee, EmployeeDTO
│   │   ├── attendance.ts       # Attendance, OvertimeRecord
│   │   ├── leave.ts            # LeaveRequest, LeaveType
│   │   ├── payroll.ts          # Payroll, PayrollSummary
│   │   └── hrm.ts              # Department, Contract, Shift, Holiday
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
│   │   └── api/                # (Reserved for API utilities)
│   │
│   ├── utils/                  # Business utilities
│   │   └── exportUtils.ts      # Export to Excel/PDF helpers
│   │
│   └── __tests__/              # Unit & Integration tests
│       ├── setup.ts            # Jest global setup
│       ├── setupEnv.ts         # Environment mocking
│       ├── test-utils.tsx      # Custom render with providers
│       ├── mocks/              # MSW handlers, file mocks
│       ├── core/               # apiClient, auth tests
│       ├── attendance/         # Attendance page & service tests
│       ├── leave/              # Leave page & service tests
│       ├── hrm/                # HRM page & service tests
│       └── payroll/            # Payroll page tests
│
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind CSS customization
├── vite.config.ts              # Vite config (proxy, port)
├── tsconfig.json               # Root TypeScript config
├── tsconfig.app.json           # App-specific TS config
├── tsconfig.node.json          # Node-specific TS config
├── jest.config.ts              # Unit test config
├── babel.config.cjs            # Babel for Jest transpilation
├── eslint.config.js            # ESLint flat config
├── postcss.config.js           # PostCSS (Tailwind + Autoprefixer)
├── Dockerfile                  # Docker image (node:20-alpine)
├── package.json                # Dependencies & scripts
└── package-lock.json           # Lockfile
```

---

## 💻 Yêu cầu hệ thống

| Yêu cầu | Phiên bản tối thiểu |
|---|---|
| Node.js | 18.x trở lên (khuyến nghị 20.x) |
| npm | 9.x trở lên |
| Trình duyệt | Chrome/Firefox/Edge (bản mới nhất) |
| Backend API | Đang chạy tại `http://localhost:8080` |

---

## 🚀 Cài đặt & Khởi chạy

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Khởi chạy Dev Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

> **Lưu ý**: Backend API phải đang chạy tại `http://localhost:8080`.  
> Vite Dev Server tự động proxy các request `/api/*` sang Backend.

### 3. Chạy bằng Docker

```bash
# Từ thư mục gốc hrm_proj/
docker-compose up -d frontend
```

Hoặc build riêng image:

```bash
cd frontend
docker build -t hrm-frontend .
docker run -p 5173:5173 hrm-frontend
```

---

## 🔐 Biến môi trường

Tạo file `.env` (hoặc `.env.local`) trong thư mục `frontend/`:

| Biến | Giá trị mặc định | Mô tả |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base URL cho API calls (dùng trong `apiClient.ts`) |
| `VITE_API_TARGET` | `http://localhost:8080` | Target cho Vite proxy (dùng trong `vite.config.ts`) |

**Ví dụ `.env.local`:**

```env
VITE_API_BASE_URL=/api/v1
VITE_API_TARGET=http://localhost:8080
```

> **Quy tắc Vite**: Chỉ các biến có prefix `VITE_` mới được expose ra client-side code.

---

## 🗺 Routing & Phân quyền

Ứng dụng sử dụng **Role-Based Access Control (RBAC)** với 2 vai trò: `ADMIN` và `EMPLOYEE`.

### Sơ đồ Route

| Route | Vai trò | Trang |
|---|---|---|
| `/login` | Public | Đăng nhập |
| `/` | Authenticated | Tự redirect theo role |
| `/admin` | ADMIN | Dashboard tổng hợp |
| `/admin/employees` | ADMIN | Quản lý nhân viên |
| `/admin/attendance/daily` | ADMIN | Chấm công hàng ngày |
| `/admin/attendance/monthly` | ADMIN | Báo cáo chấm công tháng |
| `/admin/attendance/overtime` | ADMIN | Quản lý đăng ký tăng ca |
| `/admin/attendance/leave-request` | ADMIN | Duyệt đơn nghỉ phép |
| `/admin/attendance/absence` | ADMIN | Quản lý phép năm |
| `/admin/payroll/manage` | ADMIN | Quản lý bảng lương |
| `/admin/departments` | ADMIN | Quản lý phòng ban |
| `/admin/leave-types` | ADMIN | Cấu hình loại phép |
| `/admin/shifts` | ADMIN | Cấu hình ca làm việc |
| `/admin/holidays` | ADMIN | Cấu hình ngày lễ |
| `/employees/:userId/attendance/daily` | EMPLOYEE | Xem chấm công cá nhân |
| `/employees/:userId/attendance/monthly` | EMPLOYEE | Báo cáo tháng cá nhân |
| `/employees/:userId/attendance/overtime` | EMPLOYEE | Đăng ký tăng ca |
| `/employees/:userId/attendance/leave-request` | EMPLOYEE | Gửi đơn nghỉ phép |
| `/employees/:userId/attendance/absence` | EMPLOYEE | Xem phép năm |
| `/employees/:userId/payroll/my-salary` | EMPLOYEE | Xem phiếu lương cá nhân |

### Cơ chế bảo vệ Route

```
RequireAuth (kiểm tra JWT token)
  └── ProtectedPage (kiểm tra role nếu có allowedRoles)
        └── Layout (Sidebar + Content)
              └── Page Component
```

- `RequireAuth`: Nếu chưa đăng nhập → redirect `/login`
- `ProtectedPage`: Nếu role không khớp `allowedRoles` → access denied
- JWT token được lưu trong `localStorage` và tự gắn vào mọi request qua Axios interceptor

---

## 📐 Quy tắc lập trình (Coding Conventions)

### Cấu trúc Component

```
src/
├── components/   → Reusable, không chứa business logic nặng
├── pages/        → 1 route = 1 page component, chứa logic nghiệp vụ
├── services/     → Gọi API, không chứa UI logic
├── types/        → Chỉ chứa TypeScript interfaces/types
└── context/      → Global state (Auth, Theme, Toast)
```

### Quy tắc đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| Component file | `PascalCase.tsx` | `EmployeeListPage.tsx` |
| Service file | `camelCase.ts` | `employeeService.ts` |
| Type file | `camelCase.ts` | `employee.ts` |
| Test file | `*.test.ts(x)` | `auth.test.tsx` |
| E2E test file | `*.e2e.test.ts` | `admin.workflow.e2e.test.ts` |
| Page Object | `*PO.ts` | `LoginPO.ts` |
| Context file | `PascalCase.tsx` | `AuthContext.tsx` |

### Quy tắc viết code

1. **Luôn dùng TypeScript** — Không dùng `any` trừ khi thực sự cần thiết
2. **Dùng functional components** — Không dùng class components
3. **Data fetching** qua TanStack Query (`useQuery`, `useMutation`)
4. **API calls** qua `apiClient` — Không import `axios` trực tiếp trong components
5. **Styling** dùng Tailwind CSS utility classes + shadcn/ui components
6. **State management**:
   - Server state → TanStack Query
   - Auth state → AuthContext
   - UI state cục bộ → `useState` / `useReducer`
7. **Form handling** → Controlled components (React state)
8. **Error handling** → Axios interceptor tự xử lý 401, các lỗi khác hiển thị qua Toast

### Import Order (khuyến nghị)

```tsx
// 1. React & hooks
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'

// 3. Internal components
import { Button } from '../components/ui/button'

// 4. Services & utils
import { employeeService } from '../services/employeeService'

// 5. Types
import type { Employee } from '../types/employee'
```

### Thêm một API endpoint mới

```
1. Định nghĩa type   → src/types/<module>.ts
2. Tạo service func  → src/services/<module>Service.ts
3. Gọi trong page    → src/pages/<module>/SomePage.tsx (dùng useQuery/useMutation)
4. Viết unit test     → src/__tests__/<module>/services.test.ts
```

---

## 🧪 Testing

Dự án áp dụng **3 tầng kiểm thử** (Testing Pyramid):

```
        ┌─────────┐
        │  E2E    │  ← Selenium + Jest (trình duyệt thực)
        ├─────────┤
        │  Unit/  │  ← Jest + React Testing Library + MSW
        │  Integ. │
        └─────────┘
```

### Unit & Integration Tests

**Công cụ**: Jest + React Testing Library + MSW (Mock Service Worker)

```bash
# Chạy toàn bộ unit tests
npm run test

# Chạy một file cụ thể
npm run test -- auth.test.tsx

# Watch mode (tự chạy lại khi file thay đổi)
npm run test:watch

# Xem test coverage
npm run test:coverage
```

**Cấu trúc test:**

| Thư mục | Nội dung test |
|---|---|
| `__tests__/core/` | `apiClient` interceptors, Auth flow (login/logout/token) |
| `__tests__/attendance/` | Attendance pages rendering, service API calls |
| `__tests__/leave/` | Leave request pages, leave service |
| `__tests__/hrm/` | Employee/Department pages, HRM service |
| `__tests__/payroll/` | Payroll pages rendering |
| `__tests__/mocks/` | MSW handlers, file mock |

**Viết test mới:**

```tsx
// src/__tests__/<module>/services.test.ts
import { someService } from '../../services/someService'

describe('someService', () => {
  it('should fetch data correctly', async () => {
    // Arrange: setup MSW handler
    // Act: call service method
    // Assert: verify response
  })
})
```

**Custom render (đã bao gồm Providers):**

```tsx
import { render } from '../test-utils' // Tự động wrap QueryClient, Router, Auth
render(<MyComponent />)
```

### E2E Tests (Selenium)

**Công cụ**: Selenium WebDriver + Jest  
**Yêu cầu**: Toàn bộ hệ thống (Database + Backend + Frontend) phải đang chạy.

```bash
# Chạy toàn bộ E2E (script tự động)
chmod +x run-e2e.sh
./run-e2e.sh

# Hoặc chạy thủ công
npm run test:e2e

# Chạy một flow cụ thể
npm run test:e2e -- admin.workflow.e2e.test.ts
```

**Kiến trúc E2E (Page Object Model):**

```
selenium/
├── pages/          ← Page Objects (đóng gói selectors & actions)
│   ├── LoginPO     → login(username, password)
│   ├── EmployeePO  → createEmployee(), deleteEmployee()
│   ├── AttendancePO → checkIn(), checkOut()
│   ├── LeaveRequestPO → submitRequest(), approve()
│   └── PayrollPO   → generatePayroll()
├── helpers/        ← Driver setup, wait strategies, human-like input
└── flows/          ← Test scenarios (kịch bản end-to-end)
```

**Flows hiện có:**

| File | Kịch bản |
|---|---|
| `admin.workflow.e2e.test.ts` | Admin: login → tạo nhân viên → chấm công → duyệt phép → tạo lương |
| `employee.workflow.e2e.test.ts` | Employee: login → xem chấm công → gửi đơn phép → xem lương |

---

## 📦 Build & Deployment

### Build production

```bash
# Type-check + build
npm run build
```

Output được tạo tại thư mục `dist/`, có thể serve bằng bất kỳ static file server nào (Nginx, Apache, Caddy, ...).

### Preview bản build

```bash
npm run preview
```

### Lint kiểm tra code

```bash
npm run lint
```

### Scripts tổng hợp

| Script | Lệnh | Mô tả |
|---|---|---|
| `npm run dev` | `vite` | Khởi chạy dev server (HMR) |
| `npm run build` | `tsc -b && vite build` | Type-check + bundle production |
| `npm run preview` | `vite preview` | Preview bản build locally |
| `npm run lint` | `eslint .` | Kiểm tra code style |
| `npm run test` | `jest` | Chạy unit tests |
| `npm run test:watch` | `jest --watch` | Unit tests watch mode |
| `npm run test:coverage` | `jest --coverage` | Unit tests + coverage report |
| `npm run test:e2e` | `jest (selenium)` | Chạy E2E tests |

---

## 🔧 Xử lý sự cố (Troubleshooting)

### ❌ `npm install` báo lỗi peer dependency

```bash
npm install --legacy-peer-deps
```

### ❌ Port 5173 đã bị chiếm

```bash
# Tìm process đang dùng port
lsof -i :5173

# Kill process
kill -9 <PID>
```

### ❌ API trả về 401 liên tục

- Kiểm tra Backend có đang chạy tại `http://localhost:8080` không
- Xóa token cũ: mở DevTools → Application → Local Storage → xóa `token`
- Đăng nhập lại

### ❌ Proxy không hoạt động (CORS error)

- Đảm bảo đang truy cập qua `http://localhost:5173` (không phải IP)
- Kiểm tra `vite.config.ts` → `server.proxy` đã cấu hình đúng target
- Restart dev server: `Ctrl+C` rồi `npm run dev`

### ❌ Test fail vì timeout

```bash
# Tăng timeout cho Jest
npm run test -- --testTimeout=10000
```

### ❌ E2E test fail

- Đảm bảo **cả 3 service** đang chạy (Database, Backend, Frontend)
- Đảm bảo có Chrome/Chromium được cài sẵn (Selenium cần trình duyệt thật)
- Kiểm tra tài khoản test (`admin` / `admin123`) đã được seed vào database

---

## 📚 Tài liệu tham khảo

| Tài liệu | Link |
|---|---|
| React Docs | https://react.dev |
| Vite Docs | https://vite.dev/guide |
| TanStack Query | https://tanstack.com/query/latest |
| React Router | https://reactrouter.com |
| Tailwind CSS | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Jest | https://jestjs.io/docs/getting-started |
| React Testing Library | https://testing-library.com/docs/react-testing-library/intro |
| Selenium WebDriver | https://www.selenium.dev/documentation |
| Backend README | [backend/README.md](../backend/README.md) |
| Hướng dẫn cài đặt tổng hợp | [README.md (root)](../README.md) |
