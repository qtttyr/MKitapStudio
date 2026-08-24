import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { subscribeToasts, type ToastItem } from '../lib/toastBus'

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    return subscribeToasts((t) => {
      setItems((prev) => [...prev.slice(-2), t])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, 3400)
    })
  }, [])

  if (items.length === 0) return null
  return (
    <div className="toaster" role="status">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.sparkle && <Sparkles size={15} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
