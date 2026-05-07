import { useState, useMemo, useCallback, useRef } from 'react';
import type { Item } from '../types';
import { Search as SearchIcon, Copy, Check, SearchX } from 'lucide-react';

interface SearchProps {
  items: Item[];
  searchHistory: string[];
  onAddToHistory: (query: string) => void;
}

export default function Search({ items, searchHistory, onAddToHistory }: SearchProps) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return items.filter(
      item =>
        item.itemId.toLowerCase().includes(lower) ||
        item.location.toLowerCase().includes(lower)
    );
  }, [query, items]);

  const exactMatch = useMemo(() => {
    if (!query.trim()) return null;
    return items.find(
      item => item.itemId.toLowerCase() === query.toLowerCase()
    ) || null;
  }, [query, items]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      setSelectedItem(null);
      if (val.trim()) {
        onAddToHistory(val.trim());
      }
    },
    [onAddToHistory]
  );

  const handleHistoryClick = useCallback(
    (historyItem: string) => {
      setQuery(historyItem);
      setSelectedItem(null);
      onAddToHistory(historyItem);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [onAddToHistory]
  );

  const handleResultClick = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  const handleCopy = useCallback(() => {
    const textToCopy = selectedItem?.location || exactMatch?.location;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }, [selectedItem, exactMatch]);

  const displayItem = selectedItem || exactMatch;
  const showResultsList = !displayItem && results.length > 0;
  const showNoMatch = query.trim() && results.length === 0;

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-medium mb-2">Find Item Location</h1>
        <p className="text-sm text-[#666666]">
          Enter an item ID to quickly find its storage location
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-[480px] mx-auto mb-6">
        <SearchIcon
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Type item ID..."
          className="w-full h-12 border border-[#cccccc] rounded-lg pl-11 pr-4 text-sm font-mono-data transition-colors duration-150 focus:outline-none focus:border-[#284ff4]"
          style={{ boxShadow: 'none' }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,79,244,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Exact Match / Selected Result */}
      {displayItem && (
        <div className="max-w-[480px] mx-auto">
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
            <div>
              <label className="text-xs uppercase text-[#999999] font-medium tracking-wider">
                Item ID
              </label>
              <p className="font-mono-data text-lg font-medium text-black mt-1">
                {displayItem.itemId}
              </p>
            </div>
            <div className="border-t border-[#f0f0f0] my-3" />
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs uppercase text-[#999999] font-medium tracking-wider">
                  Location
                </label>
                <p className="font-mono-data text-base text-[#284ff4] mt-1">
                  {displayItem.location}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="icon-btn shrink-0 ml-3"
                title="Copy location"
                aria-label="Copy location"
              >
                {copied ? (
                  <Check size={14} className="text-[#2e7d32]" />
                ) : (
                  <Copy size={14} className="text-[#999999] hover:text-black" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-[#2e7d32] mt-2 text-right">Copied!</p>
            )}
          </div>
        </div>
      )}

      {/* Multiple Results List */}
      {showResultsList && (
        <div className="max-w-[480px] mx-auto">
          <p className="text-xs text-[#999999] mb-2">
            {results.length} result{results.length > 1 ? 's' : ''} found
          </p>
          <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="table-header text-left px-4 py-2.5">Item ID</th>
                  <th className="table-header text-left px-4 py-2.5">Location</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => handleResultClick(item)}
                    className={`border-b border-[#f0f0f0] last:border-b-0 cursor-pointer hover:bg-[#f5f7ff] transition-colors duration-100 ${
                      index % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono-data text-[13px]">{item.itemId}</td>
                    <td className="px-4 py-2.5 font-mono-data text-[13px]">{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Match */}
      {showNoMatch && (
        <div className="max-w-[480px] mx-auto text-center py-8">
          <SearchX size={40} className="text-[#cccccc] mx-auto mb-3" />
          <p className="text-base text-[#666666] mb-1">No items found</p>
          <p className="text-sm text-[#999999]">Try a different item ID</p>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="max-w-[480px] mx-auto mt-8">
          <p className="text-sm font-medium mb-2">Recent Searches</p>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((historyItem, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(historyItem)}
                className="bg-[#f0f0f0] rounded-full px-3 py-1 text-[13px] font-mono-data text-[#666666] hover:bg-[#e5e5e5] transition-colors duration-150"
              >
                {historyItem}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
