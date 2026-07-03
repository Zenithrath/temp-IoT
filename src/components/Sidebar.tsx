"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  LogOut, 
  BarChart3, 
  LayoutDashboard, 
  Settings, 
  User, 
  X,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useState } from "react";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-cream-200/50 border-r border-cream-300/40 justify-between shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px] p-3" : "w-64 p-6",
        className
      )}
    >
      <div className="flex flex-col gap-8">
        {/* Brand/Logo */}
        <Link href="/" className={cn("flex items-center gap-3", collapsed ? "justify-center px-0" : "px-2")}>
          <div className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center h-8 w-8 shadow-sm">
            <Image src="/arka.jpg" alt="Arka Logo" width={32} height={32} className="object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">Arkananta MT</span>
              <span className="text-[9px] font-bold text-slate-500 mt-1 whitespace-nowrap uppercase tracking-wider">Dashboard Monitoring Mobile Tower</span>
            </div>
          )}
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" 
              ? pathname === "/" 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 text-sm font-medium transition-all duration-200 rounded-xl group",
                  collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                  isActive 
                    ? "bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-gray-100" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-cream-300/30 pt-4 flex flex-col gap-3">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-200"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          )}
        </button>

        {/* Sign Out */}
        <form action={signOut} className="w-full">
          <Button 
            variant="ghost" 
            title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "w-full gap-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-200",
              collapsed ? "justify-center px-0 py-3" : "justify-start px-4 py-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
            {!collapsed && <span className="whitespace-nowrap">Sign Out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeItem = navigationItems.find(item => 
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-slate-200/50 md:hidden sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2">
        <div className="rounded-lg overflow-hidden flex items-center justify-center h-6 w-6">
          <Image src="/arka.jpg" alt="Arka Logo" width={24} height={24} className="object-cover" />
        </div>
        <span className="text-xs font-bold text-slate-900 tracking-tight">Arkananta MT</span>
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-primary capitalize bg-primary/10 px-2.5 py-1 rounded-full">
          {activeItem?.label || "Dashboard"}
        </span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-cream-200/50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0 w-64 bg-cream-100 border-r border-cream-200">
            <div className="flex flex-col h-full justify-between p-6">
              <div className="flex flex-col gap-8">
                {/* Brand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl overflow-hidden flex items-center justify-center h-8 w-8 shadow-sm">
                      <Image src="/arka.jpg" alt="Arka Logo" width={32} height={32} className="object-cover" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Arkananta MT</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-900">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1.5">
                  {navigationItems.map((item) => {
                    const isActive = item.href === "/" 
                      ? pathname === "/" 
                      : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl",
                          isActive 
                            ? "bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-gray-100" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : "text-gray-400"
                        )} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="border-t border-cream-300/30 pt-4 flex flex-col gap-4">
                <form action={signOut} className="w-full">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 rounded-xl"
                  >
                    <LogOut className="h-4 w-4 text-gray-400" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
