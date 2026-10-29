import { useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Flag, Users, LogOut, Menu, X, XCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (localStorage.getItem("adminLoggedIn") !== "true") {
    return <Navigate to="/admin-login" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { path: '/admin/posts', label: 'โพสต์', icon: FileText },
    { path: '/admin/reports', label: 'รายงาน', icon: Flag },
    { path: '/admin/suspended', label: 'โพสต์ที่ถูกระงับ', icon: XCircle },
    { path: '/admin/members', label: 'สมาชิก', icon: Users },
    { path: '/admin/suspended-members', label: 'สมาชิกที่ถูกระงับ', icon: UserX },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();

    localStorage.removeItem("admin");
    localStorage.removeItem("adminLoggedIn");

    setShowLogoutConfirm(false);
    navigate("/");
  };

  return (
    <>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-60 h-screen sticky top-0 flex-col bg-card border-r border-border">
          <div className="p-4 border-b border-border">
            <Link to="/admin" className="text-lg font-semibold text-foreground">Lost and Found</Link>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" onClick={handleLogout}
              className="flex items-center justify-start gap-3 px-3 py-2.5 text-sm font-medium text-foreground w-full">
              <LogOut className="w-4 h-4" /> ออกจากระบบ
            </Button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-60 bg-card animate-slide-up flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <span className="font-semibold text-foreground">FindIt Admin</span>
                <Button variant="ghost" size="icon" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></Button>
              </div>
              <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
                {navItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path) ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                    }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-3 border-t border-border">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-foreground">
                  <LogOut className="w-4 h-4" /> ออกจากระบบ
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="md:hidden border-b border-border bg-card p-3">
            <Button variant="ghost" size="icon" aria-label="เปิดเมนู" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ออกจากระบบ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการออกจากระบบหรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminLayout;