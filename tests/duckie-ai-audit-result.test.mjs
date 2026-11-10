import test from 'node:test';import assert from 'node:assert/strict';
import {classify} from './duckie-ai-audit-result.mjs';
const item={expect:['写','xiě'],glossary:true};
test('availability, rejection and wrong candidate cannot be reported as a pass',()=>{
 assert.equal(classify(item,503,{}),'unavailable');
 assert.equal(classify(item,422,{}),'safe-rejected');
 assert.equal(classify(item,200,{reply:'写 (xiě)'},true),'wrong-deployment');
 assert.equal(classify(item,200,{reply:'写 (xiè)',source:'verified-glossary'},true),'incorrect-or-incomplete');
 assert.equal(classify(item,200,{reply:'写 (xiě)',source:'verified-glossary'},true),'glossary-spot-check');
});
test('matching grammar tokens always requires editorial review',()=>{
 assert.equal(classify({expect:['越来越']},200,{reply:'越来越'}),'pedagogy-review-needed');
});
