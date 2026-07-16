(function(root){
  "use strict";
  if(!root.document||root.__v69ClipEngine)return;
  root.__v69ClipEngine=true;

  var NativeAudio=root.Audio;
  var AudioContextClass=root.AudioContext||root.webkitAudioContext;
  var context=null;
  var decoded={};
  var decoding={};
  var activeSource=null;
  var activeGain=null;

  var clips={
    good:{starts:[0.050,6.738254,10.853549,18.4006575,25.18822,31.0788325,42.97144,46.211451,49.9547055,57.4843425,63.325295,74.318322,80.6688435,86.732925,92.4571085,97.222415,103.661077,109.4592515,113.0911905,116.461644],lengths:[6.588254,4.015295,7.4471085,6.6875625,5.7906125,11.7926075,3.140011,3.6432545,7.429637,5.7409525,10.893027,6.2505215,5.9640815,5.6241835,4.6653065,6.338662,5.6981745,3.531939,3.2704535,5.767481]},
    medium:{starts:[0.050,5.015873,10.178946,20.6234355,26.431576,36.350839,46.451247,52.345873,58.5091835,61.725907,64.821712,68.9873925,71.2972335,76.430136,82.774456,88.7065415,94.7060205,100.763594,107.4748185,110.1979365],lengths:[4.865873,5.063073,10.3444895,5.7081405,9.819263,10.000408,5.794626,6.0633105,3.1167235,2.995805,4.0656805,2.209841,5.0329025,6.24432,5.8320855,5.899479,5.9575735,6.6112245,2.623118,2.8645015]},
    bad:{starts:[0.050,4.417007,9.446009,14.972109,27.244649,33.974603,39.017619,45.236621,51.966576,58.640544,64.14551,69.289501,75.775533,82.287528,88.129535,94.184535,100.267528,105.403526,111.64551,116.446531],lengths:[4.267007,4.929002,5.4261,12.17254,6.629954,4.943016,6.119002,6.629955,6.573968,5.404966,5.043991,6.386032,6.411995,5.742007,5.955,5.982993,5.035998,6.141984,4.701021,6.777532]}
  };

  function getContext(){
    if(!AudioContextClass)return null;
    if(!context)context=new AudioContextClass();
    return context;
  }
  function levelFromSource(src){
    var length=String(src||"").length;
    if(length<2550000)return "medium";
    if(length<2670000)return "good";
    return "bad";
  }
  function dataUriToBuffer(uri){
    var binary=atob(uri.slice(uri.indexOf(",")+1));
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return bytes.buffer;
  }
  function decode(level,src){
    if(decoded[level])return Promise.resolve(decoded[level]);
    if(decoding[level])return decoding[level];
    var ctx=getContext();
    if(!ctx)return Promise.reject(new Error("Trình duyệt không hỗ trợ Web Audio"));
    decoding[level]=ctx.decodeAudioData(dataUriToBuffer(src)).then(function(buffer){decoded[level]=buffer;return buffer;});
    return decoding[level];
  }
  function stopActive(){
    if(activeSource){try{activeSource.stop();}catch(error){}activeSource=null;}
    if(activeGain){try{activeGain.disconnect();}catch(error){}activeGain=null;}
  }

  function AdamAudio(src){
    var isAdam=typeof src==="string"&&src.indexOf("data:audio/mpeg;base64,")===0&&src.length>1000000;
    if(!isAdam)return new NativeAudio(src);
    var level=levelFromSource(src),selected=0,volume=1,metadata=[],ended=[],sourceNode=null;
    var proxy={};
    Object.defineProperties(proxy,{
      volume:{get:function(){return volume;},set:function(v){volume=Math.max(0,Math.min(1,Number(v)||0));if(activeGain)activeGain.gain.value=volume;}},
      paused:{get:function(){return true;}},
      currentTime:{get:function(){return selected;},set:function(v){var n=Number(v);selected=Number.isFinite(n)?Math.max(0,Math.min(19,Math.round(n))):0;}},
      duration:{get:function(){return clips[level].lengths[selected]||0;}},
      src:{get:function(){return src;}}
    });
    proxy.addEventListener=function(type,fn){if(typeof fn!=="function")return;if(type==="loadedmetadata")metadata.push(fn);else if(type==="ended")ended.push(fn);};
    proxy.removeEventListener=function(){};
    proxy.load=function(){root.setTimeout(function(){var list=metadata.slice();metadata=[];for(var i=0;i<list.length;i++)try{list[i].call(proxy,{type:"loadedmetadata",target:proxy});}catch(error){}},0);};
    proxy.pause=function(){if(sourceNode){try{sourceNode.stop();}catch(error){}sourceNode=null;}stopActive();};
    proxy.play=function(){
      var ctx=getContext();
      if(!ctx)return Promise.reject(new Error("Không có Web Audio"));
      return decode(level,src).then(function(buffer){
        stopActive();
        var cue=clips[level],start=cue.starts[selected]||0,length=Math.min(cue.lengths[selected]||3,Math.max(0.1,buffer.duration-start));
        sourceNode=ctx.createBufferSource();
        activeSource=sourceNode;
        activeGain=ctx.createGain();
        activeGain.gain.value=volume;
        sourceNode.buffer=buffer;
        sourceNode.connect(activeGain);
        activeGain.connect(ctx.destination);
        sourceNode.onended=function(){sourceNode=null;activeSource=null;for(var i=0;i<ended.length;i++)try{ended[i].call(proxy,{type:"ended",target:proxy});}catch(error){}};
        var startNow=function(){sourceNode.start(0,start,length);};
        if(ctx.state==="suspended")return ctx.resume().then(startNow);
        startNow();
      });
    };
    return proxy;
  }
  AdamAudio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(AdamAudio,NativeAudio);}catch(error){}
  root.Audio=AdamAudio;

  function normalized(v){return String(v||"").replace(/[\s，。！？、,.!?；;：:（）()【】\[\]"“”'‘’]/g,"");}
  function grammarComment(actual,expected){
    if(!actual)return {ok:false,text:"Xếp câu trước đã bro, để trống thì ngữ pháp cũng chịu thua."};
    if(actual===expected)return {ok:true,text:"Đúng trật tự. Qua câu, không cần nhét thêm roast cho loãng bài."};
    if(/[的得地]/.test(expected))return {ok:false,text:"Sai vị trí 的 / 得 / 地. Nhìn lại thành phần đứng trước và sau nó."};
    if(/[不没也都很再又就才只已经正在]/.test(expected))return {ok:false,text:"Phó từ đang đứng sai chỗ. Thường đặt sau chủ ngữ và trước động từ hoặc tính từ chính."};
    if(/[把被给让叫]/.test(expected))return {ok:false,text:"Cấu trúc đặc biệt bị đảo. Xác định chủ thể và đối tượng rồi đặt 把 / 被 cho đúng."};
    if(/[了过着]/.test(expected))return {ok:false,text:"Trợ từ đang đặt sai vị trí. Kiểm tra nó bổ nghĩa cho động từ hay đứng cuối câu."};
    return {ok:false,text:"Sai trật tự câu. Soát theo khung: chủ ngữ → thời gian → nơi chốn → phó từ → động từ → tân ngữ."};
  }
  function installGrammarGuard(){
    var traps=document.querySelectorAll("[data-v62-grammar-trap]");
    for(var i=0;i<traps.length;i++){
      var trap=traps[i];if(trap.__v69Guard)continue;trap.__v69Guard=true;
      trap.addEventListener("click",function(event){
        var button=event.target&&event.target.closest?event.target.closest("button"):null;if(!button)return;
        var label=String(button.textContent||"").toLowerCase();if(label.indexOf("chấm")<0&&label.indexOf("kiểm tra")<0)return;
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        var card=this.querySelector(".v62-grammar-card")||this;
        var expected=normalized(card.getAttribute("data-answer")||"");
        var answerNode=card.querySelector("[data-v62-order-answer]");
        var actual=normalized(answerNode&&answerNode.textContent||"");
        var result=grammarComment(actual,expected);
        var feedback=card.querySelector("[data-v69-grammar-feedback]");
        if(!feedback){feedback=document.createElement("div");feedback.setAttribute("data-v69-grammar-feedback","1");card.appendChild(feedback);}
        feedback.className="dialogue-feedback "+(result.ok?"good":"bad");feedback.textContent=result.text;
        if(!result.ok&&root.VDuckieRoast&&root.VDuckieRoast.isEnabled&&root.VDuckieRoast.isEnabled())root.VDuckieRoast.play("bad");
      },true);
    }
  }
  new MutationObserver(installGrammarGuard).observe(document.documentElement,{childList:true,subtree:true});
  installGrammarGuard();
})(typeof window!=="undefined"?window:this);