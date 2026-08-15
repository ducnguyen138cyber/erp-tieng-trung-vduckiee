function json(body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json; charset=utf-8" } });
}

function promptFrom(request) {
  var active = request.conversationContext || {};
  var userContext = request.userContext || {};
  var personalization = ["facts", "preferences", "projects", "procedures", "temporary"].map(function (kind) {
    return userContext[kind] && userContext[kind].length ? kind + ": " + userContext[kind].join("; ") : "";
  }).filter(Boolean).join("\n");
  var turns = (request.recentTurns || []).map(function (turn) { return turn.role + ": " + turn.content; }).join("\n");
  return [
    "You are VDuckie JARVIS, a concise Vietnamese assistant for Chinese and ERP learning.",
    "Use supplied context to resolve follow-ups. Do not claim memories that are not supplied.",
    "Active task: " + (active.task || "none"),
    "Active topic: " + (active.topic || "none"),
    "Intent: " + (request.intent && request.intent.primaryIntent || request.resolvedIntent || "new"),
    request.intent && request.intent.goal ? "Goal: " + request.intent.goal : "",
    request.intent && request.intent.secondaryIntents && request.intent.secondaryIntents.length ? "Secondary intents: " + request.intent.secondaryIntents.join(", ") : "",
    request.intent && request.intent.constraints && request.intent.constraints.length ? "Constraints: " + request.intent.constraints.join(", ") : "",
    request.resolvedReferences ? "Reference anchor: " + request.resolvedReferences.value : "",
    personalization ? "Relevant user context:\n" + personalization : "",
    turns ? "Recent turns:\n" + turns : "",
    "User: " + request.userMessage
  ].filter(Boolean).join("\n\n");
}

function providerFor(env) {
  var url = env.JARVIS_OPENAI_COMPATIBLE_URL;
  var key = env.JARVIS_OPENAI_API_KEY;
  var model = env.JARVIS_MODEL;
  if (!url || !key || !model) return null;
  return {
    name: env.JARVIS_PROVIDER || "openai-compatible",
    model: model,
    generate: async function (prompt) {
      var response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": "Bearer " + key },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }], temperature: 0.3 })
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) throw Object.assign(new Error(payload.error && payload.error.message || "Provider request failed"), { status: response.status });
      var text = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
      if (!text) throw new Error("Provider returned an empty response");
      return { text: text, provider: env.JARVIS_PROVIDER || "openai-compatible", model: model, usage: payload.usage || null, metadata: {} };
    }
  };
}

export async function onRequestPost(context) {
  var request;
  try { request = await context.request.json(); } catch (error) { return json({ error: "Malformed JARVIS request" }, 400); }
  if (!request || !String(request.userMessage || "").trim()) return json({ error: "A user message is required" }, 400);
  var provider = providerFor(context.env);
  if (!provider) return json({ error: "JARVIS provider is not configured" }, 503);
  try {
    var result = await provider.generate(promptFrom(request));
    return json(Object.assign({ success: true }, result));
  } catch (error) {
    return json({ error: error.message || "JARVIS provider failed" }, error.status || 502);
  }
}
