(function(root){
"use strict";
if(root.__VDUCKIE_EXPERIENCE_V86_LOADING__)return;
root.__VDUCKIE_EXPERIENCE_V86_LOADING__=true;
var files=[
  "./assets/v86/home-dashboard-v86.5.js?v=progress-sync1",
  "./assets/v85/personal-dashboard-v85.js?v=progress-row1",
  "./assets/v86/premium-learning-v86.js?v=public1",
  "./assets/v86/adaptive-sync-bridge-v86.js?v=86.2",
  "./assets/v86/home-order-fix-v86.6.js?v=87.5",
  "./assets/v86/mobile-layout-fix-v86.7.js?v=86.7"
];
// Fetch in parallel, but execute in list order so each extension still sees
// the globals created by earlier scripts. No waterfall through 6 network RTTs.
function load(){
  var remaining=files.length;
  function completed(){
    if(--remaining!==0)return;
    root.__VDUCKIE_EXPERIENCE_V86_READY__=true;
    try{document.dispatchEvent(new CustomEvent("vduckie:experience-v86-ready",{detail:{version:"86.7"}}))}catch(error){}
  }
  files.forEach(function(source){
    var script=document.createElement("script");
    script.async=false;
    script.src=source;
    script.onload=completed;
    script.onerror=function(){console.error("Không nạp được gói trải nghiệm:",source);completed();};
    document.head.appendChild(script);
  });
}
if(typeof document!=="undefined")load();
})(typeof window!=="undefined"?window:globalThis);
