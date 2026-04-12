import { useState } from 'react'
import { Search, Plus, Copy, Trash2, FileDown, ChevronDown } from 'lucide-react'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const mockData = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  employeeCode: '00000001',
  checkCode: '0001',
  fullName: 'Trần Nguyễn Bích Ngọc',
  department: 'Nhân sự',
  workGroup: 'Hành chính',
  dayType: '',
}))

export default function DailyAttendancePage() {
  const [selected, setSelected] = useState<number[]>([])

  const toggleAll = () => {
    if (selected.length === mockData.length) {
      setSelected([])
    } else {
      setSelected(mockData.map((d) => d.id))
    }
  }

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4">
        <span className="text-white text-sm font-medium">TIME365</span>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-foreground">Công ngày</h1>
        </div>

        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nhân viên</label>
              <div className="relative">
                <Input placeholder="Nhập dữ liệu cần tìm kiếm" className="pr-8" />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ca làm việc</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option>Tất cả</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Loại vắng</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option>Tất cả</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tình trạng</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option>Tất cả</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phòng ban</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option>Tất cả</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Theo ngày</label>
              <Input placeholder="dd/mm/yyyy" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90">
              <Search className="h-4 w-4 mr-1" /> Tìm kiếm
            </Button>
            <Button variant="outline">
              <Copy className="h-4 w-4 mr-1" /> Sao lưu
            </Button>
            <Button variant="outline">
              <Trash2 className="h-4 w-4 mr-1" /> Xóa bỏ
            </Button>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-1" /> Báo cáo <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90">
              <Plus className="h-4 w-4 mr-1" /> Xử lý
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox checked={selected.length === mockData.length && mockData.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Mã nhân viên</TableHead>
                <TableHead>Mã chấm công</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Nhóm ca làm việc</TableHead>
                <TableHead>Kiểu ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id} className={selected.includes(row.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggle(row.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell>{row.checkCode}</TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell className="font-medium">{row.department}</TableCell>
                  <TableCell>{row.workGroup}</TableCell>
                  <TableCell>{row.dayType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
