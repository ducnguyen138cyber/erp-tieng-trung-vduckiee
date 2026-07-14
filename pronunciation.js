(function (root) {
  "use strict";

  var toneToPlain = {
    "ā": "a", "á": "a", "ǎ": "a", "à": "a",
    "ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
    "ē": "e", "é": "e", "ě": "e", "è": "e",
    "ī": "i", "í": "i", "ǐ": "i", "ì": "i",
    "ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
    "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
    "ń": "n", "ň": "n", "ǹ": "n", "ḿ": "m"
  };

  var initialMap = {
    "": "", "b": "p", "p": "ph", "m": "m", "f": "ph",
    "d": "t", "t": "th", "n": "n", "l": "l",
    "g": "c", "k": "kh", "h": "h",
    "j": "ch", "q": "ch", "x": "x",
    "zh": "tr", "ch": "ch", "sh": "s", "r": "r",
    "z": "ch", "c": "x", "s": "x", "y": "d", "w": ""
  };

  var finalMap = {
    "a": "a", "o": "ô", "e": "ơ", "ai": "ai", "ei": "ây",
    "ao": "ao", "ou": "âu", "an": "an", "en": "ân",
    "ang": "ang", "eng": "âng", "ong": "ung", "er": "ơ",
    "i": "i", "ia": "ia", "ie": "iê", "iao": "iêu",
    "iu": "iêu", "ian": "iên", "in": "in", "iang": "iang",
    "ing": "inh", "iong": "iung",
    "u": "u", "ua": "oa", "uo": "uô", "uai": "oai",
    "ui": "uây", "uan": "oan", "un": "uân", "uang": "oang",
    "ueng": "uâng", "ue": "uyê",
    "ü": "uy", "üe": "uyê", "üan": "uyên", "ün": "uyn",
    "n": "ân", "ng": "âng", "m": "âm"
  };

  var vietnameseTones = {
    "a": ["a", "á", "ả", "à"], "ă": ["ă", "ắ", "ẳ", "ằ"],
    "â": ["â", "ấ", "ẩ", "ầ"], "e": ["e", "é", "ẻ", "è"],
    "ê": ["ê", "ế", "ể", "ề"], "i": ["i", "í", "ỉ", "ì"],
    "o": ["o", "ó", "ỏ", "ò"], "ô": ["ô", "ố", "ổ", "ồ"],
    "ơ": ["ơ", "ớ", "ở", "ờ"], "u": ["u", "ú", "ủ", "ù"],
    "ư": ["ư", "ứ", "ử", "ừ"], "y": ["y", "ý", "ỷ", "ỳ"]
  };

  function stripTone(value) {
    return String(value || "").replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜńňǹḿ]/g, function (character) {
      return toneToPlain[character] || character;
    });
  }

  function addVietnameseTone(word, toneNumber) {
    var toneIndex = toneNumber === 2 ? 1 : toneNumber === 3 ? 2 : toneNumber === 4 ? 3 : 0;
    if (!toneIndex) return word;

    var priorities = ["ê", "ơ", "â", "ô", "ă", "a", "e", "o"];
    var index = -1;
    for (var i = 0; i < priorities.length; i++) {
      index = word.indexOf(priorities[i]);
      if (index !== -1) break;
    }
    if (index === -1) {
      for (var j = word.length - 1; j >= 0; j--) {
        if (vietnameseTones[word[j]]) {
          index = j;
          break;
        }
      }
    }
    if (index === -1) return word;

    var vowel = word[index];
    return word.slice(0, index) + vietnameseTones[vowel][toneIndex] + word.slice(index + 1);
  }

  function detailToNearVietnamese(detail) {
    var initial = detail.initial || "";
    var finalBase = stripTone(detail.final || "");
    var syllable;

    if (finalBase === "i" && /^(zh|ch|sh|r|z|c|s)$/.test(initial)) {
      syllable = {
        "zh": "trư", "ch": "chư", "sh": "sư", "r": "rư",
        "z": "chư", "c": "xư", "s": "xư"
      }[initial];
    } else {
      var nearInitial = initialMap[initial] === undefined ? initial : initialMap[initial];
      var nearFinal = finalMap[finalBase] || finalBase.replace(/ü/g, "uy");

      if (initial === "w" && finalBase !== "u") nearInitial = "u";
      if (initial === "y" && finalBase === "i") nearInitial = "";
      if (initial === "y" && /^(u|ue|uan|un)$/.test(finalBase)) {
        nearFinal = { "u": "u", "ue": "uyê", "uan": "uyên", "un": "uyn" }[finalBase];
      }
      syllable = nearInitial + nearFinal;
    }

    return addVietnameseTone(syllable, Number(detail.num || 0));
  }

  function generate(hanzi) {
    if (!root.pinyinPro || typeof root.pinyinPro.pinyin !== "function") return null;
    var details = root.pinyinPro.pinyin(String(hanzi || ""), {
      type: "all",
      toneType: "symbol",
      nonZh: "removed"
    });
    var pinyin = [];
    var nearVietnamese = [];
    for (var i = 0; i < details.length; i++) {
      if (!details[i].isZh) continue;
      pinyin.push(details[i].pinyin);
      nearVietnamese.push(detailToNearVietnamese(details[i]));
    }
    return {
      pinyin: pinyin.join(" "),
      nearVi: nearVietnamese.join(" ")
    };
  }

  root.ERPPronunciation = {
    generate: generate,
    detailToNearVietnamese: detailToNearVietnamese
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
