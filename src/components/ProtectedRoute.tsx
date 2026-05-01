import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    const loginPath = location.pathname === "/admin" || location.pathname.startsWith("/app/admin")
      ? "/admin-login"
      : "/auth";
    return <Navigate to={`${loginPath}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
