import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
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
export const TOTAL_FRAMES = 1800;
/** The music is 120 BPM: one beat is 15 frames, one bar is 60. Scenes start on bar lines. */
const BEAT = 15;

const GREEN = "#22C55E";
const LIME = "#A3E635";
const DEEP = "#03140A";
const WHITE = "#FFFFFF";
const SOFT = "rgba(255,255,255,0.72)";
const HIGHLIGHT: CSSProperties = {
  background: `linear-gradient(90deg, ${LIME}, ${GREEN})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useLandscape = () => {
  const { width, height } = useVideoConfig();
  return width > height;
};

// ---------- Content ----------

type Callout = { icon: string; text: string };
type FeatureData = {
  tag: string;
  title: string;
  highlight: string[];
  lines: string[];
  screens: string[];
  callouts: Callout[];
};

const FEATURES: FeatureData[] = [
  {
    tag: "Sell",
    title: "Sell in seconds",
    highlight: ["seconds"],
    lines: ["Tap to add to cart", "Tingi or by pack, tali or box"],
    screens: ["benta.png"],
    callouts: [
      { icon: "🧃", text: "Tingi" },
      { icon: "📦", text: "+1 tali · ₱95" },
      { icon: "🧾", text: "Total ₱163.00" },
    ],
  },
  {
    tag: "Payments",
    title: "Cash, GCash or Utang",
    highlight: ["GCash", "Utang"],
    lines: ["Change computed for you", "Your GCash number, shown to the buyer"],
    screens: ["gcash.png"],
    callouts: [
      { icon: "💵", text: "Sukli ₱37.00" },
      { icon: "📱", text: "GCash ✓" },
      { icon: "📒", text: "Utang → Aling Nena" },
    ],
  },
  {
    tag: "Receipts",
    title: "Proof for every sale",
    highlight: ["every", "sale"],
    lines: ["Numbered receipts to print or share", "Search any sale, any day"],
    screens: ["receipt.png", "transactions.png"],
    callouts: [
      { icon: "🧾", text: "Receipt #001560" },
      { icon: "🖨️", text: "Print or share" },
      { icon: "🔎", text: "Find it in 2 taps" },
    ],
  },
  {
    tag: "Utang",
    title: "No more lost notebook",
    highlight: ["lost", "notebook"],
    lines: ["Every balance in one list", "Credit limits and friendly reminders"],
    screens: ["utang.png"],
    callouts: [
      { icon: "📒", text: "₱3,450 to collect" },
      { icon: "🚦", text: "Over limit warning" },
      { icon: "💬", text: "Reminder sent" },
    ],
  },
  {
    tag: "Inventory",
    title: "Know before it runs out",
    highlight: ["runs", "out"],
    lines: ["Low-stock alerts", "A shopping list made for you"],
    screens: ["inventory.png"],
    callouts: [
      { icon: "⚠️", text: "5 items running low" },
      { icon: "🛒", text: "Shopping list ready" },
      { icon: "📈", text: "Lasts ~3 more days" },
    ],
  },
  {
    tag: "Reports",
    title: "See your real profit",
    highlight: ["real", "profit"],
    lines: ["Sales by month and by day", "Next month's earnings, forecast"],
    screens: ["forecast.png", "history.png"],
    callouts: [
      { icon: "💰", text: "Profit ₱2,024" },
      { icon: "🔮", text: "Next 30 days ₱44,014" },
      { icon: "📊", text: "Best day: Sunday" },
    ],
  },
  {
    tag: "Bantay mode",
    title: "Your staff, watched over",
    highlight: ["watched", "over"],
    lines: ["Each staff member has their own PIN", "Every sale and void is logged"],
    screens: ["lock.png", "activity.png"],
    callouts: [
      { icon: "🔐", text: "Staff PIN" },
      { icon: "👀", text: "Juan sold #001560" },
      { icon: "🛑", text: "Voids need owner PIN" },
    ],
  },
];

// ---------- Timeline ----------

type Scene = { from: number; duration: number; node: ReactNode };

const FEATURE_LEN = 120; // 2 bars = 4 seconds
const FEATURE_START = 540;

const SCENES: Scene[] = [
  { from: 0, duration: 240, node: <Hook /> },
  { from: 240, duration: 60, node: <Problem text="Utang lost in a notebook?" /> },
  { from: 300, duration: 60, node: <Problem text="Stock runs out without warning?" /> },
  { from: 360, duration: 60, node: <Problem text="Where did the profit go?" /> },
  { from: 420, duration: 120, node: <Reveal /> },
  ...FEATURES.slice(0, 1).map((f, i) => ({
    from: FEATURE_START + i * FEATURE_LEN,
    duration: FEATURE_LEN,
    node: <Feature data={f} index={i + 1} />,
  })),
  { from: FEATURE_START + FEATURE_LEN, duration: FEATURE_LEN, node: <Scanner index={2} /> },
  ...FEATURES.slice(1).map((f, i) => ({
    from: FEATURE_START + (i + 2) * FEATURE_LEN,
    duration: FEATURE_LEN,
    node: <Feature data={f} index={i + 3} />,
  })),
  { from: 1500, duration: 180, node: <Trust /> },
  { from: 1680, duration: 120, node: <Outro /> },
];

export const BantayPromo = () => (
  <AbsoluteFill style={{ fontFamily, background: DEEP, overflow: "hidden" }}>
    <Audio
      src={staticFile("music.mp3")}
      volume={(f) => interpolate(f, [0, 10, TOTAL_FRAMES - 30, TOTAL_FRAMES], [0, 1, 1, 0], clamp)}
    />
    <Background />
    {SCENES.map((scene) => (
      <Sequence key={scene.from} from={scene.from} durationInFrames={scene.duration}>
        <SceneFade duration={scene.duration}>{scene.node}</SceneFade>
      </Sequence>
    ))}
    {SCENES.slice(1).map((scene) => (
      <Sequence key={`swipe-${scene.from}`} from={scene.from - 9} durationInFrames={18}>
        <Swipe />
      </Sequence>
    ))}
    <Sequence from={420} durationInFrames={14}>
      <Flash />
    </Sequence>
  </AbsoluteFill>
);

// ---------- Background, transitions ----------

/** Dark green with moving glows that pulse on the beat once the music drops. */
function Background() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const grooving = frame >= 420 && frame < 1680;
  const pulse = grooving ? Math.exp(-(frame % BEAT) / 4) : 0;
  const big = Math.max(width, height);
  const blob = (x: number, y: number, size: number, color: string, alpha: number): CSSProperties => ({
    position: "absolute",
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
    opacity: alpha,
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 0%, #0B3B1E 0%, ${DEEP} 60%)` }} />
      <div
        style={blob(
          width * (0.2 + 0.1 * Math.sin(frame / 50)),
          height * (0.25 + 0.08 * Math.cos(frame / 40)),
          big * (0.8 + 0.08 * pulse),
          "rgba(34,197,94,0.55)",
          0.55 + 0.25 * pulse,
        )}
      />
      <div
        style={blob(
          width * (0.85 + 0.08 * Math.cos(frame / 60)),
          height * (0.75 + 0.1 * Math.sin(frame / 45)),
          big * 0.7,
          "rgba(163,230,53,0.4)",
          0.4 + 0.2 * pulse,
        )}
      />
      <div style={blob(width * 0.5, height * (1.05 - 0.05 * Math.sin(frame / 70)), big * 0.6, "rgba(20,184,166,0.45)", 0.45)} />
      {/* Fine grid that drifts slowly */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `0 ${frame * 0.6}px`,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
}

