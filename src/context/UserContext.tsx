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
      if (data && typeof data === 'object') {
        if ('user' in data && data.user) {
          setProfile((data as any).user as ProfileData)
        } else if ('id' in data) {
          setProfile(data as ProfileData)
        } else if ('ok' in data && !data.ok) {
          setError((data as any).error || 'Failed to fetch profile')
          setProfile(null)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Неизвестная ошибка при загрузке профиля')
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

    // Слушаем событие синхронизации сессии и перезагружаем профиль
    const handleSessionSynced = () => {
      // Небольшая задержка, чтобы БД успела обновиться
      setTimeout(() => {
        fetchProfile()
      }, 300)
    }

    window.addEventListener('session-synced', handleSessionSynced)

    return () => {
      window.removeEventListener('session-synced', handleSessionSynced)
    }
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

