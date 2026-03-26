import { describe, it, expect } from 'vitest';
import { ModelSpecSchema, VALID_FIELD_TYPES } from '../src/schemas/model.schema.js';

describe('ModelSpecSchema validation', () => {
  const validBase = {
    model: 'Product',
    fields: { id: { type: 'uuid', primary: true } },
  };

  // Model name validation
  describe('model name', () => {
    it('accepts PascalCase names', () => {
      expect(ModelSpecSchema.safeParse({ ...validBase, model: 'User' }).success).toBe(true);
      expect(ModelSpecSchema.safeParse({ ...validBase, model: 'OrderItem' }).success).toBe(true);
      expect(ModelSpecSchema.safeParse({ ...validBase, model: 'A' }).success).toBe(true);
    });

    it('rejects non-PascalCase names', () => {
      expect(ModelSpecSchema.safeParse({ ...validBase, model: 'user' }).success).toBe(false);
      expect(ModelSpecSchema.safeParse({ ...validBase, model: 'order_item' }).success).toBe(false);
      expect(ModelSpecSchema.safeParse({ ...validBase, model: '123' }).success).toBe(false);
      expect(ModelSpecSchema.safeParse({ ...validBase, model: '' }).success).toBe(false);
    });

    it('rejects missing model name', () => {
      expect(ModelSpecSchema.safeParse({ fields: { id: { type: 'uuid' } } }).success).toBe(false);
    });
  });

  // Field type validation
  describe('field types', () => {
    for (const fieldType of VALID_FIELD_TYPES) {
      it(`accepts field type: ${fieldType}`, () => {
        const spec = {
          model: 'Test',
          fields: { field1: { type: fieldType, ...(fieldType === 'enum' ? { values: ['a'] } : {}) } },
        };
        expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
      });
    }

    it('rejects invalid field type', () => {
      const spec = { model: 'Test', fields: { field1: { type: 'money' } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(false);
    });

    it('rejects empty fields', () => {
      expect(ModelSpecSchema.safeParse({ model: 'Test', fields: {} }).success).toBe(false);
    });
  });

  // Field constraints
  describe('field constraints', () => {
    it('accepts string with min/max', () => {
      const spec = { model: 'Test', fields: { name: { type: 'string', min: 1, max: 200 } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts decimal with precision/scale', () => {
      const spec = { model: 'Test', fields: { price: { type: 'decimal', precision: 10, scale: 2 } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts enum with values', () => {
      const spec = { model: 'Test', fields: { status: { type: 'enum', values: ['a', 'b', 'c'] } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts boolean with default', () => {
      const spec = { model: 'Test', fields: { active: { type: 'boolean', default: true } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts timestamp with auto', () => {
      const spec = { model: 'Test', fields: { ts: { type: 'timestamp', auto: 'create' } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts uuid with primary', () => {
      const spec = { model: 'Test', fields: { id: { type: 'uuid', primary: true } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts field with unique, index, hidden, nullable, immutable', () => {
      const spec = {
        model: 'Test',
        fields: { email: { type: 'email', unique: true, index: true, hidden: false, nullable: false, immutable: false } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts pattern constraint', () => {
      const spec = { model: 'Test', fields: { code: { type: 'string', pattern: '^[A-Z]+$' } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts password with min and hidden', () => {
      const spec = { model: 'Test', fields: { pw: { type: 'password', min: 8, hidden: true } } };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });
  });

  // Relations
  describe('relations', () => {
    it('accepts hasMany relation', () => {
      const spec = {
        ...validBase,
        relations: { posts: { type: 'hasMany', model: 'Post', foreignKey: 'authorId' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts belongsTo relation', () => {
      const spec = {
        ...validBase,
        relations: { author: { type: 'belongsTo', model: 'User', onDelete: 'cascade', required: true } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts hasOne relation', () => {
      const spec = {
        ...validBase,
        relations: { profile: { type: 'hasOne', model: 'Profile' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts manyToMany with pivot', () => {
      const spec = {
        ...validBase,
        relations: { tags: { type: 'manyToMany', model: 'Tag', pivotTable: 'post_tags' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('rejects invalid relation type', () => {
      const spec = {
        ...validBase,
        relations: { x: { type: 'invalid', model: 'Y' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(false);
    });

    it('rejects invalid onDelete action', () => {
      const spec = {
        ...validBase,
        relations: { x: { type: 'belongsTo', model: 'Y', onDelete: 'destroy' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(false);
    });
  });

  // API config
  describe('api config', () => {
    it('accepts full api config', () => {
      const spec = {
        ...validBase,
        api: {
          endpoints: ['list', 'get', 'create', 'update', 'delete'],
          auth: { list: 'public', create: 'authenticated', delete: 'admin' },
          pagination: { defaultLimit: 20, maxLimit: 100 },
          sortable: ['name', 'createdAt'],
          filters: [{ field: 'name', operators: ['contains'] }],
        },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts api with include', () => {
      const spec = {
        ...validBase,
        api: { endpoints: ['list', 'get'], include: { list: ['author'], get: ['author', 'comments'] } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('rejects invalid auth level', () => {
      const spec = {
        ...validBase,
        api: { endpoints: ['list'], auth: { list: 'superadmin' } },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(false);
    });
  });

  // Timestamps and softDelete
  describe('timestamps and softDelete', () => {
    it('defaults timestamps to true', () => {
      const result = ModelSpecSchema.parse(validBase);
      expect(result.timestamps).toBe(true);
    });

    it('defaults softDelete to false', () => {
      const result = ModelSpecSchema.parse(validBase);
      expect(result.softDelete).toBe(false);
    });

    it('accepts timestamps: false', () => {
      const spec = { ...validBase, timestamps: false };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });

    it('accepts softDelete: true', () => {
      const spec = { ...validBase, softDelete: true };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });
  });

  // Custom errors
  describe('custom errors', () => {
    it('accepts error definitions', () => {
      const spec = {
        ...validBase,
        errors: {
          outOfStock: { status: 409, code: 'OUT_OF_STOCK', message: 'Product is out of stock' },
        },
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });
  });

  // Indexes
  describe('indexes', () => {
    it('accepts composite indexes', () => {
      const spec = {
        ...validBase,
        indexes: [
          { fields: ['field1', 'field2'], unique: true },
          { fields: ['field3'], name: 'idx_custom' },
        ],
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });
  });

  // Validations
  describe('validations', () => {
    it('accepts validation rules', () => {
      const spec = {
        ...validBase,
        validations: [
          { rule: 'endDate > startDate', message: 'End must be after start' },
        ],
      };
      expect(ModelSpecSchema.safeParse(spec).success).toBe(true);
    });
  });
});
