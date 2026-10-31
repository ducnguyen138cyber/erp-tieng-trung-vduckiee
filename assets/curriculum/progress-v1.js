(function(root){
'use strict';
const sections=['overview','vocabulary','grammar','context','practice','application'];
const clone=v=>JSON.parse(JSON.stringify(v||{}));
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((r,k)=>(r[k]=x[k],r),{}):x);
const norm=v=>String(v==null?'':v).normalize('NFC').toLowerCase().replace(/[\s，。！？、,.!?;；:：“”"'‘’]/g,'');
function merge(a,b){
 a=clone(a);b=clone(b);const out=Object.assign({},Number(a.updatedAt||0)>Number(b.updatedAt||0)?a:b);
 const recent=(x,y)=>Number(x?.updatedAt||x?.completedAt||0)>Number(y?.updatedAt||y?.completedAt||0)?x:y;
 const union=(x,y)=>{const r=Object.assign({},x);Object.keys(y||{}).forEach(k=>r[k]=x?.[k]?recent(x[k],y[k]):y[k]);return r;};
 out.completed=union(a.completed,b.completed);out.review=union(a.review,b.review);out.lessons={};
 new Set([...Object.keys(a.lessons||{}),...Object.keys(b.lessons||{})]).forEach(id=>{
  const x=a.lessons?.[id]||{},y=b.lessons?.[id]||{},v=Object.assign({},recent(x,y));
  v.sections=Object.assign({},x.sections);Object.keys(y.sections||{}).forEach(k=>v.sections[k]=Math.max(Number(v.sections[k]||0),Number(y.sections[k]||0)));
  // A new attempt replaces its answer ledger, never merges old correct answers into it.
  const winning=Number(x.attempt||0)>Number(y.attempt||0)?x:y;v.attempt=winning.attempt;v.answers=Object.assign({},winning.answers);
  if(x.attempt===y.attempt)v.answers=union(x.answers,y.answers);
  v.bestScore=Math.max(x.bestScore||0,y.bestScore||0);out.lessons[id]=v;
 });return out;
}
function entry(msu,id){msu.lessons=msu.lessons||{};if(!msu.lessons[id])msu.lessons[id]={sections:{},answers:{},section:'overview',attempt:Date.now(),updatedAt:Date.now()};const p=msu.lessons[id];p.sections=p.sections||{};p.answers=p.answers||{};return p;}
function answer(msu,id,q,value,now=Date.now()){
 const p=entry(msu,id);if(p.answers[q.id])return p.answers[q.id];
 const result={value,correct:norm(value)===norm(q.answer),updatedAt:now};p.answers[q.id]=result;p.updatedAt=now;return result;
}
function score(p,qs){return qs.reduce((n,q)=>n+(p?.answers?.[q.id]?.correct?1:0),0);}
function complete(msu,l,qs,now=Date.now()){
 const p=entry(msu,l.id);const points=score(p,qs);
 if(!sections.every(s=>p.sections[s])||!qs.every(q=>p.answers[q.id])||points<Math.ceil(qs.length*.75))return false;
 msu.completed=msu.completed||{};if(!msu.completed[l.id])msu.completed[l.id]={completedAt:now,score:points,total:qs.length,version:1};
 p.bestScore=Math.max(p.bestScore||0,points);p.updatedAt=now;return true;
}
root.VDuckieCurriculumProgress=Object.freeze({sections,stable,normalizeAnswer:norm,merge,entry,answer,score,complete});
})(typeof window!=='undefined'?window:globalThis);
