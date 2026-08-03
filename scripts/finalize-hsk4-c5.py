#!/usr/bin/env python3
"""Finalize deterministic HSK4 C5 pronunciation and character metadata."""
from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from pypinyin import Style, lazy_pinyin

ROOT = Path(__file__).resolve().parents[1]
HSK4 = ROOT / "data" / "hsk" / "hsk4"
BUILDER = ROOT / "scripts" / "build-hsk4-c5.py"
HAN_RE = re.compile(r"[\u3400-\u9fff]")

RADICAL_GROUPS = [
    ("氵", "海河清洗澡没法活酒满流深温游泳消池湖洋汁汗洁泪湿洪波浪滴湾源"),
    ("扌", "把搬打扫接换拍提找拉推持报掉抬扶抓摆按批投拒拆拍摸抢挂"),
    ("口", "听吃喝唱哭嘴叫告诉味响哈咱哪问喊吵吐咬吸吻咳叹"),
    ("讠", "话讲谁请认让语说记议词谈许证评访误诚调论讨诉"),
    ("忄", "怕快慢忙情怪惯性惜恨懂惊悔悦愉慌恼怀惭"),
    ("艹", "草花菜茶药蓝蕉苹节苦落营著藏薄葡萄菜菊"),
    ("木", "树楼机李校梯桌椅板本材桥根植森棉梨桃枝"),
    ("亻", "住作位他你们但使信件像借保候值优依伤修仍供"),
    ("女", "姨姐妹妻妈奶她好姓婚妇娘妙娃"),
    ("辶", "过进近远还这边送退迟道遇选通速追逃迷造遍"),
    ("阝", "院邻阳阴都邮附降防阶限队陆险陪"),
    ("饣", "饭馆饱饿饮饼馆餐饺馒"),
    ("钅", "钱银错铁铅钟镜锅锁针钢铜"),
    ("纟", "红绿级纸练结给终经线细约织续绝统"),
    ("疒", "病疼瘦痛疲疗症痒疯"),
    ("足", "路跑跳踢跟距踩跃趟"),
    ("日", "明晚时春晴星景暗暑晨昨晒"),
    ("月", "腿脚脸胖期服脑腰胸肤胃肝"),
    ("宀", "安全室客家字定实宿富察害完容"),
    ("竹", "笔筷箱笑等篇答签篮简管"),
    ("囗", "国园图回因团围困"),
    ("门", "间闻问闲闹闭闪阔"),
    ("土", "地场城坏境增墙坡块"),
    ("心", "想意忘感愿急态恋忠忍慰"),
    ("雨", "雪雷需零雾震"),
    ("火", "灯热然烧烟烤炒"),
    ("车", "辆轻转轮输较轨"),
    ("贝", "贵费负购赚赔财货责"),
    ("衣", "衬裙装裤被补袖"),
]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def pronunciation(text: str) -> dict[str, str]:
    tone = " ".join(lazy_pinyin(text, style=Style.TONE, strict=False, errors="default")).lower()
    number = " ".join(
        lazy_pinyin(
            text,
            style=Style.TONE3,
            neutral_tone_with_five=True,
            strict=False,
            errors="default",
        )
    ).lower()
    number = number.replace("u:", "v").replace("ü", "v")
    normal = " ".join(lazy_pinyin(text, style=Style.NORMAL, strict=False, errors="default")).lower()
    normal = normal.replace("u:", "v").replace("ü", "v")
    return {
        "tone": re.sub(r"\s+", " ", tone).strip(),
        "number": re.sub(r"\s+", " ", number).strip(),
        "normalized": re.sub(r"[^a-zv]", "", normal),
    }


def load_vocabulary() -> list[dict]:
    records: list[dict] = []
    for path in sorted((HSK4 / "vocabulary").glob("hsk4-v-*.json")):
        records.extend(read_json(path)["records"])
    if len(records) != 1000:
        raise RuntimeError(f"HSK4 must contain 1000 vocabulary records, received {len(records)}")
    return records


def build_pronunciations(records: list[dict]) -> dict[str, dict[str, str]]:
    return {record["id"]: pronunciation(record["simplified"]) for record in records}


def vocabulary_ref(value: dict) -> str | None:
    for key in ("id", "canonicalId"):
        candidate = value.get(key)
        if isinstance(candidate, str) and candidate.startswith("hsk4-v-"):
            return candidate
    lookup = value.get("canonicalLookup")
    if isinstance(lookup, dict):
        candidate = lookup.get("value")
        if isinstance(candidate, str) and candidate.startswith("hsk4-v-"):
            return candidate
    row = value.get("officialRow")
    if isinstance(row, int) and 1001 <= row <= 2000:
        return f"hsk4-v-{row - 1000:04d}"
    return None


def patch_pronunciation_fields(value, pronunciations: dict[str, dict[str, str]]):
    if isinstance(value, list):
        return [patch_pronunciation_fields(item, pronunciations) for item in value]
    if not isinstance(value, dict):
        return value
    out = {key: patch_pronunciation_fields(item, pronunciations) for key, item in value.items()}
    ref = vocabulary_ref(out)
    if ref in pronunciations:
        data = pronunciations[ref]
        if "pinyin" in out:
            out["pinyin"] = data["tone"]
        if "pinyinTone" in out:
            out["pinyinTone"] = data["tone"]
        if "pinyinNumber" in out:
            out["pinyinNumber"] = data["number"]
        if "pinyinNormalized" in out:
            out["pinyinNormalized"] = data["normalized"]
    return out


