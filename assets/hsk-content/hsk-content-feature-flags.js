(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.VDuckieHskContentFlags = api;
    if (root.document && api.FLAGS.HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED === true) {
      var document = root.document;
      if (!document.querySelector('link[data-hsk-professional-css]')) {
        var stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = './assets/hsk-content/hsk-professional-runtime.css?v=c6web1';
        stylesheet.setAttribute('data-hsk-professional-css', 'c6web1');
        document.head.appendChild(stylesheet);
      }
      if (!document.querySelector('script[data-hsk4-editorial-runtime]')) {
        var editorialScript = document.createElement('script');
        editorialScript.src = './assets/hsk-content/hsk4-editorial-runtime.js?v=c6web1';
        editorialScript.async = false;
        editorialScript.setAttribute('data-hsk4-editorial-runtime', 'c6web1');
        document.head.appendChild(editorialScript);
      }
      if (!document.querySelector('script[data-hsk-professional-runtime]')) {
        var script = document.createElement('script');
        script.src = './assets/hsk-content/hsk-professional-runtime.js?v=c6web1';
        script.async = false;
        script.setAttribute('data-hsk-professional-runtime', 'c6web1');
        document.head.appendChild(script);
      }
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FLAGS = Object.freeze({
    HSK_CURRICULUM_V2_ENABLED: false,
    HSK_CURRICULUM_V2_DEVELOPER_PREVIEW_ENABLED: true,
    HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED: true,
    HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED: false,
    HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: false,
    HSK_CURRICULUM_V2_QUALITY_GATE: 'locked'
  });

  function resolveHskCurriculumAccess(context) {
    context = context || {};
    var developerPreview = Boolean(
      FLAGS.HSK_CURRICULUM_V2_DEVELOPER_PREVIEW_ENABLED &&
      context.developerAuthorized === true &&
      context.previewRequested === true
    );
    return Object.freeze({
      mode: developerPreview ? 'developer-preview' : 'legacy-production',
      canonicalEnabled: FLAGS.HSK_CURRICULUM_V2_ENABLED === true,
      developerPreview: developerPreview,
      learnerReadOnly: FLAGS.HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED === true,
      readOnly: true,
      progressWritesEnabled: false,
      publicOverrideAccepted: false,
      qualityGate: FLAGS.HSK_CURRICULUM_V2_QUALITY_GATE
    });
  }

  function shouldUseCanonicalCurriculum(context) {
    var access = resolveHskCurriculumAccess(context);
    return access.canonicalEnabled || access.developerPreview;
  }

  return Object.freeze({
    FLAGS: FLAGS,
    resolveHskCurriculumAccess: resolveHskCurriculumAccess,
    shouldUseCanonicalCurriculum: shouldUseCanonicalCurriculum
  });
});
