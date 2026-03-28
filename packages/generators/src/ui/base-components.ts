import type { GeneratedFile, GeneratorContext } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export function generateBaseComponents(context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/components`;
  const header = generatedHeader('synap:ui');
  const files: GeneratedFile[] = [];

  files.push({
    path: `${dir}/button.tsx`,
    content: `${header}
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={\`inline-flex items-center justify-center rounded-lg font-medium transition-colors \${variants[variant]} \${sizes[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}
`,
  });

  files.push({
    path: `${dir}/input.tsx`,
    content: `${header}
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={inputId}
        className={\`rounded-lg border px-3 py-2 text-sm outline-none transition-colors \${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'} \${className}\`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/select.tsx`,
    content: `${header}
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={selectId}
        className={\`rounded-lg border px-3 py-2 text-sm outline-none transition-colors \${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'} \${className}\`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/textarea.tsx`,
    content: `${header}
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={textareaId}
        className={\`rounded-lg border px-3 py-2 text-sm outline-none transition-colors \${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'} \${className}\`}
        rows={4}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/card.tsx`,
    content: `${header}
import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div className={\`rounded-xl border border-gray-200 bg-white p-6 shadow-sm \${className}\`}>
      {children}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/badge.tsx`,
    content: `${header}
import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium \${variants[variant]}\`}>
      {children}
    </span>
  );
}
`,
  });

  files.push({
    path: `${dir}/pagination.tsx`,
    content: `${header}
import React from 'react';
import { Button } from './button.js';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/data-table.tsx`,
    content: `${header}
import React from 'react';
import { Pagination } from './pagination.js';

interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, page, totalPages, onPageChange, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr key={i} className={\`bg-white \${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}\`} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">No data</td></tr>
          )}
        </tbody>
      </table>
      {page && totalPages && onPageChange && (
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/form-field.tsx`,
    content: `${header}
import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
`,
  });

  files.push({
    path: `${dir}/index.ts`,
    content: `${header}
export { Button } from './button.js';
export { Input } from './input.js';
export { Select } from './select.js';
export { Textarea } from './textarea.js';
export { Card } from './card.js';
export { Badge } from './badge.js';
export { Pagination } from './pagination.js';
export { DataTable } from './data-table.js';
export { FormField } from './form-field.js';
`,
  });

  return files;
}
