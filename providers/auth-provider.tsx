"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { WorkspaceLoader } from "@/components/workspace-loader"
import * as authApi from "@/lib/api/auth"
import {
  clearAccessToken,
  getAccessToken,
  subscribeAccessToken,
} from "@/lib/auth-token"
import { onUnauthorized, refreshAccessToken } from "@/lib/axios"
import type { LoginValues } from "@/lib/schemas/auth"
import type { AuthUser } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  status: AuthStatus
  isLoggedIn: boolean
  login: (values: LoginValues) => Promise<AuthUser>
  logout: () => Promise<void>
  /** Re-fetches `/auth/me` and updates `user` (e.g. after a password change). */
  refreshUser: () => Promise<AuthUser>
}

/** Screens that are reachable without a session. */
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/** Screen shown while an account still has a temporary password. */
export const CHANGE_PASSWORD_ROUTE = "/change-password"

/** Where a signed-in user lands by default. */
export const HOME_ROUTE = "/overview"

/**
 * Every path the app actually serves. Anything else is a 404, and a 404 has to
 * render its own screen rather than being bounced to `/login` — keep this in
 * sync when a route is added under `app/(auth)` or `app/(dashboard)`.
 */
const APP_ROUTES = [
  "/",
  ...PUBLIC_ROUTES,
  CHANGE_PASSWORD_ROUTE,
  "/overview",
  "/profile",
  "/leaves",
  "/locations",
  "/staff",
  "/submit-leave",
]

/** Whether the path matches a real route (so a signed-out visitor belongs at login). */
export function isAppRoute(pathname: string) {
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/** Where a signed-in user should land, unless they must first set a new password. */
export function getLandingPath(user: Pick<AuthUser, "must_change_password">) {
  return user.must_change_password ? CHANGE_PASSWORD_ROUTE : HOME_ROUTE
}

/**
 * The page the visitor should be sent to, or null if they can stay. Signed-out
 * visitors go to login (never from a 404), signed-in ones leave the public
 * screens, and a temporary password pins the user to the change-password page.
 */
function getRedirect(
  status: AuthStatus,
  user: AuthUser | null,
  pathname: string
) {
  if (status === "loading") return null

  if (!user) {
    const isProtected = isAppRoute(pathname) && !isPublicRoute(pathname)
    return isProtected ? "/login" : null
  }

  const landing = getLandingPath(user)
  const onChangePassword = pathname === CHANGE_PASSWORD_ROUTE
  if (pathname === "/" || isPublicRoute(pathname)) return landing
  if (user.must_change_password !== onChangePassword) return landing
  return null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const getServerToken = () => null

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const bootstrapped = useRef(false)

  // Mirrors the module-level token, so consumers re-render when the axios
  // interceptor refreshes it behind the scenes.
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken
  )

  const startSession = useCallback((profile: AuthUser) => {
    setUser(profile)
    setStatus("authenticated")
  }, [])

  const endSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  // On load: trade the refresh cookie for an access token and load the profile
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    async function bootstrap() {
      try {
        await refreshAccessToken()
        startSession(await authApi.fetchMe())
      } catch {
        endSession()
      }
    }

    void bootstrap()
  }, [startSession, endSession])

  // A refresh that fails mid-session (cookie expired or revoked) ends it
  useEffect(() => onUnauthorized(endSession), [endSession])

  const redirectTo = getRedirect(status, user, pathname)

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  const login = useCallback(
    async (values: LoginValues) => {
      await authApi.login(values)
      const profile = await authApi.fetchMe()
      startSession(profile)
      return profile
    },
    [startSession]
  )

  const refreshUser = useCallback(async () => {
    const profile = await authApi.fetchMe()
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      endSession()
    }
  }, [endSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isLoggedIn: status === "authenticated" && user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, accessToken, status, login, logout, refreshUser]
  )

  // Hold the page back until the session is known and any redirect has run
  return (
    <AuthContext.Provider value={value}>
      {status === "loading" || redirectTo ? <WorkspaceLoader /> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
