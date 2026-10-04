import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/use-session";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-sm text-bone-dim" role="status">
        Checking your session…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

export default ProtectedRoute;
