import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import React from "react";

const LogoutButton: React.FC = ({
  navigateTo = "/",
  className = "",
}: {
  navigateTo?: string;
  className?: string;
}) => {
  const handleLogout = async () => {
    await logout();
    window.location.href = navigateTo ?? "/";
  };

  return (
    <Button className={className} onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
