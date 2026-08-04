(function (root) {
  'use strict';
  if (!root || typeof root.fetch !== 'function' || root.__VDUCKIE_HSK4_EDITORIAL_FETCH__) return;

  var nativeFetch = root.fetch.bind(root);
  var grammarPattern = /data\/hsk\/hsk4\/grammar\.json(?:[?#]|$)/;
  var projectAssessmentId = 'hsk4-assessment-project';

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

  function hskRouteRequested() {
    try {
      var params = new URLSearchParams(root.location && root.location.search || '');
      return params.get('area') === 'hsk' || (root.location && root.location.hash === '#hsk');
    } catch (error) {
      return false;
    }
  }

  function reveal(node) {
    if (!node) return;
    if (node.classList.contains('hidden')) node.classList.remove('hidden');
    if (node.hasAttribute('hidden')) node.removeAttribute('hidden');
    if (node.getAttribute('aria-hidden') !== 'false') node.setAttribute('aria-hidden', 'false');
    if (node.style && node.style.display === 'none') node.style.removeProperty('display');
  }

  function ensureHskRouteVisible() {
    if (!hskRouteRequested() || !root.document || !root.document.getElementById) return;
    reveal(root.document.getElementById('hsk'));
    reveal(root.document.getElementById('hskJourney'));
  }

  function watchHskRouteVisibility() {
    if (!hskRouteRequested() || !root.document || !root.MutationObserver) return;
    var panel = root.document.getElementById('hsk');
    var journey = root.document.getElementById('hskJourney');
    [panel, journey].forEach(function (node) {
      if (!node || node.__vduckieHsk4VisibilityObserver) return;
      var observer = new root.MutationObserver(ensureHskRouteVisible);
      observer.observe(node, { attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden', 'style'] });
      node.__vduckieHsk4VisibilityObserver = observer;
    });
    ensureHskRouteVisible();
  }

  function ensureProjectAssessmentLink() {
    if (!root.document || !root.document.getElementById) return;
    ensureHskRouteVisible();
    var list = root.document.getElementById('hskLessonList');
    if (!list || list.querySelector('[data-pro-assessment="' + projectAssessmentId + '"]')) return;
    if (!list.querySelector('[data-pro-assessment^="hsk4-assessment-"]')) return;
    var button = root.document.createElement('button');
    button.type = 'button';
    button.className = 'hsk-pro-assessment-link major';
    button.setAttribute('data-pro-assessment', projectAssessmentId);
    button.textContent = '▣ Integrated Project';
    list.appendChild(button);
  }

  function observeAssessmentNavigation() {
    if (!root.document || !root.MutationObserver) return;
    var start = function () {
      watchHskRouteVisibility();
      var list = root.document.getElementById('hskLessonList');
      if (!list || list.__vduckieHsk4ProjectObserver) return;
      var observer = new root.MutationObserver(function () {
        ensureProjectAssessmentLink();
        watchHskRouteVisibility();
      });
      observer.observe(list, { childList: true, subtree: false });
      list.__vduckieHsk4ProjectObserver = observer;
      ensureProjectAssessmentLink();
      [0, 100, 500, 1500].forEach(function (delay) {
        root.setTimeout(function () {
          ensureHskRouteVisible();
          watchHskRouteVisibility();
        }, delay);
      });
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
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

  observeAssessmentNavigation();
  root.__VDUCKIE_HSK4_EDITORIAL_FETCH__ = true;
  root.VDuckieHsk4EditorialRuntime = Object.freeze({
    applyCorrections: applyCorrections,
    ensureProjectAssessmentLink: ensureProjectAssessmentLink,
    ensureHskRouteVisible: ensureHskRouteVisible
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
