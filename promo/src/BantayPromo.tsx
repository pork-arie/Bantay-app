import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./fonts";

export const FPS = 30;

const GREEN = "#16A34A";
const GREEN_SOFT = "#DCFCE7";
const INK = "#0F172A";
const MUTED = "#475569";

// ---------- Timeline (in frames, 30 per second) ----------

type Scene = { from: number; duration: number; render: () => ReactNode };

const FEATURE = 150; // 5 seconds per feature

const SCENES: Scene[] = [
  { from: 0, duration: 120, render: () => <Intro /> },
  { from: 120, duration: 150, render: () => <Problems /> },
  {
    from: 270,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Sell"
        title="Sell in seconds"
        lines={["Tap to add to cart", "Sell by piece (tingi) or by pack, tali or box"]}
        screens={["benta.png"]}
      />
    ),
  },
  { from: 420, duration: FEATURE, render: () => <Scanner /> },
  {
    from: 570,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Payments"
        title="Cash, GCash or Utang"
        lines={["Change computed for you", "Shows your GCash number to the customer"]}
        screens={["gcash.png"]}
      />
    ),
  },
  {
    from: 720,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Receipts"
        title="Proof for every sale"
        lines={["Numbered receipts to print or share", "Find any sale by time, customer or product"]}
        screens={["receipt.png", "transactions.png"]}
      />
    ),
  },
  {
    from: 870,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Utang"
        title="No more lost notebook"
        lines={["Every customer's balance in one list", "Credit limits and friendly reminders"]}
        screens={["utang.png"]}
      />
    ),
  },
  {
    from: 1020,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Inventory"
        title="Know before it runs out"
        lines={["Low-stock alerts", "A shopping list made for you"]}
        screens={["inventory.png"]}
      />
    ),
  },
  {
    from: 1170,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Reports"
        title="See your real profit"
        lines={["Sales history by month and day", "Forecast of next month's earnings"]}
        screens={["forecast.png", "history.png"]}
      />
    ),
  },
  {
    from: 1320,
    duration: FEATURE,
    render: () => (
      <Feature
        tag="Bantay mode"
        title="Your staff, watched over"
        lines={["Staff log in with their own PIN", "Every sale and void is recorded"]}
        screens={["lock.png", "activity.png"]}
      />
    ),
  },
  { from: 1470, duration: 180, render: () => <Trust /> },
  { from: 1650, duration: 150, render: () => <Outro /> },
];

export const TOTAL_FRAMES = 1800;

export const BantayPromo = () => (
  <AbsoluteFill style={{ fontFamily, background: "linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 55%)" }}>
    {SCENES.map((scene) => (
      <Sequence key={scene.from} from={scene.from} durationInFrames={scene.duration}>
        <SceneFade duration={scene.duration}>{scene.render()}</SceneFade>
      </Sequence>
    ))}
  </AbsoluteFill>
);

// ---------- Building blocks ----------

/** Every scene fades in and out, so cuts feel calm. */
const SceneFade = ({ duration, children }: { duration: number; children: ReactNode }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** 0 → 1 with a soft spring, starting `delay` frames into the scene. */
const useEnter = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
};

const Rise = ({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) => {
  const p = useEnter(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>{children}</div>
  );
};

const Tag = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignSelf: "center",
      background: GREEN_SOFT,
      color: GREEN,
      fontWeight: 800,
      fontSize: 34,
      letterSpacing: 2,
      textTransform: "uppercase",
      padding: "12px 30px",
      borderRadius: 999,
    }}
  >
    {children}
  </div>
);

const AppIcon = ({ size }: { size: number }) => (
  <Img
    src={staticFile("icon.png")}
    style={{ width: size, height: size, borderRadius: size * 0.22, boxShadow: "0 30px 60px rgba(22,163,74,0.35)" }}
  />
);

/** A real app screenshot inside a simple phone frame. */
const Phone = ({ src, width }: { src: string; width: number }) => (
  <div
    style={{
      width,
      padding: width * 0.03,
      background: "#0B0B0F",
      borderRadius: width * 0.13,
      boxShadow: "0 40px 90px rgba(15,23,42,0.28)",
    }}
  >
    <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: width * 0.105 }} />
  </div>
);

