// Cloudflare Pages Functions. Configure AI binding named AI in Cloudflare dashboard.
// The route returns 503 until the binding is configured; no fabricated AI answers.
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const SYSTEM="Bạn là Duckie, gia sư tiếng Trung. Trả lời bằng tiếng Việt, bắt buộc dùng CHỮ HÁN GIẢN THỂ thật (Unicode), không bao giờ thay chữ Hán bằng dấu nháy rỗng, ký tự trống hoặc phiên âm. Khi được hỏi một từ/câu viết như thế nào bằng tiếng Trung, dòng ĐẦU TIÊN phải là: Tiếng Trung: <chữ Hán giản thể>. Dòng tiếp theo: Pinyin: <phiên âm có dấu>. Dòng tiếp theo: Tiếng Việt: <nghĩa>. Ví dụ cũng phải có đủ chữ Hán + Pinyin + nghĩa Việt. Nếu không biết chính xác, nêu rõ chưa chắc chắn, tuyệt đối không tự bịa chữ Hán. Giải thích ngữ pháp ngắn gọn, trình độ HSK 1–3; giao tiếp và công xưởng khi phù hợp.";
export async function onRequestPost({request,env}){
 if(!env.AI||typeof env.AI.run!=="function")return json({error:"Tính năng trả lời AI chưa được kích hoạt. Vui lòng thử lại sau."},503);
 const type=request.headers.get("Content-Type")||"";if(!type.includes("application/json"))return json({error:"Yêu cầu phải là JSON."},415);
 const len=Number(request.headers.get("Content-Length")||0);if(len>16000)return json({error:"Nội dung hội thoại quá dài."},413);
 let body;try{body=await request.json()}catch{return json({error:"JSON không hợp lệ."},400)}
 const raw=Array.isArray(body.messages)?body.messages:[];if(!raw.length||raw.length>12)return json({error:"Hội thoại phải có từ 1 đến 12 tin."},400);
 const messages=raw.map(m=>({role:m.role,content:m.content}));if(messages.some(m=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||!m.content.trim()||m.content.length>1600)||messages[messages.length-1].role!=="user")return json({error:"Nội dung tin nhắn không hợp lệ."},400);
 const last=messages[messages.length-1].content;
 // Resolve short follow-up questions using the previous user topic instead of treating
 // "viết" / "nghĩa" / "đọc" as the vocabulary word being asked about.
 const isFollowUp=/^(?:(?:thế|vậy|còn|nó|từ đó|cái đó|câu đó|từ này|câu này|đấy|đó|và|thế còn|nếu vậy)[\\s,!?]*)?(?:viết|đọc|phát âm|phiên âm|pinyin|nghĩa|dùng|sử dụng|ví dụ|đặt câu|chữ hán|cách viết|cách đọc|sao viết|viết sao|viết chữ).*?(?:như thế nào|thế nào|là gì|ra sao|sao|không|ko|k|nhỉ|nào)?[?.!\\s]*$/i.test(last.trim()) && last.trim().length<75;
 const previousUser=messages.slice(0,-1).reverse().find(m=>m.role==="user");
 const previousAssistant=messages.slice(0,-1).reverse().find(m=>m.role==="assistant");
 const followUpContext=isFollowUp&&previousUser?
  "CÂU HỎI TIẾP NỐI: Người dùng vừa hỏi: "+previousUser.content+
  (previousAssistant?"\\nTrợ giảng đã đáp: "+previousAssistant.content.slice(0,650):"")+
  "\\nCâu mới '"+last+"' đang hỏi tiếp VỀ CHỦ ĐỀ CÂU TRƯỚC. Không giải thích nghĩa của động từ 'viết', 'đọc' hay 'nghĩa'. Nếu câu trước là 'ăn tối nghĩa là gì', câu tiếp 'viết như thế nào' phải trả lời chữ Hán cho 'ăn tối': 吃晚饭 (chī wǎnfàn). Nếu ngữ cảnh không đủ rõ mới hỏi lại.":"";
 // Only require Hanzi for prompts asking how to write/translate something into Chinese.
 const needsHanzi=isFollowUp&&/viết|chữ|pinyin|phiên âm/i.test(last)||/(tiếng trung|trung quốc|chữ hán|chữ trung|hán tự|pinyin|viết (như thế nào|thế nào|sao|ra sao)|dịch (sang|qua) (tiếng )?trung|怎么写|中文|汉字)/i.test(last);
 const hanzi=/[\u3400-\u9fff\uf900-\ufaff]/u;
 async function generate(extra){
   const context=[{role:"system",content:SYSTEM+(followUpContext?"\\n"+followUpContext:"")+(extra?"\\n"+extra:"")},...messages];
   const result=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages:context,max_tokens:800,temperature:0.15});
   return typeof result?.response==="string"?result.response:typeof result?.result?.response==="string"?result.result.response:"";
 }
 try{
   let reply=await generate("");
   if(needsHanzi&&!hanzi.test(reply)){
     // Retry generation at most once, rather than displaying empty quoted Hanzi.
     reply=await generate("LƯỢT TRƯỚC BẠN QUÊN CHỮ HÁN. Viết rõ chữ Hán giản thể thực tế ngay đầu câu trả lời. Không dùng ký hiệu \"\" hoặc \"“”\" để thay thế chữ Trung.");
   }
   if(!reply.trim())return json({error:"AI không trả về câu trả lời."},502);
   if(needsHanzi&&!hanzi.test(reply))return json({error:"AI chưa tạo được chữ Hán hợp lệ cho yêu cầu này. Bạn thử diễn đạt lại câu hỏi nhé."},422);
   return json({reply:reply.slice(0,4000)});
 }catch(err){return json({error:"Không lấy được câu trả lời AI lúc này. Vui lòng thử lại."},503)}

}
export function onRequestGet(){return json({error:"Chỉ hỗ trợ POST."},405)}
