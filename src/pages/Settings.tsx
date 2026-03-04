import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Shield, HelpCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SETTINGS_GROUPS = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Edit Profile", to: "/profile" },
      { icon: Bell, label: "Notifications", to: null },
    ],
  },
  {
    title: "Privacy & Safety",
    items: [
      { icon: Shield, label: "Blocked Users", to: "/settings/blocked" },
      { icon: Ban, label: "Report History", to: "/settings/reports" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help & FAQ", to: "/help" },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="px-5 flex flex-col gap-6 pb-8">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">{group.title}</p>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map(({ icon: Icon, label, to }, i) => (
                <div key={label}>
                  {i > 0 && <Separator />}
                  <button
                    onClick={() => to && navigate(to)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-accent transition-colors"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">{label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button variant="destructive" className="w-full mt-2" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
