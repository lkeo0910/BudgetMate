'use client';

import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { DataTable } from '@/components/dashboard/transactions/data-table';
import { createTransactionColumns } from '@/components/dashboard/transactions/columns';
import { mockTransactions, formatVND } from '@/types/transaction';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, ChevronDown, MoreHorizontal, X, AlertCircle, Wallet, 
  LayoutDashboard, ArrowRightLeft, Settings, Search, Bell, User, 
  Lock, ArrowLeft, ScanLine, FileText, PlusCircle, UploadCloud,
  Home, BarChart3, Sparkles, Send, Paperclip, Bot, Info, Trash2, Plus,
  Monitor, Smartphone, Globe, Languages, ShieldCheck, BadgeCheck,
  SlidersHorizontal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Sidebar } from '@/components/dashboard/layout/sidebar';
import HomePage from '@/app/(dashboard)/page';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import ChatPage from '@/app/(dashboard)/chat/page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function UIComponentsPage() {
  const columns = React.useMemo(
    () =>
      createTransactionColumns({
        onEdit: () => undefined,
        onDelete: () => undefined,
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-900 py-24 flex flex-col items-center">

      {/* GROUP 0: Full Home Page (/) */}
      <div className="flex flex-col items-center w-full">
        <h1 className="text-4xl font-extrabold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Group 0: Full Home Page (/)</h1>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              <Sidebar open={true} onToggle={() => {}} />
            </div>
            <div className="flex-1 flex flex-col bg-background overflow-hidden font-sans">
              <div className="bg-white border-b h-16 flex items-center px-6 justify-between flex-shrink-0">
                 <div className="text-sm font-medium text-slate-400 italic">Search bar isolated (only on /transactions)</div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <HomePage />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* GROUP 1: OBSOLETE (REMOVED) */}

      {/* GROUP 2: Full Transaction History Page (/transactions) */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Group 2: Full Transaction History Page (/transactions)</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
            {/* Header (Search Hidden) */}
            <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
                </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-8 text-slate-900">
                {/* Page Header */}
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-extrabold tracking-tight">Full Transaction History</h1>
                  <p className="text-muted-foreground text-sm">Review OCR scans and manage your financial record.</p>
                </div>

                {/* Needs Review */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ScanLine className="h-5 w-5 text-amber-500" />
                    <span className="text-lg font-semibold">Needs Review</span>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300">2 pending</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 overflow-hidden">
                        <div className="flex items-center gap-2"><span className="text-base font-bold">115,000 ₫</span><span className="text-slate-700 font-medium truncate">at Highlands Coffee</span></div>
                        <div className="text-xs text-slate-500">Mar 30, 2026 • Confidence 92%</div>
                      </div>
                      <Button size="sm" className="bg-teal-500 text-white shrink-0">Review & File</Button>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 overflow-hidden">
                        <div className="flex items-center gap-2"><span className="text-base font-bold">95,000 ₫</span><span className="text-slate-700 font-medium truncate">at GrabBike</span></div>
                        <div className="text-xs text-slate-500">Mar 29, 2026 • Confidence 88%</div>
                      </div>
                      <Button size="sm" className="bg-teal-500 text-white shrink-0">Review & File</Button>
                    </div>
                  </div>
                </div>

                {/* Unified Action Bar */}
                <div className="flex items-center gap-3">
                  {/* Left: Search Bar */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search by vendor or description..." className="pl-10 h-11 border-slate-200 bg-white" readOnly />
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" className="h-11 px-4 border-slate-200 text-slate-600 font-semibold gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filter
                    </Button>
                    <Button variant="outline" className="h-11 px-4 border-slate-200 text-slate-600 font-semibold">
                      Export CSV
                    </Button>
                    <Button className="bg-teal-500 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-teal-200/50 gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Transaction
                    </Button>
                  </div>
                </div>

                <DataTable columns={columns} data={mockTransactions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GROUP 4: Static Modal Replica */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Group 4: Static Modal Replica</h2>
        <div className="w-[1440px] h-[900px] bg-slate-50 p-12 rounded-lg border flex items-center justify-center">
          <div className="bg-white rounded-lg border shadow-lg sm:max-w-[500px] w-full flex flex-col relative z-0 overflow-hidden">
            <div className="p-6 pb-2 border-b">
              <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900">Add Transaction</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Upload a receipt or enter details manually below.</p>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 transition-all bg-teal-50/20 text-center cursor-default">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Drop receipt here to auto-fill</p>
                  <p className="text-xs text-slate-400 font-medium">PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              {/* Form Content Mock */}
              <div className="space-y-5">
                <Tabs defaultValue="expense" className="w-full">
                  <TabsList className="w-full h-11 bg-slate-100/80">
                    <TabsTrigger value="expense" className="w-1/2">Expense</TabsTrigger>
                    <TabsTrigger value="income" className="w-1/2">Income</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Amount (₫)</label>
                    <Input value="65,000 ₫" readOnly className="font-bold text-slate-900 border-slate-200 h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date</label>
                    <div className="flex h-11 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm justify-between items-center text-slate-900 font-medium">
                      Mar 30, 2026
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Vendor</label>
                  <Input value="Highlands Coffee" readOnly className="text-slate-900 font-medium border-slate-200 h-11" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <div className="flex h-11 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm justify-between items-center text-slate-900 font-medium">
                    Food & Groceries
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </div>

                <Button className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200/50 mt-2">
                  Save Transaction
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* GROUP 5: OBSOLETE (REMOVED) */}

      {/* GROUP 6: OBSOLETE (REMOVED) */}

      {/* GROUP 7: OBSOLETE (REMOVED) */}

      {/* GROUP 8: Analytical Dashboard Page (/dashboard) */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Group 8: Analytical Dashboard (/dashboard)</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
             <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
                </div>
              </div>
            <div className="flex-1 overflow-y-auto p-8">
              <DashboardPage />
            </div>
          </div>
        </div>
      </div>

      {/* GROUP 9: AI Chat Interface (Mirror of /chat) */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Group 9: AI Chat Interface (Mirror of /chat)</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative font-sans">
             <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
                </div>
              </div>
             <div className="flex-1 p-8 overflow-hidden">
                <div className="border rounded-2xl shadow-xl bg-white flex flex-col h-full max-w-5xl mx-auto overflow-hidden border-slate-100">
                  <div className="px-6 py-4 bg-white border-b flex items-center justify-between shadow-sm flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-200"><Sparkles className="w-6 h-6" /></div>
                      <div><h2 className="text-xl font-bold text-slate-900 leading-tight">BudgetMate AI Assistant</h2><p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Online • Real-time Data</p></div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400"><Info className="w-5 h-5" /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 bg-slate-50/50 text-slate-800">
                    <div className="flex justify-start"><div className="flex gap-4 max-w-[85%] items-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm"><Bot className="w-5 h-5" /></div><div className="p-4 rounded-2xl shadow-sm text-sm bg-white border border-slate-100 font-medium leading-relaxed">Hello! I am your BudgetMate AI. I can review your transactions, analyze trends, or help with a custom budget. What's on your mind?</div></div></div>
                    <div className="flex justify-end"><div className="flex gap-4 max-w-[85%] flex-row-reverse items-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-sm"><User className="w-5 h-5" /></div><div className="p-4 rounded-2xl shadow-sm text-sm bg-teal-500 text-white font-bold">Can you review my grocery spending for March?</div></div></div>
                    <div className="flex justify-start"><div className="flex gap-4 max-w-[85%] items-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm"><Bot className="w-5 h-5" /></div><div className="p-4 rounded-2xl shadow-sm text-sm bg-white border border-slate-100 leading-relaxed font-medium">Certainly! Looking at your data for March, your Grocery spending is slightly higher than usual...<div className="mt-4 border-0 bg-slate-50 overflow-hidden text-slate-900 shadow-inner rounded-xl font-sans"><table className="w-full text-[11px]"><thead><tr className="bg-slate-100/50 text-slate-500 font-bold uppercase tracking-wider"><th className="p-3 text-left">Category</th><th className="p-3 text-right">Spent</th><th className="p-3 text-right">Limit</th></tr></thead><tbody><tr><td className="p-3 font-bold">Food & Groceries</td><td className="p-3 text-right font-extrabold text-red-500">5,265,000 ₫</td><td className="p-3 text-right text-slate-400 font-bold">5,000,000 ₫</td></tr></tbody></table></div></div></div></div>
                  </div>
                  <div className="p-4 lg:p-6 bg-white border-t flex flex-shrink-0 items-center justify-center">
                    <div className="w-full flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                      <Button variant="ghost" size="icon" className="text-slate-400 rounded-xl h-10 w-10"><Paperclip className="w-5 h-5" /></Button>
                      <Input placeholder="Ask me to 'analyze groceries' or 'review utilities'..." className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-slate-700 h-10 placeholder:text-slate-400 text-sm font-medium" disabled />
                      <Button className="bg-teal-500 text-white rounded-xl h-10 w-10 p-0 shadow-lg shadow-teal-200/50" disabled><Send className="w-5 h-5" /></Button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* GROUP 10: Command Palette (Cmd+K) — static rendering */}
      <div>
        <h2 className="text-3xl font-bold mt-24 mb-10 text-slate-900 border-b pb-4">Group 10: Command Palette (Cmd+K)</h2>
        <div className="w-full border rounded-xl shadow-sm bg-slate-900/5 p-12 flex items-start justify-center">
          <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl overflow-hidden font-sans">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 text-sm text-slate-400">Type a command or search…</span>
              <kbd className="pointer-events-none select-none rounded border bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">⌘K</kbd>
            </div>
            <div className="py-2 max-h-[320px] overflow-y-auto">
              <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-widest">Actions</div>
               <div className="flex items-center gap-2 rounded-md mx-1 px-3 py-2.5 text-sm bg-slate-100 text-slate-900 cursor-default">
                <PlusCircle className="w-4 h-4 text-teal-500" />
                Add Transaction
              </div>
              <div className="my-1 mx-2 h-px bg-slate-100" />
              <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-widest">Navigation</div>
              <div className="flex items-center gap-2 rounded-md mx-1 px-3 py-2.5 text-sm text-slate-700 cursor-default hover:bg-slate-50">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                Jump to Dashboard
              </div>
              <div className="flex items-center gap-2 rounded-md mx-1 px-3 py-2.5 text-sm text-slate-700 cursor-default hover:bg-slate-50">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                Jump to Transactions
              </div>
              <div className="flex items-center gap-2 rounded-md mx-1 px-3 py-2.5 text-sm text-slate-700 cursor-default hover:bg-slate-50">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Jump to AI Assistant
              </div>
              <div className="flex items-center gap-2 rounded-md mx-1 px-3 py-2.5 text-sm text-slate-700 cursor-default hover:bg-slate-50">
                <Settings className="w-4 h-4 text-slate-400" />
                Jump to Settings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS - GENERAL */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Settings - General</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
             <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
                </div>
              </div>
            <div className="flex-1 p-8 overflow-y-auto text-slate-900">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-1"><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="text-slate-500 text-sm">Manage your account preferences and budget configurations.</p></div>
                <div className="grid grid-cols-4 gap-8">
                  <div className="col-span-1 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-teal-50 text-teal-700 font-bold border border-teal-100"><Settings className="w-4 h-4" /> General</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-600"><Wallet className="w-4 h-4" /> Budget</div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-600"><Lock className="w-4 h-4" /> Security</div>
                  </div>
                  <Card className="col-span-3 p-6 space-y-8 bg-white border-slate-200">
                     <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20 border border-slate-100 shadow-sm"><AvatarFallback className="bg-teal-50 text-teal-600 font-bold text-xl">VC</AvatarFallback></Avatar>
                        <div className="space-y-2">
                           <h3 className="text-sm font-bold text-slate-800">Profile Photo</h3>
                           <Button size="sm" className="bg-white border-slate-200 text-slate-700 font-bold shadow-sm h-9 px-4">Upload Photo</Button>
                        </div>
                     </div>
                     <div className="max-w-sm space-y-2"><Label className="text-sm font-bold text-slate-700">Preferred Currency</Label><div className="h-11 border border-slate-200 rounded-md px-3 flex items-center justify-between font-bold text-slate-800 bg-white">Vietnamese Dong (₫) <ChevronDown className="w-4 h-4 opacity-50" /></div></div>
                     <div className="flex gap-4 pt-6 border-t border-slate-50"><Button className="bg-teal-600 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-teal-200/40">Save Changes</Button><Button variant="ghost" className="h-11 px-6 text-slate-400 font-bold">Cancel</Button></div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS - BUDGET */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Settings - Budget</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto text-slate-900">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  <p className="text-slate-500 text-sm">Manage your account preferences and budget configurations.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  {/* Left nav */}
                  <Card className="lg:col-span-1 p-2 border-slate-200 shadow-sm">
                    <nav className="space-y-1">
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600"><Settings className="w-4 h-4 text-slate-400" /> General Preferences</div>
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-teal-50 text-teal-700 border border-teal-100/50 shadow-sm"><Wallet className="w-4 h-4 text-teal-600" /> Budget Management</div>
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600"><Lock className="w-4 h-4 text-slate-400" /> Security &amp; Privacy</div>
                    </nav>
                  </Card>
                  {/* Right content */}
                  <div className="lg:col-span-3 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Budget Management</h2>
                      <p className="text-slate-500 text-sm mt-1">Set spending limits and manage budget categories.</p>
                    </div>
                    {/* Card 1: Monthly Spending Limit */}
                    <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Monthly Spending Limit</h3>
                        <p className="text-xs text-slate-500 font-medium">Control your total monthly expenditure across all categories.</p>
                      </div>
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Global Limit</label>
                          <div className="relative">
                            <Input readOnly value="23,810,000" className="pl-8 h-12 font-bold text-lg border-slate-200" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₫</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-800">15,450,000 ₫ / 23,810,000 ₫</span>
                            <span className="text-xs font-semibold text-teal-600">65% utilized</span>
                          </div>
                          <Progress value={65} className="h-2.5 bg-slate-100" />
                          <p className="text-xs text-slate-400 font-medium italic">(8,360,000 ₫ remaining this month)</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button className="bg-teal-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-teal-200/50">Save Limit</Button>
                        <Button variant="outline" className="border-slate-200 h-11 px-6 rounded-xl text-slate-600">Cancel</Button>
                      </div>
                    </Card>
                    {/* Card 2: Custom Budgeting Categories */}
                    <Card className="p-6 border-slate-200 shadow-sm space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Custom Budgeting Categories</h3>
                        <p className="text-xs text-slate-500 font-medium">Add, remove, or modify your personalized spending buckets.</p>
                      </div>
                      <div className="flex gap-3 max-w-xl">
                        <Input placeholder="Enter category name (e.g. Gym, Subscriptions)" className="h-11 border-slate-200" readOnly />
                        <Button className="bg-teal-600 text-white h-11 px-6 rounded-xl font-bold flex gap-2 shrink-0">
                          <Plus className="w-4 h-4" /> Add
                        </Button>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden mt-4 shadow-inner bg-slate-50/30">
                        <table className="w-full text-sm text-left font-sans">
                          <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4">Category Name</th>
                              <th className="px-6 py-4">Monthly Limit</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities'].map((cat) => (
                              <tr key={cat} className="hover:bg-white transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{cat}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 max-w-[140px]">
                                    <Input defaultValue="5,000,000" className="h-9 font-bold text-slate-800 border-slate-200" readOnly />
                                    <span className="text-slate-400 font-bold">₫</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100/50 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-teal-800 leading-relaxed font-sans mt-0.5">
                          <span className="font-bold">Tip:</span> Create custom categories to better track your spending habits and set specific budget limits for each.
                        </p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button className="bg-teal-600 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-teal-200/50">Save Categories</Button>
                        <Button variant="outline" className="border-slate-200 h-11 px-6 rounded-xl text-slate-600">Cancel</Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS - SECURITY */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold mb-10 text-white border-b border-white/10 pb-4 w-[1440px]">Settings - Security</h2>
        <div className="w-[1440px] h-[900px] flex bg-slate-50 overflow-hidden relative shadow-2xl mx-auto mb-20 rounded-lg shrink-0">
          <div className="flex-shrink-0">
            <Sidebar open={true} onToggle={() => {}} />
          </div>
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white border-b h-16 flex items-center px-6 justify-end flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Bell className="w-4 h-4 text-slate-400" /></div>
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">VC</div>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto text-slate-900">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  <p className="text-slate-500 text-sm">Manage your account preferences and budget configurations.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  {/* Left nav */}
                  <Card className="lg:col-span-1 p-2 border-slate-200 shadow-sm">
                    <nav className="space-y-1">
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600"><Settings className="w-4 h-4 text-slate-400" /> General Preferences</div>
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600"><Wallet className="w-4 h-4 text-slate-400" /> Budget Management</div>
                      <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-teal-50 text-teal-700 border border-teal-100/50 shadow-sm"><Lock className="w-4 h-4 text-teal-600" /> Security &amp; Privacy</div>
                    </nav>
                  </Card>
                  {/* Right content */}
                  <div className="lg:col-span-3 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Security &amp; Privacy</h2>
                      <p className="text-slate-500 text-sm mt-1 font-sans">Manage your security settings and data control.</p>
                    </div>
                    {/* 2FA Section */}
                    <Card className="p-6 border-slate-200 shadow-sm space-y-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
                          <p className="text-xs text-slate-500 font-medium italic font-sans">Two-Factor Authentication is currently disabled.</p>
                        </div>
                        <Switch />
                      </div>
                      <Button className="bg-teal-600 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-teal-200/40">Enable 2FA</Button>
                    </Card>
                    {/* Active Sessions */}
                    <Card className="p-6 border-slate-200 shadow-sm space-y-6 bg-white">
                      <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                          <div className="flex items-center gap-4">
                            <Monitor className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 tracking-tight">MacBook Pro - Current Session</p>
                              <p className="text-[10px] text-slate-400 font-medium font-sans italic">Ho Chi Minh City, VN • Last active: 1 min ago</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 font-bold">Log Out</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                          <div className="flex items-center gap-4">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 tracking-tight">iPhone 14</p>
                              <p className="text-[10px] text-slate-400 font-medium font-sans italic">Ho Chi Minh City, VN • Last active: 2 hours ago</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 font-bold">Log Out</Button>
                        </div>
                      </div>
                      <Button className="text-teal-600 hover:text-teal-700 bg-teal-50/50 hover:bg-teal-50 border border-teal-100/50 font-bold h-10 px-6 rounded-xl">Log Out All Other Sessions</Button>
                    </Card>
                    {/* Danger Zone */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Danger Zone
                      </h3>
                      <div className="rounded-2xl border-2 border-red-50 p-6 space-y-6 bg-white overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">Export Your Data</p>
                            <p className="text-xs text-slate-400 font-medium max-w-md italic font-sans">Download a CSV/JSON file of all your transactions and budget data.</p>
                          </div>
                          <Button variant="outline" className="h-9 px-6 font-bold border-slate-200 rounded-lg">Export</Button>
                        </div>
                        <div className="h-px bg-slate-50" />
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-red-600">Delete Account</p>
                            <p className="text-xs text-slate-500 font-medium max-w-sm italic font-sans">Permanently delete your account and all associated data. This action cannot be undone.</p>
                          </div>
                          <Button className="bg-red-500 hover:bg-red-600 text-white h-10 px-6 font-bold rounded-xl shadow-lg shadow-red-100">Delete Account</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
