import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const DRAWER_TABS = [
  { label: 'Overview',  route: '/tabs',            icon: 'grid-outline' },
  { label: 'Benta',     route: '/tabs/Benta',      icon: 'cart-outline' },
  { label: 'Inventory', route: '/tabs/Inventory',  icon: 'cube-outline' },
  { label: 'Utang',     route: '/tabs/Utang',      icon: 'people-outline' },
  { label: 'Reports',   route: '/tabs/Reports',    icon: 'bar-chart-outline' },
] ;

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ headerShown: true }}
      >
        <Drawer.Screen name="tabs" options={{ title: 'DASHBOARD' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}