import { Outlet } from "react-router-dom";

export default function AuthenticationPage() {
  return (
    <div>
      <div className="fixed z-50 bg-red-400 top-0">Auth</div>
      <Outlet />
    </div>
  );
}
