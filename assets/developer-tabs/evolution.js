(function (root) {
  "use strict";
  var ns = root.VDuckieDeveloper;
  if (!ns || !ns.actions) return;
  var actions = ns.actions, runtime = ns.runtime, esc = ns.util.esc;
  ns.tabs = ns.tabs || Object.create(null); ns.tabOrder = ns.tabOrder || [];
  function registerTab(def) { if (!ns.tabs[def.id]) { ns.tabs[def.id] = def; ns.tabOrder.push(def.id); } }
  function bridgeAction(id, label, state, sound) {
    actions.register({ id:id, tab:"evolution", label:label, keywords:[state,"mascot","event"], run:function(ctx){
      if (!ctx.bridge) return false; ctx.bridge.enable(ctx.state.level); ctx.bridge.test(state);
      runtime.patch({ animation:{ current:state } }, "evolution-event"); if(sound) actions.audio.play(sound); return true;
    }});
  }
  actions.register({ id:"evolution.set-level", tab:"evolution", label:"Set Preview Level", keywords:["level","1 2 3 4 5 6 7 8 9 10"], run:function(ctx,payload){
    var level=ns.util.clamp(payload.value,1,10); if(ctx.bridge){ctx.bridge.enable(level);ctx.bridge.setLevel(level);} runtime.patch({level:level},"level"); return level;
  }});
  actions.register({ id:"evolution.set-xp", tab:"evolution", label:"Set XP Preview", keywords:["xp","progress"], run:function(ctx,payload){ runtime.patch({xp:Math.max(0,Number(payload.value||0))},"xp"); }});
  bridgeAction("evolution.idle","Idle","idle"); bridgeAction("evolution.hover","Hover","hover","hover");
  bridgeAction("evolution.correct","Correct","correct-answer","correct"); bridgeAction("evolution.wrong","Wrong","wrong-answer","wrong");
  bridgeAction("evolution.pronunciation-good","Pronunciation Good","pronunciation-good","pronunciation");
  bridgeAction("evolution.pronunciation-wrong","Pronunciation Wrong","pronunciation-wrong","wrong");
  bridgeAction("evolution.lesson-complete","Lesson Complete","lesson-complete","correct");
  bridgeAction("evolution.level-up","Level Up","level-up"); bridgeAction("evolution.glow","Glow","glow","unlock");
  bridgeAction("evolution.streak-lost","Streak Lost","streak-lost","streak");
  bridgeAction("evolution.egg-hatching","Egg Hatching","egg-hatching","unlock");
  actions.register({id:"evolution.thought",tab:"evolution",label:"Thought Bubble",keywords:["bubble","thought"],run:function(ctx){if(ctx.bridge){ctx.bridge.enable(ctx.state.level);ctx.bridge.test("thought");}}});
  actions.register({id:"evolution.outfit-unlock",tab:"evolution",label:"Outfit Unlock",keywords:["outfit","unlock","gift"],run:function(ctx){
    var next=Math.min(10,ctx.state.level+1); if(root.VDuckiePolishV106&&root.VDuckiePolishV106.cinematic)root.VDuckiePolishV106.cinematic(ctx.state.level,next,true); else if(ctx.bridge)ctx.bridge.test("level-up");
    runtime.emit("toast",{message:"Preview mở khóa Outfit tại Level "+next,tone:"good"});
  }});
  actions.register({id:"evolution.replay",tab:"evolution",label:"Replay Animation",keywords:["replay","current"],favorite:true,run:function(){return actions.replay(actions.history()[1]||null);}});
  function actionButton(id,label){return '<button type="button" data-vdev-action="'+id+'">'+esc(label)+'</button>';}
  registerTab({id:"evolution",icon:"🦆",label:"Evolution",render:function(state){
    var renderer=root.VDuckieMascot,mascot=renderer&&renderer.render?renderer.render({level:state.level,animationState:"idle",size:"large",previewMode:true,allowIncompatible:true,selectedItems:state.inventory}):'<p>Renderer chưa sẵn sàng.</p>';
    var buttons=[["evolution.idle","Idle"],["evolution.hover","Hover"],["evolution.correct","Correct"],["evolution.wrong","Wrong"],["evolution.pronunciation-good","Pronunciation Good"],["evolution.pronunciation-wrong","Pronunciation Wrong"],["evolution.lesson-complete","Lesson Complete"],["evolution.level-up","Level Up"],["evolution.glow","Glow"],["evolution.streak-lost","Streak Lost"],["evolution.outfit-unlock","Outfit Unlock"],["evolution.egg-hatching","Egg Hatching"],["evolution.thought","Thought Bubble"],["evolution.replay","Replay Animation"]];
    return '<div class="vdev-two-column"><section class="vdev-preview-stage">'+mascot+'<div class="vdev-stat-row"><span>Level <b>'+state.level+'</b></span><span>XP <b>'+state.xp+'</b></span><span>State <b>'+esc(state.animation.current)+'</b></span><span>Event <b>'+esc(state.currentAction||"—")+'</b></span></div></section><section><div class="vdev-field-grid"><label>Level<select data-vdev-change-action="evolution.set-level">'+(function(){var html='';for(var l=1;l<=10;l+=1)html+='<option value="'+l+'"'+(l===state.level?' selected':'')+'>Level '+l+'</option>';return html})()+'</select></label><label>XP Preview<input type="number" min="0" value="'+state.xp+'" data-vdev-change-action="evolution.set-xp"></label><label>Outfit<input value="'+esc(state.inventory.outfit)+'" disabled></label><label>Accessory<input value="'+esc(state.inventory.accessory)+'" disabled></label></div><div class="vdev-action-grid">'+buttons.map(function(item){return actionButton(item[0],item[1]);}).join('')+'</div></section></div>';
  }});
})(window);
