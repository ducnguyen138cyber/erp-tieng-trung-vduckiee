(function(root){
"use strict";
if(root.__VDUCKIE_EXPERIENCE_V86_LOADING__)return;
root.__VDUCKIE_EXPERIENCE_V86_LOADING__=true;
var files=[
  "./assets/v86/home-dashboard-v86.2.js?v=86.2",
  "./assets/v86/home-layout-fix-v86.3.js?v=86.3",
  "./assets/v85/personal-dashboard-v85.js?v=85.1",
  "./assets/v86/premium-learning-v86.js?v=86.2",
  "./assets/v86/adaptive-sync-bridge-v86.js?v=86.2"
];
function load(index){
  if(index>=files.length){root.__VDUCKIE_EXPERIENCE_V86_READY__=true;try{document.dispatchEvent(new CustomEvent("vduckie:experience-v86-ready",{detail:{version:"86.3"}}))}catch(error){}return;}
  var script=document.createElement("script");script.src=files[index];script.onload=function(){load(index+1)};script.onerror=function(){console.error("Không nạp được gói trải nghiệm:",files[index]);load(index+1)};document.head.appendChild(script);
}
if(typeof document!=="undefined")load(0);
})(typeof window!=="undefined"?window:globalThis);