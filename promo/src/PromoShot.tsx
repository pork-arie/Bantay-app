import type { CSSProperties } from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { fontFamily } from "./fonts";

/** Still promo images (store listing / social posts): one real app screen, big, with a short headline. */
export const SHOTS = [
  { screen: "dash-fil.png", tag: "Bantay", title: "Bantay sa tindahan mo", highlight: ["tindahan", "mo"], sub: "Benta, utang at stock sa isang app" },
  { screen: "benta.png", tag: "Benta", title: "Mabilis magbenta", highlight: ["Mabilis"], sub: "Tingi o pakete, may barcode scanner" },
  { screen: "utang.png", tag: "Utang", title: "Utang, nakalista lahat", highlight: ["lahat"], sub: "May limit at paalala sa bawat suki" },
  { screen: "inventory.png", tag: "Inventory", title: "Alam mo bago maubos", highlight: ["maubos"], sub: "Babala at listahan ng bibilhin" },
  { screen: "forecast.png", tag: "Reports", title: "Hinuhulaan ang kita mo", highlight: ["kita", "mo"], sub: "Benta at tubo sa susunod na 30 araw" },
];

export type PromoShotProps = { index: number };

const GREEN = "#22C55E";
const LIME = "#A3E635";
const HIGHLIGHT: CSSProperties = {
  background: `linear-gradient(90deg, ${LIME}, ${GREEN})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Shared dark green background with glows and a faint grid. */
const Backdrop = () => {
  const { width, height } = useVideoConfig();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 0%, #0B3B1E 0%, #03140A 60%)" }} />
      <div style={glow(width * 0.2, height * 0.2, Math.max(width, height) * 0.8, "rgba(34,197,94,0.5)")} />
      <div style={glow(width * 0.85, height * 0.85, Math.max(width, height) * 0.7, "rgba(163,230,53,0.35)")} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </>
  );
};

const Phone = ({ src, width, style }: { src: string; width: number; style?: CSSProperties }) => (
  <div
    style={{
      width,
      padding: width * 0.03,
      background: "linear-gradient(145deg, #2A2A30, #0B0B0F)",
      borderRadius: width * 0.13,
      boxShadow: "0 60px 140px rgba(0,0,0,0.6), 0 0 160px rgba(34,197,94,0.3)",
      ...style,
    }}
  >
    <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: width * 0.105 }} />
  </div>
);

const Brand = ({ size }: { size: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.4, color: "#fff", fontSize: size, fontWeight: 900, letterSpacing: -1 }}>
    <Img src={staticFile("icon.png")} style={{ width: size * 1.6, height: size * 1.6, borderRadius: size * 0.4, boxShadow: "0 0 50px rgba(34,197,94,0.6)" }} />
    Bantay
  </div>
);

const Title = ({ text, highlight, size, align }: { text: string; highlight: string[]; size: number; align: "left" | "center" }) => (
  <div style={{ fontSize: size, fontWeight: 900, color: "#fff", textAlign: align, lineHeight: 1.04, letterSpacing: -size * 0.03 }}>
    {text.split(" ").map((w, i) => (
      <span key={i} style={highlight.includes(w) ? HIGHLIGHT : undefined}>
        {w}{" "}
      </span>
    ))}
  </div>
);

const Tag = ({ children, size }: { children: string; size: number }) => (
  <div
    style={{
      alignSelf: "flex-start",
      background: "rgba(163,230,53,0.14)",
      border: "2px solid rgba(163,230,53,0.5)",
      color: LIME,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 3,
      textTransform: "uppercase",
      padding: `${size * 0.3}px ${size * 0.9}px`,
      borderRadius: 999,
    }}
  >
    {children}
  </div>
);

/** 16:9 version for a portfolio or website: headline on the left, phone on the right. */
export const PromoShotLandscape = ({ index }: PromoShotProps) => {
  if (index >= SHOTS.length) return <PromoHero />;
  const shot = SHOTS[index];
  return (
    <AbsoluteFill style={{ fontFamily, background: "#03140A", overflow: "hidden" }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 150, top: 0, bottom: 0, width: 900, display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 }}>
        <Brand size={40} />
        <Tag size={30}>{shot.tag}</Tag>
        <Title text={shot.title} highlight={shot.highlight} size={112} align="left" />
        <div style={{ fontSize: 44, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{shot.sub}</div>
      </div>
      <div style={{ position: "absolute", right: 210, top: 70, transform: "rotate(-3deg)" }}>
        <Phone src={shot.screen} width={440} />
      </div>
    </AbsoluteFill>
  );
};

/** Cover image: three screens fanned out next to the app name. */
const PromoHero = () => (
  <AbsoluteFill style={{ fontFamily, background: "#03140A", overflow: "hidden" }}>
    <Backdrop />
    <div style={{ position: "absolute", left: 150, top: 0, bottom: 0, width: 760, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
      <Brand size={64} />
      <Title text="Bantay sa tindahan mo" highlight={["tindahan", "mo"]} size={92} align="left" />
      <div style={{ fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>
        Offline POS, utang tracker and profit forecast for sari-sari stores
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
        {["Offline", "Encrypted", "Barcode scanner", "3 languages"].map((chip) => (
          <div key={chip} style={{ fontSize: 28, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.1)", border: "2px solid rgba(163,230,53,0.35)", padding: "10px 24px", borderRadius: 999 }}>
            {chip}
          </div>
        ))}
      </div>
    </div>
    <div style={{ position: "absolute", right: 130, top: 0, bottom: 0, width: 900 }}>
      <Phone src="utang.png" width={330} style={{ position: "absolute", left: 30, top: 190, transform: "rotate(-9deg)", opacity: 0.95 }} />
      <Phone src="forecast.png" width={330} style={{ position: "absolute", right: 30, top: 190, transform: "rotate(9deg)", opacity: 0.95 }} />
      <Phone src="dash-fil.png" width={380} style={{ position: "absolute", left: 260, top: 80 }} />
    </div>
  </AbsoluteFill>
);

export const PromoShot = ({ index }: PromoShotProps) => {
  const shot = SHOTS[index] ?? SHOTS[0];
  const phoneW = 700;
  return (
    <AbsoluteFill style={{ fontFamily, background: "#03140A", alignItems: "center", overflow: "hidden" }}>
      {/* Background glows */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 0%, #0B3B1E 0%, #03140A 60%)" }} />
      <div style={glow(220, 380, 1500, "rgba(34,197,94,0.5)")} />
      <div style={glow(950, 1600, 1300, "rgba(163,230,53,0.35)")} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div style={{ position: "relative", marginTop: 110, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "0 70px" }}>
        <div
          style={{
            background: "rgba(163,230,53,0.14)",
            border: "2px solid rgba(163,230,53,0.5)",
            color: LIME,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 3,
            textTransform: "uppercase",
            padding: "10px 30px",
            borderRadius: 999,
          }}
        >
          {shot.tag}
        </div>
        <div style={{ fontSize: 84, fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.05, letterSpacing: -3 }}>
          {shot.title.split(" ").map((w, i) => (
            <span key={i} style={shot.highlight.includes(w) ? HIGHLIGHT : undefined}>
              {w}{" "}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.75)", textAlign: "center" }}>{shot.sub}</div>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          top: 560,
          width: phoneW,
          padding: phoneW * 0.03,
          background: "linear-gradient(145deg, #2A2A30, #0B0B0F)",
          borderRadius: phoneW * 0.13,
          boxShadow: "0 60px 140px rgba(0,0,0,0.6), 0 0 160px rgba(34,197,94,0.35)",
        }}
      >
        <Img src={staticFile(shot.screen)} style={{ width: "100%", display: "block", borderRadius: phoneW * 0.105 }} />
      </div>
    </AbsoluteFill>
  );
};

function glow(x: number, y: number, size: number, color: string): CSSProperties {
  return {
    position: "absolute",
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
  };
}
