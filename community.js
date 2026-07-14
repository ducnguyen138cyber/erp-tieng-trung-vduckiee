(function (root) {
  "use strict";

  var API_URL = "https://erp-tieng-trung.vduckie.chatgpt.site/api/community-terms";
  var terms = [];
  var loading = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function displayDate(value) {
    if (!value) return "";
    var normalized = String(value).indexOf("T") === -1 ? String(value).replace(" ", "T") + "Z" : String(value);
    var date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function setConnection(message, tone) {
    var element = byId("communityConnection");
    element.className = "community-connection " + (tone || "");
    element.textContent = message;
  }

  function renderTerms() {
    byId("communityCount").textContent = String(terms.length);
    if (!terms.length) {
      byId("communityTerms").innerHTML = '<div class="empty span-2">Chưa có từ nào trong kho chung.</div>';
      return;
    }
    var html = "";
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      html += '<article class="term community-term">' +
        '<div class="community-meta"><span class="verify-badge approved">Đã xác minh</span><span>' + escapeHtml(displayDate(term.created_at)) + '</span></div>' +
        '<strong>' + escapeHtml(term.hanzi) + '</strong><b>' + escapeHtml(term.pinyin) + '</b>' +
        '<i>Gần âm: ' + escapeHtml(term.near_vi || "—") + '</i><p>' + escapeHtml(term.vi) + '</p>' +
        (term.example ? '<div class="community-example">Ví dụ: ' + escapeHtml(term.example) + '</div>' : "") +
        '<div class="community-contributor">Đóng góp bởi: <strong>' + escapeHtml(term.contributor || "Ẩn danh") + '</strong></div>' +
        '<div class="term-actions"><button class="muted community-speak" data-word="' + escapeHtml(term.hanzi) + '">♪ Nghe</button></div></article>';
    }
    byId("communityTerms").innerHTML = html;
    var speakButtons = document.querySelectorAll(".community-speak");
    for (var j = 0; j < speakButtons.length; j++) {
      speakButtons[j].onclick = function () {
        if (!root.speechSynthesis) return;
        root.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(this.getAttribute("data-word") || "");
        utterance.lang = "zh-CN";
        utterance.rate = 0.72;
        root.speechSynthesis.speak(utterance);
      };
    }
  }

  function loadTerms(showMessage) {
    if (loading) return Promise.resolve();
    loading = true;
    if (showMessage) setConnection("Đang tải kho từ chung…", "");
    return fetch(API_URL, { method: "GET", mode: "cors", cache: "no-store", credentials: "omit" })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || "Không tải được dữ liệu.");
          return data;
        });
      })
      .then(function (data) {
        terms = data.terms instanceof Array ? data.terms : [];
        renderTerms();
        if (root.ERPCommunityLearning) root.ERPCommunityLearning.merge(terms);
        setConnection("Đã kết nối kho chung · tự làm mới mỗi 60 giây", "good");
      })
      .catch(function (error) {
        setConnection("Không kết nối được kho chung: " + error.message, "bad");
      })
      .then(function () { loading = false; });
  }

  function fillCommunityPronunciation(value) {
    var generated = root.ERPPronunciation && root.ERPPronunciation.generate(value);
    if (generated && generated.pinyin) {
      byId("communityPinyin").value = generated.pinyin;
      byId("communityNear").value = generated.nearVi;
      byId("communityFormStatus").textContent = "Đã tạo pinyin và âm gần Việt. Hãy kiểm tra lại trước khi gửi.";
      return;
    }
    byId("communityFormStatus").textContent = "Không tạo được cách đọc; hãy nhập pinyin và âm gần Việt thủ công.";
  }

  function submitTerm() {
    var button = byId("submitCommunity");
    var payload = {
      vi: byId("communityVi").value.trim(),
      hanzi: byId("communityHanzi").value.trim(),
      pinyin: byId("communityPinyin").value.trim(),
      nearVi: byId("communityNear").value.trim(),
      contributor: byId("communityContributor").value.trim(),
      example: byId("communityExample").value.trim()
    };
    if (!payload.vi || !payload.hanzi) {
      byId("communityFormStatus").textContent = "Cần nhập cả tiếng Việt và tiếng Trung.";
      return;
    }
    button.disabled = true;
    button.textContent = "Đang gửi…";
    byId("communityFormStatus").textContent = "Đang đưa từ lên kho chung…";
    fetch(API_URL, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || "Không gửi được từ.");
          return data;
        });
      })
      .then(function (data) {
        if (data.term) terms.unshift(data.term);
        renderTerms();
        if (root.ERPCommunityLearning) root.ERPCommunityLearning.merge(terms);
        byId("communityVi").value = "";
        byId("communityHanzi").value = "";
        byId("communityPinyin").value = "";
        byId("communityNear").value = "";
        byId("communityExample").value = "";
        byId("communityFormStatus").textContent = "Đã lưu vào kho chung và tự động xác minh.";
      })
      .catch(function (error) {
        byId("communityFormStatus").textContent = "Không gửi được: " + error.message;
      })
      .then(function () {
        button.disabled = false;
        button.textContent = "Đăng lên kho chung";
      });
  }

  function init() {
    if (!byId("community")) return;
    byId("communityHanzi").oninput = function () {
      var value = this.value.trim();
      if (!value) {
        byId("communityPinyin").value = "";
        byId("communityNear").value = "";
        return;
      }
      if (root.PinyinEngineReady && !root.pinyinPro) {
        byId("communityFormStatus").textContent = "Đang nạp bộ phát âm…";
        root.PinyinEngineReady.then(function () {
          if (byId("communityHanzi").value.trim() === value) fillCommunityPronunciation(value);
        });
      } else {
        fillCommunityPronunciation(value);
      }
    };
    byId("submitCommunity").onclick = submitTerm;
    byId("refreshCommunity").onclick = function () { loadTerms(true); };
    loadTerms(true);
    root.setInterval(function () { loadTerms(false); }, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof globalThis !== "undefined" ? globalThis : this);
