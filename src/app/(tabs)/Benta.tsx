import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "@/components/BottomSheet";
import { colors, paymentStyles, peso, radius, shadow } from "@/constants/theme";
import {
  CATEGORIES,
  PAYMENT_LABELS,
  type Category,
  type PaymentMethod,
  type Product,
  type Sale,
} from "@/data/sample";
import { success, tap, warning } from "@/store/haptics";
import { balanceOf, formatDate, formatTime, isLowStock } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";

const PAYMENTS: PaymentMethod[] = ["cash", "gcash", "utang"];
const NEW_CUSTOMER = "new";

export default function Benta() {
  const { products, debtors, settings, checkout } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Lahat");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("");
  const [gcashRef, setGcashRef] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "Lahat" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q)),
    );
  }, [products, search, category]);

  const cartItems = products
    .filter((p) => cart[p.id])
    .map((p) => ({ product: p, qty: cart[p.id] }));
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const total = cartItems.reduce((sum, i) => sum + i.qty * i.product.price, 0);

  const receivedAmount = parseFloat(received) || 0;
  const change = receivedAmount - total;
  const selectedDebtor = debtors.find((d) => d.id === customerId);
  const newBalance = (selectedDebtor ? balanceOf(selectedDebtor) : 0) + total;
  const overLimit = selectedDebtor ? newBalance > selectedDebtor.limit : false;
  const quickCash = [total, 100, 200, 500, 1000].filter(
    (v, i, all) => v >= total && all.indexOf(v) === i,
  );

  function changeQty(product: Product, delta: number) {
    tap();
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
    setPayment("cash");
    setReceived("");
    setGcashRef("");
    setCustomerId(null);
    setNewCustomer("");
  }

  function finish() {
    if (payment === "cash" && received !== "" && receivedAmount < total) {
      warning();
      Alert.alert("Kulang ang bayad", `Kulang pa ng ${peso(total - receivedAmount)}.`);
      return;
    }
    if (payment === "utang" && !customerId) {
      warning();
      Alert.alert("Kulang", "Pumili o magdagdag ng customer para sa utang.");
      return;
    }
    if (payment === "utang" && customerId === NEW_CUSTOMER && newCustomer.trim() === "") {
      warning();
      Alert.alert("Kulang", "Ilagay ang pangalan ng bagong customer.");
      return;
    }

    const sale = checkout({
      cart: cartItems.map((i) => ({ productId: i.product.id, qty: i.qty })),
      payment,
      customerId: customerId && customerId !== NEW_CUSTOMER ? customerId : undefined,
      newCustomerName: customerId === NEW_CUSTOMER ? newCustomer.trim() : undefined,
      gcashRef: payment === "gcash" ? gcashRef.trim() || undefined : undefined,
      cashReceived: payment === "cash" && received !== "" ? receivedAmount : undefined,
    });
    success();
    setCartOpen(false);
    resetSale();
    setReceipt(sale);
  }

  function shareReceipt(sale: Sale) {
    const lines = [
      settings.storeName || "Bantay Store",
      `${formatDate(sale.date)} · ${formatTime(sale.date)}`,
      "------------------------",
      ...sale.items.map((it) => `${it.qty} x ${it.name}  ${peso(it.price * it.qty)}`),
      "------------------------",
      `TOTAL: ${peso(sale.total)}`,
      `Bayad: ${PAYMENT_LABELS[sale.payment]}`,
      ...(sale.cashReceived !== undefined
        ? [`Natanggap: ${peso(sale.cashReceived)}`, `Sukli: ${peso(sale.cashReceived - sale.total)}`]
        : []),
      ...(sale.gcashRef ? [`GCash Ref: ${sale.gcashRef}`] : []),
      ...(sale.customerName ? [`Customer: ${sale.customerName}`] : []),
      "",
      "Salamat po! 🙏",
    ];
    Share.share({ message: lines.join("\n") });
  }

  function renderProduct({ item }: { item: Product }) {
    const qty = cart[item.id] ?? 0;
    const outOfStock = item.stock === 0;

    return (
      <Pressable
        onPress={() => changeQty(item, 1)}
        disabled={outOfStock || qty >= item.stock}
        style={({ pressed }) => [
          styles.product,
          qty > 0 && styles.productSelected,
          outOfStock && { opacity: 0.5 },
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
        <Text style={[styles.productStock, isLowStock(item) && { color: colors.orange }]}>
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
        data={visibleProducts}
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

      {/* Cart & payment */}
      <BottomSheet visible={cartOpen} title="Cart" onClose={() => setCartOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
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

          {/* Payment method */}
          <Text style={styles.label}>Paraan ng bayad</Text>
          <View style={styles.payRow}>
            {PAYMENTS.map((p) => {
              const active = payment === p;
              const style = paymentStyles[p];
              return (
                <Pressable
                  key={p}
                  onPress={() => setPayment(p)}
                  style={[
                    styles.payBtn,
                    active && { backgroundColor: style.fg, borderColor: style.fg },
                  ]}
                >
                  <Ionicons name={style.icon} size={18} color={active ? "#fff" : style.fg} />
                  <Text style={[styles.payText, { color: active ? "#fff" : colors.text }]}>
                    {PAYMENT_LABELS[p]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {payment === "cash" && (
            <View>
              <Text style={styles.label}>Natanggap na pera</Text>
              <TextInput
                value={received}
                onChangeText={setReceived}
                placeholder={peso(total)}
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chips, { marginTop: 10 }]}
              >
                {quickCash.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setReceived(String(v))}
                    style={[styles.chip, receivedAmount === v && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, receivedAmount === v && styles.chipTextActive]}
                    >
                      {v === total ? "Eksakto" : peso(v)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {received !== "" && (
                <View style={[styles.infoBox, change < 0 && { backgroundColor: colors.redSoft }]}>
                  <Text style={styles.infoLabel}>{change < 0 ? "Kulang pa" : "Sukli"}</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: change < 0 ? colors.red : colors.primary },
                    ]}
                  >
                    {peso(Math.abs(change))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {payment === "gcash" && (
            <View>
              <View style={[styles.infoBox, { backgroundColor: colors.gcashSoft }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Ipadala sa GCash number</Text>
                  <Text style={[styles.infoValue, { color: colors.gcash }]}>
                    {settings.gcashNumber || "Wala pa — ilagay sa Settings"}
                  </Text>
                </View>
                <Ionicons name="phone-portrait-outline" size={26} color={colors.gcash} />
              </View>
              <Text style={styles.label}>Reference no. (optional)</Text>
              <TextInput
                value={gcashRef}
                onChangeText={setGcashRef}
                placeholder="hal. 1234 567 890123"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.hint}>
                Tingnan muna ang GCash app kung pumasok na ang bayad bago tapusin.
              </Text>
            </View>
          )}

          {payment === "utang" && (
            <View>
              <Text style={styles.label}>Customer</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <Pressable
                  onPress={() => setCustomerId(NEW_CUSTOMER)}
                  style={[styles.chip, customerId === NEW_CUSTOMER && styles.chipActive]}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={customerId === NEW_CUSTOMER ? "#fff" : colors.muted}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      customerId === NEW_CUSTOMER && styles.chipTextActive,
                    ]}
                  >
                    Bago
                  </Text>
                </Pressable>
                {debtors.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => setCustomerId(d.id)}
                    style={[styles.chip, customerId === d.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, customerId === d.id && styles.chipTextActive]}>
                      {d.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {customerId === NEW_CUSTOMER && (
                <TextInput
                  value={newCustomer}
                  onChangeText={setNewCustomer}
                  placeholder="Pangalan ng bagong customer"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { marginTop: 10 }]}
                />
              )}

              {selectedDebtor && (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: overLimit ? colors.redSoft : colors.orangeSoft },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Magiging utang</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: overLimit ? colors.red : colors.orange },
                      ]}
                    >
                      {peso(newBalance)}
                    </Text>
                    <Text style={styles.hint}>Limit: {peso(selectedDebtor.limit)}</Text>
                  </View>
                  {overLimit && <Ionicons name="warning" size={26} color={colors.red} />}
                </View>
              )}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Kabuuan</Text>
            <Text style={styles.totalValue}>{peso(total)}</Text>
          </View>

          <Pressable
            onPress={finish}
            disabled={cartItems.length === 0}
            style={({ pressed }) => [
              styles.checkout,
              overLimit && payment === "utang" && { backgroundColor: colors.red },
              cartItems.length === 0 && { opacity: 0.4 },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.checkoutText}>
              {overLimit && payment === "utang"
                ? "Lampas sa limit — ituloy pa rin"
                : "Tapusin ang benta"}
            </Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>

      {/* Receipt */}
      <BottomSheet visible={receipt !== null} title="Resibo" onClose={() => setReceipt(null)}>
        {receipt && (
          <View>
            <View style={styles.receiptCheck}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              <Text style={styles.receiptTotal}>{peso(receipt.total)}</Text>
              <Text style={styles.cartSub}>
                {PAYMENT_LABELS[receipt.payment]} · {formatTime(receipt.date)}
              </Text>
            </View>
            {receipt.items.map((it) => (
              <View key={it.productId} style={styles.receiptRow}>
                <Text style={styles.receiptItem}>
                  {it.qty} × {it.name}
                </Text>
                <Text style={styles.receiptItem}>{peso(it.price * it.qty)}</Text>
              </View>
            ))}
            {receipt.cashReceived !== undefined && (
              <View style={[styles.receiptRow, styles.receiptDivider]}>
                <Text style={styles.receiptStrong}>Sukli</Text>
                <Text style={[styles.receiptStrong, { color: colors.primary }]}>
                  {peso(receipt.cashReceived - receipt.total)}
                </Text>
              </View>
            )}
            {receipt.gcashRef && (
              <View style={[styles.receiptRow, styles.receiptDivider]}>
                <Text style={styles.receiptItem}>GCash Ref</Text>
                <Text style={styles.receiptItem}>{receipt.gcashRef}</Text>
              </View>
            )}
            {receipt.customerName && (
              <View style={[styles.receiptRow, styles.receiptDivider]}>
                <Text style={styles.receiptItem}>Inilista kay</Text>
                <Text style={styles.receiptStrong}>{receipt.customerName}</Text>
              </View>
            )}
            <View style={styles.receiptButtons}>
              <Pressable onPress={() => shareReceipt(receipt)} style={styles.secondaryBtn}>
                <Ionicons name="share-outline" size={18} color={colors.text} />
                <Text style={styles.secondaryText}>I-share</Text>
              </Pressable>
              <Pressable onPress={() => setReceipt(null)} style={styles.newSaleBtn}>
                <Text style={styles.checkoutText}>Bagong benta</Text>
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheet>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  payRow: {
    flexDirection: "row",
    gap: 8,
  },
  payBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  payText: {
    fontWeight: "700",
    fontSize: 13,
  },
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
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
  receiptCheck: {
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  receiptTotal: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  receiptDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  receiptItem: {
    fontSize: 14,
    color: colors.text,
  },
  receiptStrong: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  receiptButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingVertical: 16,
  },
  secondaryText: {
    fontWeight: "700",
    color: colors.text,
  },
  newSaleBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
});
