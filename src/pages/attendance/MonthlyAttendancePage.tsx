import { useState } from 'react'
import { Search, Calendar } from 'lucide-react'
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

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

const mockData = [
  {
    id: 1,
    department: '00000001',
    employeeCode: '0001',
    fullName: 'Tran Nguyen Bich Ngoc',
    attendance: { '01': 'NS', '03': 'HC' } as Record<string, string>,
    totalHours: '',
  },
]

export default function MonthlyAttendancePage() {
  const [selected, setSelected] = useState<number[]>([])

  const toggleAll = () => {
    if (selected.length === mockData.length) setSelected([])
    else setSelected(mockData.map((d) => d.id))
  }

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4">
        <span className="text-white text-sm font-medium">TIME365</span>
      </div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-foreground">Cong thang</h1>
        </div>
        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nhan vien</label>
              <div className="relative">
                <Input placeholder="Nhap du lieu can tim kiem" className="pr-8" />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Thang lam viec</label>
              <div className="relative">
                <Input placeholder="mm/yyyy" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Quoc tich</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tinh trang</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phong ban</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nhom lam viec</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Search className="h-4 w-4 mr-1" /> Tim kiem</Button>
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90">Bao cao</Button>
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90">Xu ly</Button>
          </div>
        </div>
        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"><Checkbox checked={selected.length === mockData.length && mockData.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Phong ban</TableHead>
                <TableHead>Ma nhan vien</TableHead>
                <TableHead>Ho ten</TableHead>
                {days.map((day) => <TableHead key={day} className="text-center min-w-[40px]">{day}</TableHead>)}
                <TableHead>Tong gio lam</TableHead>
                <TableHead>Nghi phep</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id} className={selected.includes(row.id) ? 'bg-primary/5' : ''}>
                  <TableCell><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggle(row.id)} /></TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.employeeCode}</TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  {days.map((day) => <TableCell key={day} className="text-center text-xs">{row.attendance[day] || ''}</TableCell>)}
                  <TableCell>{row.totalHours}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
