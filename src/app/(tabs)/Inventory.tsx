import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import BarcodeScanner from "@/components/BarcodeScanner";
import BottomSheet from "@/components/BottomSheet";
import OwnerOnly from "@/components/OwnerOnly";
import { FadeIn } from "@/components/motion";
import { avatarTints, initials, peso, radius, shadow, type Colors } from "@/constants/theme";
import { CATEGORIES, type Category, type Product } from "@/data/sample";
import { useT, type TKey } from "@/i18n";
import { confirm } from "@/lib/confirm";
import { lookupBarcode } from "@/lib/productLookup";
import { success } from "@/store/haptics";
import { daysLeft, formatStock, isLowStock, restockList } from "@/store/selectors";
import { useStore } from "@/store/StoreProvider";
import { useTheme } from "@/store/useTheme";

type Filter = Category | "Paubos";
type Sheet =
  | { type: "restock"; productId: string }
  | { type: "add" }
  | { type: "edit"; productId: string }
  | null;
/** What a barcode scan is for: finding a product, linking one, or filling the add form. */
type ScanTarget = "find" | "link" | "add" | null;

const FILTERS: Filter[] = ["Lahat", "Paubos", ...CATEGORIES.slice(1)];
const PRODUCT_CATEGORIES = CATEGORIES.slice(1) as Product["category"][];
const EMPTY_FORM = {
  name: "",
  price: "",
  cost: "",
  stock: "",
  min: "",
  unit: "",
  barcode: "",
  packName: "",
  packSize: "",
  packPrice: "",
  boxSize: "",
  boxCost: "",
};
/** Cost can be typed per piece or for a whole box from the supplier. */
type CostMode = "piece" | "box";

function forecast(days: number | null): { key: TKey; vars?: Record<string, number> } {
  if (days === null) return { key: "Walang nabenta nitong nakaraang 7 araw." };
  if (days === 0) return { key: "Mauubos na ngayong araw sa bilis ng benta." };
  return { key: "Tatagal pa ng ~{days} araw sa bilis ng benta ngayon.", vars: { days } };
}

/** Staff can sell but don't manage stock, so Inventory is owner-only. */
export default function Inventory() {
  const { can } = useStore();
  return can("inventory") ? <InventoryScreen /> : <OwnerOnly />;
}

