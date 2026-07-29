import json
import os
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]


def source(relative):
    return (REPO / relative).read_text(encoding="utf-8")


fixture = source("tests/fixtures/v108-developer-runtime-harness.html")
v75_data = "".join(source(f"assets/v75/hsk1-data.part{index}.txt") for index in range(1, 5))
fixture = fixture.replace("<script>\n(function(){", "<script>" + v75_data + "</script>\n<script>\n(function(){", 1)
fixture = fixture.replace(
    '<link rel="stylesheet" href="./assets/developer-ui/developer-center.css">',
    "<style>" + source("assets/developer-ui/developer-center.css") + "</style>",
)
fixture = fixture.replace(
    'var session={access_token:"dev-token",user:{id:"dev-user",email:"ducnguyenn138@gmail.com"}};',
    'var session=new URLSearchParams(location.search).get("role")==="regular"'
    '?{access_token:"user-token",user:{id:"regular-user",email:"user@example.com"}}'
    ':{access_token:"dev-token",user:{id:"dev-user",email:"ducnguyenn138@gmail.com"}};'
    "var sessionListeners=[];",
)
fixture = fixture.replace(
    'window.VDuckieEXPCore={session:function(){return session},onSession:function(fn){setTimeout(function(){fn(session)},0);return function(){}},client:function(){return{auth:{getUser:function(){return Promise.resolve({data:{user:session.user},error:null})}}}}};',
    'window.VDuckieEXPCore={session:function(){return session},'
    'onSession:function(fn){sessionListeners.push(fn);setTimeout(function(){fn(session)},0);'
    'return function(){sessionListeners=sessionListeners.filter(function(item){return item!==fn})}},'
    'client:function(){return window.__mockSupabaseClient}};'
    'window.__setSession=function(next){session=next;sessionListeners.slice().forEach(function(fn){fn(session)});'
    '(window.__authListeners||[]).slice().forEach(function(fn){fn("SIGNED_IN",session)})};'
    'window.__getSession=function(){return session};',
)