function SceneFade({ duration, children }: { duration: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6, duration - 6, duration], [0, 1, 1, 0], clamp);
  const scale = interpolate(frame, [duration - 8, duration], [1, 1.06], clamp);
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
}

/** A slanted green bar that sweeps across on every scene change. */
function Swipe() {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 18], [-140, 140]);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          bottom: "-20%",
          width: "55%",
          left: `${x}%`,
          transform: "skewX(-18deg)",
          background: `linear-gradient(90deg, transparent, ${GREEN} 30%, ${LIME} 50%, ${GREEN} 70%, transparent)`,
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
}

function Flash() {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: WHITE, opacity: interpolate(frame, [0, 14], [0.9, 0], clamp) }} />;
}

// ---------- Text helpers ----------

const pop = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });

/** Words bounce in one after another; highlighted words get the lime gradient. */
function PopWords({
  text,
  delay = 0,
  size,
  highlight = [],
  align = "center",
}: {
  text: string;
  delay?: number;
  size: number;
  highlight?: string[];
  align?: "center" | "left";
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `0 ${size * 0.28}px`,
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1.06,
        letterSpacing: -size * 0.03,
        color: WHITE,
      }}
    >
      {text.split(" ").map((word, i) => {
        const p = pop(frame, fps, delay + i * 3);
        const lit = highlight.includes(word.replace(/[^\w]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, p * 1.5),
              transform: `translateY(${(1 - p) * size * 0.6}px) scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -8}deg)`,
              ...(lit ? HIGHLIGHT : null),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

function Rise({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>{children}</div>;
}

function Tag({ children, size }: { children: ReactNode; size: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "rgba(163,230,53,0.14)",
        border: "2px solid rgba(163,230,53,0.5)",
        color: LIME,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 3,
        textTransform: "uppercase",
        padding: `${size * 0.35}px ${size * 0.9}px`,
        borderRadius: 999,
      }}
    >
      {children}
    </div>
  );
}

function AppIcon({ size, glow = true }: { size: number; glow?: boolean }) {
  return (
    <Img
      src={staticFile("icon.png")}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        boxShadow: glow ? `0 0 ${size * 0.5}px rgba(34,197,94,0.75), 0 ${size * 0.1}px ${size * 0.3}px rgba(0,0,0,0.5)` : undefined,
      }}
    />
  );
}

// ---------- Phone with 3D tilt, shine and callouts ----------

const SCREEN_RATIO = 2532 / 1170;

function Phone3D({ src, width, delay, tilt }: { src: string; width: number; delay: number; tilt: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 90 } });
  const float = Math.sin((frame + delay * 7) / 18) * 10;
  const shine = interpolate(frame - delay, [10, 40], [-120, 220], clamp);
  return (
    <div style={{ perspective: 2200 }}>
      <div
        style={{
          width,
          padding: width * 0.03,
          background: "linear-gradient(145deg, #2A2A30, #0B0B0F)",
          borderRadius: width * 0.13,
          boxShadow: `0 ${width * 0.1}px ${width * 0.25}px rgba(0,0,0,0.6), 0 0 ${width * 0.25}px rgba(34,197,94,0.35)`,
          opacity: Math.min(1, p * 1.4),
          transform: `translateY(${(1 - p) * 500 + float}px) rotateY(${tilt + (1 - p) * 40}deg) rotateX(${6 + (1 - p) * 20}deg) rotateZ(${(1 - p) * -10}deg)`,
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", borderRadius: width * 0.105 }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: width * 0.94 * SCREEN_RATIO, display: "block", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shine}%`,
              width: "45%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Floating labels that pop out around the phone. `y` is a fraction of the stage height;
 * left labels hang off the stage's left edge and right labels off its right edge,
 * so they always stay inside the video frame.
 */
const SLOTS = [
  { side: "left", y: 0.16 },
  { side: "right", y: 0.44 },
  { side: "left", y: 0.74 },
] as const;

function CalloutBadge({ callout, delay, size }: { callout: Callout; delay: number; size: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const bob = Math.sin((frame + delay * 5) / 12) * 6;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.4,
        background: "rgba(255,255,255,0.96)",
        color: "#0F172A",
        fontSize: size,
        fontWeight: 800,
        padding: `${size * 0.5}px ${size * 0.8}px`,
        borderRadius: size * 0.8,
        whiteSpace: "nowrap",
        boxShadow: `0 ${size * 0.4}px ${size}px rgba(0,0,0,0.35), 0 0 0 3px rgba(163,230,53,0.6)`,
        transform: `translateY(-50%) translateY(${bob}px) scale(${p})`,
        opacity: Math.min(1, p * 2),
      }}
    >
      <span style={{ fontSize: size * 1.15 }}>{callout.icon}</span>
      {callout.text}
    </div>
  );
}

function PhoneStage({ screens, callouts, width }: { screens: string[]; callouts: Callout[]; width: number }) {
  const two = screens.length === 2;
  const phoneW = two ? width * 0.46 : width * 0.68;
  const calloutSize = Math.min(44, width * 0.062);
  return (
    <div style={{ position: "relative", width, display: "flex", justifyContent: "center", gap: width * 0.04 }}>
      {screens.map((src, i) => (
        <div key={src} style={two ? { marginTop: i * width * 0.12 } : undefined}>
          <Phone3D src={src} width={phoneW} delay={6 + i * 6} tilt={two ? (i === 0 ? 14 : -14) : -12} />
        </div>
      ))}
      {callouts.map((c, i) => {
        const slot = SLOTS[i];
        const edge = -calloutSize * 0.8;
        return (
          <div
            key={c.text}
            style={{ position: "absolute", top: `${slot.y * 100}%`, ...(slot.side === "left" ? { left: edge } : { right: edge }) }}
          >
            <CalloutBadge callout={c} delay={28 + i * 12} size={calloutSize} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- Scenes ----------

function Hook() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const size = landscape ? 150 : 140;
  const zoom = interpolate(frame, [0, 240], [1, 1.08]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20, transform: `scale(${zoom})`, padding: 80 }}>
      <PopWords text="Your tindahan" size={size} highlight={["tindahan"]} delay={6} />
      <PopWords text="works hard." size={size} delay={30} />
      <Rise delay={90} style={{ marginTop: 40 }}>
        <div style={{ fontSize: landscape ? 64 : 60, fontWeight: 700, color: SOFT, textAlign: "center" }}>
          Your app should too.
        </div>
      </Rise>
    </AbsoluteFill>
  );
}

function Problem({ text }: { text: string }) {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: frame - 26, fps, config: { damping: 10, stiffness: 200 } });
  const shake = frame >= 26 && frame < 34 ? Math.sin(frame * 3) * 12 : 0;
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", padding: landscape ? 160 : 80, transform: `translateX(${shake}px)` }}
    >
      <PopWords text={text} size={landscape ? 130 : 120} />
      <div
        style={{
          position: "absolute",
          right: landscape ? 160 : 70,
          top: landscape ? 110 : 520,
          width: 200,
          height: 200,
          borderRadius: 100,
          background: "#EF4444",
          color: WHITE,
          fontSize: 130,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 80px rgba(239,68,68,0.7)",
          opacity: Math.min(1, stamp * 2),
          transform: `scale(${3 - 2 * stamp}) rotate(${(1 - stamp) * 40 - 12}deg)`,
        }}
      >
        ✕
      </div>
    </AbsoluteFill>
  );
}

/** Spinning light rays behind the logo. */
function Rays({ rotate, opacity = 0.5 }: { rotate: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 3200,
        height: 3200,
        left: "50%",
        top: "50%",
        marginLeft: -1600,
        marginTop: -1600,
        background: `repeating-conic-gradient(from ${rotate}deg, rgba(163,230,53,0.16) 0deg 8deg, transparent 8deg 22deg)`,
        maskImage: "radial-gradient(circle, black 0%, transparent 55%)",
        opacity,
      }}
    />
  );
}

