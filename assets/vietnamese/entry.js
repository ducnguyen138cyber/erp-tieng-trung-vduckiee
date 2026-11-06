/* Tiny entry only. Curriculum, audio and learning runtime load on first visit. */
(function(root,document){'use strict';
var promise=null,active=false,host;
function mount(){if(!document.getElementById('vi-route-isolation')){var style=document.createElement('style');style.id='vi-route-isolation';style.textContent='body[data-screen-route="vietnamese"] #appShell .study-center>:not(#vietnameseScreen){display:none!important}body[data-screen-route="vietnamese"] .study-rail{display:none!important}';document.head.appendChild(style);}host=document.getElementById('vietnameseScreen');if(!host){host=document.createElement('section');host.id='vietnameseScreen';host.className='vi-screen hidden';host.lang='zh-CN';host.setAttribute('translate','no');host.setAttribute('aria-label','学越南语');document.querySelector('.study-center').appendChild(host);}return host;}
function script(path){return new Promise(function(resolve,reject){var tag=document.createElement('script');tag.src=path;tag.onload=resolve;tag.onerror=function(){tag.remove();reject(Error('无法加载学习工具。请检查网络后重试。'));};document.head.appendChild(tag);});}
function load(){if(promise)return promise;promise=(async function(){
 await Promise.all([new Promise(function(resolve,reject){var css=document.createElement('link');css.rel='stylesheet';css.href='./assets/vietnamese/course.css?v=1';css.onload=resolve;css.onerror=function(){css.remove();reject(Error('无法加载课程样式。'));};document.head.appendChild(css);}),script('./assets/vietnamese/progress.js?v=1'),script('./assets/vietnamese/audio.js?v=1')]);
 await script('./assets/vietnamese/course.js?v=1');
})().catch(function(error){promise=null;throw error;});return promise;}
function open(){active=true;mount().classList.remove('hidden');document.title='学越南语 — VDuckie';
 if(root.VDuckieVICourse){root.VDuckieVICourse.open();return;}
 host.innerHTML='<p role="status">正在打开越南语课程…</p>';
 load().then(function(){if(active)root.VDuckieVICourse.open();}).catch(function(error){if(!active)return;host.innerHTML='<h1>暂时无法打开课程</h1><p role="status"></p><button type="button">重新加载</button>';host.querySelector('p').textContent=error.message;host.querySelector('button').onclick=open;});
}
root.VDuckieVietnamese={open:open,leave:function(){active=false;if(root.VDuckieVICourse)root.VDuckieVICourse.leave();},isActive:function(){return active;}};
})(window,document);
