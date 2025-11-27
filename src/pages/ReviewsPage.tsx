import { useEffect, useState } from 'react'
import { useUserProfile } from '../context/UserContext'
import { API } from '../utils/api'

interface Review {
  id: number
  user_id: number
  artist_id: number | null
  work_id: number | null
  rating: number
  content: string | null
  is_published: boolean
  created_at: string
  user_name?: string
  artist_name?: string
}

const ReviewsPage = () => {
  const { telegramUserId } = useUserProfile()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await API.reviews.getAll({ published: true })
      if (data && Array.isArray(data)) {
        setReviews(data)
      } else if (data && 'reviews' in data && Array.isArray((data as any).reviews)) {
        setReviews((data as any).reviews)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (rating: number, content: string) => {
    if (!telegramUserId) {
      setError('Необходима авторизация')
      return
    }

    try {
      await API.reviews.create(
        {
          rating,
          content: content || null,
        },
        telegramUserId
      )
      setShowForm(false)
      loadReviews()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  return (
    <div className="page page--reviews">
      <h1 className="page__title">ОТЗЫВЫ</h1>

      {loading && <div className="info-banner">Загружаем отзывы...</div>}
      {error && <div className="info-banner info-banner--error">{error}</div>}

      {telegramUserId && !showForm && (
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: '1rem' }}
        >
          Оставить отзыв
        </button>
      )}

      {showForm && (
        <ReviewForm
          onSubmit={handleSubmitReview}
          onCancel={() => setShowForm(false)}
        />
      )}

      {reviews.length === 0 && !loading && (
        <div className="info-banner">Пока нет отзывов. Будьте первым!</div>
      )}

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-card__header">
              <div>
                <span className="review-card__author">
                  {review.user_name || `Пользователь #${review.user_id}`}
                </span>
                <div className="review-card__rating">
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>
              <span className="review-card__date">
                {new Date(review.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {review.content && (
              <p className="review-card__content">{review.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type ReviewFormProps = {
  onSubmit: (rating: number, content: string) => void
  onCancel: () => void
}

const ReviewForm = ({ onSubmit, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(rating, content)
  }

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <div className="review-form__rating">
        <span>Оценка:</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: star <= rating ? '#FFD700' : '#ddd',
              }}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>
      <label className="input input--flat">
        <textarea
          placeholder="Ваш отзыв (необязательно)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="primary-button" style={{ flex: 1 }}>
          Отправить
        </button>
        <button type="button" className="ghost-button" onClick={onCancel} style={{ flex: 1 }}>
          Отмена
        </button>
      </div>
    </form>
  )
}

export default ReviewsPage

