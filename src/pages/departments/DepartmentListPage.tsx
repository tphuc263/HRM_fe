import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Building2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { departmentService } from '../../services/departmentService'
import { useToast } from '../../context/ToastContext'
import type { DepartmentDto, DepartmentUpsertPayload } from '../../types/hrm'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

function DepartmentModal({
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

const initialForm: DepartmentUpsertPayload = {
  code: '',
  name: '',
  description: '',
}

export default function DepartmentListPage() {
  const toast = useToast()
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<DepartmentUpsertPayload>(initialForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await departmentService.getAll()
      setDepartments(data)
    } catch (err) {
      setError((err as Error).message || 'Không thể tải danh sách phòng ban')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDepartments()
  }, [loadDepartments])

  const openCreateModal = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(initialForm)
    setFormError('')
    setShowFormModal(true)
  }

  const openEditModal = (dept: DepartmentDto) => {
    setFormMode('edit')
    setEditingId(dept.id)
    setForm({
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
    })
    setFormError('')
    setShowFormModal(true)
  }

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa phòng ban',
      message: 'Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await departmentService.delete(id)
          toast.success('Đã xóa phòng ban thành công')
          await loadDepartments()
        } catch (err) {
          toast.error((err as Error).message)
        } finally {
          setActionLoading(false)
        }
      }
    })
  }

  const validateForm = () => {
    if (!form.code.trim() || !form.name.trim()) {
      return 'Vui lòng nhập mã và tên phòng ban'
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
        await departmentService.create({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
        })
      } else if (editingId) {
        await departmentService.update(editingId, {
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
        })
      }
      toast.success(formMode === 'create' ? 'Đã tạo phòng ban thành công' : 'Cập nhật phòng ban thành công')
      setShowFormModal(false)
      await loadDepartments()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10 shrink-0">
        <Building2 className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">DANH SÁCH PHÒNG BAN</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div></div>
        <Button size="sm" onClick={openCreateModal} disabled={actionLoading}>
          <Plus className="h-4 w-4 mr-1" />
          Thêm phòng ban
        </Button>
      </div>

      {error && <div className="px-4 py-2 text-sm text-destructive border-b">{error}</div>}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background border-b">
            <tr>
              <th className="p-3 text-left font-medium text-foreground w-32">Mã phòng ban</th>
              <th className="p-3 text-left font-medium text-foreground w-64">Tên phòng ban</th>
              <th className="p-3 text-left font-medium text-foreground">Mô tả</th>
              <th className="p-3 text-right font-medium text-foreground w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && departments.map((dept) => (
              <tr key={dept.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3 font-mono text-muted-foreground">{dept.code}</td>
                <td className="p-3 font-medium text-foreground">{dept.name}</td>
                <td className="p-3 text-muted-foreground">{dept.description || '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void handleDelete(dept.id)}>
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
            {!loading && departments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">Chưa có phòng ban nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <DepartmentModal
          title={formMode === 'create' ? 'Thêm phòng ban mới' : 'Cập nhật phòng ban'}
          onClose={() => setShowFormModal(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmitForm}>
            <div>
              <label className="text-xs text-muted-foreground">Mã phòng ban *</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VD: IT, HR..."
                disabled={formMode === 'edit'}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tên phòng ban *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Phòng Công nghệ thông tin"
              />
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
        </DepartmentModal>
      )}

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
