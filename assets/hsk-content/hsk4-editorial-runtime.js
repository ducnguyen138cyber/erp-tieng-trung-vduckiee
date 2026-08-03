(function (root) {
  'use strict';
  if (!root || typeof root.fetch !== 'function' || root.__VDUCKIE_HSK4_EDITORIAL_FETCH__) return;

  var nativeFetch = root.fetch.bind(root);
  var grammarPattern = /data\/hsk\/hsk4\/grammar\.json(?:[?#]|$)/;

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    return input && input.url ? input.url : '';
  }

  function correctionsUrl(grammarUrl) {
    try {
      return new URL('editorial-corrections.json', new URL(grammarUrl, root.location && root.location.href || undefined)).toString();
    } catch (error) {
      return './data/hsk/hsk4/editorial-corrections.json';
    }
  }

  function applyCorrections(document, correctionDocument) {
    var records = document && Array.isArray(document.records) ? document.records : [];
    var corrections = correctionDocument && Array.isArray(correctionDocument.corrections) ? correctionDocument.corrections : [];
    var recordsById = Object.create(null);
    records.forEach(function (record) { if (record && record.id) recordsById[record.id] = record; });
    corrections.forEach(function (correction) {
      var target = correction && recordsById[correction.id];
      if (!target || !Array.isArray(correction.incorrectExamples) || !correction.incorrectExamples.length) return;
      target.incorrectExamples = correction.incorrectExamples.map(function (example) {
        return { zh: example.zh, explanationVi: example.explanationVi };
      });
    });
    return document;
  }

  root.fetch = function (input, init) {
    var url = requestUrl(input);
    if (!grammarPattern.test(url)) return nativeFetch(input, init);
    return nativeFetch(input, init).then(function (response) {
      if (!response || !response.ok || typeof response.clone !== 'function' || typeof root.Response !== 'function') return response;
      return Promise.all([
        response.clone().json(),
        nativeFetch(correctionsUrl(url), { cache: 'no-store' }).then(function (correctionResponse) {
          if (!correctionResponse || !correctionResponse.ok) throw new Error('Không tải được HSK4 editorial corrections.');
          return correctionResponse.json();
        })
      ]).then(function (parts) {
        var headers = typeof root.Headers === 'function' ? new root.Headers(response.headers) : response.headers;
        if (headers && typeof headers.set === 'function') headers.set('content-type', 'application/json; charset=utf-8');
        return new root.Response(JSON.stringify(applyCorrections(parts[0], parts[1])), {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
      });
    });
  };

  root.__VDUCKIE_HSK4_EDITORIAL_FETCH__ = true;
  root.VDuckieHsk4EditorialRuntime = Object.freeze({ applyCorrections: applyCorrections });
})(typeof globalThis !== 'undefined' ? globalThis : this);
