import { Text, View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function Index() {
  return (
    <ScrollView>
      <View >
      <Text style={styles.smalltext}>Dashboard</Text>
      <Text style={styles.bigtext}>Name san User ddi</Text>
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
   padding:30
  }
});
