import { Text, View, StyleSheet } from "react-native";

export default function Inventory() {
  return (
    <View style={styles.container}>
      <Text>inventory</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
