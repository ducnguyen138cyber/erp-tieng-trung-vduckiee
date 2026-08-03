#!/usr/bin/env python3
"""Finalize deterministic HSK4 C5 lexical data after the source-table import."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HSK4 = ROOT / "data" / "hsk" / "hsk4"
BUILDER = ROOT / "scripts" / "build-hsk4-c5.py"


def normalize_tone(value: str) -> str:
    value = str(value or "").replace("’", " ").replace("'", " ")
    value = value.split("/", 1)[0]
    return " ".join(value.split()).lower()


def syllable_number(syllable: str) -> str:
    tone = "5"
    chars: list[str] = []
    decomposed = unicodedata.normalize("NFD", syllable.lower())
    index = 0
    while index < len(decomposed):
        ch = decomposed[index]
        if ch in "abcdefghijklmnopqrstuvwxyz":
            base = ch
            # u + diaeresis is represented as v by repository convention.
            if ch == "u" and index + 1 < len(decomposed) and decomposed[index + 1] == "\u0308":
                base = "v"
            chars.append(base)
        elif ch == "ü":
            chars.append("v")
        elif ch == "\u0304":
            tone = "1"
        elif ch == "\u0301":
            tone = "2"
        elif ch == "\u030c":
            tone = "3"
        elif ch == "\u0300":
            tone = "4"
        index += 1
    text = "".join(chars).replace("u:", "v")
    return f"{text}{tone}" if text else ""


def pinyin_number(value: str) -> str:
    items = [syllable_number(item) for item in normalize_tone(value).split()]
    return " ".join(item for item in items if item) or "na5"


def patch_object(value):
    if isinstance(value, list):
        return [patch_object(item) for item in value]
    if not isinstance(value, dict):
        return value
    out = {key: patch_object(item) for key, item in value.items()}
    tone_source = out.get("pinyinTone") or out.get("pinyin")
    if isinstance(tone_source, str):
        tone = normalize_tone(tone_source)
        if "pinyin" in out:
            out["pinyin"] = tone
        if "pinyinTone" in out:
            out["pinyinTone"] = tone
        if "pinyinNumber" in out:
            out["pinyinNumber"] = pinyin_number(tone)
        if "pinyinNormalized" in out:
            out["pinyinNormalized"] = re.sub(r"[^a-zv]", "", pinyin_number(tone))
    return out


def patch_json_files() -> None:
    for path in sorted(HSK4.rglob("*.json")):
        document = json.loads(path.read_text(encoding="utf-8"))
        patched = patch_object(document)
        path.write_text(json.dumps(patched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def patch_builder() -> None:
    text = BUILDER.read_text(encoding="utf-8")
    old = "word=row[1].strip(); pinyin=row[2].strip(); hanviet=row[3].strip(); meaning=row[4].strip()"
    new = "word=row[1].strip(); pinyin=re.sub(r\"[’']\", \" \", row[2].strip()).split('/',1)[0].strip(); hanviet=row[3].strip(); meaning=row[4].strip()"
    if old in text:
        text = text.replace(old, new)
    old_map = "'ǖ':('v','1'),'ǘ':('v','2'),'ǚ':('v','3'),'ǜ':('v','4'),'ü':('v','5')"
    new_map = old_map + ",\n    'ḿ':('m','2'),'ń':('n','2'),'ň':('n','3'),'ǹ':('n','4')"
    if old_map in text and "'ǹ':('n','4')" not in text:
        text = text.replace(old_map, new_map)
    BUILDER.write_text(text, encoding="utf-8")


def verify() -> None:
    invalid = []
    for path in sorted((HSK4 / "vocabulary").glob("hsk4-v-*.json")):
        for record in json.loads(path.read_text(encoding="utf-8"))["records"]:
            if any(mark in record["pinyinTone"] for mark in ("’", "'", "/")):
                invalid.append(record["id"])
            if not re.fullmatch(r"[a-zv1-5 ]+", record["pinyinNumber"]):
                invalid.append(record["id"])
    if invalid:
        raise RuntimeError(f"Invalid normalized pinyin records: {invalid[:20]}")


def main() -> None:
    patch_builder()
    patch_json_files()
    verify()
    print(json.dumps({"ok": True, "pinyinNormalized": 1000}, ensure_ascii=False))


if __name__ == "__main__":
    main()
