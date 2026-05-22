import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, X, Loader2, FileText } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'
import { leaveService } from '../../services/leaveService'
import type { LeaveTypeDto, LeaveTypeUpsertPayload } from '../../types/leave'

function LeaveTypeModal({
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
      <div className="w-full max-w-lg rounded-lg bg-background border shadow-lg">
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

const initialForm: LeaveTypeUpsertPayload = {
  code: '',
  name: '',
  isPaid: true,
  description: '',
}

export default function LeaveTypeListPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<LeaveTypeUpsertPayload>(initialForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadLeaveTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await leaveService.getLeaveTypes()
      setLeaveTypes(data)
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh mục loại phép')
      setLeaveTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLeaveTypes()
  }, [loadLeaveTypes])

  const openCreateModal = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(initialForm)
    setFormError('')
    setShowFormModal(true)
  }

  const openEditModal = (lt: LeaveTypeDto) => {
    setFormMode('edit')
    setEditingId(lt.id)
    setForm({
      code: lt.code,
      name: lt.name,
      isPaid: lt.isPaid,
      description: lt.description || '',
    })
    setFormError('')
    setShowFormModal(true)
  }

  const validateForm = () => {
    if (!form.code.trim() || !form.name.trim()) {
      return 'Vui lòng nhập mã và tên loại phép'
    }
    return ''
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormLoading(true)
    try {
      if (formMode === 'create') {
        await leaveService.createLeaveType({
          code: form.code.trim(),
          name: form.name.trim(),
          isPaid: form.isPaid,
          description: form.description?.trim() || undefined,
        })
      } else if (editingId) {
        await leaveService.updateLeaveType(editingId, {
          code: form.code.trim(),
          name: form.name.trim(),
          isPaid: form.isPaid,
          description: form.description?.trim() || undefined,
        })
      }
      setShowFormModal(false)
      await loadLeaveTypes()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10 shrink-0">
        <FileText className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">DANH MỤC LOẠI PHÉP</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div></div>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm loại phép
        </Button>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="p-3 text-left font-medium text-foreground w-32">Mã loại</th>
              <th className="p-3 text-left font-medium text-foreground w-64">Tên loại phép</th>
              <th className="p-3 text-left font-medium text-foreground w-32">Có tính lương</th>
              <th className="p-3 text-left font-medium text-foreground">Mô tả</th>
              <th className="p-3 text-right font-medium text-foreground w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && leaveTypes.map((lt) => (
              <tr key={lt.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3 font-mono text-muted-foreground">{lt.code}</td>
                <td className="p-3 font-medium text-foreground">{lt.name}</td>
                <td className="p-3">
                  {lt.isPaid ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Có</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Không</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{lt.description || '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(lt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && leaveTypes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">Chưa có loại phép nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <LeaveTypeModal
          title={formMode === 'create' ? 'Thêm loại phép mới' : 'Cập nhật loại phép'}
          onClose={() => setShowFormModal(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            <div>
              <label className="text-xs text-muted-foreground">Mã loại phép *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VD: AL, SL, UP..."
                disabled={formMode === 'edit'}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tên loại phép *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Nghỉ phép năm, Nghỉ ốm..."
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isPaid"
                checked={form.isPaid}
                onCheckedChange={(checked) => setForm({ ...form, isPaid: checked === true })}
              />
              <label htmlFor="isPaid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nghỉ có hưởng lương
              </label>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mô tả</label>
              <Input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>Đóng</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {formMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </LeaveTypeModal>
      )}
    </div>
  )
}
