(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskContentFlags = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FLAGS = Object.freeze({
    HSK_CURRICULUM_V2_ENABLED: false,
    HSK_CURRICULUM_V2_DEVELOPER_PREVIEW_ENABLED: true,
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
