import { useColorScheme } from 'react-native';

import { darkColors, lightColors, paymentStyles } from '@/constants/theme';
import { useStore } from './StoreProvider';

/** Colors for the current theme: the Settings choice, or the phone's when "system". */
export function useTheme() {
  const { settings } = useStore();
  const system = useColorScheme();
  const dark =
    settings.themeMode === 'dark' || (settings.themeMode === 'system' && system === 'dark');
  const colors = dark ? darkColors : lightColors;
  return { colors, dark, pay: paymentStyles(colors) };
}
