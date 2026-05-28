'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Wallet, 
  Lock, 
  Trash2, 
  Plus, 
  AlertCircle,
  LogOut,
  Globe,
  User,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Monitor,
  Smartphone,
  ArrowRight,
  Languages,
  BadgeCheck
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [globalLimit, setGlobalLimit] = useState('23,810,000');

  const navItems = [
    { id: 'general', label: 'General Preferences', icon: Settings },
    { id: 'security', label: 'Security & Privacy', icon: Lock },
  ];

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue === '') {
      setGlobalLimit('');
      return;
    }
    const formatted = new Intl.NumberFormat('en-US').format(parseInt(rawValue));
    setGlobalLimit(formatted);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500">Manage your account preferences and budget configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Inner Sidebar Navigation */}
        <Card className="lg:col-span-1 p-2 border-slate-200 shadow-sm">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive 
                      ? 'font-bold bg-teal-50 text-teal-700 border border-teal-100/50 shadow-sm' 
                      : 'font-medium text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Right Content Area */}
        <div className="lg:col-span-3">

          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">General Preferences</h2>
                <p className="text-slate-500 text-sm mt-1 font-sans">Manage your profile and basic settings.</p>
              </div>

              <Card className="p-6 border-slate-200 shadow-sm space-y-8 bg-white">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border border-slate-100 shadow-sm">
                    <AvatarFallback className="bg-teal-50 text-teal-600 font-bold text-xl">VC</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Profile Photo</h3>
                    <div className="flex items-center gap-2">
                       <input 
                         type="file" 
                         id="profile-upload" 
                         accept="image/png, image/jpeg, image/gif" 
                         className="hidden" 
                         onChange={(e) => console.log('File selected:', e.target.files?.[0]?.name)}
                       />
                       <label htmlFor="profile-upload">
                         <Button asChild size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold shadow-sm cursor-pointer border rounded-md px-3 h-9">
                           <span>Upload Photo</span>
                         </Button>
                       </label>
                       <p className="text-[10px] text-slate-400 font-medium font-sans">PNG, JPG or GIF (max. 2MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 max-w-sm">
                    <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      Preferred Currency
                    </Label>
                    <Select defaultValue="vnd">
                      <SelectTrigger className="h-11 border-slate-200 font-bold text-slate-800 font-sans">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vnd" className="font-sans font-medium">Vietnamese Dong (₫)</SelectItem>
                        <SelectItem value="usd" className="font-sans font-medium">US Dollar ($)</SelectItem>
                        <SelectItem value="eur" className="font-sans font-medium">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-50 items-center">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-teal-200/40 transition-all active:scale-95">Save Changes</Button>
                  <Button variant="ghost" className="h-11 px-6 rounded-xl text-slate-400 hover:text-slate-600 font-bold">Cancel</Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Security & Privacy</h2>
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
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-teal-200/40">Enable 2FA</Button>
              </Card>

              {/* Active Sessions */}
              <Card className="p-6 border-slate-200 shadow-sm space-y-6 bg-white">
                 <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/10">
                      <div className="flex items-center gap-4">
                        <Monitor className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">MacBook Pro - Current Session</p>
                          <p className="text-[10px] text-slate-400 font-medium font-sans italic">Ho Chi Minh City, VN • Last active: 1 min ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 font-bold">Log Out</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/10">
                      <div className="flex items-center gap-4">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 tracking-tight">iPhone 14</p>
                          <p className="text-[10px] text-slate-400 font-medium font-sans italic tracking-tighter">Ho Chi Minh City, VN • Last active: 2 hours ago</p>
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
                  <ShieldCheck className="w-5 h-5" />
                  Danger Zone
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
                      <p className="text-xs text-slate-500 font-medium max-w-sm italic font-sans tracking-tighter leading-relaxed">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    </div>
                    <Button className="bg-red-500 hover:bg-red-600 text-white h-10 px-6 font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95">Delete Account</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
