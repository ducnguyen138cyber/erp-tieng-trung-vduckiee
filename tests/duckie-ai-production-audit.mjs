// Bounded real endpoint probe. No learner accounts or personal conversations.
import {mkdir,writeFile} from 'node:fs/promises';
import {classify} from './duckie-ai-audit-result.mjs';
const candidate=process.env.DUCKIE_REQUIRE_CANDIDATE==='1';
let endpoint=process.env.DUCKIE_AUDIT_URL;
if(candidate&&!endpoint){
 // Cloudflare's deployment comment binds an immutable preview URL to this SHA.
 const repo=process.env.GITHUB_REPOSITORY,pr=process.env.DUCKIE_PR_NUMBER,sha=process.env.DUCKIE_HEAD_SHA;
 if(!repo||!pr||!sha)throw Error('Missing candidate provenance');
 for(let attempt=0;attempt<24&&!endpoint;attempt++){
  const res=await fetch(`https://api.github.com/repos/${repo}/issues/${pr}/comments?per_page=100`,{
   headers:{accept:'application/vnd.github+json',authorization:`Bearer ${process.env.GITHUB_TOKEN}`},signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw Error(`Preview discovery HTTP ${res.status}`);
  const comments=await res.json();
  for(const comment of comments){
   if(comment.user?.login!=='cloudflare-workers-and-pages[bot]')continue;
   const body=comment.body||'';
   const deployedSha=body.match(/Latest commit:[\s\S]*?<code>([a-f0-9]{7,40})<\/code>/i)?.[1];
   const preview=body.match(/Preview URL:[\s\S]*?href=['"](https:\/\/[a-f0-9]+\.vduckie\.pages\.dev)/i)?.[1];
   if(deployedSha&&sha.startsWith(deployedSha)&&preview&&/Deploy successful!/.test(body))endpoint=preview+'/api/duckie-chat';
  }
  if(!endpoint)await new Promise(resolve=>setTimeout(resolve,10000));
 }
 if(!endpoint)throw Error('No successful Cloudflare preview for exact PR head; production was not substituted');
}
endpoint||='https://vduckie.pages.dev/api/duckie-chat';
const checks=[
 {id:'write',ask:'Viết tiếng Trung là gì?',expect:['写','xiě'],glossary:true},
 {id:'bargain',ask:'Mặc cả tiếng Trung là gì?',expect:['讨价还价','tǎo jià huán jià'],glossary:true},
 {id:'dinner',ask:'Ăn tối tiếng Trung là gì?',expect:['吃晚饭','chī wǎnfàn'],glossary:true},
 {id:'progressive',ask:'Giải thích cấu trúc 越来越',expect:['越来越']}
];
const report={timestamp:new Date().toISOString(),endpoint,headSha:process.env.DUCKIE_HEAD_SHA||null,
 target:candidate?'candidate-preview':'explicit-endpoint-or-production',scope:'4 bounded real guest requests',
 limitations:['Spot checks do not certify grammar, every example, or all vocabulary.',
 'Glossary answers validate curated lookup delivery, not generative model quality.',
 '422/503, network errors and unavailable AI are not successful teaching checks.'],checks:[]};
for(const item of checks){
 const result={id:item.id,query:item.ask,status:null,result:'unavailable',reply:'',source:null,reason:''};
 try{
  let response;result.statusAttempts=[];
  // A freshly published Pages preview can briefly return 404 at another edge.
  // One bounded retry is recorded; 422/503/model errors are never hidden.
  for(let attempt=0;attempt<2;attempt++){
   response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({messages:[{role:'user',content:item.ask}]}),signal:AbortSignal.timeout(25000)});
   result.statusAttempts.push(response.status);
   if(response.status!==404||attempt===1)break;
   await response.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,1500));
  }
  result.status=response.status;const body=await response.json().catch(()=>({}));
  result.reply=String(body.reply||'').slice(0,5000);result.source=body.source||null;
  result.reason=String(body.reason||body.error||'').slice(0,180);
  result.result=classify(item,response.status,body,candidate);
 }catch(error){result.reason=String(error.message||error).slice(0,180);}
 report.checks.push(result);console.log('DUCKIE_LIVE_QUALITY '+JSON.stringify(result));
}
report.passed=report.checks.filter(x=>x.result==='glossary-spot-check').length;
report.incorrect=report.checks.filter(x=>['incorrect-or-incomplete','wrong-deployment'].includes(x.result)).length;
report.needsReview=report.checks.filter(x=>x.result==='pedagogy-review-needed').length;
report.inconclusive=report.checks.length-report.passed-report.incorrect-report.needsReview;
report.acceptance=report.incorrect?'fail':report.inconclusive?'inconclusive':'smoke-complete-editorial-review-required';
await mkdir('artifacts/ai-quality',{recursive:true});
await writeFile('artifacts/ai-quality/live-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('AI_AUDIT_SUMMARY '+JSON.stringify({target:report.target,passed:report.passed,incorrect:report.incorrect,needsReview:report.needsReview,inconclusive:report.inconclusive,acceptance:report.acceptance}));
if(report.incorrect||(candidate&&report.inconclusive))process.exitCode=1;
