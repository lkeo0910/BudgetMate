'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">BudgetMate</h1>
            <p className="text-sm text-muted-foreground mt-1">Smart Financial Management</p>
          </div>
        </div>

        {/* Auth Form Container */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2026 BudgetMate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
