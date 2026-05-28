import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { Loader2, Plus, Trash2 } from 'lucide-react';

interface GeneratePayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (month: number, year: number, workDays: number, defaultAllowances: Record<string, number>, defaultDeductions: Record<string, number>) => Promise<void>;
}

export default function GeneratePayrollModal({ isOpen, onClose, onGenerate }: GeneratePayrollModalProps) {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [workDays, setWorkDays] = useState(22);
  const [defaultAllowances, setDefaultAllowances] = useState<Array<{key: string, value: number}>>([]);
  const [defaultDeductions, setDefaultDeductions] = useState<Array<{key: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowancesMap: Record<string, number> = {};
    defaultAllowances.forEach(item => {
      if (item.key.trim()) allowancesMap[item.key.trim()] = item.value;
    });

    const deductionsMap: Record<string, number> = {};
    defaultDeductions.forEach(item => {
      if (item.key.trim()) deductionsMap[item.key.trim()] = item.value;
    });

    setIsLoading(true);
    try {
      await onGenerate(month, year, workDays, allowancesMap, deductionsMap);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo bảng lương tháng">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tháng</label>
            <Input 
              type="number" 
              min={1} max={12} 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))} 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Năm</label>
            <Input 
              type="number" 
              min={2000} 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))} 
              required 
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Số ngày công tiêu chuẩn</label>
          <Input 
            type="number" 
            step="0.5"
            min={1}
            value={workDays} 
            onChange={(e) => setWorkDays(Number(e.target.value))} 
            required 
          />
        </div>
        
        {/* Default Allowances */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Phụ cấp mặc định (Toàn công ty)</label>
            <Button size="sm" variant="outline" type="button" onClick={() => setDefaultAllowances([...defaultAllowances, {key: '', value: 0}])}>
              <Plus className="w-3 h-3 mr-1" /> Thêm phụ cấp
            </Button>
          </div>
          {defaultAllowances.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <Input 
                placeholder="Tên phụ cấp (Vd: Ăn trưa)" 
                value={item.key} 
                onChange={e => {
                  const newArr = [...defaultAllowances];
                  newArr[idx].key = e.target.value;
                  setDefaultAllowances(newArr);
                }} 
              />
              <Input 
                type="number" 
                placeholder="Số tiền" 
                value={item.value} 
                onChange={e => {
                  const newArr = [...defaultAllowances];
                  newArr[idx].value = Number(e.target.value);
                  setDefaultAllowances(newArr);
                }} 
              />
              <Button size="icon" variant="destructive" type="button" onClick={() => setDefaultAllowances(defaultAllowances.filter((_, i) => i !== idx))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Default Deductions */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Khấu trừ mặc định (Toàn công ty)</label>
            <Button size="sm" variant="outline" type="button" onClick={() => setDefaultDeductions([...defaultDeductions, {key: '', value: 0}])}>
              <Plus className="w-3 h-3 mr-1" /> Thêm khấu trừ
            </Button>
          </div>
          {defaultDeductions.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <Input 
                placeholder="Tên khấu trừ (Vd: BHXH)" 
                value={item.key} 
                onChange={e => {
                  const newArr = [...defaultDeductions];
                  newArr[idx].key = e.target.value;
                  setDefaultDeductions(newArr);
                }} 
              />
              <Input 
                type="number" 
                placeholder="Số tiền" 
                value={item.value} 
                onChange={e => {
                  const newArr = [...defaultDeductions];
                  newArr[idx].value = Number(e.target.value);
                  setDefaultDeductions(newArr);
                }} 
              />
              <Button size="icon" variant="destructive" type="button" onClick={() => setDefaultDeductions(defaultDeductions.filter((_, i) => i !== idx))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tạo bảng lương
          </Button>
        </div>
      </form>
    </Modal>
  );
}
