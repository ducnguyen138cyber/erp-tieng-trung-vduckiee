(function(root,document){
"use strict";
var mount,field,list,results=[],active=-1,timer=0,selected=null,searchSerial=0,visibleLimit=8;
var mobileScreen=null,homeSlot=null,lockedPage=null,composing=false,mobileToken=null;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/ü/g,"u").replace(/u:/g,"u").replace(/\s+/g,"").trim()}
function pinyinNumber(s){var tones={a:["ā","á","ǎ","à"],e:["ē","é","ě","è"],i:["ī","í","ǐ","ì"],o:["ō","ó","ǒ","ò"],u:["ū","ú","ǔ","ù"],v:["ǖ","ǘ","ǚ","ǜ"]};return String(s).replace(/([a-zvü]+)([1-4])/gi,function(all,syllable,n){syllable=syllable.toLowerCase().replace(/ü/g,"v");var pos=syllable.search(/[ae]/);if(pos<0)pos=syllable.indexOf("ou")>=0?syllable.indexOf("o"):-1;if(pos<0){for(var i=syllable.length-1;i>=0;i--)if(/[iouv]/.test(syllable[i])){pos=i;break}}return pos<0?syllable:syllable.slice(0,pos)+tones[syllable[pos]][Number(n)-1]+syllable.slice(pos+1)})}
var cachedTerms=null,cachedMapped=null;
function source(){var records=root.VDuckieDictionary&&root.VDuckieDictionary.records;if(records&&records.length)return records;var termsData=root.HSK_DICTIONARY_TERMS||[];if(termsData===cachedTerms&&cachedMapped)return cachedMapped;cachedTerms=termsData;cachedMapped=termsData.map(function(t){return {hanzi:t.hanzi,pinyin:t.pinyin,traditional:t.traditional,pos:t.pos,hskLevels:t.levels,meanings:{hsk:t.meanings||[],erp:[]},examples:{hsk:[],erp:[]}}});return cachedMapped}
function terms(r){var m=r.meanings||{};return [].concat(m.hsk||[],m.erp||[]).filter(function(t){return typeof t==="string"&&!/^LT:/.test(t)})}
function search(q){
  var original=String(q||"").trim(),needle=norm(pinyinNumber(original));
  if(!needle)return[];
  var matches=[];
  source().forEach(function(r){
    var han=String(r.hanzi||""),trad=String(r.traditional||"");
    var py=norm(r.pinyin),mean=terms(r);
    var score=han===original||trad===original||py===needle?0:
      han.indexOf(original)===0||trad.indexOf(original)===0||py.indexOf(needle)===0?1:
      mean.some(function(v){return norm(v).split(/[;,\/]/).some(function(bit){return bit===needle})})?2:
      mean.some(function(v){return norm(v).indexOf(needle)>=0})?3:
      han.indexOf(original)>=0||trad.indexOf(original)>=0||py.indexOf(needle)>=0?4:99;
    if(score<99)matches.push({r:r,score:score});
  });
  matches.sort(function(a,b){return a.score-b.score||String(a.r.hanzi).length-String(b.r.hanzi).length});
  return matches.slice(0,40).map(function(v){return v.r});
}
function close(){clearTimeout(timer);timer=0;searchSerial++;list.hidden=true;active=-1;field.setAttribute("aria-expanded","false")}
function mobile(){return root.matchMedia&&root.matchMedia("(max-width: 950px)").matches}
function syncViewport(){
  var viewport=root.visualViewport;
  [mobileScreen,document.getElementById("vsearchDetail")].forEach(function(node){
    if(!node)return;
    node.style.setProperty("--vsearch-height",(viewport?viewport.height:root.innerHeight)+"px");
    node.style.setProperty("--vsearch-top",(viewport?viewport.offsetTop:0)+"px");
  });
}
function lockPage(){
  var body=document.body,style=body.style;
  lockedPage={x:root.scrollX,y:root.scrollY,styles:{},inert:[]};
  ["position","top","left","width","overflow"].forEach(function(key){lockedPage.styles[key]=[style.getPropertyValue(key),style.getPropertyPriority(key)]});
  Array.from(body.children).forEach(function(node){
    if(node===mobileScreen||/^(SCRIPT|STYLE|LINK)$/.test(node.tagName))return;
    lockedPage.inert.push([node,node.inert]);node.inert=true;
  });
  style.position="fixed";style.top=-lockedPage.y+"px";style.left=-lockedPage.x+"px";style.width="100%";style.overflow="hidden";
  body.classList.add("vsearch-mobile-open");
}
function openMobile(push){
  if(mobileScreen)return;
  homeSlot=document.createComment("header search position");mount.before(homeSlot);
  mobileScreen=document.createElement("section");mobileScreen.id="vsearchMobileScreen";
  mobileScreen.className="vsearch-mobile-screen";
  mobileScreen.setAttribute("role","dialog");mobileScreen.setAttribute("aria-modal","true");mobileScreen.setAttribute("aria-label","Tìm kiếm từ điển");
  mobileScreen.innerHTML='<button type="button" class="vsearch-back" aria-label="Quay lại" data-vsearch-back>‹</button><p class="vsearch-mobile-hint">Tra chữ Hán, Pinyin hoặc nghĩa tiếng Việt</p>';
  document.body.appendChild(mobileScreen);mobileScreen.insertBefore(mount,mobileScreen.lastChild);
  mobileScreen.querySelector("[data-vsearch-back]").onclick=leaveMobile;
  lockPage();syncViewport();
  if(push){mobileToken="vsearch-"+Date.now();root.history.pushState(Object.assign({},root.history.state,{vduckieSearch:mobileToken}),"")}
  if(field.value.trim())render();
}
function closeMobile(){
  if(!mobileScreen)return;
  close();field.blur();var overlay=document.getElementById("vsearchDetail");if(overlay)overlay.remove();
  homeSlot.replaceWith(mount);homeSlot=null;mobileScreen.remove();mobileScreen=null;
  document.body.classList.remove("vsearch-mobile-open");
  var saved=lockedPage;lockedPage=null;
  if(saved){
    Object.keys(saved.styles).forEach(function(key){var value=saved.styles[key];if(value[0])document.body.style.setProperty(key,value[0],value[1]);else document.body.style.removeProperty(key)});
    saved.inert.forEach(function(entry){entry[0].inert=entry[1]});root.scrollTo(saved.x,saved.y);
  }
  // Focus the header without raising the keyboard again.
  mount.setAttribute("tabindex","-1");mount.focus({preventScroll:true});
}
function leaveMobile(){
  if(root.history.state&&root.history.state.vduckieSearch===mobileToken)root.history.back();else closeMobile();
}
function closeDetail(fromHistory){
  var overlay=document.getElementById("vsearchDetail");if(!overlay)return;
  if(!fromHistory&&mobileScreen&&root.history.state&&root.history.state.vduckieSearchDetail){root.history.back();return}
  overlay.remove();
  if(mobileScreen){mobileScreen.inert=false;if(field.value.trim())drawResults();mobileScreen.querySelector("[data-vsearch-back]").focus({preventScroll:true})}
  else field.focus({preventScroll:true});
}
function speak(v){if(!root.speechSynthesis)return;root.speechSynthesis.cancel();var utter=new SpeechSynthesisUtterance(v);utter.lang="zh-CN";utter.rate=.85;root.speechSynthesis.speak(utter)}
function drawResults(){
  active=-1;
  list.innerHTML=results.length?
    results.slice(0,visibleLimit).map(function(r,i){
      return '<button type="button" role="option" data-vsearch-result="'+i+'"><b lang="zh-CN">'+esc(r.hanzi)+'</b><span>'+esc(r.pinyin||"")+'</span><small>'+esc(terms(r).slice(0,2).join("; ")||"Chưa có nghĩa tiếng Việt")+'</small></button>';
    }).join("")+
    (results.length>visibleLimit?'<button type="button" class="vsearch-all" data-vsearch-more>Hiển thị thêm ('+(results.length-visibleLimit)+')</button>':'')+
    '<button type="button" class="vsearch-all" data-vsearch-all>Mở từ điển HSK / ERP</button>':
    '<p class="vsearch-status">Chưa tìm thấy từ trong các nguồn dữ liệu đang có.</p>';
  list.hidden=false;
  if(field)field.setAttribute("aria-expanded","true");
}
function render(){
  var q=field.value.trim(),request=++searchSerial;
  visibleLimit=8;
  if(!q){results=[];list.innerHTML="";close();field.setAttribute("aria-expanded","false");return}
  var data=source();
  if(!data.length){
    list.innerHTML='<p class="vsearch-status">Đang tải từ điển HSK / ERP…</p>';
    list.hidden=false;
  }
  results=search(q);
  if(data.length)drawResults();
  var expanded=root.VDuckieExpandedDictionary;
  if(!expanded||typeof expanded.lookup!=="function")return;
  expanded.lookup(q).then(function(extra){
    if(request!==searchSerial||field.value.trim()!==q||!mount.isConnected)return;
    if(document.activeElement!==field&&!mount.contains(document.activeElement))return;
    var seen=new Set(results.map(function(r){return r.hanzi+"|"+norm(r.pinyin)}));
    extra.forEach(function(r){
      var key=r.hanzi+"|"+norm(r.pinyin);
      if(!seen.has(key)){seen.add(key);results.push(r)}
    });
    results=results.slice(0,80);
    drawResults();
  }).catch(function(){if(request===searchSerial&&data.length)drawResults()});
}
function detail(r,fromHistory){selected=r;close();field.blur();
 if(mobileScreen){mobileScreen.inert=true;if(!fromHistory)root.history.pushState(Object.assign({},root.history.state,{vduckieSearchDetail:true}),"")}
var old=document.getElementById("vsearchDetail");if(old)old.remove();var modal=document.createElement("div");modal.id="vsearchDetail";modal.className="vsearch-overlay";modal.innerHTML='<section class="vsearch-detail" role="dialog" aria-modal="true" aria-labelledby="vsearchTitle"><div class="vsearch-detail-top"><span>TỪ ĐIỂN TRUNG – VIỆT</span><button type="button" data-vsearch-close aria-label="Đóng">×</button></div><h2 id="vsearchTitle" lang="zh-CN">'+esc(r.hanzi)+'</h2><p class="vsearch-phonetic">'+esc(r.pinyin||"Chưa có Pinyin")+'</p>'+(r.traditional&&r.traditional!==r.hanzi?'<p>Phồn thể: '+esc(r.traditional)+'</p>':"")+'<p class="vsearch-def">'+esc(terms(r).slice(0,8).join("; ")||"Chưa có nghĩa tiếng Việt được xác minh.")+'</p><p class="vsearch-word-meta">Loại từ: '+esc(r.pos||"Chưa có dữ liệu")+' · HSK '+esc((r.hskLevels||[]).join(", ")||"Chưa phân loại")+'</p><div class="vsearch-actions"><button type="button" data-vsearch-speak>🔊 Nghe</button><button type="button" data-vsearch-copy>Sao chép</button></div><div class="vsearch-examples"></div><p class="vsearch-source">'+(r.cvdictReference?'Nghĩa tiếng Việt tham khảo từ CVDICT của Phong Phan (CC BY-SA 4.0), dựa trên CC-CEDICT; có thể còn lỗi dịch.':'Nguồn HSK GF0025-2021; nghĩa Việt từ CVDICT (CC BY-SA 4.0) và nội dung ERP hiện có. Ví dụ lấy từ nội dung ERP và học liệu HSK hiện có.')+'</p></section>';document.body.appendChild(modal);syncViewport();document.dispatchEvent(new CustomEvent("vduckie:dictionary-detail-open",{detail:{hanzi:r.hanzi}}));var examples=r.examples&&[].concat(r.examples.hsk||[],r.examples.erp||[]).filter(function(e){return e.zh&&e.vi}).slice(0,3)||[];
 if(examples.length)modal.querySelector(".vsearch-examples").innerHTML='<h3>Câu ví dụ từ dữ liệu nguồn</h3>'+examples.map(function(e){return '<div class="vsearch-example"><b lang="zh-CN">'+esc(e.zh)+'</b>'+'<span class="vsearch-example-pinyin" data-vsearch-example-pinyin="'+esc(e.zh)+'">'+esc(e.pinyin||'Đang lấy Pinyin…')+'</span>'+'<span>'+esc(e.vi)+'</span><button type="button" data-vsearch-example-speak="'+esc(e.zh)+'">🔊 Nghe</button></div>'}).join("");
 else if(root.VDuckieLearningExamples)root.VDuckieLearningExamples.enhance(modal.querySelector(".vsearch-examples"),r.hanzi,null,function(entry){var meta=modal.querySelector(".vsearch-word-meta");if(meta)meta.textContent="HSK "+entry.level+" · GF0025-2021";});
 else modal.querySelector(".vsearch-examples").textContent="Chưa có câu ví dụ trong học liệu hiện có.";
 Promise.resolve(root.PinyinEngineReady||false).then(function(){
  if(!root.ERPPronunciation||typeof root.ERPPronunciation.generate!=="function")return;
  modal.querySelectorAll("[data-vsearch-example-pinyin]").forEach(function(node){
   var original=examples.find(function(e){return e.zh===node.getAttribute("data-vsearch-example-pinyin")});
   if(original&&original.pinyin)return;
   var generated=root.ERPPronunciation.generate(node.getAttribute("data-vsearch-example-pinyin"));
   node.textContent=generated&&generated.pinyin?generated.pinyin:"Chưa có Pinyin được xác minh";
  });
 }).catch(function(){modal.querySelectorAll("[data-vsearch-example-pinyin]").forEach(function(node){node.textContent="Chưa có Pinyin được xác minh"})});var chars=Array.from(r.hanzi||"").filter(function(ch){return /[\u3400-\u9fff]/.test(ch)});
 if(chars.length>1){var parts=chars.map(function(ch){var match=search(ch).find(function(candidate){return candidate.hanzi===ch});return match?'<span><b>'+esc(ch)+'</b> · '+esc(match.pinyin||"")+' · '+esc(terms(match)[0]||"Chưa có nghĩa riêng")+'</span>':'<span><b>'+esc(ch)+'</b> · Chưa có dữ liệu phân tích riêng</span>'});
 var breakdown=document.createElement("div");breakdown.className="vsearch-breakdown";breakdown.innerHTML='<h3>Các chữ cấu thành</h3>'+parts.join("");modal.querySelector(".vsearch-examples").after(breakdown)}
 modal.querySelector("[data-vsearch-close]").focus()}
