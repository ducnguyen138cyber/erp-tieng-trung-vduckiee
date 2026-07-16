(function(){
  "use strict";
  function loadFeedbackContext(){
    var script=document.createElement("script");
    script.src="./assets/v62/hsk-feedback-context-v69.js?v=70";
    script.onerror=function(){console.error("Không nạp được bộ nhận xét HSK theo ngữ cảnh.");};
    document.head.appendChild(script);
  }
  function loadRuntime(){
    var parts=[1,2,3,4].map(function(n){
      return fetch("./assets/v62/runtime.part"+n+".txt?v=70",{cache:"no-store"}).then(function(response){
        if(!response.ok)throw new Error("Thiếu runtime phần "+n);
        return response.text();
      });
    });
    Promise.all(parts).then(function(code){Function(code.join(""))();loadFeedbackContext();}).catch(function(error){
      console.error("Không nạp được v70:",error);
      var element=document.getElementById("communityConnection");
      if(element){
        element.className="community-connection bad";
        element.textContent="Không nạp được bản cập nhật. Hãy Ctrl+F5 để tải lại.";
      }
    });
  }
  var directAudio=document.createElement("script");
  directAudio.src="./assets/v62/audio-direct-v70.js?v=70";
  directAudio.onload=loadRuntime;
  directAudio.onerror=function(){
    console.error("Không nạp được bộ phát 60 clip Adam riêng biệt.");
    loadRuntime();
  };
  document.head.appendChild(directAudio);
})();