// ---------- Scenes ----------

const Intro = () => {
  const frame = useCurrentFrame();
  const icon = useEnter(0);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ transform: `scale(${0.6 + icon * 0.4}) rotate(${(1 - icon) * -12}deg)`, opacity: icon }}>
        <AppIcon size={300} />
      </div>
      <Rise delay={12}>
        <div style={{ fontSize: 170, fontWeight: 900, color: INK, letterSpacing: -4 }}>Bantay</div>
      </Rise>
      <Rise delay={24} style={{ textAlign: "center", padding: "0 110px" }}>
        <div style={{ fontSize: 52, fontWeight: 600, color: MUTED, lineHeight: 1.3 }}>
          The app that watches over your <span style={{ color: GREEN, fontWeight: 800 }}>sari-sari store</span>
        </div>
      </Rise>
      <div style={{ position: "absolute", bottom: 160, opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: GREEN }}>Free · Offline · Private</div>
      </div>
    </AbsoluteFill>
  );
};

const Problems = () => {
  const items = ["Utang written in a notebook?", "Stock runs out without warning?", "Not sure how much you really earn?"];
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", gap: 56 }}>
      {items.map((text, i) => (
        <Rise key={text} delay={i * 22}>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                background: "#FEE2E2",
                color: "#DC2626",
                fontSize: 54,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ?
            </div>
            <div style={{ fontSize: 66, fontWeight: 800, color: INK, lineHeight: 1.15 }}>{text}</div>
          </div>
        </Rise>
      ))}
      <Rise delay={80}>
        <div style={{ fontSize: 64, fontWeight: 900, color: GREEN, marginTop: 30 }}>Bantay fixes all of that.</div>
      </Rise>
    </AbsoluteFill>
  );
};

