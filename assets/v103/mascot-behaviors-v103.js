(function (root) {
  "use strict";
  var STATES = Object.freeze({ IDLE:"idle", HOVER:"hover", TAP:"tap", CORRECT:"correct-answer", WRONG:"wrong-answer", PRONUNCIATION_GOOD:"pronunciation-good", PRONUNCIATION_WRONG:"pronunciation-wrong", LESSON_COMPLETE:"lesson-complete", LEVEL_UP:"level-up", STREAK_INCREASED:"streak-increased", STREAK_LOST:"streak-lost", HATCHING:"hatching", GLOW:"glow", OUTFIT_CHANGE:"outfit-change", OUTFIT_CONFIRM:"outfit-confirm" });
  var EVENTS = Object.freeze({ HOVER:"hover", CORRECT_ANSWER:"correct-answer", WRONG_ANSWER:"wrong-answer", PRONUNCIATION_GOOD:"pronunciation-good", PRONUNCIATION_WRONG:"pronunciation-wrong", LESSON_COMPLETE:"lesson-complete", LEVEL_UP:"level-up", STREAK_INCREASED:"streak-increased", STREAK_LOST:"streak-lost", OUTFIT_CHANGE:"outfit-change" });
  var PRIORITIES = Object.freeze({ idle:0, hover:1, tap:1, "correct-answer":2, "pronunciation-good":3, "wrong-answer":4, "pronunciation-wrong":5, glow:5, "streak-increased":6, "outfit-change":7, "outfit-confirm":7, "streak-lost":8, "lesson-complete":9, hatching:10, "level-up":11 });
  var DURATIONS = Object.freeze({ hover:1050, tap:760, "correct-answer":760, "wrong-answer":900, "pronunciation-good":920, "pronunciation-wrong":1050, "streak-increased":1050, "streak-lost":1300, "lesson-complete":1400, glow:980, "outfit-change":1120, "outfit-confirm":560, hatching:1500, "level-up":1500 });
  var FRAME_PLANS = Object.freeze({
    1:Object.freeze({columns:4,blink:1,hoverA:1,hoverB:2,hover:2,success:2,sad:3,outfit:1}),
    2:Object.freeze({columns:6,blink:1,hoverA:2,hoverB:3,hover:3,success:4,sad:5,outfit:2}),
    3:Object.freeze({columns:8,blink:1,hoverA:4,hoverB:5,hover:5,success:5,sad:6,outfit:7}),
    4:Object.freeze({columns:9,blink:1,idleAlt:2,hoverA:3,hoverB:5,hover:5,success:6,sad:7,outfit:8}),
    5:Object.freeze({columns:9,blink:1,idleAlt:2,hoverA:3,hoverB:5,hover:5,success:6,sad:7,outfit:8}),
    6:Object.freeze({columns:9,blink:1,idleAlt:2,hoverA:2,hoverB:5,hover:5,success:6,sad:7,outfit:8}),
    7:Object.freeze({columns:9,blink:1,idleAlt:2,hoverA:3,hoverB:6,hover:6,success:6,sad:7,outfit:8}),
    8:Object.freeze({columns:9,blink:1,idleAlt:2,hoverA:2,hoverB:3,hover:6,success:6,sad:7,outfit:8})
  });
  var LEVEL_BEHAVIORS = Object.freeze({
    1:Object.freeze({idle:"egg-breathe-or-newborn-blink",hover:"egg-three-wobbles-or-newborn-wing-wave"}),
    2:Object.freeze({idle:"baby-breathe-blink",hover:"baby-head-tilt-wave"}),
    3:Object.freeze({idle:"student-hold-book-blink",hover:"student-happy-book-wave"}),
    4:Object.freeze({idle:"university-reading",hover:"university-wave-adjust-glasses"}),
    5:Object.freeze({idle:"office-read-report",hover:"office-check-badge-collar"}),
    6:Object.freeze({idle:"manager-check-tablet",hover:"manager-adjust-suit-nod"}),
    7:Object.freeze({idle:"expert-review-data",hover:"expert-inspect-badge-glow"}),
    8:Object.freeze({idle:"leader-confident",hover:"leader-adjust-watch-cuff"})
  });
  root.VDuckieMascotStates = Object.freeze({ version:"103.0", values:STATES, events:EVENTS, priorities:PRIORITIES, durations:DURATIONS, aliases:Object.freeze({ success:"correct-answer", sad:"wrong-answer", "outfit-check":"outfit-change", "egg-hatching":"hatching" }), eventMap:Object.freeze({ success:"correct-answer", sad:"wrong-answer" }), cooldowns:Object.freeze({"correct-answer":450,"wrong-answer":700,"pronunciation-good":700,"pronunciation-wrong":1000,"streak-increased":1200,"streak-lost":2500}), framePlans:FRAME_PLANS, levelBehaviors:LEVEL_BEHAVIORS });
})(window);
