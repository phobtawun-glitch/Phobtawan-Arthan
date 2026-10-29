import { Navigate } from "react-router-dom";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const isAdminLoggedIn =
    localStorage.getItem("adminLoggedIn") === "true";

  console.log("===== ADMIN ROUTE =====");
  console.log("adminLoggedIn =", isAdminLoggedIn);

  if (!isAdminLoggedIn) {
    console.log("ไม่มี Admin → /admin-login");
    return <Navigate to="/admin-login" replace />;
  }

  console.log("มี Admin → เข้า Dashboard");

  return <>{children}</>;
};

export default AdminRoute;