"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.HSK_SMOKE_BASE_URL || "http://127.0.0.1:4173/";
const root = path.resolve(__dirname,"..");
const hsk2Exercises = JSON.parse(fs.readFileSync(path.join(root,"data/hsk/hsk2/exercises.json"),"utf8")).records;
const cjkFontData = process.env.HSK_BROWSER_CJK_FONT ? fs.readFileSync(process.env.HSK_BROWSER_CJK_FONT).toString("base64") : "";
const result = { base, viewports:{}, consoleErrors:[], requestFailures:[] };
const sizes = [
  {name:"desktop-1440",width:1440,height:900,lesson:"hsk2-lesson-01"},
  {name:"desktop-1024",width:1024,height:768,lesson:"hsk2-lesson-14"},
  {name:"mobile-390",width:390,height:844,lesson:"hsk2-lesson-14",mobile:true},
  {name:"mobile-320",width:320,height:568,lesson:"hsk2-lesson-28",mobile:true}
];

async function waitReady(page,level){
  await page.waitForFunction((expected)=>{
    if(!document.body||document.body.getAttribute("data-hsk-prof-ready")!=="true"||!window.VDuckieHskProfessionalRuntime)return false;
    const state=window.VDuckieHskProfessionalRuntime.getState();
    return state.status==="ready"&&state.selectedLevel===expected&&state.counts;
  },level,{timeout:25000});
  return page.evaluate(()=>window.VDuckieHskProfessionalRuntime.getState());
}

async function layoutMetrics(page){
  return page.evaluate(()=>{
    const viewport=window.innerWidth;
    const chinese=Array.from(document.querySelectorAll('#hskLesson [lang="zh-CN"]')).filter((node)=>node.getBoundingClientRect().height>0);
    const buttons=Array.from(document.querySelectorAll("#hskLesson button:not([disabled])")).filter((node)=>node.getBoundingClientRect().height>0);
    const rail=document.getElementById("hskLevels");
    return {
      overflow:document.documentElement.scrollWidth-viewport,
      levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0,
      minChineseFont:chinese.length?Math.min(...chinese.map((node)=>parseFloat(getComputedStyle(node).fontSize)||0)):0,
      minButtonHeight:buttons.length?Math.min(...buttons.map((node)=>node.getBoundingClientRect().height)):0,
      widest:Array.from(document.querySelectorAll("body *")).map((node)=>{const rect=node.getBoundingClientRect();return {tag:node.tagName,id:node.id||"",className:typeof node.className==="string"?node.className.slice(0,100):"",right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:Math.round(node.scrollWidth||0)};}).filter((item)=>item.right>viewport+2||item.width>viewport+2).slice(0,10)
    };
  });
}

async function assertHsk2(page,state){
  const expected={units:10,lessons:28,grammar:29,characters:60,exercises:168,assessments:13,vocabulary:200};
  if(!state||state.readOnly!==true||state.progressWritesEnabled!==false||state.selectedLevel!==2)throw new Error("HSK2 runtime is not selected/read-only.");
  for(const [key,value] of Object.entries(expected))if(state.counts[key]!==value)throw new Error(`HSK2 count ${key}: ${state.counts[key]} != ${value}`);
  await page.locator(".hsk-intro strong").getByText("HSK 2 Professional · C3 learner-facing",{exact:true}).waitFor();
  if(await page.locator(".hsk-pro-unit").count()!==10)throw new Error("HSK2 unit list is incomplete.");
  if(await page.locator("[data-pro-lesson]").count()!==28)throw new Error("HSK2 lesson list is incomplete.");
  if(await page.locator("[data-pro-assessment]").count()!==13)throw new Error("HSK2 assessment list is incomplete.");
  for(const heading of ["Từ vựng mới theo ngữ cảnh","Chữ Hán trọng tâm","Ngữ pháp để hoàn thành nhiệm vụ","Hội thoại có tình huống","Đọc hiểu có bằng chứng","Nghe ý chính, chi tiết và shadowing","Phát âm cho người Việt","Nói, viết và dùng thật","Ôn cách quãng","Bài tập của lesson"]){
    await page.locator("#hskLesson").getByText(heading,{exact:true}).waitFor();
  }
}

