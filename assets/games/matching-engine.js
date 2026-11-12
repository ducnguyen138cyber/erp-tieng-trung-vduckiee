/* Shared vocabulary normalization and deterministic matching rules. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VDuckieMatchingEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function key(s){return String(s||'').normalize('NFC').toLocaleLowerCase('vi').replace(/[\s.,;:!?()]+/g,' ').trim();}
 function meaning(values){
  for(var raw of values||[]){var s=String(raw||'').trim();
   if(!s||/\[[^\]]*[1-5][^\]]*\]/.test(s)||/^(LT:|CL:|biến thể|cách viết khác|chưa có|đang cập nhật)/i.test(s))continue;
   s=s.split(/[;；]/)[0].trim();
   if(s.length>140||!/[a-zÀ-ỹĐđ]/i.test(s)||/[\u3400-\u9fff]/.test(s))continue;
   return s;
  }return '';
 }
 function prepare(records){
  var map=new Map();
  (records||[]).forEach(function(raw){
   var hanzi=String(raw.hanzi||raw.h||'').trim(),pinyin=String(raw.pinyin||raw.p||'').trim();
   var values=Array.isArray(raw.meanings)?raw.meanings:raw.meanings?[].concat(raw.meanings.hsk||[],raw.meanings.erp||[]):raw.m||[raw.meaning];
   var vi=meaning(values);if(!hanzi||hanzi.length>40||!/[\u3400-\u9fff]/.test(hanzi)||!vi)return;
   var prior=map.get(hanzi),levels=raw.hskLevels||raw.levels||raw.l||[],sources=raw.sources||['hsk'];
   if(prior){prior.levels=Array.from(new Set(prior.levels.concat(levels)));prior.sources=Array.from(new Set(prior.sources.concat(sources)));if(!prior.pinyin)prior.pinyin=pinyin;return;}
   map.set(hanzi,{id:hanzi,hanzi:hanzi,pinyin:pinyin,meaning:vi,meaningKey:key(vi),levels:levels.slice(),sources:sources.slice()});
  });return Array.from(map.values());
 }
 function shuffle(items,random){var out=items.slice();random=random||Math.random;for(var i=out.length-1;i>0;i--){var j=Math.floor(random()*(i+1)),v=out[i];out[i]=out[j];out[j]=v;}return out;}
 function eligible(words,pool,pinyin){return words.filter(function(w){return (!pinyin||!!w.pinyin)&&(pool==='all'||pool==='factory'&&w.sources.includes('erp')||pool==='hsk79'&&w.levels.includes('7-9')||/^hsk[1-6]$/.test(pool)&&w.levels.includes(pool.slice(3)));});}
 function pick(words,count,history,random){
  count=Number(count);if(![6,8,10,12].includes(count))throw new Error('Số cặp chưa hợp lệ.');
  var seen=new Map();(history||[]).forEach(function(id,i){if(typeof id==='string')seen.set(id,i+1);});
  var candidates=shuffle(words,random).sort(function(a,b){return (seen.get(a.id)||0)-(seen.get(b.id)||0);}),labels=new Set(),chosen=[];
  for(var word of candidates){if(labels.has(word.meaningKey))continue;chosen.push(word);labels.add(word.meaningKey);if(chosen.length===count)break;}
  if(chosen.length<count)throw new Error('Kho này chưa đủ nghĩa khác nhau. Hãy chọn kho rộng hơn hoặc ít cặp hơn.');
  return chosen;
 }
 function remember(history,words){var next=(history||[]).filter(function(id){return typeof id==='string'&&id.length<=40;}),ids=new Set(words.map(function(w){return w.id;}));return next.filter(function(id){return !ids.has(id);}).concat(Array.from(ids)).slice(-20000);}
 function Round(words,random){this.words=words.slice();this.left=shuffle(words,random);this.right=shuffle(words,random);this.matched=new Set();this.selected=null;this.attempts=0;this.score=0;}
 Round.prototype.choose=function(side,id){
  if(!['left','right'].includes(side)||!this.words.some(function(w){return w.id===id;})||this.matched.has(id))return {ignored:true};
  var before=this.selected;if(before&&before.side===side&&before.id===id){this.selected=null;return {cancelled:true};}
  if(!before||before.side===side){this.selected={side:side,id:id};return {selected:true};}
  this.selected=null;this.attempts++;var correct=before.id===id;
  if(correct){this.matched.add(id);this.score=this.matched.size*100;}
  return {matched:correct,wrong:!correct,picks:[before,{side:side,id:id}],ended:this.matched.size===this.words.length};
 };
 Round.prototype.result=function(){return {score:this.score,completed:this.matched.size,correct:this.matched.size,attempts:this.attempts,accuracy:this.attempts?Math.round(100*this.matched.size/this.attempts):0};};
 return Object.freeze({prepare:prepare,eligible:eligible,pick:pick,remember:remember,Round:Round,shuffle:shuffle});
});
