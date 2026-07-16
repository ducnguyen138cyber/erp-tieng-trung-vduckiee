(function(root){
  "use strict";
  if(!root.Audio||root.__v69DirectAdamClips)return;
  root.__v69DirectAdamClips=true;

  var NativeAudio=root.Audio;
  var nativeSetTimeout=root.setTimeout.bind(root);

  function levelFromSource(source){
    var length=String(source||"").length;
    if(length<2550000)return "medium";
    if(length<2670000)return "good";
    return "bad";
  }

  function pad(number){return number<10?"0"+number:String(number);}

  function DirectAdamAudio(source){
    var isBundledAdam=typeof source==="string"&&source.indexOf("data:audio/mpeg;base64,")===0&&source.length>1000000;
    if(!isBundledAdam)return new NativeAudio(source);

    var level=levelFromSource(source);
    var selectedIndex=0;
    var volume=1;
    var player=null;
    var metadataListeners=[];
    var endedListeners=[];
    var errorListeners=[];

    function emit(list,event){
      var copy=list.slice();
      for(var i=0;i<copy.length;i++){
        try{copy[i].listener.call(proxy,event);}catch(error){}
        if(copy[i].once){
          var position=list.indexOf(copy[i]);
          if(position>=0)list.splice(position,1);
        }
      }
    }

    var proxy={};
    Object.defineProperties(proxy,{
      volume:{
        get:function(){return player?player.volume:volume;},
        set:function(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(player)player.volume=volume;}
      },
      /* Runtime v62 checks paused after 960 ms and stops audio. Return true here so
         the verified standalone clip is allowed to finish naturally. */
      paused:{get:function(){return true;}},
      currentTime:{
        get:function(){return selectedIndex;},
        set:function(value){
          var numeric=Number(value);
          selectedIndex=Number.isFinite(numeric)?Math.max(0,Math.min(19,Math.round(numeric))):0;
        }
      },
      duration:{get:function(){return player&&Number.isFinite(player.duration)?player.duration:0;}},
      src:{get:function(){return source;}}
    });

    proxy.addEventListener=function(type,listener,options){
      if(typeof listener!=="function")return;
      var entry={listener:listener,once:Boolean(options&&options.once)};
      if(type==="loadedmetadata")metadataListeners.push(entry);
      else if(type==="ended")endedListeners.push(entry);
      else if(type==="error")errorListeners.push(entry);
    };

    proxy.removeEventListener=function(type,listener){
      var list=type==="loadedmetadata"?metadataListeners:type==="ended"?endedListeners:type==="error"?errorListeners:null;
      if(!list)return;
      for(var i=list.length-1;i>=0;i--)if(list[i].listener===listener)list.splice(i,1);
    };

    proxy.load=function(){
      nativeSetTimeout(function(){emit(metadataListeners,{type:"loadedmetadata",target:proxy});},0);
    };

    proxy.pause=function(){
      if(player){try{player.pause();}catch(error){}}
    };

    proxy.play=function(){
      var path="./assets/adam-clips/"+level+"-"+pad(selectedIndex+1)+".mp3?v=69";
      if(player){try{player.pause();}catch(error){}}
      player=new NativeAudio(path);
      player.volume=volume;
      player.addEventListener("ended",function(){emit(endedListeners,{type:"ended",target:proxy});},{once:true});
      player.addEventListener("error",function(event){emit(errorListeners,{type:"error",target:proxy,error:event});},{once:true});
      root.__v69AdamDebug={level:level,index:selectedIndex+1,path:path};
      return player.play();
    };

    return proxy;
  }

  DirectAdamAudio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(DirectAdamAudio,NativeAudio);}catch(error){}
  root.Audio=DirectAdamAudio;
})(typeof window!=="undefined"?window:this);
