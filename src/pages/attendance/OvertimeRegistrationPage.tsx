import { useState } from 'react'
import { Search, Plus, Copy, Trash2, FileDown, ChevronDown, ChevronUp } from 'lucide-react'
import { Checkbox } from '../../components/ui/checkbox'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

const mockData = [
  { id: 1, employeeCode: '00000001', checkCode: '0001', fullName: 'Tran Nguyen Bich Ngoc', department: 'Nhan su', workGroup: 'Hanh chinh', shift: 'Ca 1', date: '2025-03-20', hours: '3', reason: '', status: 'Chua duyet' },
]

export default function OvertimeRegistrationPage() {
  const [selected, setSelected] = useState<number[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  const toggleAll = () => setSelected(selected.length === mockData.length ? [] : mockData.map(d => d.id))
  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleExpand = (id: number) => setExpanded(prev => prev === id ? null : id)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1">
        <div className="mb-4"><h1 className="text-2xl font-semibold text-foreground">Dang ky tang ca</h1></div>
        <div className="bg-white border rounded-md p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><label className="text-sm text-muted-foreground mb-1 block">Nhan vien</label><div className="relative"><Input placeholder="Nhap du lieu" className="pr-8" /><Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /></div></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Phong ban</label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Tinh trang</label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"><option>Tat ca</option></select></div>
            <div><label className="text-sm text-muted-foreground mb-1 block">Theo ngay</label><Input placeholder="dd/mm/yyyy" /></div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Search className="h-4 w-4 mr-1" /> Tim kiem</Button>
            <Button variant="outline"><Copy className="h-4 w-4 mr-1" /> Sao luu</Button>
            <Button variant="outline"><Trash2 className="h-4 w-4 mr-1" /> Xoa bo</Button>
            <Button variant="outline"><FileDown className="h-4 w-4 mr-1" /> Bao cao <ChevronDown className="h-4 w-4 ml-1" /></Button>
            <Button className="bg-[#3d6b59] hover:bg-[#3d6b59]/90"><Plus className="h-4 w-4 mr-1" /> Them moi</Button>
          </div>
        </div>
        <div className="bg-white border rounded-md overflow-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-10"><Checkbox checked={selected.length === mockData.length} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>Ma nhan vien</TableHead>
              <TableHead>Ma cham cong</TableHead>
              <TableHead>Ho ten</TableHead>
              <TableHead>Phong ban</TableHead>
              <TableHead>Nhom ca</TableHead>
              <TableHead>Ngay</TableHead>
              <TableHead>So gio</TableHead>
              <TableHead>Tinh trang</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {mockData.map(row => (
                <><TableRow key={row.id} className={"cursor-pointer " + (selected.includes(row.id) ? "bg-primary/5" : "")} onClick={() => toggleExpand(row.id)}>
                  <TableCell>{expanded === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggle(row.id)} /></TableCell>
                  <TableCell className="font-medium">{row.employeeCode}</TableCell>
                  <TableCell>{row.checkCode}</TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell className="font-medium">{row.department}</TableCell>
                  <TableCell>{row.workGroup}</TableCell>
                  <TableCell>{row.shift}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.hours}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow></>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}