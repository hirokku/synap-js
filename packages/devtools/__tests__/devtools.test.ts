import { describe, it, expect } from 'vitest';
import { DEVTOOLS_VERSION } from '../src/index.js';

describe('@synap-js/devtools', () => {
  it('exports version', () => {
    expect(DEVTOOLS_VERSION).toBe('0.0.2');
  });
});
