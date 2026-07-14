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
