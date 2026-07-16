(function(root){
  "use strict";
  if(!root.document||root.__v69HSKFeedbackContext)return;
  root.__v69HSKFeedbackContext=true;

  var vocabularyRoasts=[
    "Chọn sai đáp án rồi. Câu này đang kiểm tra nghĩa và ngữ cảnh, đừng lôi trật tự từ ra chịu tội thay.",
    "Sai ở phần hiểu câu, không phải bẫy ngữ pháp. Đọc lại từ khóa rồi chọn theo đúng ngữ cảnh nhé.",
    "Đáp án này nghe quen nhưng không hợp câu. Xem lại nghĩa của cả câu thay vì chộp từ đầu tiên nhìn thấy.",
    "Lệch đáp án rồi bro. Đây là câu hỏi từ vựng/ngữ cảnh, chưa đến lượt phó từ hay bổ ngữ bị mang ra tế."
  ];

  var grammarRoasts=[
    "Dính bẫy trật tự từ rồi. Xác định chủ ngữ, thời gian, nơi chốn, phó từ rồi mới đặt động từ.",
    "Các từ đều đúng mà đứng sai chỗ thì câu vẫn toang. Xem lại vị trí phó từ, giới từ và bổ ngữ.",
    "Tiếng Trung không xếp từ theo cảm hứng. Tìm khung câu chính trước, sau đó mới gắn trạng ngữ và bổ ngữ.",
    "Bẫy ngữ pháp bắt được rồi nhé. Đừng dịch từng chữ theo thứ tự tiếng Việt; dựng cấu trúc tiếng Trung trước."
  ];

  function randomItem(items){return items[Math.floor(Math.random()*items.length)];}

  function isGrammarContext(element){
    if(!element)return false;
    if(element.closest&&element.closest("[data-v62-grammar-trap]"))return true;
    var container=element.closest&&element.closest(".hsk-question,.hsk-quiz-card,.hsk-quiz,.hsk-section");
    var text=String(container&&container.textContent||"").toLowerCase();
    return /ngữ pháp|trật tự|sắp xếp|vị trí|phó từ|giới từ|bổ ngữ|把|被|了|过|着/.test(text);
  }

  function findFeedback(button){
    var card=button.closest&&button.closest(".hsk-question,.hsk-quiz-card,[data-v62-grammar-trap],.hsk-section");
    if(card){
      var local=card.querySelector(".hsk-quiz-feedback,[data-v62-order-feedback],.v62-order-feedback");
      if(local)return local;
    }
    var lesson=root.document.getElementById("hskLesson");
    return lesson&&lesson.querySelector(".hsk-quiz-feedback");
  }

  root.document.addEventListener("click",function(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");
    if(!button)return;

    var isNormalOption=button.getAttribute("data-hsk-option")!==null;
    var isGrammarTrap=Boolean(button.closest&&button.closest("[data-v62-grammar-trap]"));
    if(!isNormalOption&&!isGrammarTrap)return;

    root.setTimeout(function(){
      var feedback=findFeedback(button);
      if(!feedback)return;
      var wrong=button.classList.contains("wrong")||/sai|chưa đúng|không đúng/i.test(feedback.textContent||"");
      if(!wrong)return;

      if(isGrammarContext(button)){
        /* Chỉ phần bẫy ngữ pháp mới dùng nhận xét về trật tự từ. */
        feedback.textContent=randomItem(grammarRoasts);
        feedback.setAttribute("data-v69-feedback-kind","grammar");
      }else{
        feedback.textContent=randomItem(vocabularyRoasts);
        feedback.setAttribute("data-v69-feedback-kind","meaning-context");
      }
    },120);
  },true);
})(typeof window!=="undefined"?window:this);
