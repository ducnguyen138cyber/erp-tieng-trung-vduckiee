(function(root){
  "use strict";

  var BASE_DICTIONARY_COUNT=1885;
  var HSK_QUIZ_QUESTION_COUNT=195;

  function setTile(selector,value,label){
    var tile=document.querySelector(selector);
    if(!tile)return;
    var strong=tile.querySelector("strong");
    var span=tile.querySelector("span");
    if(strong)strong.textContent=value;
    if(span)span.textContent=label;
  }

  function dictionaryCount(){
    var records=root.VDuckieDictionary&&root.VDuckieDictionary.records;
    var actual=Array.isArray(records)?records.length:0;
    return Math.max(BASE_DICTIONARY_COUNT,actual);
  }

  function apply(){
    var brandTitle=document.getElementById("brandTitle");
    var brandSubtitle=document.getElementById("brandSubtitle");
    var brandHome=document.getElementById("brandHome");
    if(brandTitle)brandTitle.textContent="Tự học tiếng Trung cùng VDuckie";
    if(brandSubtitle){
      brandSubtitle.textContent="";
      brandSubtitle.hidden=true;
      brandSubtitle.setAttribute("aria-hidden","true");
    }
    if(brandHome)brandHome.setAttribute("aria-label","Tự học tiếng Trung cùng VDuckie");

    setTile(".home-resource-tile.resource-erp",dictionaryCount()+"+","Từ vựng");
    setTile(".home-resource-tile.resource-roast",HSK_QUIZ_QUESTION_COUNT+"+","Câu kiểm tra");

    if(!document.getElementById("home-copy-v78-2-style")){
      var style=document.createElement("style");
      style.id="home-copy-v78-2-style";
      style.textContent=[
        ".brand-home #brandTitle{max-width:340px;line-height:1.15;white-space:normal}",
        ".brand-home #brandSubtitle{display:none!important}",
        ".home-resource-tile span{overflow-wrap:anywhere}",
        "@media(max-width:1100px){.brand-home #brandTitle{max-width:250px;font-size:14px}}"
      ].join("");
      document.head.appendChild(style);
    }
  }

  function install(){
    apply();
    var attempts=0;
    var timer=root.setInterval(function(){
      attempts++;
      apply();
      if(attempts>=60||(root.VDuckieDictionary&&Array.isArray(root.VDuckieDictionary.records)&&root.VDuckieDictionary.records.length>=BASE_DICTIONARY_COUNT))root.clearInterval(timer);
    },350);
    root.addEventListener("vduckie:erp-v77-ready",apply);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})(typeof window!=="undefined"?window:globalThis);
