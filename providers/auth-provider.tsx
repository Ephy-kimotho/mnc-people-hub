"use client"

import {
  type PropsWithChildren,
  useContext,
  createContext,
  useState,
} from "react"

interface AuthContextType {
  isLoggedIn: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Resolve after the delay so callers can `await` login/logout
  const login = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsLoggedIn(true)
        resolve()
      }, 1500)
    })

  const logout = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsLoggedIn(false)
        resolve()
      }, 1500)
    })

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
