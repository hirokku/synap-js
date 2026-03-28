import type { GeneratedFile, GeneratorContext, SpecModel } from '@synap-js/core';
import { generatedHeader, toKebabCase, toCamelCase } from '../utils/naming.js';

export function generateHooks(specs: SpecModel[], context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/hooks`;
  const header = generatedHeader('synap:ui');
  const files: GeneratedFile[] = [];

  for (const spec of specs) {
    if (!spec.api?.endpoints?.length) continue;

    const model = spec.model;
    const camel = toCamelCase(model);
    const kebab = toKebabCase(model);
    const route = `/api/${kebab}s`;
    const endpoints = spec.api.endpoints;

    const lines: string[] = [header, `import { useState, useEffect, useCallback } from 'react';`, ''];

    // List hook
    if (endpoints.includes('list')) {
      lines.push(`export function use${model}s(page = 1, limit = 20) {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number }>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch${model}s = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(\`${route}?page=\${page}&limit=\${limit}\`);
      const json = await res.json();
      setData(json.data ?? []);
      setMeta(json.meta ?? { page: 1, totalPages: 1, total: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetch${model}s(); }, [fetch${model}s]);

  return { data, meta, loading, error, refetch: fetch${model}s };
}
`);
    }

    // Get hook
    if (endpoints.includes('get')) {
      lines.push(`export function use${model}(id: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(\`${route}/\${id}\`)
      .then((res) => { if (!res.ok) throw new Error(\`Failed to fetch (HTTP \${res.status})\`); return res.json(); })
      .then((json) => { setData(json.data ?? null); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
`);
    }

    // Create hook
    if (endpoints.includes('create')) {
      lines.push(`export function useCreate${model}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch('${route}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Create failed');
      setError(null);
      return json.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}
`);
    }

    // Update hook
    if (endpoints.includes('update')) {
      lines.push(`export function useUpdate${model}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch(\`${route}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Update failed');
      setError(null);
      return json.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}
`);
    }

    // Delete hook
    if (endpoints.includes('delete')) {
      lines.push(`export function useDelete${model}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(\`${route}/\${id}\`, { method: 'DELETE' });
      if (!res.ok) { const json = await res.json(); throw new Error(json.message ?? 'Delete failed'); }
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
`);
    }

    files.push({ path: `${dir}/use-${kebab}.ts`, content: lines.join('\n') });
  }

  // Index file
  const hookExports = specs
    .filter((s) => s.api?.endpoints?.length)
    .map((s) => `export * from './use-${toKebabCase(s.model)}.js';`)
    .join('\n');

  files.push({ path: `${dir}/index.ts`, content: `${header}\n${hookExports}\n` });

  return files;
}
