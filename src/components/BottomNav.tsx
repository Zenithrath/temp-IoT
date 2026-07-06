"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  User,
} from "lucide-react";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#100901] border-t border-white/10 px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] transition-all duration-200 hover:text-white"
            >
              {isActive && (
                <div className="absolute -top-2 left-0 right-0 h-0.5 bg-primary rounded-md" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-200",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
