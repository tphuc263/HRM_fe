import Sidebar from './Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
