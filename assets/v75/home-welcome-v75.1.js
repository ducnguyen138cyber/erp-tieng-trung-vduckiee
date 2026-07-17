(function(){
  "use strict";

  function applyHomeWelcomeUpdate(){
    var card=document.querySelector(".home-welcome-card");
    if(!card)return;

    var description=card.querySelector(".home-welcome-copy > p");
    var erpButton=card.querySelector(".home-secondary-action");

    if(description){
      description.textContent="Bạn là một người mới chưa biết bắt đầu học tiếng Trung từ đâu? Hãy chọn “Bắt đầu học HSK” để học từ số 0; nếu cần tiếng Trung cho công việc, chọn “Học từ vựng ERP”.";
    }

    if(erpButton){
      erpButton.textContent="Học từ vựng ERP";
    }

    if(!document.getElementById("home-welcome-v75-1-style")){
      var style=document.createElement("style");
      style.id="home-welcome-v75-1-style";
      style.textContent=[
        ".home-welcome-card h1{font-family:\"Segoe UI\",Arial,sans-serif!important;font-size:clamp(31px,2.8vw,38px)!important;font-weight:800!important;line-height:1.12!important;letter-spacing:-.025em!important;text-wrap:balance}",
        ".home-welcome-card p{font-family:\"Segoe UI\",Arial,sans-serif;font-size:15px;line-height:1.55}",
        ".home-card-kicker,.home-welcome-actions button{font-family:\"Segoe UI\",Arial,sans-serif!important}",
        "@media(max-width:640px){.home-welcome-card h1{font-size:32px!important;line-height:1.12!important}.home-welcome-card p{font-size:14px;line-height:1.5}.home-welcome-copy{max-width:72%}}"
      ].join("");
      document.head.appendChild(style);
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",applyHomeWelcomeUpdate,{once:true});
  }else{
    applyHomeWelcomeUpdate();
  }
})();