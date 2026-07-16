(function(){
  "use strict";

  function loadFeedbackContext(){
    var script=document.createElement("script");
    script.src="./assets/v62/hsk-feedback-context-v69.js?v=69.2";
    script.onerror=function(){console.error("Không nạp được bộ nhận xét HSK theo ngữ cảnh.");};
    document.head.appendChild(script);
  }

  function loadRuntime(){
    var parts=[1,2,3,4].map(function(n){
      return fetch("./assets/v62/runtime.part"+n+".txt?v=69.2",{cache:"no-store"}).then(function(response){
        if(!response.ok)throw new Error("Thiếu runtime v62 phần "+n);
        return response.text();
      });
    });
    Promise.all(parts).then(function(code){
      Function(code.join(""))();
      loadFeedbackContext();
    }).catch(function(error){
      console.error("Không nạp được v69:",error);
      var element=document.getElementById("communityConnection");
      if(element){
        element.className="community-connection bad";
        element.textContent="Không nạp được bản cập nhật. Hãy Ctrl+F5 để tải lại.";
      }
    });
  }

  var clipEngine=document.createElement("script");
  clipEngine.src="./assets/v62/clip-engine-v69.js?v=69.2";
  clipEngine.onload=loadRuntime;
  clipEngine.onerror=function(){
    console.error("Không nạp được bộ phát 60 clip Adam đã xác minh.");
    loadRuntime();
  };
  document.head.appendChild(clipEngine);
})();