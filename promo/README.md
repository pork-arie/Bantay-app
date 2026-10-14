# Bantay promo video

A ~67-second promotional video for Bantay with an English voice-over, made with [Remotion](https://www.remotion.dev),
in two sizes:

- **Vertical 1080×1920** (`BantayPromo`): Facebook Reels, TikTok, Instagram, phone screens
- **Landscape 1920×1080** (`BantayPromoLandscape`): YouTube, Facebook feed, presentations

```bash
cd promo
npm install
npm run studio            # preview and edit in the browser
npm run render            # writes both videos to out/
```

## Promo images

`images/bantay-1.png` … `bantay-5.png`: five 1080×1920 images (dashboard, selling, utang, inventory, forecast),
each a real app screen in a phone frame with a short Tagalog headline. Good for the Play Store listing
(phone screenshots) and social posts. Edit the text in `src/PromoShot.tsx` (`SHOTS`) and run `npm run pics`.

## What's inside

- `src/BantayPromo.tsx`: all scenes. `DEFS` is the timeline; each scene lasts as long as its voice line.
- `public/*.png`: real screenshots of Bantay (in Filipino) with sample data.
- The scanning scene (`ScanDemo`) is a step-by-step demo of how scanning works: a product comes into view,
  a red laser sweeps the barcode, it beeps, the item drops into the cart, and Done opens Bantay's real cart
  screen (`public/scan-cart.png`). The packages (`public/pkg-*.png`) are generic, with no brand logos.
- `public/voice/*.wav` + `src/voice.json`: the voice-over, generated with the open-source
  [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) voice (Apache-2.0): the English male voice `am_michael`,
  with the Filipino and Waray greetings read by the Spanish male voice `em_alex`. On-screen text is in Tagalog/Taglish.
- `public/beep.wav`: the scanner beep.

## Changing the voice-over

1. Edit the lines in `scripts/make-voice.py` (see the spelling notes at the top of `LINES`).
2. `pip install kokoro-onnx soundfile` and download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from
   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 into this folder.
3. `npm run voice`, then `npm run render`. Scene timing updates automatically.

Inter font: SIL Open Font License.
