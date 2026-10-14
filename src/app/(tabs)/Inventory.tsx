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
import { avatarTints, colors, initials, peso, radius, shadow } from "@/constants/theme";
import { CATEGORIES, type Category, type Product } from "@/data/sample";
import { success } from "@/store/haptics";
import { daysLeft, isLowStock, restockList } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";

type Filter = Category | "Paubos";
type Sheet = { type: "restock"; product: Product } | { type: "add" } | null;

const FILTERS: Filter[] = ["Lahat", "Paubos", ...CATEGORIES.slice(1)];
const PRODUCT_CATEGORIES = CATEGORIES.slice(1) as Product["category"][];

function stockColor(p: Product) {
  if (p.stock === 0) return colors.red;
  if (isLowStock(p)) return colors.orange;
  return colors.primary;
}

function forecastText(days: number | null) {
  if (days === null) return "Walang nabenta nitong nakaraang 7 araw.";
  if (days === 0) return "Mauubos na ngayong araw sa bilis ng benta.";
  return `Tatagal pa ng ~${days} araw sa bilis ng benta ngayon.`;
}

export default function Inventory() {
  const { products, sales, settings, restock, addProduct } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("Lahat");
  const [sheet, setSheet] = useState<Sheet>(null);

  // Restock form
  const [restockQty, setRestockQty] = useState("");
  // Add-product form
  const [form, setForm] = useState({ name: "", price: "", cost: "", stock: "", min: "" });
  const [formCategory, setFormCategory] = useState<Product["category"]>("Inumin");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesFilter =
        filter === "Lahat" ||
        (filter === "Paubos" ? isLowStock(p) : p.category === filter);
      return matchesFilter && (q === "" || p.name.toLowerCase().includes(q));
    });
  }, [products, search, filter]);

  const stockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const lowCount = products.filter(isLowStock).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  function openRestock(product: Product) {
    setRestockQty("");
    setSheet({ type: "restock", product });
  }

  function saveRestock(product: Product) {
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) {
      Alert.alert("Kulang", "Ilagay kung ilan ang idadagdag.");
      return;
    }
    restock(product.id, qty);
    success();
    setSheet(null);
  }

  function openAdd() {
    setForm({ name: "", price: "", cost: "", stock: "", min: "" });
    setFormCategory("Inumin");
    setSheet({ type: "add" });
  }

  function saveProduct() {
    const price = parseFloat(form.price);
    const cost = parseFloat(form.cost);
    const stock = parseInt(form.stock || "0", 10);
    const min = parseInt(form.min || "5", 10);
    if (form.name.trim() === "" || !price || !cost) {
      Alert.alert("Kulang", "Ilagay ang pangalan, presyo at puhunan.");
      return;
    }
    addProduct({ name: form.name.trim(), price, cost, stock, min, category: formCategory });
    success();
    setSheet(null);
  }

  function shareRestockList() {
    const list = restockList(products);
    if (list.length === 0) {
      Alert.alert("Ayos!", "Wala pang kailangang bilhin.");
      return;
    }
    const lines = [
      `🛒 Bibilhin para sa ${settings.storeName || "tindahan"}`,
      "",
      ...list.map(({ product, qty }) => `☐ ${product.name} — ${qty} pcs`),
      "",
      `Tantiyang gastos: ${peso(list.reduce((sum, { product, qty }) => sum + product.cost * qty, 0))}`,
    ];
    Share.share({ message: lines.join("\n") });
  }

  function renderItem({ item }: { item: Product }) {
    const tint = avatarTints[PRODUCT_CATEGORIES.indexOf(item.category) % avatarTints.length];
    const fill = Math.min(item.stock / (item.min * 2), 1);
    const color = stockColor(item);

    return (
      <Pressable
        onPress={() => openRestock(item)}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.fg }]}>{initials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {item.category} · {peso(item.price)}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: color }]} />
          </View>
        </View>
        <View style={{ alignItems: "flex-end", minWidth: 64 }}>
          <Text style={[styles.itemStock, { color }]}>{item.stock}</Text>
          <Text style={styles.itemMeta}>
            {item.stock === 0 ? "Ubos na" : isLowStock(item) ? `min. ${item.min}` : "pcs"}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <View>
              <Text style={styles.title}>Inventory</Text>
              <Text style={styles.subtitle}>{products.length} produkto sa tindahan</Text>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryMain}>
                <Text style={styles.summaryLabel}>Halaga ng paninda</Text>
                <Text style={styles.summaryValue}>{peso(stockValue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <View style={[styles.dot, { backgroundColor: colors.orange }]} />
                  <Text style={styles.summaryPillText}>{lowCount} paubos</Text>
                </View>
                <View style={styles.summaryPill}>
                  <View style={[styles.dot, { backgroundColor: colors.red }]} />
                  <Text style={styles.summaryPillText}>{outCount} ubos</Text>
                </View>
              </View>
              <Pressable
                onPress={shareRestockList}
                style={({ pressed }) => [styles.restockListBtn, pressed && styles.pressed]}
              >
                <Ionicons name="list" size={18} color={colors.dark} />
                <Text style={styles.restockListText}>Listahan ng bibilhin</Text>
                <Ionicons name="share-outline" size={16} color={colors.dark} />
              </Pressable>
            </View>

            {/* Search */}
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
              {FILTERS.map((f) => {
                const active = f === filter;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    {f === "Paubos" && (
                      <Ionicons
                        name="alert-circle"
                        size={14}
                        color={active ? "#fff" : colors.orange}
                      />
                    )}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>Walang nahanap na produkto</Text>
          </View>
        }
      />

      {/* Add product */}
      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        accessibilityLabel="Magdagdag ng produkto"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Restock sheet */}
      <BottomSheet
        visible={sheet?.type === "restock"}
        title={sheet?.type === "restock" ? sheet.product.name : ""}
        onClose={() => setSheet(null)}
      >
        {sheet?.type === "restock" && (
          <View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Stock ngayon</Text>
                <Text style={styles.statValue}>{sheet.product.stock}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Minimum</Text>
                <Text style={styles.statValue}>{sheet.product.min}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Tubo / pc</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {peso(sheet.product.price - sheet.product.cost)}
                </Text>
              </View>
            </View>

            <View style={styles.forecast}>
              <Ionicons name="time-outline" size={16} color={colors.gcash} />
              <Text style={styles.forecastText}>
                {forecastText(daysLeft(sheet.product, sales))}
              </Text>
            </View>

            <Text style={styles.label}>Magdagdag ng stock</Text>
            <View style={styles.quickRow}>
              {[6, 12, 24].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setRestockQty(String(n))}
                  style={[styles.quick, restockQty === String(n) && styles.quickActive]}
                >
                  <Text
                    style={[styles.quickText, restockQty === String(n) && { color: "#fff" }]}
                  >
                    +{n}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={restockQty}
              onChangeText={setRestockQty}
              placeholder="O ilagay ang dami"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.input, { marginTop: 10 }]}
            />
            <Pressable
              onPress={() => saveRestock(sheet.product)}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryBtnText}>I-save ang stock</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      {/* Add-product sheet */}
      <BottomSheet
        visible={sheet?.type === "add"}
        title="Bagong produkto"
        onClose={() => setSheet(null)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Pangalan</Text>
          <TextInput
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="hal. Lucky Me Pancit Canton"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Presyo</Text>
              <TextInput
                value={form.price}
                onChangeText={(price) => setForm({ ...form, price })}
                placeholder="₱0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Puhunan</Text>
              <TextInput
                value={form.cost}
                onChangeText={(cost) => setForm({ ...form, cost })}
                placeholder="₱0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Stock</Text>
              <TextInput
                value={form.stock}
                onChangeText={(stock) => setForm({ ...form, stock })}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Minimum</Text>
              <TextInput
                value={form.min}
                onChangeText={(min) => setForm({ ...form, min })}
                placeholder="5"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <Text style={styles.label}>Kategorya</Text>
          <View style={styles.quickRow}>
            {PRODUCT_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setFormCategory(c)}
                style={[styles.chip, formCategory === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, formCategory === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={saveProduct}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>Idagdag ang produkto</Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  summary: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: 20,
    gap: 14,
  },
  summaryMain: {
    gap: 4,
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryPillText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
    marginTop: 8,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  itemStock: {
    fontSize: 20,
    fontWeight: "700",
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  restockListBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  restockListText: {
    flex: 1,
    fontWeight: "700",
    color: colors.dark,
  },
  forecast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gcashSoft,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  forecastText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quick: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
  },
  quickActive: {
    backgroundColor: colors.primary,
  },
  quickText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
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
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
