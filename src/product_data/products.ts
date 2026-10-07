import type { Product } from '../products_type/product'

export const products: Product[] = [
  {
    id: 101,
    name: 'Wireless Headphones',
    price: 2499,
    emoji: '🎧',
    description: 'Wireless headphones with clear sound.',
    image: '🎧',
    images: ['🎧', '🎵', '🔊'],
  },
  {
    id: 102,
    name: 'Smart Watch',
    price: 3999,
    emoji: '⌚',
    description: 'Advanced smartwatch with health monitoring.',
    image: '⌚',
    images: ['⌚', '❤️', '�'],
  },
  {
    id: 103,
    name: 'Running Shoes',
    price: 3999,
    emoji: '👟',
    description: 'Comfortable shoes for everyday running.',
    image: '👟',
    images: ['👟', '🏃', '👞'],
  },
  {
    id: 104,
    name: 'Backpack',
    price: 1499,
    emoji: '🎒',
    description: 'Durable backpack for everyday use.',
    image: '🎒',
    images: ['👟', '🏃', '👞'],
  }
]