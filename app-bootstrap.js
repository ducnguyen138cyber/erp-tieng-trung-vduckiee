/* VDuckie loader: legacy HTML shell retained for compatibility; assets listed explicitly.
   Mascot/Evolution deliberately excluded. Do not delete user progress or Supabase tables. */
(async function bootVDuckie() {
  const cssAssets = [
  "./assets/v89/legacy-dashboard-exp-cleanup-v89.1.css?v=89.1",
  "./assets/v89/hsk-roadmap-v89.4.css?v=89.4",
  "./assets/v90/exp-system-v90.css?v=90.1",
  "./assets/v90/home-header-sidebar-v90.1.css?v=90.3",
  "./assets/v91/header-account-dropdown-v91.css?v=91.5",
  "./assets/v91/three-column-scroll-v91.10.css?v=91.10",
  "./assets/v93/developer-preview-v93.css?v=108.1",
  "./assets/v100/regression-v100.css?v=100.0",
  "./assets/developer-ui/developer-center.css?v=108.1"
];
  const jsAssets = [
  "./assets/v90/exp-core-v90.js?v=90.0",
  "./assets/v92/progress-store-v92.js?v=106.1",
  "./assets/v90/exp-board-v90.js?v=90.0",
  "./assets/v90/exp-leaderboard-v90.js?v=90.4",
  "./assets/v89/exp-learning-hooks-v89.js?v=2b4.0",
  "./assets/v90/exp-weekly-v90.js?v=90.0",
  "./assets/v90/header-account-session-bridge-v90.3.js?v=90.3",
  "./assets/v90/home-exp-sidebar-v90.js?v=90.4",
  "./assets/v89/legacy-dashboard-exp-cleanup-v89.1.js?v=89.1",
  "./assets/v89/hsk-roadmap-v89.4.js?v=89.4",
  "./assets/v91/header-account-dropdown-v91.js?v=91.5",
  "./assets/hsk-content/hsk-content-feature-flags.js?v=2b1.0",
  "./assets/hsk-content/hsk-content-loader.js?v=2b4.0",
  "./assets/hsk-content/hsk-content-adapter.js?v=2b1.0",
  "./assets/hsk-content/hsk-progress-contract.js?v=2b2.0",
  "./assets/hsk-content/hsk-progress-migration.js?v=2b4.0",
  "./assets/hsk-content/hsk-progress-review.js?v=2b4.0",
  "./assets/hsk-content/hsk-developer-preview.js?v=2b4.0",
  "./assets/developer-runtime/runtime.js?v=108.1",
  "./assets/developer-events/actions.js?v=108.1",
  "./assets/developer-tabs/overview.js?v=108.1",
  "./assets/developer-tabs/learning-speaking.js?v=2b3.0",
  "./assets/developer-tabs/system.js?v=108.1",
  "./assets/developer-debug/debug.js?v=108.1",
  "./assets/developer-scenarios/scenarios.js?v=108.1",
  "./assets/developer-ui/developer-center-core.js?v=108.1",
  "./assets/developer-ui/developer-center.js?v=108.1",
  "./assets/developer/developer-control-center.js?v=2b4.0"
];
  const loading = document.querySelector('[data-app-loading]');
  try {
    const response = await fetch('./app-shell-v88.html?v=learning2.9', {cache:'no-store'});
    if (!response.ok) throw new Error('Không tải được giao diện: '+response.status);
    let html = await response.text();
    // Remove the legacy SVG rather than loading its replacement mascot.
    html = html.replace(/<svg class="home-welcome-mascot vduckie-mascot"[\s\S]*?<\/svg>/, '');
    html = html.replace(/<link[^>]+vduckie-mascot-v87\.css[^>]*>/g,'');
    html = html.replace(/<title>[\s\S]*?<\/title>/i,'<title>VDuckie – Học tiếng Trung</title>');
    html = html.replace(/<link rel="icon" type="image\/png" href="\.\/assets\/vduckie-logo\.png\?v=1">/i,'');
    html = html.replace(/\.\/supabase-config\.js\?v=[^"']+/g,'./supabase-config.js?v=96.0');
    html = html.replace(/\.\/supabase-sync\.js\?v=[^"']+/g,'./supabase-sync.js?v=96.0');
    const headAssets = cssAssets.map(href=>'<link rel="stylesheet" href="'+href+'">').join('');
    const bodyAssets = jsAssets.map(src=>'<script src="'+src+'"></'+'script>').join('');
    html = html.replace('</head>',headAssets+'</head>').replace('</body>',bodyAssets+'</body>');
    // Compatibility stage: preserve synchronous script execution order of the legacy shell.
    // Replace with a modern module bootstrap only after regression tests pass.
    document.open();document.write(html);document.close();
  } catch(error) {
    console.error('VDuckie bootstrap:',error);
    if (loading) loading.textContent='Không tải được giao diện. Hãy tải lại trang.';
  }
})();