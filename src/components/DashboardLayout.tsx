"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-cream-100 text-gray-900 overflow-hidden">
      {/* Sidebar on desktop (lg and above) */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile/tablet header */}
      <MobileHeader />

      {/* Main content area */}
      <main className="flex-1 h-screen overflow-y-auto px-3 sm:px-4 pt-4 pb-24 lg:pb-4 focus:outline-none flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* Bottom navigation for mobile/tablet */}
      <BottomNav />
    </div>
  );
}
