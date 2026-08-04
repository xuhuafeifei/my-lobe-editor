import { FileNode } from '@/plugins/file/node/FileNode';
import type { ILocaleKeys } from '@/types';

import type { FileMatchOptions } from '../utils/matchFile';

export interface ReactFilePluginProps extends FileMatchOptions {
  className?: string;
  handleUpload: (file: File) => Promise<{ url: string }>;
  locale?: Partial<Record<keyof ILocaleKeys, string>>;
  markdownWriter?: (file: FileNode) => string;
  theme?: {
    file?: string;
  };
}
