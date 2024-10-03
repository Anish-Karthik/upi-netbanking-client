import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  Repeat,
  Banknote as Bank,
  Menu,
  User2,
  LucideIcon,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Route {
  name: string;
  path: string;
  icon: LucideIcon;
}

const routes: Route[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Beneficiaries", path: "/beneficiaries", icon: Users },
  { name: "Accounts", path: "/accounts", icon: Bank },
  { name: "Transactions", path: "/transactions", icon: Repeat },
  { name: "Upi", path: "/upi", icon: FileText },
  { name: "Cards", path: "/cards", icon: CreditCard },
  { name: "Profile", path: "/profile", icon: User2 },
  { name: "Settings", path: "/settings", icon: Settings },
];
export const SideBar: React.FC<SideBarProps> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`bg-primary text-primary-foreground w-64 min-h-screen p-4 ${
        isOpen ? "block" : "hidden"
      } md:block`}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-2xl font-semibold">Dashboard</span>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      <div className="h-full bg-primary text-primary-foreground">
        <ScrollArea className="h-[calc(100vh-4rem)] pb-10">
          <nav className="space-y-2 px-2">
            {routes.map((route) => (
              <a
                key={route.path}
                href={route.path}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <route.icon className="h-5 w-5" />
                <span>{route.name}</span>
              </a>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
};
