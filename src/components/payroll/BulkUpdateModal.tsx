import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (allowances: Record<string, number>, deductions: Record<string, number>) => void;
}

export default function BulkUpdateModal({ isOpen, onClose, selectedCount, onConfirm }: BulkUpdateModalProps) {
  const [allowances, setAllowances] = useState<Array<{key: string, value: number}>>([]);
  const [deductions, setDeductions] = useState<Array<{key: string, value: number}>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allowancesMap: Record<string, number> = {};
    allowances.forEach(item => {
      if (item.key.trim()) allowancesMap[item.key.trim()] = item.value;
    });

    const deductionsMap: Record<string, number> = {};
    deductions.forEach(item => {
      if (item.key.trim()) deductionsMap[item.key.trim()] = item.value;
    });

    onConfirm(allowancesMap, deductionsMap);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cập nhật hàng loạt (${selectedCount} phiếu lương)`}>
      <div className="mb-4 text-sm text-gray-500 bg-blue-50 p-3 rounded">
        Các khoản phụ cấp / khấu trừ dưới đây sẽ được <strong>thêm/hợp nhất</strong> vào phiếu lương của {selectedCount} nhân viên đã chọn.
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Allowances Section */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Thêm Phụ cấp</label>
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
          {allowances.length === 0 && <p className="text-xs text-gray-400 italic">Không thêm phụ cấp</p>}
        </div>

        {/* Deductions Section */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Thêm Khấu trừ</label>
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
          {deductions.length === 0 && <p className="text-xs text-gray-400 italic">Không thêm khấu trừ</p>}
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit">Áp dụng</Button>
        </div>
      </form>
    </Modal>
  );
}
