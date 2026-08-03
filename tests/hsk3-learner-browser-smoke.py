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
    def log_message(self, _format, *_args):
        return


server = ThreadingHTTPServer(
    ("127.0.0.1", 0),
    lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs),
)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_port}/"
SPECS = [
    ("desktop-1440", 1440, 900, "hsk3-lesson-01", False),
    ("desktop-1024", 1024, 768, "hsk3-lesson-18", False),
    ("mobile-390", 390, 844, "hsk3-lesson-19", True),
    ("mobile-320", 320, 568, "hsk3-lesson-36", True),
]
EXPECTED = {"units": 12, "lessons": 36, "grammar": 42, "characters": 100, "exercises": 252, "assessments": 15, "vocabulary": 500}
HEADINGS = [
    "Từ vựng mới trong ngữ cảnh", "Chữ Hán trọng tâm", "Ngữ pháp để diễn đạt theo đoạn",
    "Hội thoại có mục tiêu", "Đọc hiểu và giải thích", "Nghe, chép chính tả và shadowing",
    "Phát âm cho người Việt", "Ghi chú văn hoá và ứng xử", "Nói, viết và dùng thật",
    "Ôn cách quãng", "Bài tập của lesson",
]
result = {
    "viewports": {},
    "flows": {key: "pending" for key in [
        "firstMiddleLastLessons", "allLessonSections", "exerciseAnswerAndExplanation",
        "previousNextNavigation", "unitCheckpoint", "midpoint", "final", "mastery",
        "hsk2SwitchRegression", "hsk1SwitchRegression", "reload", "directUrl",
        "mobileTouchControls",
    ]},
    "consoleErrors": [],
    "requestFailures": [],
    "httpErrors": [],
}


def wait_ready(page, level):
    page.wait_for_function(
        """expected => {
          if (!document.body || document.body.dataset.hskProfReady !== 'true' || !window.VDuckieHskProfessionalRuntime) return false;
          const state = window.VDuckieHskProfessionalRuntime.getState();
          return state.status === 'ready' && state.selectedLevel === expected && state.counts;
        }""",
        arg=level,
        timeout=30000,
    )
    return page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")


def metrics(page):
    return page.evaluate("""() => {
      const chinese=[...document.querySelectorAll('#hskLesson [lang="zh-CN"]')].filter(n=>n.getBoundingClientRect().height>0);
      const buttons=[...document.querySelectorAll('#hskLesson button:not([disabled])')].filter(n=>n.getBoundingClientRect().height>0);
      const rail=document.getElementById('hskLevels');
      return {
        overflow:document.documentElement.scrollWidth-innerWidth,
        levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0,
        minChineseFont:chinese.length?Math.min(...chinese.map(n=>parseFloat(getComputedStyle(n).fontSize)||0)):0,
        minButtonHeight:buttons.length?Math.min(...buttons.map(n=>n.getBoundingClientRect().height)):0
      };
    }""")


def assert_course(page, state):
    assert state["selectedLevel"] == 3 and state["readOnly"] is True and state["progressWritesEnabled"] is False, state
    for key, value in EXPECTED.items():
        assert state["counts"][key] == value, (key, state["counts"])
    page.get_by_text("HSK 3 Professional · C4 learner-facing", exact=True).first.wait_for()
    assert page.locator('[data-pro-level="3"]').count() == 1
    assert not page.locator('[data-pro-level="3"]').is_disabled()
    assert page.locator(".hsk-pro-unit").count() == 12
    assert page.locator("[data-pro-lesson]").count() == 36
    assert page.locator("[data-pro-assessment]").count() == 15
    for heading in HEADINGS:
        page.locator("#hskLesson").get_by_text(heading, exact=True).wait_for()


