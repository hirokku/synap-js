import type { GeneratedFile, GeneratorContext, SpecModel, SpecPage } from '@synap-js/core';
import { generatedHeader, toKebabCase } from '../utils/naming.js';

export function generatePages(specs: SpecModel[], context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/pages`;
  const header = generatedHeader('synap:ui');
  const files: GeneratedFile[] = [];
  const pageSpecs = context.pageSpecs ?? [];

  // Generate marketing/custom pages from page specs
  for (const page of pageSpecs) {
    const kebab = toKebabCase(page.page);
    const layout = page.layout ?? 'marketing';
    const layoutComponent = layout === 'app' ? 'AppLayout' : layout === 'blank' ? 'BlankLayout' : 'MarketingLayout';
    const layoutImport = layout === 'app' ? 'app-layout' : layout === 'blank' ? 'blank-layout' : 'marketing-layout';

    const sectionImports = new Set<string>();
    const sectionElements: string[] = [];

    for (const section of page.sections ?? []) {
      const componentName = sectionTypeToComponent(section.type);
      sectionImports.add(componentName);
      sectionElements.push(generateSectionJsx(section));
    }

    const imports = [...sectionImports]
      .map((name) => `import { ${name} } from '../sections/${toKebabCase(name.replace('Section', '')).replace(/-section$/, '')}-section.js';`)
      .join('\n');

    files.push({
      path: `${dir}/${kebab}-page.tsx`,
      content: `${header}
import React from 'react';
import { ${layoutComponent} } from '../layouts/${layoutImport}.js';
${imports}

export function ${page.page}Page() {
  return (
    <${layoutComponent}>
${sectionElements.map((s) => `      ${s}`).join('\n')}
    </${layoutComponent}>
  );
}
`,
    });
  }

  // Generate CRUD pages from model specs
  for (const spec of specs) {
    if (!spec.api?.endpoints?.length) continue;
    const model = spec.model;
    const kebab = toKebabCase(model);
    const navItems = specs
      .filter((s) => s.api?.endpoints?.length)
      .map((s) => `{ label: '${s.model}s', href: '/${toKebabCase(s.model)}s' }`)
      .join(', ');

    // List page
    files.push({
      path: `${dir}/${kebab}-list-page.tsx`,
      content: `${header}
import React from 'react';
import { AppLayout } from '../layouts/app-layout.js';
import { ${model}Table } from '../models/${kebab}-table.js';

export function ${model}ListPage() {
  return (
    <AppLayout navItems={[${navItems}]}>
      <${model}Table />
    </AppLayout>
  );
}
`,
    });

    // Create page
    if (spec.api.endpoints.includes('create')) {
      files.push({
        path: `${dir}/${kebab}-create-page.tsx`,
        content: `${header}
import React from 'react';
import { AppLayout } from '../layouts/app-layout.js';
import { ${model}Form } from '../models/${kebab}-form.js';

export function ${model}CreatePage() {
  return (
    <AppLayout navItems={[${navItems}]}>
      <${model}Form />
    </AppLayout>
  );
}
`,
      });
    }

    // Detail page
    if (spec.api.endpoints.includes('get')) {
      files.push({
        path: `${dir}/${kebab}-detail-page.tsx`,
        content: `${header}
import React from 'react';
import { AppLayout } from '../layouts/app-layout.js';
import { ${model}Detail } from '../models/${kebab}-detail.js';

export function ${model}DetailPage({ id }: { id: string }) {
  return (
    <AppLayout navItems={[${navItems}]}>
      <${model}Detail id={id} />
    </AppLayout>
  );
}
`,
      });
    }

    // Edit page
    if (spec.api.endpoints.includes('update')) {
      files.push({
        path: `${dir}/${kebab}-edit-page.tsx`,
        content: `${header}
import React from 'react';
import { AppLayout } from '../layouts/app-layout.js';
import { ${model}Form } from '../models/${kebab}-form.js';

export function ${model}EditPage({ id }: { id: string }) {
  return (
    <AppLayout navItems={[${navItems}]}>
      <${model}Form id={id} />
    </AppLayout>
  );
}
`,
      });
    }
  }

  // Auto-generate admin dashboard (only if no page spec covers /app or /admin)
  const apiSpecs = specs.filter((s) => s.api?.endpoints?.length);
  const hasAppPage = pageSpecs.some((p) => p.route === '/app' || p.route === '/admin');
  if (apiSpecs.length > 0 && !hasAppPage) {
    const navItems = apiSpecs
      .map((s) => `{ label: '${s.model}s', href: '/${toKebabCase(s.model)}s' }`)
      .join(', ');

    const modelCards = apiSpecs.map((s) => {
      const fieldCount = Object.keys(s.fields).length;
      const kebab = toKebabCase(s.model);
      return `        <a href="/${kebab}s" className="block rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <h3 className="text-lg font-semibold text-gray-900">${s.model}s</h3>
          <p className="mt-1 text-sm text-gray-500">${fieldCount} fields</p>
          <div className="mt-3 flex gap-2">
            ${(s.api?.endpoints ?? []).map((ep: string) => `<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">${ep}</span>`).join('\n            ')}
          </div>
        </a>`;
    }).join('\n');

    files.push({
      path: `${dir}/admin-page.tsx`,
      content: `${header}
import React from 'react';
import { AppLayout } from '../layouts/app-layout.js';

export function AdminPage() {
  return (
    <AppLayout navItems={[${navItems}]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
${modelCards}
        </div>
      </div>
    </AppLayout>
  );
}
`,
    });
  }

  // Auth pages (login + register)
  files.push({
    path: `${dir}/login-page.tsx`,
    content: `${header}
import React, { useState } from 'react';
import { useAuth } from '../auth/auth-context.js';
import { Input } from '../components/input.js';
import { Button } from '../components/button.js';
import { Card } from '../components/card.js';
import { BlankLayout } from '../layouts/blank-layout.js';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.success) {
      window.location.href = '/app';
    } else {
      setError(result.error ?? 'Login failed');
    }
    setLoading(false);
  };

  return (
    <BlankLayout>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">Sign In</h1>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
            </p>
          </Card>
        </div>
      </div>
    </BlankLayout>
  );
}
`,
  });

  files.push({
    path: `${dir}/register-page.tsx`,
    content: `${header}
