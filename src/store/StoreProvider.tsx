import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  DEFAULT_SETTINGS,
  SEED_PRODUCTS,
  seedDebtors,
  seedSales,
  type DayClosing,
  type Debtor,
  type LedgerEntry,
  type PaymentMethod,
  type Product,
  type Sale,
  type Settings,
} from '@/data/sample';
import { loadItem, saveItem } from './storage';

const STORAGE_KEY = 'bantay-state-v1';

type State = {
  products: Product[];
  debtors: Debtor[];
  sales: Sale[];
  settings: Settings;
  closings: DayClosing[];
};

export type CheckoutInput = {
  cart: { productId: string; qty: number }[];
  payment: PaymentMethod;
  customerId?: string;
  newCustomerName?: string;
  gcashRef?: string;
  cashReceived?: number;
};

type Store = State & {
  ready: boolean;
  checkout: (input: CheckoutInput) => Sale;
  restock: (productId: string, qty: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addDebtor: (input: { name: string; phone?: string; limit: number; amount?: number }) => void;
  addLedgerEntry: (debtorId: string, entry: Omit<LedgerEntry, 'id' | 'date'>) => void;
  updateDebtorLimit: (debtorId: string, limit: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  closeDay: (expected: number, counted: number) => void;
  resetData: () => void;
};

const StoreContext = createContext<Store | null>(null);

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedState(): State {
  return {
    products: SEED_PRODUCTS,
    debtors: seedDebtors(),
    sales: seedSales(SEED_PRODUCTS),
    settings: DEFAULT_SETTINGS,
    closings: [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...seedState(), ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) saveItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = setState;

  function addEntryTo(debtors: Debtor[], debtorId: string, entry: Omit<LedgerEntry, 'id' | 'date'>) {
    return debtors.map((d) =>
      d.id === debtorId
        ? { ...d, entries: [{ ...entry, id: newId(), date: new Date().toISOString() }, ...d.entries] }
        : d,
    );
  }

  const store: Store = {
    ...state,
    ready,

    checkout(input) {
      const current = state;
      const items = input.cart.map(({ productId, qty }) => {
        const p = current.products.find((x) => x.id === productId)!;
        return { productId, name: p.name, price: p.price, cost: p.cost, qty };
      });
      const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

      let debtors = current.debtors;
      let customerId = input.customerId;
      let customerName: string | undefined;
      if (input.payment === 'utang') {
        if (!customerId && input.newCustomerName) {
          customerId = newId();
          debtors = [
            { id: customerId, name: input.newCustomerName, limit: current.settings.defaultLimit, entries: [] },
            ...debtors,
          ];
        }
        customerName = debtors.find((d) => d.id === customerId)?.name;
        const count = items.reduce((sum, it) => sum + it.qty, 0);
        debtors = addEntryTo(debtors, customerId!, {
          type: 'utang',
          amount: total,
          note: `${count} item${count > 1 ? 's' : ''}`,
        });
      }

      const sale: Sale = {
        id: newId(),
        date: new Date().toISOString(),
        items,
        total,
        payment: input.payment,
        customerId,
        customerName,
        gcashRef: input.gcashRef,
        cashReceived: input.cashReceived,
      };

      update((s) => ({
        ...s,
        debtors,
        sales: [sale, ...s.sales],
        products: s.products.map((p) => {
          const line = input.cart.find((c) => c.productId === p.id);
          return line ? { ...p, stock: Math.max(p.stock - line.qty, 0) } : p;
        }),
      }));
      return sale;
    },

    restock(productId, qty) {
      update((s) => ({
        ...s,
        products: s.products.map((p) => (p.id === productId ? { ...p, stock: p.stock + qty } : p)),
      }));
    },

    addProduct(product) {
      update((s) => ({ ...s, products: [{ ...product, id: newId() }, ...s.products] }));
    },

    addDebtor({ name, phone, limit, amount }) {
      const entries: LedgerEntry[] =
        amount && amount > 0
          ? [{ id: newId(), date: new Date().toISOString(), type: 'utang', amount }]
          : [];
      update((s) => ({ ...s, debtors: [{ id: newId(), name, phone, limit, entries }, ...s.debtors] }));
    },

    addLedgerEntry(debtorId, entry) {
      update((s) => ({ ...s, debtors: addEntryTo(s.debtors, debtorId, entry) }));
    },

    updateDebtorLimit(debtorId, limit) {
      update((s) => ({
        ...s,
        debtors: s.debtors.map((d) => (d.id === debtorId ? { ...d, limit } : d)),
      }));
    },

    updateSettings(patch) {
      update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },

    closeDay(expected, counted) {
      update((s) => ({
        ...s,
        closings: [{ id: newId(), date: new Date().toISOString(), expected, counted }, ...s.closings],
      }));
    },

    resetData() {
      update(() => seedState());
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
