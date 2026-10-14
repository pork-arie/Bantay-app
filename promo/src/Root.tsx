import { Composition } from "remotion";
import { BantayPromo, FPS, TOTAL_FRAMES } from "./BantayPromo";

export const RemotionRoot = () => (
  <>
    {/* 9:16 for Facebook Reels, TikTok and phone screens */}
    <Composition id="BantayPromo" component={BantayPromo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    {/* 16:9 for YouTube, Facebook feed and presentations */}
    <Composition id="BantayPromoLandscape" component={BantayPromo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
  </>
);
