import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import ProtectedRoute from './ProtectedRoute';

const AdminLayout = () => {
  return (
    <ProtectedRoute requireStaff>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <SidebarInset className="flex-1">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger className="-ml-2" />
              <div className="flex-1" />
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default AdminLayout;
