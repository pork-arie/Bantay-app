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
