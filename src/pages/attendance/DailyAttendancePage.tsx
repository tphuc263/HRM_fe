import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, LogIn, LogOut, RefreshCw, Search } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import type { AttendanceRecordDto } from '../../types/attendance'
import { useAuth } from '../../context/useAuth'

function formatDate(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

function formatTime(value?: string | null) {
  if (!value) return '-'
  return value.slice(0, 5)
}

function toIsoDate(value: Date) {
  return value.toISOString().split('T')[0]
}

function statusLabel(status?: string | null) {
  if (!status) return '-'
  const map: Record<string, string> = {
    ON_TIME: 'Dung gio',
    LATE: 'Di tre',
    EARLY_LEAVE: 'Ve som',
    ABSENT: 'Vang mat',
    HALF_DAY: 'Nua ngay',
  }
  return map[status] || status
}

export default function DailyAttendancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [date, setDate] = useState(toIsoDate(new Date()))
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const data = await attendanceService.getDaily(date)
        setRows(data)
      } else if (date === toIsoDate(new Date())) {
        const today = await attendanceService.getToday()
        setRows([today])
      } else {
        const data = await attendanceService.getMyRecords({ from: date, to: date })
        setRows(data)
      }
    } catch (err) {
      setRows([])
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [date, isAdmin])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const keyword = search.toLowerCase()
    return rows.filter((r) =>
      [r.employeeCode, r.employeeName, r.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [rows, search])

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await attendanceService.checkIn()
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await attendanceService.checkOut()
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4">
        <span className="text-white text-sm font-medium">TIME365</span>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Cong ngay</h1>
          {!isAdmin && (
            <div className="flex items-center gap-2">
              <Button onClick={handleCheckIn} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Check-in
              </Button>
              <Button variant="outline" onClick={handleCheckOut} disabled={actionLoading}>
                <LogOut className="h-4 w-4" />
                Check-out
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nhan vien / trang thai</label>
              <div className="relative">
                <Input
                  placeholder="Tim theo ten, ma, trang thai"
                  className="pr-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Theo ngay</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => void loadData()}>
                <RefreshCw className="h-4 w-4" />
                Tai lai
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Mã nhân viên</TableHead>
                <TableHead>Ho ten</TableHead>
                <TableHead>Ngay</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Gio lam</TableHead>
                <TableHead>Tang ca</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Dang tai du lieu...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Khong co du lieu cong ngay
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={`${row.employeeId}-${row.date}-${row.id || 'x'}`}>
                    <TableCell className="font-medium">{row.employeeCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{formatTime(row.checkIn)}</TableCell>
                    <TableCell>{formatTime(row.checkOut)}</TableCell>
                    <TableCell>{statusLabel(row.status)}</TableCell>
                    <TableCell>{row.workHours ?? 0}</TableCell>
                    <TableCell>{row.overtimeHours ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
