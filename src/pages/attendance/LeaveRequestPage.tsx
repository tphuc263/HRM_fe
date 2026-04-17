import { useState, useMemo } from 'react'
import { Search, Plus, Copy, Trash2, FileDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronDownIcon } from 'lucide-react'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

type LeaveStatus = 'pending' | 'approved' | 'rejected'

interface LeaveRequest {
  id: number
  employeeCode: string
  fullName: string
  department: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  submittedAt: string
}

const mockData: LeaveRequest[] = [
  { id: 1, employeeCode: '0000001', fullName: 'Đinh Lê', department: 'Phòng may 1', leaveType: 'Nghỉ phép', startDate: '2025-09-15', endDate: '2025-09-15', days: 1, reason: 'Việc gia đình', status: 'pending', submittedAt: '2025-09-10 08:00' },
  { id: 2, employeeCode: '0000002', fullName: 'Nguyễn Văn A', department: 'Phòng IT', leaveType: 'Nghỉ phép', startDate: '2025-09-16', endDate: '2025-09-18', days: 3, reason: 'Du lịch', status: 'pending', submittedAt: '2025-09-12 09:30' },
  { id: 3, employeeCode: '0000003', fullName: 'Trần Thị B', department: 'Phòng HC', leaveType: 'Nghỉ không lương', startDate: '2025-09-01', endDate: '2025-09-05', days: 5, reason: 'Việc riêng', status: 'approved', submittedAt: '2025-08-28 14:20' },
  { id: 4, employeeCode: '0000004', fullName: 'Lê Văn C', department: 'Phòng kế toán', leaveType: 'Nghỉ phép', startDate: '2025-08-25', endDate: '2025-08-25', days: 1, reason: 'Khám bệnh', status: 'rejected', submittedAt: '2025-08-20 10:00' },
  { id: 5, employeeCode: '0000005', fullName: 'Phạm Thị D', department: 'Phòng kinh doanh', leaveType: 'Nghỉ thai sản', startDate: '2025-10-01', endDate: '2025-12-31', days: 92, reason: 'Thai sản', status: 'approved', submittedAt: '2025-09-01 08:00' },
  { id: 6, employeeCode: '0000006', fullName: 'Hoàng Văn E', department: 'Phòng kỹ thuật', leaveType: 'Nghỉ phép', startDate: '2025-09-20', endDate: '2025-09-22', days: 3, reason: 'Nghỉ lễ', status: 'pending', submittedAt: '2025-09-15 11:00' },
  { id: 7, employeeCode: '0000007', fullName: 'Đặng Thị F', department: 'Phòng nhân sự', leaveType: 'Nghỉ không lương', startDate: '2025-08-15', endDate: '2025-08-17', days: 3, reason: 'Việc gia đình', status: 'rejected', submittedAt: '2025-08-10 16:00' },
  { id: 8, employeeCode: '0000008', fullName: 'Vũ Văn G', department: 'Phòng sản xuất', leaveType: 'Nghỉ phép', startDate: '2025-09-05', endDate: '2025-09-07', days: 3, reason: 'Du lịch', status: 'approved', submittedAt: '2025-09-01 09:00' },
]

const statusTabs: { key: LeaveStatus; label: string; count: number }[] = [
  { key: 'pending', label: 'Chờ duyệt', count: 0 },
  { key: 'approved', label: 'Đã duyệt', count: 0 },
  { key: 'rejected', label: 'Từ chối', count: 0 },
]

type SortKey = 'employeeCode' | 'fullName' | 'department' | 'startDate' | 'days' | 'submittedAt'
type SortDir = 'asc' | 'desc'

