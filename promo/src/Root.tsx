import { Composition, Still } from "remotion";
import { BantayPromo, FPS, TOTAL_FRAMES } from "./BantayPromo";
import { PromoShot, PromoShotLandscape } from "./PromoShot";

export const RemotionRoot = () => (
  <>
    {/* 9:16 for Facebook Reels, TikTok and phone screens */}
    <Composition id="BantayPromo" component={BantayPromo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    {/* 16:9 for YouTube, Facebook feed and presentations */}
    <Composition id="BantayPromoLandscape" component={BantayPromo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    {/* Promo images: render with --props='{"index":0}' … 4 */}
    <Still id="PromoShot" component={PromoShot} width={1080} height={1920} defaultProps={{ index: 0 }} />
    {/* Landscape promo images for a portfolio/website: index 0-4, and 5 for the cover image */}
    <Still id="PromoShotLandscape" component={PromoShotLandscape} width={1920} height={1080} defaultProps={{ index: 0 }} />
  </>
);
