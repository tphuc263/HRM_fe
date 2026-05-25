import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'
import { shiftService } from '../../services/shiftService'
import { useToast } from '../../context/ToastContext'
import type { ShiftDto, ShiftUpsertPayload } from '../../types/attendance'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

function ShiftModal({
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
      <div className="w-full max-w-lg rounded-lg bg-background border shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
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

const initialForm: ShiftUpsertPayload = {
  code: '',
  name: '',
  startTime: '08:00:00',
  endTime: '17:00:00',
  breakStartTime: '12:00:00',
  breakEndTime: '13:00:00',
  isDefault: false,
  isActive: true,
}

// Giúp input type="time" xử lý đúng chuẩn HH:mm
const formatTimeInput = (timeStr?: string | null) => {
  if (!timeStr) return ''
  // Nếu BE trả về "08:00:00", ta chỉ lấy "08:00" để show trên input type="time"
  return timeStr.substring(0, 5)
}

const formatTimeOutput = (timeStr: string) => {
  if (!timeStr) return ''
  if (timeStr.length === 5) return timeStr + ':00'
  return timeStr
}

export default function ShiftListPage() {
  const toast = useToast()
  const [shifts, setShifts] = useState<ShiftDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ShiftUpsertPayload>(initialForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const loadShifts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await shiftService.getAll()
      setShifts(data)
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách ca làm việc')
      setShifts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadShifts()
  }, [loadShifts])

  const openCreateModal = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(initialForm)
    setFormError('')
    setShowFormModal(true)
  }

  const openEditModal = (shift: ShiftDto) => {
    setFormMode('edit')
    setEditingId(shift.id)
    setForm({
      code: shift.code,
      name: shift.name,
      startTime: formatTimeInput(shift.startTime),
      endTime: formatTimeInput(shift.endTime),
      breakStartTime: formatTimeInput(shift.breakStartTime),
      breakEndTime: formatTimeInput(shift.breakEndTime),
      isDefault: shift.isDefault,
      isActive: shift.isActive,
    })
    setFormError('')
    setShowFormModal(true)
  }

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa ca làm việc',
      message: 'Bạn có chắc chắn muốn xóa ca làm việc này? Hành động này không thể hoàn tác.',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await shiftService.delete(id)
          toast.success('Đã xóa ca làm việc thành công')
          await loadShifts()
        } catch (err) {
          toast.error((err as Error).message)
        } finally {
          setActionLoading(false)
        }
      }
    })
  }

  const validateForm = () => {
    if (!form.code.trim() || !form.name.trim() || !form.startTime || !form.endTime) {
      return 'Vui lòng nhập đầy đủ thông tin bắt buộc'
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
      const payload: ShiftUpsertPayload = {
        code: form.code.trim(),
        name: form.name.trim(),
        startTime: formatTimeOutput(form.startTime),
        endTime: formatTimeOutput(form.endTime),
        breakStartTime: form.breakStartTime ? formatTimeOutput(form.breakStartTime) : undefined,
        breakEndTime: form.breakEndTime ? formatTimeOutput(form.breakEndTime) : undefined,
        isDefault: form.isDefault,
        isActive: form.isActive,
      }

      if (formMode === 'create') {
        await shiftService.create(payload)
      } else if (editingId) {
        await shiftService.update(editingId, payload)
      }
      setShowFormModal(false)
      await loadShifts()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10 shrink-0">
        <Clock className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">DANH SÁCH CA LÀM VIỆC</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div></div>
        <Button size="sm" onClick={openCreateModal} disabled={actionLoading}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm ca làm việc
        </Button>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="p-3 text-left font-medium text-foreground w-24">Mã</th>
              <th className="p-3 text-left font-medium text-foreground">Tên ca</th>
              <th className="p-3 text-left font-medium text-foreground w-32">Giờ làm</th>
              <th className="p-3 text-left font-medium text-foreground w-32">Nghỉ trưa</th>
              <th className="p-3 text-center font-medium text-foreground w-24">Mặc định</th>
              <th className="p-3 text-center font-medium text-foreground w-24">Trạng thái</th>
              <th className="p-3 text-right font-medium text-foreground w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && shifts.map((shift) => (
              <tr key={shift.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3 font-mono text-muted-foreground">{shift.code}</td>
                <td className="p-3 font-medium text-foreground">{shift.name}</td>
                <td className="p-3 text-muted-foreground">
                  {formatTimeInput(shift.startTime)} - {formatTimeInput(shift.endTime)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {shift.breakStartTime && shift.breakEndTime ? `${formatTimeInput(shift.breakStartTime)} - ${formatTimeInput(shift.breakEndTime)}` : '-'}
                </td>
                <td className="p-3 text-center">
                  {shift.isDefault ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Mặc định</span>
                  ) : null}
                </td>
                <td className="p-3 text-center">
                  {shift.isActive ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hoạt động</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Ngừng</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(shift)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void handleDelete(shift.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && shifts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">Chưa có ca làm việc nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <ShiftModal
          title={formMode === 'create' ? 'Thêm ca làm việc mới' : 'Cập nhật ca làm việc'}
          onClose={() => setShowFormModal(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Mã ca *</label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="VD: CA_HC"
                  disabled={formMode === 'edit'}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tên ca *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Hành chính"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Giờ bắt đầu *</label>
                <Input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Giờ kết thúc *</label>
                <Input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bắt đầu nghỉ trưa</label>
                <Input
                  type="time"
                  value={form.breakStartTime || ''}
                  onChange={(e) => setForm({ ...form, breakStartTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Kết thúc nghỉ trưa</label>
                <Input
                  type="time"
                  value={form.breakEndTime || ''}
                  onChange={(e) => setForm({ ...form, breakEndTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked === true })}
                />
                <label htmlFor="isDefault" className="text-sm font-medium leading-none">
                  Ca mặc định toàn công ty
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
                />
                <label htmlFor="isActive" className="text-sm font-medium leading-none">
                  Đang hoạt động
                </label>
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>Đóng</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {formMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </ShiftModal>
      )}

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
