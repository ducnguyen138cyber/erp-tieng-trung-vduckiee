(function (root) {
  "use strict";
  var parts = root.__PINYIN_GZIP_PARTS__ || [];
  root.PinyinEngineReady = new Promise(function (resolve) {
    if (parts.length !== 16 || typeof DecompressionStream === "undefined") {
      resolve(false);
      return;
    }
    try {
      var encoded = parts.join("");
      var binary = atob(encoded);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      new Response(stream).text().then(function (source) {
        (0, eval)(source);
        delete root.__PINYIN_GZIP_PARTS__;
        resolve(Boolean(root.pinyinPro));
      }).catch(function () {
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);

(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var files = [
    "./assets/v76/erp-terms-v76-core.js?v=76.0",
    "./assets/v76/erp-terms-v76-production.js?v=76.0",
    "./assets/v76/erp-terms-v76-warehouse-purchasing.js?v=76.0",
    "./assets/v76/erp-terms-v76-sales-finance.js?v=76.0",
    "./assets/v76/erp-terms-v76-system-documents.js?v=76.0"
  ];
  if (document.readyState === "loading") {
    for (var i = 0; i < files.length; i++) document.write('<script src="' + files[i] + '"><\\/script>');
    return;
  }
  function load(index) {
    if (index >= files.length) return;
    var script = document.createElement("script");
    script.src = files[index];
    script.onload = function () { load(index + 1); };
    script.onerror = function () { console.error("Không nạp được bộ từ vựng ERP v76:", files[index]); load(index + 1); };
    document.head.appendChild(script);
  }
  load(0);
})();
