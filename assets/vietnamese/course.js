/* Vietnamese-for-Chinese learning runtime. Content is fetched one unit at a time. */
(function(root,document){'use strict';
if(root.VDuckieVICourse)return;
var Progress=root.VDuckieVIProgress,Audio=root.VDuckieVIAudio,host=document.getElementById('vietnameseScreen');
var catalog=null,cache={},store=null,active=false,loadId=0,current=null,tab='words',card=0,revealed=false,attempts={},questionIndex=0,mode='overview',reviewQueue=[],reviewIndex=0,reviewReveal=false,overviewRecordHash='';
var tabs={words:'词汇与发音',grammar:'规则与语法',dialogue:'情景对话',practice:'练习',quiz:'课末测验'};
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function b(label,action,extra){return '<button type="button" data-vi-action="'+action+'" '+(extra||'')+'>'+label+'</button>';}
function vi(text){return '<span lang="vi">'+esc(text)+'</span>';}
function shuffled(list){var out=list.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}return out;}
async function json(path){var response=await fetch(path);if(!response.ok)throw Error('课程加载失败，请检查网络后重试。');return response.json();}
function unit(id){if(!cache[id]){var meta=catalog.units.find(function(u){return u.id===id;});if(!meta)return Promise.reject(Error('找不到这节课。'));cache[id]=json('./data/vietnamese/'+meta.file+'?v=1').catch(function(e){delete cache[id];throw e;});}return cache[id];}
function snap(){return store.snapshot();}
function stats(){var records=snap().records,done=catalog.units.filter(function(u){return records[u.id]&&records[u.id].completed;}).length;return {done:done,known:Object.keys(records).filter(function(k){return k.includes('-w')&&records[k].known;}).length,due:store.due().length};}
function status(){if(!store)return;host.querySelectorAll('[data-vi-sync-status]').forEach(function(n){n.textContent=snap().status;});if(catalog){var s=stats();host.querySelectorAll('[data-vi-progress]').forEach(function(n){n.textContent=s.done+' / 14 单元 · '+s.known+' 个已学词';});}}
function shell(content){
 var s=stats(),position=store.get('position'),record=store.get(current?current.id:position.unit);
 host.innerHTML='<div class="vi-topline">'+b('← 返回课程','overview','class="vi-text-button"')+'<span>学越南语 · 零基础</span>'+b('学中文 →','chinese','class="vi-text-button"')+'</div><div class="vi-layout"><div class="vi-main">'+content+'</div><aside class="vi-side" aria-label="学习进度"><img src="./assets/mascot/duckie-reader-2d-v2.webp?v=2.0" width="112" height="112" alt="Duckie 陪你学越南语"><h2>每天一点，慢慢会说。</h2><p data-vi-progress>'+s.done+' / 14 单元 · '+s.known+' 个已学词</p><progress max="14" value="'+s.done+'" aria-label="课程完成进度">'+s.done+'/14</progress><p>已完成：'+s.done+' / 14</p>'+b('复习到期词（'+s.due+'）','review','class="vi-button"')+b('复习收藏词','bookmarks','class="vi-text-button"')+'<div class="vi-sync"><strong>'+(snap().account==='guest'?'游客模式':'已登录 · 共用账户')+'</strong><p data-vi-sync-status role="status" aria-live="polite"></p>'+(snap().account==='guest'?b('登录并同步','login','class="vi-button"'):b('重试同步','sync','class="vi-text-button"'))+'</div><p class="vi-small">本课程暂不计入 EXP 或排行榜。测验需作答后才显示结果。</p></aside></div>';
 status();
}
function focusAction(action){var node=host.querySelector('[data-vi-action="'+action+'"]:not([disabled])');if(node)node.focus({preventScroll:true});}
function scrollStart(){var center=document.querySelector('.study-center');if(center)center.scrollTop=0;host.scrollTop=0;root.scrollTo(0,0);}
function focusHeading(){var heading=host.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
function setURL(id,nextTab,push){var url=new URL(root.location.href);url.searchParams.set('screen','vietnamese');if(id){url.searchParams.set('viUnit',id);url.searchParams.set('viTab',nextTab||'words');}else{url.searchParams.delete('viUnit');url.searchParams.delete('viTab');}root.history[push?'pushState':'replaceState']({vduckieScreen:'vietnamese'},'',url.pathname+url.search+url.hash);}
function overview(push,quiet){mode='overview';current=null;Audio.stop();if(push)setURL(null,null,true);var s=stats(),pos=store.get('position'),next=catalog.units.find(function(u){return u.id===pos.unit&&!store.get(u.id).completed;})||catalog.units.find(function(u){return !store.get(u.id).completed;})||catalog.units[0];
 overviewRecordHash=Progress.stable(snap().records);
 shell('<header class="vi-hero"><span class="vi-eyebrow">你好，欢迎来到越南语。</span><h1>从第一声“xin chào”开始。</h1><p>先听清楚，再开口。用短句学会生活与工作里的交流。</p><div class="vi-hero-meta"><span>12 节实用课</span><span>2 个发音专题</span><span>168 个核心词／短语</span></div>'+b((s.done?'继续学习：':'开始学习：')+esc(next.title)+' →','unit','data-unit="'+next.id+'" data-resume="true" class="vi-primary"')+'</header><section class="vi-catalog" aria-labelledby="viPronTitle"><h2 id="viPronTitle">先把声音听清楚</h2>'+catalog.units.filter(function(u){return u.kind==='pronunciation';}).map(unitRow).join('')+'</section><section class="vi-catalog" aria-labelledby="viCourseTitle"><h2 id="viCourseTitle">一步步，开始交流</h2>'+catalog.units.filter(function(u){return u.kind==='lesson';}).map(unitRow).join('')+'</section>');if(!quiet){scrollStart();focusHeading();}
}
function unitRow(u){var r=store.get(u.id),n=u.id.slice(1);return '<article class="vi-unit-row"><span class="vi-unit-number">'+(u.kind==='pronunciation'?'音 '+n:n)+'</span><div><h3>'+esc(u.title)+'</h3><p>'+esc(u.goal)+'</p><small>'+u.wordCount+' '+(u.kind==='pronunciation'?'个示范音／词':'个重点词／短语')+' · 约 '+u.minutes+' 分钟'+(r.best?' · 最高 '+r.best+' 分':'')+'</small></div>'+b(r.completed?'复习 ✓':Object.keys(r.sections).length?'继续 →':'学习 →','unit','data-unit="'+u.id+'" data-resume="'+(!r.completed)+'" class="vi-button"')+'</article>';}
async function openUnit(id,nextTab,push){var token=++loadId;Audio.stop();mode='loading';shell('<p role="status">正在加载这节课…</p>');try{var loaded=await unit(id);if(token!==loadId||!active)return;current=loaded;mode='lesson';tab=Object.hasOwn(tabs,nextTab)?nextTab:'words';card=0;revealed=false;attempts={};questionIndex=0;store.change('position',function(p){p.unit=id;p.tab=tab;});setURL(id,tab,push);lesson();scrollStart();focusHeading();}catch(error){if(token===loadId&&active){shell('<h1>暂时无法打开这节课</h1><p role="status">'+esc(error.message)+'</p>'+b('重试','unit','data-unit="'+esc(id)+'" class="vi-primary"'));}}}
function speak(text,slow){Audio.play(current.id,text,slow,audioStatus);}
function audioStatus(message){var n=host.querySelector('[data-vi-audio-status]');if(n)n.textContent=message;}
function audioButtons(text){return '<span class="vi-audio-controls">'+b('▶ 朗读','speak','data-text="'+esc(text)+'" aria-label="朗读：'+esc(text)+'"')+b('慢速','slow','data-text="'+esc(text)+'" aria-label="慢速朗读：'+esc(text)+'"')+'</span>';}
function audioFooter(){return '<div class="vi-audio-note"><p role="status" aria-live="polite" data-vi-audio-status>点击朗读后播放。课程使用固定越南语合成语音；可慢速跟读。</p>'+b('录音不可用？尝试设备越南语语音','device','class="vi-text-button"')+'<p class="vi-small">设备语音的口音可能不同。这里只做听辨与跟读，不提供自动发音评分。</p></div>';}
function lesson(){if(!current)return;
 var r=store.get(current.id),allTabs=Object.keys(tabs);
 shell('<header class="vi-lesson-head"><span class="vi-eyebrow">'+(current.kind==='pronunciation'?'发音专题':'第 '+parseInt(current.id.slice(1),10)+' 课')+(r.completed?' · 已完成 ✓':'')+'</span><h1>'+esc(current.title)+'</h1><p>'+esc(current.goal)+'</p><p class="vi-title-vietnamese" lang="vi">'+esc(current.titleVi)+'</p></header><div class="vi-tabs" role="tablist" aria-label="课程步骤">'+allTabs.map(function(key){return '<button type="button" role="tab" id="vi-tab-'+key+'" aria-selected="'+(key===tab)+'" tabindex="'+(key===tab?'0':'-1')+'" aria-controls="viLessonPanel" data-vi-action="tab" data-tab="'+key+'">'+tabs[key]+((key==='quiz'?r.best>=80:r.sections[key])?' ✓':'')+'</button>';}).join('')+'</div><section id="viLessonPanel" role="tabpanel" aria-labelledby="vi-tab-'+tab+'"></section>');
 var panel=host.querySelector('#viLessonPanel');
 if(tab==='words')words(panel);else if(tab==='grammar')grammar(panel);else if(tab==='dialogue')dialogue(panel);else exercise(panel);
}
function markWordSeen(){var r=store.get(current.id),word=current.words[card];if(r.words[word.id])return;store.change(current.id,function(value){value.words[word.id]=true;if(Object.keys(value.words).length===current.words.length)value.sections.words=true;});}
function words(panel){
 var w=current.words[card],meta=store.get(w.id);markWordSeen();
 panel.innerHTML='<div class="vi-flash-head"><span>词汇 '+(card+1)+' / '+current.words.length+'</span>'+b(meta.bookmarked?'已加入复习 ✓':'加入复习','bookmark','class="vi-text-button" aria-pressed="'+meta.bookmarked+'"')+'</div><article class="vi-flash"><h2 lang="vi">'+esc(w.vi)+'</h2>'+audioButtons(w.vi)+(revealed?'<div class="vi-word-meaning"><h3>'+esc(w.zh)+'</h3><p lang="vi">'+esc(w.example)+'</p><p>'+esc(w.exampleZh)+'</p>'+audioButtons(w.example)+'</div>':b('查看词义与例句','reveal','class="vi-button"'))+'</article><div class="vi-flash-nav">'+b('← 上一个','prev-word','class="vi-button" '+(card===0?'disabled':''))+b('我学过这个词','known','class="vi-button"')+b(card===current.words.length-1?'继续：规则与语法 →':'下一个 →','next-word','class="vi-primary"')+'</div><details class="vi-word-index"><summary>选择词汇（'+current.words.length+'）</summary><div>'+current.words.map(function(w,i){return b(esc(w.vi),'word-index','data-index="'+i+'" aria-pressed="'+(i===card)+'"');}).join('')+'</div></details>'+audioFooter();
}
function markSection(section){store.change(current.id,function(r){r.sections[section]=true;});}
function nextTab(next){Audio.stop();tab=next;questionIndex=0;store.change('position',function(p){p.unit=current.id;p.tab=tab;});setURL(current.id,tab,false);lesson();scrollStart();host.querySelector('#vi-tab-'+tab).focus({preventScroll:true});}
function grammar(panel){var content='';
 if(current.alphabet)content+='<details class="vi-phonetics" open><summary>29 个字母：字母名与例词</summary><div class="vi-table-scroll"><table><thead><tr><th>字母</th><th>字母名（拼读）</th><th>例词</th></tr></thead><tbody>'+current.alphabet.map(function(x){return '<tr><td lang="vi">'+esc(x.letter)+'</td><td>'+vi(x.name)+audioButtons('Chữ '+x.name)+'</td><td>'+vi(x.sample)+audioButtons(x.sample)+'</td></tr>';}).join('')+'</tbody></table></div></details>';
 if(current.tones)content+='<div class="vi-table-scroll"><table><thead><tr><th>示范词</th><th>声调</th><th>听辨提示</th></tr></thead><tbody>'+current.tones.map(function(t){return '<tr><td>'+vi(t.vi)+audioButtons(t.vi)+'</td><td>'+esc(t.name)+'<br>'+esc(t.zh)+'</td><td>'+esc(t.note)+'</td></tr>';}).join('')+'</tbody></table></div>';
 panel.innerHTML=content+current.grammar.map(function(g){return '<article class="vi-explanation"><h2>'+esc(g.title)+'</h2><p>'+esc(g.body)+'</p><div class="vi-example">'+g.vi.split(';').map(function(t){return '<p lang="vi">'+esc(t.trim())+audioButtons(t.trim())+'</p>';}).join('')+'<p>'+esc(g.zh)+'</p></div></article>';}).join('')+b('已阅读，继续练习对话 →','grammar-done','class="vi-primary"')+audioFooter();
}
function dialogue(panel){panel.innerHTML='<h2>先听一句，再跟读一句</h2><p>先读越南语，需要时展开中文。可按自己的节奏重播。</p><div class="vi-dialogue">'+current.dialogue.map(function(d,i){return '<article class="vi-dialogue-line"><span class="vi-speaker">'+esc(d.speaker)+'</span><div><p lang="vi">'+esc(d.vi)+'</p>'+audioButtons(d.vi)+'<details><summary>中文意思</summary><p>'+esc(d.zh)+'</p></details></div></article>';}).join('')+'</div>'+b('已练习对话，继续做题 →','dialogue-done','class="vi-primary"')+audioFooter();}
function questions(){return current[tab==='quiz'?'quiz':'practice'];}
function attemptKey(){return current.id+':'+tab;}
function attempt(){var key=attemptKey();if(!attempts[key])attempts[key]={answers:{},draft:{},finished:false};return attempts[key];}
function questionState(){var a=attempt();if(!a.draft[questionIndex])a.draft[questionIndex]={selected:null,pairs:{},left:null,order:[],text:'',revealed:false,heard:false};return a.draft[questionIndex];}
function exercise(panel){var list=questions(),a=attempt();
 if(a.finished){result(panel);return;}
 var q=list[questionIndex],answer=a.answers[questionIndex],d=questionState(),body='';
 if(q.type==='choice'||q.type==='listen'){
  if(!d.options)d.options=shuffled(q.options.map(function(_,i){return i;}));
  if(q.type==='listen')body='<div class="vi-listen">'+b('▶ 播放录音','listen','class="vi-primary"')+b('慢速重播','listen-slow','class="vi-button"')+b('显示原文，改做阅读','listen-text','class="vi-text-button"')+((d.revealed||answer)?'<p lang="vi">'+esc(q.vi)+'</p><small>'+(d.revealed?'文字替代模式，不计为听力练习。':'作答后显示原文。')+'</small>':'')+'</div>';
  else if(q.vi)body='<h3 class="vi-question-word" lang="vi">'+esc(q.vi)+'</h3>';
  body+='<fieldset class="vi-options"><legend>请选择一个答案</legend>'+d.options.map(function(index){return '<label><input type="radio" name="vi-choice" value="'+index+'" '+(d.selected===index?'checked ':'')+(answer?'disabled':'')+'><span>'+esc(q.options[index])+'</span></label>';}).join('')+'</fieldset>';
 }else if(q.type==='fill')body='<p lang="vi" class="vi-question-word">'+esc(q.sentence)+'</p><p>'+esc(q.zh)+'</p><label class="vi-input-label">填写空缺部分<input type="text" data-vi-fill autocomplete="off" autocapitalize="off" spellcheck="false" lang="vi" value="'+esc(d.text)+'" '+(answer?'disabled':'')+'></label><p class="vi-small">请使用越南语输入法，保留字母符号与声调。</p>';
 else if(q.type==='order'){
  if(!d.pool)d.pool=shuffled(q.tokens.map(function(_,i){return i;}));
  body='<p>'+esc(q.zh)+'</p><div class="vi-order-answer" aria-label="已排列的句子">'+d.order.map(function(index,slot){return b(esc(q.tokens[index]),'order-remove','data-slot="'+slot+'" lang="vi" '+(answer?'disabled':''));}).join('')+'</div><div class="vi-order-pool">'+d.pool.map(function(index){return b(esc(q.tokens[index]),'order-add','data-token="'+index+'" lang="vi" '+(answer||d.order.includes(index)?'disabled':''));}).join('')+'</div>'+b('重新排列','order-clear','class="vi-text-button" '+(answer?'disabled':''));
 }else if(q.type==='match'){
  if(!d.right)d.right=shuffled(q.pairs.map(function(_,i){return i;}));
  body='<div class="vi-match"><div>'+q.pairs.map(function(p,i){return b(esc(p.vi)+(Object.hasOwn(d.pairs,i)?' → '+esc(q.pairs[d.pairs[i]].zh):''),'match-left','lang="vi" data-index="'+i+'" aria-pressed="'+(d.left===i)+'" '+(answer?'disabled':''));}).join('')+'</div><div>'+d.right.map(function(i){return b(esc(q.pairs[i].zh),'match-right','data-index="'+i+'" '+(answer?'disabled':''));}).join('')+'</div></div>'+b('清空配对','match-clear','class="vi-text-button" '+(answer?'disabled':''));
 }
 panel.innerHTML='<div class="vi-exercise-head"><span>'+(tab==='quiz'?'课末测验':'练习')+' '+(questionIndex+1)+' / '+list.length+'</span><span>最高成绩：'+store.get(current.id).best+' 分</span></div><h2>'+esc(q.prompt)+'</h2>'+(tab==='quiz'?'<p class="vi-small">离开测验后需重新作答；已取得的最高成绩会保留。</p>':'')+body+'<div class="vi-feedback" role="status" aria-live="polite">'+(answer?'<strong>'+(answer.correct?'答对了 ✓':'再巩固一下')+'</strong><p>'+esc(q.explanation)+'</p>'+(q.type==='match'?'<p>'+q.pairs.map(function(p){return esc(p.vi)+' = '+esc(p.zh);}).join('；')+'</p>':''):'')+'</div><div class="vi-exercise-actions">'+(answer?b(questionIndex===list.length-1?'查看结果 →':'下一题 →','next-question','class="vi-primary"'):b('检查答案','check','class="vi-primary"'))+'</div>'+audioFooter();
}
function normalized(text){return String(text||'').normalize('NFC').trim().toLocaleLowerCase('vi').replace(/[.!?,;:]+$/g,'').replace(/\s+/g,' ');}
function grade(q,d){if(q.type==='choice'||q.type==='listen')return d.selected===q.answer;if(q.type==='fill')return q.answers.some(function(a){return normalized(a)===normalized(d.text);});if(q.type==='order')return normalized(d.order.map(function(i){return q.tokens[i];}).join(' '))===normalized(q.answer);return q.pairs.every(function(_,i){return d.pairs[i]===i;});}
function check(){var list=questions(),q=list[questionIndex],a=attempt(),d=questionState();if(a.answers[questionIndex])return;
 var radio=host.querySelector('input[name="vi-choice"]:checked'),input=host.querySelector('[data-vi-fill]');if(radio)d.selected=Number(radio.value);if(input)d.text=input.value;
 if(((q.type==='choice'||q.type==='listen')&&d.selected===null)||(q.type==='fill'&&!d.text.trim())||(q.type==='order'&&d.order.length!==q.tokens.length)||(q.type==='match'&&Object.keys(d.pairs).length!==q.pairs.length)){host.querySelector('.vi-feedback').textContent='请先完成本题再提交。';return;}
 if(q.type==='listen'&&!d.heard&&!d.revealed){host.querySelector('.vi-feedback').textContent='请先播放录音；无法播放时可选择文字替代。';return;}
 var correct=grade(q,d);a.answers[questionIndex]={correct:correct,readingAlternative:q.type==='listen'&&d.revealed};
 if(!correct){var ids=q.type==='match'?q.pairs.filter(function(_,i){return d.pairs[i]!==i;}).map(function(p){return p.wordId;}):q.wordIds||[];ids.forEach(function(id){store.change(id,function(r){Object.assign(r,Progress.review(r,false,Date.now()));});});}
 exercise(host.querySelector('#viLessonPanel'));focusAction('next-question');
}
function finishExercise(){var a=attempt(),list=questions();if(Object.keys(a.answers).length!==list.length)return;
 a.finished=true;a.score=Math.round(Object.values(a.answers).filter(function(x){return x.correct;}).length/list.length*100);
 store.change(current.id,function(r){if(tab==='practice')r.sections.practice=true;else r.best=Math.max(r.best,a.score);});lesson();
}
function result(panel){var a=attempt(),r=store.get(current.id),all=Object.keys(tabs),missing=all.filter(function(t){return t==='quiz'?r.best<80:!r.sections[t];});
 panel.innerHTML='<article class="vi-result"><span class="vi-eyebrow">'+(tab==='quiz'?'测验结果':'练习完成')+'</span><h2>'+a.score+' / 100</h2><p>本次答对 '+Object.values(a.answers).filter(function(x){return x.correct;}).length+' / '+questions().length+' 题。</p><p>'+(r.completed?'本单元已完成 ✓':tab==='quiz'&&a.score<80?'达到 80 分才能通过。先看解释，再试一次。':'完成词汇、规则、对话与练习，并在测验达到 80 分后完成本单元。')+'</p>'+(missing.length?'<p>还需完成：'+missing.map(function(t){return b(tabs[t],'tab','data-tab="'+t+'" class="vi-text-button"');}).join('')+'</p>':'')+b('再练一次','retry-exercise','class="vi-button"')+' '+b(tab==='practice'?'开始课末测验 →':'返回课程目录 →',tab==='practice'?'quiz-start':'overview','class="vi-primary"')+'</article>';
}
async function review(bookmarks){var token=++loadId;Audio.stop();mode='loading';var records=snap().records,ids=bookmarks?Object.keys(records).filter(function(k){return k.includes('-w')&&records[k].bookmarked;}):store.due();shell('<p role="status">正在准备复习词汇…</p>');
 try{var units=await Promise.all(Array.from(new Set(ids.map(function(k){return k.split('-')[0];}))).map(unit));if(token!==loadId||!active)return;
 reviewQueue=ids.map(function(id){var u=units.find(function(u){return id.startsWith(u.id+'-');});var w=u&&u.words.find(function(w){return w.id===id;});return w?{word:w,unit:u}:null;}).filter(Boolean);reviewIndex=0;reviewReveal=false;mode='review';reviewCard();
 }catch(e){if(token===loadId&&active)shell('<h1>暂时无法加载复习</h1><p>'+esc(e.message)+'</p>'+b('重试','review','class="vi-primary"'));}
}
function reviewCard(){if(reviewIndex>=reviewQueue.length){shell('<header class="vi-hero"><h1>'+(!reviewQueue.length?'目前没有要复习的词。':'本轮复习完成。')+'</h1><p>收藏词可随时练习；答错词会在约 10 分钟后重现。答对后按 1、3、7、14、30 天安排复习。</p>'+b('返回课程','overview','class="vi-primary"')+'</header>');return;}
 var item=reviewQueue[reviewIndex];current=item.unit;var w=item.word;
 shell('<header class="vi-lesson-head"><span class="vi-eyebrow">间隔复习 '+(reviewIndex+1)+' / '+reviewQueue.length+'</span><h1>先回忆，再揭晓。</h1></header><article class="vi-flash"><h2 lang="vi">'+esc(w.vi)+'</h2>'+audioButtons(w.vi)+(reviewReveal?'<h3>'+esc(w.zh)+'</h3><p lang="vi">'+esc(w.example)+'</p><p>'+esc(w.exampleZh)+'</p>'+b('还没记住','review-wrong','class="vi-button"')+' '+b('记住了','review-correct','class="vi-primary"'):b('揭晓答案','review-reveal','class="vi-primary"'))+'</article>'+audioFooter());
}
function bind(){host.addEventListener('click',function(event){var target=event.target.closest('[data-vi-action]');if(!target||target.disabled)return;var action=target.dataset.viAction;
 if(action==='overview'){loadId++;overview(true);return;}
 if(action==='chinese'){root.VDuckieScreenRouter.navigate('home');return;}
 if(action==='unit'){var position=store.get('position'),resume=target.dataset.resume==='true'&&position.unit===target.dataset.unit;openUnit(target.dataset.unit,resume?position.tab:'words',true);return;}
 if(action==='review'||action==='bookmarks'){review(action==='bookmarks');return;}
 if(action==='login'){var login=document.getElementById('cloudLogin');if(login)login.click();return;}
 if(action==='sync'){store.sync();return;}
 if(action==='speak'||action==='slow'){speak(target.dataset.text,action==='slow');return;}
 if(action==='device'){var listening=mode==='lesson'&&['practice','quiz'].includes(tab)&&questions()[questionIndex].type==='listen';var word=mode==='review'&&reviewQueue[reviewIndex]?reviewQueue[reviewIndex].word:current&&current.words[card];if(listening){var draft=questionState();Audio.device(questions()[questionIndex].vi,false,audioStatus).then(function(ok){if(ok)draft.heard=true;});}else if(word)Audio.device(word.vi,false,audioStatus);return;}
 if(action==='review-reveal'){reviewReveal=true;reviewCard();focusAction('review-wrong');return;}
 if(action==='review-wrong'||action==='review-correct'){Audio.stop();var item=reviewQueue[reviewIndex];store.change(item.word.id,function(r){Object.assign(r,Progress.review(r,action==='review-correct',Date.now()));});reviewIndex++;reviewReveal=false;reviewCard();focusAction('review-reveal');return;}
 if(!current)return;
 if(action==='tab'){nextTab(target.dataset.tab);return;}
 if(action==='reveal'){revealed=true;words(host.querySelector('#viLessonPanel'));var meaning=host.querySelector('.vi-word-meaning');meaning.tabIndex=-1;meaning.focus({preventScroll:true});return;}
 if(action==='prev-word'||action==='next-word'||action==='word-index'){Audio.stop();if(action==='next-word'&&card===current.words.length-1){nextTab('grammar');return;}card=action==='word-index'?Number(target.dataset.index):card+(action==='next-word'?1:-1);revealed=false;words(host.querySelector('#viLessonPanel'));focusAction('next-word');return;}
 if(action==='bookmark'){store.change(current.words[card].id,function(r){r.bookmarked=!r.bookmarked;if(r.bookmarked&&!r.nextReview)r.nextReview=Date.now();});words(host.querySelector('#viLessonPanel'));focusAction('bookmark');return;}
 if(action==='known'){store.change(current.words[card].id,function(r){r.known=true;if(!r.nextReview)r.nextReview=Date.now()+86400000;});target.textContent='已记录 ✓';return;}
 if(action==='grammar-done'){markSection('grammar');nextTab('dialogue');return;}
 if(action==='dialogue-done'){markSection('dialogue');nextTab('practice');return;}
 if(action==='quiz-start'){nextTab('quiz');return;}
 if(action==='retry-exercise'){delete attempts[attemptKey()];questionIndex=0;exercise(host.querySelector('#viLessonPanel'));return;}
 if(action==='check'){check();return;}
 if(action==='next-question'){Audio.stop();if(questionIndex===questions().length-1)finishExercise();else {questionIndex++;exercise(host.querySelector('#viLessonPanel'));var panel=host.querySelector('#viLessonPanel');panel.tabIndex=-1;panel.focus({preventScroll:true});}return;}
 var d=questionState(),q=questions()[questionIndex];
 if(action==='listen'||action==='listen-slow'){Audio.play(current.id,q.vi,action==='listen-slow',audioStatus).then(function(ok){if(ok)d.heard=true;});return;}
 if(action==='listen-text'){d.revealed=true;exercise(host.querySelector('#viLessonPanel'));return;}
 if(action==='order-add')d.order.push(Number(target.dataset.token));
 if(action==='order-remove')d.order.splice(Number(target.dataset.slot),1);
 if(action==='order-clear')d.order=[];
 if(action==='match-left')d.left=Number(target.dataset.index);
 if(action==='match-right'){if(d.left===null){audioStatus('请先选择左侧的越南语词。');return;}var right=Number(target.dataset.index);Object.keys(d.pairs).forEach(function(k){if(d.pairs[k]===right)delete d.pairs[k];});d.pairs[d.left]=right;d.left=null;}
 if(action==='match-clear'){d.pairs={};d.left=null;}
 exercise(host.querySelector('#viLessonPanel'));
 if(action==='match-left')focusAction('match-right');else if(action.startsWith('match'))focusAction('match-left');else if(action.startsWith('order'))focusAction('order-add');
 });
 host.addEventListener('keydown',function(event){var button=event.target.closest('[role="tab"]');if(!button)return;var names=Object.keys(tabs),i=names.indexOf(button.dataset.tab);if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();var n=event.key==='Home'?0:event.key==='End'?names.length-1:(i+(event.key==='ArrowRight'?1:-1)+names.length)%names.length;nextTab(names[n]);}});
}
function identity(){return root.VDuckieCloud&&root.VDuckieCloud.vietnameseIdentity?root.VDuckieCloud.vietnameseIdentity().userId:'';}
function accountChanged(){if(!store)return;store.switchAccount(identity());attempts={};card=0;revealed=false;questionIndex=0;Audio.stop();if(active&&catalog){var params=new URLSearchParams(root.location.search);if(params.get('viUnit'))openUnit(params.get('viUnit'),params.get('viTab'),false);else overview(false);}}
async function open(){active=true;host.classList.remove('hidden');document.title='学越南语 — VDuckie';var token=++loadId;
 if(!store){store=Progress.create({storage:root.localStorage,cloud:{loadVietnameseProgress:function(){return root.VDuckieCloud.loadVietnameseProgress();},saveVietnameseRecords:function(r){return root.VDuckieCloud.saveVietnameseRecords(r);}},online:function(){return navigator.onLine;},onChange:function(info){status();if(active&&catalog&&mode==='overview'&&Progress.stable(info.records)!==overviewRecordHash)overview(false,true);}});store.switchAccount(identity());bind();document.addEventListener('vduckie:auth-state',accountChanged);root.addEventListener('online',function(){store.sync();});document.addEventListener('visibilitychange',function(){if(active&&document.visibilityState==='visible'&&navigator.onLine)store.sync();});root.addEventListener('storage',function(e){if(e.key==='vduckie-vietnamese-v1:'+snap().account)store.sync();});}else store.sync();
 try{if(Audio.prepare)Audio.prepare();if(!catalog)catalog=await json('./data/vietnamese/manifest.json?v=1');if(token!==loadId||!active)return;var p=new URLSearchParams(root.location.search),id=p.get('viUnit');if(id)openUnit(id,p.get('viTab'),false);else overview(false);}
 catch(error){if(active){host.innerHTML='<h1>暂时无法打开课程</h1><p>'+esc(error.message)+'</p>'+b('重试','reload','class="vi-primary"');host.querySelector('button').onclick=open;}}
}
root.VDuckieVICourse={open:open,leave:function(){active=false;loadId++;Audio.stop();},grade:grade,normalized:normalized};
})(window,document);
