import { useColorScheme } from 'react-native';

import { ACCENTS, darkColors, lightColors, paymentStyles } from '@/constants/theme';
import { useStore } from './StoreProvider';

/** Colors for the current theme: light/dark from Settings (or the phone), plus the chosen accent. */
export function useTheme() {
  const { settings } = useStore();
  const system = useColorScheme();
  const dark =
    settings.themeMode === 'dark' || (settings.themeMode === 'system' && system === 'dark');
  const base = dark ? darkColors : lightColors;
  const accent = ACCENTS[settings.accent] ?? ACCENTS.green;
  const colors = { ...base, ...(dark ? accent.dark : accent.light) };
  return { colors, dark, pay: paymentStyles(colors) };
}
