import { useAuth } from '@/components/AuthProvider'
import { SideBar } from '@/components/SideBar'
import { TopBar } from '@/components/TopBar'
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

export default function HomePageLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) {
    window.location.href = '/auth/login'
    return null
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SideBar isOpen={true} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}