/* Dictionary detail enhancements: verified stroke data and existing Supabase user_words. */
(function(root,document){
"use strict";
var activeWord="",writer=null,characterIndex=0;
function core(){return root.VDuckieEXPCore}
function context(){var c=core();return {client:c&&c.client&&c.client(),session:c&&c.session&&c.session()}}
function status(text){var node=document.getElementById("vsearchSaveStatus");if(node)node.textContent=text}
function ownWord(){var service=root.VDuckieHeaderSearch;return service&&service.selected&&service.selected()}
function selectChars(word){return Array.from(word||"").filter(function(ch){return /[\u3400-\u9fff]/.test(ch)})}
function showCharacter(pos){var chars=selectChars(activeWord);if(!chars.length)return;characterIndex=(pos+chars.length)%chars.length;var el=document.getElementById("vsearchStrokeCanvas"),label=document.getElementById("vsearchStrokeLabel");if(!el||!label)return;label.textContent=chars[characterIndex]+" · "+(characterIndex+1)+"/"+chars.length;el.innerHTML="";writer=null;if(!root.HanziWriter){el.textContent="Chưa nạp thư viện hướng dẫn nét.";return}
 try{writer=root.HanziWriter.create(el,chars[characterIndex],{width:210,height:210,padding:12,showOutline:true,showCharacter:false,strokeAnimationSpeed:1.1,delayBetweenStrokes:250,onLoadCharDataSuccess:function(){statusStroke("")},onLoadCharDataError:function(){statusStroke("Chưa có dữ liệu nét cho chữ này.")}});writer.animateCharacter()}catch(err){statusStroke("Không thể tải dữ liệu nét của chữ này.")}}
function statusStroke(msg){var n=document.getElementById("vsearchStrokeStatus");if(n)n.textContent=msg}
async function save(){var word=ownWord();if(!word)return;var state=context();if(!state.session||!state.session.user){status("Đăng nhập Google để lưu từ và đồng bộ giữa các thiết bị.");return}if(!state.client){status("Chưa kết nối được tài khoản Supabase.");return}
 var m=word.meanings||{},meaning=[].concat(m.hsk||[],m.erp||[]).filter(function(v){return typeof v==="string"&&!/^LT:/.test(v)}).slice(0,4).join("; ");
 var examples=word.examples||{},ex=[].concat(examples.hsk||[],examples.erp||[]).find(function(v){return v&&v.zh&&v.vi})||{};
 var row={user_id:state.session.user.id,word_key:word.hanzi,hanzi:word.hanzi,pinyin:word.pinyin||"",meaning_vi:meaning,category:"HSK",example_zh:ex.zh||"",example_vi:ex.vi||"",is_saved:true};
 status("Đang lưu…");
 var result=await state.client.from("user_words").upsert(row,{onConflict:"user_id,word_key"});
 status(result.error?"Không lưu được từ: "+result.error.message:"Đã lưu vào sổ từ cá nhân ✓");
}
function build(){var modal=document.getElementById("vsearchDetail");if(!modal||modal.querySelector(".vsearch-writer"))return;var word=ownWord();if(!word)return;activeWord=word.hanzi;
 var box=document.createElement("section");box.className="vsearch-writer";box.innerHTML='<div class="vsearch-actions"><button type="button" data-vsearch-save>☆ Lưu vào sổ từ</button></div><p id="vsearchSaveStatus" aria-live="polite"></p><h3>Học cách viết Hán tự</h3><div class="vsearch-stroke"><div id="vsearchStrokeCanvas" aria-label="Hoạt ảnh nét Hán tự"></div><div class="vsearch-stroke-info"><strong id="vsearchStrokeLabel"></strong><p id="vsearchStrokeStatus" aria-live="polite"></p><div class="vsearch-actions"><button type="button" data-vsearch-prev>← Chữ trước</button><button type="button" data-vsearch-next>Chữ sau →</button></div><div class="vsearch-actions"><button type="button" data-vsearch-animate>▶ Viết mẫu</button><button type="button" data-vsearch-quiz>✍ Tự luyện viết</button><button type="button" data-vsearch-hint>Gợi ý</button><button type="button" data-vsearch-reset>Viết lại</button></div></div></div>';
 modal.querySelector(".vsearch-detail").appendChild(box);showCharacter(0)}
document.addEventListener("click",function(event){
 if(event.target.closest("[data-vsearch-result]"))setTimeout(build,0);
 var detail=event.target.closest("#vsearchDetail");if(!detail)return;
 if(event.target.closest("[data-vsearch-save]"))save();
 else if(event.target.closest("[data-vsearch-next]"))showCharacter(characterIndex+1);
 else if(event.target.closest("[data-vsearch-prev]"))showCharacter(characterIndex-1);
 else if(event.target.closest("[data-vsearch-animate]")&&writer)writer.animateCharacter();
 else if(event.target.closest("[data-vsearch-quiz]")&&writer){writer.quiz();statusStroke("Vẽ các nét bằng chuột hoặc bút cảm ứng theo thứ tự.")}
 else if(event.target.closest("[data-vsearch-hint]")&&writer)writer.showHint?writer.showHint():writer.animateCharacter();
 else if(event.target.closest("[data-vsearch-reset]"))showCharacter(characterIndex);
},false);
root.VDuckieDictionaryExtras={save:save,showCharacter:showCharacter};
})(window,document);
