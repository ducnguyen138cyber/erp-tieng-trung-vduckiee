import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
fixture = (REPO / "tests/fixtures/v108-developer-runtime-harness.html").read_text(encoding="utf-8")
fixture = fixture.replace(
    '<link rel="stylesheet" href="./assets/developer-ui/developer-center.css">',
    '<style>' + (REPO / "assets/developer-ui/developer-center.css").read_text(encoding="utf-8") + '</style>'
)
for rel in [
    "assets/developer-tabs/overview.js",
    "assets/developer-tabs/evolution.js",
    "assets/developer-tabs/animation.js",
    "assets/developer-debug/debug.js",
    "assets/developer-ui/developer-center-core.js",
    "assets/developer-ui/developer-center.js",
    "assets/developer/developer-control-center.js",
]:
    fixture = fixture.replace(
        f'<script src="./{rel}"></script>',
        '<script>' + (REPO / rel).read_text(encoding="utf-8") + '</script>'
    )

chromium = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
if not chromium:
    raise SystemExit("Chromium executable not found")

results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=chromium, args=["--no-sandbox"])
    for width, height in [(1440, 900), (1024, 768), (390, 844), (320, 568)]:
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        console_errors = []
        page.on("console", lambda message, sink=console_errors: sink.append(message.text) if message.type == "error" else None)
        page.set_content(fixture, wait_until="load")
        page.wait_for_selector("#vduckie-developer-center:not([hidden])")
        page.wait_for_timeout(80)
        initial = page.evaluate("""() => {
          const root = document.querySelector('#vduckie-developer-center');
          const dialog = root.querySelector('.dev-center-dialog');
          const rect = dialog.getBoundingClientRect();
          const panels = [...root.querySelectorAll('[data-tab-panel]')];
          return {
            rootCount: document.querySelectorAll('#vduckie-developer-center').length,
            legacy: document.querySelectorAll('#v93DeveloperPreview,.v93-developer-panel').length,
            role: dialog.getAttribute('role'), ariaModal: dialog.getAttribute('aria-modal'),
            tabs: root.querySelectorAll('[role="tab"]').length,
            visiblePanels: panels.filter(panel => !panel.hidden).length,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            inViewport: rect.left >= -.5 && rect.top >= -.5 && rect.right <= innerWidth + .5 && rect.bottom <= innerHeight + .5,
            bodyLocked: document.body.classList.contains('dev-center-open')
          };
        }""")
        assert initial == {
            "rootCount": 1, "legacy": 0, "role": "dialog", "ariaModal": "true", "tabs": 8,
            "visiblePanels": 1, "horizontalOverflow": False, "inViewport": True, "bodyLocked": True
        }, initial

        page.click('[data-dev-tab="evolution"]')
        page.select_option('[data-vdev-change-action="evolution.set-level"]', "5")
        page.wait_for_timeout(50)
        evolution = page.evaluate("""() => ({
          visible: [...document.querySelectorAll('[data-tab-panel]')].filter(panel => !panel.hidden).map(panel => panel.dataset.tabPanel),
          mascots: document.querySelector('[data-tab-panel="evolution"]').querySelectorAll('[data-v95-mascot]').length,
          level: document.querySelector('[data-tab-panel="evolution"] [data-v95-mascot]').getAttribute('data-v95-level'),
          verticalLevelHeadings: [...document.querySelectorAll('[data-tab-panel="evolution"] h3')].filter(node => /^Level [1-9]/.test(node.textContent)).length
        })""")
        assert evolution == {"visible": ["evolution"], "mascots": 1, "level": "5", "verticalLevelHeadings": 0}, evolution

        page.click('[data-dev-tab="animation"]')
        page.click('[data-tab-panel="animation"]:not([hidden]) [data-vdev-action="evolution.hover"]')
        page.wait_for_timeout(40)
        assert page.evaluate("window.VDuckieDeveloper.runtime.snapshot().animation.current") == "hover"

        page.click('[data-dev-tab="debug"]')
        assert page.evaluate("[...document.querySelectorAll('[data-tab-panel=\"debug\"] details')].every(node => !node.open)")
        page.click('[data-vdev-debug-key="runtime-state"] > summary')
        assert page.eval_on_selector('[data-vdev-debug-key="runtime-state"]', "node => node.open")

        page.keyboard.press("Escape")
        page.wait_for_timeout(30)
        assert page.evaluate("document.querySelector('#vduckie-developer-center').hidden")
        assert not page.evaluate("document.body.classList.contains('dev-center-open')")
        page.evaluate("window.VDuckieDeveloperControlCenter.open()")
        page.wait_for_timeout(30)
        assert page.evaluate("document.querySelectorAll('#vduckie-developer-center').length") == 1
        assert not page.evaluate("document.querySelector('#vduckie-developer-center').hidden")
        assert not console_errors, console_errors
        results.append(initial)
        page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False))
