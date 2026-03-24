import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pages
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Index from "@/pages/Index";
import Search from "@/pages/Search";
import Wishlist from "@/pages/Wishlist";
import Messages from "@/pages/Messages";
import ChatThread from "@/pages/ChatThread";
import Profile from "@/pages/Profile";
import SellerProfile from "@/pages/SellerProfile";
import Settings from "@/pages/Settings";
import ListingDetail from "@/pages/ListingDetail";
import CreateListing from "@/pages/CreateListing";
import ListingShare from "@/pages/ListingShare";
import RecentlySeen from "@/pages/RecentlySeen";
import SavedSearches from "@/pages/SavedSearches";
import HelpFAQ from "@/pages/HelpFAQ";
import Preferences from "@/pages/Preferences";
import BlockedUsers from "@/pages/BlockedUsers";
import ReportHistory from "@/pages/ReportHistory";
import MyReviews from "@/pages/MyReviews";
import Notifications from "@/pages/Notifications";
import Activity from "@/pages/Activity";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminReports from "@/pages/admin/AdminReports";
import AdminListings from "@/pages/admin/AdminListings";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminConversations from "@/pages/admin/AdminConversations";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminBlocks from "@/pages/admin/AdminBlocks";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-border" />
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin absolute inset-0" />
      </div>
    </div>
  );
}

function BannedScreen() {
  const { profile, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
        <ShieldOff className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black">Account Banned</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Your account has been permanently banned from Rewear.
          {profile?.suspension_reason && (
            <span className="block mt-2 text-foreground font-medium">
              Reason: {profile.suspension_reason}
            </span>
          )}
        </p>
      </div>
      <Button variant="destructive" onClick={signOut} className="w-40">
        Sign out
      </Button>
    </div>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileFetched } = useAuth();
  if (loading || (user && !profileFetched)) return <Spinner />;
  if (user) return <Navigate to={profile?.onboarding_completed ? "/" : "/onboarding"} replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileFetched } = useAuth();
  if (loading || (user && !profileFetched)) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.account_status === "banned") return <BannedScreen />;
  if (!profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileFetched } = useAuth();
  if (loading || (user && !profileFetched)) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.account_status === "banned") return <BannedScreen />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  if (loading || adminLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Main app with bottom nav */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<Search />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:id" element={<SellerProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/blocked" element={<BlockedUsers />} />
        <Route path="/settings/reports" element={<ReportHistory />} />
        <Route path="/recently-seen" element={<RecentlySeen />} />
        <Route path="/saved-searches" element={<SavedSearches />} />
        <Route path="/help" element={<HelpFAQ />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/activity" element={<Activity />} />
      </Route>

      {/* Shareable listing link — public, no login required */}
      <Route path="/l/:id" element={<ListingShare />} />

      {/* Full-screen flows — protected but no bottom nav */}
      <Route path="/listings/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/conversations" element={<AdminRoute><AdminConversations /></AdminRoute>} />
      <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
      <Route path="/admin/blocks" element={<AdminRoute><AdminBlocks /></AdminRoute>} />
      <Route path="/admin/audit" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <NotificationsProvider>
                <AppRoutes />
                <Toaster />
              </NotificationsProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
