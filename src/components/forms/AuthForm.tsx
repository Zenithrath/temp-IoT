"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import RegisterForm from "./RegisterForm";
import OAuthForm from "./OAuthForm";

export function AuthForm() {
  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 rounded-md p-1">
          <TabsTrigger
            value="signin"
            className="text-xs font-bold font-orbitron tracking-wider data-[state=active]:bg-background data-[state=active]:text-gray-900 data-[state=active]:shadow-[2px_2px_6px_rgba(0,0,0,0.08),-1px_-1px_4px_rgba(255,255,255,0.5)] text-gray-500 rounded-md py-2"
          >
            SIGN IN
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="text-xs font-bold font-orbitron tracking-wider data-[state=active]:bg-background data-[state=active]:text-gray-900 data-[state=active]:shadow-[2px_2px_6px_rgba(0,0,0,0.08),-1px_-1px_4px_rgba(255,255,255,0.5)] text-gray-500 rounded-md py-2"
          >
            REGISTER
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200/60" />
        </div>
        <div className="relative flex justify-center text-[10px] font-bold font-orbitron tracking-wider">
          <span className="bg-background px-3 text-gray-400">OR CONTINUE WITH</span>
        </div>
      </div>
      <OAuthForm />
    </div>
  );
}
