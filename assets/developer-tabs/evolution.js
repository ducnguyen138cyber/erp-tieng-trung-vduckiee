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
  bridgeAction("evolution.streak-lost","Streak Lost","streak-lost","streak"); bridgeAction("evolution.egg-hatching","Hatching","egg-hatching","unlock");
  bridgeAction("evolution.outfit-change","Outfit Change","outfit-change","unlock");
  actions.register({id:"evolution.thought",tab:"evolution",label:"Thought Bubble",keywords:["bubble","thought"],run:function(ctx){if(ctx.bridge){ctx.bridge.enable(ctx.state.level);ctx.bridge.test("thought");}}});
  actions.register({id:"evolution.replay",tab:"evolution",label:"Replay",keywords:["replay","current"],favorite:true,run:function(){return actions.replay(actions.history()[1]||null);}});
  function button(id,label){return '<button type="button" data-vdev-action="'+id+'">'+esc(label)+'</button>';}
  registerTab({id:"evolution",icon:"🦆",label:"Evolution",render:function(state){
    var renderer=root.VDuckieMascot;
    var mascot=renderer&&renderer.render?renderer.render({level:state.level,animationState:"idle",size:"large",previewMode:true,allowIncompatible:true,selectedItems:state.inventory}):'<p>Renderer chưa sẵn sàng.</p>';
    var options=""; for(var level=1;level<=10;level+=1) options+='<option value="'+level+'"'+(level===state.level?' selected':'')+'>Level '+level+'</option>';
    return '<div class="dev-center-two-column"><section class="dev-center-preview" data-dev-single-preview>'+mascot+'<div class="dev-center-stat-row"><span>Level <b>'+state.level+'</b></span><span>Outfit <b>'+esc(state.inventory.outfit)+'</b></span><span>Accessory <b>'+esc(state.inventory.accessory)+'</b></span></div></section><section><div class="dev-center-field-grid"><label>Level preview<select data-vdev-change-action="evolution.set-level">'+options+'</select></label><label>XP Preview<input type="number" min="0" value="'+state.xp+'" data-vdev-change-action="evolution.set-xp"></label></div><div class="dev-center-action-grid">'+[["evolution.egg-hatching","Hatching"],["evolution.thought","Thought Bubble"],["evolution.level-up","Level Up"],["evolution.outfit-change","Outfit Change"],["evolution.replay","Replay"]].map(function(item){return button(item[0],item[1]);}).join("")+'</div></section></div>';
  }});
})(window);
