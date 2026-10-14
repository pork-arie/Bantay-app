import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { peso } from '@/constants/theme';
import {
  DEFAULT_SETTINGS,
  SEED_PRODUCTS,
  saleItem,
  seedDebtors,
  seedSales,
  type ActivityEntry,
  type ActivityKind,
  type DayClosing,
  type Debtor,
  type LedgerEntry,
  type PaymentMethod,
  type Product,
  type Sale,
  type SellUnit,
  type Settings,
  type StaffMember,
} from '@/data/sample';
import { decryptText, encryptText } from '@/lib/crypto';
import { getDeviceKey } from './deviceKey';
import { loadItem, saveItem } from './storage';

// v2 added tingi/pack units; older saved data is not migrated.
const STORAGE_KEY = 'bantay-state-v2';
/** Oldest activity entries are dropped past this, to keep the saved data small. */
const MAX_ACTIVITY = 1000;
/** Prefix marking saved data that is AES-encrypted with the device key. */
const ENCRYPTED_PREFIX = 'enc1:';
/** With a PIN set, the app locks again after being in the background this long. */
const AUTO_LOCK_MS = 5 * 60 * 1000;

export type State = {
  products: Product[];
  debtors: Debtor[];
  sales: Sale[];
  settings: Settings;
  closings: DayClosing[];
  staff: StaffMember[];
  activity: ActivityEntry[];
  meta: { lastBackupAt?: string; acceptedTermsAt?: string; lightDefault?: boolean; englishDefault?: boolean };
};

/** Who is using the app right now. Not saved: the lock screen asks again on restart. */
export type Session = { id: string; name: string; role: 'owner' | 'staff' };

/** Things staff are not allowed to do; the owner can do everything. */
export type Permission =
  | 'viewProfit'
  | 'inventory'
  | 'manageProducts'
  | 'voidSale'
  | 'settings'
  | 'backup'
  | 'activity';

const STAFF_BLOCKED: Permission[] = [
  'viewProfit',
  'inventory',
  'manageProducts', 'voidSale', 'settings', 'backup', 'activity'];

export type CheckoutInput = {
  cart: { productId: string; unit: SellUnit; qty: number }[];
  payment: PaymentMethod;
  customerId?: string;
  newCustomerName?: string;
  gcashRef?: string;
  cashReceived?: number;
};

