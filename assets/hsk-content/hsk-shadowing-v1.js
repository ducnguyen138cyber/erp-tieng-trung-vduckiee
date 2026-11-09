/* VDuckie Shadowing MVP: source-backed HSK1–3, local-only voice recordings. */
(function(root,document){
  "use strict";
  if(!root||!document)return;
  var key="vduckie-shadowing-v1",level=1,lines=[],index=0,recorder=null,chunks=[],recordUrl="",stream=null,startedAt=0,elapsed=null;
  var showPinyin=true,showVi=true,rate=0.85,token=0;
  function el(id){return document.getElementById(id);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function store(){try{return JSON.parse(root.localStorage.getItem(key)||"{}")||{};}catch(e){return {};}}
  function persist(){try{var data=store();data[level]={index:index,updatedAt:Date.now()};root.localStorage.setItem(key,JSON.stringify(data));}catch(e){}}
  function clearRecording(){
    if(recorder&&recorder.state==="recording")recorder.stop();
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
      root.fetch("./data/hsk/hsk1/sentences/hsk1-s-0001-0100.json").then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
        .then(function(json){return (json.records||[]).filter(function(r){return r.chinese&&r.pinyin&&r.vietnamese;}).slice(0,40).map(function(r){return {id:r.id,hanzi:r.chinese,pinyin:r.pinyin,vi:r.vietnamese};});}):
      root.fetch("./data/shadowing/hsk"+level+"-v1.json").then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
        .then(function(json){return (json.records||[]).filter(function(r){return r.hanzi&&r.pinyin&&r.vi;});});
    request.then(function(items){if(my!==token)return;lines=items;index=Math.min(Math.max(0,Number((store()[level]||{}).index)||0),Math.max(0,lines.length-1));render();})
      .catch(function(err){if(my!==token)return;n.innerHTML='<section class="shadow-page"><h2>Không tải được bài Shadowing</h2><p>'+esc(err.message)+'</p><button type="button" data-shadow-back>Trở lại</button></section>';});
  }
  function render(){
    var n=host();if(!n)return;var item=lines[index];
    n.className="panel daily-panel graded-hsk-screen hsk-shadow-screen";
    var tabs=[1,2,3].map(function(l){return '<button type="button" data-shadow-level="'+l+'" aria-pressed="'+(l===level)+'">HSK '+l+'</button>';}).join("");
    n.innerHTML='<section class="shadow-page"><header class="shadow-head"><div><small>VDUCKIE · TỰ LUYỆN NÓI</small><h2>Luyện nghe & Shadowing</h2><p>Nghe mẫu → nói theo → nghe lại giọng mình. Không chấm điểm phát âm.</p></div><button type="button" data-shadow-back>← Giáo trình HSK</button></header>'+
      '<div class="shadow-levels">'+tabs+'</div>'+
      (!item?'<p>Chưa có câu luyện phù hợp trong học liệu.</p>':
      '<div class="shadow-counter">Câu '+(index+1)+' / '+lines.length+'</div>'+
      '<article class="shadow-card"><div class="shadow-hanzi">'+esc(item.hanzi)+'</div>'+
      (showPinyin?'<p class="shadow-pinyin">'+esc(item.pinyin||"Chưa có Pinyin câu đầy đủ trong nguồn")+'</p>':"")+
      (showVi?'<p class="shadow-meaning">'+esc(item.vi||"Chưa có bản dịch Việt cho câu này")+'</p>':"")+
      '<div class="shadow-controls"><button type="button" data-shadow-play>🔊 Nghe mẫu</button><button type="button" data-shadow-rate>◷ '+rate+'×</button>'+
      '<button type="button" data-shadow-record>● Ghi âm</button><button type="button" data-shadow-stop>Dừng</button></div>'+
      '<audio id="shadowRecording" controls preload="none" aria-label="Nghe lại giọng mình"'+(recordUrl?' src="'+esc(recordUrl)+'"':'')+'></audio>'+
      '<div class="shadow-toggles"><button type="button" data-shadow-pinyin>'+(showPinyin?"Ẩn":"Hiện")+' Pinyin</button>'+
      '<button type="button" data-shadow-vi>'+(showVi?"Ẩn":"Hiện")+' nghĩa Việt</button><button type="button" data-shadow-clear>Xóa bản ghi</button></div>'+
      '<div class="shadow-nav"><button type="button" data-shadow-prev '+(index===0?"disabled":"")+'>← Câu trước</button>'+
      '<button type="button" data-shadow-next '+(index===lines.length-1?"disabled":"")+'>Câu tiếp →</button></div></article>')+
      '<p id="shadowStatus" role="status" aria-live="polite">Giọng mẫu dùng TTS của thiết bị, chưa phải ghi âm bản xứ. Bản ghi chỉ lưu tạm trên thiết bị.</p></section>';
  }
  function play(){
    if(!lines[index]||!root.speechSynthesis||!root.SpeechSynthesisUtterance){status("Không hỗ trợ phát tiếng Trung trên thiết bị này.");return;}
    var voices=root.speechSynthesis.getVoices?root.speechSynthesis.getVoices():[],zh=voices.find(function(v){return /^zh([_-]|$)/i.test(v.lang||"");});
    if(voices.length&&!zh){status("Chưa có giọng tiếng Trung trên thiết bị.");return;}
    stopSound();var u=new root.SpeechSynthesisUtterance(lines[index].hanzi);u.lang="zh-CN";u.rate=rate;if(zh)u.voice=zh;
    u.onerror=function(){status("Không phát được mẫu, hãy kiểm tra giọng đọc trên thiết bị.");};
    root.speechSynthesis.speak(u);status("Đang phát mẫu với tốc độ "+rate+"×.");
  }
  async function record(){
    if(!root.MediaRecorder||!root.navigator||!root.navigator.mediaDevices||!root.navigator.mediaDevices.getUserMedia){status("Trình duyệt này chưa hỗ trợ ghi âm.");return;}
    clearRecording();var expectedToken=token,expectedIndex=index;
    try{
      var acquired=await root.navigator.mediaDevices.getUserMedia({audio:true});
      if(expectedToken!==token||expectedIndex!==index){acquired.getTracks().forEach(function(t){t.stop();});return;}
      stream=acquired;
      recorder=new root.MediaRecorder(stream);chunks=[];var active=recorder;startedAt=Date.now();
      recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};
      recorder.onstop=function(){
        var data=chunks.slice();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
        if(data.length&&active===recorder){recordUrl=root.URL.createObjectURL(new root.Blob(data,{type:active.mimeType||"audio/webm"}));var a=el("shadowRecording");if(a)a.src=recordUrl;status("Đã ghi âm. Bấm ▶ để nghe lại giọng mình.");}
      };
      recorder.start();status("Đang ghi âm… Hãy nói theo câu mẫu.");
    }catch(e){if(expectedToken===token&&expectedIndex===index)status("Không thể sử dụng micro. Hãy kiểm tra quyền ghi âm.");}
  }
  function stopRecord(){if(recorder&&recorder.state==="recording")recorder.stop();else status("Chưa có bản ghi đang thực hiện.");}
  function next(delta){if(!lines.length)return;index=Math.max(0,Math.min(lines.length-1,index+delta));persist();stopSound();clearRecording();render();}
  document.addEventListener("click",function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest("button");if(!b)return;
    if(b.hasAttribute("data-shadow-open")){ev.preventDefault();open();return;}
    var n=host();if(!n||!n.contains(b)||!n.classList.contains("hsk-shadow-screen"))return;
    if(b.hasAttribute("data-shadow-back")){++token;stopSound();clearRecording();if(root.VDuckieGradedHSK)root.VDuckieGradedHSK.open();return;}
    if(b.hasAttribute("data-shadow-level")){load(Number(b.getAttribute("data-shadow-level")));return;}
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
  function open(l){load([1,2,3].includes(Number(l))?Number(l):1);}
  root.VDuckieShadowing=Object.freeze({open:open});
})(window,document);
