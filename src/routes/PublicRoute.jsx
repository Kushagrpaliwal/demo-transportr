import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = Cookies.get("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
