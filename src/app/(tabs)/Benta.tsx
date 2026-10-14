import { useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInDown, SlideOutDown, ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import BarcodeScanner, { type ScanFeedback } from "@/components/BarcodeScanner";
import BottomSheet from "@/components/BottomSheet";
import { PressableScale } from "@/components/motion";
import ReceiptSheet from "@/components/ReceiptSheet";
import { peso, radius, shadow, type Colors } from "@/constants/theme";
import {
  CATEGORIES,
  saleItem,
  type Category,
  type PaymentMethod,
  type Product,
  type Sale,
  type SellUnit,
} from "@/data/sample";
import { PAYMENT_KEYS, useT } from "@/i18n";
import { success, tap, warning } from "@/store/haptics";
import { balanceOf, formatDate, formatStock, formatTime, isLowStock } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

const PAYMENTS: PaymentMethod[] = ["cash", "gcash", "utang"];
const NEW_CUSTOMER = "new";

type CartLine = { product: Product; unit: SellUnit; qty: number };

function cartKey(productId: string, unit: SellUnit) {
  return `${productId}:${unit}`;
}

export default function Benta() {
  const t = useT();
  const { colors, pay } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { products, debtors, settings, checkout, can } = useStore();
  // Stops a quick double tap on "Complete sale" from recording the sale twice.
  const finishing = useRef(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Lahat");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
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

  const cartLines: CartLine[] = products.flatMap((p) =>
    (["tingi", "pack"] as const)
      .filter((unit) => cart[cartKey(p.id, unit)])
      .map((unit) => ({ product: p, unit, qty: cart[cartKey(p.id, unit)] })),
  );
  const itemCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const total = cartLines.reduce((sum, l) => sum + l.qty * unitPrice(l.product, l.unit), 0);

  const receivedAmount = parseFloat(received) || 0;
  const change = receivedAmount - total;
  const selectedDebtor = debtors.find((d) => d.id === customerId);
  const newBalance = (selectedDebtor ? balanceOf(selectedDebtor) : 0) + total;
  const overLimit = selectedDebtor ? newBalance > selectedDebtor.limit : false;
  const quickCash = [total, 100, 200, 500, 1000].filter(
    (v, i, all) => v >= total && all.indexOf(v) === i,
  );

  function unitPrice(p: Product, unit: SellUnit) {
    return unit === "pack" && p.pack ? p.pack.price : p.price;
  }

  /** Pieces of this product already in the cart, tingi and packs combined. */
  function piecesInCart(p: Product, from = cart) {
    const packs = from[cartKey(p.id, "pack")] ?? 0;
    return (from[cartKey(p.id, "tingi")] ?? 0) + packs * (p.pack?.size ?? 0);
  }

  /** Returns false when there isn't enough stock to add more. */
  function changeQty(product: Product, unit: SellUnit, delta: number) {
    const size = unit === "pack" && product.pack ? product.pack.size : 1;
    if (delta > 0 && piecesInCart(product) + size > product.stock) {
      warning();
      return false;
    }
    tap();
    setCart((prev) => {
      const key = cartKey(product.id, unit);
      const next = Math.max((prev[key] ?? 0) + delta, 0);
      const updated = { ...prev };
      if (next === 0) delete updated[key];
      else updated[key] = next;
      return updated;
    });
    return true;
  }

  function openScanner() {
    setScanFeedback(null);
    setUnknownCode(null);
    setScanning(true);
  }

  /** The scanner stays open, so each scan adds one piece and shows what happened. */
  function onScanned(code: string) {
    const product = products.find((p) => p.barcode === code);
    if (!product) {
      warning();
      setUnknownCode(code);
      setScanFeedback({ text: t("Hindi kilala: {code}", { code }), tone: "warn" });
      return;
    }
    setUnknownCode(null);
    if (!changeQty(product, "tingi", 1)) {
      setScanFeedback({ text: t("Kulang na ang stock ng {name}", { name: product.name }), tone: "warn" });
      return;
    }
    const inCart = (cart[cartKey(product.id, "tingi")] ?? 0) + 1;
    setScanFeedback({ text: `${product.name} ×${inCart} · ${peso(product.price)}`, tone: "ok" });
  }

  function addUnknownToInventory() {
    const code = unknownCode;
    setScanning(false);
    setUnknownCode(null);
    if (code) {
      router.navigate({ pathname: "/(tabs)/Inventory", params: { barcode: code, at: String(Date.now()) } });
    }
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
    if (finishing.current || cartLines.length === 0) return;
    if (payment === "cash" && received !== "" && receivedAmount < total) {
      warning();
      Alert.alert(t("Kulang ang bayad"), t("Kulang pa ng {amount}.", { amount: peso(total - receivedAmount) }));
      return;
    }
    if (payment === "utang" && !customerId) {
      warning();
      Alert.alert(t("Kulang"), t("Pumili o magdagdag ng customer para sa utang."));
      return;
    }
    if (payment === "utang" && customerId === NEW_CUSTOMER && newCustomer.trim() === "") {
      warning();
      Alert.alert(t("Kulang"), t("Ilagay ang pangalan ng bagong customer."));
      return;
    }

    finishing.current = true;
    setTimeout(() => (finishing.current = false), 800);
    const sale = checkout({
      cart: cartLines.map((l) => ({ productId: l.product.id, unit: l.unit, qty: l.qty })),
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

  function renderProduct({ item, index }: { item: Product; index: number }) {
    const tingiQty = cart[cartKey(item.id, "tingi")] ?? 0;
    const packQty = cart[cartKey(item.id, "pack")] ?? 0;
    const remaining = item.stock - piecesInCart(item);
    const outOfStock = item.stock === 0;
    const selected = tingiQty + packQty > 0;

    return (
      <Animated.View
        entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 35)}
        style={[
          styles.product,
          selected && styles.productSelected,
          outOfStock && { opacity: 0.5 },
        ]}
      >
        <PressableScale onPress={() => changeQty(item, "tingi", 1)} disabled={remaining < 1} scaleTo={0.95}>
          {tingiQty > 0 && (
            <Animated.View key={tingiQty} entering={ZoomIn.springify().damping(12)} style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{tingiQty}</Text>
            </Animated.View>
          )}
          <View style={styles.productIcon}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            {peso(item.price)}
            <Text style={styles.productUnit}> /{item.unit}</Text>
          </Text>
          <Text style={[styles.productStock, isLowStock(item) && { color: colors.orange }]}>
            {outOfStock ? t("Ubos na") : t("{stock} natitira", { stock: formatStock(item) })}
          </Text>
        </PressableScale>

        {item.pack && (
          <Pressable
            onPress={() => changeQty(item, "pack", 1)}
            disabled={remaining < item.pack.size}
            style={({ pressed }) => [
              styles.packBtn,
              packQty > 0 && styles.packBtnActive,
              remaining < item.pack!.size && { opacity: 0.4 },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.packText, packQty > 0 && { color: "#fff" }]} numberOfLines={1}>
              {packQty > 0 ? `${packQty}× ` : "+ "}
              {item.pack.name} ({item.pack.size}) · {peso(item.pack.price)}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t("Bagong Benta")}</Text>
          <Pressable
            onPress={() => router.navigate("/transactions")}
            style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}
          >
            <Ionicons name="receipt-outline" size={18} color={colors.text} />
            <Text style={styles.historyText}>{t("Mga transaksyon")}</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("Hanapin ang produkto...")}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
            {search !== "" && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={openScanner}
            style={({ pressed }) => [styles.scanBtn, pressed && styles.pressed]}
            accessibilityLabel={t("I-scan ang barcode")}
          >
            <Ionicons name="barcode-outline" size={22} color="#fff" />
          </Pressable>
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
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(c)}</Text>
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
            <Text style={styles.emptyText}>{t("Walang nahanap na produkto")}</Text>
          </View>
        }
      />

      {/* Cart bar */}
      {itemCount > 0 && (
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={styles.cartBarWrap}>
          <PressableScale onPress={() => setCartOpen(true)} style={styles.cartBar}>
            <Animated.View key={itemCount} entering={ZoomIn.springify()} style={styles.cartBarCount}>
              <Text style={styles.cartBarCountText}>{itemCount}</Text>
            </Animated.View>
            <Text style={styles.cartBarLabel}>{t("Tingnan ang cart")}</Text>
            <Text style={styles.cartBarTotal}>{peso(total)}</Text>
          </PressableScale>
        </Animated.View>
      )}

      {/* Cart & payment */}
      <BottomSheet visible={cartOpen} title={t("Cart")} onClose={() => setCartOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {cartLines.map(({ product, unit, qty }) => {
            const item = saleItem(product, unit, qty);
            const atMax = piecesInCart(product) + item.pieces > product.stock;
            return (
              <View key={cartKey(product.id, unit)} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName}>{product.name}</Text>
                  <Text style={styles.cartSub}>
                    {peso(item.price)} / {item.unitName}
                    {unit === "pack" ? ` (${item.pieces} ${product.unit})` : ""}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => changeQty(product, unit, -1)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </Pressable>
                  <Text style={styles.stepQty}>{qty}</Text>
                  <Pressable
                    onPress={() => changeQty(product, unit, 1)}
                    disabled={atMax}
                    style={[styles.stepBtn, atMax && { opacity: 0.4 }]}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </Pressable>
                </View>
                <Text style={styles.cartLineTotal}>{peso(item.price * qty)}</Text>
              </View>
            );
          })}
          {cartLines.length === 0 && (
            <Text style={[styles.emptyText, { textAlign: "center", marginVertical: 24 }]}>
              {t("Walang laman ang cart")}
            </Text>
          )}

          {/* Payment method */}
          <Text style={styles.label}>{t("Paraan ng bayad")}</Text>
          <View style={styles.payRow}>
            {PAYMENTS.map((p) => {
              const active = payment === p;
              const style = pay[p];
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
                    {t(PAYMENT_KEYS[p])}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {payment === "cash" && (
            <View>
              <Text style={styles.label}>{t("Natanggap na pera")}</Text>
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
                      {v === total ? t("Eksakto") : peso(v)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {received !== "" && (
                <View style={[styles.infoBox, change < 0 && { backgroundColor: colors.redSoft }]}>
                  <Text style={styles.infoLabel}>{change < 0 ? t("Kulang pa") : t("Sukli")}</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: change < 0 ? colors.red : colors.success },
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
                  <Text style={styles.infoLabel}>{t("Ipadala sa GCash number")}</Text>
                  <Text style={[styles.infoValue, { color: colors.gcash }]}>
                    {settings.gcashNumber || t("Wala pa — ilagay sa Settings")}
                  </Text>
                </View>
                <Ionicons name="phone-portrait-outline" size={26} color={colors.gcash} />
              </View>
              <Text style={styles.label}>{t("Reference no. (optional)")}</Text>
              <TextInput
                value={gcashRef}
                onChangeText={setGcashRef}
                placeholder="hal. 1234 567 890123"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Text style={styles.hint}>
                {t("Tingnan muna ang GCash app kung pumasok na ang bayad bago tapusin.")}
              </Text>
            </View>
          )}

          {payment === "utang" && (
            <View>
              <Text style={styles.label}>{t("Customer")}</Text>
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
                    {t("Bago")}
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
                  placeholder={t("Pangalan ng bagong customer")}
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
                    <Text style={styles.infoLabel}>{t("Magiging utang")}</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: overLimit ? colors.red : colors.orange },
                      ]}
                    >
                      {peso(newBalance)}
                    </Text>
                    <Text style={styles.hint}>
                      {t("Limit: {limit}", { limit: peso(selectedDebtor.limit) })}
                    </Text>
                  </View>
                  {overLimit && <Ionicons name="warning" size={26} color={colors.red} />}
                </View>
              )}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("Kabuuan")}</Text>
            <Text style={styles.totalValue}>{peso(total)}</Text>
          </View>

          <Pressable
            onPress={finish}
            disabled={cartLines.length === 0}
            style={({ pressed }) => [
              styles.checkout,
              overLimit && payment === "utang" && { backgroundColor: colors.red },
              cartLines.length === 0 && { opacity: 0.4 },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.checkoutText}>
              {overLimit && payment === "utang"
                ? t("Lampas sa limit — ituloy pa rin")
                : t("Tapusin ang benta")}
            </Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>

      {/* Receipt */}
      <ReceiptSheet
        sale={receipt}
        justSold
        onClose={() => setReceipt(null)}
        primaryLabel={t("Bagong benta")}
        onPrimary={() => setReceipt(null)}
      />

      <BarcodeScanner
        visible={scanning}
        continuous
        onClose={() => setScanning(false)}
        onScanned={onScanned}
        feedback={scanFeedback}
        footer={
          <View style={styles.scanFooter}>
            {unknownCode && can("manageProducts") && (
              <Pressable onPress={addUnknownToInventory} style={styles.scanAddBtn}>
                <Ionicons name="add-circle-outline" size={18} color="#111827" />
                <Text style={styles.scanAddText}>{t("Idagdag sa Inventory")}</Text>
              </Pressable>
            )}
            <View style={styles.scanBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scanBarLabel}>
                  {t("{count} item sa cart", { count: itemCount })}
                </Text>
                <Text style={styles.scanBarTotal}>{peso(total)}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setScanning(false);
                  if (itemCount > 0) setCartOpen(true);
                }}
                style={styles.scanDone}
              >
                <Text style={styles.scanDoneText}>
                  {itemCount > 0 ? t("Tapos — bayaran") : t("Tapos")}
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    historyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    searchRow: {
      flexDirection: "row",
      gap: 10,
    },
    search: {
      flex: 1,
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
    scanBtn: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
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
    productUnit: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
    },
    productStock: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    packBtn: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
    },
    packBtnActive: {
      backgroundColor: colors.primary,
    },
    packText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    qtyBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      zIndex: 1,
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
    cartBarWrap: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 20,
    },
    cartBar: {
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
      gap: 12,
      paddingVertical: 6,
    },
    receiptDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: 4,
      paddingTop: 10,
    },
    receiptItem: {
      flexShrink: 1,
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
    scanFooter: {
      gap: 10,
    },
    scanAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#fff",
      borderRadius: radius.md,
      paddingVertical: 12,
    },
    scanAddText: {
      color: "#111827",
      fontWeight: "700",
    },
    scanBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "rgba(17,24,39,0.92)",
      borderRadius: radius.lg,
      padding: 14,
    },
    scanBarLabel: {
      color: "#9CA3AF",
      fontSize: 12,
    },
    scanBarTotal: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
    },
    scanDone: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    scanDoneText: {
      color: "#fff",
      fontWeight: "700",
    },
    newSaleBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 16,
      alignItems: "center",
    },
  });
