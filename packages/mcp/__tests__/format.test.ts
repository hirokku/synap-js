import { describe, it, expect } from 'vitest';
import type { SpecModel } from '@synap-js/core';
import {
  formatManifest,
  formatModelList,
  formatModelDetail,
  formatRoutes,
  formatErrors,
  formatConfig,
} from '../src/utils/format.js';

const taskSpec: SpecModel = {
  model: 'Task',
  fields: {
    id: { type: 'uuid', primary: true },
    title: { type: 'string', min: 1, max: 200 },
    completed: { type: 'boolean', default: false },
    priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
  },
  api: {
    endpoints: ['list', 'get', 'create', 'update', 'delete'],
    auth: { list: 'public', create: 'authenticated', delete: 'admin' },
    pagination: { defaultLimit: 20, maxLimit: 100 },
    sortable: ['title', 'createdAt'],
  },
};

const userSpec: SpecModel = {
  model: 'User',
  fields: {
    id: { type: 'uuid', primary: true },
    email: { type: 'email', unique: true },
  },
  relations: {
    tasks: { type: 'hasMany', model: 'Task' },
  },
  api: {
    endpoints: ['list', 'get'],
    auth: { list: 'public', get: 'public' },
  },
};

describe('formatManifest', () => {
  it('summarizes project', () => {
    const text = formatManifest([taskSpec, userSpec]);
    expect(text).toContain('Models: 2');
    expect(text).toContain('Fields: 6');
    expect(text).toContain('Relations: 1');
    expect(text).toContain('Endpoints: 7');
    expect(text).toContain('Task');
    expect(text).toContain('User');
  });

  it('handles empty specs', () => {
    const text = formatManifest([]);
    expect(text).toContain('Models: 0');
  });
});

describe('formatModelList', () => {
  it('lists all models', () => {
    const text = formatModelList([taskSpec, userSpec]);
    expect(text).toContain('## Task');
    expect(text).toContain('## User');
    expect(text).toContain('id, title, completed, priority');
    expect(text).toContain('hasMany Task');
  });

  it('returns message for empty specs', () => {
    expect(formatModelList([])).toBe('No models defined.');
  });
});

describe('formatModelDetail', () => {
  it('shows full model detail', () => {
    const text = formatModelDetail(taskSpec);
    expect(text).toContain('# Task');
    expect(text).toContain('id: uuid, primary');
    expect(text).toContain('title: string, min:1, max:200');
    expect(text).toContain('priority: enum, default:medium, values:[low,medium,high]');
    expect(text).toContain('Endpoints: list, get, create, update, delete');
    expect(text).toContain('list:public');
    expect(text).toContain('Sortable: title, createdAt');
  });

  it('shows relations', () => {
    const text = formatModelDetail(userSpec);
    expect(text).toContain('## Relations');
    expect(text).toContain('tasks: hasMany Task');
  });
});

describe('formatRoutes', () => {
  it('lists all routes with auth', () => {
    const text = formatRoutes([taskSpec]);
    expect(text).toContain('GET    /api/tasks');
    expect(text).toContain('POST   /api/tasks');
    expect(text).toContain('DELETE /api/tasks/:id');
    expect(text).toContain('[public]');
    expect(text).toContain('[authenticated]');
    expect(text).toContain('[admin]');
  });

  it('returns message when no routes', () => {
    const spec: SpecModel = { model: 'Empty', fields: { id: { type: 'uuid' } } };
    expect(formatRoutes([spec])).toBe('No API routes defined.');
  });
});

describe('formatErrors', () => {
  it('returns success when no errors', () => {
    expect(formatErrors([], [])).toContain('All specs valid');
  });

  it('formats parse errors', () => {
    const text = formatErrors(
      [{ file: 'test.yaml', message: 'Invalid type', suggestion: 'Use string' }],
      [],
    );
    expect(text).toContain('Parse Errors');
    expect(text).toContain('Invalid type');
    expect(text).toContain('Use string');
  });

  it('formats resolve errors', () => {
    const text = formatErrors(
      [],
      [{ code: 'CIRCULAR_DEPENDENCY', message: 'Cycle detected' }],
    );
    expect(text).toContain('Resolution Errors');
    expect(text).toContain('CIRCULAR_DEPENDENCY');
  });
});

describe('formatConfig', () => {
  it('shows project paths', () => {
    const text = formatConfig('/home/user/my-app');
    expect(text).toContain('Root: /home/user/my-app');
    expect(text).toContain('Specs: specs/');
    expect(text).toContain('Output: src/generated/');
  });
});
