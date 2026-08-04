#!/usr/bin/env python3
"""Finalize deterministic HSK4 C5 pronunciation and character metadata."""
from __future__ import annotations

import io
import itertools
import json
import re
import subprocess
import unicodedata
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path

from pypinyin import Style, lazy_pinyin, pinyin as character_pinyin

ROOT = Path(__file__).resolve().parents[1]
HSK4 = ROOT / "data" / "hsk" / "hsk4"
BUILDER = ROOT / "scripts" / "build-hsk4-c5.py"
HAN_RE = re.compile(r"[\u3400-\u9fff]")
UNIHAN_URL = "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip"
TONE_MARKS = {
    "\u0304": "1",
    "\u0301": "2",
    "\u030c": "3",
    "\u0300": "4",
}

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


def ascii_base(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value.lower().replace("ü", "v"))
    return re.sub(r"[^a-zv]", "", decomposed)


def split_accented(value: str, lengths: list[int]) -> list[str]:
    chars = list(value)
    output: list[str] = []
    start = 0
    base_count = 0
    target_index = 0
    for index, character in enumerate(chars):
        if ascii_base(character):
            base_count += 1
        if target_index < len(lengths) and base_count == sum(lengths[: target_index + 1]):
            end = index + 1
            while end < len(chars) and unicodedata.combining(chars[end]):
                end += 1
            output.append("".join(chars[start:end]))
            start = end
            target_index += 1
    if target_index != len(lengths) or start != len(chars):
        return []
    return output


def pronunciation_options(word: str) -> list[list[str]]:
    rows = character_pinyin(word, style=Style.NORMAL, heteronym=True, strict=False, errors="default")
    options: list[list[str]] = []
    for row in rows:
        cleaned = sorted({ascii_base(item) for item in row if ascii_base(item)})
        options.append(cleaned or [""])
    return options


def official_syllables(word: str, raw: str) -> list[str]:
    cleaned = re.sub(r"[’']", " ", str(raw or "").split("/", 1)[0]).strip().lower()
    compact = re.sub(r"\s+", "", cleaned)
    target = ascii_base(compact)
    options = pronunciation_options(word)
    chosen: tuple[str, ...] | None = None
    # HSK4 headwords are short; bound the search while preserving official polyphonic readings.
    if len(options) <= 8:
        for candidate in itertools.product(*options):
            if "".join(candidate) == target:
                chosen = candidate
                break
    if chosen:
        segmented = split_accented(compact, [len(item) for item in chosen])
        if segmented:
            return segmented
    existing = [item for item in re.split(r"\s+", cleaned) if item]
    if len(existing) > 1 and all(ascii_base(item) for item in existing):
        # Repair accidental spaces inside one syllable, e.g. gā n cuì -> gān cuì.
        merged: list[str] = []
        index = 0
        while index < len(existing):
            if index + 1 < len(existing) and len(ascii_base(existing[index + 1])) == 1:
                merged.append(existing[index] + existing[index + 1])
                index += 2
            else:
                merged.append(existing[index])
                index += 1
        return merged
    return existing or [cleaned or "a"]


def numbered_syllable(value: str) -> str:
    tone = "5"
    bases: list[str] = []
    decomposed = unicodedata.normalize("NFD", value.lower().replace("ü", "v"))
    for character in decomposed:
        if character in TONE_MARKS:
            tone = TONE_MARKS[character]
        elif character in "abcdefghijklmnopqrstuvwxyzv":
            bases.append(character)
    base = "".join(bases)
    return f"{base}{tone}" if base else "a5"


def official_pronunciation(word: str, raw: str) -> dict[str, str]:
    syllables = official_syllables(word, raw)
    tone = " ".join(syllables)
    number = " ".join(numbered_syllable(item) for item in syllables)
    return {
        "tone": tone,
        "number": number,
        "normalized": re.sub(r"[^a-zv]", "", number),
    }


def load_vocabulary() -> list[dict]:
    records: list[dict] = []
    for path in sorted((HSK4 / "vocabulary").glob("hsk4-v-*.json")):
        records.extend(read_json(path)["records"])
    if len(records) != 1000:
        raise RuntimeError(f"HSK4 must contain 1000 vocabulary records, received {len(records)}")
    return records


