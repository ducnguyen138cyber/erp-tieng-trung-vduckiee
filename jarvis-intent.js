(function (root) {
  "use strict";

  function compact(value) { return String(value || "").trim().replace(/\s+/g, " "); }
  function has(text, pattern) { return pattern.test(text); }
  function unique(values) { return values.filter(function (value, index) { return values.indexOf(value) === index; }); }

  function analyze(message, resolved, userContext) {
    var text = compact(message);
    var lower = text.toLocaleLowerCase();
    var active = resolved.active || {};
    var primary = "information", secondary = [], confidence = 0.55, goal = "", constraints = [];
    var shortForm = lower.replace(/[.!?]+$/g, "");
    var isContinuation = resolved.kind === "continuation" || /^(do it|make it faster|fix that|use the second one)$/.test(shortForm);
    if (resolved.kind === "correction") {
      primary = "correction"; goal = resolved.correctedMeaning || active.goal || active.task; confidence = goal ? 0.9 : 0.45;
    } else if (isContinuation) {
      primary = "continuation"; goal = active.goal || active.task || active.topic; confidence = goal ? 0.9 : 0.35;
      if (/faster/.test(lower) && goal) goal = "Improve performance of " + goal;
    } else if (has(lower, /\b(compare|comparison|versus| vs |khác nhau)\b/)) {
      primary = "comparison"; secondary.push("recommendation", "decision_support"); confidence = 0.8;
    } else if (has(lower, /\b(which one|which is better|should i|worth|recommend|choose|nên chọn|cái nào tốt hơn)\b/)) {
      primary = "recommendation"; secondary.push("decision_support"); confidence = 0.7;
    } else if (has(lower, /\b(fix|bug|error|debug|sửa lỗi)\b/)) { primary = "debugging"; confidence = 0.8;
    } else if (has(lower, /\b(implement|build|add|create|làm|xây|thêm)\b/)) { primary = "implementation"; confidence = 0.75;
    } else if (has(lower, /\b(explain|why|how does|giải thích|tại sao)\b/)) { primary = "explanation"; confidence = 0.75;
    } else if (has(lower, /\b(plan|steps|roadmap|kế hoạch|các bước)\b/)) { primary = "planning"; confidence = 0.75;
    } else if (has(lower, /\b(translate|rewrite|summarize|dịch|viết lại|tóm tắt)\b/)) { primary = "transformation"; confidence = 0.8;
    } else if (text.length < 5 || /^(what about|and this|còn cái này)$/i.test(lower)) { primary = "clarification"; confidence = 0.25; }
    if (/don't want to spend more|cheaper|low cost|không muốn tốn thêm|rẻ hơn/i.test(lower)) constraints.push("minimize_cost");
    if (/done today|today|hôm nay/i.test(lower)) constraints.push("prioritize_speed");
    if (primary === "recommendation" || secondary.indexOf("recommendation") !== -1) {
      var preferences = (userContext && userContext.preferences || []).join(" ").toLocaleLowerCase();
      if (/cost|cheap|rẻ|tiết kiệm/.test(preferences)) constraints.push("cost_sensitive");
    }
    var explicitGoal = /\b(?:i need to|i want to|i(?:'m| am) working on)\s+(.+)/i.exec(text) || /(?:tôi cần|tôi muốn|tôi đang làm)\s+(.+)/i.exec(text);
    if (explicitGoal) {
      goal = explicitGoal[1];
      if (primary === "information") primary = "action_request";
      confidence = 0.9;
    }
    if (!goal) {
      if (primary === "recommendation") goal = active.topic ? "Choose the best option for " + active.topic : "Choose the best option";
      else if (primary === "comparison") goal = "Compare options and support a decision";
      else if (primary !== "information" && primary !== "clarification") goal = active.goal || active.task || active.topic || "";
      else if (active.goal && text.length < 48) goal = active.goal;
    }
    if (primary === "recommendation" && !active.topic && !active.task && text.split(" ").length <= 4) confidence = 0.45;
    var topicChange = /\b(never mind|instead|help me choose|let's talk about|bỏ qua)\b/i.test(lower) && !isContinuation;
    if (topicChange && primary === "recommendation") goal = "Choose the best option";
    return { primaryIntent: primary, secondaryIntents: unique(secondary), goal: goal, confidence: confidence, constraints: unique(constraints), goalChange: topicChange };
  }
  root.VDuckieJarvisIntent = { analyze: analyze };
})(typeof globalThis !== "undefined" ? globalThis : this);
