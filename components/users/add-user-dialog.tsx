"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/api/errors"
import { useRoles } from "@/hooks/use-roles"
import { createUser, usersKeys } from "@/lib/api/users"
import { generatePassword } from "@/lib/password"
import { createUserSchema, type CreateUserValues } from "@/lib/schemas/user"
import { cn } from "@/lib/utils"

type AddUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const inputClass = "h-12 rounded-xl px-3.5"

const textFields = [
  {
    name: "full_name",
    label: "Full name",
    placeholder: "Jane Wanjiku",
    type: "text",
  },
  {
    name: "username",
    label: "Username",
    placeholder: "jane.wanjiku",
    type: "text",
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "jane@mangacapital.co.ke",
    type: "email",
  },
] as const

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl p-0">
        {/* Radix unmounts the content when closed, so the form starts fresh each time */}
        <AddUserForm onCreated={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddUserForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient()
  const rolesQuery = useRoles()
  // New users are admins or managers; staff members aren't offered here
  const roles = rolesQuery.data?.filter((role) => role.name !== "staff")

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      full_name: "",
      email: "",
      password: generatePassword(),
      role: "",
    },
  })

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (_user, values) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.all })
      toast.success(`${values.full_name} has been added`)
      onCreated()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Couldn't create this user."))
    },
  })

  return (
    <>
      <DialogHeader className="gap-1 border-b px-6 py-5">
        <DialogTitle className="text-lg font-semibold">Add User</DialogTitle>
        <DialogDescription>
          Create a login for MNC People. They&apos;ll set their own password the
          first time they log in.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
        className="space-y-5 px-6 py-5"
      >
        {textFields.map((item, index) => (
          <Controller
            key={item.name}
            name={item.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor={`user-${item.name}`}>
                  {item.label} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`user-${item.name}`}
                  type={item.type}
                  placeholder={item.placeholder}
                  autoComplete="off"
                  autoFocus={index === 0}
                  aria-invalid={fieldState.invalid}
                  className={inputClass}
                />
                <FieldError errors={[fieldState.error]} className="text-xs" />
              </Field>
            )}
          />
        ))}

        <Controller
          name="role"
          control={form.control}
          render={({ field, fieldState }) => {
            const selected = roles?.find((role) => role.name === field.value)
            return (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel htmlFor="user-role">
                  Role <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!rolesQuery.data}
                >
                  <SelectTrigger
                    id="user-role"
                    aria-invalid={fieldState.invalid}
                    className={cn(
                      "w-full data-[size=default]:h-12",
                      inputClass
                    )}
                  >
                    <SelectValue
                      placeholder={
                        rolesQuery.isPending
                          ? "Loading roles…"
                          : "Select a role"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && (
                  <FieldDescription className="text-xs">
                    {selected.description}
                  </FieldDescription>
                )}
                {rolesQuery.isError && (
                  <p className="text-xs text-destructive">
                    Couldn&apos;t load roles.{" "}
                    <button
                      type="button"
                      onClick={() => rolesQuery.refetch()}
                      className="font-medium underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </p>
                )}
                <FieldError errors={[fieldState.error]} className="text-xs" />
              </Field>
            )
          }}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field }) => (
            <Field className="gap-2">
              <FieldLabel htmlFor="user-password">
                Temporary password
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  {...field}
                  id="user-password"
                  readOnly
                  className={cn("font-mono tracking-wide", inputClass)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate a new password"
                  onClick={() => field.onChange(generatePassword())}
                  className="size-12 shrink-0 rounded-xl"
                >
                  <RefreshCwIcon />
                </Button>
                <CopyButton value={field.value} label="Copy password" />
              </div>
              <FieldDescription className="text-xs">
                Generated automatically. Copy it before saving and share it with
                the user so they can log in for the first time.
              </FieldDescription>
            </Field>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="h-11 px-5">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 rounded-xl px-6"
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {mutation.isPending ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>
    </>
  )
}

// Swaps to a check mark for a moment after copying
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={copied ? "Copied" : label}
      onClick={copy}
      className="size-12 shrink-0 rounded-xl"
    >
      {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
    </Button>
  )
}
