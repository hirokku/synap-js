import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LanguageModel } from 'ai';
import { detectAiConfig, createModel, buildTools, askAi } from './adapter.js';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function startRepl(cwd: string): Promise<void> {
  // Load .env manually
  loadEnvFile(cwd);

  const config = detectAiConfig();
  let model: LanguageModel | null = null;

  if (config) {
    try {
      model = await createModel(config);
      console.log(`  \x1b[32m✓\x1b[0m AI: ${config.provider} (${config.model})`);
    } catch (err) {
      console.log(`  \x1b[33m!\x1b[0m AI config found but failed to load: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    // Offer interactive setup
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log('');
    const answer = await ask(rl, '  Configure AI for interactive mode? (y/N): ');
    rl.close();

    if (answer.trim().toLowerCase() === 'y') {
      const setupRl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        console.log('\n  Select provider:');
        console.log('    1. Claude (Anthropic)');
        console.log('    2. OpenAI');
        console.log('    3. Gemini (Google)\n');

        const choice = await ask(setupRl, '  Choose (1-3): ');
        const providers = [
          { key: 'claude', name: 'Claude', envKey: 'ANTHROPIC_API_KEY', modelId: 'claude-sonnet-4-20250514' },
          { key: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', modelId: 'gpt-4o' },
          { key: 'gemini', name: 'Gemini', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', modelId: 'gemini-2.0-flash' },
        ];
        const provider = providers[parseInt(choice, 10) - 1];

        if (provider) {
          const apiKey = await ask(setupRl, `  ${provider.envKey}: `);
          if (apiKey.trim()) {
            const envPath = join(cwd, '.env');
            let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
            envContent = upsertEnv(envContent, 'AI_PROVIDER', provider.key);
            envContent = upsertEnv(envContent, 'AI_MODEL', provider.modelId);
            envContent = upsertEnv(envContent, provider.envKey, apiKey.trim());
            writeFileSync(envPath, envContent, 'utf-8');

            // Set env vars for current process
            process.env['AI_PROVIDER'] = provider.key;
            process.env['AI_MODEL'] = provider.modelId;
            process.env[provider.envKey] = apiKey.trim();

            model = await createModel({ provider: provider.key, model: provider.modelId, apiKey: apiKey.trim() });
            console.log(`\n  \x1b[32m✓\x1b[0m AI: ${provider.name} configured and ready`);
          }
        }
      } catch {
        // Setup failed, continue without AI
      } finally {
        setupRl.close();
      }
    }
  }

  if (!model) {
    console.log('  \x1b[90m─\x1b[0m AI: disabled (run \x1b[36mnpx synap ai setup\x1b[0m to enable)');
  }

  // Start REPL
  const tools = buildTools(cwd);
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\n\x1b[36msynap>\x1b[0m ',
  });

  console.log('\n  Commands: \x1b[90mvalidate, generate, ask <prompt>, provider, help, exit\x1b[0m');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    try {
      if (input === 'exit' || input === 'quit') {
        rl.close();
        process.exit(0);
      }

      if (input === 'help') {
        console.log('\n  Available commands:');
        console.log('    validate          — Validate all specs');
        console.log('    generate          — Generate code from specs');
        console.log('    ask <prompt>      — Ask AI to perform actions');
        console.log('    provider          — Show current AI provider');
        console.log('    exit              — Stop the server\n');
        rl.prompt();
        return;
      }

      if (input === 'validate') {
        const result = await tools.validate.execute!({}, { toolCallId: '', messages: [], abortSignal: undefined as any });
        if ((result as any).success) {
          console.log(`  \x1b[32m✓\x1b[0m ${(result as any).message}`);
        } else {
          console.log(`  \x1b[31m✗\x1b[0m Errors found:`);
          for (const e of (result as any).parseErrors ?? []) console.log(`    ${e}`);
          for (const e of (result as any).resolveErrors ?? []) console.log(`    ${e}`);
        }
        rl.prompt();
        return;
      }

      if (input === 'generate' || input.startsWith('generate ')) {
        const target = input.split(' ')[1];
        const result = await tools.generate.execute!({ target: target as any }, { toolCallId: '', messages: [], abortSignal: undefined as any });
        if ((result as any).success) {
          console.log(`  \x1b[32m✓\x1b[0m Generated ${(result as any).filesGenerated} file(s)`);
        } else {
          console.log(`  \x1b[31m✗\x1b[0m ${((result as any).errors ?? []).join('\n    ')}`);
        }
        rl.prompt();
        return;
      }

      if (input === 'provider') {
        const cfg = detectAiConfig();
        if (cfg) {
          console.log(`  AI: ${cfg.provider} (${cfg.model})`);
        } else {
          console.log('  AI: not configured');
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('ask ')) {
        const prompt = input.slice(4).trim();
        if (!prompt) { console.log('  Usage: ask <prompt>'); rl.prompt(); return; }

        if (!model) {
          console.log('  \x1b[31m✗\x1b[0m No AI configured. Run: npx synap ai setup');
          rl.prompt();
          return;
        }

        console.log('  \x1b[90mThinking...\x1b[0m');
        const response = await askAi(model, tools, prompt);
        console.log(`\n  \x1b[33m🤖\x1b[0m ${response.replace(/\n/g, '\n  ')}`);
        rl.prompt();
        return;
      }

      // Default: treat as AI prompt if model is available
      if (model) {
        console.log('  \x1b[90mThinking...\x1b[0m');
        const response = await askAi(model, tools, input);
        console.log(`\n  \x1b[33m🤖\x1b[0m ${response.replace(/\n/g, '\n  ')}`);
      } else {
        console.log(`  Unknown command: "${input}". Type \x1b[36mhelp\x1b[0m for available commands.`);
      }
    } catch (err) {
      console.log(`  \x1b[31m✗\x1b[0m ${err instanceof Error ? err.message : String(err)}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

function loadEnvFile(cwd: string): void {
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function upsertEnv(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) return content.replace(regex, line);
  return content.trimEnd() + '\n' + line + '\n';
}
