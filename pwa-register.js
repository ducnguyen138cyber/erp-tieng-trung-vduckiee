(function registerVDuckiePwa(window, navigator) {
  "use strict";
  // index.html replaces its document with the app shell: initialize only once
  // the final document has loaded, and do not block its first paint.
  var deferredPrompt = null, waitingWorker = null, applyingUpdate = false;
  var document = window.document;
  function installed() {
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }
  function each(selector, fn) { document.querySelectorAll(selector).forEach(fn); }
  function status(message) { each("[data-pwa-status]", function (node) { node.textContent = message; }); }
  function syncInstall() {
    var isInstalled = installed();
    each("[data-pwa-install]", function (node) { node.hidden = isInstalled || !deferredPrompt; });
    each("[data-pwa-install-link]", function (node) { node.hidden = isInstalled; });
    each("[data-pwa-open]", function (node) { node.hidden = !isInstalled; });
    if (isInstalled) status("Bạn đang mở VDuckie dưới dạng ứng dụng.");
  }
  // Capture early: Chromium can emit this before window.load.
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault(); deferredPrompt = event; syncInstall();
    status("Sẵn sàng cài. Nhấn Cài VDuckie để thêm ứng dụng.");
  });
  window.addEventListener("appinstalled", function () {
    deferredPrompt = null; syncInstall();
    each("[data-pwa-install-link]", function (node) { node.hidden = true; });
    status("Đã cài VDuckie. Bạn có thể mở ứng dụng từ màn hình chính.");
  });
  async function install(button) {
    if (!deferredPrompt) return;
    var prompt = deferredPrompt; deferredPrompt = null; button.disabled = true;
    try {
      await prompt.prompt();
      var choice = await prompt.userChoice;
      status(choice.outcome === "accepted" ? "Đang cài VDuckie. Hãy kiểm tra màn hình chính." : "Bạn có thể cài sau bằng menu trình duyệt.");
    } catch (error) { status("Chưa cài được. Hãy làm theo hướng dẫn của trình duyệt bên dưới."); }
    finally { button.disabled = false; syncInstall(); }
  }
  function offerUpdate(registration) {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;
    waitingWorker = registration.waiting;
    each("[data-pwa-update]", function (node) { node.hidden = false; });
  }
  function init() {
    syncInstall();
    document.addEventListener("click", function (event) {
      var target = event.target.closest && event.target.closest("[data-pwa-install],[data-pwa-update]");
      if (!target) return;
      if (target.hasAttribute("data-pwa-install")) { install(target); return; }
      if (waitingWorker) { applyingUpdate = true; waitingWorker.postMessage("SKIP_WAITING"); }
    });
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      // Never reload a lesson unless the user explicitly chose to update.
      if (applyingUpdate) window.location.reload();
    });
    var serviceWorkerUrl = new URL("./service-worker.js", window.location.href);
    var scopeUrl = new URL("./", window.location.href);
    navigator.serviceWorker.register(serviceWorkerUrl.href, { scope: scopeUrl.pathname, updateViaCache: "none" })
      .then(function (registration) {
        offerUpdate(registration);
        registration.addEventListener("updatefound", function () {
          var worker = registration.installing;
          if (worker) worker.addEventListener("statechange", function () {
            if (worker.state === "installed") offerUpdate(registration);
          });
        });
        // Check again when returning to the installed app, without polling.
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "visible" && navigator.onLine) registration.update().catch(function () {});
        });
        registration.update().catch(function () {});
      })
      .catch(function (error) { console.warn("VDuckie PWA không thể đăng ký service worker.", error); });
  }
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init, { once: true });
})(window, navigator);
