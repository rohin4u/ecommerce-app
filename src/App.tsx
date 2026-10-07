
import { useEffect, useState } from 'react'
import './App.css'
import type { Product } from './products_type/product'
import { loadProducts } from './product_data/productStore'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Product[]>([])

  useEffect(() => {
    loadProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const addToCart = (product: Product): void => {
    setCart((previousCart) => [...previousCart, product])
  }

  const removeFromCart = (productId: number): void => {
    setCart((previousCart) => {
      const itemIndex = previousCart.findLastIndex((item) => item.id === productId)

      if (itemIndex === -1) {
        return previousCart
      }

      return previousCart.filter((_, index) => index !== itemIndex)
    })
  }

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

  const openProductPage = (productId: number): void => {
    window.location.assign(`/${productId}`)
  }

  return (
    <div>
      <nav className="navbar">
        <h2>ShopZone</h2>

        <div className="nav-actions">
          <input aria-label="Search products" placeholder="Search products..." />
          <button type="button" className="admin-link" onClick={() => window.location.assign('/admin')}>
            Admin
          </button>
          <button type="button" className="cart-button">
            <span>Cart</span>
            <strong>({cart.length})</strong>
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">✨ Everything You Need</span>

          <h1>
            Discover Amazing
            <br />
            Products, Delivered
            <br />
            to <span>Your Door</span>
          </h1>

          <p>
            Shop the latest trends, best deals, and top quality products all in one place.
          </p>

          <button
            className="shop-now"
            onClick={() =>
              document.getElementById('products')?.scrollIntoView({
                behavior: 'smooth',
              })
            }
          >
            Shop Now →
          </button>
        </div>
      </section>

      <main className="products" id="products">
        <h2>Our Products</h2>

        <div className="product-grid">
          {products.map((product) => (
            <div
              className="product-card"
              key={product.id}
              onClick={() => openProductPage(product.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openProductPage(product.id)
                }
              }}
            >
              {isImageReference(product.image) ? (
                <img
                  className="product-image"
                  src={toDisplayImageUrl(product.image)}
                  alt={product.name}
                  style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '18px' }}
                />
              ) : (
                <div className="product-image">{product.image || product.emoji}</div>
              )}

              <h3>{product.name}</h3>
              <p>₹{product.price.toLocaleString('en-IN')}</p>

              <div className="product-actions">
                <button
                  type="button"
                  className="qty-btn qty-btn-add"
                  onClick={(event) => {
                    event.stopPropagation()
                    addToCart(product)
                  }}
                  aria-label={`Add ${product.name} to cart`}
                >
                  +
                </button>

                <button
                  type="button"
                  className="qty-btn qty-btn-remove"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeFromCart(product.id)
                  }}
                  aria-label={`Remove ${product.name} from cart`}
                >
                  -
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App