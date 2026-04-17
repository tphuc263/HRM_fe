import { useState } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { Button } from './button'
import { Textarea } from './textarea'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  message: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  minChars?: number
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Nhập nội dung...',
  confirmText = 'Gửi đi',
  cancelText = 'Hủy bỏ',
  minChars = 5
}: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (value.trim().length < minChars) {
      setError(`Vui lòng nhập tối thiểu ${minChars} ký tự`)
      return
    }
    onConfirm(value)
    setValue('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 mb-4 font-medium">{message}</p>
          
          <div className="space-y-3">
            <div className="relative">
              <MessageSquare className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (error) setError('')
                }}
                className="pl-9 min-h-[120px] rounded-xl border-slate-200 focus:ring-red-500"
              />
            </div>
            {error && <p className="text-xs font-bold text-red-500 animate-pulse">{error}</p>}
          </div>
          
          <div className="mt-8 flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className="rounded-xl px-8 bg-red-600 hover:bg-red-700 text-white"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
