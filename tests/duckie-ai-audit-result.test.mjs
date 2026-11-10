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


test('reference grammar and generated comparisons keep distinct provenance',()=>{
 const grammar={expect:['越来越'],referenceSource:'grammar-reference'};
 assert.equal(classify(grammar,200,{reply:'越来越'},true),'wrong-deployment');
 assert.equal(classify(grammar,200,{reply:'越来越',source:'grammar-reference'},true),'reference-spot-check');
 assert.equal(classify({expect:['努力'],generated:true},200,{reply:'努力',source:'verified-glossary'},true),'wrong-deployment');
 assert.equal(classify({expect:['努力'],generated:true},200,{reply:'努力'},true),'pedagogy-review-needed');
});
