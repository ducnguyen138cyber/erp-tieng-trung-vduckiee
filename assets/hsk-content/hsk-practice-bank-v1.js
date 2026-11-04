/* Deterministic 224-paper HSK practice bank.
 * These are original practice variants using the existing canonical VDuckie
 * vocabulary, NOT official CTI exams and NOT 224 independently authored banks.
 * No answer is copied from user progress; each question is scored from its
 * selected canonical entry.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VDuckieHSKPracticeBank = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  var LEVELS = 4, PAPERS_PER_LEVEL = 56;
  // Counts match the widely used HSK 1–4 paper structure. Questions are
  // original VDuckie vocabulary drills (TTS for listening), not official
  // released exam questions or a certified HSK simulation.
  var BLUEPRINT = Object.freeze({
    1: Object.freeze({listening:20,reading:20,writing:0,minutes:40}),
    2: Object.freeze({listening:35,reading:25,writing:0,minutes:55}),
    3: Object.freeze({listening:40,reading:30,writing:10,minutes:90}),
    4: Object.freeze({listening:45,reading:40,writing:15,minutes:105})
  });
  var READING_TYPES = ["meaning","hanzi","pinyin","reading"];
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function normalize(value) {
    return clean(value).normalize("NFKC").toLocaleLowerCase().replace(/[\s，。！？、,.!?;；:：]/g, "");
  }
  function seed(level, number) {
    var text = "vduckie-hsk-practice-v1:" + level + ":" + number, hash = 2166136261;
    for (var i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
  function random(value) {
    var a = value >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, rng) {
    var a = items.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function validWords(records) {
    var seen = new Set();
    return (Array.isArray(records) ? records : []).filter(function (word) {
      if (!word || !/^[\u3400-\u9fff]{1,8}$/.test(clean(word.simplified))) return false;
      if (!clean(word.pinyin) || !clean(word.meaningVi) || seen.has(word.simplified)) return false;
      seen.add(word.simplified); return true;
    }).map(function (word) {
      return { id: clean(word.id), hanzi: clean(word.simplified),
        pinyin: clean(word.pinyin), meaning: clean(word.meaningVi),
        example: Array.isArray(word.examples) && word.examples[0] && clean(word.examples[0].zh) || "" };
    });
  }
  function optionsFor(word, pool, field, rng) {
    var truth = word[field], seen = new Set([normalize(truth)]);
    var distractors = [];
    var candidates = shuffle(pool, rng);
    for (var i = 0; i < candidates.length && distractors.length < 3; i++) {
      var text = clean(candidates[i][field]), normalized = normalize(text);
      if (!text || !normalized || seen.has(normalized)) continue;
      // Avoid ambiguity in Vietnamese synonyms and compound glosses.
      if (field === "meaning" && (normalized.indexOf(normalize(truth)) !== -1 ||
        normalize(truth).indexOf(normalized) !== -1)) continue;
      seen.add(normalized);
      distractors.push(text);
    }
    if (distractors.length < 3) throw new Error("Not enough distinct answer options");
    return shuffle([truth].concat(distractors), rng);
  }
  function build(level, paperNumber, records) {
    level = Number(level); paperNumber = Number(paperNumber);
    if (!Number.isInteger(level) || level < 1 || level > LEVELS) throw new RangeError("HSK level must be 1–4");
    if (!Number.isInteger(paperNumber) || paperNumber < 1 || paperNumber > PAPERS_PER_LEVEL) throw new RangeError("Invalid practice paper");
    var plan = BLUEPRINT[level], total = plan.listening + plan.reading + plan.writing;
    var pool = validWords(records).sort(function (a,b) {return a.id.localeCompare(b.id);});
    if (pool.length < total + 8) throw new Error("HSK vocabulary bank is incomplete");
    var rng = random(seed(level,paperNumber));
    var selected = shuffle(pool,rng).slice(0,total);
    var sections = ["listening","reading","writing"].filter(function(kind){return plan[kind]>0;});
    var questions=[],cursor=0;
    sections.forEach(function(section) {
      for(var part=0;part<plan[section];part++) {
        var word=selected[cursor],type=section==="reading"?READING_TYPES[part%READING_TYPES.length]:section;
        var id="hsk"+level+"-practice-"+String(paperNumber).padStart(2,"0")+"-q"+String(cursor+1).padStart(3,"0");
        var question={id:id,wordId:word.id,hanzi:word.hanzi,pinyin:word.pinyin,meaning:word.meaning,
          example:word.example,section:section,sectionNumber:part+1,type:type,
          options:[],answer:"",stimulus:"",prompt:""};
        if(type==="meaning") {
          question.prompt="Chọn nghĩa đúng của từ tiếng Trung.";
          question.stimulus=word.hanzi;question.answer=word.meaning;
          question.options=optionsFor(word,pool,"meaning",rng);
        }else if(type==="hanzi"){
          question.prompt="Chọn chữ Hán tương ứng với nghĩa.";
          question.stimulus=word.meaning;question.answer=word.hanzi;
          question.options=optionsFor(word,pool,"hanzi",rng);
        }else if(type==="pinyin"){
          question.prompt="Chọn Pinyin có thanh điệu chính xác.";
          question.stimulus=word.hanzi;question.answer=word.pinyin;
          question.options=optionsFor(word,pool,"pinyin",rng);
        }else if(type==="reading"){
          question.prompt="Đọc câu và chọn nghĩa của từ được hỏi.";
          question.stimulus=word.example ? word.example+" ("+word.hanzi+")" : word.hanzi;
          question.answer=word.meaning;
          question.options=optionsFor(word,pool,"meaning",rng);
        }else if(type==="listening"){
          question.prompt="Nghe phát âm và chọn chữ Hán được đọc.";
          question.stimulus=""; // no answer revealed before submission
          question.answer=word.hanzi;
          question.options=optionsFor(word,pool,"hanzi",rng);
        }else{
          question.prompt="Viết chữ Hán cho từ dưới đây.";
          question.stimulus=word.pinyin+" · "+word.meaning;question.answer=word.hanzi;
        }
        questions.push(question);
        cursor++;
      }
    });
    if(new Set(questions.map(function(q){return q.wordId;})).size!==total)throw new Error("Duplicate term inside paper");
    return {id:"hsk"+level+"-practice-"+String(paperNumber).padStart(2,"0"),level:level,number:paperNumber,
      questionCount:questions.length,questions:questions,sections:sections,
      blueprint:Object.assign({},plan),official:false,originalPractice:true,
      note:"Đề luyện tập từ kho từ vựng VDuckie, có số lượng câu theo khung HSK phổ biến. Không phải đề thi HSK chính thức."};
  }
  function grade(question, answer) {
    if (!question || !clean(answer)) return false;
    return normalize(answer) === normalize(question.answer);
  }
  return Object.freeze({LEVELS:LEVELS,PAPERS_PER_LEVEL:PAPERS_PER_LEVEL,
    TOTAL_PAPERS:LEVELS*PAPERS_PER_LEVEL,BLUEPRINT:BLUEPRINT,
    build:build,grade:grade,validWords:validWords,seed:seed});
});