injected_setup = r'''
  window.__developerPermission=true;
  window.__storageWriteCount=0;
  window.__canonicalStorageWriteCount=0;
  window.__supabaseWriteCount=0;
  window.__rpcWriteCount=0;
  window.__expAwardCount=0;
  window.__authListeners=[];
  var nativeSetItem=Storage.prototype.setItem;
  var nativeRemoveItem=Storage.prototype.removeItem;
  Storage.prototype.setItem=function(key,value){
    window.__storageWriteCount+=1;
    if(String(key)==="vduckie-hsk-canonical-progress-v1")window.__canonicalStorageWriteCount+=1;
    return nativeSetItem.call(this,key,value);
  };
  Storage.prototype.removeItem=function(key){
    window.__storageWriteCount+=1;
    if(String(key)==="vduckie-hsk-canonical-progress-v1")window.__canonicalStorageWriteCount+=1;
    return nativeRemoveItem.call(this,key);
  };
  function queryResult(){
    var query={
      select:function(){return query},eq:function(){return query},
      then:function(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}
    };
    return query;
  }
  window.__mockSupabaseClient={
    auth:{
      getSession:function(){return Promise.resolve({data:{session:session},error:null})},
      onAuthStateChange:function(fn){window.__authListeners.push(fn);return{data:{subscription:{unsubscribe:function(){}}}}},
      getUser:function(){return Promise.resolve({data:{user:session&&session.user},error:null})}
    },
    from:function(){
      var query=queryResult();
      query.upsert=function(){window.__supabaseWriteCount+=1;return Promise.resolve({data:[],error:null})};
      return query;
    },
    rpc:function(){window.__rpcWriteCount+=1;return Promise.resolve({data:null,error:null})}
  };
  window.supabase={createClient:function(){return window.__mockSupabaseClient}};
  window.VDUCKIE_SUPABASE_CONFIG={url:"https://phase2b4.supabase.co",publishableKey:"sb_publishable_phase2b4"};
  window.VDuckieEXP={awardEXP:function(){window.__expAwardCount+=1;return Promise.resolve({awarded:true})}};
  var legacyLessons=window.HSK1_V75_LESSONS;
  window.HSK1_V75_LESSONS=legacyLessons;
  window.HSKCurriculum={levels:{1:legacyLessons},previewMode:"legacy",previewMetadata:null};
  window.__hskRuntimeMode="legacy";
  var hskRuntimeBridge={
    useCanonical:function(lessons){
      if(!window.__developerPermission)throw new Error("permission revoked");
      window.__hskRuntimeMode="canonical";
      window.HSKCurriculum.levels[1]=lessons;
      window.HSKCurriculum.previewMode="canonical";
      document.body.setAttribute("data-hsk-curriculum-preview","canonical");
    },
    useLegacy:function(){
      window.__hskRuntimeMode="legacy";
      window.HSKCurriculum.levels[1]=legacyLessons;
      window.HSKCurriculum.previewMode="legacy";
      window.HSKCurriculum.previewMetadata=null;
      document.body.removeAttribute("data-hsk-curriculum-preview");
    },
    disable:function(){this.useLegacy()}
  };
  window.VDuckieHskRuntime={
    requestDeveloperBridge:function(){
      var current=session&&session.user;
      if(!window.__developerPermission||!current||current.email!=="ducnguyenn138@gmail.com"){
        hskRuntimeBridge.disable();
        return Promise.reject(new Error("not authorized"));
      }
      return window.__mockSupabaseClient.auth.getUser(session.access_token).then(function(result){
        if(!result.data.user||result.data.user.id!==current.id)throw new Error("verification failed");
        return hskRuntimeBridge;
      });
    },
    getPublicState:function(){return{mode:"legacy",canonicalAvailable:false,progressWritesEnabled:false}}
  };
  window.VDuckieLocalLearning={prepareForCloud:function(){
    return[{word_key:"爱",hanzi:"爱",is_known:true,is_saved:false}]
  }};
  window.__resetWriteCounters=function(){
    window.__storageWriteCount=0;
    window.__canonicalStorageWriteCount=0;
    window.__supabaseWriteCount=0;
    window.__rpcWriteCount=0;
    window.__expAwardCount=0;
  };
  window.__snapshotSafety=function(){
    var keys=["erp-hsk-progress-v2","erp-hsk-state-v2","vduckie-hsk-section-progress-v1","vduckie-exercise-results-v1","vduckie-review-srs-v1","vduckie-hsk-canonical-progress-v1"];
    var values={};keys.forEach(function(key){values[key]=localStorage.getItem(key)});
    return values;
  };
'''
fixture = fixture.replace(
    "})();\n</script>\n<script src=\"./assets/developer-tabs/overview.js\"></script>",
    injected_setup + "\n})();\n</script>\n<script src=\"./assets/developer-tabs/overview.js\"></script>",
    1,
)
fixture = fixture.replace(
    "</body>",
    '<section id="hskAuditSurface" hidden>'
    '<div id="hskLevels"></div><div id="hskLessonList"></div>'
    '<div id="hskLesson">'
    '<div class="hsk-quiz"><div class="hsk-quiz-prompt"><strong>爱</strong></div>'
    '<button class="correct" data-hsk-option="0">quiz</button></div>'
    '<input id="hskDictationInput" value="我爱你">'
    '<div id="hskDictationFeedback" class="good">Chính xác</div>'
    '<button data-hsk-action="dictation-check" data-answer="我爱你">dictation</button>'
    '<div class="hsk-result pass">pass</div>'
    '</div></section></body>',
    1,
)

