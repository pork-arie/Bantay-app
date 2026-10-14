// Sample data used until the app is connected to real storage.

export type Category = 'Lahat' | 'Inumin' | 'Snacks' | 'De Lata' | 'Gamit';

export type Product = {
  id: string;
  name: string;
  price: number;
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

export const CATEGORIES: Category[] = ['Lahat', 'Inumin', 'Snacks', 'De Lata', 'Gamit'];

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Coke 290ml', price: 20, stock: 24, min: 10, category: 'Inumin' },
  { id: '2', name: 'Royal 290ml', price: 20, stock: 18, min: 10, category: 'Inumin' },
  { id: '3', name: 'Kopiko 3in1', price: 10, stock: 40, min: 20, category: 'Inumin' },
  { id: '4', name: 'Nescafe Classic', price: 8, stock: 3, min: 20, category: 'Inumin' },
  { id: '5', name: 'Piattos', price: 18, stock: 12, min: 20, category: 'Snacks' },
  { id: '6', name: 'Nova', price: 18, stock: 9, min: 15, category: 'Snacks' },
  { id: '7', name: 'Skyflakes', price: 9, stock: 30, min: 15, category: 'Snacks' },
  { id: '8', name: 'Century Tuna', price: 38, stock: 2, min: 10, category: 'De Lata' },
  { id: '9', name: 'Argentina Corned Beef', price: 42, stock: 10, min: 8, category: 'De Lata' },
  { id: '10', name: 'Ligo Sardinas', price: 26, stock: 15, min: 10, category: 'De Lata' },
  { id: '11', name: 'Safeguard Sabon', price: 35, stock: 4, min: 10, category: 'Gamit' },
  { id: '12', name: 'Surf Sachet', price: 12, stock: 50, min: 20, category: 'Gamit' },
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

export const TOTAL_UTANG = 3450;

export function isLowStock(p: Product) {
  return p.stock <= p.min;
}
