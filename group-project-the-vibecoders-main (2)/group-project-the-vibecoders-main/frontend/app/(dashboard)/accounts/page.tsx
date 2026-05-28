'use client';

import React from 'react';
import { CreditCard, Landmark, ShieldCheck, WalletCards } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AccountsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-sky-50 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Accounts</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">Accounts Overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          This page is reserved for linked bank accounts, cash balances, and cards.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Bank Accounts</h2>
          <p className="mt-2 text-sm text-slate-500">Connected checking and savings accounts will appear here later.</p>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Cards</h2>
          <p className="mt-2 text-sm text-slate-500">Credit and debit cards can be added here once account linking is ready.</p>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Safe Sync</h2>
          <p className="mt-2 text-sm text-slate-500">When enabled, account sync will fill balances here without affecting your manual goals page.</p>
        </Card>
      </div>

    </div>
  );
}
