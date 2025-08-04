'use client'

import { X, LogOut, User, Building2, Monitor } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, store, terminal, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Settings Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-background-secondary border-r border-white/[0.08] z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-2 py-6 flex items-center justify-end border-b border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background-tertiary transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="px-2 py-6 space-y-6">
          {/* User Info */}
          {user && (
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Current Session</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-white/60 truncate">{user.email}</div>
                  </div>
                </div>
                
                {store && (
                  <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-cannabis-sage/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-cannabis-sage" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Flora Distro - {store.name}
                      </div>
                      <div className="text-xs text-white/60 truncate">{store.address}</div>
                    </div>
                  </div>
                )}

                {terminal && (
                  <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {terminal.name}
                      </div>
                      <div className="text-xs text-white/60">Terminal ID: {terminal.id}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Store Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Store Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Tax Rate</span>
                <input 
                  type="text" 
                  defaultValue="8.25%"
                  className="w-20 px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Currency</span>
                <select className="px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>CAD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Display</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Theme</span>
                <select className="px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Compact View</span>
                <button className="w-10 h-6 bg-background-tertiary rounded-full relative border border-white/10">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">WooCommerce API</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-white/50">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-white/50">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">System</h3>
            <div className="space-y-2 text-xs text-white/50">
              <div>Version: 1.0.0</div>
              <div>API Status: Connected</div>
              <div>Last Sync: 2 minutes ago</div>
            </div>
          </div>

          {/* Logout Button */}
          {user && (
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error/10 hover:bg-error/20 border border-error/30 hover:border-error/50 rounded-lg text-error hover:text-error-light transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 