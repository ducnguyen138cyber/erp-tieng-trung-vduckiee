/* Curated answer matching; never calls a model or an EXP service. */
(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./typing-engine.js'):root.VDuckieTypingEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.VDuckieSentenceEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(T){'use strict';
function Round(options){options=options||{};var random=options.random||Math.random;this.items=(options.sentences||[]).slice();for(var i=this.items.length-1;i>0;i--){var j=Math.floor(random()*(i+1)),x=this.items[i];this.items[i]=this.items[j];this.items[j]=x;}this.items=this.items.slice(0,options.count||10);if(!this.items.length)throw new Error('Chủ đề chưa có câu luyện.');this.index=0;this.input='';this.solved=false;this.revealed=false;this.answer=null;this.correct=0;this.attempts=0;this.completed=0;this.score=0;this.missed=[];this.ended=false;}
Round.prototype.current=function(){return this.items[this.index]||null;};
Round.prototype.type=function(raw){if(this.ended||this.revealed)return {accepted:0,rejected:0};var answers=this.current().answers,expected=answers.map(function(a){return T.normalize(a.pinyin);}),next=T.normalize(raw),old=this.input,shared=0,suffix=0;
while(shared<next.length&&shared<old.length&&next[shared]===old[shared])shared++;
while(suffix<old.length-shared&&suffix<next.length-shared&&old[old.length-1-suffix]===next[next.length-1-suffix])suffix++;
var value=old.slice(0,shared),inserted=next.slice(shared,next.length-suffix),accepted=0,rejected=0;
for(var i=0;i<inserted.length;i++){this.attempts++;var proposal=value+inserted[i];if(expected.some(function(s){return s.indexOf(proposal)===0;})){value=proposal;this.correct++;accepted++;}else rejected++;}
var retained=suffix?old.slice(old.length-suffix):'';for(var k=0;k<retained.length;k++){var p=value+retained[k];if(!expected.some(function(s){return s.indexOf(p)===0;}))break;value=p;}
this.input=value;var exact=expected.indexOf(value);if(exact!==-1){this.solved=true;this.revealed=true;this.answer=answers[exact];this.completed++;this.score+=100;}
return {accepted:accepted,rejected:rejected};};
Round.prototype.skip=function(){if(this.ended||this.revealed)return;this.missed.push(this.current());this.answer=this.current().answers[0];this.revealed=true;};
Round.prototype.next=function(){if(!this.revealed||this.ended)return false;this.index++;this.input='';this.solved=false;this.revealed=false;this.answer=null;if(this.index>=this.items.length)this.ended=true;return true;};
Round.prototype.result=function(){return {score:this.score,completed:this.completed,total:this.items.length,accuracy:this.attempts?Math.round(100*this.correct/this.attempts):0,missed:this.missed.slice()};};
// Choose a curated alternative only from the accepted prefix. Never expose hidden letters.
Round.prototype.mask=function(){var input=this.input,answer=(this.solved?this.answer:null)||this.current().answers.find(function(a){return T.normalize(a.pinyin).indexOf(input)===0;})||this.current().answers[0];return mask(answer,input);};
function mask(answer,input){var cursor=0,groups=answer.pinyin.trim().split(/\s+/).map(function(syllable){return Array.from(T.normalize(syllable)).map(function(char){var index=cursor++;return {index:index,text:index<input.length?char:'*',done:index<input.length,active:index===input.length};});});var end=answer.hanzi.match(/[。！？!?]+$/);return {groups:groups,total:cursor,typed:input.length,punctuation:end?end[0].replace(/。/g,'.').replace(/！/g,'!').replace(/？/g,'?'):''};}
return {Round:Round,mask:mask};});
