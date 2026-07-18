(function(root){
"use strict";

var VERSION="86.2";
var ACTIVITY_KEY="vduckie-study-activity-v1";
var STREAK_KEY="vduckie-streak-v84";
var SRS_KEY="vduckie-review-srs-v1";
var RESULT_KEY="vduckie-exercise-results-v1";
var HSK_PROGRESS_KEY="erp-hsk-progress-v2";
var HSK_STATE_KEY="erp-hsk-state-v2";
var renderTimer=0;
var observer=null;

function text(value){return String(value==null?"":value).trim()}
function esc(value){return text(value).replace(/[&<>"']/g,function(character){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]})}
function read(key,fallback){try{var raw=root.localStorage.getItem(key);if(raw===null)return fallback;var parsed=JSON.parse(raw);return parsed&&typeof parsed==="object"?parsed:fallback}catch(error){return fallback}}
function write(key,value){try{root.localStorage.setItem(key,JSON.stringify(value))}catch(error){}}
function dateKey(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0")}
function dayLabel(date){return["CN","T2","T3","T4","T5","T6","T7"][date.getDay()]}
function completedCount(value){var total=0;value=value&&typeof value==="object"?value:{};Object.keys(value).forEach(function(key){if(value[key])total++});return total}
function navigate(area){var button=document.querySelector('[data-area="'+area+'"]');if(button)button.click();else if(root.ERPAreaNavigation&&typeof root.ERPAreaNavigation.select==="function")root.ERPAreaNavigation.select(area)}
function navigateHskLevel(level){navigate("hsk");setTimeout(function(){var button=document.querySelector('#hskLevels [data-hsk-level="'+level+'"]');if(button)button.click()},180)}

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
  write(STREAK_KEY,{version:2,days:days,current:current,longest:longest,updatedAt:Date.now()});
  return{activity:activity,days:days,current:current,longest:longest,todayDone:todayDone};
}
function weeklyData(streak){
  var srs=read(SRS_KEY,{words:{}}),results=read(RESULT_KEY,{items:{}}),daysStudied=streak.days.filter(function(day){return day.done}).length,reviews=weeklyReviewCount(srs),tests=weeklyTestCount(results);
  return{
    missions:[
      {icon:"📖",title:"Học đủ 5 ngày",value:daysStudied,target:5},
      {icon:"↻",title:"Ôn 10 từ vựng",value:reviews,target:10},
      {icon:"✓",title:"Làm 1 bài kiểm tra",value:tests,target:1}
    ]
  };
}
function continueData(){
  var state=read(HSK_STATE_KEY,{level:0,lesson:0}),level=Number(state.level||0),lessonIndex=Number(state.lesson||0),curriculum=root.HSKCurriculum,item=curriculum&&curriculum.levels&&curriculum.levels[level]&&curriculum.levels[level][lessonIndex],done=completedCount(read(HSK_PROGRESS_KEY,{}));
  return{
    level:level,
    title:item&&item.title?item.title:(level===0?"Bắt đầu phần Nền tảng":"Tiếp tục lộ trình HSK"),
    subtitle:item&&item.goal?item.goal:"Quay lại đúng bài gần nhất đã học.",
    done:done
  };
}
function levelProgress(level){
  var curriculum=root.HSKCurriculum,lessons=curriculum&&curriculum.levels&&curriculum.levels[level]||[],completed=read(HSK_PROGRESS_KEY,{}),done=0;
  lessons.forEach(function(item){if(item&&completed[item.id])done++});
  return{done:done,total:lessons.length,percent:lessons.length?Math.round(done/lessons.length*100):0};
}
function roadmapData(){
  var state=read(HSK_STATE_KEY,{level:0}),current=Number(state.level||0),stages=[
    {level:0,label:"Nền tảng",icon:"基",active:true},
    {level:1,label:"HSK 1",icon:"一",active:true},
    {level:2,label:"HSK 2",icon:"二",active:true},
    {level:3,label:"HSK 3",icon:"三",active:true},
    {level:4,label:"HSK 4",icon:"四",active:true},
    {level:5,label:"HSK 5–6",icon:"五",active:false},
    {level:7,label:"HSK 7–9",icon:"九",active:false}
  ];
  return stages.map(function(stage){var progress=stage.active?levelProgress(stage.level):{done:0,total:0,percent:0};stage.current=stage.level===current;stage.progress=progress;return stage});
}

function streakMarkup(data){
  var days=data.days.map(function(day){return'<div class="v862-streak-day '+(day.done?"done ":"")+(day.today?"today":"")+'"><span>'+day.label+'</span><i>'+(day.done?"🔥":"")+'</i><small>'+day.date+'</small></div>'}).join("");
  var cta=data.current===0?"BẮT ĐẦU CHUỖI CỦA BẠN":data.todayDone?"TIẾP TỤC GIỮ LỬA":"GIỮ CHUỖI HÔM NAY";
  return'<article class="v862-side-card v862-streak-card"><div class="v862-card-heading"><span class="v862-heading-icon">♨</span><h3>Chuỗi ngày học</h3></div><div class="v862-streak-summary"><span class="v862-fire-orb">🔥</span><div><strong>'+data.current+'</strong><b> ngày liên tiếp</b><p>Học mỗi ngày để giữ chuỗi streak và ghi nhớ lâu hơn.</p></div></div><div class="v862-streak-days">'+days+'</div><button class="v862-red-cta" data-v862-action="start-streak">🔥 '+cta+'</button></article>';
}
function weeklyMarkup(data){
  var missions=data.missions.map(function(mission){var percent=Math.min(100,Math.round(mission.value/mission.target*100));return'<div class="v862-mission"><span class="v862-mission-icon">'+mission.icon+'</span><div><div class="v862-mission-top"><strong>'+mission.title+'</strong><b>'+Math.min(mission.value,mission.target)+'/'+mission.target+'</b></div><div class="v862-mission-track"><i style="width:'+percent+'%"></i></div></div></div>'}).join("");
  return'<article class="v862-side-card v862-weekly-card"><div class="v862-card-heading"><span class="v862-heading-icon">🎁</span><h3>Nhiệm vụ tuần</h3></div><div class="v862-mission-list">'+missions+'</div><p class="v862-weekly-note">Hoàn thành cả ba để nhận huy hiệu <strong>Vịt bền bỉ</strong>.</p></article>';
}
function continueMarkup(data){
  return'<article class="v862-side-card v862-continue-card"><span class="v862-kicker">TIẾP TỤC HỌC</span><h3>'+esc(data.title)+'</h3><p>'+esc(data.subtitle)+'</p><div class="v862-continue-meta"><span>'+data.done+' bài đã hoàn thành</span><span>HSK '+(data.level||"Nền tảng")+'</span></div><button data-v862-action="continue">Học tiếp →</button></article>';
}
function roadmapMarkup(stages){
  var cards=stages.map(function(stage){var detail=stage.active?(stage.progress.total?stage.progress.done+"/"+stage.progress.total+" bài":"Sẵn sàng học"):"Sắp mở";return'<button class="v862-road-stage '+(stage.current?"current ":"")+(stage.active?"":"locked")+'" data-v862-level="'+stage.level+'" '+(stage.active?"":"disabled")+'><span class="v862-road-icon">'+stage.icon+'</span><strong>'+stage.label+'</strong><small>'+detail+'</small><div class="v862-road-track"><i style="width:'+stage.progress.percent+'%"></i></div></button>'}).join("");
  return'<section class="v862-roadmap" id="v862HomeRoadmap"><div class="v862-roadmap-head"><div><span class="v862-kicker">LỘ TRÌNH ĐẾN KHI THÀNH THẠO</span><h2>Đi từng chặng, nhìn rõ tiến độ</h2></div><button data-v862-action="open-hsk">Xem toàn bộ lộ trình →</button></div><div class="v862-road-scroll">'+cards+'</div></section>';
}

function ensureLayout(){
  var home=document.getElementById("homeHub");
  if(!home)return null;
  var old83=document.getElementById("v83LearningCockpit"),old84=document.getElementById("v84RetentionCenter");
  if(old83)old83.remove();
  if(old84)old84.remove();
  var overview=home.querySelector(".home-overview-grid"),recommended=home.querySelector(".home-recommended");
  if(overview&&recommended&&overview.nextElementSibling!==recommended)home.insertBefore(recommended,overview.nextSibling);
  var workspace=document.getElementById("v862HomeWorkspace");
  if(!workspace){
    workspace=document.createElement("section");
    workspace.id="v862HomeWorkspace";
    workspace.className="v862-home-workspace";
    workspace.innerHTML='<main class="v862-home-main" id="v862HomeMain"></main><aside class="v862-home-sidebar" id="v862HomeSidebar"></aside>';
    if(recommended&&recommended.nextSibling)home.insertBefore(workspace,recommended.nextSibling);else home.appendChild(workspace);
  }
  return workspace;
}
function moveAdvancedSections(){
  var main=document.getElementById("v862HomeMain"),road=document.getElementById("v862HomeRoadmap");
  if(!main)return;
  ["v85PersonalDashboard","v86PremiumLearning"].forEach(function(id){var node=document.getElementById(id);if(node&&node.parentNode!==main)main.appendChild(node)});
  if(road&&main.firstElementChild!==road)main.insertBefore(road,main.firstChild);
}
function render(){
  var workspace=ensureLayout();
  if(!workspace)return false;
  var main=document.getElementById("v862HomeMain"),sidebar=document.getElementById("v862HomeSidebar"),streak=streakData(),weekly=weeklyData(streak),cont=continueData();
  var oldRoad=document.getElementById("v862HomeRoadmap");
  if(oldRoad)oldRoad.remove();
  var roadWrap=document.createElement("div");roadWrap.innerHTML=roadmapMarkup(roadmapData());main.insertBefore(roadWrap.firstChild,main.firstChild);
  sidebar.innerHTML=streakMarkup(streak)+weeklyMarkup(weekly)+continueMarkup(cont);
  moveAdvancedSections();
  return true;
}
function scheduleRender(){root.clearTimeout(renderTimer);renderTimer=root.setTimeout(render,80)}
function bind(){
  document.addEventListener("click",function(event){
    var button=event.target.closest&&event.target.closest("button");if(!button)return;
    var action=button.getAttribute("data-v862-action");
    if(action==="start-streak"||action==="continue"||action==="open-hsk")navigate("hsk");
    if(button.hasAttribute("data-v862-level"))navigateHskLevel(Number(button.getAttribute("data-v862-level")));
  });
  ["vduckie:account-learning-synced","vduckie:hsk-progress-synced","vduckie:learning-change","vduckie:adaptive-change","vduckie:retention-change"].forEach(function(name){document.addEventListener(name,scheduleRender)});
}
function css(){if(document.getElementById("v862HomeDashboardCss"))return;var link=document.createElement("link");link.id="v862HomeDashboardCss";link.rel="stylesheet";link.href="./assets/v86/home-dashboard-v86.2.css?v=86.2";document.head.appendChild(link)}
function install(){
  css();bind();
  var tries=0,interval=root.setInterval(function(){tries++;if(render()||tries>50)root.clearInterval(interval)},160);
  if(root.MutationObserver){observer=new root.MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){if(mutations[i].type==="childList"){scheduleRender();break}}});var home=document.getElementById("homeHub");if(home)observer.observe(home,{childList:true})}
}
root.VDuckieHomeDashboardV862={version:VERSION,render:render,lastSevenDays:lastSevenDays,streakCount:streakCount,roadmapData:roadmapData};
if(typeof document==="undefined")return;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})(typeof window!=="undefined"?window:globalThis);
