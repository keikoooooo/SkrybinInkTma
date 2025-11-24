import { useNavigate } from 'react-router-dom'

interface AddToCartButtonProps {
  productId: number
  title: string
  priceCents: number
}

const AddToCartButton = ({ productId, title, priceCents }: AddToCartButtonProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/order/create/${productId}?title=${encodeURIComponent(title)}&priceCents=${priceCents}`)
  }

  return (
    <button type="button" className="ghost-button ghost-button--small" onClick={handleClick}>
      Заказать
    </button>
  )
}

export default AddToCartButton







