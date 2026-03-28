import type { GeneratedFile, GeneratorContext } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export function generateAuthComponents(context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/auth`;
  const header = generatedHeader('synap:auth');
  const files: GeneratedFile[] = [];

  // Auth context
  files.push({
    path: `${dir}/auth-context.tsx`,
    content: `${header}
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('synap_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: \`Bearer \${t}\` } });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        localStorage.removeItem('synap_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.message ?? 'Login failed' };
      localStorage.setItem('synap_token', json.data.token);
      setToken(json.data.token);
      setUser(json.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.message ?? 'Registration failed' };
      localStorage.setItem('synap_token', json.data.token);
      setToken(json.data.token);
      setUser(json.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('synap_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
`,
  });

  // Protected route wrapper
  files.push({
    path: `${dir}/protected-route.tsx`,
    content: `${header}
import React from 'react';
import { useAuth } from './auth-context.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">Go Home</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`,
  });

  // Auth fetch helper
  files.push({
    path: `${dir}/fetch-utils.ts`,
    content: `${header}
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('synap_token');
  if (token) headers['Authorization'] = \`Bearer \${token}\`;
  return headers;
}
`,
  });

  // Index
  files.push({
    path: `${dir}/index.ts`,
    content: `${header}
export { AuthProvider, useAuth } from './auth-context.js';
export { ProtectedRoute } from './protected-route.js';
export { getAuthHeaders } from './fetch-utils.js';
`,
  });

  return files;
}
