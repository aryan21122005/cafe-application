import { createContext, createElement, useContext, useMemo, useState } from 'react'

const CustomerCartContext = createContext(null)

export function CustomerCartProvider({ children }) {
  const [cart, setCart] = useState({})

  const value = useMemo(() => {
    function add(item) {
      if (!item || item.id == null) return
      setCart((prev) => {
        const next = { ...(prev || {}) }
        const key = String(item.id)
        const existing = next[key]
        if (existing) {
          next[key] = { ...existing, qty: (Number(existing.qty) || 0) + 1 }
        } else {
          next[key] = { item, qty: 1 }
        }
        return next
      })
    }

    function inc(itemId) {
      setCart((prev) => {
        const next = { ...(prev || {}) }
        const key = String(itemId)
        const existing = next[key]
        if (!existing) return next
        next[key] = { ...existing, qty: (Number(existing.qty) || 0) + 1 }
        return next
      })
    }

    function dec(itemId) {
      setCart((prev) => {
        const next = { ...(prev || {}) }
        const key = String(itemId)
        const existing = next[key]
        if (!existing) return next
        const q = (Number(existing.qty) || 0) - 1
        if (q <= 0) delete next[key]
        else next[key] = { ...existing, qty: q }
        return next
      })
    }

    function clear() {
      setCart({})
    }

    function countItems() {
      return Object.values(cart || {}).reduce((a, v) => a + (Number(v?.qty) || 0), 0)
    }

    function totalAmount() {
      return Object.values(cart || {}).reduce((a, v) => a + (Number(v?.qty) || 0) * (Number(v?.item?.price) || 0), 0)
    }

    return { cart, setCart, add, inc, dec, clear, countItems, totalAmount }
  }, [cart])

  return createElement(CustomerCartContext.Provider, { value }, children)
}

export function useCustomerCart() {
  const ctx = useContext(CustomerCartContext)
  if (!ctx) throw new Error('useCustomerCart must be used inside CustomerCartProvider')
  return ctx
}
