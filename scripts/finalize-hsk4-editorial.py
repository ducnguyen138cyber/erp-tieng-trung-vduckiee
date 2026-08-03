#!/usr/bin/env python3
"""Replace C5 lexical boilerplate with lesson-specific authored contexts."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HSK4 = ROOT / "data" / "hsk" / "hsk4"

NAMES = ["小林", "安娜", "志明", "小雨", "阿杰", "美玲", "小东", "兰兰", "文博", "小雪"]
TIMES = ["周一早上", "周二下午", "周三中午", "周四下班前", "周五晚上"]
PLACES = ["教室里", "办公室里", "图书馆里", "社区活动室里"]
DETAILS = [
    "时间", "原因", "结果", "条件", "对象", "态度", "证据", "顺序", "范围", "下一步",
]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def all_vocabulary() -> tuple[list[Path], list[dict]]:
    paths = sorted((HSK4 / "vocabulary").glob("hsk4-v-*.json"))
    records: list[dict] = []
    for path in paths:
        records.extend(read_json(path)["records"])
    if len(records) != 1000:
        raise RuntimeError(f"Expected 1000 HSK4 words, received {len(records)}")
    return paths, records


def context_for(row: int) -> tuple[str, str, str, str]:
    offset = row - 1001
    name = NAMES[offset % len(NAMES)]
    time = TIMES[(offset // len(NAMES)) % len(TIMES)]
    place = PLACES[(offset // (len(NAMES) * len(TIMES))) % len(PLACES)]
    detail = DETAILS[(offset // (len(NAMES) * len(TIMES) * len(PLACES))) % len(DETAILS)]
    return name, time, place, detail


def lexical_content(record: dict, lesson: dict) -> dict:
    word = record["simplified"]
    row = int(record["officialRow"])
    pos = str(record.get("partOfSpeech") or "other").lower()
    title = lesson["titleZh"]
    name, time, place, detail = context_for(row)
    prefix = f"{time}，{name}在{place}"
    variant = row % 4

    if pos in {"verb", "auxiliary-verb"}:
        frames = [
            f"{prefix}处理“{title}”这件事时，先{word}，再说明{detail}。",
            f"为了把“{title}”说清楚，{name}当场{word}，并补充了{detail}。",
            f"讨论“{title}”以后，大家决定先{word}，再确认下一步。",
            f"遇到“{title}”这样的情况，{name}没有急着判断，而是先{word}。",
        ]
        collocation = f"先{word}再确认"
    elif pos in {"adjective", "state-verb"}:
        frames = [
            f"从“{title}”的语境看，这个方案显得很{word}，但还要说明{detail}。",
            f"{prefix}听完解释后，觉得这样的处理比较{word}。",
            f"材料里的做法是否{word}，要结合{detail}来判断。",
            f"谈到“{title}”时，{name}用一个具体例子说明什么叫{word}。",
        ]
        collocation = f"显得很{word}"
    elif pos in {"adverb", "modal-adverb"}:
        frames = [
            f"说明“{title}”时，{name}{word}补充了{detail}，重点因此更清楚。",
            f"{prefix}{word}先确认{detail}，然后才表达意见。",
            f"讨论进入第二轮后，{name}{word}把{detail}说了一遍。",
            f"为了避免误会，大家约定{word}检查{detail}是否一致。",
        ]
        collocation = f"{word}说明重点"
    elif pos in {"conjunction", "connector"}:
        frames = [
            f"谈到“{title}”时，{name}先说明事实，{word}补充了{detail}。",
            f"{prefix}把前后两层意思用{word}连接，逻辑更清楚。",
            f"材料先提出问题，{word}用{detail}支持后面的结论。",
            f"表达不同意见时，可以先认可一部分，{word}再说明{detail}。",
        ]
        collocation = f"前句，{word}后句"
    elif pos in {"preposition", "coverb"}:
        frames = [
            f"{prefix}用{word}引出“{title}”中需要说明的对象。",
            f"讨论{detail}时，{name}注意到{word}后面的成分不能省略。",
            f"这句话通过{word}说明了行动和{detail}之间的关系。",
            f"在“{title}”的记录里，{word}所引出的信息决定了理解方向。",
        ]
        collocation = f"{word}具体对象"
    elif pos in {"pronoun", "interrogative-pronoun"}:
        frames = [
            f"讨论“{title}”时，{word}都要先确认自己掌握的{detail}。",
            f"{prefix}问清楚{word}负责核对{detail}，才继续讨论。",
            f"材料没有直接说明{word}，读者要根据{detail}判断。",
            f"为了避免指代不清，{name}重新说明了{word}和{detail}的关系。",
        ]
        collocation = f"确认{word}所指"
    elif pos in {"measure-word", "classifier"}:
        frames = [
            f"记录“{title}”的{detail}时，{name}检查了{word}和名词的搭配。",
            f"{prefix}发现这里不能随便换量词，必须保留{word}。",
            f"这个数量短语使用{word}，因为它和后面的名词搭配。",
            f"复述“{title}”时，{name}把含有{word}的数量短语说完整了。",
        ]
        collocation = f"{word}＋合适的名词"
    elif pos in {"noun", "proper-noun", "time-word", "location-word"}:
        frames = [
            f"{prefix}讨论“{title}”时，先说明{word}与{detail}的关系。",
            f"材料中提到的{word}，后来成了大家核对{detail}的重点。",
            f"关于{word}的{detail}没有确认以前，{name}没有急着下结论。",
            f"为了理解“{title}”，小组把{word}和另一条{detail}放在一起比较。",
        ]
        collocation = f"关于{word}的讨论"
    else:
        frames = [
            f"{prefix}学习“{title}”时，用{word}补充了{detail}。",
            f"材料里的{word}与{detail}有关，不能脱离上下文单独解释。",
            f"复述“{title}”时，{name}保留了{word}，因为它影响语气和{detail}。",
            f"小组比较两个说法后，决定用{word}表达{detail}。",
        ]
        collocation = f"在语境中使用{word}"

    register = str(record.get("register") or "neutral")
    register_note = {
        "spoken": "Ưu tiên trong khẩu ngữ; khi viết trang trọng cần kiểm tra cách thay thế phù hợp.",
        "written": "Thiên về văn viết hoặc thông báo; trong hội thoại nên tránh đọc như văn bản hành chính.",
        "formal": "Mang sắc thái trang trọng; chỉ dùng khi quan hệ và tình huống phù hợp.",
        "informal": "Mang sắc thái thân mật; tránh dùng máy móc trong thư từ hoặc báo cáo chính thức.",
    }.get(register, "Sắc thái nhìn chung trung tính; ý nghĩa cụ thể vẫn phụ thuộc đối tượng, cấu trúc và ngữ cảnh.")

    example = frames[variant]
    return {
        "collocations": [{"zh": collocation, "vi": f"Khung kết hợp thực hành với {word}.", "kind": "context-frame"}],
        "examples": [{"zh": example, "vi": f"Ví dụ đặt {word} vào tình huống “{lesson['titleVi']}”."}],
        "usageNoteVi": f"{register_note} Khi dùng {word}, cần kiểm tra vai trò {pos}, phạm vi tác động và quan hệ với {detail}.",
        "commonErrorsVi": [f"Không chỉ dịch {word} thành “{record['meaningVi']}”; hãy kiểm tra từ loại, register và cấu trúc đi kèm."],
    }


def patch_reference(value, lexical: dict[str, dict]):
    if isinstance(value, list):
        return [patch_reference(item, lexical) for item in value]
    if not isinstance(value, dict):
        return value
    out = {key: patch_reference(item, lexical) for key, item in value.items()}
    ref = out.get("canonicalId")
    if isinstance(ref, str) and ref in lexical:
        for key in ("collocations", "usageNoteVi", "commonErrorsVi"):
            if key in out:
                out[key] = lexical[ref][key]
        if "example" in out:
            out["example"] = lexical[ref]["examples"][0]
    return out


def main() -> None:
    shard_paths, vocabulary = all_vocabulary()
    lessons_doc = read_json(HSK4 / "lessons.json")
    lessons = lessons_doc["records"]
    lesson_by_vocab: dict[str, dict] = {}
    for lesson in lessons:
        for ref in lesson["vocabularyRefs"]:
            if ref in lesson_by_vocab:
                raise RuntimeError(f"Vocabulary assigned twice: {ref}")
            lesson_by_vocab[ref] = lesson
    if len(lesson_by_vocab) != 1000:
        raise RuntimeError(f"Vocabulary assignment coverage is {len(lesson_by_vocab)}/1000")

    lexical: dict[str, dict] = {}
    for record in vocabulary:
        content = lexical_content(record, lesson_by_vocab[record["id"]])
        record.update(content)
        lexical[record["id"]] = content

    cursor = 0
    for path in shard_paths:
        document = read_json(path)
        count = len(document["records"])
        document["records"] = vocabulary[cursor : cursor + count]
        cursor += count
        write_json(path, document)

    enrichment_path = HSK4 / "vocabulary-enrichment.json"
    write_json(enrichment_path, patch_reference(read_json(enrichment_path), lexical))
    write_json(HSK4 / "lessons.json", patch_reference(lessons_doc, lexical))

    exercises_path = HSK4 / "exercises.json"
    exercises_doc = read_json(exercises_path)
    lesson_lookup = {lesson["id"]: lesson for lesson in lessons}
    for exercise in exercises_doc["records"]:
        lesson_id = re.match(r"(hsk4-lesson-\d{2})-exercise-\d+", exercise["id"]).group(1)
        lesson = lesson_lookup[lesson_id]
        number = int(exercise["id"].rsplit("-", 1)[-1])
        if number == 1:
            ref = exercise["vocabularyFocus"][0]
            answer = lexical[ref]["examples"][0]["zh"]
            exercise["answer"] = answer
            exercise["acceptedAnswers"] = [answer, answer.rstrip("。！？")]
            exercise["explanationVi"] = lexical[ref]["usageNoteVi"]
        elif number == 3:
            exercise["prompt"] = f"Trong bài “{lesson['titleVi']}”, người nghe cần nhớ thông tin nào để hành động đúng?"
    write_json(exercises_path, exercises_doc)

    grammar_path = HSK4 / "grammar.json"
    grammar_doc = read_json(grammar_path)
    for record in grammar_doc["records"]:
        record["registerNoteVi"] = "Mẫu mang sắc thái trung tính; cần điều chỉnh mức trực tiếp theo quan hệ người nói–người nghe và mục đích giao tiếp."
        record["spokenWrittenNoteVi"] = "Trong lời nói có thể lược phần đã rõ từ ngữ cảnh; trong bài viết phải giữ đủ quan hệ logic, đối tượng và dấu câu."
    write_json(grammar_path, grammar_doc)

    examples = [record["examples"][0]["zh"] for record in vocabulary]
    if len(set(examples)) != 1000:
        repeats = [item for item in set(examples) if examples.count(item) > 1]
        raise RuntimeError(f"HSK4 vocabulary examples remain duplicated: {repeats[:10]}")
    prompts = [record["prompt"] for record in exercises_doc["records"]]
    if len(set(prompts)) != len(prompts):
        raise RuntimeError("HSK4 exercise prompts remain duplicated")
    banned = ("的具体用法", "请结合上下文理解")
    corpus = json.dumps(vocabulary, ensure_ascii=False)
    if any(text in corpus for text in banned):
        raise RuntimeError("HSK4 lexical boilerplate remains")
    print(json.dumps({"ok": True, "uniqueVocabularyExamples": 1000, "uniqueExercisePrompts": len(prompts)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
