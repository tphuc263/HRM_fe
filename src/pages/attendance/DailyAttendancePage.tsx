import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Pencil,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import type { AttendanceRecordDto, AttendanceUpdatePayload } from '../../types/attendance'
import { useAuth } from '../../context/useAuth'

const PAGE_SIZE = 10

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

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value)
  return `"${raw.replaceAll('"', '""')}"`
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csvContent = ['\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n')]
  const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
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
  const [currentPage, setCurrentPage] = useState(1)

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
      setCurrentPage(1)
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
    let data = rows
    if (search.trim()) {
      const keyword = search.toLowerCase()
      data = rows.filter((r) =>
        [r.employeeCode, r.employeeName, r.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      )
    }

    return [...data].sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'vi', { sensitivity: 'base' }))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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

  const handleAdminEdit = async (row: AttendanceRecordDto) => {
    if (!row.id) {
      setError('Bản ghi này chưa có ID, không thể cập nhật')
      return
    }

    const checkIn = window.prompt('Check-in (HH:mm, để trống nếu giữ nguyên)', row.checkIn?.slice(0, 5) || '')
    if (checkIn === null) return
    const checkOut = window.prompt('Check-out (HH:mm, để trống nếu giữ nguyên)', row.checkOut?.slice(0, 5) || '')
    if (checkOut === null) return
    const status = window.prompt('Trạng thái (ON_TIME, LATE, EARLY_LEAVE, ABSENT, HALF_DAY)', row.status || '')
    if (status === null) return
    const note = window.prompt('Ghi chú', row.note || '')
    if (note === null) return

    const payload: AttendanceUpdatePayload = {
      checkIn: checkIn.trim() || undefined,
      checkOut: checkOut.trim() || undefined,
      status: status.trim() || undefined,
      note: note.trim() || undefined,
    }

    setActionLoading(true)
    try {
      await attendanceService.adminUpdate(row.id, payload)
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    const rows: string[][] = [
      ['Mã nhân viên', 'Họ tên', 'Ngày', 'Check-in', 'Check-out', 'Trạng thái', 'Giờ làm', 'Tăng ca', 'Ghi chú'],
      ...filteredRows.map((r) => [
        r.employeeCode,
        r.employeeName,
        r.date,
        r.checkIn || '',
        r.checkOut || '',
        r.status || '',
        String(r.workHours ?? 0),
        String(r.overtimeHours ?? 0),
        r.note || '',
      ]),
    ]

    downloadCsv(`attendance-daily-${date}.csv`, rows)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4">
        <span className="text-white text-sm font-medium">TIME365</span>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Công ngày</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <FileDown className="h-4 w-4" />
              Báo cáo Excel
            </Button>
            {!isAdmin && (
              <>
                <Button onClick={handleCheckIn} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Check-in
                </Button>
                <Button variant="outline" onClick={handleCheckOut} disabled={actionLoading}>
                  <LogOut className="h-4 w-4" />
                  Check-out
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nhân viên / trạng thái</label>
              <div className="relative">
                <Input
                  placeholder="Tìm theo tên, mã, trạng thái"
                  className="pr-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Theo ngày</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => void loadData()}>
                <RefreshCw className="h-4 w-4" />
                Tải lại
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
                <TableHead>Họ tên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Giờ làm</TableHead>
                <TableHead>Tăng ca</TableHead>
                {isAdmin && <TableHead>Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu công ngày
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={`${row.employeeId}-${row.date}-${row.id || 'x'}`}>
                    <TableCell className="font-medium">{row.employeeCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{formatTime(row.checkIn)}</TableCell>
                    <TableCell>{formatTime(row.checkOut)}</TableCell>
                    <TableCell>{statusLabel(row.status)}</TableCell>
                    <TableCell>{row.workHours ?? 0}</TableCell>
                    <TableCell>{row.overtimeHours ?? 0}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => void handleAdminEdit(row)} disabled={actionLoading}>
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-2 py-3 border-t bg-background">
          <span className="text-sm text-muted-foreground">
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} trong {filteredRows.length} bản ghi
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