function Reveal() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const icon = spring({ frame, fps, config: { damping: 9, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Rays rotate={frame * 0.6} />
      <div style={{ display: "flex", flexDirection: landscape ? "row" : "column", alignItems: "center", gap: landscape ? 70 : 40 }}>
        <div style={{ transform: `scale(${icon}) rotate(${(1 - icon) * -30}deg)` }}>
          <AppIcon size={landscape ? 300 : 340} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center" }}>
          <Rise delay={2}>
            <div style={{ fontSize: landscape ? 56 : 54, fontWeight: 800, color: LIME, letterSpacing: 6 }}>MEET</div>
          </Rise>
          <PopWords text="Bantay" size={landscape ? 230 : 220} delay={6} align={landscape ? "left" : "center"} />
          <Rise delay={22}>
            <div style={{ fontSize: landscape ? 48 : 50, fontWeight: 700, color: SOFT, marginTop: 10, textAlign: landscape ? "left" : "center" }}>
              The app that watches over your store
            </div>
          </Rise>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Corner({ index }: { index: number }) {
  const landscape = useLandscape();
  return (
    <div
      style={{
        position: "absolute",
        top: landscape ? 50 : 70,
        left: landscape ? 70 : 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: WHITE,
        fontSize: 36,
        fontWeight: 800,
      }}
    >
      <AppIcon size={60} glow={false} />
      Bantay
      <span style={{ color: SOFT, fontWeight: 600, marginLeft: 8 }}>{String(index).padStart(2, "0")} / 08</span>
    </div>
  );
}

function FeatureText({
  tag,
  title,
  highlight,
  lines,
  landscape,
}: {
  tag: string;
  title: string;
  highlight: string[];
  lines: string[];
  landscape: boolean;
}) {
  const align = landscape ? "left" : "center";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center", gap: landscape ? 30 : 26 }}>
      <Rise>
        <Tag size={landscape ? 30 : 34}>{tag}</Tag>
      </Rise>
      <PopWords text={title} size={landscape ? 112 : 108} highlight={highlight} delay={4} align={align} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: landscape ? "flex-start" : "center" }}>
        {lines.map((line, i) => (
          <Rise key={line} delay={18 + i * 6}>
            <div style={{ fontSize: landscape ? 42 : 44, fontWeight: 600, color: SOFT, textAlign: align }}>
              <span style={{ color: LIME, fontWeight: 900 }}>✓ </span>
              {line}
            </div>
          </Rise>
        ))}
      </div>
    </div>
  );
}

