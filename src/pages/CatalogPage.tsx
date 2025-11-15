import { useEffect, useState } from 'react'

type CatalogItem = {
  id: number
  title: string
  description: string | null
  price_cents: number
  product_type: string
  style: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

const categories = [
  {
    name: 'рукав',
    image: 'https://images.unsplash.com/photo-1554666869-10de6baea5d1?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'спина',
    image: 'https://images.unsplash.com/photo-1599206235297-0113b2b5bb52?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'нога',
    image: 'https://images.unsplash.com/photo-1512321807846-31c69b54851e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'среднее',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'маленькое',
    image: 'https://images.unsplash.com/photo-1524854859347-bd3f1c6c39e2?auto=format&fit=crop&w=600&q=80',
  },
]

const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!API_BASE_URL) {
      return
    }

    let mounted = true

    const loadCatalog = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(new URL('/api/catalog', API_BASE_URL))
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error ?? 'Не удалось получить ассортимент')
        }
        const data = await response.json()
        if (mounted && Array.isArray(data.items)) {
          setItems(data.items)
        }
      } catch (err) {
        if (mounted && err instanceof Error) {
          setError(err.message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="page page--catalog">
      <h1 className="page__title">АССОРТИМЕНТ</h1>

      {API_BASE_URL ? (
        <>
          {isLoading && <div className="info-banner">Загружаем ассортимент…</div>}
          {error && <div className="info-banner info-banner--error">{error}</div>}
          {!isLoading && !error && items.length === 0 && (
            <div className="info-banner">Ассортимент пока пуст — добавьте товары в админке.</div>
          )}
          {items.length > 0 && (
            <div className="catalog-list">
              {items.map((item) => (
                <article key={item.id} className="product-card">
                  <header className="product-card__header">
                    <span className="product-card__title">{item.title}</span>
                    {item.style && <span className="product-card__tag">{item.style}</span>}
                  </header>
                  <p className="product-card__description">{item.description ?? 'Описание скоро появится'}</p>
                  <footer className="product-card__footer">
                    <span className="product-card__price">{(item.price_cents / 100).toLocaleString('ru-RU')} ₽</span>
                    <button type="button" className="ghost-button ghost-button--small">
                      Добавить
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="catalog-grid">
          {categories.map((category) => (
            <div key={category.name} className="catalog-tile">
              <img src={category.image} alt={category.name} />
              <span className="catalog-tile__label">{category.name}</span>
            </div>
          ))}
          <div className="catalog-tile catalog-tile--accent">
            <span>Ваша сумма</span>
          </div>
          <div className="catalog-tile catalog-tile--outline">
            <span>сертификат</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogPage
