#!/usr/bin/env node
// Read-only editorial audit. Does not rewrite or claim human approval of lesson content.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const issues = [];
const results = [];
function read(relative) { return JSON.parse(fs.readFileSync(path.join(root,relative),'utf8')); }
function flag(level,type,id,message,critical=false){
  issues.push({level,type,id,message,severity:critical?'error':'review'});
}
function text(value){return typeof value==='string'&&value.trim().length>0;}
function uniqueIds(records,level,type){
  const ids=new Set();
  for(const record of records){
    if(!text(record.id))flag(level,type,'<missing>','ID missing',true);
    if(ids.has(record.id))flag(level,type,record.id,'Duplicate ID',true);
    ids.add(record.id);
  }
  return ids;
}
for(let level=1;level<=4;level++){
  const base='data/hsk/hsk'+level+'/';
  const lessons=read(base+'lessons.json').records||[];
  const exercises=read(base+'exercises.json').records||[];
  const grammar=read(base+'grammar.json').records||[];
  const vocabularyIndex=read(base+'vocabulary/index.json');
  const vocabulary=[];
  for(const shard of vocabularyIndex.shards||[]){
    const records=read(base+'vocabulary/'+shard.file).records||[];
    if(shard.count!==records.length)flag(level,'vocabulary',shard.file,'Shard record count mismatch',true);
    vocabulary.push(...records);
  }
  const vocabIds=uniqueIds(vocabulary,level,'vocabulary');
  const grammarIds=uniqueIds(grammar,level,'grammar');
  const exerciseIds=uniqueIds(exercises,level,'exercises');
  uniqueIds(lessons,level,'lessons');
  if(vocabulary.length!==Number(vocabularyIndex.expectedCount))flag(level,'vocabulary','index','Vocabulary size mismatch',true);
  let machineAssisted=0,unreviewed=0,missingPinyin=0,missingMeaning=0,pinyinLeak=0,audioPending=0;
  const all=[...vocabulary,...grammar,...exercises];
  for(const record of all){
    if(record.reviewStatus==='unreviewed')unreviewed++;
    if(record.contentStatus==='machine-assisted'||record.translationReviewStatus==='machine-assisted')machineAssisted++;
    if(record.recordType==='vocabulary'){
      if(!text(record.simplified))flag(level,'vocabulary',record.id,'Missing Chinese characters',true);
      if(!text(record.pinyin)){missingPinyin++;flag(level,'vocabulary',record.id,'Missing Pinyin',true);}
      if(!text(record.meaningVi)){missingMeaning++;flag(level,'vocabulary',record.id,'Missing Vietnamese meaning',true);}
      if(text(record.pinyin)&&/\d{2,}/.test(record.pinyin))flag(level,'vocabulary',record.id,'Pinyin contains numeric sequence');
    }
    if(record.format==='hanzi-from-meaning'&&/\([A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+\)/.test(record.prompt||''))pinyinLeak++;
  }
  for(const lesson of lessons){
    if(!text(lesson.titleZh)||!text(lesson.titleVi))flag(level,'lesson',lesson.id,'Missing bilingual lesson title',true);
    for(const id of lesson.practiceRefs||[])if(!exerciseIds.has(id))flag(level,'lesson',lesson.id,'Missing exercise '+id,true);
    for(const id of lesson.grammarRefs||[])if(!grammarIds.has(id))flag(level,'lesson',lesson.id,'Missing grammar '+id,true);
    for(const id of lesson.vocabularyRefs||[])if(!vocabIds.has(id))flag(level,'lesson',lesson.id,'Missing word '+id,true);
    for(const section of lesson.sections||[]){
      if(section.type==='listening'&&section.content&&String(section.content.audioStatus||'').includes('pending'))audioPending++;
    }
  }
  results.push({level,lessons:lessons.length,vocabulary:vocabulary.length,exercises:exercises.length,grammar:grammar.length,unreviewed,machineAssisted,missingPinyin,missingMeaning,pinyinLeak,audioPending});
}
const report={generatedAt:new Date().toISOString(),scope:'Automated structure and editorial review flags, NOT human validation',levels:results,issues:issues.slice(0,100),issueCount:issues.length,critical:issues.filter(x=>x.severity==='error').length};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&report.critical>0)process.exitCode=1;
