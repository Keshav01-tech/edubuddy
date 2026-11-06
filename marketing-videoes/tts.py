"""Generate one voiceover clip per script line with Kokoro, plus a timings JSON for Remotion.

Usage:
  .venv\Scripts\python tts.py <script> <name> [voice] [speed]
  .venv\Scripts\python tts.py script.txt en af_heart 1.08
  .venv\Scripts\python tts.py script-hinglish.txt hi hf_alpha 1.05

A line may be "caption || speech": the caption is shown on screen, the speech is what Kokoro reads
(Hindi voices need Devanagari). Lines starting with # are ignored.
Voice prefix picks the language: a=US English, b=UK English, h=Hindi.
"""
import json, os, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

script, name = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.08
SR = 24000

pipe = KPipeline(lang_code=voice[0], repo_id="hexgrad/Kokoro-82M")
os.makedirs(f"reel/public/vo/{name}", exist_ok=True)
scenes = []
for raw in open(script, encoding="utf-8"):
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    caption, _, speech = (p.strip() for p in raw.partition("||"))
    speech = speech or caption
    audio = np.concatenate([np.asarray(a) for _, _, a in pipe(speech, voice=voice, speed=speed)])
    i = len(scenes)
    sf.write(f"reel/public/vo/{name}/{i}.wav", audio, SR)
    scenes.append({"text": caption, "file": f"vo/{name}/{i}.wav", "seconds": round(len(audio) / SR, 3)})
    print(f"{i}: {scenes[-1]['seconds']:.2f}s  {caption}")
json.dump({"voice": voice, "speed": speed, "scenes": scenes}, open(f"reel/src/timings-{name}.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print("total", round(sum(s["seconds"] for s in scenes), 2), "s")
