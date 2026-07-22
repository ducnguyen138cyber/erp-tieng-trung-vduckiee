(function(root,document){
  "use strict";
  if(root.__VDUCKIE_POLISH_V106__)return;
  root.__VDUCKIE_POLISH_V106__=true;
  var manifest=root.VDuckieMascotManifest,renderer=root.VDuckieMascot,store=root.VDuckieProgressStore,core=root.VDuckieEXPCore;
  var reduced=root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)");
  var preloadImages=[],raf=0,parallaxHost=null,activeCinematic=null,cinematicSequence=0;
  var audio=null,audioResumePromise=null,pendingTone="",toneSequence=0,destroyed=false;
  var unsubscribeSession=null,legacyGuard=null,legacyGuardObserver=null;
  var baseline={hydrated:false,sessionIdentity:"",level:1};
  var feedbackSelector=[
    ".erp-module-option","[data-hsk-option]","[data-hsk-reading-option]",
    '[data-hsk-action="dictation-check"]','[data-hsk-action="section-complete"]','[data-hsk-action="complete"]',
    "[data-erp-complete]",'[data-sfx="feedback"]','[data-hsk-action*="pronunciation"]',"[data-v62-speaking-action]"
  ].join(",");
  function safeLevel(value){return Math.max(1,Math.min(10,Math.floor(Number(value||1))))}
  function sessionIdentity(session){var user=session&&session.user;return user&&String(user.id||user.email||"")||"guest"}
  function currentSessionIdentity(){return sessionIdentity(core&&typeof core.session==="function"?core.session():null)}
  function assetFor(level){var result=manifest&&manifest.resolve?manifest.resolve({level:safeLevel(level),state:"idle"}):null;return result&&(result.asset||result.fallbackAsset)||""}
  function preload(level){
    preloadImages.length=0;
    [safeLevel(level),safeLevel(level+1)].filter(function(value,index,list){return list.indexOf(value)===index}).forEach(function(value){
      var src=assetFor(value);if(!src)return;var image=new Image();image.decoding="async";image.src=src;preloadImages.push(image);
    });
  }
  function ensureAudio(){
    if(destroyed)return null;
    if(audio)return audio;
    var AudioContext=root.AudioContext||root.webkitAudioContext;if(!AudioContext)return null;
    try{audio=new AudioContext()}catch(error){return null}
    return audio;
  }
  function ensureAudioReady(){
    var ctx=ensureAudio();
    if(!ctx)return Promise.resolve(null);
    if(ctx.state==="running")return Promise.resolve(ctx);
    if(ctx.state!=="suspended"||typeof ctx.resume!=="function")return Promise.resolve(null);
    if(audioResumePromise)return audioResumePromise;
    audioResumePromise=Promise.resolve().then(function(){return ctx.resume()}).then(function(){return ctx.state==="running"?ctx:null}).catch(function(){return null}).finally(function(){audioResumePromise=null});
    return audioResumePromise;
  }
  function playToneNow(kind){
    var ctx=audio;if(!ctx||ctx.state!=="running"||destroyed)return false;
    var map={hover:[520,.025,.045],click:[390,.03,.05],unlock:[660,.05,.16],"level-up":[740,.055,.28],"correct-answer":[620,.04,.12],"wrong-answer":[240,.025,.13],"pronunciation-good":[620,.04,.12],"pronunciation-wrong":[290,.025,.14],"lesson-complete":[740,.05,.22],"streak-increased":[680,.045,.18],"streak-lost":[210,.025,.16]};
    var spec=map[kind];if(!spec)return false;
    try{
      var now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(spec[0],now);
      if(kind==="level-up"||kind==="unlock"||kind==="lesson-complete")osc.frequency.exponentialRampToValueAtTime(spec[0]*1.35,now+spec[2]);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(spec[1],now+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+spec[2]);
      osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+spec[2]+.02);return true;
    }catch(error){return false}
  }
  function requestTone(kind,allowCreate){
    if(destroyed)return Promise.resolve(false);
    if(!audio&&!allowCreate)return Promise.resolve(false);
    var ctx=audio||ensureAudio();if(!ctx)return Promise.resolve(false);
    if(ctx.state==="running")return Promise.resolve(playToneNow(kind));
    pendingTone=kind;var request=++toneSequence;
    return ensureAudioReady().then(function(ready){
      if(!ready||destroyed||request!==toneSequence)return false;
      var queued=pendingTone;pendingTone="";return playToneNow(queued);
    }).catch(function(){return false});
  }
  function unlockedOutfit(level){if(!manifest||!manifest.getItems)return null;var items=manifest.getItems("outfit");for(var i=0;i<items.length;i+=1)if(Number(items[i].minimumLevel||0)===Number(level))return items[i];return null}
  function mascotMarkup(level,className){if(!renderer||!renderer.render)return"";return '<div class="'+className+'">'+renderer.render({level:safeLevel(level),animationState:"idle",size:"large",previewMode:true})+'</div>'}
  function scheduleCinematic(entry,fn,delay){
    var id=root.setTimeout(function(){
      var index=entry.timers.indexOf(id);if(index>=0)entry.timers.splice(index,1);
      if(!activeCinematic||activeCinematic.id!==entry.id)return;fn();
    },delay);
    entry.timers.push(id);return id;
  }
  function lockBackground(entry){
    entry.background=[];
    Array.prototype.forEach.call(document.body.children||[],function(node){
      if(node===entry.node)return;
      var record={node:node,inert:"inert" in node?!!node.inert:null,ariaHidden:node.getAttribute&&node.getAttribute("aria-hidden")};
      entry.background.push(record);
      if("inert" in node)node.inert=true;else if(node.setAttribute)node.setAttribute("aria-hidden","true");
    });
    document.body.classList.add("v106-cinematic-open");
  }
  function unlockBackground(entry){
    (entry.background||[]).forEach(function(record){
      if(!record.node)return;
      if(record.inert!==null)record.node.inert=record.inert;
      else if(record.node.setAttribute){if(record.ariaHidden===null)record.node.removeAttribute("aria-hidden");else record.node.setAttribute("aria-hidden",record.ariaHidden)}
    });
    entry.background=[];document.body.classList.remove("v106-cinematic-open");
  }
  function disposeCinematic(entry,restoreFocus){
    if(!entry)return;
    entry.timers.forEach(root.clearTimeout);entry.timers.length=0;
    if(entry.node&&entry.blocker)entry.node.removeEventListener("click",entry.blocker,true);
    unlockBackground(entry);
    if(entry.node&&entry.node.parentNode)entry.node.parentNode.removeChild(entry.node);
    if(activeCinematic&&activeCinematic.id===entry.id)activeCinematic=null;
    if(restoreFocus&&entry.previousFocus&&entry.previousFocus.isConnected&&typeof entry.previousFocus.focus==="function"){
      try{entry.previousFocus.focus({preventScroll:true})}catch(error){entry.previousFocus.focus()}
    }
  }
  function closeCinematic(id){
    var entry=activeCinematic;if(!entry||entry.id!==id)return false;
    entry.node.classList.add("is-closing");
    scheduleCinematic(entry,function(){disposeCinematic(entry,true)},260);return true;
  }
  function cinematic(fromLevel,toLevel,preview){
    var previousFocus=activeCinematic&&activeCinematic.previousFocus||document.activeElement;
    if(activeCinematic)disposeCinematic(activeCinematic,false);
    var gift=unlockedOutfit(toLevel),host=document.createElement("div"),entry={id:++cinematicSequence,node:host,timers:[],background:[],previousFocus:previousFocus,blocker:null};
    host.className="v106-cinematic";host.setAttribute("role","dialog");host.setAttribute("aria-modal","true");host.setAttribute("aria-label","VDuckie Level Up");host.setAttribute("tabindex","-1");
    host.innerHTML='<section class="v106-cinematic-stage"><div class="v106-cinematic-progress"><i></i></div><p class="v106-cinematic-copy">Level '+safeLevel(fromLevel)+' → Level '+safeLevel(toLevel)+(preview?' · Preview':'')+'</p><div class="v106-cinematic-sparkles" aria-hidden="true"></div><div class="v106-cinematic-mascots">'+mascotMarkup(fromLevel,"v106-cinematic-old")+mascotMarkup(toLevel,"v106-cinematic-new")+'</div><p class="v106-cinematic-thought"><strong>谢谢你陪我成长。</strong><span>(Cảm ơn vì đã cùng tôi trưởng thành.)</span></p>'+(gift?'<span class="v106-unlock-gift"><b>🎁</b>Mở khóa: '+String(gift.name||"Trang phục")+'</span>':'')+'</section>';
    entry.blocker=function(event){event.preventDefault();event.stopPropagation()};host.addEventListener("click",entry.blocker,true);
    document.body.appendChild(host);activeCinematic=entry;lockBackground(entry);
    if(renderer&&renderer.hydrate)renderer.hydrate(host);
    try{host.focus({preventScroll:true})}catch(error){if(host.focus)host.focus()}
    requestTone("level-up",true);
    if(gift)scheduleCinematic(entry,function(){requestTone("unlock",false)},2300);
    scheduleCinematic(entry,function(){closeCinematic(entry.id)},reduced&&reduced.matches?1800:4300);
    return entry.id;
  }
  function progressDetail(event){
    var detail=event&&event.detail||{},meta=detail.progressMeta||{};
    return {level:safeLevel(detail.level||baseline.level),source:String(meta.source||"sync"),hydrated:meta.hydrated===true,sessionIdentity:String(meta.sessionIdentity||currentSessionIdentity())};
  }
  function resetBaseline(identity,level,hydrated){baseline.sessionIdentity=identity;baseline.level=safeLevel(level);baseline.hydrated=!!hydrated}
  function onProgress(event){
    var next=progressDetail(event);preload(next.level);
    if(next.sessionIdentity!==baseline.sessionIdentity){resetBaseline(next.sessionIdentity,next.level,false)}
    if(!next.hydrated||next.source==="session"||!baseline.hydrated){resetBaseline(next.sessionIdentity,next.level,next.hydrated&&next.source!=="session");return}
    if(next.source==="mutation"&&next.level>baseline.level)cinematic(baseline.level,next.level,false);
    baseline.level=next.level;
  }
  function onSession(session){var identity=sessionIdentity(session);if(identity!==baseline.sessionIdentity)resetBaseline(identity,baseline.level,false)}
  function onDeveloper(event){var detail=event&&event.detail||{};if(detail.requestedState==="level-up"||detail.button==="level-up"){var level=safeLevel(detail.level||baseline.level);cinematic(level,Math.min(10,level+1),true)}}
  function onMascotEvent(event){var name=event&&event.detail&&event.detail.event;if(name)requestTone(name,true)}
  function onPointerEnter(event){var mascot=event.target;if(mascot&&mascot.matches&&mascot.matches("[data-v95-mascot]"))requestTone("hover",false)}
  function isFeedbackButton(button){return !!(button&&button.matches&&button.matches(feedbackSelector))}
  function onClick(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");if(!button)return;
    if(button.getAttribute&&button.getAttribute("data-sfx")==="none"){ensureAudioReady();return}
    if(isFeedbackButton(button)){ensureAudioReady();return}
    requestTone("click",true);
  }
  function onFocusIn(event){var entry=activeCinematic;if(!entry||!entry.node||entry.node.contains(event.target))return;try{entry.node.focus({preventScroll:true})}catch(error){if(entry.node.focus)entry.node.focus()}}
  function parallax(event){
    if(reduced&&reduced.matches)return;var host=event.target&&event.target.closest&&event.target.closest(".v92-evolution-visual");if(!host)return;parallaxHost=host;
    var rect=host.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1)),y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
    if(raf)root.cancelAnimationFrame(raf);raf=root.requestAnimationFrame(function(){raf=0;var mascot=host.querySelector("[data-v95-mascot]");if(!mascot)return;mascot.style.setProperty("--v106-tilt-x",(x*1.1).toFixed(2)+"deg");mascot.style.setProperty("--v106-tilt-y",(-y*.8).toFixed(2)+"deg");mascot.style.setProperty("--v106-bubble-x",(-x*3).toFixed(1)+"px");mascot.style.setProperty("--v106-bubble-y",(-y*1.5).toFixed(1)+"px");mascot.style.setProperty("--v106-bg-x",(-x*2).toFixed(1)+"px");mascot.style.setProperty("--v106-bg-y",(-y*1.5).toFixed(1)+"px")})
  }
  function resetParallax(event){var host=event.target;if(!host||!host.matches||!host.matches(".v92-evolution-visual"))return;var mascot=host.querySelector("[data-v95-mascot]");if(mascot)["--v106-tilt-x","--v106-tilt-y","--v106-bubble-x","--v106-bubble-y","--v106-bg-x","--v106-bg-y"].forEach(function(name){mascot.style.removeProperty(name)});if(parallaxHost===host)parallaxHost=null}
  function nativeHiddenDescriptor(node){var proto=node;while(proto){var descriptor=Object.getOwnPropertyDescriptor(proto,"hidden");if(descriptor)return descriptor;proto=Object.getPrototypeOf(proto)}return null}
  function installLegacyGuard(){
    if(legacyGuard)return true;
    var overlay=document.getElementById&&document.getElementById("v95LevelUpOverlay");if(!overlay)return false;
    var descriptor=nativeHiddenDescriptor(overlay),nativeGet=descriptor&&descriptor.get?descriptor.get.bind(overlay):function(){return overlay.hasAttribute("hidden")},nativeSet=descriptor&&descriptor.set?descriptor.set.bind(overlay):function(value){if(value)overlay.setAttribute("hidden","");else overlay.removeAttribute("hidden")};
    Object.defineProperty(overlay,"hidden",{configurable:true,enumerable:true,get:function(){return nativeGet()},set:function(value){nativeSet(value===false?true:!!value)}});
    nativeSet(true);
    var observer=root.MutationObserver?new MutationObserver(function(){
      var journey=document.getElementById&&document.getElementById("v92EvolutionOverlay");
      if(nativeGet()&&(!journey||journey.hidden)&&document.body.classList.contains("v92-modal-open"))document.body.classList.remove("v92-modal-open");
    }):null;
    if(observer)observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
    legacyGuard={overlay:overlay,nativeSet:nativeSet,observer:observer};return true;
  }
  function watchLegacyGuard(){
    if(installLegacyGuard()||!root.MutationObserver||!document.body)return;
    legacyGuardObserver=new MutationObserver(function(){if(installLegacyGuard()&&legacyGuardObserver){legacyGuardObserver.disconnect();legacyGuardObserver=null}});
    legacyGuardObserver.observe(document.body,{childList:true,subtree:true});
  }
  function restoreLegacyGuard(){
    if(legacyGuardObserver){legacyGuardObserver.disconnect();legacyGuardObserver=null}
    if(!legacyGuard)return;
    if(legacyGuard.observer)legacyGuard.observer.disconnect();
    try{delete legacyGuard.overlay.hidden;legacyGuard.nativeSet(true)}catch(error){}
    legacyGuard=null;
  }
  function initLegacyGuard(){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watchLegacyGuard,{once:true});else watchLegacyGuard()}
  function destroy(){
    if(destroyed)return;destroyed=true;
    ["vduckie:progress-updated","vduckie:developer-animation-test","vduckie:mascot-event"].forEach(function(name,index){document.removeEventListener(name,[onProgress,onDeveloper,onMascotEvent][index])});
    document.removeEventListener("pointerenter",onPointerEnter,true);document.removeEventListener("pointermove",parallax,true);document.removeEventListener("pointerleave",resetParallax,true);document.removeEventListener("click",onClick,true);document.removeEventListener("focusin",onFocusIn,true);
    if(unsubscribeSession)unsubscribeSession();unsubscribeSession=null;
    if(raf)root.cancelAnimationFrame(raf);raf=0;
    if(activeCinematic)disposeCinematic(activeCinematic,false);
    toneSequence+=1;pendingTone="";audioResumePromise=null;
    if(audio)audio.close().catch(function(){});audio=null;
    preloadImages.length=0;restoreLegacyGuard();
  }
  baseline.sessionIdentity=currentSessionIdentity();baseline.level=store&&store.getSnapshot?safeLevel(store.getSnapshot().level):1;
  document.addEventListener("vduckie:progress-updated",onProgress);document.addEventListener("vduckie:developer-animation-test",onDeveloper);document.addEventListener("vduckie:mascot-event",onMascotEvent);
  document.addEventListener("pointerenter",onPointerEnter,true);document.addEventListener("pointermove",parallax,true);document.addEventListener("pointerleave",resetParallax,true);document.addEventListener("click",onClick,true);document.addEventListener("focusin",onFocusIn,true);
  if(core&&typeof core.onSession==="function")unsubscribeSession=core.onSession(onSession);
  preload(baseline.level);initLegacyGuard();
  root.VDuckiePolishV106=Object.freeze({version:"106.1",handlesLevelUp:true,preload:preload,cinematic:cinematic,destroy:destroy,getState:function(){return Object.freeze({baseline:Object.freeze({hydrated:baseline.hydrated,sessionIdentity:baseline.sessionIdentity,level:baseline.level}),activeCinematicId:activeCinematic&&activeCinematic.id||0,audioState:audio&&audio.state||"closed"})}});
})(window,document);