type Store = State & {
  ready: boolean;
  /** Saved data exists but couldn't be decrypted; saving is paused so it isn't overwritten. */
  storageError: boolean;
  session: Session | null;
  /** True when an owner PIN is set and nobody has unlocked the app yet. */
  locked: boolean;
  can: (permission: Permission) => boolean;
  login: (pin: string) => boolean;
  lock: () => void;
  checkout: (input: CheckoutInput) => Sale;
  voidSale: (saleId: string, reason: string) => void;
  restock: (productId: string, qty: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, patch: Partial<Omit<Product, 'id'>>) => void;
  /** Past sales keep their own copy of the name and price, so they are not affected. */
  removeProduct: (productId: string) => void;
  addDebtor: (input: { name: string; phone?: string; limit: number; amount?: number }) => void;
  addLedgerEntry: (debtorId: string, entry: Omit<LedgerEntry, 'id' | 'date'>) => void;
  updateDebtorLimit: (debtorId: string, limit: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addStaff: (name: string, pin: string) => void;
  removeStaff: (id: string) => void;
  closeDay: (expected: number, counted: number) => void;
  acceptTerms: () => void;
  markBackedUp: () => void;
  restoreData: (data: Partial<State>) => void;
  resetData: () => void;
  /** Removes products, sales, utang and history but keeps the store profile. */
  startFresh: () => void;
  /** Erases everything, including settings and staff. */
  wipeData: () => void;
};

const StoreContext = createContext<Store | null>(null);

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function receiptTag(sale: Sale) {
  return `#${String(sale.receiptNo ?? '').padStart(6, '0')}`;
}

function seedState(): State {
  return {
    products: SEED_PRODUCTS,
    debtors: seedDebtors(),
    sales: seedSales(SEED_PRODUCTS),
    settings: DEFAULT_SETTINGS,
    closings: [],
    staff: [],
    activity: [],
    meta: { lightDefault: true, englishDefault: true },
  };
}

/** Fills in fields added in later versions so older saved data and backups still load. */
export function normalizeState(saved: Partial<State>): State {
  const meta = saved.meta ?? {};
  const settings = { ...DEFAULT_SETTINGS, ...saved.settings };
  // Light became the default theme; move data saved with the old "system" default over once.
  if (!meta.lightDefault && settings.themeMode === 'system') settings.themeMode = 'light';
  // English became the default language; same one-time move for the old Filipino default.
  if (!meta.englishDefault && settings.language === 'fil') settings.language = 'en';
  return {
    ...seedState(),
    ...saved,
    settings,
    staff: saved.staff ?? [],
    activity: saved.activity ?? [],
    meta: { ...meta, lightDefault: true, englishDefault: true },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  // Only who is logged in is kept here; the name is looked up live so renames show at once.
  const [session, setSession] = useState<Pick<Session, 'id' | 'role'> | null>(null);
  // Saves run one after another so an older, slower save never lands last.
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    (async () => {
      const raw = await loadItem(STORAGE_KEY);
      if (!raw) return;
      // Older versions saved plain JSON; it gets encrypted on the next save.
      const json = raw.startsWith(ENCRYPTED_PREFIX)
        ? await decryptText(raw.slice(ENCRYPTED_PREFIX.length), await getDeviceKey())
        : raw;
      setState(normalizeState(JSON.parse(json) as Partial<State>));
    })()
      .catch(() => setStorageError(true))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || storageError) return;
    const json = JSON.stringify(state);
    saveQueue.current = saveQueue.current
      .then(async () => {
        const encrypted = await encryptText(json, await getDeviceKey());
        await saveItem(STORAGE_KEY, ENCRYPTED_PREFIX + encrypted);
      })
      .catch(() => {});
  }, [state, ready, storageError]);

  const ownerName = state.settings.ownerName || 'Owner';
  const staffMember = session?.role === 'staff' ? state.staff.find((m) => m.id === session.id) : undefined;
  // A staff member who was removed (or whose data was replaced) is logged out.
  const validSession = session !== null && (session.role === 'owner' || staffMember !== undefined);
  const locked = state.settings.ownerPin !== '' && !validSession;
  // With no PIN set there is only the owner.
  const current: Session =
    validSession && session.role === 'staff'
      ? { id: session.id, name: staffMember!.name, role: 'staff' }
      : { id: 'owner', name: ownerName, role: 'owner' };

  // Lock again when the app comes back after a while in the background.
  const hasPin = state.settings.ownerPin !== '';
  useEffect(() => {
    if (!hasPin) return;
    let leftAt = 0;
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'background') leftAt = Date.now();
      if (status === 'active' && leftAt > 0) {
        if (Date.now() - leftAt > AUTO_LOCK_MS) setSession(null);
        leftAt = 0;
      }
    });
    return () => sub.remove();
  }, [hasPin]);

  function logged(s: State, kind: ActivityKind, text: string, who = current.name): State {
    const entry: ActivityEntry = { id: newId(), date: new Date().toISOString(), who, kind, text };
    return { ...s, activity: [entry, ...s.activity].slice(0, MAX_ACTIVITY) };
  }

  function addEntryTo(debtors: Debtor[], debtorId: string, entry: Omit<LedgerEntry, 'id' | 'date'>) {
    return debtors.map((d) =>
      d.id === debtorId
        ? { ...d, entries: [{ ...entry, id: newId(), date: new Date().toISOString() }, ...d.entries] }
        : d,
    );
  }

  /** Moves pieces of every item in a sale on or off the shelf. */
  function adjustStock(products: Product[], sale: Pick<Sale, 'items'>, direction: 1 | -1) {
    return products.map((p) => {
      const pieces = sale.items
        .filter((it) => it.productId === p.id)
        .reduce((sum, it) => sum + it.pieces * it.qty, 0);
      return pieces > 0 ? { ...p, stock: Math.max(p.stock + direction * pieces, 0) } : p;
    });
  }

  const productName = (id: string) => state.products.find((p) => p.id === id)?.name ?? '';
  const debtorName = (id: string) => state.debtors.find((d) => d.id === id)?.name ?? '';

  const store: Store = {
    ...state,
    ready,
    storageError,
    session: locked ? null : current,
    locked,

    can(permission) {
      return current.role === 'owner' || !STAFF_BLOCKED.includes(permission);
    },

    login(pin) {
      const owner = pin === state.settings.ownerPin;
      const member = owner ? undefined : state.staff.find((m) => m.pin === pin);
      if (!owner && !member) return false;
      setSession(owner ? { id: 'owner', role: 'owner' } : { id: member!.id, role: 'staff' });
      setState((s) => logged(s, 'login', owner ? 'owner' : 'staff', owner ? ownerName : member!.name));
      return true;
    },

    lock() {
      setSession(null);
    },

    checkout(input) {
      const items = input.cart.map(({ productId, unit, qty }) =>
        saleItem(state.products.find((x) => x.id === productId)!, unit, qty),
      );
      const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

      let debtors = state.debtors;
      let customerId = input.customerId;
      let customerName: string | undefined;
      if (input.payment === 'utang') {
        if (!customerId && input.newCustomerName) {
          customerId = newId();
          debtors = [
            { id: customerId, name: input.newCustomerName, limit: state.settings.defaultLimit, entries: [] },
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

      const lastNo = state.sales.reduce((max, s) => Math.max(max, s.receiptNo ?? 0), 0);
      const sale: Sale = {
        id: newId(),
        receiptNo: lastNo + 1,
        date: new Date().toISOString(),
        items,
        total,
        payment: input.payment,
        customerId,
        customerName,
        gcashRef: input.gcashRef,
        cashReceived: input.cashReceived,
        by: current.name,
      };

      setState((s) =>
        logged(
          { ...s, debtors, sales: [sale, ...s.sales], products: adjustStock(s.products, sale, -1) },
          'sale',
          `${receiptTag(sale)} · ${peso(total)}`,
        ),
      );
      return sale;
    },

    voidSale(saleId, reason) {
      const sale = state.sales.find((s) => s.id === saleId);
      if (!sale || sale.voided) return;
      setState((s) => {
        // An utang sale also leaves the customer's balance; reverse it.
        const debtors =
          sale.payment === 'utang' && sale.customerId
            ? addEntryTo(s.debtors, sale.customerId, { type: 'void', amount: sale.total, note: receiptTag(sale) })
            : s.debtors;
        return logged(
          {
            ...s,
            debtors,
            products: adjustStock(s.products, sale, 1),
            sales: s.sales.map((x) =>
              x.id === saleId ? { ...x, voided: { date: new Date().toISOString(), by: current.name, reason } } : x,
            ),
          },
          'void',
          `${receiptTag(sale)} · ${peso(sale.total)} · ${reason}`,
        );
      });
    },

    restock(productId, qty) {
      setState((s) =>
        logged(
          { ...s, products: s.products.map((p) => (p.id === productId ? { ...p, stock: p.stock + qty } : p)) },
          'restock',
          `${productName(productId)} +${qty}`,
        ),
      );
    },

    addProduct(product) {
      setState((s) => logged({ ...s, products: [{ ...product, id: newId() }, ...s.products] }, 'product', product.name));
    },

    updateProduct(productId, patch) {
      const before = state.products.find((p) => p.id === productId);
      // Only log the fields that really changed.
      const changed = Object.keys(patch).filter(
        (k) => JSON.stringify(before?.[k as keyof Product]) !== JSON.stringify(patch[k as keyof typeof patch]),
      );
      if (changed.length === 0) return;
      setState((s) =>
        logged(
          { ...s, products: s.products.map((p) => (p.id === productId ? { ...p, ...patch } : p)) },
          'product',
          `${productName(productId)} (${changed.join(', ')})`,
        ),
      );
    },

    removeProduct(productId) {
      const name = productName(productId);
      setState((s) => logged({ ...s, products: s.products.filter((p) => p.id !== productId) }, 'product', `− ${name}`));
    },

    addDebtor({ name, phone, limit, amount }) {
      const entries: LedgerEntry[] =
        amount && amount > 0 ? [{ id: newId(), date: new Date().toISOString(), type: 'utang', amount }] : [];
      setState((s) =>
        logged(
          { ...s, debtors: [{ id: newId(), name, phone, limit, entries }, ...s.debtors] },
          'utang',
          amount ? `${name} · ${peso(amount)}` : name,
        ),
      );
    },

    addLedgerEntry(debtorId, entry) {
      setState((s) =>
        logged(
          { ...s, debtors: addEntryTo(s.debtors, debtorId, entry) },
          entry.type === 'bayad' ? 'bayad' : 'utang',
          `${debtorName(debtorId)} · ${peso(entry.amount)}${entry.method === 'gcash' ? ' · GCash' : ''}`,
        ),
      );
    },

    updateDebtorLimit(debtorId, limit) {
      setState((s) => ({ ...s, debtors: s.debtors.map((d) => (d.id === debtorId ? { ...d, limit } : d)) }));
    },

    updateSettings(patch) {
      // The owner who just turned on the PIN stays logged in instead of being locked out.
      if (patch.ownerPin && !validSession) setSession({ id: current.id, role: current.role });
      setState((s) => {
        const next = { ...s, settings: { ...s.settings, ...patch } };
        // Log profile and security changes, not theme or language taps. Never log PIN values.
        const important = Object.keys(patch).filter((k) => !['themeMode', 'language', 'accent'].includes(k));
        return important.length > 0 ? logged(next, 'settings', important.join(', ')) : next;
      });
    },

    addStaff(name, pin) {
      setState((s) => logged({ ...s, staff: [...s.staff, { id: newId(), name, pin }] }, 'settings', `+ ${name}`));
    },

    removeStaff(id) {
      const name = state.staff.find((m) => m.id === id)?.name ?? '';
      setState((s) => logged({ ...s, staff: s.staff.filter((m) => m.id !== id) }, 'settings', `− ${name}`));
    },

    closeDay(expected, counted) {
      setState((s) =>
        logged(
          { ...s, closings: [{ id: newId(), date: new Date().toISOString(), expected, counted }, ...s.closings] },
          'closing',
          `${peso(counted)} / ${peso(expected)}`,
        ),
      );
    },

    acceptTerms() {
      setState((s) => ({ ...s, meta: { ...s.meta, acceptedTermsAt: new Date().toISOString() } }));
    },

    markBackedUp() {
      setState((s) => logged({ ...s, meta: { ...s.meta, lastBackupAt: new Date().toISOString() } }, 'backup', ''));
    },

    restoreData(data) {
      setSession(null);
      setStorageError(false);
      setState(logged(normalizeState(data), 'restore', ''));
    },

    resetData() {
      setSession(null);
      setState((s) => ({ ...seedState(), meta: { ...seedState().meta, acceptedTermsAt: s.meta.acceptedTermsAt } }));
    },

    startFresh() {
      setState((s) =>
        logged({ ...s, products: [], debtors: [], sales: [], closings: [], activity: [] }, 'wipe', ''),
      );
    },

    wipeData() {
      setSession(null);
      setStorageError(false);
      setState({
        products: [],
        debtors: [],
        sales: [],
        settings: DEFAULT_SETTINGS,
        closings: [],
        staff: [],
        activity: [],
        meta: { lightDefault: true, englishDefault: true },
      });
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
