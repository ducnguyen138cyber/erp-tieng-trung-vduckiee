/* Read-only HSK curriculum quality report. Never auto-label machine-assisted text as linguistically reviewed. */
import fs from 'node:fs';
import path from 'node:path';

export function auditLevel(level, base = process.cwd()) {
  const dir = path.join(base,'data','hsk','hsk'+level);
  function read(name){return JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));}
  const lessons=read('lessons').records||[];
  const exercises=read('exercises').records||[];
  const exerciseIndex=new Map(exercises.map(exercise=>[exercise.id,exercise]));
  const ids=new Set(),issues=[],stats={
    level,lessons:lessons.length,exercises:exercises.length,
    missingExerciseRefs:0,duplicateLessonIds:0,unreviewedExercises:0,
    missingAnswers:0,missingVietnameseExplanations:0,missingFocusWords:0,
    vocabularyQuizQuestions:0,reviewedExercises:0
  };
  for(const lesson of lessons){
    if(ids.has(lesson.id)){stats.duplicateLessonIds++;issues.push({kind:'duplicate-lesson',lessonId:lesson.id});}
    ids.add(lesson.id);
    if(!lesson.titleVi||!lesson.titleZh)issues.push({kind:'missing-lesson-title',lessonId:lesson.id});
    const focus=(lesson.sections||[]).filter(section=>section.type==='vocabulary')
      .flatMap(section=>section.content&&section.content.focusWords||[]);
    if(!focus.length){stats.missingFocusWords++;issues.push({kind:'no-focus-words',lessonId:lesson.id});}
    for(const ref of lesson.practiceRefs||[]){
      const id=typeof ref==='string'?ref:ref&&ref.id;
      if(!exerciseIndex.has(id)){stats.missingExerciseRefs++;issues.push({kind:'missing-exercise',lessonId:lesson.id,exerciseId:id});}
    }
  }
  for(const exercise of exercises){
    if(exercise.reviewStatus==='linguistic-reviewed'||exercise.reviewStatus==='verified')stats.reviewedExercises++;
    else stats.unreviewedExercises++;
    if(typeof exercise.answer!=='string'&&!(exercise.answer&&typeof exercise.answer==='object')&&!(exercise.acceptedAnswers||[]).length){
      stats.missingAnswers++;issues.push({kind:'missing-answer',exerciseId:exercise.id});
    }
    if(!exercise.explanationVi){stats.missingVietnameseExplanations++;issues.push({kind:'missing-explanation',exerciseId:exercise.id});}
    if(exercise.skill==='vocabulary')stats.vocabularyQuizQuestions++;
  }
  return {stats,issues};
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const reports=[1,2,3,4].map(level=>auditLevel(level));
  process.stdout.write(JSON.stringify({generatedAt:new Date().toISOString(),levels:reports},null,2)+'\n');
  if(process.argv.includes('--strict')&&reports.some(report=>report.stats.missingExerciseRefs||report.stats.duplicateLessonIds||report.stats.missingAnswers))
    process.exitCode=1;
}
