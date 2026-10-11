import { Text, View, StyleSheet } from "react-native";

export default function Utang() {
  return (
    <View style={styles.container}>
      <Text>Utang</Text>
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
