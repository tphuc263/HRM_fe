import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
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
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [date, setDate] = useState(toIsoDate(new Date()))
  const [rows, setRows] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isAdmin
        ? await attendanceService.getDaily(date)
        : await attendanceService.getMyRecords({ from: date, to: date })
      setRows(data.filter((r) => Number(r.overtimeHours || 0) > 0))
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
      `${r.employeeCode} ${r.employeeName} ${r.status || ''}`.toLowerCase().includes(keyword),
    )
  }, [rows, search])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Dang ky tang ca</h1></div>
        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="text-sm text-muted-foreground mb-1 block">Nhan vien</label><div className="relative"><Input placeholder="Nhap ten hoac ma" className="pr-8" value={search} onChange={(e) => setSearch(e.target.value)} /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Theo ngay</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="flex items-end"><Button variant="outline" onClick={() => void loadData()}><RefreshCw className="h-4 w-4" /> Tai lai</Button></div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Ma nhan vien</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Ngay</TableHead>
              <TableHead>So gio</TableHead>
              <TableHead>Gio lam</TableHead>
              <TableHead>Tinh trang</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Dang tai du lieu...</TableCell></TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Khong co du lieu tang ca</TableCell></TableRow>
              ) : filteredRows.map(row => (
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
      </div>
    </div>
  )
}