def source_pronunciations() -> dict[str, dict[str, str]]:
    document = read_json(HSK4 / "provenance" / "official-vocabulary.json")
    facts = document.get("facts", [])
    if len(facts) != 1000:
        raise RuntimeError(f"HSK4 provenance must contain 1000 rows, received {len(facts)}")
    result: dict[str, dict[str, str]] = {}
    for fact in facts:
        row = int(fact["officialRow"])
        ref = f"hsk4-v-{row - 1000:04d}"
        result[ref] = official_pronunciation(fact["simplified"], fact["pinyin"])
    return result


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


def unihan_stroke_counts(characters: list[str]) -> dict[str, int]:
    wanted = {ord(character) for character in characters}
    request = urllib.request.Request(UNIHAN_URL, headers={"User-Agent": "VDuckie-HSK4-C5/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))
    result: dict[str, int] = {}
    for name in archive.namelist():
        if not name.endswith(".txt"):
            continue
        for raw in archive.read(name).decode("utf-8").splitlines():
            if "\tkTotalStrokes\t" not in raw:
                continue
            codepoint, _, values = raw.split("\t", 2)
            number = int(codepoint[2:], 16)
            if number not in wanted:
                continue
            match = re.search(r"\d+", values)
            if match:
                result[chr(number)] = int(match.group())
        if len(result) == len(wanted):
            break
    return result


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

    bundled = bundled_stroke_counts(ordered)
    unihan = unihan_stroke_counts(ordered)
    counts = {**unihan, **bundled}
    selected = [character for character in ordered if character in counts][:150]
    if len(selected) != 150:
        raise RuntimeError(f"HSK4 character focus needs 150 verified stroke counts, received {len(selected)}")

    records: list[dict] = []
    for index, character in enumerate(selected, start=1):
        radical = radical_for(character)
        word_refs = [word["id"] for word in vocabulary if character in word["simplified"]]
        has_vector = character in bundled
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
                "readings": [" ".join(lazy_pinyin(character, style=Style.TONE, strict=False))],
                "wordRefs": word_refs,
                "confusables": [],
                "strokeCount": counts[character],
                "strokeCountSource": "bundled-static-vector-count" if has_vector else "unicode-unihan-17-kTotalStrokes",
                "mnemonic": {"type": "memory-aid-not-etymology", "noteVi": note},
                "knowledgeStatus": "new",
                "strokeOrderStatus": "static-fallback" if has_vector else "unavailable",
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
    marker = "# Finalize with scripts/finalize-hsk4-c5.py to preserve official pinyin and verified stroke metadata.\n"
    if marker not in text:
        text = text.replace("from __future__ import annotations\n", "from __future__ import annotations\n\n" + marker, 1)
    BUILDER.write_text(text, encoding="utf-8")


def verify(vocabulary: list[dict], pronunciations: dict[str, dict[str, str]]) -> None:
    invalid: list[str] = []
    tones: Counter[str] = Counter()
    for record in vocabulary:
        ref = record["id"]
        expected = pronunciations[ref]
        if record["pinyinTone"] != expected["tone"] or record["pinyinNumber"] != expected["number"]:
            invalid.append(ref)
        if not re.fullmatch(r"[a-zv1-5 ]+", record["pinyinNumber"]):
            invalid.append(ref)
        tones.update(character for character in record["pinyinNumber"] if character in "12345")
    if invalid:
        raise RuntimeError(f"Invalid official pinyin normalization: {sorted(set(invalid))[:20]}")
    characters = read_json(HSK4 / "characters.json")["records"]
    if len(characters) != 150:
        raise RuntimeError(f"HSK4 character count must be 150, received {len(characters)}")
    if any(not (1 <= record.get("strokeCount", 0) <= 64) for record in characters):
        raise RuntimeError("HSK4 character metadata contains an invalid stroke count")
    if any(record.get("strokeCountSource") == "builder-placeholder" for record in characters):
        raise RuntimeError("HSK4 character metadata still contains builder placeholders")
    if not all(tones[str(number)] for number in range(1, 6)):
        raise RuntimeError(f"Unexpected HSK4 tone distribution: {dict(tones)}")


def main() -> None:
    patch_builder_note()
    pronunciations = source_pronunciations()
    patch_json_pronunciations(pronunciations)
    vocabulary = load_vocabulary()
    rebuild_characters(vocabulary)
    verify(vocabulary, pronunciations)
    print(
        json.dumps(
            {
                "ok": True,
                "officialPinyinPreserved": len(vocabulary),
                "charactersWithVerifiedStrokeCount": 150,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
