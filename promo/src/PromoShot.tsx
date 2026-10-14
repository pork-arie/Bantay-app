import type { CSSProperties } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
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
