import { Search, RefreshCw } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onRefresh?: () => void
}

export function SearchBar({ value, onChange, placeholder = "Search products...", onRefresh }: SearchBarProps) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-neutral-900/65 rounded-lg border border-white/[0.04] focus:border-primary focus:outline-none text-text placeholder-text-tertiary"
        />
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-2 bg-neutral-900/65 hover:bg-background-secondary rounded-lg border border-white/[0.04] hover:border-primary transition-colors text-text-secondary hover:text-text-primary"
          title="Refresh products"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      )}
    </div>
  )
} 