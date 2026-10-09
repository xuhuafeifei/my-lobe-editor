import { afterEach, describe, expect, it } from 'vitest';

import { ensureSelectionVisibleInScrollParent } from '../scrollIntoView';

describe('ensureSelectionVisibleInScrollParent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('scrolls the nearest overflow parent when caret sits below the bottom padding', () => {
    const host = document.createElement('div');
    host.style.cssText = 'height:200px;overflow:auto;position:absolute;top:0;left:0;width:300px;';
    const content = document.createElement('div');
    content.style.cssText = 'height:800px;';
    content.contentEditable = 'true';
    content.tabIndex = 0;
    const line = document.createElement('p');
    line.textContent = 'caret';
    line.style.cssText = 'position:absolute;top:180px;height:20px;margin:0;';
    content.append(line);
    host.append(content);
    document.body.append(host);

    content.focus();
    const range = document.createRange();
    range.selectNodeContents(line);
    range.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    Object.defineProperty(host, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(host, 'scrollHeight', { configurable: true, value: 800 });
    let scrollTop = 0;
    Object.defineProperty(host, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
    });
    host.getBoundingClientRect = () =>
      ({
        bottom: 200,
        height: 200,
        left: 0,
        right: 300,
        top: 0,
        width: 300,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;
    line.getBoundingClientRect = () =>
      ({
        bottom: 200,
        height: 20,
        left: 0,
        right: 100,
        top: 180,
        width: 100,
        x: 0,
        y: 180,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    // Force selection rect via range override
    const originalGetRangeAt = sel.getRangeAt.bind(sel);
    sel.getRangeAt = ((index: number) => {
      const r = originalGetRangeAt(index);
      r.getBoundingClientRect = () => line.getBoundingClientRect();
      return r;
    }) as typeof sel.getRangeAt;

    ensureSelectionVisibleInScrollParent(96);

    expect(scrollTop).toBeGreaterThan(0);
  });
});
