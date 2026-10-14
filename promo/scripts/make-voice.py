"""Generates the voice-over with Kokoro TTS (Apache-2.0), one file per line.

Setup:  pip install kokoro-onnx soundfile
        download kokoro-v1.0.onnx and voices-v1.0.bin from
        https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run from the promo folder:
        python3 scripts/make-voice.py path/to/kokoro-v1.0.onnx path/to/voices-v1.0.bin

Writes public/voice/<id>.wav and src/voice.json (the length of each line, which sets scene timing).
Filipino words are spelled the way they sound, because the voice reads them with English rules.
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

EN = ("af_heart", "en-us")
ES = ("ef_dora", "es")  # Spanish spelling rules read Filipino and Waray naturally

LINES = [
    ("hook", EN, "Your sahree sahree store works hard. Your app should too."),
    ("p1", EN, "Oo-tung lost in a notebook?"),
    ("p2", EN, "Stock that runs out without warning?"),
    ("p3", EN, "Not sure where the profit went?"),
    ("reveal", EN, "Meet Bahn-tai. The app that watches over your teendahhahn."),
    ("sell", EN, "Sell in seconds, by the piece or by the pack."),
    ("scan", EN, "Just scan. Item after item goes straight into the cart."),
    ("pay", EN, "Take cash, GCash, or oo-tung. It computes the change."),
    ("receipt", EN, "Every sale gets a numbered receipt."),
    ("utang", EN, "Your oo-tung list never gets lost."),
    ("inventory", EN, "Know what's running low, before it runs out."),
    ("forecast", EN, "And the best part: Bahn-tai predicts your sales and profit, and shows exactly how much you'll earn."),
    ("staff", EN, "Staff get their own PIN, and every sale is logged."),
    ("lang", EN, "And it speaks your language. English."),
    ("lang_fil", ES, "Filipino. Magandang araw!"),
    ("lang_war", ES, "Waray. Maupaynga adlaw!"),
    ("trust", EN, "Works offline. Encrypted. No ads."),
    ("outro", ES, "Bantay. Bantay sa tindahan mo."),
    ("cta", EN, "Download it free for Android."),
]

kokoro = Kokoro(sys.argv[1], sys.argv[2])
lengths = {}
for key, (voice, lang), text in LINES:
    samples, rate = kokoro.create(text, voice=voice, speed=1.15, lang=lang)
    sf.write(f"public/voice/{key}.wav", samples, rate)
    lengths[key] = round(len(samples) / rate, 3)
    print(f"{key:10s} {lengths[key]:5.2f}s  {text}")
json.dump(lengths, open("src/voice.json", "w"), indent=2)
print("total", round(sum(lengths.values()), 2), "s")
