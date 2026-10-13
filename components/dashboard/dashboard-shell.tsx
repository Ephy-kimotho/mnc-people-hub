import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Sidebar + header frame shared by the dashboard pages and the signed-in 404
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    // `open` pins the sidebar on desktop; mobile uses its own drawer state
    <SidebarProvider open>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 px-4 py-6 md:px-8 md:py-10 lg:px-12">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
