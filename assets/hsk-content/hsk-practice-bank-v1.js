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

  // Phase 1 exam contract; additive to v1 so existing question IDs, seeded
  // selection, answer grading and localStorage summaries remain unchanged.
  var EXAM_SCHEMA_VERSION = "1.0.0";
  var PROGRESS_STORAGE_KEY = "vduckie-hsk-practice-exams-v2";
  var SECTION_ORDER = Object.freeze(["listening","reading","writing"]);
  var QUESTION_TYPES = Object.freeze({
    listening: Object.freeze({section:"listening",responseType:"single-choice"}),
    "listening-sentence": Object.freeze({section:"listening",responseType:"single-choice"}),
    meaning: Object.freeze({section:"reading",responseType:"single-choice"}),
    hanzi: Object.freeze({section:"reading",responseType:"single-choice"}),
    pinyin: Object.freeze({section:"reading",responseType:"single-choice"}),
    reading: Object.freeze({section:"reading",responseType:"single-choice"}),
    "reading-cloze": Object.freeze({section:"reading",responseType:"single-choice"}),
    writing: Object.freeze({section:"writing",responseType:"text"}),
    "writing-cloze": Object.freeze({section:"writing",responseType:"text"})
  });
  var REVIEW_STATUSES = Object.freeze(["unreviewed","linguistic-reviewed","pedagogy-reviewed","approved"]);
  function newReview() {
    // A source vocabulary entry does not constitute editorial review of a
    // generated question. Human approval must never be inferred.
    return {reviewer:null,reviewedAt:null,evidence:[]};
  }
  function paperId(level,number) {
    if(!Number.isInteger(level)||level<1||level>LEVELS||
       !Number.isInteger(number)||number<1||number>PAPERS_PER_LEVEL)
      throw new RangeError("Invalid HSK practice paper ID");
    return "hsk"+level+"-practice-"+String(number).padStart(2,"0");
  }
  function reviewErrors(record,path,errors) {
    if(!REVIEW_STATUSES.includes(record.reviewStatus)) {
      errors.push(path+": unknown reviewStatus");
      return;
    }
    var meta=record.reviewMetadata;
    if(!meta||typeof meta!=="object"||!Array.isArray(meta.evidence)) {
      errors.push(path+": missing review evidence metadata");
      return;
    }
    if(record.reviewStatus==="unreviewed") {
      if(meta.reviewer!==null||meta.reviewedAt!==null||meta.evidence.length!==0)
        errors.push(path+": unreviewed content cannot claim reviewer/evidence");
    }else if(typeof meta.reviewer!=="string"||!meta.reviewer.trim()||
      typeof meta.reviewedAt!=="string"||!Number.isFinite(Date.parse(meta.reviewedAt))||
      !meta.evidence.length||!meta.evidence.every(function(item){return typeof item==="string"&&!!item.trim();})) {
      errors.push(path+": reviewed content requires signed reviewer, date and evidence");
    }
  }
  function validatePaper(paper) {
    var errors=[];
    if(!paper||typeof paper!=="object")return {ok:false,errors:["paper: missing object"]};
    var level=paper.level,number=paper.number,plan=BLUEPRINT[level];
    if(!Number.isInteger(level)||!plan||!Number.isInteger(number)||
       number<1||number>PAPERS_PER_LEVEL)
      return {ok:false,errors:["paper: invalid level or number"]};
    var expectedId=paperId(level,number);
    if(paper.id!==expectedId||paper.legacyResultId!==expectedId)
      errors.push("paper: stable ID / legacy result ID mismatch");
    if(paper.schemaVersion!==EXAM_SCHEMA_VERSION||
       paper.contentStatus!=="machine-assisted"||
       paper.sourceType!=="vduckie-vocabulary"||
       paper.official!==false||paper.originalPractice!==true)
      errors.push("paper: invalid provenance or version");
    reviewErrors(paper,"paper",errors);
    var sections=SECTION_ORDER.filter(function(name){return plan[name]>0;});
    if(!Array.isArray(paper.sections)||paper.sections.join("|")!==sections.join("|"))
      errors.push("paper: sections are missing, out of order or unexpected");
    if(!paper.blueprint||["listening","reading","writing","minutes"].some(function(name){
      return paper.blueprint[name]!==plan[name];
    }))errors.push("paper: blueprint does not match level");
    var total=plan.listening+plan.reading+plan.writing;
    if(paper.questionCount!==total||!Array.isArray(paper.questions)||paper.questions.length!==total)
      errors.push("paper: question count mismatch");
    var ids=new Set(),words=new Set(),sectionCounts={listening:0,reading:0,writing:0};
    (Array.isArray(paper.questions)?paper.questions:[]).forEach(function(q,index){
      var path="questions["+index+"]";
      if(!q||typeof q!=="object"){errors.push(path+": invalid question");return;}
      var section=index<plan.listening?"listening":
        index<plan.listening+plan.reading?"reading":"writing";
      var expectedQuestionId=expectedId+"-q"+String(index+1).padStart(3,"0");
      var rule=QUESTION_TYPES[q.type];
      if(q.id!==expectedQuestionId||ids.has(q.id))errors.push(path+": unstable or duplicate ID");
      ids.add(q.id);
      if(!q.wordId||words.has(q.wordId))errors.push(path+": missing/duplicate vocabulary reference");
      words.add(q.wordId);
      if(q.section!==section||!rule||rule.section!==section||
         q.responseType!==rule.responseType)
        errors.push(path+": section/type/response mismatch");
      sectionCounts[section]++;
      if(q.sectionNumber!==sectionCounts[section])
        errors.push(path+": section numbering mismatch");
      if(!clean(q.prompt)||!clean(q.answer)||!clean(q.hanzi)||
         !clean(q.pinyin)||!clean(q.meaning))
        errors.push(path+": missing question material");
      if(!Array.isArray(q.sourceIds)||q.sourceIds.length!==1||
         q.sourceIds[0]!==q.wordId||q.contentStatus!=="machine-assisted")
        errors.push(path+": incomplete source provenance");
      reviewErrors(q,path,errors);
      if((q.type==="reading-cloze"||q.type==="writing-cloze") && (!clean(q.example)||!q.example.includes(q.hanzi)||
         q.stimulus.indexOf("____")===-1||q.stimulus.includes(q.hanzi)||q.answer!==q.hanzi))
        errors.push(path+": cloze requires a sourced example with the answer hidden");
      if(q.type==="listening-sentence" && (!clean(q.example)||q.audioText!==q.example||
         !q.audioText.includes(q.hanzi)||q.answer!==q.meaning||q.stimulus!==""))
        errors.push(path+": listening sentence must use its source example without visible transcript");
      if(!Array.isArray(q.options)){errors.push(path+": options missing");return;}
      if(section==="writing"){
        if(q.options.length!==0||!clean(q.stimulus))
          errors.push(path+": writing requires a stimulus and free-text answer");
      }else{
        if(q.options.length!==4||
           new Set(q.options.map(normalize)).size!==4||
           q.options.filter(function(value){return normalize(value)===normalize(q.answer);}).length!==1)
          errors.push(path+": non-unique or incorrect single-choice options");
        if(section==="listening"&&q.stimulus!=="")
          errors.push(path+": listening answer leaked into stimulus");
        if(section==="reading"&&!clean(q.stimulus))
          errors.push(path+": reading stimulus missing");
      }
    });
    if(paper.reviewStatus==="approved"&&
       (!Array.isArray(paper.questions)||paper.questions.some(function(q){return !q||q.reviewStatus!=="approved";})))
      errors.push("paper: cannot approve unapproved questions");
    return {ok:errors.length===0,errors:errors};
  }
  function assertValidPaper(paper) {
    var validation=validatePaper(paper);
    if(!validation.ok)throw new Error("Invalid HSK practice paper: "+validation.errors.join("; "));
    return paper;
  }
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
  // Only transform an existing sourced sentence when the target appears exactly
  // once. Otherwise fall back to the original vocabulary question: no invented
  // dialogue, grammar, or fake review status.
  function usableExample(word) {
    var sentence=clean(word.example),term=clean(word.hanzi);
    if(!sentence||!term||sentence.length<term.length+4)return "";
    var first=sentence.indexOf(term);
    if(first<0||sentence.indexOf(term,first+term.length)!==-1)return "";
    return sentence;
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
          options:[],answer:"",stimulus:"",prompt:"",
          responseType:section==="writing"?"text":"single-choice",
          sourceIds:[word.id],contentStatus:"machine-assisted",reviewStatus:"unreviewed",
          reviewMetadata:newReview()};
        var example=usableExample(word);
        // Rotate contextual tasks without altering paper IDs or section counts.
        // These remain machine-assisted drills, not reviewed HSK exam items.
        if(type==="reading"&&example) {type="reading-cloze";question.type=type;}
        if(type==="writing"&&example&&part%2===1) {type="writing-cloze";question.type=type;}
        if(type==="listening"&&example&&part%5===4) {type="listening-sentence";question.type=type;}
        if(type==="writing-cloze") {
          question.prompt="Viết chữ Hán còn thiếu để hoàn thành câu.";
          question.stimulus=example.replace(word.hanzi,"____");question.answer=word.hanzi;
        }else if(type==="reading-cloze") {
          question.prompt="Đọc câu và chọn từ tiếng Trung còn thiếu.";
          question.stimulus=example.replace(word.hanzi,"____");question.answer=word.hanzi;
          question.options=optionsFor(word,pool,"hanzi",rng);
        }else if(type==="listening-sentence") {
          question.prompt="Nghe câu hoàn chỉnh và chọn nghĩa của từ được hỏi.";
          question.stimulus="";question.audioText=example;question.answer=word.meaning;
          question.options=optionsFor(word,pool,"meaning",rng);
        }else if(type==="meaning") {
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
    return assertValidPaper({id:paperId(level,paperNumber),legacyResultId:paperId(level,paperNumber),level:level,number:paperNumber,
      questionCount:questions.length,questions:questions,sections:sections,
      blueprint:Object.assign({},plan),official:false,originalPractice:true,
      schemaVersion:EXAM_SCHEMA_VERSION,sourceType:"vduckie-vocabulary",
      contentStatus:"machine-assisted",reviewStatus:"unreviewed",reviewMetadata:newReview(),
      note:"Đề luyện tập từ kho từ vựng VDuckie, có số lượng câu theo khung HSK phổ biến. Không phải đề thi HSK chính thức."});
  }
  function grade(question, answer) {
    if (!question || !clean(answer)) return false;
    return normalize(answer) === normalize(question.answer);
  }
  // Deterministic grading shared by all 224 variants. Only submitted answers
  // count; metadata stays unreviewed until separate editorial verification.
  function scorePaper(paper, responses) {
    if(!paper||!Array.isArray(paper.questions))throw new TypeError("Missing HSK paper");
    var answers=responses&&typeof responses==="object"?responses:{};
    var sections={},correct=0,wrongIds=[],answered=0;
    paper.sections.forEach(function(section){
      var qs=paper.questions.filter(function(q){return q.section===section;});
      var hits=0;
      qs.forEach(function(q){
        var value=Object.prototype.hasOwnProperty.call(answers,q.id)?answers[q.id]:"";
        if(clean(value))answered++;
        if(grade(q,value)){hits++;correct++;}
        else wrongIds.push(q.id);
      });
      sections[section]={correct:hits,total:qs.length,points:qs.length?Math.round(100*hits/qs.length):0};
    });
    var max=paper.sections.length*100,score=paper.sections.reduce(function(sum,key){return sum+sections[key].points;},0);
    return {totals:sections,sections:sections,max:max,score:score,
      percent:max?Math.round(100*score/max):0,correct:correct,answered:answered,
      incorrectIds:wrongIds,passed:max>0&&score>=max*0.6,
      reviewStatus:paper.reviewStatus};
  }
  function explainQuestion(q) {
    if(!q||!QUESTION_TYPES[q.type])return "";
    // These are answer-based hints, not a human-reviewed grammar explanation.
    switch(q.type){
      case "listening-sentence":
        return "Câu được đọc: "+clean(q.audioText||q.example)+". Từ cần nhận biết: "+clean(q.hanzi)+" ("+clean(q.pinyin)+") — "+clean(q.meaning)+".";
      case "listening":
        return "Giọng máy đọc "+clean(q.hanzi)+" ("+clean(q.pinyin)+"), nghĩa: "+clean(q.meaning)+".";
      case "reading-cloze":case "writing-cloze":
        return "Điền "+clean(q.hanzi)+" ("+clean(q.pinyin)+") vào chỗ trống. Câu gốc: "+clean(q.example)+". Nghĩa của từ: "+clean(q.meaning)+".";
      case "pinyin":
        return "Pinyin của "+clean(q.hanzi)+" là "+clean(q.pinyin)+", gồm thanh điệu như đáp án.";
      case "hanzi":case "writing":
        return "Chữ Hán tương ứng là "+clean(q.hanzi)+" ("+clean(q.pinyin)+"), nghĩa: "+clean(q.meaning)+".";
      case "reading":
        return "Từ "+clean(q.hanzi)+" ("+clean(q.pinyin)+") trong câu có nghĩa: "+clean(q.meaning)+".";
      default:
        return "Từ "+clean(q.hanzi)+" ("+clean(q.pinyin)+") có nghĩa: "+clean(q.meaning)+".";
    }
  }
  return Object.freeze({LEVELS:LEVELS,PAPERS_PER_LEVEL:PAPERS_PER_LEVEL,
    TOTAL_PAPERS:LEVELS*PAPERS_PER_LEVEL,BLUEPRINT:BLUEPRINT,
    SECTION_ORDER:SECTION_ORDER,QUESTION_TYPES:QUESTION_TYPES,REVIEW_STATUSES:REVIEW_STATUSES,
    EXAM_SCHEMA_VERSION:EXAM_SCHEMA_VERSION,PROGRESS_STORAGE_KEY:PROGRESS_STORAGE_KEY,
    paperId:paperId,validatePaper:validatePaper,assertValidPaper:assertValidPaper,
    usableExample:usableExample,
    build:build,grade:grade,scorePaper:scorePaper,explainQuestion:explainQuestion,validWords:validWords,seed:seed});
});
