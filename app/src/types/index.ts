export interface Item {
  id: string;
  itemId: string;
  location: string;
  createdAt: number;
}

export type Tab = 'dashboard' | 'manage' | 'search';

export interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  editId?: string;
}

export interface Toast {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}
