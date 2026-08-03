import json
import os
import re
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXERCISES = json.loads((ROOT / "data/hsk/hsk3/exercises.json").read_text(encoding="utf-8"))["records"]
CHROMIUM = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
if not CHROMIUM:
    raise SystemExit("Chromium executable not found")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return


server = ThreadingHTTPServer(
    ("127.0.0.1", 0),
    lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs),
)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
BASE = f"http://127.0.0.1:{server.server_port}/"

SPECS = [
    {"name": "desktop-1440", "width": 1440, "height": 900, "lesson": "hsk3-lesson-01", "mobile": False},
    {"name": "desktop-1024", "width": 1024, "height": 768, "lesson": "hsk3-lesson-18", "mobile": False},
    {"name": "mobile-390", "width": 390, "height": 844, "lesson": "hsk3-lesson-19", "mobile": True},
    {"name": "mobile-320", "width": 320, "height": 568, "lesson": "hsk3-lesson-36", "mobile": True},
]

EXPECTED = {
    "units": 12,
    "lessons": 36,
    "grammar": 42,
    "characters": 100,
    "exercises": 252,
    "assessments": 15,
    "vocabulary": 500,
}
HEADINGS = [
    "Từ vựng mới trong ngữ cảnh",
    "Chữ Hán trọng tâm",
    "Ngữ pháp để diễn đạt theo đoạn",
    "Hội thoại có mục tiêu",
    "Đọc hiểu và giải thích",
    "Nghe, chép chính tả và shadowing",
    "Phát âm cho người Việt",
    "Ghi chú văn hoá và ứng xử",
    "Nói, viết và dùng thật",
    "Ôn cách quãng",
    "Bài tập của lesson",
]

result = {
    "base": BASE,
    "viewports": {},
    "flows": {
        "firstMiddleLastLessons": "pending",
        "allLessonSections": "pending",
        "exerciseAnswerAndExplanation": "pending",
        "previousNextNavigation": "pending",
        "unitCheckpoint": "pending",
        "midpoint": "pending",
        "final": "pending",
        "mastery": "pending",
        "hsk2SwitchRegression": "pending",
        "hsk1SwitchRegression": "pending",
        "reload": "pending",
        "directUrl": "pending",
        "mobileTouchControls": "pending",
    },
    "consoleErrors": [],
    "requestFailures": [],
}


def wait_ready(page, level):
    page.wait_for_function(
        """expected => {
          if (!document.body || document.body.getAttribute('data-hsk-prof-ready') !== 'true' || !window.VDuckieHskProfessionalRuntime) return false;
          const state = window.VDuckieHskProfessionalRuntime.getState();
          return state.status === 'ready' && state.selectedLevel === expected && state.counts;
        }""",
        arg=level,
        timeout=30000,
    )
    return page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")


def layout_metrics(page):
    return page.evaluate(
        """() => {
          const viewport = window.innerWidth;
          const chinese = [...document.querySelectorAll('#hskLesson [lang="zh-CN"]')]
            .filter(node => node.getBoundingClientRect().height > 0);
          const buttons = [...document.querySelectorAll('#hskLesson button:not([disabled])')]
            .filter(node => node.getBoundingClientRect().height > 0);
          const rail = document.getElementById('hskLevels');
          return {
            overflow: document.documentElement.scrollWidth - viewport,
            levelRailOverflow: rail ? Math.max(0, rail.scrollWidth - rail.clientWidth) : 0,
            minChineseFont: chinese.length ? Math.min(...chinese.map(node => parseFloat(getComputedStyle(node).fontSize) || 0)) : 0,
            minButtonHeight: buttons.length ? Math.min(...buttons.map(node => node.getBoundingClientRect().height)) : 0,
            widest: [...document.querySelectorAll('body *')].map(node => {
              const rect = node.getBoundingClientRect();
              return {
                tag: node.tagName,
                id: node.id || '',
                className: typeof node.className === 'string' ? node.className.slice(0, 100) : '',
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                scrollWidth: Math.round(node.scrollWidth || 0)
              };
            }).filter(item => item.right > viewport + 2 || item.width > viewport + 2).slice(0, 10)
          };
        }"""
    )


def assert_hsk3(page, state):
    assert state["readOnly"] is True, state
    assert state["progressWritesEnabled"] is False, state
    assert state["selectedLevel"] == 3, state
    for key, value in EXPECTED.items():
        assert state["counts"][key] == value, (key, state["counts"][key], value)
    page.get_by_text("HSK 3 Professional · C4 learner-facing", exact=True).first.wait_for()
    selector = page.locator('[data-pro-level="3"]')
    assert selector.count() == 1
    assert not selector.is_disabled()
    assert page.locator(".hsk-pro-unit").count() == 12
    assert page.locator("[data-pro-lesson]").count() == 36
    assert page.locator("[data-pro-assessment]").count() == 15
    for heading in HEADINGS:
        page.locator("#hskLesson").get_by_text(heading, exact=True).wait_for()


