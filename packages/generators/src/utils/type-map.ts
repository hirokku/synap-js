/**
 * Maps spec field types to TypeScript types and Drizzle column types.
 */

export function specTypeToTS(type: string): string {
  const map: Record<string, string> = {
    string: 'string',
    text: 'string',
    integer: 'number',
    decimal: 'number',
    boolean: 'boolean',
    date: 'Date',
    timestamp: 'Date',
    uuid: 'string',
    json: 'Record<string, unknown>',
    enum: 'string',
    email: 'string',
    url: 'string',
    slug: 'string',
    password: 'string',
    file: 'string',
  };
  return map[type] ?? 'unknown';
}

export function specTypeToDrizzle(type: string, field: { precision?: number; scale?: number; max?: number; values?: string[] }): string {
  switch (type) {
    case 'string':
    case 'email':
    case 'url':
    case 'slug':
    case 'password':
      return field.max ? `varchar('__COL__', { length: ${field.max} })` : `varchar('__COL__')`;
    case 'text':
      return `text('__COL__')`;
    case 'integer':
      return `integer('__COL__')`;
    case 'decimal':
      return `decimal('__COL__', { precision: ${field.precision ?? 10}, scale: ${field.scale ?? 2} })`;
    case 'boolean':
      return `boolean('__COL__')`;
    case 'date':
      return `date('__COL__')`;
    case 'timestamp':
      return `timestamp('__COL__')`;
    case 'uuid':
      return `uuid('__COL__')`;
    case 'json':
      return `jsonb('__COL__')`;
    case 'enum':
      if (field.values && field.values.length > 0) {
        const vals = field.values.map((v) => `'${v}'`).join(', ');
        return `varchar('__COL__')`;  // Use varchar for enums (simpler, portable)
      }
      return `varchar('__COL__')`;
    case 'file':
      return `varchar('__COL__')`;
    default:
      return `varchar('__COL__')`;
  }
}
