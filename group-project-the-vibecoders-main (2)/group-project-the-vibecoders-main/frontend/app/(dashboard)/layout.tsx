'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/layout/sidebar';
import { Header } from '@/components/dashboard/layout/header';
import { Button } from '@/components/ui/button';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('access_token'));
      setAuthChecked(true);
    };

    syncAuth();
    window.addEventListener('auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  if (pathname === '/') {
    return <>{children}</>;
  }

  if (!authChecked) {
    return null;
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Login Required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Please sign in to access Dashboard, Transactions, AI Assistant, Accounts, and Settings.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/auth">
              <Button>Go to Login</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-slate-50 dark:from-slate-950 dark:to-slate-900 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
