// Hook system stub — implemented in Phase 6

export interface HookDefinition<T> {
  beforeCreate?: (input: unknown, ctx: unknown) => Promise<unknown>;
  afterCreate?: (record: T, ctx: unknown) => Promise<void>;
  beforeUpdate?: (input: unknown, ctx: unknown) => Promise<unknown>;
  afterUpdate?: (record: T, ctx: unknown) => Promise<void>;
  beforeDelete?: (id: string, ctx: unknown) => Promise<void>;
  afterDelete?: (id: string, ctx: unknown) => Promise<void>;
}

export function defineHooks<T>(_hooks: HookDefinition<T>): HookDefinition<T> {
  return _hooks;
}
