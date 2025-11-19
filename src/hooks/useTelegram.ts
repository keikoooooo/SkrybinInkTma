import { useEffect, useMemo, useState } from 'react'
import { API } from '../utils/api'

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
    if (!webApp) {
      return
    }

    let isMounted = true

    const syncSession = async () => {
      try {
        setIsSyncing(true)
        setSyncError(null)
        await API.session.create(webApp.initData)
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
