(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_AUTH_SCREEN_V1__) return;
  root.__VDUCKIE_AUTH_SCREEN_V1__ = true;

  var screen, form, busy = false, mode = "login", lastFocus = null, recovery = false;
  var $ = function (id) { return document.getElementById(id); };
  var cloud = function () { return root.VDuckieCloud || {}; };

  function markup() {
    return '<div class="vda-shell">' +
      '<section class="vda-hero" aria-label="Chào mừng đến với VDuckie">' +
        '<div class="vda-topbar">' +
          '<div class="vda-brand"><img src="./assets/mascot/duckie-reader-2d-v2.webp" alt=""><span>VDuckie<small>TIẾNG TRUNG CÙNG DUCKIE</small></span></div>' +
          '<button class="vda-back" type="button" data-vda-close>← Về trang học</button>' +
        '</div>' +
        '<div class="vda-hero-body">' +
          '<div class="vda-hero-copy">' +
            '<span class="vda-eyebrow">MỘT CHÚT MỖI NGÀY</span>' +
            '<h2>Mỗi chữ Hán một bước tiến. Cùng Duckie học theo cách của bạn!</h2>' +
            '<p>Tạo góc học tập để lưu từ đã nhớ, luyện bài mới và tiếp tục đúng nơi bạn dừng lại.</p>' +
            '<ul class="vda-features">' +
              '<li><i aria-hidden="true">汉</i> Học theo HSK</li>' +
              '<li><i aria-hidden="true">✦</i> Chơi để nhớ từ</li>' +
              '<li><i aria-hidden="true">↗</i> Giữ lại tiến độ</li>' +
            '</ul>' +
          '</div>' +
          '<div class="vda-art"><img src="./assets/mascot/duckie-speaking-2d-v5.webp" alt="Duckie chào người học mới"></div>' +
        '</div>' +
      '</section>' +
      '<main class="vda-main" role="dialog" aria-modal="true" aria-labelledby="vdaTitle">' +
        '<div class="vda-content">' +
          '<div class="vda-mobile-tabs" role="tablist" aria-label="Chọn đăng nhập hoặc tạo tài khoản"><button id="vdaTabLogin" role="tab" type="button" aria-selected="true" data-vda-mode="login">Mình đã có tài khoản</button><button id="vdaTabRegister" role="tab" type="button" aria-selected="false" data-vda-mode="register">Tạo tài khoản mới</button></div>' +
          '<span class="vda-kicker">GÓC HỌC TẬP CỦA BẠN</span>' +
          '<h1 id="vdaTitle">Mừng bạn trở lại!</h1><p class="vda-subtitle" id="vdaSubtitle">Đăng nhập để tiếp tục hành trình học của riêng bạn.</p>' +
          '<button class="vda-google" type="button" id="vdaGoogle"><span aria-hidden="true">G</span> Sử dụng tài khoản Google</button>' +
          '<div class="vda-divider" id="vdaDivider">hoặc dùng email</div>' +
          '<form class="vda-form" id="vdaForm" novalidate>' +
            '<div class="vda-field" id="vdaNameField" hidden><label for="vdaName">Bạn muốn được gọi là gì?</label><input class="vda-input" type="text" id="vdaName" autocomplete="name" maxlength="60" placeholder="Ví dụ: Duckie chăm học"></div>' +
            '<div class="vda-field" id="vdaEmailField"><label for="vdaEmail">Email của bạn</label><input class="vda-input" type="email" id="vdaEmail" autocomplete="email" inputmode="email" maxlength="254" required placeholder="Nhập địa chỉ email"></div>' +
            '<div class="vda-field" id="vdaPasswordField"><div class="vda-field-head"><label for="vdaPassword" id="vdaPasswordLabel">Mật khẩu</label><button type="button" class="vda-link" id="vdaForgot">Quên mật khẩu?</button></div><div class="vda-password-wrap"><input class="vda-input" type="password" id="vdaPassword" autocomplete="current-password" required placeholder="Nhập mật khẩu của bạn"><button type="button" class="vda-eye" id="vdaEye" aria-label="Hiện mật khẩu" aria-pressed="false">Hiện</button></div><p class="vda-hint" id="vdaPasswordHint" hidden>Chọn mật khẩu gồm ít nhất 8 ký tự.</p></div>' +
            '<label class="vda-terms" id="vdaTermsField" hidden><input type="checkbox" id="vdaTerms"><span>Tôi đồng ý tạo tài khoản và lưu tiến độ học để tiếp tục trên thiết bị khác.</span></label>' +
            '<div id="vdaMessage" class="vda-message" role="status" aria-live="polite" hidden></div>' +
            '<button type="submit" id="vdaSubmit" class="vda-submit">Tiếp tục học</button>' +
          '</form><p class="vda-bottom"><span id="vdaSwitchCopy">Chưa có tài khoản?</span> <button type="button" class="vda-link" id="vdaSwitch" data-vda-mode="register">Tạo miễn phí</button></p>' +
        '</div>' +
        '<p class="vda-under-card">Chưa muốn đăng nhập? <button type="button" data-vda-close>Khám phá bài học trước</button></p>' +
      '</main>' +
    '</div>';
  }

  function message(text, success) {
    var item = $("vdaMessage");
    item.textContent = text || "";
    item.hidden = !text;
    item.dataset.type = success ? "success" : "error";
  }

  function setBusy(value) {
    busy = !!value;
    [$("vdaSubmit"), $("vdaGoogle"), $("vdaSwitch"), $("vdaTabLogin"), $("vdaTabRegister")].forEach(function (node) {
      if (node) node.disabled = busy;
    });
    $("vdaSubmit").textContent = busy ? "Đang xử lý…" : submitLabel();
  }

  function submitLabel() {
    return mode === "register" ? "Tạo góc học tập" : mode === "forgot" ? "Gửi liên kết đặt lại" :
      mode === "recover" ? "Lưu mật khẩu mới" : "Tiếp tục học";
  }

  function setMode(next) {
    if (busy) return;
    mode = ["login", "register", "forgot", "recover"].indexOf(next) >= 0 ? next : "login";
    recovery = mode === "recover";
    var isRegister = mode === "register";
    var isLogin = mode === "login";
    var isForgot = mode === "forgot";
    var isRecover = mode === "recover";
    $("vdaNameField").hidden = !isRegister;
    $("vdaEmailField").hidden = isRecover;
    $("vdaPasswordField").hidden = isForgot;
    $("vdaTermsField").hidden = !isRegister;
    $("vdaForgot").hidden = !isLogin;
    $("vdaPasswordHint").hidden = !(isRegister || isRecover);
    $("vdaGoogle").hidden = isForgot || isRecover;
    $("vdaDivider").hidden = isForgot || isRecover;
    $("vdaTabLogin").setAttribute("aria-selected", String(isLogin || isForgot || isRecover));
    $("vdaTabRegister").setAttribute("aria-selected", String(isRegister));
    $("vdaPasswordLabel").textContent = isRecover ? "Mật khẩu mới" : "Mật khẩu";
    $("vdaPassword").autocomplete = isLogin ? "current-password" : "new-password";
    $("vdaPassword").value = "";
    $("vdaPassword").type = "password";
    $("vdaEye").textContent = "Hiện";
    $("vdaEye").setAttribute("aria-pressed", "false");
    $("vdaTitle").textContent = isRegister ? "Tạo góc học tập của riêng bạn" :
      isForgot ? "Lấy lại mật khẩu" : isRecover ? "Đặt lại mật khẩu" : "Mừng bạn trở lại!";
    $("vdaSubtitle").textContent = isRegister ? "Đặt một cái tên thật vui để Duckie ghi nhớ bạn nhé." :
      isForgot ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu." :
      isRecover ? "Tạo mật khẩu mới để tiếp tục học cùng Duckie." :
      "Đăng nhập để tiếp tục hành trình học của riêng bạn.";
    $("vdaSubmit").textContent = submitLabel();
    $("vdaSwitchCopy").textContent = isRegister ? "Đã đồng hành cùng Duckie rồi?" :
      isForgot || isRecover ? "Đã nhớ mật khẩu?" : "Lần đầu đến đây?";
    $("vdaSwitch").textContent = isRegister || isForgot || isRecover ? "Đăng nhập ngay" : "Tạo miễn phí";
    $("vdaSwitch").dataset.vdaMode = isRegister || isForgot || isRecover ? "login" : "register";
    message("");
  }

  function open(next) {
    if (!screen) return;
    if (screen.hidden) lastFocus = document.activeElement;
    // The mobile study menu installs a document-level overlay; close it before auth.
    if (root.VDuckieMobileLayoutFixV867 && typeof root.VDuckieMobileLayoutFixV867.close === "function") {
      root.VDuckieMobileLayoutFixV867.close();
    }
    document.documentElement.classList.remove("v867-menu-open");
    screen.hidden = false;
    document.body.classList.add("vda-auth-open");
    setMode(next || "login");
    root.requestAnimationFrame(function () {
      var field = mode === "register" ? $("vdaName") : mode === "recover" ? $("vdaPassword") : $("vdaEmail");
      if (field) field.focus();
    });
  }

  function close() {
    if (!screen || screen.hidden || busy) return;
    screen.hidden = true;
    document.body.classList.remove("vda-auth-open");
    $("vdaPassword").value = "";
    message("");
    if (lastFocus && lastFocus.isConnected && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function friendlyError(error) {
    var raw = String(error && error.message || error || "");
    if (/invalid login credentials/i.test(raw)) return "Email hoặc mật khẩu không đúng.";
    if (/email not confirmed/i.test(raw)) return "Bạn cần xác minh email trước khi đăng nhập.";
    if (/user already registered/i.test(raw)) return "Email này đã có tài khoản. Hãy đăng nhập.";
    if (/password should|weak password|at least/i.test(raw)) return "Mật khẩu chưa đáp ứng yêu cầu bảo mật.";
    if (/email rate limit|rate limit|over_email_send_rate_limit/i.test(raw)) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
    if (/email provider is disabled|email signups are disabled|signup is disabled/i.test(raw)) return "Đăng ký bằng email chưa được bật. Hãy dùng Google.";
    if (/network|fetch failed|failed to fetch/i.test(raw)) return "Không có kết nối mạng. Vui lòng thử lại.";
    return raw && raw.length < 120 ? raw : "Không thể xử lý yêu cầu. Vui lòng thử lại.";
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    var api = cloud();
    var email = $("vdaEmail").value.trim().toLowerCase();
    var password = $("vdaPassword").value;
    var name = $("vdaName").value.trim();
    if (mode !== "recover" && !validEmail(email)) {
      message("Hãy nhập một địa chỉ email hợp lệ."); $("vdaEmail").focus(); return;
    }
    if (mode !== "forgot" && password.length < (mode === "login" ? 1 : 8)) {
      message(mode === "login" ? "Hãy nhập mật khẩu." : "Mật khẩu phải có ít nhất 8 ký tự."); $("vdaPassword").focus(); return;
    }
    if (mode === "register" && (name.length < 2 || name.length > 60)) {
      message("Tên hiển thị cần từ 2 đến 60 ký tự."); $("vdaName").focus(); return;
    }
    if (mode === "register" && !$("vdaTerms").checked) {
      message("Hãy xác nhận điều khoản trước khi tạo tài khoản."); $("vdaTerms").focus(); return;
    }
    var shouldClose = false;
    setBusy(true); message("");
    try {
      var result;
      if (mode === "register") {
        if (!api.signUpWithPassword) throw new Error("Tính năng đăng ký chưa sẵn sàng.");
        result = await api.signUpWithPassword(name, email, password);
      } else if (mode === "forgot") {
        if (!api.resetPassword) throw new Error("Tính năng đặt lại mật khẩu chưa sẵn sàng.");
        result = await api.resetPassword(email);
      } else if (mode === "recover") {
        if (!api.updatePassword) throw new Error("Tính năng đặt lại mật khẩu chưa sẵn sàng.");
        result = await api.updatePassword(password);
      } else {
        if (!api.signInWithPassword) throw new Error("Tính năng đăng nhập chưa sẵn sàng.");
        result = await api.signInWithPassword(email, password);
      }
      if (result && result.error) throw result.error;
      if (mode === "forgot") message("Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.", true);
      else if (mode === "register" && !(result && result.data && result.data.session))
        message("Đã gửi yêu cầu. Hãy kiểm tra email để xác minh tài khoản trước khi đăng nhập.", true);
      else if (mode === "recover") {
        recovery = false;
        message("Đã đổi mật khẩu thành công. Bạn có thể tiếp tục học.", true);
        setTimeout(function () { if (screen && !screen.hidden && !busy) close(); }, 1200);
      } else shouldClose = true;
    } catch (error) {
      message(friendlyError(error));
    } finally {
      setBusy(false);
    }
    if (shouldClose) close();
  }

  async function google() {
    if (busy) return;
    if (!cloud().signIn) { message("Đăng nhập Google chưa sẵn sàng."); return; }
    setBusy(true); message("");
    try { await cloud().signIn(); }
    catch (error) { message(friendlyError(error)); }
    finally { setBusy(false); }
  }

  function syncHeader() {
    var login = $("cloudLogin");
    var signup = $("vdaHeaderRegister");
    if (!login || !signup) return;
    var shouldHide = login.classList.contains("hidden") || login.hidden || login.disabled;
    signup.hidden = shouldHide;
    if (!shouldHide && login.textContent !== "Đăng nhập") login.textContent = "Đăng nhập";
  }

  function initHeader() {
    var login = $("cloudLogin");
    if (!login) return;
    var signup = document.createElement("button");
    signup.id = "vdaHeaderRegister";
    signup.type = "button";
    signup.textContent = "Đăng ký miễn phí";
    signup.style.background = "#2563eb";
    signup.style.color = "#fff";
    signup.addEventListener("click", function () { open("register"); });
    login.insertAdjacentElement("afterend", signup);
    syncHeader();
    var observer = new MutationObserver(syncHeader);
    observer.observe(login, { attributes: true, attributeFilter: ["class", "hidden", "disabled"], childList: true });
    document.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("#cloudLogin") && !login.disabled && !login.classList.contains("hidden")) {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); open("login");
      }
    }, true);
  }

  function init() {
    screen = document.createElement("div");
    screen.id = "vduckieAuthScreen";
    screen.hidden = true;
    screen.innerHTML = markup();
    document.body.appendChild(screen);
    form = $("vdaForm");
    form.addEventListener("submit", submit);
    $("vdaGoogle").addEventListener("click", google);
    $("vdaForgot").addEventListener("click", function () { setMode("forgot"); $("vdaEmail").focus(); });
    $("vdaEye").addEventListener("click", function () {
      var password = $("vdaPassword"), visible = password.type === "password";
      password.type = visible ? "text" : "password";
      this.textContent = visible ? "Ẩn" : "Hiện";
      this.setAttribute("aria-pressed", String(visible));
    });
    screen.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("[data-vda-close]")) close();
      var target = event.target.closest && event.target.closest("[data-vda-mode]");
      if (target) { setMode(target.dataset.vdaMode); }
    });
    document.addEventListener("keydown", function (event) {
      if (screen.hidden) return;
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      var focusables = Array.prototype.slice.call(screen.querySelectorAll("button:not([disabled]),input:not([disabled])"))
        .filter(function (node) { return !node.hidden && !node.closest("[hidden]") && node.getClientRects().length; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.addEventListener("vduckie:auth-state", function (event) {
      var detail = event.detail || {};
      if (detail.event === "PASSWORD_RECOVERY") {
        open("recover");
      } else if (detail.signedIn && !recovery && !screen.hidden && !busy) {
        close();
      }
      syncHeader();
    });
    initHeader();
    if (new URLSearchParams(root.location.search).get("auth") === "register") open("register");
    else if (new URLSearchParams(root.location.search).get("auth") === "login") open("login");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
