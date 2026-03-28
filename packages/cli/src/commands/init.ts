import type { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { MCP_CONFIGS, writeMcpConfig } from '../mcp-configs.js';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export function registerInitCommand(program: Command): void {
  program
    .command('init [name]')
    .description('Initialize a new Synap project')
    .option('--db <type>', 'Database provider', 'sqlite')
    .option('--no-frontend', 'API only, no frontend')
    .action(async (name?: string, opts?: { db?: string }) => {
      const projectName = name ?? 'my-synap-app';

      if (!/^[a-z0-9][a-z0-9._-]*$/.test(projectName)) {
        console.log(`\x1b[31m✗\x1b[0m Invalid project name "${projectName}". Use lowercase letters, numbers, hyphens, and dots.`);
        process.exit(1);
      }

      const projectDir = join(process.cwd(), projectName);
      const dbProvider = opts?.db ?? 'sqlite';

      if (existsSync(projectDir)) {
        console.log(`\x1b[31m✗\x1b[0m Directory "${projectName}" already exists.`);
        process.exit(1);
      }

      console.log(`\n\x1b[36mSynap\x1b[0m Creating project "${projectName}"...\n`);

      // Create directory structure
      const dirs = [
        '',
        'specs/models',
        'specs/pages',
        'src/generated',
        'src/extensions/api',
        'src/extensions/ui',
        'migrations',
      ];
      for (const dir of dirs) {
        mkdirSync(join(projectDir, dir), { recursive: true });
      }

      // package.json
      writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
        name: projectName,
        version: '0.0.1',
        private: true,
        type: 'module',
        scripts: {
          dev: 'synap dev',
          generate: 'synap generate',
          validate: 'synap validate',
          build: 'synap build',
        },
        dependencies: {
          '@synap-js/cli': 'latest',
          '@synap-js/mcp': 'latest',
          '@synap-js/runtime': 'latest',
          hono: '^4.7.0',
          'drizzle-orm': '^0.38.0',
          zod: '^3.24.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          typescript: '^5.9.0',
          '@types/node': '^25.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          tailwindcss: '^4.0.0',
          '@tailwindcss/vite': '^4.0.0',
          vite: '^6.0.0',
          '@vitejs/plugin-react': '^4.0.0',
        },
      }, null, 2) + '\n');

      // tsconfig.json
      writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          isolatedModules: true,
          outDir: 'dist',
          declaration: true,
          paths: {
            '@generated/*': ['./src/generated/*'],
            '@extensions/*': ['./src/extensions/*'],
          },
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      }, null, 2) + '\n');

      // .gitignore
      writeFileSync(join(projectDir, '.gitignore'), [
        'node_modules/',
        'dist/',
        '.env*',
        'coverage/',
        '*.db',
        '*.db-journal',
      ].join('\n') + '\n');

      // .env
      const { randomUUID: genUUID } = await import('node:crypto');
      writeFileSync(join(projectDir, '.env'), [
        `DATABASE_URL=${dbProvider === 'sqlite' ? 'file:./dev.db' : 'postgresql://localhost:5432/' + projectName}`,
        'PORT=3000',
        'NODE_ENV=development',
        `JWT_SECRET=${genUUID()}${genUUID()}`,
      ].join('\n') + '\n');

      // .env.example
      writeFileSync(join(projectDir, '.env.example'), [
        `DATABASE_URL=${dbProvider === 'sqlite' ? 'file:./dev.db' : 'postgresql://localhost:5432/myapp'}`,
        'PORT=3000',
        'NODE_ENV=development',
      ].join('\n') + '\n');

      // Example spec
      writeFileSync(join(projectDir, 'specs/models/task.spec.yaml'), `model: Task
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    min: 1
    max: 200
  description:
    type: text
    nullable: true
  completed:
    type: boolean
    default: false
  priority:
    type: enum
    values: [low, medium, high]
    default: medium

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: public
    update: public
    delete: public
  sortable: [title, completed, priority, createdAt]
  pagination:
    defaultLimit: 20
    maxLimit: 100
`);

      // Example page spec
      writeFileSync(join(projectDir, 'specs/pages/home.page.yaml'), `page: Home
route: /
layout: marketing
title: "Welcome to ${projectName}"
sections:
  - type: hero
    title: "${projectName}"
    subtitle: "Built with Synap — the AI-first framework"
    cta:
      text: "Get Started"
      link: /tasks
    background: gradient

  - type: features
    columns: 3
    items:
      - title: "Spec-Driven"
        description: "Define your app in YAML, generate everything"
        icon: "📋"
      - title: "AI-Native"
        description: "Any AI tool connects via MCP and operates your project"
        icon: "🤖"
      - title: "Full-Stack"
        description: "API, database, frontend — all generated from specs"
        icon: "🚀"

  - type: cta
    title: "Ready to build?"
    subtitle: "Open this project in Claude Code, Cursor, or VS Code"
    cta:
      text: "View Tasks"
      link: /tasks
`);

      // synap.config.ts
      writeFileSync(join(projectDir, 'synap.config.ts'), `import { defineConfig } from '@synap-js/core';

export default defineConfig({
  database: {
    provider: '${dbProvider === 'sqlite' ? 'sqlite' : 'postgresql'}',
    url: process.env.DATABASE_URL ?? '${dbProvider === 'sqlite' ? 'file:./dev.db' : 'postgresql://localhost:5432/' + projectName}',
  },
  generate: {
    outputDir: 'src/generated',
    extensionsDir: 'src/extensions',
    specsDir: 'specs',
  },
  api: {
    prefix: '/api',
  },
});
`);

      // CLAUDE.md
      writeFileSync(join(projectDir, 'CLAUDE.md'), `# Synap Project: ${projectName}

This project uses the Synap.js framework — an AI-first full-stack TypeScript framework.
AI operates the framework via CLI commands, not by writing code directly.

## Quick Reference
- Generate code: \`synap generate\`
- Validate specs: \`synap validate\`
- Dev server: \`synap dev\`
- Add model: \`synap add model <Name>\`

## Architecture
- Specs (YAML) in specs/ → \`synap generate\` → Generated code in src/generated/
- NEVER edit files in src/generated/ — they are overwritten on generate
- Custom logic goes in src/extensions/

## Stack
TypeScript (strict), Hono, Drizzle ORM, Zod, SQLite
`);

      console.log(`  \x1b[32m✓\x1b[0m package.json`);
      console.log(`  \x1b[32m✓\x1b[0m tsconfig.json`);
      console.log(`  \x1b[32m✓\x1b[0m synap.config.ts`);
      console.log(`  \x1b[32m✓\x1b[0m .gitignore`);
      console.log(`  \x1b[32m✓\x1b[0m .env`);
      console.log(`  \x1b[32m✓\x1b[0m CLAUDE.md`);
      console.log(`  \x1b[32m✓\x1b[0m specs/models/task.spec.yaml`);
      console.log(`  \x1b[32m✓\x1b[0m specs/pages/home.page.yaml`);

      // Now run generate
      console.log(`\nGenerating code from specs...\n`);

      const { parseAllSpecs, resolveSpecs } = await import('@synap-js/core');
      const { ModelGenerator, ValidatorGenerator, ApiGenerator, MigrationGenerator } = await import('@synap-js/generators');

      const specsDir = join(projectDir, 'specs');
      const outputDir = join(projectDir, 'src', 'generated');
      const { specs, errors: parseErrors } = parseAllSpecs(specsDir);

      if (parseErrors.length > 0) {
        for (const err of parseErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.message}`);
        }
        process.exit(1);
      }

      const { graph } = resolveSpecs(specs);
      const orderedSpecs = graph.order
        .map((n: string) => specs.find((s: { model: string }) => s.model === n))
        .filter(Boolean);

      const context = { specsDir, outputDir, extensionsDir: join(projectDir, 'src', 'extensions'), allSpecs: orderedSpecs };
      const generators = [ModelGenerator, ValidatorGenerator, ApiGenerator, MigrationGenerator];

      let totalFiles = 0;
      for (const gen of generators) {
        const result = await gen.generate(orderedSpecs, context);
        for (const file of result.files) {
          const fullPath = file.path.startsWith('/') ? file.path : join(projectDir, file.path);
          mkdirSync(join(fullPath, '..'), { recursive: true });
          writeFileSync(fullPath, file.content, 'utf-8');
          totalFiles++;
        }
      }

      console.log(`  \x1b[32m✓\x1b[0m Generated ${totalFiles} files\n`);

      // Interactive AI setup
      const rl = createInterface({ input: process.stdin, output: process.stdout });

      console.log(`\x1b[36mAI Setup\x1b[0m — Which AI tool will you use to develop this project?\n`);

      const entries = Object.entries(MCP_CONFIGS);
      for (let i = 0; i < entries.length; i++) {
        console.log(`  ${i + 1}. ${entries[i]![1].label}`);
      }
      console.log(`  5. All of the above`);
      console.log(`  0. Skip (I'll configure later with: npx synap mcp setup)\n`);

      const choice = await ask(rl, 'Choose (0-5): ');
      rl.close();

      const num = parseInt(choice, 10);

      if (num > 0 && num <= entries.length) {
        const [key] = entries[num - 1]!;
        const result = writeMcpConfig(projectDir, key);
        console.log(`\n  \x1b[32m✓\x1b[0m ${result.dir}/${result.file}  (${result.label})`);
      } else if (num === 5) {
        console.log('');
        for (const [key] of entries) {
          const result = writeMcpConfig(projectDir, key);
          console.log(`  \x1b[32m✓\x1b[0m ${result.dir}/${result.file}  (${result.label})`);
        }
      } else {
        console.log(`\n  \x1b[90mSkipped. Run "npx synap mcp setup <ai>" anytime.\x1b[0m`);
      }

      console.log(`\n\x1b[32mDone!\x1b[0m Project "${projectName}" created.\n`);
      console.log(`Next steps:\n`);
      console.log(`  cd ${projectName}`);
      console.log(`  npm install`);
      console.log(`  npx synap dev`);
      console.log(`\n  Then open the project in your AI tool — it will auto-connect via MCP.\n`);
    });
}
