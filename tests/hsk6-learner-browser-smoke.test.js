'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test'),{spawnSync}=require('node:child_process');
test('HSK6 learner browser smoke passes all required viewports and flows',{timeout:520000},()=>{
 const script=path.join(__dirname,'hsk6-learner-browser-smoke.py'),favicon=path.join(__dirname,'..','favicon.ico'),existed=fs.existsSync(favicon);
 try{
  if(!existed)fs.writeFileSync(favicon,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>','utf8');
  const r=spawnSync(process.env.PYTHON||'python',[script],{encoding:'utf8',timeout:510000,env:{...process.env,PYTHONUNBUFFERED:'1'}});
  assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);const payload=JSON.parse(r.stdout.trim());
  assert.deepEqual(Object.keys(payload.viewports).sort(),['desktop-1024','desktop-1440','mobile-320','mobile-390']);assert.ok(Object.values(payload.flows).every(x=>x==='pass'));
 }finally{if(!existed&&fs.existsSync(favicon))fs.unlinkSync(favicon);}
});
