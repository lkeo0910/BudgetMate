'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [notifications] = useState([
    {
      title: "Budget Alert",
      description: "Warning: You have reached 90% of your Food budget.",
      time: "Just now"
    },
    {
      title: "System",
      description: "Welcome to BudgetMate!",
      time: "2 hours ago"
    }
  ]);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-border h-16 flex items-center px-6 gap-4 shadow-sm">
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search Bar — Hidden on /transactions (page has its own integrated search bar) */}
      {pathname !== '/transactions' && (
        <div className="flex-1 max-w-md hidden sm:flex items-center">
          {/* Global search placeholder — not used on /transactions */}
        </div>
      )}

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Notifications</span>
              <button className="text-xs text-primary hover:underline">Mark all as read</button>
            </div>
            <div className="flex flex-col max-h-[300px] overflow-auto">
              {notifications.map((notif, idx) => (
                <div key={idx} className="flex flex-col gap-1 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-default">
                  <span className="text-sm font-medium">{notif.title}</span>
                  <span className="text-xs text-muted-foreground">{notif.description}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-1">{notif.time}</span>
                </div>
              ))}
              {/* @TODO: Alert auto-cleanup logic (month rollover/transaction deletion) will be handled via FastAPI backend sync in the future. */}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <Link href="/profile">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gradient-to-br from-primary to-secondary"
          >
            <User className="w-5 h-5 text-primary-foreground" />
          </Button>
        </Link>
      </div>
    </header>

  );
}
