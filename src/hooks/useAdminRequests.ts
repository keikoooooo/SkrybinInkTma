import { useCallback, useEffect, useState } from 'react'
import { API } from '../utils/api'

export type RequestRecord = {
  id: number
  user_id: number
  status: string
  total_cents: number
  comment: string | null
  scheduled_at: string | null
  created_at: string
  user_name: string | null
  user_contact: string | null
}

type UseAdminRequestsOptions = {
  userId?: number
  enabled?: boolean
}

export const useAdminRequests = ({ userId, enabled = true }: UseAdminRequestsOptions) => {
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!userId || !enabled) {
      setRequests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await API.admin.requests(userId)
      if (data.ok && Array.isArray(data.requests)) {
        setRequests(data.requests)
      } else {
        setRequests([])
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Не удалось загрузить заявки')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, enabled])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return {
    requests,
    loading,
    error,
    reload: fetchRequests,
  }
}

