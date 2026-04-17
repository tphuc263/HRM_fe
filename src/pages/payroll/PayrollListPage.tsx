import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, FileDown, CheckCircle, Edit, ListChecks, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { payrollApi } from '../../lib/api/payrollApi';
import type { PayrollResponse, PayrollUpdateRequest } from '../../types/payroll';
import PayrollStatusBadge from '../../components/payroll/PayrollStatusBadge';
import GeneratePayrollModal from '../../components/payroll/GeneratePayrollModal';
import EditPayrollModal from '../../components/payroll/EditPayrollModal';
import BulkUpdateModal from '../../components/payroll/BulkUpdateModal';

// Tiện ích format tiền VNĐ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
const PAGE_SIZE = 10;

export default function PayrollListPage() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollResponse | null>(null);

  // Filters state
  const currentMonthDate = new Date();
  const defaultMonthStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState(defaultMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const res = await payrollApi.getPayrollsByMonth(monthFilter);
      if (res.success) {
        setPayrolls(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch payrolls', err);
      // Fallback cho UI khi chưa có BE
      setPayrolls([]);
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [monthFilter, searchQuery]);

  // Generators
  const handleGenerate = async (month: number, year: number, workDays: number, defaultAllowances: Record<string, number>, defaultDeductions: Record<string, number>) => {
    try {
      await payrollApi.generatePayroll(month, year, workDays, {
        defaultAllowances,
        defaultDeductions
      });
      setIsGenerateOpen(false);
      // Format lại month filter
      const newMonthFilter = `${year}-${String(month).padStart(2, '0')}`;
      if (newMonthFilter !== monthFilter) {
        setMonthFilter(newMonthFilter);
      } else {
        fetchPayrolls();
      }
    } catch (err) {
      console.error("Tạo bảng lương thất bại", err);
      alert("Tạo bảng lương thất bại");
    }
  };

  const handleUpdate = async (id: number, data: PayrollUpdateRequest) => {
    try {
      await payrollApi.updatePayroll(id, data);
      setIsEditOpen(false);
      setEditingPayroll(null);
      fetchPayrolls();
    } catch (err) {
      console.error("Sửa bảng lương thất bại", err);
      alert("Sửa bảng lương thất bại");
    }
  };

  const handleBulkUpdate = async (allowances: Record<string, number>, deductions: Record<string, number>) => {
    try {
      await payrollApi.bulkUpdatePayroll({
        payrollIds: selectedIds,
        allowances,
        deductions
      });
      setIsBulkOpen(false);
      fetchPayrolls();
    } catch (err) {
      console.error("Cập nhật hàng loạt thất bại", err);
      alert("Cập nhật hàng loạt thất bại");
    }
  };

  // Actions
  const handleSubmitStatus = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn chốt lương (CALCULATED)?")) {
      try {
        await payrollApi.submitPayroll(id);
        fetchPayrolls();
      } catch (err) {
        console.error(err);
        alert("Chốt lương thất bại");
      }
    }
  };

  const handleApproveStatus = async (id: number) => {
    if (confirm("Chấp nhận duyệt (APPROVED) phiếu lương này?")) {
      try {
        await payrollApi.approvePayroll(id);
        fetchPayrolls();
      } catch (err) {
        console.error(err);
        alert("Duyệt lương thất bại");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === payrolls.length) setSelectedIds([]);
    else setSelectedIds(payrolls.map(p => p.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredPayrolls = payrolls.filter(p => 
    p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredPayrolls.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedPayrolls = filteredPayrolls.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 min-h-0">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" /> Quản lý Lương
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 border rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input 
              type="month" 
              className="bg-transparent border-none text-sm outline-none w-[130px]" 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tạo bảng lương tháng
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4 min-h-0 overflow-hidden text-sm">
        {/* Actions Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded">
                Đã chọn {selectedIds.length} nhân viên
              </span>
            )}
            <Button 
              variant="secondary" 
              disabled={selectedIds.length === 0}
              onClick={() => setIsBulkOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" /> Cập nhật hàng loạt (Draft)
            </Button>
            <Button variant="outline">
              <FileDown className="w-4 h-4 mr-2" /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10 text-gray-600">
              <tr>
                <th className="p-4 text-center w-12">
                  <Checkbox 
                    checked={payrolls.length > 0 && selectedIds.length === payrolls.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-semibold">Nhân viên</th>
                <th className="p-4 text-right font-semibold">Lương cơ bản</th>
                <th className="p-4 text-center font-semibold">Ngày công (TT/QĐ)</th>
                <th className="p-4 text-right font-semibold">Phụ cấp</th>
                <th className="p-4 text-right font-semibold">Khấu trừ</th>
                <th className="p-4 text-right font-semibold text-primary">Thực nhận</th>
                <th className="p-4 text-center font-semibold w-40">Trạng thái</th>
                <th className="p-4 text-center font-semibold w-36">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedPayrolls.map(payroll => {
                const isSelected = selectedIds.includes(payroll.id);
                return (
                  <tr key={payroll.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-4 text-center">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(payroll.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{payroll.employeeName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{payroll.employeeCode} • {payroll.departmentName}</div>
                    </td>
                    <td className="p-4 text-right tabular-nums">{formatCurrency(payroll.basicSalary)}</td>
                    <td className="p-4 text-center text-gray-600">{payroll.actualDays} / {payroll.workDays}</td>
                    <td className="p-4 text-right text-green-600 tabular-nums">+{formatCurrency(payroll.totalAllowances || 0)}</td>
                    <td className="p-4 text-right text-red-600 tabular-nums">-{formatCurrency(payroll.totalDeductions || 0)}</td>
                    <td className="p-4 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(payroll.netSalary)}</td>
                    <td className="p-4 text-center">
                      <PayrollStatusBadge status={payroll.status} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {payroll.status === 'DRAFT' && (
                          <>
                            <button 
                              onClick={() => { setEditingPayroll(payroll); setIsEditOpen(true); }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa phiếu lương"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSubmitStatus(payroll.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Chốt lương"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {payroll.status === 'CALCULATED' && (
                          <Button size="sm" onClick={() => handleApproveStatus(payroll.id)} className="h-7 text-xs px-2">
                            Duyệt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {!isLoading && filteredPayrolls.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <Calendar className="w-6 h-6 text-gray-400" />
                      </div>
                      Không có bảng lương nào trong khoảng thời gian này.<br />
                      Nhấn <b>"Tạo bảng lương tháng"</b> để bắt đầu.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between bg-white px-6 py-3 border rounded-lg shadow-sm shrink-0">
          <div className="text-sm text-gray-500">
            Hiển thị <span className="font-medium">{startItem}</span>-{endItem} trong tổng số <span className="font-medium">{totalItems}</span> bản ghi
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center px-4 text-sm font-medium">
              Trang {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GeneratePayrollModal 
        isOpen={isGenerateOpen} 
        onClose={() => setIsGenerateOpen(false)} 
        onGenerate={handleGenerate} 
      />
      <BulkUpdateModal 
        isOpen={isBulkOpen} 
        onClose={() => setIsBulkOpen(false)} 
        selectedCount={selectedIds.length} 
        onConfirm={handleBulkUpdate} 
      />
      <EditPayrollModal 
        isOpen={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setEditingPayroll(null); }} 
        payroll={editingPayroll} 
        onUpdate={handleUpdate} 
      />
    </div>
  );
}
