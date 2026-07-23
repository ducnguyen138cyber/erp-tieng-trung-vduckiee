(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V108__) return;
  root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V108__ = true;

  var ns = root.VDuckieDeveloper;
  var core = root.VDuckieEXPCore;
  var evolution = root.VDuckieEvolution;
  var DEVELOPER_EMAIL = "ducnguyenn138@gmail.com";
  var authorized = false, currentBridge = null, token = 0, unsubscribeSession = null, offs = [];

  function normalizedEmail(value) { return String(value || "").trim().toLowerCase(); }
  function currentSession() { return core && typeof core.session === "function" ? core.session() : null; }
  function isDeveloper(session) { return !!(session && session.user && normalizedEmail(session.user.email) === DEVELOPER_EMAIL); }
  function purgeLegacy() { if (ns && ns.ui && ns.ui.purgeLegacy) ns.ui.purgeLegacy(); else Array.prototype.forEach.call(document.querySelectorAll("#v93DeveloperPreview,.v93-developer-panel"),function(node){node.remove();}); }
  function ready(bridge) {
    if (!ns || !ns.runtime || !ns.ui) return;
    authorized = true; currentBridge = bridge; ns.runtime.setBridge(bridge); purgeLegacy(); ns.ui.mount(); ns.ui.open();
  }
  function revoke() {
    token += 1; authorized = false;
    if (currentBridge && currentBridge.disable) { try { currentBridge.disable(); } catch (error) {} }
    currentBridge = null;
    if (ns && ns.ui) ns.ui.destroy();
    document.body.classList.remove("dev-center-open");
  }
  function authorize(session) {
    var request = ++token;
    if (!isDeveloper(session) || !evolution || typeof evolution.requestDeveloperBridge !== "function") { revoke(); return Promise.resolve(false); }
    return evolution.requestDeveloperBridge().then(function (bridge) {
      if (request !== token) return false;
      ready(bridge); return true;
    }).catch(function () { if (request === token) revoke(); return false; });
  }
  function onKey(event) {
    if (event.key === "Escape" && authorized && ns.ui && ns.ui.state().open) { event.preventDefault(); event.stopPropagation(); ns.ui.close(); return; }
    if (event.ctrlKey && event.shiftKey && String(event.key).toLowerCase() === "d") { event.preventDefault(); if (authorized) ns.ui.toggle(); else authorize(currentSession()); }
  }
  function animationReport(event) {
    var detail=event.detail||{};if(!ns||!ns.runtime)return;ns.runtime.patch({animation:{current:detail.resolvedState||detail.requestedState||"idle",queue:detail.queueStatus||"empty",cooldown:detail.cooldownStatus||"ready",priority:root.VDuckieMascotStates&&root.VDuckieMascotStates.priorities&&root.VDuckieMascotStates.priorities[detail.resolvedState]||0,duration:Number(detail.duration||0)}},"animation-report");
  }
  function init() {
    if (!ns || !ns.runtime || !ns.ui || !core || !evolution) return;
    purgeLegacy();
    offs.push(ns.runtime.listen(document,"keydown",onKey,true));
    offs.push(ns.runtime.listen(document,"vduckie:developer-animation-test",animationReport));
    if (typeof core.onSession === "function") unsubscribeSession = core.onSession(authorize);
    root.addEventListener("online",function(){if(!authorized)authorize(currentSession());});
    document.addEventListener("visibilitychange",function(){if(!document.hidden&&!authorized)authorize(currentSession());});
    if (!unsubscribeSession) authorize(currentSession());
  }
  function destroy() { if(unsubscribeSession)unsubscribeSession();unsubscribeSession=null;offs.forEach(function(off){off();});offs.length=0;revoke();if(ns&&ns.runtime)ns.runtime.destroy(); }

  root.VDuckieDeveloperControlCenter=Object.freeze({version:"108.0",open:function(){if(authorized)ns.ui.open();else authorize(currentSession());},close:function(){if(ns&&ns.ui)ns.ui.close();},destroy:destroy,isAuthorized:function(){return authorized;}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
