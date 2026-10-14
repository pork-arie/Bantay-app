"""Generates the voice-over with Kokoro TTS (Apache-2.0), one file per line.

Setup:  pip install kokoro-onnx soundfile
        download kokoro-v1.0.onnx and voices-v1.0.bin from
        https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run from the promo folder:
        python3 scripts/make-voice.py path/to/kokoro-v1.0.onnx path/to/voices-v1.0.bin

Writes public/voice/<id>.wav and src/voice.json (the length of each line, which sets scene timing).
The narration is Tagalog, read by the Spanish voice (no Tagalog voice is available offline).
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

EN = ("af_heart", "en-us")
ES = ("ef_dora", "es")  # Spanish spelling rules read Filipino and Waray naturally

# Tagalog script, spelled so the Spanish voice says it right:
# "nang" for a standalone "ng", "j" for an h-sound, "gui" for a hard g before i,
# and English loanwords spelled as they sound (Yikash = GCash, barkod = barcode).
LINES = [
    ("hook", ES, "Nalulugui ka ba sa tindajan mo, pero di mo alam kung bakit?"),
    ("p1", ES, "Utang na nakalimutan sa kuwaderno?"),
    ("p2", ES, "Paubos na pala ang estak, di mo napansin?"),
    ("p3", ES, "Saan napupunta ang kita?"),
    ("reveal", ES, "Kilalanin ang Bantay. Ang ap na nagbabantay sa tindajan mo."),
    ("sell", ES, "Mabilis magbenta, tingui man o pakete."),
    ("scan", ES, "Iskan lang ang barkod. Bip! Pasok agad sa kart."),
    ("pay", ES, "Kash, Yikash, o utang. Kusang kinukuwenta ang sukli."),
    ("receipt", ES, "May resibo ang bawat benta."),
    ("utang", ES, "Di na mawawala ang listajan nang utang."),
    ("inventory", ES, "Alam mo agad kung ano ang paubos na."),
    ("forecast", ES, "At ang pinakamaganda: jinujulaan nang Bantay ang benta at kita mo, at ipinapakita kung magkano ang kikitain mo."),
    ("staff", ES, "May sariling pin ang bawat taujan, at nakalog ang bawat benta."),
    ("lang", ES, "Marunong din siya nang wika mo. Inglis."),
    ("lang_fil", ES, "Filipino. Magandang araw!"),
    ("lang_war", ES, "Waray. Maupaynga adlaw!"),
    ("trust", ES, "Gumagana kajit walang internet. Ligtas ang data mo. Walang eds."),
    ("outro", ES, "Bantay. Bantay sa tindajan mo."),
    ("cta", ES, "I-dawnlod na sa Android."),
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
