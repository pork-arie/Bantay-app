export const BRAND = 'Bantay';

// Neutral, minimalist base. `primary`/`primarySoft` come from the chosen accent
// (see ACCENTS); `success` stays green so money/OK signals keep their meaning.
export const lightColors = {
  background: '#F6F6F7',
  surface: '#FFFFFF',
  text: '#18181B',
  muted: '#71717A',
  border: '#E8E8EB',
  primary: '#16A34A',
  primarySoft: '#DCFCE7',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  blue: '#2563EB',
  blueSoft: '#DBEAFE',
  orange: '#EA580C',
  orangeSoft: '#FFEDD5',
  red: '#DC2626',
  redSoft: '#FEE2E2',
  /** Dark accent surfaces: hero cards, selected chips. */
  dark: '#18181B',
  gcash: '#007DFE',
  gcashSoft: '#E0EEFF',
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  background: '#09090B',
  surface: '#151518',
  text: '#F4F4F5',
  muted: '#A1A1AA',
  border: '#27272A',
  primary: '#16A34A',
  primarySoft: '#123322',
  success: '#22C55E',
  successSoft: '#123322',
  blue: '#60A5FA',
  blueSoft: '#172A4A',
  orange: '#FB923C',
  orangeSoft: '#3A2414',
  red: '#F87171',
  redSoft: '#3B1818',
  dark: '#27272A',
  gcash: '#3B9BFF',
  gcashSoft: '#10294A',
};

export type Accent = 'green' | 'teal' | 'blue' | 'indigo' | 'violet' | 'rose' | 'orange' | 'slate';

type AccentTones = { primary: string; primarySoft: string };

/** Accent presets the owner can pick in Settings, tuned for light and dark mode. */
export const ACCENTS: Record<Accent, { light: AccentTones; dark: AccentTones }> = {
  // Dark-mode tones stay mid-bright so white button text remains readable.
  green: { light: { primary: '#16A34A', primarySoft: '#DCFCE7' }, dark: { primary: '#16A34A', primarySoft: '#123322' } },
  teal: { light: { primary: '#0D9488', primarySoft: '#CCFBF1' }, dark: { primary: '#0D9488', primarySoft: '#0F2F2C' } },
  blue: { light: { primary: '#2563EB', primarySoft: '#DBEAFE' }, dark: { primary: '#3B82F6', primarySoft: '#172A4A' } },
  indigo: { light: { primary: '#4F46E5', primarySoft: '#E0E7FF' }, dark: { primary: '#6366F1', primarySoft: '#1E1B4B' } },
  violet: { light: { primary: '#7C3AED', primarySoft: '#EDE9FE' }, dark: { primary: '#8B5CF6', primarySoft: '#2A1B4A' } },
  rose: { light: { primary: '#E11D48', primarySoft: '#FFE4E6' }, dark: { primary: '#F43F5E', primarySoft: '#3B1520' } },
  orange: { light: { primary: '#EA580C', primarySoft: '#FFEDD5' }, dark: { primary: '#EA580C', primarySoft: '#3A2414' } },
  slate: { light: { primary: '#334155', primarySoft: '#E2E8F0' }, dark: { primary: '#64748B', primarySoft: '#1F2937' } },
};

/** Text, background and icon for each payment method. */
export function paymentStyles(colors: Colors) {
  return {
    cash: { fg: colors.success, bg: colors.successSoft, icon: 'cash-outline' },
    gcash: { fg: colors.gcash, bg: colors.gcashSoft, icon: 'phone-portrait-outline' },
    utang: { fg: colors.orange, bg: colors.orangeSoft, icon: 'time-outline' },
  } as const;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
};

/** Barely-there depth: cards read as flat on the light grey background. */
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.035,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 0,
};

export function peso(amount: number) {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const avatarTints = [
  { bg: '#EFE3D8', fg: '#8A5A3B' },
  { bg: '#DDEAF2', fg: '#3E6A8A' },
  { bg: '#E9E6D6', fg: '#6B6438' },
  { bg: '#E8DFF0', fg: '#6A4A86' },
];

export function initials(name: string) {
  // Skip words like "290ml" so "Coke 290ml" becomes "CO", not "C2".
  const words = name.split(' ').filter((w) => /^[a-z]/i.test(w));
  const letters =
    words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? name).slice(0, 2);
  return letters.toUpperCase();
}
