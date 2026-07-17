(function(root){
  "use strict";
  var terms=root.ERP_TERMS||(root.ERP_TERMS=[]);
  var existing=Object.create(null);
  var added=[];
  var batchSize=90;
  for(var i=0;i<terms.length;i++){
    if(terms[i]&&terms[i][0])existing[terms[i][0]]=true;
  }

  function addText(text){
    var lines=String(text||"").split(/\r?\n/);
    for(var i=0;i<lines.length;i++){
      var line=lines[i].trim();
      if(!line||line.charAt(0)==="#")continue;
      var row=line.split("\t");
      var word=(row[0]||"").trim();
      if(!word||existing[word])continue;
      var meaning=(row[1]||"").trim();
      var category=(row[2]||"Chứng từ").trim();
      var note=(row[3]||("Thuật ngữ thuộc nhóm "+category+" trong hệ thống ERP.")).trim();
      var term=[word,"","",meaning,category,note,"",""];
      terms.push(term);
      added.push(term);
      existing[word]=true;
    }
  }

  function ensureCategoryButtons(categories){
    if(typeof document==="undefined")return;
    var filters=document.getElementById("filters");
    if(!filters)return;
    for(var i=0;i<categories.length;i++){
      var category=categories[i];
      if(filters.querySelector('[data-category="'+category+'"]'))continue;
      var button=document.createElement("button");
      button.type="button";
      button.setAttribute("data-category",category);
      button.textContent=category;
      filters.appendChild(button);
    }
  }

  function updateUi(categories){
    if(typeof document==="undefined")return;
    ensureCategoryButtons(categories);
    var count=document.querySelector(".home-resource-tile.resource-erp strong");
    if(count)count.textContent=terms.length+"+";
    var help=document.querySelector("#personal .personal-box .help");
    if(help)help.textContent="Nếu từ đã có trong bộ "+terms.length+" thuật ngữ, tiếng Trung, pinyin và âm gần Việt sẽ hiện ngay để bạn lưu.";
  }

  function findTerm(word){
    for(var i=0;i<terms.length;i++)if(terms[i][0]===word)return terms[i];
    return null;
  }

  function refreshVisiblePronunciation(){
    if(typeof document==="undefined")return;
    var cardHanzi=document.getElementById("cardHanzi");
    var cardTerm=cardHanzi?findTerm(cardHanzi.textContent):null;
    if(cardTerm){
      var cardPinyin=document.getElementById("cardPinyin");
      var cardNear=document.getElementById("cardNearVi");
      if(cardPinyin)cardPinyin.textContent=cardTerm[1]||"";
      if(cardNear)cardNear.textContent=cardTerm[2]||"—";
    }
    var quizHanzi=document.getElementById("quizHanzi");
    var quizTerm=quizHanzi?findTerm(quizHanzi.textContent):null;
    if(quizTerm){
      var quizPinyin=document.getElementById("quizPinyin");
      if(quizPinyin)quizPinyin.textContent=(quizTerm[1]||"")+" · "+(quizTerm[2]||"");
    }
    var search=document.getElementById("search");
    if(search&&typeof Event!=="undefined")search.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function fillPronunciationInBatches(){
    if(!root.ERPPronunciation||typeof root.ERPPronunciation.generate!=="function")return false;
    var index=0;
    function next(){
      var end=Math.min(index+batchSize,added.length);
      for(;index<end;index++){
        var result=root.ERPPronunciation.generate(added[index][0]);
        if(result){
          added[index][1]=result.pinyin||"";
          added[index][2]=result.nearVi||"";
        }
      }
      if(index<added.length){
        setTimeout(next,0);
      }else{
        refreshVisiblePronunciation();
        root.dispatchEvent&&root.dispatchEvent(new CustomEvent("vduckie:erp-v77-ready",{detail:root.ERP_TERMS_V77||{}}));
      }
    }
    next();
    return true;
  }

  function finish(categories,sourceCount,sources){
    root.ERP_TERMS_V77={
      sourceCount:sourceCount,
      addedCount:added.length,
      totalCount:terms.length,
      categories:categories.slice(0),
      sources:(sources||[]).slice(0)
    };
    updateUi(categories);
    if(typeof document!=="undefined"&&document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded",function(){updateUi(categories);},{once:true});
    }
    if(root.PinyinEngineReady&&typeof root.PinyinEngineReady.then==="function"){
      root.PinyinEngineReady.then(function(){
        if(!fillPronunciationInBatches())setTimeout(fillPronunciationInBatches,0);
      });
    }else{
      setTimeout(fillPronunciationInBatches,0);
    }
  }

  root.VDuckieERPTermsV77={
    addText:addText,
    finish:finish,
    terms:terms,
    added:added
  };
})(typeof globalThis!=="undefined"?globalThis:this);
