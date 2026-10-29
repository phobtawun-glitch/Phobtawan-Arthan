import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from '@/connectAPI/axios';
import { insertMembers } from "../connectAPI/callMember";

const OTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || 'your@email.com';
  const { toast } = useToast();
  const memberData = (location.state as any)?.memberData;

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join('');

    if (code.length < 6) {
      toast({
        title: 'กรุณากรอกรหัส OTP ให้ครบ',
        variant: 'destructive'
      });
      return;
    }

    try {

      const response = await axios.post(
        '/members/verify-otp',
        {
          email,
          otp: code
        }
      );

      if (response.data.success) {

        if (!memberData) {
          toast({
            title: 'ไม่พบข้อมูลการสมัครสมาชิก',
            variant: 'destructive'
          });
          return;
        }

        await insertMembers(memberData);

        toast({
          title: 'สมัครสมาชิกสำเร็จ!',
          description: 'กรุณาเข้าสู่ระบบเพื่อใช้งาน'
        });

        navigate('/login');

      } else {

        toast({
          title: 'OTP ไม่ถูกต้อง',
          description: 'กรุณาตรวจสอบรหัสอีกครั้ง',
          variant: 'destructive'
        });

      }

    } catch (err) {

      console.error(err);

      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถตรวจสอบ OTP ได้',
        variant: 'destructive'
      });

    }
  };

  const handleResend = async () => {
    try {

      await axios.post(
        '/members/send-otp',
        { email }
      );

      toast({
        title: 'ส่งรหัส OTP ใหม่แล้ว',
        description: `ส่งไปที่ ${email}`
      });

    } catch (err) {

      toast({
        title: 'ส่ง OTP ไม่สำเร็จ',
        variant: 'destructive'
      });

    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-lg shadow-card p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">ยืนยัน OTP</h1>
          <p className="text-sm text-muted-foreground mb-6">
            กรุณากรอกรหัส OTP ที่ส่งไปที่<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full mb-3">ยืนยัน</Button>

          <button onClick={handleResend} className="text-sm text-primary hover:underline font-medium">
            ส่งรหัส OTP อีกครั้ง
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTP;