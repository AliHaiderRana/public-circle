import type { ReactNode } from 'react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { SubscriptionStatusAlert } from '@/components/subscription-status-alert';
import { RouteBreadcrumbs } from '@/components/route-breadcrumbs';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <DashboardSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto w-full px-3 sm:px-4 py-4 sm:py-6" style={{ maxWidth: '1400px' }}>
            {/* Subscription Status Alerts - Global */}
            <SubscriptionStatusAlert className="mb-4" />
            
            {/* Breadcrumbs - Automatically generated from current route */}
            <RouteBreadcrumbs className="mb-4" />
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
