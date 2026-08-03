import json
import os
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CHROMIUM = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        return

server = ThreadingHTTPServer(("127.0.0.1", 0), lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/?area=hsk&hskLevel=4&hskLesson=hsk4-lesson-01"

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROMIUM, args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"])
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_function("""() => document.body && document.body.dataset.hskProfReady === 'true' && window.VDuckieHskProfessionalRuntime && window.VDuckieHskProfessionalRuntime.getState().status === 'ready'""", timeout=30000)
        payload = page.evaluate("""() => {
          const targetText='Từ vựng mới trong ngữ cảnh';
          const all=[...document.querySelectorAll('#hskLesson *')];
          const target=all.find(node => (node.textContent || '').trim() === targetText) || null;
          const describe=node => {
            if(!node) return null;
            const style=getComputedStyle(node), rect=node.getBoundingClientRect();
            return {tag:node.tagName,id:node.id,className:node.className,hidden:node.hidden,ariaHidden:node.getAttribute('aria-hidden'),display:style.display,visibility:style.visibility,opacity:style.opacity,width:rect.width,height:rect.height,text:(node.textContent||'').trim().slice(0,120)};
          };
          const ancestors=[];
          let node=target;
          while(node && ancestors.length<15){ancestors.push(describe(node));node=node.parentElement;}
          return {
            state:window.VDuckieHskProfessionalRuntime.getState(),
            target:describe(target),
            ancestors,
            hsk:describe(document.getElementById('hsk')),
            journey:describe(document.getElementById('hskJourney')),
            lesson:describe(document.getElementById('hskLesson')),
            body:describe(document.body),
            headings:[...document.querySelectorAll('#hskLesson h4')].map(describe),
            hiddenAncestors: target ? ancestors.filter(item => item.hidden || item.ariaHidden === 'true' || item.display === 'none' || item.visibility === 'hidden' || item.opacity === '0' || item.width === 0 || item.height === 0) : []
          };
        }""")
        print(json.dumps(payload, ensure_ascii=False))
        browser.close()
finally:
    server.shutdown()
