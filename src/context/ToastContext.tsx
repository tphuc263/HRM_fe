import { createContext, useContext, type ReactNode } from 'react'
import { ToastContainer, toast, type ToastOptions } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (type: ToastType, message: string) => {
    const options: ToastOptions = {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'light',
    }

    switch (type) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        toast.error(message, options)
        break
      case 'info':
        toast.info(message, options)
        break
      case 'warning':
        toast.warn(message, options)
        break
      default:
        toast(message, options)
    }
  }

  const success = (msg: string) => showToast('success', msg)
  const error = (msg: string) => showToast('error', msg)
  const info = (msg: string) => showToast('info', msg)
  const warning = (msg: string) => showToast('warning', msg)

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer />
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

