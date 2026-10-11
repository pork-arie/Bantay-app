import { Text, View, StyleSheet } from "react-native";

export default function Benta() {
  return (
    <View style={styles.container}>
      <Text>benta</Text>
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
