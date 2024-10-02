import LogoutButton from "@/components/auth/LogoutButton";
import { useAuth } from "@/components/AuthProvider";
import { Link, Outlet } from "react-router-dom";

export default function HomeLayoutPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return <h1>Loading...</h1>;
  }
  if (!user) {
    console.log("Redirecting to login");
    window.location.href = "/auth/login";
    return (
      <div>
        <h1>Redirecting to login...</h1>
        <div>
          <h1>
            If this page is not redirected automatically{" "}
            <Link to={"/auth/login"}>click here</Link>
          </h1>
        </div>
      </div>
    );
  }
  console.log(user);
  return (
    <div>
      <div>
        {user.name} <LogoutButton /> <Link to={"/"}>Home</Link>
      </div>
      <Outlet />
    </div>
  );
}
