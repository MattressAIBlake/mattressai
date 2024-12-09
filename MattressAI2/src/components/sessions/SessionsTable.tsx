import React, { useState, useMemo } from 'react';
import {
  RotateCw,
  Ban,
  ThumbsDown,
  Eye,
  Trash2,
  Download,
  Settings,
  ArrowUpDown,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { useSessionsStore } from './sessionsStore';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import Button from '../ui/Button';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export interface Session {
  id: string;
  date: string;
  customerName: string;
  contactNumber: string;
  assistant: 'lite' | 'plus';
  verified: boolean;
  time: string;
}

const SessionsTable = () => {
  const sessions = useSessionsStore((state) => state.sessions);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>(
    'sessions-visible-columns',
    ['date', 'customerName', 'contactNumber', 'assistant', 'verified', 'time', 'actions']
  );

  const columns = useMemo<ColumnDef<Session>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <span>Date</span>
            <button
              onClick={() => column.toggleSorting()}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUpDown className="w-4 h-4" />
              )}
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer Name',
      },
      {
        accessorKey: 'contactNumber',
        header: 'Contact Number',
      },
      {
        accessorKey: 'assistant',
        header: 'Assistant',
        cell: ({ row }) => (
          <RotateCw
            className={`h-5 w-5 ${
              row.original.assistant === 'plus' ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
        ),
      },
      {
        accessorKey: 'verified',
        header: 'Verified',
        cell: ({ row }) => (
          <Ban
            className={`h-5 w-5 ${
              row.original.verified ? 'text-green-500' : 'text-gray-400'
            }`}
          />
        ),
      },
      {
        accessorKey: 'time',
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <span>Time</span>
            <button
              onClick={() => column.toggleSorting()}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUpDown className="w-4 h-4" />
              )}
            </button>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button 
              key={`thumbs-down-${row.id}`}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ThumbsDown className="h-4 w-4 text-gray-500" />
            </button>
            <button 
              key={`eye-${row.id}`}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4 text-gray-500" />
            </button>
            <button 
              key={`trash-${row.id}`}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: sessions,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sessions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
    XLSX.writeFile(workbook, 'sessions.xlsx');
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={exportToExcel}
          >
            Export
          </Button>
          <div className="relative group">
            <Button
              variant="secondary"
              size="sm"
              icon={Settings}
            >
              Columns
            </Button>
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 hidden group-hover:block min-w-[200px] z-10">
              {columns.map((column) => {
                const columnId = column.id || String(column.header);
                return (
                  <label
                    key={`column-toggle-${columnId}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(columnId)}
                      onChange={() => toggleColumn(columnId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {column.id === 'actions' ? 'Actions' : String(column.header)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{
                      display: visibleColumns.includes(header.column.id)
                        ? ''
                        : 'none',
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap"
                    style={{
                      display: visibleColumns.includes(cell.column.id)
                        ? ''
                        : 'none',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionsTable;