(function registerVDuckiePwa(window, navigator) {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    var serviceWorkerUrl = new URL("./service-worker.js", window.location.href);
    var scopeUrl = new URL("./", window.location.href);

    navigator.serviceWorker.register(serviceWorkerUrl.href, { scope: scopeUrl.pathname })
      .then(function (registration) {
        registration.update();
      })
      .catch(function (error) {
        console.warn("VDuckie PWA không thể đăng ký service worker.", error);
      });
  });
})(window, navigator);
