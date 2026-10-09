/**
 * Scroll the current selection into view, centered vertically in the viewport
 * @param offsetY Optional vertical offset from center (default: 0)
 */
export function scrollIntoView(offsetY: number = 0) {
  // Skip on server side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // If selection has no visible rect, try to get it from the focus node
  if (rect.height === 0 && rect.width === 0) {
    const focusNode = selection.focusNode;
    if (focusNode) {
      const element =
        focusNode.nodeType === Node.ELEMENT_NODE
          ? (focusNode as HTMLElement)
          : focusNode.parentElement;

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return;
  }

  // Calculate the center position of the selection
  const selectionCenter = rect.top + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;

  // Calculate scroll amount needed to center the selection
  const scrollAmount = selectionCenter - viewportCenter + offsetY;

  // Perform smooth scroll
  window.scrollBy({
    behavior: 'smooth',
    top: scrollAmount,
  });
}

function isScrollable(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY || el.style.overflowY || el.style.overflow;
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
}

function getSelectionClientRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    const focusNode = selection.focusNode;
    if (!focusNode) return null;
    const el =
      focusNode.nodeType === Node.ELEMENT_NODE ? (focusNode as Element) : focusNode.parentElement;
    return el?.getBoundingClientRect() ?? null;
  }
  return rect;
}

/**
 * Keep the caret above the bottom of the nearest scroll parent.
 * Lexical's built-in scrollIntoViewIfNeeded only scrolls when the caret
 * crosses the container edge (no nested scroll-padding), so Enter at the
 * bottom of the viewport leaves the caret glued to the edge.
 */
export function ensureSelectionVisibleInScrollParent(paddingBottom: number = 96): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const rect = getSelectionClientRect();
  if (!rect) return;

  let el: Element | null = document.activeElement;
  if (!(el instanceof Element)) return;

  // Walk from focused editor root / caret node up to find scroll parents
  while (el && el !== document.body && el !== document.documentElement) {
    if (isScrollable(el)) {
      const host = el.getBoundingClientRect();
      const limit = host.bottom - paddingBottom;
      if (rect.bottom > limit) {
        el.scrollTop += rect.bottom - limit;
      }
      const topLimit = host.top + Math.min(48, paddingBottom / 2);
      if (rect.top < topLimit) {
        el.scrollTop -= topLimit - rect.top;
      }
    }
    el = el.parentElement;
  }
}
