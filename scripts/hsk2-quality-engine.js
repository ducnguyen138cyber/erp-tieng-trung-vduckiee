#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { validateRepository } = require("./hsk-content-lib");

const REQUIRED_SECTIONS = ["situation","vocabulary","character","grammar","dialogue","reading","listening","pronunciation","guided-practice","independent-practice","summary","review"];
const REQUIRED_SKILLS = ["vocabulary","grammar","listening","reading","speaking","writing"];
const PLACEHOLDER = /\b(?:todo|tbd|lorem|placeholder|coming soon|sắp mở)\b|待补|待定/iu;
const HANZI = /[\p{Script=Han}]/u;

function readJson(file) { return JSON.parse(fs.readFileSync(file,"utf8")); }
function normalize(value) { return String(value||"").normalize("NFC").toLowerCase().replace(/[\s，。！？、,.!?;；:：'“”"‘’（）()\-]/gu,""); }
function unique(values) { return [...new Set(values)]; }
function similarity(a,b) {
  const left=normalize(a),right=normalize(b); if(!left||!right)return 0;
  const grams=(value)=>{const set=new Set();for(let i=0;i<value.length-2;i++)set.add(value.slice(i,i+3));return set;};
  const x=grams(left),y=grams(right); if(!x.size||!y.size)return left===right?1:0;
  let overlap=0;for(const gram of x)if(y.has(gram))overlap+=1;
  return (2*overlap)/(x.size+y.size);
}

function load(root) {
  const hsk2=path.join(root,"data/hsk/hsk2");
  const vocabularyIndex=readJson(path.join(hsk2,"vocabulary/index.json"));
  const vocabulary=vocabularyIndex.shards.flatMap((shard)=>readJson(path.join(hsk2,"vocabulary",shard.file)).records);
  return {hsk2,vocabulary,manifest:readJson(path.join(hsk2,"course-manifest.json")),units:readJson(path.join(hsk2,"units.json")).records,lessons:readJson(path.join(hsk2,"lessons.json")).records,grammar:readJson(path.join(hsk2,"grammar.json")).records,characters:readJson(path.join(hsk2,"characters.json")).records,exercises:readJson(path.join(hsk2,"exercises.json")).records,assessments:readJson(path.join(hsk2,"assessments.json")).records,provenance:readJson(path.join(hsk2,"provenance/source-snapshot.json"))};
}

function validate(rootDirectory) {
  const root=path.resolve(rootDirectory||path.join(__dirname,".."));
  const data=load(root); const errors=[]; const warnings=[];
  const check=(condition,rule,message,details)=>{if(!condition)errors.push({rule,message,details:details||null});};
  const warn=(condition,rule,message,details)=>{if(!condition)warnings.push({rule,message,details:details||null});};
  const repository=validateRepository(root);
  check(repository.ok,"repository-schema","Generic schema/reference validator must pass",repository.summary);
  const expected={units:10,lessons:28,vocabulary:200,grammar:29,characters:60,exercises:168,assessments:13};
  Object.entries(expected).forEach(([key,count])=>check(data[key].length===count,"count",`${key}: expected ${count}, received ${data[key].length}`));
  check(data.manifest.phase==="C3"&&data.manifest.level===2,"manifest-phase","HSK2 manifest must identify C3/level 2");
  check(data.manifest.productionEnabled===false&&data.manifest.writesProgress===false&&data.manifest.readOnly===true,"progress-safety","C3 must remain read-only with production/progress writes disabled");

  const vocabularyIds=new Set(),rows=[],surfaceSenses=new Map();
  for(const word of data.vocabulary){
    check(!vocabularyIds.has(word.id),"id-duplicate",`Duplicate vocabulary ID ${word.id}`);vocabularyIds.add(word.id);rows.push(word.officialRow);
    check(word.hskLevel===2&&word.knowledgeStatus==="new","level-membership",`${word.id} must be new at HSK2`);
    check(HANZI.test(word.simplified),"hanzi",`${word.id} has no Hanzi`);
    check(Boolean(word.pinyinTone&&word.pinyinNumber&&word.pinyinNormalized),"pinyin",`${word.id} lacks pinyin fields`);
    check(Boolean(word.meaningVi&&word.partOfSpeech.length),"lexical-fields",`${word.id} lacks Vietnamese meaning or part of speech`);
    check(word.sourceIds.includes("cti-hsk3-current-syllabus-2026")&&word.sourceIds.includes("vduckie-hsk2-c3-original"),"provenance",`${word.id} lacks official/original provenance`);
    check(word.examples.length>=1&&word.examples.every((example)=>example.zh.includes(word.simplified)&&example.vi),"target-example",`${word.id} example must contain target and Vietnamese meaning`);
    check(word.collocations.length>=1&&word.collocations.every((item)=>item.zh&&item.vi&&!/Mẫu kết hợp tự nhiên/i.test(item.vi))&&word.usageNoteVi,"pedagogy",`${word.id} lacks a translated usage pattern/note`);
    check(Array.isArray(word.commonErrorsVi)&&word.commonErrorsVi.length>=1&&word.commonErrorsVi.every(Boolean),"pedagogy",`${word.id} lacks a target-specific common error`);
    if(word.officialRow===357)check(word.measureWord===null,"homograph-pedagogy","Row 357 花 ‘spend’ must not have a noun measure word");
    if(word.officialRow===358)check(word.measureWord==="朵","homograph-pedagogy","Row 358 花 ‘flower’ must use 朵 in the basic measure-word field");
    const senses=surfaceSenses.get(word.simplified)||[];senses.push(word.senseKey);surfaceSenses.set(word.simplified,senses);
  }
  check(rows.slice().sort((a,b)=>a-b).every((row,index)=>row===301+index),"official-coverage","Official vocabulary rows must cover 301–500 exactly once");
  check((surfaceSenses.get("过")||[]).length===2&&(surfaceSenses.get("花")||[]).length===2,"homograph-senses","过 and 花 must retain separate canonical senses");

  const assigned=new Map(); const inputTexts=[]; const sectionCoverage={};
  for(const lesson of data.lessons){
    lesson.vocabularyRefs.forEach((id)=>assigned.set(id,(assigned.get(id)||0)+1));
    const types=lesson.sections.map((section)=>section.type);REQUIRED_SECTIONS.forEach((type)=>{check(types.filter((item)=>item===type).length===1,"section-coverage",`${lesson.id} must contain exactly one ${type}`);sectionCoverage[type]=(sectionCoverage[type]||0)+1;});
    check(lesson.knowledgeMap&&lesson.knowledgeMap.new&&lesson.knowledgeMap.review&&lesson.knowledgeMap.reinforcement&&lesson.knowledgeMap.extension,"knowledge-status",`${lesson.id} lacks new/review/reinforcement/extension map`);
    const reading=lesson.sections.find((section)=>section.type==="reading").content;
    const listening=lesson.sections.find((section)=>section.type==="listening").content;
    const dialogue=lesson.sections.find((section)=>section.type==="dialogue").content;
    check(reading.textZh.length>=30&&reading.textZh.length<=180,"level-appropriateness",`${lesson.id} reading must stay in C0 30–180 character envelope`,reading.textZh.length);
    check(reading.questionsVi.length>=2&&reading.answerKey.length===reading.questionsVi.length&&reading.answerKey.every((answer)=>answer.evidenceZh&&answer.explanationVi&&reading.textZh.includes(answer.evidenceZh)),"reading-answers",`${lesson.id} needs answer evidence copied exactly from its reading text`);
    check(listening.audioStatus==="script-ready-audio-pending"&&listening.scriptZh&&listening.questionsVi.length>=2&&listening.answerKey.length===listening.questionsVi.length,"listening-coverage",`${lesson.id} listening must have pending-labelled transcript and answer key`);
    check(dialogue.scriptZh.split("\n").length>=4&&dialogue.tasks.length>=2,"dialogue-quality",`${lesson.id} dialogue needs 4+ turns and role-play tasks`);
    inputTexts.push({id:`${lesson.id}:dialogue`,text:dialogue.scriptZh},{id:`${lesson.id}:reading`,text:reading.textZh},{id:`${lesson.id}:listening`,text:listening.scriptZh});
    check(!PLACEHOLDER.test(JSON.stringify(lesson)),"placeholder",`${lesson.id} contains a placeholder`);
  }
  for(const id of vocabularyIds)check(assigned.get(id)===1,"lesson-assignment",`${id} must be introduced exactly once`,assigned.get(id)||0);
  const grammarCoverage=new Set(data.lessons.flatMap((lesson)=>lesson.grammarRefs));
  const characterCoverage=new Set(data.lessons.flatMap((lesson)=>lesson.characterRefs));
  check(grammarCoverage.size===data.grammar.length,"grammar-coverage","Every grammar record must be assigned to a lesson",{assigned:grammarCoverage.size,total:data.grammar.length});
  check(characterCoverage.size===data.characters.length,"character-coverage","Every character record must be assigned to a lesson",{assigned:characterCoverage.size,total:data.characters.length});
  data.characters.forEach((character)=>{check(character.strokeCount>0&&character.radical&&character.readings.length,"character-fields",`${character.id} lacks radical/reading/stroke count`);check(character.mnemonic&&character.mnemonic.type==="memory-aid-not-etymology","mnemonic-label",`${character.id} mnemonic is not labelled as a memory aid`);check(character.strokeOrderStatus!=="verified-asset"&&!character.strokeOrderAsset,"asset-truth",`${character.id} must not claim an unverified stroke asset`);});

  const formats=new Set(),skills=new Set(),exerciseIds=new Set();
  for(const exercise of data.exercises){
    check(!exerciseIds.has(exercise.id),"id-duplicate",`Duplicate exercise ID ${exercise.id}`);exerciseIds.add(exercise.id);formats.add(exercise.format);skills.add(exercise.skill);
    check(exercise.prompt&&exercise.explanationVi,"exercise-explanation",`${exercise.id} lacks prompt/explanation`);
    check(exercise.answer!==undefined&&Array.isArray(exercise.acceptedAnswers),"accepted-answer",`${exercise.id} lacks answer contract`);
    check(new Set(exercise.options).size===exercise.options.length,"option-quality",`${exercise.id} has duplicate options`);
    if(["listen-select","measure-word-choice"].includes(exercise.format)){
      check(exercise.options.length>=3,"format-contract",`${exercise.id} choice task needs at least three options`);
      check(typeof exercise.answer==="string"&&exercise.options.includes(exercise.answer),"format-contract",`${exercise.id} choice answer must occur in options`);
    }
    if(exercise.format==="listen-dictation")check(/chép/i.test(exercise.prompt)&&typeof exercise.answer==="string","format-contract",`${exercise.id} dictation label does not match its task`);
    if(exercise.format==="listen-fill")check(exercise.stimulus&&/____/.test(exercise.stimulus.clozeZh||"")&&typeof exercise.answer==="string","format-contract",`${exercise.id} listening fill needs a cloze and string answer`);
    if(exercise.format==="sentence-order")check(exercise.stimulus&&Array.isArray(exercise.stimulus.tokens)&&exercise.stimulus.tokens.length>=2,"format-contract",`${exercise.id} sentence order needs two or more shuffled tokens`);
    if(exercise.format==="controlled-translation")check(/Dịch/i.test(exercise.prompt)&&typeof exercise.answer==="string","format-contract",`${exercise.id} controlled translation label does not match its task`);
    if(exercise.format==="pronunciation-shadowing")check(exercise.skill==="speaking"&&exercise.answer&&exercise.answer.rubric&&exercise.answer.rubric.tones,"format-contract",`${exercise.id} pronunciation task needs a speaking/tones rubric`);
    check(!PLACEHOLDER.test(JSON.stringify(exercise)),"placeholder",`${exercise.id} contains a placeholder`);
  }
  check(formats.size>=20,"exercise-diversity",`Need at least 20 exercise formats, received ${formats.size}`);
  REQUIRED_SKILLS.forEach((skill)=>check(skills.has(skill),"skill-coverage",`Missing exercise skill ${skill}`));
  check(data.assessments.filter((assessment)=>assessment.assessmentType==="mini-checkpoint").length===10,"assessment-coverage","Need one checkpoint per unit");
  ["midpoint","final","mastery-review"].forEach((type)=>check(data.assessments.some((assessment)=>assessment.assessmentType===type),"assessment-coverage",`Missing ${type} assessment`));
  const exerciseById=new Map(data.exercises.map((exercise)=>[exercise.id,exercise]));
  data.assessments.forEach((assessment)=>{
    check(assessment.exerciseRefs.length>=10&&assessment.rubric&&assessment.targetGrammar.length&&assessment.targetVocabulary.length,"assessment-contract",`${assessment.id} lacks coverage or mastery rubric`);
    const resolved=assessment.exerciseRefs.map((id)=>exerciseById.get(id));
    check(resolved.every(Boolean),"assessment-contract",`${assessment.id} references a missing exercise`);
    const actualSections=Object.fromEntries(["listening","grammar","reading","speaking","writing"].map((skill)=>[skill,resolved.filter((exercise)=>exercise&&exercise.skill===skill).length]));
    check(Object.keys(actualSections).every((skill)=>actualSections[skill]>0),"assessment-skill-coverage",`${assessment.id} must exercise all five assessed skills`,actualSections);
    check(Object.keys(actualSections).every((skill)=>assessment.sections[skill]===actualSections[skill]),"assessment-section-count",`${assessment.id} declared sections do not match exercise skills`,{declared:assessment.sections,actual:actualSections});
    if(assessment.assessmentType==="mastery-review")check(actualSections.speaking+actualSections.writing>actualSections.listening+actualSections.grammar+actualSections.reading,"mastery-production",`${assessment.id} must emphasize productive transfer`,actualSections);
  });

  const exact=new Map();for(const item of inputTexts){const key=normalize(item.text);const list=exact.get(key)||[];list.push(item.id);exact.set(key,list);}const exactDuplicates=[...exact.values()].filter((items)=>items.length>1);
  check(exactDuplicates.length===0,"exact-duplicate","Dialogue/reading/listening inputs contain exact duplicates",exactDuplicates);
  const near=[];for(let i=0;i<inputTexts.length;i++)for(let j=i+1;j<inputTexts.length;j++){const score=similarity(inputTexts[i].text,inputTexts[j].text);if(score>=0.92)near.push({a:inputTexts[i].id,b:inputTexts[j].id,score:Number(score.toFixed(3))});}
  check(near.length===0,"near-duplicate","Dialogue/reading/listening inputs contain near-duplicates",near);
  const intentFingerprints=data.lessons.map((lesson)=>normalize(`${lesson.objectives[0]}|${lesson.sections.find((section)=>section.type==="independent-practice").content.realWorldTaskVi}`));
  check(new Set(intentFingerprints).size===intentFingerprints.length,"semantic-duplicate","Lesson objective + real-world task fingerprints must be unique");
  check(data.provenance.officialVocabulary.sha256==="ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941"&&data.provenance.officialVocabulary.rows==="301-500","source-snapshot","Official source snapshot/hash is missing or changed");
  warn(data.manifest.reviewGate.vietnameseHumanReview===true,"human-signoff","Independent Vietnamese human signoff remains required");
  warn(data.manifest.reviewGate.chinesePedagogyHumanReview===true,"human-signoff","Independent Chinese pedagogy signoff remains required");
  warn(data.manifest.reviewGate.audioRecorded===true,"audio-pending","Verified human-recorded audio remains pending");
  warn(data.manifest.reviewGate.strokeOrderVerified===true,"stroke-pending","Verified stroke-order assets remain pending");

  return {ok:errors.length===0,generatedAt:"2026-08-01",phase:"C3",level:2,errors,warnings,summary:{...expected,dialogues:data.lessons.length,listeningTranscripts:data.lessons.length,readings:data.lessons.length,speakingTasks:data.lessons.length,writingTasks:data.lessons.length,exerciseFormats:formats.size,skills:[...skills].sort(),officialRows:"301-500",cumulativeVocabulary:500,exactDuplicates:exactDuplicates.length,nearDuplicates:near.length,semanticFingerprintDuplicates:0,repositoryErrors:repository.summary.errors,humanSignoffRequired:true}};
}

function main(){const root=path.resolve(process.argv[2]||path.join(__dirname,".."));const result=validate(root);if(process.argv.includes("--write-report")){const target=path.join(root,"reports/hsk2-c3-quality-report.json");fs.writeFileSync(target,`${JSON.stringify(result,null,2)}\n`);}console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
if(require.main===module)main();
module.exports={validate,normalize,similarity};
