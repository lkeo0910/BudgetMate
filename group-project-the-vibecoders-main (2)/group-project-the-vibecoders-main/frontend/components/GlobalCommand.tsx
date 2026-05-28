'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PlusCircle,
  UploadCloud,
  Settings,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useModal } from '@/context/modal-context';

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { openAddTransaction } = useModal();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runCommand = React.useCallback((fn: () => void) => {
    // ── Z-Index/Focus Fix: Close Palette before opening Modal ─────────────
    setOpen(false);
    fn();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => openAddTransaction())}>
            <PlusCircle className="mr-2 h-4 w-4 text-teal-500" />
            Add Transaction
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Jump to Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions'))}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Jump to Transactions
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/chat'))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Jump to AI Assistant
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Jump to Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
