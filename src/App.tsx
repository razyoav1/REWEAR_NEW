import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";

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
import ListingShare from "@/pages/ListingShare";
import RecentlySeen from "@/pages/RecentlySeen";
import SavedSearches from "@/pages/SavedSearches";
import HelpFAQ from "@/pages/HelpFAQ";
import Preferences from "@/pages/Preferences";
import BlockedUsers from "@/pages/BlockedUsers";
import ReportHistory from "@/pages/ReportHistory";
import MyReviews from "@/pages/MyReviews";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  // TODO: check admin role from profile
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth" element={<Auth />} />

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
        <Route path="/messages/:id" element={<ChatThread />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:id" element={<SellerProfile />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/l/:id" element={<ListingShare />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/blocked" element={<BlockedUsers />} />
        <Route path="/settings/reports" element={<ReportHistory />} />
        <Route path="/recently-seen" element={<RecentlySeen />} />
        <Route path="/saved-searches" element={<SavedSearches />} />
        <Route path="/help" element={<HelpFAQ />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/my-reviews" element={<MyReviews />} />
      </Route>

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
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
