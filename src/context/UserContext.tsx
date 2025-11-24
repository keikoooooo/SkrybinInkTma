import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import useTelegram from '../hooks/useTelegram'
import { API } from '../utils/api'

export type ProfileData = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  role: string
  balance_cents: number
  bonus_points: number
  personal_discount: number
}

type UserContextValue = {
  profile: ProfileData | null
  role: string
  loading: boolean
  error: string | null
  telegramUserId?: number
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: telegramUser } = useTelegram()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userId = telegramUser?.id

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await API.profile.get(userId)
      if (data && typeof data === 'object' && 'user' in data) {
        setProfile((data as any).user as ProfileData)
      } else if (data && typeof data === 'object' && 'id' in data) {
        setProfile(data as ProfileData)
      } else {
        setProfile(null)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    fetchProfile()
  }, [userId, fetchProfile])

  const value = useMemo<UserContextValue>(
    () => ({
      profile,
      role: profile?.role ?? 'client',
      loading,
      error,
      telegramUserId: userId,
      refresh: fetchProfile,
    }),
    [profile, loading, error, userId, fetchProfile],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUserProfile = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserProfile must be used within UserProvider')
  }
  return context
}

