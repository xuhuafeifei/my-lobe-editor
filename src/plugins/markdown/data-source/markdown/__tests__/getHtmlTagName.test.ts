import { describe, expect, it } from 'vitest';

import { getHtmlTagName } from '../parse';

describe('getHtmlTagName', () => {
  it('extracts tag name ignoring attributes', () => {
    expect(getHtmlTagName('<span style="color: rgb(220,38,38)">')).toBe('span');
    expect(getHtmlTagName('</span>')).toBe('span');
    expect(getHtmlTagName('<ins>')).toBe('ins');
    expect(getHtmlTagName('</ins>')).toBe('ins');
    expect(getHtmlTagName('<br/>')).toBe('br');
  });
});
