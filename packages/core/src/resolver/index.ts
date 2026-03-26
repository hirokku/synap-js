import type { SpecModel } from '../types/spec.js';

export interface DependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
  order: string[];
}

export interface ResolveError {
  code: string;
  message: string;
  models?: string[];
}

export interface ResolveResult {
  graph: DependencyGraph;
  errors: ResolveError[];
}

export function resolveSpecs(specs: SpecModel[]): ResolveResult {
  const errors: ResolveError[] = [];
  const modelNames = new Set(specs.map((s) => s.model));
  const nodes = [...modelNames];
  const edges: Array<{ from: string; to: string }> = [];

  // Validate relations reference existing models
  for (const spec of specs) {
    if (!spec.relations) continue;
    for (const [relName, rel] of Object.entries(spec.relations)) {
      if (!modelNames.has(rel.model)) {
        const available = [...modelNames].join(', ');
        errors.push({
          code: 'UNKNOWN_RELATION_MODEL',
          message: `${spec.model}.${relName}: relation references model '${rel.model}' which does not exist. Available models: ${available}`,
          models: [spec.model, rel.model],
        });
      } else {
        if (rel.type === 'belongsTo') {
          edges.push({ from: spec.model, to: rel.model });
        }
      }
    }
  }

  // Topological sort
  const order = topologicalSort(nodes, edges);
  if (!order) {
    errors.push({
      code: 'CIRCULAR_DEPENDENCY',
      message: 'Circular dependency detected between models. Check your belongsTo relations.',
      models: nodes,
    });
    return { graph: { nodes, edges, order: nodes }, errors };
  }

  return { graph: { nodes, edges, order }, errors };
}

function topologicalSort(
  nodes: string[],
  edges: Array<{ from: string; to: string }>,
): string[] | null {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node, 0);
    adjList.set(node, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.from, (inDegree.get(edge.from) ?? 0) + 1);
    adjList.get(edge.to)?.push(edge.from);
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const neighbor of adjList.get(node) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return result.length === nodes.length ? result : null;
}

export function buildDependencyGraph(specs: SpecModel[]): DependencyGraph {
  return resolveSpecs(specs).graph;
}