(async()=>{
  const executablePath=process.env.HSK_BROWSER_EXECUTABLE || undefined;
  const browser=await chromium.launch({
    headless:true,
    executablePath,
    args:executablePath?["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]:[]
  });
  try{
    for(const spec of sizes){
      const page=await browser.newPage({viewport:{width:spec.width,height:spec.height},isMobile:Boolean(spec.mobile),hasTouch:Boolean(spec.mobile)});
      page.on("console",(message)=>{if(message.type()==="error")result.consoleErrors.push(`${spec.name}: ${message.text()}`);});
      page.on("requestfailed",(request)=>result.requestFailures.push(`${spec.name}: ${request.url()} — ${request.failure()&&request.failure().errorText||"unknown"}`));
      await page.goto(`${base}?area=hsk&hskLevel=2&hskLesson=${spec.lesson}`,{waitUntil:"domcontentloaded",timeout:30000});
      if(cjkFontData){
        await page.addStyleTag({content:`@font-face{font-family:"Noto Sans SC";font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,${cjkFontData}) format("woff2")}`});
        await page.evaluate(()=>document.fonts&&document.fonts.ready);
      }
      const state=await waitReady(page,2);
      await assertHsk2(page,state);
      await page.locator(`#hskLesson`).getByText(new RegExp(`BÀI\\s+${Number(spec.lesson.slice(-2))}\\s+\\/\\s+28`,"i")).first().waitFor();
      const metrics=await layoutMetrics(page);
      if(metrics.overflow>2)throw new Error(`${spec.name} horizontal overflow ${metrics.overflow}: ${JSON.stringify(metrics.widest)}`);
      if(metrics.levelRailOverflow>2)throw new Error(`${spec.name} HSK selector overflows by ${metrics.levelRailOverflow}px`);
      if(spec.mobile&&metrics.minButtonHeight&&metrics.minButtonHeight<40)throw new Error(`${spec.name} lesson control is too short: ${metrics.minButtonHeight}`);
      if(spec.mobile&&metrics.minChineseFont&&metrics.minChineseFont<12)throw new Error(`${spec.name} Chinese text is too small: ${metrics.minChineseFont}`);
      result.viewports[spec.name]={state,metrics,url:page.url()};
      await page.screenshot({path:`/tmp/hsk2-c3-${spec.name}.png`,fullPage:true});

      if(spec.name==="desktop-1440"){
        await page.locator('[data-pro-lesson="hsk2-lesson-02"]').click();
        await page.locator("#hskLesson").getByText("Nói rõ vấn đề học tập",{exact:true}).waitFor();
        await page.locator("#hskLesson").getByText("Lượng từ khi đếm:",{exact:true}).first().waitFor();
        await page.locator("#hskLesson").getByText("Cách dùng:",{exact:true}).first().waitFor();
        await page.locator("#hskLesson").getByText("Mẫu dùng tự nhiên",{exact:true}).first().waitFor();
        await page.locator("#hskLesson").getByText("Lỗi dễ mắc",{exact:true}).first().waitFor();
        await page.locator("[data-pro-prev]").click();
        await page.locator("#hskLesson").getByText("Khi nghe chưa rõ",{exact:true}).waitFor();
        const first=hsk2Exercises.find((exercise)=>exercise.id==="hsk2-lesson-01-exercise-1");
        const card=page.locator(`[data-pro-exercise="${first.id}"]`);
        await card.locator(`[data-pro-input-for="${first.id}"]`).fill(first.acceptedAnswers[0]);
        await card.locator(`[data-pro-check="${first.id}"]`).click();
        await card.getByText("Đúng.",{exact:true}).waitFor();
        await page.locator('[data-pro-assessment="hsk2-assessment-unit-01"]').click();
        await page.locator("#hskLesson").getByText(/Checkpoint Unit 1/).waitFor();
        await page.locator('[data-pro-assessment="hsk2-assessment-midpoint"]').click();
        await page.locator("#hskLesson").getByText(/Midpoint/).waitFor();
        await page.locator('[data-pro-assessment="hsk2-assessment-final"]').click();
        await page.locator("#hskLesson").getByText(/Final Assessment/).waitFor();
        await page.locator('[data-pro-assessment="hsk2-assessment-mastery"]').click();
        await page.locator("#hskLesson").getByText(/Mastery Review/).waitFor();
        await page.locator('[data-pro-level="1"]').click();
        const hsk1=await waitReady(page,1);
        if(hsk1.counts.lessons!==24||hsk1.counts.vocabulary!==300)throw new Error("HSK1 regressed after switching back from HSK2.");
        await page.locator("#hskLesson").getByText("Nghe rõ bốn thanh",{exact:true}).waitFor();
        await page.locator('[data-pro-level="2"]').click();
        await waitReady(page,2);
      }
      await page.close();
    }
    const unexpectedFailures=result.requestFailures.filter((entry)=>!entry.includes("https://cdn.jsdelivr.net/npm/@supabase/")&&!entry.includes("/api/community-terms"));
    const unexpectedConsoleErrors=result.consoleErrors.filter((entry)=>!entry.endsWith("Failed to load resource: net::ERR_EMPTY_RESPONSE"));
    if(unexpectedConsoleErrors.length||unexpectedFailures.length)throw new Error(`Unexpected browser errors: ${JSON.stringify(unexpectedConsoleErrors)}; request failures: ${JSON.stringify(unexpectedFailures)}`);
    fs.writeFileSync("/tmp/hsk2-c3-browser-smoke.json",`${JSON.stringify(result,null,2)}\n`);
    console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
})().catch((error)=>{result.error=error&&error.stack||String(error);try{fs.writeFileSync("/tmp/hsk2-c3-browser-smoke.json",`${JSON.stringify(result,null,2)}\n`);}catch(_){}console.error(error);process.exit(1);});
