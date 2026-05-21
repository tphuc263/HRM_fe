import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const success = (msg: string) => showToast('success', msg)
  const error = (msg: string) => showToast('error', msg)
  const info = (msg: string) => showToast('info', msg)
  const warning = (msg: string) => showToast('warning', msg)

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border
              animate-in slide-in-from-right-10 fade-in duration-300 transform transition-all
              ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-100 text-red-700' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-100 text-blue-700' : ''}
              ${toast.type === 'warning' ? 'bg-white border-yellow-100 text-yellow-700' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            {toast.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
            
            <span className="font-semibold text-sm">{toast.message}</span>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
