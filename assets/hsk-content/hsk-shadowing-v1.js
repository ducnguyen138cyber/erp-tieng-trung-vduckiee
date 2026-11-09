/* VDuckie Shadowing MVP: source-backed HSK1–3, local-only voice recordings. */
(function(root,document){
  "use strict";
  if(!root||!document)return;
  var key="vduckie-shadowing-v1",level=1,lines=[],index=0,recorder=null,chunks=[],recordUrl="",stream=null,startedAt=0,elapsed=null;
  var showPinyin=true,showVi=true,rate=0.85,token=0,group="all",mode="all",selectedId="",recordEpoch=0;
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function store(){try{return JSON.parse(root.localStorage.getItem(key)||"{}")||{};}catch(e){return {};}}
  function current(){var data=store(),entry=data[level];return entry&&typeof entry==="object"?entry:{};}
  function persist(){try{
    var data=store(),entry=current();
    data[level]=Object.assign({},entry,{index:index,id:selectedId,group:group,mode:mode,updatedAt:Date.now()});
    root.localStorage.setItem(key,JSON.stringify(data));
  }catch(e){}}
  function mark(kind,id){
    if(!id)return;
    try{var data=store(),entry=current(),saved=Object.assign({},entry[kind]||{});
      if(saved[id])delete saved[id];else saved[id]=true;
      data[level]=Object.assign({},entry,{[kind]:saved,updatedAt:Date.now()});
      root.localStorage.setItem(key,JSON.stringify(data));
    }catch(e){}
    var available=visible();
    if(!available.some(function(item){return item.id===selectedId;})){clearRecording();selectedId=available[0]?available[0].id:"";}
    index=Math.max(0,available.findIndex(function(item){return item.id===selectedId;}));
    render();
  }
  function visible(){
    var saved=current(),set=saved[mode]||{};
    return lines.filter(function(item){return (group==="all"||item.group===group)&&
       (mode==="all"||!!set[item.id]);});
  }
  function selection(){return visible()[index]||null;}
  function groups(){
    var found=new Map();lines.forEach(function(item){
      if(!found.has(item.group))found.set(item.group,{id:item.group,label:item.groupLabel||item.group,count:0});
      found.get(item.group).count++;
    });return [...found.values()];
  }
  function clearRecording(){
    recordEpoch++;
    if(recorder&&recorder.state==="recording"){recorder.onstop=null;recorder.stop();}
    recorder=null;chunks=[];
    if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
    if(recordUrl){root.URL.revokeObjectURL(recordUrl);recordUrl="";}
    if(el("shadowRecording"))el("shadowRecording").removeAttribute("src");
  }
  function stopSound(){if(root.speechSynthesis)root.speechSynthesis.cancel();}
  function host(){return el("dailyLearningPanel");}
  function status(message){var n=el("shadowStatus");if(n)n.textContent=message;}
  function splitScript(text,source){
    return String(text||"").split(/\n|(?<=[。！？!?])/).map(function(s){return s.trim();})
      .filter(function(s){return /[\u3400-\u9fff]/.test(s);})
      .map(function(s,i){return {id:source+"-"+i,hanzi:s.replace(/^[^：:]{1,12}[：:]/,"").trim(),pinyin:"",vi:"",source:source};})
      .filter(function(s){return s.hanzi.length>=2;});
  }
  function load(levelChoice){
    level=levelChoice;var my=++token;clearRecording();stopSound();
    var n=host();if(!n)return;
    n.className="panel daily-panel graded-hsk-screen hsk-shadow-screen";
    n.innerHTML='<section class="shadow-page"><h2>Luyện nghe & Shadowing · HSK '+level+'</h2><p>Đang tải bài luyện…</p></section>';
    var request=level===1?
      root.fetch("./data/hsk/hsk1/sentences/index.json")
        .then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
        .then(function(manifest){
          if(!manifest.shards||!manifest.shards.length)throw Error("Thiếu danh mục câu HSK1");
          return Promise.all(manifest.shards.map(function(shard){
            if(!/^[a-z0-9_-]+\.json$/i.test(shard.file))throw Error("Sai tên tệp học liệu");
            return root.fetch("./data/hsk/hsk1/sentences/"+shard.file)
              .then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
              .then(function(data){return data.records||[];});
          }));
        })
        .then(function(chunks){return chunks.flat().filter(function(r){
          return r.chinese&&r.pinyin&&r.vietnamese;
        }).map(function(r,i){var unit=Math.floor(i/25)+1;
          return {id:r.id,hanzi:r.chinese,pinyin:r.pinyin,vi:r.vietnamese,
            group:"unit-"+unit,groupLabel:"Nhóm "+unit+" · Câu "+((unit-1)*25+1)+"–"+(Math.min(unit*25,900)),
            sourceStatus:r.reviewStatus||"unreviewed"};
        });}):
      Promise.all([
        root.fetch("./data/shadowing/hsk"+level+"-v1.json"),
        root.fetch("./data/hsk/hsk"+level+"/lessons.json")
      ]).then(function(responses){return Promise.all(responses.map(function(r){
        if(!r.ok)throw Error("HTTP "+r.status);return r.json();
      }));}).then(function(parts){
        var lessonNames=new Map((parts[1].records||[]).map(function(lesson){
          return [lesson.id,lesson.titleVi||lesson.topic||lesson.id];
        }));
        var annotated=(parts[0].records||[]).filter(function(r){return r.hanzi&&r.pinyin&&r.vi;});
        var annotationIndex=new Map(annotated.map(function(r){return [r.sourceSectionId+"|"+r.hanzi,r];}));
        var source=(parts[1].records||[]).flatMap(function(lesson){
          return (lesson.sections||[]).filter(function(section){
            return section.type==="dialogue"&&section.content&&section.content.scriptZh;
          }).flatMap(function(section){
            return splitScript(section.content.scriptZh,section.id).map(function(line){
              return annotationIndex.get(section.id+"|"+line.hanzi)||
                Object.assign({},line,{sourceSectionId:section.id,reviewStatus:"unreviewed"});
            });
          });
        });
        var seen=new Set(),unique=[];
        annotated.concat(source).forEach(function(r){
          var identity=r.sourceSectionId+"|"+r.hanzi;
          if(seen.has(identity))return;seen.add(identity);
          unique.push(Object.assign({},r,{group:r.sourceSectionId,
            groupLabel:"Bài "+(Number((r.sourceSectionId||"").match(/lesson-(\d+)/)?.[1])||1)+
              " · "+(lessonNames.get(String(r.sourceSectionId||"").replace(/-dialogue$/,""))||"Hội thoại"),sourceStatus:r.reviewStatus||"unreviewed"}));
        });
        return unique;
      });
    request.then(function(items){if(my!==token)return;
      lines=items;var saved=current();
      group=saved.group&&items.some(function(item){return item.group===saved.group;})?saved.group:"all";
      mode=["all","starred","weak"].includes(saved.mode)?saved.mode:"all";
      var options=visible();
      index=options.findIndex(function(item){return item.id===saved.id;});
      if(index<0)index=Math.max(0,Math.min(Number(saved.index)||0,options.length-1));
      selectedId=options[index]?options[index].id:"";persist();render();
    })
      .catch(function(err){if(my!==token)return;n.innerHTML='<section class="shadow-page"><h2>Không tải được bài Shadowing</h2><p>'+esc(err.message)+'</p><button type="button" data-shadow-back>Trở lại</button></section>';});
  }
  function render(){
    var n=host();if(!n)return;
    var options=visible(),item=options[index]||null,total=lines.length,meta=current();
    n.className="panel daily-panel graded-hsk-screen hsk-shadow-screen";
    var tabs=[1,2,3].map(function(l){return '<button type="button" data-shadow-level="'+l+
      '" aria-pressed="'+(l===level)+'">HSK '+l+'</button>';}).join("");
    var allGroups=groups(),selector='<label for="shadowGroup">Chọn bài / nhóm câu</label>'+
      '<select id="shadowGroup" aria-label="Chọn bài hoặc nhóm câu"><option value="all">Tất cả bài ('+total+' câu)</option>'+
      allGroups.map(function(g){return '<option value="'+esc(g.id)+'"'+(group===g.id?' selected':'')+'>'+
        esc(g.label)+' · '+g.count+' câu</option>';}).join("")+'</select>';
    var counts={starred:Object.keys(meta.starred||{}).filter(function(id){return !!meta.starred[id]&&lines.some(function(q){return q.id===id;});}).length,
      weak:Object.keys(meta.weak||{}).filter(function(id){return !!meta.weak[id]&&lines.some(function(q){return q.id===id;});}).length};
    var filters='<div class="shadow-filters" role="group" aria-label="Bộ lọc luyện tập">'+
      [["all","Tất cả",total],["starred","Đã lưu",counts.starred],["weak","Cần luyện lại",counts.weak]]
        .map(function(row){return '<button type="button" data-shadow-mode="'+row[0]+'" aria-pressed="'+(mode===row[0])+'">'+
          row[1]+' <span>'+row[2]+'</span></button>';}).join("")+'</div>';
    var card=!item?'<div class="shadow-empty"><h3>Không có câu trong bộ lọc này</h3>'+
       '<p>Chọn “Tất cả” hoặc lưu câu cần luyện lại để thấy chúng tại đây.</p>'+
       '<button type="button" data-shadow-mode="all">Xem tất cả</button></div>':
      '<div class="shadow-counter">Câu '+(index+1)+' / '+options.length+' · HSK '+level+
        ' · '+esc(item.groupLabel||"Luyện câu")+'</div>'+
      '<article class="shadow-card"><div class="shadow-hanzi">'+esc(item.hanzi)+'</div>'+
      (showPinyin?'<p class="shadow-pinyin">'+esc(item.pinyin||"Pinyin đang bổ sung cho câu này")+'</p>':"")+
      (showVi?'<p class="shadow-meaning">'+esc(item.vi||"Nghĩa tiếng Việt đang bổ sung")+'</p>':"")+
      '<div class="shadow-save-actions">'+
      '<button type="button" data-shadow-star aria-pressed="'+!!(meta.starred||{})[item.id]+'">'+
         ((meta.starred||{})[item.id]?'★ Đã lưu':'☆ Lưu câu')+'</button>'+
      '<button type="button" data-shadow-weak aria-pressed="'+!!(meta.weak||{})[item.id]+'">'+
         ((meta.weak||{})[item.id]?'✓ Đã đánh dấu cần ôn':'↻ Cần luyện lại')+'</button></div>'+
      '<div class="shadow-controls"><button type="button" data-shadow-play>🔊 Nghe mẫu</button>'+
      '<button type="button" data-shadow-rate>◷ '+rate+'×</button>'+
      '<button type="button" data-shadow-record>● Ghi âm</button>'+
      '<button type="button" data-shadow-stop>Dừng</button></div>'+
      '<audio id="shadowRecording" controls preload="none" aria-label="Nghe lại giọng mình"'+
        (recordUrl?' src="'+esc(recordUrl)+'"':'')+'></audio>'+
      '<div class="shadow-toggles"><button type="button" data-shadow-pinyin>'+(showPinyin?"Ẩn":"Hiện")+
      ' Pinyin</button><button type="button" data-shadow-vi>'+(showVi?"Ẩn":"Hiện")+
      ' nghĩa Việt</button><button type="button" data-shadow-clear>Xóa bản ghi</button></div>'+
      '<div class="shadow-nav"><button type="button" data-shadow-prev '+(index===0?"disabled":"")+
      '>← Câu trước</button><button type="button" data-shadow-next '+(index===options.length-1?"disabled":"")+
      '>Câu tiếp →</button></div></article>';
    n.innerHTML='<section class="shadow-page"><header class="shadow-head"><div>'+
      '<small>VDUCKIE · LUYỆN NGHE & NÓI</small><h2>Shadowing HSK1–3</h2>'+
      '<p>Nghe → nói theo → ghi âm → nghe lại. Không chấm phát âm hoặc cộng EXP.</p></div>'+
      '<button type="button" data-shadow-back>← Giáo trình HSK</button></header>'+
      '<div class="shadow-levels">'+tabs+'</div>'+
      '<div class="shadow-library">'+selector+filters+'</div>'+card+
      '<p id="shadowStatus" role="status" aria-live="polite">'+
      'Giọng mẫu dùng TTS thiết bị. Bản ghi chỉ lưu tạm trong phiên; dấu sao và câu cần ôn lưu trên trình duyệt.'+
      (level>1?' Pinyin và bản dịch bổ sung chưa được giáo viên duyệt.':'')+'</p></section>';
  }
  function choose(nextGroup,nextMode){
    if(nextGroup!==null)group=nextGroup;
    if(nextMode!==null)mode=nextMode;
    var candidates=visible();index=0;selectedId=candidates[0]?candidates[0].id:"";
    stopSound();clearRecording();persist();render();
  }
  function play(){
    if(!selection()||!root.speechSynthesis||!root.SpeechSynthesisUtterance){status("Không hỗ trợ phát tiếng Trung trên thiết bị này.");return;}
    var voices=root.speechSynthesis.getVoices?root.speechSynthesis.getVoices():[],zh=voices.find(function(v){return /^zh([_-]|$)/i.test(v.lang||"");});
    if(voices.length&&!zh){status("Chưa có giọng tiếng Trung trên thiết bị.");return;}
    stopSound();var u=new root.SpeechSynthesisUtterance(selection().hanzi);u.lang="zh-CN";u.rate=rate;if(zh)u.voice=zh;
    u.onerror=function(){status("Không phát được mẫu, hãy kiểm tra giọng đọc trên thiết bị.");};
    root.speechSynthesis.speak(u);status("Đang phát mẫu với tốc độ "+rate+"×.");
  }
  async function record(){
    if(!root.MediaRecorder||!root.navigator||!root.navigator.mediaDevices||!root.navigator.mediaDevices.getUserMedia){status("Trình duyệt này chưa hỗ trợ ghi âm.");return;}
    clearRecording();var expectedToken=token,expectedId=selectedId,expectedEpoch=recordEpoch;
    try{
      var acquired=await root.navigator.mediaDevices.getUserMedia({audio:true});
      if(expectedToken!==token||expectedId!==selectedId||expectedEpoch!==recordEpoch){acquired.getTracks().forEach(function(t){t.stop();});return;}
      stream=acquired;
      recorder=new root.MediaRecorder(stream);chunks=[];var active=recorder;startedAt=Date.now();
      recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
      recorder.onstop=function(){
        var data=chunks.slice();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
        if(data.length&&active===recorder){recordUrl=root.URL.createObjectURL(new root.Blob(data,{type:active.mimeType||"audio/webm"}));var a=el("shadowRecording");if(a)a.src=recordUrl;status("Đã ghi âm. Bấm ▶ để nghe lại giọng mình.");}
      };
      recorder.start();status("Đang ghi âm… Hãy nói theo câu mẫu.");
    }catch(e){if(expectedToken===token&&expectedId===selectedId&&expectedEpoch===recordEpoch)status("Không thể sử dụng micro. Hãy kiểm tra quyền ghi âm.");}
  }
  function stopRecord(){if(recorder&&recorder.state==="recording")recorder.stop();else status("Chưa có bản ghi đang thực hiện.");}
  function next(delta){var items=visible();if(!items.length)return;index=Math.max(0,Math.min(items.length-1,index+delta));selectedId=items[index].id;persist();stopSound();clearRecording();render();}
  document.addEventListener("click",function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest("button");if(!b)return;
    if(b.hasAttribute("data-shadow-open")){ev.preventDefault();open();return;}
    var n=host();if(!n||!n.contains(b)||!n.classList.contains("hsk-shadow-screen"))return;
    if(b.hasAttribute("data-shadow-back")){++token;stopSound();clearRecording();if(root.VDuckieGradedHSK)root.VDuckieGradedHSK.open();return;}
    if(b.hasAttribute("data-shadow-level")){load(Number(b.getAttribute("data-shadow-level")));return;}
    if(b.hasAttribute("data-shadow-mode")){choose(null,b.getAttribute("data-shadow-mode"));return;}
    if(b.hasAttribute("data-shadow-star")){mark("starred",selectedId);return;}
    if(b.hasAttribute("data-shadow-weak")){mark("weak",selectedId);return;}
    if(b.hasAttribute("data-shadow-play")){play();return;}
    if(b.hasAttribute("data-shadow-rate")){rate=rate===0.85?0.7:rate===0.7?1:0.85;render();return;}
    if(b.hasAttribute("data-shadow-record")){record();return;}
    if(b.hasAttribute("data-shadow-stop")){stopRecord();return;}
    if(b.hasAttribute("data-shadow-clear")){clearRecording();status("Đã xóa bản ghi khỏi phiên học.");return;}
    if(b.hasAttribute("data-shadow-pinyin")){showPinyin=!showPinyin;render();return;}
    if(b.hasAttribute("data-shadow-vi")){showVi=!showVi;render();return;}
    if(b.hasAttribute("data-shadow-prev")){next(-1);return;}
    if(b.hasAttribute("data-shadow-next")){next(1);}
  });
  document.addEventListener("change",function(ev){
    if(!ev.target||ev.target.id!=="shadowGroup")return;
    var n=host();if(!n||!n.classList.contains("hsk-shadow-screen"))return;
    choose(ev.target.value,null);
  });
  function open(l){load([1,2,3].includes(Number(l))?Number(l):1);}
  root.VDuckieShadowing=Object.freeze({open:open});
})(window,document);