const Feature = ({ tag, title, lines, screens }: { tag: string; title: string; lines: string[]; screens: string[] }) => {
  const frame = useCurrentFrame();
  const phone = useEnter(8);
  // A slow drift keeps still screenshots alive.
  const drift = interpolate(frame, [0, FEATURE], [0, -30]);
  const two = screens.length === 2;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
      <Rise>
        <Tag>{tag}</Tag>
      </Rise>
      <Rise delay={4} style={{ marginTop: 34, padding: "0 70px", textAlign: "center" }}>
        <div style={{ fontSize: 92, fontWeight: 900, color: INK, letterSpacing: -2, lineHeight: 1.05 }}>{title}</div>
      </Rise>
      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        {lines.map((line, i) => (
          <Rise key={line} delay={14 + i * 8}>
            <div style={{ fontSize: 44, fontWeight: 600, color: MUTED, textAlign: "center", padding: "0 80px" }}>
              <span style={{ color: GREEN, fontWeight: 900 }}>✓ </span>
              {line}
            </div>
          </Rise>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 760,
          display: "flex",
          gap: 40,
          opacity: phone,
          transform: `translateY(${(1 - phone) * 260 + drift}px)`,
        }}
      >
        {screens.map((src, i) => (
          <div key={src} style={two ? { transform: `rotate(${i === 0 ? -4 : 4}deg) translateY(${i * 60}px)` } : undefined}>
            <Phone src={src} width={two ? 440 : 500} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Barcodes don't show on a web screenshot, so this scene draws the scan instead. */
const Scanner = () => {
  const frame = useCurrentFrame();
  const bars = Array.from({ length: 46 }, (_, i) => ((i * 37) % 7) + 2);
  const lineY = interpolate(frame % 40, [0, 20, 40], [0, 280, 0]);
  const chips = [
    { at: 40, text: "+ Coke 290ml · ₱20.00" },
    { at: 70, text: "+ Kopiko 3in1 · ₱10.00" },
    { at: 100, text: "+ Piattos · ₱18.00" },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
      <Rise>
        <Tag>Barcode scanner</Tag>
      </Rise>
      <Rise delay={4} style={{ marginTop: 34, padding: "0 70px", textAlign: "center" }}>
        <div style={{ fontSize: 92, fontWeight: 900, color: INK, letterSpacing: -2, lineHeight: 1.05 }}>
          Scan. Beep. Added.
        </div>
      </Rise>
      <Rise delay={14} style={{ marginTop: 34, textAlign: "center", padding: "0 80px" }}>
        <div style={{ fontSize: 44, fontWeight: 600, color: MUTED }}>
          <span style={{ color: GREEN, fontWeight: 900 }}>✓ </span>Scan item after item straight into the cart
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, color: MUTED, marginTop: 14 }}>
          <span style={{ color: GREEN, fontWeight: 900 }}>✓ </span>New product? Its name fills in by itself
        </div>
      </Rise>
      <Rise delay={10} style={{ marginTop: 90 }}>
        <div
          style={{
            position: "relative",
            width: 760,
            height: 360,
            background: "#fff",
            borderRadius: 40,
            padding: 40,
            boxShadow: "0 30px 70px rgba(15,23,42,0.15)",
            display: "flex",
            gap: 6,
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          {bars.map((w, i) => (
            <div key={i} style={{ width: w * 2.2, background: i % 3 === 1 ? "transparent" : INK }} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: 40 + lineY,
              height: 6,
              background: "#EF4444",
              boxShadow: "0 0 24px #EF4444",
              borderRadius: 3,
            }}
          />
        </div>
      </Rise>
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
        {chips.map((chip) => {
          const p = spring({ frame: frame - chip.at, fps: FPS, config: { damping: 200 } });
          return (
            <div
              key={chip.text}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
                background: GREEN,
                color: "#fff",
                fontSize: 44,
                fontWeight: 800,
                padding: "20px 44px",
                borderRadius: 999,
              }}
            >
              {chip.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Trust = () => {
  const tiles = [
    { icon: "📶", title: "Works offline", text: "No internet or Wi-Fi needed" },
    { icon: "🔒", title: "Encrypted", text: "Your data stays on your phone" },
    { icon: "💾", title: "Backup file", text: "Move it to a new phone anytime" },
    { icon: "🗣️", title: "3 languages", text: "English · Filipino · Waray" },
    { icon: "🚫", title: "No ads", text: "No account, no tracking" },
    { icon: "🎨", title: "Your colors", text: "Light or dark, 8 accents" },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
      <Rise style={{ textAlign: "center", padding: "0 70px" }}>
        <div style={{ fontSize: 92, fontWeight: 900, color: INK, letterSpacing: -2, lineHeight: 1.05 }}>
          Made for every tindahan
        </div>
      </Rise>
      <div
        style={{
          marginTop: 90,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 36,
          padding: "0 70px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {tiles.map((tile, i) => (
          <Rise key={tile.title} delay={10 + i * 10}>
            <div
              style={{
                background: "#fff",
                borderRadius: 40,
                padding: "44px 36px",
                boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
                height: 330,
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: 80 }}>{tile.icon}</div>
              <div style={{ fontSize: 50, fontWeight: 900, color: INK, marginTop: 18 }}>{tile.title}</div>
              <div style={{ fontSize: 34, fontWeight: 600, color: MUTED, marginTop: 10, lineHeight: 1.3 }}>
                {tile.text}
              </div>
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Outro = () => {
  const frame = useCurrentFrame();
  const icon = useEnter(0);
  const pulse = 1 + Math.sin(frame / 8) * 0.03;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36, background: GREEN }}>
      <div style={{ transform: `scale(${(0.7 + icon * 0.3) * pulse})`, opacity: icon }}>
        <Img src={staticFile("icon.png")} style={{ width: 260, height: 260, borderRadius: 60, border: "6px solid rgba(255,255,255,0.35)" }} />
      </div>
      <Rise delay={8}>
        <div style={{ fontSize: 160, fontWeight: 900, color: "#fff", letterSpacing: -4 }}>Bantay</div>
      </Rise>
      <Rise delay={16} style={{ textAlign: "center", padding: "0 100px" }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.3 }}>
          Bantay sa tindahan mo.
          <br />
          Free · Offline · Private
        </div>
      </Rise>
      <Rise delay={30}>
        <div
          style={{
            marginTop: 40,
            background: "#fff",
            color: GREEN,
            fontSize: 54,
            fontWeight: 900,
            padding: "30px 70px",
            borderRadius: 999,
          }}
        >
          Download now for Android
        </div>
      </Rise>
    </AbsoluteFill>
  );
};
