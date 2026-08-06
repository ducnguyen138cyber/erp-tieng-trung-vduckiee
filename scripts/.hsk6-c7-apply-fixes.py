#!/usr/bin/env python3
"""Apply the reviewed Phase C7 fixes to the recovered deterministic HSK6 builder."""
from pathlib import Path

path = Path("scripts/build-hsk6-c7.py")
text = path.read_text(encoding="utf-8")

exact = [
    (
        '        number = pinyin_number_from_tone(tone, simplified)\n        pos = parse_pos(rich.get("pos", ""))',
        '        number = pinyin_number_from_tone(tone, simplified)\n        if official_headword == "凡（是）":\n            tone = "fán shì"\n            number = "fan2 shi4"\n        pos = parse_pos(rich.get("pos", ""))',
    ),
    (
        '        meaning = clean_meaning(dictionary["senses"]) if dictionary else ""\n        if not meaning:',
        '        meaning = clean_meaning(dictionary["senses"]) if dictionary else ""\n        meaning = {\n            "凡（是）": "hễ là; tất cả những trường hợp thuộc phạm vi đã nêu",\n            "新媒体": "truyền thông mới; các nền tảng truyền thông số tương tác",\n            "新能源": "năng lượng mới; nguồn năng lượng thay thế ít phụ thuộc nhiên liệu hóa thạch",\n        }.get(official_headword, meaning)\n        if not meaning:',
    ),
    (
        '{"sourceId": CVDICT, "fields": ["traditional", "meaningVi"], "locator": item["simplified"]},',
        '{"sourceId": CVDICT, "fields": ["traditional", "meaningVi"], "locator": f"CVDICT entry {item[\'simplified\']}"},',
    ),
    (
        '            "order": lesson_idx + 1, "topic": unit[1], "titleZh": title_zh, "titleVi": title_vi,',
        '            "order": local + 1, "topic": unit[1], "titleZh": title_zh, "titleVi": title_vi,',
    ),
    (
        'item["simplified"], unit[2][local], item["officialRow"] - 3600)',
        'item["simplified"], unit[3][local], item["officialRow"] - 3600)',
    ),
    (
        '        context_zh = unit[6]\n        evidence_zh = unit[7]\n        title_zh, title_vi = unit[2][local], unit[3][local]',
        '        title_zh, title_vi = unit[3][local], unit[4][local]\n        context_zh = "相关受众和决策者"\n        evidence_zh = f"围绕“{title_zh}”整理的材料、数据和访谈"',
    ),
    (
        'f"Tạo một bản brief một trang cho {unit[6]}, có bảng nguồn, kết luận tạm thời và mốc复核。"',
        'f"Tạo một bản brief một trang về “{title_vi}” cho {unit[6]}, có bảng nguồn, kết luận tạm thời và mốc复核。"',
    ),
]

for old, new in exact:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one patch target, got {count}: {old[:100]}")
    text = text.replace(old, new)

for old, new in [
    ("điểm cần复核。", "điểm cần kiểm tra lại."),
    ("mốc复核。", "mốc kiểm tra lại."),
    ("–复核。", "– kiểm tra lại."),
]:
    if old not in text:
        raise SystemExit(f"Missing editorial target: {old}")
    text = text.replace(old, new)

for old in [
    '"reviewStatus": "linguistic-reviewed"',
    '"reviewStatus": "pedagogy-reviewed"',
    '"reviewStatus": "blueprint-reviewed"',
]:
    if old not in text:
        raise SystemExit(f"Missing review-status target: {old}")
    text = text.replace(old, '"reviewStatus": "unreviewed"')

lines = text.splitlines()
needle = '    runtime_text = runtime.read_text(encoding="utf-8")'
if lines.count(needle) != 1:
    raise SystemExit(f"Runtime generator anchor mismatch: {lines.count(needle)}")
index = lines.index(needle) + 1
lines[index:index] = [
    "    runtime_text = runtime_text.replace(",
    "        \"    var html = '';\\n    data.units.forEach\",",
    "        \"    var html = '';\\n    var midpointId = 'hsk' + state.selectedLevel + '-assessment-midpoint';\\n    data.units.forEach\")",
    "    runtime_text = runtime_text.replace(",
    "        \"      var midpointId = 'hsk' + state.selectedLevel + '-assessment-midpoint';\\n      if (Number(unit.order)\",",
    "        \"      if (Number(unit.order)\")",
]

path.write_text("\n".join(lines) + "\n", encoding="utf-8")
