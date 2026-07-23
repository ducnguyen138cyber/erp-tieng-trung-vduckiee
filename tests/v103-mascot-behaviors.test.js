const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("Level 1 newborn and Level 2 baby sprites are real transparent 16:9 frame sheets",()=>{
  const assets=[
    ["assets/vduckie/lv1/newborn-sprite-v103.webp",7680,1080,4],
    ["assets/vduckie/lv2/duckling-sprite-v103.webp",11520,1080,6]
  ];
  const identify=require("node:child_process").execFileSync;
  for(const [file,width,height,frames] of assets){
    assert.ok(fs.statSync(path.join(root,file)).size>100000);
    const output=identify("identify",["-format","%w %h %[opaque]",path.join(root,file)],{encoding:"utf8"});
    assert.equal(output.toLowerCase(),`${width} ${height} false`);
    assert.equal(width/frames/height,16/9);
  }
});

test("V103 manifest selects newborn after hatch, new Level 2 and cleaned Level 7-8",()=>{
  const source=read("assets/v103/mascot-manifest-v103.js");
  assert.match(source,/query\.hatched/);
  assert.match(source,/newborn-sprite-v103\.webp/);
  assert.match(source,/duckling-sprite-v103\.webp/);
  assert.match(source,/expert-sprite-v103\.webp/);
  assert.match(source,/leader-sprite-v103\.webp/);
  assert.doesNotMatch(source,/fallbackAsset:cleaned\[level\]/);
});

test("hover has one pointer entry lock and eight distinct behavior timelines",()=>{
  const evolution=read("assets/v95/vduckie-evolution-v95.js");
  const css=read("assets/v103/mascot-runtime-v103.css");
  assert.match(evolution,/pointerInsideMascot/);
  assert.match(evolution,/if \(pointerInsideMascot\) return/);
  assert.match(evolution,/pointerInsideMascot = false/);
  assert.equal((evolution.match(/addEventListener\("pointerenter"/g)||[]).length,1);
  assert.doesNotMatch(css,/is-hover[^}]+infinite/);
  for(const name of ["newborn","baby","school","university","office","manager","expert","leader"])assert.match(css,new RegExp(`@keyframes v103-hover-${name}`));
});

test("learning events have explicit priorities, cooldowns, queue and UI hooks",()=>{
  const window={};vm.runInContext(read("assets/v103/mascot-behaviors-v103.js"),vm.createContext({window,Object}));
  const config=window.VDuckieMascotStates;
  assert.ok(config.priorities["level-up"]>config.priorities["lesson-complete"]);
  assert.ok(config.priorities["streak-lost"]>config.priorities["wrong-answer"]);
  assert.ok(config.cooldowns["wrong-answer"]>0);
  const evolution=read("assets/v95/vduckie-evolution-v95.js");
  assert.match(evolution,/eventQueue/);assert.match(evolution,/eventCooldownUntil/);assert.match(evolution,/drainEventQueue/);
  const bridge=read("assets/v103/mascot-learning-events-v103.js");
  for(const event of ["correct-answer","wrong-answer","pronunciation-good","pronunciation-wrong","lesson-complete","streak-increased","streak-lost"])assert.match(bridge,new RegExp(event));
});

test("Developer Center exposes every contextual event without progress writes",()=>{
  const preview=["assets/developer-tabs/evolution.js","assets/developer-tabs/animation.js","assets/developer-tabs/learning-speaking.js"].map(read).join("\n");
  for(const event of ["idle","hover","correct-answer","wrong-answer","pronunciation-good","pronunciation-wrong","lesson-complete","level-up","streak-increased","streak-lost","outfit-change","egg-hatching"]) assert.match(preview,new RegExp(event));
  assert.doesNotMatch(preview,/awardEXP\(|total_exp\s*=|saveProgress\(|\.from\(/);
});

test("newborn thought data is age appropriate and production order is correct",()=>{
  const thoughts=read("assets/v95/thoughts-v95.js"),index=read("index.html");
  assert.match(thoughts,/这是哪里？/);assert.match(thoughts,/我出生了！/);assert.match(thoughts,/我要快快长大！/);
  assert.match(index,/mascot-behaviors-v103\.js\?v=103\.0[^\n]+mascot-manifest-v103\.js\?v=103\.0[^\n]+vduckie-mascot-v95\.js\?v=104\.0/);
  assert.match(index,/mascot-learning-events-v103\.js\?v=103\.0/);
});
