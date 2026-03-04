import { Settings, Star, Package, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-5 pt-14">
        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    );
  }

  const name = profile?.name ?? "You";

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-end px-5 pt-14 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile hero */}
      <div className="flex flex-col items-center px-5 pb-8">
        <div className="relative mb-4">
          <Avatar className="w-24 h-24 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="text-muted-foreground text-sm mt-1">@{profile?.name?.toLowerCase().replace(/\s+/g, "") ?? "you"}</p>

        {/* Stats */}
        <div className="flex gap-8 mt-6">
          {[
            { icon: Package, label: "Listings", value: "0" },
            { icon: Star, label: "Rating", value: "—" },
            { icon: Heart, label: "Followers", value: "0" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </span>
            </div>
          ))}
        </div>

        <Button className="mt-6 w-full max-w-xs" variant="outline">
          Edit Profile
        </Button>
      </div>

      {/* Tabs placeholder */}
      <div className="flex border-b border-border px-5">
        {["Listings", "Sold", "Reviews"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center py-12 text-center px-8">
        <Badge variant="outline" className="mb-3">No listings yet</Badge>
        <p className="text-muted-foreground text-sm">Your items for sale will appear here.</p>
      </div>
    </div>
  );
}
