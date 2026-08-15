(function (root) {
  "use strict";

  var endpoint = "./api/jarvis";
  var timeoutMs = 20000;

  function compact(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function compactActive(active) {
    active = active || {};
    return { topic: active.topic || "", task: active.task || "", project: active.project || "", step: active.step || "", entities: (active.entities || []).slice(-4), lastCorrection: active.lastCorrection || "" };
  }

  function importantTurns(turns, anchor) {
    var anchorText = anchor && anchor.content;
    return turns.slice(-4).filter(function (turn) { return turn.content && turn.content !== anchorText; }).map(function (turn) { return { role: turn.role, content: turn.content.slice(0, 280) }; });
  }

  function buildRequest(userMessage) {
    var context = root.VDuckieJarvisContext;
    if (!context) throw new Error("JARVIS context is unavailable");
    var resolved = context.resolve(userMessage);
    var state = context.getState();
    return {
      userMessage: compact(userMessage),
      conversationContext: compactActive(resolved.active),
      resolvedIntent: resolved.kind,
      resolvedReferences: resolved.reference,
      correction: resolved.correctedMeaning || "",
      relevantMemories: resolved.memories.map(function (memory) { return { type: memory.type, key: memory.key, content: memory.content }; }),
      userContext: context.userContext(userMessage),
      recentTurns: importantTurns(state.turns, resolved.anchor)
    };
  }

  function classifyUsefulMemory(message) {
    var text = compact(message);
    if (/\b(for this task|this session|today|hôm nay|phiên này)\b/i.test(text)) return { type: "temporary", key: text.slice(0, 80), content: text, confidence: 0.9 };
    if (/\b(always|never|from now on|luôn luôn|từ giờ)\b/i.test(text)) return { type: "procedure", key: "working procedure", content: text, importance: 2 };
    if (/\b(prefer|please answer|thích|đừng|hãy trả lời)\b/i.test(text)) return { type: "preference", key: /\b(groq|openrouter|provider)\b/i.test(text) ? "provider" : "response preference", content: text, importance: 2 };
    if (/\b(i am working on|project|task|đang làm|dự án|công việc)\b/i.test(text)) return { type: "task", key: text.slice(0, 80), content: text };
    if (/\b(i am|i have|using|use |tôi là|tôi có|có |dùng )\b/i.test(text)) return { type: "fact", key: text.slice(0, 80), content: text, confidence: 0.9 };
    return null;
  }

  function normalizeResponse(response, fallback) {
    response = response || {};
    return {
      text: compact(response.text),
      provider: response.provider || fallback || "unavailable",
      model: response.model || "",
      success: response.success !== false && !!compact(response.text),
      error: response.error || null,
      metadata: response.metadata || {},
      usage: response.usage || null
    };
  }

  function errorResult(error, status) {
    var message = error && error.message ? error.message : "JARVIS không thể xử lý yêu cầu lúc này.";
    if (status === 401 || status === 403) message = "JARVIS chưa được cấp quyền với nhà cung cấp AI.";
    else if (status === 429) message = "JARVIS đang bị giới hạn lượt gọi. Hãy thử lại sau ít phút.";
    else if (status === 503) message = "JARVIS chưa được cấu hình nhà cung cấp AI trên máy chủ.";
    else if (error && error.name === "AbortError") message = "JARVIS phản hồi quá lâu. Hãy thử lại.";
    return { text: "", provider: "unavailable", model: "", success: false, error: message, metadata: { status: status || 0 }, usage: null };
  }

  async function generate(userMessage) {
    var request = buildRequest(userMessage);
    if (!request.userMessage) return errorResult(new Error("Hãy nhập tin nhắn cho JARVIS."));
    var controller = root.AbortController ? new root.AbortController() : null;
    var timer = controller ? root.setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    try {
      var response = await root.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller && controller.signal
      });
      var body;
      try { body = await response.json(); } catch (parseError) { return errorResult(new Error("JARVIS nhận phản hồi không hợp lệ."), response.status); }
      if (!response.ok) return errorResult(new Error(body && body.error), response.status);
      var result = normalizeResponse(body, "server");
      if (!result.success) return errorResult(new Error(result.error || "JARVIS không trả về nội dung."), response.status);
      var context = root.VDuckieJarvisContext;
      context.recordTurn("user", request.userMessage, { intent: request.resolvedIntent });
      context.applyMeaning(context.resolve(request.userMessage));
      context.recordTurn("assistant", result.text, { provider: result.provider, model: result.model });
      var memory = classifyUsefulMemory(request.userMessage);
      if (memory) context.upsertMemory(memory);
      return result;
    } catch (error) {
      return errorResult(error);
    } finally {
      if (timer) root.clearTimeout(timer);
    }
  }

  root.VDuckieJarvisRuntime = { buildRequest: buildRequest, generate: generate, setEndpoint: function (value) { endpoint = compact(value) || endpoint; } };
})(typeof globalThis !== "undefined" ? globalThis : this);
