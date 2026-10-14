import { Platform } from 'react-native';

import type { Product } from '@/data/sample';

export type LookupResult = {
  name: string;
  category?: Product['category'];
};

/** Rough mapping from Open Food Facts category tags to our categories. */
function guessCategory(tags: string[]): Product['category'] | undefined {
  const has = (...words: string[]) => tags.some((tag) => words.some((w) => tag.includes(w)));
  if (has('beverage', 'drink', 'coffee', 'water', 'soda', 'juice', 'milk')) return 'Inumin';
  if (has('canned', 'sardine', 'tuna', 'corned')) return 'De Lata';
  if (has('snack', 'chip', 'crisp', 'biscuit', 'cracker', 'candy', 'chocolate')) return 'Snacks';
  if (has('soap', 'detergent', 'shampoo', 'hygiene', 'household')) return 'Gamit';
  return undefined;
}

/**
 * Looks a barcode up in Open Food Facts, a free public product database.
 * It knows many packaged goods but not prices, and coverage of local
 * products varies, so callers must handle `null`.
 */
export async function lookupBarcode(code: string): Promise<LookupResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
        '?fields=product_name,brands,quantity,categories_tags',
      {
        signal: controller.signal,
        // Open Food Facts asks apps to identify themselves; browsers forbid setting it.
        headers: Platform.OS === 'web' ? undefined : { 'User-Agent': 'Bantay/1.0 (sari-sari store app)' },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    if (data?.status !== 1 || !p?.product_name) return null;

    const brand = typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : '';
    let name: string = p.product_name.trim();
    if (brand && !name.toLowerCase().includes(brand.toLowerCase())) name = `${brand} ${name}`;
    if (p.quantity && !name.toLowerCase().includes(String(p.quantity).toLowerCase())) {
      name = `${name} ${p.quantity}`;
    }
    return { name, category: guessCategory(p.categories_tags ?? []) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