hsk_scripts = [
    "assets/hsk-content/hsk-content-feature-flags.js",
    "assets/hsk-content/hsk-content-loader.js",
    "assets/hsk-content/hsk-content-adapter.js",
    "assets/hsk-content/hsk-progress-contract.js",
    "assets/hsk-content/hsk-progress-migration.js",
    "assets/hsk-content/hsk-progress-review.js",
    "assets/hsk-content/hsk-developer-preview.js",
    "assets/v82/account-learning-sync-v82.js",
    "assets/v89/exp-learning-hooks-v89.js",
]
inline_hsk = "".join("<script>" + source(relative) + "</script>" for relative in hsk_scripts)
inline_hsk += "<script>window.supabase.createClient(window.VDUCKIE_SUPABASE_CONFIG.url,window.VDUCKIE_SUPABASE_CONFIG.publishableKey);</script>"
fixture = fixture.replace(
    '<script src="./assets/developer-tabs/overview.js"></script>',
    inline_hsk + '<script src="./assets/developer-tabs/overview.js"></script>',
    1,
)

for relative in [
    "assets/developer-tabs/overview.js",
    "assets/developer-tabs/evolution.js",
    "assets/developer-tabs/animation.js",
    "assets/developer-tabs/learning-speaking.js",
    "assets/developer-debug/debug.js",
    "assets/developer-ui/developer-center-core.js",
    "assets/developer-ui/developer-center.js",
    "assets/developer/developer-control-center.js",
]:
    fixture = fixture.replace(
        f'<script src="./{relative}"></script>',
        "<script>" + source(relative) + "</script>",
    )


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO), **kwargs)

    def do_GET(self):
        if self.path.split("?")[0] == "/phase2b4-harness.html":
            payload = fixture.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def log_message(self, _format, *_args):
        return


