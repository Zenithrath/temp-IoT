"use client"

import { Button } from "../ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { ProfileForm } from "../forms/ProfileForm"
import { User } from "lucide-react"

export function ProfileModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all duration-200">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View your profile information below.
          </DialogDescription>
        </DialogHeader>
        <ProfileForm />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="default">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
