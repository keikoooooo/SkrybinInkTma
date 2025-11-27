import { useEffect, useState } from 'react'
import { API } from '../utils/api'
import AddToCartButton from '../components/AddToCartButton'
import { useUserProfile } from '../context/UserContext'

type CatalogItem = {
  id: number
  title: string
  description: string | null
  price_cents: number
  product_type: string
  style: string | null
}

const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { role, telegramUserId } = useUserProfile()
  const isAdmin = role === 'admin'

  const loadCatalog = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await API.catalog.get()
      if (data.ok && Array.isArray(data.items)) {
        setItems(data.items)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  const handleDelete = async (id: number) => {
    if (!isAdmin || !telegramUserId || !confirm('Удалить этот товар?')) return

    try {
      await API.admin.products.delete(id, telegramUserId)
      setItems(items.filter((item) => item.id !== id))
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item)
  }

  const handleSaveEdit = async (updatedItem: Partial<CatalogItem>) => {
    if (!isAdmin || !telegramUserId || !editingItem) return

    try {
      await API.admin.products.update(
        editingItem.id,
        {
          title: updatedItem.title,
          description: updatedItem.description ?? '',
          price_cents: updatedItem.price_cents,
        },
        telegramUserId
      )
      setEditingItem(null)
      loadCatalog()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleAdd = async (newItem: { title: string; description: string; price_cents: number }) => {
    if (!isAdmin || !telegramUserId) return

    try {
      await API.admin.products.create(
        {
          title: newItem.title,
          description: newItem.description || null,
          price_cents: newItem.price_cents,
          product_type: 'session',
          is_active: true,
        },
        telegramUserId
      )
      setIsAddModalOpen(false)
      loadCatalog()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  return (
    <div className="page page--catalog">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page__title">АССОРТИМЕНТ</h1>
        {isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsAddModalOpen(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            + Добавить
          </button>
        )}
      </div>

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="product-card__title">{item.title}</span>
                      {item.style && <span className="product-card__tag">{item.style}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="ghost-button ghost-button--small"
                        onClick={() => handleEdit(item)}
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.85rem',
                          minWidth: '40px',
                          border: '1px solid #111111'
                        }}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="ghost-button ghost-button--small"
                        onClick={() => handleDelete(item.id)}
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.85rem',
                          minWidth: '40px',
                          border: '1px solid #a31621',
                          color: '#a31621'
                        }}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </header>
                {editingItem?.id === item.id ? (
                  <EditProductForm
                    item={item}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <>
                    <p className="product-card__description">{item.description ?? 'Описание скоро появится'}</p>
                    <footer className="product-card__footer">
                      <span className="product-card__price">{(item.price_cents / 100).toLocaleString('ru-RU')} ₽</span>
                      {!isAdmin && (
                        <AddToCartButton productId={item.id} title={item.title} priceCents={item.price_cents} />
                      )}
                    </footer>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </>

      {isAddModalOpen && (
        <AddProductModal
          onSave={handleAdd}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  )
}

type EditProductFormProps = {
  item: CatalogItem
  onSave: (updated: Partial<CatalogItem>) => void
  onCancel: () => void
}

const EditProductForm = ({ item, onSave, onCancel }: EditProductFormProps) => {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description || '')
  const [price, setPrice] = useState((item.price_cents / 100).toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description: description || null,
      price_cents: Math.round(parseFloat(price) * 100),
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
      <label className="input input--flat">
        <input
          type="text"
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="input input--flat">
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </label>
      <label className="input input--flat">
        <input
          type="number"
          placeholder="Цена (руб)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          required
        />
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="primary-button" style={{ flex: 1, padding: '0.5rem' }}>
          Сохранить
        </button>
        <button type="button" className="ghost-button" onClick={onCancel} style={{ flex: 1, padding: '0.5rem' }}>
          Отмена
        </button>
      </div>
    </form>
  )
}

type AddProductModalProps = {
  onSave: (item: { title: string; description: string; price_cents: number }) => void
  onCancel: () => void
}

const AddProductModal = ({ onSave, onCancel }: AddProductModalProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description,
      price_cents: Math.round(parseFloat(price) * 100),
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <h2 style={{ marginTop: 0 }}>Добавить товар</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="input input--flat">
            <input
              type="text"
              placeholder="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="input input--flat">
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <label className="input input--flat">
            <input
              type="number"
              placeholder="Цена (руб)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="primary-button" style={{ flex: 1 }}>
              Добавить
            </button>
            <button type="button" className="ghost-button" onClick={onCancel} style={{ flex: 1 }}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CatalogPage