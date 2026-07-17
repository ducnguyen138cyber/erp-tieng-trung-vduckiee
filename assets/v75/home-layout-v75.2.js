(function(){
  "use strict";
  function apply(){
    var card=document.querySelector(".home-welcome-card");
    if(!card)return;
    var title=card.querySelector(".home-welcome-copy h1");
    if(title)title.innerHTML="Bắt đầu hành trình<br>cùng VDuckie";
    var style=document.createElement("style");
    style.id="home-layout-v75-2-style";
    style.textContent=[
      ".home-overview-grid{align-items:start}",
      ".home-welcome-card,.home-library-card{min-height:430px!important}",
      ".home-welcome-copy{max-width:68%!important}",
      ".home-welcome-card h1{font-size:clamp(32px,2.7vw,40px)!important;line-height:1.08!important;white-space:nowrap}",
      ".home-welcome-mascot{width:clamp(145px,14vw,180px)!important;right:6px!important;bottom:12px!important}",
      "@media(max-width:1180px){.home-welcome-card h1{font-size:34px!important}.home-welcome-copy{max-width:66%!important}}",
      "@media(max-width:640px){.home-welcome-card h1{font-size:30px!important;white-space:normal}.home-welcome-copy{max-width:72%!important}.home-library-card{min-height:356px!important}}"
    ].join("");
    document.head.appendChild(style);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();