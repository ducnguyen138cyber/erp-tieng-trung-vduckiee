'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const advanced=require('../assets/hsk-content/hsk-advanced-self-study-v1.js');
const source=JSON.parse(fs.readFileSync('data/hsk/advanced-cases-v1.json','utf8'));
function course(level){
  const base=`data/hsk/hsk${level}/`,read=f=>JSON.parse(fs.readFileSync(base+f,'utf8'));
  const data={manifest:read('course-manifest.json')};
  for(const key of ['units','lessons','grammar','characters','exercises','assessments'])data[key]=read(key+'.json').records;
  data.enrichment=read('vocabulary-enrichment.json').entries;
  data.vocabulary=read('vocabulary/index.json').shards.flatMap(s=>read('vocabulary/'+s.file).records);
  return data;
}
for(const level of [5,6])test(`HSK${level}: every lesson and assessment has grounded, non-certifying practice`,()=>{
  const original=course(level),before=JSON.stringify(original),data=advanced.prepare(original,source);
  assert.equal(JSON.stringify(original),before,'archived content and review gates must stay intact');
  assert.equal(data.lessons.length,level===5?60:72);
  assert.equal(data.vocabulary.length,level===5?1600:1800);
  assert.equal(data.exercises.length,level===5?600:864);
  const exercises=new Map(data.exercises.map(e=>[e.id,e]));
  for(const lesson of data.lessons){
    const c=source.cases[lesson.unitId];assert.ok(c);
    for(const type of ['dialogue','listening','reading']){
      const s=lesson.sections.find(s=>s.type===type);assert.ok(s);
      const text=s.content.scriptZh||s.content.textZh;
      assert.ok(c.zh.every(line=>text.includes(line)),lesson.id+' '+type);
    }
    for(const id of lesson.practiceRefs)assert.ok(exercises.has(id),id);
  }
  for(const a of data.assessments)for(const id of a.exerciseRefs)assert.ok(exercises.has(id),id);
  for(const e of data.exercises){
    assert.equal(e.reviewStatus,'unreviewed');
    if(e.skill==='vocabulary'){
      assert.equal(e.options.filter(x=>x===e.answer).length,1,e.id);
      assert.ok(e.prompt.includes('Pinyin:'),e.id);
    }else{
      assert.equal(e.options.length,0,e.id);
      assert.ok(e.answer.referenceAnswer&&e.answer.answerVi&&e.answer.rubric.review,e.id);
    }
    if(e.skill==='listening'){
      assert.ok(e.stimulus.scriptZh);assert.equal(e.stimulus.transcriptVisibility,'after-answer');
    }
    if(e.skill==='grammar'){
      const example=data.grammar.find(g=>g.id===e.grammarFocus[0]).correctExamples[0];
      assert.equal(e.answer.referenceAnswer,example.zh);assert.equal(e.stimulus.meaningVi,example.vi);
    }
  }
  assert.ok(data.vocabulary.every(w=>!/^biến thể/.test(w.meaningVi)));
  for(const w of data.vocabulary)for(const ex of w.collocations){
    assert.ok(ex.zh.includes(w.simplified));
    assert.ok(Object.values(source.cases).some(c=>c.zh.some((zh,i)=>zh===ex.zh&&c.vi[i]===ex.vi)));
  }
});
test('HSK5–6 progress survives reload with content, open answers and review schedule',()=>{
  const saved=new Map([['erp-hsk-progress-v2','{"legacy":true}']]);
  function journal(){
    const context={localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{dispatchEvent(){}},CustomEvent:function(){},Date,JSON,Math};
    vm.runInNewContext(fs.readFileSync('assets/v82/learning-progress-merge-v1.js','utf8'),context);
    vm.runInNewContext(fs.readFileSync('assets/hsk-content/hsk-study-journey-v1.js','utf8'),context);
    return context.VDuckieHskStudyJourney;
  }
  for(const level of [5,6]){
    let j=journal();const id=`hsk${level}-lesson-01`;
    assert.equal(j.visit(level,id),true);j.position(level,id,{stage:'practice',cards:{0:3}});
    for(const stage of ['words','examples','extra'])j.contentDone(level,id,stage);
    j.recordAnswer(level,id,'q1',true,false,[]);j.recordAnswer(level,id,'q2',null,false,[]);
    assert.equal(j.complete(level,id,['q1','q2'],[{hanzi:'证据',pinyin:'zhèngjù',meaningVi:'bằng chứng'}],{content:['words','examples','extra'],verifiedIds:[]}).ok,true);
    j=journal();assert.equal(j.current().level,level);assert.equal(j.current().lessonId,id);
    assert.equal(j.lesson(id).position.cards[0],3);assert.equal(j.levelCount(level),1);
    assert.equal(j.stats(id,['q1','q2'],[]).mastered,false);
    assert.ok(j.due(level,true).some(w=>w.hanzi==='证据'));
  }
  assert.equal(saved.get('erp-hsk-progress-v2'),'{"legacy":true}');
});
test('missing advanced case material fails closed instead of displaying unsafe archived templates',()=>{
  const data=course(5);assert.throws(()=>advanced.prepare(data,null),/Chưa tải/);
  const broken=JSON.parse(JSON.stringify(source));delete broken.cases[data.units[0].id];
  assert.throws(()=>advanced.prepare(data,broken),/Thiếu tình huống/);
});

test('polyphonic dictionary fixes retain the authored reading rather than another tone',()=>{
 const data=advanced.prepare(course(6),source),words=new Map(data.vocabulary.map(w=>[w.id,w]));
 assert.equal(words.get('hsk6-v-1795').pinyinNumber,'zuan1');
 assert.match(words.get('hsk6-v-1795').meaningVi,/nghiên cứu chuyên sâu/);
 assert.doesNotMatch(words.get('hsk6-v-1795').meaningVi,/kim cương/);
 for(const id of ['hsk6-v-1126','hsk6-v-1127']){assert.equal(words.get(id).pinyinNumber,'san3');assert.match(words.get(id).meaningVi,/rải rác/);}
});
