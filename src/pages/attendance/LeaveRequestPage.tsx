import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Plus, Search } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { leaveService } from '../../services/leaveService'
import type { LeaveRequestCreatePayload, LeaveRequestDto, LeaveTypeDto } from '../../types/leave'
import { useAuth } from '../../context/useAuth'

type UiLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const statusTabs: Array<{ key: UiLeaveStatus; label: string }> = [
  { key: 'PENDING', label: 'Cho duyet' },
  { key: 'APPROVED', label: 'Da duyet' },
  { key: 'REJECTED', label: 'Tu choi' },
  { key: 'CANCELLED', label: 'Da huy' },
]

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Cho duyet',
    APPROVED: 'Da duyet',
    REJECTED: 'Tu choi',
    CANCELLED: 'Da huy',
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
      let data: LeaveRequestDto[]
      if (isAdmin) {
        data = await leaveService.getAllRequests()
      } else {
        data = await leaveService.getMyRequests()
      }
      setRequests(data)
    } catch (err) {
      setRequests([])
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void loadTypes()
    void loadRequests()
  }, [loadRequests, loadTypes])

  const tabCounts = useMemo(() => {
    return statusTabs.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.key] = requests.filter((r) => r.status === tab.key).length
      return acc
    }, {})
  }, [requests])

  const filtered = useMemo(() => {
    return requests
      .filter((r) => r.status === activeTab)
      .filter((r) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return `${r.employeeCode} ${r.employeeName} ${r.reason}`.toLowerCase().includes(q)
      })
      .filter((r) => leaveTypeFilter === 'ALL' || r.leaveTypeId === leaveTypeFilter)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [activeTab, leaveTypeFilter, requests, search])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Vui long nhap day du thong tin don nghi')
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
      await loadRequests()
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
      await loadRequests()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = window.prompt('Nhap ly do tu choi:')
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#3d6b59] h-10 flex items-center px-4"><span className="text-white text-sm font-medium">TIME365</span></div>
      <div className="p-6 overflow-auto flex-1 space-y-4">
        <div><h1 className="text-2xl font-semibold text-foreground">Quan ly don xin nghi</h1></div>

        <form className="bg-white border rounded-md p-4 space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Plus className="h-4 w-4" />
            Tao don nghi moi
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Loai nghi</label>
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
              <label className="text-xs text-muted-foreground">Tu ngay</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Den ngay</label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">So ngay</label>
              <Input type="number" min="0.5" step="0.5" value={form.days} onChange={(e) => setForm((prev) => ({ ...prev, days: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Attachment URL</label>
              <Input value={form.attachmentUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Ly do</label>
            <Input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
          </div>
          <Button type="submit" disabled={submitLoading}>
            {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Gui don
          </Button>
        </form>

        <div className="bg-white border rounded-md p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm ${activeTab === tab.key ? 'bg-[#3d6b59] text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {tab.label} ({tabCounts[tab.key] || 0})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Input placeholder="Tim ten/ma/ly do" className="pr-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            >
              <option value="ALL">Tat ca loai nghi</option>
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
                  <TableHead>Ho ten</TableHead>
                  <TableHead>Loai nghi</TableHead>
                  <TableHead>Tu ngay</TableHead>
                  <TableHead>Den ngay</TableHead>
                  <TableHead>So ngay</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead>Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Dang tai du lieu...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Khong co du lieu</TableCell></TableRow>
                ) : filtered.map((row) => (
                  <>
                    <TableRow key={row.id} className="cursor-pointer" onClick={() => setExpanded((prev) => prev === row.id ? null : row.id)}>
                      <TableCell>{expanded === row.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                      <TableCell>{row.employeeCode}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.leaveTypeName}</TableCell>
                      <TableCell>{formatDate(row.startDate)}</TableCell>
                      <TableCell>{formatDate(row.endDate)}</TableCell>
                      <TableCell>{row.days}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass(row.status)}`}>{statusLabel(row.status)}</span></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {isAdmin && row.status === 'PENDING' && (
                            <>
                              <Button size="sm" onClick={() => void handleApprove(row.id)} disabled={actionLoadingId === row.id}>Duyet</Button>
                              <Button size="sm" variant="destructive" onClick={() => void handleReject(row.id)} disabled={actionLoadingId === row.id}>Tu choi</Button>
                            </>
                          )}
                          {!isAdmin && row.status === 'PENDING' && (
                            <Button size="sm" variant="destructive" onClick={() => void handleCancel(row.id)} disabled={actionLoadingId === row.id}>Huy</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded === row.id && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Ly do:</span> {row.reason}</div>
                            <div><span className="text-muted-foreground">Nguoi duyet:</span> {row.approvedByName || '-'}</div>
                            <div><span className="text-muted-foreground">Ly do tu choi:</span> {row.rejectionReason || '-'}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
