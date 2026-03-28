import { describe, it, expect } from 'vitest';
import { MCP_VERSION } from '../src/index.js';

describe('@synap-js/mcp', () => {
  it('exports version', () => {
    expect(MCP_VERSION).toBe('0.0.2');
  });

  it('exports createMcpServer', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.createMcpServer).toBe('function');
  });
});
