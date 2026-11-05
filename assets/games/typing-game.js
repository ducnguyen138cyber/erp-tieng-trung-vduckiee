/* Games screen, repository vocabulary adapter, and disposable typing-game view. */
(function(root,document){
  'use strict';
  var Engine=root.VDuckieTypingEngine,host,level=0,mode='',words=[],session=null,loadId=0;
  var catalog=[],cache=new Map(),indexes=new Map(),stylePromise=null,gameStyles=null;
  var STYLE_URL="./assets/games/typing-game.css?v=3";
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
      '<div class="games-rules"><b>Sẵn sàng cất cánh?</b><p>3 tim ban đầu · Phá đá ♥ để hồi tim (tối đa 4 tim) · Tối đa 2 thiên thạch cùng lúc.</p><p>Gõ <b>shuohua</b> cho <b>shuōhuà</b>. Mỗi phím đúng bắn một viên đạn. Phím sai được bỏ qua, không cần xóa; Backspace vẫn dùng được. Chấp nhận ü / v / u: / u.</p><p>100 điểm mỗi từ; mỗi 5 combo tăng hệ số điểm (tối đa ×5). EXP luôn +3 cho từ mới, không nhân combo.</p></div><div class="games-setup-actions">'+button('← Đổi HSK','levels','class="games-back"')+button('Bắt đầu →','start','class="games-primary" '+(mode?'':'disabled'))+'</div>';
  }
  function prepareStyles(){
    if(stylePromise)return stylePromise;
    stylePromise=fetch(STYLE_URL).then(function(response){if(!response.ok)throw new Error('Không tải được giao diện trò chơi.');return response.text();}).then(function(css){
      if(root.CSSStyleSheet&&root.CSSStyleSheet.prototype.replaceSync){gameStyles=new root.CSSStyleSheet();gameStyles.replaceSync(css);}
      return css;
    }).catch(function(error){stylePromise=null;throw error;});
    return stylePromise;
  }
  async function start(){
    var request=++loadId,startButton=host.querySelector('[data-game-action="start"]');
    if(startButton)startButton.disabled=true;
    try{
      var css=await prepareStyles();if(request!==loadId)return;
      close();session=new View(words,mode,level,css);session.start();
    }catch(error){
      if(request!==loadId)return;
      var message=host.querySelector('[data-game-start-error]');if(!message){message=document.createElement('p');message.dataset.gameStartError='';message.setAttribute('role','status');host.appendChild(message);}
      message.textContent=error.message+' Hãy thử lại.';
    }finally{if(startButton)startButton.disabled=false;}
  }
  function close(){if(session){session.dispose();session=null;}}
  function View(vocabulary,difficultyKey,hsk,css){
    this.game=new Engine.Game({words:vocabulary,mode:difficultyKey});this.hsk=hsk;
    this.alive=true;this.frame=0;this.last=0;this.audio=null;this.animations=new Set();this.activeSources=new Set();this.meteorNodes=new Map();this.uiDirty=true;this.lastSecond=-1;this.shotSerial=0;this.awards=new Map();this.rewarded=0;this.pending=0;this.rewardNote='';
    try{this.muted=localStorage.getItem('vduckie:typing-muted')==='1';}catch(error){this.muted=false;}
    this.previousFocus=document.activeElement;this.appShell=document.getElementById('appShell');if(this.appShell)this.appShell.inert=true;
    this.root=document.createElement('div');this.root.className='tg-overlay';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-label','Luyện gõ HSK '+hsk);this.root.setAttribute('aria-modal','true');
    this.root.innerHTML='<div class="tg-window"><header class="tg-header"><div><img src="'+mascot+'" alt="Mascot VDuckie"><b>VDuckie</b><span>Luyện gõ</span></div>'+button('×','exit','aria-label="Thoát trò chơi"')+'</header><div class="tg-space"><div class="tg-stars" aria-hidden="true"></div><div class="tg-hud"><div class="tg-score-group"><span class="tg-pill">HSK '+hsk+'</span><span class="tg-pill">Điểm <b data-score>0</b></span><span class="tg-timer" data-time>3:00</span></div><div class="tg-controls"><small>'+Engine.MODES[difficultyKey].label+'</small><span class="tg-hearts" data-hearts aria-label="3 tim">♥♥♥</span>'+button('♪','sound','aria-label="Tắt âm" aria-pressed="false"')+button('Ⅱ','pause','aria-label="Tạm dừng"')+'</div></div><div class="tg-arena" aria-label="Vùng thiên thạch"><div class="tg-rocks"></div><div class="tg-effects" aria-hidden="true"></div><div class="tg-plane"><img src="./assets/games/airplane.svg?v=2" alt="Máy bay xanh trắng"><i class="tg-propeller"></i></div><div class="tg-floor"></div></div><div class="tg-feedback" role="status" aria-live="polite"></div><div class="tg-combo" data-combo></div></div><form class="tg-inputbar"><label for="typingPinyin">Gõ Pinyin</label><div class="tg-input-wrap"><div class="tg-input-mirror" aria-hidden="true"></div><input id="typingPinyin" aria-label="Gõ Pinyin không dấu" placeholder="Gõ để bắn…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text" enterkeyhint="done"></div>'+button('↶','focus','aria-label="Đặt con trỏ vào ô gõ"')+'</form><div class="tg-cover" hidden></div></div>';
    // Shadow DOM prevents gameplay mutations from waking page-wide translation,
    // roadmap and mascot observers. The hub/navigation remain in the document.
    this.stage=document.createElement('div');this.stage.className='tg-stage-host';
    this.shadow=this.stage.attachShadow({mode:'open'});
    if(gameStyles)this.shadow.adoptedStyleSheets=[gameStyles];else{var style=document.createElement('style');style.textContent=css;this.shadow.appendChild(style);}
    this.shadow.appendChild(this.root);document.body.appendChild(this.stage);
    document.body.classList.add('typing-game-open');document.documentElement.classList.add('typing-game-open');
    this.input=this.root.querySelector('input');this.arena=this.root.querySelector('.tg-arena');
    this.rocks=this.root.querySelector('.tg-rocks');this.effects=this.root.querySelector('.tg-effects');this.cover=this.root.querySelector('.tg-cover');
    this.scoreNode=this.root.querySelector('[data-score]');this.heartsNode=this.root.querySelector('[data-hearts]');this.timeNode=this.root.querySelector('[data-time]');this.comboNode=this.root.querySelector('[data-combo]');this.mirror=this.root.querySelector('.tg-input-mirror');this.feedback=this.root.querySelector('.tg-feedback');
    this.input.setAttribute('aria-invalid','false');
    this.bullets=this.makePool('tg-bullet',64);this.bursts=this.makePool('tg-burst',8,'✦');this.points=this.makePool('tg-points',8);
    this.onClick=this.click.bind(this);this.onVisibility=this.visibility.bind(this);this.onResize=this.resize.bind(this);this.onKey=this.key.bind(this);
    this.root.addEventListener('click',this.onClick);this.root.addEventListener('keydown',this.onKey);
    ['keyup','keypress'].forEach(function(name){this.root.addEventListener(name,function(event){event.stopPropagation();});},this);
    this.root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();});
    var self=this;
    this.input.addEventListener('input',function(event){event.stopPropagation();if(event.isComposing)return;self.type();});
    this.input.addEventListener('compositionend',function(){self.type();});
    document.addEventListener('visibilitychange',this.onVisibility);
    root.addEventListener('resize',this.onResize);if(root.visualViewport){root.visualViewport.addEventListener('resize',this.onResize);root.visualViewport.addEventListener('scroll',this.onResize);}
    this.resize();this.soundButton();
  }
  View.prototype.start=function(){this.unlockAudio();this.render();this.consume();this.input.focus({preventScroll:true});this.loop();};
  View.prototype.resize=function(){
    var viewport=root.visualViewport;
    this.root.style.setProperty('--tg-height',(viewport?viewport.height:root.innerHeight)+'px');
    this.root.style.setProperty('--tg-top',(viewport?viewport.offsetTop:0)+'px');
    this.arenaWidth=this.arena.clientWidth;this.arenaHeight=this.arena.clientHeight;
    var plane=this.root.querySelector('.tg-plane');this.muzzleX=this.arenaWidth/2;this.muzzleY=plane.offsetTop+plane.clientHeight*.11;
    this.uiDirty=true;this.geometryDirty=true;
  };
  View.prototype.unlockAudio=function(){
    if(this.muted)return;
    try{var Audio=root.AudioContext||root.webkitAudioContext;if(!this.audio&&Audio){this.audio=new Audio();this.keyTone=this.toneBuffer(false);this.breakTone=this.toneBuffer(true);}if(this.audio&&this.audio.state==='suspended')this.audio.resume().catch(function(){});}catch(error){}
  };
  View.prototype.toneBuffer=function(destroy){
    var rate=this.audio.sampleRate,length=Math.round(rate*.09),buffer=this.audio.createBuffer(1,length,rate),data=buffer.getChannelData(0),phase=0;
    for(var i=0;i<length;i++){var p=i/(length-1),frequency=destroy?850-670*p:580+320*p;phase+=2*Math.PI*frequency/rate;data[i]=Math.sin(phase)*Math.pow(Math.sin(Math.PI*p),2)*Math.exp(-4*p)*.07;}
    return buffer;
  };
  View.prototype.tone=function(destroy){
    if(this.muted||!this.audio||this.audio.state!=='running')return;
    var source=this.audio.createBufferSource(),self=this;source.buffer=destroy?this.breakTone:this.keyTone;
    source.connect(this.audio.destination);this.activeSources.add(source);source.onended=function(){self.activeSources.delete(source);source.disconnect();};source.start();
  };
  View.prototype.makePool=function(className,size,text){
    var pool=[];for(var i=0;i<size;i++){var node=document.createElement('span');node.className=className;node.style.opacity='0';if(text)node.textContent=text;this.effects.appendChild(node);pool.push({node:node,animation:null,order:0});}return pool;
  };
  View.prototype.animateActor=function(pool,x,y,text,frames,options,shot){
    var actor=pool.find(function(item){return !item.animation;})||pool.reduce(function(a,b){return a.order<b.order?a:b;});
    if(actor.animation){this.animations.delete(actor.animation);actor.animation.onfinish=null;actor.animation.cancel();}
    var node=actor.node,self=this;node.style.left=x+'px';node.style.top=y+'px';if(text!==null)node.textContent=text;
    node.style.willChange='transform,opacity';actor.order=++this.shotSerial;
    if(shot){node.dataset.letter=String(shot.index);node.dataset.shot=String(actor.order);}
    var animation=node.animate(frames,options);actor.animation=animation;this.animations.add(animation);
    animation.onfinish=function(){self.animations.delete(animation);actor.animation=null;node.style.willChange='auto';};
  };
  View.prototype.pauseAnimations=function(){this.animations.forEach(function(animation){animation.pause();});};
  View.prototype.resumeAnimations=function(){this.animations.forEach(function(animation){animation.play();});};
  View.prototype.soundButton=function(){var b=this.root.querySelector('[data-game-action="sound"]');b.textContent=this.muted?'♪̸':'♪';b.setAttribute('aria-label',this.muted?'Bật âm':'Tắt âm');b.setAttribute('aria-pressed',String(this.muted));};
  View.prototype.click=function(event){
    event.stopPropagation();var buttonNode=event.target.closest('[data-game-action]');if(!buttonNode)return;
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
    event.stopPropagation();
    if(event.key==='Escape'){event.preventDefault();if(this.game.paused)this.resume();else this.pause();}
    if(event.key==='Tab'){
      var focusable=Array.from(this.root.querySelectorAll('button:not([disabled]),input:not([disabled])')).filter(function(n){return n.getClientRects().length;});
      var first=focusable[0],last=focusable[focusable.length-1],focused=this.shadow.activeElement;
      if(event.shiftKey&&focused===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&focused===last){event.preventDefault();first.focus();}
    }
  };
  View.prototype.visibility=function(){if(document.hidden)this.pause('Đã tạm dừng khi chuyển tab.');};
  View.prototype.pause=function(copy){
    if(this.game.paused||this.game.ended)return;this.game.paused=true;cancelAnimationFrame(this.frame);this.frame=0;
    this.input.disabled=true;this.root.classList.add('is-paused');this.pauseAnimations();if(this.audio)this.audio.suspend().catch(function(){});
    this.cover.hidden=false;this.cover.innerHTML='<div class="tg-dialog"><span class="games-eyebrow">NGHỈ MỘT NHỊP</span><h2>Tạm dừng</h2><p>'+esc(copy||'Thiên thạch và đồng hồ đang chờ bạn.')+'</p>'+button('Tiếp tục →','resume','class="games-primary"')+button('Đổi HSK / độ khó','choices')+button('Thoát','exit')+'</div>';this.cover.querySelector('button').focus();
  };
  View.prototype.resume=function(){
    if(!this.game.paused||this.game.ended||document.hidden)return;this.game.paused=false;this.last=0;this.cover.hidden=true;this.input.disabled=false;this.root.classList.remove('is-paused');this.resumeAnimations();this.unlockAudio();this.input.focus({preventScroll:true});this.loop();
  };
  View.prototype.type=function(){
    this.unlockAudio();this.game.type(this.input.value);if(this.input.value!==this.game.input)this.input.value=this.game.input;this.uiDirty=true;this.consume();this.render();
  };
  View.prototype.loop=function(){
    var self=this;
    if(!this.alive||this.game.paused||this.game.ended)return;
    this.frame=requestAnimationFrame(function(now){if(!self.alive)return;var dt=self.last?(now-self.last)/1000:0;self.last=now;self.game.step(dt);self.consume();self.render();self.loop();});
  };
  View.prototype.flash=function(text){this.feedback.textContent=text;this.feedbackUntil=this.game.time+2.5;};
  View.prototype.effect=function(kind,text,x,y){
    var burst=kind==='tg-burst';
    this.animateActor(burst?this.bursts:this.points,x,y,text,
      [{transform:burst?'translate(-50%,-50%) scale(.3)':'translate(-50%,0)',opacity:1},
       {transform:burst?'translate(-50%,-50%) scale(1.8) rotate(70deg)':'translate(-50%,-55px)',opacity:0}],
      {duration:burst?360:700,easing:'ease-out'},null);
  };
  View.prototype.consume=function(){
    var self=this,events=this.game.drain();if(events.length)this.uiDirty=true;
    events.forEach(function(event){var meteor=event.meteor;
      if(event.type==='shot'){
        self.tone(false);var tx=self.position(meteor),dx=tx.x-self.muzzleX,dy=tx.y-self.muzzleY;
        var launchAt=Math.max(self.game.time,self.nextShotAt||0);self.nextShotAt=launchAt+.08;
        var angle=(Math.atan2(dy,dx)*180/Math.PI+90)+'deg',rotate=' translate(-50%,-50%) rotate('+angle+')';
        self.animateActor(self.bullets,self.muzzleX,self.muzzleY,null,
          [{transform:'translate(0,0)'+rotate,opacity:1},{transform:'translate('+dx+'px,'+dy+'px)'+rotate,opacity:0}],
          {duration:480,delay:(launchAt-self.game.time)*1000,easing:'linear'},event);
      }
      if(event.type==='destroy'){
        self.tone(true);var p=self.position(meteor);self.retireMeteor(meteor);
        self.effect('tg-burst','✦',p.x,p.y);self.effect('tg-points','+'+event.points+(meteor.heart?' ♥':''),p.x,p.y-22);
        self.reward(meteor.word);if(self.input.value)self.input.value='';
      }
      if(event.type==='miss'){self.flash(meteor.word.hanzi+' · '+meteor.word.pinyin+' · '+meteor.word.meaning);self.input.value=self.game.input;}
      if(event.type==='end')self.end(event.reason);
    });
  };
  View.prototype.retireMeteor=function(meteor){
    var record=this.meteorNodes.get(meteor.id);if(!record)return;this.meteorNodes.delete(meteor.id);
    var p=this.position(meteor),transform=this.meteorTransform(p.y),node=record.node,self=this;
    this.cancelFlight(record);node.style.transform=transform;node.classList.remove('tg-meteor');node.classList.add('tg-meteor-break');
    var animation=node.animate([{transform:transform+' scale(1)',opacity:1},{transform:transform+' scale(1.18)',opacity:0}],{duration:160,easing:'ease-out'});
    this.animations.add(animation);animation.onfinish=function(){self.animations.delete(animation);node.remove();};
  };
  View.prototype.reward=function(word){
    // One RPC in flight per word in this round. All rounds/modes/learning share server dedupe + daily quota.
    var key=word.level+':'+word.hanzi;if(this.awards.has(key)||!root.VDuckieEXP)return;
    var self=this;this.pending++;
    var promise=root.VDuckieEXP.awardWordMastery(word.level,word.hanzi,this.scoreNode).then(function(row){
      if(row&&row.awarded)self.rewarded+=Number(row.exp_awarded)||0;
      if(row&&row.reason==='daily_cap')self.rewardNote='Đã đạt 50 từ thưởng hôm nay. Bạn vẫn chơi bình thường.';
      if(row&&row.reason==='not_authenticated')self.rewardNote='Đăng nhập để lưu EXP; điểm game vẫn được tính.';
      if(row&&row.reason==='error')self.rewardNote='Chưa xác nhận được EXP do kết nối. Điểm game vẫn được tính.';
    }).catch(function(){self.rewardNote='Chưa xác nhận được EXP do kết nối.';}).finally(function(){self.pending--;if(self.alive&&self.game.ended)self.rewardSummary();});
    this.awards.set(key,promise);
  };
  View.prototype.rewardSummary=function(){var node=this.cover.querySelector('[data-game-reward]');if(node)node.textContent=this.pending?'Đang xác nhận EXP…':('+'+this.rewarded+' EXP · '+(this.rewardNote||'Từ đã nhận thưởng không cộng lại.'));};
  View.prototype.end=function(reason){
    cancelAnimationFrame(this.frame);this.frame=0;this.input.disabled=true;this.input.blur();this.root.classList.add('is-paused');this.pauseAnimations();if(this.audio)this.audio.suspend().catch(function(){});
    var result=this.game.result(),missed=Array.from(new Map(result.missed.map(function(w){return [w.hanzi,w];})).values());
    this.cover.hidden=false;this.cover.innerHTML='<div class="tg-dialog tg-results"><span class="games-eyebrow">'+(reason==='time'?'HOÀN THÀNH 3 PHÚT':'HẾT TIM')+'</span><h2>Một chuyến bay đáng nhớ</h2><div class="tg-result-score">'+result.score+' <small>điểm</small></div><div class="tg-result-stats"><span><b>'+result.accuracy+'%</b>Chính xác</span><span><b>'+result.bestCombo+'</b>Combo tốt nhất</span><span><b>'+result.completed+'</b>Từ hoàn thành</span></div><p data-game-reward role="status"></p><h3>Từ bỏ lỡ · Ôn lại</h3><div class="tg-missed">'+(missed.length?missed.map(function(w){return '<div><b lang="zh">'+esc(w.hanzi)+'</b><span>'+esc(w.pinyin)+'</span><small>'+esc(w.meaning)+'</small></div>';}).join(''):'<p>Bạn không bỏ lỡ từ nào. Tiếp tục giữ nhịp nhé!</p>')+'</div><div class="tg-result-actions">'+button('Chơi lại →','restart','class="games-primary"')+button('Đổi HSK / độ khó','choices')+button('Về Trò chơi','exit')+'</div></div>';this.rewardSummary();this.cover.querySelector('button').focus();
  };
  View.prototype.position=function(m){return {x:this.arenaWidth*m.x,y:-44+(this.arenaHeight+44)*m.progress};};
  View.prototype.meteorTransform=function(y){return 'translate3d(-50%,'+y+'px,0) translateY(-50%)';};
  View.prototype.cancelFlight=function(record){
    if(!record.flight)return;this.animations.delete(record.flight);record.flight.cancel();record.flight=null;
  };
  View.prototype.flyMeteor=function(record,meteor){
    this.cancelFlight(record);
    var from=this.meteorTransform(this.position(meteor).y),to=this.meteorTransform(this.arenaHeight);
    // The compositor owns the entire fall. Typing, rewards and page JS cannot
    // interrupt it, and speed still follows the engine's 12/9/6 active seconds.
    record.node.style.transform=from;
    record.flight=record.node.animate([{transform:from},{transform:to}],{
      duration:Math.max(1,(1-meteor.progress)*this.game.mode.fall*1000),easing:'linear',fill:'forwards'
    });
    this.animations.add(record.flight);if(this.game.paused||this.game.ended)record.flight.pause();
  };
  View.prototype.render=function(){
    var game=this.game,target=game.target(),self=this;
    this.meteorNodes.forEach(function(record,id){if(!game.meteors.some(function(m){return m.id===id;})){self.cancelFlight(record);record.node.remove();self.meteorNodes.delete(id);}});
    game.meteors.forEach(function(m){
      var record=self.meteorNodes.get(m.id);
      if(!record){
        var node=document.createElement('div');node.className='tg-meteor';node.dataset.id=m.id;node.style.left=(m.x*100)+'%';
        node.innerHTML=(m.heart?'<span class="tg-heart-gift">♥</span>':'')+'<div class="tg-stone"></div><div class="tg-word"><strong lang="zh">'+esc(m.word.hanzi)+'</strong><span>'+Engine.glyphs(m.word.pinyin).map(function(g){return '<i>'+esc(g.char)+'</i>';}).join('')+'</span></div>';
        record={node:node,glyphs:Engine.glyphs(m.word.pinyin),letters:Array.from(node.querySelectorAll('.tg-word i')),length:Engine.normalize(m.word.pinyin).length,signature:null};
        self.meteorNodes.set(m.id,record);self.rocks.appendChild(node);self.uiDirty=true;self.flyMeteor(record,m);
      }
      else if(self.geometryDirty)self.flyMeteor(record,m);
    });
    this.geometryDirty=false;
    if(this.uiDirty){
      var prefix=game.input.length;
      this.meteorNodes.forEach(function(record,id){
        var active=!!target&&target.id===id,signature=(active?'1:':'0:')+prefix;
        if(signature===record.signature)return;record.signature=signature;
        record.node.classList.toggle('is-target',active);record.node.classList.toggle('is-cracked',active&&prefix>record.length*.5);
        record.glyphs.forEach(function(g,index){var correct=active&&g.end<=prefix&&g.end>g.start;if(record.letters[index].classList.contains('is-correct')!==correct)record.letters[index].classList.toggle('is-correct',correct);});
      });
      if(this.scoreNode.textContent!==String(game.score))this.scoreNode.textContent=game.score;
      if(this.heartsNode.textContent!=='♥'.repeat(game.lives)){this.heartsNode.textContent='♥'.repeat(game.lives);this.heartsNode.setAttribute('aria-label',game.lives+' tim');}
      var combo=game.combo>1?'COMBO '+game.combo+' · ×'+Math.min(5,1+Math.floor((game.combo-1)/5)):'';
      if(this.comboNode.textContent!==combo)this.comboNode.textContent=combo;
      if(this.mirror.textContent!==game.input)this.mirror.textContent=game.input;
      this.uiDirty=false;
    }
    var remaining=Math.ceil(180-game.time);if(this.lastSecond!==remaining){this.lastSecond=remaining;this.timeNode.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');}
    if(this.feedback.textContent&&this.feedbackUntil<game.time)this.feedback.textContent='';
  };
  View.prototype.dispose=function(){
    this.alive=false;cancelAnimationFrame(this.frame);this.frame=0;this.game.paused=true;
    document.removeEventListener('visibilitychange',this.onVisibility);root.removeEventListener('resize',this.onResize);
    if(root.visualViewport){root.visualViewport.removeEventListener('resize',this.onResize);root.visualViewport.removeEventListener('scroll',this.onResize);}
    this.animations.forEach(function(animation){animation.onfinish=null;animation.cancel();});this.animations.clear();this.meteorNodes.clear();
    this.activeSources.forEach(function(source){try{source.stop();}catch(error){}});this.activeSources.clear();
    if(this.audio&&this.audio.state!=='closed')this.audio.close().catch(function(){});this.audio=null;this.stage.remove();if(this.appShell)this.appShell.inert=false;document.body.classList.remove('typing-game-open');document.documentElement.classList.remove('typing-game-open');
    var back=host&&host.querySelector('button');if(back)back.focus({preventScroll:true});
  };
  root.VDuckieGames={open:open,leave:function(){loadId++;close();if(host)host.classList.add('hidden');}};
})(window,document);
