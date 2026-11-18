import { createContext, createElement, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { products } from './data/catalog'

export const CART_STORAGE_KEY = 'chef-kuhnya.cart.v1'
export const MAX_QUANTITY = 99
export type CartContents = Record<string, number>

const productsById = new Map(products.map((product) => [product.id, product]))

export function setCartQuantity(cart: CartContents, id: string, quantity: number): CartContents {
  if (!productsById.has(id) || !Number.isSafeInteger(quantity)) return cart

  const nextQuantity = Math.max(0, Math.min(quantity, MAX_QUANTITY))
  if ((cart[id] ?? 0) === nextQuantity) return cart

  const next = { ...cart }
  if (nextQuantity === 0) delete next[id]
  else next[id] = nextQuantity
  return next
}

export function addCartQuantity(cart: CartContents, id: string, quantity = 1): CartContents {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return cart
  return setCartQuantity(cart, id, (cart[id] ?? 0) + Math.min(quantity, MAX_QUANTITY))
}

export function parseCart(raw: string | null): CartContents {
  if (!raw) return {}

  try {
    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}

    const cart: CartContents = {}
    for (const [id, quantity] of Object.entries(saved)) {
      if (productsById.has(id) && typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0) {
        cart[id] = Math.min(quantity, MAX_QUANTITY)
      }
    }
    return cart
  } catch {
    return {}
  }
}

export function getCartSummary(cart: CartContents) {
  const lines = Object.entries(cart).flatMap(([id, quantity]) => {
    const product = productsById.get(id)
    return product && quantity > 0 ? [{ product, quantity, subtotal: product.price * quantity }] : []
  })
  return {
    lines,
    count: lines.reduce((count, line) => count + line.quantity, 0),
    total: lines.reduce((total, line) => total + line.subtotal, 0),
  }
}

function loadCart() {
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return {}
  }
}

type DemoReceipt = { count: number; total: number }

type CartContextValue = ReturnType<typeof getCartSummary> & {
  quantities: CartContents
  add: (id: string, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  completeDemo: () => boolean
  demoReceipt: DemoReceipt | null
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState(loadCart)
  const [demoReceipt, setDemoReceipt] = useState<DemoReceipt | null>(null)
  const summary = getCartSummary(quantities)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities))
    } catch {
      // The basket remains usable in memory if browser storage is unavailable.
    }
  }, [quantities])

  const value: CartContextValue = {
    ...summary,
    quantities,
    demoReceipt,
    add: (id, quantity) => setQuantities((cart) => addCartQuantity(cart, id, quantity)),
    setQuantity: (id, quantity) => setQuantities((cart) => setCartQuantity(cart, id, quantity)),
    completeDemo: () => {
      if (summary.count === 0) return false
      setDemoReceipt({ count: summary.count, total: summary.total })
      return true
    },
  }
  return createElement(CartContext.Provider, { value }, children)
}

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('CartProvider is missing')
  return cart
}
