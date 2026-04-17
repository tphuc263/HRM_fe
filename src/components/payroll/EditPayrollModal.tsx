/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { PayrollResponse, PayrollUpdateRequest } from '../../types/payroll';
import { Plus, Trash2 } from 'lucide-react';

interface EditPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: PayrollResponse | null;
  onUpdate: (id: number, data: PayrollUpdateRequest) => void;
}

export default function EditPayrollModal({ isOpen, onClose, payroll, onUpdate }: EditPayrollModalProps) {
  const [workDays, setWorkDays] = useState<number>(0);
  const [actualDays, setActualDays] = useState<number>(0);
  const [overtimePay, setOvertimePay] = useState<number>(0);
  const [allowances, setAllowances] = useState<Array<{key: string, value: number}>>([]);
  const [deductions, setDeductions] = useState<Array<{key: string, value: number}>>([]);

  useEffect(() => {
    if (payroll) {
      setWorkDays(payroll.workDays || 0);
      setActualDays(payroll.actualDays || 0);
      setOvertimePay(payroll.overtimePay || 0);
      
      setAllowances(
        Object.entries(payroll.allowances || {}).map(([key, value]) => ({ key, value }))
      );
      
      setDeductions(
        Object.entries(payroll.deductions || {}).map(([key, value]) => ({ key, value }))
      );
    }
  }, [payroll]);

  if (!payroll) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allowancesMap: Record<string, number> = {};
    allowances.forEach(item => {
      if (item.key.trim()) allowancesMap[item.key.trim()] = item.value;
    });

    const deductionsMap: Record<string, number> = {};
    deductions.forEach(item => {
      if (item.key.trim()) deductionsMap[item.key.trim()] = item.value;
    });

    onUpdate(payroll.id, {
      workDays,
      actualDays,
      overtimePay,
      allowances: allowancesMap,
      deductions: deductionsMap
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Sửa phiếu lương - ${payroll.employeeName}`}>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ngày công quy định</label>
            <Input 
              type="number" step="0.5" 
              value={workDays} 
              onChange={e => setWorkDays(Number(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ngày công thực tế</label>
            <Input 
              type="number" step="0.5" 
              value={actualDays} 
              onChange={e => setActualDays(Number(e.target.value))} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tiền làm thêm giờ (OT)</label>
          <Input 
            type="number" 
            value={overtimePay} 
            onChange={e => setOvertimePay(Number(e.target.value))} 
          />
        </div>

        {/* Allowances Section */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Phụ cấp</label>
            <Button size="sm" variant="outline" type="button" onClick={() => setAllowances([...allowances, {key: '', value: 0}])}>
              <Plus className="w-3 h-3 mr-1" /> Thêm khoản
            </Button>
          </div>
          {allowances.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <Input 
                placeholder="Tên phụ cấp" 
                value={item.key} 
                onChange={e => {
                  const newArr = [...allowances];
                  newArr[idx].key = e.target.value;
                  setAllowances(newArr);
                }} 
              />
              <Input 
                type="number" 
                placeholder="Số tiền" 
                value={item.value} 
                onChange={e => {
                  const newArr = [...allowances];
                  newArr[idx].value = Number(e.target.value);
                  setAllowances(newArr);
                }} 
              />
              <Button size="icon" variant="destructive" type="button" onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Deductions Section */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Khấu trừ</label>
            <Button size="sm" variant="outline" type="button" onClick={() => setDeductions([...deductions, {key: '', value: 0}])}>
              <Plus className="w-3 h-3 mr-1" /> Thêm khoản
            </Button>
          </div>
          {deductions.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <Input 
                placeholder="Tên khấu trừ" 
                value={item.key} 
                onChange={e => {
                  const newArr = [...deductions];
                  newArr[idx].key = e.target.value;
                  setDeductions(newArr);
                }} 
              />
              <Input 
                type="number" 
                placeholder="Số tiền" 
                value={item.value} 
                onChange={e => {
                  const newArr = [...deductions];
                  newArr[idx].value = Number(e.target.value);
                  setDeductions(newArr);
                }} 
              />
              <Button size="icon" variant="destructive" type="button" onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit">Cập nhật phiếu lương</Button>
        </div>
      </form>
    </Modal>
  );
}
