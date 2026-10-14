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
import voice from "./voice.json";

export const FPS = 30;

const GREEN = "#22C55E";
const LIME = "#A3E635";
const GOLD = "#FACC15";
const DEEP = "#03140A";
const WHITE = "#FFFFFF";
const SOFT = "rgba(255,255,255,0.75)";
const HIGHLIGHT: CSSProperties = {
  background: `linear-gradient(90deg, ${LIME}, ${GREEN})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};
const GOLD_TEXT: CSSProperties = {
  background: `linear-gradient(90deg, ${GOLD}, #FB923C)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const sec = (s: number) => Math.round(s * FPS);
type VoiceId = keyof typeof voice;

const useLandscape = () => {
  const { width, height } = useVideoConfig();
  return width > height;
};

// ---------- Timeline: each scene is as long as its voice line, plus a little air ----------

type Line = { id: VoiceId; at: number };
/** `beeps` are frames (within the scene) where a scanner beep plays. */
type SceneDef = { min: number; pad: number; lines: Line[]; beeps?: number[]; render: () => ReactNode };

/** Plays voice lines one after another, starting `start` seconds in, with `gap` seconds between. */
const chain = (ids: VoiceId[], start: number, gap: number): Line[] => {
  let at = start;
  return ids.map((id) => {
    const line = { id, at };
    at += voice[id] + gap;
    return line;
  });
};

// Scan demo timing (frames): each product takes one 2-second cycle.
const SCAN_START = 24;
const SCAN_CYCLE = 60;
const SCAN_BEEP = 30; // frames into a cycle when the barcode is read
const SCANS = [
  { img: "pkg-1.png", name: "Coke 290ml", price: 20 },
  { img: "pkg-2.png", name: "Kopiko 3in1", price: 10 },
  { img: "pkg-3.png", name: "Piattos", price: 18 },
];
const beepAt = (i: number) => SCAN_START + i * SCAN_CYCLE + SCAN_BEEP;
const CHECKOUT_TAP = SCAN_START + SCANS.length * SCAN_CYCLE + 6;

const DEFS: SceneDef[] = [
  { min: 3.6, pad: 0.4, lines: [{ id: "hook", at: 0.1 }], render: () => <Hook /> },
  { min: 1.9, pad: 0.35, lines: [{ id: "p1", at: 0.15 }], render: () => <Problem text="Utang na nakalimutan?" /> },
  { min: 1.9, pad: 0.35, lines: [{ id: "p2", at: 0.15 }], render: () => <Problem text="Paubos na pala ang stock?" /> },
  { min: 1.9, pad: 0.45, lines: [{ id: "p3", at: 0.15 }], render: () => <Problem text="Saan napunta ang kita?" /> },
  { min: 3, pad: 0.5, lines: [{ id: "reveal", at: 0.25 }], render: () => <Reveal /> },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "sell", at: 0.3 }],
    render: () => (
      <Feature
        tag="Benta"
        title="Mabilis magbenta"
        highlight={["Mabilis"]}
        lines={["I-tap lang para idagdag", "Tingi o pakete, tali o kahon"]}
        screens={[<Screen key="b" src="benta.png" />]}
        callouts={[
          { icon: "🧃", text: "Tingi" },
          { icon: "📦", text: "+1 tali · ₱95" },
          { icon: "🧾", text: "Kabuuan ₱163.00" },
        ]}
      />
    ),
  },
  {
    min: (CHECKOUT_TAP + 50) / FPS,
    pad: 0.3,
    lines: [{ id: "scan", at: 0.3 }],
    beeps: SCANS.map((_, i) => beepAt(i)),
    render: () => <ScanDemo />,
  },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "pay", at: 0.3 }],
    render: () => (
      <Feature
        tag="Bayad"
        title="Cash, GCash o Utang"
        highlight={["GCash", "Utang"]}
        lines={["Kusang kinukuwenta ang sukli", "Ipinapakita ang GCash number mo"]}
        screens={[<Screen key="g" src="gcash.png" />]}
        callouts={[
          { icon: "💵", text: "Sukli ₱37.00" },
          { icon: "📱", text: "GCash ✓" },
          { icon: "📒", text: "Utang → Aling Nena" },
        ]}
      />
    ),
  },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "receipt", at: 0.3 }],
    render: () => (
      <Feature
        tag="Resibo"
        title="May resibo bawat benta"
        highlight={["bawat", "benta"]}
        lines={["I-print o i-share", "Hanapin kahit kailan"]}
        screens={[<Screen key="r" src="receipt.png" />, <Screen key="t" src="transactions.png" />]}
        callouts={[
          { icon: "🧾", text: "Resibo #001561" },
          { icon: "🖨️", text: "I-print o i-share" },
          { icon: "🔎", text: "Hanapin sa 2 tap" },
        ]}
      />
    ),
  },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "utang", at: 0.3 }],
    render: () => (
      <Feature
        tag="Utang"
        title="Wala nang nawawalang listahan"
        highlight={["nawawalang"]}
        lines={["Balanse ng bawat suki", "May limit at paalala"]}
        screens={[<Screen key="u" src="utang.png" />]}
        callouts={[
          { icon: "📒", text: "₱3,450 na sisingilin" },
          { icon: "🚦", text: "Lampas sa limit!" },
          { icon: "💬", text: "Paalala, naipadala" },
        ]}
      />
    ),
  },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "inventory", at: 0.3 }],
    render: () => (
      <Feature
        tag="Inventory"
        title="Alam mo bago maubos"
        highlight={["maubos"]}
        lines={["Babala kapag paubos na", "Listahan ng bibilhin, handa na"]}
        screens={[<Screen key="i" src="inventory.png" />]}
        callouts={[
          { icon: "⚠️", text: "5 paubos na" },
          { icon: "🛒", text: "Listahan ng bibilhin" },
          { icon: "📈", text: "~3 araw na lang" },
        ]}
      />
    ),
  },
  { min: 7, pad: 0.8, lines: [{ id: "forecast", at: 0.3 }], render: () => <Forecast /> },
  {
    min: 3,
    pad: 0.5,
    lines: [{ id: "staff", at: 0.3 }],
    render: () => (
      <Feature
        tag="Bantay mode"
        title="Bantay sa mga tauhan"
        highlight={["tauhan"]}
        lines={["Sariling PIN bawat tauhan", "Naka-log ang bawat benta at void"]}
        screens={[<Screen key="l" src="lock.png" />, <Screen key="a" src="activity.png" />]}
        callouts={[
          { icon: "🔐", text: "PIN ng staff" },
          { icon: "👀", text: "Benta ni Juan #001562" },
          { icon: "🛑", text: "Void? PIN ng may-ari" },
        ]}
      />
    ),
  },
  { min: 5, pad: 0.9, lines: chain(["lang", "lang_fil", "lang_war"], 0.2, 0.2), render: () => <Languages /> },
  { min: 4, pad: 0.6, lines: [{ id: "trust", at: 0.3 }], render: () => <Trust /> },
  { min: 4, pad: 1.2, lines: chain(["outro", "cta"], 0.35, 0.25), render: () => <Outro /> },
];

