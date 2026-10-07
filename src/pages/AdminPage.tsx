import { useEffect, useState } from 'react'
import type { Product } from '../products_type/product'
import { createProduct as createProductApi, deleteProduct as deleteProductApi, loadProducts, updateProduct } from '../product_data/productStore'
import './admin.css'

const emptyProduct: Product = {
  id: 0,
  name: '',
  price: 0,
  emoji: '📦',
  description: '',
  image: '📦',
  images: ['📦'],
}

function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState(0)
  const [draft, setDraft] = useState<Product>(emptyProduct)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    loadProducts()
      .then((loadedProducts) => {
        setProducts(loadedProducts)
        if (loadedProducts[0]) {
          setSelectedId(loadedProducts[0].id)
          setDraft(loadedProducts[0])
        }
      })
      .catch(() => setNotice('Could not connect to the product API.'))
  }, [])

  const selectProduct = (product: Product): void => {
    setSelectedId(product.id)
    setDraft(product)
    setNotice('')
  }

  const updateDraft = <Key extends keyof Product>(key: Key, value: Product[Key]): void => {
    setDraft((previousDraft) => ({ ...previousDraft, [key]: value }))
  }

  const getStoredImagePath = (file: File): string => `/images/${file.name.trim().replace(/\s+/g, '-')}`

  const handleMainImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const path = getStoredImagePath(file)
    updateDraft('image', path)
    setNotice(`Main image path saved: ${path}`)
    event.target.value = ''
  }

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) {
      return
    }

    const paths = files.map((file) => getStoredImagePath(file))
    updateDraft('images', [...draft.images, ...paths])
    setNotice(`${paths.length} image path${paths.length > 1 ? 's were' : ' was'} saved to the gallery.`)
    event.target.value = ''
  }

  const saveDraft = async (): Promise<void> => {
    if (!draft.name.trim() || draft.price < 0) {
      setNotice('Add a product name and a valid price before saving.')
      return
    }

    try {
      const payload = {
        name: draft.name.trim(),
        price: Number(draft.price),
        emoji: draft.emoji.trim() || '📦',
        description: draft.description.trim(),
        image: draft.image.trim() || draft.emoji.trim() || '📦',
        images: draft.images.map((image) => image.trim()).filter(Boolean),
      }

      const savedProduct = draft.id === 0
        ? await createProductApi(payload)
        : await updateProduct({ ...draft, ...payload })

      const nextProducts = draft.id === 0
        ? [...products, savedProduct]
        : products.map((product) => (product.id === savedProduct.id ? savedProduct : product))

      setProducts(nextProducts)
      setSelectedId(savedProduct.id)
      setDraft(savedProduct)
      setNotice(draft.id === 0 ? 'Product created through the API.' : 'Product details saved through the API.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create product.'
      setNotice(draft.id === 0 ? message : `Could not save product details: ${message}`)
    }
  }

  const createProduct = async (): Promise<void> => {
    const blankProduct: Product = {
      id: 0,
      name: '',
      price: 0,
      emoji: '📦',
      description: '',
      image: '📦',
      images: ['📦'],
    }

    setDraft(blankProduct)
    setSelectedId(0)
    setNotice('Enter product details and click Save changes.')
  }

  const deleteProduct = async (): Promise<void> => {
    if (products.length === 1) {
      setNotice('Keep at least one product in the catalog.')
      return
    }

    try {
      await deleteProductApi(selectedId)
      const nextProducts = products.filter((product) => product.id !== selectedId)
      setProducts(nextProducts)
      selectProduct(nextProducts[0])
      setNotice('Product removed through the API.')
    } catch {
      setNotice('Could not remove product.')
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={() => window.location.assign('/')}>
          ShopZone
        </button>
        <p className="admin-eyebrow">Control center</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="admin-nav-active" href="#overview">Overview</a>
          <a href="#catalog">Products</a>
          <a href="#settings">Settings</a>
        </nav>
        <button className="admin-store-link" type="button" onClick={() => window.location.assign('/')}>
          View storefront
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header" id="overview">
          <div>
            <p className="admin-kicker">Tuesday, September 22</p>
            <h1>Good morning, admin.</h1>
            <p className="admin-subtitle">Keep your product catalog fresh and ready to sell.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={createProduct}>
            + Add product
          </button>
        </header>

        <section className="admin-stats" aria-label="Store overview">
          <article className="admin-stat-card"><span>Catalog items</span><strong>{products.length}</strong><small>Active products</small></article>
          <article className="admin-stat-card"><span>Catalog value</span><strong>₹{products.reduce((total, product) => total + product.price, 0).toLocaleString('en-IN')}</strong><small>Across all products</small></article>
          <article className="admin-stat-card"><span>Last update</span><strong>Today</strong><small>Changes save instantly</small></article>
        </section>

        <section className="admin-workspace" id="catalog">
          <div className="catalog-panel">
            <div className="panel-heading">
              <div><p className="admin-kicker">Inventory</p><h2>Product catalog</h2></div>
              <span>{products.length} items</span>
            </div>
            <div className="catalog-list">
              {products.map((product) => (
                <button
                  className={`catalog-item ${product.id === selectedId ? 'catalog-item-selected' : ''}`}
                  key={product.id}
                  type="button"
                  onClick={() => selectProduct(product)}
                >
                  <span className="catalog-emoji">{product.emoji}</span>
                  <span className="catalog-item-copy"><strong>{product.name || 'Untitled product'}</strong><small>#{product.id}</small></span>
                  <span className="catalog-price">₹{product.price.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="editor-panel" id="settings">
            <div className="panel-heading">
              <div><p className="admin-kicker">Editor</p><h2>Product details</h2></div>
              <button className="text-button" type="button" onClick={deleteProduct}>Delete</button>
            </div>
            <div className="admin-form">
              <label>Product name<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Wireless Headphones" /></label>
              <div className="form-row">
                <label>Price (INR)<input type="number" min="0" value={draft.price} onChange={(event) => updateDraft('price', Number(event.target.value))} /></label>
                <label>Product emoji<input value={draft.emoji} onChange={(event) => updateDraft('emoji', event.target.value)} maxLength={4} /></label>
              </div>
              <label>Description<textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} rows={4} placeholder="Describe the product..." /></label>
              <label>
                Main image / emoji
                <input value={draft.image} onChange={(event) => updateDraft('image', event.target.value)} />
              </label>
              <label className="upload-field">
                Upload main image
                <input type="file" accept="image/*" onChange={handleMainImageUpload} />
              </label>
              <label>
                Gallery images
                <span className="field-hint">Separate each image with a comma</span>
                <input value={draft.images.join(', ')} onChange={(event) => updateDraft('images', event.target.value.split(',').map((image) => image.trim()).filter(Boolean))} />
              </label>
              <label className="upload-field">
                Upload gallery images
                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
              </label>
              {notice && <p className="admin-notice" role="status">{notice}</p>}
              <div className="editor-actions"><button className="admin-primary-button" type="button" onClick={saveDraft}>Save changes</button></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminPage