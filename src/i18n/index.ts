import type { Language } from '@/data/sample';
import { useStore } from '@/store/StoreProvider';
import { en } from './en';
import { wa } from './wa';

/**
 * Filipino text doubles as the translation key: Filipino mode shows the key,
 * English mode looks it up in `en`, and Waray in `wa` (falling back to Filipino).
 * Using `TKey` makes typos a type error.
 */
export type TKey = keyof typeof en;
export type TVars = Record<string, string | number>;

export function translate(lang: Language, key: TKey, vars?: TVars) {
  const text: string = lang === 'en' ? en[key] : lang === 'war' ? (wa[key] ?? key) : key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : text;
}

export function useT() {
  const { settings } = useStore();
  return (key: TKey, vars?: TVars) => translate(settings.language, key, vars);
}

export const PAYMENT_KEYS = {
  cash: 'Cash',
  gcash: 'GCash',
  utang: 'Utang',
} as const satisfies Record<'cash' | 'gcash' | 'utang', TKey>;
