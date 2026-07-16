(function(){
  "use strict";

  function loadRuntime(){
    var parts=[1,2,3,4].map(function(n){
      return fetch("./assets/v62/runtime.part"+n+".txt?v=64",{cache:"no-store"}).then(function(response){
        if(!response.ok)throw new Error("Thiếu runtime v62 phần "+n);
        return response.text();
      });
    });
    Promise.all(parts).then(function(code){
      Function(code.join(""))();
    }).catch(function(error){
      console.error("Không nạp được v62:",error);
      var element=document.getElementById("communityConnection");
      if(element){
        element.className="community-connection bad";
        element.textContent="Không nạp được bản v62. Hãy Ctrl+F5 để tải lại.";
      }
    });
  }

  var script=document.createElement("script");
  script.src="./assets/v62/audio-fix.js?v=64";
  script.onload=loadRuntime;
  script.onerror=function(){
    console.error("Không nạp được bản vá audio Adam.");
    loadRuntime();
  };
  document.head.appendChild(script);
})();
