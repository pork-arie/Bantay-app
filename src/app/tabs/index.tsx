import { TouchableOpacity,Text, View, StyleSheet, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

export default function Index() {

  const router = useRouter()
  return (
    <ScrollView>
      <View style={styles.cheader} >
      <View>
         <Text style={styles.smalltext}>Dashboard</Text>
        <Text style={styles.bigtext}>Name san User ddi</Text>
      </View>

      <View>
        <TouchableOpacity>
          <Text style={{marginLeft:70,width:50,marginTop:40,borderRadius:30,backgroundColor:'grey',textAlign:'center',color:'white',padding:10}} onPress={() => alert('working')}>+</Text>
        </TouchableOpacity>
      </View>
      </View>

    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.card}><Text>Card1</Text></View>
      <View style={styles.card}><Text>Card2</Text></View>
      </View>
      <View style={styles.row}>
        <View style={styles.card}><Text>Car3</Text></View>
      <View style={styles.card}><Text>Card4</Text></View>
      </View>
    </View>

    <View style={styles.g1box} >
      <View style={styles.gbox}><Text style={{textAlign:"center",fontSize:30}}>graph ine</Text></View>
    </View>

    <View style={styles.g1box}>
      <ScrollView style={styles.c1}>
        <View style={styles.c1a}>
          <Text style={styles.Text}>Todays activity</Text>
          <Text style={styles.Text}>latest transaction</Text>

          <View>
            <Text style={styles.Text}>Flatlist ddi para mag render sa listahan</Text>
            <Pressable onPress={() => router.push("/tabs/Inventory")} style={styles.Button}><Text >View all</Text></Pressable>
            </View>
        </View>
      </ScrollView>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card:{
    color:'grey',
    width:170,
    height:200,
    padding:20,
    backgroundColor:"grey",
    borderRadius:20
  },
  grid:{
    gap:20,
    padding:20,
    alignItems:"center"
  },
  row:{
    flexDirection:'row',
    gap:20

  },

  bigtext:{
    fontSize:30,
    paddingLeft:23,
    paddingBottom:30
  },

  smalltext:{
    fontSize:20,
    marginTop:15,
    padding:23,
    paddingBottom:10
  },

  gbox:{
    alignContent:'center',
    backgroundColor:'yellow',
    flex:1,
    height:200,
    borderRadius:40,
    
    
  },

  g1box:{
   alignContent:'center',
   padding:30,
  
  },
  cheader:{
    flexDirection:'row',
    alignItems:'center'
  }
  ,
  c1:{
    backgroundColor:"grey",
    height:400,
    borderRadius:40,
    
  }
  ,
  c1a:{
    justifyContent:'center',
    paddingLeft:40,
    paddingTop:30,
  },
  Text:{
    color:'white',
  },
  Button:{
    backgroundColor:"green",
    textAlign:'center',
    alignItems:'center',
    justifyContent:'center',
    
     width:100,
    height:40,
    color:"white",

    borderRadius:20,
    
  }
});
