import json
import os
import re
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXERCISES = json.loads((ROOT / "data/hsk/hsk5/exercises.json").read_text(encoding="utf-8"))["records"]
CHROMIUM = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
if not CHROMIUM:
    raise SystemExit("Chromium executable not found")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        return

server = ThreadingHTTPServer(("127.0.0.1", 0), lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_port}/"
SPECS = [
    ("desktop-1440", 1440, 900, "hsk5-lesson-01", False),
    ("desktop-1024", 1024, 768, "hsk5-lesson-30", False),
    ("mobile-390", 390, 844, "hsk5-lesson-31", True),
    ("mobile-320", 320, 568, "hsk5-lesson-60", True),
]
EXPECTED = {"units":20,"lessons":60,"grammar":70,"characters":431,"exercises":600,"assessments":24,"vocabulary":1600}
HEADINGS = [
    "Tình huống, mục tiêu và tiêu chí",
    "Từ vựng, collocation và near-synonym",
    "Chữ Hán và nhận diện trong từ",
    "Ngữ pháp, chức năng diễn ngôn và lỗi thường gặp",
    "Hội thoại có mục đích và register",
    "Nghe tích hợp và ghi chú",
    "Đọc chiến lược và suy luận",
    "Ngữ điệu, register và discourse marker",
    "Ngữ dụng và bối cảnh văn hóa",
    "Luyện tập có hướng dẫn",
    "Nói, viết và nhiệm vụ thật",
    "Tóm tắt năng lực",
    "Reflection, spaced review và self-review",
]
result = {"viewports":{},"flows":{key:"pending" for key in [
    "firstMiddleLastLessons","allLessonSections","exerciseAnswerAndExplanation","previousNextNavigation",
    "unitCheckpoint","midpoint","final","mastery","integratedProject",
    "hsk4SwitchRegression","hsk3SwitchRegression","hsk2SwitchRegression","hsk1SwitchRegression",
    "reload","directUrl","mobileTouchControls"]},"consoleErrors":[],"requestFailures":[],"httpErrors":[]}

def wait_ready(page, level):
    page.wait_for_function("""expected => {
      if (!document.body || document.body.dataset.hskProfReady !== 'true' || !window.VDuckieHskProfessionalRuntime) return false;
      const state = window.VDuckieHskProfessionalRuntime.getState();
      return state.status === 'ready' && state.selectedLevel === expected && state.counts;
    }""", arg=level, timeout=40000)
    return page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")

def metrics(page):
    return page.evaluate("""() => {
      const chinese=[...document.querySelectorAll('#hskLesson [lang="zh-CN"]')].filter(n=>n.getBoundingClientRect().height>0);
      const buttons=[...document.querySelectorAll('#hskLesson button:not([disabled])')].filter(n=>n.getBoundingClientRect().height>0);
      const rail=document.getElementById('hskLevels');
      return {overflow:document.documentElement.scrollWidth-innerWidth,
        levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0,
        minChineseFont:chinese.length?Math.min(...chinese.map(n=>parseFloat(getComputedStyle(n).fontSize)||0)):0,
        minButtonHeight:buttons.length?Math.min(...buttons.map(n=>n.getBoundingClientRect().height)):0};
    }""")

def assert_course(page, state):
    assert state["selectedLevel"] == 5 and state["readOnly"] is True and state["progressWritesEnabled"] is False, state
    for key,value in EXPECTED.items():
        assert state["counts"][key] == value, (key,state["counts"])
    page.get_by_text("HSK 5 Professional · C6 learner-facing", exact=True).first.wait_for()
    assert page.locator('[data-pro-level="5"]').count() == 1
    assert not page.locator('[data-pro-level="5"]').is_disabled()
    assert page.locator(".hsk-pro-unit").count() == 20
    assert page.locator("[data-pro-lesson]").count() == 60
    assert page.locator("[data-pro-assessment]").count() == 24
    for heading in HEADINGS:
        page.locator("#hskLesson").get_by_text(heading, exact=True).wait_for()

