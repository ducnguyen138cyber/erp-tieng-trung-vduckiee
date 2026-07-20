(function (root, document) {
  "use strict";

  var VERSION = "89.3";
  var observer = null;
  var scheduled = false;
  var lockedStages = [
    { level: 5, label: "HSK 5", icon: "伍" },
    { level: 6, label: "HSK 6", icon: "陆" },
    { level: 7, label: "HSK 7", icon: "柒" },
    { level: 8, label: "HSK 8", icon: "捌" },
    { level: 9, label: "HSK 9", icon: "玖" }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function currentLevel() {
    try {
      var raw = root.localStorage.getItem("erp-hsk-state-v2");
      var parsed = raw ? JSON.parse(raw) : {};
      return Number(parsed && parsed.level || 0);
    } catch (error) {
      return 0;
    }
  }

  function faceMarkup(stage, detail, percent, isCurrent, isBack) {
    var status = isCurrent ? '<span class="hsk-card-status">Đang học</span>' : "";
    var faceClass = isBack ? "hsk-card-back" : "hsk-card-front";
    return '<span class="hsk-card-face ' + faceClass + '"' + (isBack ? ' aria-hidden="true"' : "") + '>' +
      status +
      '<span class="v865-road-icon hsk-roadmap-icon">' + escapeHtml(stage.icon) + '</span>' +
      '<strong>' + escapeHtml(stage.label) + '</strong>' +
      '<small>' + escapeHtml(detail) + '</small>' +
      '<span class="v865-road-track hsk-roadmap-track"><i style="width:' + Number(percent || 0) + '%"></i></span>' +
      '</span>';
  }

  function enhanceButton(button) {
    if (!button || button.getAttribute("data-hsk-roadmap-v893") === "ready") return;
    var icon = button.querySelector(".v865-road-icon");
    var title = button.querySelector("strong");
    var detail = button.querySelector("small");
    var fill = button.querySelector(".v865-road-track i");
    var stage = {
      level: Number(button.getAttribute("data-v865-level") || 0),
      label: title ? title.textContent.trim() : "HSK",
      icon: icon ? icon.textContent.trim() : "汉"
    };
    var detailText = detail ? detail.textContent.trim() : "Sẵn sàng học";
    var percent = fill ? parseFloat(fill.style.width || "0") || 0 : 0;
    var isCurrent = button.classList.contains("current");

    button.classList.add("hsk-roadmap-card");
    button.setAttribute("data-hsk-roadmap-v893", "ready");
    button.setAttribute("aria-label", stage.label + ", " + detailText + (isCurrent ? ", đang học" : ""));
    button.innerHTML = '<span class="hsk-card-inner">' +
      faceMarkup(stage, detailText, percent, isCurrent, false) +
      faceMarkup(stage, detailText, percent, isCurrent, true) +
      '</span>';
  }

  function createLockedButton(stage, activeLevel) {
    var button = document.createElement("button");
    var isCurrent = Number(stage.level) === Number(activeLevel);
    button.type = "button";
    button.disabled = true;
    button.className = "v865-road-stage hsk-roadmap-card locked" + (isCurrent ? " current" : "");
    button.setAttribute("data-v865-level", String(stage.level));
    button.setAttribute("data-hsk-roadmap-v893", "ready");
    button.setAttribute("aria-label", stage.label + ", sắp mở");
    button.innerHTML = '<span class="hsk-card-inner">' +
      faceMarkup(stage, "Sắp mở", 0, isCurrent, false) +
      faceMarkup(stage, "Sắp mở", 0, isCurrent, true) +
      '</span>';
    return button;
  }

  function enhanceRoadmap() {
    scheduled = false;
    var roadmap = document.getElementById("v865HomeRoadmap");
    if (!roadmap) return false;
    var scroll = roadmap.querySelector(".v865-road-scroll");
    if (!scroll) return false;

    var readyCards = scroll.querySelectorAll(".hsk-roadmap-card[data-hsk-roadmap-v893='ready']");
    if (roadmap.getAttribute("data-hsk-roadmap-v893") === "ready" && readyCards.length === 10) return true;

    var existing = Array.prototype.slice.call(scroll.querySelectorAll("button.v865-road-stage"));
    var activeLevel = currentLevel();
    existing.forEach(function (button) {
      if (!button.classList.contains("locked")) enhanceButton(button);
    });
    existing.forEach(function (button) {
      if (button.classList.contains("locked") && button.parentNode === scroll) button.parentNode.removeChild(button);
    });
    lockedStages.forEach(function (stage) {
      scroll.appendChild(createLockedButton(stage, activeLevel));
    });

    roadmap.setAttribute("data-hsk-roadmap-v893", "ready");
    roadmap.setAttribute("data-roadmap-card-count", "10");
    return true;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame(enhanceRoadmap);
  }

  function start() {
    schedule();
    if (!root.MutationObserver || !document.body) return;
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  root.VDuckieHSKRoadmapV893 = Object.freeze({ version: VERSION, enhance: enhanceRoadmap });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(window, document);
