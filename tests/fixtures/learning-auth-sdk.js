// CI-only auth/REST boundary. Real production learning runtimes are unchanged.
(function(){
 const A='00000000-0000-4000-8000-000000000111',B='00000000-0000-4000-8000-000000000222',listeners=[];
 if(localStorage.getItem('__learning_fixture_owner')===null)localStorage.setItem('__learning_fixture_owner',A);
 const state={owner:localStorage.getItem('__learning_fixture_owner')||'',rpc:[]};
 function user(){return state.owner?{id:state.owner,email:(state.owner===A?'alice':'bob')+'@example.test',user_metadata:{full_name:state.owner===A?'Học viên A':'Học viên B'}}:null;}
 function session(){return user()?{user:user(),access_token:'fixture-only',expires_at:9999999999}:null;}
 function setUser(id){state.owner=id||'';localStorage.setItem('__learning_fixture_owner',state.owner);listeners.forEach(fn=>fn(id?'SIGNED_IN':'SIGNED_OUT',session()));}
 function query(table){
  const req={table,op:'select',filters:{},rows:null,single:false,owner:state.owner};let result;
  function run(){if(!result)result=fetch('https://learning-fixture.supabase.co/rest-fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}).then(r=>r.json());return result;}
  const q=new Proxy({}, {get(_,key){
   if(key==='then')return (ok,bad)=>run().then(ok,bad);
   if(key==='select')return ()=>q;
   if(key==='eq')return (k,v)=>{req.filters[k]=v;return q;};
   if(key==='insert'||key==='upsert'||key==='update')return rows=>{req.op=key;req.rows=Array.isArray(rows)?rows:[rows];return q;};
   if(key==='maybeSingle'||key==='single')return ()=>{req.single=true;return run();};
   return ()=>q;
  }});return q;
 }
 window.__learningAuth={setUser,state,A,B};
 window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:session()},error:null}),getUser:async()=>({data:{user:user()},error:null}),onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{setUser('');return {error:null};},signInWithPassword:async({email})=>{setUser(email.startsWith('bob')?B:A);return {data:{session:session(),user:user()},error:null};}},from:query,rpc:async(name,args)=>{state.rpc.push({name,args});return {data:[],error:null};}};}};
})();
