import type { GeneratedFile, GeneratorContext, SpecModel, SpecPage } from '@synap-js/core';
import { generatedHeader, toKebabCase } from '../utils/naming.js';

export function generateRouter(specs: SpecModel[], context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui`;
  const header = generatedHeader('synap:ui');
  const pageSpecs = context.pageSpecs ?? [];

  const importSet = new Set<string>();
  const routes: string[] = [];

  // Auth pages
  importSet.add(`import { LoginPage } from './pages/login-page.js';`);
  importSet.add(`import { RegisterPage } from './pages/register-page.js';`);
  routes.push(`  { path: '/login', component: LoginPage }`);
  routes.push(`  { path: '/register', component: RegisterPage }`);

  // Marketing/custom page routes
  for (const page of pageSpecs) {
    const kebab = toKebabCase(page.page);
    importSet.add(`import { ${page.page}Page } from './pages/${kebab}-page.js';`);
    routes.push(`  { path: '${page.route}', component: ${page.page}Page }`);
  }

  // Admin dashboard (auto-generated only if no page spec already covers /app)
  const apiSpecs = specs.filter((s) => s.api?.endpoints?.length);
  const hasAppPage = pageSpecs.some((p) => p.route === '/app' || p.route === '/admin');
  if (apiSpecs.length > 0 && !hasAppPage) {
    importSet.add(`import { AdminPage } from './pages/admin-page.js';`);
    routes.push(`  { path: '/app', component: AdminPage }`);
  }

  // CRUD routes from model specs
  for (const spec of specs) {
    if (!spec.api?.endpoints?.length) continue;
    const model = spec.model;
    const kebab = toKebabCase(model);

    importSet.add(`import { ${model}ListPage } from './pages/${kebab}-list-page.js';`);
    routes.push(`  { path: '/${kebab}s', component: ${model}ListPage }`);

    if (spec.api.endpoints.includes('create')) {
      importSet.add(`import { ${model}CreatePage } from './pages/${kebab}-create-page.js';`);
      routes.push(`  { path: '/${kebab}s/new', component: ${model}CreatePage }`);
    }

    if (spec.api.endpoints.includes('get')) {
      importSet.add(`import { ${model}DetailPage } from './pages/${kebab}-detail-page.js';`);
      routes.push(`  { path: '/${kebab}s/:id', component: ${model}DetailPage, hasId: true }`);
    }

    if (spec.api.endpoints.includes('update')) {
      importSet.add(`import { ${model}EditPage } from './pages/${kebab}-edit-page.js';`);
      routes.push(`  { path: '/${kebab}s/:id/edit', component: ${model}EditPage, hasId: true }`);
    }
  }

  return [{
    path: `${dir}/router.tsx`,
    content: `${header}
import React, { useState, useEffect } from 'react';
${[...importSet].join('\n')}

interface Route {
  path: string;
  component: React.ComponentType<any>;
  hasId?: boolean;
}

const routes: Route[] = [
${routes.join(',\n')}
];

function matchRoute(pathname: string): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    const pattern = route.path.replace(/:([^/]+)/g, '([^/]+)');
    const match = pathname.match(new RegExp('^' + pattern + '$'));
    if (match) {
      const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map((m) => m[1]!);
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => { params[name] = match[i + 1]!; });
      return { route, params };
    }
  }
  return null;
}

export function Router() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleNav = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handleNav);
    return () => window.removeEventListener('popstate', handleNav);
  }, []);

  const result = matchRoute(pathname);
  if (!result) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">404 — Page not found</div>;
  }

  const { route, params } = result;
  const Component = route.component;
  return <Component {...params} />;
}

// Navigation helper
export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
`,
  }];
}
