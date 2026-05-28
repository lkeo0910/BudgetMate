'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">
          Welcome back, Vibecoders
        </h1>
        <p className="text-slate-500 text-lg">
          Here is a high-level look at your financial health today.
        </p>
      </header>

      <Card className="relative overflow-hidden border-0 shadow-2xl bg-white p-12 group transition-all hover:shadow-teal-100/50">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60 group-hover:bg-teal-100 transition-colors duration-500" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-40 group-hover:bg-blue-100 transition-colors duration-500" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          <div className="p-3 bg-teal-50 rounded-2xl">
            <Wallet className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Remaining Budget</p>
            <h2 className="text-6xl font-bold text-teal-500 tracking-tighter">
              23,810,000 ₫
            </h2>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-teal-200 transition-all hover:-translate-y-0.5">
                Go to Dashboard
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" className="h-12 border-slate-200 rounded-xl px-8 hover:bg-slate-50 transition-all">
                Login
                <Sparkles className="ml-2 w-4 h-4 text-amber-500" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-800">Financial Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center p-8">
              <TrendingUp className="w-12 h-12 text-white/40 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">How to Budget Better</h4>
              <p className="text-sm text-slate-500 line-clamp-2">Practical tips to manage your daily expenses and save more for the future.</p>
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-8">
              <BookOpen className="w-12 h-12 text-white/40 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Understanding 50/30/20</h4>
              <p className="text-sm text-slate-500 line-clamp-2">Master the world-renowned 50/30/20 budgeting rule for balanced finance.</p>
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="h-40 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-8">
              <ShieldCheck className="w-12 h-12 text-white/40 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-5 space-y-2">
              <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Smart Saving Strategies</h4>
              <p className="text-sm text-slate-500 line-clamp-2">Protect your financial future with smart, automated saving habits.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
