import { useState } from 'react'
import { LayoutGrid, Users, ChevronDown, ChevronRight, Clock, PanelLeftClose } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const mainNavItems = [
  { to: '/', label: 'Trang chủ', icon: LayoutGrid },
  { to: '/employees', label: 'Danh sách nhân viên', icon: Users },
]

const attendanceMenu = {
  label: 'Quản lý chấm công',
  icon: Clock,
  children: [
    { to: '/attendance/daily', label: 'Công ngày' },
    { to: '/attendance/monthly', label: 'Công tháng' },
    { to: '/attendance/overtime', label: 'Đăng ký tăng ca' },
  ],
}

export default function Sidebar() {
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(
    attendanceMenu.children.some((c) => location.pathname.startsWith(c.to))
  )

  const isActive = (to: string) => location.pathname === to
  const isParentActive = () =>
    attendanceMenu.children.some((c) => location.pathname.startsWith(c.to))

  return (
    <aside className="w-64 border-r flex flex-col shrink-0">
      <div className="h-12 bg-[#3d6b59] flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            T
          </div>
          <span className="text-white font-medium">HRM System</span>
        </Link>
        <button className="text-white/80 hover:text-white">
          <PanelLeftClose className="h-4 w-4" />
        </button>
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

        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
              isParentActive()
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <attendanceMenu.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{attendanceMenu.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="ml-4 border-l border-border">
              {attendanceMenu.children.map(({ to, label }) => (
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
      </nav>
    </aside>
  )
}
