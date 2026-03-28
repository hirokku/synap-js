import type { GeneratedFile, GeneratorContext, SpecModel } from '@synap-js/core';
import { generatedHeader, toKebabCase } from '../utils/naming.js';

export function generateModelComponents(specs: SpecModel[], context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/models`;
  const header = generatedHeader('synap:ui');
  const files: GeneratedFile[] = [];

  for (const spec of specs) {
    if (!spec.ui?.components?.length && !spec.api?.endpoints?.length) continue;
    const components = spec.ui?.components ?? ['table', 'form', 'detail'];

    const model = spec.model;
    const kebab = toKebabCase(model);
    const fields = Object.entries(spec.fields).filter(([, f]) => !f.hidden);
    const nonPrimaryFields = fields.filter(([, f]) => !f.primary);
    const tableColumns = spec.ui?.table?.columns ?? fields.map(([name]) => name);

    // Table component
    if (components.includes('table')) {
      const columnsCode = tableColumns
        .map((col) => {
          const field = spec.fields[col];
          const label = col.charAt(0).toUpperCase() + col.slice(1);
          if (field?.type === 'boolean') {
            return `  { key: '${col}', label: '${label}', render: (v: unknown) => v ? '✓' : '✗' }`;
          }
          return `  { key: '${col}', label: '${label}' }`;
        })
        .join(',\n');

      files.push({
        path: `${dir}/${kebab}-table.tsx`,
        content: `${header}
import React, { useState } from 'react';
import { DataTable } from '../components/data-table.js';
import { Button } from '../components/button.js';
import { use${model}s, useDelete${model} } from '../hooks/use-${kebab}.js';

const columns = [
${columnsCode}
];

export function ${model}Table() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, refetch } = use${model}s(page);
  const { remove } = useDelete${model}();

  const handleDelete = async (id: string) => {
    if (confirm('Delete this ${model.toLowerCase()}?')) {
      await remove(id);
      refetch();
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">${model}s</h1>
        <a href="/${kebab}s/new">
          <Button>Create ${model}</Button>
        </a>
      </div>
      <DataTable
        columns={[...columns, {
          key: 'id' as any,
          label: 'Actions',
          render: (_: unknown, row: any) => (
            <div className="flex gap-2">
              <a href={\`/${kebab}s/\${row.id}\`} className="text-sm text-blue-600 hover:underline">View</a>
              <a href={\`/${kebab}s/\${row.id}/edit\`} className="text-sm text-gray-600 hover:underline">Edit</a>
              <button onClick={() => handleDelete(row.id)} className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          ),
        }]}
        data={data}
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
`,
      });
    }

    // Form component
    if (components.includes('form')) {
      const formFields = spec.ui?.form?.fields
        ?? nonPrimaryFields
          .filter(([, f]) => !f.auto)
          .map(([name]) => ({ field: name }));

      const fieldInputs = formFields.map(({ field: fieldName, component }) => {
        const fieldDef = spec.fields[fieldName];
        if (!fieldDef) return '';
        const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        const required = !fieldDef.nullable && fieldDef.default === undefined;

        if (fieldDef.type === 'enum' && fieldDef.values) {
          const opts = fieldDef.values.map((v: string) => `{ value: ${JSON.stringify(v)}, label: ${JSON.stringify(v)} }`).join(', ');
          return `      <Select label="${label}" name="${fieldName}" options={[${opts}]} value={form.${fieldName} ?? ''} onChange={(e) => setForm({ ...form, ${fieldName}: e.target.value })} />`;
        }
        if (fieldDef.type === 'text') {
          return `      <Textarea label="${label}" name="${fieldName}" value={form.${fieldName} ?? ''} onChange={(e) => setForm({ ...form, ${fieldName}: e.target.value })} />`;
        }
        if (fieldDef.type === 'boolean') {
          return `      <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.${fieldName}} onChange={(e) => setForm({ ...form, ${fieldName}: e.target.checked })} /><span className="text-sm text-gray-700">${label}</span></label>`;
        }
        const inputType = fieldDef.type === 'integer' || fieldDef.type === 'decimal' ? 'number' : fieldDef.type === 'email' ? 'email' : fieldDef.type === 'password' ? 'password' : 'text';
        return `      <Input label="${label}" name="${fieldName}" type="${inputType}" value={form.${fieldName} ?? ''} onChange={(e) => setForm({ ...form, ${fieldName}: e.target.value })} />`;
      }).filter(Boolean);

      files.push({
        path: `${dir}/${kebab}-form.tsx`,
        content: `${header}
import React, { useState, useEffect } from 'react';
import { Input } from '../components/input.js';
import { Select } from '../components/select.js';
import { Textarea } from '../components/textarea.js';
import { Button } from '../components/button.js';
import { Card } from '../components/card.js';
import { useCreate${model}, useUpdate${model}, use${model} } from '../hooks/use-${kebab}.js';

interface ${model}FormProps {
  id?: string;
}

export function ${model}Form({ id }: ${model}FormProps) {
  const [form, setForm] = useState<Record<string, any>>({});
  const { create, loading: creating } = useCreate${model}();
  const { update, loading: updating } = useUpdate${model}();
  const { data: existing } = use${model}(id ?? null);
  const isEdit = !!id;

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await update(id!, form);
    } else {
      await create(form);
    }
    window.location.href = '/${kebab}s';
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Create'} ${model}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
${fieldInputs.join('\n')}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={creating || updating}>
              {(creating || updating) ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
            <a href="/${kebab}s"><Button type="button" variant="secondary">Cancel</Button></a>
          </div>
        </form>
      </Card>
    </div>
  );
}
`,
      });
    }

    // Detail component
    if (components.includes('detail')) {
      const detailFields = spec.ui?.detail?.sections
        ? spec.ui.detail.sections.flatMap((s) => s.fields)
        : fields.map(([name]) => name);

      const fieldRows = detailFields.map((name) => {
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        return `          <div><dt className="text-sm text-gray-500">${label}</dt><dd className="mt-1 text-gray-900">{String(data?.${name} ?? '—')}</dd></div>`;
      });

      files.push({
        path: `${dir}/${kebab}-detail.tsx`,
        content: `${header}
import React from 'react';
import { Card } from '../components/card.js';
import { Button } from '../components/button.js';
import { use${model} } from '../hooks/use-${kebab}.js';

interface ${model}DetailProps {
  id: string;
}

export function ${model}Detail({ id }: ${model}DetailProps) {
  const { data, loading, error } = use${model}(id);

  if (loading) return <div className="py-8 text-center text-gray-400">Loading...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">${model} Detail</h1>
        <div className="flex gap-2">
          <a href={\`/${kebab}s/\${id}/edit\`}><Button variant="secondary">Edit</Button></a>
          <a href="/${kebab}s"><Button variant="ghost">Back</Button></a>
        </div>
      </div>
      <Card>
        <dl className="grid grid-cols-2 gap-4">
${fieldRows.join('\n')}
        </dl>
      </Card>
    </div>
  );
}
`,
      });
    }
  }

  // Index
  const exports = specs
    .filter((s) => s.ui?.components?.length || s.api?.endpoints?.length)
    .flatMap((s) => {
      const kebab = toKebabCase(s.model);
      const components = s.ui?.components ?? ['table', 'form', 'detail'];
      const lines: string[] = [];
      if (components.includes('table')) lines.push(`export { ${s.model}Table } from './${kebab}-table.js';`);
      if (components.includes('form')) lines.push(`export { ${s.model}Form } from './${kebab}-form.js';`);
      if (components.includes('detail')) lines.push(`export { ${s.model}Detail } from './${kebab}-detail.js';`);
      return lines;
    });

  files.push({ path: `${dir}/index.ts`, content: `${generatedHeader('synap:ui')}\n${exports.join('\n')}\n` });

  return files;
}
