'use strict';
// Execute only the real loader against the checked-in shell, without app/network
// mocks deciding which URLs ought to load. Inspect the resulting public HTML.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
async function publicEntrypoint(root=process.cwd()){
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const script=index.match(/<script>\s*\(async function restoreStaticVDuckie\(\)\{[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');
 let html='',failure;
 const doc={open(){},write(s){html=s;},close(){},readyState:'complete',getElementById(){return null;}};
 await vm.runInNewContext(script,{fetch:async url=>{assert.match(url,/^\.\/app-shell-v88\.html\?v=.+/);return {ok:true,text:async()=>fs.readFileSync(path.join(root,'app-shell-v88.html'),'utf8')};},document:doc,location:{search:''},URLSearchParams,console:{error(e){failure=e;}}});
 assert.ifError(failure);assert.ok(html.includes('study-center'),'the loader must actually write its shell');
 const urls=[...html.matchAll(/(?:src|href)=["'](\.\/assets\/[^"']+)["']/g)].map(m=>m[1]);
 return {html,urls,asset(name){const matches=urls.filter(url=>new URL(url,'https://vduckie.test/').pathname=== '/'+name);assert.equal(matches.length,1,name+' must load exactly once');const url=matches[0],parsed=new URL(url,'https://vduckie.test/');assert.ok(parsed.searchParams.get('v'),name+' needs a nonempty cache key');const bytes=fs.readFileSync(path.join(root,name));assert.ok(bytes.length>0);if(name.endsWith('.js'))assert.doesNotThrow(()=>new vm.Script(bytes.toString()),name);return url;}};
}
module.exports={publicEntrypoint};
