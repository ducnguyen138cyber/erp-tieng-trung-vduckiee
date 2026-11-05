/* Games screen, repository vocabulary adapter, and disposable typing-game view. */
(function(root,document){
  'use strict';
  var Engine=root.VDuckieTypingEngine,host,level=0,mode='',words=[],session=null,loadId=0;
  var catalog=[],cache=new Map(),indexes=new Map();
  var mascot='./assets/mascot/duckie-reader-2d-v2.webp?v=2.0';
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function button(text,action,extra){return '<button type="button" data-game-action="'+action+'" '+(extra||'')+'>'+text+'</button>';}
  async function json(path){var response=await fetch(path);if(!response.ok)throw new Error('Không tải được kho từ (HTTP '+response.status+').');return response.json();}
  function mount(){
    if(host)return;
    host=document.createElement('section');host.id='gamesScreen';host.className='games-screen hidden';
    document.querySelector('.study-center').appendChild(host);
    host.addEventListener('click',function(event){
      var target=event.target.closest('[data-game-action]');if(!target||target.disabled)return;
      var action=target.dataset.gameAction;
      if(action==='choose')choose();
      if(action==='catalog')open();
      if(action==='level')selectLevel(Number(target.dataset.level));
      if(action==='levels'){loadId++;choose();}
      if(action==='mode'){mode=target.dataset.mode;difficulty();}
      if(action==='start'&&level&&mode&&words.length)start();
    });
  }
  function heading(step,title,copy){return '<header class="games-heading"><span class="games-eyebrow">TRÒ CHƠI · '+step+'</span><h1>'+title+'</h1><p>'+copy+'</p></header>';}
  function open(){
    mount();close();loadId++;host.classList.remove('hidden');
    host.innerHTML=heading('HỌC QUA TỪNG LƯỢT CHƠI','Một chút thử thách.<br>Thêm một từ nhớ lâu.','Chơi cùng Duckie, luyện phản xạ chữ Hán và Pinyin mỗi ngày.')+
      '<article class="games-card"><div class="games-card-art"><span class="games-orbit"></span><img src="'+mascot+'" alt="Mascot VDuckie"><span class="games-art-word">你好<small>nǐ hǎo</small></span><span class="games-art-star">✦</span></div><div class="games-card-copy"><span class="games-eyebrow">01 / PINYIN</span><h2>Luyện gõ</h2><p>Đọc chữ, gõ Pinyin, phá thiên thạch.<br>Giữ nhịp tay và đưa Duckie qua bầu trời sao.</p><div class="games-tags"><span>HSK 1–4</span><span>3 phút / ván</span><span>+3 EXP / từ mới</span></div>'+button('Chơi Luyện gõ <span aria-hidden="true">↗</span>','choose','class="games-primary"')+'</div></article><p class="games-footnote">EXP dùng chung hạn mức 50 từ/ngày với học từ. Chơi lại cùng từ không nhận thưởng trùng. Đăng nhập để lưu EXP.</p>';
    document.title='Trò chơi — VDuckie';
  }
  async function availability(){
    if(catalog.length)return;
    // Match the published learner course (graded-hsk-entry), never enable editorial-only HSK 5+.
    catalog=await Promise.all([1,2,3,4].map(async function(n){
      try{var index=await json('./data/hsk/hsk'+n+'/vocabulary/index.json');
        var count=(index.shards||[]).reduce(function(sum,shard){return sum+(Number(shard.count)||0);},0);
        var available=count>0;
        if(available)indexes.set(n,index);return {level:n,count:count,available:available};
      }catch(error){return {level:n,count:0,available:false};}
    }));
  }
  async function choose(){
    close();level=0;mode='';words=[];var request=++loadId;
    host.innerHTML=heading('BƯỚC 1 / 2','Chọn trình độ HSK','Dùng chính kho từ đang có trên VDuckie.')+'<p role="status">Đang kiểm tra kho từ…</p>';
    await availability();if(request!==loadId)return;
    host.innerHTML=heading('BƯỚC 1 / 2','Bạn muốn luyện cấp độ nào?','Chọn trình độ trước, sau đó chọn độ khó của lượt chơi.')+
      '<div class="games-levels">'+[1,2,3,4,5,6,7,8,9].map(function(n){var item=catalog.find(function(c){return c.level===n;});var available=item&&item.available;
        return button('<strong>HSK '+n+'</strong><small>'+(available?item.count+' từ trong kho':'Chưa mở')+'</small>','level','data-level="'+n+'" '+(available?'':'disabled'));
      }).join('')+'</div><p class="games-load-status" role="status"></p>'+button('← Trò chơi','catalog','class="games-back"');
  }
  async function selectLevel(n){
    if(!indexes.has(n))return;
    var request=++loadId;host.querySelectorAll('[data-level]').forEach(function(b){b.disabled=true;});
    host.querySelector('.games-load-status').textContent='Đang tải kho từ HSK '+n+'…';
    try{
      if(!cache.has(n)){
        var index=indexes.get(n),base='./data/hsk/hsk'+n+'/vocabulary/';
        var collections=await Promise.all(index.shards.map(function(shard){return json(base+shard.file);}));
        var seen=new Set(),records=[];
        collections.forEach(function(collection){(collection.records||[]).forEach(function(w){
          var hanzi=String(w.simplified||'').trim(),pinyin=String(w.pinyinTone||w.pinyin||'').trim();
          if(hanzi&&pinyin&&w.meaningVi&&/^[a-z]+$/.test(Engine.normalize(pinyin))&&!seen.has(hanzi)){
            seen.add(hanzi);records.push({hanzi:hanzi,pinyin:pinyin,meaning:w.meaningVi,level:n});
          }
        });});
        if(!records.length)throw new Error('Kho từ cấp này chưa sẵn sàng.');cache.set(n,records);
      }
      if(request!==loadId)return;level=n;words=cache.get(n);mode='';difficulty();
    }catch(error){if(request!==loadId)return;await choose();host.querySelector('.games-load-status').textContent=error.message+' Hãy thử lại.';}
  }
  function difficulty(){
    host.innerHTML=heading('BƯỚC 2 / 2 · HSK '+level,'Chọn nhịp chơi của bạn','Gõ Pinyin không dấu. Đủ từ là bắn vỡ, không cần Enter.')+
      '<div class="games-modes">'+Object.keys(Engine.MODES).map(function(key){var config=Engine.MODES[key];return button('<span class="games-mode-mark">'+({easy:'✧',medium:'✦',hard:'✷'}[key])+'</span><strong>'+config.label+'</strong><small>'+config.fall+' giây / thiên thạch</small>','mode','data-mode="'+key+'" aria-pressed="'+(mode===key)+'"');}).join('')+'</div>'+
      '<div class="games-rules"><b>Sẵn sàng cất cánh?</b><p>3 tim ban đầu · Phá đá ♥ để hồi tim · Tối đa 2 thiên thạch cùng lúc.</p><p>Gõ <b>shuohua</b> cho <b>shuōhuà</b>. Chữ đúng đổi xanh, sai đổi đỏ; Backspace để sửa. Chấp nhận ü / v / u: / u.</p><p>100 điểm mỗi từ; mỗi 5 combo tăng hệ số điểm (tối đa ×5). EXP luôn +3 cho từ mới, không nhân combo.</p></div><div class="games-setup-actions">'+button('← Đổi HSK','levels','class="games-back"')+button('Bắt đầu →','start','class="games-primary" '+(mode?'':'disabled'))+'</div>';
  }
  function start(){close();session=new View(words,mode,level);session.start();}
  function close(){if(session){session.dispose();session=null;}}
  function View(vocabulary,difficultyKey,hsk){
    this.game=new Engine.Game({words:vocabulary,mode:difficultyKey});this.hsk=hsk;
    this.alive=true;this.frame=0;this.last=0;this.audio=null;this.awards=new Map();this.rewarded=0;this.pending=0;this.rewardNote='';
    try{this.muted=localStorage.getItem('vduckie:typing-muted')==='1';}catch(error){this.muted=false;}
    this.previousFocus=document.activeElement;this.appShell=document.getElementById('appShell');if(this.appShell)this.appShell.inert=true;
    this.root=document.createElement('div');this.root.className='tg-overlay';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-label','Luyện gõ HSK '+hsk);this.root.setAttribute('aria-modal','true');
    this.root.innerHTML='<div class="tg-window"><header class="tg-header"><div><img src="'+mascot+'" alt="Mascot VDuckie"><b>VDuckie</b><span>Luyện gõ</span></div>'+button('×','exit','aria-label="Thoát trò chơi"')+'</header><div class="tg-space"><div class="tg-stars" aria-hidden="true"></div><div class="tg-hud"><div class="tg-score-group"><span class="tg-pill">HSK '+hsk+'</span><span class="tg-pill">Điểm <b data-score>0</b></span><span class="tg-timer" data-time>3:00</span></div><div class="tg-controls"><small>'+Engine.MODES[difficultyKey].label+'</small><span class="tg-hearts" data-hearts aria-label="3 tim">♥♥♥</span>'+button('♪','sound','aria-label="Tắt âm" aria-pressed="false"')+button('Ⅱ','pause','aria-label="Tạm dừng"')+'</div></div><div class="tg-arena" aria-label="Vùng thiên thạch"><div class="tg-rocks"></div><div class="tg-effects" aria-hidden="true"></div><div class="tg-plane"><img src="./assets/games/duck-plane.svg" alt="Vịt trắng lái máy bay"><i class="tg-propeller"></i></div><div class="tg-floor"></div></div><div class="tg-feedback" role="status" aria-live="polite"></div><div class="tg-combo" data-combo></div></div><form class="tg-inputbar"><label for="typingPinyin">Gõ Pinyin</label><div class="tg-input-wrap"><div class="tg-input-mirror" aria-hidden="true"></div><input id="typingPinyin" aria-label="Gõ Pinyin không dấu" placeholder="Gõ để bắn…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" enterkeyhint="done"></div>'+button('↶','focus','aria-label="Đặt con trỏ vào ô gõ"')+'</form><div class="tg-cover" hidden></div></div>';
    document.body.appendChild(this.root);document.body.classList.add('typing-game-open');document.documentElement.classList.add('typing-game-open');
    this.input=this.root.querySelector('input');this.arena=this.root.querySelector('.tg-arena');
    this.rocks=this.root.querySelector('.tg-rocks');this.effects=this.root.querySelector('.tg-effects');this.cover=this.root.querySelector('.tg-cover');
    this.onClick=this.click.bind(this);this.onVisibility=this.visibility.bind(this);this.onResize=this.resize.bind(this);this.onKey=this.key.bind(this);
    this.root.addEventListener('click',this.onClick);
    this.root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();});
    var self=this;
    this.input.addEventListener('input',function(event){if(event.isComposing)return;self.type();});
    this.input.addEventListener('compositionend',function(){self.type();});
    document.addEventListener('visibilitychange',this.onVisibility);document.addEventListener('keydown',this.onKey);
    root.addEventListener('resize',this.onResize);if(root.visualViewport){root.visualViewport.addEventListener('resize',this.onResize);root.visualViewport.addEventListener('scroll',this.onResize);}
    this.resize();this.soundButton();
  }
  View.prototype.start=function(){this.unlockAudio();this.render();this.consume();this.input.focus({preventScroll:true});this.loop();};
  View.prototype.resize=function(){
    var viewport=root.visualViewport;
    this.root.style.setProperty('--tg-height',(viewport?viewport.height:root.innerHeight)+'px');
    this.root.style.setProperty('--tg-top',(viewport?viewport.offsetTop:0)+'px');
  };
  View.prototype.unlockAudio=function(){
    if(this.muted)return;
    try{var Audio=root.AudioContext||root.webkitAudioContext;if(!this.audio&&Audio)this.audio=new Audio();if(this.audio&&this.audio.state==='suspended')this.audio.resume().catch(function(){});}catch(error){}
  };
  View.prototype.tone=function(destroy){
    if(this.muted||!this.audio||this.audio.state!=='running')return;
    var now=this.audio.currentTime,osc=this.audio.createOscillator(),gain=this.audio.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(destroy?850:580,now);osc.frequency.exponentialRampToValueAtTime(destroy?180:900,now+.075);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.025,now+.005);gain.gain.exponentialRampToValueAtTime(.0001,now+.09);
    osc.connect(gain);gain.connect(this.audio.destination);osc.start(now);osc.stop(now+.1);osc.onended=function(){osc.disconnect();gain.disconnect();};
  };
  View.prototype.soundButton=function(){var b=this.root.querySelector('[data-game-action="sound"]');b.textContent=this.muted?'♪̸':'♪';b.setAttribute('aria-label',this.muted?'Bật âm':'Tắt âm');b.setAttribute('aria-pressed',String(this.muted));};
  View.prototype.click=function(event){
    var buttonNode=event.target.closest('[data-game-action]');if(!buttonNode)return;
    var action=buttonNode.dataset.gameAction;
    if(action==='exit'){close();open();return;}
    if(action==='choices'){close();choose();return;}
    if(action==='restart'){start();return;}
    if(action==='sound'){this.muted=!this.muted;try{localStorage.setItem('vduckie:typing-muted',this.muted?'1':'0');}catch(error){}if(this.muted&&this.audio)this.audio.suspend().catch(function(){});else this.unlockAudio();this.soundButton();}
    if(action==='pause')this.pause();
    if(action==='resume')this.resume();
    if(action==='focus'&&!this.game.paused&&!this.game.ended)this.input.focus({preventScroll:true});
  };
  View.prototype.key=function(event){
    if(event.key==='Escape'){event.preventDefault();if(this.game.paused)this.resume();else this.pause();}
    if(event.key==='Tab'){
      var focusable=Array.from(this.root.querySelectorAll('button:not([disabled]),input:not([disabled])')).filter(function(n){return n.getClientRects().length;});
      var first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  };
  View.prototype.visibility=function(){if(document.hidden)this.pause('Đã tạm dừng khi chuyển tab.');};
  View.prototype.pause=function(copy){
    if(this.game.paused||this.game.ended)return;this.game.paused=true;cancelAnimationFrame(this.frame);this.frame=0;
    this.input.disabled=true;this.root.classList.add('is-paused');if(this.audio)this.audio.suspend().catch(function(){});
    this.cover.hidden=false;this.cover.innerHTML='<div class="tg-dialog"><span class="games-eyebrow">NGHỈ MỘT NHỊP</span><h2>Tạm dừng</h2><p>'+esc(copy||'Thiên thạch và đồng hồ đang chờ bạn.')+'</p>'+button('Tiếp tục →','resume','class="games-primary"')+button('Đổi HSK / độ khó','choices')+button('Thoát','exit')+'</div>';this.cover.querySelector('button').focus();
  };
  View.prototype.resume=function(){
    if(!this.game.paused||this.game.ended||document.hidden)return;this.game.paused=false;this.last=0;this.cover.hidden=true;this.input.disabled=false;this.root.classList.remove('is-paused');this.unlockAudio();this.input.focus({preventScroll:true});this.loop();
  };
  View.prototype.type=function(){
    this.unlockAudio();this.game.type(this.input.value);this.input.value=this.game.input;this.consume();this.render();
  };
  View.prototype.loop=function(){
    var self=this;
    if(!this.alive||this.game.paused||this.game.ended)return;
    this.frame=requestAnimationFrame(function(now){if(!self.alive)return;var dt=self.last?(now-self.last)/1000:0;self.last=now;self.game.step(dt);self.consume();self.render();self.loop();});
  };
  View.prototype.flash=function(text){var node=this.root.querySelector('.tg-feedback');node.textContent=text;node.dataset.until=String(this.game.time+2.5);};
  View.prototype.effect=function(className,text,x,y){
    var node=document.createElement('span');node.className=className;node.textContent=text;node.style.left=x+'px';node.style.top=y+'px';
    this.effects.appendChild(node);node.addEventListener('animationend',function(){node.remove();},{once:true});
  };
  View.prototype.consume=function(){
    var self=this;
    this.game.drain().forEach(function(event){var meteor=event.meteor;
      if(event.type==='shot'){
        self.tone(false);var plane=self.root.querySelector('.tg-plane'),tx=self.position(meteor);
        var bullet=document.createElement('i');bullet.className='tg-bullet';bullet.style.left=plane.offsetLeft+'px';bullet.style.top=(self.arena.clientHeight-45)+'px';bullet.style.setProperty('--dx',(tx.x-plane.offsetLeft)+'px');bullet.style.setProperty('--dy',(tx.y-self.arena.clientHeight+45)+'px');self.effects.appendChild(bullet);bullet.addEventListener('animationend',function(){bullet.remove();},{once:true});
      }
      if(event.type==='destroy'){
        self.tone(true);var p=self.position(meteor);self.effect('tg-burst','✦',p.x,p.y);self.effect('tg-points','+'+event.points+(meteor.heart?' ♥':''),p.x,p.y-22);
        self.reward(meteor.word);self.input.value='';
      }
      if(event.type==='miss'){self.flash(meteor.word.hanzi+' · '+meteor.word.pinyin+' · '+meteor.word.meaning);self.input.value=self.game.input;}
      if(event.type==='end')self.end(event.reason);
    });
  };
  View.prototype.reward=function(word){
    // One RPC in flight per word in this round. All rounds/modes/learning share server dedupe + daily quota.
    var key=word.level+':'+word.hanzi;if(this.awards.has(key)||!root.VDuckieEXP)return;
    var self=this;this.pending++;
    var promise=root.VDuckieEXP.awardWordMastery(word.level,word.hanzi,this.root.querySelector('[data-score]')).then(function(row){
      if(row&&row.awarded)self.rewarded+=Number(row.exp_awarded)||0;
      if(row&&row.reason==='daily_cap')self.rewardNote='Đã đạt 50 từ thưởng hôm nay. Bạn vẫn chơi bình thường.';
      if(row&&row.reason==='not_authenticated')self.rewardNote='Đăng nhập để lưu EXP; điểm game vẫn được tính.';
      if(row&&row.reason==='error')self.rewardNote='Chưa xác nhận được EXP do kết nối. Điểm game vẫn được tính.';
    }).catch(function(){self.rewardNote='Chưa xác nhận được EXP do kết nối.';}).finally(function(){self.pending--;if(self.alive&&self.game.ended)self.rewardSummary();});
    this.awards.set(key,promise);
  };
  View.prototype.rewardSummary=function(){var node=this.cover.querySelector('[data-game-reward]');if(node)node.textContent=this.pending?'Đang xác nhận EXP…':('+'+this.rewarded+' EXP · '+(this.rewardNote||'Từ đã nhận thưởng không cộng lại.'));};
  View.prototype.end=function(reason){
    cancelAnimationFrame(this.frame);this.frame=0;this.input.disabled=true;this.input.blur();this.root.classList.add('is-paused');if(this.audio)this.audio.suspend().catch(function(){});
    var result=this.game.result(),missed=Array.from(new Map(result.missed.map(function(w){return [w.hanzi,w];})).values());
    this.cover.hidden=false;this.cover.innerHTML='<div class="tg-dialog tg-results"><span class="games-eyebrow">'+(reason==='time'?'HOÀN THÀNH 3 PHÚT':'HẾT TIM')+'</span><h2>Một chuyến bay đáng nhớ</h2><div class="tg-result-score">'+result.score+' <small>điểm</small></div><div class="tg-result-stats"><span><b>'+result.accuracy+'%</b>Chính xác</span><span><b>'+result.bestCombo+'</b>Combo tốt nhất</span><span><b>'+result.completed+'</b>Từ hoàn thành</span></div><p data-game-reward role="status"></p><h3>Từ bỏ lỡ · Ôn lại</h3><div class="tg-missed">'+(missed.length?missed.map(function(w){return '<div><b lang="zh">'+esc(w.hanzi)+'</b><span>'+esc(w.pinyin)+'</span><small>'+esc(w.meaning)+'</small></div>';}).join(''):'<p>Bạn không bỏ lỡ từ nào. Tiếp tục giữ nhịp nhé!</p>')+'</div><div class="tg-result-actions">'+button('Chơi lại →','restart','class="games-primary"')+button('Đổi HSK / độ khó','choices')+button('Về Trò chơi','exit')+'</div></div>';this.rewardSummary();this.cover.querySelector('button').focus();
  };
  View.prototype.position=function(m){return {x:this.arena.clientWidth*m.x,y:-44+(this.arena.clientHeight+44)*m.progress};};
  View.prototype.render=function(){
    var game=this.game,target=game.target(),self=this,normalized=Engine.normalize(game.input),expected=target?Engine.normalize(target.word.pinyin):'',prefix=0;
    while(prefix<normalized.length&&normalized[prefix]===expected[prefix])prefix++;
    var wrong=normalized.length>prefix;
    Array.from(this.rocks.children).forEach(function(node){if(!game.meteors.some(function(m){return String(m.id)===node.dataset.id;}))node.remove();});
    game.meteors.forEach(function(m){
      var node=self.rocks.querySelector('[data-id="'+m.id+'"]');if(!node){node=document.createElement('div');node.className='tg-meteor';node.dataset.id=m.id;self.rocks.appendChild(node);}
      var p=self.position(m),active=m===target;
      node.style.left=p.x+'px';node.style.top=p.y+'px';
      function toggle(name,value){if(node.classList.contains(name)!==value)node.classList.toggle(name,value);}
      toggle('is-target',active);toggle('is-wrong',active&&wrong);toggle('is-cracked',active&&prefix>Engine.normalize(m.word.pinyin).length*.5);
      var content=(m.heart?'<span class="tg-heart-gift">♥</span>':'')+'<div class="tg-stone"></div><div class="tg-word"><strong lang="zh">'+esc(m.word.hanzi)+'</strong><span>'+Engine.glyphs(m.word.pinyin).map(function(g){var cls=active&&g.end<=prefix&&g.end>g.start?'is-correct':active&&wrong&&g.start===prefix?'is-wrong':'';return '<i class="'+cls+'">'+esc(g.char)+'</i>';}).join('')+'</span></div>';
      if(node.innerHTML!==content)node.innerHTML=content;
    });
    var plane=this.root.querySelector('.tg-plane');plane.style.left=(target?target.x*100:50)+'%';
    function text(selector,value){var node=self.root.querySelector(selector);if(node.textContent!==String(value))node.textContent=value;}
    text('[data-score]',game.score);
    var hearts=this.root.querySelector('[data-hearts]');if(hearts.textContent!=='♥'.repeat(game.lives)){hearts.textContent='♥'.repeat(game.lives);hearts.setAttribute('aria-label',game.lives+' tim');}
    var remaining=Math.ceil(180-game.time);text('[data-time]',Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'));
    text('[data-combo]',game.combo>1?'COMBO '+game.combo+' · ×'+Math.min(5,1+Math.floor((game.combo-1)/5)):'');
    var mirror=this.root.querySelector('.tg-input-mirror');var mirrorHTML=Engine.glyphs(game.input).map(function(g){return '<span class="'+(g.end<=prefix?'is-correct':'is-wrong')+'">'+esc(g.char)+'</span>';}).join('');if(mirror.innerHTML!==mirrorHTML)mirror.innerHTML=mirrorHTML;
    if(this.input.getAttribute('aria-invalid')!==String(wrong))this.input.setAttribute('aria-invalid',String(wrong));
    var feedback=this.root.querySelector('.tg-feedback');if(feedback.textContent&&Number(feedback.dataset.until)<game.time)feedback.textContent='';
  };
  View.prototype.dispose=function(){
    this.alive=false;cancelAnimationFrame(this.frame);this.frame=0;this.game.paused=true;
    document.removeEventListener('visibilitychange',this.onVisibility);document.removeEventListener('keydown',this.onKey);root.removeEventListener('resize',this.onResize);
    if(root.visualViewport){root.visualViewport.removeEventListener('resize',this.onResize);root.visualViewport.removeEventListener('scroll',this.onResize);}
    if(this.audio&&this.audio.state!=='closed')this.audio.close().catch(function(){});this.audio=null;this.root.remove();if(this.appShell)this.appShell.inert=false;document.body.classList.remove('typing-game-open');document.documentElement.classList.remove('typing-game-open');
    var back=host&&host.querySelector('button');if(back)back.focus({preventScroll:true});
  };
  root.VDuckieGames={open:open,leave:function(){loadId++;close();if(host)host.classList.add('hidden');}};
})(window,document);
