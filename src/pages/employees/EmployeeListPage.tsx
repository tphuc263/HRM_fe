import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, UserPlus, Trash2, FileDown, Settings, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { employeeService } from '../../services/employeeService'
import type { EmployeeDto } from '../../types/hrm'

const PAGE_SIZE = 7

const defaultFilters = {
  search: '',
  status: 'ALL',
}

const statusOptions = [
  { label: 'Tat ca', value: 'ALL' },
  { label: 'Dang lam viec', value: 'ACTIVE' },
  { label: 'Nghi viec', value: 'RESIGNED' },
]

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function statusLabel(status: string) {
  if (status === 'ACTIVE') return 'Dang lam viec'
  if (status === 'RESIGNED') return 'Nghi viec'
  return status
}

export default function EmployeeListPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const pageData = await employeeService.getAll({
        keyword: filters.search || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        page: currentPage - 1,
        size: PAGE_SIZE,
      })

      setEmployees(pageData.content)
      setTotalPages(Math.max(1, pageData.totalPages))
      setTotalItems(pageData.totalElements)
    } catch (err) {
      setError((err as Error).message || 'Khong the tai danh sach nhan vien')
      setEmployees([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters.search, filters.status])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const start = (currentPage - 1) * PAGE_SIZE + 1

  const handleFilterChange = (key: keyof typeof defaultFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedIds([])
    setCurrentPage(1)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(employees.map((e) => e.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds])

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

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Trang thai</span>
          <Select value={filters.status} onValueChange={(v: string) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Trang thai" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            variant={selectedCount > 0 ? 'destructive' : 'secondary'}
            disabled={selectedCount === 0}
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
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              Da chon: <strong>{selectedCount}</strong>
            </span>
          )}
          <Button size="icon" variant="outline">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="w-10 p-3 text-center">
                <Checkbox
                  checked={employees.length > 0 && selectedIds.length === employees.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 text-left font-medium text-foreground">Ma nhan vien</th>
              <th className="p-3 text-left font-medium text-foreground">Ho va ten</th>
              <th className="p-3 text-left font-medium text-foreground">Phong ban</th>
              <th className="p-3 text-left font-medium text-foreground">Email</th>
              <th className="p-3 text-left font-medium text-foreground">Trang thai</th>
              <th className="p-3 text-left font-medium text-foreground">Ngay vao lam</th>
            </tr>
          </thead>
          <tbody>
            {!loading && employees.map((emp) => {
              const isSelected = selectedIds.includes(emp.id)
              return (
                <tr
                  key={emp.id}
                  className={`border-b transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                >
                  <td className="p-3 text-center">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(emp.id)} />
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{emp.code}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                        {emp.name?.charAt(0) || 'N'}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.phone || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-foreground">{emp.departmentName || '-'}</td>
                  <td className="p-3 text-muted-foreground">{emp.email || '-'}</td>
                  <td className="p-3 text-foreground">{statusLabel(emp.status)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(emp.joinDate)}</td>
                </tr>
              )
            })}

            {loading && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  Dang tai du lieu nhan vien...
                </td>
              </tr>
            )}

            {!loading && employees.length === 0 && (
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
          Hien thi {totalItems === 0 ? 0 : start}-{Math.min(currentPage * PAGE_SIZE, totalItems)} trong {totalItems} nhan vien
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
