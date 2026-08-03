#!/usr/bin/env python3
"""Connect HSK4 to the existing learner-facing read-only runtime."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "assets" / "hsk-content" / "hsk-professional-runtime.js"
FLAGS = ROOT / "assets" / "hsk-content" / "hsk-content-feature-flags.js"
CONTRACT = ROOT / "tests" / "hsk-phase1-quality.test.js"


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    if text.count(old) != 1:
        raise RuntimeError(f"Expected exactly one integration anchor in {path}: {old!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    replace_once(
        RUNTIME,
        "    3: Object.freeze({ base: './data/hsk/hsk3/', phase: 'C4', label: '12 unit · 36 bài · C4' })\n",
        "    3: Object.freeze({ base: './data/hsk/hsk3/', phase: 'C4', label: '12 unit · 36 bài · C4' }),\n"
        "    4: Object.freeze({ base: './data/hsk/hsk4/', phase: 'C5', label: '16 unit · 48 bài · C5' })\n",
    )
    flag_text = FLAGS.read_text(encoding="utf-8")
    if "c5web1" not in flag_text:
        if "c4web1" not in flag_text:
            raise RuntimeError("HSK learner cache key anchor is missing")
        FLAGS.write_text(flag_text.replace("c4web1", "c5web1"), encoding="utf-8")

    replace_once(
        CONTRACT,
        "  assert.deepEqual(report.levels.slice(0, 3).map((level) => ({",
        "  assert.deepEqual(report.levels.slice(0, 4).map((level) => ({",
    )
    replace_once(
        CONTRACT,
        "    { level: 3, status: 'machine-assisted', lessons: 36, complete: false, productionReady: false }\n  ]);\n"
        "  assert.ok(report.levels.slice(3).every((level) => level.status === 'planned' && level.complete === false && level.productionReady === false));",
        "    { level: 3, status: 'machine-assisted', lessons: 36, complete: false, productionReady: false },\n"
        "    { level: 4, status: 'machine-assisted', lessons: 48, complete: false, productionReady: false }\n  ]);\n"
        "  assert.ok(report.levels.slice(4).every((level) => level.status === 'planned' && level.complete === false && level.productionReady === false));",
    )

    runtime = RUNTIME.read_text(encoding="utf-8")
    flags = FLAGS.read_text(encoding="utf-8")
    contract = CONTRACT.read_text(encoding="utf-8")
    assert "./data/hsk/hsk4/" in runtime and "16 unit · 48 bài · C5" in runtime
    assert flags.count("c5web1") == 4 and "c4web1" not in flags
    assert "level: 4, status: 'machine-assisted', lessons: 48" in contract
    assert "slice(4).every" in contract
    print("HSK4 learner integration patched")


if __name__ == "__main__":
    main()
