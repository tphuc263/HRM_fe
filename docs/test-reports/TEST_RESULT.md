# HRM Frontend Unit Test Execution Report

## Thống Kê Tổng Quan

| Chỉ Số | Giá Trị |
| :--- | :--- |
| **Tổng số Test Cases** | `107` |
| **Thành công (Passed)** | `107` |
| **Thất bại (Failed)** | `0` |
| **Bỏ qua (Skipped)** | `0` |
| **Tỷ lệ thành công** | **100.0%** |
| **Tổng thời gian chạy** | `2.54 s` |

## Chi Tiết Kết Quả Kiểm Thử (Trích xuất)

| Trạng Thái | Bộ Kiểm Thử (Suite) | Tên Test Case (Method) | Thời Gian Chạy |
| :---: | :--- | :--- | :---: |
| SUCCESS | `apiClient` | Request interceptor gắn Bearer token khi có token trong sessionStorage | `53 ms` |
| SUCCESS | `apiClient` | Request interceptor không gắn header khi không có token | `8 ms` |
| SUCCESS | `apiClient` | Response interceptor unwrap ApiResponse.data khi success=true | `22 ms` |
| SUCCESS | `apiClient` | 401 -> xóa token + redirect /login | `4 ms` |
| SUCCESS | `apiClient` | Error parsing: trích message từ AxiosError response | `5 ms` |
| SUCCESS | `Auth Module > authService` | login() -> POST /auth/login | `2 ms` |
| SUCCESS | `Auth Module > authService` | me() -> GET /auth/me | `0 ms` |
| SUCCESS | `Auth Module > AuthContext` | Không có token -> user=null, loading=false | `43 ms` |
| SUCCESS | `Auth Module > AuthContext` | login() -> lưu token + set user | `68 ms` |
| SUCCESS | `Auth Module > AuthContext` | logout() -> xóa token + user=null | `17 ms` |
| SUCCESS | `Auth Module > RequireAuth` | Chưa login -> redirect /login | `2 ms` |
| SUCCESS | `Auth Module > LoginPage` | Submit form trống -> lỗi "Vui lòng nhập đầy đủ..." | `16 ms` |
| SUCCESS | `Auth Module > LoginPage` | Submit hợp lệ -> gọi login() API + gọi login() context + navigate | `90 ms` |
| SUCCESS | `Auth Module > LoginPage` | Login thất bại -> hiện error message | `83 ms` |
| SUCCESS | `Auth Module > LoginPage` | Forgot: verify OTP thành công -> success message + đóng modal | `66 ms` |
| SUCCESS | `Attendance Services > attendanceService` | checkIn | `95 ms` |
| SUCCESS | `Attendance Services > attendanceService` | checkOut | `4 ms` |
| SUCCESS | `Attendance Services > attendanceService` | getToday | `4 ms` |
| SUCCESS | `Attendance Services > overtimeService` | createRequest | `3 ms` |
| SUCCESS | `Attendance Services > overtimeService` | approveRequest | `14 ms` |
| SUCCESS | `leaveService` | getLeaveTypes() -> GET /leave-types | `47 ms` |
| SUCCESS | `leaveService` | submitRequest() -> POST /leave-requests | `9 ms` |
| SUCCESS | `leaveService` | approveRequest() -> PUT /leave-requests/:id/approve | `9 ms` |
| SUCCESS | `leaveService` | initBalance() -> POST /leave-balances/init với employeeId + year | `5 ms` |
| SUCCESS | `HRM Services > employeeService` | getAll | `89 ms` |
| SUCCESS | `HRM Services > employeeService` | create | `9 ms` |
| SUCCESS | `HRM Services > contractService` | activate | `7 ms` |
| SUCCESS | `HRM Services > departmentService` | getAll | `2 ms` |
| SUCCESS | `Payroll Pages > PayrollListPage` | Hiển thị danh sách payroll | `118 ms` |
| SUCCESS | `Payroll Pages > PayrollListPage` | Mở modal Tạo bảng lương -> generatePayroll | `139 ms` |
| SUCCESS | `Payroll Pages > PayrollListPage` | Chốt lương -> submitPayroll | `112 ms` |
| SUCCESS | `Payroll Pages > MyPayrollPage` | Download PDF gọi html2pdf | `26 ms` |
| SUCCESS | `Attendance Pages > DailyAttendancePage` | NV Check-in -> gọi checkIn() | `163 ms` |
| SUCCESS | `Attendance Pages > DailyAttendancePage` | Admin: xem danh sách chấm công ngày | `106 ms` |
| SUCCESS | `Attendance Pages > OvertimeRegistrationPage` | Click tạo mới -> mở modal đăng ký | `110 ms` |
| SUCCESS | `LeaveRequestPage` | Submit đơn -> gọi submitRequest() API | `397 ms` |
| SUCCESS | `LeaveRequestPage` | Admin: Reject -> nhập lý do -> rejectRequest() | `133 ms` |
| SUCCESS | `AbsenceManagementPage` | Search và Filter theo ngày | `12 ms` |
| SUCCESS | `HRM Pages > EmployeeListPage` | Search nhân viên | `1167 ms` |
| SUCCESS | `HRM Pages > EmployeeListPage` | Mở form tạo nhân viên | `85 ms` |

_Ghi chú: Bảng trên chỉ liệt kê một số test cases tiêu biểu. Tất cả 107 test cases đều thành công._
