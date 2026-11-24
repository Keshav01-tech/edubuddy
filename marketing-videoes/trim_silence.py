r"""Add speech start/end (seconds) to reel/src/timings-<name>.json so videos can skip Kokoro's silent padding.
Usage: .venv\Scripts\python trim_silence.py ba-hi ba-en
"""
import json, sys
import numpy as np, soundfile as sf

for name in sys.argv[1:]:
    path = f"reel/src/timings-{name}.json"
    t = json.load(open(path, encoding="utf-8"))
    for s in t["scenes"]:
        a, sr = sf.read("reel/public/" + s["file"])
        voiced = np.where(np.abs(a) > 0.01)[0]
        s["start"] = round(max(0, voiced[0] / sr - 0.04), 3)
        s["end"] = round(min(len(a) / sr, voiced[-1] / sr + 0.08), 3)
    json.dump(t, open(path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(name, round(sum(s["end"] - s["start"] for s in t["scenes"]), 2), "s of speech")
