/**
 * "Shared element" transition: moves the avatar and nickname of the loading
 * screen onto their counterparts in the site (e.g. the navbar), resizing them
 * to match, while the rest of the gate fades out.
 */

export interface RevealTarget {
  /** Element inside the gate, marked with `data-cg-source="<key>"`. */
  key: string
  /** CSS selector of the element in the site it flies to. */
  selector: string
  /** Measure the text itself instead of the element box (for headings). */
  text?: boolean
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

export const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Box of the element, or of its text content when `text` is set (block headings are wider than their text). */
function measure(el: HTMLElement, text?: boolean): DOMRect {
  if (text) {
    try {
      const range = document.createRange()
      range.selectNodeContents(el)
      const rect = range.getBoundingClientRect()
      if (rect.width > 0) return rect
    } catch {
      /* fall back to the element box */
    }
  }
  return el.getBoundingClientRect()
}

/**
 * Starts the flight. Returns a cleanup function that restores the site's elements.
 * Pairs whose source or target cannot be found are skipped (they simply fade).
 */
export function flyToTargets(root: HTMLElement, targets: RevealTarget[], durationMs: number): () => void {
  if (prefersReducedMotion()) return () => {}

  const restore: (() => void)[] = []

  for (const { key, selector, text } of targets) {
    const source = root.querySelector<HTMLElement>(`[data-cg-source="${key}"]`)
    const target = document.querySelector<HTMLElement>(selector)
    if (!source || !target) continue

    const from = measure(source, text)
    const to = measure(target, text)
    if (from.width === 0 || to.width === 0) continue

    const scale = to.width / from.width
    const dx = to.left - from.left
    const dy = to.top + (to.height - from.height * scale) / 2 - from.top
    const targetStyle = getComputedStyle(target)

    source.style.transformOrigin = '0 0'
    source.style.transition = ['transform', 'border-radius', 'color'].map((p) => `${p} ${durationMs}ms ${EASE}`).join(', ')
    void source.offsetWidth // commit the starting state before changing it

    source.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
    source.style.color = targetStyle.color
    // The source is scaled, so its radius is divided by the scale to look right at the end.
    const radius = parseFloat(targetStyle.borderTopLeftRadius)
    if (!Number.isNaN(radius) && !targetStyle.borderTopLeftRadius.endsWith('%')) {
      source.style.borderRadius = `${radius / scale}px`
    }

    // Hide the real element until the flying copy lands on it.
    const previousVisibility = target.style.visibility
    target.style.visibility = 'hidden'
    restore.push(() => {
      target.style.visibility = previousVisibility
    })
  }

  return () => restore.forEach((fn) => fn())
}