type Scene = SceneDef & { from: number; duration: number };
const SCENES: Scene[] = [];
{
  let from = 0;
  for (const def of DEFS) {
    const voiceEnd = Math.max(...def.lines.map((l) => l.at + voice[l.id]));
    const duration = sec(Math.max(def.min, voiceEnd + def.pad));
    SCENES.push({ ...def, from, duration });
    from += duration;
  }
}
export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + s.duration, 0);
const REVEAL_FROM = SCENES[4].from;

/** Where the languages scene's voice lines start, so each phone appears as its language is spoken. */
const LANG_LINES = DEFS[13].lines;

export const BantayPromo = () => (
  <AbsoluteFill style={{ fontFamily, background: DEEP, overflow: "hidden" }}>
    <Background />
    {SCENES.map((scene) => (
      <Sequence key={scene.from} from={scene.from} durationInFrames={scene.duration}>
        <SceneFade duration={scene.duration} fadeIn={scene.from > 0}>
          {scene.render()}
        </SceneFade>
        {scene.lines.map((line) => (
          <Sequence key={line.id} from={sec(line.at)}>
            <Audio src={staticFile(`voice/${line.id}.wav`)} />
          </Sequence>
        ))}
        {(scene.beeps ?? []).map((at) => (
          <Sequence key={`beep-${at}`} from={at}>
            <Audio src={staticFile("beep.wav")} volume={0.6} />
          </Sequence>
        ))}
      </Sequence>
    ))}
    {SCENES.slice(1).map((scene) => (
      <Sequence key={`swipe-${scene.from}`} from={scene.from - 9} durationInFrames={18}>
        <Swipe />
      </Sequence>
    ))}
    <Sequence from={REVEAL_FROM} durationInFrames={14}>
      <Flash />
    </Sequence>
  </AbsoluteFill>
);

// ---------- Background, transitions ----------

function Background() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
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
      <div style={blob(width * (0.2 + 0.1 * Math.sin(frame / 50)), height * (0.25 + 0.08 * Math.cos(frame / 40)), big * 0.85, "rgba(34,197,94,0.55)", 0.6)} />
      <div style={blob(width * (0.85 + 0.08 * Math.cos(frame / 60)), height * (0.75 + 0.1 * Math.sin(frame / 45)), big * 0.7, "rgba(163,230,53,0.4)", 0.45)} />
      <div style={blob(width * 0.5, height * (1.05 - 0.05 * Math.sin(frame / 70)), big * 0.6, "rgba(20,184,166,0.45)", 0.45)} />
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

