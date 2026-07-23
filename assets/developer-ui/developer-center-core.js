(function(root,document){
"use strict";
var ns=root.VDuckieDeveloper;if(!ns||ns.devCenterCore)return;
var actions=ns.actions,esc=ns.util.esc;
var tabs=["overview","evolution","animation","learning","speaking","progress","scenario","debug"];
var aliases={achievement:"progress",inventory:"evolution",audio:"animation",responsive:"debug",performance:"debug"};
var debug=[ ["runtime-state","Runtime State"],["renderer-lifecycle","Renderer Lifecycle"],["asset-runtime","Asset Resolver"],["asset-manifest","Manifest"],["animation-queue","Animation Queue"],["event-queue","Event Queue"],["timers","Timers"],["listeners","Listeners"],["raw-json","Raw JSON"] ];
var state={open:false,minimized:false,activeTab:"overview",query:"",historyOpen:false,scroll:Object.create(null)};
var bodyState=null,background=[];
function payload(node){var out={};["value","code","group"].forEach(function(k){var v=node.getAttribute("data-vdev-"+k);if(v!==null)out[k]=v});if(node.value!==undefined&&out.value===undefined)out.value=node.value;return out}
function css(v){return root.CSS&&root.CSS.escape?root.CSS.escape(String(v)):String(v).replace(/(["'\\.#:[\]()=])/g,"\\$1")}
function tabFor(id){return aliases[id]||id||"overview"}
function meta(id){var t=ns.tabs[id]||{icon:"•",label:id};return{icon:t.icon||"•",label:id==="scenario"?"Scenarios":t.label||id}}
function purge(){Array.prototype.forEach.call(document.querySelectorAll("#v93DeveloperPreview,.v93-developer-panel"),function(n){n.remove()})}
function search(q){q=String(q||"").trim().toLowerCase();if(!q)return[];var out=[],seen=Object.create(null);function add(x){var k=x.type+":"+x.id;if(!seen[k]){seen[k]=1;out.push(x)}}tabs.forEach(function(id){var m=meta(id);if((id+" "+m.label).toLowerCase().indexOf(q)>=0)add({type:"tab",id:id,tab:id,label:m.label,hint:"Tab"})});actions.search(q).forEach(function(a){var t=tabFor(a.tab);if(tabs.indexOf(t)>=0)add({type:"action",id:a.id,tab:t,label:a.label,hint:"Action · "+meta(t).label})});(ns.scenarioOrder||[]).forEach(function(id){var s=ns.scenarios&&ns.scenarios[id];if(s&&(id+" "+s.label).toLowerCase().indexOf(q)>=0)add({type:"scenario",id:id,tab:"scenario",label:s.label,hint:"Scenario"})});debug.forEach(function(x){if((x[0]+" "+x[1]).toLowerCase().indexOf(q)>=0)add({type:"debug",id:x[0],tab:"debug",label:x[1],hint:"Debug section"})});return out.slice(0,40)}
function lockBody(){if(bodyState)return;var b=document.body;bodyState={x:root.scrollX||0,y:root.scrollY||0,position:b.style.position,top:b.style.top,left:b.style.left,right:b.style.right,width:b.style.width,overflow:b.style.overflow};b.style.position="fixed";b.style.top=(-bodyState.y)+"px";b.style.left=(-bodyState.x)+"px";b.style.right="0";b.style.width="100%";b.style.overflow="hidden";b.classList.add("dev-center-open")}
function unlockBody(){if(!bodyState)return;var b=document.body,s=bodyState;bodyState=null;b.style.position=s.position;b.style.top=s.top;b.style.left=s.left;b.style.right=s.right;b.style.width=s.width;b.style.overflow=s.overflow;b.classList.remove("dev-center-open");root.scrollTo(s.x,s.y)}
function lockBackground(rootNode,launcher){background=[];Array.prototype.forEach.call(document.body.children,function(n){if(n===rootNode||n===launcher)return;var r={node:n,inert:"inert" in n?!!n.inert:null,aria:n.getAttribute("aria-hidden")};background.push(r);if("inert" in n)n.inert=true;else n.setAttribute("aria-hidden","true")})}
function unlockBackground(){background.forEach(function(r){if(r.inert!==null)r.node.inert=r.inert;else if(r.aria===null)r.node.removeAttribute("aria-hidden");else r.node.setAttribute("aria-hidden",r.aria)});background=[]}
function focusables(dialog){return Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(function(n){return!n.hidden&&n.offsetParent!==null})}
function trap(event,dialog){if(event.key!=="Tab"||!state.open)return;var nodes=focusables(dialog);if(!nodes.length){event.preventDefault();dialog.focus();return}var first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
ns.devCenterCore=Object.freeze({tabs:tabs,state:state,payload:payload,css:css,meta:meta,purge:purge,search:search,lockBody:lockBody,unlockBody:unlockBody,lockBackground:lockBackground,unlockBackground:unlockBackground,trap:trap,esc:esc});
})(window,document);