def is_hsk(entry):
    lowered=entry.lower()
    return "/data/hsk/" in lowered or "/assets/hsk-content/" in lowered

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True, executable_path=CHROMIUM,
            args=["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"])
        for name,width,height,lesson_id,mobile in SPECS:
            context=browser.new_context(viewport={"width":width,"height":height},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
            page=context.new_page()
            page.on("console",lambda message,label=name: result["consoleErrors"].append(f"{label}: {message.text}") if message.type=="error" else None)
            page.on("requestfailed",lambda request,label=name: result["requestFailures"].append(f"{label}: {request.url} — {request.failure or 'unknown'}"))
            page.on("response",lambda response,label=name: result["httpErrors"].append(f"{label}: {response.status} {response.url}") if response.status>=400 else None)
            page.goto(f"{BASE}?area=hsk&hskLevel=5&hskLesson={lesson_id}",wait_until="domcontentloaded",timeout=50000)
            state=wait_ready(page,5)
            assert_course(page,state)
            lesson_number=int(lesson_id[-2:])
            page.locator("#hskLesson").get_by_text(re.compile(rf"BÀI\s+{lesson_number}\s+/\s+60",re.I)).first.wait_for()
            layout=metrics(page)
            assert layout["overflow"]<=2 and layout["levelRailOverflow"]<=2,(name,layout)
            if mobile:
                assert not layout["minButtonHeight"] or layout["minButtonHeight"]>=40,layout
                assert not layout["minChineseFont"] or layout["minChineseFont"]>=12,layout
            result["viewports"][name]={"width":width,"height":height,"lessonId":lesson_id,"state":state,"metrics":layout}

            if name=="desktop-1440":
                page.locator('[data-pro-lesson="hsk5-lesson-02"]').click()
                page.locator("#hskLesson").get_by_text("Sự thật, quan điểm và suy đoán",exact=True).wait_for()
                page.locator("[data-pro-prev]").click()
                page.locator("#hskLesson").get_by_text("Tin tức đến từ đâu?",exact=True).wait_for()
                result["flows"]["previousNextNavigation"]="pass"

                exercise=next(x for x in EXERCISES if x["id"]=="hsk5-lesson-01-exercise-1")
                card=page.locator(f'[data-pro-exercise="{exercise["id"]}"]')
                card.locator(f'input[value="{exercise["answer"]}"]').check()
                card.locator(f'[data-pro-check="{exercise["id"]}"]').click()
                card.get_by_text("Đúng.",exact=True).wait_for()
                card.get_by_text(re.compile("collocation|register",re.I)).first.wait_for()
                result["flows"]["exerciseAnswerAndExplanation"]="pass"

                for aid,pattern,flow in [
                    ("hsk5-assessment-unit-01",r"Checkpoint Unit 1","unitCheckpoint"),
                    ("hsk5-assessment-midpoint",r"giữa khóa HSK5","midpoint"),
                    ("hsk5-assessment-final",r"cuối khóa HSK5","final"),
                    ("hsk5-assessment-mastery",r"năng lực HSK5","mastery"),
                    ("hsk5-assessment-project",r"Dự án vấn đề thật HSK5","integratedProject")]:
                    page.locator(f'[data-pro-assessment="{aid}"]').click()
                    page.locator("#hskLesson").get_by_text(re.compile(pattern,re.I)).first.wait_for()
                    result["flows"][flow]="pass"

                for level,lessons,vocab,flow in [
                    (4,48,1000,"hsk4SwitchRegression"),(3,36,500,"hsk3SwitchRegression"),
                    (2,28,200,"hsk2SwitchRegression"),(1,24,300,"hsk1SwitchRegression")]:
                    page.locator(f'[data-pro-level="{level}"]').click()
                    st=wait_ready(page,level)
                    assert st["counts"]["lessons"]==lessons and st["counts"]["vocabulary"]==vocab,st
                    result["flows"][flow]="pass"

                page.goto(f"{BASE}?area=hsk&hskLevel=5&hskLesson=hsk5-lesson-60",wait_until="domcontentloaded")
                assert wait_ready(page,5)["selectedLessonId"]=="hsk5-lesson-60"
                result["flows"]["directUrl"]="pass"
                page.reload(wait_until="domcontentloaded")
                assert wait_ready(page,5)["selectedLessonId"]=="hsk5-lesson-60"
                result["flows"]["reload"]="pass"

            if mobile:
                if lesson_id=="hsk5-lesson-60":
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")=="hsk5-lesson-59"
                else:
                    page.locator("[data-pro-next]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")!=lesson_id
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")==lesson_id
                result["flows"]["mobileTouchControls"]="pass"
            page.close(); context.close()
        result["flows"]["firstMiddleLastLessons"]="pass"
        result["flows"]["allLessonSections"]="pass"
        net=[x for x in result["requestFailures"]+result["httpErrors"] if is_hsk(x)]
        console=[x for x in result["consoleErrors"] if is_hsk(x) or "hsk-professional" in x.lower() or "hsk5" in x.lower()]
        assert not net and not console,{"network":net,"console":console}
        browser.close()
finally:
    server.shutdown(); server.server_close()

print(json.dumps(result,ensure_ascii=False))
