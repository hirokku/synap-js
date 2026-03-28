import type { Command } from 'commander';
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PROVIDERS = [
  { key: 'claude', name: 'Claude (Anthropic)', envKey: 'ANTHROPIC_API_KEY', model: 'claude-sonnet-4-20250514' },
  { key: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', model: 'gpt-4o' },
  { key: 'gemini', name: 'Gemini (Google)', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', model: 'gemini-2.0-flash' },
];

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export function registerAiCommand(program: Command): void {
  const ai = program
    .command('ai')
    .description('AI provider management');

  ai
    .command('setup')
    .description('Configure AI provider for interactive dev mode')
    .action(async () => {
      const rl = createInterface({ input: process.stdin, output: process.stdout });

      try {
        console.log('\n\x1b[36mSynap AI Setup\x1b[0m\n');
        console.log('Select an AI provider for the interactive dev console:\n');

        for (let i = 0; i < PROVIDERS.length; i++) {
          console.log(`  ${i + 1}. ${PROVIDERS[i]!.name}`);
        }
        console.log(`  0. Skip (no AI)\n`);

        const choice = await ask(rl, 'Choose (0-3): ');
        const num = parseInt(choice, 10);

        if (num === 0 || isNaN(num)) {
          console.log('\nSkipped. You can run this again anytime with: npx synap ai setup\n');
          rl.close();
          return;
        }

        const provider = PROVIDERS[num - 1];
        if (!provider) {
          console.log('\x1b[31m✗\x1b[0m Invalid choice.');
          rl.close();
          return;
        }

        console.log(`\nSelected: ${provider.name}`);
        const apiKey = await ask(rl, `Enter your API key (${provider.envKey}): `);

        if (!apiKey.trim()) {
          console.log('\x1b[31m✗\x1b[0m API key cannot be empty.');
          rl.close();
          return;
        }

        // Write to .env
        const cwd = process.cwd();
        const envPath = join(cwd, '.env');
        let envContent = '';

        if (existsSync(envPath)) {
          envContent = readFileSync(envPath, 'utf-8');
        }

        // Update or add AI_PROVIDER
        envContent = upsertEnvVar(envContent, 'AI_PROVIDER', provider.key);
        envContent = upsertEnvVar(envContent, 'AI_MODEL', provider.model);
        envContent = upsertEnvVar(envContent, provider.envKey, apiKey.trim());

        writeFileSync(envPath, envContent, 'utf-8');

        console.log(`\n  \x1b[32m✓\x1b[0m AI_PROVIDER=${provider.key}`);
        console.log(`  \x1b[32m✓\x1b[0m AI_MODEL=${provider.model}`);
        console.log(`  \x1b[32m✓\x1b[0m ${provider.envKey}=****${apiKey.trim().slice(-4)}`);
        console.log(`  \x1b[32m✓\x1b[0m Saved to .env`);
        console.log(`\nRun \x1b[36mnpx synap dev\x1b[0m to start with AI enabled.\n`);
      } finally {
        rl.close();
      }
    });

  ai
    .command('remove')
    .description('Remove AI provider configuration')
    .action(() => {
      const cwd = process.cwd();
      const envPath = join(cwd, '.env');

      if (!existsSync(envPath)) {
        console.log('No .env file found.');
        return;
      }

      let envContent = readFileSync(envPath, 'utf-8');
      envContent = removeEnvVar(envContent, 'AI_PROVIDER');
      envContent = removeEnvVar(envContent, 'AI_MODEL');
      writeFileSync(envPath, envContent, 'utf-8');

      console.log('\n  \x1b[32m✓\x1b[0m AI provider removed from .env\n');
    });
}

function upsertEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;

  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return content.trimEnd() + '\n' + line + '\n';
}

function removeEnvVar(content: string, key: string): string {
  return content.replace(new RegExp(`^${key}=.*\n?`, 'm'), '');
}
