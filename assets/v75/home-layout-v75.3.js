(function(){
  "use strict";

  function apply(){
    var card=document.querySelector(".home-welcome-card");
    if(!card)return;

    var title=card.querySelector(".home-welcome-copy h1");
    if(title)title.innerHTML="Bắt đầu hành trình<br>cùng VDuckie";

    if(document.getElementById("home-layout-v75-3-style"))return;

    var style=document.createElement("style");
    style.id="home-layout-v75-3-style";
    style.textContent=[
      ".home-overview-grid{align-items:start}",
      ".home-welcome-card,.home-library-card{min-height:430px!important}",
      ".home-welcome-card{--welcome-mascot-space:clamp(170px,35%,205px)}",
      ".home-welcome-copy{display:grid!important;grid-template-columns:minmax(0,1fr) var(--welcome-mascot-space);grid-template-rows:auto auto minmax(0,1fr) auto;column-gap:18px;width:100%;max-width:none!important;align-self:stretch}",
      ".home-welcome-copy>.home-card-kicker{grid-column:1/-1;grid-row:1}",
      ".home-welcome-card h1{grid-column:1/-1;grid-row:2;max-width:100%;font-size:clamp(32px,2.7vw,40px)!important;line-height:1.08!important;white-space:normal!important;text-wrap:balance}",
      ".home-welcome-card p{grid-column:1;grid-row:3;min-width:0;padding-right:4px;overflow-wrap:anywhere}",
      ".home-welcome-actions{grid-column:1;grid-row:4;min-width:0;width:100%}",
      ".home-welcome-mascot{width:clamp(145px,14vw,180px)!important;right:6px!important;bottom:12px!important}",
      "@media(max-width:1180px){.home-welcome-card{--welcome-mascot-space:clamp(165px,33%,190px)}.home-welcome-card h1{font-size:34px!important}}",
      "@media(max-width:640px){.home-welcome-card{--welcome-mascot-space:clamp(135px,34%,160px)}.home-welcome-copy{column-gap:14px}.home-welcome-card h1{font-size:30px!important}.home-welcome-mascot{width:clamp(120px,30vw,145px)!important;right:2px!important}.home-library-card{min-height:356px!important}}",
      "@media(max-width:460px){.home-welcome-card{--welcome-mascot-space:118px}.home-welcome-copy{column-gap:12px}.home-welcome-card h1{font-size:27px!important}.home-welcome-card p{font-size:13px!important}.home-welcome-mascot{width:108px!important;right:0!important;bottom:52px!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",apply,{once:true});
  }else{
    apply();
  }
})();
