/**
 * Core spec types for the Kodeai framework.
 * These types represent the parsed YAML spec structure.
 */

export type FieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'uuid'
  | 'json'
  | 'enum'
  | 'email'
  | 'url'
  | 'slug'
  | 'password'
  | 'file';

export type RelationType = 'hasMany' | 'belongsTo' | 'hasOne' | 'manyToMany';

export type AuthLevel = 'public' | 'authenticated' | 'owner' | 'admin';

export type OnDeleteAction = 'cascade' | 'setNull' | 'restrict' | 'noAction';

export interface SpecField {
  type: FieldType;
  primary?: boolean;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  nullable?: boolean;
  immutable?: boolean;
  hidden?: boolean;
  default?: unknown;
  label?: string;
  // String constraints
  min?: number;
  max?: number;
  pattern?: string;
  format?: string;
  trim?: boolean;
  // Numeric constraints
  precision?: number;
  scale?: number;
  // Enum
  values?: string[];
  // Timestamp
  auto?: 'create' | 'update';
  // Slug
  from?: string;
  // JSON
  schema?: Record<string, unknown>;
  // File
  maxSize?: string;
  allowedTypes?: string[];
}

export interface SpecRelation {
  type: RelationType;
  model: string;
  foreignKey?: string;
  onDelete?: OnDeleteAction;
  required?: boolean;
  orderBy?: string;
  pivotTable?: string;
  pivotFields?: Record<string, SpecField>;
}

export interface SpecApiAuth {
  list?: AuthLevel;
  get?: AuthLevel;
  create?: AuthLevel;
  update?: AuthLevel;
  delete?: AuthLevel;
}

export interface SpecApiFilter {
  field: string;
  operators: string[];
}

export interface SpecApiConfig {
  endpoints?: string[];
  auth?: SpecApiAuth;
  fields?: Record<string, string[] | 'all'>;
  pagination?: {
    defaultLimit?: number;
    maxLimit?: number;
  };
  filters?: SpecApiFilter[];
  sortable?: string[];
  include?: Record<string, string[]>;
  cache?: Record<string, string>;
}

export interface SpecUiConfig {
  components?: string[];
  table?: {
    columns?: string[];
    actions?: string[];
    searchable?: string[];
    filterable?: string[];
  };
  form?: {
    fields?: Array<{ field: string; component?: string }>;
    layout?: string;
  };
  detail?: {
    sections?: Array<{ title: string; fields: string[] }>;
  };
}

export interface SpecError {
  status: number;
  code: string;
  message: string;
}

export interface SpecIndex {
  fields: string[];
  unique?: boolean;
  name?: string;
}

export interface SpecValidation {
  rule: string;
  message: string;
}

export interface SpecModel {
  model: string;
  table?: string;
  description?: string;
  fields: Record<string, SpecField>;
  timestamps?: boolean;
  softDelete?: boolean;
  relations?: Record<string, SpecRelation>;
  api?: SpecApiConfig;
  ui?: SpecUiConfig;
  errors?: Record<string, SpecError>;
  indexes?: SpecIndex[];
  validations?: SpecValidation[];
}

export interface SpecAuthConfig {
  strategy: 'jwt' | 'session';
  secret?: string;
  expiresIn?: string;
  refreshToken?: boolean;
  passwordHashing?: 'argon2' | 'bcrypt';
  roles?: string[];
  defaultRole?: string;
  registration?: boolean;
  emailVerification?: boolean;
  passwordReset?: boolean;
  lockout?: {
    maxAttempts?: number;
    duration?: string;
  };
}

export interface SpecAppConfig {
  app: {
    name: string;
    version: string;
    description?: string;
  };
  database?: {
    provider: 'postgresql' | 'sqlite' | 'mysql';
    schema?: string;
  };
  auth?: SpecAuthConfig;
  api?: {
    prefix?: string;
    versioning?: boolean;
    rateLimit?: {
      window?: string;
      max?: number;
      auth?: Record<string, string>;
    };
    defaultAuth?: AuthLevel;
  };
  ui?: {
    framework?: string;
    styling?: string;
    theme?: Record<string, string>;
  };
  observability?: {
    logging?: string;
    level?: string;
    metrics?: boolean;
    tracing?: boolean;
    healthCheck?: boolean;
  };
}

export interface SpecJobTrigger {
  event?: string;
  model?: string;
  schedule?: string;
}

export interface SpecJob {
  job: string;
  trigger: SpecJobTrigger;
  queue?: string;
  retry?: {
    attempts?: number;
    backoff?: 'exponential' | 'linear' | 'fixed';
    delay?: string;
  };
  timeout?: string;
}

export interface SpecEmail {
  email: string;
  subject: string;
  trigger?: SpecJobTrigger;
  variables?: Record<string, string>;
}

export type Spec = SpecModel | SpecAppConfig | SpecJob | SpecEmail;
