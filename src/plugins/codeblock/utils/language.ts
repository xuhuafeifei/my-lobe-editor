import { resolveSupportedLanguageId } from '../supported-shiki-languages';

export function getCodeLanguageByInput(input: string): string {
  return resolveSupportedLanguageId(input);
}
