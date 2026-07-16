(function(root){
  "use strict";
  if(!root.document||root.__v67AdamWebAudioFix)return;
  root.__v67AdamWebAudioFix=true;

  var NativeAudio=root.Audio;
  var nativeSetTimeout=root.setTimeout.bind(root);
  var AudioContextClass=root.AudioContext||root.webkitAudioContext;
  if(!AudioContextClass)return;

  var context=null;
  var decoded={};
  var decoding={};
  var pendingStopDelay=0;

  var segments={
    good:{
      starts:[0.050,6.738254,10.853549,18.4006575,25.18822,31.0788325,42.97144,46.211451,49.9547055,57.4843425,63.325295,74.318322,80.6688435,86.732925,92.4571085,97.222415,103.661077,109.4592515,113.0911905,116.461644],
      lengths:[6.588254,4.015295,7.4471085,6.6875625,5.7906125,11.7926075,3.140011,3.6432545,7.429637,5.7409525,10.893027,6.2505215,5.9640815,5.6241835,4.6653065,6.338662,5.6981745,3.531939,3.2704535,5.767481]
    },
    medium:{
      starts:[0.050,5.015873,10.178946,20.6234355,26.431576,36.350839,46.451247,52.345873,58.5091835,61.725907,64.821712,68.9873925,71.2972335,76.430136,82.774456,88.7065415,94.7060205,100.763594,107.4748185,110.1979365],
      lengths:[4.865873,5.063073,10.3444895,5.7081405,9.819263,10.000408,5.794626,6.0633105,3.1167235,2.995805,4.0656805,2.209841,5.0329025,6.24432,5.8320855,5.899479,5.9575735,6.6112245,2.623118,2.8645015]
    },
    bad:{
      starts:[0.050,4.417007,9.446009,14.972109,27.244649,33.974603,39.017619,45.236621,51.966576,58.640544,64.14551,69.289501,75.775533,82.287528,88.129535,94.184535,100.267528,105.403526,111.64551,116.446531],
      lengths:[4.267007,4.929002,5.4261,12.17254,6.629954,4.943016,6.119002,6.629955,6.573968,5.404966,5.043991,6.386032,6.411995,5.742007,5.955,5.982993,5.035998,6.141984,4.701021,6.777532]
    }
  };

  function getContext(){
    if(!context)context=new AudioContextClass();
    return context;
  }

  function unlock(){
    try{
      var ctx=getContext();
      if(ctx.state==="suspended")ctx.resume().catch(function(){});
    }catch(error){}
  }
  root.document.addEventListener("pointerdown",unlock,true);
  root.document.addEventListener("touchstart",unlock,true);
  root.document.addEventListener("keydown",unlock,true);

  function levelFromSource(src){
    var length=String(src||"").length;
    if(length<2550000)return "medium";
    if(length<2670000)return "good";
    return "bad";
  }

  function toArrayBuffer(dataUri){
    var comma=dataUri.indexOf(",");
    var binary=atob(dataUri.slice(comma+1));
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return bytes.buffer;
  }

  function decode(level,src){
    if(decoded[level])return Promise.resolve(decoded[level]);
    if(decoding[level])return decoding[level];
    var ctx=getContext();
    decoding[level]=new Promise(function(resolve,reject){
      var buffer;
      try{buffer=toArrayBuffer(src);}catch(error){reject(error);return;}
      var settled=false;
      var done=function(audioBuffer){if(settled)return;settled=true;decoded[level]=audioBuffer;resolve(audioBuffer);};
      var fail=function(error){if(settled)return;settled=true;delete decoding[level];reject(error||new Error("Không giải mã được audio Adam"));};
      var result;
      try{result=ctx.decodeAudioData(buffer.slice(0),done,fail);}catch(error){fail(error);return;}
      if(result&&typeof result.then==="function")result.then(done).catch(fail);
    });
    return decoding[level];
  }

  function AdamAudio(src){
    var isAdam=typeof src==="string"&&src.indexOf("data:audio/mpeg;base64,")===0&&src.length>1000000;
    if(!isAdam)return new NativeAudio(src);

    var level=levelFromSource(src);
    var selectedIndex=0;
    var volume=1;
    var sourceNode=null;
    var gainNode=null;
    var paused=true;
    var stopped=false;
    var listeners={loadedmetadata:[],ended:[],error:[]};
    var loaded=false;

    function emit(type,event){
      var list=(listeners[type]||[]).slice();
      for(var i=0;i<list.length;i++){
        try{list[i].listener.call(proxy,event||{type:type,target:proxy});}catch(error){}
        if(list[i].once){var pos=listeners[type].indexOf(list[i]);if(pos>=0)listeners[type].splice(pos,1);}
      }
    }

    function ensureLoaded(){
      return decode(level,src).then(function(buffer){
        if(!loaded){loaded=true;emit("loadedmetadata",{type:"loadedmetadata",target:proxy});}
        return buffer;
      }).catch(function(error){emit("error",{type:"error",target:proxy,error:error});throw error;});
    }

    var proxy={};
    Object.defineProperties(proxy,{
      volume:{get:function(){return volume;},set:function(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(gainNode)gainNode.gain.value=volume;}},
      paused:{get:function(){return paused;}},
      duration:{get:function(){return segments[level].lengths[selectedIndex]||0;}},
      currentTime:{get:function(){return selectedIndex;},set:function(value){var numeric=Number(value);selectedIndex=Number.isFinite(numeric)?Math.max(0,Math.min(19,Math.round(numeric))):0;}},
      src:{get:function(){return src;}}
    });

    proxy.addEventListener=function(type,listener,options){
      if(typeof listener!=="function")return;
      if(!listeners[type])listeners[type]=[];
      listeners[type].push({listener:listener,once:Boolean(options&&options.once)});
      if(type==="loadedmetadata"&&loaded)nativeSetTimeout(function(){emit("loadedmetadata",{type:"loadedmetadata",target:proxy});},0);
    };
    proxy.removeEventListener=function(type,listener){
      var list=listeners[type]||[];
      for(var i=list.length-1;i>=0;i--)if(list[i].listener===listener)list.splice(i,1);
    };
    proxy.load=function(){ensureLoaded().catch(function(){});};
    proxy.pause=function(){
      stopped=true;
      paused=true;
      if(sourceNode){try{sourceNode.stop();}catch(error){}sourceNode=null;}
    };
    proxy.play=function(){
      stopped=false;
      return ensureLoaded().then(function(buffer){
        if(stopped)return;
        var ctx=getContext();
        var cue=segments[level];
        var start=cue.starts[selectedIndex]||0;
        var length=Math.min(cue.lengths[selectedIndex]||3,Math.max(0.1,buffer.duration-start));
        if(ctx.state==="suspended")return ctx.resume().then(function(){return startPlayback(ctx,buffer,start,length);});
        return startPlayback(ctx,buffer,start,length);
      });
    };

    function startPlayback(ctx,buffer,start,length){
      if(stopped)return;
      if(sourceNode){try{sourceNode.stop();}catch(error){}}
      sourceNode=ctx.createBufferSource();
      gainNode=ctx.createGain();
      gainNode.gain.value=volume;
      sourceNode.buffer=buffer;
      sourceNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      paused=false;
      pendingStopDelay=Math.max(1300,Math.round((length+0.25)*1000));
      root.__v67AdamDebug={level:level,index:selectedIndex,start:start,length:length,bufferDuration:buffer.duration,contextState:ctx.state};
      sourceNode.onended=function(){paused=true;sourceNode=null;emit("ended",{type:"ended",target:proxy});};
      sourceNode.start(0,start,length);
    }

    return proxy;
  }

  AdamAudio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(AdamAudio,NativeAudio);}catch(error){}
  root.Audio=AdamAudio;

  root.setTimeout=function(callback,delay){
    var args=Array.prototype.slice.call(arguments,2);
    var actual=Number(delay);
    if(actual===960&&pendingStopDelay){actual=pendingStopDelay;pendingStopDelay=0;}
    return nativeSetTimeout.apply(root,[callback,actual].concat(args));
  };
})(typeof window!=="undefined"?window:this);
