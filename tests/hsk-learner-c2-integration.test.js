const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const runtime = require(path.join(root, 'assets/hsk-content/hsk-professional-runtime.js'));
const flags = require(path.join(root, 'assets/hsk-content/hsk-content-feature-flags.js'));
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

test('learner-facing HSK1 flag is read-only while canonical production remains locked', () => {
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED, true);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_QUALITY_GATE, 'locked');
  const access = flags.resolveHskCurriculumAccess({});
  assert.equal(access.learnerReadOnly, true);
  assert.equal(access.readOnly, true);
  assert.equal(access.progressWritesEnabled, false);
  assert.equal(flags.shouldUseCanonicalCurriculum({}), false, 'legacy developer adapter must not auto-activate');
});

test('C2 course collections are complete and internally resolvable for learner UI', () => {
  const manifest = readJson('data/hsk/hsk1/course-manifest.json');
  const units = readJson('data/hsk/hsk1/units.json').records;
  const lessons = readJson('data/hsk/hsk1/lessons.json').records;
  const grammar = readJson('data/hsk/hsk1/grammar.json').records;
  const characters = readJson('data/hsk/hsk1/characters.json').records;
  const exercises = readJson('data/hsk/hsk1/exercises.json').records;
  const assessments = readJson('data/hsk/hsk1/assessments.json').records;
  const enrichment = readJson('data/hsk/hsk1/vocabulary-enrichment.json').entries;
  const vocabIndex = readJson('data/hsk/hsk1/vocabulary/index.json');
  const vocabulary = vocabIndex.shards.flatMap((shard) => readJson('data/hsk/hsk1/vocabulary/' + shard.file).records);

  runtime.verifyCourse(manifest, units, lessons, grammar, characters, exercises, assessments, enrichment, vocabulary);
  assert.equal(units.length, 10);
  assert.equal(lessons.length, 24);
  assert.equal(grammar.length, 21);
  assert.equal(characters.length, 50);
  assert.equal(exercises.length, 120);
  assert.equal(assessments.length, 13);
  assert.equal(vocabulary.length, 300);

  const lessonIds = new Set(lessons.map((x) => x.id));
  const grammarIds = new Set(grammar.map((x) => x.id));
  const charIds = new Set(characters.map((x) => x.id));
  const exerciseIds = new Set(exercises.map((x) => x.id));
  const assessmentIds = new Set(assessments.map((x) => x.id));
  for (const unit of units) {
    assert.ok(unit.lessonRefs.length >= 2);
    for (const ref of unit.lessonRefs) assert.ok(lessonIds.has(ref.id), `${unit.id} lesson ${ref.id}`);
    assert.ok(assessmentIds.has(unit.checkpointRef.id), `${unit.id} checkpoint`);
  }
  for (const lesson of lessons) {
    assert.equal(lesson.practiceRefs.length, 5, `${lesson.id} must expose five exercises`);
    for (const id of lesson.practiceRefs) assert.ok(exerciseIds.has(id), `${lesson.id} exercise ${id}`);
    for (const id of lesson.grammarRefs || []) assert.ok(grammarIds.has(id), `${lesson.id} grammar ${id}`);
    for (const id of lesson.characterRefs || []) assert.ok(charIds.has(id), `${lesson.id} character ${id}`);
    const types = new Set(lesson.sections.map((s) => s.type));
    for (const type of ['vocabulary','grammar','dialogue','reading','listening','pronunciation','guided-practice','independent-practice','summary','review']) {
      assert.ok(types.has(type), `${lesson.id} missing ${type}`);
    }
  }
  for (const assessment of assessments) {
    assert.ok(assessment.exerciseRefs.length > 0);
    for (const id of assessment.exerciseRefs) assert.ok(exerciseIds.has(id), `${assessment.id} exercise ${id}`);
  }
});

test('learner runtime resolves canonical and support-only vocabulary without inventing canonical status', () => {
  const data = {
    vocabularyBySimplified: {
      '爱': { simplified: '爱', pinyin: 'ài', meaningVi: 'yêu; yêu thích', partOfSpeech: ['verb'] }
    },
    enrichmentBySimplified: {
      '爱': { simplified: '爱', collocations: [{ zh: '爱家人', vi: 'yêu gia đình' }], commonErrorsVi: ['test'] }
    }
  };
  const canonical = runtime.resolveFocusWord(data, { simplified: '爱', lexicalStatus: 'canonical' });
  assert.equal(canonical.pinyin, 'ài');
  assert.equal(canonical.meaningVi, 'yêu; yêu thích');
  assert.equal(canonical.lexicalStatus, 'canonical');
  const support = runtime.resolveFocusWord(data, { simplified: '越南', lexicalStatus: 'support-only', canonicalLookup: null });
  assert.equal(support.meaningVi, 'Việt Nam');
  assert.equal(support.lexicalStatus, 'support-only');
});

test('answer normalization is tolerant only to display punctuation/spacing', () => {
  assert.equal(runtime.normalizeAnswer(' 一、七、八、十。 '), runtime.normalizeAnswer('一 七 八 十'));
  assert.notEqual(runtime.normalizeAnswer('现在九点'), runtime.normalizeAnswer('九点现在'));
});

test('static app shell exposes required learner HSK mount points and runtime boot is minimal', () => {
  const shell = fs.readFileSync(path.join(root, 'app-shell-v88.html'), 'utf8');
  for (const id of ['hsk', 'hskLesson', 'hskLevels', 'hskLessonList', 'hskProgress']) assert.match(shell, new RegExp(`id=["']${id}["']`));
  const flagSource = fs.readFileSync(path.join(root, 'assets/hsk-content/hsk-content-feature-flags.js'), 'utf8');
  assert.match(flagSource, /hsk-professional-runtime\.js/);
  assert.match(flagSource, /hsk-professional-runtime\.css/);
  const runtimeSource = fs.readFileSync(path.join(root, 'assets/hsk-content/hsk-professional-runtime.js'), 'utf8');
  assert.doesNotMatch(runtimeSource, /localStorage\.setItem|sessionStorage\.setItem|supabase|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/i);
  assert.match(runtimeSource, /progressWritesEnabled:\s*false/);
});
