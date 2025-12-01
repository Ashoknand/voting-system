import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ roles, element }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default PrivateRoute;

