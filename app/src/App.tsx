import { useState, useEffect, useCallback } from 'react';
import type { Item, Tab, ModalState, Toast } from './types';
import Dashboard from './pages/Dashboard';
import Manage from './pages/Manage';
import Search from './pages/Search';
import { LayoutGrid, Table2, Search as SearchIcon, CheckCircle2, AlertCircle, X } from 'lucide-react';

const STORAGE_KEY = 'itemLocationData';
const SEARCH_HISTORY_KEY = 'itemLocationSearchHistory';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getInitialData(): Item[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through to default
    }
  }
  const now = Date.now();
  const defaults: Item[] = [
    { id: generateId(), itemId: 'ITEM-001', location: 'Warehouse A - Shelf 1', createdAt: now - 3 * 24 * 60 * 60 * 1000 },
    { id: generateId(), itemId: 'ITEM-002', location: 'Warehouse B - Rack 5', createdAt: now - 2 * 24 * 60 * 60 * 1000 },
    { id: generateId(), itemId: 'ITEM-003', location: 'Office - Cabinet C', createdAt: now - 1 * 24 * 60 * 60 * 1000 },
    { id: generateId(), itemId: 'ITEM-004', location: 'Warehouse A - Shelf 7', createdAt: now },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export default function App() {
  const [items, setItems] = useState<Item[]>(getInitialData);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [modalState, setModalState] = useState<ModalState>({ open: false, mode: 'add' });
  const [toast, setToast] = useState<Toast | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 200);
    }, 3000);
  }, []);

  const addItem = useCallback((itemId: string, location: string) => {
    const newItem: Item = {
      id: generateId(),
      itemId,
      location,
      createdAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
    showToast('Item saved', 'success');
  }, [showToast]);

  const updateItem = useCallback((id: string, itemId: string, location: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, itemId, location } : item
    ));
    showToast('Item updated', 'success');
  }, [showToast]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    showToast('Item deleted', 'success');
  }, [showToast]);

  // Import: add multiple items at once
  const importItems = useCallback((newItems: Array<{ itemId: string; location: string }>) => {
    const now = Date.now();
    const toAdd: Item[] = newItems.map((item, i) => ({
      id: generateId(),
      itemId: item.itemId,
      location: item.location,
      createdAt: now + i, // slight offset to preserve order
    }));
    setItems(prev => [...toAdd, ...prev]);
    showToast(`Imported ${toAdd.length} items`, 'success');
  }, [showToast]);

  const addToSearchHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 5);
    });
  }, []);

  const openAddModal = useCallback(() => {
    setModalState({ open: true, mode: 'add' });
  }, []);

  const openEditModal = useCallback((id: string) => {
    setModalState({ open: true, mode: 'edit', editId: id });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false, mode: 'add' });
  }, []);

  const getEditItem = useCallback(() => {
    if (modalState.mode === 'edit' && modalState.editId) {
      return items.find(item => item.id === modalState.editId) || null;
    }
    return null;
  }, [modalState, items]);

  const handleNavClick = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Page Content */}
      <div className="page-fade-in">
        {activeTab === 'dashboard' && (
          <Dashboard
            items={items}
            onNavigate={handleNavClick}
          />
        )}
        {activeTab === 'manage' && (
          <Manage
            items={items}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={deleteItem}
            onImportItems={importItems}
            modalState={modalState}
            onCloseModal={closeModal}
            onSaveItem={addItem}
            onUpdateItem={updateItem}
            editItem={getEditItem()}
          />
        )}
        {activeTab === 'search' && (
          <Search
            items={items}
            searchHistory={searchHistory}
            onAddToHistory={addToSearchHistory}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-2 bg-black text-white rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.visible ? 'toast-enter' : 'toast-exit'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#2e7d32] shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-[#e53935] shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-[#999999] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#f0f0f0] border-t border-[#e5e5e5] z-40 flex items-center justify-around select-none">
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 w-20 h-full transition-colors duration-150 ${
            activeTab === 'dashboard' ? 'text-[#284ff4]' : 'text-[#666666]'
          }`}
          style={activeTab === 'dashboard' ? { borderBottom: '2px solid #284ff4' } : undefined}
          aria-label="Dashboard"
        >
          <LayoutGrid size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.5} />
          <span className="text-[11px] font-medium">Dashboard</span>
        </button>
        <button
          onClick={() => handleNavClick('manage')}
          className={`flex flex-col items-center justify-center gap-0.5 w-20 h-full transition-colors duration-150 ${
            activeTab === 'manage' ? 'text-[#284ff4]' : 'text-[#666666]'
          }`}
          style={activeTab === 'manage' ? { borderBottom: '2px solid #284ff4' } : undefined}
          aria-label="Manage"
        >
          <Table2 size={20} strokeWidth={activeTab === 'manage' ? 2.5 : 1.5} />
          <span className="text-[11px] font-medium">Manage</span>
        </button>
        <button
          onClick={() => handleNavClick('search')}
          className={`flex flex-col items-center justify-center gap-0.5 w-20 h-full transition-colors duration-150 ${
            activeTab === 'search' ? 'text-[#284ff4]' : 'text-[#666666]'
          }`}
          style={activeTab === 'search' ? { borderBottom: '2px solid #284ff4' } : undefined}
          aria-label="Search"
        >
          <SearchIcon size={20} strokeWidth={activeTab === 'search' ? 2.5 : 1.5} />
          <span className="text-[11px] font-medium">Search</span>
        </button>
      </nav>
    </div>
  );
}
