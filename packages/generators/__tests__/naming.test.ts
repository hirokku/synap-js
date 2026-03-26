import { describe, it, expect } from 'vitest';
import { toSnakeCase, toKebabCase, toTableName, toCamelCase } from '../src/utils/naming.js';

describe('naming utilities', () => {
  describe('toSnakeCase', () => {
    it('converts PascalCase', () => expect(toSnakeCase('OrderItem')).toBe('order_item'));
    it('converts camelCase', () => expect(toSnakeCase('createdAt')).toBe('created_at'));
    it('handles single word', () => expect(toSnakeCase('User')).toBe('user'));
    it('handles already snake', () => expect(toSnakeCase('user_id')).toBe('user_id'));
    it('handles multiple caps', () => expect(toSnakeCase('HTMLParser')).toBe('h_t_m_l_parser'));
  });

  describe('toKebabCase', () => {
    it('converts PascalCase', () => expect(toKebabCase('OrderItem')).toBe('order-item'));
    it('converts single word', () => expect(toKebabCase('User')).toBe('user'));
    it('converts camelCase', () => expect(toKebabCase('createdAt')).toBe('created-at'));
  });

  describe('toTableName', () => {
    it('pluralizes and snake_cases', () => expect(toTableName('User')).toBe('users'));
    it('handles compound names', () => expect(toTableName('OrderItem')).toBe('order_items'));
    it('does not double pluralize', () => expect(toTableName('Status')).toBe('status'));
  });

  describe('toCamelCase', () => {
    it('lowercases first letter', () => expect(toCamelCase('Product')).toBe('product'));
    it('preserves rest', () => expect(toCamelCase('OrderItem')).toBe('orderItem'));
  });
});
