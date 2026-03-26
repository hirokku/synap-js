import { describe, it, expect } from 'vitest';
import { resolveSpecs, buildDependencyGraph } from '../src/resolver/index.js';
import type { SpecModel } from '../src/types/spec.js';

function makeSpec(model: string, relations?: SpecModel['relations']): SpecModel {
  return {
    model,
    fields: { id: { type: 'uuid', primary: true } },
    relations,
  };
}

describe('resolveSpecs', () => {
  it('resolves empty specs', () => {
    const result = resolveSpecs([]);
    expect(result.errors).toHaveLength(0);
    expect(result.graph.nodes).toHaveLength(0);
  });

  it('resolves single model without relations', () => {
    const result = resolveSpecs([makeSpec('User')]);
    expect(result.errors).toHaveLength(0);
    expect(result.graph.nodes).toEqual(['User']);
    expect(result.graph.order).toEqual(['User']);
  });

  it('resolves two independent models', () => {
    const result = resolveSpecs([makeSpec('User'), makeSpec('Product')]);
    expect(result.errors).toHaveLength(0);
    expect(result.graph.nodes).toHaveLength(2);
    expect(result.graph.order).toHaveLength(2);
  });

  it('orders models by dependency (belongsTo)', () => {
    const user = makeSpec('User');
    const post = makeSpec('Post', {
      author: { type: 'belongsTo', model: 'User' },
    });
    const result = resolveSpecs([post, user]); // Post first, but User should come first in order
    expect(result.errors).toHaveLength(0);
    const userIdx = result.graph.order.indexOf('User');
    const postIdx = result.graph.order.indexOf('Post');
    expect(userIdx).toBeLessThan(postIdx);
  });

  it('handles chain dependencies A -> B -> C', () => {
    const a = makeSpec('A');
    const b = makeSpec('B', { a: { type: 'belongsTo', model: 'A' } });
    const c = makeSpec('C', { b: { type: 'belongsTo', model: 'B' } });
    const result = resolveSpecs([c, b, a]);
    expect(result.errors).toHaveLength(0);
    const idxA = result.graph.order.indexOf('A');
    const idxB = result.graph.order.indexOf('B');
    const idxC = result.graph.order.indexOf('C');
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('detects references to non-existent models', () => {
    const spec = makeSpec('Order', {
      customer: { type: 'belongsTo', model: 'Customer' },
    });
    const result = resolveSpecs([spec]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('UNKNOWN_RELATION_MODEL');
    expect(result.errors[0]?.message).toContain('Customer');
  });

  it('detects multiple errors', () => {
    const spec = makeSpec('Order', {
      customer: { type: 'belongsTo', model: 'Customer' },
      shipper: { type: 'belongsTo', model: 'Shipper' },
    });
    const result = resolveSpecs([spec]);
    expect(result.errors).toHaveLength(2);
  });

  it('ignores hasMany relations for ordering', () => {
    const user = makeSpec('User', {
      posts: { type: 'hasMany', model: 'Post' },
    });
    const post = makeSpec('Post');
    const result = resolveSpecs([user, post]);
    // hasMany doesn't create a dependency edge
    expect(result.graph.edges).toHaveLength(0);
  });

  it('buildDependencyGraph returns the graph', () => {
    const graph = buildDependencyGraph([makeSpec('User')]);
    expect(graph.nodes).toEqual(['User']);
    expect(graph.order).toEqual(['User']);
  });
});
