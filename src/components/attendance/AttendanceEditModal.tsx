import React, { useState, useEffect } from 'react'
import { X, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import type { AttendanceRecordDto, AttendanceUpdatePayload } from '../../types/attendance'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: AttendanceUpdatePayload) => void
  record: AttendanceRecordDto | null
}

const statusOptions = [
  { value: 'ON_TIME', label: 'Đúng giờ' },
  { value: 'LATE', label: 'Đi trễ' },
  { value: 'EARLY_LEAVE', label: 'Về sớm' },
  { value: 'ABSENT', label: 'Vắng mặt' },
  { value: 'HALF_DAY', label: 'Nửa ngày' },
]

export function AttendanceEditModal({ isOpen, onClose, onConfirm, record }: Props) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (record) {
      setCheckIn(record.checkIn?.slice(0, 5) || '')
      setCheckOut(record.checkOut?.slice(0, 5) || '')
      setStatus(record.status || 'ON_TIME')
      setNote(record.note || '')
    }
  }, [record, isOpen])

  if (!isOpen || !record) return null

  const handleConfirm = () => {
    onConfirm({
      checkIn: checkIn.trim() || undefined,
      checkOut: checkOut.trim() || undefined,
      status: status.trim() || undefined,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="bg-[#3d6b59] px-6 py-4 flex items-center justify-between text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cập nhật giờ công: {record.employeeName}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Giờ vào (HH:mm)
              </label>
              <Input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Giờ ra (HH:mm)
              </label>
              <Input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Trạng thái đơn
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl border-slate-200 h-11">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              Ghi chú
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú chỉnh sửa..."
              className="rounded-xl border-slate-200 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#3d6b59] hover:bg-[#2d4f42] text-white rounded-xl px-8 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Cập nhật dữ liệu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
