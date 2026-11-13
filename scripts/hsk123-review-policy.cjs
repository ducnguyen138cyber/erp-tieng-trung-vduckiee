'use strict';
const crypto=require('node:crypto');
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
function digest(record){const copy={...record};delete copy.reviewEvidence;return crypto.createHash('sha256').update(JSON.stringify(stable(copy))).digest('hex');}
function independent(record){const e=record?.reviewEvidence;return !!(e&&e.independent===true&&typeof e.reviewerId==='string'&&e.reviewerId.trim()&&typeof e.reference==='string'&&e.reference.trim()&&Number.isFinite(Date.parse(e.reviewedAt))&&e.contentVersion===record.contentVersion&&['human-reviewed','approved'].includes(e.status)&&(e.status!=='approved'||(typeof e.approverId==='string'&&e.approverId.trim()&&e.approverId!==e.reviewerId)));}
function validateReviewEvents(events,entries){
 const issues=[],byId=new Map(entries.map(e=>[e.id,e.record||e])),states=new Map();
 for(const event of events){const r=byId.get(event.id),previous=states.get(event.id)||'unreviewed',next={'unreviewed':'machine-checked','machine-checked':'human-reviewed','human-reviewed':'approved'}[previous];
  if(!r){issues.push({id:event.id,rule:'review-record-missing'});continue;}
  if(event.state!==next)issues.push({id:event.id,rule:'review-transition',previous,next,event:event.state});
  if(event.contentVersion!==r.contentVersion||event.recordSha256!==digest(r))issues.push({id:event.id,rule:'stale-review'});
  if(event.state==='machine-checked'&&(!Array.isArray(event.checks)||!event.checks.length||!event.checks.every(c=>c.result==='pass'&&c.name)))issues.push({id:event.id,rule:'missing-machine-evidence'});
  if(['human-reviewed','approved'].includes(event.state)&&!independent({...r,reviewEvidence:{...event,status:event.state}}))issues.push({id:event.id,rule:'independent-review-evidence'});
  states.set(event.id,event.state);
 }
 for(const [id,r] of byId)if(r.reviewEvidence&&(!independent(r)||states.get(id)!==r.reviewEvidence.status))issues.push({id,rule:'unbacked-review-evidence'});
 return issues;
}
module.exports={digest,independent,validateReviewEvents};
