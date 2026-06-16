import { createHighlighterCoreSync, isSpecialLang } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';

import { findSupportedLanguageInfo } from '@/plugins/codeblock/supported-shiki-languages';

let _highlighter: ReturnType<typeof createHighlighterCoreSync> | null = null;
function getHighlighter() {
  if (!_highlighter) {
    _highlighter = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine(),
      langs: [],
      themes: [],
    });
  }
  return _highlighter;
}

function isLanguageLoaded(language: string): boolean {
  if (isSpecialLang(language)) return true;
  const highlighter = getHighlighter();
  return highlighter.getLoadedLanguages().includes(language);
}

export async function loadLanguage(language: string): Promise<void> {
  if (isLanguageLoaded(language)) return;
  const info = findSupportedLanguageInfo(language);
  if (info) {
    const highlighter = getHighlighter();
    await highlighter.loadLanguage(info.import());
  }
}
