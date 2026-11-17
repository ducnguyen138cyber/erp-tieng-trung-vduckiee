const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.4.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.4.css'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');

function ruleBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
}

test('entry loads only badge-flip roadmap v89.4', () => {
  assert.match(entry, /hsk-roadmap-v89\.4\.css\?v=[\w.-]+/);
  assert.match(entry, /hsk-roadmap-v89\.4\.js\?v=[\w.-]+/);
  assert.doesNotMatch(entry, /hsk-roadmap-v89\.3/);
});

test('runtime creates two faces only inside the round badge', () => {
  assert.match(ui, /hsk-level-badge/);
  assert.match(ui, /hsk-badge-inner/);
  assert.match(ui, /hsk-badge-front/);
  assert.match(ui, /hsk-badge-back/);
  assert.doesNotMatch(ui, /hsk-card-inner/);
  assert.doesNotMatch(ui, /hsk-card-front/);
  assert.doesNotMatch(ui, /hsk-card-back/);
});

test('only HSK 7 through HSK 9 remain separate locked cards', () => {
  [7, 8, 9].forEach((level) => assert.match(ui, new RegExp('level: ' + level + ', label: "HSK ' + level + '"')));
  assert.match(ui, /data-roadmap-card-count", "10"/);
  assert.match(ui, /button\.disabled = true/);
});

test('only the badge performs the two-sided coin flip', () => {
  assert.match(css, /\.hsk-level-badge[\s\S]*perspective:\s*700px/);
  assert.match(css, /\.hsk-badge-inner[\s\S]*transform-style:\s*preserve-3d/);
  assert.match(css, /\.hsk-badge-face[\s\S]*backface-visibility:\s*hidden/);
  assert.match(css, /\.hsk-badge-front\s*\{\s*transform:\s*rotateX\(0deg\)/);
  assert.match(css, /\.hsk-badge-back\s*\{\s*transform:\s*rotateX\(180deg\)/);
  assert.match(css, /\.hsk-roadmap-card:hover \.hsk-badge-inner[\s\S]*hsk-badge-coin-flip 740ms/);
  assert.match(css, /50%\s*\{\s*transform:rotateX\(180deg\) scale\(\.9\)/);
  assert.match(css, /100%\s*\{\s*transform:rotateX\(360deg\) scale\(1\)/);
  assert.doesNotMatch(css, /infinite/);
});

test('card text, progress and card body never receive flip transforms', () => {
  for (const selector of ['.hsk-roadmap-card', '.hsk-roadmap-card strong', '.hsk-roadmap-card small', '.hsk-roadmap-track']) {
    const block = ruleBlock(selector);
    assert.ok(block, `Missing CSS rule for ${selector}`);
    assert.match(block, /transform:\s*none/);
    assert.doesNotMatch(block, /rotateX|animation:\s*hsk-badge-coin-flip/);
  }
});

test('all ten palettes and accessibility fallbacks remain present', () => {
  for (let level = 0; level <= 9; level += 1) assert.match(css, new RegExp('data-v865-level="' + level + '"'));
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
  assert.match(css, /@media \(hover:none\), \(pointer:coarse\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /scroll-snap-type:\s*x proximity/);
  assert.match(css, /text-overflow:\s*ellipsis/);
});

test('existing progress and click logic remains unchanged', () => {
  assert.match(dashboard, /stage\.progress=stage\.active\?levelProgress/);
  assert.match(dashboard, /navigateHskLevel\(Number\(button\.getAttribute\("data-v865-level"\)\)\)/);
});


test('home roadmap keeps one active HSK5/6 and settles after enhancement and home rerender', () => {
  const {JSDOM}=require('jsdom');
  const dom=new JSDOM('<section id="v865HomeRoadmap"><div class="v865-road-scroll"></div></section>',{url:'https://example.invalid',runScripts:'outside-only'});
  const w=dom.window,d=w.document;w.requestAnimationFrame=()=>0;
  const scroll=d.querySelector('.v865-road-scroll');
  const initial=()=>Array.from({length:8},(_,level)=>'<button class="v865-road-stage '+(level===7?'locked':'')+'" data-v865-level="'+level+'"><span class="v865-road-icon">汉</span><strong>HSK '+level+'</strong><small>Sẵn sàng học</small><div class="v865-road-track"><i></i></div></button>').join('');
  try{
    w.eval(ui);
    for(let render=0;render<2;render++){
      scroll.innerHTML=initial();w.VDuckieHSKRoadmapV894.enhance();
      assert.equal(scroll.children.length,10);
      for(const level of [5,6]){
        const cards=scroll.querySelectorAll('[data-v865-level="'+level+'"]');
        assert.equal(cards.length,1,'one card per available level');assert.equal(cards[0].disabled,false);
        assert.doesNotMatch(cards[0].textContent,/Sắp mở/);
      }
      const cards=Array.from(scroll.children);
      w.VDuckieHSKRoadmapV894.enhance();
      assert.deepEqual(Array.from(scroll.children),cards,'a settled roadmap must not keep replacing its locked cards');
    }
  }finally{w.close();}
});