import React, { useState } from 'react';
import { useAuth } from '../auth/auth-context.js';
import { Input } from '../components/input.js';
import { Button } from '../components/button.js';
import { Card } from '../components/card.js';
import { BlankLayout } from '../layouts/blank-layout.js';

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(email, name, password);
    if (result.success) {
      window.location.href = '/app';
    } else {
      setError(result.error ?? 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <BlankLayout>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">Create Account</h1>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign In</a>
            </p>
          </Card>
        </div>
      </div>
    </BlankLayout>
  );
}
`,
  });

  return files;
}

function sectionTypeToComponent(type: string): string {
  const map: Record<string, string> = {
    hero: 'HeroSection',
    features: 'FeaturesSection',
    pricing: 'PricingSection',
    cta: 'CtaSection',
    testimonials: 'TestimonialsSection',
    faq: 'FaqSection',
    content: 'ContentSection',
    stats: 'StatsSection',
    team: 'TeamSection',
    contact: 'ContactSection',
  };
  return map[type] ?? 'ContentSection';
}

function generateSectionJsx(section: SpecPage['sections'] extends (infer T)[] | undefined ? T : never): string {
  const component = sectionTypeToComponent(section.type);
  const props: string[] = [];

  if (section.title) props.push(`title={${JSON.stringify(section.title)}}`);
  if (section.subtitle) props.push(`subtitle={${JSON.stringify(section.subtitle)}}`);
  if (section.content) props.push(`content={${JSON.stringify(section.content)}}`);
  if (section.background) props.push(`background={${JSON.stringify(section.background)}}`);
  if (section.image) props.push(`image={${JSON.stringify(section.image)}}`);
  if (section.columns) props.push(`columns={${section.columns}}`);
  if (section.cta) props.push(`cta={${JSON.stringify(section.cta)}}`);
  if (section.items) props.push(`items={${JSON.stringify(section.items)}}`);
  if (section.plans) props.push(`plans={${JSON.stringify(section.plans)}}`);

  return `<${component} ${props.join(' ')} />`;
}
