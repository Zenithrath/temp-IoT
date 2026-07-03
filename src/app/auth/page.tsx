import React from "react";
import { AuthForm } from "../../components/forms/AuthForm";
import { Icons } from "@/components/icons";

export default function page() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Icons.sunset className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Weather Station</h1>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to access your dashboard
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-100">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
