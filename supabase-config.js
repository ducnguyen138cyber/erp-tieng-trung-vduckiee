// These two values are public browser credentials. Never put a secret key,
// service_role key, Google Client Secret, or database password in this file.
// OAuth always returns to the directory that is currently serving the app:
//   Cloudflare Pages: https://vduckie.pages.dev/
//   GitHub Pages:     https://<user>.github.io/<repository>/
// Using a relative URL resolver keeps both deployments working without a
// hard-coded production hostname or repository prefix.
window.VDUCKIE_SUPABASE_CONFIG = Object.freeze({
  url: "https://zpwntwtximcxnyvtcfxp.supabase.co",
  publishableKey: "sb_publishable_KKT_zBQWJzLqVHJlJmazsQ_WGg5HOCW",
  redirectUrl: new URL("./", window.location.href).href
});
