#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const HSK1 = path.join(ROOT, "data", "hsk", "hsk1");
const PATCH_PATH = path.join(HSK1, "editorial-c2.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}
function writeJson(file, data) {
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
function lessonSection(lesson, type) {
  const section = lesson.sections.find((item) => item.type === type);
  if (!section) throw new Error(`${lesson.id}: missing section ${type}`);
  return section;
}
function unique(values) {
  return [...new Set(values)];
}
function lessonId(index) {
  return `hsk1-lesson-${String(index).padStart(2, "0")}`;
}
function exerciseId(index, slot) {
  return `${lessonId(index)}-exercise-${slot}`;
}

function loadDocuments() {
  return {
    lessons: readJson("data/hsk/hsk1/lessons.json"),
    exercises: readJson("data/hsk/hsk1/exercises.json"),
    grammar: readJson("data/hsk/hsk1/grammar.json"),
    assessments: readJson("data/hsk/hsk1/assessments.json"),
    course: readJson("data/hsk/hsk1/course-manifest.json"),
    manifest: readJson("data/hsk/manifest.json"),
    level: readJson("data/hsk/hsk1/level.json"),
    units: readJson("data/hsk/hsk1/units.json"),
    vocabularyEnrichment: readJson("data/hsk/hsk1/vocabulary-enrichment.json")
  };
}

function makeFocusItem(word, focusCatalog, enrichmentByWord) {
  if (focusCatalog.has(word)) return structuredClone(focusCatalog.get(word));
  const enrichment = enrichmentByWord.get(word);
  if (enrichment) {
    return {
      simplified: word,
      canonicalLookup: { field: "simplified", value: word },
      lexicalStatus: "canonical",
      collocations: structuredClone(enrichment.collocations || []),
      commonErrorsVi: structuredClone(enrichment.commonErrorsVi || []),
      reviewStatus: "editorial-enriched"
    };
  }
  return {
    simplified: word,
    canonicalLookup: { field: "simplified", value: word },
    lexicalStatus: "canonical",
    collocations: [],
    commonErrorsVi: [],
    reviewStatus: "lesson-focus-only"
  };
}

function applyLessons(documents, patch) {
  const lessons = documents.lessons.records;
  const focusCatalog = new Map();
  for (const lesson of lessons) {
    for (const item of lessonSection(lesson, "vocabulary").content.focusWords) {
      if (!focusCatalog.has(item.simplified)) focusCatalog.set(item.simplified, structuredClone(item));
    }
  }
  const enrichmentByWord = new Map(
    documents.vocabularyEnrichment.entries.map((item) => [item.simplified, item])
  );

  lessons.forEach((lesson, offset) => {
    const index = offset + 1;
    const editorial = patch.lessonPatches[lesson.id];
    if (!editorial) throw new Error(`${lesson.id}: missing C2 editorial patch`);
    const meta = patch.lessonMetaPatches[String(index)] || {};

    if (meta.titleZh) lesson.titleZh = meta.titleZh;
    if (meta.titleVi) lesson.titleVi = meta.titleVi;
    if (meta.objective) lesson.objectives[0] = meta.objective;

    lesson.contentVersion = 2;
    lesson.reviewMetadata = {
      reviewStage: 2,
      reviewReason: "Phase C2 lesson-by-lesson editorial pass: Chinese naturalness, Vietnamese pedagogy, input/output diversity and HSK1 scope audited; independent human sign-off still required.",
      firstIntroducedIn: "phase-c1",
      lastEditorialPass: "phase-c2",
      humanSignoffRequired: true
    };

    const situation = lessonSection(lesson, "situation").content;
    const vocabulary = lessonSection(lesson, "vocabulary").content;
    const dialogue = lessonSection(lesson, "dialogue").content;
    const reading = lessonSection(lesson, "reading").content;
    const listening = lessonSection(lesson, "listening").content;
    const guided = lessonSection(lesson, "guided-practice").content;
    const summary = lessonSection(lesson, "summary").content;
    const review = lessonSection(lesson, "review").content;

    if (editorial.situationVi) situation.promptVi = editorial.situationVi;
    situation.successCriterionVi = lesson.objectives[0];
    if (editorial.dialogueZh) dialogue.scriptZh = editorial.dialogueZh;

    reading.textZh = editorial.reading.textZh;
    reading.questionsVi = editorial.reading.questions.map((item) => item.qVi);
    reading.answerKey = structuredClone(editorial.reading.questions);

    listening.scriptZh = editorial.listening.scriptZh;
    listening.questionsVi = editorial.listening.questions.map((item) => item.qVi);
    listening.answerKey = structuredClone(editorial.listening.questions);
    listening.scriptOrTeacherBriefVi = "Dùng transcript tiếng Trung làm nguồn thu âm; khi chưa có audio đã kiểm duyệt, UI phải hiển thị trạng thái audio pending và cho phép học bằng transcript.";
    listening.audioStatus = "script-ready-audio-pending";

    guided.steps = structuredClone(editorial.guidedSteps);
    summary.checklist = structuredClone(editorial.summaryChecklist);

    const previousLessonIds = lessons
      .slice(Math.max(0, offset - 3), offset)
      .map((item) => item.id);
    review.retrievalMix = [
      `Ngày 1: trả lời lại một câu đọc/nghe của ${lesson.titleVi} mà không nhìn đáp án.`,
      index > 1 ? "Ngày 3: kéo lại một cấu trúc của bài trước và đổi thông tin." : "Ngày 3: đọc lại bốn thanh theo thứ tự mới.",
      index > 2 ? "Ngày 7: trộn từ/cấu trúc của hai bài cũ vào một câu mới." : "Ngày 7: nhận diện lại chữ/từ trọng tâm không nhìn pinyin.",
      "Ngày 14/30: làm lại một nhiệm vụ nói hoặc viết, so sánh với bản cũ và tự sửa."
    ];
    review.retrievalFromLessonIds = previousLessonIds;
    review.reviewPolicyVi = "Kiến thức cũ quay lại được đánh dấu reinforcement; không tính là nội dung mới.";

    const remove = new Set(meta.removeFocus || []);
    let focusWords = vocabulary.focusWords.filter((item) => !remove.has(item.simplified));
    const existing = new Set(focusWords.map((item) => item.simplified));
    for (const word of meta.addFocus || []) {
      if (!existing.has(word)) {
        focusWords.push(makeFocusItem(word, focusCatalog, enrichmentByWord));
        existing.add(word);
      }
    }
    for (const item of focusWords) {
      item.assessmentEligible = item.lexicalStatus === "canonical";
      if (item.lexicalStatus === "derived-phrase") {
        item.supportOnly = true;
        item.reviewStatus = "c2-support-only";
        if (patch.derivedSupportReasons[item.simplified]) {
          item.supportReason = patch.derivedSupportReasons[item.simplified];
          if (item.simplified === "杯") item.assessmentEligible = true;
        }
      }
    }
    vocabulary.focusWords = focusWords;
  });
}

function applyGrammar(documents, patch) {
  for (const record of documents.grammar.records) {
    record.contentVersion = 2;
    record.reviewStatus = "linguistic-reviewed";

    if (record.id === "hsk1-grammar-demonstratives") {
      record.incorrectExamples = [{
        zh: "这杯书很好。",
        explanationVi: "Lượng từ không khớp: với 书, mẫu cơ bản dùng 本 → 这本书很好。"
      }];
      record.commonErrorsVi = ["Bỏ lượng từ trong mẫu đếm/chỉ định cơ bản hoặc dùng 个 cho mọi danh từ."];
    }
    if (record.id === "hsk1-grammar-le-change") {
      record.meaningVi = "了 có hai chức năng HSK1 cần phân biệt: sau động từ để đánh dấu hành động hoàn thành trong ngữ cảnh phù hợp; cuối câu để báo một tình huống/trạng thái mới.";
      record.usageVi = [
        "Động từ + 了: chú ý phạm vi hành động và ngữ cảnh, không coi 了 là ‘thì quá khứ’.",
        "Câu + 了: nhấn sự thay đổi/tình huống mới, ví dụ 下雨了、太贵了."
      ];
      record.commonErrorsVi = ["Dùng 了 như dấu quá khứ bắt buộc cho mọi câu có ‘đã’ trong tiếng Việt."];
    }
    if (record.id === "hsk1-grammar-progressive") {
      record.usageVi = [
        "在/正在 đứng trước động từ; 正在 nhấn mạnh tiến hành rõ hơn.",
        "呢 có thể xuất hiện cuối câu tiến hành nhưng không bắt buộc trong mọi câu."
      ];
    }
    if (record.id === "hsk1-grammar-question-words") {
      record.usageVi = [
        "谁、什么、哪儿/哪里、几、多少、怎么、怎么样 giữ vị trí của thành phần cần hỏi.",
        "Không thêm 吗 vào câu đã có từ nghi vấn; 几 thường đi với lượng từ trong câu hỏi số lượng."
      ];
    }
  }

  const byId = new Map(documents.grammar.records.map((item) => [item.id, item]));
  for (const addition of patch.grammarAdditions) {
    if (byId.has(addition.id)) Object.assign(byId.get(addition.id), structuredClone(addition));
    else {
      documents.grammar.records.push(structuredClone(addition));
      byId.set(addition.id, documents.grammar.records.at(-1));
    }
  }

  // Normalize review metadata after additions too, so C2 generation is idempotent
  // whether it starts from the C1 baseline or from an already materialized C2 checkout.
  for (const record of documents.grammar.records) {
    record.contentVersion = 2;
    record.reviewStatus = "linguistic-reviewed";
  }

  for (const [indexText, refs] of Object.entries(patch.grammarRefAdditions)) {
    const lesson = documents.lessons.records[Number(indexText) - 1];
    for (const ref of refs) {
      if (!lesson.grammarRefs.includes(ref)) lesson.grammarRefs.push(ref);
      const sectionRefs = lessonSection(lesson, "grammar").content.grammarRefs;
      if (!sectionRefs.includes(ref)) sectionRefs.push(ref);
    }
  }

  const lesson23 = documents.lessons.records[22];
  lesson23.grammarRefs = lesson23.grammarRefs.filter((id) => id !== "hsk1-grammar-you-existence");
  lessonSection(lesson23, "grammar").content.grammarRefs =
    lessonSection(lesson23, "grammar").content.grammarRefs.filter((id) => id !== "hsk1-grammar-you-existence");
}

function applyExercises(documents, patch) {
  const lessons = documents.lessons.records;
  for (let index = 1; index <= 24; index += 1) {
    const lesson = lessons[index - 1];
    const editorial = patch.lessonPatches[lesson.id];
    const exercises = documents.exercises.records
      .filter((item) => item.id.startsWith(`${lesson.id}-exercise-`))
      .sort((a, b) => Number(a.id.split("-").at(-1)) - Number(b.id.split("-").at(-1)));
    if (exercises.length !== 5) throw new Error(`${lesson.id}: expected 5 exercises`);

    exercises.forEach((exercise) => {
      exercise.topic = lesson.topic;
      exercise.grammarFocus = structuredClone(lesson.grammarRefs);
      exercise.contentVersion = 2;
      exercise.reviewStatus = "linguistic-reviewed";
      exercise.reviewMetadata = {
        firstIntroducedIn: lesson.id,
        reviewStage: 2,
        reviewReason: "C2 lesson-specific editorial rewrite; independent human sign-off remains required.",
        previousExerciseId: index === 1 ? null : exerciseId(index - 1, Number(exercise.id.split("-").at(-1))),
        humanSignoffRequired: true
      };
    });

    const listening = exercises[0];
    const listeningQuestion = editorial.listening.questions[0];
    listening.stimulus = {
      scriptZh: editorial.listening.scriptZh,
      audioStatus: "script-ready-audio-pending",
      questionVi: listeningQuestion.qVi
    };
    const listeningChoices = patch.listeningChoiceOptions[String(index)];
    if (listeningChoices) {
      listening.format = "listen-detail-choice";
      listening.prompt = `Nghe transcript ẩn của bài “${lesson.titleVi}” và chọn chi tiết đúng: ${listeningQuestion.qVi}`;
      listening.options = structuredClone(listeningChoices);
      listening.answer = listeningQuestion.answer;
      listening.acceptedAnswers = [];
      listening.explanationVi = `Chi tiết đúng nằm trực tiếp trong transcript. Đáp án: ${listeningQuestion.answer}.`;
    } else if (index % 5 === 1) {
      listening.format = "listen-dictation";
      listening.prompt = `Nghe đoạn của bài “${lesson.titleVi}” và chép lại cụm trả lời câu hỏi: ${listeningQuestion.qVi}`;
      listening.options = [];
      listening.answer = listeningQuestion.answer;
      listening.acceptedAnswers = [listeningQuestion.answer];
      listening.explanationVi = "Chấm theo cụm thông tin thực sự xuất hiện trong transcript; không cần chép toàn bài.";
    } else if (index % 5 === 2) {
      listening.format = "listen-short-answer";
      listening.prompt = `Nghe đoạn của bài “${lesson.titleVi}” rồi trả lời ngắn: ${listeningQuestion.qVi}`;
      listening.options = [];
      listening.answer = listeningQuestion.answer;
      listening.acceptedAnswers = [listeningQuestion.answer];
      listening.explanationVi = "Trả lời bằng chi tiết nghe được, không suy diễn thêm.";
    } else if (index % 5 === 3) {
      listening.format = "listen-information-extraction";
      listening.prompt = `Nghe và trích đúng thông tin trong bài “${lesson.titleVi}”: ${listeningQuestion.qVi}`;
      listening.options = [];
      listening.answer = listeningQuestion.answer;
      listening.acceptedAnswers = [listeningQuestion.answer];
      listening.explanationVi = "Bài kiểm tra khả năng bắt chi tiết mục tiêu trong input ngắn.";
    } else {
      listening.format = "listen-confirmation";
      listening.prompt = `Nghe bài “${lesson.titleVi}”, xác nhận câu trả lời cho: ${listeningQuestion.qVi}`;
      listening.options = [];
      listening.answer = listeningQuestion.answer;
      listening.acceptedAnswers = [listeningQuestion.answer];
      listening.explanationVi = "Đối chiếu câu trả lời với transcript sau khi hoàn thành lượt nghe.";
    }
    listening.cognitiveSkill = "recognition";
    listening.templateFamily = `${lesson.id}-c2-listening-${listening.format}`;

    const grammar = exercises[1];
    const grammarPatch = patch.grammarExercises[String(index)];
    grammar.format = grammarPatch.format;
    grammar.prompt = grammarPatch.prompt;
    grammar.stimulus = structuredClone(grammarPatch.stimulus || {});
    if (grammarPatch.options) {
      grammar.options = structuredClone(grammarPatch.options);
      grammar.answer = grammarPatch.answer;
      grammar.acceptedAnswers = [];
    } else {
      grammar.options = [];
      grammar.answer = grammarPatch.answer;
      grammar.acceptedAnswers = structuredClone(grammarPatch.accepted || [grammarPatch.answer]);
    }
    grammar.explanationVi = grammarPatch.explanation;
    grammar.cognitiveSkill = "application";
    grammar.templateFamily = `${lesson.id}-c2-grammar-${grammar.format}`;

    const reading = exercises[2];
    const readingQuestion = editorial.reading.questions[0];
    reading.stimulus = {
      textZh: editorial.reading.textZh,
      questionVi: readingQuestion.qVi,
      evidenceZh: readingQuestion.evidenceZh
    };
    const readingChoices = patch.readingChoiceOptions[String(index)];
    if (readingChoices) {
      reading.format = "reading-detail-choice";
      reading.prompt = `Đọc đoạn của bài “${lesson.titleVi}” và chọn đáp án đúng: ${readingQuestion.qVi}`;
      reading.options = structuredClone(readingChoices);
      reading.answer = readingChoices[0];
      reading.acceptedAnswers = [];
      reading.explanationVi = `Bằng chứng trong bài: ${readingQuestion.evidenceZh}.`;
    } else if (index % 4 === 0) {
      reading.format = "reading-evidence";
      reading.prompt = `Đọc bài “${lesson.titleVi}”, trả lời “${readingQuestion.qVi}” và chỉ ra cụm tiếng Trung làm bằng chứng.`;
      reading.options = [];
      reading.answer = { answerVi: readingQuestion.answerVi, evidenceZh: readingQuestion.evidenceZh };
      reading.acceptedAnswers = [readingQuestion.answerVi, readingQuestion.evidenceZh];
      reading.explanationVi = `Cần dựa vào bằng chứng “${readingQuestion.evidenceZh}”, không đoán theo kiến thức ngoài bài.`;
    } else if (index % 4 === 1) {
      reading.format = "reading-short-answer";
      reading.prompt = `Đọc bài “${lesson.titleVi}” rồi trả lời ngắn: ${readingQuestion.qVi}`;
      reading.options = [];
      reading.answer = readingQuestion.answerVi;
      reading.acceptedAnswers = [readingQuestion.answerVi, readingQuestion.evidenceZh];
      reading.explanationVi = `Bằng chứng: ${readingQuestion.evidenceZh}.`;
    } else if (index % 4 === 2) {
      reading.format = "reading-evidence-match";
      reading.prompt = `Trong bài “${lesson.titleVi}”, tìm cụm tiếng Trung chứng minh câu trả lời cho: ${readingQuestion.qVi}`;
      reading.options = [];
      reading.answer = readingQuestion.evidenceZh;
      reading.acceptedAnswers = [readingQuestion.evidenceZh];
      reading.explanationVi = "Phải trích đúng bằng chứng có trong văn bản.";
    } else {
      reading.format = "reading-information-extraction";
      reading.prompt = `Đọc và lấy đúng thông tin mục tiêu: ${readingQuestion.qVi}`;
      reading.options = [];
      reading.answer = readingQuestion.answerVi;
      reading.acceptedAnswers = [readingQuestion.answerVi, readingQuestion.evidenceZh];
      reading.explanationVi = `Chi tiết cần tìm nằm ở cụm “${readingQuestion.evidenceZh}”.`;
    }
    reading.cognitiveSkill = "analysis";
    reading.templateFamily = `${lesson.id}-c2-reading-${reading.format}`;

    const speaking = exercises[3];
    speaking.format = patch.speakingFormats[index - 1];
    speaking.prompt = lessonSection(lesson, "independent-practice").content.speakingVi;
    speaking.stimulus = {
      dialogueZh: lessonSection(lesson, "dialogue").content.scriptZh,
      timeSeconds: index < 6 ? 45 : 60
    };
    speaking.options = [];
    speaking.answer = { rubric: { taskCompletion: 40, intelligibility: 25, grammarAndWords: 25, selfCorrection: 10 } };
    speaking.acceptedAnswers = ["Đáp án mở được chấm theo rubric."];
    speaking.explanationVi = "Ưu tiên hoàn thành đúng tình huống, dùng cấu trúc mục tiêu và tự sửa; giọng địa phương không bị trừ nếu lời nói vẫn rõ.";
    speaking.templateFamily = `${lesson.id}-c2-speaking-${speaking.format}`;

    const writing = exercises[4];
    writing.format = patch.writingFormats[index - 1];
    writing.prompt = lessonSection(lesson, "independent-practice").content.writingVi;
    writing.stimulus = {
      focusLookups: lessonSection(lesson, "vocabulary").content.focusWords
        .filter((item) => item.canonicalLookup)
        .map((item) => `lookup:simplified:${item.simplified}`),
      requiredGrammar: structuredClone(lesson.grammarRefs)
    };
    writing.options = [];
    writing.answer = { rubric: { taskCompletion: 35, wordOrder: 25, grammar: 20, charactersAndPunctuation: 10, revision: 10 } };
    writing.acceptedAnswers = ["Đáp án mở được chấm theo rubric."];
    writing.explanationVi = "Bài viết được chấm theo khả năng truyền đạt, trật tự từ, cấu trúc mục tiêu và bước tự sửa; không ép một câu mẫu duy nhất.";
    writing.templateFamily = `${lesson.id}-c2-writing-${writing.format}`;
  }
}

function applyAssessments(documents) {
  const lessons = documents.lessons.records;
  const lessonById = new Map(lessons.map((item) => [item.id, item]));
  for (const assessment of documents.assessments.records) {
    assessment.contentVersion = 2;
    assessment.reviewStatus = "blueprint-reviewed";

    if (assessment.assessmentType === "mini-checkpoint") {
      const unitNumber = Number(assessment.id.split("-").at(-1));
      const unitId = `hsk1-unit-${String(unitNumber).padStart(2, "0")}`;
      const lessonIds = lessons.filter((lesson) => lesson.unitId === unitId).map((lesson) => lesson.id);
      assessment.exerciseRefs = lessonIds.flatMap((id) => [1, 2, 3, 4, 5].map((slot) => `${id}-exercise-${slot}`));
      assessment.sections = Object.fromEntries(["listening", "grammar", "reading", "speaking", "writing"].map((skill) => [skill, lessonIds.length]));
      assessment.skillWeights = { listening: 15, grammar: 20, reading: 15, speaking: 25, writing: 25 };
      assessment.targetGrammar = unique(lessonIds.flatMap((id) => lessonById.get(id).grammarRefs));
      assessment.rubric.remediation = "Skill dưới ngưỡng phải làm lại một item khác định dạng, sau đó retrieval sau 1 và 3 ngày; không chỉ xem lại đáp án.";
    }

    if (assessment.assessmentType === "midpoint") {
      const lessonIds = Array.from({ length: 12 }, (_, offset) => lessonId(offset + 1));
      assessment.exerciseRefs = lessonIds.flatMap((id) => [1, 2, 3, 4, 5].map((slot) => `${id}-exercise-${slot}`));
      assessment.sections = { listening: 12, grammar: 12, reading: 12, speaking: 12, writing: 12 };
      assessment.skillWeights = { listening: 20, grammar: 20, reading: 20, speaking: 20, writing: 20 };
      assessment.targetGrammar = unique(lessonIds.flatMap((id) => lessonById.get(id).grammarRefs));
      assessment.rubric.feedback = "Trả về hồ sơ 5 kỹ năng và bài remedial cụ thể theo định dạng người học làm yếu; speaking vẫn bắt buộc.";
    }

    if (assessment.assessmentType === "final") {
      const lessonIds = Array.from({ length: 12 }, (_, offset) => lessonId(offset + 13));
      assessment.exerciseRefs = lessonIds.flatMap((id) => [1, 2, 3, 4, 5].map((slot) => `${id}-exercise-${slot}`));
      assessment.sections = { listening: 12, grammar: 12, reading: 12, speaking: 12, writing: 12 };
      assessment.skillWeights = { listening: 20, grammar: 20, reading: 20, speaking: 20, writing: 20 };
      assessment.targetGrammar = documents.grammar.records.map((item) => item.id);
      assessment.rubric.noProductionPromotion = true;
      assessment.rubric.evidencePolicy = "Không đạt speaking/writing thì không coi hoàn tất mastery dù điểm nhận biết cao.";
    }

    if (assessment.assessmentType === "mastery-review") {
      const lessonIds = Array.from({ length: 12 }, (_, offset) => lessonId(offset + 13));
      assessment.exerciseRefs = lessonIds.flatMap((id) => [2, 4, 5].map((slot) => `${id}-exercise-${slot}`));
      assessment.sections = { grammarTransfer: 12, speakingPortfolio: 12, writingPortfolio: 12, spacedReviewDays: [1, 3, 7, 14, 30] };
      assessment.skillWeights = { grammar: 20, speaking: 45, writing: 25, selfCorrection: 10 };
      assessment.targetGrammar = documents.grammar.records.map((item) => item.id);
      assessment.rubric.evidenceRequired = ["grammar-transfer", "recording", "writing", "self-review"];
    }
  }
}

function applyManifestAndLevel(documents) {
  const derivedSupport = unique(
    documents.lessons.records.flatMap((lesson) =>
      lessonSection(lesson, "vocabulary").content.focusWords
        .filter((item) => item.lexicalStatus === "derived-phrase")
        .map((item) => item.simplified)
    )
  ).sort();
  const formats = unique(documents.exercises.records.map((item) => item.format));

  documents.course.phase = "C2";
  documents.course.status = "phase-c2-editorial-polished-human-signoff-required";
  documents.course.collections.grammar.count = documents.grammar.records.length;
  documents.course.editorialQualityGate = {
    status: "pass-machine-editorial-human-signoff-required",
    reviewedLessons: 24,
    readingSpecificQuestions: true,
    listeningTranscriptCoverage: "24/24",
    exerciseFormats: formats.length,
    derivedSupportFocusCount: derivedSupport.length,
    officialGrammarCoverageAdded: [
      "HSK1 measure-word inventory",
      "HSK1 separable verbs",
      "serial-verb sentences",
      "double-object sentences"
    ],
    humanVietnameseSignoff: false,
    humanChinesePedagogySignoff: false
  };
  documents.course.qualityGate = "locked";
  documents.course.productionEnabled = false;
  documents.course.publicOverrideAllowed = false;
  documents.course.writesProgress = false;
  for (const key of ["vietnameseHumanReview", "pedagogyHumanReview", "audioRecorded", "strokeOrderVerified", "productionReleaseAllowed"]) {
    documents.course.reviewGate[key] = false;
  }

  documents.manifest.levels[0].status = "machine-assisted";
  documents.manifest.levels[0].productionReady = false;
  documents.manifest.qualityGate = "locked";
  documents.manifest.productionEnabled = false;
  documents.manifest.publicOverrideAllowed = false;

  documents.level.contentVersion = 3;
  documents.level.productionReady = false;
  documents.level.contentStatus = "machine-assisted";

  return { derivedSupport, formats };
}

function validateC2(documents, audit) {
  const issues = [];
  const lessons = documents.lessons.records;
  const exercises = documents.exercises.records;
  const grammar = documents.grammar.records;
  const assessments = documents.assessments.records;
  const forbiddenLearnerChinese = ["先 nghe", "là các chữ", "gặp 安娜", "是“học”", "听懂", "但是", "然后", "碗", "旁边", "左边", "右边", "前面", "后面", "晴", "阴", "身体", "眼睛", "吃药", "周末", "一起", "公园", "旧", "每天", "英语", "意思", "生日", "走路", "服务员", "顾客", "店员", "一斤", "一盒", "二十八度"];

  if (lessons.length !== 24) issues.push("lesson-count");
  if (exercises.length !== 120) issues.push("exercise-count");
  if (grammar.length !== 21) issues.push("grammar-count");
  if (assessments.length !== 13) issues.push("assessment-count");
  if (audit.formats.length < 20) issues.push("exercise-format-diversity");
  if (audit.derivedSupport.length > 8) issues.push("derived-support-regression");

  const readingQuestionSets = new Set();
  const listeningQuestionSets = new Set();
  const guidedSets = new Set();

  for (const lesson of lessons) {
    const reading = lessonSection(lesson, "reading").content;
    const listening = lessonSection(lesson, "listening").content;
    const guided = lessonSection(lesson, "guided-practice").content;
    const review = lessonSection(lesson, "review").content;

    if (!reading.textZh || !Array.isArray(reading.answerKey) || reading.answerKey.length < 2) issues.push(`${lesson.id}:reading-editorial`);
    if (!listening.scriptZh || !Array.isArray(listening.answerKey) || listening.answerKey.length < 2) issues.push(`${lesson.id}:listening-editorial`);
    if (listening.audioStatus !== "script-ready-audio-pending") issues.push(`${lesson.id}:audio-honesty`);
    if (!Array.isArray(review.retrievalFromLessonIds)) issues.push(`${lesson.id}:review-prerequisites`);
    if (lesson.id !== "hsk1-lesson-01" && review.retrievalFromLessonIds.length < 1) issues.push(`${lesson.id}:spaced-review`);

    readingQuestionSets.add(JSON.stringify(reading.questionsVi));
    listeningQuestionSets.add(JSON.stringify(listening.questionsVi));
    guidedSets.add(JSON.stringify(guided.steps));

    const learnerChinese = [
      lessonSection(lesson, "dialogue").content.scriptZh,
      reading.textZh,
      listening.scriptZh
    ].join("\n");
    for (const token of forbiddenLearnerChinese) {
      if (learnerChinese.includes(token)) issues.push(`${lesson.id}:out-of-scope:${token}`);
    }
    if (/[À-ỹ]/u.test(learnerChinese)) issues.push(`${lesson.id}:vietnamese-mixed-into-zh`);
  }

  if (readingQuestionSets.size !== 24) issues.push("reading-question-template-repetition");
  if (listeningQuestionSets.size !== 24) issues.push("listening-question-template-repetition");
  if (guidedSets.size !== 24) issues.push("guided-practice-template-repetition");
  if (new Set(exercises.map((item) => item.prompt)).size !== 120) issues.push("exercise-prompt-duplicate");
  if (exercises.some((item) => item.prompt.includes("hsk1-grammar-"))) issues.push("raw-grammar-id-leak");
  if (exercises.some((item) => (item.options || []).some((option) => typeof option === "string" && (option.includes("tranh luận về một chủ đề trừu tượng") || option.includes("danh sách không có mục đích"))))) {
    issues.push("absurd-distractor");
  }
  for (const assessment of assessments) {
    const total = Object.values(assessment.skillWeights).reduce((sum, value) => sum + value, 0);
    if (total !== 100) issues.push(`${assessment.id}:weights`);
  }

  if (documents.manifest.qualityGate !== "locked" || documents.manifest.productionEnabled || documents.manifest.publicOverrideAllowed) issues.push("production-master-lock");
  if (documents.course.productionEnabled || documents.course.publicOverrideAllowed || documents.course.writesProgress || documents.course.reviewGate.productionReleaseAllowed) issues.push("production-course-lock");
  if (documents.level.productionReady) issues.push("production-level-lock");

  if (issues.length) throw new Error(`C2 editorial validation failed: ${issues.join(", ")}`);
  return {
    phase: "C2",
    status: "pass-machine-editorial-human-signoff-required",
    checkedAt: "2026-07-31",
    lessons: lessons.length,
    grammarRecords: grammar.length,
    exercises: exercises.length,
    exerciseFormats: audit.formats.length,
    assessments: assessments.length,
    derivedSupportFocus: audit.derivedSupport,
    listeningTranscripts: lessons.filter((lesson) => Boolean(lessonSection(lesson, "listening").content.scriptZh)).length,
    readingQuestionSets: readingQuestionSets.size,
    listeningQuestionSets: listeningQuestionSets.size,
    productionLocked: true,
    humanSignoffRequired: true
  };
}

function outputMap(documents, report) {
  return {
    "data/hsk/hsk1/lessons.json": documents.lessons,
    "data/hsk/hsk1/exercises.json": documents.exercises,
    "data/hsk/hsk1/grammar.json": documents.grammar,
    "data/hsk/hsk1/assessments.json": documents.assessments,
    "data/hsk/hsk1/course-manifest.json": documents.course,
    "data/hsk/hsk1/level.json": documents.level,
    "data/hsk/manifest.json": documents.manifest,
    "reports/hsk-c2-editorial-report.json": report
  };
}

function main() {
  const patch = JSON.parse(fs.readFileSync(PATCH_PATH, "utf8"));
  const documents = loadDocuments();

  applyLessons(documents, patch);
  applyGrammar(documents, patch);
  applyExercises(documents, patch);
  applyAssessments(documents);
  const audit = applyManifestAndLevel(documents);
  const report = validateC2(documents, audit);
  const outputs = outputMap(documents, report);
  const writeMode = process.argv.includes("--write");

  if (writeMode) {
    for (const [file, data] of Object.entries(outputs)) writeJson(file, data);
  } else {
    for (const [file, data] of Object.entries(outputs)) {
      const absolute = path.join(ROOT, file);
      if (!fs.existsSync(absolute)) throw new Error(`${file} is missing; run node scripts/polish-hsk1-c2.js --write`);
      const expected = `${JSON.stringify(data, null, 2)}\n`;
      if (fs.readFileSync(absolute, "utf8") !== expected) throw new Error(`${file} is stale; run node scripts/polish-hsk1-c2.js --write`);
    }
  }

  process.stdout.write(`${writeMode ? "Built" : "Validated"} HSK1 C2: 24 lessons, ${documents.grammar.records.length} grammar records, 120 exercises across ${audit.formats.length} formats, ${documents.assessments.records.length} assessments.\n`);
}

if (require.main === module) main();

module.exports = { loadDocuments, applyLessons, applyGrammar, applyExercises, applyAssessments, applyManifestAndLevel, validateC2 };
