import { axiosInstance } from "@/lib/axios"
import type { CreateUserValues } from "@/lib/schemas/user"
import type { Role, User, UserFilters, UserStats } from "@/lib/types"

// Every users query shares this prefix, so one invalidation refreshes them all
export const usersKeys = {
  all: ["users"] as const,
  list: (filters: UserFilters) => ["users", "list", filters] as const,
  stats: ["users", "stats"] as const,
}

// Kept outside `users` so creating or deleting a user doesn't refetch roles
export const rolesKey = ["roles"] as const

// Axios drops undefined params, so unset filters are left off the URL
export async function fetchUsers(filters: UserFilters) {
  const response = await axiosInstance.get<User[]>("/auth/users", {
    params: filters,
  })
  return response.data
}

export async function fetchUserStats() {
  const response = await axiosInstance.get<UserStats>("/auth/users/stats")
  return response.data
}

export async function deleteUser(userId: string) {
  await axiosInstance.delete(`/auth/users/${userId}`)
}

// New accounts always start on a temporary password the user must replace
export async function createUser(values: CreateUserValues) {
  const response = await axiosInstance.post<User>("/auth/users", {
    ...values,
    must_change_password: true,
  })
  return response.data
}

export async function fetchRoles() {
  const response = await axiosInstance.get<Role[]>("/auth/roles")
  return response.data
}

export type UserAccessAction = "enable" | "disable" | "unlock"

// POST /auth/users/{id}/enable, /disable or /unlock
export async function changeUserAccess(
  userId: string,
  action: UserAccessAction
) {
  await axiosInstance.post(`/auth/users/${userId}/${action}`)
}
