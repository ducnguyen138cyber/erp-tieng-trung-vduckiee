/* Mobile drawer owns visibility/focus; the screen router still owns navigation. */
(function(w,d){'use strict';
function init(){
 var toggle=d.getElementById('mobileMenu'),side=d.getElementById('studySidebar'),top=d.querySelector('.top');if(!toggle||!side||!top)return;
 top.insertBefore(toggle,top.firstChild);toggle.innerHTML='<span aria-hidden="true">☰</span>';toggle.setAttribute('aria-label','Mở menu điều hướng');
 var close=d.getElementById('sidebarClose'),back=d.getElementById('sidebarBackdrop'),media=w.matchMedia('(max-width:980px)'),opened=false,previous=null,locked=[];
 // Move the backdrop out of the app's stacking contexts.
 d.body.appendChild(back);
 function sync(){side.inert=media.matches&&!opened;side.setAttribute('aria-label','Menu điều hướng');if(media.matches&&!opened)side.setAttribute('aria-hidden','true');else side.removeAttribute('aria-hidden');}
 function finish(focus){if(!opened){sync();return;}opened=false;d.body.classList.remove('vd-menu-open','sidebar-open');toggle.setAttribute('aria-expanded','false');side.removeAttribute('role');side.removeAttribute('aria-modal');locked.forEach(function(pair){pair[0].inert=pair[1];});locked=[];sync();if(focus!==false&&previous&&previous.isConnected)previous.focus({preventScroll:true});}
 function open(){if(!media.matches||opened)return;opened=true;previous=d.activeElement;d.body.classList.add('vd-menu-open');toggle.setAttribute('aria-expanded','true');side.setAttribute('role','dialog');side.setAttribute('aria-modal','true');
 d.querySelectorAll('.top,.study-center,.study-rail,#mobileLearningDock,.duckie-chat-launch').forEach(function(n){locked.push([n,n.inert]);n.inert=true;});sync();close.focus({preventScroll:true});}
 toggle.onclick=function(e){e.preventDefault();e.stopPropagation();opened?finish():open();};close.onclick=function(){finish();};back.onclick=function(){finish();};
 d.addEventListener('keydown',function(e){if(!opened)return;if(e.key==='Escape'){e.preventDefault();finish();return;}if(e.key!=='Tab')return;
 var nodes=Array.from(side.querySelectorAll('button:not([disabled]),a[href]')).filter(function(n){return n.getClientRects().length&&w.getComputedStyle(n).visibility!=='hidden';});var first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&d.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first.focus();}});
 media.addEventListener('change',function(){finish(false);sync();});w.addEventListener('popstate',function(){finish(false);});
 w.VDuckieMobileMenu={open:open,close:finish};sync();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
