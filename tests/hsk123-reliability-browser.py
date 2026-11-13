"""18 real-browser sampled learner journeys. Run in GitHub CI, isolated guest storage."""
import json, threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
from helpers.hsk_browser_smoke import Handler,AUTH,ready,ROOT

out=ROOT/'artifacts/hsk123-reliability';out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**k:Handler(*a,directory=str(ROOT),**k))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for label,width,height in [('desktop',1440,900),('mobile',390,844)]:
   for level in (1,2,3):
    lessons=json.loads((ROOT/f'data/hsk/hsk{level}/lessons.json').read_text())['records']
    exercises={e['id']:e for e in json.loads((ROOT/f'data/hsk/hsk{level}/exercises.json').read_text())['records']}
    for lesson in [lessons[0],lessons[len(lessons)//2],lessons[-1]]:
     context=browser.new_context(viewport={'width':width,'height':height},is_mobile=label=='mobile',has_touch=label=='mobile',service_workers='block')
     context.route('https://cdn.jsdelivr.net/npm/@supabase/**',lambda route:route.fulfill(content_type='text/javascript',body=AUTH))
     context.route('https://*.supabase.co/**',lambda route:route.fulfill(content_type='application/json',body='[]'))
     # A separate old completion must survive every new sampled journey.
     context.add_init_script("""if(!localStorage.getItem('vduckie-hsk-study-journey-v1'))localStorage.setItem('vduckie-hsk-study-journey-v1',JSON.stringify({lessons:{legacy:{level:1,completedAt:123,answers:{old:{correct:true}},position:{stage:'examples'}}}}));localStorage.setItem('hsk123-preserve-sentinel','old-user-data');""")
     page=context.new_page();page.set_default_timeout(20000)
     errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
     page.goto(f'{base}?screen=hsk&area=hsk&hskLevel={level}&hskLesson={lesson["id"]}',wait_until='domcontentloaded');ready(page,level)
     assert page.locator('[data-focus-word]').count()>0
     # Vocabulary then grammar/dialogue/listening/reading, then practice.
     for stage in ['words','extra','examples']:
      page.locator(f'[data-focus-stage="{stage}"]').click()
      panel=page.locator(f'[data-focus-panel="{stage}"]');assert panel.is_visible()
      done=panel.locator('[data-hsk-content-done]')
      if done.count():done.click()
     for kind in ['grammar','dialogue','reading','listening']:
      section=next((s for s in lesson['sections'] if s['type']==kind),None)
      if section:assert page.locator('#hskLesson').get_by_text(section['titleVi'],exact=True).count()>0
     page.locator('[data-focus-stage="practice"]').click();assert page.locator('[data-focus-panel="practice"]').is_visible()
     checked=0;wrong_probed=False
     for id in lesson['practiceRefs']:
      exercise=exercises[id];article=page.locator(f'[data-pro-exercise="{id}"]');answer=exercise['answer']
      if exercise['skill']=='listening' and exercise.get('stimulus',{}).get('scriptZh'):assert not article.locator('[data-pro-transcript]').is_visible()
      if isinstance(answer,dict):
       assert not article.locator('[data-pro-feedback]').is_visible()
       article.locator('textarea').fill('Tôi diễn đạt ý theo tiêu chí và bằng chứng của bài.');article.locator('[data-pro-check]').click()
       assert 'Tiêu chí tự đối chiếu' in article.locator('[data-pro-feedback]').inner_text()
       assert page.evaluate('(v)=>window.VDuckieHskStudyJourney.lesson(v.lesson).answers[v.id].correct',{'lesson':lesson['id'],'id':id}) is None
      elif isinstance(answer,list):
       pairs={line.split('→')[1].strip():line.split('→')[0].strip() for line in answer}
       for select in article.locator('select').all():select.select_option(pairs[select.get_attribute('aria-label')])
       article.locator('[data-pro-check]').click();assert 'Đúng.' in article.locator('[data-pro-feedback]').inner_text()
      else:
       radio=article.locator('input[type=radio]')
       if not wrong_probed:
        if radio.count():
         incorrect=next(el for el in radio.all() if el.get_attribute('value')!=answer);incorrect.check()
        else:article.locator('[data-pro-input-for]').fill('ĐÁP ÁN SAI CÓ CHỦ Ý')
        article.locator('[data-pro-check]').click();assert 'Chưa khớp' in article.locator('[data-pro-feedback]').inner_text();wrong_probed=True
       if radio.count():next(e for e in radio.all() if e.get_attribute('value')==answer).check()
       else:article.locator('[data-pro-input-for]').fill(answer)
       article.locator('[data-pro-check]').click();assert 'Đúng.' in article.locator('[data-pro-feedback]').inner_text()
      if exercise['skill']=='listening' and exercise.get('stimulus',{}).get('scriptZh'):assert article.locator('[data-pro-transcript]').is_visible()
      checked+=1
     finish=page.locator('[data-hsk-finish]');assert finish.is_enabled();finish.click()
     assert 'Chưa đủ dữ liệu đánh giá' in page.locator('[data-hsk-finish-panel]').inner_text()
     assert page.evaluate('(id)=>window.VDuckieHskStudyJourney.lesson(id).completedAt>0',lesson['id'])
     assert page.locator('[data-hsk-next-lesson]').is_disabled()==(lesson==lessons[-1])
     page.reload(wait_until='domcontentloaded');ready(page,level)
     assert page.evaluate("window.VDuckieHskStudyJourney.lesson('legacy').completedAt") == 123
     assert page.evaluate("localStorage.getItem('hsk123-preserve-sentinel')")=='old-user-data'
     assert page.evaluate('(id)=>window.VDuckieHskStudyJourney.lesson(id).completedAt>0',lesson['id'])
     page.locator('[data-hsk-finish-panel] [data-hsk-review-open]').click()
     assert page.locator('[data-hsk-review-drawer]').count()>0
     overflow=page.evaluate('Math.max(0,document.documentElement.scrollWidth-innerWidth)');assert overflow<=2,overflow
     page.screenshot(path=str(out/f'{label}-{lesson["id"]}.png'),full_page=False)
     results.append({'viewport':label,'level':level,'lesson':lesson['id'],'checked':checked,'wrongProbe':wrong_probed,'overflow':overflow,'status':'pass','pageErrors':errors})
     context.close()
  browser.close()
finally:
 server.shutdown();(out/'journeys.json').write_text(json.dumps({'sampledJourneys':results,'scope':'First/middle/last lessons per level, desktop/mobile. Finite supplied keys + wrong probe and open rubric; not all valid linguistic variants or real audio quality.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':len(results),'journeys':results},ensure_ascii=False))
