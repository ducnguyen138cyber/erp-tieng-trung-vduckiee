// Read-only public AI quality probe with harmless Chinese-learning prompts.
// This probes real production, but does NOT certify general teaching accuracy.
import {mkdir,writeFile} from 'node:fs/promises';
const endpoint=process.env.DUCKIE_AUDIT_URL||'https://vduckie.pages.dev/api/duckie-chat';
const checks=[
 {id:'write',ask:'Viết tiếng Trung là gì?',expect:['写','xiě']},
 {id:'bargain',ask:'Mặc cả tiếng Trung là gì?',expect:['讨价还价','tǎo jià huán jià']},
 {id:'dinner',ask:'Ăn tối tiếng Trung là gì?',expect:['吃晚饭','chī wǎnfàn']},
 {id:'progressive',ask:'Giải thích cấu trúc 越来越',expect:['越来越']}
];
const report={timestamp:new Date().toISOString(),endpoint,scope:'4 real production guest requests',
 limitations:['Single-run bounded spot checks cannot certify Chinese grammar quality.',
 'External AI availability and Workers AI quotas can change; 422/503 are reported separately.',
 'No learner account, secrets or personal conversations were used.'],
 checks:[]};
for(const item of checks){
 const result={id:item.id,query:item.ask,status:null,result:'unavailable',replyPreview:'',reason:''};
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({messages:[{role:'user',content:item.ask}]}),signal:AbortSignal.timeout(18000)});
  result.status=response.status;const body=await response.json().catch(()=>({}));
  result.replyPreview=String(body.reply||'').slice(0,550);result.reason=String(body.reason||body.error||'').slice(0,180);
  if(response.status===200){
    const lower=result.replyPreview.toLocaleLowerCase();
    result.result=item.expect.every(expected=>lower.includes(expected.toLocaleLowerCase()))?'verified-spot-check':'incorrect-or-incomplete';
  }else if(response.status===422)result.result='safe-rejected';
  else result.result='unavailable';
 }catch(error){result.reason=String(error.message||error).slice(0,180);}
 report.checks.push(result);console.log('DUCKIE_LIVE_QUALITY '+JSON.stringify(result));
}
report.passed=report.checks.filter(x=>x.result==='verified-spot-check').length;
report.incorrect=report.checks.filter(x=>x.result==='incorrect-or-incomplete').length;
report.inconclusive=report.checks.length-report.passed-report.incorrect;
await mkdir('artifacts/ai-quality',{recursive:true});
await writeFile('artifacts/ai-quality/live-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('AI_AUDIT_SUMMARY '+JSON.stringify({passed:report.passed,incorrect:report.incorrect,inconclusive:report.inconclusive}));
if(report.incorrect)process.exitCode=1;
