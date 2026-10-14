// Sample data used until the app is connected to real storage.

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

export type Transaction = {
  id: string;
  customer: string;
  items: number;
  total: number;
  time: string;
  type: 'cash' | 'utang';
};

export type LedgerEntry = {
  id: string;
  date: string;
  type: 'utang' | 'bayad';
  amount: number;
  note?: string;
};

export type Debtor = {
  id: string;
  name: string;
  phone?: string;
  /** Newest first. */
  entries: LedgerEntry[];
};

export type Period = 'today' | 'week' | 'month';

export type PeriodReport = {
  sales: number;
  transactions: number;
  cash: number;
  utang: number;
  cost: number;
  trend: { label: string; total: number }[];
  topProducts: { id: string; qty: number }[];
};

export const CATEGORIES: Category[] = ['Lahat', 'Inumin', 'Snacks', 'De Lata', 'Gamit'];

export const PRODUCTS: Product[] = [
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

export const TRANSACTIONS: Transaction[] = [
  { id: 't1', customer: 'Walk-in', items: 3, total: 58, time: '2:45 PM', type: 'cash' },
  { id: 't2', customer: 'Aling Nena', items: 5, total: 214, time: '1:30 PM', type: 'utang' },
  { id: 't3', customer: 'Walk-in', items: 1, total: 20, time: '12:10 PM', type: 'cash' },
  { id: 't4', customer: 'Mang Jose', items: 2, total: 80, time: '10:05 AM', type: 'utang' },
  { id: 't5', customer: 'Walk-in', items: 4, total: 96, time: '8:20 AM', type: 'cash' },
];

export const WEEKLY_SALES = [
  { day: 'Lun', total: 1240 },
  { day: 'Mar', total: 980 },
  { day: 'Miy', total: 1530 },
  { day: 'Huw', total: 1120 },
  { day: 'Biy', total: 1890 },
  { day: 'Sab', total: 2210 },
  { day: 'Lin', total: 468 },
];

export const DEBTORS: Debtor[] = [
  {
    id: 'd1',
    name: 'Aling Nena',
    phone: '0917 123 4567',
    entries: [
      { id: 'e1', date: 'Okt 14', type: 'utang', amount: 214, note: '5 items' },
      { id: 'e2', date: 'Okt 12', type: 'utang', amount: 536, note: 'Bigas at de lata' },
      { id: 'e3', date: 'Okt 8', type: 'bayad', amount: 500 },
      { id: 'e4', date: 'Okt 2', type: 'utang', amount: 1000, note: 'Grocery' },
    ],
  },
  {
    id: 'd2',
    name: 'Mang Jose',
    entries: [
      { id: 'e5', date: 'Okt 14', type: 'utang', amount: 80, note: '2 items' },
      { id: 'e6', date: 'Okt 10', type: 'utang', amount: 280 },
      { id: 'e7', date: 'Set 28', type: 'utang', amount: 500 },
    ],
  },
  {
    id: 'd3',
    name: 'Ate Liza',
    phone: '0928 555 0192',
    entries: [{ id: 'e8', date: 'Okt 5', type: 'utang', amount: 800, note: 'Gatas at diaper' }],
  },
  {
    id: 'd4',
    name: 'Kuya Ben',
    entries: [
      { id: 'e9', date: 'Okt 11', type: 'bayad', amount: 200 },
      { id: 'e10', date: 'Okt 3', type: 'utang', amount: 740 },
    ],
  },
];

export const REPORTS: Record<Period, PeriodReport> = {
  today: {
    sales: 468,
    transactions: 5,
    cash: 174,
    utang: 294,
    cost: 351,
    trend: [
      { label: '8AM', total: 96 },
      { label: '10AM', total: 80 },
      { label: '12PM', total: 20 },
      { label: '1PM', total: 214 },
      { label: '2PM', total: 58 },
    ],
    topProducts: [
      { id: '1', qty: 6 },
      { id: '9', qty: 2 },
      { id: '5', qty: 3 },
      { id: '3', qty: 4 },
    ],
  },
  week: {
    sales: 9438,
    transactions: 112,
    cash: 7210,
    utang: 2228,
    cost: 7080,
    trend: WEEKLY_SALES.map((d) => ({ label: d.day, total: d.total })),
    topProducts: [
      { id: '1', qty: 84 },
      { id: '3', qty: 120 },
      { id: '9', qty: 22 },
      { id: '5', qty: 41 },
      { id: '12', qty: 55 },
    ],
  },
  month: {
    sales: 38650,
    transactions: 468,
    cash: 30120,
    utang: 8530,
    cost: 28990,
    trend: [
      { label: 'Wk 1', total: 8920 },
      { label: 'Wk 2', total: 10240 },
      { label: 'Wk 3', total: 10052 },
      { label: 'Wk 4', total: 9438 },
    ],
    topProducts: [
      { id: '1', qty: 340 },
      { id: '3', qty: 480 },
      { id: '9', qty: 96 },
      { id: '8', qty: 88 },
      { id: '5', qty: 150 },
    ],
  },
};

export function isLowStock(p: Product) {
  return p.stock <= p.min;
}

export function balanceOf(d: Debtor) {
  return d.entries.reduce((sum, e) => sum + (e.type === 'utang' ? e.amount : -e.amount), 0);
}

export const TOTAL_UTANG = DEBTORS.reduce((sum, d) => sum + balanceOf(d), 0);
