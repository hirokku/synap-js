import { describe, it, expect } from 'vitest';
import { MCP_VERSION } from '../src/index.js';

describe('@kodeai/mcp', () => {
  it('exports version', () => {
    expect(MCP_VERSION).toBe('0.0.1');
  });
});