function SceneFade({ duration, children, fadeIn = true }: { duration: number; children: ReactNode; fadeIn?: boolean }) {
  const frame = useCurrentFrame();
  // The first scene starts fully visible: feeds show frame 0 as the thumbnail.
  const opacity = interpolate(frame, [0, fadeIn ? 6 : 0.01, duration - 6, duration], [fadeIn ? 0 : 1, 1, 1, 0], clamp);
  const scale = interpolate(frame, [duration - 8, duration], [1, 1.06], clamp);
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
}

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

/** Words bounce in one after another; highlighted words get the lime gradient. */
function PopWords({
  text,
  delay = 0,
  size,
  highlight = [],
  align = "center",
  gold = false,
}: {
  text: string;
  delay?: number;
  size: number;
  highlight?: string[];
  align?: "center" | "left";
  gold?: boolean;
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
        const p = spring({ frame: frame - delay - i * 3, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
        const lit = highlight.includes(word.replace(/[^\w]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, p * 1.5),
              transform: `translateY(${(1 - p) * size * 0.6}px) scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -8}deg)`,
              ...(lit ? (gold ? GOLD_TEXT : HIGHLIGHT) : null),
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

function Tag({ children, size, gold = false }: { children: ReactNode; size: number; gold?: boolean }) {
  const color = gold ? GOLD : LIME;
  return (
    <div
      style={{
        display: "inline-flex",
        background: gold ? "rgba(250,204,21,0.16)" : "rgba(163,230,53,0.14)",
        border: `2px solid ${gold ? "rgba(250,204,21,0.6)" : "rgba(163,230,53,0.5)"}`,
        color,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 3,
        textTransform: "uppercase",
        padding: `${size * 0.35}px ${size * 0.9}px`,
        borderRadius: 999,
        boxShadow: gold ? "0 0 40px rgba(250,204,21,0.35)" : undefined,
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

// ---------- Phones, callouts ----------

function Screen({ src }: { src: string }) {
  return <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />;
}

function Phone3D({ children, width, delay, tilt, glow = 0 }: { children: ReactNode; width: number; delay: number; tilt: number; glow?: number }) {
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
          boxShadow: `0 ${width * 0.1}px ${width * 0.25}px rgba(0,0,0,0.6), 0 0 ${width * (0.25 + glow * 0.3)}px rgba(34,197,94,${0.35 + glow * 0.5})`,
          opacity: Math.min(1, p * 1.4),
          transform: `translateY(${(1 - p) * 500 + float}px) rotateY(${tilt + (1 - p) * 40}deg) rotateX(${6 + (1 - p) * 20}deg) rotateZ(${(1 - p) * -10}deg)`,
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", borderRadius: width * 0.105 }}>
          {children}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shine}%`,
              width: "45%",
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

type Callout = { icon: string; text: string; at?: number };

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

/** Left labels hang off the stage's left edge and right ones off its right edge, so they stay in frame. */
const SLOTS = [
  { side: "left", y: 0.16 },
  { side: "right", y: 0.4 },
  { side: "left", y: 0.62 },
  { side: "right", y: 0.84 },
] as const;

function PhoneStage({
  screens,
  callouts,
  width,
  pulses = [],
  tilt,
}: {
  screens: ReactNode[];
  callouts: Callout[];
  width: number;
  pulses?: number[];
  tilt?: number;
}) {
  const frame = useCurrentFrame();
  const two = screens.length === 2;
  const phoneW = two ? width * 0.46 : width * 0.68;
  const calloutSize = Math.min(44, width * 0.062);
  // A green glow flashes on the phone each time a barcode scans.
  const glow = Math.max(0, ...pulses.map((at) => (frame >= at ? Math.exp(-(frame - at) / 6) : 0)));
  return (
    <div style={{ position: "relative", width, display: "flex", justifyContent: "center", gap: width * 0.04 }}>
      {screens.map((screen, i) => (
        <div key={i} style={two ? { marginTop: i * width * 0.12 } : undefined}>
          <Phone3D width={phoneW} delay={6 + i * 6} tilt={tilt ?? (two ? (i === 0 ? 14 : -14) : -12)} glow={glow}>
            {screen}
          </Phone3D>
        </div>
      ))}
      {callouts.map((c, i) => {
        const slot = SLOTS[i];
        const edge = -calloutSize * 0.8;
        return (
          <div key={c.text} style={{ position: "absolute", top: `${slot.y * 100}%`, ...(slot.side === "left" ? { left: edge } : { right: edge }) }}>
            <CalloutBadge callout={c} delay={c.at ?? 28 + i * 12} size={calloutSize} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- Scenes ----------

/** Opening: a loss that grabs attention in the first second. */
function Hook() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const slam = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 220, mass: 0.5 } });
  const line1 = slam(0);
  const line2 = slam(4);
  const lost = interpolate(frame, [16, 58], [0, 3450], clamp);
  const eased = 3450 * (1 - Math.pow(1 - lost / 3450, 3));
  const done = frame >= 58;
  const shake = frame >= 58 && frame < 68 ? Math.sin(frame * 3.3) * 14 : 0;
  const counterPop = 0.85 + 0.15 * spring({ frame: frame - 12, fps, config: { damping: 10, stiffness: 160 } });
  const size = landscape ? 138 : 128;
  const RED: CSSProperties = {
    background: "linear-gradient(90deg, #FCA5A5, #EF4444)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
  // Money falling from the top
  const bills = Array.from({ length: 14 }, (_, i) => {
    const x = ((i * 73) % 100) / 100;
    const start = 18 + (i * 7) % 40;
    const y = interpolate(frame - start, [0, 70], [-0.1, 1.1]);
    return { x, y, rot: (i % 2 ? 1 : -1) * (frame - start) * 4, show: frame >= start };
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateX(${shake}px)` }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, rgba(239,68,68,0.35), transparent 60%)", opacity: done ? 1 : 0.6 }} />
      {bills.map((b, i) =>
        b.show ? (
          <div key={i} style={{ position: "absolute", left: b.x * width, top: b.y * height, fontSize: landscape ? 70 : 80, transform: `rotate(${b.rot}deg)`, opacity: 0.85 }}>
            💸
          </div>
        ) : null,
      )}
      <div style={{ textAlign: "center", fontWeight: 900, color: WHITE, letterSpacing: -size * 0.03, lineHeight: 1.04, padding: "0 50px" }}>
        <div style={{ fontSize: size * 1.08, transform: `scale(${1 + 0.12 * (1 - line1)})` }}>
          <span style={RED}>Nalulugi</span> ka ba
        </div>
        <div style={{ fontSize: size, transform: `scale(${1 + 0.12 * (1 - line2)})` }}>sa tindahan mo?</div>
      </div>
      <div style={{ marginTop: landscape ? 40 : 70, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${counterPop * (done ? 1.08 : 1)})` }}>
        <div
          style={{
            fontSize: landscape ? 150 : 170,
            fontWeight: 900,
            color: "#EF4444",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 60px rgba(239,68,68,0.7)",
          }}
        >
          −₱{Math.round(eased).toLocaleString("en-US")}
        </div>
        <div style={{ fontSize: landscape ? 40 : 44, fontWeight: 700, color: SOFT, marginTop: -6 }}>utang na hindi nasingil</div>
      </div>
      <Rise delay={64} style={{ marginTop: landscape ? 34 : 60 }}>
        <div style={{ fontSize: landscape ? 52 : 56, fontWeight: 800, color: WHITE, textAlign: "center", padding: "0 60px" }}>
          …pero hindi mo alam kung bakit? 🤔
        </div>
      </Rise>
    </AbsoluteFill>
  );
}

function Problem({ text }: { text: string }) {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: frame - 24, fps, config: { damping: 10, stiffness: 200 } });
  const shake = frame >= 24 && frame < 32 ? Math.sin(frame * 3) * 12 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: landscape ? 160 : 80, transform: `translateX(${shake}px)` }}>
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

function Rays({ rotate, opacity = 0.5, color = "rgba(163,230,53,0.16)" }: { rotate: number; opacity?: number; color?: string }) {
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
        background: `repeating-conic-gradient(from ${rotate}deg, ${color} 0deg 8deg, transparent 8deg 22deg)`,
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
            <div style={{ fontSize: landscape ? 56 : 54, fontWeight: 800, color: LIME, letterSpacing: 6 }}>KILALANIN ANG</div>
          </Rise>
          <PopWords text="Bantay" size={landscape ? 230 : 220} delay={6} align={landscape ? "left" : "center"} />
          <Rise delay={22}>
            <div style={{ fontSize: landscape ? 48 : 50, fontWeight: 700, color: SOFT, marginTop: 10, textAlign: landscape ? "left" : "center" }}>
              Ang app na nagbabantay sa tindahan mo
            </div>
          </Rise>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function FeatureText({
  tag,
  title,
  highlight,
  lines,
  landscape,
  gold = false,
}: {
  tag: string;
  title: string;
  highlight: string[];
  lines: string[];
  landscape: boolean;
  gold?: boolean;
}) {
  const align = landscape ? "left" : "center";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center", gap: landscape ? 28 : 24 }}>
      <Rise>
        <Tag size={landscape ? 30 : 34} gold={gold}>
          {tag}
        </Tag>
      </Rise>
      <PopWords text={title} size={landscape ? 108 : 104} highlight={highlight} delay={4} align={align} gold={gold} />
      {lines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: landscape ? "flex-start" : "center" }}>
          {lines.map((line, i) => (
            <Rise key={line} delay={18 + i * 6}>
              <div style={{ fontSize: landscape ? 42 : 44, fontWeight: 600, color: SOFT, textAlign: align }}>
                <span style={{ color: gold ? GOLD : LIME, fontWeight: 900 }}>✓ </span>
                {line}
              </div>
            </Rise>
          ))}
        </div>
      )}
    </div>
  );
}

function Feature({
  tag,
  title,
  highlight,
  lines,
  screens,
  callouts,
  scanPulse,
}: {
  tag: string;
  title: string;
  highlight: string[];
  lines: string[];
  screens: ReactNode[];
  callouts: Callout[];
  scanPulse?: number[];
}) {
  const landscape = useLandscape();
  const text = <FeatureText tag={tag} title={title} highlight={highlight} lines={lines} landscape={landscape} />;
  const two = screens.length === 2;
  if (landscape) {
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 860, display: "flex", alignItems: "center" }}>{text}</div>
        <div style={{ position: "absolute", right: 110, top: two ? 90 : 100, width: 720, display: "flex", justifyContent: "center" }}>
          <PhoneStage screens={screens} callouts={callouts} width={two ? 720 : 580} pulses={scanPulse} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: 200, padding: "0 60px" }}>{text}</div>
      <div style={{ position: "absolute", top: 800, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PhoneStage screens={screens} callouts={callouts} width={two ? 900 : 700} pulses={scanPulse} />
      </div>
    </AbsoluteFill>
  );
}

/** Counts up to a peso amount. */
function CountUp({ to, delay, size }: { to: number; delay: number; size: number }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 40], [0, 1], clamp);
  const eased = 1 - Math.pow(1 - p, 3);
  return (
    <span style={{ fontSize: size, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
      ₱{Math.round(to * eased).toLocaleString("en-US")}
    </span>
  );
}

/** Phone screen height ÷ width (the app's screenshots are 1170×2532). */
const SCREEN_RATIO = 2532 / 1170;

/** Which product is in front of the camera, and how far through its cycle (frames). */
const scanState = (frame: number) => {
  const i = Math.floor((frame - SCAN_START) / SCAN_CYCLE);
  const local = frame - SCAN_START - i * SCAN_CYCLE;
  const scanned = SCANS.filter((_, k) => frame >= beepAt(k)).length;
  return { i: i >= 0 && i < SCANS.length ? i : -1, local, scanned };
};

/**
 * A demo of Bantay's scanner screen: the product comes into view, a red laser sweeps the
 * barcode, it beeps, and the item drops into the cart. After three items, Done opens the cart.
 */
function ScanScreen({ w }: { w: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = w * SCREEN_RATIO;
  const u = w / 390; // the app's own pixel scale
  const { i, local, scanned } = scanState(frame);
  const box = { left: 0.17 * w, top: 0.377 * h, width: 0.66 * w, height: 0.188 * h };
  const product = i >= 0 ? SCANS[i] : null;
  const x = product ? interpolate(local, [0, 12, 48, 60], [w * 1.2, 0, 0, -w * 1.2], clamp) : 0;
  const pw = 0.62 * w;
  const ph = (pw * 700) / 470;
  const reading = product && local >= 12 && local < SCAN_BEEP;
  const read = product && local >= SCAN_BEEP && local < 48;
  const laserY = box.top + box.height * (0.5 + 0.45 * Math.sin(local / 2.2));
  const flash = product ? interpolate(local, [SCAN_BEEP, SCAN_BEEP + 10], [0.7, 0], clamp) : 0;
  const beepPop = product ? spring({ frame: local - SCAN_BEEP, fps, config: { damping: 9, stiffness: 200 } }) : 0;
  const last = scanned > 0 ? SCANS[scanned - 1] : null;
  const total = SCANS.slice(0, scanned).reduce((sum, p) => sum + p.price, 0);
  const countPop = scanned > 0 ? spring({ frame: frame - beepAt(scanned - 1), fps, config: { damping: 8, stiffness: 220 } }) : 1;
  const fly = product ? interpolate(local, [SCAN_BEEP, SCAN_BEEP + 14], [0, 1], clamp) : 0;
  const tap = interpolate(frame, [CHECKOUT_TAP, CHECKOUT_TAP + 12], [0, 1], clamp);
  const cart = interpolate(frame, [CHECKOUT_TAP + 6, CHECKOUT_TAP + 14], [0, 1], clamp);
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", fontFamily }}>
      <Img src={staticFile("counter.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      {product && (
        <Img
          src={staticFile(product.img)}
          style={{
            position: "absolute",
            width: pw,
            left: (w - pw) / 2 + x,
            top: box.top + box.height / 2 - 0.675 * ph,
            transform: `rotate(${Math.sin(frame / 9) * 2.5}deg)`,
            filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.35))",
          }}
        />
      )}
      {/* Scan box */}
      <div
        style={{
          position: "absolute",
          ...box,
          borderRadius: 14 * u,
          border: `${3 * u}px solid ${read ? GREEN : WHITE}`,
          boxShadow: `0 0 0 2000px rgba(0,0,0,0.25)${read ? `, 0 0 ${30 * u}px ${GREEN}` : ""}`,
          background: `rgba(34,197,94,${flash})`,
          boxSizing: "border-box",
        }}
      />
      {reading && (
        <div
          style={{
            position: "absolute",
            left: box.left - 10 * u,
            width: box.width + 20 * u,
            top: laserY - 3 * u,
            height: 7 * u,
            borderRadius: 4 * u,
            background: "#FF3B3B",
            boxShadow: `0 0 ${18 * u}px ${7 * u}px rgba(239,68,68,0.85)`,
          }}
        />
      )}
      {read && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: box.top - 56 * u,
            textAlign: "center",
            fontSize: 34 * u,
            fontWeight: 900,
            color: LIME,
            textShadow: "0 0 18px rgba(0,0,0,0.6)",
            transform: `scale(${beepPop})`,
          }}
        >
          BEEP! ✓
        </div>
      )}
      {/* The scanned item drops toward the cart */}
      {product && fly > 0 && fly < 1 && (
        <Img
          src={staticFile(product.img)}
          style={{
            position: "absolute",
            width: 60 * u * (1 - fly * 0.5),
            left: w / 2 - 30 * u + fly * (-w * 0.28),
            top: box.top + box.height / 2 + fly * (h * 0.47 - box.top),
            opacity: 1 - fly * 0.3,
          }}
        />
      )}
      <div style={{ position: "absolute", left: 24 * u, right: 24 * u, top: box.top + box.height + 14 * u, textAlign: "center", color: WHITE, fontSize: 13 * u, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
        Mag-scan nang sunod-sunod. Pindutin ang Tapos kapag kumpleto na.
      </div>
      <div style={{ position: "absolute", top: 16 * u, right: 16 * u, width: 36 * u, height: 36 * u, borderRadius: 18 * u, background: "rgba(0,0,0,0.5)", color: WHITE, fontSize: 18 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ✕
      </div>
      {/* Feedback, like the app shows after each scan */}
      {last && (
        <div
          style={{
            position: "absolute",
            left: 12 * u,
            right: 12 * u,
            bottom: 96 * u,
            background: "#16A34A",
            color: WHITE,
            borderRadius: 12 * u,
            padding: `${10 * u}px ${14 * u}px`,
            fontSize: 15 * u,
            fontWeight: 800,
            transform: `scale(${0.9 + 0.1 * countPop})`,
          }}
        >
          ✓ {last.name} ×1 · ₱{last.price}.00
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 12 * u,
          right: 12 * u,
          bottom: 16 * u,
          height: 68 * u,
          background: "#111827",
          borderRadius: 16 * u,
          padding: `0 ${14 * u}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: WHITE,
        }}
      >
        <div>
          <div style={{ fontSize: 12 * u, color: "rgba(255,255,255,0.7)" }}>{scanned} item sa cart</div>
          <div style={{ fontSize: 22 * u, fontWeight: 900, display: "inline-block", transform: `scale(${0.85 + 0.15 * countPop})`, transformOrigin: "left center" }}>
            ₱{total}.00
          </div>
        </div>
        <div style={{ position: "relative", background: "#16A34A", borderRadius: 12 * u, padding: `${10 * u}px ${14 * u}px`, fontSize: 15 * u, fontWeight: 800 }}>
          {scanned > 0 ? "Tapos — bayaran" : "Tapos"}
          {tap > 0 && tap < 1 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 80 * u,
                height: 80 * u,
                marginLeft: -40 * u,
                marginTop: -40 * u,
                borderRadius: "50%",
                border: `${4 * u}px solid ${WHITE}`,
                transform: `scale(${0.3 + tap})`,
                opacity: 1 - tap,
              }}
            />
          )}
        </div>
      </div>
      {/* After Done: the real cart screen from the app */}
      <Img src={staticFile("scan-cart.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: cart }} />
    </div>
  );
}

function ScanDemo() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { i, local, scanned } = scanState(frame);
  const step = i < 0 ? (scanned === SCANS.length ? 3 : -1) : local < SCAN_BEEP ? 0 : local < SCAN_BEEP + 12 ? 1 : 2;
  const steps = ["Itapat sa barcode", "Beep!", "Pasok sa cart"];
  const stageWidth = landscape ? 640 : 880;
  const screenW = stageWidth * 0.68 * 0.94;
  const text = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center", gap: landscape ? 34 : 28 }}>
      <FeatureText tag="Barcode scanner" title="Scan. Beep. Pasok!" highlight={["Beep"]} lines={[]} landscape={landscape} />
      <div style={{ display: "flex", flexDirection: landscape ? "column" : "row", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {steps.map((label, k) => {
          const on = step === k || step === 3;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 26px",
                borderRadius: 999,
                fontSize: landscape ? 40 : 34,
                fontWeight: 800,
                color: on ? "#052E16" : SOFT,
                background: on ? `linear-gradient(90deg, ${GREEN}, ${LIME})` : "rgba(255,255,255,0.08)",
                transform: `scale(${on ? 1.05 : 1})`,
                boxShadow: on ? "0 0 40px rgba(163,230,53,0.45)" : undefined,
              }}
            >
              <span style={{ fontWeight: 900 }}>{k + 1}</span>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
  const callouts: Callout[] = [
    ...SCANS.map((p, k) => ({ icon: "✅", text: `${p.name} +₱${p.price}`, at: beepAt(k) })),
    { icon: "🛒", text: "Kabuuan ₱48 · bayaran", at: CHECKOUT_TAP + 8 },
  ];
  const stage = (
    <PhoneStage screens={[<ScanScreen key="scan" w={screenW} />]} callouts={callouts} width={stageWidth} pulses={SCANS.map((_, k) => beepAt(k))} tilt={-4} />
  );
  if (landscape) {
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 860, display: "flex", alignItems: "center" }}>{text}</div>
        <div style={{ position: "absolute", right: 90, top: 40, width: 720, display: "flex", justifyContent: "center" }}>{stage}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: 170, padding: "0 50px" }}>{text}</div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center" }}>{stage}</div>
    </AbsoluteFill>
  );
}

/** HIGHLIGHT: Bantay predicts sales and profit, then the profit calculator. */
function Forecast() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { durationInFrames } = { durationInFrames: SCENES[11].duration };
  const switchAt = Math.round(durationInFrames * 0.55);
  const calc = interpolate(frame, [switchAt, switchAt + 10], [0, 1], clamp);
  const cards = [
    { label: "Susunod na 7 araw", value: 10295, delay: 26 },
    { label: "Susunod na 30 araw", value: 44014, delay: 36 },
    { label: "Tubo (30 araw)", value: 8210, delay: 46, gold: true },
  ];
  const cardW = landscape ? 270 : 300;
  const cardRow = (
    <div style={{ display: "flex", gap: 22, marginTop: landscape ? 36 : 30 }}>
      {cards.map((c) => {
        const p = spring({ frame: frame - c.delay, fps, config: { damping: 12, stiffness: 140 } });
        return (
          <div
            key={c.label}
            style={{
              width: cardW,
              padding: "26px 26px",
              boxSizing: "border-box",
              borderRadius: 30,
              background: c.gold ? "linear-gradient(135deg, rgba(250,204,21,0.25), rgba(251,146,60,0.18))" : "rgba(255,255,255,0.08)",
              border: `2px solid ${c.gold ? "rgba(250,204,21,0.7)" : "rgba(163,230,53,0.35)"}`,
              boxShadow: c.gold ? "0 0 60px rgba(250,204,21,0.35)" : "0 20px 50px rgba(0,0,0,0.3)",
              color: c.gold ? GOLD : WHITE,
              opacity: Math.min(1, p * 1.5),
              transform: `scale(${0.7 + 0.3 * p}) translateY(${(1 - p) * 40}px)`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: SOFT }}>{c.label}</div>
            <CountUp to={c.value} delay={c.delay} size={landscape ? 58 : 62} />
          </div>
        );
      })}
    </div>
  );
  // A rising line chart drawn behind the text
  const draw = interpolate(frame, [10, 60], [1, 0], clamp);
  const chart = (
    <svg viewBox="0 0 600 220" style={{ position: "absolute", width: landscape ? 900 : 1000, opacity: 0.35, ...(landscape ? { left: 80, top: 640 } : { left: 40, top: 560 }) }}>
      <path d="M0 200 L80 170 L160 180 L240 120 L320 130 L400 70 L480 80 L600 10" fill="none" stroke={LIME} strokeWidth={8} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * draw} />
    </svg>
  );
  const text = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center" }}>
      <FeatureText tag="⭐ Pinakamaganda" title="Hinuhulaan ang kita mo" highlight={["kita", "mo"]} lines={[]} landscape={landscape} gold />
      {cardRow}
      <Rise delay={switchAt} style={{ marginTop: 34 }}>
        <div style={{ fontSize: landscape ? 42 : 44, fontWeight: 700, color: SOFT, textAlign: landscape ? "left" : "center" }}>
          <span style={{ color: GOLD, fontWeight: 900 }}>✓ </span>Kalkulador ng kita: alam mo ang kikitain
        </div>
      </Rise>
    </div>
  );
  const screens = [
    <div key="f" style={{ position: "relative" }}>
      <Screen src="forecast.png" />
      <div style={{ position: "absolute", inset: 0, opacity: calc }}>
        <Screen src="calculator.png" />
      </div>
    </div>,
  ];
  const callouts: Callout[] = [
    { icon: "🔮", text: "₱44,014 sa 30 araw", at: 50 },
    { icon: "📈", text: "Tumaas ng 1.9%", at: 64 },
    { icon: "💰", text: "Kikitain mo ₱40.00", at: switchAt + 8 },
  ];
  if (landscape) {
    return (
      <AbsoluteFill>
        {chart}
        <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, width: 920, display: "flex", alignItems: "center" }}>{text}</div>
        <div style={{ position: "absolute", right: 90, top: 100, width: 640, display: "flex", justifyContent: "center" }}>
          <PhoneStage screens={screens} callouts={callouts} width={560} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {chart}
      <div style={{ marginTop: 190, padding: "0 50px" }}>{text}</div>
      <div style={{ position: "absolute", top: 930, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PhoneStage screens={screens} callouts={callouts} width={640} />
      </div>
    </AbsoluteFill>
  );
}

