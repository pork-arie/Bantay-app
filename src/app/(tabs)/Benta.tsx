import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, peso, radius, shadow } from "../constants/theme";
import { CATEGORIES, LOW_STOCK_LIMIT, PRODUCTS, type Category, type Product } from "@/data/sample";

type PaymentType = "cash" | "utang";

export default function Benta() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Lahat");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentType>("cash");
  const [customer, setCustomer] = useState("");

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        (category === "Lahat" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q)),
    );
  }, [search, category]);

  const cartItems = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
    product: p,
    qty: cart[p.id],
  }));
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const total = cartItems.reduce((sum, i) => sum + i.qty * i.product.price, 0);

  function changeQty(product: Product, delta: number) {
    setCart((prev) => {
      const next = Math.min(Math.max((prev[product.id] ?? 0) + delta, 0), product.stock);
      const updated = { ...prev };
      if (next === 0) delete updated[product.id];
      else updated[product.id] = next;
      return updated;
    });
  }

  function resetSale() {
    setCart({});
    setCustomer("");
    setPayment("cash");
    setCartOpen(false);
  }

  function checkout() {
    if (payment === "utang" && customer.trim() === "") {
      Alert.alert("Kulang", "Ilagay ang pangalan ng customer para sa utang.");
      return;
    }
    const who = payment === "utang" ? ` kay ${customer.trim()}` : "";
    Alert.alert(
      "Tapos na ang benta",
      `${itemCount} item${itemCount > 1 ? "s" : ""} · ${peso(total)}${
        payment === "utang" ? ` (utang${who})` : " (cash)"
      }`,
    );
    resetSale();
  }

  function renderProduct({ item }: { item: Product }) {
    const qty = cart[item.id] ?? 0;
    const outOfStock = item.stock === 0;
    const lowStock = item.stock <= LOW_STOCK_LIMIT;

    return (
      <Pressable
        onPress={() => changeQty(item, 1)}
        disabled={outOfStock || qty >= item.stock}
        style={({ pressed }) => [
          styles.product,
          qty > 0 && styles.productSelected,
          pressed && styles.pressed,
        ]}
      >
        {qty > 0 && (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>{qty}</Text>
          </View>
        )}
        <View style={styles.productIcon}>
          <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{peso(item.price)}</Text>
        <Text style={[styles.productStock, lowStock && { color: colors.orange }]}>
          {outOfStock ? "Ubos na" : `${item.stock} natitira`}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.top}>
        <Text style={styles.title}>Bagong Benta</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Hanapin ang produkto..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {search !== "" && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Product grid */}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.grid, itemCount > 0 && { paddingBottom: 110 }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>Walang nahanap na produkto</Text>
          </View>
        }
      />

      {/* Cart bar */}
      {itemCount > 0 && (
        <Pressable
          onPress={() => setCartOpen(true)}
          style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}
        >
          <View style={styles.cartBarCount}>
            <Text style={styles.cartBarCountText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartBarLabel}>Tingnan ang cart</Text>
          <Text style={styles.cartBarTotal}>{peso(total)}</Text>
        </Pressable>
      )}

      {/* Cart sheet */}
      <Modal
        visible={cartOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCartOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCartOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Cart</Text>
              <Pressable onPress={() => setCart({})} hitSlop={8}>
                <Text style={styles.clearText}>I-clear</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {cartItems.map(({ product, qty }) => (
                <View key={product.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartName}>{product.name}</Text>
                    <Text style={styles.cartSub}>
                      {peso(product.price)} × {qty}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => changeQty(product, -1)} style={styles.stepBtn}>
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <Pressable
                      onPress={() => changeQty(product, 1)}
                      disabled={qty >= product.stock}
                      style={[styles.stepBtn, qty >= product.stock && { opacity: 0.4 }]}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                  <Text style={styles.cartLineTotal}>{peso(product.price * qty)}</Text>
                </View>
              ))}
              {cartItems.length === 0 && (
                <Text style={[styles.emptyText, { textAlign: "center", marginVertical: 24 }]}>
                  Walang laman ang cart
                </Text>
              )}
            </ScrollView>

            {/* Payment type */}
            <Text style={styles.label}>Paraan ng bayad</Text>
            <View style={styles.segment}>
              {(["cash", "utang"] as const).map((p) => {
                const active = payment === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPayment(p)}
                    style={[styles.segmentBtn, active && styles.segmentActive]}
                  >
                    <Ionicons
                      name={p === "cash" ? "cash-outline" : "time-outline"}
                      size={16}
                      color={active ? "#fff" : colors.muted}
                    />
                    <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                      {p === "cash" ? "Cash" : "Utang"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {payment === "utang" && (
              <TextInput
                value={customer}
                onChangeText={setCustomer}
                placeholder="Pangalan ng customer"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Kabuuan</Text>
              <Text style={styles.totalValue}>{peso(total)}</Text>
            </View>

            <Pressable
              onPress={checkout}
              disabled={cartItems.length === 0}
              style={({ pressed }) => [
                styles.checkout,
                cartItems.length === 0 && { opacity: 0.4 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.checkoutText}>Tapusin ang benta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  top: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  chips: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  chipTextActive: {
    color: "#fff",
  },
  grid: {
    padding: 20,
    gap: 12,
  },
  gridRow: {
    gap: 12,
  },
  product: {
    flex: 1,
    maxWidth: "50%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadow,
  },
  productSelected: {
    borderColor: colors.primary,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 6,
  },
  productStock: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  qtyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  cartBar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadow,
  },
  cartBarCount: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBarCountText: {
    color: "#fff",
    fontWeight: "700",
  },
  cartBarLabel: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cartBarTotal: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  clearText: {
    color: colors.red,
    fontWeight: "600",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cartName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  cartSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  stepQty: {
    minWidth: 20,
    textAlign: "center",
    fontWeight: "700",
    color: colors.text,
  },
  cartLineTotal: {
    width: 80,
    textAlign: "right",
    fontWeight: "700",
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.dark,
  },
  segmentText: {
    fontWeight: "600",
    color: colors.muted,
  },
  input: {
    marginTop: 10,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.muted,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  checkout: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});