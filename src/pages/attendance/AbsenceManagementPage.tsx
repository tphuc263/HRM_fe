import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import { employeeService } from '../../services/employeeService'
import type { AttendanceRecordDto } from '../../types/attendance'
import type { EmployeeDto } from '../../types/hrm'
import { useAuth } from '../../context/useAuth'

const PAGE_SIZE = 10

function toIsoDate(value: Date) {
  return value.toISOString().split('T')[0]
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

function formatTime(value?: string | null) {
  if (!value) return '-'
  return value.slice(0, 5)
}

export default function AbsenceManagementPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [rows, setRows] = useState<AttendanceRecordDto[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return toIsoDate(d)
  })
  const [toDate, setToDate] = useState(toIsoDate(new Date()))
  const [markDate, setMarkDate] = useState(toIsoDate(new Date()))
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [marking, setMarking] = useState(false)

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await employeeService.getAll({ page: 0, size: 200, sortBy: 'name', sortDir: 'asc', status: 'ACTIVE' })
      setEmployees(data.content)
      if (data.content.length > 0) {
        setEmployeeId(data.content[0].id)
      }
    } catch {
      setEmployees([])
      setEmployeeId(null)
    }
  }, [isAdmin])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const data = await attendanceService.getRange({
          fromDate,
          toDate,
          status: 'ABSENT',
          keyword: search.trim() || undefined,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        setRows(data.content)
        setTotalPages(Math.max(1, data.totalPages))
        setTotalItems(data.totalElements)
      } else {
        const data = await attendanceService.getMyRecords({
          from: fromDate,
          to: toDate,
          status: 'ABSENT',
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        setRows(data.content)
        setTotalPages(Math.max(1, data.totalPages))
        setTotalItems(data.totalElements)
      }
    } catch (err) {
      setRows([])
      setTotalPages(1)
      setTotalItems(0)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, fromDate, toDate, isAdmin, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [fromDate, toDate, search])

  const handleMarkAbsent = async () => {
    if (!isAdmin || !employeeId) return

    setMarking(true)
    try {
      await attendanceService.markAbsent(employeeId, markDate, note || undefined)
      setNote('')
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Quản lý vắng</h1></div>

        <div className="bg-white border rounded-md p-4 mb-4 space-y-4">
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Ngày vắng</label>
                <Input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Lý do</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập lý do (nếu có)" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => void handleMarkAbsent()} disabled={marking || !employeeId}>
                  <Plus className="h-4 w-4" />
                  Đánh vắng mặt
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tìm kiếm</label>
              <div className="relative"><Input placeholder="Tìm tên/mã/lý do" className="pr-8" value={search} onChange={(e) => setSearch(e.target.value)} /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Từ ngày</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Đến ngày</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => void loadData()}>
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Mã nhân viên</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Ngày vắng</TableHead>
              <TableHead>Thời gian bắt đầu</TableHead>
              <TableHead>Thời gian kết thúc</TableHead>
              <TableHead>Lý do</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có dữ liệu vắng mặt</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={`${row.id || 'x'}-${row.employeeId}-${row.date}`}>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{formatTime(row.checkIn)}</TableCell>
                  <TableCell>{formatTime(row.checkOut)}</TableCell>
                  <TableCell>{row.note || '-'}</TableCell>
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
