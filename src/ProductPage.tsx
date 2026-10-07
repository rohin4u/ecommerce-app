import { useEffect, useState } from 'react'
import ProductDetailPage from './pages/ProductDetailPage'
import { loadProducts } from './product_data/productStore'
import type { Product } from './products_type/product'

function ProductPage({ productId }: { productId?: number }) {
  const resolvedProductId =
    typeof productId === 'number'
      ? productId
      : Number(window.location.pathname.split('/').pop())
  const isValidProductId = Number.isInteger(resolvedProductId) && resolvedProductId > 0

  const [product, setProduct] = useState<Product | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isValidProductId) {
      setIsLoading(false)
      return
    }

    loadProducts()
      .then((products) => setProduct(products.find((item) => item.id === resolvedProductId)))
      .catch(() => setProduct(undefined))
      .finally(() => setIsLoading(false))
  }, [isValidProductId, resolvedProductId])

  if (isLoading) {
    return <div>Loading product...</div>
  }

  if (!product) {
    return <div>Product not found</div>
  }

  return <ProductDetailPage product={product} />
}

export default ProductPage
