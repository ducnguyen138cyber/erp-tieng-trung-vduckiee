(function(root){
  "use strict";
  var terms=root.ERP_TERMS||(root.ERP_TERMS=[]);
  var existing=Object.create(null);
  var added=[];
  for(var i=0;i<terms.length;i++)if(terms[i]&&terms[i][0])existing[terms[i][0]]=true;

  function add(rows){
    for(var j=0;j<rows.length;j++){
      var row=rows[j];
      if(!row||!row[0]||existing[row[0]])continue;
      var term=[row[0],"","",row[1]||"",row[2]||"Chứng từ",row[3]||("Thuật ngữ dùng trong nghiệp vụ "+String(row[2]||"ERP").toLowerCase()+" của hệ thống ERP."),row[4]||"",row[5]||""];
      terms.push(term);
      added.push(term);
      existing[row[0]]=true;
    }
  }

  function updateUi(categories){
    if(typeof document==="undefined")return;
    var filters=document.getElementById("filters"),button;
    if(filters){
      for(var i=0;i<categories.length;i++){
        if(filters.querySelector('[data-category="'+categories[i]+'"]'))continue;
        button=document.createElement("button");
        button.type="button";
        button.setAttribute("data-category",categories[i]);
        button.textContent=categories[i];
        filters.appendChild(button);
      }
    }
    var count=document.querySelector(".home-resource-tile.resource-erp strong");
    if(count)count.textContent=terms.length+"+";
    var help=document.querySelector("#personal .personal-box .help");
    if(help)help.textContent="Nếu từ đã có trong bộ "+terms.length+" thuật ngữ, tiếng Trung, pinyin và âm gần Việt sẽ hiện ngay để bạn lưu.";
  }

  function fillPronunciation(){
    if(!root.ERPPronunciation||typeof root.ERPPronunciation.generate!=="function")return false;
    for(var i=0;i<added.length;i++){
      var result=root.ERPPronunciation.generate(added[i][0]);
      if(result){added[i][1]=result.pinyin||"";added[i][2]=result.nearVi||"";}
    }
    if(typeof document!=="undefined"){
      var search=document.getElementById("search");
      if(search&&typeof Event!=="undefined")search.dispatchEvent(new Event("input",{bubbles:true}));
    }
    return true;
  }

  function finish(categories,sourceCount){
    root.ERP_TERMS_V76={sourceCount:sourceCount,addedCount:added.length,totalCount:terms.length,categories:categories.slice(0)};
    updateUi(categories);
    if(typeof document!=="undefined"&&document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){updateUi(categories);},{once:true});
    if(root.PinyinEngineReady&&typeof root.PinyinEngineReady.then==="function")root.PinyinEngineReady.then(function(){if(!fillPronunciation())setTimeout(fillPronunciation,0);});
    else setTimeout(fillPronunciation,0);
  }

  root.VDuckieERPTermsV76={add:add,finish:finish,terms:terms,added:added};
})(typeof globalThis!=="undefined"?globalThis:this);
