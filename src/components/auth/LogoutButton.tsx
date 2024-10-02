import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import React from "react";

const LogoutButton: React.FC = ({
  navigateTo = "/",
}: {
  navigateTo?: string;
}) => {
  const handleLogout = async () => {
    await logout();
    window.location.href = navigateTo ?? "/";
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default LogoutButton;