export default function LeaveRequestPage() {
  const [activeTab, setActiveTab] = useState<LeaveStatus>('pending')
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('Tất cả')
  const [leaveType, setLeaveType] = useState('Tất cả')
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const tabs = useMemo(() => {
    return statusTabs.map(t => ({
      ...t,
      count: mockData.filter(d => d.status === t.key).length,
    }))
  }, [])

  const filtered = useMemo(() => {
    let data = mockData.filter(d => d.status === activeTab)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.employeeCode.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q)
      )
    }
    if (department !== 'Tất cả') data = data.filter(d => d.department === department)
    if (leaveType !== 'Tất cả') data = data.filter(d => d.leaveType === leaveType)
    data = [...data].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'employeeCode') cmp = a.employeeCode.localeCompare(b.employeeCode)
      else if (sortKey === 'fullName') cmp = a.fullName.localeCompare(b.fullName)
      else if (sortKey === 'department') cmp = a.department.localeCompare(b.department)
      else if (sortKey === 'startDate') cmp = a.startDate.localeCompare(b.startDate)
      else if (sortKey === 'days') cmp = a.days - b.days
      else if (sortKey === 'submittedAt') cmp = a.submittedAt.localeCompare(b.submittedAt)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return data
  }, [activeTab, search, department, leaveType, sortKey, sortDir])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / pageSize)

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(d => d.id))
  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleExpand = (id: number) => setExpanded(prev => prev === id ? null : id)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) return null
    return <ChevronDownIcon className={`h-3 w-3 inline ml-1 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Quản lý đơn xin nghỉ</h1></div>

        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="flex gap-4 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); setSelected([]); setExpanded(null) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#3d6b59] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#3d6b59]/10 text-[#3d6b59]'}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="text-sm text-muted-foreground mb-1 block">Nhân viên</label>
              <div className="relative"><Input placeholder="Nhập dữ liệu cần tìm kiếm" className="pr-8" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Phòng ban</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={department} onChange={e => { setDepartment(e.target.value); setCurrentPage(1) }}>
                <option>Tất cả</option><option>Phòng may 1</option><option>Phòng IT</option><option>Phòng HC</option><option>Phòng kế toán</option><option>Phòng kinh doanh</option><option>Phòng kỹ thuật</option><option>Phòng nhân sự</option><option>Phòng sản xuất</option>
              </select>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Loại nghỉ</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={leaveType} onChange={e => { setLeaveType(e.target.value); setCurrentPage(1) }}>
                <option>Tất cả</option><option>Nghỉ phép</option><option>Nghỉ không lương</option><option>Nghỉ thai sản</option><option>Nghỉ ốm</option>
              </select>
            </div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Ngày nộp</label><Input placeholder="dd/mm/yyyy" /></div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Search className="h-4 w-4 mr-1" /> Tìm kiếm</Button>
            <Button variant="outline"><Copy className="h-4 w-4 mr-1" /> Sao lưu</Button>
            <Button variant="outline"><Trash2 className="h-4 w-4 mr-1" /> Xóa bỏ</Button>
            <Button variant="outline"><FileDown className="h-4 w-4 mr-1" /> Báo cáo <ChevronDown className="h-4 w-4 ml-1" /></Button>
            {activeTab === 'pending' && <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Plus className="h-4 w-4 mr-1" /> Phê duyệt</Button>}
          </div>
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-10"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('employeeCode')}>Mã nhân viên {renderSortIcon('employeeCode')}</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('fullName')}>Họ và tên {renderSortIcon('fullName')}</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('department')}>Phòng ban {renderSortIcon('department')}</TableHead>
              <TableHead>Loại nghỉ</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('startDate')}>Ngày bắt đầu {renderSortIcon('startDate')}</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('days')}>Số ngày {renderSortIcon('days')}</TableHead>
              <TableHead>Tình trạng</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              ) : paginated.map(row => (
                <><TableRow key={row.id} className={"cursor-pointer " + (selected.includes(row.id) ? "bg-primary/5" : "")} onClick={() => toggleExpand(row.id)}>
                  <TableCell>{expanded === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggle(row.id)} /></TableCell>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.leaveType}</TableCell>
                  <TableCell>{row.startDate}</TableCell>
                  <TableCell>{row.endDate}</TableCell>
                  <TableCell>{row.days}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      row.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {row.status === 'pending' ? 'Chờ duyệt' : row.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </TableCell>
                </TableRow>
                {expanded === row.id && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={10} className="px-8 py-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="font-medium text-muted-foreground">Lý do:</span> {row.reason}</div>
                        <div><span className="font-medium text-muted-foreground">Ngày nộp:</span> {row.submittedAt}</div>
                        <div><span className="font-medium text-muted-foreground">Mã nhân viên:</span> {row.employeeCode}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}</>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Trang {currentPage} / {totalPages} ({filtered.length} kết quả)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

