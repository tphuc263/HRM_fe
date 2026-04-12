import type { Employee } from '../types/employee'

export const mockEmployees: Employee[] = [
  { id: '1', employeeCode: '00000001', attendanceCode: '0001', fullName: 'Nguyễn Văn A', email: 'nguyenvana@tinviet.com', phone: '0123456789', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '2', employeeCode: '00000002', attendanceCode: '0002', fullName: 'Trần Thị Bích', email: 'tranthibich2@tinviet.com', phone: '0901000002', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '3', employeeCode: '00000003', attendanceCode: '0003', fullName: 'Lê Văn Cường', email: 'levancuong@tinviet.com', phone: '0901000003', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '4', employeeCode: '00000004', attendanceCode: '0004', fullName: 'Phạm Thị Dung', email: 'phamthidung@tinviet.com', phone: '0901000004', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '5', employeeCode: '00000005', attendanceCode: '0005', fullName: 'Hoàng Minh Đức', email: 'hoangminhduc@tinviet.com', phone: '0901000005', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '6', employeeCode: '00000006', attendanceCode: '0006', fullName: 'Vũ Thị Hạnh', email: 'vuthihanh@tinviet.com', phone: '0901000006', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '7', employeeCode: '00000007', attendanceCode: '0007', fullName: 'Bùi Văn Hoàng', email: 'buivanhoang@tinviet.com', phone: '0901000007', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '01/01/2025', status: 'active' },
  { id: '8', employeeCode: '00000008', attendanceCode: '0008', fullName: 'Đặng Thị Mai', email: 'dangthimai@tinviet.com', phone: '0901000008', department: 'IT', workGroup: 'Kỹ thuật', position: 'Kỹ sư', nationality: 'Việt Nam', startDate: '15/02/2025', status: 'active' },
  { id: '9', employeeCode: '00000009', attendanceCode: '0009', fullName: 'Ngô Văn Long', email: 'ngovanlong@tinviet.com', phone: '0901000009', department: 'HR', workGroup: 'Nhân sự', position: 'HR Manager', nationality: 'Việt Nam', startDate: '01/03/2025', status: 'active' },
  { id: '10', employeeCode: '00000010', attendanceCode: '0010', fullName: 'Trịnh Thị Lan', email: 'trinhhilan@tinviet.com', phone: '0901000010', department: 'Finance', workGroup: 'Tài chính', position: 'Kế toán', nationality: 'Việt Nam', startDate: '10/03/2025', status: 'probation' },
  { id: '11', employeeCode: '00000011', attendanceCode: '0011', fullName: 'Phan Đình Hùng', email: 'phandinhung@tinviet.com', phone: '0901000011', department: 'IT', workGroup: 'Kỹ thuật', position: 'Team Lead', nationality: 'Việt Nam', startDate: '01/04/2025', status: 'active' },
  { id: '12', employeeCode: '00000012', attendanceCode: '0012', fullName: 'Lý Thị Hương', email: 'lythihuong@tinviet.com', phone: '0901000012', department: 'Marketing', workGroup: 'Marketing', position: 'Marketing Manager', nationality: 'Việt Nam', startDate: '05/04/2025', status: 'active' },
  { id: '13', employeeCode: '00000013', attendanceCode: '0013', fullName: 'Văn Thị Nga', email: 'vanthinga@tinviet.com', phone: '0901000013', department: 'Sales', workGroup: 'Kinh doanh', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '12/04/2025', status: 'active' },
  { id: '14', employeeCode: '00000014', attendanceCode: '0014', fullName: 'Bùi Đình Tuấn', email: 'buidvinhtuan@tinviet.com', phone: '0901000014', department: 'IT', workGroup: 'Kỹ thuật', position: 'Kỹ sư', nationality: 'Việt Nam', startDate: '20/04/2025', status: 'inactive' },
  { id: '15', employeeCode: '00000015', attendanceCode: '0015', fullName: 'Trương Minh Quân', email: 'truongminhquan@tinviet.com', phone: '0901000015', department: 'Maintainance', workGroup: 'Hành chính', position: 'Nhân viên', nationality: 'Việt Nam', startDate: '25/04/2025', status: 'active' },
]

export const filterOptions = {
  positions: ['Tất cả', 'Nhân viên', 'Kỹ sư', 'Team Lead', 'HR Manager', 'Kế toán', 'Marketing Manager'],
  workplaces: ['Tất cả', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'],
  nationalities: ['Tất cả', 'Việt Nam', 'Anh', 'Mỹ', 'Nhật Bản', 'Hàn Quốc'],
  departments: ['Tất cả', 'Maintainance', 'IT', 'HR', 'Finance', 'Marketing', 'Sales'],
  statuses: ['Tất cả', 'Đang làm việc', 'Nghỉ việc', 'Thử việc'],
}

export const statusLabels: Record<Employee['status'], string> = {
  active: 'Đang làm việc',
  inactive: 'Nghỉ việc',
  probation: 'Thử việc',
}

