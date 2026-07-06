import React from "react";
import { AuthForm } from "../../components/forms/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#100901] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#100901] via-[#1a1208] to-[#100901] opacity-80" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-white/[0.02] rounded-full blur-[100px]" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-md bg-background flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.03)]">
              <span className="text-2xl font-bold text-primary font-orbitron">A</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-orbitron tracking-[0.15em]">ARKANANTA</h1>
            <p className="text-xs text-gray-500 font-orbitron tracking-[0.2em] mt-2">MONITORING TOWER</p>
          </div>
        </div>
        <div className="rounded-md p-6 bg-background shadow-[8px_8px_24px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)] border border-white/5">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
