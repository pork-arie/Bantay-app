import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function tabLayout(){
   return(
    <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:"#000000",tabBarInactiveTintColor:"#888"}}>
        <Tabs.Screen name="index" options={{title:'Dashboard',tabBarIcon:({color,size})=> (<Ionicons name="grid-outline" size={size} color={color} />)}}/>
        <Tabs.Screen name="Benta" options={{title:'Benta',tabBarIcon:(({color,size})=> (<Ionicons name="cart-outline" size={size} color={color}/>))}}/>
        <Tabs.Screen name="Inventory" options={{title:'Inventory',tabBarIcon:({color,size})=>(<Ionicons name="cube-outline" size={size} color={color}/>)}}/>
        <Tabs.Screen name="Utang" options={{title:'Utang',tabBarIcon:({color,size})=>(<Ionicons name="people-outline" size={size} color={color}/>)}}/>
        <Tabs.Screen name="Reports" options={{title:'Reports',tabBarIcon:({color,size})=>(<Ionicons name="bar-chart-outline" size={size} color={color}/>)}}/>
    </Tabs>
   )
}