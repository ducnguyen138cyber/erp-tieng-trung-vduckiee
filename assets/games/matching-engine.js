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
 // A correct Hanzi–Vietnamese pair connects directly, regardless of intervening tiles.
 function Board(words,random){this.words=words.slice();this.cols=4;this.rows=Math.ceil(words.length*2/this.cols);this.random=random||Math.random;this.cells=[];words.forEach(function(w){this.cells.push({id:w.id,side:'left',word:w},{id:w.id,side:'right',word:w});},this);this.matched=new Set();this.selected=null;this.attempts=0;this.score=0;this.reshuffle();}
 Board.prototype.path=function(a,b){if(a===b||!this.cells[a]||!this.cells[b])return null;return [{x:a%this.cols+1,y:Math.floor(a/this.cols)+1},{x:b%this.cols+1,y:Math.floor(b/this.cols)+1}];};
 Board.prototype.move=function(){for(var a=0;a<this.cells.length;a++)if(this.cells[a])for(var b=a+1;b<this.cells.length;b++)if(this.cells[b]&&this.cells[a].id===this.cells[b].id&&this.cells[a].side!==this.cells[b].side)return {a:a,b:b,path:this.path(a,b)};return null;};
 Board.prototype.reshuffle=function(){this.selected=null;var spots=[],tiles=[];this.cells.forEach(function(c,i){if(c){spots.push(i);tiles.push(c);}});var shuffled=shuffle(tiles,this.random);spots.forEach(function(i,j){this.cells[i]=shuffled[j];},this);return !!tiles.length;};
 Board.prototype.choose=function(index){
  index=Number(index);var tile=this.cells[index];if(!tile)return {ignored:true};
  if(this.selected===index){this.selected=null;return {cancelled:true};}
  if(this.selected===null){this.selected=index;return {selected:true};}
  var before=this.selected,first=this.cells[before];if(first.side===tile.side){this.selected=index;return {selected:true};}this.selected=null;this.attempts++;
  if(first.id!==tile.id)return {wrong:true,picks:[before,index]};var path=this.path(before,index);
  this.cells[before]=null;this.cells[index]=null;this.matched.add(tile.id);this.score=this.matched.size*100;
  return {matched:true,picks:[before,index],path:path,word:tile.word,ended:this.matched.size===this.words.length};
 };
 Board.prototype.result=Round.prototype.result;
 function Countdown(seconds,now){this.limit=seconds*1000;this.remaining=this.limit;this.active=0;this.last=now;this.paused=false;this.ended=false;}
 Countdown.prototype.tick=function(now){var delta=Math.max(0,now-this.last);this.last=now;if(!this.paused&&!this.ended){this.active+=Math.min(delta,this.remaining);this.remaining=Math.max(0,this.remaining-delta);if(!this.remaining)this.ended=true;}return this.remaining;};
 Countdown.prototype.bonus=function(seconds){if(this.ended)return false;this.remaining+=seconds*1000;return true;};
 Countdown.prototype.pause=function(now){this.tick(now);this.paused=true;};
 Countdown.prototype.resume=function(now){this.last=now;this.paused=false;};

 return Object.freeze({prepare:prepare,eligible:eligible,pick:pick,remember:remember,Round:Round,Board:Board,Countdown:Countdown,shuffle:shuffle});
});
