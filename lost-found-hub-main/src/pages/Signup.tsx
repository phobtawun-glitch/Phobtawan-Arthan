import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import axios from '@/connectAPI/axios';

const Signup = () => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'กรุณากรอกชื่อ';
    if (!lastName.trim()) errs.lastName = 'กรุณากรอกนามสกุล';
    if (!email.trim()) errs.email = 'กรุณากรอกอีเมล';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!gender) errs.gender = 'กรุณาเลือกเพศ';
    if (!password) errs.password = 'กรุณากรอกรหัสผ่าน';
    else if (password.length < 6) errs.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (password !== confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("HANDLE SUBMIT CALLED");

    if (!validate()) {
      console.log("VALIDATION FAILED");

      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        variant: "destructive",
      });
      return;
    }

    console.log("BEFORE API CALL");

    try {
      const emailKey = email.trim().toLowerCase();

      console.log("1. SENDING OTP TO:", emailKey);

      const res = await axios.post("/members/send-otp", {
        email: emailKey,
      });

      console.log("2. SEND OTP RESPONSE:", res.data);

      if (res.data?.success !== true) {
        toast({
          title: "ส่ง OTP ไม่สำเร็จ",
          description: res.data?.message || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
        return;
      }

      console.log("3. NAVIGATING TO OTP PAGE");

      navigate("/otp", {
        state: {
          email: emailKey,
          memberData: {
            First_Name: name.trim(),
            Last_Name: lastName.trim(),
            Sex: gender,
            Email: emailKey,
            Member_Password: password,
          },
        },
      });
    } catch (error: any) {
      console.error("SEND OTP ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);

      toast({
        title: "สมัครสมาชิกไม่สำเร็จ",
        description:
          error.response?.data?.message || "ไม่สามารถส่ง OTP ได้",
        variant: "destructive",
      });
    }
  };

  const handleLineLogin = () => {
    navigate('/line-login');
  };

  const inputClass = (field: string) =>
    `w-full pl-4 pr-4 h-11 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
      errors[field] ? 'border-urgent' : 'border-input'
    } bg-background`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>

        <div className="bg-card rounded-xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">สมัครสมาชิก</h1>
            <p className="text-sm text-muted-foreground mt-2">สร้างบัญชีเพื่อเริ่มประกาศของหาย</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                ชื่อ <span className="text-urgent">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ" className={`${inputClass('name')} !pl-10`} />
              </div>
              {errors.name && <p className="text-xs text-urgent mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                นามสกุล <span className="text-urgent">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  placeholder="นามสกุลของคุณ" className={`${inputClass('lastName')} !pl-10`} />
              </div>
              {errors.lastName && <p className="text-xs text-urgent mt-1">{errors.lastName}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                เพศ <span className="text-urgent">*</span>
              </label>
              <div className="flex gap-4">
                {['ชาย', 'หญิง'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="gender" value={g} checked={gender === g}
                      onChange={() => setGender(g)} className="w-4 h-4 accent-primary" />
                    {g}
                  </label>
                ))}
              </div>
              {errors.gender && <p className="text-xs text-urgent mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                อีเมล <span className="text-urgent">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลของคุณ" className={`${inputClass('email')} !pl-10`} />
              </div>
              {errors.email && <p className="text-xs text-urgent mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                รหัสผ่าน <span className="text-urgent">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className={`${inputClass('password')} !pl-10 !pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-urgent mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                ยืนยันรหัสผ่าน <span className="text-urgent">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className={`${inputClass('confirmPassword')} !pl-10 !pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-urgent mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full h-11">สมัครสมาชิก</Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-3 text-sm text-muted-foreground">หรือ</span></div>
          </div>

          <Button variant="outline" className="w-full h-11" onClick={handleLineLogin}>
            เข้าสู่ระบบด้วย LINE
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="text-foreground hover:underline font-semibold">เข้าสู่ระบบ</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Signup;