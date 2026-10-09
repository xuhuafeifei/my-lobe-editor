import { describe, expect, it } from 'vitest';

import { isPasteTargetCodeEditor, isPasteTargetNativeFormControl } from '../paste-handler';

function clipboardEvent(target: EventTarget | null): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('paste-handler code / form targets', () => {
  it('detects CodeMirror contenteditable paste targets', () => {
    const root = document.createElement('div');
    root.className = 'cm-editor';
    const content = document.createElement('div');
    content.className = 'cm-content';
    content.contentEditable = 'true';
    root.append(content);
    document.body.append(root);

    expect(isPasteTargetCodeEditor(clipboardEvent(content))).toBe(true);
    expect(isPasteTargetNativeFormControl(clipboardEvent(content))).toBe(false);

    root.remove();
  });

  it('does not treat ordinary editor nodes as code editors', () => {
    const p = document.createElement('p');
    p.textContent = 'hello';
    document.body.append(p);
    expect(isPasteTargetCodeEditor(clipboardEvent(p))).toBe(false);
    p.remove();
  });
});
