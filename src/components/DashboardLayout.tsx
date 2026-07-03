"use client";

import { Sidebar, MobileNav } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream-100 text-gray-900 overflow-hidden">
      {/* Sidebar on desktop */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile nav header */}
      <MobileNav />

      {/* Main content area */}
      <main className="flex-1 h-screen overflow-y-auto px-2 sm:px-4 py-3 focus:outline-none flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
