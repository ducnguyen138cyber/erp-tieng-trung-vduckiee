(function (root) {
  "use strict";
  var ns=root.VDuckieDeveloper;if(!ns||!ns.actions)return;var runtime=ns.runtime,actions=ns.actions,esc=ns.util.esc;
  ns.tabs=ns.tabs||Object.create(null);ns.tabOrder=ns.tabOrder||[];
  function detail(key,title,content){return '<details data-vdev-debug-key="'+key+'"><summary>'+esc(title)+'</summary><div class="vdev-debug-body"><pre>'+esc(content)+'</pre><button type="button" class="vdev-debug-copy" data-vdev-copy-debug>Copy</button></div></details>';}
  if(!ns.tabs.debug){ns.tabs.debug={id:"debug",icon:"🛠",label:"Debug",render:function(state){
    var m=runtime.metrics(),manifest=root.VDuckieMascotManifest||{},polish=root.VDuckiePolishV106&&root.VDuckiePolishV106.getState?root.VDuckiePolishV106.getState():{};
    var renderer={currentState:m.currentState,resolvedState:m.resolvedState,spriteLoaded:m.spriteLoaded,frame:m.frame,fallback:m.fallback};
    var resolver={sprite:m.sprite,fallback:m.fallback,loadedAssets:m.loadedAssets,preloadedImages:m.preloadedImages};
    var queue=actions.logs().slice(0,20).map(function(entry){return entry.at+" ["+entry.kind+"] "+entry.message;}).join("\n")||"Trống";
    return '<p class="vdev-note">Debug mặc định đóng. Chỉ mở phần cần kiểm tra.</p><div class="vdev-debug-accordion">'+
      detail("runtime-state","Runtime State",JSON.stringify(state,null,2))+
      detail("renderer-lifecycle","Renderer Lifecycle",JSON.stringify(renderer,null,2))+
      detail("asset-runtime","Asset Resolver",JSON.stringify(resolver,null,2))+
      detail("asset-manifest","Manifest",JSON.stringify({version:manifest.version,levels:manifest.levels&&Object.keys(manifest.levels).length,states:manifest.states},null,2))+
      detail("animation-queue","Animation Queue",JSON.stringify(state.animation,null,2))+
      detail("event-queue","Event Queue",queue)+
      detail("timers","Timers",JSON.stringify({current:m.currentTimer},null,2))+
      detail("listeners","Listeners",JSON.stringify({current:m.currentListener},null,2))+
      detail("raw-json","Raw JSON",JSON.stringify({previewState:state,metrics:m,v106:polish},null,2))+
      '</div>';
  }};ns.tabOrder.push("debug");}
})(window);
