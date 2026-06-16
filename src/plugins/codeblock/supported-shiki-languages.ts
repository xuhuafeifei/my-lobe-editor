import type { LanguageInput } from '@shikijs/types';

/**
 * Curated Shiki languages for @fgbg/lobe-editor.
 *
 * Do NOT import `bundledLanguagesInfo` from `shiki` — that module references
 * every language and forces Vite to emit ~300+ lang chunks. Only list langs
 * here with explicit `import('@shikijs/langs/...')` so the build stays lean.
 *
 * Unknown fence languages fall back to plaintext (content is preserved).
 */
export type SupportedLanguageInfo = {
  aliases?: string[];
  id: string;
  import: () => Promise<LanguageInput>;
  name: string;
};

/** Canonical ids kept for syntax highlighting (aliases documented in each entry). */
export const SUPPORTED_SHIKI_LANGUAGE_IDS = [
  'markdown',
  'mdx',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'html',
  'css',
  'scss',
  'less',
  'vue',
  'svelte',
  'json',
  'jsonc',
  'yaml',
  'toml',
  'xml',
  'ini',
  'python',
  'java',
  'kotlin',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'lua',
  'shellscript',
  'shellsession',
  'powershell',
  'docker',
  'nginx',
  'make',
  'cmake',
  'sql',
  'graphql',
  'diff',
  'proto',
  'wasm',
] as const;

export const supportedLanguagesInfo: SupportedLanguageInfo[] = [
  { id: 'markdown', name: 'Markdown', aliases: ['md'], import: () => import('@shikijs/langs/markdown') },
  { id: 'mdx', name: 'MDX', import: () => import('@shikijs/langs/mdx') },
  {
    id: 'javascript',
    name: 'JavaScript',
    aliases: ['js', 'cjs', 'mjs'],
    import: () => import('@shikijs/langs/javascript'),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    aliases: ['ts', 'cts', 'mts'],
    import: () => import('@shikijs/langs/typescript'),
  },
  { id: 'jsx', name: 'JSX', import: () => import('@shikijs/langs/jsx') },
  { id: 'tsx', name: 'TSX', import: () => import('@shikijs/langs/tsx') },
  { id: 'html', name: 'HTML', import: () => import('@shikijs/langs/html') },
  { id: 'css', name: 'CSS', import: () => import('@shikijs/langs/css') },
  { id: 'scss', name: 'SCSS', import: () => import('@shikijs/langs/scss') },
  { id: 'less', name: 'Less', import: () => import('@shikijs/langs/less') },
  { id: 'vue', name: 'Vue', import: () => import('@shikijs/langs/vue') },
  { id: 'svelte', name: 'Svelte', import: () => import('@shikijs/langs/svelte') },
  { id: 'json', name: 'JSON', import: () => import('@shikijs/langs/json') },
  { id: 'jsonc', name: 'JSON with Comments', import: () => import('@shikijs/langs/jsonc') },
  { id: 'yaml', name: 'YAML', aliases: ['yml'], import: () => import('@shikijs/langs/yaml') },
  { id: 'toml', name: 'TOML', import: () => import('@shikijs/langs/toml') },
  { id: 'xml', name: 'XML', import: () => import('@shikijs/langs/xml') },
  { id: 'ini', name: 'INI', aliases: ['properties'], import: () => import('@shikijs/langs/ini') },
  { id: 'python', name: 'Python', aliases: ['py'], import: () => import('@shikijs/langs/python') },
  { id: 'java', name: 'Java', import: () => import('@shikijs/langs/java') },
  { id: 'kotlin', name: 'Kotlin', aliases: ['kt', 'kts'], import: () => import('@shikijs/langs/kotlin') },
  { id: 'go', name: 'Go', import: () => import('@shikijs/langs/go') },
  { id: 'rust', name: 'Rust', aliases: ['rs'], import: () => import('@shikijs/langs/rust') },
  { id: 'c', name: 'C', import: () => import('@shikijs/langs/c') },
  { id: 'cpp', name: 'C++', aliases: ['c++'], import: () => import('@shikijs/langs/cpp') },
  {
    id: 'csharp',
    name: 'C#',
    aliases: ['c#', 'cs'],
    import: () => import('@shikijs/langs/csharp'),
  },
  { id: 'ruby', name: 'Ruby', aliases: ['rb'], import: () => import('@shikijs/langs/ruby') },
  { id: 'php', name: 'PHP', import: () => import('@shikijs/langs/php') },
  { id: 'swift', name: 'Swift', import: () => import('@shikijs/langs/swift') },
  { id: 'lua', name: 'Lua', import: () => import('@shikijs/langs/lua') },
  {
    id: 'shellscript',
    name: 'Shell',
    aliases: ['bash', 'sh', 'shell', 'zsh'],
    import: () => import('@shikijs/langs/shellscript'),
  },
  {
    id: 'shellsession',
    name: 'Shell Session',
    aliases: ['console'],
    import: () => import('@shikijs/langs/shellsession'),
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    aliases: ['ps', 'ps1'],
    import: () => import('@shikijs/langs/powershell'),
  },
  {
    id: 'docker',
    name: 'Dockerfile',
    aliases: ['dockerfile'],
    import: () => import('@shikijs/langs/docker'),
  },
  { id: 'nginx', name: 'Nginx', import: () => import('@shikijs/langs/nginx') },
  { id: 'make', name: 'Makefile', aliases: ['makefile'], import: () => import('@shikijs/langs/make') },
  { id: 'cmake', name: 'CMake', import: () => import('@shikijs/langs/cmake') },
  { id: 'sql', name: 'SQL', import: () => import('@shikijs/langs/sql') },
  { id: 'graphql', name: 'GraphQL', aliases: ['gql'], import: () => import('@shikijs/langs/graphql') },
  { id: 'diff', name: 'Diff', import: () => import('@shikijs/langs/diff') },
  {
    id: 'proto',
    name: 'Protocol Buffer 3',
    aliases: ['protobuf'],
    import: () => import('@shikijs/langs/proto'),
  },
  { id: 'wasm', name: 'WebAssembly', import: () => import('@shikijs/langs/wasm') },
];

export function findSupportedLanguageInfo(language: string): SupportedLanguageInfo | undefined {
  const langId = language.toLowerCase();
  return supportedLanguagesInfo.find(
    (desc) => desc.id === langId || desc.aliases?.some((alias) => alias.toLowerCase() === langId),
  );
}

/** Map fence language tag to a supported id, or `plaintext` when not in the whitelist. */
export function resolveSupportedLanguageId(language: string): string {
  if (!language) return 'plaintext';
  return findSupportedLanguageInfo(language)?.id ?? 'plaintext';
}

export function getSupportedCodeLanguageOptions(): [string, string][] {
  return supportedLanguagesInfo.map((item) => [item.id, item.name]);
}
