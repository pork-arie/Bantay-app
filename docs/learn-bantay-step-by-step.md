# Build Bantay yourself: a day-by-day plan

You already know `View` and `style`. This plan takes you from there to the full Bantay app in **42 days**
(6 weeks), about **1–2 hours a day**. You will build a practice copy called `bantay-practice`,
one small piece per day, and look at the real Bantay code when you get stuck.

## How to use this plan

- **Do one day at a time.** If a day takes two days, that's fine. Don't skip the review days (7, 14, 21, 28, 35, 42).
- **Type the code yourself.** Don't copy-paste. Typing is how it sticks.
- **Every day ends with a commit**, which gives you a green square on GitHub:
  ```bash
  git add .
  git commit -m "Day 5: product list with FlatList"
  git push
  ```
- **When stuck:** read the error from the top, check the Bantay file listed under "Look at", then search the
  [Expo docs](https://docs.expo.dev). Expo changes every version, so read the docs for **your** SDK version
  (it's in `package.json` next to `"expo"`).
- **The real app** is in this repo. Each day lists the files to compare with.

### Daily routine

1. Read the day's **Goal** and **Learn** (10 min).
2. Build the **Do** part (45–90 min).
3. Run the **Check** (5 min).
4. Commit and push (2 min).
5. Write one line in a notes file: what was hard today?

---

## Week 1: React Native basics

### Day 1: Set up and run your first app
**Goal:** a new Expo app running on your phone.
**Learn:** Node.js, VS Code, Git, Expo Go, what `npx` does.
**Do:**
1. Install [Node.js LTS](https://nodejs.org), [VS Code](https://code.visualstudio.com), [Git](https://git-scm.com), and **Expo Go** on your phone.
2. Create the app and run it:
   ```bash
   npx create-expo-app@latest bantay-practice
   cd bantay-practice
   npx expo start
   ```
3. Scan the QR code with Expo Go. Change the text on the first screen and watch it update.
4. Make a new GitHub repo `bantay-practice` and push to it.

**Check:** the app opens on your phone and changes show when you save.
**Commit:** `Day 1: new Expo app`

### Day 2: Layout with flexbox
**Goal:** a "stat card" like the Dashboard's.
**Learn:** `flexDirection`, `justifyContent`, `alignItems`, `gap`, `padding`, `borderRadius`, `StyleSheet.create`.
**Do:** build this card, then make two cards side by side with `flexDirection: "row"` and `gap: 12`.
```tsx
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.value}>₱454.00</Text>
        <Text style={styles.label}>Sales today</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: "#F4F6F5" },
  card: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: "#fff", gap: 4 },
  value: { fontSize: 22, fontWeight: "700" },
  label: { color: "#6B7280" },
});
```
**Check:** two cards fill the width evenly.
**Look at:** `src/app/(tabs)/index.tsx` (the `StatCard` part and `styles`).

### Day 3: Components and props
**Goal:** one `StatCard` component used 4 times.
**Learn:** a component is a function that returns UI. Props are its inputs.
**Do:**
```tsx
type StatCardProps = { label: string; value: string };

function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
// use it: <StatCard label="Sales today" value="₱454.00" />
```
Make a 2×2 grid: Sales today, Transactions, Low stock, Total utang.
**Check:** changing a prop changes only that card.

### Day 4: State and buttons
**Goal:** a − / + quantity stepper (like the cart).
**Learn:** `useState`, `Pressable`, why the screen re-renders when state changes.
**Do:**
```tsx
const [qty, setQty] = useState(0);
// ...
<Pressable onPress={() => setQty(qty + 1)}><Text>+</Text></Pressable>
<Text>{qty}</Text>
<Pressable onPress={() => setQty(Math.max(qty - 1, 0))}><Text>−</Text></Pressable>
```
Add a price and show the total: `₱{(qty * 20).toFixed(2)}`.
**Check:** the count never goes below 0.

### Day 5: Lists of data
**Goal:** a product list from an array.
**Learn:** arrays of objects, `.map`, `FlatList`, the `key`/`keyExtractor`.
**Do:** make `const products = [{ id: "1", name: "Coke 290ml", price: 20, stock: 24 }, ...]` with 6 items and
show them with `FlatList`. Each row: name, price, and stock on the right.
**Check:** scrolling works and there are no "key" warnings.
**Look at:** `renderItem` in `src/app/(tabs)/Inventory.tsx`.

### Day 6: Text input and search
**Goal:** a search box that filters the list.
**Learn:** `TextInput`, `onChangeText`, `.filter`, `.toLowerCase()`, `.includes()`.
**Do:**
```tsx
const [search, setSearch] = useState("");
const visible = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
```
Add category chips (All, Drinks, Snacks) that filter too.
**Check:** "co" shows Coke; clearing the box shows everything.

### Day 7: Review: mini store
**Goal:** combine days 2–6: a product grid where tapping a product adds 1 to the cart, with a cart total at the bottom.
**Hint:** store the cart as an object: `{ [productId]: qty }`. Update it with `setCart({ ...cart, [id]: (cart[id] ?? 0) + 1 })`.
**Check:** the total is right after tapping several products.
**Commit:** `Day 7: mini store review`

---

## Week 2: Screens and structure

### Day 8: Expo Router basics
**Goal:** two screens and navigation between them.
**Learn:** every file in `src/app/` is a screen; `Link` and `router.navigate` from `expo-router`.
**Do:** add `src/app/about.tsx` and a button on the home screen: `router.navigate("/about")`.
**Check:** the back button returns home.
**Read:** [Expo Router introduction](https://docs.expo.dev/router/introduction/).

### Day 9: Bottom tabs
**Goal:** tabs for Dashboard, Benta, Inventory, Utang, Reports.
**Learn:** route groups `(tabs)`, `_layout.tsx`, `Tabs` from `expo-router`, icons from `@expo/vector-icons`.
**Do:** create `src/app/(tabs)/_layout.tsx` with `<Tabs>` and one file per tab.
**Check:** each tab shows its own screen with an icon.
**Look at:** `src/app/(tabs)/_layout.tsx`.

### Day 10: Drawer menu and header
**Goal:** a side menu (☰) with the brand name in the header.
**Learn:** `Drawer` from `expo-router/drawer` (install what the docs say with `npx expo install`).
**Do:** wrap the app in a drawer; add a header title component with an icon and "Bantay".
**Check:** the drawer opens from the ☰ button.
**Look at:** `src/app/_layout.tsx`, `src/components/BrandTitle.tsx`.

### Day 11: TypeScript types
**Goal:** typed data, so mistakes show up before running.
**Learn:** `type Product = { id: string; name: string; price: number; ... }`, typed props, `npx tsc --noEmit`.
**Do:** move your product list into `src/data/sample.ts` with a `Product` type. Run `npx tsc --noEmit` and fix every error.
**Check:** `npx tsc --noEmit` prints nothing.
**Look at:** the types at the top of `src/data/sample.ts`.

### Day 12: Helper functions
**Goal:** small reusable functions in their own file.
**Learn:** `export function`, `toLocaleString`, keeping logic out of screens.
**Do:** in `src/store/selectors.ts` write `peso(amount)` → `"₱1,250.00"`, `isLowStock(product)`, and `formatDate(iso)`.
**Check:** use them in two different screens.
**Look at:** `src/store/selectors.ts`, `peso` in `src/constants/theme.ts`.

### Day 13: Dashboard with a bar chart
**Goal:** the Dashboard: 4 stat cards, a weekly sales chart, a "Running low" list.
**Learn:** a bar chart is just `View`s with `height: "${percent}%"`.
**Do:** compute the 7-day totals from sample sales; the tallest bar = 100%.
**Check:** the chart's tallest bar matches the best day.
**Look at:** `src/app/(tabs)/index.tsx` (chart part), `trend()` in `selectors.ts`.

### Day 14: Review
**Goal:** Dashboard and Inventory both read from `sample.ts`, with no data copied into screens.
**Commit:** `Day 14: dashboard and inventory from shared data`

---

## Week 3: Shared state (the "store")

### Day 15: Context and a store hook
**Goal:** one place that holds products, sales and utang, used by every screen.
**Learn:** `createContext`, a Provider component, a `useStore()` hook.
**Do:**
```tsx
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  return <StoreContext.Provider value={{ products, setProducts }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
```
Wrap the root layout with `<StoreProvider>`.
**Check:** changing stock on one screen changes it on another.
**Look at:** `src/store/StoreProvider.tsx` (start of the file, and `useStore` at the end).

### Day 16: Benta (selling) screen
**Goal:** a product grid with a cart bar ("View cart · ₱163.00").
**Learn:** `numColumns` in `FlatList`, `reduce` for totals.
**Do:** `const total = cartLines.reduce((sum, l) => sum + l.qty * l.product.price, 0);`
**Look at:** `src/app/(tabs)/Benta.tsx` (top half).

### Day 17: A bottom sheet
**Goal:** a reusable sheet that slides up (for the cart, forms, receipts).
**Learn:** `Modal`, `transparent`, `animationType`, `KeyboardAvoidingView`, tapping outside to close.
**Look at:** `src/components/BottomSheet.tsx` (short, read it all).

### Day 18: Checkout and payments
**Goal:** the cart sheet with Cash / GCash / Utang, "Cash received" and change.
**Learn:** conditional UI: `{payment === "cash" && (...)}`, `parseFloat`, `Alert.alert` for validation.
**Check:** short payment shows "Short by ₱…" and doesn't finish the sale.

### Day 19: Record the sale
**Goal:** `checkout()` in the store: save the sale and reduce stock.
**Learn:** immutable updates: never change state directly, make new arrays with `.map` and `{ ...p, stock: p.stock - qty }`.
**Look at:** `checkout` and `adjustStock` in `StoreProvider.tsx`.
**Check:** stock goes down after a sale, and sales today goes up on the Dashboard.

### Day 20: Utang (credit)
**Goal:** customers with a ledger (utang and bayad entries) and a balance.
**Learn:** a balance is computed, not stored: `sum(utang) − sum(bayad)`.
**Do:** Utang screen list + a customer sheet with "Add payment".
**Look at:** `src/app/(tabs)/Utang.tsx`, `balanceOf` in `selectors.ts`.

### Day 21: Review: one full sale
**Goal:** sell on utang → the customer's balance goes up → record a payment → balance goes down.
**Commit:** `Day 21: full sale and utang flow`

---

## Week 4: Saving data and real features

### Day 22: Save data on the phone
**Goal:** data survives closing the app.
**Learn:** `useEffect`, async/await, `Storage` from `expo-sqlite/kv-store`, `JSON.stringify`/`JSON.parse`, a `ready` flag.
**Do:** load once at start; save whenever state changes (only after loading finished!).
**Check:** make a sale, close Expo Go completely, open again: the sale is still there.
**Look at:** the two `useEffect`s near the top of `StoreProvider.tsx`, and `src/store/storage.ts`.

### Day 23: Tingi and packs
**Goal:** sell by piece or by pack (1 tali = 10 sachets).
**Learn:** modelling: stock is always counted in pieces; a pack has `size` and `price`.
**Look at:** `saleItem()` and the `Product.pack` type in `src/data/sample.ts`.

### Day 24: Add and edit products
**Goal:** a product form with validation, and restock buttons (+6, +12, +1 tali).
**Learn:** forms with one state object (`const [form, setForm] = useState(EMPTY_FORM)`), `parseFloat`, editing vs adding with the same form.
**Look at:** `openEdit`, `saveProduct` in `src/app/(tabs)/Inventory.tsx`.

### Day 25: Reports
**Goal:** Today / Week / Month totals, profit, best sellers.
**Learn:** profit = (price − cost) × qty; sort with `.sort((a, b) => b.qty - a.qty)`.
**Look at:** `summarize()` in `selectors.ts`, `src/app/(tabs)/Reports.tsx`.

### Day 26: History and a simple forecast
**Goal:** sales by month and by day, and a guess for the next 7/30 days.
**Learn:** working with `Date`; a forecast can be simple: the average of the last 4 weeks, per weekday.
**Look at:** `monthlyHistory`, `dailyHistory`, `forecast` in `selectors.ts`; `src/components/ForecastCard.tsx`.

### Day 27: Receipts
**Goal:** print or share a receipt as PDF.
**Learn:** `expo-print` (HTML → PDF) and `expo-sharing`. Install with `npx expo install expo-print expo-sharing`.
**Look at:** `src/lib/receipt.ts`.

### Day 28: Review
**Goal:** use your practice app for one hour like a real store. Write down every bug and fix three.
**Commit:** `Day 28: bug fixes from a test run`

---

## Week 5: Pro features

### Day 29: Barcode scanner
**Goal:** scan a barcode to add a product to the cart.
**Learn:** `CameraView` from `expo-camera`, camera permission, `onBarcodeScanned`, a cooldown so one item isn't added twice.
**Look at:** `src/components/BarcodeScanner.tsx`.

### Day 30: Look up products online
**Goal:** scanning an unknown barcode fills in the product name.
**Learn:** `fetch`, `try/catch`, handling no internet.
**Look at:** `src/lib/productLookup.ts` (Open Food Facts).

### Day 31: Themes and dark mode
**Goal:** light/dark mode and accent colors.
**Learn:** a `colors` object per theme, a `useTheme()` hook, `createStyles(colors)` with `useMemo`.
**Look at:** `src/constants/theme.ts`, `src/store/useTheme.ts`, any screen's `createStyles`.

### Day 32: Languages
**Goal:** English and Filipino.
**Learn:** a dictionary object and a `t("key")` function; a `TKey` type so typos are errors.
**Look at:** `src/i18n/index.ts`, `src/i18n/en.ts`, `src/i18n/wa.ts`.

### Day 33: PIN lock and staff
**Goal:** a lock screen; staff can sell but can't see profit or settings.
**Learn:** a `session` in the store, a `can("permission")` check, hiding tabs with `href: null`.
**Look at:** `login`, `can` in `StoreProvider.tsx`; `src/components/LockScreen.tsx`; `src/components/OwnerOnly.tsx`.

### Day 34: Activity log and voids
**Goal:** every action is logged; voiding a sale puts stock back and needs the owner's PIN.
**Look at:** `logged()` and `voidSale` in `StoreProvider.tsx`; `src/app/activity.tsx`; `src/components/ReceiptSheet.tsx`.

### Day 35: Review
**Commit:** `Day 35: scanner, themes, languages, staff`

---

## Week 6: Safety, polish and shipping

### Day 36: Encrypt the saved data
**Goal:** data on the phone can't be read by other apps.
**Learn:** AES encryption with `expo-crypto`, keeping the key in `expo-secure-store`.
**Look at:** `src/lib/crypto.ts`, `src/store/deviceKey.ts`. (Remember the Android bug we fixed: pass bytes, not a base64 string, to `fromCombined`.)

### Day 37: Backup and restore
**Goal:** save everything to a file and load it back on another phone.
**Learn:** `expo-file-system` (`File`, `Paths`), `expo-document-picker`, validating a file before trusting it.
**Look at:** `src/lib/backup.ts`.

### Day 38: Animations
**Goal:** small, calm animations: rows fade in, numbers count up.
**Learn:** `react-native-reanimated`: `entering={FadeInDown}`, `withSpring`. Less is more.
**Look at:** `src/components/motion.tsx`.

### Day 39: Settings and legal pages
**Goal:** a Settings screen (profile, theme, language, PIN, backup) and Privacy/Terms pages.
**Look at:** `src/app/settings.tsx`, `src/app/legal.tsx`, `src/legal/content.ts`.

### Day 40: Icon and an APK
**Goal:** your own icon and an installable app.
**Do:** set the icon in `app.json`, then:
```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```
**Look at:** `app.json`, `eas.json`.

### Day 41: Test on a real phone
**Goal:** install your APK, use it for a day, fix what breaks.
**Check:** restart the phone: data is still there; backup and restore work.

### Day 42: Show it off
**Goal:** a README with screenshots, a short demo video, and a post about what you learned.
**Look at:** `README.md`, the `promo/` folder (the video and images were made with Remotion).
**Commit:** `Day 42: done 🎉`

---

## Words you'll see a lot

| Word | Meaning |
|---|---|
| Component | A function that returns UI, like `StatCard` |
| Props | The inputs you pass to a component |
| State | Data that can change; changing it re-draws the screen |
| Hook | A function starting with `use`, like `useState`, `useStore` |
| Context | A way to share state with every screen |
| Route | A screen; in Expo Router, a file in `src/app/` |
| Async / await | Waiting for something slow (saving, internet) without freezing the app |
| Immutable update | Making a new array/object instead of changing the old one |
| Commit | A saved snapshot of your code in Git |

## When you finish

Pick one thing Bantay doesn't do yet and build it yourself, for example:
- a "suki" (regular customer) discount,
- a daily sales notification,
- exporting sales to a spreadsheet.

That's how you go from following along to building on your own.
