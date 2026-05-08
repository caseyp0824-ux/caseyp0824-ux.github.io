import { useMemo } from 'react';
import type { Item, Tab } from '../types';
import { LayoutGrid, Table2, Search, ArrowRight, FileSpreadsheet, FileJson } from 'lucide-react';
import { exportToCSV, exportToJSON } from '../utils/exportImport';

interface DashboardProps {
  items: Item[];
  onNavigate: (tab: Tab) => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function Dashboard({ items, onNavigate }: DashboardProps) {
  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [items]);

  return (
    <div className="px-4 pt-4 pb-6 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid size={20} className="text-black" />
          <h1 className="text-xl font-medium">Item Location Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#999999]">{items.length} items stored</span>
          {items.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={() => exportToCSV(items)}
                className="h-7 px-2 border border-[#cccccc] rounded text-xs text-[#666666] bg-white hover:bg-[#f0f0f0] hover:text-[#2e7d32] transition-colors duration-150 flex items-center gap-1"
                title="Export as CSV"
                aria-label="Export as CSV"
              >
                <FileSpreadsheet size={12} />
                CSV
              </button>
              <button
                onClick={() => exportToJSON(items)}
                className="h-7 px-2 border border-[#cccccc] rounded text-xs text-[#666666] bg-white hover:bg-[#f0f0f0] hover:text-[#284ff4] transition-colors duration-150 flex items-center gap-1"
                title="Export as JSON"
                aria-label="Export as JSON"
              >
                <FileJson size={12} />
                JSON
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {/* Manage Card */}
        <button
          onClick={() => onNavigate('manage')}
          className="card-surface p-6 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <Table2 size={28} className="text-[#284ff4]" />
            <ArrowRight
              size={16}
              className="text-[#999999] group-hover:text-[#284ff4] transition-colors duration-200"
            />
          </div>
          <h2 className="text-base font-medium mb-1">Manage Items</h2>
          <p className="text-sm text-[#666666]">Add, edit, or delete item-location records</p>
        </button>

        {/* Search Card */}
        <button
          onClick={() => onNavigate('search')}
          className="card-surface p-6 text-left transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <Search size={28} className="text-[#284ff4]" />
            <ArrowRight
              size={16}
              className="text-[#999999] group-hover:text-[#284ff4] transition-colors duration-200"
            />
          </div>
          <h2 className="text-base font-medium mb-1">Search by Item ID</h2>
          <p className="text-sm text-[#666666]">Quickly find the location of any item</p>
        </button>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent Items</h2>
        </div>

        {recentItems.length > 0 ? (
          <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="table-header text-left px-4 py-2.5">Item ID</th>
                  <th className="table-header text-left px-4 py-2.5">Location</th>
                  <th className="table-header text-left px-4 py-2.5 w-28">Added</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-[#f0f0f0] last:border-b-0 ${
                      index % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono-data text-[13px]">{item.itemId}</td>
                    <td className="px-4 py-2.5 font-mono-data text-[13px]">{item.location}</td>
                    <td className="px-4 py-2.5 text-xs text-[#999999]">
                      {timeAgo(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-8 text-center">
            <p className="text-sm text-[#666666]">No items yet</p>
          </div>
        )}

        <button
          onClick={() => onNavigate('manage')}
          className="mt-3 text-sm text-[#284ff4] font-medium hover:underline"
        >
          View all items →
        </button>
      </div>
    </div>
  );
}
