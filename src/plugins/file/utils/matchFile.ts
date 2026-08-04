export interface FileMatchOptions {
  /** Extensions without dot, e.g. `zip`, `mp3`. Case-insensitive. */
  allowedExtensions?: string[];
  /**
   * Exact MIME types, or prefixes ending with `/` (e.g. `audio/`).
   * Empty / omitted together with extensions means accept all.
   */
  allowedMimeTypes?: string[];
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf('.');
  if (i < 0 || i === filename.length - 1) return '';
  return filename.slice(i + 1).toLowerCase();
}

function matchMime(fileType: string, allowed: string[]): boolean {
  if (!fileType) return false;
  return allowed.some((rule) => {
    if (rule.endsWith('/')) {
      return fileType.startsWith(rule);
    }
    return fileType === rule;
  });
}

/**
 * Whether a dropped/pasted file should be claimed by FilePlugin.
 * No allowlist → accept all.
 */
export function isAllowedUploadFile(file: File, options?: FileMatchOptions): boolean {
  const mimes = options?.allowedMimeTypes;
  const exts = options?.allowedExtensions;
  if ((!mimes || mimes.length === 0) && (!exts || exts.length === 0)) {
    return true;
  }

  if (mimes && mimes.length > 0 && matchMime(file.type, mimes)) {
    return true;
  }

  if (exts && exts.length > 0) {
    const ext = getExtension(file.name);
    if (ext && exts.some((e) => e.toLowerCase().replace(/^\./, '') === ext)) {
      return true;
    }
  }

  return false;
}
