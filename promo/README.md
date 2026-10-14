# Bantay promo video

A 60-second vertical (1080×1920) promotional video for Bantay, made with [Remotion](https://www.remotion.dev).
The app screens in `public/` are real screenshots of Bantay with sample data.

```bash
cd promo
npm install
npm run studio   # preview and edit in the browser
npm run render   # writes out/bantay-promo.mp4
```

- Scenes and their timing are in `src/BantayPromo.tsx` (`SCENES`). Each feature gets 5 seconds (150 frames at 30 fps).
- To change a screenshot, replace the PNG in `public/` with a new one of the same name.
- The video has no sound. Add music in an editor such as CapCut, using music you have the rights to.
- Inter font: SIL Open Font License.
