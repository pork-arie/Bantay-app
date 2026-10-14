import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import { router, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { StoreProvider } from '@/store/StoreProvider';

const DRAWER_TABS = [
  { label: 'Overview',  route: '/',                  icon: 'grid-outline' },
  { label: 'Benta',     route: '/(tabs)/Benta',      icon: 'cart-outline' },
  { label: 'Inventory', route: '/(tabs)/Inventory',  icon: 'cube-outline' },
  { label: 'Utang',     route: '/(tabs)/Utang',      icon: 'people-outline' },
  { label: 'Reports',   route: '/(tabs)/Reports',    icon: 'bar-chart-outline' },
  { label: 'Settings',  route: '/settings',          icon: 'settings-outline' },
] ;

const TAB_TITLES: Record<string, string> = {
  Benta: 'Benta',
  Inventory: 'Inventory',
  Utang: 'Utang',
  Reports: 'Reports',
};

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView style={{marginTop:100}} {...props}>
      {DRAWER_TABS.map((tab) => (
        <DrawerItem
          key={tab.route}
          label={tab.label}
          icon={({size,color})=> (
            <Ionicons name={tab.icon as any} size={size} color={color}/>
          )}
          onPress={() => {
            router.navigate(tab.route as any);
            props.navigation.closeDrawer();
          }}
        />
      ))}
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  // The header belongs to the drawer, so read the active tab from the URL.
  const segments = useSegments() as string[];
  const tabTitle = TAB_TITLES[segments[segments.length - 1]] ?? 'Dashboard';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{ headerShown: true }}
        >
          <Drawer.Screen name="(tabs)" options={{ title: tabTitle }} />
          <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
        </Drawer>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
