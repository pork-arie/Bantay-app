import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Small vibration feedback. Web has no haptics, so these do nothing there.
export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function success() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

export function warning() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
}
