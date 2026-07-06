"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { LogOut, BarChart3, LayoutDashboard, Settings, User, ChevronsLeft, ChevronsRight } from "lucide-react";
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
    <aside className={cn("flex flex-col h-screen bg-[#100901] justify-between shrink-0 transition-all duration-500 ease-in-out", collapsed ? "w-[72px] p-3" : "w-64 p-6", className)}>
      <div className="flex flex-col gap-8">
        <Link href="/" className={cn("flex items-center ", collapsed ? "justify-center px-0" : "px-10")}>
          <Image src="/arka.jpg" alt="Arka Logo" width={200} height={50} className="object-cover shrink-4" />
        </Link>

        <nav className="flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 text-sm font-medium transition-all duration-200 rounded-md",
                  collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                  isActive ? "bg-white/[0.15] text-white" : "text-gray-500 hover:text-white hover:bg-white/[0.15]",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive ? "text-white" : "text-gray-500")} />
                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-md transition-all duration-200"
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

        <form action={signOut} className="w-full">
          <Button
            variant="ghost"
            title={collapsed ? "Sign Out" : undefined}
            className={cn("w-full gap-3 text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200", collapsed ? "justify-center px-0 py-3" : "justify-start px-4 py-3")}
          >
            <LogOut className="h-4 w-4 shrink-0 text-gray-500" />
            {!collapsed && <span className="whitespace-nowrap">Sign Out</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
