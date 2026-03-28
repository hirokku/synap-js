import type { Command } from 'commander';
import { parseSpec, parseAllSpecs, resolveSpecs } from '@synap-js/core';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate [spec]')
    .description('Validate specs without generating code')
    .option('--security', 'Run security validations')
    .action(async (specPath?: string) => {
      console.log('Validating specs...\n');

      if (specPath) {
        const result = parseSpec(specPath);
        if (result.success) {
          console.log(`\x1b[32m✓\x1b[0m ${specPath} — valid`);
        } else {
          for (const err of result.errors) {
            console.log(`\x1b[31m✗\x1b[0m ${err.file}`);
            console.log(`  ${err.message}`);
            if (err.suggestion) console.log(`  Suggestion: ${err.suggestion}`);
          }
          process.exit(1);
        }
        return;
      }

      // Validate all specs
      const specsDir = process.cwd() + '/specs';
      const { specs, errors: parseErrors } = parseAllSpecs(specsDir);

      if (parseErrors.length > 0) {
        for (const err of parseErrors) {
          console.log(`\x1b[31m✗\x1b[0m ${err.file}`);
          console.log(`  ${err.message}`);
          if (err.suggestion) console.log(`  Suggestion: ${err.suggestion}`);
        }
      }

      if (specs.length > 0) {
        const { errors: resolveErrors } = resolveSpecs(specs);

        if (resolveErrors.length > 0) {
          for (const err of resolveErrors) {
            console.log(`\x1b[31m✗\x1b[0m ${err.code}: ${err.message}`);
          }
        }

        if (parseErrors.length === 0 && resolveErrors.length === 0) {
          for (const spec of specs) {
            console.log(`\x1b[32m✓\x1b[0m models/${spec.model.toLowerCase()}.spec.yaml — valid`);
          }
          console.log(`\n${specs.length} spec(s) validated. No errors.`);
        } else {
          const totalErrors = parseErrors.length + resolveErrors.length;
          console.log(`\n${totalErrors} error(s) found. Fix errors before generating.`);
          process.exit(1);
        }
      } else if (parseErrors.length === 0) {
        console.log('No specs found in specs/models/');
      }
    });
}
