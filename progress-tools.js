(function (root) {
  "use strict";

  var storageKeys = [
    "erp-lite-known",
    "erp-lite-personal",
    "erp-hsk-progress-v2",
    "erp-hsk-state-v2",
    "vduckie-last-area"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function exportProgress() {
    var data = {};
    for (var i = 0; i < storageKeys.length; i++) {
      var value = root.localStorage.getItem(storageKeys[i]);
      if (value !== null) data[storageKeys[i]] = value;
    }
    var backup = {
      app: "VDuckie Chinese Learning",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      data: data
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = "vduckie-tien-do-" + date + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    root.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function restoreProgress(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      root.alert("Tệp sao lưu quá lớn. Hãy chọn đúng tệp JSON do trang VDuckie tạo.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var backup = JSON.parse(String(reader.result || ""));
        if (!backup || backup.app !== "VDuckie Chinese Learning" || backup.formatVersion !== 1 || !backup.data || typeof backup.data !== "object") {
          throw new Error("invalid backup");
        }
        if (!root.confirm("Khôi phục sẽ thay thế tiến độ hiện có trên trình duyệt này. Tiếp tục nhé?")) return;
        var restored = 0;
        for (var i = 0; i < storageKeys.length; i++) {
          var key = storageKeys[i];
          if (typeof backup.data[key] === "string") {
            root.localStorage.setItem(key, backup.data[key]);
            restored++;
          }
        }
        if (!restored) throw new Error("empty backup");
        root.alert("Đã khôi phục tiến độ. Trang sẽ tải lại để áp dụng dữ liệu.");
        root.location.reload();
      } catch (error) {
        root.alert("Không đọc được tệp sao lưu. Hãy chọn đúng tệp JSON đã xuất từ trang này.");
      }
    };
    reader.onerror = function () {
      root.alert("Không đọc được tệp sao lưu trên thiết bị này.");
    };
    reader.readAsText(file);
  }

  function init() {
    var exportButton = byId("exportProgress");
    var importButton = byId("importProgress");
    var fileInput = byId("progressFile");
    if (!exportButton || !importButton || !fileInput) return;
    exportButton.onclick = exportProgress;
    importButton.onclick = function () { fileInput.click(); };
    fileInput.onchange = function () {
      restoreProgress(this.files && this.files[0]);
      this.value = "";
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : this);
