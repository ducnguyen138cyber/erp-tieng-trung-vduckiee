/* Fixed-voice local sprites. Device fallback is strictly vi-VN, never a foreign voice. */
(function(root){'use strict';
var data=null,manifestPromise=null,player=null,cancel=null,serial=0;
function manifest(){if(data)return Promise.resolve(data);if(!manifestPromise)manifestPromise=fetch('./data/vietnamese/audio-manifest.json?v=1').then(function(r){if(!r.ok)throw Error('录音清单暂时不可用。');return r.json();}).then(function(value){data=value;return value;}).catch(function(e){manifestPromise=null;throw e;});return manifestPromise;}
function stop(){serial++;if(cancel){cancel();cancel=null;}if(player)player.pause();if(root.speechSynthesis)root.speechSynthesis.cancel();}
function fallback(text,slow,onStatus){return new Promise(function(resolve){
 if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){onStatus('录音无法播放，此设备也没有越南语语音。请检查网络或使用文字替代。');resolve(false);return;}
 var voice=root.speechSynthesis.getVoices().find(function(v){return /^vi(?:-|$)/i.test(v.lang);});
 if(!voice){onStatus('此设备没有越南语语音。请检查网络，或使用文字替代；不会改用其他语言朗读。');resolve(false);return;}
 var utterance=new root.SpeechSynthesisUtterance(text),done=false;utterance.lang='vi-VN';utterance.voice=voice;utterance.rate=slow?.65:.9;
 function finish(ok){if(done)return;done=true;cancel=null;resolve(ok);}
 cancel=function(){finish(false);};utterance.onend=function(){finish(true);};utterance.onerror=function(){onStatus('设备语音播放失败，请检查声音设置。');finish(false);};
 onStatus('正在使用设备的越南语语音，口音可能不同于课程录音。');root.speechSynthesis.speak(utterance);
});}
function recorded(unit,text,slow,onStatus,request){return new Promise(function(resolve){
 var item=data.units[unit],segment=item&&item.segments[text];if(!segment){fallback(text,slow,onStatus).then(resolve);return;}
 if(!player)player=new root.Audio();var audio=player,done=false,timer=null,loadTimer=null,rate=slow?.75:1;
 function finish(ok,message){if(done)return;done=true;clearTimeout(timer);clearTimeout(loadTimer);audio.pause();cancel=null;if(message)onStatus(message);resolve(ok);}
 cancel=function(){finish(false);};
 audio.onloadedmetadata=function(){if(serial!==request){finish(false);return;}try{audio.currentTime=segment[0];}catch(_){finish(false,'录音定位失败，请重试。');}};
 audio.onplaying=function(){
  if(serial!==request){finish(false);return;}clearTimeout(loadTimer);clearTimeout(timer);
  // Seek before exposing a phrase. Files include silent padding between phrases.
  if(audio.currentTime<segment[0]-.02){audio.currentTime=segment[0];return;}
  onStatus(slow?'慢速播放 · 课程固定越南语语音':'正在播放 · 课程固定越南语语音');
  timer=setTimeout(function(){finish(true,'播放完毕，可重播或慢速跟读。');},Math.max(0,(segment[1]-audio.currentTime)*1000/rate));
 };
 audio.onseeked=function(){if(!audio.paused)audio.onplaying();};
 audio.ontimeupdate=function(){if(audio.currentTime>=segment[1])finish(true,'播放完毕，可重播或慢速跟读。');};
 audio.onended=function(){finish(true,'播放完毕。');};
 audio.onerror=function(){finish(false,'课程录音暂时无法播放。请检查网络，或尝试设备越南语语音。');};
 var url=new URL(item.file,root.location.href).href;
 if(audio.src!==url){audio.src=url;audio.preload='metadata';audio.load();}
 else if(audio.readyState>=1)audio.currentTime=segment[0];
 audio.playbackRate=rate;audio.preservesPitch=true;audio.webkitPreservesPitch=true;
 loadTimer=setTimeout(function(){finish(false,'录音加载超时。请检查网络后重试。');},15000);
 // Called directly from the click handler when the manifest is warm, preserving iOS user activation.
 audio.play().catch(function(){finish(false,'浏览器暂未允许播放。请再次点击播放，或检查静音设置。');});
});}
function play(unit,text,slow,onStatus){stop();var request=serial;onStatus=onStatus||function(){};onStatus('正在准备录音…');if(data)return recorded(unit,text,slow,onStatus,request);return manifest().then(function(){if(serial!==request)return false;return recorded(unit,text,slow,onStatus,request);}).catch(function(){if(serial===request)return fallback(text,slow,onStatus);return false;});}
root.VDuckieVIAudio={play:play,stop:stop,prepare:function(){return manifest().catch(function(){return null;});},device:function(text,slow,status){stop();return fallback(text,slow,status||function(){});}};
})(window);
