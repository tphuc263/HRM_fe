import { useCallback, useEffect, useState } from 'react'
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
  Calendar,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import type { AttendanceRecordDto, AttendanceUpdatePayload } from '../../types/attendance'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/ToastContext'
import { downloadExcel } from '../../utils/exportUtils'

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
    ON_TIME: 'Đúng giờ',
    LATE: 'Đi trễ',
    EARLY_LEAVE: 'Về sớm',
    ABSENT: 'Vắng mặt',
    HALF_DAY: 'Nửa ngày',
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

function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trinh duyet khong ho tro GPS. Vui long dung thiet bi/trinh duyet co dinh vi.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.warn('Lỗi định vị GPS:', error)
        reject(new Error('Khong lay duoc GPS. Vui long cap quyen dinh vi de cham cong.'))
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  })
}

function renderVerificationBadge(
  ipValid?: boolean | null,
  gpsValid?: boolean | null,
  ip?: string | null,
  lat?: number | null,
  lng?: number | null
) {
  if (ipValid == null && gpsValid == null) return null

  return (
    <div className="flex flex-col gap-0.5 mt-1 text-[10px] select-none">
      {ipValid != null && (
        <span
          className={`px-1 py-0.5 rounded-[3px] font-medium border inline-block w-fit cursor-help ${
            ipValid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={ip ? `IP: ${ip}` : 'Không xác định IP'}
        >
          🌐 IP: {ipValid ? 'Văn phòng' : 'Mạng ngoài'}
        </span>
      )}
      {gpsValid != null && (
        <span
          className={`px-1 py-0.5 rounded-[3px] font-medium border inline-block w-fit cursor-help ${
            gpsValid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={lat != null && lng != null ? `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Không xác định GPS'}
        >
          📍 GPS: {gpsValid ? 'Khớp' : 'Lệch'}
        </span>
      )}
    </div>
  )
}

export default function DailyAttendancePage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'ADMIN'

  const [date, setDate] = useState(toIsoDate(new Date()))
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date()
    return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))
  })
  const [toDate, setToDate] = useState(() => toIsoDate(new Date()))
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    record: AttendanceRecordDto | null
    checkIn: string
    checkOut: string
    status: string
    note: string
  }>({
    isOpen: false,
    record: null,
    checkIn: '',
    checkOut: '',
    status: 'ON_TIME',
    note: '',
  })

  const setQuickRange = (rangeType: 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days') => {
    const today = new Date()
    let from = new Date()
    let to = new Date()

    if (rangeType === 'this_month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1)
      to = today
    } else if (rangeType === 'last_month') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
    } else if (rangeType === 'last_7_days') {
      from = new Date()
      from.setDate(today.getDate() - 7)
      to = today
    } else if (rangeType === 'last_30_days') {
      from = new Date()
      from.setDate(today.getDate() - 30)
      to = today
    }

    setFromDate(toIsoDate(from))
    setToDate(toIsoDate(to))
    setCurrentPage(1)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const pageData = await attendanceService.getDaily({
          date,
          keyword: search.trim() || undefined,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'employee.code',
          sortDir: 'asc',
        })
        setRows(pageData.content)
        setTotalPages(Math.max(1, pageData.totalPages))
        setTotalItems(pageData.totalElements)
      } else {
        const pageData = await attendanceService.getMyRecords({
          from: fromDate,
          to: toDate,
          status: search.trim() || undefined,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        setRows(pageData.content)
        setTotalPages(Math.max(1, pageData.totalPages))
        setTotalItems(pageData.totalElements)
      }
    } catch (err) {
      setRows([])
      setTotalPages(1)
      setTotalItems(0)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, date, fromDate, toDate, isAdmin, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [date, fromDate, toDate, search])

  const handleCheckIn = async () => {
    setActionLoading(true)
    setError('')
    try {
      const coords = await getCoordinates()
      await attendanceService.checkIn(coords)
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    setError('')
    try {
      const coords = await getCoordinates()
      await attendanceService.checkOut(coords)
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdminEdit = (row: AttendanceRecordDto) => {
    if (!row.id) {
      setError('Bản ghi này chưa có ID, không thể cập nhật')
      return
    }

    setEditModal({
      isOpen: true,
      record: row,
      checkIn: row.checkIn?.slice(0, 5) || '',
      checkOut: row.checkOut?.slice(0, 5) || '',
      status: row.status || 'ON_TIME',
      note: row.note || '',
    })
  }

  const handleExport = () => {
    const csvRows: string[][] = [
      ['Mã nhân viên', 'Họ tên', 'Ngày', 'Check-in', 'Check-out', 'Trạng thái', 'Giờ làm', 'Tăng ca', 'Ghi chú'],
      ...rows.map((r) => [
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

    const fileName = isAdmin
      ? `attendance-daily-${date}-page-${currentPage}`
      : `attendance-history-${fromDate}-to-${toDate}-page-${currentPage}`
    downloadExcel(fileName, csvRows[0], csvRows.slice(1))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-12 flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center">
          <Calendar className="text-white h-5 w-5 mr-2" />
          <span className="text-white font-bold tracking-wide">
            {isAdmin ? 'CÔNG NGÀY' : 'LỊCH SỬ CHẤM CÔNG'}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport} className="bg-white text-[#3d6b59] hover:bg-white/90">
          <FileDown className="h-4 w-4 mr-1" />
          Báo cáo Excel
        </Button>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div></div>
          <div className="flex items-center gap-2">

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
              <label className="text-sm text-muted-foreground mb-1 block">
                {isAdmin ? 'Nhân viên / trạng thái' : 'Trạng thái công'}
              </label>
              <div className="relative">
                <Input
                  placeholder={isAdmin ? "Tìm theo tên, mã, trạng thái" : "Tìm theo trạng thái..."}
                  className="pr-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {isAdmin ? (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Theo ngày</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Từ ngày</label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Đến ngày</label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-end">
                <Button variant="outline" onClick={() => void loadData()}>
                  <RefreshCw className="h-4 w-4" />
                  Tải lại
                </Button>
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('last_7_days')}
                  className="rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-xs"
                >
                  7 ngày qua
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('last_30_days')}
                  className="rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-xs"
                >
                  30 ngày qua
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('this_month')}
                  className="rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-xs"
                >
                  Tháng này
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('last_month')}
                  className="rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-xs"
                >
                  Tháng trước
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadData()} className="h-8">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Tải lại
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {isAdmin && <TableHead>Mã nhân viên</TableHead>}
                {isAdmin && <TableHead>Họ tên</TableHead>}
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
                  <TableCell colSpan={isAdmin ? 9 : 6} className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 6} className="text-center py-8 text-muted-foreground">
                    {isAdmin ? 'Không có dữ liệu công ngày' : 'Không có dữ liệu chấm công trong khoảng thời gian này'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.employeeId}-${row.date}-${row.id || 'x'}`}>
                    {isAdmin && <TableCell className="font-medium">{row.employeeCode}</TableCell>}
                    {isAdmin && <TableCell>{row.employeeName}</TableCell>}
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{formatTime(row.checkIn)}</span>
                      {renderVerificationBadge(row.checkInIpValid, row.checkInGpsValid, row.checkInIp, row.checkInLat, row.checkInLng)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{formatTime(row.checkOut)}</span>
                      {renderVerificationBadge(row.checkOutIpValid, row.checkOutGpsValid, row.checkOutIp, row.checkOutLat, row.checkOutLng)}
                    </TableCell>
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

      {editModal.isOpen && editModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200 text-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Cập nhật công ngày</h3>
              <button 
                onClick={() => setEditModal({ isOpen: false, record: null, checkIn: '', checkOut: '', status: '', note: '' })} 
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <p className="text-slate-600 font-medium mb-2">
                Nhân viên: <strong>{editModal.record.employeeName}</strong> ({editModal.record.employeeCode})
              </p>
              <p className="text-slate-600 font-medium mb-4">
                Ngày công: <strong>{formatDate(editModal.record.date)}</strong>
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Giờ Check-in (HH:mm)</label>
                <Input 
                  type="time"
                  value={editModal.checkIn}
                  onChange={(e) => setEditModal(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="rounded-xl border-slate-200 h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Giờ Check-out (HH:mm)</label>
                <Input 
                  type="time"
                  value={editModal.checkOut}
                  onChange={(e) => setEditModal(prev => ({ ...prev, checkOut: e.target.value }))}
                  className="rounded-xl border-slate-200 h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Trạng thái công</label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal(prev => ({ ...prev, status: e.target.value }))}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#3d6b59]"
                >
                  <option value="ON_TIME">Đúng giờ (ON_TIME)</option>
                  <option value="LATE">Đi trễ (LATE)</option>
                  <option value="EARLY_LEAVE">Về sớm (EARLY_LEAVE)</option>
                  <option value="ABSENT">Vắng mặt (ABSENT)</option>
                  <option value="HALF_DAY">Nửa ngày (HALF_DAY)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Ghi chú</label>
                <Input 
                  type="text"
                  placeholder="Ghi chú điều chỉnh..."
                  value={editModal.note}
                  onChange={(e) => setEditModal(prev => ({ ...prev, note: e.target.value }))}
                  className="rounded-xl border-slate-200 h-10"
                />
              </div>
              <div className="mt-8 flex gap-3 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditModal({ isOpen: false, record: null, checkIn: '', checkOut: '', status: '', note: '' })} 
                  className="rounded-xl px-6"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  onClick={async () => {
                    setActionLoading(true)
                    try {
                      const payload: AttendanceUpdatePayload = {
                        checkIn: editModal.checkIn.trim() || undefined,
                        checkOut: editModal.checkOut.trim() || undefined,
                        status: editModal.status.trim() || undefined,
                        note: editModal.note.trim() || undefined,
                      }
                      await attendanceService.adminUpdate(editModal.record!.id!, payload)
                      toast.success('Cập nhật công ngày thành công')
                      await loadData()
                      setEditModal({ isOpen: false, record: null, checkIn: '', checkOut: '', status: '', note: '' })
                    } catch (err) {
                      setError((err as Error).message)
                    } finally {
                      setActionLoading(false)
                    }
                  }} 
                  className="rounded-xl px-6 bg-[#3d6b59] hover:bg-[#3d6b59]/90 text-white"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
