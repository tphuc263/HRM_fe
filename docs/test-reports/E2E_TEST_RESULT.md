# HRM E2E Test Execution Report

## Thống Kê Tổng Quan

| Chỉ Số | Giá Trị |
| :--- | :--- |
| **Tổng số Test Suites** | `2` (2 passed, 0 failed) |
| **Tổng số Test Cases** | `12` |
| **Thành công (Passed)** | `12` |
| **Thất bại (Failed)** | `0` |
| **Tỷ lệ thành công** | **100.0%** |
| **Tổng thời gian chạy** | `124.77 s` |

## Chi Tiết Kết Quả Kiểm Thử (E2E Workflows)

### 1. Admin Workflow (PASS)
**Tập tin:** `selenium/flows/admin.workflow.e2e.test.ts`
**Thời gian:** `87.35 s`

| Trạng Thái | Bước Kiểm Thử | Thời Gian |
| :---: | :--- | :---: |
| SUCCESS | 1. Đăng nhập và xem Dashboard | `~7.8 s` |
| SUCCESS | 2. Quản lý Nhân sự: Tạo mới nhân viên | `~23.1 s` |
| SUCCESS | 3. Bảng lương: Duyệt 1 phiếu lương | `~4.0 s` |
| SUCCESS | 4. Quản lý Chấm công | `~17.7 s` |
| SUCCESS | 5. Đơn xin nghỉ: Duyệt 1 đơn | `~14.5 s` |
| SUCCESS | 6. Quản lý vắng mặt: Đánh dấu vắng | `~9.2 s` |
| SUCCESS | 7. Cài đặt hệ thống: Tạo phòng ban | `~8.6 s` |

### 2. Employee Workflow (PASS)
**Tập tin:** `selenium/flows/employee.workflow.e2e.test.ts`
**Thời gian:** `37.41 s`

| Trạng Thái | Bước Kiểm Thử | Thời Gian |
| :---: | :--- | :---: |
| SUCCESS | 1. Đăng nhập và xem Dashboard | `~8.2 s` |
| SUCCESS | 2. Chấm công hàng ngày (Check-in / Check-out) | `~4.0 s` |
| SUCCESS | 3. Đăng ký tăng ca | `~5.9 s` |
| SUCCESS | 4. Đơn xin nghỉ: Tạo đơn mới & Filter | `~8.0 s` |
| SUCCESS | 5. Bảng lương cá nhân | `~8.6 s` |

_Ghi chú: Toàn bộ E2E Test Suite chạy ổn định (Sequentially) trên giao diện Headless. Không phát hiện lỗi UI hay xung đột luồng dữ liệu._
