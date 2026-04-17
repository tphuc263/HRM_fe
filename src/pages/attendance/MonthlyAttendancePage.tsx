import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
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
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [month, setMonth] = useState(getCurrentMonth())
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [stats, setStats] = useState<MonthlyStatsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
          attendanceService.getEmployeeRecords(employeeId, { from: range.from, to: range.to }),
          attendanceService.getMonthlyStats(employeeId, range.month, range.year),
        ])
        setRecords(recordData)
        setStats(statsData)
      } else {
        const data = await attendanceService.getMyRecords({ from: range.from, to: range.to })
        setRecords(data)

        const totalWorkDays = data.filter((r) => r.status !== 'ABSENT').length
        const lateCount = data.filter((r) => r.status === 'LATE').length
        const totalOvertimeHours = data.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0)

        setStats({
          employeeId: data[0]?.employeeId || 0,
          employeeCode: data[0]?.employeeCode || '-',
          employeeName: data[0]?.employeeName || user?.employeeName || user?.username || '-',
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
    } finally {
      setLoading(false)
    }
  }, [employeeId, isAdmin, month, user?.employeeName, user?.username])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => (a.date > b.date ? 1 : -1)),
    [records],
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4">
        <span className="text-white text-sm font-medium">TIME365</span>
      </div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Cong thang</h1></div>

        <div className="bg-white border rounded-md p-4 mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Thang lam viec</label>
              <div className="relative">
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="pr-8" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nhan vien</label>
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
                Tai lai
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Nhan vien</p>
                <p className="font-medium">{stats.employeeCode} - {stats.employeeName}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Ngay di lam</p>
                <p className="font-medium">{stats.totalWorkDays}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">So lan di tre</p>
                <p className="font-medium">{stats.lateCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Tong gio OT</p>
                <p className="font-medium">{stats.totalOvertimeHours}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ngay</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Gio lam</TableHead>
                <TableHead>Tang ca</TableHead>
                <TableHead>Ghi chu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Dang tai du lieu...</TableCell></TableRow>
              ) : sortedRecords.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Khong co du lieu cong thang</TableCell></TableRow>
              ) : sortedRecords.map((r) => (
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
      </div>
    </div>
  )
}
