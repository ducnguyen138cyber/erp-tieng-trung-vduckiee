(function(){
  "use strict";
  function loadParts(prefix,count){
    var tasks=[];
    for(var i=1;i<=count;i++){
      tasks.push(fetch("./assets/v75/"+prefix+".part"+i+".txt?v=75.0",{cache:"no-store"}).then(function(response){
        if(!response.ok)throw new Error("Thiếu gói HSK 1 v75");
        return response.text();
      }));
    }
    return Promise.all(tasks).then(function(parts){return parts.join("");});
  }
  loadParts("hsk1-data",4).then(function(code){
    Function(code)();
    return loadParts("hsk1-runtime",3);
  }).then(function(code){
    Function(code)();
  }).catch(function(error){
    console.error("Không nạp được HSK 1 v75:",error);
  });
})();
