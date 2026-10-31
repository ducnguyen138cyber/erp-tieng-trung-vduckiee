(function(root,document){
'use strict';
const D=root.VDuckieCurriculumContent,P=root.VDuckieCurriculumProgress;
const labels={overview:'Bắt đầu',vocabulary:'Từ vựng',grammar:'Ngữ pháp',context:'Nghe & đọc',practice:'Luyện tập',application:'Vận dụng'};
let host,lesson=null,section='overview',book='beginner-1',query='',filter='all',writingTimer=0,reviewQueue=[],reviewIndex=0,reviewAnswered=false,rewardsRunning=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,value='',cls='')=>'<button type="button" class="'+cls+'" data-cu="'+action+'" data-value="'+esc(value)+'">'+text+'</button>';
const snapshot=()=>root.VDuckieDailyLearning.getState().msutong;
const update=fn=>root.VDuckieDailyLearning.updateCurriculum(fn);
const progress=id=>snapshot().lessons?.[id]||{sections:{},answers:{}};
const bookLessons=id=>D.lessons.filter(l=>l.book===id);
const status=l=>snapshot().completed[l.id]?'done':Object.keys(progress(l.id).sections||{}).length||progress(l.id).updatedAt?'started':'new';
const percentage=l=>snapshot().completed[l.id]?100:Math.round(Object.keys(progress(l.id).sections||{}).filter(s=>P.sections.includes(s)).length/P.sections.length*100);
const line=v=>'<div class="cu-line"><strong lang="zh-Hans">'+esc(v.zh)+'</strong><span class="cu-pinyin" lang="zh-Latn">'+esc(v.py)+'</span><p>'+esc(v.vi)+'</p></div>';
const audio=(zh,label='Nghe mẫu')=>button('♪ '+label,'speak',zh,'cu-audio');
function speak(zh){if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){notice('Thiết bị chưa hỗ trợ đọc mẫu. Bạn vẫn có thể đọc theo pinyin.');return;}root.speechSynthesis.cancel();const u=new root.SpeechSynthesisUtterance(zh);u.lang='zh-CN';u.rate=.75;const voice=root.speechSynthesis.getVoices().find(v=>/^zh/.test(v.lang));if(voice)u.voice=voice;root.speechSynthesis.speak(u);}
function notice(text){const n=host?.querySelector('#cuStatus');if(n)n.textContent=text;}
function prepare(){
 host=document.getElementById('dailyLearningPanel');if(!host)return false;
 document.body.setAttribute('data-current-area','msutong');document.getElementById('leaderboard')?.classList.add('hidden');
 host.className='panel daily-panel cu-host';
 if(!host.__cuBound){host.addEventListener('click',click);host.addEventListener('input',input);host.addEventListener('change',change);host.__cuBound=true;}
 root.speechSynthesis?.cancel();return true;
}
function persistPosition(l,s){update(m=>{m.currentLesson=l.id;m.currentBook=l.book;const p=P.entry(m,l.id);p.section=s;p.updatedAt=Date.now();});}
function resumeFor(id){const m=snapshot(),list=bookLessons(id);return list.find(l=>l.id===m.currentLesson)||list.find(l=>!m.completed[l.id])||list[0];}
function renderCatalogue(){
 lesson=null;const b=D.books.find(b=>b.id===book)||D.books[0],list=bookLessons(b.id),done=list.filter(l=>snapshot().completed[l.id]).length,resume=resumeFor(b.id);
 host.innerHTML='<section class="cu-workspace" id="curriculumWorkspace"><header class="cu-catalogue-head"><div><span class="cu-eyebrow">HỌC TỪNG BƯỚC · DÙNG ĐƯỢC MỖI NGÀY</span><h1>Giáo trình tiếng Trung</h1><p>'+esc(b.title)+' <span aria-hidden="true">·</span> '+done+'/'+list.length+' bài hoàn thành</p></div>'+button('Tiếp tục học <span aria-hidden="true">→</span>','resume',resume.id,'cu-primary')+'</header><div class="cu-book-note">'+esc(b.description)+' <span>'+esc(b.note)+'</span></div><div class="cu-overall-progress" role="progressbar" aria-label="Tiến độ quyển đang chọn" aria-valuemin="0" aria-valuemax="'+list.length+'" aria-valuenow="'+done+'"><i style="width:'+done/list.length*100+'%"></i></div><div class="cu-toolbar"><label>Trình độ<select id="cuLevel"><option>Sơ cấp · 20 bài hiện có</option></select></label><label>Quyển học<select id="cuBook">'+D.books.map(x=>'<option value="'+x.id+'"'+(x.id===b.id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label><label class="cu-search">Tìm bài<input id="cuSearch" type="search" placeholder="Tên bài, từ vựng hoặc chủ đề…" value="'+esc(query)+'" autocomplete="off"></label></div><div class="cu-filterbar"><div role="group" aria-label="Trạng thái bài học">'+[['all','Tất cả'],['new','Chưa học'],['started','Đang học'],['done','Đã hoàn thành']].map(([v,t])=>'<button type="button" data-cu="filter" data-value="'+v+'" aria-pressed="'+(filter===v)+'">'+t+'</button>').join('')+'</div>'+button('↻ Ôn từ đến hạn <b>'+due().length+'</b>','review','','cu-quiet')+'</div><div id="cuResults" aria-live="polite"></div><footer class="cu-catalogue-foot">Nội dung tự học nguyên bản VDuckie · Nghe mẫu bằng giọng đọc thiết bị. Kho HSK 1–6 vẫn có ở menu bên trái.</footer><p id="cuStatus" class="cu-status" role="status"></p></section>';
 renderResults();root.scrollTo(0,0);
}
function fold(v){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();}
function renderResults(){
 const list=bookLessons(book).filter(l=>(filter==='all'||status(l)===filter)&&(!query||fold([l.title,l.zhTitle,l.goal,...l.words.flat()].join(' ')).includes(fold(query))));
 const result=host.querySelector('#cuResults');if(!result)return;
 result.innerHTML=list.length?D.chapters.filter(c=>c.book===book).map(c=>{const ls=list.filter(l=>l.chapter===c.id);if(!ls.length)return '';return '<section class="cu-chapter"><div class="cu-chapter-title"><div><h2>'+esc(c.title)+'</h2><p>'+esc(c.description)+'</p></div><span>'+ls.length+' bài</span></div><div class="cu-cards">'+ls.map(l=>{const s=status(l),pct=percentage(l),n=D.lessons.indexOf(l)%10+1;return '<button type="button" class="cu-lesson-card is-'+s+'" data-cu="lesson" data-value="'+l.id+'"><div class="cu-card-top"><span>BÀI '+String(n).padStart(2,'0')+'</span><b class="cu-tag">'+({new:'Chưa học',started:'Đang học',done:'✓ Hoàn thành'}[s])+'</b></div><h3>'+esc(l.title)+'</h3><span lang="zh-Hans" class="cu-card-zh">'+esc(l.zhTitle)+'</span><p>'+esc(l.goal)+'</p><div class="cu-card-topics">'+esc(l.grammar.map(g=>g[0]).join(' · '))+'</div><div class="cu-card-meta"><span>'+l.words.length+' từ · 8 bài tập</span><span>~'+l.duration+' phút</span></div><div class="cu-card-progress"><i style="width:'+pct+'%"></i></div><div class="cu-card-bottom"><span>'+pct+'% tiến độ</span><strong>'+(s==='done'?'Ôn lại bài':'Vào bài')+' →</strong></div></button>';}).join('')+'</div></section>';}).join(''):'<div class="cu-empty"><h2>Chưa có bài phù hợp</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc trạng thái.</p>'+button('Xóa bộ lọc','clear','','cu-primary')+'</div>';
}
function openLesson(id,resume=true){
 const l=D.lessons.find(x=>x.id===id);if(!l)return;lesson=l;book=l.book;section=resume?(progress(id).section||'overview'):'overview';if(!P.sections.includes(section))section='overview';persistPosition(l,section);
 host.innerHTML='<section class="cu-workspace cu-study" id="curriculumWorkspace"><header class="cu-lesson-head"><div>'+button('← Danh sách bài','catalogue','','cu-back')+'<p class="cu-eyebrow">'+esc(D.books.find(b=>b.id===l.book).title)+'</p><h1>'+esc(l.title)+'</h1><p>'+esc(l.goal)+'</p></div><div class="cu-study-tools">'+button('Ẩn pinyin','pinyin','','cu-quiet')+button('↻ Ôn từ','review','','cu-quiet')+'</div></header><div class="cu-study-grid"><nav class="cu-toc" aria-label="Mục lục bài học">'+P.sections.map((s,i)=>'<button type="button" data-cu="section" data-value="'+s+'"><span class="cu-toc-index">'+(i+1)+'</span><span>'+labels[s]+'</span><b data-section-done="'+s+'"></b></button>').join('')+'<p id="cuSectionProgress"></p></nav><div class="cu-study-main"><div id="cuLessonBody"></div><footer class="cu-section-nav" id="cuSectionNav"></footer><p id="cuStatus" class="cu-status" role="status"></p></div></div></section>';
 renderSection(false);root.scrollTo(0,0);
}
function renderSection(scroll=true){
 const l=lesson,p=progress(l.id),body=host.querySelector('#cuLessonBody');
 host.querySelectorAll('[data-cu="section"]').forEach(b=>{b.setAttribute('aria-current',b.dataset.value===section?'step':'false');b.querySelector('b').textContent=p.sections[b.dataset.value]?'✓':'';});
 host.querySelector('#cuSectionProgress').textContent=Object.keys(p.sections).length+'/6 mục đã học';
 if(section==='overview')body.innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">MỤC TIÊU BÀI HỌC</span><h2>Học xong, bạn làm được gì?</h2><ol class="cu-objectives">'+l.objectives.map((s,i)=>'<li><span>0'+(i+1)+'</span><p>'+esc(s)+'</p></li>').join('')+'</ol><div class="cu-callout"><h3>Một điểm phát âm cần chú ý</h3><p>'+esc(l.phonetics)+'</p>'+audio(l.words.map(w=>w[0]).join('，'),'Nghe từ trọng tâm')+'</div><div class="cu-how"><h3>Cách học bài này</h3><p>Học từ và mẫu câu → nghe, đọc → làm 8 câu → tự nói và viết. Đạt ít nhất 6/8 câu và xác nhận đủ 6 mục để hoàn thành. Bạn có thể rời bài và tiếp tục đúng mục đang học.</p><small>Giọng đọc tổng hợp hỗ trợ luyện nghe; phần nói và viết tự do dùng rubric tự đối chiếu, không chấm điểm tự động.</small></div></div>';
 if(section==='vocabulary')body.innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">NHẬN DIỆN → NGHE → DÙNG TRONG CÂU</span><h2>Từ vựng trong bài</h2><p>Đọc to trước khi nghe lại. Thêm từ khó vào lịch ôn để gặp lại đúng lúc.</p></div><div class="cu-vocabulary">'+l.words.map(w=>{const ex=l.dialogue.find(d=>d[1].includes(w[0]));return '<article class="cu-word"><div class="cu-word-head"><div><h3 lang="zh-Hans">'+esc(w[0])+'</h3><span class="cu-pinyin">'+esc(w[1])+'</span></div>'+audio(w[0],'Nghe')+'</div><p class="cu-word-meaning">'+esc(w[2])+'</p>'+(ex?'<div class="cu-word-example">'+line({zh:ex[1],py:ex[2],vi:ex[3]})+'</div>':'')+button(snapshot().review?.[w[0]]?'✓ Đã có trong lịch ôn':'+ Thêm vào lịch ôn','save-word',w[0],'cu-word-save')+'</article>';}).join('')+'</div>';
 if(section==='grammar')body.innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">HIỂU CẤU TRÚC, KHÔNG CHỈ NHỚ MẪU</span><h2>Ngữ pháp & cách dùng</h2></div>'+l.grammar.map((g,i)=>'<article class="cu-grammar"><span class="cu-eyebrow">MẪU 0'+(i+1)+'</span><h3>'+esc(g[0])+'</h3><p>'+esc(g[1])+'</p>'+line({zh:g[2],py:l.py[i],vi:g[3]})+audio(g[2],'Nghe ví dụ')+'</article>').join('')+'<div class="cu-callout cu-error-note"><h3>Lỗi dễ mắc</h3><p class="cu-incorrect" lang="zh-Hans">✗ '+esc(l.check[2])+'</p><p class="cu-correct" lang="zh-Hans">✓ '+esc(l.check[1])+'</p><p>'+esc(l.check[4])+'</p><p>'+esc(l.tip)+'</p></div>';
 if(section==='context')body.innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">NGHE TRƯỚC · ĐỌC THEO · ĐỔI THÔNG TIN</span><h2>Hội thoại & đọc hiểu</h2><p>Nghe từng lượt, nhắc lại rồi đổi tên, nơi chốn hoặc thông tin để thành câu của mình.</p></div><div class="cu-dialogue">'+l.dialogue.map(d=>'<article><span class="cu-speaker">'+d[0]+'</span>'+line({zh:d[1],py:d[2],vi:d[3]})+audio(d[1],'Nghe')+'</article>').join('')+'</div><article class="cu-reading"><span class="cu-eyebrow">ĐỌC NGẮN</span>'+line(l.reading)+audio(l.reading.zh,'Nghe đoạn đọc')+'<details><summary>Tự kiểm tra: '+esc(l.rq[0])+'</summary><p>'+esc(l.rq[1][l.rq[2]])+' · '+esc(l.rq[3])+'</p></details></article>';
 if(section==='practice')renderPractice();
 if(section==='application')body.innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">BIẾN KIẾN THỨC THÀNH CÂU CỦA BẠN</span><h2>Nói & viết để vận dụng</h2></div><div class="cu-application"><article><h3>01 · Nói trong 30–60 giây</h3><p>'+esc(l.speak)+'</p><ul><li>Nói đủ thông tin theo mục tiêu.</li><li>Dùng đúng ít nhất một mẫu câu của bài.</li><li>Nghe lại bản mẫu và tự sửa thanh điệu.</li></ul><label class="cu-check"><input id="cuSpoken" type="checkbox"'+(p.spoken?' checked':'')+'> Tôi đã nói và tự đối chiếu với mẫu.</label></article><article><h3>02 · Viết bằng chữ Hán</h3><p>'+esc(l.write)+'</p><label for="cuWriting">Bài viết của bạn</label><textarea id="cuWriting" rows="5" placeholder="Viết câu của bạn ở đây…">'+esc(p.writing||'')+'</textarea><small>Lưu trên thiết bị và đồng bộ theo tài khoản khi có kết nối. Cần ít nhất 6 chữ Hán để lưu phần thực hành.</small><details><summary>Xem một cách diễn đạt tham khảo</summary>'+line(l.application)+'</details><label class="cu-check"><input id="cuCheckedWriting" type="checkbox"'+(p.checkedWriting?' checked':'')+'> Tôi đã kiểm tra trật tự câu và cách dùng từ.</label></article></div><div class="cu-completion-summary">'+completionSummary()+'</div>';
 const index=P.sections.indexOf(section),qs=D.exercises(l),passed=P.score(p,qs)>=6&&qs.every(q=>p.answers[q.id]);
 host.querySelector('#cuSectionNav').innerHTML=button(index?'← Mục trước':'← Danh sách bài',index?'previous':'catalogue','','cu-quiet')+button(section==='application'?'Hoàn thành bài học':section==='practice'?(passed?'Đạt yêu cầu · Tiếp →':'Hoàn tất 8 câu để tiếp tục'):'Đã học mục này · Tiếp →','next','','cu-primary');
 if(section==='practice'&&!passed)host.querySelector('[data-cu="next"]').disabled=true;
 if(scroll){const center=document.querySelector('.study-center');if(center)center.scrollTop=0;body.scrollIntoView({block:'start',behavior:'auto'});}
}
function completionSummary(){const p=progress(lesson.id),qs=D.exercises(lesson),s=P.score(p,qs);return '<h3>Điều kiện hoàn thành</h3><p>'+Object.keys(p.sections).filter(k=>k!=='application').length+'/5 mục trước đã xác nhận · '+s+'/8 câu đúng (cần 6/8). Phần nói/viết do bạn tự đối chiếu, không được tính là điểm chấm tự động.</p>';}
function choices(q){let os=[...new Set(q.options)];const i=q.id.length%os.length;return os.slice(i).concat(os.slice(0,i));}
function questionMarkup(q,n){
 const a=progress(lesson.id).answers[q.id];
 let input='';
 if(q.type==='choice')input='<div class="cu-answers">'+choices(q).map(v=>'<button type="button" data-cu="answer" data-question="'+q.id+'" data-value="'+esc(v)+'"'+(a?' disabled':'')+' class="'+(a&&P.normalizeAnswer(v)===P.normalizeAnswer(q.answer)?'is-correct':a&&v===a.value?'is-wrong':'')+'">'+esc(v)+'</button>').join('')+'</div>';
 if(q.type==='input')input='<form data-question="'+q.id+'" class="cu-input-answer"><label for="cuAnswer-'+q.id+'">'+esc(q.hint)+'</label><input id="cuAnswer-'+q.id+'" autocomplete="off" aria-label="Đáp án chữ Hán" value="'+esc(a?.value||'')+'"'+(a?' disabled':'')+'>'+(!a?'<button type="submit" class="cu-primary">Kiểm tra</button>':'')+'</form>';
 if(q.type==='order')input='<div class="cu-order-tokens" aria-label="Các từ để sắp xếp">'+[...q.tokens].reverse().map(v=>'<span>'+esc(v)+'</span>').join('')+'</div><form data-question="'+q.id+'" class="cu-input-answer"><label for="cuAnswer-'+q.id+'">Gõ lại câu theo đúng trật tự (không bắt buộc dấu câu)</label><input id="cuAnswer-'+q.id+'" autocomplete="off" aria-label="Câu đã sắp xếp" value="'+esc(a?.value||'')+'"'+(a?' disabled':'')+'>'+(!a?'<button type="submit" class="cu-primary">Kiểm tra</button>':'')+'</form>';
 return '<article class="cu-question" id="cuQ-'+q.id+'"><span class="cu-eyebrow">CÂU '+(n+1)+' / 8 · '+esc(q.skill)+'</span><h3>'+esc(q.prompt)+'</h3>'+(q.context?line(q.context):'')+(q.audio?audio(q.audio,'Nghe câu')+'<details><summary>Hiện lời thoại để tự đối chiếu</summary>'+line(q.transcript)+'</details>':'')+input+'<div class="cu-feedback '+(a?(a.correct?'good':'bad'):'')+'" role="status">'+(a?'<strong>'+(a.correct?'Đúng rồi.':'Chưa đúng.')+'</strong> '+esc(q.why):'')+'</div></article>';
}
function renderPractice(){
 const qs=D.exercises(lesson),p=progress(lesson.id),answered=qs.filter(q=>p.answers[q.id]).length;
 host.querySelector('#cuLessonBody').innerHTML='<div class="cu-section-intro"><span class="cu-eyebrow">NHỚ → HIỂU → VẬN DỤNG</span><h2>Luyện tập có giải thích</h2><p>Gồm từ vựng, phát âm, trật tự câu, đọc và nghe. Mỗi câu chỉ được tính một lần trong lượt làm; quay lại bài không cộng thêm điểm.</p></div><div id="cuQuizSummary" class="cu-quiz-summary" aria-live="polite">'+answered+'/8 câu đã làm · '+P.score(p,qs)+'/8 câu đúng</div>'+qs.map(questionMarkup).join('')+(answered===8?button('Làm lại các câu sai','retry','','cu-quiet'):'');
 host.querySelectorAll('form[data-question]').forEach(form=>form.onsubmit=e=>{e.preventDefault();submitAnswer(form.dataset.question,form.querySelector('input').value);});
}
function submitAnswer(id,value){
 const q=D.exercises(lesson).find(q=>q.id===id);if(!q||!String(value).trim()||progress(lesson.id).answers[id])return;
 update(m=>{P.answer(m,lesson.id,q,value);});activity();
 const n=D.exercises(lesson).findIndex(x=>x.id===id),old=host.querySelector('#cuQ-'+id);if(old){old.outerHTML=questionMarkup(q,n);}
 const p=progress(lesson.id),qs=D.exercises(lesson),answered=qs.filter(q=>p.answers[q.id]).length,score=P.score(p,qs);
 host.querySelector('#cuQuizSummary').textContent=answered+'/8 câu đã làm · '+score+'/8 câu đúng';
 if(answered===8){if(score>=6)update(m=>{P.entry(m,lesson.id).sections.practice=Date.now();});renderSection(false);}
}
function rememberWord(word,immediate=false){
 update(m=>{m.review=m.review||{};if(!m.review[word[0]])m.review[word[0]]={word,lesson:lesson.id,nextReviewAt:Date.now()+(immediate?0:86400000),interval:0,updatedAt:Date.now()};});
}
function due(){return Object.entries(snapshot().review||{}).filter(([,v])=>v.word&&v.nextReviewAt<=Date.now()).sort((a,b)=>a[1].nextReviewAt-b[1].nextReviewAt);}
function openReview(){if(!prepare())return;lesson=null;reviewQueue=due();reviewIndex=0;renderReview();}
function renderReview(){
 reviewAnswered=false;const pair=reviewQueue[reviewIndex];
 if(!pair){host.innerHTML='<section class="cu-workspace cu-review-empty" id="curriculumWorkspace"><span class="cu-eyebrow">ÔN TẬP GIÃN CÁCH</span><h1>Đã ôn xong từ đến hạn</h1><p>Từ sẽ quay lại sau 1, 3 hoặc 7 ngày tùy kết quả. Sai thì gặp lại sớm hơn.</p>'+button('Về giáo trình','catalogue','','cu-primary')+button('Ôn từ ERP','erp-review','','cu-quiet')+'<p id="cuStatus" role="status"></p></section>';return;}
 const w=pair[1].word,options=[w[2],...new Set(D.lessons.flatMap(l=>l.words).filter(x=>x[2]!==w[2]).slice(0,5).map(x=>x[2]))].slice(0,4).reverse();
 host.innerHTML='<section class="cu-workspace cu-review" id="curriculumWorkspace">'+button('← Giáo trình','catalogue','','cu-back')+'<span class="cu-eyebrow">ÔN TỪ · '+(reviewIndex+1)+'/'+reviewQueue.length+'</span><h1 lang="zh-Hans">'+esc(w[0])+'</h1>'+audio(w[0],'Nghe từ')+'<p>Chọn nghĩa đúng trước khi xem lại pinyin.</p><div class="cu-answers">'+options.map(v=>button(esc(v),'review-answer',v)).join('')+'</div><p id="cuStatus" class="cu-status" role="status"></p><div id="cuReviewNext"></div></section>';
}
function reviewAnswer(value){
 if(reviewAnswered)return;reviewAnswered=true;activity();const [id,item]=reviewQueue[reviewIndex],correct=P.normalizeAnswer(value)===P.normalizeAnswer(item.word[2]),now=Date.now();
 update(m=>{const v=m.review[id];const previous=v.interval||0;v.nextReviewAt=now+(correct?[1,3,7][previous]*86400000:600000);v.interval=correct?Math.min(2,previous+1):0;v.updatedAt=now;v.lastReviewedAt=now;});
 try{const s=JSON.parse(localStorage.getItem('vduckie-review-srs-v1')||'{"words":{}}');s.words=s.words||{};const w=s.words[id]||{correctCount:0,wrongCount:0};w[correct?'correctCount':'wrongCount']=(w[correct?'correctCount':'wrongCount']||0)+1;w.lastReviewedAt=now;w.nextReviewAt=snapshot().review[id].nextReviewAt;s.words[id]=w;localStorage.setItem('vduckie-review-srs-v1',JSON.stringify(s));document.dispatchEvent(new CustomEvent('vduckie:retention-change',{detail:{key:'vduckie-review-srs-v1'}}));}catch(e){}
 host.querySelectorAll('[data-cu="review-answer"]').forEach(b=>{b.disabled=true;b.classList.toggle('is-correct',b.dataset.value===item.word[2]);});notice((correct?'Đúng. ':'Chưa đúng. ')+item.word.join(' · '));host.querySelector('#cuReviewNext').innerHTML=button('Từ tiếp theo →','review-next','','cu-primary');
}
function activity(){try{const v=JSON.parse(localStorage.getItem('vduckie-study-activity-v1')||'{"dates":{}}');v.dates=v.dates||{};const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');v.dates[k]=(v.dates[k]||0)+1;v.totalActions=(v.totalActions||0)+1;v.updatedAt=Date.now();localStorage.setItem('vduckie-study-activity-v1',JSON.stringify(v));document.dispatchEvent(new CustomEvent('vduckie:learning-change',{detail:{type:'curriculum'}}));}catch(e){}}
function saveWriting(){if(!lesson)return;const text=host.querySelector('#cuWriting')?.value;if(text!==undefined)update(m=>{P.entry(m,lesson.id).writing=text;});}
async function awardPending(){
 if(rewardsRunning||!root.VDuckieEXPCore?.session()?.user)return;rewardsRunning=true;
 try{for(const l of D.lessons){if(!progress(l.id).rewardPending)continue;const a=await root.VDuckieEXP.awardEXP('lesson_complete','hsk:curriculum_'+l.id+':lesson');const b=await root.VDuckieEXP.awardEXP('quiz_pass','hsk:curriculum_'+l.id+':quiz');if([a,b].every(r=>r.awarded||r.reason==='duplicate')){update(m=>{const p=P.entry(m,l.id);p.rewardPending=false;p.rewardStatus='synced';});notice('Đã đồng bộ kết quả và kiểm tra thưởng EXP.');}else notice('Bài đã lưu. EXP chưa đồng bộ; sẽ thử lại khi đăng nhập hoặc có mạng.');}}
 finally{rewardsRunning=false;}
}
function finish(){
 saveWriting();const p=progress(lesson.id);if(!p.spoken||!p.checkedWriting||(p.writing?.match(/[\u3400-\u9fff]/g)||[]).length<6){notice('Hãy viết ít nhất 6 chữ Hán và đánh dấu hai mục tự đối chiếu. Phần này không chấm nói/viết tự động.');return;}
 if(!P.sections.filter(s=>s!=='application').every(s=>p.sections[s])||P.score(p,D.exercises(lesson))<6){notice('Hãy xác nhận các mục trước và đạt ít nhất 6/8 câu.');return;}
 let done=false;update(m=>{P.entry(m,lesson.id).sections.application=Date.now();done=P.complete(m,lesson,D.exercises(lesson));if(done){const p=P.entry(m,lesson.id);if(p.rewardStatus!=='synced')p.rewardPending=true;}});
 if(!done){notice('Chưa đủ điều kiện: xác nhận các mục đã học và đạt ít nhất 6/8 câu luyện tập.');return;}
 lesson.words.forEach(w=>rememberWord(w));
 const l=lesson,score=P.score(progress(l.id),D.exercises(l)),list=bookLessons(l.book),next=list[list.indexOf(l)+1];
 host.querySelector('#cuLessonBody').innerHTML='<div class="cu-result"><span class="cu-result-check">✓</span><span class="cu-eyebrow">BÀI HỌC ĐÃ HOÀN THÀNH</span><h2>'+esc(l.title)+'</h2><p><strong>'+score+'/8 câu đúng</strong> · Đã xác nhận đủ 6 mục.</p><p>Từ trong bài đã có lịch ôn. Phần nói/viết đã được bạn tự đối chiếu.</p><div>'+button('Về danh sách bài','catalogue','','cu-quiet')+(next?button('Bài tiếp theo →','lesson',next.id,'cu-primary'):'')+'</div></div>';
 host.querySelector('#cuSectionNav').innerHTML='';
 notice(root.VDuckieEXPCore?.session()?.user?'Đang đồng bộ kết quả EXP…':'Đã lưu trên thiết bị. Đăng nhập Google để đồng bộ và nhận EXP.');awardPending();
}
function click(e){
 const b=e.target.closest('[data-cu]');if(!b||!host.contains(b)||b.disabled)return;const action=b.dataset.cu,v=b.dataset.value;
 if(action==='speak'){speak(v);return;}
 if(action==='pinyin'){const w=host.querySelector('#curriculumWorkspace'),hidden=w.classList.toggle('cu-hide-pinyin');b.textContent=hidden?'Hiện pinyin':'Ẩn pinyin';return;}
 if(action==='catalogue'){saveWriting();query='';filter='all';renderCatalogue();return;}
 if(action==='lesson'||action==='resume'){saveWriting();openLesson(v);return;}
 if(action==='section'){saveWriting();section=v;persistPosition(lesson,section);renderSection();return;}
 if(action==='filter'){filter=v;host.querySelectorAll('[data-cu="filter"]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));renderResults();return;}
 if(action==='clear'){query='';filter='all';renderCatalogue();return;}
 if(action==='review'){saveWriting();openReview();return;}
 if(action==='erp-review'){root.VDuckieDailyLearning.show('review-erp');return;}
 if(action==='review-answer'){reviewAnswer(v);return;}
 if(action==='review-next'){reviewIndex++;renderReview();return;}
 if(action==='answer'){submitAnswer(b.dataset.question,v);return;}
 if(action==='retry'){update(m=>{const p=P.entry(m,lesson.id);p.attempt=Date.now();p.answers={};delete p.sections.practice;});renderSection(false);return;}
 if(action==='save-word'){const w=lesson.words.find(w=>w[0]===v);if(w){rememberWord(w,true);b.textContent='✓ Đã thêm vào lịch ôn';notice('Từ đã được lưu. Bạn có thể ôn tại mục Ôn từ đến hạn.');}return;}
 if(action==='previous'){saveWriting();section=P.sections[Math.max(0,P.sections.indexOf(section)-1)];persistPosition(lesson,section);renderSection();return;}
 if(action==='next'){
  if(section==='application'){finish();return;}
  if(section==='practice'){const p=progress(lesson.id),qs=D.exercises(lesson);if(P.score(p,qs)<6||!qs.every(q=>p.answers[q.id]))return;}
  update(m=>{P.entry(m,lesson.id).sections[section]=Date.now();});activity();
  section=P.sections[P.sections.indexOf(section)+1];persistPosition(lesson,section);renderSection();
 }
}
function input(e){if(e.target.id==='cuSearch'){query=e.target.value;renderResults();}if(e.target.id==='cuWriting'){clearTimeout(writingTimer);writingTimer=setTimeout(saveWriting,300);}}
function change(e){if(e.target.id==='cuBook'){book=e.target.value;query='';filter='all';renderCatalogue();}if(lesson&&['cuSpoken','cuCheckedWriting'].includes(e.target.id)){const k=e.target.id==='cuSpoken'?'spoken':'checkedWriting';update(m=>P.entry(m,lesson.id)[k]=e.target.checked);}}
function open(){if(!prepare())return;book=snapshot().currentBook||'beginner-1';query='';filter='all';renderCatalogue();}
function init(){root.VDuckieEXPCore?.onSession(s=>{if(s?.user)awardPending();});root.addEventListener('online',awardPending);root.addEventListener('pagehide',saveWriting);}
root.VDuckieCurriculum=Object.freeze({open,openReview,hasDue:()=>due().length>0});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
