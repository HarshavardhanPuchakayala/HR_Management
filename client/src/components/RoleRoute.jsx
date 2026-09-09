import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated, but wrong role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;