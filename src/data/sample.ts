// Types plus the starter data the app is seeded with on first launch.

export type Category = 'Lahat' | 'Inumin' | 'Snacks' | 'De Lata' | 'Gamit';

export type Product = {
  id: string;
  name: string;
  price: number;
  /** What the store paid per piece; used to compute profit (tubo). */
  cost: number;
  stock: number;
  /** Reorder point: the product counts as running low at or below this. */
  min: number;
  category: Exclude<Category, 'Lahat'>;
};

export type PaymentMethod = 'cash' | 'gcash' | 'utang';

export type SaleItem = {
  productId: string;
  name: string;
  price: number;
  cost: number;
  qty: number;
};

export type Sale = {
  id: string;
  /** ISO timestamp. */
  date: string;
  items: SaleItem[];
  total: number;
  payment: PaymentMethod;
  customerId?: string;
  customerName?: string;
  gcashRef?: string;
  cashReceived?: number;
};

export type LedgerEntry = {
  id: string;
  /** ISO timestamp. */
  date: string;
  type: 'utang' | 'bayad';
  amount: number;
  /** How a bayad was paid. */
  method?: 'cash' | 'gcash';
  note?: string;
};

export type Debtor = {
  id: string;
  name: string;
  phone?: string;
  /** Credit limit; checkout warns before going over it. */
  limit: number;
  /** Newest first. */
  entries: LedgerEntry[];
};

export type Settings = {
  storeName: string;
  ownerName: string;
  gcashNumber: string;
  defaultLimit: number;
};

export type DayClosing = {
  id: string;
  date: string;
  expected: number;
  counted: number;
};

export type Period = 'today' | 'week' | 'month';

export const CATEGORIES: Category[] = ['Lahat', 'Inumin', 'Snacks', 'De Lata', 'Gamit'];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  utang: 'Utang',
};

export const SEED_PRODUCTS: Product[] = [
  { id: '1', name: 'Coke 290ml', price: 20, cost: 16, stock: 24, min: 10, category: 'Inumin' },
  { id: '2', name: 'Royal 290ml', price: 20, cost: 16, stock: 18, min: 10, category: 'Inumin' },
  { id: '3', name: 'Kopiko 3in1', price: 10, cost: 7.5, stock: 40, min: 20, category: 'Inumin' },
  { id: '4', name: 'Nescafe Classic', price: 8, cost: 6, stock: 3, min: 20, category: 'Inumin' },
  { id: '5', name: 'Piattos', price: 18, cost: 14, stock: 12, min: 20, category: 'Snacks' },
  { id: '6', name: 'Nova', price: 18, cost: 14, stock: 9, min: 15, category: 'Snacks' },
  { id: '7', name: 'Skyflakes', price: 9, cost: 7, stock: 30, min: 15, category: 'Snacks' },
  { id: '8', name: 'Century Tuna', price: 38, cost: 32, stock: 2, min: 10, category: 'De Lata' },
  { id: '9', name: 'Argentina Corned Beef', price: 42, cost: 35, stock: 10, min: 8, category: 'De Lata' },
  { id: '10', name: 'Ligo Sardinas', price: 26, cost: 21, stock: 15, min: 10, category: 'De Lata' },
  { id: '11', name: 'Safeguard Sabon', price: 35, cost: 29, stock: 4, min: 10, category: 'Gamit' },
  { id: '12', name: 'Surf Sachet', price: 12, cost: 9.5, stock: 50, min: 20, category: 'Gamit' },
];

export const DEFAULT_SETTINGS: Settings = {
  storeName: '',
  ownerName: '',
  gcashNumber: '',
  defaultLimit: 2000,
};

function daysAgo(days: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function seedDebtors(): Debtor[] {
  return [
    {
      id: 'd1',
      name: 'Aling Nena',
      phone: '0917 123 4567',
      limit: 2000,
      entries: [
        { id: 'e2', date: daysAgo(2), type: 'utang', amount: 750, note: 'Bigas at de lata' },
        { id: 'e3', date: daysAgo(6), type: 'bayad', amount: 500, method: 'gcash' },
        { id: 'e4', date: daysAgo(12), type: 'utang', amount: 1000, note: 'Grocery' },
      ],
    },
    {
      id: 'd2',
      name: 'Mang Jose',
      limit: 1000,
      entries: [
        { id: 'e6', date: daysAgo(4), type: 'utang', amount: 360 },
        { id: 'e7', date: daysAgo(16), type: 'utang', amount: 500 },
      ],
    },
    {
      id: 'd3',
      name: 'Ate Liza',
      phone: '0928 555 0192',
      limit: 1500,
      entries: [{ id: 'e8', date: daysAgo(9), type: 'utang', amount: 800, note: 'Gatas at diaper' }],
    },
    {
      id: 'd4',
      name: 'Kuya Ben',
      limit: 1000,
      entries: [
        { id: 'e9', date: daysAgo(3), type: 'bayad', amount: 200, method: 'cash' },
        { id: 'e10', date: daysAgo(11), type: 'utang', amount: 740 },
      ],
    },
  ];
}

/**
 * Generates 30 days of believable past sales so Reports and the Dashboard
 * have something to show before the store records its own.
 */
export function seedSales(products: Product[]): Sale[] {
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const sales: Sale[] = [];
  const now = new Date();
  for (let day = 29; day >= 0; day--) {
    const count = 8 + Math.floor(rand() * 10);
    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - day);
      date.setHours(7 + Math.floor(rand() * 13), Math.floor(rand() * 60), 0, 0);
      if (date > now) continue;

      const lines = 1 + Math.floor(rand() * 3);
      const items: SaleItem[] = [];
      for (let l = 0; l < lines; l++) {
        const p = products[Math.floor(rand() * products.length)];
        if (items.some((it) => it.productId === p.id)) continue;
        items.push({ productId: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1 + Math.floor(rand() * 3) });
      }
      const r = rand();
      const payment: PaymentMethod = r < 0.62 ? 'cash' : r < 0.85 ? 'gcash' : 'utang';
      sales.push({
        id: `s${day}-${i}`,
        date: date.toISOString(),
        items,
        total: items.reduce((sum, it) => sum + it.price * it.qty, 0),
        payment,
        customerName: payment === 'utang' ? 'Aling Nena' : undefined,
        customerId: payment === 'utang' ? 'd1' : undefined,
      });
    }
  }
  return sales.sort((a, b) => b.date.localeCompare(a.date));
}
