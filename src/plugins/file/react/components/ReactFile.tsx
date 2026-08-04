import { Center, MaterialFileTypeIcon } from '@lobehub/ui';
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW, LexicalEditor } from 'lexical';
import { type FC, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from 'react';

import { useLexicalNodeSelection } from '@/editor-kernel/react/useLexicalNodeSelection';
import { useTranslation } from '@/editor-kernel/react/useTranslation';

import { FileNode } from '../../node/FileNode';

interface ReactFileProps {
  className?: string;
  editor: LexicalEditor;
  node: FileNode;
}

const ReactFile: FC<ReactFileProps> = ({ className, editor, node }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const t = useTranslation();
  const [, setSelected, clearSelection] = useLexicalNodeSelection(node.getKey());

  const onClick = useCallback(
    (payload: MouseEvent) => {
      if (payload.target === spanRef.current || spanRef.current?.contains(payload.target as Node)) {
        clearSelection();
        setSelected(true);
        return true;
      }
      return false;
    },
    [clearSelection, setSelected],
  );

  useEffect(() => {
    return editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW);
  }, [editor, node, onClick]);

  const onDownloadClick = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    // Keep selection behavior; allow default download / open.
    e.stopPropagation();
  }, []);

  if (node.status === 'pending') {
    return <div className={className}>{t('file.uploading')}</div>;
  }

  if (node.status === 'error') {
    return (
      <div className={className}>
        {t('file.error', { message: node.message || 'Unknown error' })}
      </div>
    );
  }

  const content = (
    <>
      <MaterialFileTypeIcon filename={node.name} size={18} type={'file'} variant={'raw'} />
      {node.name}
    </>
  );

  if (node.fileUrl) {
    return (
      <Center className={className} gap={'.2em'} horizontal ref={spanRef}>
        <a
          download={node.name}
          href={node.fileUrl}
          onClick={onDownloadClick}
          rel="noopener noreferrer"
          target="_blank"
          title={t('file.download')}
        >
          {content}
        </a>
      </Center>
    );
  }

  return (
    <Center className={className} gap={'.2em'} horizontal ref={spanRef}>
      {content}
    </Center>
  );
};

ReactFile.displayName = 'ReactFile';

export default ReactFile;
