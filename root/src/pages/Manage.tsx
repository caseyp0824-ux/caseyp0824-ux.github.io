import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Item, ModalState } from '../types';
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  readFileAsText,
} from '../utils/exportImport';
import type { ImportResult } from '../utils/exportImport';
import {
  Pencil,
  Trash2,
  PackageOpen,
  X,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ManageProps {
  items: Item[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onImportItems: (items: Array<{ itemId: string; location: string }>) => void;
  modalState: ModalState;
  onCloseModal: () => void;
  onSaveItem: (itemId: string, location: string) => void;
  onUpdateItem: (id: string, itemId: string, location: string) => void;
  editItem: Item | null;
}

type SortOption = 'newest' | 'oldest' | 'id-asc' | 'id-desc' | 'location-asc';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ====== Add/Edit Modal ======
function ItemModal({
  open,
  mode,
  editItem,
  onClose,
  onSave,
  onUpdate,
}: {
  open: boolean;
  mode: 'add' | 'edit';
  editItem: Item | null;
  onClose: () => void;
  onSave: (itemId: string, location: string) => void;
  onUpdate: (id: string, itemId: string, location: string) => void;
}) {
  const [itemId, setItemId] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<{ itemId?: string; location?: string }>({});
  const itemIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editItem) {
        setItemId(editItem.itemId);
        setLocation(editItem.location);
      } else {
        setItemId('');
        setLocation('');
      }
      setErrors({});
      setTimeout(() => itemIdRef.current?.focus(), 100);
    }
  }, [open, mode, editItem]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: { itemId?: string; location?: string } = {};
      if (!itemId.trim()) newErrors.itemId = 'This field is required';
      if (!location.trim()) newErrors.location = 'This field is required';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      if (mode === 'edit' && editItem) {
        onUpdate(editItem.id, itemId.trim(), location.trim());
      } else {
        onSave(itemId.trim(), location.trim());
      }
      onClose();
    },
    [itemId, location, mode, editItem, onSave, onUpdate, onClose]
  );

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card w-[90%] max-w-[440px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium">
            {mode === 'add' ? 'Add New Item' : 'Edit Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-black transition-colors p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Item ID</label>
              <input
                ref={itemIdRef}
                type="text"
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  if (errors.itemId) setErrors((prev) => ({ ...prev, itemId: undefined }));
                }}
                placeholder="e.g. ITEM-001"
                className={`w-full input-field ${errors.itemId ? 'input-error' : ''}`}
              />
              {errors.itemId && (
                <p className="text-xs text-[#e53935] mt-1">{errors.itemId}</p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                }}
                placeholder="e.g. Warehouse A - Shelf 3"
                className={`w-full input-field ${errors.location ? 'input-error' : ''}`}
              />
              {errors.location && (
                <p className="text-xs text-[#e53935] mt-1">{errors.location}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====== Import Modal ======
function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (items: Array<{ itemId: string; location: string }>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setIsDragging(false);
    }
  }, [open]);

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const content = await readFileAsText(selectedFile);
      let result: ImportResult;
      if (selectedFile.name.toLowerCase().endsWith('.json')) {
        result = parseJSON(content);
      } else {
        result = parseCSV(content);
      }
      setPreview(result);
    } catch {
      setPreview({ success: false, count: 0, message: 'Failed to read file' });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleImport = useCallback(() => {
    if (preview?.success && preview.items) {
      onImport(preview.items);
      onClose();
    }
  }, [preview, onImport, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card w-[90%] max-w-[480px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium">Import Data</h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-black transition-colors p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drop Zone */}
        {!file && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-150 mb-4 ${
              isDragging
                ? 'border-[#284ff4] bg-[#f5f7ff]'
                : 'border-[#cccccc] hover:border-[#999999]'
            }`}
          >
            <Upload size={32} className="text-[#999999] mx-auto mb-3" />
            <p className="text-sm text-[#666666] mb-1">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-xs text-[#999999]">Supports CSV and JSON files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </div>
        )}

        {/* File Selected */}
        {file && (
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-[#f0f0f0] rounded-lg px-4 py-3 mb-3">
              {file.name.toLowerCase().endsWith('.json') ? (
                <FileJson size={18} className="text-[#284ff4]" />
              ) : (
                <FileSpreadsheet size={18} className="text-[#2e7d32]" />
              )}
              <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-[#999999] hover:text-[#e53935] transition-colors"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview Result */}
            {preview && (
              <div
                className={`rounded-lg p-3 mb-3 ${
                  preview.success ? 'bg-[#f0f8f0]' : 'bg-[#fff5f5]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {preview.success ? (
                    <CheckCircle2 size={16} className="text-[#2e7d32] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-[#e53935] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        preview.success ? 'text-[#2e7d32]' : 'text-[#e53935]'
                      }`}
                    >
                      {preview.success ? `${preview.count} items ready to import` : 'Import failed'}
                    </p>
                    <p className="text-xs text-[#666666] mt-0.5">{preview.message}</p>
                  </div>
                </div>

                {/* Preview Table */}
                {preview.success && preview.items && preview.items.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="text-left py-1 text-[#999999] font-medium">Item ID</th>
                          <th className="text-left py-1 text-[#999999] font-medium">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.items.slice(0, 10).map((item, i) => (
                          <tr key={i} className="border-b border-[#f0f0f0] last:border-b-0">
                            <td className="py-1 font-mono-data">{item.itemId}</td>
                            <td className="py-1 font-mono-data">{item.location}</td>
                          </tr>
                        ))}
                        {preview.items.length > 10 && (
                          <tr>
                            <td colSpan={2} className="py-1 text-[#999999] text-center">
                              ... and {preview.items.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!preview?.success}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Main Manage Component ======
export default function Manage({
  items,
  onAdd,
  onEdit,
  onDelete,
  onImportItems,
  modalState,
  onCloseModal,
  onSaveItem,
  onUpdateItem,
  editItem,
}: ManageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.itemId.toLowerCase().includes(lower) ||
          item.location.toLowerCase().includes(lower)
      );
    }
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'id-asc':
        result.sort((a, b) => a.itemId.localeCompare(b.itemId));
        break;
      case 'id-desc':
        result.sort((a, b) => b.itemId.localeCompare(a.itemId));
        break;
      case 'location-asc':
        result.sort((a, b) => a.location.localeCompare(b.location));
        break;
    }
    return result;
  }, [items, searchQuery, sortBy]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(
    (id: string) => {
      onDelete(id);
      setDeleteConfirmId(null);
    },
    [onDelete]
  );

  return (
    <div className="px-4 pt-4 pb-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">All Items</h1>
        <button onClick={onAdd} className="btn-primary text-sm h-9">
          + Add Item
        </button>
      </div>
      <p className="text-xs text-[#999999] mb-4">
        Showing {filteredItems.length} record{filteredItems.length !== 1 ? 's' : ''}
      </p>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item ID or location..."
            className="w-full h-9 border border-[#cccccc] rounded-md pl-9 pr-3 text-sm font-mono-data transition-colors duration-150 focus:outline-none focus:border-[#284ff4]"
            style={{ boxShadow: 'none' }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,79,244,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-9 border border-[#cccccc] rounded-md px-3 text-sm bg-white focus:outline-none focus:border-[#284ff4]"
          style={{ boxShadow: 'none' }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,79,244,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="id-asc">Item ID A→Z</option>
          <option value="id-desc">Item ID Z→A</option>
          <option value="location-asc">Location A→Z</option>
        </select>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            className="h-9 px-3 border border-[#cccccc] rounded-md text-sm text-[#666666] bg-white hover:bg-[#f0f0f0] transition-colors duration-150 flex items-center gap-1.5"
          >
            <Download size={14} />
            Export
            <ChevronDown size={12} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-lg shadow-lg z-30 py-1 min-w-[160px]">
              <button
                onClick={() => {
                  exportToCSV(items);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#666666] hover:bg-[#f5f7ff] hover:text-[#284ff4] transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet size={14} />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  exportToJSON(items);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#666666] hover:bg-[#f5f7ff] hover:text-[#284ff4] transition-colors flex items-center gap-2"
              >
                <FileJson size={14} />
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Import Button */}
        <button
          onClick={() => setImportModalOpen(true)}
          className="h-9 px-3 border border-[#cccccc] rounded-md text-sm text-[#666666] bg-white hover:bg-[#f0f0f0] transition-colors duration-150 flex items-center gap-1.5"
        >
          <Upload size={14} />
          Import
        </button>
      </div>

      {/* Data Table */}
      {filteredItems.length > 0 ? (
        <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="table-header text-center px-3 py-2.5 w-12">No.</th>
                <th className="table-header text-left px-4 py-2.5">Item ID</th>
                <th className="table-header text-left px-4 py-2.5">Location</th>
                <th className="table-header text-left px-4 py-2.5 w-28">Created</th>
                <th className="table-header text-center px-4 py-2.5 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#f0f0f0] last:border-b-0 ${
                    index % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                  } ${deleteConfirmId === item.id ? 'bg-[#fff5f5]' : ''}`}
                >
                  {deleteConfirmId === item.id ? (
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-black">Delete this item?</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[13px] text-[#666666] hover:text-black transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(item.id)}
                            className="text-[13px] text-[#e53935] font-medium hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="text-center px-3 py-3 text-[13px] text-[#999999]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono-data text-sm">{item.itemId}</td>
                      <td className="px-4 py-3 font-mono-data text-sm">{item.location}</td>
                      <td className="px-4 py-3 text-[13px] text-[#999999]">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(item.id)}
                            className="icon-btn"
                            aria-label="Edit item"
                            title="Edit"
                          >
                            <Pencil
                              size={16}
                              className="text-[#666666] hover:text-[#284ff4] transition-colors"
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className="icon-btn"
                            aria-label="Delete item"
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                              className="text-[#666666] hover:text-[#e53935] transition-colors"
                            />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-10 text-center">
          <PackageOpen size={48} className="text-[#cccccc] mx-auto mb-4" />
          <p className="text-base text-[#666666] mb-1">No items found</p>
          <p className="text-sm text-[#999999] mb-4">
            {items.length === 0 ? 'Add your first item to get started' : 'Try adjusting your search'}
          </p>
          {items.length === 0 && (
            <button onClick={onAdd} className="btn-primary">
              Add Item
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <ItemModal
        open={modalState.open}
        mode={modalState.mode}
        editItem={editItem}
        onClose={onCloseModal}
        onSave={onSaveItem}
        onUpdate={onUpdateItem}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImportItems}
      />
    </div>
  );
}
