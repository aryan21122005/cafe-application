import { createContext, useContext, useMemo, useState } from 'react'

const CustomerCartContext = createContext(null)

export function CustomerCartProvider({ children }) {
  const [cart, setCart] = useState({})
  const [cafeId, setCafeId] = useState(null)
  const [cafeName, setCafeName] = useState('')

  const value = useMemo(() => {
    function add(item, nextCafeId, nextCafeName) {
      if (!item || item.id == null) return
      if (nextCafeId == null) return

      if (cafeId != null && cafeId !== nextCafeId) {
        return
      }
      if (cafeId == null) {
        setCafeId(nextCafeId)
        setCafeName(String(nextCafeName || ''))
      }
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
      setCafeId(null)
      setCafeName('')
    }

    function countItems() {
      return Object.values(cart || {}).reduce((a, v) => a + (Number(v?.qty) || 0), 0)
    }

    function totalAmount() {
      return Object.values(cart || {}).reduce((a, v) => a + (Number(v?.qty) || 0) * (Number(v?.item?.price) || 0), 0)
    }

    return { cart, setCart, cafeId, cafeName, add, inc, dec, clear, countItems, totalAmount }
  }, [cart, cafeId, cafeName])

  return <CustomerCartContext.Provider value={value}>{children}</CustomerCartContext.Provider>
}

export function useCustomerCart() {
  const ctx = useContext(CustomerCartContext)
  if (!ctx) throw new Error('useCustomerCart must be used inside CustomerCartProvider')
  return ctx
}
