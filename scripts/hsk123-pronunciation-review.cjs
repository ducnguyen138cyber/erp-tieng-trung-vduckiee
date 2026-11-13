#!/usr/bin/env node
'use strict';
// Triage queue, never reviewer approval. Candidate categories are not verdicts.
const fs=require('node:fs'),path=require('node:path');
const report=JSON.parse(fs.readFileSync('reports/hsk123/current.json'));
const byId=new Map();for(const f of report.files){const d=JSON.parse(fs.readFileSync(f.file));for(const r of d.records||[])byId.set(r.id,r);}
const refs={standard:'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/201207/t20120717_139437.html',speech:'https://www.moe.gov.cn/ewebeditor/uploadfile/2015/03/02/20150302165029995.pdf',who:'https://dict.revised.moe.edu.tw/dictView.jsp?ID=8878&la=1&powerMode=0'};
const rows=report.issues.filter(i=>!i.confirmed&&/reading-needs-review|pinyin-alignment/.test(i.rule)).map(i=>{
 const r=byId.get(i.id),ev=i.evidence,chars=Array.from(ev.hanzi).filter(c=>/[\u3400-\u9fff]/.test(c));
 const comparisons=[...(ev.comparisons||[]),...(ev.polyphoneContextComparisons||[])].map(c=>({...c,character:chars[c.characterIndex]}));
 const plausible=c=>c.given.endsWith('5')||(['一','不'].includes(c.character)&&/^(yi|bu)[124]$/.test(c.given))||(c.character==='谁'&&c.given==='shei2');
 const possible=(comparisons.length&&comparisons.every(plausible))||(!comparisons.length&&ev.hanzi.includes('儿')&&/r(?:\s|$|[.,!?，。！？])/.test(ev.pinyin));
 const source=r.chinese||(r.examples||[])[0]?.zh||(r.sentenceIds||[]).map(id=>byId.get(id)?.chinese).find(Boolean)||null;
 return {id:i.id,file:i.file,hanzi:ev.hanzi,pinyin:ev.pinyin,meaningVi:r.meaningVi,sourceSentence:source,category:possible?'possibly-valid-context':'specialist-required',reasonVi:possible?'Có thể là âm nhẹ, biến điệu 一/不, biến thể 谁 hoặc âm 儿 hóa; khác từ điển máy không đủ kết luận sai.':'Cần đối chiếu ngữ cảnh và cách đọc từ; bộ đối chiếu máy chưa đủ xác nhận.',comparisons,sourceIds:r.sourceIds||[],references:[refs.standard,refs.speech,...(ev.hanzi.includes('谁')?[refs.who]:[])],reviewStatus:'unreviewed',confirmedError:false};
});
const counts=rows.reduce((o,r)=>(o[r.category]=(o[r.category]||0)+1,o),{'confirmed-error':0});
fs.writeFileSync('reports/hsk123/pronunciation-review.json',JSON.stringify({schemaVersion:1,tool:'editorial triage; not independent linguistic review',counts,rows},null,2)+'\n');
const esc=s=>String(s??'Chưa có câu ví dụ').replace(/\|/g,'\\|').replace(/\n/g,' ');
fs.writeFileSync('docs/hsk123-pronunciation-review.md',`# Hàng chờ xác minh cách đọc HSK1–3\n\n${rows.length} cảnh báo máy, **0 lỗi phát âm được xác nhận** trong nhóm này. ${counts['possibly-valid-context']} mục có dấu hiệu cách đọc hợp lệ theo ngữ cảnh; ${counts['specialist-required']} mục cần chuyên môn. Đây là phân loại hỗ trợ rà soát, không phải chứng nhận đúng. Không sửa Pinyin chỉ vì khác từ điển máy.\n\nNguồn: [GB/T 16159-2012 (thông báo Bộ Giáo dục)](${refs.standard}); [GF0016-2010, mục 5.2.2 về nguyên điệu, biến điệu, âm nhẹ và 儿 hóa](${refs.speech}); [谁: shéi/shuí](${refs.who}). Khác biệt âm nhẹ vẫn phải xác minh theo từng từ. Chi tiết so sánh và sourceIds trong [JSON](../reports/hsk123/pronunciation-review.json).\n\n| ID | Chữ Hán | Pinyin | Nghĩa Việt | Câu nguồn | Lý do / phân loại |\n| --- | --- | --- | --- | --- | --- |\n`+rows.map(r=>`| ${r.id} | ${esc(r.hanzi)} | ${esc(r.pinyin)} | ${esc(r.meaningVi)} | ${esc(r.sourceSentence)} | ${r.category}: ${r.reasonVi} |`).join('\n')+'\n');
console.log(JSON.stringify(counts));
