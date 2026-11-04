import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const source = read('assets/hsk-content/hsk-study-journey-v1.js');
function createJournal() {
  const storage = new Map();
  const fired = [];
  const context = {
    localStorage: {
      getItem: (key) => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    },
    document: { dispatchEvent: (event) => fired.push(event.type) },
    CustomEvent: function (name, detail) { this.type = name; this.detail = detail.detail; },
    Date, JSON, Math
  };
  vm.runInNewContext(source, context, {filename:'hsk-study-journey-v1.js'});
  return {journal: context.VDuckieHskStudyJourney, storage, fired};
}

test('visiting lessons saves a separate HSK journal without modifying legacy progress', () => {
  const {journal, storage, fired} = createJournal();
  assert.equal(journal.summary().totalCompleted, 0);
  assert.equal(journal.visit(2,'hsk2-lesson-01'), true);
  assert.equal(journal.current().level, 2);
  assert.equal(journal.current().lessonId, 'hsk2-lesson-01');
  assert.ok(storage.has('vduckie-hsk-study-journey-v1'));
  assert.ok(!storage.has('erp-hsk-progress-v2'));
  assert.ok(!storage.has('vduckie-exercise-results-v1'));
  assert.ok(fired.includes('vduckie:hsk-study-journey-change'));
});

test('completion requires checking every exercise; rubric counts as reviewed, not automatically correct', () => {
  const {journal} = createJournal();
  assert.equal(journal.recordAnswer(1,'hsk1-lesson-01','q1',true), true);
  assert.deepEqual(JSON.parse(JSON.stringify(journal.complete(1,'hsk1-lesson-01',2,[]))), {
    ok:false,reason:'unfinished-practice',remaining:1,checked:1,total:2
  });
  assert.equal(journal.recordAnswer(1,'hsk1-lesson-01','q2',null), true);
  const result = journal.complete(1,'hsk1-lesson-01',2,[
    {hanzi:'学习',pinyin:'xuéxí',meaningVi:'học tập'}
  ]);
  assert.equal(result.ok,true);
  assert.equal(result.correct,1);
  assert.equal(result.graded,1);
  assert.equal(result.checked,2);
  assert.equal(journal.levelCount(1),1);
  assert.equal(journal.summary().totalCompleted,1);
});

test('review is scheduled, can be graded, and a repeated finish does not reset its due date', () => {
  const {journal,storage} = createJournal();
  journal.complete(1,'hsk1-lesson-01',0,[{hanzi:'你好',pinyin:'nǐ hǎo',meaningVi:'xin chào'}]);
  let saved = JSON.parse(storage.get(journal.KEY));
  const key = '1:你好';
  const originalAt = saved.reviews[key].nextAt;
  assert.ok(originalAt > Date.now());
  saved.reviews[key].nextAt = Date.now() - 1000;
  storage.set(journal.KEY, JSON.stringify(saved));
  assert.equal(journal.due().length,1);
  assert.equal(journal.reviewWord(1,'你好',true),true);
  assert.equal(journal.due().length,0);
  const scheduled = JSON.parse(storage.get(journal.KEY)).reviews[key].nextAt;
  assert.ok(scheduled > Date.now());
  journal.complete(1,'hsk1-lesson-01',0,[{hanzi:'你好'}]);
  assert.equal(JSON.parse(storage.get(journal.KEY)).reviews[key].nextAt,scheduled);
  assert.ok(originalAt > 0);
});

test('canonical progress stays explicitly read-only while learner UI is an additive layer', () => {
  const pro = read('assets/hsk-content/hsk-professional-runtime.js');
  const flags = read('assets/hsk-content/hsk-content-feature-flags.js');
  const flow = read('assets/hsk-content/hsk-study-flow-v1.js');
  const entry = read('assets/curriculum/graded-hsk-entry.js');
  const home = read('app-shell-v88.html');
  const sync = read('assets/v82/account-learning-sync-v82.js');
  assert.match(pro,/progressWritesEnabled: false/);
  assert.match(flags,/HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: false/);
  assert.match(pro,/VDuckieHskStudyFlow\.onChecked\(id,correct\)/);
  assert.match(pro,/VDuckieHskStudyFlow\.decorate/);
  assert.match(flow,/data-hsk-finish/);
  assert.match(entry,/data-graded-continue/);
  assert.match(home,/data-daily-nav="msutong">Bắt đầu học HSK/);
  assert.match(sync,/"vduckie-hsk-study-journey-v1": true/);
  assert.doesNotMatch(flow,/erp-hsk-progress-v2|VDuckieEXP/);
});

test('bootstrap and PWA load the new study components before the HSK content flags', () => {
  const index = read('index.html');
  const worker = read('service-worker.js');
  const loader = read('assets/hsk-content/hsk-content-feature-flags.js');
  assert.ok(index.indexOf("hsk-study-flow-v1.js?v=word-float1") < index.indexOf("hsk-content-feature-flags.js?v=phase2.1"));
  assert.match(index,/hsk-study-journey-v1\.css\?v=phase2.3/);
  assert.match(worker,/vduckie-pwa-v31/);
  assert.match(loader,/hsk-professional-runtime\.js\?v=phase2.4/);
  for(const file of ['assets/hsk-content/hsk-study-journey-v1.js',
    'assets/hsk-content/hsk-study-flow-v1.js','assets/curriculum/graded-hsk-entry.js',
    'assets/hsk-content/hsk-professional-runtime.js','assets/v86/home-dashboard-v86.5.js']){
    assert.doesNotThrow(()=>new vm.Script(read(file)),file);
  }
});
