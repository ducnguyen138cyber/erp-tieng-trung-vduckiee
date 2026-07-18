(function(root){
"use strict";

var VERSION="86.4";
var ACTIVITY_KEY="vduckie-study-activity-v1";
var STREAK_KEY="vduckie-streak-v84";
var SRS_KEY="vduckie-review-srs-v1";
var RESULT_KEY="vduckie-exercise-results-v1";
var HSK_PROGRESS_KEY="erp-hsk-progress-v2";
var HSK_STATE_KEY="erp-hsk-state-v2";
var renderTimer=0;
var homeObserver=null;

function text(value){return String(value==null?"":value).trim()}
function esc(value){return text(value).replace(/[&<>"']/g,function(character){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]})}
function read(key,fallback){try{var raw=root.localStorage.getItem(key);if(raw===null)return fallback;var parsed=JSON.parse(raw);return parsed&&typeof parsed==="object"?parsed:fallback}catch(error){return fallback}}
function write(key,value){try{root.localStorage.setItem(key,JSON.stringify(value))}catch(error){}}
function dateKey(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0")}
function dayLabel(date){return["CN","T2","T3","T4","T5","T6","T7"][date.getDay()]}
function completedCount(value){var total=0;value=value&&typeof value==="object"?value:{};Object.keys(value).forEach(function(key){if(value[key])total++});return total}
function homeVisible(){var home=document.getElementById("homeHub");return Boolean(home&&!home.classList.contains("hidden"))}
function navigate(area){var button=document.querySelector('[data-area="'+area+'"]');if(button)button.click();else if(root.ERPAreaNavigation&&typeof root.ERPAreaNavigation.select==="function")root.ERPAreaNavigation.select(area)}
function navigateHskLevel(level){navigate("hsk");root.setTimeout(function(){var button=document.querySelector('#hskLevels [data-hsk-level="'+level+'"]');if(button)button.click()},180)}

function lastSevenDays(activity){
  var today=new Date(),days=[];
  activity=activity&&activity.dates?activity:{dates:{}};
  for(var offset=6;offset>=0;offset--){
    var date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-offset),key=dateKey(date),count=Number(activity.dates[key]||0);
    days.push({key:key,label:dayLabel(date),date:String(date.getDate()).padStart(2,"0"),done:count>0,today:offset===0,count:count});
  }
  return days;
}
function streakCount(activity){
  var dates=activity&&activity.dates||{},today=new Date(),cursor=new Date(today.getFullYear(),today.getMonth(),today.getDate()),count=0;
  if(!dates[dateKey(cursor)])cursor.setDate(cursor.getDate()-1);
  while(dates[dateKey(cursor)]){count++;cursor.setDate(cursor.getDate()-1)}
  return count;
}
function weeklyReviewCount(srs){
  var words=srs&&srs.words||{},since=Date.now()-7*86400000,count=0;
  Object.keys(words).forEach(function(word){if(Number(words[word].lastReviewedAt||0)>=since)count++});
  return count;
}
function weeklyTestCount(results){
  var items=results&&results.items||{},since=Date.now()-7*86400000,count=0;
  Object.keys(items).forEach(function(key){var item=items[key]||{};if(Number(item.lastAt||0)>=since&&(key.indexOf("quiz")>=0||key.indexOf("adaptive")>=0))count++});
  return count;
}
function streakData(){
  var activity=read(ACTIVITY_KEY,{dates:{},totalActions:0}),days=lastSevenDays(activity),current=streakCount(activity),longest=Math.max(current,Number(activity.longestStreak||0)),todayDone=days.length?days[days.length-1].done:false;
  write(STREAK_KEY,{version:3,days:days,current:current,longest:longest,updatedAt:Date.now()});
  return{activity:activity,days:days,current:current,longest:longest,todayDone:todayDone};
}
function weeklyData(streak){
  var srs=read(SRS_KEY,{words:{}}),results=read(RESULT_KEY,{items:{}}),daysStudied=streak.days.filter(function(day){return day.done}).length,reviews=weeklyReviewCount(srs),tests=weeklyTestCount(results);
  return{missions:[
    {icon:"📖",title:"Học đủ 5 ngày",value:daysStudied,target:5},
    {icon:"↻",title:"Ôn 10 từ vựng",value:reviews,target:10},
    {icon:"✓",title:"Làm 1 bài kiểm tra",value:tests,target:1}
  ]};
}
function continueData(){
  var state=read(HSK_STATE_KEY,{level:0,lesson:0}),level=Number(state.level||0),lessonIndex=Number(state.lesson||0),curriculum=root.HSKCurriculum,item=curriculum&&curriculum.levels&&curriculum.levels[level]&&curriculum.levels[level][lessonIndex],done=completedCount(read(HSK_PROGRESS_KEY,{}));
  return{level:level,title:item&&item.title?item.title:(level===0?"Bắt đầu phần Nền tảng":"Tiếp tục lộ trình HSK"),subtitle:item&&item.goal?item.goal:"Quay lại đúng bài gần nhất đã học.",done:done};
}
function levelProgress(level){
  var curriculum=root.HSKCurriculum,lessons=curriculum&&curriculum.levels&&curriculum.levels[level]||[],completed=read(HSK_PROGRESS_KEY,{}),done=0;
  lessons.forEach(function(item){if(item&&completed[item.id])done++});
  return{done:done,total:lessons.length,percent:lessons.length?Math.round(done/lessons.length*100):0};
}
function roadmapData(){
  var state=read(HSK_STATE_KEY,{level:0}),current=Number(state.level||0),stages=[
    {level:0,label:"Nền tảng",icon:"基",active:true},
    {level:1,label:"HSK 1",icon:"壹",active:true},
    {level:2,label:"HSK 2",icon:"贰",active:true},
    {level:3,label:"HSK 3",icon:"叁",active:true},
    {level:4,label:"HSK 4",icon:"肆",active:true},
    {level:5,label:"HSK 5–6",icon:"伍",active:false},
    {level:7,label:"HSK 7–9",icon:"锁",active:false}
  ];
  return stages.map(function(stage){stage.current=stage.level===current;stage.progress=stage.active?levelProgress(stage.level):{done:0,total:0,percent:0};return stage});
}

function streakMarkup(data){
  var days=data.days.map(function(day){return'<div class="v864-streak-day '+(day.done?"done ":"")+(day.today?"today":"")+'"><span>'+day.label+'</span><i>'+(day.done?"🔥":"")+'</i><small>'+day.date+'</small></div>'}).join("");
  var cta=data.current===0?"BẮT ĐẦU CHUỖI CỦA BẠN":data.todayDone?"TIẾP TỤC GIỮ LỬA":"GIỮ CHUỖI HÔM NAY";
  return'<article class="v864-streak-card"><div class="v864-card-heading"><span class="v864-heading-icon">♨</span><h3>Chuỗi ngày học</h3></div><div class="v864-streak-summary"><span class="v864-fire-orb">🔥</span><div><strong>'+data.current+'</strong><b> ngày liên tiếp</b><p>Học mỗi ngày để giữ chuỗi streak và ghi nhớ lâu hơn.</p></div></div><div class="v864-streak-days">'+days+'</div><button class="v864-red-cta" data-v864-action="start-streak">🔥 '+cta+'</button></article>';
}
function weeklyMarkup(data){
  var missions=data.missions.map(function(mission){var percent=Math.min(100,Math.round(mission.value/mission.target*100));return'<div class="v864-mission"><span class="v864-mission-icon">'+mission.icon+'</span><div><div class="v864-mission-top"><strong>'+mission.title+'</strong><b>'+Math.min(mission.value,mission.target)+'/'+mission.target+'</b></div><div class="v864-mission-track"><i style="width:'+percent+'%"></i></div></div></div>'}).join("");
  return'<article class="v864-side-card v864-weekly-card"><div class="v864-card-heading"><span class="v864-heading-icon">🎁</span><h3>Nhiệm vụ tuần</h3></div><div class="v864-mission-list">'+missions+'</div><p class="v864-weekly-note">Hoàn thành cả ba để nhận huy hiệu <strong>Vịt bền bỉ</strong>.</p></article>';
}
function continueMarkup(data){
  return'<article class="v864-side-card v864-continue-card"><span class="v864-kicker">TIẾP TỤC HỌC</span><h3>'+esc(data.title)+'</h3><p>'+esc(data.subtitle)+'</p><div class="v864-continue-meta"><span>'+data.done+' bài đã hoàn thành</span><span>'+(data.level?"HSK "+data.level:"Nền tảng")+'</span></div><button data-v864-action="continue">Học tiếp →</button></article>';
}
function roadmapMarkup(stages){
  var cards=stages.map(function(stage){var detail=stage.active?(stage.progress.total?stage.progress.done+"/"+stage.progress.total+" bài":"Sẵn sàng học"):"Sắp mở";return'<button class="v864-road-stage '+(stage.current?"current ":"")+(stage.active?"":"locked")+'" data-v864-level="'+stage.level+'" '+(stage.active?"":"disabled")+'><span class="v864-road-icon">'+stage.icon+'</span><strong>'+stage.label+'</strong><small>'+detail+'</small><div class="v864-road-track"><i style="width:'+stage.progress.percent+'%"></i></div></button>'}).join("");
  return'<section class="v864-roadmap" id="v864HomeRoadmap"><div class="v864-roadmap-head"><div><span class="v864-kicker">LỘ TRÌNH ĐẾN KHI THÀNH THẠO</span><h2>Đi từng chặng, nhìn rõ tiến độ</h2></div><button data-v864-action="open-hsk">Xem lộ trình →</button></div><div class="v864-road-scroll">'+cards+'</div></section>';
}

function removeOldDashboard(){
  ["v83LearningCockpit","v84RetentionCenter","v862HomeWorkspace","v862HomeRoadmap"].forEach(function(id){var node=document.getElementById(id);if(node)node.remove()});
  var oldJourney=document.getElementById("homeJourney");if(oldJourney){oldJourney.classList.add("hidden");oldJourney.setAttribute("aria-hidden","true")}
}
function ensureTopStreak(home,overview){
  var mount=document.getElementById("v864TopStreakMount");
  if(!mount){mount=document.createElement("div");mount.id="v864TopStreakMount";mount.className="v864-top-streak-mount";overview.appendChild(mount)}
  return mount;
}
function ensureWorkspace(home,recommended){
  var workspace=document.getElementById("v864HomeWorkspace");
  if(!workspace){
    workspace=document.createElement("section");workspace.id="v864HomeWorkspace";workspace.className="v864-home-workspace";
    workspace.innerHTML='<main class="v864-home-main" id="v864HomeMain"></main><aside class="v864-home-sidebar" id="v864HomeSidebar"></aside>';
    if(recommended&&recommended.nextSibling)home.insertBefore(workspace,recommended.nextSibling);else home.appendChild(workspace);
  }
  return workspace;
}
function moveAdvancedSections(main){
  ["v85PersonalDashboard","v86PremiumLearning"].forEach(function(id){var node=document.getElementById(id);if(node&&node.parentNode!==main)main.appendChild(node)});
}
function applyHomeMode(){
  var active=homeVisible();document.documentElement.classList.toggle("v864-home-mode",active);
  var rail=document.getElementById("studyRail");if(rail)rail.setAttribute("aria-hidden",active?"true":"false");
}
function render(){
  applyHomeMode();
  if(!homeVisible())return false;
  var home=document.getElementById("homeHub"),overview=home&&home.querySelector(".home-overview-grid"),recommended=home&&home.querySelector(".home-recommended");
  if(!home||!overview||!recommended)return false;
  removeOldDashboard();
  if(overview.nextElementSibling!==recommended)home.insertBefore(recommended,overview.nextSibling);
  var streak=streakData(),mount=ensureTopStreak(home,overview),workspace=ensureWorkspace(home,recommended),main=document.getElementById("v864HomeMain"),sidebar=document.getElementById("v864HomeSidebar");
  mount.innerHTML=streakMarkup(streak);
  main.innerHTML=roadmapMarkup(roadmapData());
  sidebar.innerHTML=weeklyMarkup(weeklyData(streak))+continueMarkup(continueData());
  moveAdvancedSections(main);
  return true;
}
function scheduleRender(){root.clearTimeout(renderTimer);renderTimer=root.setTimeout(render,90)}
function bind(){
  document.addEventListener("click",function(event){
    var button=event.target&&event.target.closest&&event.target.closest("button");if(!button)return;
    var action=button.getAttribute("data-v864-action");
    if(action==="start-streak"||action==="continue"||action==="open-hsk")navigate("hsk");
    if(button.hasAttribute("data-v864-level"))navigateHskLevel(Number(button.getAttribute("data-v864-level")));
    if(button.hasAttribute("data-home")||button.hasAttribute("data-area")||button.hasAttribute("data-home-area"))root.setTimeout(scheduleRender,70);
  },true);
  ["vduckie:account-learning-synced","vduckie:hsk-progress-synced","vduckie:learning-change","vduckie:adaptive-change","vduckie:retention-change","vduckie:experience-v86-ready"].forEach(function(name){document.addEventListener(name,scheduleRender)});
}
function css(){if(document.getElementById("v864HomeDashboardCss"))return;var link=document.createElement("link");link.id="v864HomeDashboardCss";link.rel="stylesheet";link.href="./assets/v86/home-dashboard-v86.4.css?v=86.4";document.head.appendChild(link)}
function install(){
  css();bind();
  var tries=0,interval=root.setInterval(function(){tries++;if(render()||tries>55)root.clearInterval(interval)},170);
  if(root.MutationObserver){
    homeObserver=new root.MutationObserver(function(){scheduleRender()});
    var home=document.getElementById("homeHub");if(home)homeObserver.observe(home,{attributes:true,attributeFilter:["class"],childList:true});
  }
}

root.VDuckieHomeDashboardV864={version:VERSION,render:render,lastSevenDays:lastSevenDays,streakCount:streakCount,roadmapData:roadmapData};
if(typeof document==="undefined")return;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})(typeof window!=="undefined"?window:globalThis);
