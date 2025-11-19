import { useEffect, useState } from 'react'
import { API } from '../utils/api'
import AddToCartButton from '../components/AddToCartButton'

type CatalogItem = {
  id: number
  title: string
  description: string | null
  price_cents: number
  product_type: string
  style: string | null
}

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
    let mounted = true

    const loadCatalog = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await API.catalog.get()
        if (mounted && data.ok && Array.isArray(data.items)) {
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
                    <AddToCartButton productId={item.id} title={item.title} priceCents={item.price_cents} />
                  </footer>
              </article>
            ))}
          </div>
        )}
      </>
    </div>
  )
}

export default CatalogPage
