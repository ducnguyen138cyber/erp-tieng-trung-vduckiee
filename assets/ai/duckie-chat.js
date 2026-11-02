(function(window,document){"use strict";
const STORE="vduckie-duckie-chat-v1",MAX=24;
let messages=[],busy=false,open=false;
function load(){try{const x=JSON.parse(sessionStorage.getItem(STORE)||"[]");return Array.isArray(x)?x.filter(v=>v&&["user","assistant"].includes(v.role)&&typeof v.content==="string").slice(-MAX):[]}catch{return []}}
function save(){try{sessionStorage.setItem(STORE,JSON.stringify(messages.slice(-MAX)))}catch{}}
function elt(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function mount(){
 if(document.getElementById("duckieChat"))return;
 messages=load();
 const toggle=elt("button","duckie-chat-launch");toggle.innerHTML='<img src="./assets/home/vduckie-welcome.webp" alt="" aria-hidden="true"> <span>Duckie Chat</span>';toggle.type="button";toggle.setAttribute("aria-label","Mở Duckie Chat");toggle.setAttribute("aria-expanded","false");
 const panel=elt("section","duckie-chat-panel");panel.id="duckieChat";panel.hidden=true;panel.setAttribute("aria-label","Duckie Chat hỗ trợ học tiếng Trung");
 panel.innerHTML='<header class="duckie-chat-head"><div><strong><img class="duckie-chat-mascot" src="./assets/home/vduckie-welcome.webp" alt="" aria-hidden="true"> Duckie Chat</strong><small>Trợ giảng tiếng Trung</small></div><div><button type="button" data-dc-tools title="Mở 6 công cụ học tập">Công cụ</button><button type="button" data-dc-min title="Thu nhỏ" aria-label="Thu nhỏ">−</button></div></header><div class="duckie-chat-messages" role="log" aria-live="polite" aria-relevant="additions text"></div><div class="duckie-chat-suggestions"><button type="button" data-dc-prompt="努力 và 加油 khác nhau thế nào?">Phân biệt từ</button><button type="button" data-dc-prompt="Giải thích cấu trúc 越来越">Ngữ pháp</button></div><form class="duckie-chat-form"><textarea rows="2" maxlength="1200" aria-label="Nhập câu hỏi cho Duckie Chat" placeholder="Hỏi bằng tiếng Việt hoặc tiếng Trung..."></textarea><button type="submit" aria-label="Gửi tin nhắn">➤</button></form><p class="duckie-chat-status" role="status" hidden></p><div class="duckie-chat-utility"><button type="button" data-dc-clear>Xóa hội thoại</button></div>';
 document.body.append(toggle,panel);
 const area=panel.querySelector(".duckie-chat-messages"),status=panel.querySelector(".duckie-chat-status"),input=panel.querySelector("textarea"),send=panel.querySelector('[type="submit"]');
 function render(){area.replaceChildren();if(!messages.length){const greeting=elt("div","dc-greeting","你好！Mình là Duckie. Bạn có thể hỏi về từ vựng, ngữ pháp hoặc câu tiếng Trung. Nếu chưa kích hoạt AI miễn phí, mình sẽ thông báo rõ.");area.append(greeting)}messages.forEach(m=>{const row=elt("div","dc-bubble "+(m.role==="user"?"is-user":"is-assistant"),m.content);area.append(row)});area.scrollTop=area.scrollHeight}
 function show(){open=true;panel.hidden=false;toggle.setAttribute("aria-expanded","true");render();input.focus()}
 function hide(){open=false;panel.hidden=true;toggle.setAttribute("aria-expanded","false")}
 toggle.onclick=()=>open?hide():show();
 panel.querySelector("[data-dc-min]").onclick=hide;
 panel.querySelector("[data-dc-tools]").onclick=()=>{if(window.VDuckieFreeAssistant&&typeof window.VDuckieFreeAssistant.open==="function"){hide();window.VDuckieFreeAssistant.open("help")}else status.textContent="Bộ công cụ học tập chưa được tải."};
 panel.querySelector("[data-dc-clear]").onclick=()=>{messages=[];save();status.hidden=true;status.textContent="";render()};
 panel.querySelectorAll("[data-dc-prompt]").forEach(b=>b.onclick=()=>{input.value=b.dataset.dcPrompt;input.focus()});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();panel.querySelector("form").requestSubmit()}});
 panel.querySelector("form").addEventListener("submit",async e=>{
  e.preventDefault();const question=input.value.trim();if(!question||busy)return;
  messages.push({role:"user",content:question});messages=messages.slice(-MAX);save();input.value="";render();busy=true;send.disabled=true;status.hidden=false;status.textContent="Đang gửi câu hỏi…";
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
   let response;try{response=await fetch("./api/duckie-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:messages.slice(-12)}),signal:controller.signal})}finally{clearTimeout(timeout)}
   let data={};try{data=await response.json()}catch{}
   if(!response.ok){const error=data.error||"Không kết nối được máy chủ AI.";throw new Error(error)}
   if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("Máy chủ chưa trả lời được.");
   messages.push({role:"assistant",content:data.reply.slice(0,4000)});messages=messages.slice(-MAX);save();render();status.hidden=true;status.textContent="";
  }catch(err){status.hidden=false;status.textContent=err.name==="AbortError"?"Phản hồi quá lâu. Thử gửi lại nhé.":(String(err.message||"Chưa kết nối được trợ giảng."));}finally{busy=false;send.disabled=false;input.focus()}
 });
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})(window,document);
