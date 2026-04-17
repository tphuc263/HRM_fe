import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  UserPlus,
  Trash2,
  FileDown,
  Pencil,
  UserRound,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { employeeService } from '../../services/employeeService'
import { departmentService } from '../../services/departmentService'
import type { DepartmentDto, EmployeeDto, EmployeeListQuery, EmployeeUpsertPayload } from '../../types/hrm'
import { useAuth } from '../../context/useAuth'

const PAGE_SIZE = 10

type FilterState = {
  search: string
  status: string
  departmentId: number | 'ALL'
  sortField: 'NAME' | 'SALARY'
  sortDirection: 'asc' | 'desc'
}

type EmployeeFormMode = 'create' | 'edit'

const defaultFilters: FilterState = {
  search: '',
  status: 'ALL',
  departmentId: 'ALL',
  sortField: 'NAME',
  sortDirection: 'asc',
}

const statusOptions = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang làm việc', value: 'ACTIVE' },
  { label: 'Nghỉ việc', value: 'RESIGNED' },
]

const initialForm: EmployeeUpsertPayload = {
  code: '',
  name: '',
  email: '',
  phone: '',
  birthday: '',
  address: '',
  joinDate: '',
  departmentId: undefined,
  avatar: '',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function formatCurrency(value?: number | null) {
  if (value == null) return '-'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function statusLabel(status: string) {
  if (status === 'ACTIVE') return 'Đang làm việc'
  if (status === 'RESIGNED') return 'Nghỉ việc'
  return status
}

function toApiQuery(filters: FilterState, currentPage: number): EmployeeListQuery {
  return {
    keyword: filters.search || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    page: currentPage - 1,
    size: PAGE_SIZE,
    sortBy: 'name',
    sortDir: 'asc',
  }
}

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value)
  const escaped = raw.replaceAll('"', '""')
  return `"${escaped}"`
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csvContent = ['\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n')]
  const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function EmployeeModal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-lg bg-background border shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default function EmployeeListPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [departments, setDepartments] = useState<DepartmentDto[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<EmployeeFormMode>('create')
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)
  const [form, setForm] = useState<EmployeeUpsertPayload>(initialForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [createdAccount, setCreatedAccount] = useState<EmployeeDto['generatedAccount'] | null>(null)

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<EmployeeDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const query = useMemo(() => toApiQuery(filters, currentPage), [filters, currentPage])
  const sortedEmployees = useMemo(() => {
    if (filters.sortField === 'NAME') {
      const byName = [...employees].sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
      return filters.sortDirection === 'asc' ? byName : byName.reverse()
    }

    const bySalary = [...employees].sort((a, b) => {
      const salaryA = a.currentSalary ?? a.latestNetSalary ?? 0
      const salaryB = b.currentSalary ?? b.latestNetSalary ?? 0
      return salaryA - salaryB
    })
    return filters.sortDirection === 'asc' ? bySalary : bySalary.reverse()
  }, [employees, filters.sortDirection, filters.sortField])

  const loadDepartments = useCallback(async () => {
    try {
      const data = await departmentService.getAll()
      setDepartments(data)
    } catch {
      setDepartments([])
    }
  }, [])

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const pageData = await employeeService.getAll(query)
      setEmployees(pageData.content)
      setTotalPages(Math.max(1, pageData.totalPages))
      setTotalItems(pageData.totalElements)
      setSelectedIds([])
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách nhân viên')
      setEmployees([])
      setTotalPages(1)
      setTotalItems(0)
      setSelectedIds([])
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    void loadDepartments()
  }, [loadDepartments])

  const start = (currentPage - 1) * PAGE_SIZE + 1
  const selectedCount = selectedIds.length

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedEmployees.length) {
      setSelectedIds([])
      return
    }
    setSelectedIds(sortedEmployees.map((e) => e.id))
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const handleApplySearch = () => {
    setFilters(draftFilters)
    setCurrentPage(1)
  }

  const openCreateModal = () => {
    setFormMode('create')
    setEditingEmployeeId(null)
    setForm(initialForm)
    setFormError('')
    setCreatedAccount(null)
    setShowFormModal(true)
  }

  const openEditModal = async (employeeId: number) => {
    setFormMode('edit')
    setEditingEmployeeId(employeeId)
    setFormError('')
    setCreatedAccount(null)
    setFormLoading(true)
    setShowFormModal(true)
    try {
      const detail = await employeeService.getById(employeeId)
      setForm({
        code: detail.code,
        name: detail.name,
        email: detail.email || '',
        phone: detail.phone || '',
        birthday: detail.birthday || '',
        address: detail.address || '',
        joinDate: detail.joinDate || '',
        departmentId: detail.departmentId ?? undefined,
        avatar: detail.avatar || '',
      })
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  const openDetailModal = async (employeeId: number) => {
    setShowDetailModal(true)
    setDetailEmployee(null)
    setDetailLoading(true)
    try {
      const detail = await employeeService.getById(employeeId)
      setDetailEmployee(detail)
    } catch (err) {
      setError((err as Error).message)
      setShowDetailModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const validateForm = () => {
    if (!form.code.trim() || !form.name.trim() || !form.email.trim() || !form.joinDate) {
      return 'Vui lòng nhập đầy đủ mã, họ tên, email và ngày vào làm'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      return 'Email không hợp lệ'
    }

    return ''
  }

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload: EmployeeUpsertPayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      birthday: form.birthday || undefined,
      address: form.address?.trim() || undefined,
      joinDate: form.joinDate,
      departmentId: form.departmentId,
      avatar: form.avatar?.trim() || undefined,
    }

    setFormLoading(true)
    try {
      if (formMode === 'create') {
        const created = await employeeService.create(payload)
        setCreatedAccount(created.generatedAccount || null)
      } else if (editingEmployeeId) {
        await employeeService.update(editingEmployeeId, payload)
        setShowFormModal(false)
      }

      await loadEmployees()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleCloseForm = () => {
    setShowFormModal(false)
    setCreatedAccount(null)
    setFormError('')
  }

  const handleDeleteSelected = async () => {
    if (!isAdmin || selectedIds.length === 0) return

    const confirmed = window.confirm(`Bạn có chắc chắn xóa ${selectedIds.length} nhân viên đã chọn?`)
    if (!confirmed) return

    setActionLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => employeeService.delete(id)))
      await loadEmployees()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResign = async (employee: EmployeeDto) => {
    if (!isAdmin) return
    const resignationDate = window.prompt('Nhập ngày nghỉ việc (YYYY-MM-DD), để trống để dùng ngày hôm nay:')
    if (resignationDate === null) return

    setActionLoading(true)
    try {
      await employeeService.resign(employee.id, resignationDate || undefined)
      await loadEmployees()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = async () => {
    setActionLoading(true)
    try {
      const exportRows: EmployeeDto[] = []
      let page = 0
      let total = 1

      while (page < total) {
        const res = await employeeService.getAll({
          ...toApiQuery(filters, page + 1),
          page,
          size: 200,
        })
        exportRows.push(...res.content)
        total = Math.max(1, res.totalPages)
        page += 1
      }

      const rows: string[][] = [
        ['Mã nhân viên', 'Họ và tên', 'Email', 'Điện thoại', 'Phòng ban', 'Trạng thái', 'Lương hiện tại', 'Lương kỳ gần nhất', 'Kỳ lương gần nhất', 'Ngày vào làm', 'Ngày nghỉ việc'],
        ...[...exportRows]
          .sort((a, b) => {
            if (filters.sortField === 'NAME') {
              const comparison = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
              return filters.sortDirection === 'asc' ? comparison : -comparison
            }
            const salaryA = a.currentSalary ?? a.latestNetSalary ?? 0
            const salaryB = b.currentSalary ?? b.latestNetSalary ?? 0
            const comparison = salaryA - salaryB
            return filters.sortDirection === 'asc' ? comparison : -comparison
          })
          .map((emp) => [
          emp.code,
          emp.name,
          emp.email || '',
          emp.phone || '',
          emp.departmentName || '',
          statusLabel(emp.status),
          emp.currentSalary != null ? String(emp.currentSalary) : '',
          emp.latestNetSalary != null ? String(emp.latestNetSalary) : '',
          emp.lastPayrollMonth || '',
          emp.joinDate || '',
          emp.resignationDate || '',
          ]),
      ]

      const dateLabel = new Date().toISOString().slice(0, 10)
      downloadCsv(`employees-${dateLabel}.csv`, rows)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-background flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Nhân viên</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-8 w-44 h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Trạng thái</span>
          <Select
            value={draftFilters.status}
            onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Phòng ban</span>
          <Select
            value={draftFilters.departmentId === 'ALL' ? 'ALL' : String(draftFilters.departmentId)}
            onValueChange={(value) =>
              setDraftFilters((prev) => ({
                ...prev,
                departmentId: value === 'ALL' ? 'ALL' : Number(value),
              }))
            }
          >
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phòng ban</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sắp xếp</span>
          <Select
            value={draftFilters.sortField}
            onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, sortField: value as 'NAME' | 'SALARY' }))}
          >
            <SelectTrigger className="w-44 h-8">
              <SelectValue placeholder="Trường sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NAME">Theo tên</SelectItem>
              <SelectItem value="SALARY">Theo lương cơ bản</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={draftFilters.sortDirection}
            onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, sortDirection: value as 'asc' | 'desc' }))}
          >
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Chiều" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Tăng dần</SelectItem>
              <SelectItem value="desc">Giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="default" onClick={handleApplySearch} disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            Tìm kiếm
          </Button>
          <Button size="sm" variant="default" onClick={openCreateModal} disabled={!isAdmin}>
            <UserPlus className="h-3.5 w-3.5" />
            Thêm nhân viên
          </Button>
          <Button
            size="sm"
            variant={selectedCount > 0 ? 'destructive' : 'secondary'}
            disabled={!isAdmin || selectedCount === 0 || actionLoading}
            onClick={() => void handleDeleteSelected()}
          >
            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Xóa nhân viên
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void handleExport()} disabled={actionLoading}>
            <FileDown className="h-3.5 w-3.5" />
            Báo cáo Excel
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              Đã chọn: <strong>{selectedCount}</strong>
            </span>
          )}
        </div>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="w-10 p-3 text-center">
                <Checkbox
                  checked={sortedEmployees.length > 0 && selectedIds.length === sortedEmployees.length}
                  onCheckedChange={toggleSelectAll}
                  disabled={!isAdmin}
                />
              </th>
              <th className="p-3 text-left font-medium text-foreground">Mã nhân viên</th>
              <th className="p-3 text-left font-medium text-foreground">Họ và tên</th>
              <th className="p-3 text-left font-medium text-foreground">Phòng ban</th>
              <th className="p-3 text-left font-medium text-foreground">Email</th>
              <th className="p-3 text-left font-medium text-foreground">Trạng thái</th>
              <th className="p-3 text-left font-medium text-foreground">Lương</th>
              <th className="p-3 text-left font-medium text-foreground">Ngày vào làm</th>
              <th className="p-3 text-left font-medium text-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && sortedEmployees.map((emp) => {
              const isSelected = selectedIds.includes(emp.id)
              return (
                <tr
                  key={emp.id}
                  className={`border-b transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                >
                  <td className="p-3 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(emp.id)}
                      disabled={!isAdmin}
                    />
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
                  <td className="p-3 text-muted-foreground">
                    <div>{formatCurrency(emp.currentSalary)}</div>
                    <div className="text-xs text-muted-foreground">
                      Kỳ gần nhất: {formatCurrency(emp.latestNetSalary)}
                      {emp.lastPayrollMonth ? ` (${emp.lastPayrollMonth})` : ''}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(emp.joinDate)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => void openDetailModal(emp.id)}>
                        <UserRound className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" disabled={!isAdmin} onClick={() => void openEditModal(emp.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!isAdmin || emp.status === 'RESIGNED'}
                        onClick={() => void handleResign(emp)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {loading && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-muted-foreground">
                  Đang tải dữ liệu nhân viên...
                </td>
              </tr>
            )}

            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-muted-foreground">
                  Không có dữ liệu nhân viên
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-background shrink-0">
        <span className="text-sm text-muted-foreground">
          Hiển thị {totalItems === 0 ? 0 : start}-{Math.min(currentPage * PAGE_SIZE, totalItems)} trong {totalItems} nhân viên
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

      {showFormModal && (
        <EmployeeModal
          title={formMode === 'create' ? 'Thêm nhân viên mới' : 'Cập nhật thông tin nhân viên'}
          onClose={handleCloseForm}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Mã nhân viên</label>
                <Input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Họ và tên</label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Điện thoại</label>
                <Input value={form.phone || ''} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ngày sinh</label>
                <Input type="date" value={form.birthday || ''} onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ngày vào làm</label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm((prev) => ({ ...prev, joinDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Phòng ban</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.departmentId || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value ? Number(e.target.value) : undefined }))}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Avatar URL</label>
                <Input value={form.avatar || ''} onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Địa chỉ</label>
              <Input value={form.address || ''} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            {createdAccount && (
              <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-700">Đã tạo nhân viên thành công</p>
                <p>Username: <strong>{createdAccount.username}</strong></p>
                <p>Mật khẩu mặc định: <strong>{createdAccount.defaultPassword}</strong></p>
                <p>Role: <strong>{createdAccount.role}</strong></p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Đóng</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {formMode === 'create' ? 'Thêm nhân viên' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </EmployeeModal>
      )}

      {showDetailModal && (
        <EmployeeModal title="Thông tin nhân viên" onClose={() => setShowDetailModal(false)}>
          {detailLoading && (
            <div className="py-8 text-center text-muted-foreground">Đang tải chi tiết...</div>
          )}

          {!detailLoading && detailEmployee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-muted-foreground">Mã:</span> {detailEmployee.code}</p>
              <p><span className="text-muted-foreground">Họ tên:</span> {detailEmployee.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {detailEmployee.email || '-'}</p>
              <p><span className="text-muted-foreground">Điện thoại:</span> {detailEmployee.phone || '-'}</p>
              <p><span className="text-muted-foreground">Ngày sinh:</span> {formatDate(detailEmployee.birthday)}</p>
              <p><span className="text-muted-foreground">Ngày vào làm:</span> {formatDate(detailEmployee.joinDate)}</p>
              <p><span className="text-muted-foreground">Phòng ban:</span> {detailEmployee.departmentName || '-'}</p>
              <p><span className="text-muted-foreground">Trạng thái:</span> {statusLabel(detailEmployee.status)}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">Địa chỉ:</span> {detailEmployee.address || '-'}</p>
              <p><span className="text-muted-foreground">Ngày tạo:</span> {formatDate(detailEmployee.createdAt)}</p>
              <p><span className="text-muted-foreground">Cập nhật:</span> {formatDate(detailEmployee.updatedAt)}</p>
            </div>
          )}
        </EmployeeModal>
      )}
    </div>
  )
}
