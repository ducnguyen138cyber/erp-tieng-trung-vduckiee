(function(w,d){"use strict";
var mascot="./assets/mascot/duckie-explorer-blue.svg?v=1";
function refresh(){
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