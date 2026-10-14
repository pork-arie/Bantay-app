import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

import { useT } from "@/i18n";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

export default function tabLayout(){
   const t = useT();
   const { colors } = useTheme();
   const { can } = useStore();
   return(
    <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border}}}>
        <Tabs.Screen name="index" options={{title:t('Dashboard'),tabBarIcon:({color,size})=> (<Ionicons name="grid-outline" size={size} color={color} />)}}/>
        <Tabs.Screen name="Benta" options={{title:t('Benta'),tabBarIcon:(({color,size})=> (<Ionicons name="cart-outline" size={size} color={color}/>))}}/>
        <Tabs.Screen name="Inventory" options={{title:t('Inventory'),tabBarIcon:({color,size})=>(<Ionicons name="cube-outline" size={size} color={color}/>)}}/>
        <Tabs.Screen name="Utang" options={{title:t('Utang'),tabBarIcon:({color,size})=>(<Ionicons name="people-outline" size={size} color={color}/>)}}/>
        <Tabs.Screen name="Reports" options={{href:can('viewProfit')?undefined:null,title:t('Reports'),tabBarIcon:({color,size})=>(<Ionicons name="bar-chart-outline" size={size} color={color}/>)}}/>
    </Tabs>
   )
}
