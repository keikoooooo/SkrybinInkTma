import { useCart } from '../context/CartContext'

interface AddToCartButtonProps {
  productId: number
  title: string
  priceCents: number
}

const AddToCartButton = ({ productId, title, priceCents }: AddToCartButtonProps) => {
  const { addItem } = useCart()

  const handleAdd = () => {
    addItem({
      product_id: productId,
      title,
      price_cents: priceCents,
    })
  }

  return (
    <button type="button" className="ghost-button ghost-button--small" onClick={handleAdd}>
      Добавить
    </button>
  )
}

export default AddToCartButton