/** HIGHLIGHT: English, Filipino and Waray, each phone appearing as its language is spoken. */
function Languages() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [lang, fil, war] = LANG_LINES;
  const items = [
    { src: "dash-en.png", name: "English", hello: "Hi, Rosa!", at: sec(lang.at + voice.lang - 0.7) },
    { src: "dash-fil.png", name: "Filipino", hello: "Magandang araw!", at: sec(fil.at) },
    { src: "dash-war.png", name: "Waray", hello: "Maupay nga adlaw!", at: sec(war.at) },
  ];
  const active = items.reduce((idx, it, i) => (frame >= it.at ? i : idx), -1);
  const phoneW = landscape ? 250 : 300;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ marginTop: landscape ? 100 : 210, padding: "0 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Rise>
          <Tag size={landscape ? 30 : 34}>3 wika</Tag>
        </Rise>
        <PopWords text="Marunong ng wika mo" size={landscape ? 92 : 104} highlight={["wika", "mo"]} delay={4} />
      </div>
      <div style={{ display: "flex", gap: landscape ? 90 : 30, marginTop: landscape ? 40 : 110, alignItems: "flex-start" }}>
        {items.map((it, i) => {
          const p = spring({ frame: frame - it.at, fps, config: { damping: 11, stiffness: 140 } });
          const isActive = i === active;
          return (
            <div key={it.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: Math.min(1, p * 1.5) }}>
              <div
                style={{
                  fontSize: landscape ? 40 : 38,
                  fontWeight: 900,
                  color: isActive ? "#052E16" : WHITE,
                  background: isActive ? `linear-gradient(90deg, ${GREEN}, ${LIME})` : "rgba(255,255,255,0.1)",
                  padding: "12px 30px",
                  borderRadius: 999,
                  transform: `scale(${p})`,
                }}
              >
                {it.name}
              </div>
              <div
                style={{
                  transformOrigin: "top center",
                  transform: `scale(${(isActive ? 1.06 : 0.94) * (0.7 + 0.3 * p)}) translateY(${(1 - p) * 200}px)`,
                  filter: isActive ? undefined : "brightness(0.7)",
                }}
              >
                <Phone3D width={phoneW} delay={it.at} tilt={0} glow={isActive ? 0.6 : 0}>
                  <Screen src={it.src} />
                </Phone3D>
              </div>
              <div style={{ fontSize: landscape ? 38 : 34, fontWeight: 800, color: isActive ? LIME : SOFT, transform: `scale(${p})` }}>“{it.hello}”</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Trust() {
  const landscape = useLandscape();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = [
    { icon: "📶", title: "Offline", text: "Kahit walang internet" },
    { icon: "🔒", title: "Ligtas", text: "Nasa phone mo lang ang data" },
    { icon: "🚫", title: "Walang ads", text: "Walang account, walang tracking" },
    { icon: "💾", title: "Backup", text: "Ilipat sa bagong phone" },
    { icon: "🎨", title: "Kulay mo", text: "Light, dark, 8 kulay" },
    { icon: "🧾", title: "Resibo", text: "I-print o i-share" },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: landscape ? 90 : 220 }}>
      <PopWords text="Para sa bawat tindahan" size={landscape ? 96 : 104} highlight={["bawat", "tindahan"]} />
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
          const p = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 12, stiffness: 120 } });
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
        <div style={{ fontSize: landscape ? 50 : 56, fontWeight: 800, color: WHITE, textAlign: "center" }}>Bantay sa tindahan mo.</div>
      </Rise>
      <Rise delay={30}>
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
          I-download na sa Android
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
      <Rise delay={38}>
        <div style={{ fontSize: landscape ? 36 : 40, fontWeight: 700, color: SOFT }}>Offline · Ligtas · Madali</div>
      </Rise>
    </AbsoluteFill>
  );
}
