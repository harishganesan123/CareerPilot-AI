import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth'
import { ACCESS_TOKEN_KEY, toApiError } from '../api/client'
import type { LoginPayload, RegisterPayload, UserPublic } from '../types/user'

interface AuthContextValue {
  user: UserPublic | null
  isAuthenticated: boolean
  /** True while the initial session (token -> user) restore is in flight. */
  isInitializing: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  /** Update the in-memory user, e.g. after a profile edit. */
  setUser: (user: UserPublic) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // On first load, if a token is already stored (e.g. after a page refresh),
  // restore the session by fetching the current user with it.
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setIsInitializing(false)
      return
    }

    fetchCurrentUser()
      .then((restoredUser) => setUser(restoredUser))
      .catch(() => {
        // Token invalid/expired: clear it so the app treats this as logged out.
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setIsInitializing(false))
  }, [])

  async function login(payload: LoginPayload) {
    try {
      const data = await loginUser(payload)
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
      setUser(data.user)
    } catch (error) {
      throw toApiError(error)
    }
  }

  async function register(payload: RegisterPayload) {
    try {
      const data = await registerUser(payload)
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
      setUser(data.user)
    } catch (error) {
      throw toApiError(error)
    }
  }

  function logout() {
    // JWTs are stateless and can't be invalidated from the client, so
    // "logout" means securely discarding the stored token/session client
    // side. The token remains technically valid server-side until it
    // expires (ACCESS_TOKEN_EXPIRE_MINUTES) — a real revocation scheme
    // would need a server-side deny-list or refresh-token rotation, which
    // is out of scope for this phase.
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      register,
      logout,
      setUser,
    }),
    [user, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
