import React, { useState } from 'react'
import { X, Calendar, Clock, FileText, Send } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { overtimeService } from '../../services/overtimeService'
import { useToast } from '../../context/ToastContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function OvertimeRequestModal({ isOpen, onClose, onSuccess }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('17:30')
  const [endTime, setEndTime] = useState('19:30')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { success, error: toastError } = useToast()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await overtimeService.createRequest({
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        reason,
      })
      success('Đã gửi đơn đăng ký tăng ca thành công. Vui lòng chờ phê duyệt.')
      onSuccess()
      onClose()
    } catch (err) {
      toastError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="bg-gradient-to-r from-[#3d6b59] to-[#4c846d] px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Send className="h-5 w-5" />
            Đăng ký tăng ca
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#3d6b59]" />
              Ngày tăng ca
            </label>
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus:ring-[#3d6b59] border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3d6b59]" />
                Giờ bắt đầu
              </label>
              <Input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="focus:ring-[#3d6b59] border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3d6b59]" />
                Giờ kết thúc
              </label>
              <Input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="focus:ring-[#3d6b59] border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#3d6b59]" />
              Lý do tăng ca
            </label>
            <Textarea
              placeholder="Nhập lý do chi tiết..."
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="focus:ring-[#3d6b59] border-gray-200 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-lg">
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#3d6b59] hover:bg-[#2d4f42] text-white rounded-lg shadow-md transition-all active:scale-95"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
