(function(root,document){
  "use strict";
  if(root.__VDUCKIE_ACCOUNT_DROPDOWN_V91__)return;
  root.__VDUCKIE_ACCOUNT_DROPDOWN_V91__=true;
  var trigger,dropdown,modal,account,observer,lastFocus;
  function byId(id){return document.getElementById(id)}
  function esc(value){return String(value||"").replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]})}
  function cleanText(node){return String(node&&node.textContent||"").replace(/\s+/g," ").trim()}
  function session(){var core=root.VDuckieEXPCore;return core&&typeof core.session==="function"?core.session():null}
  function userMeta(){var s=session(),core=root.VDuckieEXPCore;if(!s||!s.user)return null;return core&&core.userMeta?core.userMeta(s.user):{name:(s.user.user_metadata&&s.user.user_metadata.full_name)||s.user.email||"Người học",avatar:s.user.user_metadata&&s.user.user_metadata.avatar_url,email:s.user.email||""}}
  function totalEXP(){var text=account&&account.textContent||"",m=text.match(/·\s*([\d.,]+)\s*EXP/i);return m?Number(m[1].replace(/\./g,"").replace(/,/g,""))||0:0}
  function levelData(){var core=root.VDuckieEXPCore,total=totalEXP();return core&&core.calculateUserLevel?core.calculateUserLevel(total):{level:1,totalEXP:total,currentLevelEXP:total,expRequired:100,progressPercent:Math.min(100,total)}}
  function isLearningSidebar(node){return !!(node&&node.closest&&node.closest("#studySidebar,.study-sidebar"))}
  function hasLegacyLabels(node){
    if(!node||isLearningSidebar(node))return false;
    var wanted={"Trang chủ":0,"Từ điển":0,"HSK":0,"ERP":0,"Xếp hạng":0};
    var controls=node.querySelectorAll("button,a,[role='button'],[role='menuitem']");
    for(var i=0;i<controls.length;i++){var text=cleanText(controls[i]);if(Object.prototype.hasOwnProperty.call(wanted,text))wanted[text]=1}
    return wanted["Trang chủ"]&&wanted["Từ điển"]&&wanted.HSK&&wanted.ERP&&wanted["Xếp hạng"]
  }
  function removeMiddleMenu(){
    var selectors="nav,[role='navigation'],[data-header-nav],.header-nav,.main-nav,.top-nav,.v90-header-nav,.v865-header-nav,.v865-top-nav,.header-menu,.main-menu,.top-menu";
    Array.prototype.slice.call(document.querySelectorAll(selectors)).forEach(function(node){if(hasLegacyLabels(node)){node.classList.add("v91-removed-header-menu");node.remove()}});
    var controls=document.querySelectorAll("button,a,[role='button']");
    for(var i=0;i<controls.length;i++){
      var text=cleanText(controls[i]);
      if(text!=="Trang chủ"&&text!=="Từ điển"&&text!=="HSK"&&text!=="ERP"&&text!=="Xếp hạng")continue;
      if(isLearningSidebar(controls[i]))continue;
      var node=controls[i].parentElement,depth=0;
      while(node&&node!==document.body&&depth<6){
        if(hasLegacyLabels(node)){node.classList.add("v91-removed-header-menu");node.remove();break}
        if(node.classList&&node.classList.contains("shell"))break;
        node=node.parentElement;depth++
      }
    }
  }
  function close(){if(!trigger||!dropdown)return;trigger.setAttribute("aria-expanded","false");dropdown.classList.remove("is-open")}
  function open(){if(!trigger||!dropdown)return;syncSummary();trigger.setAttribute("aria-expanded","true");dropdown.classList.add("is-open");var first=dropdown.querySelector('[role="menuitem"]');if(first)first.focus()}
  function toggle(){trigger.getAttribute("aria-expanded")==="true"?close():open()}
  function summaryMarkup(){var meta=userMeta(),level=levelData(),avatar=account&&account.querySelector(".v90-header-avatar");return '<div class="v91-account-summary">'+(avatar?avatar.outerHTML:'<span class="v90-header-avatar" aria-hidden="true">'+esc((meta&&meta.name||"N").charAt(0))+'</span>')+'<div class="v91-account-summary-copy"><strong title="'+esc(meta&&meta.name||"Người học")+'">'+esc(meta&&meta.name||"Người học")+'</strong><span>Level '+level.level+' · '+level.totalEXP+' EXP</span><div class="v90-header-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+level.expRequired+'" aria-valuenow="'+level.currentLevelEXP+'"><i style="width:'+level.progressPercent+'%"></i></div></div></div>'}
  function syncSummary(){var host=byId("v91AccountSummary");if(host)host.innerHTML=summaryMarkup()}
  function goPersonal(){var target=document.querySelector('[data-view="personal"]');if(target)target.click()}
  function goContinue(){var c=document.querySelector('.v865-continue-card button,.v865-continue-card [role="button"]');if(c){c.click();return}var area=localStorage.getItem("vduckie-last-area"),view=localStorage.getItem("vduckie-last-view");if(area==="erp"&&view){var t=document.querySelector('[data-view="'+view.replace(/[^a-z-]/gi,"")+'"]');if(t){t.click();return}}if(root.ERPAreaNavigation&&root.ERPAreaNavigation.home)root.ERPAreaNavigation.home();var rail=byId("homeJourney");if(rail)rail.scrollIntoView({behavior:"smooth",block:"start"})}
  function knownCount(){try{return Object.keys(JSON.parse(localStorage.getItem("erp-lite-known")||"{}")).length}catch(e){return 0}}
  function savedCount(){try{return JSON.parse(localStorage.getItem("erp-lite-personal")||"[]").length||0}catch(e){return 0}}
  function showModal(title,html){lastFocus=document.activeElement;byId("v91ModalTitle").textContent=title;byId("v91ModalBody").innerHTML=html;modal.hidden=false;document.body.style.overflow="hidden";byId("v91ModalClose").focus()}
  function hideModal(){if(!modal||modal.hidden)return;modal.hidden=true;document.body.style.overflow="";if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function showAchievements(){var l=levelData();showModal("Thành tích cá nhân",'<div class="v91-stat-grid"><div class="v91-stat"><strong>'+l.totalEXP+'</strong><span>Tổng EXP</span></div><div class="v91-stat"><strong>Level '+l.level+'</strong><span>Cấp độ hiện tại</span></div><div class="v91-stat"><strong>'+knownCount()+'</strong><span>Từ đã thuộc</span></div><div class="v91-stat"><strong>'+savedCount()+'</strong><span>Từ đã lưu</span></div></div>')}
  function showEXP(){var l=levelData(),need=Math.max(0,l.expRequired-l.currentLevelEXP);showModal("EXP và cấp độ",'<div class="v91-stat-grid"><div class="v91-stat"><strong>'+l.totalEXP+'</strong><span>Tổng EXP</span></div><div class="v91-stat"><strong>Level '+l.level+'</strong><span>Cấp độ hiện tại</span></div><div class="v91-stat"><strong>'+l.currentLevelEXP+'</strong><span>EXP trong level này</span></div><div class="v91-stat"><strong>'+need+'</strong><span>EXP cần để lên level tiếp</span></div></div>')}
  function showAccount(){var meta=userMeta()||{},avatar=meta.avatar?'<img src="'+esc(meta.avatar)+'" alt="" referrerpolicy="no-referrer">':'<span class="v90-header-avatar">'+esc((meta.name||"N").charAt(0))+'</span>';showModal("Thông tin tài khoản",'<div class="v91-profile">'+avatar+'<div><strong>'+esc(meta.name||"Người học")+'</strong><span>'+esc(meta.email||"")+'</span></div></div>')}
  function logout(){var old=byId("cloudLogout");if(old)old.click()}
  function build(){removeMiddleMenu();account=byId("expHeaderAccount");var host=account&&account.parentNode;if(!account||!host)return false;if(trigger&&trigger.isConnected)return true;trigger=document.createElement("button");trigger.type="button";trigger.className="v91-account-trigger";trigger.setAttribute("aria-haspopup","menu");trigger.setAttribute("aria-expanded","false");trigger.setAttribute("aria-label","Mở menu tài khoản");account.parentNode.insertBefore(trigger,account);trigger.appendChild(account);var chev=document.createElement("span");chev.className="v91-account-chevron";chev.setAttribute("aria-hidden","true");chev.textContent="⌄";trigger.appendChild(chev);dropdown=document.createElement("div");dropdown.className="v91-account-dropdown";dropdown.setAttribute("role","menu");dropdown.innerHTML='<div id="v91AccountSummary"></div><div class="v91-account-divider"></div><button class="v91-account-item" role="menuitem" data-action="continue">Tiếp tục học</button><button class="v91-account-item" role="menuitem" data-action="personal">Từ điển cá nhân</button><button class="v91-account-item" role="menuitem" data-action="achievements">Thành tích cá nhân</button><button class="v91-account-item" role="menuitem" data-action="exp">EXP và cấp độ</button><button class="v91-account-item" role="menuitem" data-action="account">Thông tin tài khoản</button><div class="v91-account-divider"></div><button class="v91-account-item is-danger" role="menuitem" data-action="logout">Đăng xuất</button>';host.appendChild(dropdown);syncSummary();return true}
  function bind(){document.addEventListener("click",function(e){if(trigger&&e.target.closest&&e.target.closest(".v91-account-trigger")){e.preventDefault();toggle();return}var item=e.target.closest&&e.target.closest(".v91-account-item");if(item){var action=item.getAttribute("data-action");close();if(action==="continue")goContinue();else if(action==="personal")goPersonal();else if(action==="achievements")showAchievements();else if(action==="exp")showEXP();else if(action==="account")showAccount();else if(action==="logout")logout();return}if(dropdown&&!e.target.closest(".v91-account-dropdown"))close();if(modal&&!modal.hidden&&e.target===modal)hideModal()});document.addEventListener("keydown",function(e){if(e.key==="Escape"){close();hideModal()}if(trigger&&document.activeElement===trigger&&(e.key==="Enter"||e.key===" ")){e.preventDefault();toggle()}});document.addEventListener("vduckie:exp-updated",function(){build();syncSummary()});document.addEventListener("vduckie:my-exp-loaded",function(){build();syncSummary()});document.addEventListener("vduckie:exp-session",function(){setTimeout(function(){build();syncSummary();if(!session())close()},0)})}
  function init(){var brand=byId("brandHome");if(brand)brand.setAttribute("aria-label","Về trang chủ");modal=document.createElement("div");modal.id="v91AccountModal";modal.className="v91-account-modal";modal.hidden=true;modal.innerHTML='<section class="v91-account-modal-card" role="dialog" aria-modal="true" aria-labelledby="v91ModalTitle"><div class="v91-modal-head"><h2 id="v91ModalTitle"></h2><button id="v91ModalClose" class="v91-modal-close" type="button" aria-label="Đóng">×</button></div><div id="v91ModalBody" class="v91-modal-body"></div></section>';document.body.appendChild(modal);byId("v91ModalClose").onclick=hideModal;bind();build();observer=new MutationObserver(function(){removeMiddleMenu();if(!trigger||!trigger.isConnected)build()});observer.observe(document.body,{childList:true,subtree:true});setTimeout(build,120);setTimeout(build,700);setTimeout(removeMiddleMenu,1500)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);