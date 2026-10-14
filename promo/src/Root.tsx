import { Composition } from "remotion";
import { BantayPromo, FPS, TOTAL_FRAMES } from "./BantayPromo";

export const RemotionRoot = () => (
  <Composition
    id="BantayPromo"
    component={BantayPromo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    // Vertical 9:16 for Facebook Reels, TikTok and phone screens.
    width={1080}
    height={1920}
  />
);
