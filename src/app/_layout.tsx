import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import { router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import BrandTitle from '@/components/BrandTitle';
import LockScreen from '@/components/LockScreen';
import { initials, radius } from '@/constants/theme';
import { useT, type TKey } from '@/i18n';
import { StoreProvider, useStore, type Permission } from '@/store/StoreProvider';
import { useTheme } from '@/store/useTheme';

const DRAWER_TABS: { label: TKey; route: string; segment: string; icon: string; needs?: Permission }[] = [
  { label: 'Dashboard', route: '/', segment: '(tabs)', icon: 'grid-outline' },
  { label: 'Benta', route: '/(tabs)/Benta', segment: 'Benta', icon: 'cart-outline' },
  { label: 'Inventory', route: '/(tabs)/Inventory', segment: 'Inventory', icon: 'cube-outline' },
  { label: 'Utang', route: '/(tabs)/Utang', segment: 'Utang', icon: 'people-outline' },
  { label: 'Reports', route: '/(tabs)/Reports', segment: 'Reports', icon: 'bar-chart-outline', needs: 'viewProfit' },
  { label: 'Mga transaksyon', route: '/transactions', segment: 'transactions', icon: 'receipt-outline' },
  { label: 'Kasaysayan ng benta', route: '/history', segment: 'history', icon: 'calendar-outline', needs: 'viewProfit' },
  { label: 'Activity log', route: '/activity', segment: 'activity', icon: 'list-outline', needs: 'activity' },
  { label: 'Profile at Settings', route: '/settings', segment: 'settings', icon: 'settings-outline', needs: 'settings' },
];

function CustomDrawerContent(props: any) {
  const t = useT();
  const { colors } = useTheme();
  const { settings, session, can, lock } = useStore();
  const segments = useSegments() as string[];
  const current = segments[segments.length - 1];
  const pinOn = settings.ownerPin !== '';

  return (
    <DrawerContentScrollView {...props}>
      {/* Profile */}
      <Pressable
        onPress={() => {
          if (!can('settings')) return;
          router.navigate('/settings');
          props.navigation.closeDrawer();
        }}
        style={[styles.profile, { backgroundColor: colors.background }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials(session?.name || settings.ownerName || 'Bantay')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {session?.name || settings.ownerName || t('Walang pangalan')}
          </Text>
          <Text style={[styles.store, { color: colors.muted }]} numberOfLines={1}>
            {session?.role === 'staff' ? t('Staff') : settings.storeName || t('I-set up ang tindahan')}
          </Text>
        </View>
        {can('settings') && <Ionicons name="create-outline" size={18} color={colors.muted} />}
      </Pressable>

      {DRAWER_TABS.filter((tab) => !tab.needs || can(tab.needs)).map((tab) => (
        <DrawerItem
          key={tab.route}
          label={t(tab.label)}
          focused={current === tab.segment}
          activeTintColor={colors.primary}
          activeBackgroundColor={colors.primarySoft}
          inactiveTintColor={colors.text}
          icon={({ size, color }) => <Ionicons name={tab.icon as any} size={size} color={color} />}
          onPress={() => {
            router.navigate(tab.route as any);
            props.navigation.closeDrawer();
          }}
        />
      ))}

      {pinOn && (
        <DrawerItem
          label={t('I-lock / Palitan ang user')}
          inactiveTintColor={colors.red}
          icon={({ size }) => <Ionicons name="lock-closed-outline" size={size} color={colors.red} />}
          onPress={() => {
            props.navigation.closeDrawer();
            lock();
          }}
        />
      )}
    </DrawerContentScrollView>
  );
}

function AppDrawer() {
  const t = useT();
  const { colors, dark } = useTheme();
  const { ready, locked } = useStore();
  // The header belongs to the drawer, so read the active tab from the URL.
  const segments = useSegments() as string[];
  const last = segments[segments.length - 1];
  // Legal opens from Settings, so it isn't in the drawer but still needs a title.
  const pageLabel: TKey =
    last === 'legal' ? 'Privacy at Terms' : (DRAWER_TABS.find((tab) => tab.segment === last)?.label ?? 'Dashboard');

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitle: () => <BrandTitle page={t(pageLabel)} />,
          drawerStyle: { backgroundColor: colors.surface },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Drawer.Screen name="(tabs)" />
        <Drawer.Screen name="transactions" />
        <Drawer.Screen name="history" />
        <Drawer.Screen name="activity" />
        <Drawer.Screen name="settings" />
        <Drawer.Screen name="legal" />
      </Drawer>
      {/* Keep the navigator mounted underneath; cover it until data loads or while locked. */}
      {(!ready || locked) && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
          {ready && <LockScreen />}
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <AppDrawer />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: radius.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  store: {
    fontSize: 13,
    marginTop: 2,
  },
});
