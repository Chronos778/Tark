import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("legalai_auth") === "true";
    
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const isAuthenticated = localStorage.getItem("legalai_auth") === "true";
  
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
