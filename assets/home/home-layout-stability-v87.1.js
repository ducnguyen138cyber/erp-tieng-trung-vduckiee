(function(root){
  "use strict";

  if(root.__VDUCKIE_LAYOUT_STABILITY_V871__)return;
  root.__VDUCKIE_LAYOUT_STABILITY_V871__=true;

  var html=document.documentElement;
  var waiting=false;
  var fallbackTimer=0;

  function frame(callback){
    return (root.requestAnimationFrame||function(next){return root.setTimeout(next,0)})(callback);
  }

  function finalLayoutReady(){
    var shell=document.getElementById("v865HomeShell");
    var main=document.getElementById("v865HomeMain");
    var sidebar=document.getElementById("v865HomeSidebar");
    return Boolean(
      shell&&shell.getAttribute("data-layout-version")==="86.5"&&
      main&&main.querySelector(":scope > .home-overview-grid")&&
      sidebar&&sidebar.querySelectorAll(".v865-side-card").length>=3&&
      html.classList.contains("v865-home-mode")
    );
  }

  function reveal(){
    root.clearTimeout(root.__VDUCKIE_LAYOUT_FAILSAFE__);
    root.clearTimeout(fallbackTimer);
    waiting=false;
    frame(function(){
      frame(function(){
        html.classList.remove("vduckie-layout-booting");
        html.classList.add("vduckie-layout-ready");
      });
    });
  }

  function waitForFinalLayout(){
    if(waiting)return;
    waiting=true;
    var attempts=0;
    function check(){
      attempts++;
      var api=root.VDuckieHomeDashboardV865;
      if(api&&typeof api.render==="function")api.render();
      if(finalLayoutReady()){
        root.setTimeout(reveal,100);
        return;
      }
      if(attempts<60){
        root.setTimeout(check,50);
      }else{
        reveal();
      }
    }
    check();
  }

  function begin(){
    root.clearTimeout(fallbackTimer);
    html.classList.remove("vduckie-layout-ready");
    html.classList.add("vduckie-layout-booting");
    waiting=false;
    fallbackTimer=root.setTimeout(reveal,3200);
    root.setTimeout(waitForFinalLayout,0);
  }

  document.addEventListener("vduckie:experience-v86-ready",waitForFinalLayout,{once:true});
  document.addEventListener("click",function(event){
    var target=event.target&&event.target.closest&&event.target.closest("[data-home],#brandHome");
    if(target)begin();
  },true);
  root.addEventListener("load",waitForFinalLayout,{once:true});
  if(root.__VDUCKIE_EXPERIENCE_V86_READY__)waitForFinalLayout();
})(typeof window!=="undefined"?window:globalThis);
