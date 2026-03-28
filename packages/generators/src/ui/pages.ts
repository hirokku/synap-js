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

  // Auto-generate admin dashboard
  const apiSpecs = specs.filter((s) => s.api?.endpoints?.length);
  if (apiSpecs.length > 0) {
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
