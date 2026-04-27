import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, KeyRound, LogOut, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const initial = (profile?.display_name || user?.email || "?").charAt(0).toUpperCase();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/auth", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {initial}
          </div>
          <span className="hidden sm:block text-sm font-medium text-foreground max-w-[140px] truncate">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="w-4 h-4 mr-2" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <KeyRound className="w-4 h-4 mr-2" /> Change password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="w-4 h-4 mr-2" /> Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
