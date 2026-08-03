#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { validateRepository } = require("./hsk-content-lib");

const REQUIRED_SECTIONS = ["situation", "vocabulary", "character", "grammar", "dialogue", "reading", "listening", "pronunciation", "culture-note", "guided-practice", "independent-practice", "summary", "review"];
const REQUIRED_SKILLS = ["vocabulary", "grammar", "listening", "reading", "speaking", "writing", "integrated"];
const PLACEHOLDER = /\b(?:todo|tbd|lorem|placeholder|coming soon|sắp mở)\b|待补|待定/iu;
const TECH_ID = /hsk3-(?:v|grammar|character|lesson|exercise|assessment)-/i;
const HANZI = /[\p{Script=Han}]/u;

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function normalize(value) { return String(value || "").normalize("NFC").toLowerCase().replace(/[\s，。！？、,.!?;；:：'“”"‘’（）()\-]/gu, ""); }
function unique(values) { return [...new Set(values)]; }
function grams(value) { const normalized = normalize(value); const result = new Set(); for (let index = 0; index < normalized.length - 2; index += 1) result.add(normalized.slice(index, index + 3)); return result; }
function similarity(left, right) {
  const a = grams(left); const b = grams(right);
  if (!a.size || !b.size) return normalize(left) === normalize(right) ? 1 : 0;
  let overlap = 0; for (const gram of a) if (b.has(gram)) overlap += 1;
  return (2 * overlap) / (a.size + b.size);
}
function displayStrings(value, key = "") {
  if (typeof value === "string") return /(?:^|_)(?:id|ids|ref|refs|source|path|status)$/i.test(key) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap((item) => displayStrings(item, key));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([childKey, child]) => /(?:id|ids|ref|refs|sourceids|canonicallookup|vocabularyfocus|grammarfocus)$/i.test(childKey) ? [] : displayStrings(child, childKey));
}

function load(root) {
  const hsk3 = path.join(root, "data/hsk/hsk3");
  const vocabularyIndex = readJson(path.join(hsk3, "vocabulary/index.json"));
  const vocabulary = vocabularyIndex.shards.flatMap((shard) => readJson(path.join(hsk3, "vocabulary", shard.file)).records);
  return {
    hsk3,
    vocabularyIndex,
    vocabulary,
    manifest: readJson(path.join(hsk3, "course-manifest.json")),
    units: readJson(path.join(hsk3, "units.json")).records,
    lessons: readJson(path.join(hsk3, "lessons.json")).records,
    grammar: readJson(path.join(hsk3, "grammar.json")).records,
    characters: readJson(path.join(hsk3, "characters.json")).records,
    exercises: readJson(path.join(hsk3, "exercises.json")).records,
    assessments: readJson(path.join(hsk3, "assessments.json")).records,
    provenance: readJson(path.join(hsk3, "provenance/source-snapshot.json")),
    officialFacts: readJson(path.join(hsk3, "provenance/official-vocabulary.json")).facts,
    editorial: readJson(path.join(hsk3, "editorial-c4.json"))
  };
}

function validate(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, ".."));
  const data = load(root); const errors = []; const warnings = [];
  const check = (condition, rule, message, details) => { if (!condition) errors.push({ rule, message, details: details || null }); };
  const warn = (condition, rule, message, details) => { if (!condition) warnings.push({ rule, message, details: details || null }); };
  const repository = validateRepository(root);
  check(repository.ok, "repository-schema", "Generic schema/reference validator must pass", repository.summary);
  const expected = { units: 12, lessons: 36, vocabulary: 500, grammar: 42, characters: 100, exercises: 252, assessments: 15 };
  Object.entries(expected).forEach(([key, count]) => check(data[key].length === count, "count", `${key}: expected ${count}, received ${data[key].length}`));
  check(data.manifest.phase === "C4" && data.manifest.level === 3, "manifest-phase", "HSK3 manifest must identify C4/level 3");
  check(data.manifest.productionEnabled === false && data.manifest.writesProgress === false && data.manifest.readOnly === true && data.manifest.publicOverrideAllowed === false, "progress-safety", "C4 must remain read-only with production/progress writes disabled");

  const vocabularyIds = new Set(); const rows = []; const surfaceSenses = new Map(); const exampleSkeletons = new Map(); const vocabularyExamples = []; let relationCoverage = 0;
  for (const word of data.vocabulary) {
    check(!vocabularyIds.has(word.id), "id-duplicate", `Duplicate vocabulary ID ${word.id}`); vocabularyIds.add(word.id); rows.push(word.officialRow);
    check(word.hskLevel === 3 && word.knowledgeStatus === "new", "level-membership", `${word.id} must be new at HSK3`);
    check(HANZI.test(word.simplified), "hanzi", `${word.id} has no Hanzi`);
    check(Boolean(word.pinyinTone && word.pinyinNumber && word.pinyinNormalized), "pinyin", `${word.id} lacks pinyin fields`);
    check(Boolean(word.meaningVi && word.partOfSpeech.length) && !/nghĩa được giải thích/i.test(word.meaningVi), "lexical-fields", `${word.id} lacks a resolved Vietnamese meaning or part of speech`);
    check(word.sourceIds.includes("cti-hsk3-current-syllabus-2026") && word.sourceIds.includes("vduckie-hsk3-c4-original"), "provenance", `${word.id} lacks official/original provenance`);
    check(word.examples.length >= 1 && word.examples.every((example) => example.zh.includes(word.simplified) && example.vi), "target-example", `${word.id} example must contain target and Vietnamese support`);
    check(word.collocations.length >= 1 && word.collocations.every((item) => item.zh.includes(word.simplified) && item.vi) && word.usageNoteVi, "pedagogy", `${word.id} lacks target-bearing collocation/usage guidance`);
    check(Array.isArray(word.commonErrorsVi) && word.commonErrorsVi.length >= 1 && word.commonErrorsVi.every((item) => item.includes(word.simplified)), "vietnamese-errors", `${word.id} lacks a target-specific Vietnamese learner warning`);
    if ((word.synonyms || []).length + (word.antonyms || []).length + (word.confusables || []).length) relationCoverage += 1;
    const senses = surfaceSenses.get(word.simplified) || []; senses.push(word.senseKey); surfaceSenses.set(word.simplified, senses);
    const skeleton = normalize(word.examples[0].zh.replaceAll(word.simplified, "{target}")); const list = exampleSkeletons.get(skeleton) || []; list.push(word.id); exampleSkeletons.set(skeleton, list);
    vocabularyExamples.push({ id: word.id, text: word.examples[0].zh });
  }
  check(rows.slice().sort((a, b) => a - b).every((row, index) => row === 501 + index), "official-coverage", "Official vocabulary rows must cover 501–1000 exactly once");
  check(data.officialFacts.length === 500 && data.officialFacts.every((fact, index) => fact.row === 501 + index), "source-snapshot", "Committed official facts must cover rows 501–1000 in order");
  check(unique(data.officialFacts.map((fact) => `${fact.row}:${fact.officialHeadword}:${fact.pinyin}`)).length === 500, "source-snapshot", "Official facts contain duplicates");
  check(relationCoverage >= 80, "lexical-relations", `At least 80 vocabulary records need a synonym, antonym or confusable; received ${relationCoverage}`);
  const repeatedExampleSkeletons = [...exampleSkeletons.entries()].filter(([, ids]) => ids.length > 8).map(([skeleton, ids]) => ({ skeleton, count: ids.length, ids: ids.slice(0, 10) }));
  check(repeatedExampleSkeletons.length === 0, "repeated-vocabulary-template", "Vocabulary examples repeat one substitution frame more than eight times", repeatedExampleSkeletons);
  const vocabularyExampleKeys = new Map(); vocabularyExamples.forEach((item) => { const key = normalize(item.text); const ids = vocabularyExampleKeys.get(key) || []; ids.push(item.id); vocabularyExampleKeys.set(key, ids); });
  const vocabularyExactDuplicates = [...vocabularyExampleKeys.values()].filter((ids) => ids.length > 1);
  check(vocabularyExactDuplicates.length === 0, "vocabulary-example-duplicate", "Vocabulary examples contain exact duplicates", vocabularyExactDuplicates);
  const vocabularyNearDuplicates = []; for (let left = 0; left < vocabularyExamples.length; left += 1) for (let right = left + 1; right < vocabularyExamples.length; right += 1) { const score = similarity(vocabularyExamples[left].text, vocabularyExamples[right].text); if (score >= 0.92) vocabularyNearDuplicates.push({ a: vocabularyExamples[left].id, b: vocabularyExamples[right].id, score: Number(score.toFixed(3)) }); }
  check(vocabularyNearDuplicates.length === 0, "vocabulary-example-near-duplicate", "Vocabulary examples contain near-duplicates", vocabularyNearDuplicates.slice(0, 30));

  const assigned = new Map(); const inputs = []; const display = [];
  for (const lesson of data.lessons) {
    lesson.vocabularyRefs.forEach((id) => assigned.set(id, (assigned.get(id) || 0) + 1));
    const types = lesson.sections.map((section) => section.type);
    REQUIRED_SECTIONS.forEach((type) => check(types.filter((item) => item === type).length === 1, "section-coverage", `${lesson.id} must contain exactly one ${type}`));
    check(lesson.knowledgeMap && lesson.knowledgeMap.new && lesson.knowledgeMap.review && lesson.knowledgeMap.reinforcement && lesson.knowledgeMap.extension, "knowledge-status", `${lesson.id} lacks new/review/reinforcement/extension map`);
    const reading = lesson.sections.find((section) => section.type === "reading").content;
    const listening = lesson.sections.find((section) => section.type === "listening").content;
    const dialogue = lesson.sections.find((section) => section.type === "dialogue").content;
    const culture = lesson.sections.find((section) => section.type === "culture-note").content;
    check(reading.textZh.length >= 45 && reading.textZh.length <= 260, "level-appropriateness", `${lesson.id} reading must stay in the HSK3 45–260 character envelope`, reading.textZh.length);
    check(reading.questionsVi.length >= 2 && reading.answerKey.length === reading.questionsVi.length && reading.answerKey.every((answer) => answer.evidenceZh && answer.explanationVi && reading.textZh.includes(answer.evidenceZh)), "reading-answers", `${lesson.id} needs exact textual evidence and explanation for every reading answer`);
    check(listening.audioStatus === "script-ready-audio-pending" && listening.scriptZh.length >= 30 && listening.questionsVi.length >= 2 && listening.answerKey.length === listening.questionsVi.length, "listening-coverage", `${lesson.id} listening needs a pending-labelled transcript and answer key`);
    check(dialogue.scriptZh.split("\n").length >= 4 && dialogue.tasks.some((task) => /vai|role|đổi/i.test(task)), "dialogue-quality", `${lesson.id} dialogue needs 4+ turns and role-play`);
    check(culture.noteVi.length >= 70 && /không phải quy tắc|tùy|tránh|cần|nên|không luôn|khác nhau|không đồng nhất|không gán|không thay|không phải lúc nào/i.test(`${culture.noteVi} ${culture.cautionVi}`), "culture-quality", `${lesson.id} culture note must be contextual and non-essentializing`);
    inputs.push({ id: `${lesson.id}:dialogue`, text: dialogue.scriptZh }, { id: `${lesson.id}:reading`, text: reading.textZh }, { id: `${lesson.id}:listening`, text: listening.scriptZh });
    display.push(...displayStrings({ titleZh: lesson.titleZh, titleVi: lesson.titleVi, objectives: lesson.objectives, sections: lesson.sections }));
    check(!PLACEHOLDER.test(JSON.stringify(lesson)), "placeholder", `${lesson.id} contains a placeholder`);
  }
  for (const id of vocabularyIds) check(assigned.get(id) === 1, "lesson-assignment", `${id} must be introduced exactly once`, assigned.get(id) || 0);
  const grammarCoverage = new Set(data.lessons.flatMap((lesson) => lesson.grammarRefs)); const characterCoverage = new Set(data.lessons.flatMap((lesson) => lesson.characterRefs));
  check(grammarCoverage.size === data.grammar.length, "grammar-coverage", "Every grammar record must be assigned to a lesson", { assigned: grammarCoverage.size, total: data.grammar.length });
  check(characterCoverage.size === data.characters.length, "character-coverage", "Every character record must be assigned to a lesson", { assigned: characterCoverage.size, total: data.characters.length });
  const grammarErrorExamples = new Set(); data.grammar.forEach((grammar) => { check(grammar.formula && grammar.communicativeFunctionVi && grammar.correctExamples.length && grammar.incorrectExamples.length && grammar.commonErrorsVi.length, "grammar-depth", `${grammar.id} lacks form/function/examples/error support`); check(grammar.sourceIds.includes("cti-hsk3-current-syllabus-2026"), "grammar-provenance", `${grammar.id} lacks official alignment source`); check(!grammarErrorExamples.has(grammar.incorrectExamples[0].zh), "grammar-error-duplicate", `${grammar.id} repeats another grammar error example`); grammarErrorExamples.add(grammar.incorrectExamples[0].zh); });
  data.characters.forEach((character) => { check(character.strokeCount > 0 && character.radical && character.readings.length, "character-fields", `${character.id} lacks radical/reading/stroke count`); check(character.mnemonic && character.mnemonic.type === "memory-aid-not-etymology", "mnemonic-label", `${character.id} mnemonic is not labelled as a memory aid`); check(character.strokeOrderStatus !== "verified-asset" && !character.strokeOrderAsset, "asset-truth", `${character.id} must not claim an unverified stroke asset`); });

  const formats = new Set(); const skills = new Set(); const exerciseIds = new Set();
  for (const exercise of data.exercises) {
    check(!exerciseIds.has(exercise.id), "id-duplicate", `Duplicate exercise ID ${exercise.id}`); exerciseIds.add(exercise.id); formats.add(exercise.format); skills.add(exercise.skill);
    check(exercise.prompt && exercise.explanationVi, "exercise-explanation", `${exercise.id} lacks prompt/explanation`);
    check(exercise.answer !== undefined && Array.isArray(exercise.acceptedAnswers) && exercise.acceptedAnswers.length >= 1, "accepted-answer", `${exercise.id} lacks a usable answer contract`);
    check(new Set(exercise.options).size === exercise.options.length, "option-quality", `${exercise.id} has duplicate options`);
    check(!PLACEHOLDER.test(JSON.stringify(exercise)), "placeholder", `${exercise.id} contains a placeholder`);
    display.push(exercise.prompt, exercise.explanationVi);
  }
  check(formats.size >= 35, "exercise-diversity", `Need at least 35 genuine exercise formats, received ${formats.size}`);
  REQUIRED_SKILLS.forEach((skill) => check(skills.has(skill), "skill-coverage", `Missing exercise skill ${skill}`));
  check(data.assessments.filter((assessment) => assessment.assessmentType === "mini-checkpoint").length === 12, "assessment-coverage", "Need one checkpoint per HSK3 unit");
  ["midpoint", "final", "mastery-review"].forEach((type) => check(data.assessments.some((assessment) => assessment.assessmentType === type), "assessment-coverage", `Missing ${type} assessment`));
  const exerciseById = new Map(data.exercises.map((exercise) => [exercise.id, exercise]));
  data.assessments.forEach((assessment) => {
    const resolved = assessment.exerciseRefs.map((id) => exerciseById.get(id));
    check(assessment.exerciseRefs.length >= 10 && resolved.every(Boolean) && assessment.rubric && assessment.targetGrammar.length && assessment.targetVocabulary.length, "assessment-contract", `${assessment.id} lacks references, coverage or mastery rubric`);
    const actual = Object.fromEntries(["listening", "grammar", "reading", "speaking", "writing"].map((skill) => [skill, resolved.filter((exercise) => exercise && exercise.skill === skill).length]));
    check(Object.values(actual).every((count) => count > 0), "assessment-skill-coverage", `${assessment.id} must assess five skills`, actual);
    check(Object.keys(actual).every((skill) => assessment.sections[skill] === actual[skill]), "assessment-section-count", `${assessment.id} declared sections do not match actual skills`, { declared: assessment.sections, actual });
    if (assessment.assessmentType === "mastery-review") check(actual.speaking + actual.writing > actual.listening + actual.grammar + actual.reading, "mastery-production", `${assessment.id} must emphasize productive transfer`, actual);
  });

  const exact = new Map(); inputs.forEach((item) => { const key = normalize(item.text); const list = exact.get(key) || []; list.push(item.id); exact.set(key, list); }); const exactDuplicates = [...exact.values()].filter((items) => items.length > 1);
  check(exactDuplicates.length === 0, "exact-duplicate", "Dialogue/reading/listening inputs contain exact duplicates", exactDuplicates);
  const near = []; for (let left = 0; left < inputs.length; left += 1) for (let right = left + 1; right < inputs.length; right += 1) { const score = similarity(inputs[left].text, inputs[right].text); if (score >= 0.91) near.push({ a: inputs[left].id, b: inputs[right].id, score: Number(score.toFixed(3)) }); }
  check(near.length === 0, "near-duplicate", "Dialogue/reading/listening inputs contain near-duplicates", near);
  const lessonFingerprints = data.lessons.map((lesson) => normalize(`${lesson.objectives[0]}|${lesson.sections.find((section) => section.type === "independent-practice").content.realWorldTaskVi}`));
  check(new Set(lessonFingerprints).size === lessonFingerprints.length, "semantic-duplicate", "Every lesson must have a distinct objective + real-world transfer task");
  const exerciseFingerprints = data.exercises.map((exercise) => normalize(`${exercise.format}|${exercise.prompt}`)); check(new Set(exerciseFingerprints).size === exerciseFingerprints.length, "exercise-duplicate", "Exercise format + prompt fingerprints must be unique");
  check(display.every((text) => !TECH_ID.test(text)), "technical-id-leakage", "Learner-facing copy contains a canonical technical ID", display.filter((text) => TECH_ID.test(text)).slice(0, 10));
  check(data.provenance.officialVocabulary.sha256 === "ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941" && data.provenance.officialVocabulary.rows === "501-1000", "source-snapshot", "Official source hash/locator is missing or changed");
  check(data.editorial.editorialSampling.sampledLessonIds.length >= 7 && data.editorial.editorialSampling.humanSignoffRequired === true, "editorial-report", "C4 needs stratified editorial sampling and explicit human-signoff status");
  warn(data.manifest.reviewGate.vietnameseHumanReview === true, "human-signoff", "Independent Vietnamese human signoff remains required");
  warn(data.manifest.reviewGate.chinesePedagogyHumanReview === true, "human-signoff", "Independent Chinese pedagogy signoff remains required");
  warn(data.manifest.reviewGate.audioRecorded === true, "audio-pending", "Verified human-recorded audio remains pending");
  warn(data.manifest.reviewGate.strokeOrderVerified === true, "stroke-pending", "Verified stroke-order assets remain pending");

  return { ok: errors.length === 0, generatedAt: "2026-08-03", phase: "C4", level: 3, errors, warnings, summary: { ...expected, dialogues: data.lessons.length, listeningTranscripts: data.lessons.length, readings: data.lessons.length, speakingTasks: data.lessons.length, writingTasks: data.lessons.length, cultureNotes: data.lessons.length, exerciseFormats: formats.size, skills: [...skills].sort(), officialRows: "501-1000", cumulativeVocabulary: 1000, lexicalRelationCoverage: relationCoverage, repeatedExampleSkeletons: repeatedExampleSkeletons.length, vocabularyExactDuplicates: vocabularyExactDuplicates.length, vocabularyNearDuplicates: vocabularyNearDuplicates.length, exactDuplicates: exactDuplicates.length, nearDuplicates: near.length, semanticFingerprintDuplicates: 0, repositoryErrors: repository.summary.errors, humanSignoffRequired: true } };
}

function main() { const rootArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--")); const root = path.resolve(rootArgument || path.join(__dirname, "..")); const result = validate(root); if (process.argv.includes("--write-report")) fs.writeFileSync(path.join(root, "reports/hsk3-c4-quality-report.json"), `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exitCode = 1; }
if (require.main === module) main();
module.exports = { validate, normalize, similarity };
