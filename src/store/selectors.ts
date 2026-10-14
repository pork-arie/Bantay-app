import type { Debtor, Language, PaymentMethod, Period, Product, Sale } from '@/data/sample';
import type { TKey } from '@/i18n';

const MONTHS: Record<Language, string[]> = {
  fil: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const WEEKDAYS: Record<Language, string[]> = {
  fil: ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(iso: string, lang: Language = 'fil') {
  const d = new Date(iso);
  return `${MONTHS[lang][d.getMonth()]} ${d.getDate()}`;
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

/** "3 tali + 4 sachet" for pack products, "12 bote" otherwise. */
export function formatStock(p: Product, pieces = p.stock) {
  if (!p.pack || pieces < p.pack.size) return `${pieces} ${p.unit}`;
  const packs = Math.floor(pieces / p.pack.size);
  const rest = pieces % p.pack.size;
  return rest > 0 ? `${packs} ${p.pack.name} + ${rest} ${p.unit}` : `${packs} ${p.pack.name}`;
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
      // qty is reported in pieces so tingi and pack sales add up.
      row.qty += it.qty * it.pieces;
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
export function trend(sales: Sale[], period: Period, lang: Language = 'fil') {
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
      label: period === 'week' ? WEEKDAYS[lang][new Date(start).getDay()] : `Wk ${i + 1}`,
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
  const pieces = salesInLastDays(sales, 7)
    .flatMap((s) => s.items)
    .filter((it) => it.productId === productId)
    .reduce((sum, it) => sum + it.qty * it.pieces, 0);
  return pieces / 7;
}

/** Roughly how many days the current stock will last, or null if it isn't selling. */
export function daysLeft(product: Product, sales: Sale[]) {
  const rate = dailyRate(sales, product.id);
  return rate > 0 ? Math.floor(product.stock / rate) : null;
}

/** Low items with how much to buy, rounded up to whole packs when there is one. */
export function restockList(products: Product[]) {
  return products.filter(isLowStock).map((p) => {
    const pieces = Math.max(p.min * 2 - p.stock, p.min);
    if (!p.pack) return { product: p, pieces, label: `${pieces} ${p.unit}` };
    const packs = Math.ceil(pieces / p.pack.size);
    return { product: p, pieces: packs * p.pack.size, label: `${packs} ${p.pack.name}` };
  });
}

/** One short, useful hint for the dashboard, as a translation key plus values. */
export function smartTip(
  products: Product[],
  sales: Sale[],
): { key: TKey; vars?: Record<string, string | number> } {
  const urgent = products
    .map((p) => ({ p, days: daysLeft(p, sales) }))
    .filter((x): x is { p: Product; days: number } => x.days !== null && x.days <= 3)
    .sort((a, b) => a.days - b.days)[0];
  if (urgent) {
    return urgent.days === 0
      ? { key: 'Mauubos na ngayon ang {name}. Mag-restock na!', vars: { name: urgent.p.name } }
      : {
          key: 'Mauubos ang {name} sa loob ng ~{days} araw. Mag-restock na.',
          vars: { name: urgent.p.name, days: urgent.days },
        };
  }

  const best = summarize(salesInLastDays(sales, 7)).topProducts[0];
  if (best) {
    return { key: 'Pinakamabenta ngayong linggo: {name} ({qty} pcs).', vars: { name: best.name, qty: best.qty } };
  }
  return { key: 'Simulan ang unang benta para makita ang mga tips dito.' };
}

// ---------- Sales history ----------

const MONTH_NAMES: Record<Language, string[]> = {
  fil: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export type MonthRef = { year: number; month: number };

export function monthName(ref: MonthRef, lang: Language = 'fil', short = false) {
  const name = MONTH_NAMES[lang][ref.month];
  return short ? name.slice(0, 3) : `${name} ${ref.year}`;
}

/** "Lun, Okt 14" */
export function formatDay(date: Date, lang: Language = 'fil') {
  return `${WEEKDAYS[lang][date.getDay()]}, ${MONTHS[lang][date.getMonth()]} ${date.getDate()}`;
}

function inMonth(iso: string, ref: MonthRef) {
  const d = new Date(iso);
  return d.getFullYear() === ref.year && d.getMonth() === ref.month;
}

/** The last `count` months, oldest first, each with its totals. */
export function monthlyHistory(sales: Sale[], count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const ref = { year: d.getFullYear(), month: d.getMonth() };
    return { ref, ...summarize(sales.filter((s) => inMonth(s.date, ref))) };
  });
}

/** Every day of the month up to today, newest first, each with its totals. */
export function dailyHistory(sales: Sale[], ref: MonthRef) {
  const today = startOfDay();
  const lastDay = new Date(ref.year, ref.month + 1, 0).getDate();
  const days = [];
  for (let day = lastDay; day >= 1; day--) {
    const date = new Date(ref.year, ref.month, day);
    if (date > today) continue;
    const next = new Date(ref.year, ref.month, day + 1);
    const daySales = sales.filter((s) => {
      const t = new Date(s.date);
      return t >= date && t < next;
    });
    days.push({ date, sales: daySales, ...summarize(daySales) });
  }
  return days;
}

// ---------- Forecast ----------

/**
 * A simple, explainable forecast: average sales for each weekday over the last
 * 4 full weeks, then add those averages up for the days ahead.
 */
export function forecast(sales: Sale[]) {
  const today = startOfDay();
  const from = today.getTime() - 28 * DAY_MS;
  const past = sales.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= from && t < today.getTime();
  });
  const past28 = summarize(past);
  const margin = past28.total > 0 ? past28.profit / past28.total : 0;

  // Only count weekdays the store has history for (a new store has fewer than 4).
  const firstSale = past.reduce((min, s) => Math.min(min, new Date(s.date).getTime()), Infinity);
  const totals = Array(7).fill(0);
  const counts = Array(7).fill(0);
  for (let i = 1; i <= 28; i++) {
    const day = new Date(today.getTime() - i * DAY_MS);
    if (day.getTime() + DAY_MS <= firstSale) continue;
    counts[day.getDay()] += 1;
  }
  for (const s of past) totals[new Date(s.date).getDay()] += s.total;
  const weekdayAvg = totals.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));

  const todaySoFar = summarize(sales.filter((s) => isToday(s.date))).total;
  const restOfToday = Math.max(weekdayAvg[today.getDay()] - todaySoFar, 0);
  const sumAhead = (days: number) =>
    Array.from({ length: days }, (_, i) => weekdayAvg[(today.getDay() + 1 + i) % 7]).reduce(
      (a, b) => a + b,
      0,
    );

  const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
  const monthSoFar = summarize(
    sales.filter((s) => inMonth(s.date, { year: today.getFullYear(), month: today.getMonth() })),
  ).total;
  const monthTotal = monthSoFar + restOfToday + sumAhead(daysLeftInMonth);
  const next7 = sumAhead(7);
  const next30 = sumAhead(30);

  // Trend: last 14 days compared with the 14 before.
  const recent = past.filter((s) => new Date(s.date).getTime() >= today.getTime() - 14 * DAY_MS);
  const recentTotal = summarize(recent).total;
  const olderTotal = past28.total - recentTotal;
  const trendPct = olderTotal > 0 ? ((recentTotal - olderTotal) / olderTotal) * 100 : null;

  const bestDay = weekdayAvg.indexOf(Math.max(...weekdayAvg));

  return {
    hasData: past.length > 0,
    margin,
    weekdayAvg,
    bestDay,
    trendPct,
    next7: { sales: next7, profit: next7 * margin },
    next30: { sales: next30, profit: next30 * margin },
    month: { soFar: monthSoFar, sales: monthTotal, profit: monthTotal * margin },
  };
}

export function weekdayName(day: number, lang: Language = 'fil') {
  return WEEKDAYS[lang][day];
}

/** Totals for the first `day` days of a month, for fair "so far" comparisons. */
export function monthToDay(sales: Sale[], ref: MonthRef, day: number) {
  return summarize(
    sales.filter((s) => inMonth(s.date, ref) && new Date(s.date).getDate() <= day),
  );
}
