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
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="rounded-lg overflow-hidden flex items-center justify-center h-7 w-7 shadow-sm">
          <Image src="/arka.jpg" alt="Arka Logo" width={28} height={28} className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900 tracking-tight leading-none">Arkananta MT</span>
          <span className="text-[9px] font-semibold text-primary mt-0.5">{title}</span>
        </div>
      </Link>

      <form action={signOut}>
        <button 
          type="submit"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
