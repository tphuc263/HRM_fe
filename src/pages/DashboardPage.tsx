import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  CalendarClock,
  Clock3,
  Filter,
  FileText,
  Search,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../context/useAuth'
import { attendanceService } from '../services/attendanceService'
import { departmentService } from '../services/departmentService'
import { employeeService } from '../services/employeeService'
import { leaveService } from '../services/leaveService'
import type { AttendanceRecordDto } from '../types/attendance'
import type { DepartmentDto, EmployeeDto } from '../types/hrm'
import type { LeaveRequestDto } from '../types/leave'

interface MetricItem {
  id: string
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

interface ActivityItem {
  id: string
  employeeName: string
  department: string
  action: string
  actionClassName: string
  date: string
  position: string
  status: string
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('vi-VN')
}

function formatCurrency(value?: number | null) {
  if (value == null) {
    return '-'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function statusLabel(status: string) {
  const normalized = status?.toUpperCase()
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    PRESENT: 'Có mặt',
    LATE: 'Đi trễ',
    ABSENT: 'Vắng mặt',
  }
  return map[normalized] || status
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([])
  const [todayAttendanceList, setTodayAttendanceList] = useState<AttendanceRecordDto[]>([])
  const [pendingLeaveTotal, setPendingLeaveTotal] = useState(0)
  const [todayMyAttendance, setTodayMyAttendance] = useState<AttendanceRecordDto | null>(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESIGNED'>('ALL')
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState<number | 'ALL'>('ALL')
  const [employeeSortField, setEmployeeSortField] = useState<'JOIN_DATE' | 'NAME' | 'SALARY'>('JOIN_DATE')
  const [employeeSortDirection, setEmployeeSortDirection] = useState<'asc' | 'desc'>('desc')

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      if (isAdmin) {
        const today = toDateString(new Date())
        const [employeesResult, requestsResult, attendanceResult, departmentsResult] = await Promise.allSettled([
          employeeService.getAll({ page: 0, size: 300, sortBy: 'name', sortDir: 'asc' }),
          leaveService.getAllRequests({ status: 'PENDING', page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
          attendanceService.getDaily({ date: today, page: 0, size: 300, sortBy: 'employee.code', sortDir: 'asc' }),
          departmentService.getAll(),
        ])

        setEmployees(employeesResult.status === 'fulfilled' ? employeesResult.value.content : [])
        setLeaveRequests(requestsResult.status === 'fulfilled' ? requestsResult.value.content : [])
        setPendingLeaveTotal(requestsResult.status === 'fulfilled' ? requestsResult.value.totalElements : 0)
        setTodayAttendanceList(attendanceResult.status === 'fulfilled' ? attendanceResult.value.content : [])
        setDepartments(departmentsResult.status === 'fulfilled' ? departmentsResult.value : [])
        setTodayMyAttendance(null)

        if (
          employeesResult.status === 'rejected' &&
          requestsResult.status === 'rejected' &&
          attendanceResult.status === 'rejected' &&
          departmentsResult.status === 'rejected'
        ) {
          throw new Error('Không thể tải dữ liệu dashboard')
        }
      } else {
        const [myRequestsResult, myAttendanceResult] = await Promise.allSettled([
          leaveService.getMyRequests({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
          attendanceService.getToday(),
        ])

        setEmployees([])
        setLeaveRequests(myRequestsResult.status === 'fulfilled' ? myRequestsResult.value.content : [])
        setPendingLeaveTotal(
          myRequestsResult.status === 'fulfilled'
            ? myRequestsResult.value.content.filter((request) => request.status === 'PENDING').length
            : 0,
        )
        setTodayAttendanceList([])
        setDepartments([])
        setTodayMyAttendance(myAttendanceResult.status === 'fulfilled' ? myAttendanceResult.value : null)

        if (myRequestsResult.status === 'rejected' && myAttendanceResult.status === 'rejected') {
          throw new Error('Không thể tải dữ liệu dashboard')
        }
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  const metrics = useMemo<MetricItem[]>(() => {
    if (isAdmin) {
      const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE').length
      const resignedEmployees = employees.filter((employee) => employee.status === 'RESIGNED').length
      const pendingLeaves = pendingLeaveTotal
      const checkedInEmployees = todayAttendanceList.filter((record) => Boolean(record.checkIn)).length

      return [
        {
          id: 'total-employees',
          title: 'Tổng nhân sự',
          value: `${employees.length}`,
          subtitle: `${activeEmployees} đang làm việc`,
          icon: Users,
        },
        {
          id: 'pending-leaves',
          title: 'Đơn chờ duyệt',
          value: `${pendingLeaves}`,
          subtitle: 'Cần xử lý trong hôm nay',
          icon: FileText,
        },
        {
          id: 'checked-in',
          title: 'Đã check-in hôm nay',
          value: `${checkedInEmployees}`,
          subtitle: `Vắng/đã nghỉ: ${Math.max(0, employees.length - checkedInEmployees - resignedEmployees)}`,
          icon: UserCheck,
        },
      ]
    }

    const pending = leaveRequests.filter((request) => request.status === 'PENDING').length
    const approved = leaveRequests.filter((request) => request.status === 'APPROVED').length
    const todayStatus = todayMyAttendance?.status ? statusLabel(todayMyAttendance.status) : 'Chưa có bản ghi'

    return [
      {
        id: 'my-attendance',
        title: 'Trạng thái hôm nay',
        value: todayStatus,
        subtitle: todayMyAttendance?.checkIn ? `Check-in ${todayMyAttendance.checkIn.slice(0, 5)}` : 'Bạn chưa check-in',
        icon: AlarmClock,
      },
      {
        id: 'my-pending-requests',
        title: 'Đơn chờ duyệt',
        value: `${pending}`,
        subtitle: 'Các yêu cầu nghỉ phép đang chờ xử lý',
        icon: CalendarClock,
      },
      {
        id: 'my-approved-requests',
        title: 'Đơn đã duyệt',
        value: `${approved}`,
        subtitle: 'Tổng số yêu cầu nghỉ phép đã được duyệt',
        icon: FileText,
      },
    ]
  }, [employees, isAdmin, leaveRequests, pendingLeaveTotal, todayAttendanceList, todayMyAttendance])

  const recentRequests = useMemo(() => {
    return [...leaveRequests]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5)
  }, [leaveRequests])

  const quickLinks = useMemo(() => {
    if (isAdmin) {
      return [
        { to: '/admin/employees', label: 'Danh sách nhân viên', hint: 'Quản lý hồ sơ và trạng thái nhân sự', icon: Users },
        { to: '/admin/attendance/daily', label: 'Công ngày', hint: 'Theo dõi chấm công theo ngày', icon: CalendarClock },
        { to: '/admin/attendance/absence', label: 'Quản lý vắng', hint: 'Xử lý nhân sự vắng mặt', icon: FileText },
        { to: '/admin/payroll/manage', label: 'Quản lý lương', hint: 'Duyệt và điều chỉnh bảng lương', icon: Wallet },
      ]
    }

    return [
      { to: '/attendance/daily', label: 'Công ngày', hint: 'Kiểm tra giờ vào/ra hôm nay', icon: Clock3 },
      { to: '/attendance/overtime', label: 'Đăng ký tăng ca', hint: 'Tạo và quản lý phiếu tăng ca', icon: CalendarClock },
      { to: '/attendance/leave-request', label: 'Đơn xin nghỉ', hint: 'Theo dõi trạng thái yêu cầu nghỉ phép', icon: FileText },
      { to: '/payroll/my-salary', label: 'Lương của tôi', hint: 'Xem bảng lương cá nhân', icon: Wallet },
    ]
  }, [isAdmin])

  const recentActivities = useMemo<ActivityItem[]>(() => {
    if (!isAdmin) {
      return []
    }

    return employees
      .map((employee) => {
        const resignDate = employee.resignationDate || ''
        const joinDate = employee.joinDate || ''
        const updatedAt = employee.updatedAt || employee.createdAt || ''
        const latestDate = resignDate || updatedAt || joinDate

        const isResigned = employee.status === 'RESIGNED' && Boolean(resignDate)
        const isNewJoin = Boolean(joinDate)
        const action = isResigned ? 'Nghỉ việc' : isNewJoin ? 'Gia nhập' : 'Cập nhật hồ sơ'
        const actionClassName = isResigned
          ? 'bg-red-100 text-red-700'
          : action === 'Gia nhập'
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'

        return {
          id: `activity-${employee.id}-${latestDate}`,
          employeeName: employee.name,
          department: employee.departmentName || '-',
          action,
          actionClassName,
          date: latestDate,
          position: 'Nhân viên',
          status: isResigned ? 'Đang xử lý' : 'Hoàn thành',
        }
      })
      .filter((item) => item.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5)
  }, [employees, isAdmin])

  const newEmployees = useMemo(() => {
    if (!isAdmin) {
      return []
    }

    const searchTerm = employeeSearch.trim().toLowerCase()

    return [...employees]
      .filter((employee) => {
        if (employeeStatusFilter !== 'ALL' && employee.status !== employeeStatusFilter) {
          return false
        }

        if (employeeDepartmentFilter !== 'ALL' && employee.departmentId !== employeeDepartmentFilter) {
          return false
        }

        if (!searchTerm) {
          return true
        }

        return (
          employee.name.toLowerCase().includes(searchTerm)
          || employee.code.toLowerCase().includes(searchTerm)
          || (employee.departmentName || '').toLowerCase().includes(searchTerm)
        )
      })
      .sort((a, b) => {
        if (employeeSortField === 'NAME') {
          const comparison = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
          return employeeSortDirection === 'asc' ? comparison : -comparison
        }

        if (employeeSortField === 'SALARY') {
          const salaryA = a.currentSalary ?? a.latestNetSalary ?? 0
          const salaryB = b.currentSalary ?? b.latestNetSalary ?? 0
          const comparison = salaryA - salaryB
          return employeeSortDirection === 'asc' ? comparison : -comparison
        }

        const dateA = a.joinDate || ''
        const dateB = b.joinDate || ''
        const comparison = dateA.localeCompare(dateB)
        return employeeSortDirection === 'asc' ? comparison : -comparison
      })
      .slice(0, 5)
  }, [
    employeeDepartmentFilter,
    employeeSearch,
    employeeSortDirection,
    employeeSortField,
    employeeStatusFilter,
    employees,
    isAdmin,
  ])

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex items-center justify-between rounded-lg border bg-white px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </section>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {metrics.map(({ id, icon: Icon, subtitle, title, value }) => (
            <article key={id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {isLoading ? '...' : value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </section>

        {isAdmin && (
          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Danh sách nhân viên mới</h2>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <div className="relative min-w-[220px] flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    placeholder="Tìm kiếm nhân viên..."
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-10 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <select
                    value={employeeStatusFilter}
                    onChange={(event) => setEmployeeStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'RESIGNED')}
                    className="bg-transparent outline-none"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang làm việc</option>
                    <option value="RESIGNED">Nghỉ việc</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-10 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <select
                    value={employeeDepartmentFilter === 'ALL' ? 'ALL' : String(employeeDepartmentFilter)}
                    onChange={(event) => {
                      const value = event.target.value
                      setEmployeeDepartmentFilter(value === 'ALL' ? 'ALL' : Number(value))
                    }}
                    className="bg-transparent outline-none"
                  >
                    <option value="ALL">Tất cả phòng ban</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-10 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <select
                    value={employeeSortField}
                    onChange={(event) => setEmployeeSortField(event.target.value as 'JOIN_DATE' | 'NAME' | 'SALARY')}
                    className="bg-transparent outline-none"
                  >
                    <option value="JOIN_DATE">Sắp xếp: Ngày vào</option>
                    <option value="NAME">Sắp xếp: Tên</option>
                    <option value="SALARY">Sắp xếp: Lương cơ bản</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-10 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <select
                    value={employeeSortDirection}
                    onChange={(event) => setEmployeeSortDirection(event.target.value as 'asc' | 'desc')}
                    className="bg-transparent outline-none"
                  >
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Mã NV</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Họ tên</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Phòng ban</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Ngày vào</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Trạng thái</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Lương</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Đang tải dữ liệu...</td>
                    </tr>
                  ) : newEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Không có nhân viên phù hợp.</td>
                    </tr>
                  ) : (
                    newEmployees.map((employee) => (
                      <tr key={employee.id} className="border-t border-slate-200">
                        <td className="px-3 py-2 font-medium text-blue-600">{employee.code}</td>
                        <td className="px-3 py-2 text-foreground">{employee.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{employee.departmentName || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{employee.joinDate ? formatDate(employee.joinDate) : '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-1 text-xs ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {employee.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-foreground">{formatCurrency(employee.currentSalary ?? employee.latestNetSalary)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isAdmin ? 'Yêu cầu nghỉ phép gần đây' : 'Yêu cầu nghỉ phép của bạn'}
            </h2>
            <Link to={isAdmin ? '/admin/attendance/leave-request' : '/attendance/leave-request'} className="text-sm text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có yêu cầu nghỉ phép nào.</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {request.employeeName} • {request.leaveTypeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)} • {request.days} ngày
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {statusLabel(request.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {isAdmin ? (
          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Biến động gần đây</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có biến động gần đây.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Nhân viên</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Phòng ban</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Hành động</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Ngày</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Vị trí</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-3 py-2 font-medium text-foreground">{item.employeeName}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.department}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-1 text-xs ${item.actionClassName}`}>
                            {item.action}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(item.date)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.position}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Truy cập nhanh</h2>
            <div className="space-y-3">
              {quickLinks.map(({ hint, icon: Icon, label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
