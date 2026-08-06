import json,os,re,shutil,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
EXERCISES=json.loads((ROOT/'data/hsk/hsk6/exercises.json').read_text(encoding='utf-8'))['records']
CHROMIUM=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
if not CHROMIUM: raise SystemExit('Chromium executable not found')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**k:Quiet(*a,directory=str(ROOT),**k))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/'
SPECS=[('desktop-1440',1440,900,'hsk6-lesson-01',False),('desktop-1024',1024,768,'hsk6-lesson-36',False),('mobile-390',390,844,'hsk6-lesson-54',True),('mobile-320',320,568,'hsk6-lesson-72',True)]
EXPECTED={'units':24,'lessons':72,'grammar':50,'characters':413,'exercises':864,'assessments':31,'vocabulary':1800}
HEADINGS=['Tình huống, mục tiêu và tiêu chí','Từ vựng, collocation và near-synonym','Chữ Hán và nhận diện trong từ','Ngữ pháp, chức năng diễn ngôn và lỗi thường gặp','Hội thoại có mục đích và register','Nghe dài, thái độ, hàm ý và ghi chú','Đọc báo cáo/bình luận và truy bằng chứng','Ngữ điệu, register và discourse marker','Ngữ dụng và bối cảnh giao tiếp','Luyện tập có hướng dẫn','Nói, viết và nhiệm vụ thật','Tóm tắt năng lực','Reflection, spaced review và self-review']
flows=['firstQuarterMiddleThreeQuarterLast','allLessonSections','exerciseFeedback','previousNext','checkpoint','midpoint','receptive','productive','integrated','mock','final','mastery','hsk5Regression','hsk4Regression','hsk1Regression','directUrl','reload','mobileTouch']
result={'viewports':{},'flows':{x:'pending' for x in flows},'consoleErrors':[],'requestFailures':[],'httpErrors':[]}
def ready(page,level):
 page.wait_for_function("""expected=>document.body&&document.body.dataset.hskProfReady==='true'&&window.VDuckieHskProfessionalRuntime&&window.VDuckieHskProfessionalRuntime.getState().status==='ready'&&window.VDuckieHskProfessionalRuntime.getState().selectedLevel===expected""",arg=level,timeout=50000)
 return page.evaluate('window.VDuckieHskProfessionalRuntime.getState()')
def metrics(page):
 return page.evaluate("""()=>{const rail=document.getElementById('hskLevels'),buttons=[...document.querySelectorAll('#hskLesson button:not([disabled])')].filter(n=>n.getBoundingClientRect().height>0),zh=[...document.querySelectorAll('#hskLesson [lang="zh-CN"]')].filter(n=>n.getBoundingClientRect().height>0);return{overflow:document.documentElement.scrollWidth-innerWidth,levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0,minButtonHeight:buttons.length?Math.min(...buttons.map(n=>n.getBoundingClientRect().height)):0,minChineseFont:zh.length?Math.min(...zh.map(n=>parseFloat(getComputedStyle(n).fontSize)||0)):0}}""")
def assert_course(page,state):
 assert state['selectedLevel']==6 and state['readOnly'] is True and state['progressWritesEnabled'] is False,state
 for k,v in EXPECTED.items(): assert state['counts'][k]==v,(k,state['counts'])
 page.get_by_text('HSK 6 Professional · C7 learner-facing',exact=True).first.wait_for()
 assert page.locator('[data-pro-level="6"]').count()==1 and not page.locator('[data-pro-level="6"]').is_disabled()
 assert page.locator('.hsk-pro-unit').count()==24 and page.locator('[data-pro-lesson]').count()==72 and page.locator('[data-pro-assessment]').count()==31
 for heading in HEADINGS: page.locator('#hskLesson').get_by_text(heading,exact=True).wait_for()
