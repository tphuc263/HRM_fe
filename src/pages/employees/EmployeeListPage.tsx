import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Users,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { employeeService } from '../../services/employeeService'
import { departmentService } from '../../services/departmentService'
import { contractService } from '../../services/contractService'
import { useToast } from '../../context/ToastContext'
import type { EmployeeDto, EmployeeListQuery, EmployeeUpsertPayload, ContractDto, ContractUpsertPayload } from '../../types/hrm'
import { useAuth } from '../../context/useAuth'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { downloadExcel } from '../../utils/exportUtils'

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
  dependentCount: 0,
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
  const toast = useToast()
  const isAdmin = user?.role === 'ADMIN'

  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } })

  const [resignModal, setResignModal] = useState<{
    isOpen: boolean
    employee: EmployeeDto | null
    date: string
  }>({ isOpen: false, employee: null, date: new Date().toISOString().slice(0, 10) })

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
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'contracts'>('info')
  const [detailContracts, setDetailContracts] = useState<ContractDto[]>([])

  const { id: routeId } = useParams()
  const navigate = useNavigate()

  const [showContractForm, setShowContractForm] = useState(false)
  const [contractForm, setContractForm] = useState<ContractUpsertPayload>({
    employeeId: 0,
    contractType: 'DEFINITE_1YR',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    basicSalary: 0,
  })
  const [contractLoading, setContractLoading] = useState(false)

  const query = useMemo(() => toApiQuery(filters, currentPage), [filters, currentPage])

  const queryClient = useQueryClient()

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  const { data: pageData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['employees', query],
    queryFn: () => employeeService.getAll(query),
  })

  const employees = pageData?.content || []
  const totalPages = Math.max(1, pageData?.totalPages || 1)
  const totalItems = pageData?.totalElements || 0
  const error = queryError ? (queryError as Error).message : ''

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

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map((id) => employeeService.delete(id))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSelectedIds([])
    },
  })

  const resignMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date?: string }) => employeeService.resign(id, date),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; data: EmployeeUpsertPayload }) => {
      if (payload.id) {
        return employeeService.update(payload.id, payload.data)
      }
      return employeeService.create(payload.data)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  // Export action loading state
  const [actionLoading, setActionLoading] = useState(false)

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
        dependentCount: detail.dependentCount || 0,
      })
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  const openDetailModal = async (employeeId: number, skipUrlUpdate = false) => {
    if (!skipUrlUpdate) {
      navigate(`/admin/employees/${employeeId}`)
      return
    }

    setShowDetailModal(true)
    setDetailEmployee(null)
    setDetailLoading(true)
    setActiveDetailTab('info')
    setShowContractForm(false)
    setDetailContracts([])
    try {
      const detail = await employeeService.getById(employeeId)
      setDetailEmployee(detail)
      try {
        const contracts = await contractService.getByEmployee(employeeId)
        setDetailContracts(contracts)
      } catch (e) {
        console.warn('Lỗi lấy danh sách hợp đồng', e)
      }
    } catch (err) {
      toast.error((err as Error).message)
      handleCloseDetailModal()
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetailModal = () => {
    navigate('/admin/employees')
    setShowDetailModal(false)
  }

  useEffect(() => {
    if (routeId) {
      const id = Number(routeId)
      if (!isNaN(id)) {
        void openDetailModal(id, true)
      }
    } else {
      setShowDetailModal(false)
    }
  }, [routeId])

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detailEmployee) return
    setContractLoading(true)
    try {
      await contractService.create({
        ...contractForm,
        employeeId: detailEmployee.id,
        endDate: contractForm.endDate || undefined,
      })
      const refreshed = await contractService.getByEmployee(detailEmployee.id)
      setDetailContracts(refreshed)
      setShowContractForm(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setContractLoading(false)
    }
  }

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || !form.joinDate) {
      return 'Vui lòng nhập đầy đủ họ tên, email và ngày vào làm'
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
      dependentCount: form.dependentCount ?? 0,
    }

    setFormLoading(true)
    try {
      const result = await saveMutation.mutateAsync({
        id: editingEmployeeId || undefined,
        data: payload,
      })
      if (formMode === 'create' && result.generatedAccount) {
        setCreatedAccount(result.generatedAccount)
      } else {
        setShowFormModal(false)
      }
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

  const handleDeleteSelected = () => {
    if (!isAdmin || selectedIds.length === 0) return

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa nhân viên',
      message: `Bạn có chắc chắn xóa ${selectedIds.length} nhân viên đã chọn? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(selectedIds)
          toast.success('Đã xóa nhân viên thành công')
        } catch (err) {
          toast.error((err as Error).message)
        }
      }
    })
  }

  const handleResign = (employee: EmployeeDto) => {
    if (!isAdmin) return
    setResignModal({
      isOpen: true,
      employee,
      date: new Date().toISOString().slice(0, 10)
    })
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
      downloadExcel(`employees-${dateLabel}`, rows[0], rows.slice(1))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10 shrink-0">
        <Users className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">DANH SÁCH NHÂN VIÊN</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-background flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Nhân viên</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên"
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setCurrentPage(1)
              }}
              className="pl-8 w-44 h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Trạng thái</span>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, status: value }))
              setCurrentPage(1)
            }}
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
            value={filters.departmentId === 'ALL' ? 'ALL' : String(filters.departmentId)}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                departmentId: value === 'ALL' ? 'ALL' : Number(value),
              }))
              setCurrentPage(1)
            }}
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
            value={filters.sortField}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, sortField: value as 'NAME' | 'SALARY' }))
              setCurrentPage(1)
            }}
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
            value={filters.sortDirection}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, sortDirection: value as 'asc' | 'desc' }))
              setCurrentPage(1)
            }}
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
                <Input
                  value={formMode === 'create' ? '' : form.code}
                  disabled
                  placeholder="Hệ thống tự động sinh"
                  className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-75"
                />
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
        <EmployeeModal title="Thông tin nhân viên" onClose={handleCloseDetailModal}>
          {detailLoading && (
            <div className="py-8 text-center text-muted-foreground">Đang tải chi tiết...</div>
          )}

          {!detailLoading && detailEmployee && (
            <div>
              <div className="flex items-center gap-4 border-b mb-4">
                <button
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveDetailTab('info')}
                >
                  Thông tin chung
                </button>
                <button
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveDetailTab('contracts')}
                >
                  Hợp đồng
                </button>
              </div>

              {activeDetailTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p><span className="text-muted-foreground">Mã:</span> {detailEmployee.code}</p>
                  <p><span className="text-muted-foreground">Họ tên:</span> {detailEmployee.name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {detailEmployee.email || '-'}</p>
                  <p><span className="text-muted-foreground">Điện thoại:</span> {detailEmployee.phone || '-'}</p>
                  <p><span className="text-muted-foreground">Ngày sinh:</span> {formatDate(detailEmployee.birthday)}</p>
                  <p><span className="text-muted-foreground">Ngày vào làm:</span> {formatDate(detailEmployee.joinDate)}</p>
                  <p><span className="text-muted-foreground">Số người phụ thuộc:</span> {detailEmployee.dependentCount || 0}</p>
                  <p><span className="text-muted-foreground">Phòng ban:</span> {detailEmployee.departmentName || '-'}</p>
                  <p><span className="text-muted-foreground">Trạng thái:</span> {statusLabel(detailEmployee.status)}</p>
                  <p className="md:col-span-2"><span className="text-muted-foreground">Địa chỉ:</span> {detailEmployee.address || '-'}</p>
                  <p><span className="text-muted-foreground">Ngày tạo:</span> {formatDate(detailEmployee.createdAt)}</p>
                  <p><span className="text-muted-foreground">Cập nhật:</span> {formatDate(detailEmployee.updatedAt)}</p>
                </div>
              )}

              {activeDetailTab === 'contracts' && (
                <div className="space-y-4">
                  {isAdmin && !showContractForm && (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => {
                        setContractForm({
                          employeeId: detailEmployee.id,
                          contractType: 'DEFINITE_1YR',
                          startDate: new Date().toISOString().slice(0, 10),
                          endDate: '',
                          basicSalary: detailEmployee.currentSalary || 0,
                        })
                        setShowContractForm(true)
                      }}>
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Thêm hợp đồng
                      </Button>
                    </div>
                  )}

                  {showContractForm && (
                    <form className="border p-4 rounded-md space-y-3 bg-muted/20" onSubmit={handleCreateContract}>
                      <h3 className="text-sm font-medium">Tạo hợp đồng mới (DRAFT)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Loại hợp đồng</label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={contractForm.contractType} onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}>
                            <option value="PROBATION">Thử việc</option>
                            <option value="DEFINITE_1YR">Có thời hạn 1 năm</option>
                            <option value="INDEFINITE">Vô thời hạn</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Lương cơ bản</label>
                          <Input type="number" required min={0} value={contractForm.basicSalary} onChange={(e) => setContractForm({ ...contractForm, basicSalary: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Ngày bắt đầu</label>
                          <Input type="date" required value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Ngày kết thúc</label>
                          <Input type="date" value={contractForm.endDate || ''} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowContractForm(false)}>Hủy</Button>
                        <Button type="submit" size="sm" disabled={contractLoading}>Lưu hợp đồng</Button>
                      </div>
                    </form>
                  )}

                  {!showContractForm && detailContracts.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">Chưa có hợp đồng nào</div>
                  ) : !showContractForm && (
                    <div className="border rounded-md divide-y">
                      {detailContracts.map((contract) => (
                        <div key={contract.id} className="p-3 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div>
                            <div className="font-medium text-foreground">{contract.contractType}</div>
                            <div className="text-muted-foreground text-xs mt-1">
                              {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : 'Vô thời hạn'}
                            </div>
                            <div className="text-xs mt-1 font-medium">Lương: {formatCurrency(contract.basicSalary)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                contract.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                  contract.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                              }`}>
                              {contract.status}
                            </span>
                            {isAdmin && contract.status === 'DRAFT' && (
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => {
                                setConfirmConfig({
                                  isOpen: true,
                                  title: 'Kích hoạt hợp đồng',
                                  message: 'Bạn có chắc chắn muốn kích hoạt hợp đồng này? Hợp đồng ACTIVE cũ (nếu có) sẽ tự động hết hiệu lực.',
                                  onConfirm: async () => {
                                    try {
                                      await contractService.activate(contract.id);
                                      toast.success('Kích hoạt hợp đồng thành công');
                                      if (detailEmployee) {
                                        const refreshed = await contractService.getByEmployee(detailEmployee.id);
                                        setDetailContracts(refreshed);
                                      }
                                    } catch (e) { toast.error((e as Error).message) }
                                  }
                                })
                              }}>Kích hoạt</Button>
                            )}
                            {isAdmin && contract.status === 'ACTIVE' && (
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-destructive border-destructive" onClick={() => {
                                setConfirmConfig({
                                  isOpen: true,
                                  title: 'Chấm dứt hợp đồng',
                                  message: 'Bạn có chắc chắn muốn chấm dứt hợp đồng này?',
                                  variant: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await contractService.terminate(contract.id);
                                      toast.success('Đã chấm dứt hợp đồng thành công');
                                      if (detailEmployee) {
                                        const refreshed = await contractService.getByEmployee(detailEmployee.id);
                                        setDetailContracts(refreshed);
                                      }
                                    } catch (e) { toast.error((e as Error).message) }
                                  }
                                })
                              }}>Chấm dứt</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </EmployeeModal>
      )}

      {resignModal.isOpen && resignModal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Xác nhận nghỉ việc</h3>
              <button
                onClick={() => setResignModal({ isOpen: false, employee: null, date: '' })}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 font-medium">
                Bạn đang thiết lập nghỉ việc cho nhân viên <strong>{resignModal.employee.name}</strong> ({resignModal.employee.code}).
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500">Ngày nghỉ việc</label>
                <Input
                  type="date"
                  value={resignModal.date}
                  onChange={(e) => setResignModal(prev => ({ ...prev, date: e.target.value }))}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setResignModal({ isOpen: false, employee: null, date: '' })}
                  className="rounded-xl px-6"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await resignMutation.mutateAsync({
                        id: resignModal.employee!.id,
                        date: resignModal.date || undefined
                      })
                      toast.success('Đã thiết lập nghỉ việc thành công')
                      setResignModal({ isOpen: false, employee: null, date: '' })
                    } catch (err) {
                      toast.error((err as Error).message)
                    }
                  }}
                  className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
