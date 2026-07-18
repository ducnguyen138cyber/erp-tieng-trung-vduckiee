(function(root){
  "use strict";

  if(root.__VDUCKIE_LAYOUT_STABILITY_V872__)return;
  root.__VDUCKIE_LAYOUT_STABILITY_V872__=true;

  var html=document.documentElement;
  var running=false;
  var runToken=0;
  var fallbackTimer=0;

  function frame(callback){
    return (root.requestAnimationFrame||function(next){return root.setTimeout(next,16)})(callback);
  }

  function homeVisible(){
    var home=document.getElementById("homeHub");
    return Boolean(home&&!home.classList.contains("hidden"));
  }

  function directChild(parent,node){
    return Boolean(parent&&node&&node.parentNode===parent);
  }

  function finalLayoutReady(){
    var shell=document.getElementById("v865HomeShell");
    var main=document.getElementById("v865HomeMain");
    var sidebar=document.getElementById("v865HomeSidebar");
    var overview=document.querySelector(".home-overview-grid");
    var recommended=document.querySelector(".home-recommended");
    var roadmap=document.getElementById("v865HomeRoadmap");
    var personal=document.getElementById("v85PersonalDashboard");
    var premium=document.getElementById("v86PremiumLearning");
    return Boolean(
      shell&&shell.getAttribute("data-layout-version")==="86.5"&&
      directChild(main,overview)&&directChild(main,recommended)&&directChild(main,roadmap)&&
      directChild(main,personal)&&directChild(main,premium)&&
      sidebar&&sidebar.querySelectorAll(".v865-side-card").length>=3&&
      html.classList.contains("v865-home-mode")
    );
  }

  function layoutSignature(){
    var selectors=["#homeHub","#v865HomeShell","#v865HomeMain","#v865HomeSidebar",".home-overview-grid",".home-welcome-card"];
    return selectors.map(function(selector){
      var node=document.querySelector(selector);
      if(!node)return "missing";
      var rect=node.getBoundingClientRect();
      return [rect.x,rect.y,rect.width,rect.height].map(function(value){return Math.round(value*10)}).join(":");
    }).join("|");
  }

  function reveal(){
    runToken++;
    running=false;
    root.clearTimeout(root.__VDUCKIE_LAYOUT_FAILSAFE__);
    root.clearTimeout(fallbackTimer);
    html.classList.remove("vduckie-layout-booting");
    html.classList.add("vduckie-layout-ready");
  }

  function settle(){
    if(running)return;
    if(!homeVisible()){
      reveal();
      return;
    }

    running=true;
    var token=++runToken;
    var started=Date.now();
    var rendererRequested=false;
    var stableFrames=0;
    var previous="";

    function check(){
      if(token!==runToken)return;
      if(!homeVisible()){
        reveal();
        return;
      }

      var dashboard=root.VDuckieHomeDashboardV865;
      if(!rendererRequested&&dashboard&&typeof dashboard.render==="function"){
        rendererRequested=true;
        dashboard.render();
        if(root.VDuckieHomeOrderFixV866&&typeof root.VDuckieHomeOrderFixV866.apply==="function")root.VDuckieHomeOrderFixV866.apply();
      }

      if(finalLayoutReady()){
        var current=layoutSignature();
        stableFrames=current===previous?stableFrames+1:0;
        previous=current;
        if(stableFrames>=6){
          reveal();
          return;
        }
      }else{
        stableFrames=0;
        previous="";
      }

      if(Date.now()-started<4500)frame(check);
      else reveal();
    }

    frame(check);
  }

  function begin(){
    runToken++;
    running=false;
    root.clearTimeout(fallbackTimer);
    html.classList.remove("vduckie-layout-ready");
    html.classList.add("v865-home-mode","vduckie-layout-booting");
    fallbackTimer=root.setTimeout(reveal,4700);
    root.setTimeout(settle,0);
  }

  document.addEventListener("vduckie:experience-v86-ready",settle);
  document.addEventListener("click",function(event){
    var target=event.target&&event.target.closest&&event.target.closest("[data-home],#brandHome");
    if(target&&!homeVisible())begin();
  },true);
  root.addEventListener("load",settle,{once:true});
  root.setTimeout(settle,0);
})(typeof window!=="undefined"?window:globalThis);
