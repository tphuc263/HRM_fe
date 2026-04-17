import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search, FileDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { attendanceService } from '../../services/attendanceService'
import type { AttendanceRecordDto } from '../../types/attendance'
import { useAuth } from '../../context/useAuth'

function toIsoDate(value: Date) {
  return value.toISOString().split('T')[0]
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

export default function OvertimeRegistrationPage() {
  const PAGE_SIZE = 10
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [date, setDate] = useState(toIsoDate(new Date()))
  const [rows, setRows] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const data = await attendanceService.getDaily({
          date,
          keyword: search.trim() || undefined,
          hasOvertime: true,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'employee.code',
          sortDir: 'asc',
        })
        setRows(data.content)
        setTotalPages(Math.max(1, data.totalPages))
        setTotalItems(data.totalElements)
      } else {
        const data = await attendanceService.getMyRecords({
          from: date,
          to: date,
          page: currentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        const overtimeRows = data.content.filter((r) => Number(r.overtimeHours || 0) > 0)
        setRows(overtimeRows)
        setTotalPages(Math.max(1, data.totalPages))
        setTotalItems(overtimeRows.length)
      }
    } catch (err) {
      setRows([])
      setTotalPages(1)
      setTotalItems(0)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [date, isAdmin, currentPage, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setCurrentPage(1)
  }, [date, search])

  const handleExport = () => {
    const header = ['Mã nhân viên', 'Họ tên', 'Ngày', 'Số giờ OT', 'Giờ làm', 'Trạng thái']
    const csvRows = [
      '\uFEFF' + header.join(','),
      ...rows.map((row) => [
        row.employeeCode,
        row.employeeName,
        row.date,
        String(row.overtimeHours ?? 0),
        String(row.workHours ?? 0),
        row.status || '',
      ].join(',')),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `overtime-${date}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Đăng ký tăng ca</h1>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4" />
            Báo cáo Excel
          </Button>
        </div>
        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="text-sm text-muted-foreground mb-1 block">Nhân viên</label><div className="relative"><Input placeholder="Nhập tên hoặc mã" className="pr-8" value={search} onChange={(e) => setSearch(e.target.value)} /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Theo ngày</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="flex items-end"><Button variant="outline" onClick={() => void loadData()}><RefreshCw className="h-4 w-4" /> Tải lại</Button></div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Mã nhân viên</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Số giờ</TableHead>
              <TableHead>Giờ làm</TableHead>
              <TableHead>Tình trạng</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có dữ liệu tăng ca</TableCell></TableRow>
              ) : rows.map(row => (
                <TableRow key={`${row.id || 'x'}-${row.employeeId}-${row.date}`}>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell className="font-medium">{row.employeeName}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{row.overtimeHours ?? 0}</TableCell>
                  <TableCell>{row.workHours ?? 0}</TableCell>
                  <TableCell>{row.status || '-'}</TableCell>
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