import { useCallback, useEffect, useState } from 'react'
import { Calendar, RefreshCw, FileDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import { employeeService } from '../../services/employeeService'
import type { AttendanceRecordDto, MonthlyStatsDto } from '../../types/attendance'
import type { EmployeeDto } from '../../types/hrm'
import { useAuth } from '../../context/useAuth'

function getCurrentMonth() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${mm}`
}

function getDateRange(month: string) {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const m = Number(monthStr)
  const first = new Date(year, m - 1, 1)
  const last = new Date(year, m, 0)
  return {
    from: first.toISOString().split('T')[0],
    to: last.toISOString().split('T')[0],
    month: m,
    year,
  }
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

export default function MonthlyAttendancePage() {
  const PAGE_SIZE = 10
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [month, setMonth] = useState(getCurrentMonth())
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [stats, setStats] = useState<MonthlyStatsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const loadEmployees = async () => {
      if (!isAdmin) return
      try {
        const data = await employeeService.getAll({ page: 0, size: 100, sortBy: 'name' })
        setEmployees(data.content)
        if (data.content.length > 0) {
          setEmployeeId(data.content[0].id)
        }
      } catch {
        setEmployees([])
      }
    }
    void loadEmployees()
  }, [isAdmin])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const range = getDateRange(month)
      if (isAdmin) {
        if (!employeeId) {
          setRecords([])
          setStats(null)
          return
        }

        const [recordData, statsData] = await Promise.all([
          attendanceService.getEmployeeRecords(employeeId, {
            from: range.from,
            to: range.to,
            page: currentPage - 1,
            size: PAGE_SIZE,
            sortBy: 'date',
            sortDir: 'desc',
          }),
          attendanceService.getMonthlyStats(employeeId, range.month, range.year),
        ])
        setRecords(recordData.content)
        setTotalPages(Math.max(1, recordData.totalPages))
        setTotalItems(recordData.totalElements)
        setStats(statsData)
      } else {
        const data = await attendanceService.getMyRecords({
          from: range.from,
          to: range.to,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        setRecords(data.content)
        setTotalPages(Math.max(1, data.totalPages))
        setTotalItems(data.totalElements)

        const totalWorkDays = data.content.filter((r) => r.status !== 'ABSENT').length
        const lateCount = data.content.filter((r) => r.status === 'LATE').length
        const totalOvertimeHours = data.content.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0)

        setStats({
          employeeId: data.content[0]?.employeeId || 0,
          employeeCode: data.content[0]?.employeeCode || '-',
          employeeName: data.content[0]?.employeeName || user?.employeeName || user?.username || '-',
          month: range.month,
          year: range.year,
          totalWorkDays,
          lateCount,
          totalOvertimeHours,
        })
      }
    } catch (err) {
      setError((err as Error).message)
      setRecords([])
      setStats(null)
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [employeeId, isAdmin, month, user?.employeeName, user?.username, currentPage])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [month, employeeId])

  const handleExport = () => {
    const header = ['Ngày', 'Check-in', 'Check-out', 'Trạng thái', 'Giờ làm', 'Tăng ca', 'Ghi chú']
    const csvRows = [
      '\uFEFF' + header.join(','),
      ...records.map((r) => [
        r.date,
        r.checkIn || '',
        r.checkOut || '',
        r.status || '',
        String(r.workHours ?? 0),
        String(r.overtimeHours ?? 0),
        (r.note || '').replaceAll(',', ' '),
      ].join(',')),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `attendance-monthly-${month}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10">
        <Calendar className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">CÔNG THÁNG</span>
      </div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div></div>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4" />
            Báo cáo Excel
          </Button>
        </div>

        <div className="bg-white border rounded-md p-4 mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tháng làm việc</label>
              <div className="relative">
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="pr-8" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nhân viên</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={employeeId || ''}
                  onChange={(e) => setEmployeeId(Number(e.target.value))}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.code} - {e.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <Button variant="outline" onClick={() => void loadData()}>
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Nhân viên</p>
                <p className="font-medium">{stats.employeeCode} - {stats.employeeName}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Ngày đi làm</p>
                <p className="font-medium">{stats.totalWorkDays}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Số lần đi trễ</p>
                <p className="font-medium">{stats.lateCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Tổng giờ OT</p>
                <p className="font-medium">{stats.totalOvertimeHours}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ngày</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Giờ làm</TableHead>
                <TableHead>Tăng ca</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có dữ liệu công tháng</TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={`${r.id || 'x'}-${r.employeeId}-${r.date}`}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{r.checkIn?.slice(0, 5) || '-'}</TableCell>
                  <TableCell>{r.checkOut?.slice(0, 5) || '-'}</TableCell>
                  <TableCell>{r.status || '-'}</TableCell>
                  <TableCell>{r.workHours ?? 0}</TableCell>
                  <TableCell>{r.overtimeHours ?? 0}</TableCell>
                  <TableCell>{r.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-2 py-3 border-t bg-background">
          <span className="text-sm text-muted-foreground">
            Hiển thị {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalItems)} trong {totalItems} bản ghi
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 text-sm">Trang {currentPage} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
