import { useState, useMemo } from 'react'
import { Search, UserPlus, Trash2, FileDown, Settings, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { mockEmployees, filterOptions } from '../../data/mockEmployees'
import type { FilterParams } from '../../types/employee'

const PAGE_SIZE = 7

const defaultFilters: FilterParams = {
  search: '',
  position: '',
  workplace: '',
  nationality: '',
  department: '',
  status: '',
}

export default function EmployeeListPage() {
  const [filters, setFilters] = useState<FilterParams>(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((emp) => {
      if (filters.search && !emp.fullName.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.position && emp.position !== filters.position) return false
      if (filters.department && emp.department !== filters.department) return false
      if (filters.status) {
        const statusMap: Record<string, string> = { 'Đang làm việc': 'active', 'Nghỉ việc': 'inactive', 'Thử việc': 'probation' }
        if (emp.status !== statusMap[filters.status]) return false
      }
      return true
    })
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
  const start = (currentPage - 1) * PAGE_SIZE
  const paginatedEmployees = filteredEmployees.slice(start, start + PAGE_SIZE)

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedIds([])
    setCurrentPage(1)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedEmployees.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedEmployees.map((e) => e.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-background flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Nhân viên</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 w-44 h-8"
            />
          </div>
        </div>

        {/* Dropdowns */}
        {[
          { key: 'position' as const, label: 'Chức vụ', options: filterOptions.positions },
          { key: 'department' as const, label: 'Phòng ban', options: filterOptions.departments },
          { key: 'status' as const, label: 'Trạng thái', options: filterOptions.statuses },
        ].map(({ key, label, options }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
            <Select value={filters[key]} onValueChange={(v: string) => handleFilterChange(key, v)}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt === 'Tất cả' ? 'ALL' : opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default">
            <Search className="h-3.5 w-3.5" />
            Tìm kiếm
          </Button>
          <Button size="sm" variant="default">
            <UserPlus className="h-3.5 w-3.5" />
            Thêm nhân viên
          </Button>
          <Button
            size="sm"
            variant={selectedIds.length > 0 ? 'destructive' : 'secondary'}
            disabled={selectedIds.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa nhân viên
          </Button>
          <Button size="sm" variant="secondary">
            <FileDown className="h-3.5 w-3.5" />
            Báo cáo Excel
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Đã chọn: <strong>{selectedIds.length}</strong>
            </span>
          )}
          <Button size="icon" variant="outline">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="w-10 p-3 text-center">
                <Checkbox
                  checked={paginatedEmployees.length > 0 && selectedIds.length === paginatedEmployees.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 text-left font-medium text-foreground">Mã nhân viên</th>
              <th className="p-3 text-left font-medium text-foreground">Họ và tên</th>
              <th className="p-3 text-left font-medium text-foreground">Mã chấm công</th>
              <th className="p-3 text-left font-medium text-foreground">Phòng ban</th>
              <th className="p-3 text-left font-medium text-foreground">Nhóm làm việc</th>
              <th className="p-3 text-left font-medium text-foreground">Ngày vào làm</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((emp) => {
              const isSelected = selectedIds.includes(emp.id)
              return (
                <tr
                  key={emp.id}
                  className={`border-b transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                >
                  <td className="p-3 text-center">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(emp.id)} />
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{emp.employeeCode}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{emp.fullName}</div>
                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                        <div className="text-xs text-muted-foreground">{emp.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{emp.attendanceCode}</td>
                  <td className="p-3 text-foreground">{emp.department}</td>
                  <td className="p-3 text-foreground">{emp.workGroup}</td>
                  <td className="p-3 text-muted-foreground">{emp.startDate}</td>
                </tr>
              )
            })}
            {paginatedEmployees.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  Không có dữ liệu nhân viên
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-background shrink-0">
        <span className="text-sm text-muted-foreground">
          Hiển thị {start + 1}–{Math.min(start + PAGE_SIZE, filteredEmployees.length)} trong {filteredEmployees.length} nhân viên
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-3 text-sm">Trang {currentPage} / {totalPages}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