chromium = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
if not chromium:
    raise SystemExit("Chromium executable not found")

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base_url = f"http://127.0.0.1:{server.server_address[1]}/phase2b4-harness.html"
results = {"viewports": [], "roles": {}, "failures": {}, "multiTab": {}}

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=chromium, args=["--no-sandbox"])
        for width, height in [(1440, 900), (1024, 768), (390, 844), (320, 568)]:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            console_errors = []
            page.on("console", lambda message, sink=console_errors: sink.append(message.text) if message.type == "error" else None)
            page.goto(base_url + "?role=developer", wait_until="load")
            page.wait_for_selector("#vduckie-developer-center", state="attached")
            page.wait_for_timeout(350)
            page.keyboard.press("Control+Shift+D")
            page.wait_for_selector("#vduckie-developer-center:not([hidden])")
            page.wait_for_timeout(80)
            page.evaluate(
                """() => {
                  localStorage.setItem('erp-hsk-progress-v2', JSON.stringify({'hsk1-1':true}));
                  localStorage.setItem('erp-hsk-state-v2', JSON.stringify({level:1,lesson:0}));
                }"""
            )
            page.wait_for_timeout(950)
            before = page.evaluate("window.__snapshotSafety()")
            page.evaluate("window.__resetWriteCounters()")
            state = page.evaluate(
                """async () => {
                  const bridge=window.VDuckieDeveloper.hskPreview;
                  await bridge.select('canonical');
                  const mapping=await bridge.analyzeLegacyProgress();
                  const firstDryRun=await bridge.runMigrationDryRun();
                  const secondDryRun=await bridge.runMigrationDryRun();
                  await bridge.select('legacy');
                  await bridge.select('canonical');
                  const queue=await bridge.buildProgressReviewQueue();
                  const decision=await bridge.recordProgressReviewDecision('keep-unmatched');
                  const reset=await bridge.resetProgressReviewSession();
                  return {
                    mode:bridge.getState().mode,
                    mapped:mapping.summary.mapped,
                    dryWrites:[firstDryRun.apiWrites,firstDryRun.canonicalStorageWrites],
                    dryRunRepeatEqual:JSON.stringify(firstDryRun)===JSON.stringify(secondDryRun),
                    reviewTotal:queue.summary.total,
                    reviewedBeforeReset:decision.summary.reviewed,
                    unresolvedAfterReset:reset.summary.unresolved
                  };
                }"""
            )
            page.dispatch_event("#hskLesson [data-hsk-option]", "click")
            page.dispatch_event("#hskLesson [data-hsk-action='dictation-check']", "click")
            page.evaluate(
                """() => {
                  const marker=document.createElement('span');
                  marker.textContent='mutation';
                  document.querySelector('#hskLesson').appendChild(marker);
                }"""
            )
            page.wait_for_timeout(450)
            after = page.evaluate("window.__snapshotSafety()")
            writes = page.evaluate(
                """() => ({
                  storage:window.__storageWriteCount,
                  canonicalStorage:window.__canonicalStorageWriteCount,
                  supabase:window.__supabaseWriteCount,
                  rpc:window.__rpcWriteCount,
                  exp:window.__expAwardCount
                })"""
            )
            assert state == {
                "mode": "canonical",
                "mapped": 146,
                "dryWrites": [0, 0],
                "dryRunRepeatEqual": True,
                "reviewTotal": 4,
                "reviewedBeforeReset": 1,
                "unresolvedAfterReset": 4,
            }, state
            assert before == after, (before, after)
            assert writes == {"storage": 0, "canonicalStorage": 0, "supabase": 0, "rpc": 0, "exp": 0}, writes
            layout = page.evaluate(
                """() => {
                  const dialog=document.querySelector('.dev-center-dialog');
                  const rect=dialog.getBoundingClientRect();
                  return {
                    visible:!document.querySelector('#vduckie-developer-center').hidden,
                    overflow:document.documentElement.scrollWidth>innerWidth,
                    inViewport:rect.left>=-.5&&rect.top>=-.5&&rect.right<=innerWidth+.5&&rect.bottom<=innerHeight+.5
                  }
                }"""
            )
            assert layout == {"visible": True, "overflow": False, "inViewport": True}, layout
            relevant_errors = [entry for entry in console_errors if "Leaderboard" not in entry]
            assert relevant_errors == [], relevant_errors
            results["viewports"].append({"width": width, "height": height, "role": "developer", "writes": writes, "layout": layout})

            if width == 1440:
                page.evaluate(
                    """async () => {
                      const bridge=window.VDuckieDeveloper.hskPreview;
                      await bridge.buildProgressReviewQueue();
                      await bridge.recordProgressReviewDecision('keep-unmatched');
                    }"""
                )
                page.reload(wait_until="load")
                page.wait_for_selector("#vduckie-developer-center", state="attached")
                page.wait_for_timeout(350)
                reload_state = page.evaluate(
                    """() => ({
                      mode:window.__hskRuntimeMode,
                      canonicalStorage:localStorage.getItem('vduckie-hsk-canonical-progress-v1'),
                      reviewStatus:window.VDuckieDeveloper.hskPreview.getState().progress.review.status,
                      reviewed:window.VDuckieDeveloper.hskPreview.getState().progress.review.reviewed
                    })"""
                )
                assert reload_state == {"mode": "legacy", "canonicalStorage": None, "reviewStatus": "not-built", "reviewed": 0}, reload_state
                page.evaluate("window.__setSession(null)")
                page.wait_for_timeout(180)
                logout_state = page.evaluate(
                    """() => ({
                      mode:window.__hskRuntimeMode,
                      authorized:window.VDuckieDeveloperControlCenter.isAuthorized(),
                      rootCount:document.querySelectorAll('#vduckie-developer-center').length,
                      bridge:window.VDuckieDeveloper.hskPreview
                    })"""
                )
                assert logout_state == {"mode": "legacy", "authorized": False, "rootCount": 0, "bridge": None}, logout_state
                results["roles"]["logout"] = logout_state
            context.close()

        regular_context = browser.new_context(viewport={"width": 1440, "height": 900})
        regular = regular_context.new_page()
        regular.goto(base_url + "?role=regular&canonical=1&developer=1#hsk", wait_until="load")
        regular.wait_for_timeout(350)
        regular.keyboard.press("Control+Shift+D")
        regular.wait_for_timeout(120)
        regular_state = regular.evaluate(
            """() => ({
              mode:window.__hskRuntimeMode,
              authorized:window.VDuckieDeveloperControlCenter.isAuthorized(),
              rootCount:document.querySelectorAll('#vduckie-developer-center').length,
              publicState:window.VDuckieHskDeveloperPreview.getPublicState()
            })"""
        )
        assert regular_state["mode"] == "legacy", regular_state
        assert regular_state["authorized"] is False and regular_state["rootCount"] == 0, regular_state
        assert regular_state["publicState"] == {
            "mode": "legacy",
            "canonicalAvailable": False,
            "publicOverrideAllowed": False,
            "progressWritesEnabled": False,
            "qualityGate": "locked",
        }, regular_state
        results["roles"]["regular"] = regular_state
        regular_context.close()

        failure_context = browser.new_context(viewport={"width": 1440, "height": 900})
        failure = failure_context.new_page()
        failure.route("**/data/hsk/hsk1/content-index.json", lambda route: route.fulfill(status=404, body=""))
        failure.goto(base_url + "?role=developer", wait_until="load")
        failure.wait_for_selector("#vduckie-developer-center", state="attached")
        failure.wait_for_timeout(350)
        failure.evaluate("window.__resetWriteCounters()")
        load_failure = failure.evaluate(
            """async () => {
              try { await window.VDuckieDeveloper.hskPreview.select('canonical') }
              catch(error) {
                return {
                  error:error.message,
                  mode:window.__hskRuntimeMode,
                  state:window.VDuckieDeveloper.hskPreview.getState(),
                  writes:[window.__storageWriteCount,window.__canonicalStorageWriteCount,window.__supabaseWriteCount,window.__rpcWriteCount,window.__expAwardCount]
                }
              }
              throw new Error('canonical load unexpectedly succeeded')
            }"""
        )
        assert "Unable to load" in load_failure["error"], load_failure
        assert load_failure["mode"] == "legacy", load_failure
        assert load_failure["state"]["mode"] == "legacy" and load_failure["state"]["status"] == "error", load_failure
        assert load_failure["writes"] == [0, 0, 0, 0, 0], load_failure
        results["failures"]["canonical404"] = load_failure
        failure_context.close()

        permission_context = browser.new_context(viewport={"width": 1440, "height": 900})
        permission = permission_context.new_page()
        permission.goto(base_url + "?role=developer", wait_until="load")
        permission.wait_for_selector("#vduckie-developer-center", state="attached")
        permission.wait_for_timeout(350)
        permission.evaluate("window.__developerPermission=false;document.dispatchEvent(new Event('visibilitychange'))")
        permission.wait_for_timeout(180)
        permission_state = permission.evaluate(
            """() => ({
              mode:window.__hskRuntimeMode,
              authorized:window.VDuckieDeveloperControlCenter.isAuthorized(),
              rootCount:document.querySelectorAll('#vduckie-developer-center').length
            })"""
        )
        assert permission_state == {"mode": "legacy", "authorized": False, "rootCount": 0}, permission_state
        results["roles"]["permissionRevoked"] = permission_state
        permission_context.close()

        tabs_context = browser.new_context(viewport={"width": 1024, "height": 768})
        first_tab = tabs_context.new_page()
        second_tab = tabs_context.new_page()
        first_tab.goto(base_url + "?role=developer", wait_until="load")
        second_tab.goto(base_url + "?role=developer", wait_until="load")
        first_tab.wait_for_selector("#vduckie-developer-center", state="attached")
        second_tab.wait_for_selector("#vduckie-developer-center", state="attached")
        first_tab.wait_for_timeout(350)
        second_tab.wait_for_timeout(350)
        first_review = first_tab.evaluate(
            """async () => {
              const bridge=window.VDuckieDeveloper.hskPreview;
              await bridge.buildProgressReviewQueue();
              return (await bridge.recordProgressReviewDecision('keep-unmatched')).summary.reviewed
            }"""
        )
        second_review = second_tab.evaluate("window.VDuckieDeveloper.hskPreview.getState().progress.review.reviewed")
        canonical_storage = second_tab.evaluate("localStorage.getItem('vduckie-hsk-canonical-progress-v1')")
        assert first_review == 1 and second_review == 0 and canonical_storage is None
        results["multiTab"] = {"firstReviewed": first_review, "secondReviewed": second_review, "canonicalStorage": canonical_storage}
        tabs_context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(json.dumps(results, ensure_ascii=False))
