(function (root) {
  "use strict";

  function byId(id) { return document.getElementById(id); }

  function render(result) {
    var output = byId("jarvisResponse");
    var status = byId("jarvisStatus");
    if (!output || !status) return;
    if (result.success) {
      output.textContent = result.text;
      output.className = "dialogue-feedback good";
      status.textContent = "Trả lời bởi " + result.provider + (result.model ? " · " + result.model : "");
    } else {
      output.textContent = result.error;
      output.className = "dialogue-feedback bad";
      status.textContent = "JARVIS chưa thể hoàn tất yêu cầu";
    }
  }

  function init() {
    var input = byId("jarvisInput");
    var send = byId("jarvisSend");
    if (!input || !send || !root.VDuckieJarvisRuntime) return;
    send.onclick = async function () {
      var message = input.value.trim();
      send.disabled = true;
      send.textContent = "Đang suy nghĩ…";
      var result = await root.VDuckieJarvisRuntime.generate(message);
      render(result);
      send.disabled = false;
      send.textContent = "Hỏi JARVIS";
    };
    input.onkeydown = function (event) {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); send.click(); }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
