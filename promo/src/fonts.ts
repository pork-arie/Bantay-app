import { continueRender, delayRender, staticFile } from "remotion";

// Inter (SIL Open Font License) ships with the project, so rendering needs no internet.
const WEIGHTS = { Medium: "500", SemiBold: "600", Bold: "700", ExtraBold: "800", Black: "900" };

export const fontFamily = "Inter";

const handle = delayRender("Loading Inter");
Promise.all(
  Object.entries(WEIGHTS).map(([name, weight]) => {
    const face = new FontFace(fontFamily, `url(${staticFile(`fonts/Inter-${name}.otf`)})`, { weight });
    document.fonts.add(face);
    return face.load();
  }),
).then(() => continueRender(handle));
