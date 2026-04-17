import { useState, useEffect } from 'react';
import { Wallet, Calendar, AlertCircle } from 'lucide-react';
import { payrollApi } from '../../lib/api/payrollApi';
import type { PayrollResponse } from '../../types/payroll';
import PayrollStatusBadge from '../../components/payroll/PayrollStatusBadge';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function MyPayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lấy ID nhân viên từ tài khoản đang đăng nhập
    const currentEmployeeId = Number(localStorage.getItem('employeeId')) || 1; 

    const fetchMyPayrolls = async () => {
      try {
        const res = await payrollApi.getPayrollsByEmployee(currentEmployeeId);
        if (res.success) {
          // Chỉ hiển thị các phiếu lương đã được duyệt (APPROVED) cho nhân viên xem
          const visiblePayrolls = res.data.filter(p => p.status === 'APPROVED');
          setPayrolls(visiblePayrolls);
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử lương", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPayrolls();
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" /> Lương của tôi
            </h1>
            <p className="text-gray-500 mt-1">Lịch sử các phiếu lương đã được duyệt.</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center p-8 text-gray-500">Đang tải dữ liệu...</div>
        ) : payrolls.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có phiếu lương nào</h3>
            <p className="text-gray-500">Do chưa có bảng lương nào được duyệt trong thời gian làm việc của bạn.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {payrolls.map(payroll => (
              <div key={payroll.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Tháng {payroll.month}</h3>
                      <p className="text-xs text-gray-500">Ngày công: {payroll.actualDays} / {payroll.workDays}</p>
                    </div>
                  </div>
                  <PayrollStatusBadge status={payroll.status} />
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x-0 md:divide-x divide-y md:divide-y-0">
                    
                    {/* Phần Thu nhập */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Thu nhập</h4>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Lương cơ bản</span>
                        <span className="font-medium">{formatCurrency(payroll.basicSalary)}</span>
                      </div>
                      
                      {payroll.overtimePay > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Làm thêm giờ (OT)</span>
                          <span className="font-medium">{formatCurrency(payroll.overtimePay)}</span>
                        </div>
                      )}

                      {/* Liệt kê phụ cấp */}
                      {Object.entries(payroll.allowances || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {key}
                          </span>
                          <span className="text-green-600">{formatCurrency(value)}</span>
                        </div>
                      ))}

                    </div>

                    {/* Phần Khấu trừ */}
                    <div className="space-y-4 pt-4 md:pt-0 md:pl-8">
                      <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Khấu trừ</h4>
                      
                      {Object.keys(payroll.deductions || {}).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Không có giảm trừ</p>
                      ) : (
                        Object.entries(payroll.deductions || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                              {key}
                            </span>
                            <span className="text-red-500">-{formatCurrency(value)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Tổng kết */}
                  <div className="mt-8 pt-4 border-t flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Lương gộp: {formatCurrency(payroll.grossSalary)}</p>
                      <p className="text-sm text-gray-500">Tổng khấu trừ: -{formatCurrency(payroll.totalDeductions)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500 mb-1 tracking-wide uppercase">Thực nhận</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(payroll.netSalary)}</p>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
