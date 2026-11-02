(function(w,d){"use strict";
var mascot="./assets/mascot/duckie-explorer-blue.svg?v=1";
function refresh(){
 var hero=d.querySelector(".home-welcome-card");
 if(hero&&!hero.querySelector(".home-welcome-mascot")){var image=d.createElement("img");image.className="home-welcome-mascot";image.src=mascot;image.alt="Duckie đội mũ, đeo ba lô và ôm sách tiếng Trung";hero.appendChild(image)}
 for(var selector of [".duckie-chat-mascot",".duckie-chat-launch img",".home-welcome-mascot"]){
  var el=d.querySelector(selector);
  if(el&&el.tagName==="IMG"&&el.getAttribute("src")!==mascot){
   el.src=mascot;
   if(selector===".home-welcome-mascot")el.alt="Duckie đội mũ, đeo ba lô và ôm sách tiếng Trung";
  }
 }
}
function start(){refresh();var obs=new MutationObserver(function(){refresh()});obs.observe(d.body,{childList:true,subtree:true});}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);