(function(root,document){
  "use strict";
  if(root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V107__)return;root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V107__=true;
  var ns=root.VDuckieDeveloper,authorized=false,authorizationToken=0,offs=[];
  function ready(bridge){if(!ns||!ns.runtime||!ns.ui)return;authorized=true;ns.runtime.setBridge(bridge);document.body.classList.add("vdev-center-ready");ns.ui.mount();ns.ui.open();ns.runtime.emit("toast",{message:"Developer Control Center V107 đã sẵn sàng.",tone:"good"})}
  function request(){var evolution=root.VDuckieEvolution;if(!evolution||typeof evolution.requestDeveloperBridge!=="function")return;var token=++authorizationToken;evolution.requestDeveloperBridge().then(function(bridge){if(token!==authorizationToken)return;ready(bridge)}).catch(function(){authorized=false})}
  function revoke(){authorizationToken+=1;authorized=false;document.body.classList.remove("vdev-center-ready");if(ns&&ns.ui)ns.ui.close()}
  function onKey(event){if(event.key==="Escape"&&authorized){ns.ui.close();return}if(event.ctrlKey&&event.shiftKey&&String(event.key).toLowerCase()==="d"){event.preventDefault();if(authorized)ns.ui.toggle();else request()}}
  function animationReport(event){var detail=event.detail||{};if(!ns||!ns.runtime)return;ns.runtime.patch({animation:{current:detail.resolvedState||detail.requestedState||"idle",queue:detail.queueStatus||"empty",cooldown:detail.cooldownStatus||"ready",priority:root.VDuckieMascotStates&&root.VDuckieMascotStates.priorities&&root.VDuckieMascotStates.priorities[detail.resolvedState]||0,duration:Number(detail.duration||0)}},"animation-report")}
  function init(){if(!ns)return;offs.push(ns.runtime.listen(document,"keydown",onKey,true));offs.push(ns.runtime.listen(document,"vduckie:developer-animation-test",animationReport));offs.push(ns.runtime.listen(document,"vduckie:developer-preview-authorized",request));offs.push(ns.runtime.listen(document,"vduckie:developer-preview-revoked",revoke));if(document.getElementById("v93DeveloperPreview"))request();else root.setTimeout(request,120)}
  function destroy(){offs.forEach(function(off){off()});offs.length=0;if(ns&&ns.ui)ns.ui.destroy();revoke()}
  root.VDuckieDeveloperControlCenter=Object.freeze({version:"107.0",open:function(){if(authorized)ns.ui.open();else request()},close:function(){if(ns&&ns.ui)ns.ui.close()},destroy:destroy,isAuthorized:function(){return authorized}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
