const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../assets/games/typing-engine.js'),{Round}=require('../assets/games/sentence-engine.js');
const bank=JSON.parse(fs.readFileSync('data/games/sentences.json')).sentences;
test('all curated sentences have distinct IDs, tone Pinyin and complete Chinese answers',()=>{
 assert.equal(bank.length,36);assert.equal(new Set(bank.map(x=>x.id)).size,36);
 for(const topic of ['basic','daily','factory'])assert.ok(bank.filter(s=>s.topic===topic).length>=10);
 for(const s of bank){assert.ok(s.vi);assert.ok(s.answers.length);for(const a of s.answers){assert.match(a.hanzi,/[\u4e00-\u9fff]/);assert.match(T.normalize(a.pinyin),/^[a-z]+$/);const r=new Round({sentences:[s]});r.type(a.pinyin.toUpperCase());assert.equal(r.solved,true,s.id);assert.equal(r.score,100);r.type(a.pinyin);assert.equal(r.score,100);}}
});
test('incorrect keys cannot erase the accepted prefix, fire progression or inflate score',()=>{
 const s={vi:'Tôi muốn uống nước.',answers:[{hanzi:'我想喝水',pinyin:'wǒ xiǎng hē shuǐ'},{hanzi:'我要喝水',pinyin:'wǒ yào hē shuǐ'}]},r=new Round({sentences:[s]});
 assert.deepEqual(r.type('wo'),{accepted:2,rejected:0});assert.deepEqual(r.type('woxz'),{accepted:1,rejected:1});assert.equal(r.input,'wox');
 r.type('wo');assert.equal(r.input,'wo');r.type('woyao');assert.equal(r.input,'woyao');r.type('woyaoz');assert.equal(r.input,'woyao');
 r.type('woyaoHESHUI');assert.equal(r.answer.hanzi,'我要喝水');assert.equal(r.score,100);assert.equal(r.completed,1);assert.equal(r.revealed,true);r.type('woyaoHESHUI');assert.equal(r.score,100);assert.ok(r.result().accuracy<100);
});
test('skip, next, full round, replay and retained IME characters have stable accounting',()=>{
 const r=new Round({sentences:bank.filter(x=>x.topic==='basic'),random:()=>.2});r.type('w');const attempts=r.attempts;r.type(r.input);assert.equal(r.attempts,attempts);
 r.skip();r.skip();assert.equal(r.missed.length,1);assert.equal(r.next(),true);
 while(!r.ended){r.type(r.current().answers[0].pinyin);r.next();}
 assert.equal(r.result().score,900);assert.equal(r.result().completed,9);assert.equal(r.result().missed.length,1);
 const fresh=new Round({sentences:bank});assert.equal(fresh.score,0);assert.equal(fresh.missed.length,0);
});
test('workshop extends real modules and terms with canonical playable dialogues and contextual examples',()=>{
 const w={ERP_TERMS:[]};const c=vm.createContext({window:w});for(const file of ['lite-terms.js','erp-content-v74.js','assets/factory/workshop-content.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
 const added=w.VDuckieFactoryContent;assert.equal(added.lessons.length,4);assert.equal(added.terms.length,40);assert.equal(w.ERPContentV74.lessons.length,12);
 const map=new Map(added.terms.map(t=>[t[0],t]));for(const l of added.lessons){assert.equal(l.words.length,10);for(const word of l.words)assert.ok(map.has(word),word);assert.equal(l.workflow.length,4);const dialogue=w.ERPScenariosV74.find(s=>s.title===l.dialogue);assert.ok(dialogue);for(const step of dialogue.steps)for(const alternatives of step.required)assert.ok(alternatives.some(s=>step.target.includes(s)),step.target);}
 for(const t of added.terms){assert.ok(t[6].includes(t[0]),t[0]);assert.ok(t[7]);assert.match(T.normalize(t[1]),/^[a-z]+$/);}
});
