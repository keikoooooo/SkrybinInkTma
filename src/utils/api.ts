/**
 * Утилита для работы с API
 * Использует прокси в dev режиме или полный URL в production
 */

const getApiBaseUrl = (): string => {
  // В dev режиме используем прокси (относительный путь)
  if (import.meta.env.DEV) {
    return '' // Используем прокси из vite.config.ts
  }
  
  // В production используем переменную окружения
  return import.meta.env.VITE_API_BASE_URL || 'https://tma-tatoo-studio.onrender.com/'
}

/**
 * Базовый fetch для API запросов
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getApiBaseUrl()
  const url = baseUrl ? new URL(endpoint, baseUrl).toString() : endpoint

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: `Failed to fetch from ${url}`,
      }))
      throw new Error(error.error || error.message || error.details || 'Request failed')
    }

    return response.json()
  } catch (err) {
    // Улучшенная обработка ошибок сети
    if (err instanceof TypeError && err.message.includes('fetch')) {
      const errorMsg = `Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на ${baseUrl || 'http://localhost:8080'}`
      console.error('Network error:', err)
      console.error('Request URL:', url)
      throw new Error(errorMsg)
    }
    throw err
  }
}

/**
 * GET запрос
 */
export const apiGet = <T = any>(endpoint: string, headers?: HeadersInit): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'GET', headers })
}

/**
 * POST запрос
 */
export const apiPost = <T = any>(
  endpoint: string,
  data?: any,
  headers?: HeadersInit
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers,
  })
}

/**
 * PUT запрос
 */
export const apiPut = <T = any>(
  endpoint: string,
  data?: any,
  headers?: HeadersInit
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    headers,
  })
}

/**
 * DELETE запрос
 */
export const apiDelete = <T = any>(endpoint: string, headers?: HeadersInit): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE', headers })
}

/**
 * API endpoints
 */
export const API = {
  // Session
  session: {
    create: (initData: string) => apiPost('/api/session', { initData }),
  },

  // Catalog
  catalog: {
    get: () => apiGet<{ ok: boolean; items: any[] }>('/api/catalog'),
  },

  // Products
  products: {
    getAll: () => apiGet('/api/products'),
    getById: (id: number) => apiGet(`/api/products/${id}`),
  },

  // Orders
  orders: {
    getUserOrders: (userId: number) => apiGet(`/api/orders/${userId}`),
    getOrder: (userId: number, orderId: number) => apiGet(`/api/orders/${userId}/${orderId}`),
    create: (data: any, userId: number) =>
      apiPost('/api/orders', data, { 'X-User-ID': userId.toString() }),
    update: (id: number, data: any, userId: number) =>
      apiPut(`/api/orders/${id}`, data, { 'X-User-ID': userId.toString() }),
    cancel: (id: number, userId: number) =>
      apiDelete(`/api/orders/${id}`, { 'X-User-ID': userId.toString() }),
  },

  // Profile
  profile: {
    get: (userId: number) => apiGet(`/api/profile/${userId}`, { 'X-User-ID': userId.toString() }),
    update: (userId: number, data: any) =>
      apiPut(`/api/profile/${userId}`, data, { 'X-User-ID': userId.toString() }),
  },

  // Works
  works: {
    getAll: (params?: { artist_id?: number; style_id?: number }) => {
      const query = new URLSearchParams()
      if (params?.artist_id) query.append('artist_id', params.artist_id.toString())
      if (params?.style_id) query.append('style_id', params.style_id.toString())
      const queryString = query.toString()
      return apiGet(`/api/works${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: number) => apiGet(`/api/works/${id}`),
  },

  // Artists
  artists: {
    getAll: () => apiGet('/api/artists'),
    getById: (id: number) => apiGet(`/api/artists/${id}`),
  },

  // Styles
  styles: {
    getAll: () => apiGet('/api/styles'),
  },

  // Favorites
  favorites: {
    getAll: (userId: number) =>
      apiGet(`/api/favorites/${userId}`, { 'X-User-ID': userId.toString() }),
    add: (workId: number, userId: number) =>
      apiPost('/api/favorites', { work_id: workId }, { 'X-User-ID': userId.toString() }),
    remove: (id: number, userId: number) =>
      apiDelete(`/api/favorites/${id}`, { 'X-User-ID': userId.toString() }),
  },

  // Reviews
  reviews: {
    getAll: (params?: { artist_id?: number; work_id?: number; published?: boolean }) => {
      const query = new URLSearchParams()
      if (params?.artist_id) query.append('artist_id', params.artist_id.toString())
      if (params?.work_id) query.append('work_id', params.work_id.toString())
      if (params?.published !== undefined) query.append('published', params.published.toString())
      const queryString = query.toString()
      return apiGet(`/api/reviews${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: number) => apiGet(`/api/reviews/${id}`),
    create: (data: any, userId: number) =>
      apiPost('/api/reviews', data, { 'X-User-ID': userId.toString() }),
    update: (id: number, data: any, userId: number) =>
      apiPut(`/api/reviews/${id}`, data, { 'X-User-ID': userId.toString() }),
    delete: (id: number, userId: number) =>
      apiDelete(`/api/reviews/${id}`, { 'X-User-ID': userId.toString() }),
  },

  // Deposits
  deposits: {
    getAll: (userId: number) =>
      apiGet(`/api/deposits/${userId}`, { 'X-User-ID': userId.toString() }),
    create: (data: any, userId: number) =>
      apiPost('/api/deposits', data, { 'X-User-ID': userId.toString() }),
  },

  // Appointments
  appointments: {
    getAll: (userId: number) =>
      apiGet(`/api/appointments/${userId}`, { 'X-User-ID': userId.toString() }),
    create: (data: any, userId: number) =>
      apiPost('/api/appointments', data, { 'X-User-ID': userId.toString() }),
    update: (id: number, data: any, userId: number) =>
      apiPut(`/api/appointments/${id}`, data, { 'X-User-ID': userId.toString() }),
  },

  // Admin
  admin: {
    requests: (userId?: number) => {
      const headers = userId ? { 'X-User-ID': userId.toString() } : undefined
      return apiGet<{ ok: boolean; requests: any[] }>('/api/admin/requests', headers)
    },
    orders: (params?: { status?: string }, userId?: number) => {
      const query = params?.status ? `?status=${params.status}` : ''
      const headers = userId ? { 'X-User-ID': userId.toString() } : undefined
      return apiGet(`/api/admin/orders${query}`, headers)
    },
    products: {
      create: (data: any, userId: number) =>
        apiPost('/api/admin/products', data, { 'X-User-ID': userId.toString() }),
      update: (id: number, data: any, userId: number) =>
        apiPut(`/api/admin/products/${id}`, data, { 'X-User-ID': userId.toString() }),
      delete: (id: number, userId: number) =>
        apiDelete(`/api/admin/products/${id}`, { 'X-User-ID': userId.toString() }),
    },
    works: {
      create: (data: any, userId: number) =>
        apiPost('/api/admin/works', data, { 'X-User-ID': userId.toString() }),
      update: (id: number, data: any, userId: number) =>
        apiPut(`/api/admin/works/${id}`, data, { 'X-User-ID': userId.toString() }),
      delete: (id: number, userId: number) =>
        apiDelete(`/api/admin/works/${id}`, { 'X-User-ID': userId.toString() }),
    },
  },
}

