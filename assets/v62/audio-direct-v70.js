(function(root){
  "use strict";
  if(!root.Audio||root.__v70DirectAdamClips)return;
  root.__v70DirectAdamClips=true;
  var NativeAudio=root.Audio;
  function levelFromSource(source){var length=String(source||"").length;if(length<2550000)return "medium";if(length<2670000)return "good";return "bad";}
  function pad(number){return number<10?"0"+number:String(number);}
  function DirectAdamAudio(source){
    var isBundledAdam=typeof source==="string"&&source.indexOf("data:audio/mpeg;base64,")===0&&source.length>1000000;
    if(!isBundledAdam)return new NativeAudio(source);
    var level=levelFromSource(source),selectedIndex=0,volume=1,player=null,metadataListeners=[],endedListeners=[],errorListeners=[];
    function emit(list,event){var copy=list.slice();for(var i=0;i<copy.length;i++){try{copy[i].listener.call(proxy,event);}catch(error){}if(copy[i].once){var p=list.indexOf(copy[i]);if(p>=0)list.splice(p,1);}}}
    var proxy={};
    Object.defineProperties(proxy,{
      volume:{get:function(){return player?player.volume:volume;},set:function(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(player)player.volume=volume;}},
      paused:{get:function(){return true;}},
      currentTime:{get:function(){return selectedIndex;},set:function(value){var numeric=Number(value);selectedIndex=Number.isFinite(numeric)?Math.max(0,Math.min(19,Math.round(numeric))):0;}},
      duration:{get:function(){return player&&Number.isFinite(player.duration)?player.duration:0;}},
      src:{get:function(){return source;}}
    });
    proxy.addEventListener=function(type,listener,options){if(typeof listener!=="function")return;var item={listener:listener,once:Boolean(options&&options.once)};if(type==="loadedmetadata")metadataListeners.push(item);else if(type==="ended")endedListeners.push(item);else if(type==="error")errorListeners.push(item);};
    proxy.removeEventListener=function(){};
    proxy.load=function(){setTimeout(function(){emit(metadataListeners,{type:"loadedmetadata",target:proxy});},0);};
    proxy.pause=function(){if(player){try{player.pause();player.currentTime=0;}catch(error){}}};
    proxy.play=function(){
      var number=selectedIndex+1;
      var path="./assets/adam-clips/"+level+"-"+pad(number)+".mp3?v=70";
      if(player){try{player.pause();player.currentTime=0;}catch(error){}}
      player=new NativeAudio(path);
      player.volume=volume;
      player.addEventListener("ended",function(){emit(endedListeners,{type:"ended",target:proxy});},{once:true});
      player.addEventListener("error",function(event){emit(errorListeners,{type:"error",target:proxy,error:event});},{once:true});
      root.__v70AdamDebug={level:level,index:number,path:path};
      return player.play();
    };
    return proxy;
  }
  DirectAdamAudio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(DirectAdamAudio,NativeAudio);}catch(error){}
  root.Audio=DirectAdamAudio;
})(typeof window!=="undefined"?window:this);
