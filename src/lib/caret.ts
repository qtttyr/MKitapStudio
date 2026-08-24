/** Пиксельная Y-координата каретки внутри textarea (через зеркало-див). */
export function caretY(el: HTMLTextAreaElement, pos: number): number {
  const div = document.createElement('div')
  const cs = window.getComputedStyle(el)

  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderWidth', 'boxSizing', 'whiteSpace', 'wordWrap', 'wordBreak', 'tabSize',
  ] as const
  for (const p of props) {
    ;(div.style as unknown as Record<string, string>)[p] = cs[p] as string
  }

  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.height = 'auto'
  div.style.width = `${el.clientWidth}px`
  div.style.whiteSpace = 'pre-wrap'

  div.textContent = el.value.substring(0, pos)
  const span = document.createElement('span')
  span.textContent = el.value.substring(pos) || '.'
  div.appendChild(span)

  document.body.appendChild(div)
  const y = span.offsetTop
  div.remove()
  return y
}
