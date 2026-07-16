(function(){
  "use strict";
  function loadRuntime(){
    var parts=[1,2,3,4].map(function(n){
      return fetch("./assets/v62/runtime.part"+n+".txt?v=70",{cache:"no-store"}).then(function(response){
        if(!response.ok)throw new Error("Thiếu runtime phần "+n);
        return response.text();
      });
    });
    Promise.all(parts).then(function(code){Function(code.join(""))();}).catch(function(error){console.error("Không nạp được v70:",error);});
  }
  var script=document.createElement("script");
  script.src="./assets/v62/audio-direct-v70.js?v=70";
  script.onload=loadRuntime;
  script.onerror=loadRuntime;
  document.head.appendChild(script);
})();
