(function(root){
  "use strict";
  if(root.__VDUCKIE_DICTIONARY_V79_LOADING__)return;
  root.__VDUCKIE_DICTIONARY_V79_LOADING__=true;
  var count=5,tasks=[];
  for(var i=1;i<=count;i++)(function(index){
    tasks.push(fetch("./assets/v79/unified-dictionary-v79.part"+index+".txt?v=79.0",{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error("Thiếu gói Từ điển v79 phần "+index);
      return response.text();
    }));
  })(i);
  Promise.all(tasks).then(function(parts){
    Function(parts.join(""))();
  }).catch(function(error){
    root.__VDUCKIE_DICTIONARY_V79_LOADING__=false;
    console.error("Không nạp được Từ điển chung v79:",error);
  });
})(typeof window!=="undefined"?window:globalThis);
