(function (root, document) {
  "use strict";

  var core = root.VDuckieEXPCore;
  if (!core || core.__headerSessionBridgeV903) return;

  var originalSession = typeof core.session === "function" ? core.session.bind(core) : function () { return null; };
  var refreshQueued = false;
  var observer = null;

  function validDisplayName(value) {
    var name = String(value || "").trim();
    if (!name) return "";
    if (/^(Dữ liệu đang lưu trên thiết bị|Đang kiểm tra đồng bộ|Người học)$/i.test(name)) return "";
    return name;
  }

  function legacySignedInSession() {
    var logout = document.getElementById("cloudLogout");
    var identity = document.getElementById("cloudIdentity");
    if (!logout || logout.classList.contains("hidden")) return null;

    var name = validDisplayName(identity && identity.textContent);
    if (!name) return null;

    return {
      user: {
        id: "legacy-cloud-auth-user",
        user_metadata: {
          full_name: name,
          name: name
        }
      }
    };
  }

  core.session = function () {
    var live = originalSession();
    return live && live.user ? live : legacySignedInSession();
  };
  core.__headerSessionBridgeV903 = true;

  function syncHeaderAccount() {
    refreshQueued = false;
    var session = core.session();
    var copy = document.querySelector(".cloud-auth-copy");
    var account = document.getElementById("expHeaderAccount");

    if (session && session.user) {
      if ((!account || account.hidden) && root.VDuckieHomeEXP90 && typeof root.VDuckieHomeEXP90.ensureLayout === "function") {
        root.VDuckieHomeEXP90.ensureLayout();
        account = document.getElementById("expHeaderAccount");
      }
      if (account) account.hidden = false;
      if (copy && account && !account.hidden) copy.classList.add("v90-cloud-copy-hidden");
      return;
    }

    if (copy) copy.classList.remove("v90-cloud-copy-hidden");
    if (account) account.hidden = true;
  }

  function scheduleSync() {
    if (refreshQueued) return;
    refreshQueued = true;
    root.requestAnimationFrame(syncHeaderAccount);
  }

  function start() {
    scheduleSync();
    document.addEventListener("vduckie:exp-session", scheduleSync);
    document.addEventListener("vduckie:my-exp-loaded", scheduleSync);
    document.addEventListener("vduckie:exp-updated", scheduleSync);

    var logout = document.getElementById("cloudLogout");
    var identity = document.getElementById("cloudIdentity");
    if (root.MutationObserver && (logout || identity)) {
      observer = new MutationObserver(scheduleSync);
      if (logout) observer.observe(logout, { attributes: true, attributeFilter: ["class", "hidden"] });
      if (identity) observer.observe(identity, { childList: true, characterData: true, subtree: true });
    }

    root.setTimeout(scheduleSync, 120);
    root.setTimeout(scheduleSync, 650);
    root.setTimeout(scheduleSync, 1600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(window, document);
