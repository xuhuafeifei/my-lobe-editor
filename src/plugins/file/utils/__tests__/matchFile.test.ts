import { describe, expect, it } from 'vitest';

import { isAllowedUploadFile } from '../matchFile';

function fakeFile(name: string, type: string): File {
  return new File(['x'], name, { type });
}

describe('isAllowedUploadFile', () => {
  it('accepts all when no allowlist', () => {
    expect(isAllowedUploadFile(fakeFile('a.zip', 'application/zip'))).toBe(true);
    expect(isAllowedUploadFile(fakeFile('a.mp3', 'audio/mpeg'))).toBe(true);
  });

  it('matches mime prefix and extension', () => {
    const opts = {
      allowedExtensions: ['zip', 'mp3'],
      allowedMimeTypes: ['audio/', 'application/zip'],
    };
    expect(isAllowedUploadFile(fakeFile('song.mp3', 'audio/mpeg'), opts)).toBe(true);
    expect(isAllowedUploadFile(fakeFile('pack.zip', ''), opts)).toBe(true);
    expect(isAllowedUploadFile(fakeFile('doc.pdf', 'application/pdf'), opts)).toBe(false);
  });

  it('matches extension when mime is octet-stream', () => {
    const opts = { allowedExtensions: ['zip'] };
    expect(isAllowedUploadFile(fakeFile('x.zip', 'application/octet-stream'), opts)).toBe(true);
  });
});
