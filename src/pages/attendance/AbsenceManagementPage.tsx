import { useState, useMemo } from 'react'
import { Search, Plus, Copy, Trash2, FileDown, ChevronDown, Calendar } from 'lucide-react'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

interface AbsenceRecord {
  id: number
  employeeCode: string
  fullName: string
  department: string
  absenceDate: string
  startTime: string
  endTime: string
  reason: string
}

const mockData: AbsenceRecord[] = [
  { id: 1, employeeCode: '0000001', fullName: 'Đinh Lê', department: 'Phòng may 1', absenceDate: '15/09/2025', startTime: '7:00', endTime: '16:00', reason: 'Việc gia đình' },
  { id: 2, employeeCode: '0000002', fullName: 'Nguyễn Văn A', department: 'Phòng IT', absenceDate: '16/09/2025', startTime: '8:00', endTime: '17:30', reason: 'Khám bệnh' },
  { id: 3, employeeCode: '0000003', fullName: 'Trần Thị B', department: 'Phòng HC', absenceDate: '10/09/2025', startTime: '7:00', endTime: '18:00', reason: 'Nghỉ lễ' },
  { id: 4, employeeCode: '0000004', fullName: 'Lê Văn C', department: 'Phòng kế toán', absenceDate: '12/09/2025', startTime: '8:00', endTime: '16:00', reason: 'Việc riêng' },
  { id: 5, employeeCode: '0000005', fullName: 'Phạm Thị D', department: 'Phòng kinh doanh', absenceDate: '08/09/2025', startTime: '7:00', endTime: '17:00', reason: 'Du lịch' },
  { id: 6, employeeCode: '0000006', fullName: 'Hoàng Văn E', department: 'Phòng kỹ thuật', absenceDate: '05/09/2025', startTime: '7:30', endTime: '16:30', reason: 'Họp khách hàng' },
  { id: 7, employeeCode: '0000007', fullName: 'Đặng Thị F', department: 'Phòng nhân sự', absenceDate: '03/09/2025', startTime: '8:00', endTime: '18:00', reason: 'Đào tạo' },
  { id: 8, employeeCode: '0000008', fullName: 'Vũ Văn G', department: 'Phòng sản xuất', absenceDate: '01/09/2025', startTime: '7:00', endTime: '15:00', reason: 'Sửa xe' },
  { id: 9, employeeCode: '0000009', fullName: 'Bùi Thị H', department: 'Phòng may 2', absenceDate: '20/09/2025', startTime: '8:00', endTime: '17:00', reason: 'Việc gia đình' },
  { id: 10, employeeCode: '0000010', fullName: 'Trịnh Văn I', department: 'Phòng bảo trì', absenceDate: '18/09/2025', startTime: '7:00', endTime: '16:00', reason: 'Nghỉ ốm' },
]

export default function AbsenceManagementPage() {
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('Tất cả')
  const [absenceType, setAbsenceType] = useState('Tất cả')
  const [absenceDate, setAbsenceDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    let data = mockData
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.employeeCode.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q)
      )
    }
    if (department !== 'Tất cả') data = data.filter(d => d.department === department)
    if (absenceType !== 'Tất cả') data = data.filter(d => d.reason === absenceType)
    if (absenceDate) data = data.filter(d => d.absenceDate === absenceDate)
    return data
  }, [search, department, absenceType, absenceDate])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / pageSize)

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(d => d.id))
  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Quản lý vắng</h1></div>

        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="text-sm text-muted-foreground mb-1 block">Nhân viên</label>
              <div className="relative"><Input placeholder="Nhập dữ liệu cần tìm kiếm" className="pr-8" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Ngày vắng</label>
              <div className="relative"><Input placeholder="dd/mm/yyyy" value={absenceDate} onChange={e => { setAbsenceDate(e.target.value); setCurrentPage(1) }} className="pr-8" /><Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Loại vắng</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={absenceType} onChange={e => { setAbsenceType(e.target.value); setCurrentPage(1) }}>
                <option>Tất cả</option><option>Việc gia đình</option><option>Khám bệnh</option><option>Nghỉ lễ</option><option>Việc riêng</option><option>Du lịch</option><option>Họp khách hàng</option><option>Đào tạo</option><option>Sửa xe</option><option>Nghỉ ốm</option>
              </select>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Phòng ban</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={department} onChange={e => { setDepartment(e.target.value); setCurrentPage(1) }}>
                <option>Tất cả</option><option>Phòng may 1</option><option>Phòng may 2</option><option>Phòng IT</option><option>Phòng HC</option><option>Phòng kế toán</option><option>Phòng kinh doanh</option><option>Phòng kỹ thuật</option><option>Phòng nhân sự</option><option>Phòng sản xuất</option><option>Phòng bảo trì</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Search className="h-4 w-4 mr-1" /> Tìm kiếm</Button>
            <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Thêm mới</Button>
            <Button variant="outline"><Copy className="h-4 w-4 mr-1" /> Sao lưu</Button>
            <Button variant="outline"><Trash2 className="h-4 w-4 mr-1" /> Xóa bỏ</Button>
            <Button variant="outline"><FileDown className="h-4 w-4 mr-1" /> Báo cáo <ChevronDown className="h-4 w-4 ml-1" /></Button>
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90">Đổ dữ liệu</Button>
          </div>
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>Mã nhân viên</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Ngày vắng</TableHead>
              <TableHead>Thời gian bắt đầu</TableHead>
              <TableHead>Thời gian kết thúc</TableHead>
              <TableHead>Lý do</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              ) : paginated.map(row => (
                <TableRow key={row.id} className={selected.includes(row.id) ? 'bg-primary/5' : ''}>
                  <TableCell><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggle(row.id)} /></TableCell>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.absenceDate}</TableCell>
                  <TableCell>{row.startTime}</TableCell>
                  <TableCell>{row.endTime}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Trang {currentPage} / {totalPages} ({filtered.length} kết quả)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>←</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>→</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

