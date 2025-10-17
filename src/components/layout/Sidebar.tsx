'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ViewType } from '../../types';

interface SidebarProps {
  onRefresh?: () => void;
  onSettings?: () => void;
  onViewChange?: (view: ViewType) => void;
  currentView?: ViewType;
  onAuditModeToggle?: () => void;
}

interface SidebarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ 
  onClick, 
  isActive = false, 
  title, 
  disabled = false,
  children 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        relative w-10 h-10 rounded-ios
        flex items-center justify-center
        transition-all duration-200 border
        ${isActive 
          ? 'bg-white/8 text-white border-border' 
          : 'bg-surface-card text-neutral-400 hover:bg-surface-elevated hover:text-white border-border-subtle hover:border-border'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      `}
    >
      {children}
    </button>
  );
};

export function Sidebar({ 
  onRefresh, 
  onSettings, 
  onViewChange, 
  currentView = 'products',
  onAuditModeToggle
}: SidebarProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { user, logout } = useAuth();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <div className="sidebar-nav h-full w-[60px] bg-transparent flex-shrink-0 relative z-40">
      <div className="flex flex-col items-center justify-between h-full py-4">
        
        {/* Top section - Main Navigation */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Products */}
          <SidebarButton
            onClick={() => onViewChange?.('products')}
            isActive={currentView === 'products'}
            title="Products"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </SidebarButton>

          {/* Blueprint Fields */}
          <SidebarButton
            onClick={() => onViewChange?.('blueprint-fields')}
            isActive={currentView === 'blueprint-fields'}
            title="Blueprint Fields"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </SidebarButton>

          {/* Inventory Manager */}
          <SidebarButton
            onClick={() => onViewChange?.('adjustments')}
            isActive={currentView === 'adjustments'}
            title="Inventory Manager"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </SidebarButton>


          <div className="w-8 h-px bg-white/[0.08] my-1" />

          {/* Customers */}
          <SidebarButton
            onClick={() => onViewChange?.('customers')}
            isActive={currentView === 'customers'}
            title="Customers"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </SidebarButton>

          {/* Orders */}
          <SidebarButton
            onClick={() => onViewChange?.('orders')}
            isActive={currentView === 'orders'}
            title="Orders"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </SidebarButton>

          {/* Cash Management */}
          <SidebarButton
            onClick={() => onViewChange?.('cash')}
            isActive={currentView === 'cash'}
            title="Cash Management"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </SidebarButton>

          <div className="w-8 h-px bg-white/[0.08] my-1" />

          {/* TV Menu */}
          <SidebarButton
            onClick={() => onViewChange?.('menu')}
            isActive={currentView === 'menu'}
            title="TV Menu Display"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </SidebarButton>
        </div>

        {/* Middle section - AI View */}
        <div className="flex flex-col items-center gap-2 w-full">
          <SidebarButton
            onClick={() => onViewChange?.('ai-view')}
            isActive={currentView === 'ai-view'}
            title="AI Canvas View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </SidebarButton>
        </div>

        {/* Bottom section - System Actions */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Refresh */}
          <SidebarButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={isRefreshing ? "Refreshing..." : "Refresh"}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </SidebarButton>

          <div className="w-8 h-px bg-white/[0.08] my-1" />

          {/* Training */}
          <SidebarButton
            onClick={() => window.open('/training', '_blank')}
            title="Training & Help"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </SidebarButton>

          {/* Settings */}
          <SidebarButton
            onClick={onSettings}
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </SidebarButton>

          {/* User/Logout */}
          {user && (
            <>
              <div className="w-8 h-px bg-white/[0.08] my-1" />
              <SidebarButton
                onClick={logout}
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </SidebarButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}