def patch_json_pronunciations(pronunciations: dict[str, dict[str, str]]) -> None:
    for path in sorted(HSK4.rglob("*.json")):
        write_json(path, patch_pronunciation_fields(read_json(path), pronunciations))


def bundled_stroke_counts(characters: list[str]) -> dict[str, int]:
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const chars = JSON.parse(fs.readFileSync(0, 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('vendor/hsk-char-data.js', 'utf8'), context);
const data = context.window.HSK_HANZI_DATA || {};
const result = {};
for (const character of chars) {
  const row = data[character];
  if (row && Array.isArray(row.strokes) && row.strokes.length) result[character] = row.strokes.length;
}
process.stdout.write(JSON.stringify(result));
"""
    result = subprocess.run(
        ["node", "-e", script],
        cwd=ROOT,
        input=json.dumps(characters, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=True,
    )
    return {key: int(value) for key, value in json.loads(result.stdout).items()}


def radical_for(character: str) -> str | None:
    for radical, members in RADICAL_GROUPS:
        if character in members:
            return radical
    return None


def rebuild_characters(vocabulary: list[dict]) -> None:
    old: set[str] = set()
    for level in (1, 2, 3):
        path = ROOT / "data" / "hsk" / f"hsk{level}" / "characters.json"
        if path.exists():
            old.update(record["character"] for record in read_json(path)["records"])

    ordered: list[str] = []
    for word in vocabulary:
        for character in HAN_RE.findall(word["simplified"]):
            if character not in old and character not in ordered:
                ordered.append(character)
    counts = bundled_stroke_counts(ordered)
    selected = [character for character in ordered if character in counts][:150]
    if len(selected) != 150:
        raise RuntimeError(f"HSK4 character focus needs 150 bundled-vector characters, received {len(selected)}")

    records: list[dict] = []
    for index, character in enumerate(selected, start=1):
        radical = radical_for(character)
        word_refs = [word["id"] for word in vocabulary if character in word["simplified"]]
        note = (
            f"Mẹo nhớ: tìm phần {radical} trong {character}, rồi đối chiếu chữ trong các từ đã học; "
            "đây là mẹo thị giác, không phải giải thích từ nguyên."
            if radical
            else f"Mẹo nhớ: nhận diện hình tổng thể của {character} trong từ đã học và tự đối chiếu số nét; "
            "chưa tuyên bố cấu tạo từ nguyên."
        )
        records.append(
            {
                "recordType": "character",
                "id": f"hsk4-character-{index:03d}",
                "syllabusVersion": "GF0025-2021",
                "hskLevel": 4,
                "character": character,
                "recognitionRequired": True,
                "writingRequired": True,
                "radical": radical,
                "components": [radical, "phần còn lại cần human signoff"] if radical else [],
                "structure": "compound-visual-analysis" if radical else "visual-form-focus",
                "readings": [pronunciation(character)["tone"]],
                "wordRefs": word_refs,
                "confusables": [],
                "strokeCount": counts[character],
                "strokeCountSource": "bundled-static-vector-count",
                "mnemonic": {"type": "memory-aid-not-etymology", "noteVi": note},
                "knowledgeStatus": "new",
                "strokeOrderStatus": "static-fallback",
                "strokeOrderAsset": None,
                "sourceIds": [
                    "moe-gf0025-2021-standard",
                    "cti-hsk4-current-syllabus-2026",
                    "unicode-unihan-17",
                ],
                "contentStatus": "machine-assisted",
                "reviewStatus": "unreviewed",
                "contentVersion": 1,
            }
        )
    write_json(
        HSK4 / "characters.json",
        {"schemaVersion": "1.0.0", "collectionType": "characters", "level": 4, "records": records},
    )


def patch_builder_note() -> None:
    text = BUILDER.read_text(encoding="utf-8")
    marker = "# Finalize with scripts/finalize-hsk4-c5.py to normalize phrase pinyin and bundled stroke metadata.\n"
    if marker not in text:
        text = text.replace("from __future__ import annotations\n", "from __future__ import annotations\n\n" + marker, 1)
    BUILDER.write_text(text, encoding="utf-8")


def verify(vocabulary: list[dict]) -> None:
    invalid: list[str] = []
    tones: Counter[str] = Counter()
    for record in vocabulary:
        ref = record["id"]
        number = record["pinyinNumber"]
        if not re.fullmatch(r"[a-zv1-5 ]+", number):
            invalid.append(ref)
        syllables = number.split()
        han_count = len(HAN_RE.findall(record["simplified"]))
        if han_count and not syllables:
            invalid.append(ref)
        tones.update(char for char in number if char in "12345")
    if invalid:
        raise RuntimeError(f"Invalid normalized pinyin records: {invalid[:20]}")
    characters = read_json(HSK4 / "characters.json")["records"]
    if len(characters) != 150 or any(record.get("strokeCount", 0) <= 1 for record in characters):
        raise RuntimeError("HSK4 character metadata still contains placeholder stroke counts")
    if not all(tones[str(number)] for number in range(1, 6)):
        raise RuntimeError(f"Unexpected HSK4 tone distribution: {dict(tones)}")


def main() -> None:
    patch_builder_note()
    vocabulary = load_vocabulary()
    pronunciations = build_pronunciations(vocabulary)
    patch_json_pronunciations(pronunciations)
    vocabulary = load_vocabulary()
    rebuild_characters(vocabulary)
    verify(vocabulary)
    print(
        json.dumps(
            {"ok": True, "pinyinNormalized": len(vocabulary), "charactersWithBundledStrokeCount": 150},
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
