"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGetUserSB } from "@/hooks/useGetUserSB";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Calendar, 
  Cpu, 
  Bell, 
  Flame, 
  LogIn, 
  ShieldAlert,
  Settings,
  ChevronRight
} from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const { userInfo, error } = useGetUserSB();
  const user = userInfo?.session?.user;

  // Local preferences state (defaults)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [tempAlerts, setTempAlerts] = useState(false);

  const handleToggleEmail = () => {
    setEmailNotifs(!emailNotifs);
    toast({
      title: "Preferences Updated",
      description: `Email notifications have been ${!emailNotifs ? "enabled" : "disabled"}.`,
    });
  };

  const handleToggleTemp = () => {
    setTempAlerts(!tempAlerts);
    toast({
      title: "Preferences Updated",
      description: `Temperature alerts have been ${!tempAlerts ? "enabled" : "disabled"}.`,
    });
  };

  const isGuest = !user;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account credentials, devices, and preference configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Info Card (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-md p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <Avatar className="w-24 h-24 border-4 border-cream-100 shadow-inner mb-4">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {user?.user_metadata?.full_name || user?.user_metadata?.user_name || "Guest Account"}
              </h2>
              
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                {isGuest ? (
                  <Badge variant="outline" className="bg-amber-50/50 border-amber-200 text-amber-600 font-bold">
                    Guest Mode
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-50/50 border-emerald-200 text-emerald-600 font-bold">
                    Active User
                  </Badge>
                )}
              </p>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3.5 text-sm">
                <div className="p-2 bg-cream-100 rounded-md text-gray-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Email Address</span>
                  <span className="text-gray-700 font-semibold mt-1">{user?.email || "guest@arkananta.io"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <div className="p-2 bg-cream-100 rounded-md text-gray-500">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Account Created</span>
                  <span className="text-gray-700 font-semibold mt-1">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      : "Jul 2026 (Demo Session)"
                    }
                  </span>
                </div>
              </div>
            </div>

            {isGuest && (
              <div className="mt-8 p-4 bg-amber-50/40 border border-amber-200/40 rounded-md flex flex-col items-center text-center">
                <ShieldAlert className="h-6 w-6 text-amber-500 mb-2" />
                <h4 className="text-xs font-bold text-gray-800">You are logged out</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
                  Sign in or create an account to pair personal IoT hardware stations.
                </p>
                <Link href="/auth" className="w-full mt-4">
                  <Button className="w-full bg-primary hover:bg-primary/95 text-white gap-2 rounded-md py-2">
                    <LogIn className="h-4 w-4" />
                    Sign In Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Devices & Preferences (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Connected Devices */}
          <div className="bg-white rounded-md p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900">Connected IoT Devices</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sensors currently paired with your profile</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-none font-bold">
                {isGuest ? "2 Demo Nodes" : "2 Registered"}
              </Badge>
            </div>

            <div className="space-y-3">
              {[
                { name: "Station #1 - Garden", id: "WS-GARDEN-01", status: "Active" },
                { name: "Station #2 - Living Room", id: "WS-LIVING-02", status: "Active" },
              ].map((station) => (
                <div 
                  key={station.id} 
                  className="flex items-center justify-between p-4 bg-cream-50 hover:bg-cream-100/50 rounded-md border border-cream-200/20 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-white rounded-md shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{station.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{station.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                      {station.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-md p-6 border border-cream-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.03)] transition-all duration-300">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Alert Preferences</h3>
              <p className="text-xs text-gray-400">Configure notification alerts for telemetry triggers</p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 bg-cream-100 rounded-md text-gray-500 mt-0.5">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-gray-800">Email Alerts</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Receive summary reports & critical alerts via email</p>
                  </div>
                </div>
                {/* Custom toggle slider */}
                <button 
                  onClick={handleToggleEmail}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 outline-none focus:outline-none ${
                    emailNotifs ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <div 
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-200 ${
                      emailNotifs ? "left-6" : "left-1"
                    }`} 
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-gray-50 pt-5">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 bg-cream-100 rounded-md text-gray-500 mt-0.5">
                    <Flame className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-gray-800">High Temperature Warning</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Notify instantly when temperature climbs above 35°C</p>
                  </div>
                </div>
                {/* Custom toggle slider */}
                <button 
                  onClick={handleToggleTemp}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 outline-none focus:outline-none ${
                    tempAlerts ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <div 
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-200 ${
                      tempAlerts ? "left-6" : "left-1"
                    }`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
