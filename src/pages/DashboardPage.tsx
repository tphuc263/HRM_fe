import { LayoutGrid, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Trang chủ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/employees"
          className="flex items-center gap-4 p-6 border rounded-lg hover:bg-accent transition-colors"
        >
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
          </div>
        </Link>
        <div className="flex items-center gap-4 p-6 border rounded-lg opacity-50">
          <div className="p-3 bg-muted rounded-lg">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
