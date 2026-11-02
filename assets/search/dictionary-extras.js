/* Dictionary detail enhancements: verified stroke data and existing Supabase user_words. */
(function(root,document){
"use strict";
var activeWord="",writer=null,characterIndex=0,nextStroke=0,paused=false;
function core(){return root.VDuckieEXPCore}
function context(){var c=core();return {client:c&&c.client&&c.client(),session:c&&c.session&&c.session()}}
function status(text){var node=document.getElementById("vsearchSaveStatus");if(node)node.textContent=text}
function ownWord(){var service=root.VDuckieHeaderSearch;return service&&service.selected&&service.selected()}
function selectChars(word){return Array.from(word||"").filter(function(ch){return /[\u3400-\u9fff]/.test(ch)})}
function showCharacter(pos){var chars=selectChars(activeWord);if(!chars.length)return;characterIndex=(pos+chars.length)%chars.length;var el=document.getElementById("vsearchStrokeCanvas"),label=document.getElementById("vsearchStrokeLabel");if(!el||!label)return;label.textContent=chars[characterIndex]+" · "+(characterIndex+1)+"/"+chars.length;el.innerHTML="";writer=null;if(!root.HanziWriter){el.textContent="Chưa nạp thư viện hướng dẫn nét.";return}
 try{writer=root.HanziWriter.create(el,chars[characterIndex],{width:210,height:210,padding:12,showOutline:true,showCharacter:false,strokeAnimationSpeed:1.1,delayBetweenStrokes:250,onLoadCharDataSuccess:function(data){statusStroke(data&&data.strokes?"Tổng "+data.strokes.length+" nét.":"Đã tải dữ liệu viết nét.")},onLoadCharDataError:function(){statusStroke("Chưa có dữ liệu nét cho chữ này.")}});writer.animateCharacter()}catch(err){statusStroke("Không thể tải dữ liệu nét của chữ này.")}}
function statusStroke(msg){var n=document.getElementById("vsearchStrokeStatus");if(n)n.textContent=msg}
async function save(){var word=ownWord();if(!word)return;var state=context();if(!state.session||!state.session.user){status("Đăng nhập Google để lưu từ và đồng bộ giữa các thiết bị.");return}if(!state.client){status("Chưa kết nối được tài khoản Supabase.");return}
 var m=word.meanings||{},meaning=[].concat(m.hsk||[],m.erp||[]).filter(function(v){return typeof v==="string"&&!/^LT:/.test(v)}).slice(0,4).join("; ");
 var examples=word.examples||{},ex=[].concat(examples.hsk||[],examples.erp||[]).find(function(v){return v&&v.zh&&v.vi})||{};
 var row={user_id:state.session.user.id,word_key:word.hanzi,hanzi:word.hanzi,pinyin:word.pinyin||"",meaning_vi:meaning,category:"HSK",example_zh:ex.zh||"",example_vi:ex.vi||"",is_saved:true};
 status("Đang lưu…");
 var current=await state.client.from("user_words").select("word_key").eq("user_id",row.user_id).eq("word_key",row.word_key).maybeSingle();
 if(current.error){status("Không kiểm tra được sổ từ: "+current.error.message);return}
 var result=current.data?
   await state.client.from("user_words").update({is_saved:true}).eq("user_id",row.user_id).eq("word_key",row.word_key):
   await state.client.from("user_words").insert(row);
 status(result.error?"Không lưu được từ: "+result.error.message:"Đã lưu vào sổ từ cá nhân ✓");
}
function build(){var modal=document.getElementById("vsearchDetail");if(!modal||modal.querySelector(".vsearch-writer"))return;var word=ownWord();if(!word)return;activeWord=word.hanzi;
 var box=document.createElement("section");box.className="vsearch-writer";box.innerHTML='<div class="vsearch-actions"><button type="button" data-vsearch-save>☆ Lưu vào sổ từ</button><button type="button" data-vsearch-notebook>📖 Mở sổ từ</button></div><p id="vsearchSaveStatus" aria-live="polite"></p><h3>Học cách viết Hán tự</h3><div class="vsearch-stroke"><div id="vsearchStrokeCanvas" aria-label="Hoạt ảnh nét Hán tự"></div><div class="vsearch-stroke-info"><strong id="vsearchStrokeLabel"></strong><p id="vsearchStrokeStatus" aria-live="polite"></p><div class="vsearch-actions"><button type="button" data-vsearch-prev>← Chữ trước</button><button type="button" data-vsearch-next>Chữ sau →</button></div><div class="vsearch-actions"><button type="button" data-vsearch-animate>▶ Viết mẫu</button><button type="button" data-vsearch-pause>Tạm dừng / Tiếp tục</button><button type="button" data-vsearch-quiz>✍ Tự luyện viết</button><button type="button" data-vsearch-hint>Gợi ý</button><button type="button" data-vsearch-reset>Viết lại</button></div></div></div>';
 modal.querySelector(".vsearch-detail").appendChild(box);showCharacter(0)}
document.addEventListener("click",function(event){

 var detail=event.target.closest("#vsearchDetail");if(!detail)return;
 if(event.target.closest("[data-vsearch-save]"))save();
 else if(event.target.closest("[data-vsearch-next]"))showCharacter(characterIndex+1);
 else if(event.target.closest("[data-vsearch-prev]"))showCharacter(characterIndex-1);
 else if(event.target.closest("[data-vsearch-animate]")&&writer)writer.animateCharacter();
 else if(event.target.closest("[data-vsearch-quiz]")&&writer){nextStroke=0;writer.quiz({onCorrectStroke:function(data){nextStroke=data.strokeNum+1;statusStroke("Đúng nét "+(data.strokeNum+1)+".")},onMistake:function(){statusStroke("Hãy chú ý thứ tự và hướng nét.")},onComplete:function(){statusStroke("Hoàn thành chữ này!")}});statusStroke("Vẽ các nét bằng chuột hoặc bút cảm ứng theo thứ tự.")}
 else if(event.target.closest("[data-vsearch-hint]")&&writer)writer.highlightStroke(nextStroke);
 else if(event.target.closest("[data-vsearch-pause]")&&writer){paused=!paused;if(paused)writer.pauseAnimation();else writer.resumeAnimation()}
 else if(event.target.closest("[data-vsearch-reset]"))showCharacter(characterIndex);
 else if(event.target.closest("[data-vsearch-notebook]"))openNotebook();
},false);

var notebookRows=[];
function escapeText(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function lookupLevel(word){var data=root.VDuckieDictionary&&root.VDuckieDictionary.records||root.HSK_DICTIONARY_TERMS||[];var row=data.find(function(r){return r.hanzi===word});return row?(row.hskLevels||row.levels||[]).join(","):""}
async function openNotebook(){
 var current=context();if(!current.client||!current.session||!current.session.user){status("Đăng nhập Google để mở sổ từ đồng bộ.");return}
 var old=document.getElementById("vsearchNotebook");if(old)old.remove();
 var panel=document.createElement("section");panel.id="vsearchNotebook";panel.className="vsearch-overlay";
 panel.innerHTML='<div class="vsearch-notebook" role="dialog" aria-modal="true"><header><h2>Sổ từ cá nhân</h2><button type="button" data-notebook-close>×</button></header><p class="vsearch-source">Chỉ hiển thị từ của tài khoản đang đăng nhập.</p><div class="vsearch-notebook-filters"><input data-notebook-query type="search" placeholder="Tìm từ đã lưu…"><select data-notebook-level><option value="">Mọi cấp HSK</option>'+[1,2,3,4,5,6].map(function(i){return '<option value="'+i+'">HSK '+i+'</option>'}).join("")+'</select><select data-notebook-status><option value="">Tất cả</option><option value="learned">Đã thuộc</option><option value="learning">Đang học</option></select></div><div data-notebook-results>Đang tải sổ từ…</div></div>';
 document.body.appendChild(panel);
 var response=await current.client.from("user_words").select("word_key,hanzi,pinyin,meaning_vi,category,is_saved,is_known").eq("user_id",current.session.user.id).eq("is_saved",true).order("updated_at",{ascending:false}).limit(500);
 notebookRows=response.data||[];
 var resultArea=panel.querySelector("[data-notebook-results]");if(response.error){resultArea.textContent="Không tải được sổ từ: "+response.error.message;return}
 function render(){
  var q=panel.querySelector("[data-notebook-query]").value.toLowerCase().trim(),level=panel.querySelector("[data-notebook-level]").value,mode=panel.querySelector("[data-notebook-status]").value;
  var found=notebookRows.filter(function(row){return (!q||(row.hanzi+" "+row.pinyin+" "+row.meaning_vi).toLowerCase().includes(q))&&(!level||lookupLevel(row.hanzi).split(",").includes(level))&&(!mode||(mode==="learned" ? row.is_known : !row.is_known))});
  resultArea.innerHTML=found.length?found.map(function(row){return '<article class="vsearch-saved-word"><strong lang="zh-CN">'+escapeText(row.hanzi)+'</strong><span>'+escapeText(row.pinyin)+'</span><small>'+escapeText(row.meaning_vi)+'</small><button data-notebook-known="'+escapeText(row.word_key)+'">'+(row.is_known?"✓ Đã thuộc":"Đánh dấu đã thuộc")+'</button><button data-notebook-delete="'+escapeText(row.word_key)+'">Xóa</button></article>'}).join(""):'<p>Không có từ nào khớp bộ lọc.</p>';
 }
 panel.addEventListener("input",render);
 panel.addEventListener("change",render);
 panel.addEventListener("click",async function(ev){
   if(ev.target===panel||ev.target.closest("[data-notebook-close]")){panel.remove();return}
   var del=ev.target.closest("[data-notebook-delete]"),known=ev.target.closest("[data-notebook-known]");if(!del&&!known)return;
   var key=(del||known).getAttribute(del?"data-notebook-delete":"data-notebook-known"),row=notebookRows.find(function(item){return item.word_key===key});if(!row)return;
   var request=current.client.from("user_words").update(del?{is_saved:false}:{is_known:!row.is_known}).eq("user_id",current.session.user.id).eq("word_key",key);
   var answer=await request;if(answer.error){resultArea.textContent="Không cập nhật được: "+answer.error.message;return}
   if(del)notebookRows=notebookRows.filter(function(item){return item.word_key!==key});else row.is_known=!row.is_known;
   render();
 });
 render();
}

document.addEventListener("vduckie:dictionary-detail-open",build);
root.VDuckieDictionaryExtras={save:save,showCharacter:showCharacter,openNotebook:openNotebook};
})(window,document);
