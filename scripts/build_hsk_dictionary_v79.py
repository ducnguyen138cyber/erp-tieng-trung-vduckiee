#!/usr/bin/env python3
"""Build a local 10,000+ term HSK 3.0 Chinese–Vietnamese dictionary.

Sources:
- HSK 3.0 cleaned list: https://github.com/ivankra/hsk30
- Vietnamese definitions: https://github.com/ph0ngp/CVDICT (CC BY-SA 4.0)

The generated files are compact JSON chunks consumed by the static GitHub Pages app.
"""

from __future__ import annotations

import csv
import io
import json
import re
import shutil
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "v79" / "hsk-dictionary"
CHUNK_SIZE = 750
MIN_TERMS = 10_000

HSK_URLS = (
    "https://cdn.jsdelivr.net/gh/ivankra/hsk30@master/hsk30-expanded.csv",
    "https://raw.githubusercontent.com/ivankra/hsk30/master/hsk30-expanded.csv",
)
CVDICT_URLS = (
    "https://cdn.jsdelivr.net/gh/ph0ngp/CVDICT@main/CVDICT.u8",
    "https://raw.githubusercontent.com/ph0ngp/CVDICT/main/CVDICT.u8",
)


def download_text(urls: tuple[str, ...], label: str) -> str:
    errors: list[str] = []
    for url in urls:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "VDuckie-HSK-Dictionary-Builder/79.0",
                "Accept": "text/plain,*/*",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            return data.decode("utf-8-sig")
        except (urllib.error.URLError, TimeoutError, UnicodeDecodeError) as exc:
            errors.append(f"{url}: {exc}")
    raise RuntimeError(f"Không tải được {label}: " + " | ".join(errors))


def level_sort_key(value: str) -> tuple[int, str]:
    if value == "7-9":
        return (7, value)
    try:
        return (int(value), value)
    except ValueError:
        return (99, value)


def clean_meaning(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = value.replace("\u0000", "")
    return value


def parse_hsk(csv_text: str) -> tuple[dict[str, dict], list[str]]:
    records: dict[str, dict] = {}
    order: list[str] = []
    reader = csv.DictReader(io.StringIO(csv_text))
    required = {"ID", "Simplified", "Traditional", "Pinyin", "POS", "Level"}
    missing = required.difference(reader.fieldnames or [])
    if missing:
        raise RuntimeError(f"HSK CSV thiếu cột: {sorted(missing)}")

    for row in reader:
        hanzi = (row.get("Simplified") or "").strip()
        if not hanzi:
            continue
        level = (row.get("Level") or "").strip() or "7-9"
        record = records.get(hanzi)
        if record is None:
            record = {
                "h": hanzi,
                "p": (row.get("Pinyin") or "").strip(),
                "t": (row.get("Traditional") or "").strip(),
                "o": (row.get("POS") or "").strip(),
                "l": [],
                "i": (row.get("ID") or "").strip(),
                "m": [],
            }
            records[hanzi] = record
            order.append(hanzi)
        if level not in record["l"]:
            record["l"].append(level)
        if not record["p"] and row.get("Pinyin"):
            record["p"] = row["Pinyin"].strip()
        if not record["t"] and row.get("Traditional"):
            record["t"] = row["Traditional"].strip()
        if row.get("POS"):
            for pos in row["POS"].split("/"):
                pos = pos.strip()
                if pos and pos not in record["o"].split("/"):
                    record["o"] = "/".join(filter(None, [record["o"], pos]))

    for record in records.values():
        record["l"].sort(key=level_sort_key)
    return records, order


def parse_cvdict(dictionary_text: str, hsk_records: dict[str, dict]) -> int:
    pattern = re.compile(r"^(\S+)\s+(\S+)\s+\[([^\]]*)\]\s+/(.*)/$")
    matched_words: set[str] = set()

    for line in dictionary_text.splitlines():
        if not line or line.startswith("#"):
            continue
        match = pattern.match(line)
        if not match:
            continue
        simplified = match.group(2)
        record = hsk_records.get(simplified)
        if record is None:
            continue

        meanings = [clean_meaning(item) for item in match.group(4).split("/")]
        for meaning in meanings:
            if not meaning or meaning in record["m"]:
                continue
            # Keep the dictionary useful without making every card excessively long.
            record["m"].append(meaning[:360])
            if len(record["m"]) >= 5:
                break
        if record["m"]:
            matched_words.add(simplified)

    return len(matched_words)


def write_json(path: Path, payload: object) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def main() -> None:
    print("Downloading HSK 3.0 vocabulary…")
    hsk_text = download_text(HSK_URLS, "HSK 3.0")
    print("Downloading CVDICT Vietnamese definitions…")
    cvdict_text = download_text(CVDICT_URLS, "CVDICT")

    records, order = parse_hsk(hsk_text)
    matched = parse_cvdict(cvdict_text, records)

    terms = [records[word] for word in order]
    terms.sort(key=lambda item: (level_sort_key(item["l"][0]), item["i"], item["h"]))

    if len(terms) < MIN_TERMS:
        raise RuntimeError(f"Chỉ tạo được {len(terms)} từ, thấp hơn mục tiêu {MIN_TERMS}")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    chunks: list[str] = []
    for index in range(0, len(terms), CHUNK_SIZE):
        name = f"terms-{index // CHUNK_SIZE + 1:02d}.json"
        write_json(OUT_DIR / name, terms[index : index + CHUNK_SIZE])
        chunks.append(name)

    level_counts = Counter(level for term in terms for level in term["l"])
    manifest = {
        "version": "79.0",
        "standard": "GF0025-2021 · HSK 3.0 · 3 bậc 9 cấp",
        "termCount": len(terms),
        "translatedCount": matched,
        "untranslatedCount": len(terms) - matched,
        "levelCounts": dict(sorted(level_counts.items(), key=lambda item: level_sort_key(item[0]))),
        "chunkSize": CHUNK_SIZE,
        "chunks": chunks,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": [
            {
                "name": "HSK 3.0 vocabulary (ivankra/hsk30)",
                "url": "https://github.com/ivankra/hsk30",
            },
            {
                "name": "CVDICT Chinese–Vietnamese dictionary",
                "url": "https://github.com/ph0ngp/CVDICT",
                "license": "CC BY-SA 4.0",
            },
            {
                "name": "Chinese Proficiency Grading Standards GF0025-2021",
                "url": "https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/202111/t20211118_580755.html",
            },
        ],
    }
    write_json(OUT_DIR / "manifest.json", manifest)

    notice = """# HSK Dictionary v79 data notice

- Vocabulary levels are based on the Chinese Proficiency Grading Standards for International Chinese Language Education (GF0025-2021), via the cleaned `ivankra/hsk30` dataset.
- Vietnamese meanings are derived from CVDICT by Phong Phan, licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).
- Generated derivative dictionary chunks in this directory are distributed under CC BY-SA 4.0 where that license applies.

Sources:
- https://github.com/ivankra/hsk30
- https://github.com/ph0ngp/CVDICT
- https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/202111/t20211118_580755.html
"""
    (OUT_DIR / "NOTICE.md").write_text(notice, encoding="utf-8")

    print(
        f"Generated {len(terms)} unique HSK entries in {len(chunks)} chunks; "
        f"Vietnamese definitions matched for {matched} entries."
    )


if __name__ == "__main__":
    main()
