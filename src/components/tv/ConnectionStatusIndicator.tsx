/**
 * Connection Status Indicator
 * Shows TV connection status in corner of display
 */

'use client'

interface ConnectionStatusIndicatorProps {
  status: 'connecting' | 'online' | 'offline'
  tvId?: string
  lastCommand?: any
}

export function ConnectionStatusIndicator({ 
  status, 
  tvId,
  lastCommand 
}: ConnectionStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'offline':
        return 'bg-red-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'offline':
        return 'Disconnected'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs text-white/90">{getStatusText()}</span>
        </div>
        {tvId && (
          <div className="text-[10px] text-white/50 mt-1">
            ID: {tvId.slice(0, 8)}
          </div>
        )}
        {lastCommand && (
          <div className="text-[10px] text-green-400 mt-1">
            Last: {lastCommand.command_type}
          </div>
        )}
      </div>
    </div>
  )
}

