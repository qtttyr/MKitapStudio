/* Крошечная шина тостов: toast() из любого места, <Toaster/> слушает. */

export type ToastItem = { id: number; text: string; sparkle?: boolean }

type Listener = (t: ToastItem) => void

let listeners: Listener[] = []
let seq = 0

export function toast(text: string, opts?: { sparkle?: boolean }): void {
  const t: ToastItem = { id: ++seq, text, sparkle: opts?.sparkle }
  listeners.forEach((fn) => fn(t))
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}
