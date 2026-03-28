/**
 * Synap configuration types (synap.config.ts)
 */

export interface DatabaseConfig {
  provider: 'postgresql' | 'sqlite' | 'mysql';
  url: string;
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMs?: number;
  };
}

export interface GenerateConfig {
  outputDir?: string;
  extensionsDir?: string;
  specsDir?: string;
  autoTest?: boolean;
  autoValidate?: boolean;
}

export interface ApiConfig {
  prefix?: string;
  defaultPagination?: {
    page?: number;
    limit?: number;
    maxLimit?: number;
  };
  cors?: boolean | {
    origin?: string[];
    methods?: string[];
    credentials?: boolean;
  };
}

export interface AuthConfig {
  strategy: 'jwt' | 'session' | 'none';
  secret?: string;
  expiresIn?: string;
  refreshToken?: boolean;
}

export interface UiConfig {
  framework?: 'react';
  styling?: 'tailwind';
}

export interface McpConfig {
  enabled?: boolean;
  mode?: 'local' | 'remote';
  port?: number;
  readOnly?: boolean;
  authToken?: string;
}

export interface AiConfig {
  contextFiles?: {
    claude?: boolean;
    codex?: boolean;
    cursor?: boolean;
    copilot?: boolean;
    windsurf?: boolean;
    cline?: boolean;
    manifest?: boolean;
  };
  mcp?: {
    claude?: boolean;
    cursor?: boolean;
    vscode?: boolean;
  };
  customInstructions?: string;
}

export interface JobsConfig {
  provider?: 'bullmq' | 'in-memory';
  redis?: string;
  queues?: Record<string, { concurrency?: number }>;
  defaultRetries?: number;
}

export interface EmailConfig {
  provider?: 'resend' | 'sendgrid' | 'postmark' | 'smtp';
  apiKey?: string;
  from?: string;
}

export interface SynapConfig {
  database: DatabaseConfig;
  generate?: GenerateConfig;
  api?: ApiConfig;
  auth?: AuthConfig;
  ui?: UiConfig;
  mcp?: McpConfig;
  ai?: AiConfig;
  plugins?: unknown[];
  jobs?: JobsConfig;
  email?: EmailConfig;
}

export function defineConfig(config: SynapConfig): SynapConfig {
  return config;
}