function InventoryScreen() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { products, sales, settings, ready, restock, addProduct, updateProduct, removeProduct, can } = useStore();
  const canManage = can("manageProducts");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("Lahat");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [scanTarget, setScanTarget] = useState<ScanTarget>(null);

  // Restock form, in pieces
  const [restockQty, setRestockQty] = useState("");
  // Add/edit-product form
  const [form, setForm] = useState(EMPTY_FORM);
  const [formCategory, setFormCategory] = useState<Product["category"]>("Inumin");
  const [hasPack, setHasPack] = useState(false);
  const [costMode, setCostMode] = useState<CostMode>("piece");
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  // Benta sends unknown barcodes here so they can be added right away.
  // `at` makes each hand-off unique, so the same code can be sent twice.
  const params = useLocalSearchParams<{ barcode?: string; at?: string }>();
  const [handledParam, setHandledParam] = useState("");

  useEffect(() => {
    const key = `${params.barcode}:${params.at}`;
    // Wait for saved products to load, so a known barcode isn't treated as new.
    if (ready && params.barcode && key !== handledParam) {
      setHandledParam(key);
      handleNewBarcode(params.barcode);
    }
  }, [ready, params.barcode, params.at]);

  const sheetProduct =
    sheet?.type === "restock" ? products.find((p) => p.id === sheet.productId) : undefined;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesFilter =
        filter === "Lahat" || (filter === "Paubos" ? isLowStock(p) : p.category === filter);
      return matchesFilter && (q === "" || p.name.toLowerCase().includes(q));
    });
  }, [products, search, filter]);

  // What the stock cost you, and what it brings in if every piece sells.
  const stockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const sellValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowCount = products.filter(isLowStock).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  function stockColor(p: Product) {
    if (p.stock === 0) return colors.red;
    if (isLowStock(p)) return colors.orange;
    return colors.success;
  }

  function openRestock(product: Product) {
    setRestockQty("");
    setSheet({ type: "restock", productId: product.id });
  }

  function saveRestock(product: Product) {
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) {
      Alert.alert(t("Kulang"), t("Ilagay kung ilan ang idadagdag."));
      return;
    }
    restock(product.id, qty);
    success();
    setSheet(null);
  }

  function openAdd(barcode = "") {
    setForm({ ...EMPTY_FORM, barcode });
    setFormCategory("Inumin");
    setHasPack(false);
    setCostMode("piece");
    setLookup("idle");
    setSheet({ type: "add" });
    if (barcode) fillFromBarcode(barcode);
  }

  /** Opens the same form as "add", filled in with the product's current details. */
  function openEdit(product: Product) {
    setForm({
      name: product.name,
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      min: String(product.min),
      unit: product.unit,
      barcode: product.barcode ?? "",
      packName: product.pack?.name ?? "",
      packSize: product.pack ? String(product.pack.size) : "",
      packPrice: product.pack ? String(product.pack.price) : "",
      boxSize: "",
      boxCost: "",
    });
    setFormCategory(product.category);
    setHasPack(product.pack !== undefined);
    setCostMode("piece");
    setLookup("idle");
    setSheet({ type: "edit", productId: product.id });
  }

  async function confirmRemove(product: Product) {
    const yes = await confirm(
      t("Burahin ang {name}?", { name: product.name }),
      t("Mawawala ito sa listahan ng produkto. Hindi magbabago ang mga lumang benta."),
      t("Burahin"),
      t("Kanselahin"),
    );
    if (!yes) return;
    removeProduct(product.id);
    setSheet(null);
  }

  /** Fills in the name (and category when it can tell) from the online product database. */
  async function fillFromBarcode(code: string) {
    setLookup("loading");
    const result = await lookupBarcode(code);
    setLookup(result ? "found" : "notfound");
    if (!result) return;
    // Don't overwrite anything the user already typed, or a newer scan.
    setForm((f) => (f.barcode === code && f.name === "" ? { ...f, name: result.name } : f));
    if (result.category) setFormCategory(result.category);
  }

  /** A scanned code: open the product if we know it, otherwise start adding it. */
  function handleNewBarcode(code: string) {
    const found = products.find((p) => p.barcode === code);
    if (found) openRestock(found);
    else if (canManage) openAdd(code);
    else Alert.alert(t("Para sa owner lang"), t("Ang may-ari lang ang makakapagdagdag ng bagong produkto."));
  }

  // Live numbers for the form.
  const unitName = form.unit.trim() || "pc";
  const formPrice = parseFloat(form.price) || 0;
  const boxSize = parseInt(form.boxSize, 10) || 0;
  const formCost =
    costMode === "box"
      ? boxSize > 0
        ? // Keep extra decimals so 6 × ₱83.3333 adds back up to the ₱500 box.
          Math.round(((parseFloat(form.boxCost) || 0) / boxSize) * 10000) / 10000
        : 0
      : parseFloat(form.cost) || 0;
  const formPackSize = parseInt(form.packSize, 10) || 0;
  const formPackPrice = parseFloat(form.packPrice) || 0;

  function saveProduct() {
    const price = formPrice;
    const cost = formCost;
    const packSize = formPackSize;
    const packPrice = formPackPrice;
    if (form.name.trim() === "" || !price || !cost) {
      Alert.alert(t("Kulang"), t("Ilagay ang pangalan, presyo at puhunan."));
      return;
    }
    if (hasPack && (!packSize || packSize < 2 || !packPrice)) {
      Alert.alert(t("Kulang"), t("Ilagay ang laman at presyo ng pack."));
      return;
    }
    const editingId = sheet?.type === "edit" ? sheet.productId : undefined;
    const barcode = form.barcode.trim();
    const sameBarcode = barcode ? products.find((p) => p.barcode === barcode && p.id !== editingId) : undefined;
    if (sameBarcode) {
      Alert.alert(t("Nasa listahan na"), t("Naka-link na ang barcode na ito sa {name}.", { name: sameBarcode.name }));
      return;
    }
    const details = {
      name: form.name.trim(),
      price,
      cost,
      stock: parseInt(form.stock || "0", 10),
      min: parseInt(form.min || "5", 10),
      unit: form.unit.trim() || "pc",
      barcode: barcode || undefined,
      pack: hasPack
        ? { name: form.packName.trim() || "pack", size: packSize, price: packPrice }
        : undefined,
      category: formCategory,
    };
    if (editingId) updateProduct(editingId, details);
    else addProduct(details);
    success();
    // After editing, go back to the product's sheet so the changes are visible.
    setSheet(editingId ? { type: "restock", productId: editingId } : null);
  }

  function onScanned(code: string) {
    const target = scanTarget;
    setScanTarget(null);
    if (target === "add") {
      const existing = products.find((p) => p.barcode === code);
      if (existing) {
        Alert.alert(t("Nasa listahan na"), t("Naka-link na ang barcode na ito sa {name}.", { name: existing.name }));
        openRestock(existing);
        return;
      }
      setForm((f) => ({ ...f, barcode: code }));
      fillFromBarcode(code);
      return;
    }
    if (target === "link" && sheetProduct) {
      updateProduct(sheetProduct.id, { barcode: code });
      success();
      return;
    }
    handleNewBarcode(code);
  }

  function shareRestockList() {
    const list = restockList(products);
    if (list.length === 0) {
      Alert.alert(t("Ayos!"), t("Wala pang kailangang bilhin."));
      return;
    }
    const lines = [
      t("🛒 Bibilhin para sa {store}", { store: settings.storeName || t("tindahan") }),
      "",
      ...list.map(({ product, label }) => `☐ ${product.name} — ${label}`),
      "",
      t("Tantiyang gastos: {amount}", {
        amount: peso(list.reduce((sum, { product, pieces }) => sum + product.cost * pieces, 0)),
      }),
    ];
    Share.share({ message: lines.join("\n") });
  }

  function renderItem({ item, index }: { item: Product; index: number }) {
    const tint = avatarTints[PRODUCT_CATEGORIES.indexOf(item.category) % avatarTints.length];
    const fill = Math.min(item.stock / (item.min * 2), 1);
    const color = stockColor(item);

    return (
      <FadeIn index={index}>
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
              {t(item.category)} · {peso(item.price)}/{item.unit}
              {item.pack ? ` · ${peso(item.pack.price)}/${item.pack.name}` : ""}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: color }]} />
            </View>
          </View>
          <View style={{ alignItems: "flex-end", minWidth: 64 }}>
            <Text style={[styles.itemStock, { color }]}>{item.stock}</Text>
            <Text style={styles.itemMeta}>
              {item.stock === 0
                ? t("Ubos na")
                : isLowStock(item)
                  ? t("min. {min}", { min: item.min })
                  : item.unit}
            </Text>
          </View>
        </Pressable>
      </FadeIn>
    );
  }

  const tip = sheetProduct ? forecast(daysLeft(sheetProduct, sales)) : null;
  const quickRestock = sheetProduct?.pack
    ? [1, 2, 5].map((n) => ({
        pieces: n * sheetProduct.pack!.size,
        label: `+${n} ${sheetProduct.pack!.name}`,
      }))
    : [6, 12, 24].map((n) => ({ pieces: n, label: `+${n}` }));

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
              <Text style={styles.title}>{t("Inventory")}</Text>
              <Text style={styles.subtitle}>
                {t("{count} produkto sa tindahan", { count: products.length })}
              </Text>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryMain}>
                <Text style={styles.summaryLabel}>{t("Puhunan sa stock")}</Text>
                <Text style={styles.summaryValue}>{peso(stockValue)}</Text>
                <Text style={styles.summaryLabel}>
                  {t("Kung maubos lahat: {sales} · tubo {profit}", {
                    sales: peso(sellValue),
                    profit: peso(sellValue - stockValue),
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <View style={[styles.dot, { backgroundColor: colors.orange }]} />
                  <Text style={styles.summaryPillText}>{t("{count} paubos", { count: lowCount })}</Text>
                </View>
                <View style={styles.summaryPill}>
                  <View style={[styles.dot, { backgroundColor: colors.red }]} />
                  <Text style={styles.summaryPillText}>{t("{count} ubos", { count: outCount })}</Text>
                </View>
              </View>
              <Pressable
                onPress={shareRestockList}
                style={({ pressed }) => [styles.restockListBtn, pressed && styles.pressed]}
              >
                <Ionicons name="list" size={18} color="#111827" />
                <Text style={styles.restockListText}>{t("Listahan ng bibilhin")}</Text>
                <Ionicons name="share-outline" size={16} color="#111827" />
              </Pressable>
            </View>

            {/* Search */}
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
                onPress={() => setScanTarget("find")}
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
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(f)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>{t("Walang nahanap na produkto")}</Text>
          </View>
        }
      />

      {/* Add product */}
      {canManage && (
        <Pressable
          onPress={() => openAdd()}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          accessibilityLabel={t("Magdagdag ng produkto")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

      {/* Restock sheet */}
      <BottomSheet
        visible={sheetProduct !== undefined}
        title={sheetProduct?.name ?? ""}
        onClose={() => setSheet(null)}
      >
        {sheetProduct && tip && (
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t("Stock ngayon")}</Text>
                <Text style={styles.statValue} numberOfLines={2}>
                  {formatStock(sheetProduct)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t("Minimum")}</Text>
                <Text style={styles.statValue}>
                  {sheetProduct.min} {sheetProduct.unit}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t("Tubo / {unit}", { unit: sheetProduct.unit })}</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {peso(sheetProduct.price - sheetProduct.cost)}
                </Text>
              </View>
            </View>

            <View style={styles.forecast}>
              <Ionicons name="time-outline" size={16} color={colors.gcash} />
              <Text style={styles.forecastText}>{t(tip.key, tip.vars)}</Text>
            </View>

            {sheetProduct.pack && (
              <View style={styles.packInfo}>
                <Ionicons name="layers-outline" size={16} color={colors.muted} />
                <Text style={styles.forecastText}>
                  {t("1 {pack} = {size} {unit} · {price}", {
                    pack: sheetProduct.pack.name,
                    size: sheetProduct.pack.size,
                    unit: sheetProduct.unit,
                    price: peso(sheetProduct.pack.price),
                  })}
                </Text>
              </View>
            )}

            {canManage && (
              <View style={styles.editRow}>
                <Pressable
                  onPress={() => openEdit(sheetProduct)}
                  style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                  <Text style={styles.editBtnText}>{t("I-edit ang produkto")}</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => canManage && setScanTarget("link")}
              disabled={!canManage}
              style={styles.barcodeRow}
            >
              <Ionicons name="barcode-outline" size={20} color={colors.text} />
              <Text style={styles.barcodeText}>
                {sheetProduct.barcode ?? t("Walang barcode")}
              </Text>
              <Text style={styles.barcodeAction}>
                {sheetProduct.barcode ? t("Palitan") : t("I-scan")}
              </Text>
            </Pressable>

            <Text style={styles.label}>{t("Magdagdag ng stock")}</Text>
            <View style={styles.quickRow}>
              {quickRestock.map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() => setRestockQty(String(q.pieces))}
                  style={[styles.quick, restockQty === String(q.pieces) && styles.quickActive]}
                >
                  <Text
                    style={[styles.quickText, restockQty === String(q.pieces) && { color: "#fff" }]}
                  >
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={restockQty}
              onChangeText={setRestockQty}
              placeholder={t("O ilagay ang dami ({unit})", { unit: sheetProduct.unit })}
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.input, { marginTop: 10 }]}
            />
            <Pressable
              onPress={() => saveRestock(sheetProduct)}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryBtnText}>{t("I-save ang stock")}</Text>
            </Pressable>
          </ScrollView>
        )}
      </BottomSheet>

      {/* Add / edit product sheet */}
      <BottomSheet
        visible={sheet?.type === "add" || sheet?.type === "edit"}
        title={sheet?.type === "edit" ? t("I-edit ang produkto") : t("Bagong produkto")}
        onClose={() => setSheet(sheet?.type === "edit" ? { type: "restock", productId: sheet.productId } : null)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t("Barcode (optional)")}</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={form.barcode}
              onChangeText={(barcode) => setForm({ ...form, barcode })}
              onEndEditing={() => {
                if (sheet?.type === "add" && form.barcode.trim() && form.name === "") fillFromBarcode(form.barcode.trim());
              }}
              placeholder="4800000000000"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.input, { flex: 1 }]}
            />
            <Pressable onPress={() => setScanTarget("add")} style={styles.scanBtn}>
              <Ionicons name="barcode-outline" size={22} color="#fff" />
            </Pressable>
          </View>
          {lookup !== "idle" && (
            <View style={styles.lookupRow}>
              {lookup === "loading" ? (
                <ActivityIndicator size="small" color={colors.gcash} />
              ) : (
                <Ionicons
                  name={lookup === "found" ? "checkmark-circle" : "information-circle-outline"}
                  size={16}
                  color={lookup === "found" ? colors.success : colors.muted}
                />
              )}
              <Text style={styles.lookupText}>
                {lookup === "loading"
                  ? t("Hinahanap ang produkto online...")
                  : lookup === "found"
                    ? t("Nakita! Pakitingnan ang pangalan at ilagay ang presyo.")
                    : t("Hindi nakita online. I-type ang detalye.")}
              </Text>
            </View>
          )}

          <Text style={styles.label}>{t("Pangalan")}</Text>
          <TextInput
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder={t("hal. Lucky Me Pancit Canton")}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          {/* Step 1: what one piece is called */}
          <Text style={styles.label}>{t("Tawag sa isang piraso")}</Text>
          <TextInput
            value={form.unit}
            onChangeText={(unit) => setForm({ ...form, unit })}
            placeholder={t("hal. pc, bote, sachet, lata")}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          {/* Step 2: selling price of one piece */}
          <Text style={styles.label}>{t("Presyo ng benta (isang {unit})", { unit: unitName })}</Text>
          <TextInput
            value={form.price}
            onChangeText={(price) => setForm({ ...form, price })}
            placeholder="₱0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text style={styles.hint}>{t("Magkano mo ibinebenta sa customer ang isa.")}</Text>

          {/* Step 3: cost, per piece or per box */}
          <Text style={styles.label}>{t("Puhunan (bili mo sa supplier)")}</Text>
          <View style={styles.quickRow}>
            {(["piece", "box"] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setCostMode(mode)}
                style={[styles.chip, costMode === mode && styles.chipActive]}
              >
                <Text style={[styles.chipText, costMode === mode && styles.chipTextActive]}>
                  {mode === "piece" ? t("Kada {unit}", { unit: unitName }) : t("Kada kahon/pack")}
                </Text>
              </Pressable>
            ))}
          </View>
          {costMode === "piece" ? (
            <TextInput
              value={form.cost}
              onChangeText={(cost) => setForm({ ...form, cost })}
              placeholder={t("Puhunan sa isang {unit}", { unit: unitName })}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              style={[styles.input, { marginTop: 10 }]}
            />
          ) : (
            <View style={[styles.formRow, { marginTop: 2 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t("Ilang {unit} sa isang kahon?", { unit: unitName })}</Text>
                <TextInput
                  value={form.boxSize}
                  onChangeText={(boxSize) => setForm({ ...form, boxSize })}
                  placeholder="12"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t("Bili sa isang kahon")}</Text>
                <TextInput
                  value={form.boxCost}
                  onChangeText={(boxCost) => setForm({ ...form, boxCost })}
                  placeholder="₱0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            </View>
          )}

          {/* Live result so mistakes show right away */}
          {formPrice > formCost && formCost > 0 && (
            <View style={styles.calcBox}>
              {costMode === "box" && (
                <Text style={styles.calcText}>
                  {t("Puhunan: {cost} kada {unit}", { cost: peso(formCost), unit: unitName })}
                </Text>
              )}
              <Text style={styles.calcMain}>
                {t("Tubo: {amount} kada {unit}", { amount: peso(formPrice - formCost), unit: unitName })}
              </Text>
            </View>
          )}

          {/* Step 4: optional pack selling */}
          <Pressable
            onPress={() => {
              // Reuse the box size as the pack size if it was already typed.
              if (!hasPack && form.packSize === "" && boxSize > 0) setForm({ ...form, packSize: String(boxSize) });
              setHasPack(!hasPack);
            }}
            style={[styles.toggleRow, hasPack && styles.toggleRowActive]}
          >
            <Ionicons
              name={hasPack ? "checkbox" : "square-outline"}
              size={22}
              color={hasPack ? colors.primary : colors.muted}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>{t("Binebenta mo rin ba nang buo?")}</Text>
              <Text style={styles.itemMeta}>
                {t("Pack, tali o kahon, hal. 1 tali = 10 sachet sa ₱95")}
              </Text>
            </View>
          </Pressable>
          {hasPack && (
            <>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t("Tawag")}</Text>
                  <TextInput
                    value={form.packName}
                    onChangeText={(packName) => setForm({ ...form, packName })}
                    placeholder={t("tali, pack, kahon")}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t("Ilang {unit}?", { unit: unitName })}</Text>
                  <TextInput
                    value={form.packSize}
                    onChangeText={(packSize) => setForm({ ...form, packSize })}
                    placeholder="10"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t("Presyo")}</Text>
                  <TextInput
                    value={form.packPrice}
                    onChangeText={(packPrice) => setForm({ ...form, packPrice })}
                    placeholder="₱0.00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
              </View>
              {formPackSize > 0 && formCost > 0 && formPackPrice > formCost * formPackSize && (
                <Text style={[styles.hint, { color: colors.success }]}>
                  {t("Tubo: {amount} kada {pack}", {
                    amount: peso(formPackPrice - formCost * formPackSize),
                    pack: form.packName.trim() || "pack",
                  })}
                </Text>
              )}
            </>
          )}

          {/* Step 5: stock */}
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t("Stock ngayon (ilang {unit})", { unit: unitName })}</Text>
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
              <Text style={styles.label}>{t("Paalala kapag bumaba sa")}</Text>
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

          <Text style={styles.label}>{t("Kategorya")}</Text>
          <View style={styles.quickRow}>
            {PRODUCT_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setFormCategory(c)}
                style={[styles.chip, formCategory === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, formCategory === c && styles.chipTextActive]}>
                  {t(c)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={saveProduct}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryBtnText}>
              {sheet?.type === "edit" ? t("I-save ang pagbabago") : t("Idagdag ang produkto")}
            </Text>
          </Pressable>
          {sheet?.type === "edit" && (
            <Pressable
              onPress={() => {
                const product = products.find((p) => p.id === sheet.productId);
                if (product) confirmRemove(product);
              }}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.red} />
              <Text style={styles.removeBtnText}>{t("Burahin ang produkto")}</Text>
            </Pressable>
          )}
        </ScrollView>
      </BottomSheet>

      <BarcodeScanner
        visible={scanTarget !== null}
        onClose={() => setScanTarget(null)}
        onScanned={onScanned}
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
      color: "#111827",
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
    packInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: 12,
      marginTop: 8,
    },
    editRow: {
      flexDirection: "row",
      marginTop: 8,
    },
    editBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
    },
    editBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    removeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      marginTop: 8,
    },
    removeBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.red,
    },
    barcodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 12,
      marginTop: 8,
    },
    barcodeText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    barcodeAction: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
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
      fontSize: 16,
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
      fontSize: 14,
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
    lookupRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    lookupText: {
      flex: 1,
      fontSize: 12,
      color: colors.muted,
    },
    formRow: {
      flexDirection: "row",
      gap: 10,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 16,
      padding: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: colors.background,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
    },
    calcBox: {
      backgroundColor: colors.successSoft,
      borderRadius: radius.md,
      padding: 12,
      marginTop: 12,
      gap: 2,
    },
    calcText: {
      fontSize: 13,
      color: colors.text,
    },
    calcMain: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.success,
    },
    toggleRowActive: {
      borderColor: colors.primary,
    },
    toggleTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
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
