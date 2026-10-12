"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type RecallLeaveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name?: string
  onConfirm: () => void
}

export function RecallLeaveDialog({
  open,
  onOpenChange,
  name,
  onConfirm,
}: RecallLeaveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Recall this leave request for {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will mark it as recalled and return any leave days used.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-6 -mb-6 px-6">
          <AlertDialogCancel className="h-10 rounded-xl px-5">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant="destructive"
            className="h-10 rounded-xl px-5"
          >
            Recall leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