def is_hsk(x): return '/data/hsk/' in x.lower() or '/assets/hsk-content/' in x.lower()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=CHROMIUM,args=['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'])
  for name,w,h,lid,mobile in SPECS:
   context=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);page=context.new_page()
   page.on('console',lambda m,label=name:result['consoleErrors'].append(f'{label}: {m.text}') if m.type=='error' else None)
   page.on('requestfailed',lambda r,label=name:result['requestFailures'].append(f'{label}: {r.url} — {r.failure or "unknown"}'))
   page.on('response',lambda r,label=name:result['httpErrors'].append(f'{label}: {r.status} {r.url}') if r.status>=400 else None)
   page.goto(f'{BASE}?area=hsk&hskLevel=6&hskLesson={lid}',wait_until='domcontentloaded',timeout=60000);state=ready(page,6);assert_course(page,state)
   number=int(lid[-2:]);page.locator('#hskLesson').get_by_text(re.compile(rf'BÀI\s+{number}\s+/\s+72',re.I)).first.wait_for()
   layout=metrics(page);assert layout['overflow']<=2 and layout['levelRailOverflow']<=2,(name,layout)
   if mobile:
    assert not layout['minButtonHeight'] or layout['minButtonHeight']>=40,layout
    assert not layout['minChineseFont'] or layout['minChineseFont']>=12,layout
   result['viewports'][name]={'width':w,'height':h,'lessonId':lid,'state':state,'metrics':layout}
   if name=='desktop-1440':
    page.locator('[data-pro-lesson="hsk6-lesson-18"]').click();assert ready(page,6)['selectedLessonId']=='hsk6-lesson-18';result['flows']['firstQuarterMiddleThreeQuarterLast']='pass'
    page.locator('[data-pro-prev]').click();assert ready(page,6)['selectedLessonId']=='hsk6-lesson-17'
    page.locator('[data-pro-next]').click();assert ready(page,6)['selectedLessonId']=='hsk6-lesson-18';result['flows']['previousNext']='pass'
    page.goto(f'{BASE}?area=hsk&hskLevel=6&hskLesson=hsk6-lesson-01',wait_until='domcontentloaded');ready(page,6)
    exercise=next(x for x in EXERCISES if x['id']=='hsk6-lesson-01-exercise-01');card=page.locator(f'[data-pro-exercise="{exercise["id"]}"]')
    card.locator(f'input[value="{exercise["answer"]}"]').check();card.locator(f'[data-pro-check="{exercise["id"]}"]').click();card.get_by_text('Đúng.',exact=True).wait_for();result['flows']['exerciseFeedback']='pass'
    for aid,key in [('hsk6-assessment-unit-01','checkpoint'),('hsk6-assessment-midpoint','midpoint'),('hsk6-assessment-receptive','receptive'),('hsk6-assessment-productive','productive'),('hsk6-assessment-integrated','integrated'),('hsk6-assessment-mock','mock'),('hsk6-assessment-final','final'),('hsk6-assessment-mastery','mastery')]:
     page.locator(f'[data-pro-assessment="{aid}"]').click();page.locator('#hskLesson .hsk-pro-lesson-head').wait_for();result['flows'][key]='pass'
    for level,lesson_count,vocab,key in [(5,60,1600,'hsk5Regression'),(4,48,1000,'hsk4Regression'),(1,24,300,'hsk1Regression')]:
     page.locator(f'[data-pro-level="{level}"]').click();st=ready(page,level);assert st['counts']['lessons']==lesson_count and st['counts']['vocabulary']==vocab,st;result['flows'][key]='pass'
    page.goto(f'{BASE}?area=hsk&hskLevel=6&hskLesson=hsk6-lesson-72',wait_until='domcontentloaded');assert ready(page,6)['selectedLessonId']=='hsk6-lesson-72';result['flows']['directUrl']='pass'
    page.reload(wait_until='domcontentloaded');assert ready(page,6)['selectedLessonId']=='hsk6-lesson-72';result['flows']['reload']='pass'
   if mobile:
    if lid=='hsk6-lesson-72': page.locator('[data-pro-prev]').tap();assert page.evaluate('window.VDuckieHskProfessionalRuntime.getState().selectedLessonId')=='hsk6-lesson-71'
    else:
     page.locator('[data-pro-next]').tap();assert page.evaluate('window.VDuckieHskProfessionalRuntime.getState().selectedLessonId')!=lid
     page.locator('[data-pro-prev]').tap();assert page.evaluate('window.VDuckieHskProfessionalRuntime.getState().selectedLessonId')==lid
    result['flows']['mobileTouch']='pass'
   page.close();context.close()
  result['flows']['allLessonSections']='pass';result['flows']['firstQuarterMiddleThreeQuarterLast']='pass'
  bad=[x for x in result['requestFailures']+result['httpErrors'] if is_hsk(x)]
  console=[x for x in result['consoleErrors'] if is_hsk(x) or 'hsk-professional' in x.lower() or 'hsk6' in x.lower()]
  assert not bad and not console,{'network':bad,'console':console};assert all(v=='pass' for v in result['flows'].values()),result['flows'];browser.close()
finally:
 server.shutdown();server.server_close()
print(json.dumps(result,ensure_ascii=False))
