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
import TableScrollWrapper from './TableScrollWrapper'

interface TableRendererProps {
  json: string
}

export default function TableRenderer({ json }: TableRendererProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

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

  // Determine if table is large (more than 10 rows or 8 columns)
  const isLargeTable = data.length > 10 || columns.length > 8
  const displayedRows = isExpanded ? table.getRowModel().rows : table.getRowModel().rows.slice(0, 5)

  // Export functions
  const exportToCSV = () => {
    const headers = columns.map(col => col.id || '').join(',')
    const rows = data.map(row => 
      columns.map(col => {
        const columnId = col.id || ''
        const value = columnId ? row[columnId] : ''
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '')
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue
      }).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `table-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `table-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Full screen overlay component
  const FullScreenTable = () => (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Full screen header */}
      <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Table</h2>
          <span className="text-sm text-text-tertiary">({data.length} rows, {columns.length} columns)</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <button
            onClick={exportToCSV}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors px-3 py-2 rounded hover:bg-white/5 flex items-center gap-2"
            title="Export as CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors px-3 py-2 rounded hover:bg-white/5 flex items-center gap-2"
            title="Export as JSON"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export JSON
          </button>
          <button
            onClick={() => setIsFullScreen(false)}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors px-3 py-2 rounded hover:bg-white/5 flex items-center gap-2"
            title="Close full screen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Full screen table */}
      <div className="flex-1 overflow-auto p-6">
        <TableScrollWrapper>
          <table className="min-w-full bg-gray-900/40 rounded-lg overflow-hidden">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-gray-700">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-medium text-gray-200 cursor-pointer hover:text-blue-300 transition-colors bg-gray-800/60"
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
            <tbody className="divide-y divide-gray-700">
              {table.getRowModel().rows.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`${index % 2 === 0 ? 'bg-gray-800/20' : 'bg-transparent'} hover:bg-gray-700/30 transition-colors`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-gray-200 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScrollWrapper>
      </div>
    </div>
  )

  if (isFullScreen) {
    return <FullScreenTable />
  }

  return (
    <div className="bg-black/20 border border-white/[0.06] rounded-lg p-4 mb-2 overflow-hidden w-full">
      {/* Table header with controls */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Table</span>
          <span className="text-xs text-text-tertiary">({data.length} rows, {columns.length} columns)</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Export button */}
          <button
            onClick={exportToCSV}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
            title="Export as CSV"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>

          {/* Full screen button */}
          <button
            onClick={() => setIsFullScreen(true)}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
            title="Open in full screen"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Full Screen
          </button>

          {/* Expand/collapse button for large tables */}
          {isLargeTable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              title={isExpanded ? "Collapse table" : "Expand table"}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      </div>

      {/* Table container with height limit when collapsed */}
      <div className={`${isLargeTable && !isExpanded ? 'max-h-[300px] overflow-hidden' : ''} relative`}>
        <TableScrollWrapper>
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
              {displayedRows.map((row, index) => (
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
        </TableScrollWrapper>

        {/* Fade overlay when collapsed */}
        {isLargeTable && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        )}
      </div>
      
      {/* Table info */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          {isLargeTable && !isExpanded 
            ? `Showing 5 of ${data.length} rows` 
            : `${data.length} rows`
          }
        </span>
        {isLargeTable && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </button>
        )}
      </div>
    </div>
  )
}