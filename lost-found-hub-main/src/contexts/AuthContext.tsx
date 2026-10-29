import React, {createContext, useContext, useState, useEffect, useCallback,} from 'react';
import axios from '@/connectAPI/axios';
import { getCurrentLocation } from '@/utils/getCurrentLocation';

interface User {
  id: string;
  name: string;
  email: string;
  gender: string;
  lineId?: string;
  avatar?: string;
  isAdmin: boolean;
}
interface Admin {
  Admin_ID: number;
  Admin_Name: string;
}
interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  timeLeft: number;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithLine: (idToken: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  signup: (name: string, email: string, gender: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  renewTime: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (!savedAdmin) {return null;}
    try {return JSON.parse(savedAdmin);
    } catch {localStorage.removeItem('admin');
      return null;
    }
  });
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const SESSION_SECONDS = 40 * 60;
  const saveSessionExpiry = (timestamp: number) => {
    localStorage.setItem('sessionExpiresAt', String(timestamp));
    setTimeLeft(Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)));
  };
  const convertMemberToUser = useCallback((memberData: any): User => {
    return {
      id: String(memberData.Member_ID ?? ''),
      name: `${memberData.First_Name ?? ''} ${
        memberData.Last_Name ?? ''
      }`.trim(),
      email: memberData.Email ?? '',
      gender: memberData.Sex ?? memberData.Gender ?? '',
      lineId: memberData.Line ?? memberData.line ?? undefined,
      avatar: memberData.Picture ?? memberData.Avatar ?? undefined,
      isAdmin: false,
    };
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const member = localStorage.getItem('member');
      const sequenceId = localStorage.getItem('loginSequenceId');
      if (!token || !member || !sequenceId) {
        setLoading(false);
        return;
      }
      try {
        const memberData = JSON.parse(member);
        const response = await axios.get(
          `/logins/session/${sequenceId}`
        );
        const loginSession = response.data.login;
        if (
          Number(loginSession.Member_ID) !==
          Number(memberData.Member_ID)
        ) {
          throw new Error('Login Session ไม่ตรงกับสมาชิก');
        }
        const expireAt = new Date(
          loginSession.Login_Expire_At
        ).getTime();
        const remainingSeconds = Math.max(
          0,
          Math.floor((expireAt - Date.now()) / 1000)
        );
        if (remainingSeconds <= 0) {
          throw new Error('Login Session หมดอายุ');
        }
        setUser(convertMemberToUser(memberData));
        localStorage.setItem('sessionExpiresAt', String(expireAt));
        setTimeLeft(remainingSeconds);
      } catch (error) {
        console.error('RESTORE SESSION ERROR:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('member');
        localStorage.removeItem('loginSequenceId');
        localStorage.removeItem('sessionExpiresAt');
        setUser(null);
        setTimeLeft(0);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const isAdmin = !!admin;
  const isLoggedIn = !!user || !!admin;
  console.log('AuthContext user =', user);
  console.log('AuthContext isLoggedIn =', isLoggedIn);

  useEffect(() => {
    if (!user || isAdmin) return;

    const updateCountdown = () => {
      const expiry = Number(localStorage.getItem('sessionExpiresAt'));
      if (Number.isFinite(expiry) && expiry > 0) {
        setTimeLeft(Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    window.addEventListener('focus', updateCountdown);
    document.addEventListener('visibilitychange', updateCountdown);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateCountdown);
      document.removeEventListener('visibilitychange', updateCountdown);
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (
      !isLoggedIn ||
      isAdmin ||
      timeLeft > 0
    ) {
      return;
    }

    const expireLogin = async () => {
      try {
        const sequenceId =
          localStorage.getItem(
            'loginSequenceId'
          );
        const member =
          localStorage.getItem('member');
        const memberData = member
          ? JSON.parse(member)
          : null;
        if (
          sequenceId &&
          memberData?.Member_ID
        ) {
          await axios.post(
            '/logins/logout',
            {
              Sequence_ID:
                Number(sequenceId),
              Member_ID:
                memberData.Member_ID,
            }
          );

          console.log(
            'SESSION EXPIRED → Not Connected'
          );
        }
      } catch (error) {
        console.error(
          'EXPIRE LOGIN ERROR:',
          error
        );
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('member');
        localStorage.removeItem(
          'loginSequenceId'
        );
        localStorage.removeItem('sessionExpiresAt');
        setUser(null);
        setTimeLeft(0);
      }
    };
    expireLogin();
  }, [
    timeLeft,
    isLoggedIn,
    isAdmin
  ]);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<boolean> => {
      try {
        console.log("===== EMAIL LOGIN START =====");

        // 1) ขอ Location ก่อนสร้าง Login History
        let location;
        try {
          console.log("STEP 1: ขอ Location");
          location = await getCurrentLocation();

          console.log("GPS SUCCESS:", {
            latitude: location.latitude,
            longitude: location.longitude,
          });
        } catch (gpsError: any) {
          console.error("GPS LOGIN ERROR:", gpsError);

          alert(
            gpsError?.message ||
              "กรุณาเปิดการอนุญาตตำแหน่งของเว็บไซต์ก่อนเข้าสู่ระบบ"
          );

          return false;
        }

        // 2) ตรวจ Email / Password
        console.log("STEP 2: POST /members/login");

        const response = await axios.post("/members/login", {
          email: email.trim(),
          password,
        });

        console.log("MEMBER LOGIN RESPONSE:", response.data);

        const { token, member } = response.data;

        if (!token || !member?.Member_ID) {
          console.error(
            "LOGIN ERROR: /members/login ไม่มี token หรือ member.Member_ID",
            response.data
          );

          return false;
        }

        // 3) บันทึก Login History ลงตาราง logins
        console.log("STEP 3: POST /logins");

        const loginResponse = await axios.post("/logins", {
          Member_ID: member.Member_ID,
          Format_Name: "Email",
          Login_Latitude: location.latitude,
          Login_Longitude: location.longitude,
        });

        console.log(
          "LOGIN HISTORY RESPONSE:",
          loginResponse.data
        );

        const sequenceId =
          loginResponse.data?.Sequence_ID;

        if (!sequenceId) {
          console.error(
            "LOGIN ERROR: ไม่พบ Sequence_ID จาก /logins",
            loginResponse.data
          );

          return false;
        }

        // 4) เก็บ session ของทั้ง JWT และ Login History
        localStorage.setItem(
          "loginSequenceId",
          String(sequenceId)
        );

        localStorage.setItem("token", token);

        localStorage.setItem(
          "member",
          JSON.stringify(member)
        );

        const userData =
          convertMemberToUser(member);

        setUser(userData);

        // ใช้เวลาจาก DB จริงหลังจาก Login สำเร็จ
        saveSessionExpiry(Date.now() + SESSION_SECONDS * 1000);

        console.log("EMAIL LOGIN SUCCESS:", userData);
        console.log(
          "LOGIN Sequence_ID =",
          sequenceId
        );

        return true;
      } catch (error: any) {
        console.error("EMAIL LOGIN ERROR:", error);
        console.error(
          "STATUS:",
          error?.response?.status
        );
        console.error(
          "DATA:",
          error?.response?.data
        );
        console.error(
          "MESSAGE:",
          error?.message
        );

        return false;
      }
    },
    [convertMemberToUser]
  );

  const loginWithLine = useCallback(
    async (idToken: string): Promise<boolean> => {
      try {console.log("===== LINE LOGIN START =====");
        if (!idToken) {console.error("ไม่มี LINE ID Token");
          return false;
        }
        // 1. ขอ GPS
        console.log("STEP 1: ขอ Location");
        let location;
        try {
          location =
            await getCurrentLocation();
          console.log("LINE GPS SUCCESS:", location);
        } catch (gpsError: any) {
          console.error("LINE GPS ERROR:", gpsError);
          alert(gpsError?.message ||"กรุณาอนุญาตการใช้ตำแหน่งก่อนเข้าสู่ระบบ");
          return false;
        }
        // 2. ส่ง ID Token + GPS ไป Backend
        console.log("STEP 2: POST /logins/line");
        const response =
          await axios.post("/logins/line",
            {
              idToken,
              Login_Latitude: location.latitude,
              Login_Longitude: location.longitude,
            }
          );
        console.log("LINE LOGIN RESPONSE:", response.data);
        const {token, member, login,} = response.data;
        // 3. ตรวจข้อมูลที่ Backend ส่งกลับ
        if (
          !token ||
          !member ||
          !member.Member_ID ||
          !login?.Sequence_ID
        ) {console.error("LINE LOGIN ERROR: Backend ส่งข้อมูลไม่ครบ", response.data);
          return false;
        }
        // 4. เก็บ Session
        localStorage.setItem("token", token);
        localStorage.setItem("member", JSON.stringify(member));
        localStorage.setItem("loginSequenceId", String(login.Sequence_ID));
        // 5. สร้าง User
        const userData = convertMemberToUser(member);
        setUser(userData);
        // 6. เริ่ม Session 40 นาที
        saveSessionExpiry(Date.now() + SESSION_SECONDS * 1000);
        console.log("LINE LOGIN SUCCESS:", userData);
        console.log("LINE Sequence_ID =", login.Sequence_ID);
        return true;
      } catch (error: any) {
        console.error("LINE LOGIN ERROR:", error);
        console.error("STATUS:", error?.response?.status);
        console.error("DATA:", error?.response?.data);
        console.error("MESSAGE:", error?.message);
        return false;
      }
    },
    [convertMemberToUser]
  );

  const adminLogin = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const response = await axios.post('/admins/login', {
          username: username.trim(),
          password,
        });

        console.log("ADMIN LOGIN RESPONSE:", response.data);

        if (!response.data?.success || !response.data?.admin) {
          return false;
        }

        const adminData = response.data.admin;

        // สำคัญ
        setAdmin(adminData);

        // เก็บไว้สำหรับ refresh
        localStorage.setItem("admin", JSON.stringify(adminData));

        // ถ้า Login Admin ต้องแยกจาก User
        setUser(null);

        console.log("ADMIN STATE SET:", adminData);

        return true;

      } catch (error: any) {
        console.error(
          "ADMIN LOGIN ERROR:",
          error?.response?.data || error?.message
        );

        return false;
      }
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      gender: string,
      password: string
    ): Promise<boolean> => {
      try {
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ') ?? '';
        const response = await axios.post('/members', {
          First_Name: firstName,
          Last_Name: lastName,
          Sex: gender,
          Email: email,
          Member_Password: password,
        });
        console.log('SIGNUP RESPONSE:', response.data);
        return true;
      } catch (error: any) {
        console.error('SIGNUP ERROR:', error);
        return false;
      }
    },
    []
  );

  const adminLogout = useCallback(() => {
    console.log('===== ADMIN LOGOUT =====');
    localStorage.removeItem("admin");
    setAdmin(null);
    console.log("ADMIN AFTER LOGOUT:", null);
  }, []);

  const logout = useCallback(async () => {
    try {
      const sequenceId =
        localStorage.getItem('loginSequenceId');
      const member =
        localStorage.getItem('member');
      const memberData = member
        ? JSON.parse(member)
        : null;
      if (
        sequenceId &&
        memberData?.Member_ID
      ) {
        await axios.post('/logins/logout', {
          Sequence_ID: Number(sequenceId),
          Member_ID: memberData.Member_ID,
        });
        console.log(
          'LOGOUT DB SUCCESS'
        );
      }
    } catch (error) {
      console.error(
        'LOGOUT API ERROR:',
        error
      );
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('member');
      localStorage.removeItem(
        'loginSequenceId'
      );
      localStorage.removeItem('sessionExpiresAt');
      setUser(null);
      setTimeLeft(0);
    }
  }, []);
  const renewTime = useCallback(async () => {
    try {
      const sequenceId =
        localStorage.getItem('loginSequenceId');
      const member =
        localStorage.getItem('member');
      const memberData = member
        ? JSON.parse(member)
        : null;
      if (
        !sequenceId ||
        !memberData?.Member_ID
      ) {
        console.error(
          'ไม่พบ Login Session'
        );
        return;
      }

      const response = await axios.post(
        '/logins/extend',
        {
          Sequence_ID: Number(sequenceId),
          Member_ID: memberData.Member_ID,
        }
      );
      console.log(
        'RENEW LOGIN SUCCESS:',
        response.data
      );
      saveSessionExpiry(Date.now() + SESSION_SECONDS * 1000);
    } catch (error) {
      console.error(
        'RENEW LOGIN ERROR:',
        error
      );
    }
  }, []);

  useEffect(() => {
    if (!user || isAdmin) {
      return;
    }
    const handleDisconnect = () => {
      const sequenceId =
        localStorage.getItem('loginSequenceId');
      const member =
        localStorage.getItem('member');
      if (!sequenceId || !member) {
        return;
      }
      try {
        const memberData = JSON.parse(member);
        const data = JSON.stringify({
          Sequence_ID: Number(sequenceId),
          Member_ID: memberData.Member_ID,
        });
        const blob = new Blob(
          [data],
          { type: 'application/json' }
        );
        navigator.sendBeacon(
          'https://loc-display-primary-die.trycloudflare.com/logins/disconnect',
          blob
        );
        console.log(
          'ส่ง Disconnect เมื่อปิดหน้าเว็บ'
        );
      } catch (error) {
        console.error(
          'DISCONNECT ERROR:',
          error
        );
      }
    };
    window.addEventListener(
      'pagehide',
      handleDisconnect
    );
    return () => {
      window.removeEventListener(
        'pagehide',
        handleDisconnect
      );
    };
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isLoggedIn,
        isAdmin,
        loading,
        timeLeft,
        login,
        loginWithLine,
        adminLogin,
        adminLogout,
        signup,
        logout,
        renewTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};