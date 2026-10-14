import type { Debtor, PaymentMethod, Period, Product, Sale } from '@/data/sample';

const MONTHS = ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis'];
const WEEKDAYS = ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'];
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function isToday(iso: string) {
  return new Date(iso) >= startOfDay();
}

export function isLowStock(p: Product) {
  return p.stock <= p.min;
}

export function balanceOf(d: Debtor) {
  return d.entries.reduce((sum, e) => sum + (e.type === 'utang' ? e.amount : -e.amount), 0);
}

export function totalUtang(debtors: Debtor[]) {
  return debtors.reduce((sum, d) => sum + balanceOf(d), 0);
}

export const PERIOD_DAYS: Record<Period, number> = { today: 1, week: 7, month: 28 };

export function salesInLastDays(sales: Sale[], days: number) {
  const from = startOfDay().getTime() - (days - 1) * DAY_MS;
  return sales.filter((s) => new Date(s.date).getTime() >= from);
}

export function summarize(sales: Sale[]) {
  const byPayment: Record<PaymentMethod, number> = { cash: 0, gcash: 0, utang: 0 };
  const products = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
  let total = 0;
  let cost = 0;

  for (const s of sales) {
    total += s.total;
    byPayment[s.payment] += s.total;
    for (const it of s.items) {
      cost += it.cost * it.qty;
      const row = products.get(it.productId) ?? { productId: it.productId, name: it.name, qty: 0, revenue: 0 };
      row.qty += it.qty;
      row.revenue += it.price * it.qty;
      products.set(it.productId, row);
    }
  }

  return {
    total,
    cost,
    profit: total - cost,
    transactions: sales.length,
    byPayment,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue),
  };
}

/** Sales totals bucketed for the chart of the given period. */
export function trend(sales: Sale[], period: Period) {
  if (period === 'today') {
    const buckets = [6, 9, 12, 15, 18].map((h) => ({
      label: h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM`,
      from: h,
      total: 0,
    }));
    for (const s of salesInLastDays(sales, 1)) {
      const hour = new Date(s.date).getHours();
      const bucket = [...buckets].reverse().find((b) => hour >= b.from) ?? buckets[0];
      bucket.total += s.total;
    }
    return buckets.map(({ label, total }) => ({ label, total }));
  }

  const days = PERIOD_DAYS[period];
  const size = period === 'week' ? 1 : 7;
  const today = startOfDay().getTime();
  const buckets = Array.from({ length: days / size }, (_, i) => {
    const start = today - (days - 1 - i * size) * DAY_MS;
    return {
      label: period === 'week' ? WEEKDAYS[new Date(start).getDay()] : `Wk ${i + 1}`,
      start,
      total: 0,
    };
  });
  for (const s of salesInLastDays(sales, days)) {
    const t = new Date(s.date).getTime();
    const bucket = [...buckets].reverse().find((b) => t >= b.start);
    if (bucket) bucket.total += s.total;
  }
  return buckets.map(({ label, total }) => ({ label, total }));
}

/** Average pieces sold per day over the last week. */
export function dailyRate(sales: Sale[], productId: string) {
  const qty = salesInLastDays(sales, 7)
    .flatMap((s) => s.items)
    .filter((it) => it.productId === productId)
    .reduce((sum, it) => sum + it.qty, 0);
  return qty / 7;
}

/** Roughly how many days the current stock will last, or null if it isn't selling. */
export function daysLeft(product: Product, sales: Sale[]) {
  const rate = dailyRate(sales, product.id);
  return rate > 0 ? Math.floor(product.stock / rate) : null;
}

export function restockList(products: Product[]) {
  return products
    .filter(isLowStock)
    .map((p) => ({ product: p, qty: Math.max(p.min * 2 - p.stock, p.min) }));
}

/** One short, useful hint for the dashboard. */
export function smartTip(products: Product[], sales: Sale[]) {
  const urgent = products
    .map((p) => ({ p, days: daysLeft(p, sales) }))
    .filter((x): x is { p: Product; days: number } => x.days !== null && x.days <= 3)
    .sort((a, b) => a.days - b.days)[0];
  if (urgent) {
    return urgent.days === 0
      ? `Mauubos na ngayon ang ${urgent.p.name}. Mag-restock na!`
      : `Mauubos ang ${urgent.p.name} sa loob ng ~${urgent.days} araw. Mag-restock na.`;
  }

  const best = summarize(salesInLastDays(sales, 7)).topProducts[0];
  if (best) return `Pinakamabenta ngayong linggo: ${best.name} (${best.qty} pcs).`;
  return 'Simulan ang unang benta para makita ang mga tips dito.';
}
