import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate,} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import liff from "@line/liff";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OTP from "./pages/OTP";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import MyPosts from "./pages/MyPosts";
import AccountInfo from "./pages/AccountInfo";
import AdminRoute from "./components/AdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminReports from "./pages/admin/AdminReports";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminSuspended from "./pages/admin/AdminSuspended";
import AdminSuspendedMembers from "./pages/admin/AdminSuspendedMembers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LineInitializer = () => {
  const { loginWithLine } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initLine = async () => {
      try {const liffId = import.meta.env.VITE_LINE_LIFF_ID;
        if (!liffId) {console.error("ไม่พบ VITE_LINE_LIFF_ID");
          setReady(true);
          return;
        }
        console.log("===== LIFF INITIALIZE =====");
        console.log("URL BEFORE INIT:", window.location.href);
        await liff.init({liffId,});
        console.log("===== LIFF INIT SUCCESS =====");
        console.log("URL AFTER INIT:", window.location.href);
        console.log("LIFF LOGGED IN:", liff.isLoggedIn());
        const params = new URLSearchParams(window.location.search);
        const hasLineCallback =
          params.has("code") ||
          params.has("liff.state") ||
          params.has("liffClientId");

        if (hasLineCallback && liff.isLoggedIn()
        ) {
          console.log("===== LINE CALLBACK =====");
          const idToken = liff.getIDToken();
          console.log("LINE ID TOKEN:", idToken ? "ได้รับ ID Token แล้ว" : "ไม่มี ID Token");

          if (!idToken) {
            console.error("ไม่พบ LINE ID Token");
            console.error("กรุณาตรวจสอบ LIFF Scope ว่ามี openid");
            setReady(true);
            return;
          }

          console.log("ได้รับ LINE ID Token แล้ว");
          console.log("กำลัง loginWithLine()...");
          const success = await loginWithLine(idToken);
          console.log("loginWithLine RESULT:", success);
          if (success) {console.log( "===== LINE LOGIN SUCCESS =====");}
        }
      } catch (error) {
        console.error(
          "===== LIFF INIT ERROR =====",
          error
        );
      } finally {
        setReady(true);
      }
    };
    initLine();
  }, [loginWithLine]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </p>
      </div>
    );
  }

  return null;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/signup" element={<Signup />}/>
        <Route path="/otp" element={<OTP />}/>
        <Route path="/post/:id" element={<PostDetail />}/>
        <Route path="/create-post" element={<CreatePost />}/>
        <Route path="/my-posts" element={<MyPosts />}/>
        <Route path="/account-info" element={<AccountInfo />}/>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}/>
        <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>}/>
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>}/>
        <Route path="/admin/suspended" element={<AdminRoute><AdminSuspended /></AdminRoute>}/>
        <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>}/>
        <Route path="/admin/suspended-members" element={<AdminRoute><AdminSuspendedMembers /></AdminRoute>} />
        <Route path="*" element={<NotFound />}/>
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <LineInitializer />
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;