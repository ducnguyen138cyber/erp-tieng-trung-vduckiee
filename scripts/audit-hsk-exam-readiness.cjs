#!/usr/bin/env node
"use strict";
/* Technical/editorial readiness inventory, NOT an automated approval tool.
 * Run: node scripts/audit-hsk-exam-readiness.cjs
 */
const fs=require("node:fs");
const path=require("node:path");
const bank=require("../assets/hsk-content/hsk-practice-bank-v1.js");
const root=path.resolve(__dirname,"..");
const getJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),"utf8"));
const report={
  schemaVersion:1,
  scope:"HSK 1–4, 224 vocabulary-derived practice variants",
  auditKind:"machine-assisted technical inventory, not human editorial review",
  legacyExamBlueprint:true,
  vocabularySyllabus:"GF0025-2021",
  syllabusCompatibility:"not-verified: legacy exam section counts with GF0025-2021 vocabulary",
  paperCount:0,
  fullyApprovedPapers:0,
  readyForOfficialExamClaim:false,
  levels:[],
  blockers:[
    "No evidence of human linguistic/pedagogic review for complete papers",
    "No verified official-style listening recordings and passage-level tasks",
    "Legacy exam blueprint uses vocabulary labeled GF0025-2021; no proven alignment to a single HSK exam version",
    "56 deterministic variants per level are not 56 independently authored and approved papers"
  ]
};
for(let level=1;level<=4;level++){
  const dir="data/hsk/hsk"+level+"/vocabulary/";
  const idx=getJson(dir+"index.json");
  const records=idx.shards.flatMap(shard=>getJson(dir+shard.file).records);
  if(records.length!==idx.expectedCount)throw new Error("Incorrect vocabulary count at HSK"+level);
  const stats={level,vocabularyRecords:records.length,variants:0,approved:0,unreviewed:0,
    questionTypes:{},sourceSentenceItems:0,wordAudioDrills:0,sourceMissing:0,reviewedQuestions:0};
  for(let number=1;number<=56;number++){
    const paper=bank.build(level,number,records);
    const validation=bank.validatePaper(paper);
    if(!validation.ok)throw new Error(paper.id+": "+validation.errors.join("; "));
    stats.variants++;report.paperCount++;
    if(paper.reviewStatus==="approved")stats.approved++;
    else stats.unreviewed++;
    for(const question of paper.questions){
      stats.questionTypes[question.type]=(stats.questionTypes[question.type]||0)+1;
      if(["reading-cloze","writing-cloze","listening-sentence"].includes(question.type))stats.sourceSentenceItems++;
      if(question.type==="listening")stats.wordAudioDrills++;
      if(!question.sourceIds||!question.sourceIds.includes(question.wordId))stats.sourceMissing++;
      if(question.reviewStatus!=="unreviewed")stats.reviewedQuestions++;
    }
  }
  report.fullyApprovedPapers+=stats.approved;
  report.levels.push(stats);
}
if(report.paperCount!==224||
   report.levels.some(level=>level.sourceMissing!==0))
  throw new Error("Editorial readiness guard failed: inspect source and review metadata");
process.stdout.write(JSON.stringify(report,null,2)+"\n");
