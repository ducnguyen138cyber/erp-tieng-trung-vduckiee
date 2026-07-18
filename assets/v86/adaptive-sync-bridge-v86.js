(function(root){
  "use strict";
  var LOCAL_KEY="vduckie-adaptive-profile-v86";
  var SYNC_KEY="vduckie-result-adaptive-profile-v86";
  var applying=false;

  function parse(value){
    try{return JSON.parse(value||"")||null;}catch(error){return null;}
  }
  function stamp(value){
    var parsed=parse(value);
    return parsed&&Number(parsed.updatedAt||parsed.lastAt||0)||0;
  }
  function copyNewest(){
    if(applying)return;
    applying=true;
    try{
      var local=root.localStorage.getItem(LOCAL_KEY);
      var synced=root.localStorage.getItem(SYNC_KEY);
      if(!local&&synced)root.localStorage.setItem(LOCAL_KEY,synced);
      else if(local&&!synced)root.localStorage.setItem(SYNC_KEY,local);
      else if(local&&synced&&local!==synced){
        if(stamp(synced)>stamp(local))root.localStorage.setItem(LOCAL_KEY,synced);
        else root.localStorage.setItem(SYNC_KEY,local);
      }
    }catch(error){}
    applying=false;
  }
  function mirrorLocal(){
    if(applying)return;
    applying=true;
    try{
      var value=root.localStorage.getItem(LOCAL_KEY);
      if(value!==null&&root.localStorage.getItem(SYNC_KEY)!==value)root.localStorage.setItem(SYNC_KEY,value);
    }catch(error){}
    applying=false;
  }

  root.addEventListener("storage",function(event){
    if(!event)return;
    if(event.key===SYNC_KEY)copyNewest();
    else if(event.key===LOCAL_KEY)mirrorLocal();
  });
  if(root.document){
    root.document.addEventListener("vduckie:adaptive-change",mirrorLocal);
    root.document.addEventListener("vduckie:account-learning-synced",copyNewest);
  }
  copyNewest();
  root.setInterval(mirrorLocal,900);
  root.VDuckieAdaptiveSyncBridge={version:"86.0",localKey:LOCAL_KEY,syncKey:SYNC_KEY,refresh:copyNewest};
})(typeof window!=="undefined"?window:globalThis);
