import { X, Calendar, Clock, User, CheckCircle, AlertCircle, FileText, History } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { OvertimeRequestResponse } from '../../types/attendance'

interface Props {
  request: OvertimeRequestResponse | null
  onClose: () => void
}

function formatDate(value?: string) {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function OvertimeDetailModal({ request, onClose }: Props) {
  if (!request) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle }
      case 'APPROVED':
        return { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
      case 'REJECTED':
        return { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-200', icon: X }
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: History }
      default:
        return { label: status, color: 'bg-slate-100', icon: AlertCircle }
    }
  }

  const { label, color, icon: StatusIcon } = getStatusInfo(request.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="bg-[#3d6b59] px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết đơn đăng ký tăng ca
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#3d6b59]/10 flex items-center justify-center text-[#3d6b59]">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Nhân viên</p>
                <p className="font-bold text-slate-900">{request.employeeName} ({request.employeeCode})</p>
              </div>
            </div>
            <Badge className={`${color} px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm`}>
              <StatusIcon className="h-3 w-3" />
              {label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Ngày tăng ca
              </p>
              <p className="text-slate-800 font-bold text-lg">{new Date(request.date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Thời gian
              </p>
              <p className="text-slate-800 font-bold text-lg">
                {request.startTime.substring(0, 5)} - {request.endTime.substring(0, 5)} 
                <span className="text-sm font-medium text-slate-500 ml-2">({request.hours} giờ)</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do tăng ca</p>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 italic border border-dashed border-slate-200">
              "{request.reason || 'Không có lý do chi tiết'}"
            </div>
          </div>

          {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Người duyệt</p>
                  <p className="font-bold text-slate-700">{request.approvedByName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Thời gian duyệt</p>
                  <p className="font-medium text-slate-600 italic text-sm">{formatDate(request.approvedAt)}</p>
                </div>
              </div>
              {request.status === 'REJECTED' && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-400 uppercase mb-1">Lý do từ chối</p>
                  <p className="text-red-700 font-medium">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} className="px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
