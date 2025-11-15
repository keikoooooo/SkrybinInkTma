import { useEffect, useMemo, useState } from 'react'

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export type TelegramThemeParams = {
  backgroundColor?: string
  secondaryBackgroundColor?: string
  textColor?: string
  hintColor?: string
  linkColor?: string
  buttonColor?: string
  buttonTextColor?: string
}

export type TelegramWebApp = {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    themeParams?: TelegramThemeParams
    start_param?: string
  }
  colorScheme: 'light' | 'dark'
  version: string
  ready: () => void
  expand: () => void
  close: () => void
  BackButton?: { show: () => void; hide: () => void }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

const getTelegram = (): TelegramWebApp | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp
}

const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const tg = getTelegram()
    if (!tg) {
      return
    }

    tg.ready()
    tg.expand()

    setWebApp(tg)
    setUser(tg.initDataUnsafe?.user ?? null)
  }, [])

  useEffect(() => {
    if (!webApp || !API_BASE_URL) {
      return
    }

    let isMounted = true

    const syncSession = async () => {
      try {
        setIsSyncing(true)
        setSyncError(null)
        const response = await fetch(new URL('/api/session', API_BASE_URL), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: webApp.initData }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error ?? 'Session sync failed')
        }
      } catch (error) {
        if (isMounted && error instanceof Error) {
          setSyncError(error.message)
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false)
        }
      }
    }

    syncSession()

    return () => {
      isMounted = false
    }
  }, [webApp])

  const themeParams = useMemo(() => webApp?.initDataUnsafe?.themeParams, [webApp])

  return {
    webApp,
    user,
    themeParams,
    isSyncing,
    syncError,
  }
}

export default useTelegram
