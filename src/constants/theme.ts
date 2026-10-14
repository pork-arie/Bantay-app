export const colors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#16A34A',
  primarySoft: '#DCFCE7',
  blue: '#2563EB',
  blueSoft: '#DBEAFE',
  orange: '#EA580C',
  orangeSoft: '#FFEDD5',
  red: '#DC2626',
  redSoft: '#FEE2E2',
  dark: '#111827',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
};

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
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
