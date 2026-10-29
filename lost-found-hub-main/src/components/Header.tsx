import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Timer, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/logo1.png';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,} from '@/components/ui/alert-dialog';

const Header = () => {
  const {
    user,
    timeLeft,
    renewTime,
    logout,
  } = useAuth();

  const isUserLoggedIn = !!user;

  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  console.log('===== HEADER =====');
  console.log('Header user =', user);
  console.log('Header isUserLoggedIn =', isUserLoggedIn);
  console.log('Header pathname =', location.pathname);

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;

    return `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const navItems = [
    {
      label: 'หน้าหลัก',
      path: '/',
      show: true,
    },
    {
      label: 'โพสต์ของฉัน',
      path: '/my-posts',
      show: isUserLoggedIn,
    },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);

    console.log('===== USER LOGOUT FROM HEADER =====');

    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logoImg}
              alt="โลโก้"
              className="w-12 h-18"
            />
            <span className="font-bold text-foreground">
              {' '}Lost and Found
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* =========================
              RIGHT SIDE
          ========================= */}
          <div className="flex items-center gap-2">

            {isUserLoggedIn && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />

                <span className="font-mono">
                  {formatTime(timeLeft)}
                </span>

                <button
                  onClick={renewTime}
                  className="text-primary hover:underline text-xs font-medium ml-1"
                >
                  ต่อเวลา
                </button>
              </div>
            )}

            {isUserLoggedIn ? (
              <div className="flex items-center gap-2">

                <button
                  onClick={() => navigate('/account-info')}
                  className="flex items-center gap-2 hover:bg-secondary px-2 py-1.5 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>

                  <span className="text-sm font-medium hidden sm:block">
                    {user?.name}
                  </span>
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>

              </div>
            ) : (
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => navigate('/login')}
              >
                เข้าสู่ระบบ
              </Button>
            )}

          </div>
        </div>
      </header>

      <AlertDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ออกจากระบบ
            </AlertDialogTitle>

            <AlertDialogDescription>
              คุณต้องการออกจากระบบหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              ยกเลิก
            </AlertDialogCancel>

            <AlertDialogAction onClick={confirmLogout}>
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Header;