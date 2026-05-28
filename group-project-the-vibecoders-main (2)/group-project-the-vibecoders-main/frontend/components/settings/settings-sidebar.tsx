'use client';

import React from 'react';
import { Settings, Lock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSidebarProps {
  activeTab: 'general' | 'budget' | 'security';
  onTabChange: (tab: 'general' | 'budget' | 'security') => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const tabs = [
    {
      id: 'general' as const,
      label: 'General Preferences',
      icon: Settings,
      description: 'Profile and basic settings',
    },
    {
      id: 'budget' as const,
      label: 'Budget Management',
      icon: Wallet,
      description: 'Spending limits and categories',
    },
    {
      id: 'security' as const,
      label: 'Security & Privacy',
      icon: Lock,
      description: 'Security settings and data control',
    },
  ];

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-card border border-border rounded-lg p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground mb-6">Settings</h2>
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full text-left p-4 rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className={cn(
                    'text-xs',
                    isActive ? 'opacity-90' : 'text-muted-foreground'
                  )}>
                    {tab.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
