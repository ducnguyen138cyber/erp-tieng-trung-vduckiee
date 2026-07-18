(function(){
  "use strict";
  function loadFeedbackContext(){
    var script=document.createElement("script");
    script.src="./assets/v62/hsk-feedback-context-v69.js?v=70.2";
    script.onerror=function(){console.error("Không nạp được bộ nhận xét HSK theo ngữ cảnh.");};
    document.head.appendChild(script);
  }
  function loadHskRoastContextV801(){
    var script=document.createElement("script");
    script.src="./assets/v80/hsk-roast-context-v80.1.js?v=80.1";
    script.onerror=function(){console.error("Không nạp được Roast Mode HSK theo bài v80.1.");};
    document.head.appendChild(script);
  }
  function loadRuntime(){
    var script=document.createElement("script");
    script.src="./assets/v62/runtime-v70.2.js?v=70.2";
    script.onload=function(){loadFeedbackContext();loadHskRoastContextV801();};
    script.onerror=function(error){
      console.error("Không nạp được v70.2:",error);
      var element=document.getElementById("communityConnection");
      if(element){
        element.className="community-connection bad";
        element.textContent="Không nạp được bản cập nhật. Hãy Ctrl+F5 để tải lại.";
      }
    };
    document.head.appendChild(script);
  }
  function loadHsk1V75(){
    var script=document.createElement("script");
    script.src="./assets/v75/hsk1-v75-loader.js?v=75.0";
    script.onerror=function(){console.error("Không nạp được HSK 1 v75.");};
    document.head.appendChild(script);
  }
  function loadHomeWelcomeV751(){
    var script=document.createElement("script");
    script.src="./assets/v75/home-welcome-v75.1.js?v=75.1";
    script.onerror=function(){console.error("Không nạp được phần hướng dẫn trang chủ v75.1.");};
    document.head.appendChild(script);
  }
  function loadHomeLayoutV753(){
    var script=document.createElement("script");
    script.src="./assets/v75/home-layout-v75.3.js?v=75.3";
    script.onerror=function(){console.error("Không nạp được bố cục trang chủ v75.3.");};
    document.head.appendChild(script);
  }
  function loadHskDictionaryV79(){
    var script=document.createElement("script");
    script.src="./assets/v79/hsk-dictionary-v79.js?v=79.0";
    script.onerror=function(){console.error("Không nạp được dữ liệu HSK 10.000+ v79.");};
    document.head.appendChild(script);
  }
  function loadUnifiedDictionaryV79(){
    var script=document.createElement("script");
    script.src="./assets/v79/unified-dictionary-v79.js?v=79.0";
    script.onerror=function(){console.error("Không nạp được Từ điển chung v79.");};
    document.head.appendChild(script);
  }
  function loadHomeCopyV79(){
    var script=document.createElement("script");
    script.src="./assets/v79/home-copy-v79.js?v=79.0";
    script.onerror=function(){console.error("Không nạp được nội dung trang chủ v79.");};
    document.head.appendChild(script);
  }
  function loadExperienceSuiteV864(){
    var script=document.createElement("script");
    script.src="./assets/v86/experience-suite-loader-v86.js?v=86.4";
    script.onerror=function(){console.error("Không nạp được gói trải nghiệm v83–v86.4.");};
    document.head.appendChild(script);
  }
  loadHomeWelcomeV751();
  loadHomeLayoutV753();
  loadHsk1V75();
  loadRuntime();
  loadHskDictionaryV79();
  loadUnifiedDictionaryV79();
  loadHomeCopyV79();
  loadExperienceSuiteV864();
})();