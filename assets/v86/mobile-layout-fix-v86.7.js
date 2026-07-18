(function(root){
  "use strict";
  var VERSION="86.7";
  var MOBILE_MAX=860;
  var html=document.documentElement;
  var resizeTimer=0;

  function isHomeVisible(){
    var home=document.getElementById("homeHub");
    return Boolean(home&&!home.classList.contains("hidden"));
  }
  function isMobile(){return root.innerWidth<=MOBILE_MAX;}
  function syncMode(){
    var active=isMobile()&&isHomeVisible();
    html.classList.toggle("v867-mobile-home",active);
    if(!active)html.classList.remove("v867-menu-open");
  }
  function isStudyToggle(button){
    if(!button)return false;
    if(button.matches('[data-study-menu-toggle],[data-mobile-study-toggle],#studyMenuToggle,#mobileStudyToggle'))return true;
    return /học tập/i.test((button.textContent||"").replace(/\s+/g," ").trim());
  }
  function closeMenu(){html.classList.remove("v867-menu-open");}
  function bind(){
    document.addEventListener("click",function(event){
      var button=event.target&&event.target.closest&&event.target.closest("button");
      if(isStudyToggle(button)&&isMobile()){
        root.setTimeout(function(){html.classList.toggle("v867-menu-open");},0);
        return;
      }
      if(html.classList.contains("v867-menu-open")){
        var sidebar=event.target&&event.target.closest&&event.target.closest(".study-sidebar");
        if(!sidebar||event.target.closest("[data-home],[data-area],[data-home-area]"))closeMenu();
      }
    },true);
    root.addEventListener("resize",function(){root.clearTimeout(resizeTimer);resizeTimer=root.setTimeout(syncMode,80);});
    root.addEventListener("orientationchange",function(){root.setTimeout(syncMode,120);});
    ["vduckie:experience-v86-ready","hashchange"].forEach(function(name){root.addEventListener(name,syncMode);});
    document.addEventListener("click",function(event){if(event.target&&event.target.closest&&event.target.closest("[data-home],[data-area],[data-home-area]"))root.setTimeout(syncMode,50);});
  }
  function injectStyle(){
    if(document.getElementById("v867MobileLayoutStyle"))return;
    var style=document.createElement("style");
    style.id="v867MobileLayoutStyle";
    style.textContent=[
      "@media(max-width:860px){",
      "html.v867-mobile-home,html.v867-mobile-home body{min-height:0!important}",
      "html.v867-mobile-home .study-layout{display:block!important;min-height:0!important;height:auto!important;padding-top:0!important;margin-top:0!important}",
      "html.v867-mobile-home .study-center{display:block!important;width:100%!important;min-height:0!important;height:auto!important;margin:0!important;padding-top:0!important;grid-column:auto!important}",
      "html.v867-mobile-home #homeHub{min-height:0!important;height:auto!important;margin-top:0!important;padding-top:0!important}",
      "html.v867-mobile-home #v865HomeShell{min-height:0!important;height:auto!important;margin-top:0!important;padding-top:0!important}",
      "html.v867-mobile-home .v865-home-main{min-height:0!important;margin-top:0!important;padding-top:0!important}",
      "html.v867-mobile-home .study-sidebar{display:none!important;position:fixed!important;left:14px!important;right:14px!important;top:96px!important;bottom:14px!important;width:auto!important;height:auto!important;max-height:calc(100vh - 110px)!important;margin:0!important;padding:14px!important;overflow:auto!important;z-index:9999!important;border-radius:20px!important;background:#fffdf9!important;box-shadow:0 22px 70px rgba(20,45,38,.24)!important}",
      "html.v867-mobile-home.v867-menu-open .study-sidebar{display:block!important}",
      "html.v867-mobile-home.v867-menu-open:before{content:'';position:fixed;inset:0;background:rgba(20,39,34,.28);z-index:9998}",
      "html.v867-mobile-home .home-overview-grid{margin-top:0!important}",
      "html.v867-mobile-home .v865-home-shell{gap:12px!important}",
      "}",
      "@media(max-width:620px){",
      "html.v867-mobile-home .app-header,html.v867-mobile-home .topbar{margin-bottom:0!important}",
      "html.v867-mobile-home .v865-home-main>.home-overview-grid{gap:12px!important}",
      "}"
    ].join("");
    document.head.appendChild(style);
  }
  function install(){injectStyle();bind();syncMode();root.setTimeout(syncMode,250);}

  root.VDuckieMobileLayoutFixV867={version:VERSION,sync:syncMode,close:closeMenu};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})(typeof window!=="undefined"?window:globalThis);
