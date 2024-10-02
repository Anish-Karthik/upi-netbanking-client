import { useAuth } from "@/components/AuthProvider";
import { Outlet, useNavigate } from "react-router-dom";

const AuthLayout = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  if (user) {
    navigate("/dashboard");
  }
  return <Outlet />;
};

export default AuthLayout;
