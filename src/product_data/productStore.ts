import type { Product } from '../products_type/product'
import { products as seedProducts } from './products'

const STORAGE_KEY = 'shopzone_products'
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')
const PRODUCTS_API_URL = `${API_BASE_URL}/shop_zone/product_admin`

const GET_PRODUCTS_URL = `${PRODUCTS_API_URL}/show_product`
const CREATE_PRODUCT_URL = `${PRODUCTS_API_URL}/save_product`
const UPDATE_PRODUCT_URL = (productId: number): string => `${PRODUCTS_API_URL}/update_product/${productId}`
const DELETE_PRODUCT_URL = (productId: number): string => `${PRODUCTS_API_URL}/delete_product/${productId}`

function readLocalProducts(): Product[] {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY)

    if (!savedProducts) {
      return seedProducts.map((product) => ({ ...product, images: Array.isArray(product.images) ? product.images : [] }))
    }

    const parsedProducts = JSON.parse(savedProducts) as Product[]
    return Array.isArray(parsedProducts) && parsedProducts.length > 0 ? parsedProducts : seedProducts
  } catch {
    return seedProducts.map((product) => ({ ...product, images: Array.isArray(product.images) ? product.images : [] }))
  }
}

function writeLocalProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

function looksLikeImagePath(value: string): boolean {
  const cleaned = value.trim()

  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) {
    return false
  }

  return /^(https?:\/\/|\/|\.\.?\/)/.test(cleaned) || /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i.test(cleaned)
}

function resolveImageUrl(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.replace(/\\/g, '/')
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
    return `${API_BASE_URL}${localFallback}`
  }

  const windowsMatch = normalized.match(/^[a-zA-Z]:\/.+\/([^/]+)$/)
  if (windowsMatch?.[1]) {
    return `${API_BASE_URL}/images/${windowsMatch[1]}`
  }

  const fileMatch = normalized.match(/(?:^|\/)([^/]+\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:\?.*)?)$/i)
  if (fileMatch?.[1]) {
    return `${API_BASE_URL}/images/${fileMatch[1]}`
  }

  return trimmed
}

function normalizeImagePath(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return ''
  }

  return resolveImageUrl(trimmed)
}

function normalizeProduct(product: Record<string, unknown>, fallbackId: number): Product {
  const rawImages = Array.isArray(product.images)
    ? product.images
    : Array.isArray(product.gallery_images)
      ? product.gallery_images
      : Array.isArray(product.image_urls)
        ? product.image_urls
        : []

  const images = rawImages.filter((image): image is string => typeof image === 'string' && Boolean(image.trim()))
  const validImagePaths = images.filter((image) => looksLikeImagePath(image)).map((image) => normalizeImagePath(image))

  const imageValue =
    typeof product.image === 'string' && looksLikeImagePath(product.image)
      ? product.image
      : typeof product.main_image === 'string' && looksLikeImagePath(product.main_image)
        ? product.main_image
        : validImagePaths[0] ?? (typeof product.emoji === 'string' && !looksLikeImagePath(product.emoji) ? product.emoji : '📦')

  const normalizedEmoji = typeof product.emoji === 'string' && product.emoji.trim() && !looksLikeImagePath(product.emoji) ? product.emoji : '📦'
  const rawId = Number(product.id ?? product.product_id ?? product.productId ?? fallbackId)
  const safeId = Number.isFinite(rawId) && rawId > 0 ? rawId : fallbackId

  return {
    id: safeId,
    name: String(product.name ?? product.product_name ?? product.productName ?? 'Untitled product'),
    price: Number(product.price ?? product.product_price ?? product.amount ?? 0),
    emoji: normalizedEmoji,
    description: String(product.description ?? product.product_description ?? product.details ?? ''),
    image: normalizeImagePath(String(imageValue ?? '📦')) || '📦',
    images: validImagePaths,
  }
}

function normalizeProducts(rawProducts: unknown): Product[] {
  const data = Array.isArray(rawProducts)
    ? rawProducts
    : Array.isArray((rawProducts as { data?: unknown })?.data)
      ? (rawProducts as { data: unknown[] }).data
      : []

  return data.map((product, index) => normalizeProduct((product ?? {}) as Record<string, unknown>, index + 1))
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = 'Request failed.'

    try {
      const errorBody = await response.json() as { message?: string; error?: string; detail?: string }
      errorMessage = errorBody.message ?? errorBody.error ?? errorBody.detail ?? errorMessage
    } catch {
      try {
        const text = await response.text()
        if (text) {
          errorMessage = text
        }
      } catch {
        errorMessage = `Request failed with status ${response.status}.`
      }
    }

    throw new Error(errorMessage)
  }

  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>
}

export function loadProducts(): Promise<Product[]> {
  return request<unknown>(GET_PRODUCTS_URL)
    .then((response) => normalizeProducts(response))
    .catch(() => readLocalProducts())
}

export function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const imagePath = normalizeImagePath(product.image) || normalizeImagePath(product.emoji) || '📦'
  const galleryImages = Array.isArray(product.images)
    ? product.images
        .map((image) => normalizeImagePath(image))
        .filter(Boolean)
    : []

  const payload = {
    name: product.name.trim(),
    price: Number(product.price),
    emoji: product.emoji.trim() || '📦',
    description: product.description.trim(),
    image: imagePath,
    images: galleryImages,
  }

  return request<Product>(CREATE_PRODUCT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch(() => {
    const currentProducts = readLocalProducts()
    const nextId = currentProducts.reduce((maxId, currentProduct) => Math.max(maxId, currentProduct.id), 0) + 1
    const savedProduct: Product = {
      id: nextId,
      name: payload.name,
      price: payload.price,
      emoji: payload.emoji,
      description: payload.description,
      image: payload.image,
      images: payload.images,
    }

    writeLocalProducts([...currentProducts, savedProduct])
    return savedProduct
  })
}

export function updateProduct(product: Product): Promise<Product> {
  return request<Product>(UPDATE_PRODUCT_URL(product.id), {
    method: 'PUT',
    body: JSON.stringify(product),
  }).catch(() => {
    const currentProducts = readLocalProducts()
    const nextProducts = currentProducts.map((currentProduct) => currentProduct.id === product.id ? product : currentProduct)
    writeLocalProducts(nextProducts)
    return product
  })
}

export function deleteProduct(productId: number): Promise<void> {
  return request<void>(DELETE_PRODUCT_URL(productId), { method: 'DELETE' }).catch(() => {
    const currentProducts = readLocalProducts().filter((product) => product.id !== productId)
    writeLocalProducts(currentProducts)
    return undefined
  })
}