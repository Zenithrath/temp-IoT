"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "@/actions";
import { LogOut } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function MobileHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-cream-50 border-b border-cream-200/60 sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/ARKA.jpg" alt="Arka Logo" width={36} height={36} className="object-cover shrink-0" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900 tracking-tight leading-none">Arkananta MT</span>
          <span className="text-[9px] font-semibold text-primary mt-0.5">{title}</span>
        </div>
      </Link>

      <form action={signOut}>
        <button
          type="submit"
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
