"""Public HSK browser contract: published courses, focused tabs and protected canonical progress.
Runs only in the configured browser CI. No live auth/database writes.
"""
import json
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SIZES = [('desktop-1440',1440,900),('desktop-1024',1024,768),('mobile-390',390,844),('mobile-320',320,568)]
AUTH = """window.supabase={createClient(){const q=()=>new Proxy({}, {get(o,k){if(k==='then')return ok=>Promise.resolve({data:[],error:null}).then(ok);return ()=>q()}});return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:q,rpc:async()=>({data:[],error:null})}}};"""
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def ready(page,level=None):
    page.wait_for_function("""level => {
      const s=window.VDuckieHskProfessionalRuntime?.getState();
      return s?.status==='ready'&&s.counts&&document.body.dataset.hskProfReady==='true'&&(!level||s.selectedLevel===level);
    }""",arg=level,timeout=30000)
    return page.evaluate('window.VDuckieHskProfessionalRuntime.getState()')

def run(level):
    server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**k:Handler(*a,directory=str(ROOT),**k))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
    result={'viewports':{},'flows':{},'consoleErrors':[],'requestFailures':[],'httpErrors':[]}
    out=ROOT/'artifacts/hsk-recovery';out.mkdir(parents=True,exist_ok=True)
    course=json.loads((ROOT/f'data/hsk/hsk{level}/lessons.json').read_text())['records']
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        for name,width,height in SIZES:
          context=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<500,has_touch=width<500,service_workers='block')
          context.route('https://cdn.jsdelivr.net/npm/@supabase/**',lambda route:route.fulfill(content_type='text/javascript',body=AUTH))
          context.route('https://*.supabase.co/**',lambda route:route.fulfill(content_type='application/json',body='[]'))
          page=context.new_page();page.set_default_timeout(15000)
          page.on('pageerror',lambda e:result['consoleErrors'].append(str(e)))
          page.on('requestfailed',lambda r:result['requestFailures'].append(r.url) if r.url.startswith(base) else None)
          page.on('response',lambda r:result['httpErrors'].append(f'{r.status} {r.url}') if r.url.startswith(base) and r.status>=400 else None)
          lesson=course[0 if name=='desktop-1440' else len(course)//2 if name=='desktop-1024' else len(course)-1]
          page.goto(f'{base}?screen=hsk&area=hsk&hskLevel={level}&hskLesson={lesson["id"]}',wait_until='domcontentloaded')
          state=ready(page,level)
          assert state['readOnly'] is True and state['progressWritesEnabled'] is False,state
          assert state['counts']['lessons']==len(course)
          assert page.locator('[data-pro-lesson]').count()==len(course)
          assert state['selectedLessonId']==lesson['id'],state
          page.evaluate("window.__hskAwards=0;window.VDuckieEXP={...window.VDuckieEXP,awardWordMastery:async()=>{window.__hskAwards++;return {awarded:true}}}")
          # All current stage tabs are exercised; hidden stage content is not treated as missing.
          for stage in ['words','examples','practice','extra']:
            page.locator(f'[data-focus-stage="{stage}"]').click()
            assert page.locator(f'[data-focus-panel="{stage}"]').is_visible()
            assert page.locator('.hsk-focus-stage:not(.hidden)').count()==1
          for section in lesson.get('sections',[]):
            if section.get('titleVi') and section['type']!='vocabulary':
              assert page.locator('#hskLesson').get_by_text(section['titleVi'],exact=True).count()>0,section['titleVi']
          assert page.locator('.hsk-focus-vocabulary h4').inner_text()=='Học từ mới'
          assert page.locator('[data-focus-word]').count()>0
          result['flows']['allLessonSectionsAndTabs']='pass'
          page.locator('[data-focus-stage="practice"]').click()
          ex=page.locator('.hsk-pro-exercise').first
          if ex.locator('input[type=radio]').count(): ex.locator('input[type=radio]').first.check()
          elif ex.locator('input,textarea').count(): ex.locator('input,textarea').first.fill('测试')
          ex.locator('[data-pro-check]').click()
          assert ex.locator('.hsk-pro-feedback').is_visible()
          assert len(ex.locator('.hsk-pro-feedback').inner_text())>0
          result['flows']['exerciseAnswerAndExplanation']='pass'
          if level >= 5 and name == 'desktop-1440':
            for stage in ['words','examples','extra']:
              page.locator(f'[data-focus-stage="{stage}"]').click()
              page.locator(f'[data-hsk-content-done="{stage}"]').click()
            page.locator('[data-focus-stage="practice"]').click()
            listening = page.locator('.hsk-pro-exercise').filter(has=page.locator('[data-pro-transcript]')).first
            assert listening.locator('[data-pro-transcript]').evaluate('(node) => node.hidden') is True
            for article in page.locator('.hsk-pro-exercise').all():
              if article.locator('input[type=radio]').count(): article.locator('input[type=radio]').first.check()
              else: article.locator('input,textarea').first.fill('我先说明情况，再根据材料解释选择，并提出下一步行动。')
              article.locator('[data-pro-check]').click()
            assert listening.locator('[data-pro-transcript]').evaluate('(node) => node.hidden') is False
            assert 'chưa chấm đúng/sai' in listening.locator('.hsk-pro-feedback').inner_text()
            page.locator('[data-hsk-finish]').click()
            assert page.evaluate('(id)=>!!window.VDuckieHskStudyJourney.lesson(id).completedAt',lesson['id'])
            assert 'Chưa đủ dữ liệu đánh giá' in page.locator('[data-hsk-finish-panel]').inner_text()
            page.reload(wait_until='domcontentloaded');ready(page,level)
            assert page.evaluate('(id)=>!!window.VDuckieHskStudyJourney.lesson(id).completedAt',lesson['id'])
            result['flows']['completionReloadAndTranscript']='pass'
          if name=='desktop-1440':
            page.locator('[data-pro-next]').click();assert ready(page,level)['selectedLessonId']==course[1]['id']
            page.locator('[data-pro-prev]').click();assert ready(page,level)['selectedLessonId']==course[0]['id']
            result['flows']['previousNextNavigation']='pass'
            assessments=json.loads((ROOT/f'data/hsk/hsk{level}/assessments.json').read_text())['records']
            assert page.locator('[data-pro-assessment]').count()==len(assessments)
            for a in assessments:
              page.locator(f'[data-pro-assessment="{a["id"]}"]').click()
              assert ready(page,level)['selectedAssessmentId']==a['id']
              assert page.locator('.hsk-pro-exercise').count()==len(a['exerciseRefs'])
            result['flows']['allAssessmentTypes']='pass'
            for other in [1,2,4 if level==3 else 3]:
              page.locator(f'[data-pro-level="{other}"]').click();ready(page,other)
            page.locator(f'[data-pro-level="{level}"]').click();ready(page,level)
            result['flows']['publishedLevelSwitching']='pass'
          assert page.evaluate('window.__hskAwards')==0
          page.reload(wait_until='domcontentloaded');ready(page,level)
          result['flows']['reloadAndDirectUrl']='pass'
          metrics=page.evaluate("""()=>{const rail=document.getElementById('hskLevels');return {overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0}}""")
          assert metrics['overflow']<=2 and metrics['levelRailOverflow']<=2,(name,metrics)
          result['viewports'][name]={'state':state,'requestedLevel':level,'metrics':metrics}
          page.screenshot(path=str(out/f'hsk{level}-{name}.png'),full_page=False)
          context.close()
        browser.close()
      assert result['consoleErrors']==[],result['consoleErrors']
      assert result['requestFailures']==[] and result['httpErrors']==[],result
      (out/f'hsk{level}-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
      print(json.dumps(result,ensure_ascii=False))
    finally:
      server.shutdown();server.server_close()

if __name__=='__main__':run(int(sys.argv[1]))
