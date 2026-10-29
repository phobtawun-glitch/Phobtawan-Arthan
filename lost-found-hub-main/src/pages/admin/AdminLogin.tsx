import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import axios from '@/connectAPI/axios';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isAdminMode = true;

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {e.preventDefault();
    try {
      console.log('===== ADMIN LOGIN FORM =====');
      console.log('Username:', email);
      const response = await axios.post('/admins/login', {
        username: email.trim(),
        password,
      });
      console.log('ADMIN LOGIN RESPONSE:', response.data);
      if (response.data?.success) {
        console.log('===== ADMIN LOGIN SUCCESS =====');
        localStorage.setItem('adminLoggedIn', 'true');
        if (response.data.admin) {
          localStorage.setItem(
            'admin',
            JSON.stringify(response.data.admin)
          );
        }

        navigate('/admin', { replace: true });
      } else {
        toast({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error(
        'ADMIN LOGIN FORM ERROR:',
        error?.response?.data || error
      );

      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
    }
  };

  const handleLineLogin = () => {
    navigate('/line-login');
  };

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
              {isAdminMode ? 'เข้าสู่ระบบ Admin' : 'เข้าสู่ระบบ'}
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              เข้าสู่ระบบเพื่อประกาศของหาย
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {isAdminMode ? 'Username' : 'Gmail'}{' '}
                <span className="text-urgent">*</span>
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <input
                  type={isAdminMode ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isAdminMode ? 'Username' : 'your@gmail.com'
                  }
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
            >
              เข้าสู่ระบบ
            </Button>
          </form>

          <Link
            to="/login"
            className="block w-full text-center text-xs text-muted-foreground mt-4 hover:text-primary"
          >
            ← กลับไปหน้า Login ปกติ
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;