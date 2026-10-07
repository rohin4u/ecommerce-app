import type { Product } from '../products_type/product'
import './product-detail.css'

type ProductDetailPageProps = {
  product: Product
}

function ProductDetailPage({ product }: ProductDetailPageProps) {
  const toDisplayImageUrl = (value: string): string => {
    const cleaned = value.trim()

    if (!cleaned) {
      return ''
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned
    }

    const normalized = cleaned.replace(/\\/g, '/')
    const localFallback = normalized.match(/^(?:\/)?images\/(.+)\.webp$/i)
      ? normalized.replace(/\.webp$/i, '.svg')
      : normalized

    if (localFallback.startsWith('/images/')) {
      return new URL(localFallback, window.location.origin).toString()
    }

    if (localFallback.startsWith('images/')) {
      return new URL(`/${localFallback}`, window.location.origin).toString()
    }

    if (localFallback.startsWith('/')) {
      return `${(import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')}${localFallback}`
    }

    const windowsMatch = normalized.match(/^[a-zA-Z]:\/.+\/([^/]+)$/)
    if (windowsMatch?.[1]) {
      return `${(import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')}/images/${windowsMatch[1]}`
    }

    const fileMatch = normalized.match(/(?:^|\/)([^/]+\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:\?.*)?)$/i)
    if (fileMatch?.[1]) {
      return `${(import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')}/images/${fileMatch[1]}`
    }

    return cleaned
  }

  const isImageReference = (value: string): boolean => {
    const cleaned = value.trim()
    if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) {
      return false
    }

    return /^(https?:\/\/|\/|\.\.?\/)/.test(cleaned) || /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i.test(cleaned)
  }

  return (
    <>
      <nav className="detail-navbar">
        <button className="brand-link" type="button" onClick={() => window.location.assign('/')}>
          ShopZone
        </button>

        <button className="back-link" type="button" onClick={() => window.location.assign('/')}>
          ← Back to products
        </button>
      </nav>

      <main className="product-detail-page">
        <section className="product-detail-card">
          <div className="product-gallery">
            {isImageReference(product.image) ? (
              <img
                className="product-main-image"
                src={toDisplayImageUrl(product.image)}
                alt={product.name}
                style={{ width: '100%', height: '360px', objectFit: 'cover', borderRadius: '18px' }}
              />
            ) : (
              <div className="product-main-image">{product.image || product.emoji}</div>
            )}

            <div className="product-thumbnail-row">
              {product.images.map((image, index) => (
                isImageReference(image) ? (
                  <img
                    className="product-thumbnail"
                    key={`${product.id}-${index}`}
                    src={toDisplayImageUrl(image)}
                    alt={`${product.name} gallery ${index + 1}`}
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                ) : (
                  <div className="product-thumbnail" key={`${product.id}-${index}`}>
                    {image}
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="product-detail-text">
            <span className="detail-badge">Featured Product</span>
            <h1>{product.name}</h1>
            <p className="detail-price">₹{product.price.toLocaleString('en-IN')}</p>
            <p className="detail-description">{product.description}</p>

            <div className="detail-actions">
              <button type="button" className="primary-button">
                Add to Cart
              </button>
              <button type="button" className="secondary-button" onClick={() => window.location.assign('/')}>
                Continue Shopping
              </button>
            </div>

            <ul className="detail-features">
              <li>Free delivery on orders above ₹999</li>
              <li>30-day easy return policy</li>
              <li>1-year manufacturer warranty</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  )
}

export default ProductDetailPage
