/**
 * Extract safe color / background-color from a Lexical TextNode style string
 * for Markdown HTML span export / import.
 */

const ALLOWED_PROPS = ['color', 'background-color'] as const;

function isSafeCssColorValue(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 128) return false;
  // Block quotes / CSS injection / url() etc.
  if (/["'<>\\]|url\s*\(|expression\s*\(|@import/i.test(v)) return false;
  // Allow common color forms: #rgb(a), rgb()/rgba()/hsl()/hsla(), named colors
  return /^(#[\dA-Fa-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[A-Za-z]+)$/.test(v);
}

/**
 * Parse CSS declarations; return only whitelisted color props with safe values.
 */
export function pickExportableTextStyles(cssText: string | null | undefined): {
  'background-color'?: string;
  'color'?: string;
} {
  if (!cssText?.trim()) return {};

  const out: { 'background-color'?: string; 'color'?: string } = {};
  for (const part of cssText.split(';')) {
    if (!part.trim()) continue;
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    const key = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    if (!(ALLOWED_PROPS as readonly string[]).includes(key)) continue;
    if (!isSafeCssColorValue(value)) continue;
    if (key === 'color') out.color = value;
    if (key === 'background-color') out['background-color'] = value;
  }
  return out;
}

/**
 * Build `style="..."` inner content for a span, or empty if nothing to export.
 */
export function buildSpanStyleAttribute(cssText: string | null | undefined): string {
  const picked = pickExportableTextStyles(cssText);
  const parts: string[] = [];
  if (picked.color) parts.push(`color: ${picked.color}`);
  if (picked['background-color']) {
    parts.push(`background-color: ${picked['background-color']}`);
  }
  return parts.join('; ');
}

/** Pull style="..." / style='...' from an opening span tag. */
export function extractStyleFromSpanOpenTag(htmlOpenTag: string): string {
  if (!/^<span\b/i.test(htmlOpenTag.trim())) return '';
  const dbl = /\bstyle\s*=\s*"([^"]*)"/i.exec(htmlOpenTag);
  if (dbl) return buildSpanStyleAttribute(dbl[1]);
  const sgl = /\bstyle\s*=\s*'([^']*)'/i.exec(htmlOpenTag);
  if (sgl) return buildSpanStyleAttribute(sgl[1]);
  return '';
}
