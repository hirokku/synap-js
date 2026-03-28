import type { GeneratedFile, GeneratorContext } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export function generateLayouts(context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/layouts`;
  const header = generatedHeader('synap:ui');

  return [
    {
      path: `${dir}/marketing-layout.tsx`,
      content: `${header}
import React from 'react';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-bold text-gray-900">Synap</a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
            <a href="/app" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Dashboard</a>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-gray-500">
          Built with Synap
        </div>
      </footer>
    </div>
  );
}
`,
    },
    {
      path: `${dir}/app-layout.tsx`,
      content: `${header}
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  navItems?: Array<{ label: string; href: string }>;
}

export function AppLayout({ children, navItems = [] }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="p-6">
          <a href="/" className="text-xl font-bold text-gray-900">Synap</a>
        </div>
        <nav className="px-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
`,
    },
    {
      path: `${dir}/blank-layout.tsx`,
      content: `${header}
import React from 'react';

interface BlankLayoutProps {
  children: React.ReactNode;
}

export function BlankLayout({ children }: BlankLayoutProps) {
  return <div className="min-h-screen">{children}</div>;
}
`,
    },
    {
      path: `${dir}/index.ts`,
      content: `${header}
export { MarketingLayout } from './marketing-layout.js';
export { AppLayout } from './app-layout.js';
export { BlankLayout } from './blank-layout.js';
`,
    },
  ];
}
