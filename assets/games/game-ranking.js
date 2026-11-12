/* Account-bound game results. No learning rewards, no requests during gameplay. */
(function(w,d){
  'use strict';
  var host,request=0,filters={game:'typing',level:'1',mode:'easy',prompt:'guided',topic:'basic',period:'week',pool:'all',pairs:'12',hint:'pinyin'};
  var labels={typing:'Luyện gõ',sentences:'Dịch câu Pinyin',matching:'Nối cặp Hán–Việt',all:'Tất cả từ',hsk1:'HSK 1',hsk2:'HSK 2',hsk3:'HSK 3',hsk4:'HSK 4',hsk5:'HSK 5',hsk6:'HSK 6',hsk79:'HSK 7–9',pinyin:'Có Pinyin','6':'6 cặp','8':'8 cặp','10':'10 cặp','12':'12 cặp',easy:'Dễ',medium:'Vừa',hard:'Khó',guided:'Hán tự + Pinyin',hanzi:'Chỉ chữ Hán',vietnamese:'Chỉ nghĩa Việt',basic:'Câu cơ bản',daily:'Giao tiếp mở rộng',factory:'Công xưởng'};
  function core(){return w.VDuckieEXPCore;}
  function uid(){var c=core(),s=c&&c.session();return s&&s.user&&s.user.id||null;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function number(n){return new Intl.NumberFormat('vi-VN').format(Number(n)||0);}
  function rpc(name,args){var c=core();if(!c||!c.client())return Promise.reject(new Error('unavailable'));return c.client().rpc(name,args).then(function(r){if(r.error)throw r.error;return r.data;});}
  function begin(game,category){
    filters.game=game;if(game==='typing'){var parts=category.split(':');filters.level=parts[0];filters.mode=parts[1];filters.prompt=parts[2];}else if(game==='matching'){var match=category.split(':');filters.pool=match[0];filters.pairs=match[1];filters.hint=match[2];}else filters.topic=category;
    var user=uid();if(!user)return Promise.resolve({guest:true});
    return rpc('start_game_run',{p_game:game,p_category:category}).then(function(data){return {id:data.run_id,user:user};}).catch(function(){return {failed:true,user:user};});
  }
  function submit(ticket,result,node){
    if(!node)return;
    function message(text,retry){if(!node.isConnected)return;node.textContent=text;if(retry){var b=d.createElement('button');b.type='button';b.textContent='Thử lưu lại';b.onclick=function(){submit(ticket,result,node);};node.appendChild(b);}}
    Promise.resolve(ticket).then(function(run){
      if(run.guest){message('Đăng nhập trước lượt chơi để lưu điểm lên BXH.');return;}
      if(!run.id){message('Lượt này chưa kết nối được BXH. Điểm vẫn hiện tại đây; hãy thử lượt mới khi có mạng.');return;}
      if(uid()!==run.user){message('Tài khoản đã thay đổi. Điểm lượt này không được gửi sang tài khoản khác.');return;}
      if(!result.completed){message('Hoàn thành ít nhất một từ hoặc câu để có điểm xếp hạng.');return;}
      message('Đang lưu điểm…');
      return rpc('submit_game_run',{p_run_id:run.id,p_result:result}).then(function(saved){if(uid()===run.user)message('Đã lưu '+number(saved.score)+' điểm. BXH giữ thành tích tốt nhất của bạn trong từng nhóm.');}).catch(function(){message('Chưa lưu được điểm. Bạn có thể thử lại lượt này.',true);});
    });
  }
  function category(){if(filters.game==='matching')return [filters.pool,filters.pairs,filters.hint].join(':');return filters.game==='typing'?[filters.level,filters.mode,filters.prompt].join(':'):filters.topic;}
  function select(key,title,values){return '<label>'+title+'<select data-game-filter="'+key+'">'+values.map(function(v){return '<option value="'+v+'"'+(filters[key]===v?' selected':'')+'>'+esc(labels[v]||('HSK '+v))+'</option>';}).join('')+'</select></label>';}
  function readFilters(){var p=new URLSearchParams(w.location.search);Object.keys(filters).forEach(function(k){var v=p.get('gr_'+k);if(v)filters[k]=v;});if(!['typing','sentences','matching'].includes(filters.game))filters.game='typing';if(!['1','2','3','4'].includes(filters.level))filters.level='1';if(!['easy','medium','hard'].includes(filters.mode))filters.mode='easy';if(!['guided','hanzi','vietnamese'].includes(filters.prompt))filters.prompt='guided';if(!['basic','daily','factory'].includes(filters.topic))filters.topic='basic';if(!['all','hsk1','hsk2','hsk3','hsk4','hsk5','hsk6','hsk79','factory'].includes(filters.pool))filters.pool='all';if(!['6','8','10','12'].includes(filters.pairs))filters.pairs='12';if(!['pinyin','hanzi'].includes(filters.hint))filters.hint='pinyin';if(!['week','total'].includes(filters.period))filters.period='week';}
  function url(){var u=new URL(w.location.href);Object.keys(filters).forEach(function(k){u.searchParams.set('gr_'+k,filters[k]);});w.history.replaceState(w.history.state,'',u.pathname+u.search+u.hash);}
  function shell(){
    host.innerHTML='<div class="gr-heading"><div><span class="games-eyebrow">VDUCKIE ARCADE / THÀNH TÍCH</span><h1>Bảng xếp hạng trò chơi</h1><p>So tài bằng điểm game. EXP học tập và Level được giữ riêng.</p></div><button type="button" data-daily-nav="games">← Trò chơi</button></div><div class="gr-filters">'+select('game','Trò chơi',['typing','sentences','matching'])+(filters.game==='matching'?select('pool','Kho từ',['all','hsk1','hsk2','hsk3','hsk4','hsk5','hsk6','hsk79','factory'])+select('pairs','Số cặp',['6','8','10','12'])+select('hint','Pinyin',['pinyin','hanzi']):filters.game==='typing'?select('level','Trình độ',['1','2','3','4'])+select('mode','Độ khó',['easy','medium','hard'])+select('prompt','Cách hiện từ',['guided','hanzi','vietnamese']):select('topic','Chủ đề',['basic','daily','factory']))+'<label>Thời gian<select data-game-filter="period"><option value="week"'+(filters.period==='week'?' selected':'')+'>Tuần này</option><option value="total"'+(filters.period==='total'?' selected':'')+'>Mọi thời gian</option></select></label></div><p class="gr-rules">Mỗi người một thành tích tốt nhất cho từng nhóm. Cùng điểm: ưu tiên độ chính xác, rồi thời điểm đạt sớm hơn. Tuần tính theo giờ Việt Nam.</p><div class="gr-content" aria-live="polite" aria-busy="true"><p role="status">Đang tải BXH…</p></div>';
  }
  function row(r){return '<li class="gr-row'+(r.is_me?' is-me':'')+'"><span class="gr-place">'+number(r.rank)+'</span><span class="gr-avatar" aria-hidden="true">'+esc(String(r.display_name||'?').trim().split(/\s+/).pop().charAt(0).toUpperCase())+'</span><span class="gr-person"><strong>'+esc(r.display_name||'Người chơi')+(r.is_me?' <small>(Bạn)</small>':'')+'</strong><small>'+number(r.accuracy)+'% chính xác · '+number(r.completed)+(filters.game==='matching'?' cặp':filters.game==='typing'?' từ':' câu')+'</small></span><span class="gr-score">'+number(r.score)+'<small> điểm</small></span></li>';}
  function refresh(){
    var id=++request,user=uid(),target=host.querySelector('.gr-content');
    target.setAttribute('aria-busy','true');
    rpc('get_game_leaderboard',{p_game:filters.game,p_category:category(),p_period:filters.period,p_limit:50}).then(function(data){
      if(id!==request||!host||!host.isConnected||uid()!==user)return;
      var rows=data.rows||[],mine=data.mine;
      target.innerHTML=(user?'<p class="gr-mine">'+(mine?'Hạng của bạn: <b>#'+number(mine.rank)+'</b> · '+number(mine.score)+' điểm':'Bạn chưa có điểm trong nhóm và thời gian này. Chơi một lượt để tham gia.')+'</p>':'<p class="gr-mine">Bạn vẫn chơi được khi chưa đăng nhập. Đăng nhập trước lượt chơi để lưu điểm.</p>')+(rows.length?'<ol class="gr-list">'+rows.map(row).join('')+'</ol>':'<div class="gr-empty"><span aria-hidden="true">🏆</span><h2>Vị trí đầu tiên đang chờ bạn</h2><p>Chưa có lượt chơi ghi điểm trong nhóm này.</p><button type="button" data-daily-nav="games">Chọn trò để chơi →</button></div>');
      target.setAttribute('aria-busy','false');
    }).catch(function(){if(id!==request||!host)return;target.innerHTML='<div class="gr-empty"><h2>Chưa tải được BXH</h2><p>Kiểm tra kết nối rồi thử lại.</p><button type="button" data-game-rank-retry>Thử lại</button></div>';target.setAttribute('aria-busy','false');});
  }
  function open(node){leave();host=node;readFilters();shell();host.addEventListener('change',change);host.addEventListener('click',click);d.title='BXH trò chơi — VDuckie';refresh();}
  function change(e){var key=e.target.getAttribute('data-game-filter');if(!key)return;filters[key]=e.target.value;url();shell();refresh();}
  function click(e){if(e.target.closest('[data-game-rank-retry]'))refresh();}
  function leave(){request++;if(host){host.removeEventListener('change',change);host.removeEventListener('click',click);}host=null;}
  function init(){if(core())core().onSession(function(){if(host){shell();refresh();}});}
  w.VDuckieGameRanking=Object.freeze({begin:begin,submit:submit,open:open,leave:leave,filters:function(){return Object.assign({},filters);}});
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
