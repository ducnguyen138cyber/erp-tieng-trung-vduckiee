#!/usr/bin/env node
'use strict';
// Corpus-wide checks, not linguistic certification. No learner storage or qualityGate writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {walkJsonFiles,validateSchema}=require('./hsk-schema-engine');
const norm=s=>String(s??'').normalize('NFC').replace(/[\s，。！？、,.!?;；:：'“”"‘’（）()\-]/g,'').toLowerCase();
const {independent,validateReviewEvents}=require('./hsk123-review-policy.cjs');
function audit(root=process.cwd(),phonetics){
 const files=[],entries=[],supplements=[],issues=[],checks=new Map(),schemas={};
 function issue(entry,rule,severity,evidence,confirmed=true,pointer=''){issues.push({id:entry.id,file:entry.file,pointer:pointer||entry.pointer,rule,severity,confirmed,evidence});if(confirmed)checks.get(entry.id)?.add(rule);}
 for(let level=1;level<=3;level++)for(const absolute of walkJsonFiles(path.join(root,'data/hsk/hsk'+level))){
  const file=path.relative(root,absolute),bytes=fs.readFileSync(absolute);let d;
  try{d=JSON.parse(bytes);}catch(e){issues.push({file,rule:'json',severity:'Critical',confirmed:true,evidence:e.message});continue;}
  files.push({file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),contentVersion:d.contentVersion??d.schemaVersion??null});
  if(d.collectionType==='vocabulary-enrichment')for(const [index,r] of (d.entries||[]).entries())supplements.push({id:r.id||r.canonicalId,file,pointer:'/entries/'+index,level,record:r});
  const records=d.recordType?[[d,'']]:Array.isArray(d.records)?d.records.map((r,i)=>[r,'/records/'+i]):[];
  for(const [r,pointer] of records){if(!r.recordType)continue;const e={id:r.id,file,pointer,level,record:r};entries.push(e);if(!checks.has(r.id))checks.set(r.id,new Set());}
 }
 const byId=new Map(entries.map(e=>[e.id,e])),sourceIds=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/hsk/sources.json'))).sources.map(s=>s.sourceId));
 for(const e of entries){const r=e.record;
  if(entries.filter(x=>x.id===e.id).length>1)issue(e,'duplicate-id','Critical','Record ID is not unique.');
  if(!schemas[r.recordType])schemas[r.recordType]=JSON.parse(fs.readFileSync(path.join(root,'data/hsk/schemas',r.recordType+'.schema.json')));
  for(const msg of validateSchema(r,schemas[r.recordType]))issue(e,'schema','High',msg);
  if(!r.contentVersion)issue(e,'missing-version','Medium','No contentVersion for review binding.');
  if(!r.sourceIds?.length)issue(e,'missing-source','High','No source IDs.');
  for(const id of r.sourceIds||[])if(!sourceIds.has(id))issue(e,'unknown-source','High',id);
  // References to other levels are outside this audit and not declared broken.
  function refs(v,p){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){
   if((/Refs$/.test(k)||['unitId','finalAssessmentId','primaryVocabularyId'].includes(k))&&!['sourceRefs','sourceIds'].includes(k)){
    for(const id of Array.isArray(x)?x:[x])if(typeof id==='string'&&/^hsk[123]-/.test(id)&&!byId.has(id))issue(e,'missing-reference','High',{field:p+'/'+k,target:id});
   }refs(x,p+'/'+k);
  }}refs(r,'');
  if(['linguistic-reviewed','verified','human-reviewed','approved'].includes(r.reviewStatus)&&!independent(r))issue(e,'unsupported-review-label','High',{reviewStatus:r.reviewStatus,contentStatus:r.contentStatus,note:'No version-bound independent reviewer evidence; historical label is not certification.'});
  if(r.recordType==='vocabulary')for(const k of ['simplified','pinyinTone','meaningVi'])if(!r[k])issue(e,'missing-vocabulary-field','High',k);
  if(r.recordType==='sentence')for(const k of ['chinese','pinyinTone','meaningVi'])if(!r[k])issue(e,'missing-sentence-field','High',k);
  if(r.recordType==='exercise'){
   const accepted=(r.acceptedAnswers||[]).filter(a=>typeof a==='string'),open=r.answer&&typeof r.answer==='object'&&!Array.isArray(r.answer);
   if(!open&&typeof r.answer!=='string'&&!Array.isArray(r.answer))issue(e,'missing-answer','Critical','No usable answer or rubric.');
   if(open&&!r.answer.rubric)issue(e,'missing-rubric','High','Open answer lacks rubric.');
   if(new Set(accepted.map(norm)).size<accepted.length)issue(e,'duplicate-accepted-answer','Low',accepted);
   if((r.options||[]).length){const opts=r.options.map(x=>norm(typeof x==='object'?(x.value??x.text??x.label):x));if(new Set(opts).size!==opts.length)issue(e,'duplicate-option','High',r.options);if(typeof r.answer==='string'&&!opts.includes(norm(r.answer)))issue(e,'answer-outside-options','Critical',{answer:r.answer,options:r.options});}
   if(!r.explanationVi)issue(e,'missing-explanation','Medium','No Vietnamese explanation.');
   if(r.skill==='listening'&&r.stimulus?.scriptZh&&r.stimulus.transcriptVisibility!=='after-answer')issue(e,'listening-transcript-leak','High','Transcript visible in exercise before submission in existing runtime.');
   if(typeof r.answer==='string'&&!(r.options||[]).length&&((r.skill==='reading'&&!/chép|tìm cụm/i.test(r.prompt))||(r.skill==='listening'&&!['listen-fill','listen-dictation','listen-final-line'].includes(r.format)&&r.id!=='hsk2-lesson-01-exercise-1')||['error-correction','grammar-error-correction'].includes(r.format)))issue(e,'semantic-response-exact-match','High','Unrestricted meaning/correction response needs semantic self-review rather than model-string equality.');
   if(r.skill==='listening'&&!r.stimulus?.scriptZh&&!r.stimulus?.audioRef)issue(e,'listening-no-stimulus','High','No script/audio reference.');
   if(typeof r.answer==='string'&&['controlled-translation','dialogue-completion','grammar-transformation','controlled-rewrite','sentence-combination','negative-question','usage-explanation','reading-explanation','vocabulary-sentence'].includes(r.format))issue(e,'open-response-exact-match','High',{format:r.format,answer:r.answer,note:'Requires rubric or independently justified exhaustive variants; not a confirmed linguistic error.'},false);
   if(r.skill==='listening'&&r.stimulus?.scriptZh&&typeof r.answer==='string'&&r.format==='listen-dictation'&&!norm(r.stimulus.scriptZh).includes(norm(r.answer)))issue(e,'dictation-answer-not-in-script','Critical',{answer:r.answer,script:r.stimulus.scriptZh});
  }
 }
 const eventsFile=path.join(root,'docs/hsk123-review-events.json');
 if(fs.existsSync(eventsFile))for(const problem of validateReviewEvents(JSON.parse(fs.readFileSync(eventsFile)).events,entries)){const e=byId.get(problem.id);if(e)issue(e,problem.rule,'Critical',problem);else issues.push({...problem,severity:'Critical',confirmed:true});}
 for(const e of supplements){const r=e.record;if(!r.simplified||!(r.canonicalId||r.canonicalLookup))issues.push({...e,record:undefined,rule:'enrichment-shape',severity:'High',confirmed:true,evidence:'Missing term/canonical lookup'});if(['linguistic-reviewed','approved','human-reviewed'].includes(r.reviewStatus)&&!independent(r))issues.push({id:e.id,file:e.file,pointer:e.pointer,rule:'unsupported-enrichment-review',severity:'High',confirmed:true,evidence:r.reviewStatus});}
 const phoneticById=new Map((phonetics?.pairs||[]).map(p=>[p.id,p]));
 for(const e of entries){const p=phoneticById.get(e.id);if(!p)continue;
  if(p.numberMismatch)issue(e,'numbered-pinyin-loses-tones','High',{hanzi:p.hanzi,pinyin:p.pinyin,actual:e.record.pinyinNumber,expected:p.expectedNumber});
  if(!p.aligned)issue(e,'pinyin-alignment-needs-review','Medium',{hanzi:p.hanzi,pinyin:p.pinyin,note:'May be valid erhua, spelling or contextual reading. Never auto-replace.'},false);
  if(p.readingSuspects?.length||p.polyphoneContextSuspects?.length)issue(e,'contextual-reading-needs-review','Medium',{hanzi:p.hanzi,pinyin:p.pinyin,comparisons:p.readingSuspects,polyphoneContextComparisons:p.polyphoneContextSuspects,note:'Character dictionary differences include valid neutral tone and sandhi; no automatic correction.'},false);
 }
 const manualFile=path.join(root,'docs/hsk123-confirmed-findings.json');
 if(fs.existsSync(manualFile))for(const finding of JSON.parse(fs.readFileSync(manualFile)).findings){const e=byId.get(finding.id);if(e&&typeof e.record.answer==='string'&&e.record.answer===finding.beforeAnswer&&(!finding.validVariant||!(e.record.acceptedAnswers||[]).some(a=>norm(a)===norm(finding.validVariant))))issue(e,finding.rule||'answer-unrelated-to-source',finding.severity||'Critical',finding);}
 const duplicateGroups=new Map();for(const e of entries.filter(e=>e.record.recordType==='exercise')){const r=e.record,key=JSON.stringify([r.skill,r.format,r.prompt,r.stimulus]);if(!duplicateGroups.has(key))duplicateGroups.set(key,[]);duplicateGroups.get(key).push(e);}
 for(const group of duplicateGroups.values())if(group.length>1)for(const e of group)issue(e,'duplicate-question','Medium',group.map(x=>x.id),false);
 const levels=[1,2,3].map(level=>{const es=entries.filter(e=>e.level===level),counts={};for(const e of es)counts[e.record.recordType]=(counts[e.record.recordType]||0)+1;
  const passed=es.filter(e=>!checks.get(e.id).size).length,human=es.filter(e=>independent(e.record)).length;
  return {level,files:files.filter(f=>f.file.startsWith('data/hsk/hsk'+level+'/')).length,counts,records:es.length,machinePassed:passed,machinePassPercent:Math.round(passed/es.length*10000)/100,independentlyReviewed:human,independentReviewPercent:Math.round(human/es.length*10000)/100};});
 return {schemaVersion:1,scope:'All JSON files and typed records in data/hsk/hsk1–3; enrichment and provenance included in file inventory. Semantic correctness not certified.',phoneticTool:phonetics?{name:phonetics.tool,version:phonetics.version,pairs:phonetics.pairs.length}:null,levels,supplementalEnrichment:supplements.reduce((o,e)=>(o[e.level]=(o[e.level]||0)+1,o),{}),confirmedBySeverity:Object.fromEntries(['Critical','High','Medium','Low'].map(s=>[s,issues.filter(i=>i.confirmed&&i.severity===s).length])),suspected:issues.filter(i=>!i.confirmed).length,files,items:entries.map(e=>({id:e.id,file:e.file,pointer:e.pointer,level:e.level,type:e.record.recordType,contentVersion:e.record.contentVersion??null,sourceIds:e.record.sourceIds||[],state:independent(e.record)?e.record.reviewEvidence.status:checks.get(e.id).size?'unreviewed':'machine-checked',failedChecks:[...checks.get(e.id)]})),issues};
}
if(require.main===module){const root=process.cwd(),p=cp.spawnSync('python',[path.join(root,'scripts/hsk123-phonetics.py'),root],{encoding:'utf8',maxBuffer:20*1024*1024});if(p.status!==0)throw new Error('Install pypinyin==0.55.0 before audit: '+p.stderr);const report=audit(root,JSON.parse(p.stdout)),dir='reports/hsk123';fs.mkdirSync(dir,{recursive:true});const target=process.argv.includes('--baseline')?'baseline':'current';fs.writeFileSync(dir+'/'+target+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({levels:report.levels,confirmed:report.confirmedBySeverity,suspected:report.suspected},null,2));if(report.confirmedBySeverity.Critical||report.confirmedBySeverity.High)process.exitCode=1;}
module.exports={audit,independent,norm};
