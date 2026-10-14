"""Generates the promo's background music (original, so free to use).

120 BPM, one bar = 2 s = 60 video frames, so scene changes land on bar lines.
Run from the promo folder:  python3 scripts/make-music.py
Writes public/music.wav (convert to mp3 with ffmpeg if you like).
"""
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 30
N = int(SR * BAR * BARS)
rng = np.random.default_rng(7)

mix = np.zeros(N)
verb_send = np.zeros(N)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(buf, start_s, sound, gain=1.0):
    i = int(start_s * SR)
    if i >= N:
        return
    end = min(N, i + len(sound))
    buf[i:end] += sound[: end - i] * gain


def tone(freq, dur, harmonics=(1, 0.5, 0.25), attack=0.005, decay=None, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k, amp in enumerate(harmonics, start=1):
        for d in (-detune, detune) if detune else (0,):
            out += amp * np.sin(2 * np.pi * freq * k * (1 + d) * t)
    env = np.minimum(1, t / attack)
    if decay:
        env *= np.exp(-t / decay)
    else:
        env *= np.minimum(1, (dur - t) / 0.05).clip(0, 1)
    return out * env


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def highpass(x):
    return np.diff(x, prepend=0)


def smooth(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")


def kick():
    t = np.arange(int(0.45 * SR)) / SR
    f = 45 + 110 * np.exp(-t / 0.04)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(phase) * np.exp(-t / 0.16))


def clap():
    out = np.zeros(int(0.3 * SR))
    for off in (0, 0.012, 0.024):
        n = highpass(smooth(noise(0.25), 3)) * np.exp(-np.arange(int(0.25 * SR)) / SR / 0.06)
        place_i = int(off * SR)
        out[place_i : place_i + len(n)] += n[: len(out) - place_i]
    return out * 0.5


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    n = highpass(highpass(noise(d)))
    return n * np.exp(-np.arange(len(n)) / SR / (d / 3)) * 0.25


def whoosh(dur=0.6):
    n = smooth(noise(dur), 6)
    t = np.arange(len(n)) / SR
    env = (t / dur) ** 2.5
    return n * env * 0.5


def riser(dur):
    t = np.arange(int(dur * SR)) / SR
    f = 200 * 2 ** (3 * t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    n = highpass(smooth(noise(dur), 4)) * 0.3
    return (s + n) * (t / dur) ** 2


def impact():
    t = np.arange(int(1.8 * SR)) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t / 0.08)) * t) * np.exp(-t / 0.5)
    crash = highpass(noise(1.8)) * np.exp(-t / 0.35) * 0.35
    return np.tanh(1.5 * boom) + crash


# Chords (MIDI roots) — bright C major loop, darker for the "problems" part.
C, G, AM, F = [60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]
LOOP = [C, G, AM, F]
TENSION = [AM, F, G]


def chord_for(bar):
    if 4 <= bar <= 6:
        return TENSION[bar - 4]
    return LOOP[bar % 4]


groove_on = lambda bar: 7 <= bar <= 27  # noqa: E731 — the "drop" when Bantay appears

for bar in range(BARS):
    t0 = bar * BAR
    chord = chord_for(bar)
    root = chord[0] - 24

    # Pad (sustained chord)
    pad_gain = 0.10 if bar < 28 else 0.14
    for m in chord:
        place(mix, t0, tone(hz(m), BAR + 0.1, (1, 0.35, 0.15), attack=0.25, detune=0.003), pad_gain)
        place(verb_send, t0, tone(hz(m), BAR, (1,), attack=0.3), 0.05)

    # Arpeggio plucks (8ths), quieter in the intro
    arp = [chord[0], chord[1], chord[2], chord[1] + 12, chord[2], chord[1], chord[0] + 12, chord[2]]
    arp_gain = 0.09 if bar < 4 else (0.06 if bar < 7 else 0.11)
    if bar < 28:
        for i, m in enumerate(arp):
            p = tone(hz(m + 12), 0.4, (1, 0.6, 0.3, 0.15), decay=0.12)
            place(mix, t0 + i * BEAT / 2, p, arp_gain)
            place(verb_send, t0 + i * BEAT / 2, p, arp_gain * 0.8)

    # Problems: heavy hits on beats 1 and 3
    if 4 <= bar <= 6:
        place(mix, t0, impact(), 0.35)
        place(mix, t0 + 2 * BEAT, kick(), 0.7)

    # Full groove
    if groove_on(bar):
        for b in range(4):
            place(mix, t0 + b * BEAT, kick(), 0.9)
            place(mix, t0 + b * BEAT + BEAT / 2, hat(open_=b == 3), 1.0)
            place(mix, t0 + b * BEAT + BEAT / 4, hat(), 0.5)
            place(mix, t0 + b * BEAT + 3 * BEAT / 4, hat(), 0.5)
        place(mix, t0 + BEAT, clap(), 0.8)
        place(mix, t0 + 3 * BEAT, clap(), 0.8)
        place(verb_send, t0 + BEAT, clap(), 0.3)
        place(verb_send, t0 + 3 * BEAT, clap(), 0.3)
        for i in range(8):
            note = root + (12 if i in (3, 7) else 0)
            b = tone(hz(note), BEAT / 2 - 0.02, (1, 0.5, 0.2), attack=0.004, decay=0.18)
            place(mix, t0 + i * BEAT / 2, np.tanh(2 * b), 0.32)

# Builds and transitions
place(mix, 3 * BAR - 0.01, riser(BAR), 0.6)            # into the problems
place(mix, 6 * BAR + BAR / 2, riser(BAR / 2), 0.8)     # into the drop
for i in range(8):                                     # snare roll before the drop
    place(mix, 6 * BAR + BAR / 2 + i * BEAT / 4, clap(), 0.25 + i * 0.06)
place(mix, 7 * BAR, impact(), 0.7)                     # DROP: "Meet Bantay"
SCENE_BARS = [9, 11, 13, 15, 17, 19, 21, 23, 25, 28]
for bar in SCENE_BARS:
    place(mix, bar * BAR - 0.6, whoosh(0.6), 0.5)
place(mix, 28 * BAR, impact(), 0.6)                    # outro hit

# Simple reverb: convolve the send with decaying noise
ir_len = int(1.2 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR / 0.35)
ir /= np.sqrt(np.sum(ir**2))
size = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.fft.irfft(np.fft.rfft(verb_send, size) * np.fft.rfft(ir, size), size)[:N]
mix += wet * 0.6

# Fade out the last second, then limit and normalise
fade = int(1.0 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.2)
mix /= np.max(np.abs(mix)) * 1.08

stereo = np.stack([mix, np.roll(mix, 220) * 0.98], axis=1)
data = (stereo * 32767).astype("<i2")
with wave.open("public/music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
print("wrote public/music.wav", round(N / SR, 2), "s")
