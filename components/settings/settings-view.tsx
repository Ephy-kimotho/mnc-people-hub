"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useSettings } from "@/hooks/use-mnc"
import { getErrorMessage } from "@/lib/api/errors"
import { mncKeys, updateSetting } from "@/lib/api/mnc"

export function SettingsView() {
  const query = useSettings()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSetting(key, value),
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: mncKeys.settings() })
      toast.success(`${values.key} saved`)
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Couldn't save this setting.")),
  })

  const entries = Object.entries(query.data ?? {})

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Values that drive notifications and the leave policy."
      />

      {query.isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(query.error, "Couldn't load settings.")}
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No settings defined.</p>
      ) : (
        <Card className="gap-0 rounded-2xl p-0">
          <ul className="divide-y">
            {entries.map(([key, value]) => (
              <SettingRow
                key={key}
                settingKey={key}
                value={value}
                disabled={mutation.isPending}
                onSave={(next) => mutation.mutate({ key, value: next })}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function SettingRow({
  settingKey,
  value,
  disabled,
  onSave,
}: {
  settingKey: string
  value: string
  disabled: boolean
  onSave: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const dirty = draft !== value

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-4">
      <code className="min-w-40 flex-1 text-sm font-medium">{settingKey}</code>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-10 max-w-md flex-[2] rounded-xl"
      />
      <Button
        size="sm"
        className="rounded-full"
        disabled={disabled || !dirty}
        onClick={() => onSave(draft)}
      >
        {disabled ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
        Save
      </Button>
    </li>
  )
}
