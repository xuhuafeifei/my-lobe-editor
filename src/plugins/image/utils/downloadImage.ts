function guessFilename(src: string): string {
  try {
    const pathname = new URL(src, window.location.href).pathname;
    const base = pathname.split('/').pop() || '';
    if (base && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(base)) {
      return decodeURIComponent(base);
    }
  } catch {
    // ignore
  }
  return `image-${Date.now()}.png`;
}

/**
 * Download an image URL. Prefers fetch→blob (works for same-origin / CORS-enabled).
 * Falls back to opening the URL when fetch is blocked.
 */
export async function downloadImage(src: string, filename?: string): Promise<void> {
  if (!src) return;
  const name = filename || guessFilename(src);

  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name;
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Cross-origin without CORS: trigger navigation download / new tab
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.append(a);
    a.click();
    a.remove();
  }
}
