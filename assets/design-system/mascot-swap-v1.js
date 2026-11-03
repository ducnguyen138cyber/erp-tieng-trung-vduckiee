(function(w,d){"use strict";
var asset="./assets/mascot/duckie-reader-2d-v2.webp?v=2.0";
function update(){
  var hero=d.querySelector(".home-welcome-card");
  if(hero&&!hero.querySelector(".home-welcome-mascot")){var img=d.createElement("img");img.className="home-welcome-mascot";img.src=asset;img.alt="Duckie học tiếng Trung";hero.appendChild(img)}
  var selector=[
    ".brand-logo",".menu-signature",".home-welcome-mascot",".duckie-chat-mascot",".duckie-chat-launch img",
    ".home-course-art img",".home-resource-tile img",".home-library-card img",
    ".v865-home-main img[src*='vduckie-']",
    ".v865-home-sidebar img[src*='vduckie-']",
    ".v865-home-shell img[src*='vduckie-']"
  ].join(",");
  d.querySelectorAll(selector).forEach(function(img){
    if(img.tagName!=="IMG")return;
    var role=img.closest('.resource-erp,.course-vocabulary')?'flashcards':img.closest('.resource-hsk,.course-grammar')?'writing':img.closest('.resource-speaking,.course-speaking')?'speaking':img.closest('.resource-road,.course-listening')?'listening':null;
    var target=role?'./assets/mascot/duckie-'+role+'-2d-v3.webp?v=3.0':asset;
    if(!img.dataset.vduckieMascotOriginal)img.dataset.vduckieMascotOriginal=img.getAttribute("src")||"unknown";
    if(img.getAttribute("src")!==target){img.src=target;img.alt=role?'Duckie '+({flashcards:'học thẻ từ',writing:'luyện viết',speaking:'luyện nói',listening:'luyện nghe'}[role]):"Linh vật Duckie đồng hành học tiếng Trung"}
  });
}
var pending=false;function queue(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;update()})}
function mount(){update();new MutationObserver(queue).observe(d.body,{subtree:true,childList:true,attributes:true,attributeFilter:["src"]});}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",mount,{once:true});else mount()
})(window,document);
