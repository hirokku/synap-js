import { z } from 'zod';

const fieldTypes = [
  'string', 'text', 'integer', 'decimal', 'boolean', 'date',
  'timestamp', 'uuid', 'json', 'enum', 'email', 'url',
  'slug', 'password', 'file',
] as const;

const relationTypes = ['hasMany', 'belongsTo', 'hasOne', 'manyToMany'] as const;
const authLevels = ['public', 'authenticated', 'owner', 'admin'] as const;
const onDeleteActions = ['cascade', 'setNull', 'restrict', 'noAction'] as const;

const FieldSchema = z.object({
  type: z.enum(fieldTypes),
  primary: z.boolean().optional(),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  index: z.boolean().optional(),
  nullable: z.boolean().optional(),
  immutable: z.boolean().optional(),
  hidden: z.boolean().optional(),
  default: z.unknown().optional(),
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  format: z.string().optional(),
  trim: z.boolean().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
  values: z.array(z.string()).optional(),
  auto: z.enum(['create', 'update']).optional(),
  from: z.string().optional(),
  schema: z.record(z.unknown()).optional(),
  maxSize: z.string().optional(),
  allowedTypes: z.array(z.string()).optional(),
});

const RelationSchema = z.object({
  type: z.enum(relationTypes),
  model: z.string(),
  foreignKey: z.string().optional(),
  onDelete: z.enum(onDeleteActions).optional(),
  required: z.boolean().optional(),
  orderBy: z.string().optional(),
  pivotTable: z.string().optional(),
  pivotFields: z.record(FieldSchema).optional(),
});

const ApiAuthSchema = z.object({
  list: z.enum(authLevels).optional(),
  get: z.enum(authLevels).optional(),
  create: z.enum(authLevels).optional(),
  update: z.enum(authLevels).optional(),
  delete: z.enum(authLevels).optional(),
});

const ApiFilterSchema = z.object({
  field: z.string(),
  operators: z.array(z.string()),
});

const ApiConfigSchema = z.object({
  endpoints: z.array(z.string()).optional(),
  auth: ApiAuthSchema.optional(),
  fields: z.record(z.union([z.array(z.string()), z.literal('all')])).optional(),
  pagination: z.object({
    defaultLimit: z.number().optional(),
    maxLimit: z.number().optional(),
  }).optional(),
  filters: z.array(ApiFilterSchema).optional(),
  sortable: z.array(z.string()).optional(),
  include: z.record(z.array(z.string())).optional(),
  cache: z.record(z.string()).optional(),
});

const UiConfigSchema = z.object({
  components: z.array(z.string()).optional(),
  table: z.object({
    columns: z.array(z.string()).optional(),
    actions: z.array(z.string()).optional(),
    searchable: z.array(z.string()).optional(),
    filterable: z.array(z.string()).optional(),
  }).optional(),
  form: z.object({
    fields: z.array(z.object({
      field: z.string(),
      component: z.string().optional(),
    })).optional(),
    layout: z.string().optional(),
  }).optional(),
  detail: z.object({
    sections: z.array(z.object({
      title: z.string(),
      fields: z.array(z.string()),
    })).optional(),
  }).optional(),
});

const ErrorSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.string(),
});

const IndexSchema = z.object({
  fields: z.array(z.string()),
  unique: z.boolean().optional(),
  name: z.string().optional(),
});

const ValidationSchema = z.object({
  rule: z.string(),
  message: z.string(),
});

export const ModelSpecSchema = z.object({
  model: z.string().regex(/^[A-Z][a-zA-Z0-9]*$/, 'Model name must be PascalCase'),
  table: z.string().optional(),
  description: z.string().optional(),
  fields: z.record(FieldSchema).refine(
    (fields) => Object.keys(fields).length > 0,
    'At least one field is required',
  ),
  timestamps: z.boolean().optional().default(true),
  softDelete: z.boolean().optional().default(false),
  relations: z.record(RelationSchema).optional(),
  api: ApiConfigSchema.optional(),
  ui: UiConfigSchema.optional(),
  errors: z.record(ErrorSchema).optional(),
  indexes: z.array(IndexSchema).optional(),
  validations: z.array(ValidationSchema).optional(),
});

export type ValidatedModelSpec = z.infer<typeof ModelSpecSchema>;

export const VALID_FIELD_TYPES = fieldTypes;
export const VALID_RELATION_TYPES = relationTypes;
export const VALID_AUTH_LEVELS = authLevels;
