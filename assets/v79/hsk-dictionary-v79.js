(function(root){
  "use strict";

  var VERSION="79.0";
  var BASE_PATH="./assets/v79/hsk-dictionary/";
  var MIN_TERMS=10000;
  var loading=false;
  var retryCount=0;

  function emit(name,detail){
    if(typeof root.dispatchEvent!=="function")return;
    var event;
    try{event=new CustomEvent(name,{detail:detail||{}});}
    catch(error){event=document.createEvent("CustomEvent");event.initCustomEvent(name,false,false,detail||{});}
    root.dispatchEvent(event);
  }

  function setStatus(status,message,extra){
    var meta=root.HSK_DICTIONARY_META||(root.HSK_DICTIONARY_META={});
    meta.version=VERSION;
    meta.status=status;
    meta.message=message||"";
    if(extra)for(var key in extra)if(Object.prototype.hasOwnProperty.call(extra,key))meta[key]=extra[key];
    emit("vduckie:hsk-dictionary-status",meta);
  }

  function fetchJson(url){
    return fetch(url,{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error(response.status+" "+response.statusText+" · "+url);
      return response.json();
    });
  }

  function normalizeTerm(item){
    return {
      hanzi:item.h||"",
      pinyin:item.p||"",
      traditional:item.t||"",
      pos:item.o||"",
      levels:Array.isArray(item.l)?item.l.slice(0):[],
      meanings:Array.isArray(item.m)?item.m.slice(0):[],
      id:item.i||""
    };
  }

  function installData(manifest,chunks){
    var terms=[];
    for(var i=0;i<chunks.length;i++){
      var chunk=chunks[i]||[];
      for(var j=0;j<chunk.length;j++){
        var term=normalizeTerm(chunk[j]);
        if(term.hanzi)terms.push(term);
      }
    }
    if(terms.length<MIN_TERMS)throw new Error("Bộ HSK chỉ có "+terms.length+" từ; cần tối thiểu "+MIN_TERMS+" từ.");
    root.HSK_DICTIONARY_TERMS=terms;
    root.HSK_DICTIONARY_META={
      version:VERSION,
      status:"ready",
      message:"Đã nạp "+terms.length+" từ HSK.",
      termCount:terms.length,
      translatedCount:Number(manifest.translatedCount||0),
      untranslatedCount:Number(manifest.untranslatedCount||0),
      levelCounts:manifest.levelCounts||{},
      standard:manifest.standard||"GF0025-2021 · HSK 3.0",
      generatedAt:manifest.generatedAt||"",
      sources:manifest.sources||[]
    };
    loading=false;
    emit("vduckie:hsk-dictionary-ready",root.HSK_DICTIONARY_META);
  }

  function load(){
    if(loading||root.HSK_DICTIONARY_TERMS&&root.HSK_DICTIONARY_TERMS.length>=MIN_TERMS)return;
    loading=true;
    setStatus("loading","Đang nạp bộ từ điển HSK 10.000+ từ…");
    fetchJson(BASE_PATH+"manifest.json?v="+VERSION).then(function(manifest){
      if(!manifest||Number(manifest.termCount||0)<MIN_TERMS||!Array.isArray(manifest.chunks))throw new Error("Manifest HSK v79 không hợp lệ.");
      return Promise.all(manifest.chunks.map(function(name){return fetchJson(BASE_PATH+name+"?v="+VERSION);})).then(function(chunks){
        installData(manifest,chunks);
      });
    }).catch(function(error){
      loading=false;
      retryCount++;
      setStatus("waiting","Dữ liệu HSK v79 đang được đồng bộ lên web.",{error:String(error&&error.message||error),retryCount:retryCount});
      if(retryCount<=12)root.setTimeout(load,Math.min(30000,3000+retryCount*2000));
      else setStatus("error","Chưa nạp được bộ HSK 10.000+ từ. Hãy tải lại trang sau khi GitHub Pages đồng bộ.",{error:String(error&&error.message||error)});
    });
  }

  root.VDuckieHSKDictionaryLoader={version:VERSION,load:load,retry:function(){retryCount=0;load();}};
  if(typeof document==="undefined")return;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});
  else load();
})(typeof window!=="undefined"?window:globalThis);
