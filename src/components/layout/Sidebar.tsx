import { useState } from 'react'
import { LayoutGrid, Users, ChevronDown, ChevronRight, Clock, FileText, LogOut, Wallet, Settings, Sun, Moon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/useAuth'
import { useTheme } from '../../context/ThemeContext'

const adminMainNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/employees', label: 'Danh sách nhân viên', icon: Users },
  { to: '/admin/payroll/manage', label: 'Quản lý phiếu lương', icon: Wallet },
]

function getEmployeeMainNavItems(userId: number) {
  const base = `/employees/${userId}`
  return [
    { to: `${base}/attendance/daily`, label: 'Chấm công', icon: LayoutGrid },
    { to: `${base}/attendance/overtime`, label: 'Đăng ký tăng ca', icon: Clock },
    { to: `${base}/attendance/leave-request`, label: 'Đơn xin nghỉ', icon: FileText },
    { to: `${base}/payroll/my-salary`, label: 'Lương của tôi', icon: Wallet },
  ]
}

function getAttendanceMenu() {
  return {
    label: 'Quản lý chấm công',
    icon: Clock,
    children: [
      { to: '/admin/attendance/daily', label: 'Công ngày' },
      { to: '/admin/attendance/monthly', label: 'Công tháng' },
      { to: '/admin/attendance/overtime', label: 'Đăng ký tăng ca' },
    ],
  }
}

const leaveMenu = {
  label: 'Quản lý đơn xin nghỉ',
  icon: FileText,
  children: [
    { to: '/admin/attendance/leave-request', label: 'Đơn xin nghỉ' },
    { to: '/admin/attendance/absence', label: 'Quản lý vắng' },
  ],
}

const settingsMenu = {
  label: 'Cấu hình hệ thống',
  icon: Settings,
  children: [
    { to: '/admin/departments', label: 'Phòng ban' },
    { to: '/admin/leave-types', label: 'Loại phép' },
    { to: '/admin/shifts', label: 'Ca làm việc' },
    { to: '/admin/holidays', label: 'Ngày nghỉ lễ' },
  ],
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isAdmin = user?.role === 'ADMIN'
  const userId = user?.userId
  const mainNavItems = isAdmin ? adminMainNavItems : getEmployeeMainNavItems(userId || 0)
  const allMenus = [getAttendanceMenu(), leaveMenu, settingsMenu]
  const visibleMenus = allMenus
    .map((menu) => ({
      ...menu,
      children: menu.children.filter((child) => {
        if (!isAdmin) {
          if (child.to.includes('/admin/')) return false
        }
        return true
      }),
    }))
    .filter((menu) => menu.children.length > 0)

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    visibleMenus.forEach(m => { initial[m.label] = m.children.some(c => location.pathname.startsWith(c.to)) })
    return initial
  })

  const isActive = (to: string) => {
    if (to === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname === to
  }
  const isParentActive = (menu: ReturnType<typeof getAttendanceMenu>) => menu.children.some(c => location.pathname.startsWith(c.to))
  const toggleMenu = (label: string) => setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-64 border-r flex flex-col shrink-0">
      <div className="h-12 bg-[#3d6b59] flex items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            T
          </div>
          <span className="text-white font-medium">HRM System</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
              isActive(to)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {visibleMenus.map(menu => (
          <div key={menu.label}>
            <button
              onClick={() => toggleMenu(menu.label)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
                isParentActive(menu)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <menu.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{menu.label}</span>
              {expandedMenus[menu.label] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedMenus[menu.label] && (
              <div className="ml-4 border-l border-border">
                {menu.children.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-3 pl-4 pr-4 py-2 text-sm transition-colors border-l-2',
                      isActive(to)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t p-3 space-y-3">
        <div className="flex items-center justify-between p-2 bg-muted/40 dark:bg-black rounded-xl border border-slate-200 dark:border-white">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 select-none">
            {theme === 'light' ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <button
            onClick={toggleTheme}
            type="button"
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200 border-slate-300 dark:bg-black dark:border-white"
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                theme === 'light' ? "translate-x-0" : "translate-x-5"
              )}
            />
          </button>
        </div>

        <div className="px-1 text-xs text-muted-foreground">
          {user?.employeeName || user?.username}
          {/* <span className="block uppercase tracking-wide">{user?.role}</span> */}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
