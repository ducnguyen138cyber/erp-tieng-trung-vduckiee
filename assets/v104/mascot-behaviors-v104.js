(function (root) {
  "use strict";
  var base = root.VDuckieMascotStates;
  if (!base) return;
  var framePlans = Object.assign({}, base.framePlans, {
    9: Object.freeze({ columns:9, blink:1, idleAlt:2, hoverA:3, hoverB:4, hover:4, success:5, sad:6, outfit:8 }),
    10: Object.freeze({ columns:9, blink:1, idleAlt:2, hoverA:3, hoverB:4, hover:4, success:5, sad:8, outfit:4 })
  });
  var levelBehaviors = Object.assign({}, base.levelBehaviors, {
    9: Object.freeze({ idle:"master-tablet-blink", hover:"master-look-up-smile-nod", success:"master-raise-hsk-book", wrong:"master-review-tablet", pronunciationWrong:"master-listen-and-tilt" }),
    10: Object.freeze({ idle:"grandmaster-book-tablet-blink", hover:"grandmaster-close-book-nod-adjust-glasses", success:"grandmaster-thumbs-up", wrong:"grandmaster-review", pronunciationWrong:"grandmaster-listen-mouth-guide", streakLost:"grandmaster-lower-book-sigh" })
  });
  root.VDuckieMascotStates = Object.freeze(Object.assign({}, base, {
    version:"104.0",
    framePlans:Object.freeze(framePlans),
    levelBehaviors:Object.freeze(levelBehaviors)
  }));
})(window);
