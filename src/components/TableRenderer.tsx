'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'

interface TableRendererProps {
  json: string
}

export default function TableRenderer({ json }: TableRendererProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error parsing table data:', error)
      return []
    }
  }, [json])

  const columns = useMemo(() => {
    if (data.length === 0) return []
    
    const columnHelper = createColumnHelper<any>()
    const firstRow = data[0]
    
    return Object.keys(firstRow).map((key) => 
      columnHelper.accessor(key, {
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        cell: (info) => {
          const value = info.getValue()
          
          // Format numbers
          if (typeof value === 'number') {
            return value.toLocaleString()
          }
          
          // Format currency (if key contains price, cost, total, etc.)
          if (typeof value === 'number' && 
              (key.toLowerCase().includes('price') || 
               key.toLowerCase().includes('cost') || 
               key.toLowerCase().includes('total'))) {
            return `$${value.toFixed(2)}`
          }
          
          return String(value)
        }
      })
    )
  }, [data])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  if (data.length === 0) {
    return <div className="text-yellow-400 text-sm">No table data available</div>
  }

  return (
    <div className="bg-black/20 border border-white/[0.06] rounded-lg p-4 mb-2 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-800">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-blue-300 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      
                      {/* Sort indicator */}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? (
                        <span className="text-gray-500">↕</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800">
            {table.getRowModel().rows.map((row, index) => (
              <tr 
                key={row.id} 
                className={`${index % 2 === 0 ? 'bg-gray-900/20' : 'bg-transparent'} hover:bg-gray-800/30 transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table info */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {data.length} rows
      </div>
    </div>
  )
}