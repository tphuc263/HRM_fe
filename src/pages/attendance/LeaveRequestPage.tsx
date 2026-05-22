import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { leaveService } from '../../services/leaveService'
import { employeeService } from '../../services/employeeService'
import type { LeaveBalanceDto, LeaveRequestCreatePayload, LeaveRequestDto, LeaveTypeDto } from '../../types/leave'
import type { EmployeeDto } from '../../types/hrm'
import { useAuth } from '../../context/useAuth'

type UiLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const PAGE_SIZE = 10

const statusTabs: Array<{ key: UiLeaveStatus; label: string }> = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
  }
  return map[status] || status
}

function badgeClass(status: string) {
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
  if (status === 'APPROVED') return 'bg-green-100 text-green-700'
  if (status === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

function getCurrentYear() {
  return new Date().getFullYear()
}

export default function LeaveRequestPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [activeTab, setActiveTab] = useState<UiLeaveStatus>('PENDING')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [requests, setRequests] = useState<LeaveRequestDto[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([])
  const [search, setSearch] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<number | 'ALL'>('ALL')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [year, setYear] = useState<number>(getCurrentYear())
  const [myBalances, setMyBalances] = useState<LeaveBalanceDto[]>([])
  const [balanceLoading, setBalanceLoading] = useState(false)

  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [adminEmployeeId, setAdminEmployeeId] = useState<number | null>(null)
  const [adminBalances, setAdminBalances] = useState<LeaveBalanceDto[]>([])
  const [adminBalanceLoading, setAdminBalanceLoading] = useState(false)

  const [form, setForm] = useState<LeaveRequestCreatePayload>({
    leaveTypeId: 0,
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
    attachmentUrl: '',
  })

  const loadTypes = useCallback(async () => {
    try {
      const data = await leaveService.getLeaveTypes()
      setLeaveTypes(data)
      setForm((prev) => ({ ...prev, leaveTypeId: prev.leaveTypeId || data[0]?.id || 0 }))
    } catch {
      setLeaveTypes([])
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = {
        status: activeTab,
        leaveTypeId: leaveTypeFilter === 'ALL' ? undefined : leaveTypeFilter,
        keyword: search.trim() || undefined,
        page: currentPage - 1,
        size: PAGE_SIZE,
        sortBy: 'createdAt',
        sortDir: 'desc' as const,
      }
      const data = isAdmin
        ? await leaveService.getAllRequests(query)
        : await leaveService.getMyRequests(query)
      setRequests(data.content)
      setTotalPages(Math.max(1, data.totalPages))
      setTotalItems(data.totalElements)
    } catch (err) {
      setRequests([])
      setTotalPages(1)
      setTotalItems(0)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, isAdmin, leaveTypeFilter, search])

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return
    try {
      const data = await employeeService.getAll({ page: 0, size: 200, sortBy: 'name', sortDir: 'asc' })
      setEmployees(data.content)
      if (data.content.length > 0) {
        setAdminEmployeeId(data.content[0].id)
      }
    } catch {
      setEmployees([])
      setAdminEmployeeId(null)
    }
  }, [isAdmin])

  const loadMyBalances = useCallback(async () => {
    if (isAdmin) return
    setBalanceLoading(true)
    try {
      const data = await leaveService.getMyBalances(year)
      setMyBalances(data)
    } catch {
      setMyBalances([])
    } finally {
      setBalanceLoading(false)
    }
  }, [isAdmin, year])

  const loadAdminBalances = useCallback(async () => {
    if (!isAdmin || !adminEmployeeId) return

    setAdminBalanceLoading(true)
    try {
      const data = await leaveService.getEmployeeBalances(adminEmployeeId, year)
      setAdminBalances(data)
    } catch {
      setAdminBalances([])
    } finally {
      setAdminBalanceLoading(false)
    }
  }, [adminEmployeeId, isAdmin, year])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    void loadMyBalances()
  }, [loadMyBalances])

  useEffect(() => {
    void loadAdminBalances()
  }, [loadAdminBalances])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [activeTab, leaveTypeFilter, search])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin đơn nghỉ')
      return
    }

    setSubmitLoading(true)
    try {
      await leaveService.submitRequest({
        ...form,
        reason: form.reason.trim(),
        attachmentUrl: form.attachmentUrl?.trim() || undefined,
      })
      setForm((prev) => ({ ...prev, reason: '', attachmentUrl: '', days: 1 }))
      setShowCreateForm(false)
      await Promise.all([loadRequests(), loadMyBalances()])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    setActionLoadingId(id)
    try {
      await leaveService.approveRequest(id)
      await Promise.all([loadRequests(), loadAdminBalances(), loadMyBalances()])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = window.prompt('Nhập lý do từ chối:')
    if (!reason?.trim()) return

    setActionLoadingId(id)
    try {
      await leaveService.rejectRequest(id, reason.trim())
      await loadRequests()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (id: number) => {
    setActionLoadingId(id)
    try {
      await leaveService.cancelRequest(id)
      await loadRequests()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleInitBalance = async () => {
    if (!isAdmin || !adminEmployeeId) return
    setAdminBalanceLoading(true)
    try {
      await leaveService.initBalance(adminEmployeeId, year)
      await loadAdminBalances()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAdminBalanceLoading(false)
    }
  }

  const handleUpdateBalance = async (balance: LeaveBalanceDto) => {
    const total = window.prompt('Tổng ngày phép mới', String(balance.totalDays))
    if (total === null) return
    const carryOver = window.prompt('Ngày chuyển năm mới', String(balance.carryOverDays))
    if (carryOver === null) return

    setAdminBalanceLoading(true)
    try {
      await leaveService.updateBalance(balance.id, Number(total), Number(carryOver))
      await loadAdminBalances()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAdminBalanceLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Quản lý đơn xin nghỉ</h1>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-28"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <Button variant="outline" onClick={() => { void loadMyBalances(); void loadAdminBalances() }}>
              <RefreshCw className="h-4 w-4" />
              Tải số dư
            </Button>
            <Button onClick={() => setShowCreateForm((prev) => !prev)}>
              <Plus className="h-4 w-4" />
              {showCreateForm ? 'Ẩn tạo đơn mới' : 'Tạo đơn nghỉ mới'}
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-md p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-md text-sm ${activeTab === tab.key ? 'bg-[#3d6b59] text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Input placeholder="Tìm tên/mã/lý do" className="pr-8" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={leaveTypeFilter}
              onChange={(e) => { setLeaveTypeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); setCurrentPage(1) }}
            >
              <option value="ALL">Tất cả loại nghỉ</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10" />
                  <TableHead>Ma NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Loại nghỉ</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead>Số ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                ) : requests.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded((prev) => (prev === row.id ? null : row.id))}>
                      <TableCell>{expanded === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                      <TableCell>{row.employeeCode}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.leaveTypeName}</TableCell>
                      <TableCell>{formatDate(row.startDate)}</TableCell>
                      <TableCell>{formatDate(row.endDate)}</TableCell>
                      <TableCell>{Math.round(row.days)}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass(row.status)}`}>{statusLabel(row.status)}</span></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {isAdmin && row.status === 'PENDING' && (
                            <>
                              <Button size="sm" onClick={() => void handleApprove(row.id)} disabled={actionLoadingId === row.id}>Duyệt</Button>
                              <Button size="sm" variant="destructive" onClick={() => void handleReject(row.id)} disabled={actionLoadingId === row.id}>Từ chối</Button>
                            </>
                          )}
                          {!isAdmin && row.status === 'PENDING' && (
                            <Button size="sm" variant="destructive" onClick={() => void handleCancel(row.id)} disabled={actionLoadingId === row.id}>Hủy</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded === row.id && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Lý do:</span> {row.reason}</div>
                            <div><span className="text-muted-foreground">Người duyệt:</span> {row.approvedByName || '-'}</div>
                            <div><span className="text-muted-foreground">Lý do từ chối:</span> {row.rejectionReason || '-'}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-2 py-2 border-t">
            <span className="text-sm text-muted-foreground">
              Hiển thị {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalItems)} trong {totalItems} đơn
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-3 text-sm">Trang {currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <form className="bg-white border rounded-md p-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Loại nghỉ</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.leaveTypeId}
                  onChange={(e) => setForm((prev) => ({ ...prev, leaveTypeId: Number(e.target.value) }))}
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Từ ngày</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Đến ngày</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Số ngày</label>
                <Input type="number" min="1" step="1" value={Math.round(form.days)} onChange={(e) => setForm((prev) => ({ ...prev, days: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Attachment URL</label>
                <Input value={form.attachmentUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Lý do</label>
              <Input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
            </div>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Gửi đơn
            </Button>
          </form>
        )}

        {!isAdmin && (
          <div className="bg-white border rounded-md p-4">
            <h2 className="text-sm font-semibold mb-3">Số dư phép năm {year}</h2>
            {balanceLoading ? (
              <div className="text-sm text-muted-foreground">Đang tải số dư phép...</div>
            ) : myBalances.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có dữ liệu số dư phép</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {myBalances.map((balance) => (
                  <div key={balance.id} className="rounded border p-3">
                    <div className="text-xs text-muted-foreground">{balance.leaveTypeName}</div>
                    <div className="text-sm mt-1">Con lai: <strong>{Math.round(balance.remainingDays)}</strong> ngay</div>
                    <div className="text-xs text-muted-foreground mt-1">Tổng: {Math.round(balance.totalDays)} | Đã dùng: {Math.round(balance.usedDays)} | Chuyển năm: {Math.round(balance.carryOverDays)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="bg-white border rounded-md p-4 space-y-3">
            <h2 className="text-sm font-semibold">Quản lý số dư phép (Admin)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Nhân viên</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={adminEmployeeId || ''}
                  onChange={(e) => setAdminEmployeeId(Number(e.target.value))}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.code} - {emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Năm</label>
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleInitBalance()} disabled={adminBalanceLoading || !adminEmployeeId}>
                  <Plus className="h-4 w-4" />
                  Khởi tạo phép
                </Button>
              </div>
            </div>

            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Loại phép</TableHead>
                    <TableHead>Tổng ngày</TableHead>
                    <TableHead>Đã dùng</TableHead>
                    <TableHead>Chuyển năm</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminBalanceLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Đang tải số dư...</TableCell></TableRow>
                  ) : adminBalances.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Chưa có dữ liệu số dư phép</TableCell></TableRow>
                  ) : adminBalances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell>{balance.leaveTypeName}</TableCell>
                      <TableCell>{Math.round(balance.totalDays)}</TableCell>
                      <TableCell>{Math.round(balance.usedDays)}</TableCell>
                      <TableCell>{Math.round(balance.carryOverDays)}</TableCell>
                      <TableCell>{Math.round(balance.remainingDays)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => void handleUpdateBalance(balance)}>
                          Cập nhật
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