function allResults(){
 var d=root.VDuckieDictionary;if(!d||!d.open){render();return}
 var query=field.value.trim();
 if(mobileScreen){
   // Hand the existing route to the dictionary router; do not leave an overlay state behind.
   var state=Object.assign({},root.history.state);delete state.vduckieSearch;delete state.vduckieSearchDetail;
   root.history.replaceState(state,"");closeMobile();mobileToken=null;
 }
 d.state.query=query;d.state.source="all";d.open("all");
 var input=document.getElementById("dictionarySearch");if(input){input.value=query;input.dispatchEvent(new Event("input",{bubbles:true}))}close();
}
function init(){
 var top=document.querySelector(".top");if(!top)return;
 mount=document.createElement("div");mount.className="vsearch-header";
 mount.innerHTML='<div class="vsearch-input-wrap"><span aria-hidden="true">⌕</span><input type="search" id="vsearchInput" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search" role="combobox" aria-controls="vsearchList" aria-expanded="false" aria-label="Tra từ tiếng Trung" placeholder="Tra tiếng Việt, Pinyin hoặc chữ Hán..."><button type="button" class="vsearch-clear" aria-label="Xóa tìm kiếm" hidden>×</button></div><div id="vsearchList" role="listbox" class="vsearch-list" hidden></div>';
 top.insertBefore(mount,top.querySelector(".top-actions"));field=mount.querySelector("input");list=mount.querySelector(".vsearch-list");
 // Reparent before native focus, in the same gesture, to keep the iOS keyboard attached.
 field.addEventListener("pointerdown",function(e){if(mobile()&&!mobileScreen){e.preventDefault();openMobile(true);field.focus({preventScroll:true})}});
 field.addEventListener("focus",function(){if(mobile()&&!mobileScreen)openMobile(true);if(field.value.trim())render()});
 function queueSearch(){clearTimeout(timer);mount.querySelector(".vsearch-clear").hidden=!field.value;if(!composing)timer=setTimeout(function(){timer=0;render()},120)}
 field.addEventListener("compositionstart",function(){composing=true;clearTimeout(timer);searchSerial++});
 field.addEventListener("compositionend",function(){composing=false;queueSearch()});
 field.addEventListener("input",queueSearch);
 mount.querySelector(".vsearch-clear").onclick=function(){field.value="";this.hidden=true;render();field.focus({preventScroll:true})};
 field.addEventListener("keydown",function(e){
   if(e.isComposing||composing||e.keyCode===229)return;
   if(e.key==="Escape")return;
   var choices=list.querySelectorAll("[data-vsearch-result]");
   if(e.key==="ArrowDown"||e.key==="ArrowUp"){
     e.preventDefault();if(list.hidden){render();choices=list.querySelectorAll("[data-vsearch-result]")}
     active=(active+(e.key==="ArrowDown"?1:-1)+choices.length)%Math.max(choices.length,1);
     choices.forEach(function(c,i){c.classList.toggle("chosen",i===active)});return;
   }
   if(e.key==="Enter"){e.preventDefault();if(timer){clearTimeout(timer);timer=0;render()}if(results.length)detail(results[Math.max(0,active)]);else render()}
 });
 mount.addEventListener("click",function(e){
   var button=e.target.closest("[data-vsearch-result]");
   if(button)detail(results[Number(button.dataset.vsearchResult)]);
   else if(e.target.closest("[data-vsearch-more]")){visibleLimit=Math.min(80,visibleLimit+12);drawResults()}
   else if(e.target.closest("[data-vsearch-all]"))allResults();
 });
 document.addEventListener("click",function(e){if(!mobileScreen&&!mount.contains(e.target))close()});
 document.addEventListener("click",function(e){
   var modal=e.target.closest("#vsearchDetail");if(!modal)return;
   if(e.target===modal||e.target.closest("[data-vsearch-close]"))closeDetail(false);
   else if(e.target.closest("[data-vsearch-speak]"))speak(selected.hanzi);
   else if(e.target.closest("[data-vsearch-example-speak]"))speak(e.target.closest("[data-vsearch-example-speak]").getAttribute("data-vsearch-example-speak"));
   else if(e.target.closest("[data-vsearch-copy]")&&navigator.clipboard)navigator.clipboard.writeText(selected.hanzi);
 });
 document.addEventListener("keydown",function(e){
   var modal=document.getElementById("vsearchDetail"),dialog=modal||mobileScreen;
   if(e.key==="Escape"){
     e.preventDefault();if(modal)closeDetail(false);else if(mobileScreen)leaveMobile();else close();return;
   }
   if(e.key!=="Tab"||!dialog)return;
   var nodes=Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],select,textarea,[tabindex="0"]')).filter(function(node){return !node.hidden&&node.getClientRects().length});
   var first=nodes[0],last=nodes[nodes.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 });
 root.addEventListener("popstate",function(e){
   if(!mobileScreen)return;
   e.stopImmediatePropagation();
   if(e.state&&e.state.vduckieSearch===mobileToken){
     if(!e.state.vduckieSearchDetail)closeDetail(true);
     else if(selected&&!document.getElementById("vsearchDetail"))detail(selected,true);
   }else closeMobile();
 },true);
 root.addEventListener("resize",syncViewport);
 if(root.visualViewport){root.visualViewport.addEventListener("resize",syncViewport);root.visualViewport.addEventListener("scroll",syncViewport)}
 root.addEventListener("vduckie:hsk-dictionary-ready",function(){if(field.value&&(!list.hidden||mobileScreen)&&!document.getElementById("vsearchDetail"))render()});
}
root.VDuckieHeaderSearch={search:search,normalize:norm,selected:function(){return selected}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
