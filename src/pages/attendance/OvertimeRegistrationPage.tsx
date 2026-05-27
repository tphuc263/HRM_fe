import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Search,
  Plus,
  Clock,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { attendanceService } from '../../services/attendanceService'
import { overtimeService } from '../../services/overtimeService'
import type { AttendanceRecordDto, OvertimeRequestResponse } from '../../types/attendance'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/ToastContext'
import OvertimeRequestModal from '../../components/attendance/OvertimeRequestModal'
import OvertimeDetailModal from '../../components/attendance/OvertimeDetailModal'
import AttendanceDetailModal from '../../components/attendance/AttendanceDetailModal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PromptModal } from '../../components/ui/PromptModal'
import { Eye } from 'lucide-react'

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN')
}

export default function OvertimeRegistrationPage() {
  const PAGE_SIZE = 10
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [activeTab, setActiveTab] = useState<'RECORDS' | 'REQUESTS'>('REQUESTS')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // States for Attendance Records
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsCurrentPage, setRecordsCurrentPage] = useState(1)
  const [recordsTotalPages, setRecordsTotalPages] = useState(1)
  const [recordsTotalItems, setRecordsTotalItems] = useState(0)

  // States for Overtime Requests
  const [requests, setRequests] = useState<OvertimeRequestResponse[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1)
  const [requestsTotalPages, setRequestsTotalPages] = useState(1)
  const [requestsTotalItems, setRequestsTotalItems] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequestResponse | null>(null)
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecordDto | null>(null)
  
  // Custom Modals States
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: (val: string) => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const { success, error: toastError } = useToast()

  // Load Attendance Records (Automatic OT)
  const loadRecords = useCallback(async () => {
    setRecordsLoading(true)
    try {
      if (isAdmin) {
        const data = await attendanceService.getDaily({
          date,
          keyword: search.trim() || undefined,
          hasOvertime: true,
          page: recordsCurrentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'employee.code',
          sortDir: 'asc',
        })
        setRecords(data.content)
        setRecordsTotalPages(Math.max(1, data.totalPages))
        setRecordsTotalItems(data.totalElements)
      } else {
        const data = await attendanceService.getMyRecords({
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
          page: recordsCurrentPage - 1,
          size: PAGE_SIZE,
          sortBy: 'date',
          sortDir: 'desc',
        })
        const overtimeRows = data.content.filter((r) => Number(r.overtimeHours || 0) > 0)
        setRecords(overtimeRows)
        setRecordsTotalPages(Math.max(1, Math.ceil(overtimeRows.length / PAGE_SIZE)))
        setRecordsTotalItems(overtimeRows.length)
      }
    } catch (err) {
      toastError('Lỗi khi tải dữ liệu chấm công: ' + (err as Error).message)
    } finally {
      setRecordsLoading(false)
    }
  }, [date, isAdmin, recordsCurrentPage, search])

  // Load Overtime Requests (Manual Registration)
  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const params = {
        status: statusFilter || undefined,
        keyword: search.trim() || undefined,
        page: requestsCurrentPage - 1,
        size: PAGE_SIZE,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }
      const data = isAdmin 
        ? await overtimeService.getAllRequests(params)
        : await overtimeService.getMyRequests(params)
      
      setRequests(data.content)
      setRequestsTotalPages(Math.max(1, data.totalPages))
      setRequestsTotalItems(data.totalElements)
    } catch (err) {
      toastError('Lỗi khi tải đơn đăng ký: ' + (err as Error).message)
    } finally {
      setRequestsLoading(false)
    }
  }, [isAdmin, requestsCurrentPage, search, statusFilter])

  useEffect(() => {
    if (activeTab === 'RECORDS') {
      void loadRecords()
    } else {
      void loadRequests()
    }
  }, [activeTab, loadRecords, loadRequests])

  const handleApprove = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận duyệt đơn',
      message: 'Bạn có chắc chắn muốn phê duyệt đơn đăng ký tăng ca này không?',
      onConfirm: async () => {
        try {
          await overtimeService.approveRequest(id)
          success('Đã duyệt đơn tăng ca thành công')
          void loadRequests()
        } catch (err) {
          toastError((err as Error).message)
        }
      }
    })
  }

  const handleReject = (id: number) => {
    setPromptConfig({
      isOpen: true,
      title: 'Từ chối đơn tăng ca',
      message: 'Vui lòng nhập lý do từ chối để nhân viên được biết:',
      onConfirm: async (reason) => {
        try {
          await overtimeService.rejectRequest(id, reason)
          success('Đã từ chối đơn tăng ca')
          void loadRequests()
        } catch (err) {
          toastError((err as Error).message)
        }
      }
    })
  }

  const handleCancel = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hủy đơn đăng ký',
      message: 'Bạn có chắc chắn muốn hủy đơn đăng ký tăng ca này?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await overtimeService.cancelRequest(id)
          success('Đã hủy đơn đăng ký')
          void loadRequests()
        } catch (err) {
          toastError((err as Error).message)
        }
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Đã duyệt</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Từ chối</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Đã hủy</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="bg-[#3d6b59] h-12 flex items-center px-6 shadow-md z-10">
        <Clock className="text-white h-5 w-5 mr-2" />
        <span className="text-white font-bold tracking-wide">QUẢN LÝ TĂNG CA</span>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border w-fit">
              <button
                onClick={() => setActiveTab('REQUESTS')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'REQUESTS' 
                    ? 'bg-[#3d6b59] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Đơn đăng ký
              </button>
              <button
                onClick={() => setActiveTab('RECORDS')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'RECORDS' 
                    ? 'bg-[#3d6b59] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Bảng chấm công OT
              </button>
            </div>
            {!isAdmin && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#3d6b59] hover:bg-[#2d4f42] text-white shadow-lg hover:shadow-xl transition-all gap-2 h-11 px-6 rounded-xl"
              >
                <Plus className="h-5 w-5" />
                Đăng ký tăng ca mới
              </Button>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Input 
                    placeholder="Tìm kiếm theo mã, tên hoặc lý do..." 
                    className="pl-12 h-12 bg-white border-slate-200 rounded-xl focus:ring-[#3d6b59] group-hover:border-slate-300 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#3d6b59] transition-colors" />
                </div>
                {activeTab === 'RECORDS' && (
                  <div className="w-full md:w-48 relative">
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12 bg-white rounded-xl border-slate-200"
                    />
                  </div>
                )}
                {activeTab === 'REQUESTS' && (
                  <select
                    className="h-12 bg-white rounded-xl border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3d6b59]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Từ chối</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => activeTab === 'RECORDS' ? void loadRecords() : void loadRequests()}
                  className="h-12 px-5 rounded-xl border-slate-200 hover:bg-slate-100 gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${(recordsLoading || requestsLoading) ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="font-bold text-slate-700 py-4 px-6">Nhân viên</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 px-6 text-center">Ngày</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 px-6 text-center">Thời gian / Giờ</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 px-6">Lý do / Nội dung</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 px-6 text-center">Trạng thái</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 px-6 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === 'REQUESTS' ? (
                    requestsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">Đang tải dữ liệu...</TableCell></TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">Chưa có đơn đăng ký tăng ca nào.</TableCell></TableRow>
                    ) : requests.map(req => (
                      <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{req.employeeName}</span>
                            <span className="text-xs text-slate-500 font-medium">{req.employeeCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-6 py-4 font-semibold text-slate-600">{formatDate(req.date)}</TableCell>
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#3d6b59]">{req.startTime.substring(0,5)} - {req.endTime.substring(0,5)}</span>
                            <span className="text-xs text-slate-400 font-medium">({req.hours} giờ)</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="text-sm text-slate-600 max-w-xs truncate" title={req.reason}>{req.reason}</p>
                        </TableCell>
                        <TableCell className="text-center px-6 py-4">{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-2 text-white">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedRequest(req)}
                              className="text-slate-400 hover:text-[#3d6b59] h-8 w-8 p-0 rounded-lg"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && req.status === 'PENDING' && (
                              <>
                                <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 h-8 px-3 rounded-lg gap-1.5 shadow-sm text-xs border-none">
                                  <CheckCircle className="h-3.5 w-3.5" /> Duyệt
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} className="bg-red-500 hover:bg-red-600 h-8 px-3 rounded-lg gap-1.5 shadow-sm text-xs border-none">
                                  <X className="h-3.5 w-3.5" /> Từ chối
                                </Button>
                              </>
                            )}
                            {!isAdmin && req.status === 'PENDING' && (
                              <Button size="sm" variant="outline" onClick={() => handleCancel(req.id)} className="h-8 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg text-xs">
                                Hủy đơn
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    recordsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">Đang tải dữ liệu...</TableCell></TableRow>
                    ) : records.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">Không có dữ liệu tăng ca theo chấm công.</TableCell></TableRow>
                    ) : records.map(row => (
                      <TableRow key={`${row.employeeId}-${row.date}`} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                         <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{row.employeeName}</span>
                            <span className="text-xs text-slate-500 font-medium">{row.employeeCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-6 py-4 font-semibold text-slate-600">{formatDate(row.date)}</TableCell>
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600">{row.checkIn?.substring(0,5)} - {row.checkOut?.substring(0,5)}</span>
                            <span className="text-xs text-slate-400 font-medium">OT: <span className="text-orange-500 font-bold">{row.overtimeHours ?? 0}</span> giờ</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-sm text-slate-500 italic">{row.note || 'Tính tự động từ chấm công'}</span>
                        </TableCell>
                        <TableCell className="text-center px-6 py-4">
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100">Đã chốt công</Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-[#3d6b59] h-8 w-8 p-0"
                            onClick={() => setSelectedAttendanceRecord(row)}
                            title="Xem chi tiết chấm công"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                {activeTab === 'REQUESTS' ? (
                  <>Hiển thị {(requestsCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(requestsCurrentPage * PAGE_SIZE, requestsTotalItems)} trong {requestsTotalItems} đơn</>
                ) : (
                  <>Hiển thị {(recordsCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(recordsCurrentPage * PAGE_SIZE, recordsTotalItems)} trong {recordsTotalItems} bản ghi</>
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl border-slate-200" 
                    onClick={() => activeTab === 'REQUESTS' ? setRequestsCurrentPage(1) : setRecordsCurrentPage(1)}
                    disabled={(activeTab === 'REQUESTS' ? requestsCurrentPage : recordsCurrentPage) === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl border-slate-200" 
                    onClick={() => activeTab === 'REQUESTS' ? setRequestsCurrentPage(p => Math.max(1, p - 1)) : setRecordsCurrentPage(p => Math.max(1, p - 1))}
                    disabled={(activeTab === 'REQUESTS' ? requestsCurrentPage : recordsCurrentPage) === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                   {activeTab === 'REQUESTS' ? `Trang ${requestsCurrentPage} / ${requestsTotalPages}` : `Trang ${recordsCurrentPage} / ${recordsTotalPages}`}
                </div>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl border-slate-200" 
                    onClick={() => activeTab === 'REQUESTS' ? setRequestsCurrentPage(p => Math.min(requestsTotalPages, p + 1)) : setRecordsCurrentPage(p => Math.min(recordsTotalPages, p + 1))}
                    disabled={(activeTab === 'REQUESTS' ? requestsCurrentPage : recordsCurrentPage) === (activeTab === 'REQUESTS' ? requestsTotalPages : recordsTotalPages)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl border-slate-200" 
                    onClick={() => activeTab === 'REQUESTS' ? setRequestsCurrentPage(requestsTotalPages) : setRecordsCurrentPage(recordsTotalPages)}
                    disabled={(activeTab === 'REQUESTS' ? requestsCurrentPage : recordsCurrentPage) === (activeTab === 'REQUESTS' ? requestsTotalPages : recordsTotalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OvertimeRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => void loadRequests()}
      />

      <OvertimeDetailModal 
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />

      <AttendanceDetailModal 
        record={selectedAttendanceRecord}
        onClose={() => setSelectedAttendanceRecord(null)}
      />

      <ConfirmModal 
        {...confirmConfig}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <PromptModal 
        {...promptConfig}
        onClose={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}