function Feature({ data, index }: { data: FeatureData; index: number }) {
  const landscape = useLandscape();
  const text = <FeatureText {...data} landscape={landscape} />;
  const two = data.screens.length === 2;
  if (landscape) {
    return (
      <AbsoluteFill>
        <Corner index={index} />
        <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 860, display: "flex", alignItems: "center" }}>
          {text}
        </div>
        <div style={{ position: "absolute", right: 110, top: two ? 90 : 110, width: 720, display: "flex", justifyContent: "center" }}>
          <PhoneStage screens={data.screens} callouts={data.callouts} width={two ? 720 : 560} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Corner index={index} />
      <div style={{ marginTop: 200, padding: "0 60px" }}>{text}</div>
      <div style={{ position: "absolute", top: 800, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PhoneStage screens={data.screens} callouts={data.callouts} width={two ? 900 : 700} />
      </div>
    </AbsoluteFill>
  );
}

/** Barcodes can't be screenshotted, so this scene draws the scan instead. */
function Scanner({ index }: { index: number }) {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bars = Array.from({ length: 44 }, (_, i) => ((i * 37) % 7) + 2);
  const lineY = interpolate(frame % 30, [0, 15, 30], [0, 1, 0]);
  const chips = [
    { at: 30, text: "+ Coke 290ml · ₱20" },
    { at: 45, text: "+ Kopiko 3in1 · ₱10" },
    { at: 60, text: "+ Piattos · ₱18" },
  ];
  const card = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <Rise delay={8}>
        <div
          style={{
            position: "relative",
            width: landscape ? 680 : 760,
            height: landscape ? 320 : 340,
            background: WHITE,
            borderRadius: 40,
            padding: 40,
            boxSizing: "border-box",
            boxShadow: "0 0 90px rgba(34,197,94,0.45)",
            display: "flex",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {bars.map((w, i) => (
            <div key={i} style={{ width: w * 2.2, background: i % 3 === 1 ? "transparent" : "#0F172A" }} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 30 + lineY * (landscape ? 250 : 270),
              height: 8,
              background: "#EF4444",
              boxShadow: "0 0 30px 6px rgba(239,68,68,0.8)",
              borderRadius: 4,
            }}
          />
        </div>
      </Rise>
      {chips.map((chip) => {
        const p = spring({ frame: frame - chip.at, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
        return (
          <div
            key={chip.text}
            style={{
              opacity: Math.min(1, p * 2),
              transform: `scale(${p})`,
              background: `linear-gradient(90deg, ${GREEN}, ${LIME})`,
              color: "#052E16",
              fontSize: landscape ? 46 : 48,
              fontWeight: 900,
              padding: "18px 46px",
              borderRadius: 999,
              boxShadow: "0 10px 40px rgba(34,197,94,0.5)",
            }}
          >
            {chip.text}
          </div>
        );
      })}
    </div>
  );
  const text = (
    <FeatureText
      tag="Barcode scanner"
      title="Scan. Beep. Added."
      highlight={["Beep"]}
      lines={["Scan item after item into the cart", "New product? Its name fills itself in"]}
      landscape={landscape}
    />
  );
  return landscape ? (
    <AbsoluteFill>
      <Corner index={index} />
      <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 860, display: "flex", alignItems: "center" }}>{text}</div>
      <div style={{ position: "absolute", right: 110, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>{card}</div>
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Corner index={index} />
      <div style={{ marginTop: 200, padding: "0 60px" }}>{text}</div>
      <div style={{ marginTop: 110 }}>{card}</div>
    </AbsoluteFill>
  );
}

function Trust() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = [
    { icon: "📶", title: "Works offline", text: "No Wi-Fi needed" },
    { icon: "🔒", title: "Encrypted", text: "Data stays on your phone" },
    { icon: "💾", title: "Backup file", text: "Move to a new phone" },
    { icon: "🗣️", title: "3 languages", text: "English · Filipino · Waray" },
    { icon: "🚫", title: "No ads", text: "No account, no tracking" },
    { icon: "🎨", title: "Your style", text: "Light, dark, 8 colors" },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: landscape ? 90 : 220 }}>
      <PopWords text="Made for every tindahan" size={landscape ? 96 : 104} highlight={["every", "tindahan"]} />
      <div
        style={{
          marginTop: landscape ? 70 : 110,
          display: "grid",
          gridTemplateColumns: landscape ? "repeat(3, 480px)" : "repeat(2, 450px)",
          gap: landscape ? 34 : 36,
          perspective: 1600,
        }}
      >
        {tiles.map((tile, i) => {
          const p = spring({ frame: frame - 14 - i * 7, fps, config: { damping: 12, stiffness: 120 } });
          return (
            <div
              key={tile.title}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "2px solid rgba(163,230,53,0.35)",
                borderRadius: 36,
                padding: landscape ? "34px 36px" : "40px 36px",
                height: landscape ? 270 : 330,
                boxSizing: "border-box",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.3)",
                opacity: Math.min(1, p * 1.5),
                transform: `rotateX(${(1 - p) * 90}deg) scale(${0.8 + 0.2 * p})`,
              }}
            >
              <div style={{ fontSize: landscape ? 72 : 84 }}>{tile.icon}</div>
              <div style={{ fontSize: landscape ? 46 : 50, fontWeight: 900, color: WHITE, marginTop: 14 }}>{tile.title}</div>
              <div style={{ fontSize: landscape ? 30 : 34, fontWeight: 600, color: SOFT, marginTop: 8 }}>{tile.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Outro() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const icon = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
  const shimmer = interpolate(frame % 45, [0, 45], [-60, 160]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: landscape ? 26 : 40 }}>
      <Rays rotate={frame * 0.8} opacity={0.8} />
      <div style={{ transform: `scale(${icon})` }}>
        <AppIcon size={landscape ? 220 : 300} />
      </div>
      <PopWords text="Bantay" size={landscape ? 190 : 210} delay={6} />
      <Rise delay={16}>
        <div style={{ fontSize: landscape ? 50 : 56, fontWeight: 800, color: WHITE, textAlign: "center" }}>
          Bantay sa tindahan mo.
        </div>
      </Rise>
      <Rise delay={24}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            marginTop: 20,
            background: `linear-gradient(90deg, ${GREEN}, ${LIME})`,
            color: "#052E16",
            fontSize: landscape ? 52 : 58,
            fontWeight: 900,
            padding: landscape ? "26px 70px" : "32px 80px",
            borderRadius: 999,
            boxShadow: "0 0 70px rgba(163,230,53,0.6)",
          }}
        >
          Download free for Android
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shimmer}%`,
              width: "30%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.7), transparent)",
            }}
          />
        </div>
      </Rise>
      <Rise delay={32}>
        <div style={{ fontSize: landscape ? 36 : 40, fontWeight: 700, color: SOFT }}>Offline · Private · Free</div>
      </Rise>
    </AbsoluteFill>
  );
}
