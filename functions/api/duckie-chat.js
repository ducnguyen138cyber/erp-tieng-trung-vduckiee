// Cloudflare Pages Functions; Workers AI binding AI. No paid API fallback.
const DEFAULT_MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
const ALLOWED=new Set([DEFAULT_MODEL,"@cf/qwen/qwen3-30b-a3b-fp8","@cf/qwen/qwen3.8-27b"]);
const HANZI=/[\u3400-\u9fff\uf900-\ufaff]/u;
const TONE=/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const SYSTEM="Bạn là Duckie, gia sư tiếng Trung giản thể HSK1–HSK6, giao tiếp tự nhiên và môi trường công xưởng/ERP. Trả lời tiếng Việt thân thiện, đúng trọng tâm. Trả lời trực tiếp trước; một từ đơn thì ghi chữ Hán (Pinyin có dấu) — nghĩa và ví dụ ngắn có ích, không lan man. Ngữ pháp: giải thích nghĩa, công thức, 2–3 ví dụ Hán/Pinyin/Việt và lỗi thường gặp nếu cần. Sửa câu: câu gốc, câu sửa nếu sai, Pinyin, nghĩa Việt; phân biệt lỗi ngữ pháp với cách nói kém tự nhiên. Dịch nhanh: tiếng Trung, Pinyin, dịch ngược, không giải thích. Hội thoại: trò chuyện trong vai phù hợp, không ép thành bài giảng. Mọi ví dụ tiếng Trung đều dùng chữ Hán giản thể Unicode thật, Pinyin có dấu và nghĩa Việt; không bao giờ đặt dấu nháy rỗng thay chữ Hán. Không bịa dữ liệu từ điển, Pinyin, ví dụ, thuật ngữ ERP. Không khẳng định quy định/phiên bản kỳ thi HSK hiện tại nếu không có dữ liệu được kiểm chứng; nói rõ giới hạn. Nếu chưa chắc hãy nói rõ. Câu hỏi ngắn nối tiếp tham chiếu từ/câu trước đó. Câu hỏi không liên quan tiếng Trung vẫn có thể trả lời bình thường. Viết gọn, Markdown đơn giản, không HTML.";
const GLOSSARY=[
{keys:["viết"],hanzi:"写",pinyin:"xiě",meaning:"viết",example:"写信 (xiě xìn) — viết thư"},
{keys:["mặc cả","trả giá"],hanzi:"讨价还价",pinyin:"tǎo jià huán jià",meaning:"mặc cả, trả giá",example:"可以便宜一点吗？(Kěyǐ piányi yìdiǎn ma?) — Có thể rẻ hơn một chút không?"},
{keys:["ăn tối"],hanzi:"吃晚饭",pinyin:"chī wǎnfàn",meaning:"ăn tối",example:"我晚上七点吃晚饭。 (Wǒ wǎnshang qī diǎn chī wǎnfàn.) — Tôi ăn tối lúc bảy giờ."}
];
function plain(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d")}
function intent(s){
 const q=plain(s.trim());
 if(/^(dich:|dich nhanh|translate:)|dich sang tieng trung/.test(q))return "translate";
 if(/sua cau|cau nay co dung|co dung khong|kiem tra cau/.test(q))return "correct";
 if(/ngu phap|cau truc|su dung nhu the nao|khac nhau|phan biet/.test(q))return "grammar";
 if(/hoi thoai|dong vai|luyen giao tiep/.test(q))return "roleplay";
 if(/tieng trung|chu han|viet nhu|viet the|pinyin|汉字|中文/.test(q))return "vocab";
 return "general";
}
function followup(s){return !/tiếng trung|中文|汉字|chữ hán/i.test(s)&&s.trim().length<85&&/^(?:thế|vậy|còn|nó|từ này|câu này|từ đó|cái đó|đó)?[\s,!?]*(?:viết|đọc|phát âm|phiên âm|pinyin|nghĩa|dùng|ví dụ|đặt câu|cách viết|cách đọc)\b/i.test(s.trim())}
function lookup(s){const q=plain(s);if(!/tieng trung|viet|dich|chu han/.test(q))return null;const matches=GLOSSARY.flatMap(entry=>entry.keys.map(key=>({entry,key:plain(key)}))).filter(item=>q.includes(item.key)).sort((a,b)=>b.key.length-a.key.length);return matches[0]?.entry||null}
function exactGlossaryQuestion(text,entry){
 if(!entry)return false;
 const q=plain(text).replace(/[?？!！.。]+$/g,"").trim().replace(/\s+/g," ");
 return entry.keys.some(key=>{
  const word=plain(key);
  return q===word+" tieng trung la gi"||q==="tu "+word+" tieng trung la gi"||
    q==="cum tu "+word+" tieng trung la gi";
 });
}
// Compare the pronunciation attached to the target word, not an unrelated
// correct syllable elsewhere. NFC and syllable spacing are presentation details.
function canonicalPinyin(s){return s.normalize("NFC").toLowerCase().replace(/[\s’'·]/g,"")}
function hasPinyin(reply){
 const text=reply.normalize("NFC").replace(/[*_`]/g,"");
 // Vietnamese prose also contains á/à/è: inspect labelled or parenthesized
 // pronunciation instead of accepting an accent anywhere in the answer.
 return [...text.matchAll(/[（(]([^()（）\n]+)[）)]|(?:pinyin|phiên âm)\s*:\s*([^\n]+)/giu)]
  .some(match=>{const value=(match[1]||match[2]).trim();
   return /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s’'·,，.!?。！？;:—-]+$/iu.test(value)&&TONE.test(value);
  });
}
function verifiedPair(reply,fact){
 const text=reply.normalize("NFC").replace(/[*_`]/g,"");
 const pairs=[...text.matchAll(/([\u3400-\u9fff]+)\s*[（(]([^()（）\n]+)[）)]/gu)]
  .filter(match=>match[1]===fact.hanzi);
 return pairs.length>0&&pairs.every(match=>canonicalPinyin(match[2])===canonicalPinyin(fact.pinyin));
}
function exactProgressiveQuestion(s){
 const q=plain(s).trim().replace(/[?？!！.。]+$/g,"").trim().replace(/\s+/g," ");
 return /^(?:giai thich (?:cau truc |ngu phap )?|cau truc |ngu phap )越来越$/.test(q);
}
const PROGRESSIVE_REFERENCE="越来越 (yuè lái yuè) — ngày càng, càng ngày càng.\nMẫu thường dùng: 越来越 + tính từ hoặc động từ tâm lý/trạng thái.\n\n我越来越忙了。\nWǒ yuè lái yuè máng le.\nTôi ngày càng bận.\n\n我越来越喜欢这个城市。\nWǒ yuè lái yuè xǐhuan zhège chéngshì.\nTôi ngày càng thích thành phố này.";
function unpack(r){return typeof r?.response==="string"?r.response:typeof r?.result?.response==="string"?r.result.response:typeof r?.choices?.[0]?.message?.content==="string"?r.choices[0].message.content:""}
function validate(reply,kind,fact){
 if(!reply||!reply.trim())return "empty";
 if(/["“”‘’]\s*["“”‘’]\s*\([^)]*[āǎīǐōǒūǔ]/iu.test(reply))return "empty-hanzi";
 // A verified dictionary entry has an exact Hanzi/Pinyin pair. A generic
 // accent check cannot catch wrong tones, e.g. 写 (xiè) instead of 写 (xiě).
 if(fact&&kind==="vocab"){
  if(!reply.includes(fact.hanzi))return "wrong-verified-word";
  if(!verifiedPair(reply,fact))return "wrong-verified-pinyin";
 }
 // Admitting uncertainty is safer than forcing the model to fabricate Hanzi.
 // This exception does not override the verified dictionary check above.
 if(!HANZI.test(reply)&&/^(?:mình |tôi )?(?:chưa xác định|không thể xác định|chưa chắc)/i.test(reply))return null;
 if(["vocab","translate","grammar","correct"].includes(kind)){
  if(!HANZI.test(reply))return "missing-hanzi";
  if(["vocab","translate","grammar","correct"].includes(kind)&&!hasPinyin(reply)&&!/không chắc|chưa xác định/i.test(reply))return "missing-pinyin";
 }
 if(/[,;，：:(（]\s*$/.test(reply))return "truncated";
 return null;
}
export async function onRequestPost({request,env}){
 if(!(request.headers.get("content-type")||"").includes("application/json"))return json({error:"Yêu cầu phải là JSON."},415);
 if(Number(request.headers.get("content-length")||0)>18000)return json({error:"Hội thoại quá dài."},413);
 let body;try{body=await request.json()}catch{return json({error:"JSON không hợp lệ."},400)}
 if(!body||!Array.isArray(body.messages)||!body.messages.length||body.messages.length>12)return json({error:"Hội thoại phải có 1–12 tin."},400);
 const messages=body.messages.map(x=>({role:x?.role,content:x?.content}));
 if(messages.some(x=>!["user","assistant"].includes(x.role)||typeof x.content!=="string"||!x.content.trim()||x.content.length>1600)||messages.at(-1).role!=="user")return json({error:"Tin nhắn không hợp lệ."},400);
 const last=messages.at(-1).content,prev=messages.slice(0,-1).reverse().find(x=>x.role==="user");
 const isContinuation=followup(last)&&!!prev;
 const kind=isContinuation&&/viết|đọc|pinyin|phiên âm/i.test(last)?"vocab":intent(last);
 const fact=isContinuation?GLOSSARY.find(x=>x.keys.some(key=>plain(prev.content).includes(plain(key))))||null:lookup(last);
 // Common exact word lookups can be answered directly from bounded verified
 // source examples. This avoids AI inventing unverified Pinyin in extra sentences.
 if(messages.length===1&&fact&&kind==="vocab"&&exactGlossaryQuestion(last,fact))
  return json({reply:fact.hanzi+" ("+fact.pinyin+") — "+fact.meaning+".\nVí dụ: "+fact.example+(/[.!?。！？]$/.test(fact.example)?"":"."),
    source:"verified-glossary"});
 if(messages.length===1&&kind==="grammar"&&exactProgressiveQuestion(last))
  return json({reply:PROGRESSIVE_REFERENCE,source:"grammar-reference"});
 if(!env?.AI||typeof env.AI.run!=="function")return json({error:"AI chưa được kích hoạt."},503);
 const hints=["Kiểu câu hỏi: "+kind+". Tùy loại câu hỏi chọn độ dài và bố cục phù hợp."];
 if(isContinuation)hints.push("Đây là câu hỏi TIẾP NỐI chủ đề trước: "+prev.content+". Không giải thích chữ 'viết' hoặc 'đọc' nếu người dùng đang hỏi cách viết/đọc từ trước.");
 if(fact)hints.push("Dữ liệu từ điển đã kiểm tra (chỉ dùng khi đúng ngữ cảnh): "+fact.hanzi+" ("+fact.pinyin+") — "+fact.meaning+"; "+fact.example+".");
 if(kind==="grammar"&&last.includes("越来越"))hints.push("Tham chiếu để trả lời ngắn: 越来越 (yuè lái yuè) diễn tả mức độ tăng dần: 越来越 + tính từ hoặc động từ tâm lý/trạng thái. Hai câu ví dụ đầy đủ: 我越来越忙了。 (Wǒ yuè lái yuè máng le.) — Tôi ngày càng bận. 我越来越喜欢这个城市。 (Wǒ yuè lái yuè xǐhuan zhège chéngshì.) — Tôi ngày càng thích thành phố này. Giải thích bằng mẫu và hai ví dụ này, tối đa khoảng 120 từ. Giải thích cả cụm 越来越, không tách riêng từng chữ để suy ra nghĩa hoặc công thức. Chỉ giải thích cấu trúc người dùng hỏi; giữ từ thường khi nêu quy tắc, tránh phát biểu tuyệt đối. Không mở rộng sang cấu trúc 越…越… hoặc các ví dụ sai/lỗi thường gặp trừ khi người dùng hỏi rõ.");
 if(fact&&fact.hanzi==="吃晚饭")hints.push("Chỉ giải thích nghĩa và ví dụ đã kiểm tra. Không tự thêm khung giờ bắt đầu/kết thúc bữa tối hoặc quy tắc văn hóa nếu người dùng không hỏi.");
 if(body.context&&typeof body.context.hanzi==="string"&&body.context.hanzi.length<=24&&HANZI.test(body.context.hanzi))hints.push("Từ đang chọn trên giao diện: "+body.context.hanzi+". Chỉ tham chiếu khi người dùng nói 'từ này'.");
 const model=ALLOWED.has(env.DUCKIE_AI_MODEL)?env.DUCKIE_AI_MODEL:DEFAULT_MODEL;
 async function generate(retry){
  const instructions=SYSTEM+"\n"+hints.join("\n")+(retry?"\nLượt vừa rồi lỗi "+retry+". Hãy viết lại toàn bộ đáp án, đảm bảo chữ Hán thực, Pinyin dấu và không bị cắt.":"");
  const r=await env.AI.run(model,{messages:[{role:"system",content:instructions},...messages],max_tokens:1100,temperature:0.25});
  return unpack(r).trim();
 }
 try{
  let reply=await generate(""),reason=validate(reply,kind,fact);
  if(reason){reply=await generate(reason);reason=validate(reply,kind,fact)}
  if(reason)return json({error:"Duckie chưa thể xác minh chữ Hán và phiên âm trong câu trả lời. Hãy thử hỏi lại rõ hơn.",reason},422);
  return json({reply:reply.slice(0,5000)});
 }catch(e){console.error("Duckie AI call failed",String(e?.message||e).slice(0,160));return json({error:"Duckie tạm thời không trả lời được. Hãy thử lại sau."},503)}
}
export function onRequestGet(){return json({error:"Chỉ hỗ trợ POST."},405)}
