/** Lightweight meta2d helpers — no @meta2d / canvas2svg imports. */

const DEFAULT_STROKE_COLOR = '#1f1f1f';
const DEFAULT_LINE_WIDTH = 1;
const NO_DEFAULT_STROKE_NAMES = new Set(['text']);

export function createEmptyMeta2dData(): Record<string, unknown> {
  return { pens: [] };
}

/** Canonical empty diagram JSON for new blocks and markdown defaults. */
export const EMPTY_META2D_DIAGRAM_JSON = JSON.stringify(createEmptyMeta2dData());

/** Inline SVG used when the canvas has no drawable content yet (HUD + layout need a truthy svg). */
export const EMPTY_META2D_PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="100%" height="100%" fill="#fafafa" stroke="#eee"/></svg>';

/** When loading from markdown without cached svg, use placeholder for empty diagrams to avoid async flicker. */
export function initialSvgForDiagram(diagram: string): string {
  if (!diagram.trim()) return EMPTY_META2D_PLACEHOLDER_SVG;
  try {
    const data = JSON.parse(diagram) as { pens?: unknown[] };
    if (data && Array.isArray(data.pens) && data.pens.length === 0) {
      return EMPTY_META2D_PLACEHOLDER_SVG;
    }
  } catch {
    // ignore
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function shouldApplyDefaultStroke(pen: Record<string, any>): boolean {
  return !NO_DEFAULT_STROKE_NAMES.has(String(pen.name ?? ''));
}

export function normalizeMeta2dPen(pen: Record<string, any>): Record<string, any> {
  if (shouldApplyDefaultStroke(pen)) {
    if (pen.color === undefined && pen.strokeStyle === undefined) {
      pen.color = DEFAULT_STROKE_COLOR;
    }
    if (pen.lineWidth === undefined && pen.strokeStyle !== 'transparent') {
      pen.lineWidth = DEFAULT_LINE_WIDTH;
    }
  }

  if (pen.text && pen.textColor === undefined) {
    pen.textColor = DEFAULT_STROKE_COLOR;
  }

  return pen;
}

export function normalizeMeta2dData(data: unknown): unknown {
  if (!isRecord(data) || !Array.isArray(data.pens)) return data;
  data.pens.forEach((pen) => {
    if (isRecord(pen)) normalizeMeta2dPen(pen);
  });
  return data;
}

export function sanitizeMeta2dData(data: unknown): unknown {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (key === '__meta__' || key === 'calculative') return undefined;
      return value;
    }),
  );
}

export { DEFAULT_STROKE_COLOR };