def is_hsk_resource(entry):
    lowered = entry.lower()
    return "/data/hsk/" in lowered or "/assets/hsk-content/" in lowered


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=CHROMIUM,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        for name, width, height, lesson_id, mobile in SPECS:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                is_mobile=mobile,
                has_touch=mobile,
                device_scale_factor=1,
            )
            page = context.new_page()
            page.on("console", lambda message, label=name: result["consoleErrors"].append(f"{label}: {message.text}") if message.type == "error" else None)
            page.on("requestfailed", lambda request, label=name: result["requestFailures"].append(f"{label}: {request.url} — {request.failure or 'unknown'}"))
            page.on("response", lambda response, label=name: result["httpErrors"].append(f"{label}: {response.status} {response.url}") if response.status >= 400 else None)
            page.goto(f"{BASE}?area=hsk&hskLevel=3&hskLesson={lesson_id}", wait_until="domcontentloaded", timeout=40000)
            state = wait_ready(page, 3)
            assert_course(page, state)
            lesson_number = int(lesson_id[-2:])
            page.locator("#hskLesson").get_by_text(re.compile(rf"BÀI\s+{lesson_number}\s+/\s+36", re.I)).first.wait_for()
            layout = metrics(page)
            assert layout["overflow"] <= 2 and layout["levelRailOverflow"] <= 2, (name, layout)
            if mobile:
                assert not layout["minButtonHeight"] or layout["minButtonHeight"] >= 40, layout
                assert not layout["minChineseFont"] or layout["minChineseFont"] >= 12, layout
            result["viewports"][name] = {"width": width, "height": height, "lessonId": lesson_id, "state": state, "metrics": layout}

            if name == "desktop-1440":
                page.locator('[data-pro-lesson="hsk3-lesson-02"]').click()
                page.locator("#hskLesson").get_by_text("Nói rõ một sự việc", exact=True).wait_for()
                for text in ["Lượng từ khi đếm:", "Cách dùng:", "Mẫu dùng tự nhiên", "Lỗi dễ mắc"]:
                    page.locator("#hskLesson").get_by_text(text, exact=True).first.wait_for()
                page.locator("[data-pro-prev]").click()
                page.locator("#hskLesson").get_by_text("Từ một câu đến một đoạn", exact=True).wait_for()
                result["flows"]["previousNextNavigation"] = "pass"

                exercise = next(item for item in EXERCISES if item["id"] == "hsk3-lesson-01-exercise-1")
                card = page.locator(f'[data-pro-exercise="{exercise["id"]}"]')
                card.locator(f'[data-pro-input-for="{exercise["id"]}"]').fill(exercise["acceptedAnswers"][0])
                card.locator(f'[data-pro-check="{exercise["id"]}"]').click()
                card.get_by_text("Đúng.", exact=True).wait_for()
                result["flows"]["exerciseAnswerAndExplanation"] = "pass"

                assessments = [
                    ("hsk3-assessment-unit-01", r"Checkpoint Unit 1", "unitCheckpoint"),
                    ("hsk3-assessment-midpoint", r"HSK3 Midpoint", "midpoint"),
                    ("hsk3-assessment-final", r"HSK3 Final Assessment", "final"),
                    ("hsk3-assessment-mastery", r"HSK3 Mastery Review", "mastery"),
                ]
                for assessment_id, pattern, flow in assessments:
                    page.locator(f'[data-pro-assessment="{assessment_id}"]').click()
                    page.locator("#hskLesson small").get_by_text(re.compile(pattern, re.I)).wait_for()
                    result["flows"][flow] = "pass"

                page.locator('[data-pro-level="2"]').click()
                hsk2 = wait_ready(page, 2)
                assert hsk2["counts"]["lessons"] == 28 and hsk2["counts"]["vocabulary"] == 200, hsk2
                result["flows"]["hsk2SwitchRegression"] = "pass"
                page.locator('[data-pro-level="1"]').click()
                hsk1 = wait_ready(page, 1)
                assert hsk1["counts"]["lessons"] == 24 and hsk1["counts"]["vocabulary"] == 300, hsk1
                result["flows"]["hsk1SwitchRegression"] = "pass"

                page.goto(f"{BASE}?area=hsk&hskLesson=hsk3-lesson-36", wait_until="domcontentloaded")
                assert wait_ready(page, 3)["selectedLessonId"] == "hsk3-lesson-36"
                result["flows"]["directUrl"] = "pass"
                page.reload(wait_until="domcontentloaded")
                assert wait_ready(page, 3)["selectedLessonId"] == "hsk3-lesson-36"
                result["flows"]["reload"] = "pass"

            if mobile:
                if lesson_id == "hsk3-lesson-36":
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId") == "hsk3-lesson-35"
                else:
                    page.locator("[data-pro-next]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId") != lesson_id
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId") == lesson_id
                result["flows"]["mobileTouchControls"] = "pass"

            page.close()
            context.close()

        result["flows"]["firstMiddleLastLessons"] = "pass"
        result["flows"]["allLessonSections"] = "pass"
        hsk_network_errors = [item for item in result["requestFailures"] + result["httpErrors"] if is_hsk_resource(item)]
        hsk_console_errors = [item for item in result["consoleErrors"] if is_hsk_resource(item) or "hsk-professional" in item.lower() or "hsk3" in item.lower()]
        assert not hsk_network_errors and not hsk_console_errors, {
            "hskNetwork": hsk_network_errors,
            "hskConsole": hsk_console_errors,
        }
        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(json.dumps(result, ensure_ascii=False))
