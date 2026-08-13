import { describe, expect, it } from 'vitest';

import {
  buildSpanStyleAttribute,
  extractStyleFromSpanOpenTag,
  pickExportableTextStyles,
} from '../textStyle';

describe('textStyle export helpers', () => {
  it('picks color and background-color only', () => {
    expect(
      pickExportableTextStyles('color: rgb(220,38,38); font-size: 14px; background-color: #ffe58f'),
    ).toEqual({
      'background-color': '#ffe58f',
      'color': 'rgb(220,38,38)',
    });
  });

  it('rejects unsafe values', () => {
    expect(pickExportableTextStyles('color: url(javascript:alert(1))')).toEqual({});
    expect(pickExportableTextStyles('color: red; background-color: "evil"')).toEqual({
      color: 'red',
    });
  });

  it('builds span style attribute', () => {
    expect(buildSpanStyleAttribute('color: rgb(220,38,38)')).toBe('color: rgb(220,38,38)');
    expect(buildSpanStyleAttribute('')).toBe('');
    expect(buildSpanStyleAttribute('color: #e11; background-color: #ffe58f')).toBe(
      'color: #e11; background-color: #ffe58f',
    );
  });

  it('extracts style from span open tag', () => {
    expect(extractStyleFromSpanOpenTag('<span style="color: rgb(220,38,38)">')).toBe(
      'color: rgb(220,38,38)',
    );
    expect(extractStyleFromSpanOpenTag('<span>')).toBe('');
  });
});
