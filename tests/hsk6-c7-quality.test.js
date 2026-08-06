'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data','hsk','hsk6');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')),records=n=>read(n).records;
const manifest=read('course-manifest.json'),units=records('units.json'),lessons=records('lessons.json'),
 grammar=records('grammar.json'),characters=records('characters.json'),exercises=records('exercises.json'),
 assessments=records('assessments.json'),index=read('vocabulary/index.json'),
 vocabulary=index.shards.flatMap(s=>records(path.join('vocabulary',s.file)));
const section=(lesson,type)=>{const x=lesson.sections.find(s=>s.type===type);assert.ok(x,`${lesson.id} missing ${type}`);return x.content;};
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,label);
test('HSK6 C7 exact inventory and production locks',()=>{
 assert.equal(units.length,24);assert.equal(lessons.length,72);assert.equal(vocabulary.length,1800);
 assert.equal(index.shards.length,36);assert.equal(grammar.length,50);assert.equal(characters.length,413);
 assert.equal(exercises.length,864);assert.equal(assessments.length,31);
 assert.equal(manifest.phase,'C7');assert.equal(manifest.level,6);assert.equal(manifest.productionEnabled,false);
 assert.equal(manifest.writesProgress,false);assert.equal(manifest.readOnly,true);assert.equal(manifest.qualityGate,'locked');
 assert.equal(manifest.reviewGate.vietnameseHumanReview,false);assert.equal(manifest.reviewGate.chinesePedagogyHumanReview,false);
});
test('all HSK6 lessons have distinct identity and complete advanced flow',()=>{
 const required=['situation','vocabulary','character','grammar','dialogue','listening','reading','pronunciation','culture-note','guided-practice','independent-practice','summary','review'];
 for(const lesson of lessons){
  assert.equal(lesson.vocabularyRefs.length,25,lesson.id);assert.equal(lesson.practiceRefs.length,12,lesson.id);
  required.forEach(type=>section(lesson,type));
  assert.deepEqual(section(lesson,'review').spacingDays,[1,3,7,14,30]);
  assert.deepEqual(section(lesson,'review').vocabularyRefs,lesson.vocabularyRefs);
  assert.ok(section(lesson,'listening').questionsVi.length>=5);assert.ok(section(lesson,'reading').questionsVi.length>=5);
  const independent=section(lesson,'independent-practice');
  assert.ok(independent.speakingTask.sampleAnswer&&independent.speakingTask.rubric);
  assert.ok(independent.writingTask.model&&independent.writingTask.outline.length>=5&&independent.writingTask.rubric);
 }
 for(const [values,label] of [
  [lessons.map(x=>x.titleZh),'Chinese titles'],[lessons.map(x=>x.titleVi),'Vietnamese titles'],
  [lessons.map(x=>section(x,'situation').promptVi),'situations'],
  [lessons.map(x=>section(x,'dialogue').scriptZh),'dialogues'],
  [lessons.map(x=>section(x,'listening').scriptZh),'listening'],
  [lessons.map(x=>section(x,'reading').textZh),'readings'],
  [lessons.map(x=>section(x,'independent-practice').speakingVi),'speaking'],
  [lessons.map(x=>section(x,'independent-practice').writingVi),'writing'],
  [lessons.map(x=>section(x,'independent-practice').realWorldTaskVi),'real tasks']
 ]) unique(values,`duplicate ${label}`);
});
test('official HSK6 inventory is fully introduced, reviewed and practiced',()=>{
 const introduced=lessons.flatMap(x=>x.vocabularyRefs),reviewed=lessons.flatMap(x=>section(x,'review').vocabularyRefs);
 assert.equal(introduced.length,1800);assert.equal(new Set(introduced).size,1800);
 assert.deepEqual([...reviewed].sort(),[...introduced].sort());
 const practiced=new Set(exercises.flatMap(x=>x.vocabularyFocus));introduced.forEach(id=>assert.ok(practiced.has(id),id));
 const introducedGrammar=new Set(lessons.flatMap(x=>x.grammarRefs)),practicedGrammar=new Set(exercises.flatMap(x=>x.grammarFocus));
 assert.equal(introducedGrammar.size,50);introducedGrammar.forEach(id=>assert.ok(practicedGrammar.has(id),id));
 assert.equal(new Set(lessons.flatMap(x=>x.characterRefs)).size,413);
 assert.equal(vocabulary[0].officialRow,3601);assert.equal(vocabulary.at(-1).officialRow,5400);
 assert.ok(vocabulary.every(x=>x.pinyinTone&&x.pinyinNumber&&x.meaningVi&&x.partOfSpeech.length&&x.collocations.length&&x.examples.length));
});
test('exercise, assessment and metadata quality signals are present',()=>{
 const skills=new Set(exercises.map(x=>x.skill));
 for(const skill of ['vocabulary','grammar','listening','reading','speaking','writing','translation','integrated'])assert.ok(skills.has(skill),skill);
 unique(exercises.map(x=>x.prompt),'exercise prompts');assert.ok(exercises.every(x=>x.explanationVi&&x.acceptedAnswers.length));
 assert.ok(grammar.every(x=>x.correctExamples.length&&x.incorrectExamples.length&&x.communicativeFunctionVi&&x.registerNoteVi&&x.spokenWrittenNoteVi));
 assert.ok(characters.every(x=>Number.isInteger(x.strokeCount)&&x.strokeCount>0));
 assert.ok(characters.every(x=>x.strokeOrderStatus==='unavailable'&&x.strokeOrderAsset===null&&x.mnemonic.type==='memory-aid-not-etymology'));
 assert.equal(assessments.filter(x=>x.assessmentType==='mini-checkpoint').length,24);
 for(const id of ['hsk6-assessment-midpoint','hsk6-assessment-receptive','hsk6-assessment-productive','hsk6-assessment-integrated','hsk6-assessment-mock','hsk6-assessment-final','hsk6-assessment-mastery'])assert.ok(assessments.some(x=>x.id===id),id);
 assert.ok(assessments.every(x=>x.rubric.accuracy&&x.rubric.coherence&&x.rubric.register&&x.rubric.taskCompletion));
});
