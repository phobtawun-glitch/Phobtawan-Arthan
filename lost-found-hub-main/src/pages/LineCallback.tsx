import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff';
import { useAuth } from '@/contexts/AuthContext';

const LineCallback = () => {
  const navigate = useNavigate();
  const { loginWithLine } = useAuth();
  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('===== LINE CALLBACK =====');
        const liffId =
          import.meta.env.VITE_LINE_LIFF_ID;
        if (!liffId) {
          throw new Error(
            'ไม่พบ VITE_LINE_LIFF_ID'
          );
        }
        console.log(
          'LIFF ID:',
          liffId
        );
        await liff.init({
          liffId,
        });
        console.log(
          'LIFF INIT SUCCESS'
        );
        console.log(
          'LIFF LOGGED IN:',
          liff.isLoggedIn()
        );
        if (!liff.isLoggedIn()) {
          console.error(
            'LINE ยังไม่ได้ Login'
          );
          navigate('/login');
          return;
        }
        const idToken =
          liff.getIDToken();
        console.log(
          'LINE ID TOKEN:',
          idToken
        );
        if (!idToken) {
          throw new Error(
            'ไม่พบ LINE ID Token'
          );
        }
        console.log(
          'กำลังส่ง LINE ID Token ไป Backend'
        );
        const success =
          await loginWithLine(idToken);
        console.log(
          'loginWithLine RESULT:',
          success
        );
        if (!success) {
          throw new Error(
            'LINE Login ไม่สำเร็จ'
          );
        }
        console.log(
          '===== LINE LOGIN SUCCESS ====='
        );
        navigate('/');
      } catch (error) {
        console.error(
          'LINE CALLBACK ERROR:',
          error
        );
        navigate('/login');
      }
    };
    handleCallback();
  }, [loginWithLine, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>
        กำลังเข้าสู่ระบบด้วย LINE...
      </p>
    </div>
  );
};

export default LineCallback;