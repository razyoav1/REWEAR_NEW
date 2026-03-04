import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-background">
      <main className="page-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
