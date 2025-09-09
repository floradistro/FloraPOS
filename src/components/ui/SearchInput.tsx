import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = '',
  debounceMs = 300,
  onDebouncedChange
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Call debounced callback when debounced value changes
  useEffect(() => {
    if (onDebouncedChange && debouncedValue !== value) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue); // Call immediate callback for UI updates
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        className="w-full pl-10 pr-3 h-[30px] bg-neutral-800/80 hover:bg-neutral-700/80 rounded text-neutral-200 placeholder-neutral-400 focus:bg-neutral-700/80 focus:outline-none text-sm text-center placeholder:text-center"
      />
    </div>
  );
}