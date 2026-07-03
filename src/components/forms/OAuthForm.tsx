"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "../icons"
import { toast } from "../ui/use-toast"
import createSupabaseClientClient from "@/lib/supabase/client"

export default function OAuthForm() {
  async function loginWithGithub() {
    const supabase = await createSupabaseClientClient()
    const result = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    const { error } = result
    if (error?.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{error.message}</code>
          </pre>
        ),
      })
    }
  }

  return (
    <Button className="w-full" onClick={loginWithGithub}>
      Login With Github
      <Icons.gitHub className="h-5 w-5 ml-2" />
    </Button>
  )
}
