"use client"

import { useState, useEffect } from "react"
import { Icons } from "../icons"
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
import { SettingForm } from "../forms/SettingForm"
import { readSetting } from "@/actions"
import { Badge } from "../ui/badge"

export function SettingModal() {
  const [entityType, setEntityType] = useState("")
  const [entityId, setEntityId] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readSetting()
        if (result.data && result.data.length > 0) {
          setEntityType(result.data[0].entityType)
          setEntityId(result.data[0].entityId)
        }
      } catch (e) {
        console.log("Backend not available")
      }
    }
    load()
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"ghost"} className="w-full justify-start gap-3 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all duration-200">
          <Icons.setting className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            <p className="text-sm text-slate-400">
              Configure your ThingsBoard device connection:
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">EntityType:</span>
                <Badge>{entityType || "NA"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">EntityId:</span>
                <Badge>{entityId || "NA"}</Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <SettingForm />
        <DialogFooter>
          <DialogClose asChild className="w-full">
            <Button type="button" variant="destructive">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
