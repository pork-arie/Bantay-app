"""Generates the voice-over with Kokoro TTS (Apache-2.0), one file per line.

Setup:  pip install kokoro-onnx soundfile
        download kokoro-v1.0.onnx and voices-v1.0.bin from
        https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run from the promo folder:
        python3 scripts/make-voice.py path/to/kokoro-v1.0.onnx path/to/voices-v1.0.bin

Writes public/voice/<id>.wav and src/voice.json (the length of each line, which sets scene timing).
English narration with a male voice; the Filipino and Waray greetings use the Spanish voice.
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

EN = ("am_michael", "en-us")
ES = ("em_alex", "es")  # Spanish spelling rules read Filipino and Waray naturally

# English narration (male). Filipino words are spelled as they sound
# ("Bahn-tai" = Bantay, "oo-tung" = utang); the two greetings use the Spanish voice.
LINES = [
    ("hook", EN, "Losing money in your store, and you don't know why?"),
    ("p1", EN, "Oo-tung forgotten in a notebook?"),
    ("p2", EN, "Stock running out without warning?"),
    ("p3", EN, "Where did the profit go?"),
    ("reveal", EN, "Meet Bahn-tai. The app that watches over your store."),
    ("sell", EN, "Sell in seconds, by the piece or by the pack."),
    ("scan", EN, "Just scan the barcode. Beep! It's in the cart."),
    ("pay", EN, "Cash, GCash, or oo-tung. It even computes the change."),
    ("receipt", EN, "Every sale gets a receipt."),
    ("utang", EN, "Your oo-tung list never gets lost."),
    ("inventory", EN, "Know what's running low, before it runs out."),
    ("forecast", EN, "And the best part: Bahn-tai predicts your sales and profit, and shows exactly how much you'll earn."),
    ("staff", EN, "Staff get their own PIN, and every sale is logged."),
    ("lang", EN, "And it speaks your language. English."),
    ("lang_fil", ES, "Filipino. Magandang araw!"),
    ("lang_war", ES, "Waray. Maupaynga adlaw!"),
    ("trust", EN, "Works offline. Your data stays safe. No ads."),
    ("outro", EN, "Bahn-tai. Watching over your store."),
    ("cta", EN, "Download it now for Android."),
]

kokoro = Kokoro(sys.argv[1], sys.argv[2])
lengths = {}
for key, (voice, lang), text in LINES:
    samples, rate = kokoro.create(text, voice=voice, speed=1.1, lang=lang)
    sf.write(f"public/voice/{key}.wav", samples, rate)
    lengths[key] = round(len(samples) / rate, 3)
    print(f"{key:10s} {lengths[key]:5.2f}s  {text}")
json.dump(lengths, open("src/voice.json", "w"), indent=2)
print("total", round(sum(lengths.values()), 2), "s")
