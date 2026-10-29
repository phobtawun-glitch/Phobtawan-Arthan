import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import liff from '@line/liff';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, loginWithLine } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('===== LOGIN FORM SUBMIT =====');
    console.log('Email =', email);

    setIsLoggingIn(true);

    try {
      console.log('EMAIL LOGIN → AuthContext.login()');

      const success = await login(
        email,
        password
      );

      console.log(
        'AuthContext.login() RESULT =',
        success
      );

      if (success) {
        console.log('EMAIL LOGIN SUCCESS');

        navigate('/');
      } else {
        console.log('EMAIL LOGIN FAILED');

        setIsLoggingIn(false);

        toast({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(
        'LOGIN FORM ERROR =',
        error
      );

      setIsLoggingIn(false);

      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    }
  };

  const handleLineLogin = async () => {
    try {
      const liffId = import.meta.env.VITE_LINE_LIFF_ID;

      if (!liffId) {
        throw new Error('ไม่พบ VITE_LINE_LIFF_ID');
      }

      console.log('===== START LINE LOGIN =====');

      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      });

      console.log('LIFF INIT SUCCESS');
      console.log('LIFF IN CLIENT:', liff.isInClient());
      console.log('LIFF LOGGED IN:', liff.isLoggedIn());

      // ==========================================
      // ยังไม่ได้ Login LINE
      // ==========================================
      if (!liff.isLoggedIn()) {
        console.log('ยังไม่ได้ Login LINE → เปิด LINE Login');

        liff.login({
          redirectUri: window.location.origin,
        });

        return;
      }

      // ==========================================
      // Login LINE อยู่แล้ว
      // ==========================================
      console.log('LINE Login อยู่แล้ว');

      const idToken = liff.getIDToken();

      console.log('ID TOKEN EXISTS:', !!idToken);

      if (!idToken) {
        console.error('ไม่พบ LINE ID Token');

        // ถ้า session มีปัญหา ให้ logout แล้ว login ใหม่
        liff.logout();

        liff.login({
          redirectUri: window.location.origin,
        });

        return;
      }

      console.log('ได้รับ LINE ID Token แล้ว');

      // ==========================================
      // ส่ง ID Token เข้า AuthContext
      // ==========================================
      const success = await loginWithLine(idToken);
      if (success) {
        console.log('===== LINE LOGIN SUCCESS =====');
      } else {
        console.log('LINE TOKEN อาจหมดอายุ → LOGIN ใหม่');
        liff.logout();
        liff.login({
          redirectUri: window.location.origin,
        });
      }

    } catch (error: any) {
      console.error('LINE LOGIN ERROR:', error);

      toast({
        title: 'เข้าสู่ระบบ LINE ไม่สำเร็จ',
        description:
          error?.message ||
          'เกิดข้อผิดพลาดในการเข้าสู่ระบบ LINE',
        variant: 'destructive',
      });
    }
  };

  // ================================
  // หน้ารอหลังจากกด Login
  // ================================
  if (isLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-md">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>

        <div className="bg-card rounded-xl border border-border p-8">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              เข้าสู่ระบบ
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              เข้าสู่ระบบเพื่อประกาศของหาย
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Gmail <span className="text-urgent">*</span>
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@gmail.com"
                  className="w-full pl-10 pr-4 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                รหัสผ่าน <span className="text-urgent">*</span>
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoggingIn}
            >
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-sm text-muted-foreground">
                หรือ
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleLineLogin}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ยังไม่มีบัญชี?{' '}
            <Link
              to="/signup"
              className="text-primary hover:underline font-semibold"
            >
              สมัครสมาชิก
            </Link>
          </p>

          {/* ปุ่มไปหน้า Admin Login */}
          <Link
            to="/admin-login"
            className="block w-full text-center text-xs text-muted-foreground mt-4 hover:text-primary"
          >
            เข้าสู่ระบบสำหรับ Admin
          </Link>

        </div>
      </main>
    </div>
  );
};

export default Login;