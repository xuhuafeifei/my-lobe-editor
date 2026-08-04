/**
 * Public meta2d utils.
 * Light helpers are sync; engine (@meta2d/*) loads only via dynamic import when needed.
 */
export {
  createEmptyMeta2dData,
  DEFAULT_STROKE_COLOR,
  EMPTY_META2D_DIAGRAM_JSON,
  EMPTY_META2D_PLACEHOLDER_SVG,
  initialSvgForDiagram,
  normalizeMeta2dData,
  normalizeMeta2dPen,
  sanitizeMeta2dData,
} from './meta2dLight';

type EngineModule = typeof import('./meta2dEngine');

let enginePromise: Promise<EngineModule> | null = null;

function loadEngine(): Promise<EngineModule> {
  enginePromise ??= import('./meta2dEngine');
  return enginePromise;
}

export async function ensureMeta2dShapes(): Promise<void> {
  const engine = await loadEngine();
  engine.ensureMeta2dShapes();
}

export async function generateSvgFromMeta2d(
  ...args: Parameters<EngineModule['generateSvgFromMeta2d']>
): Promise<string> {
  const engine = await loadEngine();
  return engine.generateSvgFromMeta2d(...args);
}

export async function generateSvgFromDiagram(diagramJson: string): Promise<string> {
  const engine = await loadEngine();
  return engine.generateSvgFromDiagram(diagramJson);
}
