import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const shell=readFileSync('app-shell-v88.html','utf8');
const dialogue=readFileSync('dialogue.js','utf8');
const daily=readFileSync('assets/daily-learning-v2.js','utf8');
const hsk=readFileSync('hsk-lessons.js','utf8');
test('Roast Mode removed from active learning UI and runtime',()=>{
  for(const [name,source] of Object.entries({shell,dialogue,daily,hsk})){
    assert.doesNotMatch(source,/roast.?mode|roastVoice|VDuckieRoast|chửi giọng Việt/i,name);
  }
  assert.match(shell,/id="dialogue"/);
  assert.match(dialogue,/function recognitionComment\(score\)/);
  assert.match(dialogue,/Độ khớp chữ máy nghe/);
  assert.match(dialogue,/function showRecognized/);
});
test('modified JS files remain parsable',()=>{
 for(const name of ['dialogue.js','assets/daily-learning-v2.js','hsk-lessons.js']){
  new vm.Script(readFileSync(name,'utf8'),{filename:name});
 }
});
