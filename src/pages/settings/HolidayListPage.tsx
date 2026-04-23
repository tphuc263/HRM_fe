import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'
import { holidayService } from '../../services/holidayService'
import type { HolidayDto, HolidayUpsertPayload } from '../../types/attendance'
import { formatDate } from '../../lib/utils'

function HolidayModal({
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
      <div className="w-full max-w-md rounded-lg bg-background border shadow-lg">
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

const initialForm: HolidayUpsertPayload = {
  name: '',
  date: '',
  isPaid: true,
}

export default function HolidayListPage() {
  const [holidays, setHolidays] = useState<HolidayDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<HolidayUpsertPayload>(initialForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loadHolidays = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await holidayService.getAll()
      setHolidays(data)
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách ngày lễ')
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHolidays()
  }, [loadHolidays])

  const openCreateModal = () => {
    setFormMode('create')
    setEditingId(null)
    setForm({ ...initialForm, date: new Date().toISOString().slice(0, 10) })
    setFormError('')
    setShowFormModal(true)
  }

  const openEditModal = (holiday: HolidayDto) => {
    setFormMode('edit')
    setEditingId(holiday.id)
    setForm({
      name: holiday.name,
      date: holiday.date,
      isPaid: holiday.isPaid,
    })
    setFormError('')
    setShowFormModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ngày lễ này?')) return
    setActionLoading(true)
    try {
      await holidayService.delete(id)
      await loadHolidays()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const validateForm = () => {
    if (!form.name.trim() || !form.date) {
      return 'Vui lòng nhập tên và ngày lễ'
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
        await holidayService.create(form)
      } else if (editingId) {
        await holidayService.update(editingId, form)
      }
      setShowFormModal(false)
      await loadHolidays()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <h1 className="text-lg font-semibold">Danh sách ngày lễ</h1>
        <Button size="sm" onClick={openCreateModal} disabled={actionLoading}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm ngày lễ
        </Button>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="p-3 text-left font-medium text-foreground w-40">Ngày</th>
              <th className="p-3 text-left font-medium text-foreground">Tên ngày lễ</th>
              <th className="p-3 text-center font-medium text-foreground w-32">Có trả lương</th>
              <th className="p-3 text-right font-medium text-foreground w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && holidays.map((holiday) => (
              <tr key={holiday.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3 font-mono text-muted-foreground">{formatDate(holiday.date)}</td>
                <td className="p-3 font-medium text-foreground">{holiday.name}</td>
                <td className="p-3 text-center">
                  {holiday.isPaid ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Có</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Không</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(holiday)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void handleDelete(holiday.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && holidays.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">Chưa có ngày lễ nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <HolidayModal
          title={formMode === 'create' ? 'Thêm ngày lễ mới' : 'Cập nhật ngày lễ'}
          onClose={() => setShowFormModal(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            <div>
              <label className="text-xs text-muted-foreground">Tên ngày lễ *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Nghỉ Tết Dương Lịch"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ngày lễ *</label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isPaid"
                checked={form.isPaid}
                onCheckedChange={(checked) => setForm({ ...form, isPaid: checked === true })}
              />
              <label htmlFor="isPaid" className="text-sm font-medium leading-none">
                Vẫn tính lương (Nghỉ có hưởng lương)
              </label>
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
        </HolidayModal>
      )}
    </div>
  )
}
