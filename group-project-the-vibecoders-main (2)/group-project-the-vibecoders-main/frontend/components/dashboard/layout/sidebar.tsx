'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Wallet, 
  BarChartBig,
  PiggyBank,
  Target,
  FileText, 
  Shapes,
  Settings, 
  LogOut, 
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import authService from '@/lib/services/auth.service';
import { toast } from 'sonner';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: 'Accounts', href: '/accounts' },
    { icon: BarChartBig, label: 'Reports', href: '/reports' },
    { icon: Target, label: 'Goals', href: '/goals' },
    { icon: PiggyBank, label: 'Budget', href: '/budget' },
    { icon: FileText, label: 'Transactions', href: '/transactions' },
    { icon: Shapes, label: 'Categories', href: '/categories' },
    { icon: Sparkles, label: 'AI Assistant', href: '/chat' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      router.push('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col border-r border-sidebar-border shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg group-hover:text-sidebar-primary transition-colors">BudgetMate</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden hover:bg-sidebar-accent"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link 
            href="/settings"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/settings')
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
