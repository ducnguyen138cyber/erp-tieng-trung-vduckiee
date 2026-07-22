(function (root) {
  "use strict";
  var STATES = Object.freeze({ IDLE: "idle", HOVER: "hover", TAP: "tap", SUCCESS: "success", SAD: "sad", LEVEL_UP: "level-up", HATCHING: "hatching", GLOW: "glow", OUTFIT_CHANGE: "outfit-change", OUTFIT_CONFIRM: "outfit-confirm" });
  var PRIORITIES = Object.freeze({ idle: 0, hover: 2, tap: 2, glow: 3, sad: 4, success: 5, "outfit-change": 6, "outfit-confirm": 6, hatching: 7, "level-up": 8 });
  var DURATIONS = Object.freeze({ hover: 920, tap: 720, glow: 980, sad: 860, success: 860, "outfit-change": 1120, "outfit-confirm": 560, hatching: 1120, "level-up": 1180 });
  var FRAME_PLANS = Object.freeze({
    2: Object.freeze({ columns: 6, blink: 1, hoverA: 2, hoverB: 3, success: 4, sad: 5, outfit: 3 }),
    3: Object.freeze({ columns: 8, blink: 1, hoverA: 2, hoverB: 3, hover: 4, success: 5, sad: 6, outfit: 7 }),
    4: Object.freeze({ columns: 9, blink: 1, idleAlt: 2, hoverA: 3, hoverB: 4, hover: 5, success: 6, sad: 7, outfit: 8 }),
    5: Object.freeze({ columns: 9, blink: 1, idleAlt: 2, hoverA: 3, hoverB: 4, hover: 5, success: 6, sad: 7, outfit: 8 }),
    6: Object.freeze({ columns: 9, blink: 1, idleAlt: 2, hoverA: 3, hoverB: 4, hover: 5, success: 6, sad: 7, outfit: 8 }),
    7: Object.freeze({ columns: 9, blink: 1, idleAlt: 2, hoverA: 4, hoverB: 5, hover: 3, success: 6, sad: 7, outfit: 8 }),
    8: Object.freeze({ columns: 9, blink: 1, hoverA: 4, hoverB: 5, hover: 2, success: 6, sad: 7, outfit: 8 })
  });
  root.VDuckieMascotStates = Object.freeze({ version: "102.0", values: STATES, priorities: PRIORITIES, durations: DURATIONS, aliases: Object.freeze({ "outfit-check": "outfit-change", "egg-hatching": "hatching" }), framePlans: FRAME_PLANS });
})(window);
