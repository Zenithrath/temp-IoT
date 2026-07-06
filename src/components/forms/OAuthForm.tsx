"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "../icons"
import { toast } from "../ui/use-toast"
import createSupabaseClientClient from "@/lib/supabase/client"

export default function OAuthForm() {
  const [loading, setLoading] = useState(false)

  async function loginWithGithub() {
    setLoading(true)
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
    setLoading(false)
  }

  return (
    <Button
      onClick={loginWithGithub}
      disabled={loading}
      variant="outline"
      className="w-full h-10 rounded-md border-gray-200/60 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold font-orbitron tracking-[0.05em] shadow-[2px_2px_6px_rgba(0,0,0,0.06),-1px_-1px_4px_rgba(255,255,255,0.5)]"
    >
      {loading ? (
        <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Icons.gitHub className="h-4 w-4 mr-2" />
      )}
      GITHUB
    </Button>
  )
}
