(function(root){
  "use strict";
  if(root.__VDUCKIE_DICTIONARY_V78_LOADING__)return;
  root.__VDUCKIE_DICTIONARY_V78_LOADING__=true;
  var count=5,tasks=[];
  for(var i=1;i<=count;i++)(function(index){
    tasks.push(fetch("./assets/v78/unified-dictionary-v78.part"+index+".txt?v=78.0",{cache:"no-store"}).then(function(response){
      if(!response.ok)throw new Error("Thiếu gói Từ điển v78 phần "+index);
      return response.text();
    }));
  })(i);
  Promise.all(tasks).then(function(parts){
    Function(parts.join(""))();
  }).catch(function(error){
    root.__VDUCKIE_DICTIONARY_V78_LOADING__=false;
    console.error("Không nạp được Từ điển chung v78:",error);
  });
})(typeof window!=="undefined"?window:globalThis);
