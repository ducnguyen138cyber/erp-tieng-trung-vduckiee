(function(root){
  "use strict";
  var VERSION="86.6";
  var timer=0;
  var observer=null;

  function applyOrder(){
    var main=document.getElementById("v865HomeMain");
    if(!main)return false;
    var overview=main.querySelector(":scope > .home-overview-grid");
    var recommended=main.querySelector(":scope > .home-recommended");
    var roadmap=document.getElementById("v865HomeRoadmap");
    var personal=document.getElementById("v85PersonalDashboard");
    var premium=document.getElementById("v86PremiumLearning");

    if(overview)overview.style.order="1";
    if(recommended)recommended.style.order="2";
    if(roadmap){
      roadmap.style.order="3";
      if(recommended&&recommended.nextElementSibling!==roadmap){
        main.insertBefore(roadmap,recommended.nextSibling);
      }
    }
    if(personal){personal.style.order="4";if(personal.parentNode!==main)main.appendChild(personal);}
    if(premium){premium.style.order="5";if(premium.parentNode!==main)main.appendChild(premium);}
    main.setAttribute("data-home-order","overview-recommended-roadmap");
    return Boolean(recommended&&roadmap);
  }

  function schedule(){root.clearTimeout(timer);timer=root.setTimeout(applyOrder,40);}
  function install(){
    var tries=0;
    var interval=root.setInterval(function(){
      tries++;
      if(applyOrder()||tries>60)root.clearInterval(interval);
    },120);
    var home=document.getElementById("homeHub");
    if(home&&root.MutationObserver){
      observer=new root.MutationObserver(schedule);
      observer.observe(home,{childList:true,subtree:true});
    }
    ["vduckie:experience-v86-ready","vduckie:account-learning-synced","vduckie:preference-change","vduckie:learning-change"].forEach(function(name){document.addEventListener(name,schedule)});
  }

  root.VDuckieHomeOrderFixV866={version:VERSION,apply:applyOrder};
  if(typeof document==="undefined")return;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})(typeof window!=="undefined"?window:globalThis);