def tap_or_click(locator, mobile):
    if mobile:
        locator.tap()
    else:
        locator.click()


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROMIUM,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        for spec in SPECS:
            context = browser.new_context(
                viewport={"width": spec["width"], "height": spec["height"]},
                is_mobile=spec["mobile"],
                has_touch=spec["mobile"],
                device_scale_factor=1,
            )
            page = context.new_page()
            page.on(
                "console",
                lambda message, name=spec["name"]: result["consoleErrors"].append(f"{name}: {message.text}")
                if message.type == "error"
                else None,
            )
            page.on(
                "requestfailed",
                lambda request, name=spec["name"]: result["requestFailures"].append(
                    f"{name}: {request.url} — {request.failure or 'unknown'}"
                ),
            )
            direct_url = f"{BASE}?area=hsk&hskLevel=3&hskLesson={spec['lesson']}"
            page.goto(direct_url, wait_until="domcontentloaded", timeout=40000)
            state = wait_ready(page, 3)
            assert_hsk3(page, state)
            lesson_number = int(spec["lesson"][-2:])
            page.locator("#hskLesson").get_by_text(
                re.compile(rf"BÀI\s+{lesson_number}\s+/\s+36", re.I)
            ).first.wait_for()

            metrics = layout_metrics(page)
            assert metrics["overflow"] <= 2, (spec["name"], metrics)
            assert metrics["levelRailOverflow"] <= 2, (spec["name"], metrics)
            if spec["mobile"]:
                assert not metrics["minButtonHeight"] or metrics["minButtonHeight"] >= 40, metrics
                assert not metrics["minChineseFont"] or metrics["minChineseFont"] >= 12, metrics

            result["viewports"][spec["name"]] = {
                "width": spec["width"],
                "height": spec["height"],
                "lessonId": spec["lesson"],
                "state": state,
                "metrics": metrics,
                "url": page.url,
            }
            page.screenshot(path=f"/tmp/hsk3-c4-{spec['name']}.png", full_page=True)

            if spec["name"] == "desktop-1440":
                page.locator('[data-pro-lesson="hsk3-lesson-02"]').click()
                page.locator("#hskLesson").get_by_text("Nói rõ một sự việc", exact=True).wait_for()
                page.locator("#hskLesson").get_by_text("Lượng từ khi đếm:", exact=True).first.wait_for()
                page.locator("#hskLesson").get_by_text("Cách dùng:", exact=True).first.wait_for()
                page.locator("#hskLesson").get_by_text("Mẫu dùng tự nhiên", exact=True).first.wait_for()
                page.locator("#hskLesson").get_by_text("Lỗi dễ mắc", exact=True).first.wait_for()
                page.locator("[data-pro-prev]").click()
                page.locator("#hskLesson").get_by_text("Từ một câu đến một đoạn", exact=True).wait_for()
                result["flows"]["previousNextNavigation"] = "pass"

                first = next(item for item in EXERCISES if item["id"] == "hsk3-lesson-01-exercise-1")
                card = page.locator(f'[data-pro-exercise="{first["id"]}"]')
                card.locator(f'[data-pro-input-for="{first["id"]}"]').fill(first["acceptedAnswers"][0])
                card.locator(f'[data-pro-check="{first["id"]}"]').click()
                card.get_by_text("Đúng.", exact=True).wait_for()
                result["flows"]["exerciseAnswerAndExplanation"] = "pass"

                for assessment_id, pattern, flow_key in [
                    ("hsk3-assessment-unit-01", r"Checkpoint Unit 1", "unitCheckpoint"),
                    ("hsk3-assessment-midpoint", r"Midpoint", "midpoint"),
                    ("hsk3-assessment-final", r"Final Assessment", "final"),
                    ("hsk3-assessment-mastery", r"Mastery Review", "mastery"),
                ]:
                    page.locator(f'[data-pro-assessment="{assessment_id}"]').click()
                    page.locator("#hskLesson").get_by_text(re.compile(pattern, re.I)).wait_for()
                    result["flows"][flow_key] = "pass"

                page.locator('[data-pro-level="2"]').click()
                hsk2 = wait_ready(page, 2)
                assert hsk2["counts"]["lessons"] == 28 and hsk2["counts"]["vocabulary"] == 200, hsk2
                result["flows"]["hsk2SwitchRegression"] = "pass"

                page.locator('[data-pro-level="1"]').click()
                hsk1 = wait_ready(page, 1)
                assert hsk1["counts"]["lessons"] == 24 and hsk1["counts"]["vocabulary"] == 300, hsk1
                result["flows"]["hsk1SwitchRegression"] = "pass"

                page.goto(f"{BASE}?area=hsk&hskLesson=hsk3-lesson-36", wait_until="domcontentloaded")
                direct_state = wait_ready(page, 3)
                assert direct_state["selectedLessonId"] == "hsk3-lesson-36", direct_state
                result["flows"]["directUrl"] = "pass"
                page.reload(wait_until="domcontentloaded")
                reload_state = wait_ready(page, 3)
                assert reload_state["selectedLessonId"] == "hsk3-lesson-36", reload_state
                result["flows"]["reload"] = "pass"

            if spec["mobile"]:
                if spec["lesson"] != "hsk3-lesson-36":
                    tap_or_click(page.locator("[data-pro-next]"), True)
                    next_state = page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")
                    assert next_state["selectedLessonId"] != spec["lesson"], next_state
                    tap_or_click(page.locator("[data-pro-prev]"), True)
                    original_state = page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")
                    assert original_state["selectedLessonId"] == spec["lesson"], original_state
                else:
                    tap_or_click(page.locator("[data-pro-prev]"), True)
                    previous_state = page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")
                    assert previous_state["selectedLessonId"] == "hsk3-lesson-35", previous_state
                result["flows"]["mobileTouchControls"] = "pass"

            page.close()
            context.close()

        result["flows"]["firstMiddleLastLessons"] = "pass"
        result["flows"]["allLessonSections"] = "pass"
        unexpected_failures = [
            entry
            for entry in result["requestFailures"]
            if "cdn.jsdelivr.net/npm/@supabase/" not in entry and "/api/community-terms" not in entry
        ]
        unexpected_console = [
            entry
            for entry in result["consoleErrors"]
            if not entry.endswith("Failed to load resource: net::ERR_EMPTY_RESPONSE")
        ]
        assert not unexpected_console and not unexpected_failures, {
            "console": unexpected_console,
            "requests": unexpected_failures,
        }
        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(json.dumps(result, ensure_ascii=False))
