import type { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseAllSpecs, resolveSpecs } from '@synap-js/core';
import type { GeneratorContext } from '@synap-js/core';
import { ModelGenerator, ValidatorGenerator, ApiGenerator, MigrationGenerator } from '@synap-js/generators';

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate [target]')
    .description('Generate code from specs')
    .option('--full', 'Full regeneration')
    .option('--dry-run', 'Show what would be generated without writing')
    .option('--verbose', 'Detailed output')
    .action(async (target?: string, opts?: { dryRun?: boolean; verbose?: boolean }) => {
      const cwd = process.cwd();
      const specsDir = join(cwd, 'specs');
      const outputDir = join(cwd, 'src', 'generated');
      const extensionsDir = join(cwd, 'src', 'extensions');

      // Parse specs
      console.log('Parsing specs...');
      const { specs, errors: parseErrors } = parseAllSpecs(specsDir);

      if (parseErrors.length > 0) {
        for (const err of parseErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.file}: ${err.message}`);
        }
        process.exit(1);
      }

      if (specs.length === 0) {
        console.log('No specs found in specs/models/');
        return;
      }

      // Resolve dependencies
      const { graph, errors: resolveErrors } = resolveSpecs(specs);
      if (resolveErrors.length > 0) {
        for (const err of resolveErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.code}: ${err.message}`);
        }
        process.exit(1);
      }

      console.log(`\x1b[32m✓\x1b[0m Parsed ${specs.length} spec(s), resolved ${graph.edges.length} relation(s)`);

      // Order specs by dependency graph
      const orderedSpecs = graph.order
        .map((name) => specs.find((s) => s.model === name))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);

      const context: GeneratorContext = {
        specsDir,
        outputDir,
        extensionsDir,
        allSpecs: orderedSpecs,
      };

      // Run generators
      const generators = [];
      if (!target || target === 'models') generators.push(ModelGenerator);
      if (!target || target === 'models') generators.push(ValidatorGenerator);
      if (!target || target === 'api') generators.push(ApiGenerator);
      if (!target) generators.push(MigrationGenerator);

      let totalFiles = 0;
      for (const generator of generators) {
        const result = await generator.generate(orderedSpecs, context);

        if (result.errors.length > 0) {
          for (const err of result.errors) {
            console.log(`\x1b[31m✗\x1b[0m ${err.code}: ${err.message}`);
          }
          process.exit(1);
        }

        for (const file of result.files) {
          const fullPath = file.path.startsWith('/') ? file.path : join(cwd, file.path);

          if (opts?.dryRun) {
            console.log(`  [dry-run] ${file.path}`);
          } else {
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, file.content, 'utf-8');
            if (opts?.verbose) {
              console.log(`  \x1b[32m✓\x1b[0m ${file.path}`);
            }
          }
          totalFiles++;
        }
      }

      console.log(`\x1b[32m✓\x1b[0m Generated ${totalFiles} file(s)`);
    });
}
