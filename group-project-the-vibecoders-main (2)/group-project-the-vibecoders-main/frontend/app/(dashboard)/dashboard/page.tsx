'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';

/**
 * Analytical Dashboard (Moved from / to /dashboard)
 * 
 * Layout components (Sidebar, Header) are handled
 * by the global app/(dashboard)/layout.tsx file.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-0 min-w-0">
      <DashboardLayout />
    </div>
  );
}
