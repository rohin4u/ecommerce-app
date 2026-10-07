import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminPage from './pages/AdminPage'
import ProductPage from './ProductPage'

const path = window.location.pathname
const productId = Number(path.split('/').filter(Boolean)[0])
const page =
  path === '/admin'
    ? <AdminPage />
    : Number.isInteger(productId) && productId > 0
      ? <ProductPage productId={productId} />
      : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
