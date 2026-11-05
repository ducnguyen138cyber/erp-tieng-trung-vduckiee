/* Deterministic game rules; the renderer supplies elapsed active time, never pixels. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VDuckieTypingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var MODES = Object.freeze({easy:{label:'Dễ',fall:12,overlap:.85},medium:{label:'Vừa',fall:9,overlap:.8},hard:{label:'Khó',fall:6,overlap:.75}});
  // ü, v and u: all accept the keyboard-friendly u spelling as requested.
  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/u:|v/g,'u').replace(/[\s’'·\-1-5]/g,'');
  }
  function glyphs(value) {
    var cursor = 0;
    var characters=Array.from(String(value).normalize('NFC'));
    return characters.map(function (char,index) {
      var length = char===':'&&index>0&&normalize(characters[index-1])==='u'?0:normalize(char).length, start = cursor; cursor += length;
      return {char:char,start:start,end:cursor};
    });
  }
  function Game(options) {
    options = options || {};
    this.mode = MODES[options.mode] || MODES.easy;
    this.random = options.random || Math.random;
    this.words = options.words.filter(function(w){return w.hanzi && w.pinyin && /^[a-z]+$/.test(normalize(w.pinyin));});
    if (!this.words.length) throw new Error('Không có từ hợp lệ để chơi.');
    this.time=0; this.lives=3; this.score=0; this.combo=0; this.bestCombo=0;
    this.attempts=0; this.correct=0; this.completed=0; this.missed=[];
    this.meteors=[]; this.nextAt=0; this.serial=0; this.input=''; this.events=[];
    this.ended=false; this.paused=false; this.bag=[]; this.lastWord=null;
    this.step(0);
  }
  Game.prototype.emit=function(type,data){this.events.push(Object.assign({type:type},data));};
  Game.prototype.drain=function(){return this.events.splice(0);};
  Game.prototype.pick=function(){
    if(!this.bag.length){
      this.bag=this.words.slice();
      for(var i=this.bag.length-1;i>0;i--){var j=Math.floor(this.random()*(i+1)),w=this.bag[i];this.bag[i]=this.bag[j];this.bag[j]=w;}
      if(this.bag.length>1&&this.bag[this.bag.length-1].hanzi===this.lastWord)this.bag.unshift(this.bag.pop());
    }
    var word=this.bag.pop();this.lastWord=word.hanzi;return word;
  };
  Game.prototype.target=function(){return this.meteors[0] || null;};
  Game.prototype.spawn=function(){
    var previous=this.meteors[this.meteors.length-1];
    var lane=previous&&previous.x<.5 ? .62+this.random()*.22 : .16+this.random()*.22;
    var meteor={id:++this.serial,word:this.pick(),born:this.time,progress:0,x:lane,heart:this.random()<.1,queued:false};
    this.meteors.push(meteor);this.nextAt=Infinity;this.emit('spawn',{meteor:meteor});
  };
  Game.prototype.finish=function(reason){if(this.ended)return;this.ended=true;this.emit('end',{reason:reason});};
  Game.prototype.step=function(seconds){
    if(this.ended||this.paused)return;
    this.time=Math.min(180,this.time+Math.max(0,seconds));
    var self=this;
    this.meteors.slice().forEach(function(m){
      m.progress=Math.min(1,(self.time-m.born)/self.mode.fall);
      if(!m.queued&&m.progress>=self.mode.overlap){m.queued=true;self.nextAt=Math.min(self.nextAt,m.born+self.mode.fall*self.mode.overlap);}
      if(m.progress>=1){
        var wasTarget=self.target()===m;
        self.meteors=self.meteors.filter(function(other){return other!==m;});
        self.lives--;self.combo=0;self.missed.push(m.word);
        if(wasTarget)self.input='';
        self.emit('miss',{meteor:m});
      }
    });
    if(this.lives<=0){this.lives=0;this.finish('lives');return;}
    if(this.time>=180){this.finish('time');return;}
    if(this.time>=this.nextAt&&this.meteors.length<2)this.spawn();
  };
  Game.prototype.type=function(raw){
    if(this.ended||this.paused||!this.target())return;
    var target=this.target(),expected=normalize(target.word.pinyin),next=normalize(raw),old=normalize(this.input),shared=0,suffix=0;
    while(shared<next.length&&shared<old.length&&next[shared]===old[shared])shared++;
    // Retained text after a cursor edit is not another key press or another shot.
    while(suffix<old.length-shared&&suffix<next.length-shared&&old[old.length-1-suffix]===next[next.length-1-suffix])suffix++;
    var accepted=old.slice(0,shared),inserted=next.slice(shared,next.length-suffix);
    for(var i=0;i<inserted.length;i++){
      this.attempts++;
      if(inserted[i]===expected[accepted.length]){
        this.correct++;this.emit('shot',{meteor:target,index:accepted.length});accepted+=inserted[i];
      }
    }
    var retained=suffix?old.slice(old.length-suffix):'';
    for(var j=0;j<retained.length;j++){if(retained[j]!==expected[accepted.length])break;accepted+=retained[j];}
    this.input=accepted;
    if(accepted!==expected)return;
    this.meteors.shift();this.input='';this.completed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    var points=100*Math.min(5,1+Math.floor((this.combo-1)/5));this.score+=points;
    if(target.heart)this.lives=Math.min(4,this.lives+1);
    this.nextAt=Math.min(this.nextAt,this.time+.6);
    this.emit('destroy',{meteor:target,points:points,combo:this.combo});
  };
  Game.prototype.result=function(){return {score:this.score,accuracy:this.attempts?Math.round(this.correct/this.attempts*100):0,bestCombo:this.bestCombo,completed:this.completed,missed:this.missed.slice()};};
  return Object.freeze({Game:Game,normalize:normalize,glyphs:glyphs,MODES:MODES});
});
