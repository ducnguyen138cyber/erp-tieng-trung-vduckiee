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
    "./assets/v76/erp-terms-v76-system-documents.js?v=76.0",
    "./assets/v77/erp-terms-v77-core.js?v=77.1",
    "./assets/v77/erp-terms-v77-planning-production.js?v=77.1",
    "./assets/v77/erp-terms-v77-product-plm.js?v=77.1",
    "./assets/v77/erp-terms-v77-warehouse-wms.js?v=77.1",
    "./assets/v77/erp-terms-v77-procurement.js?v=77.1",
    "./assets/v77/erp-terms-v77-sales-crm.js?v=77.1",
    "./assets/v77/erp-terms-v77-broad-candidates.js?v=77.1",
    "./assets/v77/erp-terms-v77-finalize.js?v=77.1",
    "./assets/v79/hsk-dictionary-v79.js?v=79.0",
    "./assets/v79/unified-dictionary-v79.js?v=79.0"
  ];
  // Keep the source list above as an auditable fallback manifest; executing
  // one generated bundle avoids 15 parser-blocking network round trips.
  var bootBundle = "./assets/boot/erp-dictionary-boot-v1.js?v=1";
  function loadFallback(index) {
    if (index >= files.length) return;
    var fallback = document.createElement("script");
    fallback.async = false;
    fallback.src = files[index];
    fallback.onload = function () { loadFallback(index + 1); };
    fallback.onerror = function () { console.error("Không nạp được gói dữ liệu ERP/HSK/Từ điển:", files[index]); loadFallback(index + 1); };
    document.head.appendChild(fallback);
  }
  if (document.readyState === "loading") {
    // A parser-inserted script preserves the original dependency/order contract.
    window.VDuckieERPBootFallback = function () { loadFallback(0); };
    document.write('<script src="' + bootBundle + '" onerror="window.VDuckieERPBootFallback()"><' + '/script>');
    return;
  }
  var bundled = document.createElement("script");
  bundled.src = bootBundle;
  bundled.onerror = function () { loadFallback(0); };
  document.head.appendChild(bundled);
})();
