(function(root){
  "use strict";

  var VERSION="86.3";
  var observer=null;
  var timer=0;

  function loadCss(){
    if(document.getElementById("v863HomeLayoutCss"))return;
    var link=document.createElement("link");
    link.id="v863HomeLayoutCss";
    link.rel="stylesheet";
    link.href="./assets/v86/home-layout-fix-v86.3.css?v=86.3";
    document.head.appendChild(link);
  }

  function homeIsVisible(){
    var home=document.getElementById("homeHub");
    return Boolean(home&&!home.classList.contains("hidden"));
  }

  function apply(){
    var active=homeIsVisible();
    document.documentElement.classList.toggle("v863-home-mode",active);

    var oldHomeJourney=document.getElementById("homeJourney");
    if(oldHomeJourney){
      oldHomeJourney.classList.add("hidden");
      oldHomeJourney.setAttribute("aria-hidden","true");
    }

    var rail=document.getElementById("studyRail");
    if(rail)rail.setAttribute("aria-hidden",active?"true":"false");

    var roadmap=document.getElementById("v862HomeRoadmap");
    if(roadmap)roadmap.setAttribute("data-layout-version",VERSION);
  }

  function schedule(){
    root.clearTimeout(timer);
    timer=root.setTimeout(apply,40);
  }

  function install(){
    loadCss();
    apply();
    document.addEventListener("click",function(event){
      var button=event.target&&event.target.closest&&event.target.closest("button");
      if(!button)return;
      if(button.hasAttribute("data-home")||button.hasAttribute("data-area")||button.hasAttribute("data-home-area"))root.setTimeout(apply,60);
    },true);

    ["vduckie:experience-v86-ready","vduckie:account-learning-synced","vduckie:hsk-progress-synced"].forEach(function(name){
      document.addEventListener(name,schedule);
    });

    if(root.MutationObserver){
      observer=new root.MutationObserver(schedule);
      var home=document.getElementById("homeHub");
      if(home)observer.observe(home,{attributes:true,attributeFilter:["class"]});
    }
  }

  root.VDuckieHomeLayoutV863={version:VERSION,apply:apply,homeIsVisible:homeIsVisible};
  if(typeof document==="undefined")return;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})(typeof window!=="undefined"?window:globalThis);
