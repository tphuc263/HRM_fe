import { X, Calendar, Clock, User, CheckCircle, AlertCircle, FileText, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { AttendanceRecordDto } from '../../types/attendance'

interface Props {
  record: AttendanceRecordDto | null
  onClose: () => void
}

export default function AttendanceDetailModal({ record, onClose }: Props) {
  if (!record) return null

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Có mặt</Badge>
      case 'LATE':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Đi muộn</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">Vắng mặt</Badge>
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Info className="h-5 w-5" />
            Chi tiết bản ghi chấm công
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Nhân viên</p>
                <p className="font-bold text-slate-900">{record.employeeName} ({record.employeeCode})</p>
              </div>
            </div>
            {getStatusBadge(record.status)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Ngày làm việc
              </p>
              <p className="text-slate-800 font-bold text-lg">{new Date(record.date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Giờ tăng ca (OT)
              </p>
              <p className="text-orange-600 font-bold text-2xl">
                {record.overtimeHours || 0} <span className="text-sm font-medium text-slate-500">giờ</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Giờ vào (Check-in)</p>
              <p className="text-slate-700 font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {record.checkIn?.substring(0, 5) || '--:--'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Giờ ra (Check-out)</p>
              <p className="text-slate-700 font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                {record.checkOut?.substring(0, 5) || '--:--'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Ghi chú
            </p>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-600 italic text-sm border border-slate-100 min-h-[60px]">
              {record.note || 'Không có ghi chú nào cho bản ghi này.'}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} className="px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
